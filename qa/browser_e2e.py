import json, subprocess, time, urllib.request
from pathlib import Path
import websocket
PORT=18765; CDP=19224
ROOT=Path(__file__).resolve().parents[1]
server=subprocess.Popen(['python','-u',str(ROOT/'qa/mock_server.py'),str(PORT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
chrome=subprocess.Popen(['chromium','--headless=new','--disable-gpu','--no-sandbox','--disable-dev-shm-usage',f'--remote-debugging-port={CDP}','--remote-allow-origins=*',f'--user-data-dir=/tmp/p636-chrome-{int(time.time())}','about:blank'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
  tabs=[]
  for _ in range(80):
    try:
      tabs=json.load(urllib.request.urlopen(f'http://127.0.0.1:{CDP}/json',timeout=1));
      if tabs: break
    except Exception: time.sleep(.25)
  ws=websocket.create_connection(tabs[0]['webSocketDebuggerUrl'],timeout=10)
  seq=0
  def call(method,params=None):
    global seq
    seq+=1; my=seq; ws.send(json.dumps({'id':my,'method':method,'params':params or {}}))
    while True:
      m=json.loads(ws.recv())
      if m.get('id')==my: return m
  def js(code):
    r=call('Runtime.evaluate',{'expression':code,'awaitPromise':True,'returnByValue':True})
    rr=r.get('result',{})
    if 'exceptionDetails' in rr: raise RuntimeError(rr['exceptionDetails'])
    return rr['result'].get('value')
  call('Page.enable'); call('Runtime.enable');
  call('Page.navigate',{'url':f'http://127.0.0.1:{PORT}/index.html'})
  for _ in range(80):
    try:
      ready=js('!!document.querySelector("#startBtn")')
      if ready: break
    except: pass
    time.sleep(.25)
  results={}
  results['home']=json.loads(js('JSON.stringify({title:document.title,home:!!document.querySelector("#homePanel"),text:document.body.innerText.slice(0,300),scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],version:(document.documentElement.innerHTML.match(/DINLIMINATE_VERSION\\s*=\\s*[\'\"]([^\'\"]+)/)||[])[1]||null})'))
  js('document.querySelector("#startBtn").click()'); time.sleep(.3)
  results['food_start']=json.loads(js('JSON.stringify({mode:document.body.className,count:document.querySelector("#countNumber")?.textContent,controls:["hideBtn","backBtn","cutBtn","holdBtn","randomBtn","addDuringBtn","foodPassAroundBtn"].map(id=>({id,exists:!!document.getElementById(id),disabled:!!document.getElementById(id)?.disabled}))})'))
  b=js('document.querySelector("#countNumber")?.textContent'); js('document.querySelector("#cutBtn").click()'); time.sleep(.35); c=js('document.querySelector("#countNumber")?.textContent'); js('document.querySelector("#backBtn").click()'); time.sleep(.15); d=js('document.querySelector("#countNumber")?.textContent'); js('document.querySelector("#holdBtn").click()'); time.sleep(.35); e=js('document.querySelector("#countNumber")?.textContent')
  results['food_actions']={'before':b,'afterCut':c,'afterBack':d,'afterMaybe':e}
  js('document.querySelector("#menuBtn").click()'); time.sleep(.1); js('document.querySelector("#homeMenuBtn").click()'); time.sleep(.1); js('document.querySelector("#homeRestaurantQuick").click()'); time.sleep(.35)
  results['restaurant_ui']=json.loads(js('JSON.stringify({mode:document.body.className,input:!!document.querySelector("#restaurantLocationInput"),quickcuts:[...document.querySelectorAll("#restaurantQuickCuts .restaurant-quick-cut")].map(x=>x.innerText.trim()),searchButtons:document.querySelectorAll("#restaurantSearchBtn").length,passButtons:document.querySelectorAll("#restaurantPassAroundBtn").length,openFilter:!!document.querySelector("#restaurantOpenUnknownBtn")})'))
  js('const i=document.querySelector("#restaurantLocationInput");i.value="801 Iron Workers Rd, Clarksville, TN";i.dispatchEvent(new Event("input",{bubbles:true}))'); time.sleep(1.0)
  results['suggest']=json.loads(js('JSON.stringify({visible:!document.querySelector("#restaurantAddressSuggestions")?.classList.contains("hidden"),suggestions:[...document.querySelectorAll(".restaurant-address-suggestion")].map(x=>x.innerText.trim())})'))
  js('document.querySelector(".restaurant-address-suggestion")?.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerId:1,pointerType:"touch"}))'); time.sleep(1.2)
  results['restaurant_results']=json.loads(js('JSON.stringify({count:document.querySelector("#restaurantTopCount")?.textContent,card:document.querySelector("#restaurantStage")?.innerText?.slice(0,600),missing:document.querySelector("#restaurantStage")?.innerText?.includes("couldn’t complete"),specificQuickCuts:[...document.querySelectorAll("#restaurantQuickCuts .restaurant-quick-cut")].map(x=>x.innerText.trim()).filter(x=>/American|Potato|Pasta|Healthy|Soup \/ Stew/.test(x))})'))
  results['manifest']=js('fetch("/dinliminate.webmanifest").then(async r=>JSON.stringify({status:r.status,type:r.headers.get("content-type"),json:(await r.json()).icons}))')
  results['icon']=js('fetch("/dinliminate-icon-512.png").then(r=>JSON.stringify({status:r.status,type:r.headers.get("content-type"),size:r.headers.get("content-length")}))')
  print(json.dumps(results,indent=2))
  ws.close()
finally:
  try: chrome.kill()
  except: pass
  try: server.kill()
  except: pass
