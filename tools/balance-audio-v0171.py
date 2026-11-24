"""Offline mix revision. Run after 0.170 preparation; source baseline is immutable.
python tools/balance-audio-v0171.py --decoder-dir ../audio-sources-v0167/python-tools
No source recording is replaced by an invented tone/noise oscillator.
"""
import argparse,hashlib,json,sys,wave
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--decoder-dir',type=Path);a=p.parse_args()
if a.decoder_dir:sys.path.insert(0,str(a.decoder_dir.resolve()))
import numpy as np
import soundfile as sf
root=Path(__file__).resolve().parents[1];dest=root/'assets/audio';rate=44100
baseline=root.parent/'full_source_v0.170/assets/audio'
baseline_manifest=baseline/'manifest.json'
if not baseline_manifest.exists():
    baseline=dest;baseline_manifest=dest/'baseline-v0170.json'
manifest=json.loads(baseline_manifest.read_text(encoding='utf8'))
(dest/'baseline-v0170.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
changed=['rifle','shotgun','sniper','minigun','hit','pop','hurt','breath','wings','slash','gas']
manifest['previousWeapons']={name:manifest['groups'][name] for name in changed}
manifest['previousCombatVersion']='0.170'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def low(x,cutoff,sr=rate):
    t=np.arange(-96,97);k=np.sinc(2*cutoff/sr*t)*np.blackman(len(t));k/=k.sum()
    return np.convolve(x,k,'same')
def high(x,hz):
    # DC/rumble removal only, no aggressive low-mid stripping.
    y=np.zeros_like(x);last=0.;c=1-np.exp(-2*np.pi*hz/rate)
    for i,v in enumerate(x):last+=c*(v-last);y[i]=v-last
    return y
def convert(raw,sr,channel=0,pitch=1):
    x=raw[:,channel];x=low(x,min(sr*.43,16000/pitch),sr)
    return np.interp(np.arange(round(len(x)*rate/sr/pitch))*sr*pitch/rate,np.arange(len(x)),x)
def edges(x):
    n=min(len(x),round(rate*.001));x[:n]*=np.sin(np.linspace(0,np.pi/2,n))**2
    n=min(len(x),round(rate*.012));x[-n:]*=np.cos(np.linspace(0,np.pi/2,n))**2
    x[0]=x[-1]=0;return x
def bands(x,bright=.28,decay=.018):
    body=low(x,4200);air=x-body;t=np.arange(len(x))/rate
    # Keep the first crack; only the high band has the rapid decay.
    return body+air*bright*np.exp(-np.maximum(0,t-.007)/decay)
def metrics(x):
    f=np.fft.rfftfreq(len(x),1/rate);e=abs(np.fft.rfft(x))**2;total=max(1e-20,e.sum())
    return {'bassFraction':float(e[f<250].sum()/total),'midFraction':float(e[(f>=300)&(f<4200)].sum()/total),
        'hissFraction':float(e[f>5000].sum()/total),'peak':float(max(abs(x))),'rms':float(np.sqrt(np.mean(x*x)))}
report=[]
def save(name,i,x,ceiling,meta):
    x=edges(x);gain=min(4,ceiling/max(1e-9,max(abs(x))),.055/max(1e-9,np.sqrt(np.mean(x*x))));x*=gain
    fn=f'{name}-{i}-v0171.wav'
    with wave.open(str(dest/fn),'wb') as out:
        out.setnchannels(1);out.setsampwidth(2);out.setframerate(rate);out.writeframes(np.round(x*32767).astype('<i2').tobytes())
    stats=metrics(x);old=manifest['previousWeapons'][name][i%len(manifest['previousWeapons'][name])]
    before,sr=sf.read(baseline/old['file'],always_2d=True);before=convert(before,sr)
    report.append({'name':name,'take':i,'before':metrics(before),'after':stats})
    return {**meta,'file':fn,'sha256':sha(dest/fn),'sampleRate':rate,'duration':len(x)/rate,'peak':stats['peak'],'rms':stats['rms'],'gain':float(gain)}

for name,seconds,decay,ceiling in [('rifle',.17,.052,.38),('shotgun',.24,.075,.44),('sniper',.29,.090,.46),('minigun',.095,.028,.28)]:
    clips=[]
    for i,old in enumerate(manifest['previousWeapons'][name]):
        raw,sr=sf.read(dest/'originals'/old['original'],always_2d=True)
        x=convert(raw,sr,old['channel'],old['pitch'])[:round(seconds*rate)]
        x=high(x,85);x=bands(x,.30,.012)
        x*=np.exp(-np.maximum(0,np.arange(len(x))/rate-.016)/decay)
        clips.append(save(name,i,x,ceiling,old))
    manifest['groups'][name]=clips

rpg=root.parent/'audio-sources-v0168/rpg/Audio'
def foley(filename,label,seconds,pitch,gain,delay):
    path=rpg/filename;raw,sr=sf.read(path,always_2d=True);channel=int(np.argmax(np.mean(raw*raw,axis=0)))
    x=raw[:,channel];block=max(1,int(sr*.002));n=len(x)//block
    env=np.sqrt(np.mean(x[:n*block].reshape(n,block)**2,axis=1));start=max(0,int(np.flatnonzero(env>env.max()*.18)[0]*block-sr*.003))
    raw=raw[start:start+round(seconds*sr*pitch)];fn=label+'-source.wav';sf.write(dest/'originals'/fn,raw,sr,subtype='DOUBLE')
    meta={'original':fn,'originalSha256':sha(dest/'originals'/fn),'source':'kenney-rpg','downloadFile':filename,
        'downloadSha256':sha(path),'startFrame':start,'frameCount':len(raw),'originalSampleRate':sr,'channel':channel,'pitch':pitch,'gain':gain,'delay':delay}
    x=high(convert(raw,sr,channel,pitch),180);x=bands(x,.12,.010)
    return edges(x)*gain,meta
for name,duration,ceiling in [('hit',.075,.19),('pop',.115,.18),('hurt',.145,.25)]:
    clips=[]
    for i,pitch in enumerate([.96,1.,1.04]):
        layers=[foley('chop.ogg',f'{name}-{i}-v0171-contact',duration,pitch,1,0)]
        if name!='hit':layers.append(foley('dropLeather.ogg',f'{name}-{i}-v0171-body',duration-.015,pitch,.22,.009))
        x=np.zeros(round(rate*duration))
        for pcm,m in layers:
            offset=round(m['delay']*rate);n=min(len(pcm),len(x)-offset);x[offset:offset+n]+=pcm[:n]
        x*=np.exp(-np.arange(len(x))/rate/.050)
        meta={**layers[0][1],'components':[m for _,m in layers],'design':'short-contact-no-friction-tail'}
        clips.append(save(name,i,x,ceiling,meta))
    manifest['groups'][name]=clips

# Continuous effects retain their identity: reduce excess air, not the whole mix.
for name,bright in [('breath',.18),('wings',.12),('slash',.22),('gas',.25)]:
    clips=[]
    for i,old in enumerate(manifest['previousWeapons'][name]):
        raw,sr=sf.read(baseline/old['file'],always_2d=True);x=convert(raw,sr)
        body=low(x,3200);x=body+(x-body)*bright
        # Never normalize the attenuated continuous effect back up.
        clips.append(save(name,i,x,min(old['peak'],float(max(abs(x)))),{**old,'processedFrom':{'file':old['file'],'sha256':old['sha256'],'revision':'0.170'}}))
    manifest['groups'][name]=clips
(dest/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(root/'audit/audio-v0171.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
# Validate design intent, not subjective quality. Fail instead of silently shipping
# an accidentally bright or inaudible file after a future recipe edit.
for row in report:
    m=row['after'];assert m['peak']<=.480001 and m['rms']>.003,row
    if row['name'] in ['rifle','shotgun','sniper','minigun']:
        assert m['hissFraction']<row['before']['hissFraction']*.4 and m['midFraction']>.6,row
    if row['name'] in ['hit','pop','hurt']:
        assert m['hissFraction']<.06 and m['bassFraction']<.10,row
# Offline audition of the same prepared PCM, with production category/voice/master
# gains. This is a controlled mix, not a recording of live browser gameplay.
demo=np.zeros(rate*10)
def audition(name,variant,at,level):
    clip=manifest['groups'][name][variant%len(manifest['groups'][name])]
    pcm,sr=sf.read(dest/clip['file'],always_2d=True);pcm=convert(pcm,sr) if sr!=rate else pcm[:,0]
    offset=round(at*rate);n=min(len(pcm),len(demo)-offset)
    demo[offset:offset+n]+=pcm[:n]*level*.40*.72
for section,(weapon,gap,count) in enumerate([('rifle',.28,6),('shotgun',.6,3),('sniper',.7,3),('minigun',.085,18)]):
    for i in range(count):
        at=section*2.5+.15+i*gap;audition(weapon,i,at,.82)
        if i%2==0:audition('hit' if i%4==0 else 'pop',i,at+.04,.60*(.55 if i%4==0 else .7)/1.08)
assert max(abs(demo))<.8
with wave.open(str(root/'audit/combat-preview-v0171.wav'),'wb') as out:
    out.setnchannels(1);out.setsampwidth(2);out.setframerate(rate);out.writeframes(np.round(demo*32767).astype('<i2').tobytes())
print(json.dumps(report,indent=2))
