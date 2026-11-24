"""Pack native Canvas frames as an animation for review, not a browser recording."""
from pathlib import Path
import hashlib
import json
from PIL import Image

root = Path(__file__).resolve().parent.parent
directory = root / 'audit/boar-motion-v0202'
manifest = json.loads((directory / 'complete.json').read_text())
assert len(manifest) == 78
frames = []
for entry in manifest:
    file = directory / entry['file']
    assert hashlib.sha256(file.read_bytes()).hexdigest() == entry['sha256']
    frames.append(Image.open(file).convert('RGB').quantize(colors=128))
frames[0].save(root / 'audit/boar-motion-v0202.gif', save_all=True,
               append_images=frames[1:], duration=[33] * 77 + [500], loop=0, disposal=2)
print('Encoded boar attack preview from 78 verified native frames.')
