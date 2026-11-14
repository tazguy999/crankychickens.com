#!/usr/bin/env python3
"""Text / dialog collision eval for games/cc7.html.

Drives the game through every state that puts words on screen (garden, every
toast, every cabinet's title / play / won / lost cards with their dialogue,
the finale rounds, the credits) at eight screen sizes, and fails if any two
pieces of text overlap, text sits under a touch button, or text runs off its
space. Canvas text and the DOM overlays (HUD, toast, captions) are both checked.

  pip install playwright        # uses your installed Chrome
  python3 scripts/cc7-evals/text_collision_eval.py games/cc7.html [--shots] [viewport ...]

Exit code 0 = no collisions. --shots saves a screenshot per finding to ./collide_shots/.
Set CHROME=/path/to/chrome if it is not found automatically."""
import asyncio, json, re, sys, os
from playwright.async_api import async_playwright

HTML = os.path.abspath(sys.argv[1])
SHOTS = '--shots' in sys.argv
PROBE = open(os.path.join(os.path.dirname(__file__), 'collide_probe.js')).read()
src = open(HTML, encoding='utf-8').read()

# every scripted line in the game, straight from the source
NAMES = ['SCRATCHY', 'PEARL', 'AUNT BARB', 'REGINALD', 'EL JAGUAR', 'THE GAME']
pairs = []
for who in NAMES:
    for m in re.finditer(r"\[\s*'" + re.escape(who) + r"'\s*,\s*'((?:[^'\\]|\\.)*)'\s*\]", src):
        pairs.append((who, m.group(1).replace("\\'", "'")))
    for m in re.finditer(r"\[\s*'" + re.escape(who) + r"'\s*,\s*\"((?:[^\"\\]|\\.)*)\"\s*\]", src):
        pairs.append((who, m.group(1)))
pairs = sorted(set(pairs), key=lambda p: -len(p[1]))
LONGEST_BASE = pairs[:6]
KID = ('PEARL', 'I think the chickens should have a trampoline and a slide and also a very big cake for everybody', 'Cannon Master')
TOASTS = sorted(set(re.findall(r"toast\('([^']+)'", src)))

VIEWPORTS = [
    ('desktop',         1280, 800, False),
    ('laptop-short',    1024, 560, False),
    ('tablet',           820, 1180, True),
    ('phone-landscape',  844, 390, True),
    ('phone-land-small', 667, 375, True),
    ('big-desktop',     1920, 1080, False),
    ('phone-portrait',   390, 844, True),
    ('small-phone',      360, 640, True),
]
LEDGER = {"version":1,"firstSeen":1,"lastSeen":1,"sessions":3,"awareness":1,"screen":[0,0],
          "picked":["0,0,10,4","0,0,2,8","1,0,3,3","1,0,14,7"],"respawns":0,"playMs":0,"quitScreen":None,
          "voices":False,"spoken":[],"takeover":True,"won":{},"best":{"invaders":470,"runner":120,"standing":300,"parade":120,"bricks":580,"finale":900},
          "fails":{},"finished":False,"sfx":False}

async def run_viewport(b, name, w, h, touch):
    ctx = await b.new_context(viewport={'width': w, 'height': h}, has_touch=touch, is_mobile=touch)
    await ctx.route('**/*', lambda r: r.continue_() if r.request.url.startswith('file:') else r.abort())
    await ctx.add_init_script("try{localStorage.setItem('cc7_ledger', %s)}catch(e){}" % json.dumps(json.dumps(LEDGER)))
    await ctx.add_init_script(PROBE)
    pg = await ctx.new_page()
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto('file://' + HTML)
    await pg.wait_for_timeout(600)
    seen = set()

    async def scene(s):
        await pg.evaluate("s => { window.__scene = s; }", s)
    async def settle(ms=140):
        await pg.wait_for_timeout(ms)
        if SHOTS:
            keys = await pg.evaluate("Object.keys(window.__find)")
            new = [k for k in keys if k not in seen]
            if new:
                seen.update(new)
                if len(seen) < 400:
                    os.makedirs('collide_shots', exist_ok=True)
                    safe = re.sub(r'[^a-z0-9]+', '-', new[0].lower())[:70]
                    await pg.screenshot(path=f'collide_shots/{name}--{safe}.png')
    async def say(lines, credit_case=False):
        for who, text in lines:
            await pg.evaluate("([w,t]) => subtitle(w, t, w === 'THE GAME' ? 'game' : '')", [who, text])
            await settle()
        if credit_case:
            await pg.evaluate("([w,t,c]) => subtitle(w, t, '', c)", list(KID))
            await settle()
    async def hush():
        await pg.evaluate("() => { Talk.hush(); subEl.style.transition='none'; subEl.style.opacity='0'; toastEl.style.transition='none'; toastEl.style.opacity='0'; }")
        await pg.wait_for_timeout(60)

    # stop the game talking on its own schedule: the eval says every line itself
    await pg.evaluate("() => { Talk.tick = () => {}; Voice.say = () => {}; Leak.tell = () => {}; subEl.style.transition='none'; toastEl.style.transition='none'; }")
    await hush()

    # LAYER 4: hint lines are built from templates, so render them and add the longest to the pool
    hints = await pg.evaluate('''() => {
      const out = [], dirs = ['down the big hole in the Long Drop', 'through the brick wall on the right', 'right here on this screen'];
      const wonSets = [{}, {runner:1}];
      for (const kind of Object.keys(Hint.LINES)) for (const say of dirs) for (const won of wonSets) for (let lv = 1; lv <= 6; lv++) for (let rep = 0; rep < (lv === 6 ? 6 : 1); rep++){
        Save.data.won = won;
        const l = Hint.line({ kind, maker: 'AUNT BARB', r: { steps: 2, first: { say } } }, lv);
        out.push(l);
      }
      Save.data.won = {};
      const seen = new Set(); return out.filter(l => !seen.has(l[1]) && seen.add(l[1])).sort((a, b) => b[1].length - a[1].length).slice(0, 5);
    }''')
    tips = await pg.evaluate("Object.values(GAMES).map(g => g.tip).filter(Boolean)")
    LONGEST = sorted(LONGEST_BASE + [tuple(h) for h in hints], key=lambda p: -len(p[1]))[:8]

    # ---- garden: HUD + every toast + the longest lines anyone can say ----
    await pg.evaluate("() => { Hint.tick = () => {}; Hint.arrow = function(){ const g = this.goal(); if (!g) return null; this.level = 5; return g.r.steps ? g.r.first : { x: g.x, y: g.top, dir: 'down' }; }; }")
    await scene('garden')
    await say(LONGEST, credit_case=True)
    for tx in TOASTS:
        await scene('garden + toast "' + tx.split('<br>')[0] + '"')
        await pg.evaluate("t => toast(t, 60000)", tx)
        await say(LONGEST, credit_case=True)
    await hush()

    # ---- garden: standing at each cabinet (prompt bubble), locked and open ----
    cabs = await pg.evaluate("CABINETS.map(c => ({id:c.id, screen:c.screen, col:c.col, finale:!!c.finale}))")
    for c in cabs:
        x, y = c['screen'].split(',')
        for won in ([{}] if not c['finale'] else [{}, {"invaders":1,"runner":1,"standing":1,"parade":1,"bricks":1}]):
            await pg.evaluate("([x,y,col,won]) => { Save.data.won = won; enterScreen(+x, +y, col*32+8, 11*32-24); paintHud(); }", [x, y, c['col'], won])
            await scene('garden at cabinet ' + c['id'] + (' (locked)' if c['finale'] and not won else ''))
            await pg.wait_for_timeout(250)
            await say(LONGEST[:3], credit_case=True)
            await pg.evaluate("t => toast(t, 60000)", TOASTS[1] if len(TOASTS) > 1 else TOASTS[0])
            await say(LONGEST[:2])
            await hush()
    # takeover glitch + its own lines
    await scene('takeover')
    await pg.evaluate("() => { Save.data.takeover = false; enterScreen(0,0,64,300); Takeover.begin(performance.now()); }")
    tk = await pg.evaluate("Talk.queue[0] ? Talk.queue[0].lines : []")
    await pg.wait_for_timeout(2900)
    await say([tuple(l) for l in tk])
    await hush()

    # ---- LAYER 3: leak announcements, Reginald's spot, and the three screens off the map ----
    await pg.evaluate("() => { Save.data.won = {invaders:1,runner:1,standing:1,parade:1,bricks:1}; Save.data.wallDown = true; Save.data.wallHits = 6; Save.data.extra = {}; }")
    tells = await pg.evaluate("Object.values(Leak.TELL).map(t => ({toast: t.toast, lines: t.lines}))")
    await pg.evaluate("() => { mode = 'garden'; enterScreen(0, 0, 100, 328); }")
    for tl in tells:
        await scene('leak toast "' + tl['toast'].split('<br>')[0] + '"')
        await pg.evaluate("t => toast(t, 60000)", tl['toast'])
        await say([tuple(l) for l in tl['lines']] + LONGEST[:3], credit_case=True)
    await hush()
    extra_lines = [('SCRATCHY', 'That is flower number 13. Of twelve. I need to sit down.'), ('PEARL', 'There was a SPARE one!'),
                   ('SCRATCHY', 'I have filed a new form. It is called Form 15 of 12.'), ('THE GAME', 'Flower count exceeds flower count.')]
    await scene("garden on Reginald's spot")
    await pg.evaluate("() => { enterScreen(0, 1, 9*32+22, 328); }")
    await pg.wait_for_timeout(700)
    await say([('REGINALD', 'There is a spot. Stand on it. Wait. That is all I will say.')] + LONGEST[:3], credit_case=True)
    await pg.evaluate("t => toast(t, 60000)", tells[3]['toast'])
    await say(LONGEST[:2]); await hush()
    for (x, y, px, name, lines) in [
        (1, -1, 300, 'above the garden', [('THE GAME', 'You are above the garden. Nothing was placed here. Please disregard the flower.'), ('PEARL', 'You are in the SKY!')]),
        (0, 2, 120, 'under the garden', [('THE GAME', 'This screen is under the garden. It is not on the map. Please do not touch the props.'), ('REGINALD', 'Nice basement.')]),
        (0, 2, 9*32+22, 'under the garden, on the lift pad', [('REGINALD', 'Nice basement.')]),
        (3, 1, 60, 'outside the demo', [('THE GAME', 'You have left the demo. This area has no textures. It was not expecting company.'), ('EL JAGUAR', 'It was a load-bearing wall. Emotionally.')]),
        (2, 1, 560, 'garden at the wall', [('EL JAGUAR', 'That is MY wall. Stop that. ...Do it again.'), ('EL JAGUAR', 'You broke the edge of the demo. I respect it.'), ('SCRATCHY', 'There is nothing out there. I checked the paperwork.')]),
    ]:
        await pg.evaluate("([x,y,px]) => { Leak.script = null; enterScreen(x, y, px, y === -1 ? 290 : 328); Leak.padArmed = true; }", [x, y, px])
        await scene('hidden screen: ' + name)
        await pg.wait_for_timeout(500)
        await say(lines + extra_lines + LONGEST[:3], credit_case=True)
        await hush()
    await pg.evaluate("() => { enterScreen(0, 0, 64, 300); Save.data.won = {}; paintHud(); }")

    # ---- every cabinet: title card, play, won card, lost card ----
    await pg.evaluate("() => { Save.data.won = {invaders:1,runner:1,standing:1,parade:1,bricks:1}; }")
    for c in cabs:
        gid = c['id']
        lines = await pg.evaluate("id => ({intro: GAMES[id].intro, win: GAMES[id].win, lose: GAMES[id].lose})", gid)
        for easy in (False, True):
            tag = gid + (' easy' if easy else '')
            await pg.evaluate("([id,easy]) => { Save.data.fails = {}; Save.data.fails[id] = easy ? 2 : 0; mode='garden'; Arcade.open(CABINETS.find(c => c.id === id)); }", [gid, easy])
            await scene('title card: ' + tag)
            await pg.wait_for_timeout(700)
            await say([tuple(l) for l in (lines.get('intro') or [])])
            await hush()

            await scene('playing: ' + tag)
            await pg.evaluate("() => Arcade.start()")
            await pg.wait_for_timeout(1500)
            if gid == 'standing':
                await pg.evaluate("() => { const g = Arcade.game; g.msg='YOU MOVED.'; g.msgT=200; }")
                await say([('REGINALD', 'Standing is harder than it looks. I have practised for six years.'), ('THE GAME', 'A hint. The game is called STANDS. Take your hands off everything.'), ('PEARL', 'LET GO OF THE BUTTONS! ALL OF THEM! I cannot watch!')])
                await pg.wait_for_timeout(300); await hush()
                await pg.evaluate("() => { const g = Arcade.game; g.still = g.need; }")
                await pg.wait_for_timeout(1200)
                await pg.evaluate("() => { const g = Arcade.game; if (g.phase === 1){ g.msg='AGAIN. SLIGHTLY FASTER. HIS WORDS.'; g.msgT=200; g.crossed = 1; } }")
                await pg.wait_for_timeout(600)
            if gid == 'runner':
                await pg.evaluate("() => { const g = Arcade.game; g.dist = 1200; }"); await pg.wait_for_timeout(900)
                await pg.evaluate("() => { const g = Arcade.game; g.obs=[]; g.corn=[]; g.nextAt = g.goal*0.5+1200; g.dist = g.goal*0.5 + 20; }"); await pg.wait_for_timeout(700)
                await pg.evaluate("() => { const g = Arcade.game; g.obs=[]; g.corn=[]; g.dist = g.goal - 500; }"); await pg.wait_for_timeout(700)
            if gid == 'finale':
                for i in range(5):
                    await pg.evaluate("i => { const g = Arcade.game; g.i = i; g.begin(); Arcade.lives = 6; paintHud(); }", i)
                    await scene('playing: finale round ' + str(i + 1) + (' easy' if easy else ''))
                    await pg.wait_for_timeout(500)       # round card
                    await pg.evaluate("() => { Arcade.game.card = 0; }")
                    await pg.wait_for_timeout(900)
            if gid == 'invaders':
                await pg.evaluate("() => { const g = Arcade.game; g.inv.slice(0, 40).forEach(v => { v.alive = false; g.pops.push({x:v.x+14,y:v.y+9,life:18}); }); }")
                await pg.wait_for_timeout(500)
            await pg.wait_for_timeout(500)

            for first in (True, False):
                await pg.evaluate("([id,first,gid]) => { if (Arcade.state !== 'play') Arcade.start(); Arcade.score = 1280; if (first) delete Save.data.won[id]; else Save.data.won[id] = 1; Save.data.finished = !first; Arcade.win(); }", [gid, first, gid])
                await scene('won card: ' + tag + ('' if first else ' (replay)'))
                await pg.wait_for_timeout(650)
                await say([tuple(l) for l in (lines.get('win') or [])])
                await hush()
            await pg.evaluate("() => { Save.data.finished = false; }")

            await pg.evaluate("() => { Arcade.start(); }"); await pg.wait_for_timeout(300)
            await pg.evaluate("() => { Arcade.lives = 1; Arcade.hurt(); }")
            await scene('lost card: ' + tag)
            await pg.wait_for_timeout(650)
            await say([tuple(l) for l in (lines.get('lose') or [])] + [tuple(t) for t in tips] + [('AUNT BARB', 'I have turned this one down a notch, dear.'), ('SCRATCHY', 'That is not regulation.'), ('AUNT BARB', 'It is now.')])
            await hush()
            await pg.evaluate("() => { Arcade.close(); }")
    await pg.evaluate("() => { Save.data.fails = {}; }")

    # ---- the handoff: credits from first line to last, with its dialogue ----
    await pg.evaluate("() => { Ending.begin(); }")
    hand = await pg.evaluate("Talk.queue[0] ? Talk.queue[0].lines : []")
    total = await pg.evaluate("Math.ceil((384 + 60 + Ending.CREDITS.length * 24) / 0.42)")
    f = 0; i = 0
    while f < total:
        await scene('ending credits')
        await pg.evaluate("f => { Ending.f = f; }", f)
        who, text = hand[i % len(hand)]; i += 1
        await pg.evaluate("([w,t]) => subtitle(w, t, w === 'THE GAME' ? 'game' : '')", [who, text])
        await settle(110)
        f += 9
    await pg.evaluate("() => { Ending.f = 60 * 10; Ending.finish(); }")
    await scene('after ending')
    await say(LONGEST[:2])

    find = await pg.evaluate("window.__find")
    frames = await pg.evaluate("window.__frames")
    perr = await pg.evaluate("window.__probeErr || ''")
    await ctx.close()
    return find, frames, errs, perr

async def main():
    async with async_playwright() as p:
        chrome = os.environ.get('CHROME') or next((c for c in ('/usr/bin/google-chrome',
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome') if os.path.exists(c)), None)
        b = await (p.chromium.launch(executable_path=chrome, args=['--no-sandbox']) if chrome else p.chromium.launch(channel='chrome'))
        allf = {}; total_frames = 0
        only = [a for a in sys.argv[2:] if not a.startswith('--')]
        vps = [v for v in VIEWPORTS if not only or v[0] in only]
        results = await asyncio.gather(*[run_viewport(b, *v) for v in vps])
        for (name, w, h, touch), (find, frames, errs, perr) in zip(vps, results):
            total_frames += frames
            print(f'{name:16s} {w}x{h}: {frames} frames checked, {len(find)} findings' + (f'  PAGE ERRORS: {errs}' if errs else '') + (f'  PROBE ERROR: {perr}' if perr else ''))
            for k, v in find.items():
                v['viewport'] = name
                allf[name + ' | ' + k] = v
        await b.close()
        json.dump(allf, open('collide_report.json', 'w'), indent=1)
        # summary grouped by kind, then by the pair of texts
        by = {}
        for v in allf.values():
            key = (v['kind'], v['a'][:46], v['b'][:46])
            e = by.setdefault(key, {'vps': set(), 'scenes': set(), 'area': 0})
            e['vps'].add(v['viewport']); e['scenes'].add(v['scene']); e['area'] = max(e['area'], v['area'])
        print(f'\nlines in script: {len(pairs)} · toasts: {len(TOASTS)} · frames checked: {total_frames}')
        print(f'DISTINCT COLLISIONS: {len(by)}')
        for (kind, a, bb), e in sorted(by.items(), key=lambda kv: (kv[0][0], -kv[1]['area'])):
            print(f"  [{kind}] {a!r} <> {bb!r}  max {e['area']}px²  on {sorted(e['vps'])}  in {len(e['scenes'])} scene(s) e.g. {sorted(e['scenes'])[0]}")
        sys.exit(1 if by else 0)
asyncio.run(main())
