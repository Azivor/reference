"""Give browser entry points a revision whenever code or reference data changes."""
import hashlib,json,pathlib,re
root=pathlib.Path(__file__).resolve().parents[1]
dist=root/'dist'
files=['app.js','swipe.mjs','scroll.mjs','style.css','library.json','collections.json']
revision=hashlib.sha256(b''.join(name.encode()+b'\0'+(dist/name).read_bytes() for name in files)).hexdigest()[:12]
path=dist/'index.html';html=path.read_text()
html,styles=re.subn(r'href="style\.css(?:\?v=[^"]*)?"',f'href="style.css?v={revision}"',html)
html,scripts=re.subn(r'src="app\.js(?:\?v=[^"]*)?"',f'src="app.js?v={revision}"',html)
assert styles==1 and scripts==1,'Expected one stylesheet and application entry point'
path.write_text(html)
print(json.dumps({'asset_revision':revision}))
