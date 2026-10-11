"""原创 22 秒制表短片声轨；无需下载素材或外部服务。"""
from pathlib import Path
import json
import math
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
RATE = 48000
DURATION = 22.0
COUNT = int(RATE * DURATION)
rng = np.random.default_rng(202610111)
audio = np.zeros((COUNT, 2), dtype=np.float64)
events = []


def fade(length, attack=.025, release=.18):
    n = int(round(length * RATE))
    t = np.arange(n) / RATE
    env = np.ones(n)
    if attack > 0:
        env *= np.sin(np.clip(t / attack, 0, 1) * np.pi / 2) ** 2
    if release > 0:
        env *= np.sin(np.clip((length-t) / release, 0, 1) * np.pi / 2) ** 2
    return env


def noise(length, low=80, high=1400):
    n = int(round(length * RATE))
    raw = rng.normal(0, 1, n)
    f = np.fft.rfftfreq(n, 1/RATE)
    roll = 1 / np.sqrt(1 + (f/high)**8)
    if low:
        roll *= 1 / np.sqrt(1 + (low/np.maximum(f, .1))**8)
    x = np.fft.irfft(np.fft.rfft(raw) * roll, n)
    return x / max(np.std(x), 1e-9)


def put(at, signal, level, pan=0, label=None):
    a = int(round(at * RATE))
    if a >= COUNT:
        return
    n = min(len(signal), COUNT-a)
    # Narrow pans preserve a central, substantial watch while opening the room.
    l, r = math.sqrt((1-pan)/2), math.sqrt((1+pan)/2)
    audio[a:a+n, 0] += signal[:n] * level * l
    audio[a:a+n, 1] += signal[:n] * level * r
    if label:
        events.append({'秒':at,'声音':label,'长度':len(signal)/RATE})


def click(at, level=.09, pan=0, final=False):
    length=.22 if final else .10
    t=np.arange(int(length*RATE))/RATE
    # Damped, small metal movement; filtered attack avoids a brittle digital pop.
    x=noise(length, 480, 4100)*np.exp(-t*390)*.12
    for f,decay,g in [(1280,115,.20),(2113,150,.10),(3221,205,.04),(173,54,.11)]:
        x+=np.sin(2*np.pi*f*t)*np.exp(-t*decay)*g
    x*=fade(length,.00035,.015)
    if final:
        x+=np.sin(2*np.pi*61*t)*(1-np.exp(-t*240))*np.exp(-t*21)*.18
    put(at,x,level,pan,'最终锁合' if final else '部件锁合')


def air(at, length, level, pan=0, reverse=False):
    t=np.arange(int(round(length*RATE)))/RATE
    u=t/length
    # Asymmetric rise/fall follows the measured acceleration of a lifted plate.
    env=(np.sin(np.pi*u)**1.7)*(0.5+0.5*u if reverse else 1-.40*u)
    x=noise(length,120,1100)*env*.15
    x+=np.sin(2*np.pi*(44*t+8*t*t/length))*env*.10
    put(at,x,level,pan,'细微气流')


# The undertone evolves slowly, without a stock-music beat or repeated bell motif.
t=np.arange(COUNT)/RATE
slow=(.58+.14*np.sin(2*np.pi*t/11-.8)+.12*np.sin(2*np.pi*t/19))
reveal=1 + .30*np.exp(-((t-7.8)/2.2)**2)+.30*np.exp(-((t-19.5)/2.2)**2)
base=(np.sin(2*np.pi*36.708*t)*.19+
      np.sin(2*np.pi*55.062*t+.4)*.105+
      np.sin(2*np.pi*73.416*t+.1)*.08+
      np.sin(2*np.pi*110.124*t)*.025)
base*=slow*reveal*fade(DURATION,1.45,1.55)
put(0,base,.65,0,'持续低频氛围')
for ch in range(2):
    room=noise(DURATION,180,920)*.010
    room*=fade(DURATION,1.8,1.7)*(.65+.25*np.sin(2*np.pi*t/8+ch*.4))
    audio[:,ch]+=room

# Discreet resonant air above the fundamental is audible mainly at the reveal.
for at,length,frequency,level,pan in [(5.6,4.9,146.832,.045,-.12),(6.7,3.5,220.248,.014,.15),(17.6,4.4,146.832,.047,.10),(18.2,3.8,185.0,.012,-.15)]:
    tt=np.arange(int(round(length*RATE)))/RATE
    shimmer=(np.sin(2*np.pi*frequency*tt)+.17*np.sin(2*np.pi*(frequency*2.003)*tt))
    shimmer*=fade(length,.85,1.25)
    put(at,shimmer,level,pan,'温润泛音')

# Alternating escapement beat: restrained overall, close and tangible in macro.
for i in range(86):
    at=.42+i*.25
    if at>21.3:break
    length=.042
    tt=np.arange(int(length*RATE))/RATE
    freq=1880 if i%2==0 else 1640
    x=noise(length,650,3400)*np.exp(-tt*430)*.10
    x+=np.sin(2*np.pi*freq*tt)*np.exp(-tt*220)*.10
    x+=np.sin(2*np.pi*580*tt)*np.exp(-tt*145)*.04
    x*=fade(length,.0003,.005)
    gain=.38 if 3.05<at<5.9 else (.12 if at<3 else .075)
    if 10<at<18: gain*=.5
    put(at,x,gain,-.07 if i%2 else .07)
events.append({'秒':.42,'声音':'交替擒纵嘀嗒，摆轮微距时渐强','长度':21.0})

# Camera and component movements: no exaggerated science-fiction sweeps.
air(2.72,.52,.30,-.10)
air(5.55,.92,.38,.12)
air(9.85,2.30,.58,-.12,True)
air(11.7,2.45,.33,.16,True)
air(14.85,2.72,.45,0)
for at,level,pan in [(15.38,.32,-.14),(15.93,.29,.12),(16.45,.36,-.09),(16.94,.38,.10),(17.39,.43,0)]:
    click(at,level,pan)
click(17.82,.68,0,True)
air(17.6,1.05,.22,.08)

# Very short room reflections give the near-field metal a little physical space.
dry=audio.copy()
for delay,amount,swap in [(.037,.085,False),(.071,.052,True),(.117,.026,False)]:
    shift=int(delay*RATE)
    source=dry[:-shift,::-1] if swap else dry[:-shift]
    audio[shift:]+=source*amount
# Global tails are clean and the final sample returns exactly to digital silence.
audio-=np.mean(audio,axis=0)
audio*=fade(DURATION,.035,.85)[:,None]
peak=float(np.max(np.abs(audio)))
rms=float(np.sqrt(np.mean(audio**2)))
master=min(.66/max(peak,1e-9),.075/max(rms,1e-9))
audio*=master
audio[0]=0;audio[-1]=0
pcm=np.round(np.clip(audio,-1,1)*32767).astype('<i2')
output=ROOT/'成片'/'分秒之间-声轨.wav'
output.parent.mkdir(parents=True,exist_ok=True)
with wave.open(str(output),'wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(RATE);w.writeframes(pcm.tobytes())
actual=pcm.astype(np.float64)/32768
actual_peak=float(np.max(np.abs(actual)))
actual_rms=float(np.sqrt(np.mean(actual**2)))
report={
    '来源':'本目录 sound.py 原创合成，无外部音源、采样或下载素材',
    '文件':str(output),'时长秒':DURATION,'采样率':RATE,'声道数':2,'每声道采样数':COUNT,
    '峰值':actual_peak,'峰值_dBFS':round(20*math.log10(max(actual_peak,1e-12)),3),
    '均方根_dBFS':round(20*math.log10(max(actual_rms,1e-12)),3),
    '过载样本数':int(np.count_nonzero(np.abs(actual)>=.999)),
    '首尾归零':bool(np.all(pcm[0]==0) and np.all(pcm[-1]==0)),
    '事件':sorted(events,key=lambda e:e['秒'])
}
checks=ROOT/'检查';checks.mkdir(exist_ok=True)
(checks/'audio.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
with wave.open(str(output),'rb') as w:
    assert w.getnframes()==COUNT and w.getframerate()==RATE and w.getnchannels()==2
assert report['过载样本数']==0 and report['首尾归零']
print(json.dumps({k:v for k,v in report.items() if k!='事件'},ensure_ascii=False,indent=2))
