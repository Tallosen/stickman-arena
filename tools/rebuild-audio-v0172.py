"""Complete source-led replacement. User references are QA-only until rights confirmed.
python tools/rebuild-audio-v0172.py --decoder-dir ../audio-sources-v0167/python-tools
"""
import argparse,hashlib,json,sys,wave
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--decoder-dir',type=Path);args=p.parse_args()
if args.decoder_dir:sys.path.insert(0,str(args.decoder_dir.resolve()))
import numpy as np
import soundfile as sf
root=Path(__file__).resolve().parents[1];dest=root/'assets/audio';rate=44100
baseline=root.parent/'full_source_v0.171/assets/audio/manifest.json'
if not baseline.exists():baseline=dest/'baseline-v0171.json'
old=json.loads(baseline.read_text(encoding='utf8'))
(dest/'baseline-v0171.json').write_text(json.dumps(old,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
manifest={'version':3,'sampleRate':rate,'license':'mixed-see-AUDIO_CREDITS','releaseStatus':'QA-only-user-reference-rights-unverified','groups':{},'previousWeapons':old['groups'],'previousCombatVersion':'0.171'}
for clips in manifest['previousWeapons'].values():
    for c in clips:c.setdefault('sampleRate',old['sampleRate'])
packs=root.parent
def layer(path,source,seconds,gain=1,pitch=1,start=None,delay=0):return dict(path=Path(path),source=source,seconds=seconds,gain=gain,pitch=pitch,start=start,delay=delay)
def ref(n,seconds,**kw):return layer(dest/f'references/bullet-time-{n}.mp3','user-reference',seconds,**kw)
def sci(n,seconds,**kw):return layer(packs/f'audio-sources-v0172/scifi/Audio/{n}.ogg','kenney-scifi',seconds,**kw)
def creature(n,seconds,**kw):return layer(packs/f'audio-sources-v0172/creatures/{n}.ogg','rubberduck-creatures',seconds,**kw)
def hit(n,seconds,**kw):return layer(packs/f'audio-sources-v0172/hits/hits/hit{n:02}.mp3.flac','independent-hits',seconds,**kw)
def ui(n,seconds,**kw):return layer(packs/f'audio-sources-v0168/ui/Audio/{n}.ogg','kenney-interface',seconds,**kw)
def rpg(n,seconds,**kw):return layer(packs/f'audio-sources-v0168/rpg/Audio/{n}.ogg','kenney-rpg',seconds,**kw)
def music(n,seconds=1.6,**kw):return layer(packs/f'audio-sources-v0168/jingles/Audio/Pizzicato jingles/jingles_PIZZI{n:02}.ogg','kenney-jingles',seconds,**kw)
def one(peak,*layers):return peak,[list(layers)]
designs={
 'rifle':(.40,[[ref(11,.14,start=s)] for s in [.055,.20,.35]]),
 'minigun':(.30,[[ref(11,.135,start=s,pitch=1.12)] for s in [.055,.20,.35]]),
 'shotgun':(.44,[[ref(15,.58,start=.052,pitch=p)] for p in [.96,1.,1.035]]),
 'sniper':(.46,[[ref(15,.43,start=.052,pitch=p)] for p in [1.08,1.10,1.12]]),
 'hit':(.19,[[hit(n,.115)] for n in [10,12,14]]),
 'pop':(.20,[[hit(n,.16),rpg('dropLeather',.13,gain=.12,delay=.035)] for n in [12,13,14]]),
 'hurt':(.27,[[hit(n,.19),creature('hurt_02',.16,gain=.10,delay=.025)] for n in [10,11,14]]),
 'boom':(.42,[[sci(f'explosionCrunch_{n:03}',.72)] for n in range(3)]),
 'ice':one(.25,ui('glass_001',.35),ui('confirmation_002',.3,delay=.075,gain=.25)),
 'bite':one(.19,creature('eat_03',.13),hit(12,.07,gain=.20)),
 'build':one(.23,rpg('metalClick',.10),rpg('metalLatch',.12,delay=.075,gain=.30)),
 'click':(.13,[[ui(f'click_{n:03}',.07)] for n in [2,3,4]]),
 'level':one(.30,music(2,1.2)),
 'chest':one(.30,rpg('handleCoins2',.25,gain=.35),music(6,1.1,delay=.09)),
 'heal':one(.24,ui('confirmation_003',.4),music(8,.55,gain=.25,delay=.1)),
 'dead':one(.29,music(14,1.35)),
 'revive':one(.30,music(9,1.1)),
 'victory':one(.33,music(10,1.85)),
 'boss':one(.33,creature('roar_03',.85),sci('forceField_001',.25,gain=.18,delay=.12)),
 'ultimate':one(.34,sci('forceField_002',.45),ui('confirmation_004',.35,gain=.3,delay=.25)),
 'dragon':(.32,[[creature(f'roar_{n:02}',1.1)] for n in [1,2,3]]),
 'breath':(.28,[[sci(f'thrusterFire_{n:03}',.48)] for n in range(3)]),
 'airstrike':one(.30,sci('spaceEngineSmall_001',.6),sci('explosionCrunch_003',.45,gain=.5,delay=.48)),
 'gas':one(.22,rpg('metalClick',.06,gain=.35),sci('thrusterFire_004',.32,gain=.65,delay=.065)),
 'tank':one(.31,sci('engineCircular_002',.6),rpg('metalClick',.09,gain=.25,delay=.08)),
 'turret':one(.25,ref(11,.12,start=.20,pitch=1.18)),
 'slash':one(.19,rpg('knifeSlice2',.18)),
 'chirp':one(.15,creature('cute_04',.20)),
 'petDown':one(.19,creature('cute_08',.27)),
 'wings':one(.17,rpg('cloth4',.16),rpg('cloth3',.10,delay=.055,gain=.15)),
}
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
report=[]
for name,(ceiling,takes) in designs.items():
    clips=[]
    for take,layers in enumerate(takes):
        parts=[];provenance=[]
        for i,l in enumerate(layers):
            data,sr=sf.read(l['path'],always_2d=True,dtype='float64');channel=0
            if l['start'] is None:
                block=max(1,int(sr*.002));mono=data[:,channel];n=len(mono)//block
                env=np.sqrt(np.mean(mono[:n*block].reshape(n,block)**2,axis=1))
                first=max(0,int(np.flatnonzero(env>env.max()*.08)[0]*block-sr*.003))
            else:first=round(l['start']*sr)
            raw=data[first:first+round(l['seconds']*sr*l['pitch'])];assert len(raw)>64
            original=f'{name}-{take}-v0172-layer{i}.wav';sf.write(dest/'originals'/original,raw,sr,subtype='DOUBLE')
            m={k:l[k] for k in ['source','gain','pitch','delay']}
            m.update(original=original,originalSha256=sha(dest/'originals'/original),downloadFile=l['path'].name,downloadSha256=sha(l['path']),startFrame=first,frameCount=len(raw),originalSampleRate=sr,channel=channel)
            provenance.append(m)
            x=raw[:,channel].copy();x-=x.mean()
            # Anti-alias only: retain source timbre, no sweeping EQ or old bass recipes.
            if sr*l['pitch']>rate:
                t=np.arange(-96,97);cut=.44*rate/l['pitch'];k=np.sinc(2*cut/sr*t)*np.blackman(len(t));k/=k.sum();x=np.convolve(x,k,'same')
            count=round(len(x)*rate/sr/l['pitch']);x=np.interp(np.arange(count)*sr*l['pitch']/rate,np.arange(len(x)),x)
            attack=min(len(x),round(rate*.001));tail=min(len(x),round(rate*(.015 if name in ['rifle','minigun','hit','click','turret'] else .035)))
            x[:attack]*=np.sin(np.linspace(0,np.pi/2,attack))**2;x[-tail:]*=np.cos(np.linspace(0,np.pi/2,tail))**2
            parts.append((round(l['delay']*rate),x*l['gain']))
        count=min(round(rate*2.4),max(offset+len(x) for offset,x in parts));x=np.zeros(count)
        for offset,pcm in parts:
            n=min(len(pcm),count-offset);x[offset:offset+n]+=pcm[:n]
        rms=np.sqrt(np.mean(x*x));gain=min(2,ceiling/max(1e-9,max(abs(x))),(.085 if name in ['rifle','shotgun','sniper','minigun','boom'] else .060)/max(1e-9,rms));x*=gain;x[0]=x[-1]=0
        fn=f'{name.lower()}-{take}-v0172.wav'
        with wave.open(str(dest/fn),'wb') as out:
            out.setnchannels(1);out.setsampwidth(2);out.setframerate(rate);out.writeframes(np.round(x*32767).astype('<i2').tobytes())
        stats={'duration':len(x)/rate,'peak':float(max(abs(x))),'rms':float(np.sqrt(np.mean(x*x)))}
        assert stats['peak']<=.480001 and stats['rms']>1e-4,(name,stats)
        entry={**provenance[0],**stats,'file':fn,'sha256':sha(dest/fn),'sampleRate':rate,'components':provenance,'gain':float(gain),'design':'full-rebuild-source-led-v0172'}
        if any(m['source']=='user-reference' for m in provenance):entry['rights']='user-supplied; publication permission unverified'
        clips.append(entry);report.append({'name':name,'take':take,**stats})
    manifest['groups'][name]=clips
manifest['eventCount']=len(designs)
(dest/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(root/'audit/audio-v0172.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
# Audition of prepared reference-led weapons. Production voice/category/master
# gains, no extra loudness boost. Not a capture of live gameplay.
demo=np.zeros(rate*10)
for section,(name,gap,count) in enumerate([('rifle',.32,5),('shotgun',.78,3),('sniper',.78,3),('minigun',.09,18)]):
    for i in range(count):
        clip=manifest['groups'][name][i%3];pcm,sr=sf.read(dest/clip['file'])
        offset=round((section*2.5+.10+i*gap)*rate);n=min(len(pcm),len(demo)-offset)
        demo[offset:offset+n]+=pcm[:n]*.40*.82*.72
assert max(abs(demo))<.8
with wave.open(str(root/'audit/weapon-preview-v0172.wav'),'wb') as out:
    out.setnchannels(1);out.setsampwidth(2);out.setframerate(rate);out.writeframes(np.round(demo*32767).astype('<i2').tobytes())
print('Rebuilt',len(designs),'events;',sum(map(len,manifest['groups'].values())),'clips; QA reference rights pending.')
