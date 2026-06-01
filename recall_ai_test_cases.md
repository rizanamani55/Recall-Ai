# Recall.ai — Pre-Deploy Test Case Prompt
## Complete QA Checklist for Vibe Coding Agent
### Run every test below before pushing to production. Zero exceptions.

---

## HOW TO USE THIS PROMPT

Paste this entire document into your vibe coding agent (Cursor, Claude Code, Copilot Workspace, etc.) and instruct it:

> "Run through every test case in this document against the current Recall.ai codebase. For each test, confirm PASS or FAIL with a one-line reason. Group failures by severity: Critical (blocks launch), Major (degrades core UX), Minor (cosmetic or edge case). Output a final launch readiness verdict."

---

## SECTION A — API LAYER TESTS

### A1. Conversion API — Happy Path
```
TEST: POST /api/convert with valid medical text (500 chars), valid userId, free plan user with 0 conversions used today.

EXPECT:
- HTTP 200
- Response body contains { cards: [...], used: 1, limit: 3 }
- cards array has between 3 and 20 items
- Each card has: { id, sentence, blanks: [{ term, hint, position }] }
- sentence contains {{term}} markers matching each blank's term
- No card has an empty blanks array
- Response time < 8 seconds
```

### A2. Conversion API — Text Too Short
```
TEST: POST /api/convert with text = "Hello world" (11 chars).

EXPECT:
- HTTP 400
- Response body: { error: "Text too short (min 50 chars)" }
- No Claude API call is made (check logs)
- No usage counter increment
```

### A3. Conversion API — Text Too Long
```
TEST: POST /api/convert with text of exactly 15,001 characters.

EXPECT:
- HTTP 400
- Response body: { error: "Text too long (max 15,000 chars)" }
- No Claude API call is made
- No usage counter increment
```

### A4. Conversion API — Unauthenticated Request
```
TEST: POST /api/convert with no Authorization header / no Clerk session cookie.

EXPECT:
- HTTP 401
- Response body: { error: "Unauthorized" }
- No Claude API call is made
- No usage counter increment
```

### A5. Daily Limit — Free User at Limit
```
TEST: POST /api/convert as a free-plan user who has already used 3 conversions today (set Redis key manually: usage:{userId}:{today} = 3).

EXPECT:
- HTTP 429
- Response body: { error: "Daily limit reached", used: 3, limit: 3, upgrade: true }
- No Claude API call is made
- Redis counter NOT incremented further (still 3)
```

### A6. Daily Limit — Pro User No Limit
```
TEST: POST /api/convert as a pro-plan user who has used 100 conversions today.

EXPECT:
- HTTP 200
- Conversion proceeds normally
- Response body contains valid cards
```

### A7. Daily Limit — Resets at Midnight
```
TEST: Manually set Redis key for yesterday's date (usage:{userId}:{yesterday} = 3). POST /api/convert with today's date active.

EXPECT:
- HTTP 200 (today's key starts fresh at 0)
- used: 1 in response
- Yesterday's key is unaffected
```

### A8. Redis Key Format
```
TEST: After a successful conversion, inspect Redis keys.

EXPECT:
- Key format is exactly: usage:{clerkUserId}:{YYYY-MM-DD}
- TTL on the key is between 82800 and 86400 seconds (23–24 hours)
- Value is an integer, not a string
```

### A9. Claude API Failure Handling
```
TEST: Simulate Claude API timeout (mock ANTHROPIC_API_KEY with invalid key or intercept network call).

EXPECT:
- HTTP 500 (not a crash/unhandled rejection)
- Response body: { error: "Conversion failed. Please try again." } or similar
- Usage counter is NOT incremented (failed calls shouldn't cost a conversion)
- Error is logged server-side
```

### A10. Claude Returns Malformed JSON
```
TEST: Mock Claude API to return non-JSON text (e.g., "Sorry, I can't help with that.").

EXPECT:
- API route catches JSON.parse error
- HTTP 500 with user-friendly error message
- No unhandled exception crashes the server
```

### A11. Deck API — Create Deck
```
TEST: POST /api/decks with { title, subject, sourceText, cards: [...] } as authenticated user.

EXPECT:
- HTTP 201
- Response contains deck object with id, userId, title, cardCount
- Deck exists in Supabase decks table
- All cards exist in Supabase cards table with correct deck_id and positions
- card_count on deck matches actual number of cards inserted
```

### A12. Deck API — List Decks
```
TEST: GET /api/decks as authenticated user with 5 existing decks.

EXPECT:
- HTTP 200
- Returns array of 5 deck objects
- Each deck has: id, title, subject, cardCount, createdAt
- Does NOT return sourceText (too large for list view)
- Only returns decks belonging to this user (not other users' decks)
```

### A13. Deck API — Authorization Boundary
```
TEST: GET /api/decks/{deckId} where deckId belongs to a different user.

EXPECT:
- HTTP 403 or 404
- Does not return the deck data
- Does not reveal that the deck exists
```

### A14. Usage API
```
TEST: GET /api/usage as authenticated free-plan user with 2 conversions used today.

EXPECT:
- HTTP 200
- Response: { used: 2, limit: 3, plan: "free", resetsAt: "<ISO timestamp of midnight UTC>" }
```

---

## SECTION B — STRIPE & BILLING TESTS

### B1. Checkout Session Creation
```
TEST: POST /api/stripe/checkout as authenticated user.

EXPECT:
- HTTP 200
- Response: { url: "https://checkout.stripe.com/..." }
- Stripe checkout session has: mode = "subscription", correct priceId, metadata.clerkUserId set
- success_url points to /dashboard?upgraded=true
- cancel_url points to /pricing
```

### B2. Webhook — Checkout Completed
```
TEST: Send Stripe webhook event checkout.session.completed with valid signature, metadata.clerkUserId matching a test user.

EXPECT:
- HTTP 200 from webhook handler
- users table updated: plan = "pro", stripe_customer_id and stripe_subscription_id set
- Subsequent API calls by that user treated as pro plan
```

### B3. Webhook — Subscription Cancelled
```
TEST: Send Stripe webhook event customer.subscription.deleted for a pro user.

EXPECT:
- HTTP 200 from webhook handler
- users table updated: plan = "free"
- User's daily limit reverts to 3 on next conversion attempt
```

### B4. Webhook — Invalid Signature
```
TEST: Send POST to /api/stripe/webhook with a tampered or missing stripe-signature header.

EXPECT:
- HTTP 400
- Webhook is rejected before processing
- Database is NOT modified
```

### B5. Upgrade Gate Modal
```
TEST: As free user, use all 3 daily conversions. Attempt a 4th conversion via the UI.

EXPECT:
- UI shows upgrade modal (not a raw error)
- Modal contains: "You've used all 3 free conversions today"
- CTA button "Upgrade to Pro" is present and links to Stripe checkout
- "Remind me tomorrow" button dismisses modal and shows countdown timer
- Timer shows correct hours:minutes until midnight in user's timezone
```

---

## SECTION C — AUTHENTICATION & MIDDLEWARE TESTS

### C1. Unauthenticated Dashboard Access
```
TEST: Visit /dashboard without being logged in (clear all cookies/session).

EXPECT:
- Redirected to /sign-in
- /dashboard content is never rendered
- No flash of protected content before redirect
```

### C2. Unauthenticated Study Page Access
```
TEST: Visit /dashboard/study/{validDeckId} without being logged in.

EXPECT:
- Redirected to /sign-in
- After sign-in, redirected back to the study page (returnUrl preserved)
```

### C3. Clerk Webhook — User Sync
```
TEST: Trigger Clerk user.created webhook (simulate new signup).

EXPECT:
- New row inserted in Supabase users table with clerk_id, email, plan = "free"
- Webhook returns HTTP 200
- No duplicate user rows created on subsequent events
```

### C4. Public Routes Are Accessible
```
TEST: Visit /, /pricing, /sign-in, /sign-up without any session.

EXPECT:
- All pages load successfully (HTTP 200)
- No redirect to sign-in
- No authentication errors in console
```

### C5. API Routes Without Session
```
TEST: POST to /api/convert, /api/decks, /api/usage with no session cookie.

EXPECT:
- All return HTTP 401
- None return HTTP 500 (auth check must happen before any processing)
```

---

## SECTION D — GAME ENGINE TESTS

### D1. Single Blank Card — Correct Answer
```
TEST: Render a ClozeCard with sentence "The {{mitochondria}} is the powerhouse of the cell." Type "mitochondria" and press Enter.

EXPECT:
- Status changes to "correct"
- Blurred term reveals with green animation
- Correct sound plays (if audio enabled)
- Score increases by 10 (base, no streak)
- Game advances to next blank or next card
- streak counter increments to 1
```

### D2. Single Blank Card — Wrong Answer
```
TEST: Same card, type "nucleus" and press Enter.

EXPECT:
- Status changes to "wrong" momentarily
- Red flash and shake animation plays on the blurred term
- Input clears automatically after 400ms
- Score does NOT increase
- streak resets to 0
- attempts counter for that blank increments to 1
- Game does NOT advance (same blank remains active)
- User can try again immediately
```

### D3. Case Insensitivity
```
TEST: Card expects "mitochondria". Type "Mitochondria" (capital M) and press Enter.

EXPECT:
- Treated as CORRECT (comparison is case-insensitive)
```

### D4. Trailing/Leading Whitespace
```
TEST: Card expects "mitochondria". Type "  mitochondria  " (spaces) and press Enter.

EXPECT:
- Treated as CORRECT (.trim() applied before comparison)
```

### D5. Multi-Blank Card — Sequential Flow
```
TEST: Card with 3 blanks: "The {{SA node}} fires at {{60}}–{{100}} bpm."
Type answers in sequence.

EXPECT:
- First blank (SA node) is active on card load
- After correct answer for blank 1, blank 2 becomes active
- After correct answer for blank 2, blank 3 becomes active
- After correct answer for blank 3, card is complete → advance to next card
- Correct blanks remain revealed (not re-blurred) as user moves to next blank
```

### D6. Reveal (Tab Key) Mechanic
```
TEST: On an active blank, press Tab.

EXPECT:
- Current blank status set to "revealed"
- Term text appears in a gray/dimmed style (visually distinct from correct)
- streak resets to 0
- Game advances to next blank or card
- Score does NOT increase for this blank
```

### D7. Last Card Completion
```
TEST: Complete the final blank of the final card.

EXPECT:
- isComplete = true in game state
- SessionSummary component renders
- Shows: total score, correct count, revealed count, wrong count, total cards
- "Study again" button resets game state to initial (same cards, fresh blanks)
- "Save and exit" button navigates to /dashboard/decks
```

### D8. Streak Scoring
```
TEST: Answer 5 consecutive blanks correctly without any wrong answers.

EXPECT:
- Card 1: score += 10 (streak 0 → 1)
- Card 2: score += 11 (10 * (1 + 1*0.1)) (streak 1 → 2)
- Card 3: score += 12 (streak 2 → 3)
- Card 4: score += 13 (streak 3 → 4)
- Card 5: score += 14 (streak 4 → 5)
- One wrong answer: streak resets to 0, next correct is +10 again
```

### D9. Keyboard — No Global Interference
```
TEST: During study mode, type into the active input. Press keys including Enter, Tab, Space, Escape.

EXPECT:
- Enter: submits answer
- Tab: reveals current blank
- Space: no action (does NOT trigger browser scroll)
- Escape: no action (does NOT navigate away)
- No browser default behaviors interfere with typing
```

### D10. Empty Cards Array
```
TEST: Navigate to /dashboard/study/{deckId} where deck exists but has 0 cards.

EXPECT:
- UI shows a meaningful empty state ("This deck has no cards yet")
- No JavaScript errors or crashes
- Back button visible
```

---

## SECTION E — TYPEWRITER ANIMATION TESTS

### E1. Character-by-Character Render
```
TEST: Load a study card for the first time. Observe the sentence rendering.

EXPECT:
- Text appears character by character at ~18ms intervals
- Blank positions render as blurred pill placeholders (not typed out as {{term}})
- Animation completes fully before user can interact with input
- No characters are skipped or doubled
```

### E2. Typewriter Sound
```
TEST: Load a study card with audio enabled. Observe audio during typewriter animation.

EXPECT:
- Subtle click sound plays per character (not per word)
- Sound frequency varies slightly between characters (not robotic)
- Volume is low (gain ~0.05, inaudible with device on mute)
- No audio errors thrown in browser console
- If AudioContext is blocked (browser autoplay policy), fails silently — no error shown to user
```

### E3. Blur Effect
```
TEST: Inspect a blurred term before answering.

EXPECT:
- Term text is visually unreadable (CSS filter: blur(6px) or equivalent)
- Background pill width matches the expected term length (not collapsed or overflowing)
- Screen reader reports aria-label="Fill in the blank" (not the actual term)
- User cannot read the term by inspecting computed styles or DOM text content
    (term exists in JS state, not rendered in the DOM as visible text)
```

### E4. Animation on Card Transition
```
TEST: Complete a card and watch the next card load.

EXPECT:
- New card slides up from below and fades in (300ms ease-out)
- Typewriter animation restarts fresh for the new card
- Previous card does not linger or flicker during transition
```

### E5. Animation Interruption
```
TEST: During typewriter animation, immediately start typing in the input.

EXPECT:
- Typing is captured correctly regardless of animation state
- Typewriter completes in background while user types
- Submitting an answer before animation completes works correctly
```

---

## SECTION F — CONVERT PAGE TESTS

### F1. Text Input — Paste
```
TEST: Paste 2,000 characters of text into the textarea on /dashboard/convert.

EXPECT:
- Text appears correctly with no truncation
- Character count updates in real-time
- No visible performance lag (debounce is 300ms)
- Textarea does not overflow its container
```

### F2. Subject Selector
```
TEST: Open the subject dropdown. Select each option: Medicine, Law, STEM, Other.

EXPECT:
- All 4 options are selectable
- Selected value is stored in component state
- Subject is included in the POST /api/convert payload
- Default selection is "Medicine" on page load
```

### F3. Convert Button — Loading State
```
TEST: Paste valid text, click Convert.

EXPECT:
- Button immediately becomes disabled and shows loading state
- ConversionLoader component renders with skeleton animation
- Rotating messages appear: "Analyzing terminology...", "Extracting key concepts...", etc.
- Messages rotate every ~2 seconds
- UI is not frozen during the API call
- Button re-enables if conversion fails
```

### F4. Preview Before Save
```
TEST: After successful conversion, inspect the PreviewCard.

EXPECT:
- Preview shows all generated cards (scrollable list)
- Each card shows: full sentence with blanks highlighted, list of blank terms and hints
- "Save Deck" button is visible and enabled
- "Discard" button is visible (navigates away without saving)
- Generated cards are stored in sessionStorage (refresh does not re-call API)
```

### F5. Save Deck
```
TEST: Click "Save Deck" after a successful conversion.

EXPECT:
- POST /api/decks called with correct payload
- Success: navigate to /dashboard/decks or directly to /dashboard/study/{newDeckId}
- New deck appears in deck list
- Card count on deck matches the number of generated cards
- No duplicate decks created if "Save Deck" is clicked twice quickly (button disabled after first click)
```

### F6. Free User — Usage Meter Update
```
TEST: As a free user with 1 conversion used, complete a conversion.

EXPECT:
- UsageMeter in the dashboard header updates from "1/3" to "2/3" without page refresh
- SWR revalidates within 30 seconds OR immediately on conversion success
- Meter shows correct color: green (1/3), amber (2/3), red (3/3)
```

---

## SECTION G — LANDING PAGE TESTS

### G1. Live Demo Widget — Works Without Login
```
TEST: Visit / (landing page) without being logged in. Interact with the embedded demo.

EXPECT:
- Demo game loads with hardcoded sample text (no API call to /api/convert)
- Typewriter animation plays automatically
- Typing into the demo works correctly
- No authentication error is triggered
- "Sign up to convert your own text" CTA appears after completing the demo
```

### G2. Hero CTA
```
TEST: Click "Get started free" / primary CTA on the landing page hero.

EXPECT:
- Unauthenticated: navigates to /sign-up
- Authenticated: navigates to /dashboard/convert
```

### G3. Pricing Cards
```
TEST: Click "Upgrade to Pro" on the pricing page while logged in.

EXPECT:
- POST /api/stripe/checkout is called
- User is redirected to Stripe checkout URL
- Checkout page shows correct plan name and price
```

### G4. Pricing Cards — Logged Out
```
TEST: Click "Upgrade to Pro" on the pricing page while logged out.

EXPECT:
- Redirected to /sign-up (not to Stripe — user must have account first)
- After sign-up, returned to pricing page (returnUrl preserved)
```

### G5. Core Web Vitals
```
TEST: Run Lighthouse audit on the landing page (production build).

EXPECT:
- Performance score ≥ 85
- LCP (Largest Contentful Paint) < 2.5s
- CLS (Cumulative Layout Shift) < 0.1
- FID/INP < 200ms
- No render-blocking resources from study game engine (dynamic import confirmed)
```

---

## SECTION H — ACCESSIBILITY TESTS

### H1. Keyboard Navigation — Landing Page
```
TEST: Tab through the entire landing page using only keyboard.

EXPECT:
- All interactive elements (nav links, CTAs, pricing buttons) are reachable via Tab
- Focus indicator is visible on every focused element (not hidden by CSS)
- Tab order is logical (left-to-right, top-to-bottom)
- No keyboard traps (Tab always moves forward, Shift+Tab backward)
```

### H2. Keyboard Navigation — Study Mode
```
TEST: Complete an entire study session using only keyboard (no mouse).

EXPECT:
- Input is auto-focused when a blank becomes active
- Enter submits, Tab reveals, as documented
- SessionSummary buttons are keyboard-accessible
- No mouse-only interactions required at any point
```

### H3. Screen Reader — Blurred Terms
```
TEST: Use VoiceOver (macOS) or NVDA (Windows) to navigate a study card.

EXPECT:
- Screen reader announces: "Fill in the blank" for each blurred term (via aria-label)
- Actual term text is NOT read aloud before answering
- After correct answer: "Correct. [term]" announced via aria-live
- After wrong answer: "Incorrect. Try again." announced via aria-live
```

### H4. Color Contrast
```
TEST: Run axe DevTools or Lighthouse accessibility audit on: landing page, dashboard, study page.

EXPECT:
- All text elements pass WCAG AA contrast ratio (4.5:1 for body, 3:1 for large text)
- Error states (red) pass contrast on their backgrounds
- Focus indicators pass 3:1 contrast against adjacent colors
- Zero critical or serious contrast violations
```

### H5. Reduced Motion
```
TEST: Enable "Reduce motion" in OS accessibility settings. Load a study card.

EXPECT:
- Typewriter animation is disabled (text appears instantly or fades in once)
- Card transition animations are removed or reduced to simple fades
- Shake animation on wrong answers is removed
- Application remains fully functional
```

### H6. Font Size Scaling
```
TEST: Set browser font size to 200% (accessibility setting). Load the study page.

EXPECT:
- No text is cut off or overflows its container
- Buttons remain tappable and readable
- Layout reflows without horizontal scroll (on desktop viewport)
```

---

## SECTION I — MOBILE & RESPONSIVE TESTS

### I1. iPhone SE (375px viewport) — Landing Page
```
TEST: Load / on 375px wide viewport (simulate iPhone SE).

EXPECT:
- No horizontal scroll at any point
- Hero text is readable (≥16px)
- CTA buttons are full-width or appropriately sized (min 44px tap target)
- Navigation collapses to hamburger or simplified menu
- Demo widget is visible and functional
```

### I2. iPhone SE — Study Mode
```
TEST: Load /dashboard/study/{deckId} on 375px viewport.

EXPECT:
- Study card is fully visible without horizontal scroll
- Keyboard input does not obscure the active card (or page scrolls to keep input visible)
- Virtual keyboard appearing does not break layout
- Blurred terms are visible and correctly sized
- Progress HUD is visible (not overlapping card content)
```

### I3. Touch Targets
```
TEST: Inspect all interactive elements on mobile.

EXPECT:
- All buttons and inputs have minimum 44×44px touch target
- "Tab to reveal" hint is visible on mobile even without a physical keyboard
- Reveal button (alternative to Tab key) is present and functional on mobile
```

### I4. iPad (768px viewport)
```
TEST: Load the dashboard on 768px viewport.

EXPECT:
- Sidebar is collapsed by default or shown as a slide-over
- Two-column layouts remain readable
- No overlapping elements
```

---

## SECTION J — EDGE CASES & STRESS TESTS

### J1. Unicode / Non-Latin Text
```
TEST: Paste Malayalam or Arabic medical text into the convert input.

EXPECT:
- Text is accepted without corruption
- Claude API processes non-Latin text (or gracefully returns an error if unsupported)
- Typewriter animation handles multi-byte characters correctly
- No character splitting (e.g., emoji or Malayalam glyphs rendered incorrectly)
```

### J2. Very Dense Text — Maximum Blanks
```
TEST: Paste a passage that Claude might extract 20+ blanks from.

EXPECT:
- All cards render correctly
- No card crashes the UI
- Progress HUD shows correct total card count
- Session summary tallies all cards
```

### J3. Special Characters in Terms
```
TEST: Text contains terms with special characters: "Na+/K+-ATPase", "-55 mV", "CD4+ T cells", "HbA1c", "CYP3A4".

EXPECT:
- Terms with special characters are extracted correctly by Claude
- Blank comparison works: typing "Na+/K+-ATPase" is accepted as correct
- Special characters render correctly in the typewriter animation
- Input field accepts special characters without encoding issues
```

### J4. Double-Click Convert Button
```
TEST: Double-click the Convert button very quickly.

EXPECT:
- Only ONE API call is made to /api/convert
- Only ONE usage increment occurs
- Button disabled state prevents the second click from registering
```

### J5. Network Offline During Conversion
```
TEST: Start a conversion, then disable network mid-request.

EXPECT:
- Timeout or network error is caught
- User sees a friendly error message (not a raw fetch error)
- Convert button re-enables so user can retry
- Usage counter was NOT incremented (request never completed)
```

### J6. Session Expiry During Study
```
TEST: Start a study session, let the Clerk session expire (or manually clear cookies), then try to save a deck.

EXPECT:
- Deck save fails with a clear "Session expired, please log in again" message
- User is NOT lost (study progress preserved in sessionStorage if possible)
- User is offered a sign-in prompt without losing their study session entirely
```

### J7. Concurrent Users — Rate Limit Isolation
```
TEST: Two different user accounts each use 2 conversions. Verify their limits are independent.

EXPECT:
- User A at 2/3 does not affect User B's count
- Redis keys are scoped by userId (not shared)
- Neither user can consume the other's quota
```

### J8. XSS — Malicious Text Input
```
TEST: Paste the following into the convert textarea:
<script>alert('xss')</script>
<img src=x onerror=alert('xss')>

EXPECT:
- No JavaScript is executed
- Text is treated as a plain string
- When rendered in cards, it appears as escaped text (not executed HTML)
- React's JSX rendering escapes this automatically — verify no dangerouslySetInnerHTML is used with user content
```

### J9. SQL Injection — Deck Title
```
TEST: Create a deck with title: '; DROP TABLE decks; --

EXPECT:
- Deck is created with the literal title string
- No database error occurs
- No tables are dropped
- Supabase parameterized queries handle this safely (confirm no raw string interpolation in queries)
```

### J10. Large Deck — 100 Cards
```
TEST: Manually insert a deck with 100 cards into the database. Navigate to /dashboard/study/{deckId}.

EXPECT:
- Study page loads without timeout
- All 100 cards are retrieved correctly
- Progress HUD shows "Card 1 of 100"
- No memory issues or UI lag during session
- Session summary at the end shows all 100 cards tallied
```

---

## SECTION K — ENVIRONMENT & CONFIG TESTS

### K1. All Environment Variables Present
```
TEST: Check that all required env vars are set in the production Vercel environment.

REQUIRED VARS:
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ✓
- CLERK_SECRET_KEY ✓
- NEXT_PUBLIC_CLERK_SIGN_IN_URL ✓
- NEXT_PUBLIC_CLERK_SIGN_UP_URL ✓
- ANTHROPIC_API_KEY ✓
- NEXT_PUBLIC_SUPABASE_URL ✓
- NEXT_PUBLIC_SUPABASE_ANON_KEY ✓
- SUPABASE_SERVICE_ROLE_KEY ✓
- STRIPE_SECRET_KEY ✓
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ✓
- STRIPE_WEBHOOK_SECRET ✓
- STRIPE_PRO_PRICE_ID ✓
- UPSTASH_REDIS_REST_URL ✓
- UPSTASH_REDIS_REST_TOKEN ✓
- NEXT_PUBLIC_APP_URL ✓

EXPECT:
- All 15 variables present
- No variable contains "test", "example", or "placeholder" in production
- ANTHROPIC_API_KEY starts with "sk-ant-"
- STRIPE_SECRET_KEY starts with "sk_live_" (not "sk_test_" in production)
```

### K2. Stripe Webhook Endpoint Registered
```
TEST: Check Stripe Dashboard → Webhooks.

EXPECT:
- Endpoint URL: https://yourdomain.com/api/stripe/webhook (production URL)
- Listening for: checkout.session.completed, customer.subscription.deleted, invoice.payment_failed
- Signing secret matches STRIPE_WEBHOOK_SECRET env var
- Last webhook delivery shows success (200)
```

### K3. Supabase Row Level Security (RLS)
```
TEST: Attempt to query Supabase directly using the anon key (simulating a client-side attack).

EXPECT:
- SELECT on decks returns only rows where user_id matches the authenticated user
- Cannot SELECT, INSERT, UPDATE, or DELETE another user's decks
- Cannot SELECT, INSERT, UPDATE, or DELETE another user's cards
- Service role key bypasses RLS (used only in server-side API routes, never exposed to client)
```

### K4. Build Passes Without Errors
```
TEST: Run `npm run build` on the production codebase.

EXPECT:
- Zero TypeScript compilation errors
- Zero ESLint errors (warnings acceptable)
- All pages pre-render successfully
- No "module not found" errors
- Bundle size: main JS chunk < 200KB gzipped
- Dynamic imports confirmed for: study game engine, Stripe.js
```

### K5. No Exposed Secrets in Client Bundle
```
TEST: Inspect the built JavaScript bundle (in .next/static/chunks/) for secret strings.

EXPECT:
- ANTHROPIC_API_KEY does not appear in any client-side bundle
- SUPABASE_SERVICE_ROLE_KEY does not appear in any client-side bundle
- STRIPE_SECRET_KEY does not appear in any client-side bundle
- CLERK_SECRET_KEY does not appear in any client-side bundle
- Only NEXT_PUBLIC_ prefixed keys appear in client bundles
```

---

## SECTION L — SMOKE TESTS (Run Last, In Order)

These are the 10 most critical user flows. If any of these fail, do not deploy.

```
SMOKE TEST 1: New user signs up → lands on dashboard → sees usage meter showing 0/3 → no errors in console.

SMOKE TEST 2: New user pastes medical text → clicks Convert → sees loading state → receives cards → previews them → saves deck → deck appears in deck list.

SMOKE TEST 3: User navigates to saved deck → enters study mode → answers one blank correctly → sees correct animation → score increases → advances.

SMOKE TEST 4: User exhausts 3 daily conversions → attempts 4th → sees upgrade modal (not an error page).

SMOKE TEST 5: User clicks "Upgrade to Pro" → reaches Stripe checkout (test mode) → completes payment → redirected to /dashboard?upgraded=true → plan shows Pro → can convert without limit.

SMOKE TEST 6: Pro user's subscription is cancelled (via Stripe dashboard) → webhook fires → user plan reverts to free → 3/day limit re-applies.

SMOKE TEST 7: Unauthenticated user visits /dashboard → redirected to /sign-in → signs in → redirected back to /dashboard.

SMOKE TEST 8: User completes a full study session (all cards answered) → sees session summary → score displayed → "Study again" resets and works correctly.

SMOKE TEST 9: Landing page loads in < 3s on a simulated 4G connection (Chrome DevTools throttling) → demo widget is interactive → sign-up CTA navigates correctly.

SMOKE TEST 10: All API endpoints return correct HTTP status codes for unauthenticated requests (401, not 200 or 500).
```

---

## LAUNCH READINESS SCORECARD

```
After running all tests, tally results:

SECTION A (API)          __ / 14 passed
SECTION B (Stripe)       __ / 5 passed
SECTION C (Auth)         __ / 5 passed
SECTION D (Game Engine)  __ / 10 passed
SECTION E (Animation)    __ / 5 passed
SECTION F (Convert Page) __ / 6 passed
SECTION G (Landing Page) __ / 5 passed
SECTION H (A11y)         __ / 6 passed
SECTION I (Mobile)       __ / 4 passed
SECTION J (Edge Cases)   __ / 10 passed
SECTION K (Config)       __ / 5 passed
SECTION L (Smoke Tests)  __ / 10 passed

TOTAL: __ / 85

VERDICT:
85/85   → Ship it. Recall.ai is ready. 🚀
80–84   → Fix Critical failures first. Ship Minor failures as known issues.
70–79   → Do not deploy. Fix Major + Critical failures.
< 70    → Significant rework required. Re-run full suite after fixes.
```

---

## KNOWN ACCEPTABLE FAILURES (Pre-MVP)

The following can be deferred to post-launch without blocking deploy:

- H5 (Reduced Motion) — implement after core UX is stable
- I4 (iPad layout) — optimize post-launch
- J1 (Non-Latin text) — document as "English-optimized" in v1
- Analytics / tracking events — not required for launch
- Deck export (PDF/CSV) — Pro feature, can be "coming soon" at launch
- Progress / spaced repetition algorithm — v2 feature

---

*This test suite covers 85 test cases across 12 sections. Estimated time to run manually: 4–6 hours. Estimated time with a vibe coding agent running automated checks: 20–40 minutes. Automate Section A, C, K fully. Run D, E, F manually with UI observation. Run L as the final human sign-off before merging to main.*
