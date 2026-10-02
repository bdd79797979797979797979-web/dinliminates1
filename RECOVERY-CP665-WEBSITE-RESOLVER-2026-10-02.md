# RECOVERY CP665 — RESTAURANT WEBSITE RESOLVER FROM CP656

Date: 2026-10-02

Base: CP664 (exact CP656 snapshot plus recovery checkpoint).

Change: restaurant website discovery only. Location/UI code is intentionally untouched.

Website resolver changes:
- broader generic domain candidate generation using restaurant name/brand and location variants
- bounded Jina Reader fallback when direct restaurant-site fetch fails
- full identity/address/phone verification remains required before accepting a discovered website
- API version bumped to r26

Known-good location control remains CP656 / Preview 128 behavior.
