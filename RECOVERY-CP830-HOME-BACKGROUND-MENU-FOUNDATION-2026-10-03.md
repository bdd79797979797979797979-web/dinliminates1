# CP830 — Home Background + Menu Foundation Cleanup
Date: 2026-10-03

Problem
- Home background could be affected by legacy full-page image layers/rules.
- Home Menu button had a more-specific legacy visual rule that overrode the intended translucent gold treatment.

Foundation cleanup
- Removed the persistent Home background layer from index.html.
- Removed the associated Home background JS constant, binder, and initialization call.
- Home now declares exactly one full-page background directly on #home:
  ./home-background.jpg
- Removed legacy Pexels Home URL/variable and embedded legacy Home JPEG.
- Removed legacy full-page CP780 reference to the old Home image variable.
- Removed stale direct #home transparent-background declarations.

Menu cleanup
- Removed Home-specific menu background/border/shadow/line styling from the legacy Home rule.
- Home menu now inherits the canonical CP819 menu visual:
  translucent black fill
  satin-gold outline
  gold three-line hamburger
- Home-specific menu rule retains only geometry/position.

Cache
- index.html uses app.js?v=830 and styles.css?v=830.
- app.js registers sw.js?v=830.
- sw.js uses dinliminate-shell-v830.

Focused source audit
- 11/11 passed:
  one direct #home background declaration
  that declaration is the door image
  no Home background layer CSS
  no Pexels 8417853
  no CP776 variable
  no embedded Home JPEG
  no CP780 full-page Pexels reference
  no Home menu visual overrides
  canonical translucent menu
  canonical gold menu border
  canonical gold menu lines

Deployment
- Correct Vercel project: dinliminates1.
- Do not use dinliminates2 for this checkpoint.
