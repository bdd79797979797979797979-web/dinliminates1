# Dinliminate image-source governance

## Current release
Build 119 · release-hardening-2026-09-29

## Policy
Built-in food imagery must use HTTPS. Quick Cut imagery is sourced from approved image CDNs used by the release. The app also inventories every third-party food-image host so usage can be reviewed before public launch.

## Hosts in Build 119
- images.pexels.com — approved application image CDN
- images.unsplash.com — approved application image CDN
- static.spotapps.co — third-party source; rights/usage review required
- hips.hearstapps.com — third-party source; rights/usage review required
- calliesbiscuits.com — third-party source; rights/usage review required
- vinovoss.com — third-party source; rights/usage review required
- recipesclare.com — third-party source; rights/usage review required
- commons.wikimedia.org — source-specific license review required per asset
- www.ajsbbq.co.nz — third-party source; rights/usage review required
- southernbite.com — third-party source; rights/usage review required
- snapcalorie-webflow-website.s3.us-east-2.amazonaws.com — third-party source; rights/usage review required
- butterhearth.com — third-party source; rights/usage review required
- www.pastapiracy.com — third-party source; rights/usage review required
- slicelife.imgix.net — third-party source; rights/usage review required
- cdn.shopify.com — source host; the underlying asset owner/license must be identified
- savouryflavor.com — third-party source; rights/usage review required
- resizer.otstatic.com — third-party source; rights/usage review required
- www.cooksoups.com — third-party source; rights/usage review required
- bigbitesedenderry.com — third-party source; rights/usage review required
- kookycrunch.com — third-party source; rights/usage review required
- www.goodnes.com — third-party source; rights/usage review required

## Launch status
The automated inventory is complete. The legal/usage verification of the non-approved third-party assets is not something the runtime can establish automatically; those assets should be replaced with approved local/CDN assets or individually cleared before public distribution.


## CP243 catalog image sources
- Lasagna — Pexels photo 14696209 (specific lasagna image). citeturn758512search26
- Vegetable Lasagna — Pexels photo 5864352 (specifically described as vegetable lasagna). citeturn557175search2
- Salisbury Steak — Wikimedia Commons “Salisbury steak with mushrooms and mashed potatoes”; source-specific CC BY-SA 4.0 license requires attribution. citeturn675841search4
- Stuffed Peppers — Pexels photo 5250392 (specifically described as stuffed peppers). citeturn758512search18
- Beef Stroganoff — Pexels photo 28503619 (specifically described as beef stroganoff served with pasta and vegetables). citeturn758512search21
