assert(app.includes('restaurantDirectionsUrl') && app.includes('detailDirections') && app.includes('Get Google Maps directions'),'Restaurant Details must include Google Maps directions');
assert(app.includes('restaurant-detail-contact-link') && app.includes('phoneHref(item.phone)'),'Restaurant Details must include a tap-to-call phone number');
assert(app.includes('const appBrandHost=/(^|[.-])(?:dinliminate|diliminate)([.-]|$)/i.test(host)'),'Restaurant Website must reject Dinliminate deployment hosts');
assert(app.includes('KNOWN_RESTAURANT_WEBSITES') && app.includes('mcdonalds.com'),'Restaurant Website must have an official national-chain website registry');
assert(app.includes("(q||'restaurant')+' restaurant website'"),'Restaurant Website must use a Google restaurant-website fallback query');
assert(app.includes('restaurantPhoneSearchUrl') && app.includes("' phone number'"),'Restaurant phone fallback must provide a Google phone-number search when a provider has no local phone');
assert(api.includes('KNOWN_RESTAURANT_WEBSITES') && api.includes('mcdonalds.com'),'Restaurant API must have an official national-chain website registry');
assert(api.includes('contactEnrichment') && api.includes('missingContactNames'),'Restaurant API must attempt targeted contact enrichment for missing fast-food phone data');
assert(api.includes("Country,Phone,URL"),'Restaurant provider lookup should request phone/URL metadata where available');
assert(api.includes("attrs.Phone||attrs.phone") && api.includes("attrs.URL||attrs.Url||attrs.url"),'Restaurant API should preserve provider phone and website metadata');
assert(app.includes('iphone-guide-steps') && app.includes('Add to Home Screen'),'iPhone instructions must use the premium guide');
assert(html.includes('Dinner Decisions Simplified') && html.includes('Beautifully swipe until it’s revealed.') && html.includes('How to add to your phone'),'Current Home copy must be present');

// CP323 Restaurant Details visibility contract
assert(app.includes("type==='restaurant'?'Restaurant Details':'Details'"),'Restaurant Details modal must have an explicit Restaurant Details title');
assert(app.includes('restaurant-detail-contact') && app.includes('Google Maps ↗') && app.includes('contact-label') && app.includes('Phone'),'Restaurant Details must visibly expose a contact/directions section');
assert(css.includes('#detailsModal .restaurant-detail-contact') && css.includes('#detailsModal .contact-actions'),'Restaurant Details contact/directions section must have dedicated premium styling');