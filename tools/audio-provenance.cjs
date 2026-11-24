// Release/build boundary: both audible banks must have known provenance.
const CC0=new Set(['independent-hits','rubberduck-creatures','kenney-scifi','kenney-rpg','kenney-interface','kenney-jingles','kurt-gunshots','nenad-explosion','free-firearm','kenney-impact','trazzz123-roar','antum-fire','antum-wings','bart-steam','jwiese-engine']);
function validate(manifest){
 if(manifest.releaseStatus!=='no-user-reference-audio')throw Error('Audio release status not cleared of user references');
 if(/bullet-time|jutkiy-zvuk|user-reference|publication permission unverified/i.test(JSON.stringify([manifest.groups,manifest.previousWeapons])))throw Error('Reference audio is not allowed in either bank');
 for(const groups of [manifest.groups,manifest.previousWeapons||{}])for(const clips of Object.values(groups))for(const clip of clips){
  const components=clip.components||[];
  for(const component of [...(clip.source||!components.length?[clip]:[]),...components]){
   if(!['project-original-synthesis','project-original-effects','project-original-comfort','project-original-precision','project-original-readable','project-original-projectile','project-original-sniper','project-original-arsenal'].includes(component.source)&&!CC0.has(component.source))throw Error('Unregistered audio source: '+component.source);
  }
 }
 for(const name of ['rifle','shotgun','sniper','minigun','turret']){
  const clips=manifest.groups[name];if(clips?.length!==8||clips.some(c=>c.source!==(name==='sniper'?'project-original-sniper':'project-original-comfort')))throw Error('Expected eight original weapon designs: '+name);
 }
 return true;
}
module.exports={validate};
