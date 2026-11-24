"""v0.170: dry combat Foley and full-attack weapon edits, offline only.
python tools/prepare-combat-audio.py --decoder-dir ../audio-sources-v0167/python-tools
Needs the existing v0.169 bank and ../audio-sources-v0167, ../audio-sources-v0168.
"""
import argparse, hashlib, json, sys, wave
from pathlib import Path
p=argparse.ArgumentParser(); p.add_argument('--decoder-dir',type=Path); args=p.parse_args()
if args.decoder_dir: sys.path.insert(0,str(args.decoder_dir.resolve()))
import numpy as np
import soundfile as sf
root=Path(__file__).resolve().parents[1]; dest=root/'assets/audio'; rate=44100
manifest=json.loads((dest/'manifest.json').read_text(encoding='utf8'))
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def filt(x,frequency,q=.707,db=None):
    w=2*np.pi*frequency/rate; c=np.cos(w); a=np.sin(w)/(2*q)
    if db is None: b=[(1+c)/2,-1-c,(1+c)/2]; d=[1+a,-2*c,1-a]
    else:
        A=10**(db/40); b=[1+a*A,-2*c,1-a*A]; d=[1+a/A,-2*c,1-a/A]
    b=np.array(b)/d[0]; d=np.array(d)/d[0]; y=np.zeros_like(x); z1=z2=0
    for i,v in enumerate(x):
        out=b[0]*v+z1; z1=b[1]*v-d[1]*out+z2; z2=b[2]*v-d[2]*out; y[i]=out
    return y
def resample(raw,sr,pitch=1,channel=0):
    x=raw[:,channel].copy(); cutoff=min(sr*.43,15000/pitch)
    taps=np.arange(-192,193); k=np.sinc(2*cutoff/sr*taps)*np.blackman(len(taps)); k/=k.sum()
    x=np.convolve(x,k,'same'); n=round(len(x)*rate/sr/pitch)
    return np.interp(np.arange(n)*sr*pitch/rate,np.arange(len(x)),x)
def edges(x,attack=.0007,tail=.014):
    n=min(len(x),round(rate*attack)); x[:n]*=np.sin(np.linspace(0,np.pi/2,n))**2
    n=min(len(x),round(rate*tail)); x[-n:]*=np.cos(np.linspace(0,np.pi/2,n))**2
    x[0]=x[-1]=0; return x
report=[]
def save(name,take,x,ceiling,rmslimit,meta):
    x=edges(x); gain=min(4,ceiling/max(1e-9,np.max(abs(x))),rmslimit/max(1e-9,np.sqrt(np.mean(x*x)))); x*=gain
    filename=f'{name}-{take}-v0170.wav'
    with wave.open(str(dest/filename),'wb') as out:
        out.setnchannels(1);out.setsampwidth(2);out.setframerate(rate);out.writeframes(np.round(x*32767).astype('<i2').tobytes())
    entry={**meta,'file':filename,'sha256':sha(dest/filename),'sampleRate':rate,'duration':len(x)/rate,
        'peak':float(np.max(abs(x))),'rms':float(np.sqrt(np.mean(x*x))),'gain':float(gain)}
    f=np.fft.rfftfreq(len(x),1/rate); energy=abs(np.fft.rfft(x))**2
    report.append({'name':name,'take':take,'peak':entry['peak'],'rms':entry['rms'],
        'lowBandFraction':float(energy[f<250].sum()/energy.sum()),
        'presenceBandFraction':float(energy[(f>2500)&(f<12000)].sum()/energy.sum())})
    return entry
# Snapshot current takes ONCE, so repeat preparation is idempotent and comparisons
# remain against the actual v0.169 recordings, not yesterday's v0.168 bank.
if manifest.get('previousCombatVersion')!='0.169':
    manifest['previousWeapons']={name:manifest['groups'][name] for name in ['rifle','shotgun','sniper','minigun','hit']}
    manifest['previousCombatVersion']='0.169'
for name,hp,decay,ceiling in [('rifle',160,.045,.38),('shotgun',100,.075,.44),('sniper',130,.09,.46),('minigun',200,.027,.28)]:
    clips=[]
    for take,old in enumerate(manifest['previousWeapons'][name]):
        raw,sr=sf.read(dest/'originals'/old['original'],always_2d=True)
        x=resample(raw,sr,old['pitch'],old['channel']); x=filt(x,hp)
        x=filt(x,480,.8,-6); t=np.arange(len(x))/rate
        # Preserve the leading report: no old 45% transient reduction, no 6.5k cut.
        x*=np.exp(-np.maximum(0,t-.010)/decay)
        meta={k:old[k] for k in ['original','originalSha256','source','downloadFile','downloadSha256','startFrame','frameCount','originalSampleRate','channel','pitch','sourceOverloadFractionFirst100ms']}
        clips.append(save(name,take,x,ceiling,.060,meta))
    manifest['groups'][name]=clips

def component(path,source,label,seconds,hp,gain=1,delay=0):
    raw,sr=sf.read(path,always_2d=True); channel=int(np.argmax(np.mean(raw*raw,axis=0)))
    block=max(1,int(sr*.002)); x=raw[:,channel]; n=len(x)//block
    env=np.sqrt(np.mean(x[:n*block].reshape(n,block)**2,axis=1))
    start=max(0,int(np.flatnonzero(env>env.max()*.12)[0]*block-sr*.003))
    raw=raw[start:start+round(seconds*sr)]
    original=label+'-source.wav'; sf.write(dest/'originals'/original,raw,sr,subtype='DOUBLE')
    pcm=edges(filt(resample(raw,sr,channel=channel),hp),.0015,.025)*gain
    meta={'original':original,'originalSha256':sha(dest/'originals'/original),'source':source,'downloadFile':path.name,
        'downloadSha256':sha(path),'startFrame':start,'frameCount':len(raw),'originalSampleRate':sr,'channel':channel,'gain':gain,'delay':delay,'pitch':1}
    return pcm,meta
rpg=root.parent/'audio-sources-v0168/rpg/Audio'
for name,ceiling,seconds,hp in [('hit',.20,.13,480),('pop',.19,.24,380),('hurt',.26,.22,330)]:
    clips=[]
    for take in range(3):
        layers=[]
        contact=['beltHandle1','beltHandle2','clothBelt'][take]
        if name=='hit':
            layers.append(component(rpg/f'{contact}.ogg','kenney-rpg',f'{name}-{take}-v0170-hit',seconds,hp))
        else:
            layers.append(component(rpg/f'cloth{take+1}.ogg','kenney-rpg',f'{name}-{take}-v0170-cloth',seconds,hp))
            layers.append(component(rpg/f'{contact}.ogg','kenney-rpg',f'{name}-{take}-v0170-contact',.12,hp,.4 if name=='pop' else .9,.008))
        x=np.zeros(round(seconds*rate))
        for pcm,m in layers:
            offset=round(m['delay']*rate); n=min(len(pcm),len(x)-offset); x[offset:offset+n]+=pcm[:n]
        x*=np.exp(-np.arange(len(x))/rate/(.08 if name=='hit' else .14))
        x=filt(x,hp) # second stage removes bass carried by the cloth recordings
        meta={**layers[0][1],'components':[m for pcm,m in layers],'design':'dry-contact-no-pitched-oscillator'}
        clips.append(save(name,take,x,ceiling,.038,meta))
    manifest['groups'][name]=clips
(dest/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(root/'audit/audio-v0170.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
print(json.dumps(report,indent=2))
