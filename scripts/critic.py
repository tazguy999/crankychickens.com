#!/usr/bin/env python3
"""
Cranky Chickens — Pre-push critic check
Validates game files before deployment to prevent black screens.
Run: python3 scripts/critic.py
"""
import re, sys, os

CHECKS_PASSED = 0
CHECKS_FAILED = 0

def ok(msg): global CHECKS_PASSED; CHECKS_PASSED+=1; print(f'  ✅ {msg}')
def fail(msg): global CHECKS_FAILED; CHECKS_FAILED+=1; print(f'  ❌ {msg}')
def warn(msg): print(f'  ⚠️  {msg}')
def section(msg): print(f'\n{msg}')

def check_brace_balance(script):
    """Check JS brace balance — raw open vs close count."""
    opens = script.count('{')
    closes = script.count('}')
    diff = opens - closes
    return diff, []

def check_game_file(path):
    section(f'🎮 Checking {path}')
    if not os.path.exists(path):
        warn(f'File not found: {path}')
        return

    content = open(path).read()
    
    # Extract script
    try:
        script_start = content.index('<script')
        script_end = content.rindex('</script>')
        script = content[script_start:script_end]
    except ValueError:
        fail('Could not find <script> tag')
        return

    # Brace balance
    depth, problems = check_brace_balance(script)
    if depth == 0 and not problems:
        ok(f'Brace balance: {depth}')
    else:
        fail(f'Brace imbalance: final depth={depth}, {len(problems)} negative points')
        for p in problems[:3]: print(f'     → {p}')

    # Required functions exist
    required_fns = [
        'function loop()',
        'function loadConfig()',
        'function drawScreen(',
        'function drawAlienIguana(',
        'function updateEnemies(',
        'function startGame(',
        'function boxWalkable(',
    ]
    for fn in required_fns:
        if fn in script:
            ok(f'Found: {fn}')
        else:
            fail(f'Missing: {fn}')

    # Required constants — check content not just exact match
    for const in ['GW=', 'GH=', 'TILE=', 'const T={']:
        if const in script:
            ok(f'Found: {const}')
        else:
            fail(f'Missing: {const}')

    # No console.error left uncaught (warn only)
    err_count = script.count('console.error')
    if err_count > 0:
        warn(f'{err_count} console.error calls (fine for debug, remove before prod)')

    # Build stamp present
    if 'BUILD_STAMP' in script:
        import re
        stamp = re.search(r"BUILD_STAMP\s*=\s*'([^']+)'", script)
        ok(f'Build stamp: {stamp.group(1) if stamp else "found"}')
    else:
        warn('No BUILD_STAMP — version tracking disabled')

    # roundRect polyfill
    if 'roundRect.prototype' in script or 'prototype.roundRect' in script:
        ok('roundRect polyfill present')
    else:
        warn('No roundRect polyfill — may break on older Android/Fire tablets')

    # Void system
    if 'generateVoidRoom' in script:
        ok('Void infinite world: generateVoidRoom present')
    if 'isSafeZone' in script:
        ok('Safe zone system: isSafeZone present')

    # Template literals in critical generation functions (warn — caused black screens before)
    gen_start = script.find('function generateVoidRoom')
    if gen_start >= 0:
        gen_end = script.find('\nfunction ', gen_start+1)
        gen_body = script[gen_start:gen_end] if gen_end > 0 else script[gen_start:gen_start+2000]
        template_in_gen = gen_body.count('`')
        if template_in_gen > 0:
            fail(f'Template literals in generateVoidRoom ({template_in_gen} backticks) — caused black screen before! Use string concatenation instead.')
        else:
            ok('generateVoidRoom: no template literals (safe)')

def check_config_file(path):
    section(f'⚙️  Checking {path}')
    if not os.path.exists(path):
        warn(f'File not found: {path}')
        return
    import json
    try:
        with open(path) as f:
            cfg = json.load(f)
        ok('Valid JSON')
    except json.JSONDecodeError as e:
        fail(f'Invalid JSON: {e}')
        return

    for key in ['zones', 'enemyVariants']:
        if key in cfg:
            ok(f'Has {key}: {len(cfg[key])} entries')
        else:
            warn(f'Missing {key}')

    for ev in cfg.get('enemyVariants', []):
        if 'characterType' not in ev:
            warn(f'Enemy "{ev.get("name","?")}" missing characterType — will default to iguana')
        if 'tx' not in ev or 'ty' not in ev:
            fail(f'Enemy "{ev.get("name","?")}" missing tx/ty position')

def check_proxy(path):
    section(f'🔧 Checking {path}')
    if not os.path.exists(path):
        warn(f'File not found: {path}')
        return
    content = open(path).read()
    for action in ['get_submissions', 'save_file', 'get_file', 'claude_complete', 'merge_to_main']:
        if action in content:
            ok(f'Action: {action}')
        else:
            fail(f'Missing action: {action}')
    if 'GITHUB_TOKEN' in content and 'process.env' in content:
        ok('Token: uses env var (not hardcoded)')
    if 'ghp_' in content:
        fail('HARDCODED TOKEN FOUND — do not push!')

# ── RUN ALL CHECKS ──
print('🐔 Cranky Chickens — Pre-push Critic Check')
print('=' * 50)

check_game_file('games/in-space.html')
check_config_file('configs/in-space.json')
check_proxy('netlify/functions/github-proxy.js')

print(f'\n{"=" * 50}')
print(f'Results: {CHECKS_PASSED} passed, {CHECKS_FAILED} failed')

if CHECKS_FAILED > 0:
    print('❌ DO NOT PUSH — fix failures first')
    sys.exit(1)
else:
    print('✅ All checks passed — safe to push')
    sys.exit(0)
