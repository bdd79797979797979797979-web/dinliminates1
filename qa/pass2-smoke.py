from pathlib import Path
import json
from playwright.sync_api import sync_playwright
root=Path('/mnt/data/Dinliminate_P630_PASS5')
html=(root/'index.html').read_text(); css=(root/'launch-hardening.css').read_text(); js=(root/'launch-hardening.js').read_text()
inlined=html.replace('<link rel="stylesheet" href="./launch-hardening.css?v=p630">',f'<style>{css}</style>').replace('<script src="./launch-hardening.js?v=p630" defer></script>',f'<script>{js}</script>')
checks=[]
def add(name,ok,detail=''): checks.append({'name':name,'ok':ok,'detail':detail})
with sync_playwright() as pw:
  b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  p=b.new_page(viewport={'width':390,'height':844}); p.set_default_timeout(2000)
  p.set_content(inlined,wait_until='domcontentloaded',timeout=5000); p.wait_for_timeout(500)
  try:
    add('home', 'Dinner Decisions' in p.locator('title').inner_text() or 'Dinliminate' in p.title())
    p.evaluate('() => window.resetList()'); p.wait_for_timeout(300)
    c=p.locator('#quickCutsBar [data-launch-quick]').count(); add('food quick cuts',c==15,str(c))
    if c:
      q=p.locator('#quickCutsBar [data-launch-quick]').first; before=q.get_attribute('aria-pressed'); q.evaluate('(el)=>el.click()'); hidden=q.get_attribute('aria-pressed'); q.evaluate('(el)=>el.click()'); restored=q.get_attribute('aria-pressed'); add('quick cut reversible',(before,hidden,restored)==('false','true','false'))
    # patch persistence and create a small active deck using lexical bindings
    p.evaluate("""() => { window.__qaStore={}; window.safeWrite=(k,v)=>{__qaStore[k]=String(v);return true}; window.safeRead=(k,f)=>Object.prototype.hasOwnProperty.call(__qaStore,k)?__qaStore[k]:f; window.customItems=[]; window.resetList(); }""")
    add('start fresh deck',p.evaluate('activeItems.length')>1,str(p.evaluate('activeItems.length')))
    st=p.evaluate("() => JSON.parse(__qaStore.dinliminateFoodRound||'null')"); add('food round persisted',bool(st and len(st.get('base',[]))>=2),str(len(st.get('active',[])) if st else 0))
    # pass around
    p.evaluate("() => { activeItems=activeItems.slice(0,6); originalCount=6; renderStage(); }")
    p.evaluate("document.querySelector('#passAroundBtn')?.click()")
    add('pass setup',p.locator('#passSetupBackdrop').count()==1)
    p.evaluate("document.querySelector('[data-pass-n=\"2\"]')?.click()")
    add('pass person 1', 'Person 1 of 2' in p.locator('#passStatus').inner_text())
    for i in range(6):
      p.evaluate("() => window.cutCurrent()")
    add('pass handoff',p.locator('#passHandoffBackdrop').count()==1)
    p.evaluate("document.querySelector('[data-pass-start]')?.click()")
    add('pass person 2', 'Person 2 of 2' in p.locator('#passStatus').inner_text())
    for i in range(6):
      p.evaluate("() => window.holdCurrent()")
    add('pass finals','FINALIST' in p.locator('#stage').inner_text() or 'finalists left' in p.locator('#gameStatus').inner_text().lower())
    # history
    p.evaluate("""() => {historyItems=[{id:'h1',name:'History Pizza',type:'home',date:new Date().toISOString(),photo:'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='}];libraryTab='history';renderLibrary();}""")
    add('history calendar',p.locator('.history-calendar-grid').count()==1)
    add('history x',p.locator('[data-history-remove]').count()==1)
    add('history details',p.locator('[data-history-open]').count()==1)
    p.evaluate("document.querySelector('[data-history-open]')?.click()")
    add('history opens detail', 'HISTORY PIZZA' in p.locator('#detailTitle').inner_text().upper())
    p.evaluate("closeDetails(); historyItems=[{id:'h1',name:'History Pizza',type:'home',date:new Date().toISOString(),photo:''}]; renderLibrary(); document.querySelector('[data-history-remove]')?.click()")
    add('history x removes',p.evaluate('historyItems.length')==0)
    add('history grid a11y',p.locator('.history-calendar-grid[role="grid"]').count()==1 and p.locator('.history-day[role="gridcell"]').count()==42)
    # restaurant controls
    p.evaluate("""() => {restaurantFilters={query:'',sort:'shuffle',openNow:false};activeRestaurants=[{id:'r1',name:'QA Burger',type:'restaurant',fastFood:true,distanceMiles:1,openNow:true,category:'Fast Food',rating:4.1,photoName:'places/a'}];holdingRestaurants=[];showRestaurantMode();renderRestaurantStage();}""")
    labs=[x.strip() for x in p.locator('#restaurantUtilityBar button').all_text_contents()]
    add('restaurant utility',['Open now','Search','Distance']==[x for x in labs if x in ('Open now','Search','Distance')],str(labs))
    add('legacy search gone',p.locator('#searchBtn').count()==0)
    p.evaluate("document.querySelector('#restaurantOpenNowBtn')?.click();document.querySelector('#restaurantDistanceBtn')?.click()")
    add('restaurant toggles',p.locator('#restaurantOpenNowBtn').get_attribute('aria-pressed')=='true' and p.locator('#restaurantDistanceBtn').get_attribute('aria-pressed')=='true')
    add('restaurant quick cut scope',p.locator('#restaurantQuickCuts .restaurant-quick-cut').count()==1 and p.locator('#restaurantQuickCuts .quick-cut-copy strong').first.inner_text()=='Fast Food')
    u=p.evaluate("() => restaurantPhotoUrl({type:'restaurant',name:'QA',photoName:'places/abc123'})"); add('photo proxy', 'mode=photo' in u and 'places%2Fabc123' in u,u)
    p.evaluate("() => { closeDetails(); activeRestaurants=[{id:'r1',name:'QA Burger',type:'restaurant',fastFood:true,distanceMiles:1,openNow:true,category:'Fast Food'},{id:'r2',name:'QA Pizza',type:'restaurant',fastFood:false,distanceMiles:2,openNow:true,category:'Restaurant'}]; holdingRestaurants=[]; restaurantBase=[...activeRestaurants]; restaurantFilters={query:'',sort:'shuffle',openNow:false}; restaurantFinalistMode=false; renderRestaurantStage(); }")
    p.evaluate("document.querySelector('#restaurantPassAroundBtn')?.click()")
    add('restaurant pass setup',p.locator('#passSetupBackdrop').count()==1)
    p.evaluate("document.querySelector('[data-pass-n=\"2\"]')?.click()")
    p.evaluate("() => window.restaurantCut()")
    p.evaluate("() => window.restaurantCut()")
    add('restaurant pass handoff',p.locator('#passHandoffBackdrop').count()==1)
    p.evaluate("document.querySelector('[data-pass-start]')?.click()")
    add('restaurant pass full pool',p.evaluate('activeRestaurants.length')==2,str(p.evaluate('activeRestaurants.length')))
    p.evaluate("() => window.restaurantKeep()")
    p.evaluate("() => window.restaurantKeep()")
    add('restaurant pass finalists',p.evaluate('restaurantFinalistMode===true && activeRestaurants.length===2'),str(p.evaluate('activeRestaurants.length')))
    p.evaluate("closeDetails(); openDetails({id:'r1',name:'QA Burger',type:'restaurant',photoName:'places/abc123',address:'1 Test St',rating:4.1,category:'Fast Food'})")
    add('report data button',p.locator('#detailReportBtn').count()==1)
    # responsive screenshots
    for w in (390,430,768):
      p.set_viewport_size({'width':w,'height':932 if w<500 else 1024}); p.screenshot(path=str(root/f'qa/pass2-{w}.png'),full_page=True); add(f'responsive {w}',p.locator('body').inner_text().strip()!='')
  finally:
    b.close()
result={'ok':all(c['ok'] for c in checks),'checks':checks,'failed':[c for c in checks if not c['ok']]}
(root/'qa/pass2-results.json').write_text(json.dumps(result,indent=2)); print(json.dumps(result,indent=2))
