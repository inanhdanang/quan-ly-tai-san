"""Pin Index.html to an already committed App.js; no network calls or publication."""
from pathlib import Path
import base64, hashlib, json, re, subprocess, sys
root = Path(__file__).resolve().parents[1]
if len(sys.argv) != 2:
    raise SystemExit('Usage: python scripts/pin-client.py <commit-containing-App.js>')
commit = subprocess.check_output(['git', 'rev-parse', '--verify', sys.argv[1] + '^{commit}'], cwd=root, text=True).strip()
published = subprocess.check_output(['git', 'show', commit + ':App.js'], cwd=root)
if published != (root / 'App.js').read_bytes():
    raise SystemExit('App.js differs from this commit. Commit the client first, then pin its exact revision.')
build = {'version': '2.0.2', 'commit': commit,
         'url': 'https://cdn.jsdelivr.net/gh/inanhdanang/quan-ly-tai-san@' + commit + '/App.js',
         'integrity': 'sha384-' + base64.b64encode(hashlib.sha384(published).digest()).decode()}
html = (root / 'Index.html').read_text()
html, count = re.subn(r'<script src="https://cdn\.jsdelivr\.net/gh/[^"\s]+/App\.js"[^>]*></script>',
                     '<script src="' + build['url'] + '" integrity="' + build['integrity'] + '" crossorigin="anonymous"></script>', html)
if count != 1:
    raise SystemExit('Expected exactly one client script tag in Index.html.')
(root / 'Index.html').write_text(html)
(root / 'client-build.json').write_text(json.dumps(build, indent=2) + '\n')
print('Pinned client:', commit)
