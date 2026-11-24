"""v0.169 weapon replacement; numpy/soundfile are offline-only dependencies.
Run after prepare-recorded-audio.py and extend-recorded-audio.py.
Preserves other effects and archives v0.168 weapon PCM for honest QA comparison.
"""
import argparse, hashlib, json, sys, wave
from pathlib import Path
p=argparse.ArgumentParser()
p.add_argument('source',type=Path)
p.add_argument('--decoder-dir',type=Path)
a=p.parse_args()
if a.decoder_dir: sys.path.insert(0,str(a.decoder_dir.resolve()))
import numpy as np
import soundfile as sf
root=Path(__file__).resolve().parents[1]
dest=root/'assets/audio'
manifest=json.loads((dest/'manifest.json').read_text(encoding='utf8'))
rate=44100
def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def biquad(x,kind,f,q,db=0):
    w=2*np.pi*f/rate; c=np.cos(w); s=np.sin(w); alpha=s/(2*q); A=10**(db/40)
    if kind=='highpass': b=[(1+c)/2,-(1+c),(1+c)/2]; d=[1+alpha,-2*c,1-alpha]
    else: b=[1+alpha*A,-2*c,1-alpha*A]; d=[1+alpha/A,-2*c,1-alpha/A]
    b=np.array(b)/d[0]; d=np.array(d)/d[0]; y=np.zeros_like(x); z1=z2=0.
    for i,v in enumerate(x):
        out=b[0]*v+z1; z1=b[1]*v-d[1]*out+z2; z2=b[2]*v-d[2]*out; y[i]=out
    return y
designs={
    'rifle':('pistol.wav',[.144,.954,1.746],.24,1.,.058,.38),
    'shotgun':('powder.wav',[.146,1.554,2.944],.34,.88,.100,.44),
    'sniper':('powder.wav',[.146,1.554,2.944],.42,1.08,.135,.46),
    'minigun':('pistol.wav',[.144,.954,1.746],.115,1.10,.032,.28),
}
report=[]
manifest.setdefault('previousWeapons',{})
for name,(filename,starts,duration,pitch,decay,ceiling) in designs.items():
    if name not in manifest['previousWeapons']:
        manifest['previousWeapons'][name]=[]
        for old in manifest['groups'][name]:
            archived=dict(old); archived['file']=old['file'].replace('.wav','-v0168.wav')
            (dest/archived['file']).write_bytes((dest/old['file']).read_bytes())
            archived['sampleRate']=22050
            manifest['previousWeapons'][name].append(archived)
    path=a.source/filename; samples,sr=sf.read(path,always_2d=True,dtype='float64')
    clips=[]
    for take,expected in enumerate(starts):
        # Choose a single cleaner microphone, never phase-cancel stereo into mono.
        probe=samples[int((expected-.008)*sr):int((expected+.10)*sr)]
        channel=int(np.argmin(np.mean(np.abs(probe)>.999,axis=0)))
        first=int((expected-.012)*sr); last=int((expected+.018)*sr)
        segment=np.abs(samples[first:last,channel]); onset=first+int(np.flatnonzero(segment>segment.max()*.12)[0])
        start=max(0,onset-round(sr*.002)); count=round(sr*duration*pitch)
        raw=samples[start:start+count]; mono=raw[:,channel].copy()
        clipped=float(np.mean(np.abs(mono[:int(.1*sr)])>.999))
        if clipped>.0005: raise ValueError(f'Reject overloaded take: {name}/{take}: {clipped}')
        original=f'{name}-{take}-v0169-source.wav'; sf.write(dest/'originals'/original,raw,sr,subtype='DOUBLE')
        # Anti-alias only. Previous 4.4kHz blanket cutoff removed the shot's definition.
        taps=np.arange(-192,193); cutoff=12500/pitch
        kernel=np.sinc(2*cutoff/sr*taps)*np.blackman(len(taps)); kernel/=kernel.sum()
        mono=np.convolve(mono,kernel,mode='same')
        t=np.arange(round(duration*rate))/rate
        x=np.interp(t*sr*pitch,np.arange(len(mono)),mono)
        x=biquad(x,'highpass',95 if name=='minigun' else 70,.707)
        x=biquad(x,'peak',360,.75,-4.5) # reduce hollow low-mid resonance, not all treble
        x=biquad(x,'peak',6500,.65,-3.0) # broad restraint on hiss; no distortion/saturation
        # Tame the sub-ms needle separately from the body, with a smooth linear
        # envelope (not waveshaping). Final peak normalization then retains body.
        u=np.clip((t-.003)/.006,0,1)
        x*=.55+.45*u*u*(3-2*u)
        x*=np.exp(-np.maximum(0,t-.018)/decay)
        attack=round(rate*.0006); tail=round(rate*.018)
        x[:attack]*=np.sin(np.linspace(0,np.pi/2,attack))**2
        x[-tail:]*=np.cos(np.linspace(0,np.pi/2,tail))**2
        gain=min(4,ceiling/max(np.max(np.abs(x)),1e-9)); x*=gain; x[0]=x[-1]=0
        pcm=np.round(x*32767).astype('<i2'); output=f'{name}-{take}-v0169.wav'
        with wave.open(str(dest/output),'wb') as out:
            out.setnchannels(1); out.setsampwidth(2); out.setframerate(rate); out.writeframes(pcm.tobytes())
        entry={'file':output,'sha256':sha(dest/output),'sampleRate':rate,'original':original,
            'originalSha256':sha(dest/'originals'/original),'source':'kurt-gunshots',
            'downloadFile':filename,'downloadSha256':sha(path),'startFrame':start,'frameCount':len(raw),
            'originalSampleRate':sr,'channel':channel,'pitch':pitch,'duration':len(x)/rate,
            'peak':float(np.max(np.abs(x))),'rms':float(np.sqrt(np.mean(x*x))),'gain':float(gain),
            'sourceOverloadFractionFirst100ms':clipped}
        clips.append(entry)
        fft=np.abs(np.fft.rfft(x))**2; f=np.fft.rfftfreq(len(x),1/rate)
        report.append({'name':name,'take':take,'channel':channel,'onsetSeconds':onset/sr,
            'sourceOverloadFractionFirst100ms':clipped,'peak':entry['peak'],'rms':entry['rms'],
            'highBandEnergyFraction':float(fft[(f>4400)&(f<12000)].sum()/fft.sum()),
            'lateEnergyFraction':float(np.sum(x[int(.15*rate):]**2)/np.sum(x*x))})
    manifest['groups'][name]=clips
manifest['version']=2
(dest/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(root/'audit/audio-v0169.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
print(json.dumps(report,indent=2))
