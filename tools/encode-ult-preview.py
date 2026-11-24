"""Encode the native-rendered test frames into a compact animation, not a browser recording."""
from pathlib import Path
from PIL import Image
import hashlib
import json

root = Path(__file__).resolve().parent.parent
files = sorted((root / 'audit/ultimate-motion-v0180').glob('*.png'))
assert len(files) == 60, 'Render the complete motion test first'
manifest = json.loads((root / 'audit/ultimate-motion-v0180/complete.json').read_text())
assert len(manifest) == 60
for entry, file in zip(manifest, files):
    assert entry['file'] == file.name and entry['sha256'] == hashlib.sha256(file.read_bytes()).hexdigest(), 'Incomplete or stale frame sequence'
frames = [Image.open(f).convert('RGB').resize((1200, 510)).quantize(colors=128) for f in files]
frames[0].save(root / 'audit/ultimate-motion-v0180.gif', save_all=True,
               append_images=frames[1:], duration=[40]*59+[650], loop=0, disposal=2)
print('Encoded 60 native-rendered frames; no live browser capture.')
