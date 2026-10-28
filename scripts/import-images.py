"""Import credited official references and make local, aspect-preserving previews."""
import concurrent.futures, hashlib, io, json, pathlib, shutil, subprocess, sys, urllib.request
from PIL import Image, ImageOps

root=pathlib.Path(__file__).resolve().parents[1]
raw_dir=root/'dist/assets/originals'; full_dir=root/'dist/assets/images'; thumb_dir=root/'dist/assets/previews'
for d in (raw_dir,full_dir,thumb_dir): d.mkdir(parents=True,exist_ok=True)
source_path=pathlib.Path(sys.argv[1]) if len(sys.argv)>1 else root/'data/references.json'
items=json.loads(source_path.read_text())

def process(item):
    item=dict(item)
    company=item['company'].lower()
    item['company']='grok' if ('grok' in company or 'xai' in company or 'x.ai' in company) else company
    identity=item.get('imageUrl') or item['id']
    key=hashlib.sha256(identity.encode()).hexdigest()[:16]
    cache=list(raw_dir.glob(key+'.*'))
    if cache: data=cache[0].read_bytes()
    elif item.get('localPath'):
        local=pathlib.Path(item['localPath']);local=local if local.is_absolute() else root/local
        data=local.read_bytes()
    else:
        request=urllib.request.Request(item['imageUrl'],headers={'User-Agent':'Mozilla/5.0'})
        with urllib.request.urlopen(request,timeout=45) as response:data=response.read()
    im=Image.open(io.BytesIO(data))
    ext={'JPEG':'jpg','PNG':'png','WEBP':'webp','GIF':'gif','AVIF':'avif'}.get(im.format,'img')
    original=raw_dir/(key+'.'+ext)
    if not original.exists():original.write_bytes(data)
    im=ImageOps.exif_transpose(im).convert('RGB')
    item['width'],item['height']=im.size
    if im.width<700 and im.height<700:raise ValueError('Image is below the library resolution threshold')
    # Distinct URLs prevent older cached encodings from surviving a release.
    for field,target,limit,quality in (
        ('thumbnailSmall',thumb_dir,480,76),('thumbnail',thumb_dir,960,80),
        ('medium',full_dir,1440,86),('image',full_dir,2560,88)):
        path=target/(key+f'-{limit}-q{quality}.webp')
        copy=im.copy();copy.thumbnail((limit,limit))
        if not path.exists():copy.save(path,'WEBP',quality=quality,method=6)
        item[field]=path.relative_to(root/'dist').as_posix()
        item[field+'Width']=copy.width
    item['original']='assets/originals/'+original.name
    item.pop('localPath',None)
    if item['company'] not in ['anthropic','openai','grok','perplexity']:raise ValueError('Unexpected company')
    return item

results=[];failures=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    futures={pool.submit(process,item):index for index,item in enumerate(items)}
    for f in concurrent.futures.as_completed(futures):
        index=futures[f]
        try:results.append((index,f.result()))
        except Exception as e:failures.append({'id':items[index].get('id'),'error':str(e)})
results=[x[1] for x in sorted(results)]
(root/'dist/library.json').write_text(json.dumps(results,indent=2,ensure_ascii=False)+'\n')
print(json.dumps({'imported':len(results),'counts':{c:sum(r['company']==c for r in results) for c in ['anthropic','openai','grok','perplexity']},'failures':failures}))
if failures:sys.exit(1)

subprocess.run([sys.executable,str(root/"scripts/version-assets.py")],check=True)
