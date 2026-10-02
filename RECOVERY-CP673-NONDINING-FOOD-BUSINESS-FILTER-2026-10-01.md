# CP673 — Non-Dining Food Business Filter

Date: 2026-10-01
Base: CP672 / 99440d60c3353f8ecc9682e75af33595048466b8
Purpose: Keep restaurant results focused on actual dining venues and filter food suppliers/providers and other non-dining food businesses.

Changes:
- Expanded server-side non-dining detection for food suppliers, providers, vendors, distributors, wholesalers, processors/manufacturers, restaurant suppliers/equipment, commercial kitchens, vending suppliers, warehouses and related non-dining operations.
- Made the strong non-dining source-type check independent of a weak provider category mislabel such as Restaurant.
- Corrected the known Larsons/Larson Enterprises name guard so both singular/plural forms are excluded.
- Added regressions for Larson Enterprises Inc, mislabelled Food Supplier records, and commercial kitchen supplier records while retaining an actual restaurant fixture.

No Google API credentials added.

Recovery checkpoint: branch cp673-nondining-food-business-filter
