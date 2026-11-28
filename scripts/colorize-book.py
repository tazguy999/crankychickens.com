#!/usr/bin/env python3
"""Add the Cranky Chickens colors to a built book.

  colorize.py book.html            comic: cover, page trim and every doodle
  colorize.py book.html --cover    cover only (Diary of a Book)

Safe to run twice: it replaces its own earlier output.
Colors come from the logo and from the character palettes in games/cc7.html.
"""
import re, sys
COVER_CSS = """
  /* cc-colors: cover. The kid's pencil lines sit on brand-colored paper; nothing is drawn over them. */
  .leaf.cover{background:linear-gradient(180deg,#ffcc02 0%,#ffe14d 20%,#fff4c8 48%,#ffe0a8 76%,#ff9f1c 100%)}
  .leaf.cover::before{content:""; position:absolute; inset:0; border:calc(var(--u)*1.6) solid #cc2200; border-radius:3px 6px 6px 3px; pointer-events:none; z-index:2}
"""
K = '.doodle .k '
def rule(sel, body):
    return '  ' + ','.join(K + s.strip() for s in sel.split(', ')) + '{' + body + '}\n'
ART = [
 # Scratchy
 ('.c-scr ellipse.w, .c-scr circle.w', 'fill:#ff9f1c'),
 ('.c-scr rect.w, .c-scr path[d^="M-2.5,6"]', 'fill:#ff6b00'),
 ('.c-scr path[d^="M-7,-9 L-8,-22"]', 'fill:#ff3333'),
 ('.c-scr path[d^="M-12,22"], .c-scr path[d^="M12,22"]', 'fill:#e08010'),
 ('.c-scr path[d^="M-10,-6"]', 'stroke:#cc2200; stroke-width:2.2'),
 # Pearl
 ('.c-prl ellipse.w, .c-prl circle.w', 'fill:#fffaf0'),
 ('.c-prl path[d^="M-5,-8 q-1,-7"]', 'fill:#ff6688'),
 ('.c-prl path[d^="M7,3 L15,5"]', 'fill:#ffaa33'),
 # early-book chickens: cranky ones are Scratchy-orange, the rest are cream
 ('.c-chick ellipse.w, .c-chick circle.w', 'fill:#fffaf0'),
 ('.c-chick.cranky ellipse.w, .c-chick.cranky circle.w', 'fill:#ff9f1c'),
 ('.c-chick path[d^="M3,-33"]', 'fill:#ff3333'),
 ('.c-chick path[d^="M13,-30"]', 'fill:#ff6b00'),
 ('.c-eggc ellipse.w', 'fill:#fff8ee'),
 # Kevin
 ('.c-kev ellipse.w, .c-kev circle.w', 'fill:#d9a066'),
 ('.c-kev path.w', 'fill:#8b4513'),
 # El Jaguar
 ('.c-ern ellipse.w, .c-ern circle.w, .c-ern path.w', 'fill:#f4a261'),
 ('.c-ern circle[r="1.6"], .c-ern circle[r="1.4"], .c-ern circle[r="1.2"]', 'fill:#8b4513; stroke:none'),
 # Archie
 ('.c-arch ellipse.w, .c-arch circle.w, .c-arch path.w', 'fill:#cfcfdc'),
 ('.c-arch circle[r="3.4"]', 'fill:#8d8da3; stroke:none'),
 # farmers
 ('.c-farmer ellipse.w, .c-farmer circle.w', 'fill:#ffd9b3'),
 ('.c-farmer path[d^="M-7,-24 L-9,-8"]', 'fill:#5b8fd9'),
 ('.c-farmer path[d^="M-15,-44"], .c-farmer path[d^="M-7,-46"]', 'fill:#e0b050'),
 # everybody else
 ('.c-sq path.w, .c-sq ellipse.w, .c-sq circle.w', 'fill:#c98b5a'),
 ('.c-regi .w', 'fill:#6f8fb0'),
 ('.c-mecha .w, .c-machine .w, .c-suit .w', 'fill:#cfd8dc'),
 ('.c-diaper .w', 'fill:#ffffff'),
 ('.c-dino .w', 'fill:#8fd18f'),
 ('.c-boog .w', 'fill:#b6e36b'),
 ('.c-catM .w', 'fill:#b39ddb'),
 ('.c-potato .w', 'fill:#d2a679'),
 ('.c-oldie .w', 'fill:#ffd9b3'),
 ('.c-coop .w', 'fill:#e8573f'),
 ('.c-sun .w, .c-corn .w, .c-splat .w', 'fill:#ffcc02'),
 ('.c-moon .w', 'fill:#ffe14d'),
 ('.c-eggs .w', 'fill:#fff8ee'),
 ('.c-volcano .w', 'fill:#b08968'),
 ('.c-cloud .w, .c-bub .w', 'fill:#ffffff'),
 # eyes stay white everywhere (plain eyes and hypno-swirl eyes)
 ('[class^="c-"] circle:not([class])[r="3.6"], [class^="c-"] circle:not([class])[r="3"], [class^="c-"] circle:not([class])[r="2.4"], [class^="c-"] circle:not([class])[r="2.3"]', 'fill:#ffffff'),
 ('circle.w[r="2.2"], circle.w[r="2.3"], circle.w[r="2.4"], circle.w[r="2.9"], circle.w[r="3.3"], circle.w[r="3.8"], circle.w[r="3.9"]', 'fill:#ffffff !important'),
]
COMIC_CSS = """
  /* cc-colors: comic pages */
  .page.comic h2{color:#1a1024}
  .page.comic h2 span{background:#cc2200; color:#fff}
  .panel{background:#fff6d9; border-color:#1a1024}
  .panel .cap{background:#ffcc02; color:#1a1024; border-bottom-color:#1a1024}
  .doodle .k .w{fill:#fff6d9}
""" + ''.join(rule(s, b) for s, b in ART)
NAMES = ['scr','prl','kev','ern','arch','eggc','farmer','sq','regi','mecha','machine','suit','diaper','dino','boog','catM',
         'potato','oldie','coop','sun','corn','splat','moon','eggs','volcano','cloud','bub']
WRAP = "  /*cc-colors:wrap*/ (function(){ function C(c,s){ return '<g class=\"'+c+'\">'+s+'</g>'; }\n" + \
  ''.join("    if(typeof %s==='function'){ var _%s=%s; %s=function(){ return C('c-%s',_%s.apply(null,arguments)); }; }\n" % ((n,)*6) for n in NAMES) + \
  "    if(typeof chick==='function'){ var _chick=chick; chick=function(x,y,s,o){ return C('c-chick'+(o&&o.cranky?' cranky':''),_chick.apply(null,arguments)); }; }\n" + \
  "  })(); /*cc-colors:end*/\n"
def colorize(html, cover_only=False):
    html = re.sub(r'<style id="cc-colors">.*?</style>\n?', '', html, flags=re.S)
    html = re.sub(r'  /\*cc-colors:wrap\*/.*?/\*cc-colors:end\*/\n', '', html, flags=re.S)
    css = COVER_CSS + ('' if cover_only else COMIC_CSS)
    assert '</head>' in html
    html = html.replace('</head>', '<style id="cc-colors">' + css + '</style>\n</head>', 1)
    if not cover_only:
        assert html.count('  var CHAPTERS') == 1
        html = html.replace('  var CHAPTERS', WRAP + '  var CHAPTERS', 1)
    return html
if __name__ == '__main__':
    p = sys.argv[1]; src = open(p, encoding='utf8').read()
    out = colorize(src, '--cover' in sys.argv)
    open(sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].startswith('--') else p, 'w', encoding='utf8').write(out)
    print(p, len(src), '->', len(out))
