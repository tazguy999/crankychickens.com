#!/usr/bin/env python3
"""Copy the Supa Recap scripts into booth.html.

The Recording Booth is not allowed to load anything over the network (that is what
keeps the kids' recordings on the device), so the episode lines are written into the
page itself. Run this after editing shows/supa-recap/episodes.json:

    python3 scripts/sync-booth-scripts.py
"""
import json, re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
data = json.loads((root / 'shows/supa-recap/episodes.json').read_text(encoding='utf8'))
eps = [{'id': e['id'], 'n': e['number'], 't': e['title'],
        'lines': [[l['who'], l['text']] for l in e['lines']]} for e in data['episodes']]
blob = json.dumps(eps, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
page = root / 'booth.html'
html = page.read_text(encoding='utf8')
pat = re.compile(r'(/\*SCRIPTS:START\*/).*?(/\*SCRIPTS:END\*/)', re.S)
if not pat.search(html):
    sys.exit('booth.html has no SCRIPTS markers')
new = pat.sub(lambda m: m.group(1) + blob + m.group(2), html)
if '--check' in sys.argv:
    sys.exit(0 if new == html else 'booth.html scripts are out of date: run scripts/sync-booth-scripts.py')
page.write_text(new, encoding='utf8')
print('booth.html: %d episodes, %d lines' % (len(eps), sum(len(e['lines']) for e in eps)))
