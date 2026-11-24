"""Append v0.168 CC0 sound designs; never rebuild/change the six v0.167 categories.
python tools/extend-recorded-audio.py SOURCE_DIR --decoder-dir PATH
Requires numpy and soundfile only for this offline preparation step.
"""
import argparse,hashlib,json,sys,wave
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('--decoder-dir',type=Path);args=p.parse_args()
if args.decoder_dir:sys.path.insert(0,str(args.decoder_dir.resolve()))
import numpy as np
import soundfile as sf
root=Path(__file__).resolve().parents[1];dest=root/'assets/audio';rate=22050
manifest=json.loads((dest/'manifest.json').read_text(encoding='utf8'))
def layer(file,source,gain=1,delay=0,pitch=1,seconds=2.2,start=0):return dict(file=file,source=source,gain=gain,delay=delay,pitch=pitch,seconds=seconds,start=start)
def ui(file,**kw):return layer('ui/Audio/'+file+'.ogg','kenney-interface',**kw)
def rpg(file,**kw):return layer('rpg/Audio/'+file+'.ogg','kenney-rpg',**kw)
def music(n,**kw):return layer(f'jingles/Audio/Pizzicato jingles/jingles_PIZZI{n:02}.ogg','kenney-jingles',**kw)
steam=lambda **kw:layer('steam hisses - Marker #1.wav','bart-steam',**kw)
# name -> peak ceiling, RMS ceiling, low-pass cutoff, layered sample design.
designs={
 'dragon':(.34,.085,2400,[layer('monster_roar.wav','trazzz123-roar',seconds=1.9,start=None,pitch=.94)]),
 'breath':(.30,.070,2400,[layer('fire-1.wav','antum-fire',seconds=.95),steam(gain=.42,seconds=.8,pitch=.85)]),
 'wings':(.24,.050,1900,[layer('wings/wings_flap_large.flac','antum-wings',seconds=.34,start=None,pitch=.85)]),
 'click':(.14,.025,2600,[ui('click_001',seconds=.2)]),
 'chest':(.30,.070,3000,[rpg('metalLatch',gain=.4,seconds=.35),rpg('handleCoins',delay=.10,gain=.8,seconds=.65),music(0,delay=.2,gain=.3)]),
 'level':(.32,.070,3600,[music(1)]),
 'heal':(.25,.055,3200,[music(4)]),
 'victory':(.34,.070,3800,[music(7)]),
 'dead':(.30,.055,2700,[music(16,pitch=.78)]),
 'ultimate':(.36,.080,3400,[ui('maximize_001',pitch=.7,gain=.55),music(3,delay=.18,gain=.65)]),
 'ice':(.24,.055,3300,[ui('glass_001',gain=.7),music(5,delay=.06,gain=.5)]),
 'gas':(.26,.065,2300,[rpg('metalClick',gain=.2),steam(delay=.06,seconds=1.05)]),
 'tank':(.30,.075,2500,[layer('engine-start.flac','jwiese-engine',seconds=1.65),rpg('metalLatch',delay=.12,gain=.3)]),
 'slash':(.20,.045,2900,[rpg('knifeSlice',seconds=.45)]),
 'build':(.22,.050,2500,[rpg('metalLatch',gain=.6),rpg('beltHandle1',delay=.08,gain=.8,seconds=.5)]),
}
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
for name,(ceiling,target,cutoff,layers) in designs.items():
 parts=[];provenance=[]
 for i,l in enumerate(layers):
  source=args.source/l['file'];data,sr=sf.read(source,always_2d=True,dtype='float64')
  start=l['start']
  if start is None:
   mono=data.mean(axis=1);n=max(1,int(sr*.01));env=np.sqrt(np.mean(mono[:len(mono)//n*n].reshape(-1,n)**2,axis=1))
   start=max(0,float(np.flatnonzero(env>env.max()*.15)[0]*n/sr)-.015)
  first=int(start*sr);data=data[first:first+int(sr*l['seconds'])];assert len(data)>256
  original=f'{name}-0-layer{i}-source.wav';sf.write(dest/'originals'/original,data,sr,subtype='DOUBLE')
  provenance.append(dict(original=original,originalSha256=sha(dest/'originals'/original),source=l['source'],downloadFile=l['file'],downloadSha256=sha(source),startFrame=first,frameCount=len(data),originalSampleRate=sr,gain=l['gain'],pitch=l['pitch'],delay=l['delay']))
  x=data.mean(axis=1);x-=x.mean();t=np.arange(-96,97);kernel=np.sinc(2*cutoff/sr*t)*np.hamming(len(t));kernel/=kernel.sum();x=np.convolve(x,kernel,mode='same')
  count=round(len(x)*rate/sr/l['pitch']);x=np.interp(np.arange(count)*sr*l['pitch']/rate,np.arange(len(x)),x)
  # Smooth each component as well as the completed mix.
  attack=min(len(x),int(rate*.012));tail=min(len(x),int(rate*.060));x[:attack]*=np.sin(np.linspace(0,np.pi/2,attack))**2;x[-tail:]*=np.cos(np.linspace(0,np.pi/2,tail))**2
  parts.append((int(l['delay']*rate),x*l['gain']))
 count=min(int(rate*2.4),max(offset+len(x) for offset,x in parts));mixed=np.zeros(count)
 for offset,x in parts:
  length=min(len(x),count-offset)
  if length>0:mixed[offset:offset+length]+=x[:length]
 dc=0.;a=1-np.exp(-2*np.pi*35/rate)
 for i in range(len(mixed)):dc+=a*(mixed[i]-dc);mixed[i]-=dc
 tail=min(len(mixed),int(rate*.10));mixed[-tail:]*=np.cos(np.linspace(0,np.pi/2,tail))**2
 gain=min(4,ceiling/max(1e-9,np.max(np.abs(mixed))),target/max(1e-9,np.sqrt(np.mean(mixed*mixed))));mixed*=gain;mixed[0]=mixed[-1]=0
 filename=f'{name}-0.wav';pcm=np.round(mixed*32767).astype('<i2')
 with wave.open(str(dest/filename),'wb') as out:out.setnchannels(1);out.setsampwidth(2);out.setframerate(rate);out.writeframes(pcm.tobytes())
 manifest['groups'][name]=[dict(file=filename,sha256=sha(dest/filename),original=provenance[0]['original'],originalSha256=provenance[0]['originalSha256'],components=provenance,duration=len(mixed)/rate,peak=float(np.max(np.abs(mixed))),rms=float(np.sqrt(np.mean(mixed*mixed))),gain=gain,cutoff=cutoff)]
 print(name,round(len(mixed)/rate,3),round(float(np.max(np.abs(mixed))),3))
(dest/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
