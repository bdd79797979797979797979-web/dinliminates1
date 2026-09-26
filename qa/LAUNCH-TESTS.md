# Pass 2 launch test notes

Browser smoke uses Playwright + system Chromium against an inlined copy of the production HTML/CSS/launch layer because this environment blocks localhost and file-origin navigation.

API smoke is provider-mocked and verifies response contracts, cache headers, provider-photo proxying, input validation, and rate limiting.
