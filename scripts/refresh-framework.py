#!/usr/bin/env python3
"""
Cranky Chickens — Framework Refresh Script
Reads FRAMEWORK.md and regenerates hatch/index.html and hatch/ai-ops/index.html
Run: python3 scripts/refresh-framework.py
"""
import re, sys, os, json
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRAMEWORK = os.path.join(ROOT, 'FRAMEWORK.md')
HATCH_INDEX = os.path.join(ROOT, 'hatch', 'index.html')
HATCH_AIOPS = os.path.join(ROOT, 'hatch', 'ai-ops', 'index.html')
SCORES = os.path.join(ROOT, 'services', 'scores.json')

CHECKS_PASSED = 0
CHECKS_FAILED = 0

def ok(msg): global CHECKS_PASSED; CHECKS_PASSED+=1; print(f'  ✅ {msg}')
def fail(msg): global CHECKS_FAILED; CHECKS_FAILED+=1; print(f'  ❌ {msg}')
def section(msg): print(f'\n{msg}')

# ── READ FRAMEWORK.md ──
def read_framework():
    with open(FRAMEWORK) as f:
        content = f.read()

    # Extract metadata
    version = re.search(r'\*\*Version:\*\* (.+)', content)
    updated = re.search(r'\*\*Updated:\*\* (.+)', content)
    version = version.group(1).strip() if version else '1.0'
    updated = updated.group(1).strip() if updated else datetime.now().strftime('%Y-%m-%d')

    # Extract skill sections
    skills = parse_skills(content)

    return {
        'version': version,
        'updated': updated,
        'content': content,
        'skills': skills,
    }

def parse_skills(content):
    """Parse skill tables from FRAMEWORK.md"""
    skills = []
    # Find skill sections
    sections_re = re.finditer(
        r'### (.+?)\n\n\| Skill \| What it covers \| Nest \| Flock \|\n\|[-|]+\|\n((?:\|.+\|\n?)+)',
        content, re.MULTILINE
    )
    for m in sections_re:
        domain = m.group(1).strip()
        rows = m.group(2).strip().split('\n')
        for row in rows:
            cells = [c.strip() for c in row.split('|')[1:-1]]
            if len(cells) >= 4:
                skills.append({
                    'domain': domain,
                    'skill': cells[0],
                    'what': cells[1],
                    'nest': cells[2],
                    'flock': cells[3],
                })
    return skills

# ── RENDER DOTS ──
def render_dots(dot_str, filled_char, empty_char, max_count):
    """Convert emoji dot string to HTML dots"""
    count = dot_str.count(filled_char)
    html = ''
    for i in range(max_count):
        if i < count:
            html += f'<span class="dot filled">{filled_char}</span>'
        else:
            html += f'<span class="dot empty">⬜</span>'
    return html

def score_to_label_nest(nest_str):
    count = nest_str.count('🥚')
    labels = ['', 'Observed', 'Defined', 'Standardized', 'Verified']
    return labels[min(count, 4)]

def score_to_label_flock(flock_str):
    count = flock_str.count('🐔')
    labels = ['', 'Human-directed', 'Reliable', 'Scheduled', 'Event-driven', 'Fleet — graduated']
    return labels[min(count, 5)]

# ── UPDATE HATCH INDEX ──
def update_hatch_index(fw):
    section('📄 Updating hatch/index.html')
    if not os.path.exists(HATCH_INDEX):
        fail('hatch/index.html not found')
        return

    content = open(HATCH_INDEX).read()

    # Update version stamp if present
    content = re.sub(
        r'(v\d+\.\d+\s*·\s*)\d{4}',
        lambda m: m.group(1) + fw['updated'][:4],
        content
    )

    # Inject version meta comment
    if '<!-- FRAMEWORK_VERSION' not in content:
        content = content.replace('<head>', f'<head>\n<!-- FRAMEWORK_VERSION: {fw["version"]} UPDATED: {fw["updated"]} -->')
    else:
        content = re.sub(
            r'<!-- FRAMEWORK_VERSION:.*?-->',
            f'<!-- FRAMEWORK_VERSION: {fw["version"]} UPDATED: {fw["updated"]} -->',
            content
        )

    with open(HATCH_INDEX, 'w') as f:
        f.write(content)
    ok(f'hatch/index.html updated — v{fw["version"]}')

# ── UPDATE AI OPS ──
def update_aiops(fw):
    section('📊 Updating hatch/ai-ops/index.html')
    if not os.path.exists(HATCH_AIOPS):
        fail('hatch/ai-ops/index.html not found')
        return

    content = open(HATCH_AIOPS).read()

    # Inject version meta
    if '<!-- FRAMEWORK_VERSION' not in content:
        content = content.replace('<head>', f'<head>\n<!-- FRAMEWORK_VERSION: {fw["version"]} UPDATED: {fw["updated"]} -->')
    else:
        content = re.sub(
            r'<!-- FRAMEWORK_VERSION:.*?-->',
            f'<!-- FRAMEWORK_VERSION: {fw["version"]} UPDATED: {fw["updated"]} -->',
            content
        )

    # Inject last-updated stamp into the page footer if present
    content = re.sub(
        r'(ai ops board · hatch\.crankychickens\.com)',
        f'\\1 · v{fw["version"]} · {fw["updated"]}',
        content
    )

    with open(HATCH_AIOPS, 'w') as f:
        f.write(content)
    ok(f'hatch/ai-ops/index.html updated — {len(fw["skills"])} skills in FRAMEWORK.md')

# ── UPDATE SCORES.JSON ──
def update_scores(fw):
    section('🎯 Syncing services/scores.json')
    if not os.path.exists(SCORES):
        fail('services/scores.json not found')
        return

    with open(SCORES) as f:
        scores = json.load(f)

    scores['_updated'] = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
    scores['_frameworkVersion'] = fw['version']

    with open(SCORES, 'w') as f:
        json.dump(scores, f, indent=2)
    ok(f'scores.json updated — framework v{fw["version"]}')

# ── CHECK NETLIFY CONFIG ──
def check_netlify():
    section('🌐 Checking netlify.toml')
    toml_path = os.path.join(ROOT, 'netlify.toml')
    if not os.path.exists(toml_path):
        fail('netlify.toml not found')
        return

    content = open(toml_path).read()
    if 'hatch' in content:
        ok('netlify.toml has hatch routing')
    else:
        fail('netlify.toml missing hatch routing — run: python3 scripts/refresh-framework.py --fix-netlify')

# ── FIX NETLIFY ──
def fix_netlify():
    toml_path = os.path.join(ROOT, 'netlify.toml')
    content = open(toml_path).read()

    hatch_config = '''
# Hatch subdomain — serves /hatch/ directory
[[headers]]
  for = "/hatch/*"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"
'''
    if hatch_config.strip() not in content:
        content += hatch_config
        with open(toml_path, 'w') as f:
            f.write(content)
        print('  ✅ Added hatch headers to netlify.toml')
        print('  ⚠️  NOTE: To serve hatch.crankychickens.com from /hatch/ in the same Netlify site:')
        print('       1. Go to Netlify → Domain management → Add subdomain alias')
        print('       2. Point hatch.crankychickens.com to this same Netlify site')
        print('       3. In Netlify → Site configuration → Branch deploys, set path prefix if needed')
        print('       OR: Use a _redirects rule (see below)')

        # Write _redirects for Netlify subdomain serving
        redirects_path = os.path.join(ROOT, '_redirects')
        redirects_content = ''
        if os.path.exists(redirects_path):
            redirects_content = open(redirects_path).read()

        hatch_redirect = '# Hatch subdomain handled by Netlify domain alias pointing to /hatch/\n'
        if hatch_redirect not in redirects_content:
            with open(redirects_path, 'a') as f:
                f.write('\n' + hatch_redirect)
            print('  ✅ Updated _redirects')

# ── SUMMARY ──
def print_summary(fw):
    section('📋 Framework Summary')
    print(f'  Version:  {fw["version"]}')
    print(f'  Updated:  {fw["updated"]}')
    print(f'  Skills:   {len(fw["skills"])} total')

    by_domain = {}
    for s in fw['skills']:
        d = s['domain']
        by_domain[d] = by_domain.get(d, 0) + 1
    for domain, count in by_domain.items():
        print(f'    {domain}: {count} skills')

    # Check graduation candidates
    candidates = [s for s in fw['skills'] if s['nest'].count('🥚') >= 4 and s['flock'].count('🐔') >= 2]
    if candidates:
        print(f'\n  🎓 Graduation candidates ({len(candidates)}):')
        for c in candidates:
            print(f'    {c["skill"]} — nest {c["nest"].count("🥚")}/4  flock {c["flock"].count("🐔")}/5')

# ── MAIN ──
if __name__ == '__main__':
    print('🐔 Cranky Chickens — Framework Refresh')
    print('=' * 50)

    fix_netlify_flag = '--fix-netlify' in sys.argv

    fw = read_framework()
    print_summary(fw)

    update_hatch_index(fw)
    update_aiops(fw)
    update_scores(fw)
    check_netlify()

    if fix_netlify_flag:
        fix_netlify()

    print(f'\n{"=" * 50}')
    print(f'Results: {CHECKS_PASSED} passed, {CHECKS_FAILED} failed')

    if CHECKS_FAILED > 0:
        print('⚠️  Some checks failed — review above')
        sys.exit(1)
    else:
        print(f'✅ Framework refreshed — v{fw["version"]}')
        print(f'   Push to main → crankychickens.com + hatch.crankychickens.com both redeploy')
        sys.exit(0)
