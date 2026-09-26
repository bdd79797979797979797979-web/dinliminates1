from pathlib import Path
from playwright.sync_api import sync_playwright
import json, re, subprocess, time, os
root=Path(__file__).resolve().parents[1]
checks=[]; errors=[]; console=[]
html=(root/'index.html').read_text()
css=(root/'launch-hardening.css').read_text()
js=(root/'launch-hardening.js').read_text()
html=html.replace('./launch-hardening.css?v=p635','').replace('./launch-hardening.js?v=p635','')
html=re.sub(r'<script id="dinliminate-release-migration">[\s\S]*?</script>','',html,flags=re.I).replace('src="dinliminate-sw.js"','')
html=html.replace('<head>','<head><style>'+css+'</style>',1)
html=html.replace('</body>','<script>'+js+'</script></body>',1)
def add(name, ok, detail=''):
    checks.append({'name':name,'ok':bool(ok),'detail':detail})

def mock_api(route):
    from urllib.parse import urlparse, parse_qs, unquote
    q=parse_qs(urlparse(route.request.url).query)
    mode=q.get('mode',[''])[0]
    if mode=='suggest':
        raw=unquote(q.get('q',[''])[0])
        if re.match(r'^\s*\d', raw):
            rows=[{'lat':36.4426778,'lon':-87.1784093,'display':'801 Iron Workers Rd, Clarksville, Tennessee, 37043','precision':'PointAddress','query':'801 Iron Workers Rd, Clarksville, Tennessee, 37043'}]
        else:
            rows=[{'lat':36.5277607,'lon':-87.3588703,'display':'Clarksville, Tennessee','precision':'Locality','query':'Clarksville, Tennessee'}]
        out={'ok':True,'results':rows}
    elif mode=='resolve':
        raw=unquote(q.get('q',[''])[0])
        if 'Iron Workers' in raw or '37043' in raw:
            out={'ok':True,'location':{'lat':36.4426778,'lon':-87.1784093},'display':'801 Iron Workers Rd, Clarksville, Tennessee, 37043','precision':'PointAddress'}
        else:
            out={'ok':True,'location':{'lat':36.5277607,'lon':-87.3588703},'display':'Clarksville, Tennessee','precision':'Locality'}
    elif mode=='reverse':
        out={'ok':True,'display':'Clarksville, Tennessee','city':'Clarksville'}
    elif mode=='search':
        rows=[
          {'id':'osm-node-1','name':"McDonald's",'type':'restaurant','amenity':'fast_food','fastFood':True,'category':'Fast Food','cuisine':'burger','address':'1 Main St, Clarksville, TN, 37040','phone':'','website':'https://mcdonalds.com','opening_hours':'','lat':36.5277,'lon':-87.3588,'distanceMiles':0.1,'photo':'','rating':0,'menuItems':[]},
          {'id':'osm-node-2','name':'Waffle House','type':'restaurant','amenity':'restaurant','fastFood':False,'category':'American','cuisine':'american','address':'2 Main St, Clarksville, TN, 37040','phone':'','website':'','opening_hours':'','lat':36.53,'lon':-87.36,'distanceMiles':0.3,'photo':'','rating':0,'menuItems':[]},
          {'id':'osm-node-3','name':'Roux','type':'restaurant','amenity':'restaurant','fastFood':False,'category':'American','cuisine':'american','address':'3 Main St, Clarksville, TN, 37040','phone':'','website':'','opening_hours':'','lat':36.531,'lon':-87.361,'distanceMiles':0.4,'photo':'','rating':0,'menuItems':[]},
        ]
        out={'ok':True,'radiusMiles':10,'results':rows,'restaurants':rows,'items':rows,'count':3,'fastFoodCount':1,'providersUsed':['OpenStreetMap'],'diagnostics':{'osmEndpointsResponded':1,'osmEndpointsWithData':1,'osmEndpointsTotal':1}}
    elif mode=='health': out={'ok':True,'version':'audit','maxRadiusMiles':100}
    else: out={'ok':False,'code':'UNKNOWN_MODE','message':'unknown'}
    route.fulfill(status=200,headers={'content-type':'application/json'},body=json.dumps(out))

server=subprocess.Popen(['python3','-m','http.server','8765','--directory',str(root)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(.5)
try:
  with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':393,'height':852}, device_scale_factor=1)
    page.on('console', lambda m: console.append((m.type,m.text)))
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('requestfailed', lambda r: errors.append('requestfailed '+r.url+' '+str(r.failure)))
    page.route(re.compile(r'.*/api/restaurant-search\\?.*'), mock_api)
    html_test=html.replace("const http=()=>location.protocol==='https:'||location.protocol==='http:';","const http=()=>true;").replace("const apiBase=()=>location.hostname.endsWith('.floot.app')?'/_api/restaurant-search':'/api/restaurant-search'; const api=(params)=>{if(!http())throw Object.assign(new Error('Restaurant search needs the deployed HTTPS app.'),{code:'NO_HTTP'});return new URL(apiBase()+'?'+new URLSearchParams(params),location.origin).toString();};","const apiBase=()=>'/api/restaurant-search'; const api=(params)=>'http://mock.local/api/restaurant-search?'+new URLSearchParams(params);")
    page.set_content(html_test, wait_until='domcontentloaded', timeout=10000)
    page.wait_for_timeout(700)
    # Home
    add('home renders', 'What sounds good' in page.locator('#homePanel').inner_text())
    add('home no horizontal scroll', page.evaluate('document.documentElement.scrollWidth <= innerWidth'))
    add('home random cut not visible', page.locator('#randomBtn').count()==1 and page.locator('#randomBtn').evaluate('(e)=>getComputedStyle(e).display===\'none\' || e.closest(\'.game-panel\')?.classList.contains(\'hidden\')===true'))
    # Food
    page.locator('#startBtn').click(); page.wait_for_timeout(250)
    add('food opens', page.locator('#gamePanel').is_visible())
    base=int(page.locator('#countNumber').inner_text())
    page.locator('#cutBtn').click(); page.wait_for_timeout(350)
    add('food Cut decrements one', int(page.locator('#countNumber').inner_text())==base-1)
    page.locator('#backBtn').click(); page.wait_for_timeout(200)
    add('food Back restores', int(page.locator('#countNumber').inner_text())==base)
    page.locator('#holdBtn').click(); page.wait_for_timeout(350)
    add('food Maybe removes from active deck', int(page.locator('#countNumber').inner_text())==base-1)
    # quick cut reversible
    page.evaluate('window.DinliminateBackToStart?.()'); page.wait_for_timeout(120); page.locator('#startBtn').click(); page.wait_for_timeout(180)
    qb=page.locator('#quickCutsBar .quick-cut').filter(has_text='Burgers').first
    if qb.count():
      before=page.locator('#countNumber').inner_text(); qb.click(); page.wait_for_timeout(120); mid=page.locator('#countNumber').inner_text(); qb=page.locator('#quickCutsBar .quick-cut').filter(has_text='Burgers').first; qb.click(); page.wait_for_timeout(120); after=page.locator('#countNumber').inner_text(); add('food Quick Cut reversible', after==before and mid!=before)
    else: add('food Quick Cut exists',False)
    # Add food modal compact + no horizontal overflow
    page.locator('#addDuringBtn').click(); page.wait_for_timeout(80)
    add('Add Food opens', page.locator('#modalBackdrop').is_visible())
    add('Add Food no horizontal scroll', page.locator('#modalBackdrop').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'))
    page.locator('#cancelBtn').click();
    # Restaurant
    page.evaluate('window.DinliminateBackToStart?.()'); page.wait_for_timeout(120); page.locator('#homeRestaurantQuick').click(); page.wait_for_timeout(120)
    add('restaurant opens', page.locator('#restaurantPanel').is_visible())
    inp=page.locator('#restaurantLocationInput')
    inp.fill('801 Iron Workers Rd, Clarksville, TN'); inp.dispatch_event('input'); page.wait_for_timeout(550)
    sugg=page.locator('#restaurantAddressSuggestions .restaurant-address-suggestion')
    add('address autocomplete appears', sugg.count()>=1, f'count={sugg.count()}')
    if sugg.count(): sugg.first.click(); page.wait_for_timeout(450)
    add('exact address selected', '801 Iron Workers' in inp.input_value())
    inp.fill('801 Iron Workers Rd, Clarksville, TN'); page.locator('#restaurantLoadBtn').click(); page.wait_for_timeout(650)
    stage=page.locator('#restaurantStage').inner_text()
    add('typed-address Find loads restaurants', 'McDonald' in stage or 'Waffle House' in stage)
    add('fast food included', 'McDonald' in stage)
    add('radius supports 100', page.locator('#restaurantRadiusFilter option[value="100"]').count()==1)
    add('Open Now filter removed from UI', page.locator('#restaurantOpenNowBtn').count()==0 and page.locator('.restaurant-open-chip').count()==0)
    add('restaurant Search button unique', page.locator('#restaurantSearchBtn').count()==1)
    add('restaurant Pass Around button unique', page.locator('#restaurantPassAroundBtn').count()==1)
    add('no order wording', not bool(re.search(r'\\bOrder\\b', stage, re.I)))
    # Restaurant swipe/action buttons
    before=page.locator('#restaurantTopCount').inner_text() if page.locator('#restaurantTopCount').count() else ''
    if page.locator('#restaurantCutBtn').count():
      page.locator('#restaurantCutBtn').click(); page.wait_for_timeout(350)
      after=page.locator('#restaurantTopCount').inner_text() if page.locator('#restaurantTopCount').count() else ''
      add('restaurant Cut changes count', after!=before)
      page.locator('#restaurantBackAction').click(); page.wait_for_timeout(180)
      add('restaurant Undo restores card count', (page.locator('#restaurantTopCount').inner_text() if page.locator('#restaurantTopCount').count() else '')==before)
    # Search utility
    page.locator('#restaurantSearchBtn').click(); page.wait_for_timeout(50)
    add('restaurant inline Search opens', page.locator('#restaurantInlineSearch').is_visible())
    # Quick cuts toggle
    rq=page.locator('#restaurantQuickCuts .restaurant-quick-cut').first
    if rq.count() and not rq.is_disabled():
      p1=rq.get_attribute('aria-pressed'); rq.click(); page.wait_for_timeout(100); p2=rq.get_attribute('aria-pressed'); rq.click(); page.wait_for_timeout(100); p3=rq.get_attribute('aria-pressed'); add('restaurant Quick Cut reversible',(p1,p2,p3)==('false','true','false'),str((p1,p2,p3)))
    # menu/settings/history and restore wiring
    page.locator('#restaurantMenuBtn').click(); page.wait_for_timeout(50)
    add('menu opens', not page.locator('#drawer').get_attribute('class').count('hidden'))
    page.locator('#settingsBtn').click(); page.wait_for_timeout(100)
    add('settings opens', page.locator('#settingsBackdrop').is_visible())
    add('system restore visible', 'Restore defaults' in page.locator('#settingsBackdrop').inner_text())
    page.locator('#closeSettingsBtn').click(); page.wait_for_timeout(30)
    page.locator('#restaurantMenuBtn').click(); page.wait_for_timeout(30)
    page.locator('#historyMenuBtn').click(); page.wait_for_timeout(100)
    add('history opens', page.locator('#libraryBackdrop').is_visible())
    add('history calendar visible', page.locator('.history-calendar-grid').count()==1)
    # pass around opens
    page.locator('#closeLibraryBtn').click(); page.wait_for_timeout(30); page.locator('#restaurantPassAroundBtn').click(); page.wait_for_timeout(80)
    add('restaurant Pass Around setup opens', page.locator('#passSetupBackdrop').is_visible())
    if page.locator('#passSetupBackdrop').is_visible(): page.locator('[data-pass-cancel]').click()
    # duplicate ids and accessibility basics
    ids=page.locator('[id]').all()
    id_names=[]
    for e in ids:
      try: id_names.append(e.get_attribute('id'))
      except: pass
    dup=sorted({x for x in id_names if x and id_names.count(x)>1})
    add('no duplicate IDs', not dup, ','.join(dup))
    add('no uncaught page errors', not errors, '; '.join(errors[:5]))
    add('no console errors', not [x for x in console if x[0]=='error'], '; '.join([x[1] for x in console if x[0]=='error'][:5]))
    page.screenshot(path=str(root/'qa/p636-final-iphone.png'), full_page=False)
    print(json.dumps({'ok':all(x['ok'] for x in checks),'passed':sum(x['ok'] for x in checks),'total':len(checks),'checks':checks,'errors':errors[:10],'consoleErrors':[x for x in console if x[0]=='error'][:10]}, indent=2))
    browser.close()
finally:
  server.terminate()
  try: server.wait(timeout=2)
  except: server.kill()
