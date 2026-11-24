"""Offline asset preparation. Requires numpy + soundfile; runtime/build needs only Node.
Usage: python tools/prepare-recorded-audio.py SOURCE_DIR --decoder-dir PATH
Original full files stay in SOURCE_DIR; lossless source excerpts and provenance are shipped.
"""
import argparse, hashlib, json, sys, wave
from pathlib import Path
args_parser=argparse.ArgumentParser()
args_parser.add_argument('source',type=Path)
args_parser.add_argument('--decoder-dir',type=Path)
args=args_parser.parse_args()
if args.decoder_dir: sys.path.insert(0,str(args.decoder_dir.resolve()))
import numpy as np
import soundfile as sf
root=Path(__file__).resolve().parents[1]
dest=root/'assets/audio'
(dest/'originals').mkdir(parents=True,exist_ok=True)
weapons='Prepared SFX Library/'
groups={
 'rifle': [weapons+s for s in ['AR-15/D_24P.wav','AR-15/D_32P.wav','SKS/U_14P.wav']],
 'shotgun': [weapons+s for s in ['Nova/O_17P.wav','Nova/O_21P.wav','Model 12/K_17P.wav']],
 'sniper': [weapons+s for s in ['Savage 10 .300 Blackout/T_17P.wav','Savage 10 .300 Blackout/T_27P.wav','Mosin Nagant/M_21P.wav']],
 'minigun': [weapons+s for s in ['PPSh/P_16P.wav','PPSh/P_30P.wav','Carl Gustav M45/G_31P.wav']],
 'hit': ['Audio/impactGeneric_light_000.ogg','Audio/impactGeneric_light_001.ogg','Audio/impactGeneric_light_002.ogg'],
 'boom': ['explosion.wav'],
}
durations={'rifle':.40,'shotgun':.65,'sniper':.85,'minigun':.16,'hit':.18,'boom':1.65}
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
manifest={'version':1,'sampleRate':22050,'license':'CC0-1.0','groups':{}}
for name,files in groups.items():
 manifest['groups'][name]=[]
 for take,relative in enumerate(files):
  path=args.source/relative
  samples,sr=sf.read(path,always_2d=True,dtype='float64');mono=samples.mean(axis=1)
  block=max(1,int(sr*.005));env=np.sqrt(np.mean(mono[:len(mono)//block*block].reshape(-1,block)**2,axis=1))
  # First strong transient, not the first arbitrary nonzero sample / handling noise.
  strong=np.flatnonzero(env>env.max()*.35)
  start=max(0,int(strong[0]*block-sr*.008))
  count=min(len(samples)-start,int(sr*durations[name]))
  excerpt=samples[start:start+count]
  original=f'{name}-{take}-source.wav'
  sf.write(dest/'originals'/original,excerpt,sr,subtype='DOUBLE')
  x=excerpt.mean(axis=1);x-=x.mean()
  cutoff=3000 if name in ['hit','boom'] else 4400
  taps=np.arange(-96,97);kernel=np.sinc(2*cutoff/sr*taps)*np.hamming(len(taps));kernel/=kernel.sum()
  x=np.convolve(x,kernel,mode='same')
  rate=22050;n=max(2,round(len(x)*rate/sr))
  x=np.interp(np.arange(n)*sr/rate,np.arange(len(x)),x)
  # 35 Hz DC/sub-bass removal.
  base=0.;a=1-np.exp(-2*np.pi*35/rate)
  for i in range(len(x)): base+=a*(x[i]-base);x[i]-=base
  attack=min(len(x),int(rate*.006));tail=min(len(x),int(rate*(.045 if name=='minigun' else .08)))
  x[:attack]*=np.sin(np.linspace(0,np.pi/2,attack))**2
  x[-tail:]*=np.cos(np.linspace(0,np.pi/2,tail))**2
  rms=float(np.sqrt(np.mean(x*x)));peak=float(np.max(np.abs(x)))
  target=.065 if name=='minigun' else .08 if name=='hit' else .095
  gain=min(4.,.48/max(peak,1e-9),target/max(rms,1e-9));x*=gain;x[0]=x[-1]=0
  pcm=np.round(np.clip(x,-.48,.48)*32767).astype('<i2');filename=f'{name}-{take}.wav'
  with wave.open(str(dest/filename),'wb') as out: out.setnchannels(1);out.setsampwidth(2);out.setframerate(rate);out.writeframes(pcm.tobytes())
  source='kenney-impact' if name=='hit' else 'nenad-explosion' if name=='boom' else 'free-firearm'
  entry={'file':filename,'sha256':sha(dest/filename),'original':original,'originalSha256':sha(dest/'originals'/original),
   'source':source,'downloadFile':relative,'downloadSha256':sha(path),'startFrame':start,'frameCount':count,'originalSampleRate':sr,
   'duration':len(x)/rate,'peak':float(np.max(np.abs(x))),'rms':float(np.sqrt(np.mean(x*x))),'gain':gain}
  manifest['groups'][name].append(entry)
  print(name,take,'start',round(start/sr,3),'duration',round(entry['duration'],3),'peak',round(entry['peak'],3),'rms',round(entry['rms'],3))
(dest/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
