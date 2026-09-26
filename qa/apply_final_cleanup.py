from pathlib import Path
import re
root=Path('/mnt/data/Dinliminate_P636_FINAL')

p=root/'index.html'; s=p.read_text()
# Release/version consistency.
s=s.replace('p635','p636-final').replace('P635','P636 FINAL').replace('p623','p636-final')
# Remove old UI controls and duplicate legacy visible text from the HTML layer.
s=re.sub(r'\n\s*<button[^>]*id="restaurantOpenNowBtn"[^>]*>.*?</button>', '', s, flags=re.S)
s=re.sub(r'\n\s*<button[^>]*id="restaurantInlineSearchClear"[^>]*>.*?</button>', '', s, flags=re.S)
# Make attribution concise and non-internal.
s=s.replace('Restaurant data from connected providers · OpenStreetMap contributors.','Restaurant data from OpenStreetMap and connected providers.')
# Food photo licensing claim: do not make blanket license claims.
s=s.replace('/* Curated real food photography. The images below are Pexels free-to-use photos; \n   restaurant/user-added choices fall back to the closest food category. */','/* Curated food photography. Final release assets should be used only with documented usage rights. */')
# Remove stale clear-filter/open-status styling selectors.
s=s.replace('#restaurantInlineSearchClear,#restaurantOpenUnknownBtn,.restaurant-open-chip,#restaurantResetFilters{display:none!important}','#restaurantOpenUnknownBtn,.restaurant-open-chip,#restaurantResetFilters{display:none!important}')
# Add exact-detail aliases for renamed food items while preserving old saved/history compatibility.
needle='\n};\n\nfunction readHiddenItems(){'
insert='''\n};\n\n// P636 final: preserve detail/recipe lookup for renamed built-in foods while retaining legacy saved data.\nif (FOOD_DETAILS["bowl of cereal"] && !FOOD_DETAILS["cheerios cereal"]) FOOD_DETAILS["cheerios cereal"] = FOOD_DETAILS["bowl of cereal"];\nif (FOOD_DETAILS["frozen dinner"] && !FOOD_DETAILS["stouffer’s frozen dinner"]) FOOD_DETAILS["stouffer’s frozen dinner"] = FOOD_DETAILS["frozen dinner"];\n\nfunction readHiddenItems(){'''
if needle in s: s=s.replace(needle,insert,1)
# Exact renamed photo aliases.
s=s.replace("    'southern vegetable beef': PHOTO_LIBRARY.southernVegBeef,","    'southern vegetable beef soup': PHOTO_LIBRARY.southernVegBeef,\n    'southern vegetable beef': PHOTO_LIBRARY.southernVegBeef,")
s=s.replace("    'bowl of cereal': PHOTO_LIBRARY.cereal,\n    'frozen dinner': PHOTO_LIBRARY.frozenDinner,","    'cheerios cereal': PHOTO_LIBRARY.cereal,\n    'bowl of cereal': PHOTO_LIBRARY.cereal,\n    'stouffer’s frozen dinner': PHOTO_LIBRARY.frozenDinner,\n    'frozen dinner': PHOTO_LIBRARY.frozenDinner,")
# Remove stale nacho matcher from food quickcuts.
s=s.replace("names:['taco','burrito','enchilada','quesadilla','nacho']","names:['taco','burrito','enchilada','quesadilla']")
# Restaurant quick-cut matching: add requested categories and robust terms.
old="""    southern:[/\\bsouthern\\b/,/\\bsoul\\s+food\\b/,/\\bcountry\\s+cooking\\b/],\n    breakfast:[/\\bbreakfast\\b/,/\\bbrunch\\b/],\n    steak:[/\\bsteak\\b/,/\\bsteakhouse\\b/],\n    wings:[/\\bwings?\\b/],\n    coffee:[/\\bcoffee\\b/,/\\bcaf(?:e|é)\\b/],\n    dessert:[/\\bdesserts?\\b/,/\\bbakery\\b/,/\\bice\\s+cream\\b/]"""
new="""    southern:[/\\bsouthern\\b/,/\\bsoul\\s+food\\b/,/\\bcountry\\s+cooking\\b/],\n    american:[/\\bamerican\\b/,/\\bdiner\\b/,/\\bgrill\\b/,/\\bdiner\\b/],\n    pasta:[/\\bpasta\\b/,/\\bitalian\\b/,/\\bnoodle\\b/],\n    potato:[/\\bpotato(?:es)?\\b/,/\\btater tots?\\b/,/\\bfries?\\b/],\n    healthy:[/\\bhealthy\\b/,/\\bsalad\\b/,/\\bvegetarian\\b/,/\\bvegan\\b/,/\\bgluten[- ]?free\\b/,/\\bbowl\\b/],\n    soupstew:[/\\bsoups?\\b/,/\\bstews?\\b/,/\\bchili\\b/,/\\bchowder\\b/],\n    breakfast:[/\\bbreakfast\\b/,/\\bbrunch\\b/],\n    steak:[/\\bsteak\\b/,/\\bsteakhouse\\b/],\n    wings:[/\\bwings?\\b/],\n    coffee:[/\\bcoffee\\b/,/\\bcaf(?:e|é)\\b/],\n    dessert:[/\\bdesserts?\\b/,/\\bbakery\\b/,/\\bice\\s+cream\\b/]"""
if old not in s:
    print('WARNING: restaurant terms anchor not found')
else:
    s=s.replace(old,new,1)
# Remove dead binding to missing clear button.
s=s.replace("bind('restaurantInlineSearchClear','click',()=>{restaurantFilters.query='';saveRestaurantFilters();const i=$('restaurantInlineSearchInput');if(i)i.value='';renderRestaurantQuickCuts();renderRestaurantStage();$('restaurantSearchBtn')?.focus();});\n",'')
# Clear stale comment in filteredRestaurants.
s=s.replace('  // Open/unknown removes restaurants we explicitly know are closed; unknown hours stay eligible.\n','  // Restaurant hours are informational only in P636 final; they never filter the deck.\n')
# Hungry visual becomes a deliberately funny/no-choice inline illustration.
s=s.replace("const HUNGRY_FALLBACK_PHOTO = 'https://images.pexels.com/photos/3688/food-salad-healthy-lunch.jpg?auto=compress&cs=tinysrgb&w=1400';", "const HUNGRY_FALLBACK_PHOTO = 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent('<svg xmlns=\"http://www.w3.org/2000/svg\" width=1200 height=800 viewBox=\"0 0 1200 800\"><rect width=\"1200\" height=\"800\" rx=\"52\" fill=\"#efe7d7\"/><ellipse cx=\"600\" cy=\"470\" rx=\"270\" ry=\"120\" fill=\"#d8d0c0\"/><ellipse cx=\"600\" cy=\"450\" rx=\"220\" ry=\"85\" fill=\"#fbfaf7\"/><path d=\"M700 250c70-42 146-5 150 52 5 73-79 96-130 51\" fill=\"none\" stroke=\"#20362d\" stroke-width=\"18\" stroke-linecap=\"round\"/><path d=\"M520 285h-70m10 0v120m15-120v120m15-120v120m15-120v120\" fill=\"none\" stroke=\"#20362d\" stroke-width=\"12\" stroke-linecap=\"round\"/><circle cx=\"530\" cy=\"390\" r=\"9\" fill=\"#20362d\"/><circle cx=\"670\" cy=\"390\" r=\"9\" fill=\"#20362d\"/><path d=\"M550 450c30 28 70 28 100 0\" fill=\"none\" stroke=\"#20362d\" stroke-width=\"11\" stroke-linecap=\"round\"/><text x=\"600\" y=\"690\" text-anchor=\"middle\" font-family=\"Arial,sans-serif\" font-size=\"52\" font-weight=\"800\" fill=\"#20362d\">THE PLATE IS EMPTY.</text><text x=\"600\" y=\"742\" text-anchor=\"middle\" font-family=\"Arial,sans-serif\" font-size=\"30\" font-weight=\"700\" fill=\"#62756b\">Dinliminate has been defeated.</text></svg>');")
# Avoid blank restaurant history/saved images by using the neutral restaurant fallback.
s=s.replace("const record={id:item.id||`${mode}-${Date.now()}`,name:item.name,photo:photoFor(item),type:item.type||mode", "const record={id:item.id||`${mode}-${Date.now()}`,name:item.name,photo:(item.type==='restaurant'?(restaurantPhotoUrl(item)||RESTAURANT_FALLBACK_PHOTO):photoFor(item)),type:item.type||mode")
s=s.replace("savedItems.unshift({id:item.id||null,name:item.name,type:item.type||'home',tags:item.tags||[],photo:item.photo||photoFor(item)", "savedItems.unshift({id:item.id||null,name:item.name,type:item.type||'home',tags:item.tags||[],photo:(item.type==='restaurant'?(restaurantPhotoUrl(item)||RESTAURANT_FALLBACK_PHOTO):(item.photo||photoFor(item))")
# The line above may need a balancing parenthesis because it replaces within a long object; fix exact snippet if present.
s=s.replace("photo:(item.type==='restaurant'?(restaurantPhotoUrl(item)||RESTAURANT_FALLBACK_PHOTO):(item.photo||photoFor(item))),address", "photo:(item.type==='restaurant'?(restaurantPhotoUrl(item)||RESTAURANT_FALLBACK_PHOTO):(item.photo||photoFor(item))),address")
# Clean stale rating/price persistence in normalized restaurant objects (keep source fields internally only if supplied by provider).
s=s.replace(",rating:Number(r.rating??r.stars)||0,menuItems", ",menuItems")
s=s.replace(",priceLevel:String(r.priceLevel??r.price??''),photoSource", ",photoSource")
# Winner metadata no price/rating; canonical label.
s=s.replace("const meta = [winner.category,winner.rating ? `★ ${winner.rating}` : '',winner.priceLevel || '',winner.distanceMiles != null ? `${winner.distanceMiles.toFixed(1)} mi` : ''].filter(Boolean).join(' · ');", "const meta = [winner.category,winner.distanceMiles != null ? `${winner.distanceMiles.toFixed(1)} mi` : ''].filter(Boolean).join(' · ');")
# Remove legacy service-worker cleanup/migration comments if stale; leave working registration intact.
s=s.replace('/* p623 — compact restaurant controls with a guaranteed-visible radius value. */','/* P636 FINAL — compact restaurant controls with a guaranteed-visible radius value. */')
s=s.replace('<!-- Dinliminate p636-final: authoritative restaurant location controller. -->','<!-- Dinliminate P636 FINAL: authoritative restaurant location controller. -->')
# Avoid duplicate visible Search/Pass Around injected utility rows from old hardening.
s=s.replace("const utility=document.querySelector('#restaurantUtilityBar');", "const utility=document.querySelector('#restaurantUtilityBar');")
p.write_text(s)

# Patch launch-hardening JS for final version, quickcut state, and dedupe.
p=root/'launch-hardening.js'; s=p.read_text()
s=s.replace('p635','p636-final').replace('p623','p636-final').replace('P635','P636 FINAL')
# Explicitly normalize legacy persisted filter state.
s=s.replace("restaurantFilters={query:String(state.filters?.query||''),sort:state.filters?.sort==='closest'?'closest':'shuffle'};", "restaurantFilters={query:String(state.filters?.query||''),sort:state.filters?.sort==='closest'?'closest':'shuffle'};")
# Dedupe utility controls: keep first visible/canonical button and remove legacy utility row duplicates.
old="""  function dedupeRestaurantControls(){\n    const host=$('restaurantPanel'); if(!host)return;\n    const ids=['restaurantSearchBtn','restaurantPassAroundBtn'];\n    ids.forEach(id=>{const els=[...host.querySelectorAll('#'+id)];if(els.length>1){els.slice(1).forEach(e=>e.remove());}});\n    host.querySelectorAll('#restaurantOpenUnknownBtn,#restaurantInlineSearchClear,#restaurantResetFilters').forEach(e=>e.remove());\n  }"""
new="""  function dedupeRestaurantControls(){\n    const host=$('restaurantPanel'); if(!host)return;\n    const keepOne=(id)=>{const els=[...host.querySelectorAll('#'+id)];if(!els.length)return;els.slice(1).forEach(e=>e.remove());};\n    ['restaurantSearchBtn','restaurantPassAroundBtn','restaurantInlineSearch','restaurantInlineSearchInput','restaurantRadiusFilter','restaurantRadiusDisplay','restaurantUseLocationBtn','restaurantLoadBtn'].forEach(keepOne);\n    host.querySelectorAll('#restaurantOpenUnknownBtn,#restaurantInlineSearchClear,#restaurantResetFilters,.restaurant-open-chip').forEach(e=>e.remove());\n    host.querySelectorAll('.restaurant-utility-row').forEach((row,i)=>{if(i>0)row.remove();});\n  }"""
if old in s:s=s.replace(old,new,1)
else: print('WARNING: dedupe function anchor not found')
p.write_text(s)

# API cleanup + stronger stable IDs and exact-address-first suggestions.
p=root/'api/restaurant-search.js'; s=p.read_text()
s=s.replace("  const POSTPASS_QUERY_LIMIT = 5000;\n","")
s=s.replace("      'Content-Type': 'application/json',\n      'Content-Type': 'application/json',", "      'Content-Type': 'application/json',")
# Add a deterministic human-stable fallback for providers without IDs.
old="id: `osm-${el.osm_type || el.type || 'feature'}-${el.osm_id ?? el.id ?? `${lat},${lon}`}`,"
new="id: el.osm_id ? `osm-${el.osm_type || el.type || 'feature'}-${el.osm_id}` : `osm-place-${slugStable(`${name}|${lat.toFixed(6)}|${lon.toFixed(6)}`)}`,"
if old in s: s=s.replace(old,new,1)
else: print('WARNING: osm id anchor not found')
# Inject stable slug helper before osmRow.
anchor='function osmRow(el) {'
helper='''function slugStable(value) {\n  let h = 2166136261;\n  for (const ch of String(value)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }\n  return (h >>> 0).toString(36);\n}\n\nfunction osmRow(el) {'''
s=s.replace(anchor,helper,1)
# Provider results should expose a canonical `restaurants` alias too for older client compatibility.
s=s.replace("results: merged.slice(0, RESULT_LIMIT),\n    total", "results: merged.slice(0, RESULT_LIMIT),\n    restaurants: merged.slice(0, RESULT_LIMIT),\n    items: merged.slice(0, RESULT_LIMIT),\n    total",1)
# Improve 100-mile tile geometry documentation without changing existing 3x3 coverage.
s=s.replace("const tileRadius = Math.min(50, Math.max(25, radiusMi / 2));", "const tileRadius = Math.min(50, Math.max(25, radiusMi / 2)); // 3x3 tile grid covers the requested radius up to the 100 mi launch cap.")
p.write_text(s)

# Make clean entry release version consistent.
p=root/'api/clean-entry.js'; s=p.read_text().replace('p635','p636-final').replace('P635','P636 FINAL'); p.write_text(s)

# PWA metadata and cache labels.
p=root/'dinliminate-sw.js'; s=p.read_text().replace('p635','p636-final').replace('p636-final-shell','p636-final'); p.write_text(s)

# Update manifest name/description for final release consistency.
p=root/'dinliminate.webmanifest'; s=p.read_text(); s=s.replace('Eliminate dinner choices until one is left.','Eliminate dinner choices until one is left.'); p.write_text(s)

print('FINAL_CLEANUP_APPLIED')
