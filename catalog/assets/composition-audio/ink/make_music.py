#!/usr/bin/env python3
"""Compose and synthesize the original score 水墨微光, without sampled audio.

Requirements: Python 3, NumPy, FFmpeg and FFprobe already on PATH.
Running this file regenerates public/audio/水墨微光.m4a and its measurement note.
"""

from __future__ import annotations

import json
import math
from pathlib import Path
import re
import shutil
import subprocess
import wave

import numpy as np


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "audio"
SR = 44100
DURATION = 186.0
TEMPO = 80
BEAT = 60 / TEMPO
BAR = BEAT * 4
RNG = np.random.default_rng(18940628)
SCORE = np.zeros((round(SR * DURATION), 2), dtype=np.float32)


def frequency(midi: float) -> float:
    return 440 * 2 ** ((midi - 69) / 12)


def add(sound: np.ndarray, start: float, gain: float = 1, pan: float = 0) -> None:
    first = max(0, round(start * SR))
    count = min(len(sound), len(SCORE) - first)
    if count <= 0:
        return
    angle = (pan + 1) * math.pi / 4
    SCORE[first:first + count, 0] += sound[:count] * gain * math.cos(angle)
    SCORE[first:first + count, 1] += sound[:count] * gain * math.sin(angle)


def electric_piano(midi: int, length: float = 3.6, softness: float = 1) -> np.ndarray:
    t = np.arange(round(length * SR), dtype=np.float32) / SR
    f = frequency(midi)
    # A little inharmonic shimmer over a rounded, quickly settling piano attack.
    phase = 2 * np.pi * f * t
    bell = np.sin(phase + .62 * np.exp(-t * 5) * np.sin(phase * 2))
    bell += .19 * np.sin(phase * 2) * np.exp(-t * 2.8)
    bell += .055 * np.sin(phase * 3.997) * np.exp(-t * 4.2)
    envelope = (1 - np.exp(-t * 170)) * np.exp(-t / (1.15 * softness))
    envelope *= np.minimum(1, (length - t) / .12)
    return (bell * envelope).astype(np.float32)


def pad(midi: int, length: float, phase_offset: float) -> np.ndarray:
    t = np.arange(round(length * SR), dtype=np.float32) / SR
    f = frequency(midi)
    sound = np.sin(2 * np.pi * f * t + phase_offset)
    sound += .36 * np.sin(2 * np.pi * f * 1.0015 * t + phase_offset + .7)
    sound += .13 * np.sin(2 * np.pi * f * 2 * t + phase_offset * .3)
    envelope = np.minimum(1, t / 1.8) * np.minimum(1, (length - t) / 2.7)
    envelope *= .90 + .10 * np.sin(2 * np.pi * .12 * t + phase_offset)
    return (sound * np.maximum(envelope, 0)).astype(np.float32)


def bass(midi: int, length: float = 2.6) -> np.ndarray:
    t = np.arange(round(length * SR), dtype=np.float32) / SR
    phase = 2 * np.pi * frequency(midi) * t
    envelope = (1 - np.exp(-t * 30)) * np.exp(-t * 1.2)
    envelope *= np.minimum(1, (length - t) / .18)
    return ((np.sin(phase) + .15 * np.sin(2 * phase)) * envelope).astype(np.float32)


def soft_tick(length: float = .085) -> np.ndarray:
    t = np.arange(round(length * SR), dtype=np.float32) / SR
    noise = RNG.standard_normal(len(t)).astype(np.float32)
    # A smooth, narrow transient; gentle high-pass and low-pass without SciPy.
    low = np.convolve(noise, np.ones(7, dtype=np.float32) / 7, mode="same")
    broad = np.convolve(noise, np.ones(35, dtype=np.float32) / 35, mode="same")
    return ((low - broad) * np.exp(-t * 48) * np.minimum(t / .005, 1)).astype(np.float32)


def soft_kick() -> np.ndarray:
    t = np.arange(round(.42 * SR), dtype=np.float32) / SR
    phase = 2 * np.pi * (48 * t + 34 * .035 * (1 - np.exp(-t / .035)))
    return (np.sin(phase) * np.exp(-t * 13) * np.minimum(t / .012, 1)).astype(np.float32)


def swell(start: float, midi: int, gain: float = .02) -> None:
    t = np.arange(round(4.5 * SR), dtype=np.float32) / SR
    envelope = np.sin(np.pi * t / 4.5) ** 2
    breath = .22 * np.sin(2 * np.pi * frequency(midi) * t)
    breath += .08 * np.sin(2 * np.pi * frequency(midi + 7) * t)
    add(breath * envelope, start, gain, -.3)


def compose() -> None:
    # D-major pentatonic melody over Dmaj9 / Bm7 / Gmaj9 / Asus2.
    # Each harmony lasts two bars (6 s). The notes below are an original melody.
    chords = [
        (38, [50, 57, 61, 64, 66]),
        (35, [47, 54, 57, 62, 66]),
        (31, [43, 50, 57, 59, 62]),
        (33, [45, 52, 57, 59, 64]),
    ]
    motifs = [
        [(0, 78), (.75, 81), (1.5, 76), (3, 74), (4.5, 71), (5.25, 74)],
        [(0, 78), (1, 74), (2.25, 76), (3.5, 81), (4.5, 78), (5.25, 76)],
        [(.25, 74), (1.5, 71), (2.5, 74), (3.5, 78), (4.75, 76)],
        [(0, 76), (1.5, 81), (2.25, 83), (3.75, 81), (4.75, 78)],
    ]
    for slot in range(31):
        start = slot * 6
        chord_index = slot % 4
        if slot >= 29:
            chord_index = 0  # A quiet tonic landing under the final image.
        root, chord = chords[chord_index]
        for i, midi in enumerate(chord):
            add(pad(midi, 8.4, slot * .71 + i * .9), start - .3,
                .019 if midi < 60 else .013, (i - 2) / 3)
        add(bass(root, 4.0), start, .075)
        if 30 <= start < 171:
            add(bass(root + 12, 2.0), start + 3.05, .039, .05)

        # Opening is direct, with later phrases giving the pictures room to breathe.
        if slot < 5:
            motif = motifs[slot % 4]
            strength, octave = .105, 0
        elif slot < 11:
            motif = motifs[(slot + 2) % 4][::2]
            strength, octave = .078, -12
        elif slot < 16:
            motif = motifs[(slot + 1) % 4]
            strength, octave = .086, 0
        elif slot < 22:
            motif = motifs[slot % 4][::2]
            strength, octave = .067, 0
        elif slot < 26:
            motif = motifs[(slot + 1) % 4]
            strength, octave = .085, 0
        elif slot < 29:
            motif = motifs[slot % 4]
            strength, octave = .093, 0
        else:
            motif = [(0, 78), (1.5, 76), (3, 74)] if slot == 29 else [(0, 74)]
            strength, octave = .069, 0
        for j, (beat, note) in enumerate(motif):
            onset = start + beat * BEAT
            add(electric_piano(note + octave, softness=1.1), onset,
                strength * (1 - .065 * (j % 3)), .33 * math.sin(slot + j * 1.4))

        # Quiet droplets vary with the chapter, never covering explanatory captions.
        if 30 <= start < 174:
            sequence = [chord[1] + 12, chord[3] + 12, chord[2] + 12, chord[4] + 12]
            density = 8 if (66 <= start < 96 or 132 <= start < 174) else 4
            for k in range(density):
                add(electric_piano(sequence[k % 4], 2.8, .66),
                    start + .35 + k * 6 / density,
                    .023 if k % 2 == 0 else .017,
                    -.62 if k % 2 == 0 else .62)

    # A near-inaudible pulse establishes movement while the score stays floating.
    for bar in range(62):
        start = bar * BAR
        if start >= 177:
            continue
        density = .54 if (30 <= start < 63 or 96 <= start < 129) else 1
        add(soft_kick(), start, .041 * density)
        if 30 <= start < 174:
            add(soft_kick(), start + 2 * BEAT, .024 * density)
        for k in range(4):
            add(soft_tick(), start + (.5 + k) * BEAT,
                .040 * density * (.8 if k % 2 else 1), -.4 if k % 2 else .4)

    for change in [29, 62, 95, 128, 155]:
        swell(change, 74, .12)
        add(electric_piano(86, 4.6, 1.45), change + 1, .028, .28)


def room_and_master() -> dict:
    # Static multitap stereo room: reproducible, modest tails, no external effects.
    dry = SCORE.copy()
    for delay, gain in [(0.113, .17), (.227, .12), (.373, .095), (.521, .07),
                        (.739, .055), (1.031, .037), (1.397, .025)]:
        offset = round(delay * SR)
        SCORE[offset:, 0] += dry[:-offset, 1] * gain
        SCORE[offset:, 1] += dry[:-offset, 0] * gain
    del dry
    SCORE[:] = np.tanh(SCORE * 1.1) / 1.1
    fade_in = round(.065 * SR)
    fade_out = round(9 * SR)
    SCORE[:fade_in] *= np.linspace(0, 1, fade_in, dtype=np.float32)[:, None]
    SCORE[-fade_out:] *= np.linspace(1, 0, fade_out, dtype=np.float32)[:, None] ** 1.7
    SCORE[:] -= SCORE.mean(axis=0)
    peak = float(np.max(np.abs(SCORE)))
    SCORE[:] *= .78 / peak
    peak = float(np.max(np.abs(SCORE)))
    rms = float(np.sqrt(np.mean(SCORE.astype(np.float64) ** 2)))
    assert 0 < rms < peak < 1
    return {"source_peak_dbfs": 20 * math.log10(peak),
            "source_rms_dbfs": 20 * math.log10(rms)}


def loudness(path: Path) -> dict:
    result = subprocess.run([
        "ffmpeg", "-hide_banner", "-i", str(path), "-af",
        "loudnorm=I=-19:TP=-1.5:LRA=8:print_format=json", "-f", "null", "-"
    ], check=True, capture_output=True, text=True)
    return json.loads(re.findall(r"\{\s*\"input_i\"[\s\S]+?\}", result.stderr)[-1])


def main() -> None:
    for program in ["ffmpeg", "ffprobe"]:
        if not shutil.which(program):
            raise SystemExit(f"Required local command not found: {program}")
    OUT.mkdir(parents=True, exist_ok=True)
    temporary = OUT / ".music-source.wav"
    final = OUT / "水墨微光.m4a"
    compose()
    measurements = room_and_master()
    with wave.open(str(temporary), "wb") as stream:
        stream.setnchannels(2)
        stream.setsampwidth(2)
        stream.setframerate(SR)
        stream.writeframes((SCORE * 32767).astype("<i2").tobytes())
    analysis = loudness(temporary)
    normalization = (
        "loudnorm=I=-19:TP=-1.5:LRA=8:linear=true:"
        f"measured_I={analysis['input_i']}:measured_TP={analysis['input_tp']}:"
        f"measured_LRA={analysis['input_lra']}:measured_thresh={analysis['input_thresh']}:"
        f"offset={analysis['target_offset']}"
    )
    subprocess.run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(temporary),
        "-af", normalization, "-c:a", "aac", "-b:a", "192k", "-ar", str(SR),
        "-ac", "2", "-t", str(DURATION), "-movflags", "+faststart", str(final)
    ], check=True)
    encoded = loudness(final)
    probe = json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration,size:stream=codec_name,sample_rate,channels",
        "-of", "json", str(final)
    ], text=True))
    duration = float(probe["format"]["duration"])
    assert abs(duration - DURATION) < .06, duration
    assert float(encoded["input_tp"]) < -.5, encoded
    assert -20 < float(encoded["input_i"]) < -18, encoded
    assert probe["streams"][0]["channels"] == 2
    temporary.unlink()
    metrics = {**measurements, "duration_seconds": duration,
               "integrated_lufs": float(encoded["input_i"]),
               "true_peak_dbtp": float(encoded["input_tp"]),
               "loudness_range_lu": float(encoded["input_lra"]),
               "bytes": int(probe["format"]["size"])}
    note = f"""# 水墨微光 · 原创配乐

为「水墨水母／希尔球涡」讲解视频专门编写。全曲由本地代码合成，旋律、和声编排和音色参数均为本次原创，不使用现成歌曲、录音采样或第三方生成服务，也不模仿特定艺术家。

- 音频：`水墨微光.m4a`，AAC 192 kb/s，立体声，44,100 Hz。
- 实测时长：{duration:.3f} 秒；用于 186 秒视频。
- 实测综合响度：{metrics['integrated_lufs']:.2f} LUFS。
- 实测真峰值：{metrics['true_peak_dbtp']:.2f} dBTP，低于削波阈值。
- 实测响度范围：{metrics['loudness_range_lu']:.2f} LU。
- 乐速：每分钟 80 拍；四拍子；以 D 大调五声音阶为旋律材料。

声音以柔和电钢琴与钢片琴般的短音为主，温暖的长音铺底，只有很轻的低频脉冲和细碎节拍。开场直接露出旋律，约 30、63、96、129、156 秒改变密度和音区，适配从气泡实景进入抽象模型、再回到墨染作品的节奏。最后 9 秒逐渐淡出。

当前没有配音；后续加入配音时，可在剪辑中将音乐整体降低约 5–8 dB，再听辨人声是否清楚。不要在音量为 1 的音乐上另叠同一音轨。

重现：在项目目录运行 `python3 scripts/make_music.py`。需要现有 NumPy、FFmpeg 和 FFprobe；不联网，不安装依赖。生成过程的临时无损文件会在成功验证后删除，只保留最终 AAC 配乐。

验证包含：源音频有效均方根能量、源样本峰值低于 1、最终音频实际时长和双声道、AAC 解码后的综合响度与真峰值。未进行人工耳听验收。

```json
{json.dumps(metrics, ensure_ascii=False, indent=2)}
```
"""
    (OUT / "配乐说明.md").write_text(note, encoding="utf-8")
    print(json.dumps(metrics, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
