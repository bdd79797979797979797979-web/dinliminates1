from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, parse_qs
import json
ROOT=Path(__file__).resolve().parents[1]
class H(BaseHTTPRequestHandler):
  def _send(self,code,ctype,body,headers=None):
    b=body.encode() if isinstance(body,str) else body
    self.send_response(code); self.send_header('Content-Type',ctype); self.send_header('Content-Length',str(len(b)))
    for k,v in (headers or {}).items(): self.send_header(k,v)
    self.end_headers(); self.wfile.write(b)
  def do_GET(self):
    u=urlparse(self.path); q=parse_qs(u.query)
    if u.path=='/api/restaurant-search':
      mode=q.get('mode',['health'])[0]
      if mode=='health': data={'ok':True,'version':'restaurant-v636-final','maxRadiusMiles':100,'googleConfigured':False,'providers':{'primary':'OpenStreetMap Postpass','geocoding':'ArcGIS + Photon'}}
      elif mode in ('suggest','resolve'):
        query=q.get('q',[''])[0]
        if mode=='suggest':
          data={'ok':True,'version':'restaurant-v636-final','results':[{'lat':36.44268,'lon':-87.17841,'display':'801 Iron Workers Rd, Clarksville, Tennessee, 37043','query':'801 Iron Workers Rd, Clarksville, Tennessee, 37043','precision':'pointaddress','source':'ArcGIS Address'}] if query.lower().startswith('801') else [{'lat':36.52776,'lon':-87.35887,'display':'Clarksville, Tennessee','query':'Clarksville, Tennessee','precision':'locality','source':'ArcGIS Address'}]}
        else:
          data={'ok':True,'version':'restaurant-v636-final','location':{'lat':36.44268,'lon':-87.17841},'display':'801 Iron Workers Rd, Clarksville, Tennessee, 37043','precision':'pointaddress'}
      elif mode=='search':
        rows=[]
        for i,name in enumerate(["McDonald's","Wendy's","Burger King","Waffle House","Applebee's","Roux"]):
          rows.append({'id':f'mock-{i}','name':name,'type':'restaurant','amenity':'fast_food' if i<3 else 'restaurant','fastFood':i<3,'category':'Fast Food' if i<3 else ('American' if i<5 else 'Restaurant'),'cuisine':'american' if i>=3 else 'fast_food','tags':['restaurant','fast_food'] if i<3 else ['restaurant','american'],'address':f'{100+i} Main St, Clarksville, TN 37040','lat':36.52+i*0.001,'lon':-87.36,'distanceMiles':0.5+i*0.2,'photo':'','rating':0,'priceLevel':'','menuItems':['Burgers','Fries'] if i<3 else []})
        data={'ok':True,'version':'restaurant-v636-final','radiusMiles':float(q.get('radius',['10'])[0]),'results':rows,'total':len(rows),'fastFoodCount':3,'providersUsed':['OpenStreetMap Postpass'],'diagnostics':{'elapsedMs':3,'postpassTiles':1,'postpassCalls':1}}
      else: data={'ok':False,'code':'UNKNOWN_MODE','message':'Unknown restaurant search mode.'}
      self._send(200,'application/json',json.dumps(data),{'Cache-Control':'no-store'}); return
    path=u.path
    if path=='/': path='/index.html'
    fp=(ROOT/path.lstrip('/')).resolve()
    if not str(fp).startswith(str(ROOT.resolve())) or not fp.exists() or not fp.is_file(): self._send(404,'text/plain','not found'); return
    c='text/plain'
    if fp.suffix=='.html': c='text/html; charset=utf-8'
    elif fp.suffix=='.css': c='text/css; charset=utf-8'
    elif fp.suffix=='.js': c='application/javascript; charset=utf-8'
    elif fp.suffix=='.webmanifest': c='application/manifest+json'
    elif fp.suffix=='.png': c='image/png'
    elif fp.suffix=='.svg': c='image/svg+xml'
    self._send(200,c,fp.read_bytes(),{'Cache-Control':'no-store'})
  def log_message(self,fmt,*args): pass

if __name__=='__main__':
  import sys
  port=int(sys.argv[1]) if len(sys.argv)>1 else 8765
  ThreadingHTTPServer(('127.0.0.1',port),H).serve_forever()
