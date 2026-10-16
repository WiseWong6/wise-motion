"""Builds the three audio stems for the 79.6s film from the scene timings.

Every cue time below is derived from the same constants the compositions use, so
picture and sound stay locked when either side changes.

    python3 tools/make_audio.py
writes assets/audio/world-bgm.wav, world-sfx.wav and world-chorus.wav.
"""

import math
import os
import subprocess
import tempfile

import numpy as np

SR = 48000
DUR = 79.6
N = int(SR * DUR)
FF = "/opt/homebrew/bin/ffmpeg"
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "assets", "audio")
BGM_SRC = os.path.join(ROOT, "..", "what-love-means", "assets", "audio", "monologue-bgm.wav")
RUMBLE_SRC = os.path.join(ROOT, ".media", "audio", "sfx", "sfx_001.mp3")
rng = np.random.default_rng(20261015)


def prand(n):
    x = math.sin(n * 127.1 + 311.7) * 43758.5453
    return x - math.floor(x)


def load(path, sr=SR):
    raw = subprocess.run([FF, "-v", "quiet", "-i", path, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def load_stereo(path, sr=SR):
    raw = subprocess.run([FF, "-v", "quiet", "-i", path, "-ac", "2", "-ar", str(sr), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64).reshape(-1, 2)


def save(path, buf):
    buf = np.clip(buf, -1, 1).astype(np.float32)
    with tempfile.NamedTemporaryFile(suffix=".f32", delete=False) as f:
        f.write(buf.tobytes())
        tmp = f.name
    subprocess.run([FF, "-v", "quiet", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", tmp, "-c:a", "pcm_s16le", path], check=True)
    os.unlink(tmp)


def db(x):
    return 10 ** (x / 20)


def bandpass(x, lo=None, hi=None, soft=0.25):
    """Zero-phase FFT band-pass with raised-cosine shoulders."""
    n = len(x)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    g = np.ones_like(f)
    if lo:
        a, b = lo * (1 - soft), lo * (1 + soft)
        g *= np.clip((f - a) / (b - a), 0, 1)
    if hi:
        a, b = hi * (1 - soft), hi * (1 + soft)
        g *= 1 - np.clip((f - a) / (b - a), 0, 1)
    g = 0.5 - 0.5 * np.cos(np.pi * g)
    return np.fft.irfft(X * g, n)


def onepole(x, fc):
    """One-pole low-pass with a per-sample cutoff (array or scalar)."""
    fc = np.broadcast_to(np.asarray(fc, dtype=np.float64), x.shape)
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    s = 0.0
    for i in range(len(x)):
        s = (1 - a[i]) * x[i] + a[i] * s
        y[i] = s
    return y


def env(n, attack, decay, hold=0.0, curve=1.0):
    t = np.arange(n) / SR
    e = np.where(t < attack, (t / max(attack, 1e-6)) ** curve, np.exp(-np.maximum(t - attack - hold, 0) / max(decay, 1e-6)))
    return e


def tone(freq, dur, phase=0.0):
    """freq may be a scalar or an array (glide)."""
    n = int(dur * SR)
    f = np.broadcast_to(np.asarray(freq, dtype=np.float64), (n,))
    return np.sin(2 * np.pi * np.cumsum(f) / SR + phase)


# Harmonic partials only: a church-bell minor-sixth partial rubs against whatever key the music is in.
def bell(f0, dur, partials=((1, 1, 1), (1.0015, 0.25, 0.9), (2.0, 0.42, 0.55), (3.0, 0.2, 0.4), (4.0, 0.12, 0.3), (5.04, 0.06, 0.2))):
    n = int(dur * SR)
    out = np.zeros(n)
    for ratio, amp, dec in partials:
        out += amp * tone(f0 * ratio, dur) * env(n, 0.004, dur * dec * 0.5)
    return out / sum(p[1] for p in partials)


def place(bus, sig, t, gain=1.0, pan=0.0, norm=True):
    """gain is the cue's peak level (sig is normalised first unless norm=False)."""
    if norm:
        sig = sig / (np.max(np.abs(sig)) + 1e-12)
    i0 = int(round(t * SR))
    if sig.ndim == 1:
        l, r = math.cos((pan + 1) * math.pi / 4), math.sin((pan + 1) * math.pi / 4)
        sig = np.stack([sig * l * math.sqrt(2), sig * r * math.sqrt(2)], 1)
    i1 = min(len(bus), i0 + len(sig))
    if i1 <= i0 or i0 < 0:
        return
    bus[i0:i1] += sig[: i1 - i0] * gain


def reverb(bus, seconds=2.8, wet=0.35, seed=3):
    r = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    decay = np.exp(-6.9 * t / seconds)
    ir = np.stack([bandpass(r.standard_normal(n), 120, 7000) * decay, bandpass(r.standard_normal(n), 120, 7000) * decay], 1)
    ir[: int(0.018 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2, 0, keepdims=True))
    out = np.zeros_like(bus)
    m = 1 << int(math.ceil(math.log2(len(bus) + n)))
    for c in range(2):
        y = np.fft.irfft(np.fft.rfft(bus[:, c], m) * np.fft.rfft(ir[:, c], m), m)[: len(bus)]
        out[:, c] = bus[:, c] + wet * y
    return out


# ---------- Music: one cut, so the music's sections land on the picture's ----------
# Source 0-41.20 ends on a held D chord; from 44.58 the music resolves deceptively to E♭ on S3's one point (film 41.60),
# its D♭ section starts on S4's release (45.03), its breath carries the weave (54-57.9), its C major downbeat opens S5 (57.92).
CUT_AT, CUT_OFF, XF = 41.20, 3.38, 0.25
bgm_src = load_stereo(BGM_SRC)
mono = bgm_src.mean(1)
xf = int(XF * SR)
i0 = int(CUT_AT * SR) - xf // 2
ref = mono[i0 : i0 + xf]
off = int(CUT_OFF * SR)
best = -2.0
for d in range(-int(0.012 * SR), int(0.012 * SR) + 1, 4):
    cand = mono[i0 + int(CUT_OFF * SR) + d : i0 + int(CUT_OFF * SR) + d + xf]
    c = np.dot(ref, cand) / (np.linalg.norm(ref) * np.linalg.norm(cand) + 1e-9)
    if c > best:
        best, off = c, int(CUT_OFF * SR) + d
bgm = np.zeros((N, 2))
bgm[:i0] = bgm_src[:i0]
tail = bgm_src[i0 + off : i0 + off + N - i0]
bgm[i0 : i0 + len(tail)] = tail
u = np.linspace(0, 1, xf)[:, None]
bgm[i0 : i0 + xf] = bgm_src[i0 : i0 + xf] * np.cos(u * np.pi / 2) + tail[:xf] * np.sin(u * np.pi / 2)
LEVEL = [(0.0, -9), (3.0, -9), (4.2, -4), (30.15, -4), (30.3, -8), (31.6, -4), (79.2, -4), (79.6, -60)]
g = db(np.interp(np.arange(N) / SR, [k[0] for k in LEVEL], [k[1] for k in LEVEL]))
bgm *= g[:, None]
bgm_mono = bgm.mean(1)


def notes_at(t, scale, dur=0.3, floor=0.1):
    """Pitch classes of `scale` the edited music actually sounds just after film time t, strongest first."""
    a = int(t * SR)
    x = bgm_mono[a : a + int(dur * SR)]
    x = x * np.hanning(len(x))
    X = np.abs(np.fft.rfft(x, 1 << 15)) ** 2
    f = np.fft.rfftfreq(1 << 15, 1 / SR)
    m = (f > 120) & (f < 2500)
    pc = np.round(12 * np.log2(f[m] / 261.63)).astype(int) % 12
    ch = np.bincount(pc, weights=X[m], minlength=12)
    ranked = sorted(scale, key=lambda p: -ch[p])
    return [p for p in ranked if ch[p] >= floor * ch[ranked[0]]] or ranked[:1]


def pair_at(t, scale):
    """The strongest note and a second one to ring with it (its fifth when the music offers none)."""
    ns = notes_at(t, scale)
    return ns[0], ns[1] if len(ns) > 1 else (ns[0] + 7) % 12


def pitch(pc, octave):
    """Frequency of pitch class pc (0 = C) in the octave whose C is C{octave}."""
    return 261.63 * 2 ** (pc / 12 + octave - 4)


sfx = np.zeros((N, 2))
wetbus = np.zeros((N, 2))  # sends that should bloom in the reverb
chorus = np.zeros((N, 2))
DB_PENTA = [1, 3, 5, 8, 10]  # D♭ E♭ F A♭ B♭: the music's pedal section
C_PENTA = [0, 2, 4, 7, 9]  # C D E G A: its last section


# ---------- S1 rain (0-9): the rain is literally played at the picture's frozen clock ----------
A, B, R, RR = 3.2, 3.8, 8.1, 0.45
tauB = A + (B - A) / 3


def tau(t):
    if t <= A:
        return t
    if t <= B:
        return A + (B - A) * (1 - (1 - (t - A) / (B - A)) ** 3) / 3
    if t <= R:
        return tauB
    if t <= R + RR:
        return tauB + RR * ((t - R) / RR) ** 3 / 3
    return tauB + RR / 3 + (t - R - RR)


rain_len = 6.0
rn = int(rain_len * SR)
src = np.zeros((rn, 2))
for c in range(2):
    hiss = bandpass(rng.standard_normal(rn), 500, 6500)
    hiss *= 1 + 0.25 * np.sin(2 * np.pi * np.arange(rn) / SR * (0.7 + 0.3 * c))
    src[:, c] = hiss * 0.05
for _ in range(9000):
    t0 = rng.uniform(0, rain_len - 0.02)
    f = rng.uniform(1800, 7000)
    d = rng.uniform(0.002, 0.007)
    n = int(d * SR) + 1
    drop = np.sin(2 * np.pi * f * np.arange(n) / SR) * np.exp(-np.arange(n) / (d * SR / 4))
    pan = rng.uniform(-0.9, 0.9)
    i0 = int(t0 * SR)
    g = rng.uniform(0.01, 0.06)
    src[i0 : i0 + n, 0] += drop * g * (1 - pan) / 2
    src[i0 : i0 + n, 1] += drop * g * (1 + pan) / 2
tt = np.arange(int(9.8 * SR)) / SR
pos = np.array([tau(x) for x in tt]) * SR
rain = np.stack([np.interp(pos, np.arange(rn), src[:, c]) for c in range(2)], 1)
for c in range(2):
    rain[:, c] -= onepole(rain[:, c], 25.0)  # the frozen clock leaves DC; block it
gate = np.clip(np.minimum(tt / 0.6, 1), 0, 1) * np.clip((9.6 - tt) / 1.0, 0, 1)
rain *= gate[:, None]
rain *= db(-11) / np.max(np.abs(rain))
sfx[: len(rain)] += rain

# Suspended drops ring like glass while time is stopped, on the music's B♭ D F G.
for i, f in enumerate([2349.32, 2793.83, 3135.96, 3729.31]):
    n = int(5.2 * SR)
    t = np.arange(n) / SR
    e = np.clip(t / 0.6, 0, 1) * np.clip((5.2 - t) / 0.6, 0, 1) * (0.6 + 0.4 * np.sin(2 * np.pi * (0.3 + 0.13 * i) * t))
    place(wetbus, tone(f, 5.2) * e, 3.3, db(-40), pan=(-0.6, 0.4, -0.2, 0.7)[i])
for i, th in enumerate([4.4, 5.0, 5.6, 6.15, 6.7, 7.2]):
    place(wetbus, bell((1864.66, 2349.32, 2793.83, 3135.96, 2793.83, 3729.31)[i], 2.4), th, db(-30), pan=(-0.5, 0.5, -0.3, 0.3, -0.6, 0.6)[i])

# ---------- S2 (9-33): the oath happens to the world ----------
S2 = 9.0


def rumble(dur, lo=25, hi=150):
    n = int(dur * SR)
    return bandpass(rng.standard_normal(n), lo, hi)


# 山无陵: the mountains are planed flat.
n = int(3.2 * SR)
place(sfx, rumble(3.2) * env(n, 0.18, 0.9, hold=0.4) * 3.0, S2 + 12.05, db(-12))
# 江水为竭: the river boils off.
n = int(2.6 * SR)
place(wetbus, bandpass(rng.standard_normal(n), 2500, 9000) * env(n, 0.45, 0.8, hold=0.2), S2 + 14.2, db(-26), pan=0.2)
# 冬雷震震: two dark cracks, then the roll, its body on the music's B♭.
for t0, gn in [(16.4, -10), (16.75, -16)]:
    n = int(1.2 * SR)
    crack = bandpass(rng.standard_normal(n), 60, 3000) * env(n, 0.003, 0.18)
    crack *= 1 + 1.5 * (rng.random(n) < 0.004)
    sub = tone(np.geomspace(58.27, 29.14, n), 1.2) * env(n, 0.004, 0.35)
    place(sfx, crack * 1.4 + sub * 0.9, S2 + t0, db(gn))
roll = load(RUMBLE_SRC)[int(1.4 * SR) : int(7.4 * SR)]
roll *= np.clip(np.arange(len(roll)) / (0.25 * SR), 0, 1) * np.clip((len(roll) - np.arange(len(roll))) / (1.6 * SR), 0, 1)
place(sfx, bandpass(roll, 30, 2500), S2 + 16.55, db(-14))
# 夏雨雪: snow arrives with a few high glints.
for i in range(11):
    place(wetbus, bell((2489.02, 2793.83, 3135.96, 3729.31, 4978.03)[i % 5], 2.6), S2 + 18.4 + i * 0.17 + prand(i * 3.1) * 0.12, db(-31), pan=prand(i * 7.7) * 1.6 - 0.8)
# 天地合: heaven and earth close, then slam (an octave of the music's B♭ falling under it).
n = int(0.8 * SR)
swell = bandpass(rng.standard_normal(n), 200, 3000) * np.linspace(0, 1, n) ** 2.5
place(sfx, swell * 1.6, S2 + 20.45, db(-14))
n = int(3.0 * SR)
boom = tone(np.geomspace(58.27, 29.14, n), 3.0) * env(n, 0.003, 0.9)
thud = bandpass(rng.standard_normal(n), 40, 1800) * env(n, 0.002, 0.12)
place(sfx, boom * 1.1 + thud * 0.9, S2 + 21.25, db(-7))
place(wetbus, thud, S2 + 21.25, db(-14))
# 乃敢与君绝: the line draws in to a point, which then glows.
n = int(1.3 * SR)
place(wetbus, tone(np.geomspace(311.13, 622.25, n), 1.3) * np.linspace(0, 1, n) ** 2 * np.clip((1.3 - np.arange(n) / SR) / 0.15, 0, 1), S2 + 22.0, db(-28))
n = int(3.2 * SR)
place(wetbus, (tone(622.25, 3.2) + 0.4 * tone(932.33, 3.2)) * env(n, 0.05, 1.1), S2 + 23.2, db(-32))
# The seal.
n = int(0.4 * SR)
place(sfx, bandpass(rng.standard_normal(n), 60, 1400) * env(n, 0.002, 0.03) + 0.6 * tone(155.56, 0.4) * env(n, 0.002, 0.05), S2 + 22.95, db(-12))


def heartbeat(t, g):
    n = int(0.5 * SR)
    lub = tone(np.geomspace(64, 46, n), 0.5) * env(n, 0.006, 0.07) + 0.25 * bandpass(rng.standard_normal(n), 40, 600) * env(n, 0.002, 0.02)
    place(sfx, lub, t, db(g))
    place(sfx, tone(np.geomspace(74, 52, n), 0.5) * env(n, 0.006, 0.06), t + 0.24, db(g - 4))


# The point's pulse, carried over from S2's breathing glow.
heartbeat(S2 + 23.5, -18)

# ---------- S3 (33-45): every language at once, then one point ----------
S3 = 33.0
T_BURST, T_ONE = 0.75, 8.6
n = int(2.5 * SR)
# The burst lands on the music's F minor 7.
bloom = bandpass(rng.standard_normal(n), 250, 3500) * env(n, 0.012, 0.5) + 0.8 * tone(np.geomspace(87.31, 65.41, n), 2.5) * env(n, 0.005, 0.4)
place(sfx, bloom, S3 + T_BURST, db(-12))
place(wetbus, bell(523.25, 3.0), S3 + T_BURST, db(-22))
# Pulled inward: a riser that stops dead on the point (it also covers the music's cut at 41.2).
n = int(2.0 * SR)
x = rng.standard_normal(n)
fc = np.geomspace(500, 6000, n)
riser = onepole(x, fc) - onepole(x, fc * 0.35)
riser *= np.geomspace(db(-40), 1, n) * np.clip((n - np.arange(n)) / (0.004 * SR), 0, 1)
place(sfx, riser, S3 + T_ONE - 2.0, db(-10))
# The point: B♭ falling to E♭ underneath, an E♭ major chord ringing over the music's E♭.
n = int(5.0 * SR)
place(sfx, tone(np.geomspace(58.27, 38.89, n), 5.0) * env(n, 0.003, 1.4), S3 + T_ONE, db(-6))
place(wetbus, bell(311.13, 6.0) * 0.9 + bell(466.16, 6.0) * 0.6 + bell(783.99, 6.0) * 0.35, S3 + T_ONE, db(-15))

# The chorus: each voice says love in its own language (tools/make_chorus_voices.py), then they are pulled into one point.
CHORUS_DIR = os.path.join(ROOT, ".media", "audio", "chorus")
clips = []
for name in sorted(os.listdir(CHORUS_DIR)) if os.path.isdir(CHORUS_DIR) else []:
    if not name.endswith(".aiff"):
        continue
    path = os.path.join(CHORUS_DIR, name)
    if not name.startswith("v") or os.path.getsize(path) <= 8192:
        continue
    v = load(path)
    nz = np.nonzero(np.abs(v) > 0.003)[0]
    if len(nz) == 0:
        continue
    v = v[nz[0] : nz[-1] + 1]
    v /= np.max(np.abs(v)) + 1e-9
    breath = bandpass(rng.standard_normal(len(v)), 1200, 7000) * np.convolve(np.abs(v), np.ones(240) / 240, "same") * 2.5
    clips.append(0.62 * bandpass(v, 160, 9000) + 0.38 * breath)
cn = len(clips)
for i, c in enumerate(clips):
    u = i / max(1, cn - 1)
    t = 0.95 + 6.5 * u ** 0.75 + (prand(i * 2.3) - 0.5) * 0.35
    place(chorus, c, S3 + t, db(-22 + 5 * u + (prand(i * 5.9) - 0.5) * 4), pan=prand(i * 3.3) * 1.7 - 0.85)
    if u > 0.55:
        place(chorus, c, S3 + T_ONE - 0.25 - 1.6 * prand(i * 8.1) ** 1.5, db(-19), pan=prand(i * 4.4) * 1.6 - 0.8)
chorus = reverb(chorus, 3.2, 0.55, seed=5)
cut = int((S3 + T_ONE) * SR)
fade = int(0.006 * SR)
chorus[cut - fade : cut] *= np.linspace(1, 0, fade)[:, None]
chorus[cut:] = 0

# ---------- S4 (45-57.9): the point lets go and lights the lamps of everyday care ----------
# Mirrors compositions/s4-care.html and the lamp lists in assets/weave.js (9 near, 18 mid, 24 far).
S4 = 45.0
T_REL, BEAT, B1, HERO_BORN, T_WEAVE, D4 = 0.03, 0.858, 0.89, 5.18, 9.0, 12.9
rel = pair_at(S4 + T_REL, DB_PENTA)
place(wetbus, bell(pitch(rel[0], 5), 4.0) * 0.8 + bell(pitch(rel[1], 5), 4.0) * 0.45, S4 + T_REL, db(-20))
n = int(1.4 * SR)
place(sfx, bandpass(rng.standard_normal(n), 300, 5000) * env(n, 0.01, 0.35), S4 + T_REL, db(-26))
# Each near lamp doubles a note the music is playing on its beat; the sixth beat is 吃饭了吗's, born from the point.
for k in range(8):
    ti = B1 + BEAT * (k if k < 5 else k + 1)
    ns = notes_at(S4 + ti, DB_PENTA)
    pc = ns[int(prand(k * 4.7 + 1) * len(ns) * 0.999)]
    place(wetbus, bell(pitch(pc, 5), 3.0), S4 + ti, db(-22), pan=prand(k * 6.1) * 1.2 - 0.6)
hero = pair_at(S4 + HERO_BORN, DB_PENTA)
place(wetbus, bell(pitch(hero[0], 4), 5.0) * 0.8 + bell(pitch(hero[1], 4), 5.0) * 0.5, S4 + HERO_BORN, db(-18))
for k in range(18):
    ti = T_REL + BEAT / 2 * (1 + math.floor(prand(k * 3.3 + 1) * 12))
    ns = notes_at(S4 + ti, DB_PENTA)
    pc = ns[int(prand(k * 5.3) * len(ns) * 0.999)]
    place(wetbus, bell(pitch(pc, 6), 2.0), S4 + ti, db(-34), pan=prand(k * 2.6) * 1.4 - 0.7)
# The music breathes while the lamps give their words to 愛: air, and words landing like the faintest bells.
n = int(3.9 * SR)
x = rng.standard_normal(n)
fc = np.geomspace(1500, 5000, n)
air = (onepole(x, fc) - onepole(x, fc * 0.4)) * np.sin(np.pi * np.arange(n) / n) ** 1.2
place(wetbus, air, S4 + T_WEAVE, db(-28))
# The breath still holds D♭ and F (with an E natural leaning toward C), so the landings use only those two.
for i in range(60):
    u = prand(i * 1.7 + 3)
    pc = (1, 5)[int(prand(i * 2.9) * 1.99)]
    place(wetbus, bell(pitch(pc, 6 if prand(i * 4.3) < 0.5 else 7), 1.2), S4 + T_WEAVE + 1.5 + 2.1 * u, db(-40 + 4 * math.sin(math.pi * u)), pan=prand(i * 5.5) * 1.6 - 0.8)
# Reversed C octaves draw into the music's C downbeat, where S5 begins.
n = int(1.6 * SR)
place(wetbus, (bell(523.25, 1.6) + 0.6 * bell(1046.5, 1.6))[::-1] * np.linspace(0, 1, n) ** 1.5, S4 + D4 - 1.6 + 0.02, db(-26))

# ---------- S5 (57.9-70): the heart beats, leaves, and 友 remains ----------
S5 = 57.9
for b in [1.77, 2.71, 3.59, 4.52]:
    heartbeat(S5 + b, -12)
# The heart lifts and scatters like embers: rising air and a few high notes of the music's C E G.
n = int(2.4 * SR)
x = rng.standard_normal(n)
fc = np.geomspace(600, 5000, n)
air = (onepole(x, fc) - onepole(x, fc * 0.5)) * np.sin(np.pi * np.arange(n) / n) ** 1.5
place(wetbus, air, S5 + 5.2, db(-26))
for i in range(14):
    t = 5.5 + 1.8 * prand(i * 3.7 + 1)
    place(wetbus, bell(pitch((0, 4, 7)[int(prand(i * 4.1) * 2.99)], 5 if prand(i * 1.3) < 0.6 else 6), 1.6), S5 + t, db(-34), pan=prand(i * 6.3) * 1.6 - 0.8)
# The 夊's words re-flow into 友: fine grains.
for i in range(700):
    u = prand(i * 1.31 + 7)
    if prand(i * 2.17) > math.sin(math.pi * u):
        continue
    n = int(0.01 * SR)
    place(sfx, bandpass(rng.standard_normal(n), 3000, 9000) * env(n, 0.0003, 0.0015), S5 + 5.5 + 1.9 * u, db(-34), pan=prand(i * 3.9) * 1.6 - 0.8)
# 友 warms into lamplight, on the music's F major.
n = int(4.0 * SR)
pad = sum(tone(f, 4.0) for f in (174.61, 220.0, 261.63, 349.23)) / 4
place(wetbus, pad * env(n, 0.9, 1.2, hold=0.6, curve=2), S5 + 9.4, db(-26))

# ---------- S6 (70-79.6): forgetting, then one message ----------
S6 = 70.0
KEYS, T_CUR = [5.21, 5.64, 6.07, 6.49, 6.92], 3.6
# What I forget goes like sand.
n = int(3.2 * SR)
sand = bandpass(rng.standard_normal(n), 2500, 9000) * np.sin(np.pi * np.arange(n) / n) ** 2 * (1 + 0.6 * (rng.random(n) < 0.01))
place(sfx, sand, S6 + 0.5, db(-34), pan=0.2)
# 友's light gathers into the cursor, which arrives on the music's C and E.
n = int(1.6 * SR)
x = rng.standard_normal(n)
fc = np.geomspace(400, 4000, n)
gather = (onepole(x, fc) - onepole(x, fc * 0.5)) * np.linspace(0, 1, n) ** 2.5 * np.clip((n - np.arange(n)) / (0.01 * SR), 0, 1)
place(wetbus, gather, S6 + T_CUR - 1.6, db(-30))
place(wetbus, bell(1046.5, 3.0) * 0.8 + bell(1318.51, 3.0) * 0.4, S6 + T_CUR, db(-26))
# Each key is a soft pluck on the music's own note, with the faintest tap.
for j, k in enumerate(KEYS):
    n = int(1.2 * SR)
    f = pitch(notes_at(S6 + k, C_PENTA, 0.2)[0], 5)
    pl = (tone(f, 1.2) + 0.35 * tone(f * 2, 1.2) + 0.12 * tone(f * 3, 1.2)) * env(n, 0.002, 0.28)
    tap = bandpass(rng.standard_normal(n), 1500, 6000) * env(n, 0.0005, 0.004)
    place(wetbus, pl, S6 + k, db(-24), pan=(j - 2) * 0.12)
    place(sfx, tap, S6 + k, db(-30), pan=(j - 2) * 0.12)

sfx = reverb(sfx, 1.6, 0.12, seed=9) + reverb(wetbus, 3.4, 0.9, seed=11)


def limiter_gain(mix, thr=db(-2.0), block=240, release=0.12):
    """Per-sample gain that keeps the summed stems under thr (instant attack, one block look-ahead)."""
    nb = -(-len(mix) // block)
    pad = np.zeros((nb * block, 2))
    pad[: len(mix)] = mix
    peaks = np.abs(pad).reshape(nb, block * 2).max(1)
    want = np.minimum(1, thr / np.maximum(peaks, 1e-9))
    want = np.minimum(want, np.concatenate([want[1:], [1]]))
    rel = 1 - math.exp(-block / (release * SR))
    g = np.empty(nb)
    cur = 1.0
    for i in range(nb):
        cur = min(want[i], cur + (1 - cur) * rel)
        g[i] = cur
    return np.interp(np.arange(len(mix)), np.arange(nb) * block, g)


os.makedirs(OUT, exist_ok=True)
mix = bgm + sfx + chorus
peak = np.max(np.abs(mix))
lim = limiter_gain(mix)[:, None]
print(f"music cut: source {CUT_AT:.2f} -> {CUT_AT + off / SR:.4f} (corr {best:.2f})")
print(f"chorus clips: {cn}, raw peak {20 * math.log10(peak):.1f} dBFS, max limiting {20 * math.log10(lim.min()):.1f} dB")
for name, lo, hi in [("rain", 0, 9), ("oath", 9, 33), ("one", 33, 45), ("care", 45, 57.9), ("heart", 57.9, 70), ("end", 70, 79.6)]:
    a, b = int(lo * SR), int(hi * SR)
    seg_ = (mix * lim)[a:b]
    print(f"  {name:6s} rms {20 * math.log10(np.sqrt(np.mean(seg_ ** 2)) + 1e-9):6.1f} dBFS  peak {20 * math.log10(np.max(np.abs(seg_)) + 1e-9):6.1f}")
for name, stem in [("bgm", bgm), ("sfx", sfx), ("chorus", chorus)]:
    print(f"  stem {name:6s} peak {20 * math.log10(np.max(np.abs(stem * lim)) + 1e-9):6.1f} dBFS")
save(os.path.join(OUT, "world-bgm.wav"), bgm * lim)
save(os.path.join(OUT, "world-sfx.wav"), sfx * lim)
save(os.path.join(OUT, "world-chorus.wav"), chorus * lim)
