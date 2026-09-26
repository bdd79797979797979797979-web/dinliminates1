from pathlib import Path
import re, json, struct, subprocess
base=Path(__file__).resolve().parents[1]
html=(base/'index.html').read_text()
hard=(base/'launch-hardening.js').read_text()
css=(base/'launch-hardening.css').read_text()
api=(base/'api/restaurant-search.js').read_text()
clean=(base/'api/clean-entry.js').read_text()
sw=(base/'dinliminate-sw.js').read_text()
checks={}

def sh(cmd):
    r=subprocess.run(cmd,capture_output=True,text=True)
    return r.returncode==0, r.stderr.strip()[:1000]
for rel in ['api/restaurant-search.js','api/clean-entry.js','launch-hardening.js','dinliminate-sw.js']:
    checks[f'node syntax: {rel}']=sh(['node','--check',str(base/rel)])[0]
# Inline script syntax
inline=re.findall(r'<script(?:[^>]*)>([\s\S]*?)</script>',html,re.I)
inline_results=[]
for i,code in enumerate(inline):
    f=Path(f'/tmp/p636-cert-inline-{i}.js');f.write_text(code)
    inline_results.append(sh(['node','--check',str(f)])[0])
checks['all inline scripts syntax']=all(inline_results)
# Manifest + PNGs
m=json.loads((base/'dinliminate.webmanifest').read_text())
checks['manifest valid']=m.get('name')=='Dinliminate' and m.get('start_url')=='/' and m.get('scope')=='/' and len(m.get('icons',[]))>=2
for fn,w,h in [('dinliminate-icon-180.png',180,180),('dinliminate-icon-512.png',512,512),('dinliminate-icon.png',512,512)]:
    b=(base/fn).read_bytes(); checks[f'png valid {fn}']=b[:8]==b'\x89PNG\r\n\x1a\n' and struct.unpack('>II',b[16:24])==(w,h)
# No duplicate literal DOM IDs anywhere in source
ids=re.findall(r'\bid=["\']([^"\']+)["\']',html)
from collections import Counter
checks['zero duplicate literal IDs']=not {k:v for k,v in Counter(ids).items() if v>1}
# Requested functional markers
markers={
'back-to-home capture handler': "#homeMenuBtn" in html and 'DinliminateBackToStart' in hard and 'document.body.classList.remove(\'game-mode\',\'restaurant-mode\',\'finalist-mode\',\'overlay-open\',\'gesture-active\')' in hard,
'back-to-home clears pass': 'clearPassState();pass=null;' in hard,
'history calendar': 'renderHistoryCalendar' in hard and 'calendarCursor' in hard and '42' in hard,
'food quick reversible': 'toggleFoodQuick' in hard and 'Show ' in hard and 'btn.disabled=false' in html, 
'restaurant quick reversible': 'toggleRestaurantQuick' in hard and 'data-launch-rq' in hard and 'btn.disabled=false' in html or ('btn.disabled = false' in html and 'data-launch-rq' in hard),
'food secondary colors': 'random-food-btn' in css and 'add-food-btn' in css and 'pass-food-btn' in css,
'american quick cut': 'American' in html and "american" in hard.lower(),
'potato/pasta/healthy/soup stew quick cuts': all(x.lower() in html.lower() for x in ['Potato','Pasta','Healthy','Soup / Stew']),
'no order UI wording': all(x not in html for x in ['Search / Order','Website / Order','Visit / Order','Search/Order']),
'no internal licensing warning': 'verify image rights' not in html.lower(),
'no internal nearby business wording': 'nearby business data' not in html.lower(),
'no visible Open Now control': 'id="restaurantOpenNowBtn"' not in html and 'Open Now' not in html,
'100 mile UI': '100 mi' in html and 'value="100"' in html,
'stable IDs api': 'osm-' in api and 'slugStable' in api and 'osm_id' in api,
'address geocoder stack': all(x in api for x in ['geocoding.geo.census.gov','geocode.arcgis.com','photon.komoot.io']),
'fast food in search': 'fast_food' in api and 'FAST_FOOD_BRANDS' in api,
'pwa sw registration': 'serviceWorker.register' in html and 'dinliminate-shell-p636-clean-final' in sw,
'pwa manifest icons': 'dinliminate-icon-180.png' in (base/'dinliminate.webmanifest').read_text() and 'dinliminate-icon-512.png' in (base/'dinliminate.webmanifest').read_text(),
'version consistency core': 'p636-clean-final' in (html+hard+api+sw+clean) and 'dinliminate-shell-p636-clean-final' in sw,
'dynamic winner ids removed': 'id="winnerSaveBtn"' not in html and 'id="winnerDetailsBtn"' not in html,
'dynamic restaurant empty ids removed': 'id="restaurantEmptyFind"' not in html and 'id="restaurantEmptyLocation"' not in html,
}
checks.update(markers)
# Ensure legacy five refactor markers are recorded, not accidentally claimed done.
checks['five deferred refactors documented']=all(x in (base/'qa/P636-FINAL-CERTIFICATION-2026-09-26.md').read_text() for x in ['6.','45.','46.','48.','49.'])
# API unit test
r=subprocess.run(['node',str(base/'qa/api_unit_test.js')],capture_output=True,text=True,timeout=120)
checks['api unit test']=r.returncode==0 and 'API_UNIT_TESTS_OK' in r.stdout
result={'checks':checks,'passed':sum(checks.values()),'total':len(checks),'overall':all(checks.values()),'inline_scripts':len(inline)}
(base/'qa/P636-FINAL-CERTIFICATION-RESULT.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2))
raise SystemExit(0 if result['overall'] else 1)
