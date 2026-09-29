# Dinliminate image-source governance

## Current release
Build 125 · release-hardening-2026-09-29

## Policy
Built-in food imagery must use HTTPS. Quick Cut imagery is sourced from approved image CDNs used by the release. The app also inventories every third-party food-image host so usage can be reviewed before public launch.

## Hosts in Build 125
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


## CP250 photo refresh
- Tacos: Pexels photo 14179985.
- Mexican Stir Fry: Pexels photo 31673757.
- Vegetable Lasagna: Pexels photo 5864352.
- Beef Stroganoff: Pexels photo 28503619.
- Health Shake: Pexels photo 7974814.
- Buttermilk & Cornbread: Pexels photo 36863862.
- Meatloaf & Mashed Potatoes, Potato Soup, Stuffed Peppers, and Salisbury Steak retain dish-specific sources already verified in the catalog because the available free-use search results did not provide more exact replacements.
