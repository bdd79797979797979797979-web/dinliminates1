from pathlib import Path
from playwright.sync_api import sync_playwright
import json, re

root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
css=(root/'launch-hardening.css').read_text()
js=(root/'launch-hardening.js').read_text()
html=html.replace('./launch-hardening.css?v=p635', '').replace('./launch-hardening.js?v=p635', '')
# Avoid any service worker/release script behavior in test harness.
html=re.sub(r'<script id="dinliminate-release-migration">[\s\S]*?</script>', '', html, flags=re.I)
html=html.replace('src="dinliminate-sw.js"','')
# Inline hardening assets where their tags originally lived; both are appended late enough for test use.
html=html.replace('<head>','<head><style>'+css+'</style>',1)
html=html.replace('</body>','<script>'+js+'</script></body>',1)

errors=[]; logs=[]; uncaught=[]
checks=[]

def add(name, ok, detail=''):
    checks.append({'name':name,'ok':bool(ok),'detail':detail})

def mock_api(route):
    url=route.request.url
    from urllib.parse import urlparse, parse_qs
    q=parse_qs(urlparse(url).query)
    mode=q.get('mode',[''])[0]
    if mode=='suggest':
        out={'ok':True,'results':[
            {'lat':36.44267,'lon':-87.17841,'display':'801 Iron Workers Rd, Clarksville, Tennessee, 37043','precision':'address','query':'801 Iron Workers Rd, Clarksville, Tennessee, 37043'},
            {'lat':36.52776,'lon':-87.35887,'display':'Clarksville, Tennessee','precision':'place','query':'Clarksville, Tennessee'}]}
    elif mode=='resolve':
        txt=q.get('q',[''])[0]
        if 'Iron Workers' in txt:
            out={'ok':True,'location':{'lat':36.4426778,'lon':-87.1784093},'display':'801 Iron Workers Rd, Clarksville, Tennessee, 37043','precision':'PointAddress'}
        else:
            out={'ok':True,'location':{'lat':36.5277607,'lon':-87.3588703},'display':'Clarksville, Tennessee','precision':'Locality'}
    elif mode=='reverse':
        out={'ok':True,'display':'Clarksville, Tennessee','city':'Clarksville'}
    elif mode=='search':
        rows=[
          {'id':'osm-node-1','name':'McDonald\'s','type':'restaurant','amenity':'fast_food','fastFood':True,'category':'Fast Food','cuisine':'burger','address':'1 Main St, Clarksville, TN, 37040','phone':'','website':'https://mcdonalds.com','opening_hours':'','lat':36.5277,'lon':-87.3588,'distanceMiles':0.1,'photo':'','rating':0,'menuItems':[]},
          {'id':'osm-node-2','name':'Waffle House','type':'restaurant','amenity':'restaurant','fastFood':False,'category':'American','cuisine':'american','address':'2 Main St, Clarksville, TN, 37040','phone':'','website':'','opening_hours':'','lat':36.53,'lon':-87.36,'distanceMiles':0.3,'photo':'','rating':0,'menuItems':[]},
          {'id':'osm-node-3','name':'Roux','type':'restaurant','amenity':'restaurant','fastFood':False,'category':'American','cuisine':'american','address':'3 Main St, Clarksville, TN, 37040','phone':'','website':'','opening_hours':'','lat':36.531,'lon':-87.361,'distanceMiles':0.4,'photo':'','rating':0,'menuItems':[]},
        ]
        out={'ok':True,'radiusMiles':10,'results':rows,'restaurants':rows,'items':rows,'count':3,'fastFoodCount':1,'providersUsed':['OpenStreetMap']}
    elif mode=='health':
        out={'ok':True,'version':'qa','maxRadiusMiles':100}
    else:
        out={'ok':False,'code':'UNKNOWN_MODE','message':'unknown'}
    route.fulfill(status=200,headers={'content-type':'application/json'},body=json.dumps(out))

def run():
  with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium')
    page=browser.new_page(viewport={'width':393,'height':852})
    page.on('console', lambda m: logs.append((m.type,m.text)))
    page.on('pageerror', lambda e: uncaught.append(str(e)))
    page.on('requestfailed', lambda r: errors.append('requestfailed '+r.url+' '+str(r.failure)))
    page.route(re.compile(r'https?://[^/]+/_api/restaurant-search\\?.*'), mock_api)
    page.route(re.compile(r'https?://[^/]+/api/restaurant-search\\?.*'), mock_api)
    page.set_content(html, wait_until='domcontentloaded', timeout=8000)
    page.wait_for_timeout(1000)
    add('home renders', 'What sounds good' in page.locator('#homePanel').inner_text())
    add('home no horizontal scroll', page.evaluate('document.documentElement.scrollWidth <= innerWidth'))
    add('home random cut absent', page.locator('#randomBtn').count()==1 and page.locator('#randomBtn').evaluate('(e)=>e.closest("#gamePanel")?.classList.contains("hidden")===true'))
    # Food start.
    page.locator('#startBtn').click(); page.wait_for_timeout(250)
    add('food starts', page.locator('#gamePanel').is_visible())
    before=page.locator('#countNumber').inner_text()
    page.locator('#cutBtn').click(); page.wait_for_timeout(350)
    add('cut decrements', int(page.locator('#countNumber').inner_text())==int(before)-1)
    page.locator('#backBtn').click(); page.wait_for_timeout(200)
    add('undo restores count', page.locator('#countNumber').inner_text()==before)
    page.locator('#holdBtn').click(); page.wait_for_timeout(350)
    add('maybe decrements', page.locator('#countNumber').inner_text()==str(int(before)-1))
    # Back home then restaurant.
    page.evaluate('window.DinliminateBackToStart?.()'); page.wait_for_timeout(150)
    page.locator('#homeRestaurantQuick').click(); page.wait_for_timeout(150)
    add('restaurant screen opens', page.locator('#restaurantPanel').is_visible())
    # Address autocomplete. Use native DOM dispatch because controlled value isn't React.
    inp=page.locator('#restaurantLocationInput')
    inp.fill('801 Iron Workers Rd, Clarksville, TN')
    inp.dispatch_event('input'); page.wait_for_timeout(900)
    add('address suggestions appear', page.locator('#restaurantAddressSuggestions .restaurant-address-suggestion').count()>=1)
    if page.locator('#restaurantAddressSuggestions .restaurant-address-suggestion').count():
        page.locator('#restaurantAddressSuggestions .restaurant-address-suggestion').first.click(); page.wait_for_timeout(500)
    add('address selected or search started', '801 Iron Workers' in inp.input_value() or 'Finding' in page.locator('#restaurantStatus').inner_text())
    # Direct Find after address typed.
    inp.fill('801 Iron Workers Rd, Clarksville, TN'); page.locator('#restaurantLoadBtn').click(); page.wait_for_timeout(700)
    add('restaurant results load', page.locator('#restaurantStage').inner_text().find('McDonald')>=0 or page.locator('#restaurantTopCount').inner_text()!='0')
    add('fast food present', 'McDonald' in page.locator('#restaurantStage').inner_text())
    # Check duplicate ids after hardening has run.
    for id_ in ['restaurantSearchBtn','restaurantPassAroundBtn','restaurantOpenNowBtn']:
        cnt=page.locator('#'+id_).count(); add('unique '+id_,cnt==1,str(cnt))
    # Search utility.
    page.locator('#restaurant-tool-placeholder').click() if False else page.locator('#restaurantSearchBtn').last.click(); page.wait_for_timeout(100)
    add('inline restaurant search opens', page.locator('#restaurantInlineSearch').is_visible())
    # quick cut reversible
    buttons=page.locator('#restaurantQuickCuts .restaurant-quick-cut')
    add('restaurant quick cuts present', buttons.count()>=1)
    if buttons.count():
        b=buttons.first; p1=b.get_attribute('aria-pressed'); b.click(); p2=b.get_attribute('aria-pressed'); b.click(); p3=b.get_attribute('aria-pressed'); add('restaurant quick cut reversible',(p1,p2,p3)==('false','true','false'),str((p1,p2,p3)))
    # menus/settings/history
    page.locator('#restaurantMenuBtn').click(); page.wait_for_timeout(80)
    add('menu opens', not page.locator('#drawer').get_attribute('class').find('hidden')>=0)
    page.locator('#settingsBtn').click(); page.wait_for_timeout(100)
    add('settings opens', page.locator('#settingsBackdrop').is_visible())
    page.locator('#closeSettingsBtn').click(); page.wait_for_timeout(50)
    page.locator('#historyMenuBtn').click(); page.wait_for_timeout(100)
    add('history opens', page.locator('#libraryBackdrop').is_visible())
    # Accessibility / errors summary.
    add('no uncaught runtime errors', not uncaught, '; '.join(uncaught[:4]))
    add('no failed requests', not errors, '; '.join(errors[:4]))
    print(json.dumps({'ok':all(x['ok'] for x in checks),'checks':checks,'uncaught':uncaught[:10],'requestFailures':errors[:10],'consoleErrors':[x for x in logs if x[0] in ('error','warning')][:10]},indent=2))
    browser.close()
if __name__=='__main__': run()
