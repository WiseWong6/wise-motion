"""Original 120 BPM score, recomposed by bar. No samples or external music inputs.

Run with the bundled Python runtime: this_file.py --duration 44
The archived 32-second source, master, stems and reports are never overwritten.
"""
from pathlib import Path
import argparse, hashlib, json, math, subprocess, wave
import numpy as np

parser = argparse.ArgumentParser()
parser.add_argument('--duration', type=int, choices=[32, 44], default=44)
args = parser.parse_args()
BASE = Path(__file__).resolve().parent
DUR = args.duration
R = BASE / f'{DUR}秒版'
R.mkdir(exist_ok=True)
(R / '分层').mkdir(exist_ok=True)
SR = 48000
N = SR * DUR
BPM = 120
rng = np.random.default_rng(32120261014)
buses = {k: np.zeros((N, 2), np.float32) for k in ['鼓组', '低音', '中频和声', '金属细节', '空间']}
events = []
protected = [BASE / n for n in ['合成.py', 'MOTION-STUDY-32s-原创音乐.wav', '来源与测量.json', '节拍锚点.json']]
protected += sorted((BASE / '分层').glob('*.wav'))
protected = [p for p in protected if p.is_file()]
before = {str(p.relative_to(BASE)): hashlib.sha256(p.read_bytes()).hexdigest() for p in protected}

def hz(m):
    return 440 * 2 ** ((m - 69) / 12)

def env(d, attack=.003, decay=10):
    t = np.arange(round(d * SR)) / SR
    e = np.minimum(t / attack, 1) * np.exp(-t * decay) * np.clip((d - t) / .018, 0, 1)
    return t, e

def put(name, x, start, gain=1, pan=0):
    i = round(start * SR)
    length = min(len(x), N - i)
    if length <= 0:
        return
    buses[name][i:i+length, 0] += x[:length] * gain * math.cos((pan + 1) * math.pi / 4)
    buses[name][i:i+length, 1] += x[:length] * gain * math.sin((pan + 1) * math.pi / 4)

def noise(d, lo, hi):
    n = round(d * SR)
    f = np.fft.rfftfreq(n, 1 / SR)
    a = rng.normal(size=n)
    w = 1 / (1 + (lo / np.maximum(f, 1)) ** 8) / (1 + (f / hi) ** 8)
    x = np.fft.irfft(np.fft.rfft(a) * w, n)
    return x / (np.sqrt(np.mean(x*x)) + 1e-12)

def kick():
    t, e = env(.30, .0018, 16)
    phase = np.cumsum(49 + 105 * np.exp(-t * 42)) / SR * 2 * np.pi
    return (np.sin(phase) + .16*np.sin(2*phase) + .035*noise(.30, 900, 2400)*np.exp(-t*150)) * e

def snare():
    t, e = env(.16, .0012, 30)
    return (.47*noise(.16, 650, 5200) + .38*np.sin(2*np.pi*184*t)*np.exp(-t*10)) * e

def hat(opened=False):
    d = .16 if opened else .055
    t, e = env(d, .001, 24 if opened else 70)
    return noise(d, 3200, 8400) * e

def bass(m, d=.29):
    t, e = env(d, .009, 5.0)
    p = 2 * np.pi * hz(m) * t
    x = np.zeros(len(t))
    for k, gain in [(1, 1), (2, .46), (3, .23), (4, .11), (5, .045)]:
        cutoff = 240 + 1800 * np.exp(-t * 13)
        x += gain * np.sin(k*p) * np.exp(-(k*hz(m)/cutoff)**2)
    return np.tanh(x * 1.3) / 1.3 * e

def synth(m, d=.52, soft=False):
    t, e = env(d, .04 if soft else .008, .65 if soft else 4.1)
    p = 2*np.pi*hz(m)*t + .015*np.sin(2*np.pi*.71*t)
    return (np.sin(p) + .24*np.sin(2*p) + .095*np.sin(3*p) + .035*np.sin(4*p)) * e

def metal(d=.23, ratio=1):
    t, e = env(d, .0015, 17)
    x = np.zeros(len(t))
    for freq, gain in [(780, 1), (1703, .34), (2840, .13)]:
        x += gain*np.sin(2*np.pi*freq*ratio*t)*np.exp(-t*(0 if freq < 1000 else 10))
    return x * e

# The same harmonic vocabulary and timbre as our original 32-second composition.
chords = [(50, 57, 60, 64), (46, 53, 60, 62), (50, 57, 60, 64),
          (48, 55, 62, 64), (55, 62, 70, 69), (57, 64, 62, 67),
          (50, 57, 60, 64), (50, 57, 62, 69)]
arrangement44 = [
    ('intro', .60, 38, 0), ('intro', .72, 38, 0),
    ('assembly', .78, 34, 1), ('assembly', .90, 34, 1), ('assembly', 1.0, 38, 2),
    ('reveal', .91, 38, 2), ('edge', .83, 36, 3),
    ('drive', 1.0, 36, 3), ('drive', 1.02, 38, 0),
    ('craft', 1.0, 38, 0), ('craft', .97, 36, 3),
    ('breath', .40, 36, 3),
    ('macro', .48, 31, 4), ('macro', .47, 31, 4), ('macro', .49, 33, 5),
    ('detail', .36, 33, 5), ('detail', .56, 38, 6),
    ('build', .94, 38, 6), ('climax', 1.10, 38, 7), ('climax', 1.13, 38, 7),
    ('land', .98, 38, 7), ('tail', 0, 38, 7),
]
# Short option is a fresh alternative render in its own folder, never the archive.
arrangement = arrangement44 if DUR == 44 else [arrangement44[i] for i in [0,1,2,4,5,7,9,10,12,13,14,16,18,19,20,21]]
assert len(arrangement) * 2 == DUR
strong = {'assembly', 'reveal', 'edge', 'drive', 'craft', 'build', 'climax'}

for bar, (kind, strength, root, chord_idx) in enumerate(arrangement):
    start = bar * 2
    if kind == 'intro':
        kicks = [0] if bar == 0 else [0, 1.25]
    elif kind == 'assembly':
        kicks = [0, 1] if bar == 2 else ([0, .75, 1.5] if bar == 3 else [0, .5, 1, 1.75])
    elif kind in {'drive', 'craft', 'build'}:
        kicks = [0, .75, 1, 1.75] if bar % 2 else [0, .5, 1, 1.75]
    elif kind == 'climax':
        kicks = [0, .75, 1, 1.5] if bar % 2 == 0 else [0, .5, 1, 1.5, 1.75]
    elif kind in {'reveal', 'edge'}:
        kicks = [0, 1.25]
    elif kind in {'macro', 'breath', 'land'}:
        kicks = [0]
    elif kind == 'detail':
        kicks = [] if bar % 2 else [0]
    else:
        kicks = []
    for p in kicks:
        put('鼓组', kick(), start+p, .125*strength)
        events.append({'time': start+p, 'kind': 'kick', 'section': kind})

    if kind in strong:
        for p in [.5, 1.5]:
            put('鼓组', snare(), start+p, .105*strength, .04)
        dense = kind in {'drive', 'craft', 'build', 'climax'} or (kind == 'assembly' and bar >= 4)
        step = .125 if dense else .25
        for j, p in enumerate(np.arange(.25, 2, step)):
            put('鼓组', hat(), start+float(p), (.021 if j%2 == 0 else .010)*strength, -.27 if j%2 else .27)
        if kind in {'build', 'climax'} or bar in [4, 10]:
            put('鼓组', hat(True), start+1.75, .023*strength, .35)
    elif kind == 'intro':
        if bar == 1:
            put('鼓组', snare(), start+1.5, .045, .04)
        for j, p in enumerate([.5, 1.5]):
            put('鼓组', hat(), start+p, .009*strength, -.20 if j else .20)
    elif kind == 'macro':
        for p in [.5, 1.5]:
            put('鼓组', hat(), start+p, .004, .15)

    if kind in strong or kind == 'intro':
        pattern = [(.25, 0), (.875, 0), (1.25, 7), (1.75, 0)]
        if kind in {'drive', 'craft', 'build', 'climax'}:
            pattern = [(.25,0), (.625,0), (.875,12), (1.25,7), (1.625,3), (1.875,0)]
        if kind == 'intro':
            pattern = [(.25, 0), (1.25, 7)] if bar else [(.25, 0)]
        for p, interval in pattern:
            put('低音', bass(root+interval, .24 if len(pattern)>4 else .31), start+p, .062*strength)
    elif kind in {'breath', 'macro', 'detail'}:
        positions = [.5, 1.5] if kind == 'macro' else [.5]
        for p in positions:
            put('低音', bass(root+12, .38), start+p, .030 if kind == 'macro' else .023)
    elif kind == 'land':
        put('低音', bass(root, 1.15), start, .080)

    chord = chords[chord_idx]
    if kind == 'tail':
        times = []
        duration, gain = 0, 0
    elif kind == 'land':
        times, duration, gain = [0], 4.0, .034
    elif kind in {'breath', 'macro', 'detail'}:
        times = [0] if kind != 'detail' or bar % 2 else [.25]
        duration, gain = (1.8, .011) if kind == 'macro' else (1.9, .012)
    elif kind == 'intro':
        times, duration, gain = [0], .75, .028 if bar == 0 else .034
    elif kind == 'climax':
        times = [0, .75] if bar % 2 == 0 else [0, 1.25]
        duration, gain = .64, .052
    else:
        times = [0] if bar % 2 == 0 else [.75]
        duration = .9 if bar % 2 == 0 else .43
        gain = .043 if kind in {'assembly', 'reveal', 'edge'} else .049
    for p in times:
        for i, note in enumerate(chord):
            put('中频和声', synth(note, duration, kind in {'breath','macro','detail','land'}), start+p, gain, [-.32,.28,-.17,.35][i])

    # Editorial metal punctuation only; no assertion of exact physical sound sync.
    if kind in {'tail', 'land'}:
        positions = []
    elif kind in {'intro', 'breath'}:
        positions = [1.25]
    elif kind in {'macro', 'detail'}:
        positions = [.25, 1.25]
    elif kind in {'build', 'climax'}:
        positions = [.25, 1.125, 1.75]
    else:
        positions = [.375, 1.25]
    for i, p in enumerate(positions):
        gain = .007 if kind in {'macro','detail','intro','breath'} else (.013 if kind == 'climax' else .010)
        put('金属细节', metal(.18, .83 if i%2 else 1), start+p, gain, -.32 if i%2 else .32)

if DUR == 44:
    accents = [(0,.038),(4,.046),(10,.052),(14,.057),(18,.052),(22,.021),(24,.025),(30,.022),(34,.054),(36,.068),(40,.058)]
    pickups = [9.5, 13.5, 17.5, 21.5, 33.5, 35.5, 39.5]
    anchors = [0,2,4,10,12,14,18,22,24,26,28,30,34,36,40,42,44]
    segments = [(0,4),(4,10),(10,14),(14,22),(22,24),(24,30),(30,34),(34,36),(36,40),(40,42),(42,44)]
else:
    accents = [(0,.038),(4,.046),(8,.057),(16,.025),(24,.068),(28,.058)]
    pickups = [7.5,15.5,23.5,27.5]
    anchors = [0,4,8,16,24,28,30,32]
    segments = [(0,4),(4,8),(8,16),(16,24),(24,28),(28,30),(30,32)]
for sec, gain in accents:
    put('金属细节', metal(.62, .69), sec, gain, -.06)
    events.append({'time':sec,'kind':'section_accent'})
for sec in pickups:
    for i in range(4):
        put('金属细节', metal(.11,1+i*.025), sec+i*.125, .010+i*.003, -.22 if i%2 else .22)

space = buses['中频和声']*.7 + buses['金属细节']*.35
for delay, gain in [(.036,.11),(.073,.09),(.187,.10),(.281,.075),(.419,.049),(.613,.028)]:
    shift = round(delay*SR)
    buses['空间'][shift:,0] += space[:-shift,1]*gain
    buses['空间'][shift:,1] += space[:-shift,0]*gain
del space
time = np.arange(N)/SR
fade = np.minimum(time/.004,1) * np.clip((DUR-time)/.55,0,1)**1.2
master = np.zeros((N,2),np.float32)
for bus in buses.values():
    bus *= fade[:,None]
    master += bus
master = np.tanh(master*1.20)/1.20

def write24(path, a):
    assert np.isfinite(a).all() and np.max(np.abs(a)) < 1
    value = np.rint(a.astype(np.float64)*8388607).astype('<i4')
    packed = value.view(np.uint8).reshape(-1,4)[:,:3].copy().tobytes()
    with wave.open(str(path),'wb') as w:
        w.setnchannels(2); w.setsampwidth(3); w.setframerate(SR); w.writeframes(packed)

def run(command):
    return subprocess.run(command,capture_output=True,text=True,check=True)

def measure(path, prefix=''):
    p=run(['ffmpeg','-hide_banner','-nostats','-filter_threads','1','-i',str(path),'-af',prefix+'loudnorm=I=-15:TP=-2.0:LRA=11:print_format=json','-f','null','-'])
    return json.loads(p.stderr[p.stderr.rfind('{'):p.stderr.rfind('}')+1])

for name, bus in buses.items():
    write24(R/'分层'/f'{name}.wav',bus)
raw = R/'.premaster.wav'
write24(raw,master)
lowcut = 'highpass=f=22:p=2,'
pre = measure(raw, lowcut)
normalizer = lowcut + 'loudnorm=I=-15:TP=-2.0:LRA=11:' + ':'.join(f'{key}={pre[value]}' for key,value in [('measured_I','input_i'),('measured_TP','input_tp'),('measured_LRA','input_lra'),('measured_thresh','input_thresh'),('offset','target_offset')]) + ':linear=true'
final = R/f'MOTION-STUDY-{DUR}s-原创音乐.wav'
run(['ffmpeg','-v','error','-y','-filter_threads','1','-i',str(raw),'-af',normalizer,'-ar','48000','-ac','2','-c:a','pcm_s24le',str(final)])
actual = measure(final)
assert -16.0 <= float(actual['input_i']) <= -14.0, actual
assert float(actual['input_tp']) <= -1.8, actual
with wave.open(str(final),'rb') as w:
    assert (w.getframerate(),w.getnchannels(),w.getsampwidth(),w.getnframes()) == (SR,2,3,N)
run(['ffmpeg','-v','error','-i',str(final),'-f','null','-'])
raw.unlink()

pcm = subprocess.run(['ffmpeg','-v','error','-i',str(final),'-f','f32le','-'],capture_output=True,check=True).stdout
decoded = np.frombuffer(pcm,dtype='<f4').reshape(-1,2)
mono = decoded.mean(axis=1)
stats=[]
for start,end in segments:
    x=mono[start*SR:end*SR].astype(float)
    power=np.abs(np.fft.rfft(x*np.hanning(len(x))))**2
    freqs=np.fft.rfftfreq(len(x),1/SR)
    total=power.sum(); rms=np.sqrt(np.mean(x*x)); peak=np.max(np.abs(x))
    stats.append({'seconds':[start,end],'RMSdBFS':round(float(20*np.log10(max(rms,1e-12))),2),'crestDB':round(float(20*np.log10(max(peak,1e-12)/max(rms,1e-12))),2),'spectralCentroidHz':round(float((freqs*power).sum()/total),1),'energyPercent':{f'{lo}-{hi}Hz':round(float(power[(freqs>=lo)&(freqs<hi)].sum()/total*100),2) for lo,hi in [(0,30),(30,100),(100,250),(250,1000),(1000,5000),(5000,24000)]}})
tailDrum = float(np.max(np.abs(buses['鼓组'][(DUR-2)*SR:])))
assert tailDrum == 0
bassActive = np.max(np.abs(buses['低音']),axis=1)
checks={'fullDecodePassed':True,'finiteSamples':bool(np.isfinite(decoded).all()),'maxAbsDC':float(np.max(np.abs(decoded.mean(axis=0)))),'leftRightCorrelation':float(np.corrcoef(decoded.T)[0,1]),'bassGapPercent':round(float(np.mean(bassActive<np.max(bassActive)*.01)*100),2),'last2SecondsDrumPeak':tailDrum,'allEventsOnSixteenthNoteGrid':all(abs(e['time']*8-round(e['time']*8))<1e-8 for e in events)}
assert checks['finiteSamples'] and checks['maxAbsDC'] < .0001
assert checks['bassGapPercent'] > 25
assert checks['allEventsOnSixteenthNoteGrid']
after={str(p.relative_to(BASE)):hashlib.sha256(p.read_bytes()).hexdigest() for p in protected}
assert before == after
beatMap={'durationSeconds':DUR,'fps':24,'totalFrames':DUR*24,'bpm':BPM,'beatsPerBar':4,'bars':DUR//2,'beatSeconds':.5,'samplesPerBeat':24000,'framesPerBeat':12,'sectionAnchors':[{'seconds':t,'frame':t*24,'sample':t*SR} for t in anchors],'beats':[{'beat':i+1,'bar':i//4+1,'beatInBar':i%4+1,'seconds':i*.5,'frame':i*12,'sample':i*24000} for i in range(DUR*2)],'barArrangement':[{'start':i*2,'end':i*2+2,'section':a[0],'strength':a[1]} for i,a in enumerate(arrangement)]}
(R/'节拍锚点.json').write_text(json.dumps(beatMap,ensure_ascii=False,indent=2)+'\n')
report={'file':final.name,'durationSeconds':DUR,'sampleRate':SR,'channels':2,'bits':24,'bpm':BPM,'bars':DUR//2,'originalSynthesis':True,'externalAssets':[],'oldSoundtrackInputs':[],'source':'../合成-可设时长.py。沿用我们原创32秒版的振荡器、谐波音色和和声主题，按新画面逐小节重新创作，不拼接或拉伸旧WAV。','measured':{'LUFS':float(actual['input_i']),'truePeakDBTP':float(actual['input_tp']),'LRA':float(actual['input_lra'])},'checks':checks,'segments':stats,'events':sorted(events,key=lambda x:x['time']),'beatMap':'节拍锚点.json','stemDirectory':'分层','mixNote':'分层为预母带电平；主混音经轻微软饱和、22Hz二阶高通去除直流与无效超低频、两遍响度归一。金属短音是创作性标点，不声称精确模拟镜头机械接触声音。','sha256':hashlib.sha256(final.read_bytes()).hexdigest(),'protected32FilesUnchanged':before,'reviewScope':'实际PCM频谱、分段能量、瞬态峰均比、立体声、响度和解码检查；未声称已经试听。','temporaryFilesRemoved':['.premaster.wav']}
(R/'来源与测量.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'path':str(final),'sha256':report['sha256'],'measured':report['measured'],'checks':checks,'segments':stats},ensure_ascii=False))
