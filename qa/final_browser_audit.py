from pathlib import Path
from playwright.sync_api import sync_playwright
import json, re

root=Path(__file__).resolve().parents[1]
h=(root/'index.html').read_text()
css=(root/'launch-hardening.css').read_text()
js=(root/'launch-hardening.js').read_text()
h=re.sub(r'<script id="dinliminate-release-migration">[\s\S]*?</script>','',h,flags=re.I)
h=re.sub(r'<link[^>]+launch-hardening\.css[^>]*>','',h,flags=re.I)
h=re.sub(r'<script[^>]+src=["\']\.\/launch-hardening\.js[^>]*>[\s\S]*?</script>','',h,flags=re.I)
h=re.sub(r'<script id="dinliminate-p636-final-sw">[\s\S]*?</script>','',h,flags=re.I)
h=h.replace('<link href="dinliminate.webmanifest" rel="manifest">','')
h=h.replace('<link href="./dinliminate-icon.svg" rel="icon" type="image/svg+xml">','')
h=h.replace('</head>', '<style>'+css+'</style></head>', 1)
h=h.replace('</body>', '<script>'+js+'</script></body>', 1)
h=h.replace("const http=()=>location.protocol==='https:'||location.protocol==='http:';", "const http=()=>true;")
h=h.replace("const apiBase=()=>location.hostname.endsWith('.floot.app')?'/_api/restaurant-search':'/api/restaurant-search'; const api=(params)=>{if(!http())throw Object.assign(new Error('Restaurant search needs the deployed HTTPS app.'),{code:'NO_HTTP'});return new URL(apiBase()+'?'+new URLSearchParams(params),location.origin).toString();};", "const apiBase=()=> 'http://mock.local/api/restaurant-search'; const api=(params)=>apiBase()+'?'+new URLSearchParams(params);")

checks=[]; errors=[]; console_events=[]
def add(n,ok,d=''): checks.append({'name':n,'ok':bool(ok),'detail':d})

def api_route(route):
    from urllib.parse import urlparse,parse_qs,unquote
    q=parse_qs(urlparse(route.request.url).query); mode=q.get('mode',[''])[0]; query=unquote(q.get('q',[''])[0])
    if mode=='suggest':
        rows=[{'lat':36.4426778,'lon':-87.1784093,'display':'801 Iron Workers Rd, Clarksville, Tennessee, 37043','query':'801 Iron Workers Rd, Clarksville, Tennessee, 37043','precision':'pointaddress','source':'ArcGIS Address'}] if query.lower().startswith('801') else [{'lat':36.5277607,'lon':-87.3588703,'display':'Clarksville, Tennessee','query':'Clarksville, Tennessee','precision':'locality','source':'ArcGIS Address'}]
        body={'ok':True,'results':rows}
    elif mode=='resolve':
        body={'ok':True,'location':{'lat':36.4426778,'lon':-87.1784093},'display':'801 Iron Workers Rd, Clarksville, Tennessee, 37043','precision':'pointaddress'} if query.lower().startswith('801') else {'ok':True,'location':{'lat':36.5277607,'lon':-87.3588703},'display':'Clarksville, Tennessee','precision':'locality'}
    elif mode=='reverse': body={'ok':True,'display':'Clarksville, Tennessee','city':'Clarksville'}
    elif mode=='search':
        rows=[]
        for i,name in enumerate(["McDonald's","Wendy's","Burger King","Waffle House","Applebee's","Roux"]):
            rows.append({'id':f'osm-node-{i+1}','name':name,'type':'restaurant','amenity':'fast_food' if i<3 else 'restaurant','fastFood':i<3,'category':'Fast Food' if i<3 else 'American','cuisine':'american' if i>=3 else '','tags':['restaurant','fast_food'] if i<3 else ['restaurant','american'],'address':f'{100+i} Main St, Clarksville, TN 37040','lat':36.52+i*0.001,'lon':-87.36,'distanceMiles':0.5+i*0.2,'photo':'','rating':0,'priceLevel':'','menuItems':[]})
        body={'ok':True,'radiusMiles':float(q.get('radius',['10'])[0]),'results':rows,'restaurants':rows,'items':rows,'count':6,'total':6,'fastFoodCount':3,'providersUsed':['OpenStreetMap'],'diagnostics':{'postpassTiles':1,'postpassCalls':1}}
    else: body={'ok':True,'version':'audit'}
    route.fulfill(status=200,headers={'content-type':'application/json'},body=json.dumps(body))

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':393,'height':852})
    page.set_default_timeout(5000)
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.on('console',lambda m: console_events.append((m.type,m.text)))
    page.route(re.compile(r'http://mock\.local/api/restaurant-search.*'),api_route)
    page.set_content(h,wait_until='domcontentloaded',timeout=15000)
    page.wait_for_timeout(400)
    add('1 Home renders',page.locator('#homePanel').is_visible() and 'What sounds good' in page.locator('#homePanel').inner_text())
    add('2 Home no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    add('3 Random Cut not exposed on home',not page.locator('#randomBtn').is_visible())
    page.locator('#startBtn').click(); page.wait_for_timeout(220)
    add('4 Food mode opens',page.locator('#gamePanel').is_visible())
    base=int(page.locator('#countNumber').inner_text())
    page.locator('#cutBtn').click(); page.wait_for_timeout(300); add('5 Food Cut decrements one',int(page.locator('#countNumber').inner_text())==base-1)
    page.locator('#backBtn').click(); page.wait_for_timeout(100); add('6 Food Back restores',int(page.locator('#countNumber').inner_text())==base)
    page.locator('#holdBtn').click(); page.wait_for_timeout(300); add('7 Food Maybe removes active choice',int(page.locator('#countNumber').inner_text())==base-1)
    page.evaluate('window.DinliminateBackToStart?.()');page.wait_for_timeout(100);page.locator('#startBtn').click();page.wait_for_timeout(120)
    qb=page.locator('#quickCutsBar .quick-cut').filter(has_text='Burgers').first
    if qb.count():
        b=int(page.locator('#countNumber').inner_text());qb.click();page.wait_for_timeout(100);m=int(page.locator('#countNumber').inner_text());page.locator('#quickCutsBar .quick-cut').filter(has_text='Burgers').first.click();page.wait_for_timeout(100);a=int(page.locator('#countNumber').inner_text());add('8 Food Quick Cut hide/restore',m<b and a==b)
    else:add('8 Food Burgers Quick Cut exists',False)
    page.locator('#addDuringBtn').click();page.wait_for_timeout(60);add('9 Add Food modal opens',page.locator('#modalBackdrop').is_visible());page.locator('#cancelBtn').click()
    page.evaluate('window.DinliminateBackToStart?.()');page.wait_for_timeout(100);page.locator('#homeRestaurantQuick').click();page.wait_for_timeout(160)
    add('10 Restaurant screen opens',page.locator('#restaurantPanel').is_visible())
    labels=' '.join(x.inner_text() for x in page.locator('#restaurantQuickCuts .restaurant-quick-cut').all())
    for label in ['American','Potato','Pasta','Healthy','Soup / Stew']: add(f'11 {label} Quick Cut present',label in labels)
    inp=page.locator('#restaurantLocationInput');inp.fill('801 Iron Workers Rd, Clarksville, TN');inp.dispatch_event('input');page.wait_for_timeout(550)
    add('16 Address autocomplete appears',page.locator('.restaurant-address-suggestion').count()>=1)
    if page.locator('.restaurant-address-suggestion').count(): page.locator('.restaurant-address-suggestion').first.dispatch_event('pointerdown')
    page.wait_for_timeout(250);add('17 Exact address retained', '801 Iron Workers' in inp.input_value())
    inp.fill('801 Iron Workers Rd, Clarksville, TN');page.locator('#restaurantLoadBtn').click();page.wait_for_timeout(500)
    stage=page.locator('#restaurantStage').inner_text()
    add('18 Typed-address Find loads restaurants','McDonald' in stage and 'Waffle House' in stage)
    add('19 Fast food included','McDonald' in stage)
    add('20 100-mile radius option',page.locator('#restaurantRadiusFilter option[value="100"]').count()==1)
    add('21 Open Now filter absent',page.locator('#restaurantOpenNowBtn').count()==0)
    add('22 Search button unique',page.locator('#restaurantSearchBtn').count()==1)
    add('23 Pass Around button unique',page.locator('#restaurantPassAroundBtn').count()==1)
    add('24 No visible Order wording',not bool(re.search(r'\bOrder\b',page.locator('#restaurantPanel').inner_text(),re.I)))
    if page.locator('#restaurantCutBtn').count():
        try:
            page.wait_for_function("document.querySelector('#restaurantCutBtn') && !document.querySelector('#restaurantCutBtn').disabled", timeout=10000)
        except Exception as e:
            add('25 Restaurant Cut is actionable after results load',False,str(e))
        else:
            b=int(page.locator('#restaurantTopCount').inner_text());page.locator('#restaurantCutBtn').click();page.wait_for_timeout(300);a=int(page.locator('#restaurantTopCount').inner_text());add('25 Restaurant Cut changes count',a!=b);page.locator('#restaurantBackAction').click();page.wait_for_timeout(100);add('26 Restaurant Undo restores',int(page.locator('#restaurantTopCount').inner_text())==b)
    page.locator('#restaurantPassAroundBtn').click();page.wait_for_timeout(70);add('27 Restaurant Pass Around opens',page.locator('#passSetupBackdrop').is_visible());page.locator('[data-pass-cancel]').click()
    page.locator('#restaurantMenuBtn').click();page.wait_for_timeout(50);page.locator('#settingsBtn').click();page.wait_for_timeout(80);add('28 Settings opens',page.locator('#settingsBackdrop').is_visible());add('29 System Restore present',page.locator('#systemRestoreBtn').count()==1);page.locator('#closeSettingsBtn').click();page.wait_for_timeout(30);page.locator('#restaurantMenuBtn').click();page.wait_for_timeout(30);page.locator('#historyMenuBtn').click();page.wait_for_timeout(80);add('30 History opens',page.locator('#libraryBackdrop').is_visible());add('31 History calendar present',page.locator('.history-calendar-grid').count()==1);page.locator('#closeLibraryBtn').click()
    dups=page.evaluate("(()=>{const a=[...document.querySelectorAll('[id]')].map(e=>e.id).filter(Boolean);return [...new Set(a.filter((x,i)=>a.indexOf(x)!==i))]})()")
    add('32 No duplicate live DOM IDs',len(dups)==0,','.join(dups))
    add('33 No uncaught page errors',len(errors)==0,'; '.join(errors[:5]))
    add('34 No console error events',not [x for x in console_events if x[0]=='error'],'; '.join(x[1] for x in console_events if x[0]=='error')[:500])
    # Layout and touch-target checks on the active restaurant screen before closing.
    add('35 iPhone viewport no horizontal scroll',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    page.screenshot(path=str(root/'qa/p636-final-iphone.png'),full_page=False)
    result={'ok':all(c['ok'] for c in checks),'passed':sum(c['ok'] for c in checks),'total':len(checks),'checks':checks,'errors':errors,'console_errors':[x for x in console_events if x[0]=='error']}
    print(json.dumps(result,indent=2))
    (root/'qa/final-browser-results.json').write_text(json.dumps(result,indent=2))
    browser.close()
    if not result['ok']:
        raise SystemExit(1)
