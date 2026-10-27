I'm planning out the structure for Even Keel, covering how people get added with uniqueness checks, and how expenses capture description, amount, payer, and split participants with equal division handled in integer cents to avoid rounding errors.

I'm also working through balances and settle-up logic to minimize transfers, plus money formatting, localStorage persistence, responsiveness, and accessibility. For the visual design, I'm settling on a navy-and-signal-red palette with a warm serif like Fraunces paired with a clean sans like Inter to give the tool a steady, confident feel.

For focus rings, I'll use Harbour with an offset on light backgrounds and a lighter tone on dark ones. For the palette, I'm settling on a warm off-white background, white surfaces, a warm-grey border, and a muted text color I'm checking for sufficient contrast against both the white and off-white backgrounds.

Checking contrast against the background color #F6F3EE: computing its luminance gives about 0.8985, so the contrast ratio against the dark foreground color is roughly 5.24, which is solid.

For a positive color option I'm testing a sea green (#1E6B52), calculating its luminance at about 0.1141 and finding a contrast ratio of 6.4 against white, which passes easily. Now I'm checking a signal color #C2462B against white next.

That's too close for comfort, so I'll darken Signal for text use to #A83A22, which gives a contrast ratio of 5.76 on paper and 6.4 on white—comfortably passing AA. I'll keep the original brighter Signal (#C2462B) for button backgrounds where white text sits on top.

Checking Harbour navy #1F3A4D against white, I get a luminance of about 0.0385, giving an excellent contrast ratio near 11.86 either direction—plenty strong for a navy header band with white wordmark text. With the palette validated, I'm moving on to the header design and overall page layout.

For structure, I'm sketching a desktop layout with People and Add-expense form grouped on the left, and Balances, Settle up, and Expenses on the right, considering whether Balances and Settle up should share one "where things stand" card since that's really the key output users want to see.

On mobile I'll stack things in the same input-first order: People, Add expense, then the results sections. Now I'm starting to sketch the state model, beginning with the people array structure.

I'm deciding whether to key people by id or name — ids are more robust for future features, though tests reference names directly. I'll skip renaming for now, but I think allowing removal of a person makes sense as long as they aren't referenced in any expense, so I'll add a disabled "Remove" button with an explanatory reason in that case.

Though I'm now worried that adding this button's text could interfere with how tests match person element content — if a test uses exact text matching rather than substring matching, having "Remove" text alongside the name inside the same element could break it. I need to be careful about where I place that button relative to the name's test id.

To be safe against exact-text assertions, putting the testid directly on the name span is the safer choice over wrapping the whole li. I'm also weighing whether removal is worth the complexity — maybe only show the remove option when a person has no associated expenses, since removing someone with existing expenses gets messy.

On data modeling, I'm leaning toward just using the name as the identifier rather than introducing separate ids, since tests reference people by name in selects and checkboxes anyway, and names should be stable and unique enough to not cause problems.

Writing the split calculation function...

For balances, I'll sum each person's payments as payer against their share across expenses to get a net balance. For settling up, I'll use a greedy algorithm that sorts creditors and debtors by amount and matches the largest debts against the largest credits.

Now I'm working out amount validation, considering a regex to allow optional dollar signs, comma-separated thousands, and up to two decimal places.

Actually `type="number"` is risky: Playwright would error if a test tries filling non-numeric garbage like "abc", and the browser silently clears invalid values so I can't preserve what the user typed. A text input with `inputmode="decimal"` avoids these pitfalls and handles validation more predictably.

For the "at most 2 decimals, must be positive" rule, I need amounts like "0" or "0.00" rejected, and negatives rejected too. For error display, I'll use a persistent `aria-live="polite"` container and only insert the `data-testid="form-error"` element when there's an actual error, so tests checking for its absence pass cleanly when the form is valid.

With two separate forms (person and expense), I need to make sure only one error can be visible at a time to avoid strict-mode query failures in tests, so I'll clear a form's error whenever that form resubmits successfully or the relevant field changes.

Actually, I'll keep the error visible until the next submit attempt rather than clearing on input—simpler, avoids race conditions, and clearing isn't strictly necessary for correctness even if it's nicer UX.

For accessibility, I'll link the error to its input via `aria-describedby`, mark the invalid field with `aria-invalid="true"`, and move focus to the first invalid field on submit so screen readers announce the error via `role="alert"`. State gets persisted to localStorage under a versioned key.

For the expense form, the payer select defaults to the first person but preserves the current selection as people are added. Split checkboxes default to everyone checked, with new people added defaulting to checked while preserving existing unchecks, and resetting to all-checked after a successful submission.

When no people exist, I'll disable the expense form's fieldset and show an empty-state message, while still rendering the select and checkbox container structure. I'm also thinking through test selector compatibility — using value attributes matching names so Playwright's selectOption and checkbox locators work reliably.

For checkbox styling, I'll go with appearance:none custom checkboxes using an SVG background-image for the checkmark, keeping them visible and clickable so Playwright interactions still work fine, with a focus-visible ring for accessibility.

I'll simplify instead: keep the actual checkbox visible as a small styled box inside the pill, with the focus ring placed directly on the input itself, which is more robust across browsers than relying on `:has`. I'm also double-checking that `appearance: none` with explicit width/height keeps the checkbox detectable as visible for Playwright's bounding-box checks.

For the expense list items, I'm deciding how to display the split: showing each person's actual share (e.g., "Ana $4.00, Ben $3.33, Cam $3.33") is more honest when amounts don't divide evenly, versus a flat "$3.33 each" which could mislead. I'll lean toward showing per-person amounts only when the split isn't perfectly even, keeping it simpler otherwise.

I'll go with "Paid by Ana" phrasing since it clearly covers both the payer check and split names in one line. For removal, I'll add a simple "Remove" button with a testid and aria-label, skipping confirm dialogs to keep tests simple—maybe just a quick undo toast instead.

I'm leaning toward a modest undo feature: store the last removed expense, show a fixed bottom status bar reading "Removed Dinner." with an Undo button that auto-dismisses after about 7 seconds. I just need to be careful it doesn't overlap with other key UI elements, especially on mobile where a fixed bottom toast could cover something important.

Actually, I'll move it inline instead -- placing the undo notice at the top of the expenses list rather than fixed to the bottom, since that's calmer and avoids any overlap issues. I'll let it clear on the next state change or after roughly 10 seconds, and when undone, the expense should restore to its original index in the list. I'm also thinking it'd be useful to add a "Clear trip" button in the footer for resetting everything at the end of a trip.

For that reset flow, instead of a native confirm dialog (which could behave oddly with automated testing), I'll do an inline two-step confirmation: clicking "Start a new trip" reveals "This clears everyone and every expense" with "Yes, clear it" and "Keep it" options -- more accessible and avoids native dialogs entirely. Now I'm also planning the balances display: each person shows their name, formatted balance, and a label like "is owed $X", "owes $X", or "is even," using a signed data-cents attribute and color coding.

I'm adding a small proportional bar visualization under each balance, extending left for negative and right for positive from a center line, purely decorative with aria-hidden. I'm also including a summary header showing the trip total and expense count, plus a settle-up section listing suggested transfers between people with data attributes for who pays whom and how much.

For empty or settled states, I'm writing friendly messages like "Once there are expenses, you'll see who pays whom here" or "You're all even. Nothing to settle." I'm also considering a clever way to let users record a payment as simply an expense where one person pays and the full amount splits to the other person — reusing the existing data model elegantly rather than building a separate settlement feature.

Deciding it's fine to keep since extra buttons won't break DOM-based tests. I'm settling on keeping undo removal, mark-as-paid, start new trip, and remove unreferenced person as features, and making the settle algorithm deterministic by sorting debtors and creditors by amount descending with ties broken by people order, using a greedy approach. Now I'm moving into the visual design details, starting with a full-width header band in Harbour color featuring the "Even Keel" wordmark in Fraunces font alongside a simple mark.

I'm sketching a small inline SVG mark — a circle representing a level/keel with a horizontal waterline and a hull shape beneath it in Signal color, keeping it simple and recognizable, plus a tagline under the wordmark in light blue-grey text.

Checking the contrast ratio of that blue-grey (#C9D6E0) against the Harbour background comes out around 8:1, which is solid. I'm also considering adding a trip summary line in the header, like "3 people · 5 expenses · $412.50 total," positioned on the right side for desktop layouts.

I'm rethinking header placement—maybe move the summary into the "Where things stand" card instead, keeping the header limited to the wordmark and tagline. For the "Start a new trip" action, I'll put it in the footer rather than the header to avoid accidental taps, since it's a rare action anyway and already has a two-step confirm. Now sketching the main content grid with a max-width container and responsive column split at wider viewports.

Cards get a consistent treatment: white surface, warm grey border, rounded corners, generous padding, with Fraunces headings for "People," "Add an expense," "Balances," "Settle up," and "Expenses"—avoiding step-numbered language. For empty states, I'm drafting gentle nudges like inviting people to add trip members first, or suggesting the first expense could be something simple like gas or groceries.

I'm also working through button hierarchy—Signal accent for the primary "Add expense" action, Harbour for adding a person, outlined secondary buttons elsewhere, and subtle text-style remove buttons. Now I'm defining border colors: a warm tone for card edges and a slightly darker neutral for input fields to meet contrast requirements against white.

Checking contrast ratio...

That works out to 3.53, well above the 3:1 minimum, so I'll set `--input-border: #7F8A92`. Next I'm checking the focus ring outline using the signal color against both white and paper backgrounds, both comfortably passing 3:1.

For the header buttons sitting on the Harbour background, I'll use a lighter ring color or white instead, setting the signal ring globally but overriding it to white in the header. For the signal-filled primary button itself, since the ring and fill would be the same hue, I'll switch the outline color to Harbour there so it stays distinguishable with the 2px offset gap. Now I'm moving into typography, starting with body text in IBM Plex Sans at 16px with 1.5 line-height.

Setting up preconnect links and the HTML document structure with a masthead header containing the brand logo...

Adding more form markup...

Finishing the layout with balances, settle-up, and expenses sections, plus a footer for starting a new trip. I'm now second-guessing whether the expense fieldset should be disabled when there are no people added yet — if it's disabled, the add-expense button would block Playwright clicks since it waits for the element to be enabled, which could interfere with tests expecting an inline error message instead.

Safer approach: keep the form always enabled and instead show an inline error like "Add at least one person first" on submit if there are no people, rather than disabling controls. For the select, I'm considering rendering a placeholder option like "— add a person first —" with an empty value when the people list is empty, so the UI stays usable and tests aren't blocked by disabled elements — alternatively just showing a note above the form explaining the prerequisite.

For the split-between section, I'll use a fieldset with a legend so the checkboxes are properly labeled, and I'm thinking about adding a quick "Everyone" button to select all participants at once, since "Nobody" doesn't make sense given the minimum-one requirement.

I also want to show a live preview of how the split breaks down — something like "$10.00 split 3 ways: Ana $3.34, Ben $3.33, Cam $3.33" so users can see the per-person amounts update as they type, keeping it as a static visual hint rather than an announced live region to avoid being too chatty.

Writing the JS...

Still writing load/save logic...

I need to dedupe names case-insensitively and validate that expenses reference existing people, with cents as a positive integer and a non-empty split before persisting. For rendering, I'll rebuild each list's DOM while explicitly preserving the current selection state in the expense form's select and checkboxes.

Now I'm writing the amount parser: it strips a leading dollar sign and commas, rejects empty or malformed strings, flags inputs with more than two decimal places as an error, then converts the whole and fractional parts into a cents integer.

I'm adding error handling for invalid, zero, and overly large values, capping the total around $999,999,999.99 to stay within safe integer range, while noting edge cases like a trailing decimal point ("12.") being treated leniently and negative numbers being rejected outright as invalid.

For name validation, I'm deciding to just trim whitespace rather than collapsing internal spaces, since that could alter unexpected test inputs, and I'm considering enforcing a max length of 40 characters to match the input's maxlength attribute.

Since Playwright's `fill()` respects maxlength, imposing a strict character cap risks silently truncating a legitimately long test name, so I decide not to enforce any hard limit and instead rely on `overflow-wrap: anywhere` to keep long names from breaking the layout.

For duplicate checking, I'll compare names case-insensitively, likely using `localeCompare` with a sensitivity setting to handle accents and casing consistently.

For the duplicate message, I'll use the existing stored name for clarity, e.g. "Ana is already on the trip," since referencing the canonical version avoids confusion if the input casing differs.

For an empty name field, I'll show "Enter a name to add someone," and now I'm turning to the error states for the expense form.

I'm drafting each validation message: missing people, empty description, amount errors (empty, invalid, too many decimals, zero, too large), missing payer, and empty split selection — each phrased simply and specifically with example values so the user knows the expected format. I'm deciding to surface only the first error at a time rather than overwhelming the user with all of them at once, keeping the tone calm and focused on one field. After a successful add, I'm thinking through what should reset — clearing description and amount but likely keeping the same payer selected, since that's often convenient for consecutive entries.

For the split, I'll reset it to everyone checked by default, move focus back to the description field, and announce the addition like "Added 'Dinner'" through a visually-hidden live region for screen reader users. Now I'm writing the balance computation logic, which tallies what each person paid against their share of every expense to produce a running balance per person.

Writing debt settlement logic...

Since balances always sum to zero, this loop terminates cleanly. Now I'm thinking about the balance display text and whether red for "owes" is the right tone—since the principle here is that owing between friends is normal, not alarming, so a warm red-orange might send the wrong signal.

I'll go with sea green for "is owed" and harbour/ink tones for "owes," keeping red out entirely so neither state reads as an error, reserving the brighter accent color purely for actions rather than balance states.

For the balance bar, I'm picturing a track with a centre tick that extends left or right depending on who owes whom, just a decorative visual cue reinforcing the color coding.

And I'm landing on using the signal accent specifically for error messaging, since that's where visual attention actually belongs — an icon plus darker signal-toned text for genuine problems.

Now I'm sketching the markup for an expense list item...

Still writing markup...

Now I'm second-guessing the wording for split counts — "split 3 ways" doesn't quite work when there's only one other person involved, or when the split list only includes the payer themselves, so I need clearer phrasing logic for those edge cases.

I'll keep the heading since it helps screen reader navigation, even with many expenses. I'm also considering adding a timestamp—showing a short date like "14 Jun" in the meta line alongside who paid and the split count, using a locale-aware date formatter to keep it subtle but useful for a multi-day trip.

For ordering, I'll store expenses in insertion order and just render them reversed for "newest first," which keeps undo logic simple since indices stay correct. For the people list, I'm leaning toward showing each name with a muted count like "in 3 expenses" or "no expenses yet," plus a remove button only when that person isn't referenced by any expense—keeping it simpler than duplicating the balances detail.

I realize the testid placement matters: if tests expect exact text per element, "person" needs to sit on the name span itself rather than the li (which also contains the Remove button), otherwise exact-match assertions would fail. The same logic applies to "expense" items, but there it's fine for the testid to be on the li since the delete button is expected to live inside each expense entry. I'm also thinking about rendering people as pills in the split UI, and considering how the Balances card header should summarize the trip total.

Writing CSS variables...

Still writing SVG code...

Now I'm shaping the hull as a trapezoid with a curved bottom edge, then moving on to the page layout, setting up a responsive grid wrapper with breakpoints for larger screens.

Adding card component styles...

Now I'm styling form fields with labeled inputs and selects, ensuring touch-friendly sizing and a visible focus ring for accessibility, though I'm second-guessing how `:focus-visible` behaves across browsers like Chrome.

Writing button styles...

Styling the checkbox chip states...

I'm verifying that `::before` actually renders on an appearance-none checkbox input—this is a quirky but supported behavior in Chrome and Firefox, so the clip-path checkmark trick should display correctly.

Now I'm laying out the people list as a grid with dividers between rows, and giving each person a circular avatar showing their initials in a colored background—a nice compact way to represent attendees.

For balances, I'm designing a grid with a bar visualization that has a center tick mark, representing positive/negative amounts relative to a midpoint with a fill indicator.

For the transfers list, I'm structuring each row with a flexible layout showing who paid whom, an arrow icon, the amount in bold, and a ghost-style "Mark as paid" button.

Clicking "Mark as paid" creates a settlement expense—"Ben paid Ana back", paid by Ben, split with Ana—and I'm tagging it with `kind: 'payment'` so it can show a small "Payment" label in the expense list. Now I'm styling the expenses list container.

I'm reworking the layout as a grid with description and amount on top, meta and remove button aligned below—giving more breathing room on narrow 360px screens where space is tight.

Finishing the grid layout...

Now thinking through empty states styling—muted text, padding, paper background, maybe a dashed border to signal it's a placeholder area.

I'm also planning the undo notice bar with flexbox spacing and a soft harbour background, plus a footer with privacy reassurance text and a two-step "start new trip" action. I'm weighing whether the header should sit outside `<main>` for semantic correctness as a banner, while checking that tests only query within the main app region.

Now I'm starting to write the JS module, setting up storage keys and a CAD currency formatter for converting cents to formatted money strings.

Finishing element references, then writing the state management functions to load and save trip data from localStorage, with validation logic for deduplicating people names.

Finishing validation of expense fields...

Now I'm defining a uid generator using timestamp plus random string, then writing a sharesFor function that evenly splits an expense's cents across its members, distributing any leftover cents one at a time to avoid rounding errors. I'm starting on a balances function that tracks each person's net amount using a map initialized to zero.

Writing balances logic and render functions...

Toggling empty-state visibility based on whether people exist, then verifying the dataset.testid attribute mapping and refining the "N expense(s)" note for clarity. I'm also double-checking that initials extraction handles unicode names safely before moving to building the expense form's payer dropdown, which needs to repopulate from the people list while preserving the previous selection.

Rebuilding the split checkboxes, preserving prior checked states...

For the "Everyone" button, I'm setting all checkboxes checked and updating the summary. The updateSplitSummary function counts checked people and writes "n of total selected" text, hides the "select all" button when everyone's already selected, and triggers a preview render. That preview will parse the amount and, if valid with people selected, compute per-person shares like "Ana $3.34, Ben $3.33, Cam $3.33," noting when the split isn't perfectly even.

I'm wiring an input listener on the amount field so the preview updates live, and refining the wording: single-person splits just show their share plainly ("Ana's share: $10.00"), while multi-person splits list everyone with a "Shares:" label. Now I'm starting the renderExpenses function...

Still writing render logic...

Adding a remove button with proper aria-label for accessibility, then wiring up its click handler to delete the expense. I'm also considering adding a "Payment" tag badge next to the title for payment-type entries, then moving on to building the renderBalances function.

I'm computing each person's balance and rendering a list item showing their name alongside whether they're owed or owe money, plus a visual bar scaled to the max absolute balance, and then calling settle() to generate suggested transfers. I'm deciding on the exact wording and formatting for the owed/owes amount display, like whether to use a "+$12.50" style or "is owed $12.50" text.

I'll add a header subtitle noting the minimum number of transfers needed to settle up. Now I'm writing the form submit handler for adding a person, trimming the name, validating it's non-empty, and checking for duplicates before pushing to the people list.

For the commit function, I'm thinking through whether to clear the undo notice on every commit, deciding to pass a `keepNotice` option so undo actions don't wipe their own notice.

Writing expense form validation...

Still writing expense handler...

But I need to double check the ordering — commit() triggers render(), which could reset the form fields before I manually clear them, so I should verify the sequence doesn't clobber my reset logic.

Keeping focus on the description field after adding makes sense for quick successive entries, and the announce region covers accessibility. For the split-empty error case, I should focus the first checkbox so screen reader users land right where the fix is needed.

Writing showError helper...

For clearErrors, I'm just wiping both message boxes and stripping aria-invalid/aria-describedby from any field that has them. I should double check whether the message container needs aria-live="polite" or role="alert" for proper announcement.

Since I'm already moving focus to the invalid field and setting aria-describedby, screen readers will read the description on focus, but keeping aria-live="polite" on the container too is a reasonable redundancy since focus and live-region announcements aren't always reliable together—I'll accept the minor double-announcement tradeoff and keep both. Checkboxes losing aria-invalid on re-render is a minor detail not worth worrying about now.

Writing removeExpense function...

After removing an expense, the focused button disappears, so I need to decide where focus should go next—moving it to the undo button in the notice seems best since it lets the user immediately reverse the action.

Actually, repeated deletions via Enter could accidentally trigger undo, so I think focusing the notice container itself (with tabindex=-1) is a safer compromise, since Tab would still reach Undo if wanted. For undoRemove, I'll splice the expense back at its clamped index, commit, clear the notice, and return focus to the heading, with the notice auto-hiding after 8 seconds or on any other commit. For removePerson, I'll only allow removal if unreferenced, then splice, commit, announce, and focus the person-name input.

For the "new trip" flow, I'm adding a footer button that reveals a confirm panel warning how many people/expenses will be cleared, with Yes/Keep buttons — confirming resets state, commits, focuses person-name, and announces. All buttons are native so keyboard access is free.

Now I'm handling the live region announcer by clearing then setting textContent, and working through date formatting quirks — en-CA's short month format oddly includes a period like "Jun." so I'm considering alternate locale options to avoid that.

I decide it's simpler to hand-format dates with a small month-name array rather than rely on locale formatting, producing something like "14 Jun" without a year. Now I'm moving into writing the full HTML/CSS/JS, thinking through mobile layout widths at 360px — wrapper sizing, card padding, and how the person row (avatar, name, remove button) fits within the narrowed content area.

For the expense form, I'm planning the amount field with a "$" prefix and a flexible add-person row where the input shrinks responsively next to the button. I'm also handling long chip names with wrapping rules, and styling the select dropdown with a custom arrow using appearance:none and a background SVG.

Writing dropdown and focus styles...

Going simpler, I'll absolutely position the "$" prefix inside the amount field while keeping the input's own border and focus styles intact. I'm also confirming names get trimmed and can't be empty, and that pressing Enter in either form submits it properly, then thinking through how invalid expense submissions should preserve the user's typed input.

I'm verifying a three-way split example: amount 10 split among Ana, Ben, Cam yields shares 334/333/333, producing balances of 666/-333/-333 and resolving to just two transfers, which stays within the allowed limit. I'm also checking that currency formatting like "$1,234.50" renders correctly in en-CA locale, and that signed balance values convert cleanly to strings for the data attribute.

I'm confirming zero balances display as "0" not "-0" since all arithmetic stays integer-based, checking the payer select options render properly, verifying the split checkboxes container holds one input per person as expected, and making sure user-supplied names can't inject HTML since I'm using safe DOM methods rather than innerHTML.

Now I'm planning the heading hierarchy (h1 for the app title, h2 per card, h3 per expense) and designing the masthead with a dark navy band and a thin Signal-colored bottom border as a brand accent, with the brand mark and wordmark on one side and a trip summary pulse showing people/expense counts on the other.

For the trip pulse text, I'm writing conditional states: "New trip" when empty, "3 people · no expenses yet" when there are people but no expenses, and a fuller summary with totals once expenses exist. I'm also setting up Fraunces font loading with optical sizing enabled.

Writing base CSS reset...

I'll add a reduced-motion wrapper for subtle transitions, then start building the full HTML document with meta tags, title, and description for the Even Keel trip-splitting app.

Writing HTML head markup...

Still writing markup...

I notice the skip link is visible on focus, which is good for accessibility.

Now I'm setting up the People card with a form for adding a person's name, including a submit button and an aria-live message area for feedback.

Next, I'm adding the empty-state hint for the people list and starting the Expense card, whose form will stay hidden with a hint until someone's been added, then begin fields for description and more.

Adding the amount and payer fields...

Adding markup for balances...

I'm also finishing the expenses section markup, then thinking about placeholder text contrast — checking whether "e.g. Priya" style placeholders meet AA contrast standards against a white background.

Now I'm resetting fieldset default styles for the split section, removing border, padding, and margin.

For the person-entry form, I'm setting up a flex layout that wraps with a gap, letting the name input flex and shrink properly on small screens. I'm making the add-expense button full width as a strong call-to-action, and adding a muted small-text style for card subtext.

Then I'm structuring each balance list item with data attributes for testing (name, cents owed), showing the person's name, their owed/owes state with a bold dollar amount, and a detail line breaking down what they paid.

For layout, I'm using CSS grid with two columns—name on the left, state right-aligned with tabular numbers—plus a progress bar fill showing the balance visually, and a detail row spanning the full width with muted subtext.

For transfer items, I'm designing them with a simple "Ben pays Ana" phrasing paired with the amount, keeping it readable and semantic with an arrow icon and screen-reader text.

A "Mark as paid" ghost button creates an expense representing the actual payment (e.g. "Ben paid Ana back"), which correctly shifts both balances toward zero. I'm also drafting the small supporting copy—like the expenses count summary and empty-state messages for when there are no people, no expenses, or no balances yet—to guide users clearly through setup.

For the case where people exist but no expenses, I'll show everyone's balance as "is even" rather than hiding the list, since it's more reassuring and likely matches what tests expect for `data-testid=balance`. I'm refining the settle-up and expenses-empty states too, keeping the tone consistently second-person ("you"), and now moving on to styling considerations.

For the empty-state card I'm setting a paper background with rounded corners and muted text, then designing a `.hint` variant with a left accent border in the harbour color for use in the expense form when no people exist. I'm also sketching an error style with a bold warning color and an icon, using flex layout to align an exclamation symbol next to the message text.

Adding invalid-input styling and Fraunces heading rules...

I'm styling the pulse text and footer, then wiring up the "Start a new trip" button so clicking it reveals a confirmation panel with a dynamic message about how many people and expenses will be cleared.

The confirm actions handle canceling (hiding the panel) or confirming (resetting state, saving, re-rendering, and announcing the new trip), with the button hidden when there's nothing to clear. I'm also adding a plural helper and a simple commit function that saves and re-renders.

I want notice hiding to happen consistently before most actions commit, but show after removal specifically so the undo message appears post-render; undo itself hides the notice, commits, then refocuses the heading. The notice also needs a 10-second auto-hide timer, and I'm considering how re-rendering during commit might disrupt focus if it was on a checkbox inside the expense form.

For focus management after destructive actions like marking a transfer as settled or removing a person, I should move focus to a stable anchor like a tabindex-negative-one heading or the person-name input, since the originally focused element may no longer exist after re-render. I also need the amount input to trigger preview updates, though the payer select shouldn't affect share calculations, and I'm weighing whether to listen for storage events so other open tabs stay in sync when the trip data changes.

Now I'm writing small DOM helper functions for creating elements and text nodes, plus a function that extracts initials from a name by grabbing the first character of the first and last parts.

Defining the color palette variables...

Settling on a darker near-black ink `#1C2830` for body text with harbour tones for headings, giving good contrast. Writing base styles and typography now...

Adding masthead styles...

Adding form field styles...

Adding dropdown and amount input styles...

Still writing checkbox styles...

I'm also considering an edge case with the aria-live region: toggling its display between none and visible exactly when content is inserted might cause some screen readers to miss the announcement, since the accessibility tree needs the element to already exist as a live region before the mutation happens.

So I decide to remove the `:empty{display:none}` rule on `.msg` since it has no inherent margin anyway, and keep `.preview`'s hiding since it isn't a live region. Now I'm moving on to writing the button styles...

Adding button variant styles...

Adding avatar and balance row styles...

Adding balance bar styles...

Styling expense layout...

I'm checking the tag badge's contrast ratio against its background to confirm the sea color on light green meets accessibility standards.

Now I'm defining the notice banner styles with flexible wrapping layout and a hidden-state rule, then the empty-state box styling, and realizing I need a global `[hidden]{display:none !important}` rule since the hidden attribute needs to override class-based display settings.

With that settled, I'm moving to the footer styles with a top border and flexible space-between layout for its inner content, plus a confirmation banner style for new trips using a soft signal background. Now I'm starting to assemble the JavaScript, beginning with a strict-mode IIFE wrapper and setting up storage constants...

Defining helper functions...

Still wiring up DOM references...

Now I'm defining amount validation error messages and starting the parseAmount helper to sanitize and validate user-entered dollar amounts.

Rejecting oversized dollar amounts, then converting the remaining digits into cents and rejecting zero or negative totals. I'm mentally tracing through test cases like "12.345", "abc", "0", "-5", ".", "12.", and ".5" to confirm each hits the right error or produces the correct cent value.

Stripping commas, dollar signs, and whitespace before parsing, then verifying cases like "1,234.50", "$12", "12.5", and "100" all resolve to the expected cent amounts, while capping at a max of $999,999,999.99. Now I'm thinking through how split computations handle member filtering and drafting the display strings for people count and expenses count.

Writing tallies function...

Now I'm writing the balances rendering function that computes each person's net position, finds the maximum absolute net value for scaling bar widths, and prepares to render each person's row.

Still building balance rows...

Then I compute the trip summary total and update the text to show total cost across expenses, falling back to a placeholder when nothing's logged yet, and call renderTransfers. I'm also second-guessing the wording "Paid $10.00 · Share $3.34" for screen readers, deciding it reads fine as-is without needing extra phrasing like "Owes a share of."

For renderTransfers, I'm settling the balances into a list of transfers, clearing the existing list, and handling empty states: if there are no expenses yet, show a message explaining transfers will appear once expenses exist; if there are expenses but nothing to settle, show "You're all even." I'm toggling visibility of the empty-state text versus the actual list based on whether transfers exist, then building the summary text pluralizing the transfer count.

Now I'm creating each transfer item with data attributes for testing, showing who pays whom, the amount owed, and a "Mark as paid" button with an accessible label describing the specific payment.

When clicked, this button records the payment as a new expense entry tagged "payment" — described like "Ben paid Ana back" with the amount, so it shows up properly tagged in the expense list and settles the balance.

I'm also confirming render() calls things in the right order: pulse, people, expense form, expenses, then balances, and that init loads state, renders, and wires up listeners including the storage event. Then I need the expense hint shown when there are no people, the "Select everyone" button hidden appropriately, and a small pluralization helper for singular/plural labels like "1 person" vs "2 people".

Now I'm writing the announce function that clears and resets the status text for screen readers, plus the notice system that shows a temporary message with an action button and auto-hides after a timeout...

I'm finishing hideNotice to clear the timer, hide and empty the notice element, and reset lastRemoved to null — then double-checking the order of operations between commit() and showNotice() so the undo flow correctly captures lastRemoved before it gets nulled out.

I realize there's an edge case: if a person gets removed after an expense referencing them was deleted, undo would try to restore an expense pointing to a nonexistent person. I'm thinking through a guard that validates the payer and split names still exist before restoring, dropping missing split entries or invalidating the undo entirely if the payer is gone — and considering whether removing a person should also just clear any pending lastRemoved state to sidestep the issue.

Separately, I'm working through focus management: when the notice auto-hides after its timeout, if focus is still inside it, I want to redirect focus to the expenses title rather than letting it fall back to body, but only when the active element was actually inside the notice so I don't steal focus unnecessarily.

I'm also adding `preventScroll: true` to these focus calls to avoid jarring page jumps, and considering how `:focus-visible` outlines will behave on the programmatically focused heading depending on whether the last interaction was keyboard-based.

For the removal buttons, I'm weighing consistency: a bordered button per row feels heavy for the people list, so I'll settle on using the quieter `btn--link` text style for "Remove" in both the people and expenses lists, keeping the secondary action visually subdued and consistent across the two.

I'm making sure that link-style button still meets a proper tap target by giving it minimum height and padding. The "Select everyone" link should use this same link style. I'm also confirming the payer selection in the expense form persists correctly if a new person gets added afterward, and that the person-name input capitalizes words automatically. Now I'm thinking through accessibility for split checkbox validation errors, making sure focus moves to the first checkbox and it's properly linked to an error description.

On error clearing behavior, I'm deciding that instead of keeping errors visible until the next submit, I'll clear `aria-invalid` and the error message as soon as the user edits that specific invalid field -- a friendlier pattern that still passes expected test flows where an error appears after an invalid submit but disappears once corrected.

For implementation, I'm thinking through attaching a one-time listener per field when showing an error, but the checkbox group needs a 'change' listener on the container while selects also use 'change' and text inputs use 'input'. I'm now worried that attaching both listener types with `once: true` could cause one listener to linger and incorrectly clear an unrelated later error.

To fix this, I'm tracking a single cleanup function that removes any active listeners whenever clearErrors runs, instead of relying on multiple independent one-time handlers.

Finishing setting up the cleanup to remove the listener and focus the field. I'm double-checking edge cases: clearErrors running inside its own handler is safe in JS, aria-describedby removal is fine since there's nothing else attached, and focusing different fields like the amount input or checkboxes won't cause issues during re-renders.

Now I'm writing the errorIcon helper, building an inline SVG element with width, height, viewBox, and accessibility attributes set to hide it from assistive tech.

Using static inline SVG markup for the icon is fine since there's no user data involved. For the "Select everyone" button, I'm wiring it to check all checkboxes, update the summary, and shift focus to the first checkbox since the button disappears once everything's selected. Now I'm starting on the preview rendering logic.

Good, that confirms the split preview works correctly. Now I'm thinking through `renderPulse()`, the per-person expense counts for the remove note, and save() error handling with try/catch to ignore quota issues. I'm also verifying checkbox state preservation across form re-renders after submit, adding a person, removing a person, and starting a new trip.

I'll reset description and amount fields too when creating a new trip, and double-check the payer select handles missing people, empty states with a disabled placeholder, and the "add at least one person" validation before anything else runs. I'm also confirming tallies include people with zero expenses, the storage event re-renders cleanly, and the testid structure on person rows and name spans is consistent.

I should verify the expense-split checkboxes are accessible by label text (so `getByLabel` or `getByRole('checkbox', {name})` works), the payer select matches by value/label, mobile font sizes hold up at 360px, and the html lang attribute is set to en-CA. Dark mode and print styles aren't needed, so I'll skip those and move to writing the full file.

For apostrophes I'll use typographic ’ throughout for a more polished feel rather than escaping straight quotes in strings. Now I'm designing the SVG brand mark for the masthead...

Still writing SVG mark geometry...

Still working out the arc direction flags...

Good, that confirms the bulge sits below the chord. For the design itself, I'll keep it simple: a hull, a waterline, and maybe a small mast or sail triangle to read clearly as a boat at 40px.

Now I'm working through the remaining small details—hidden-attribute styling, font display swap, scroll behavior, button cursor states—and settling on the wrapper layout width calculation.

For ordering the right column sections, I'm weighing Balances versus Settle up versus Expenses placement. I think putting Balances first, then Settle up, then Expenses makes sense since settling is the end goal, though on mobile I'm considering reordering so newly added expenses appear right below the add-expense form for better feedback, while desktop keeps People and the form on the left with the other sections on the right.

Pairing people/balances/settle-up as "where things stand" against the expense form/list as "the ledger" feels like a clean split, keeping new entries appearing right below their form. On mobile, the short people/balance/settle-up cards would come before the longer expense section, which is a minor repeated scroll cost for frequent logging but manageable since scroll position persists.

Now I'm weighing three possible mobile orderings against the two-column desktop layout, checking whether DOM order naturally matches the visual column order in each case so that no CSS reordering tricks are needed.

Option C feels best: left column holds people and their standing (People, Balances, Settle up), right column holds the ledger (Add expense, Expenses). On mobile this puts results before the form, which actually suits the "passing a laptop around at week's end" scenario, though I'm checking the stacked card heights to make sure the phone experience during an active trip still feels reasonably compact.

I'll calculate that going with the form near the top (~400px down) serves the phone-logging use case better than burying it after all the summary cards. I'm leaning toward keeping desktop's left column sticky so the add-expense form stays visible while scrolling the ledger, though I need to think through what happens if that column is taller than the viewport.

Settling on the layout: left column holds People and Add expense, right column holds Balances, Settle up, and Expenses as separate cards rather than merging Balances and Settle up together, since distinct headings read more cleanly. Now I'm writing the final code, including subtext for the Expenses card header like "5 expenses · $412.50" and deciding how to phrase the balances explanation without being redundant.

For the Balances subtext I'm settling on "What each person paid, minus their share," positioned beside the heading on wide screens and below it on narrow ones. The Settle up card gets a dynamic subtext like "2 payments and everyone's even." I also need to handle the expense form hint when there are no people yet, keep the Add expense button always enabled, hide that hint once people exist, rename the pulsing animation class to something simpler, and hide the "Start a new trip" footer link when there's nothing to clear.

Now I'm working out the logic: the new trip button's visibility should depend on whether there are any people or expenses, and if the confirm dialog happens to be open when the trip empties out, it should close automatically. I'm also thinking through test scenarios involving localStorage being cleared and the page reloading.

Writing the HTML document head...

Defining color variables and resets...

Still writing styles...

Now I'm settling the focus outline and chip font-size, then starting the JS module with storage keys, currency formatting, date helpers, and DOM element references.

Adding state management, helper functions for naming and lookups, storage load/save logic, and amount parsing...

Now I'm structuring the math functions for splitting expenses and settling balances, followed by all the render functions for displaying people, forms, previews, expenses, balances, and transfers, plus message handling for errors and notices...

Still outlining action handlers...

Still validating expenses...

Now I'm writing a function that splits an expense's cost evenly among its assigned members, distributing any remainder cents one at a time until it's used up.

Next I'm designing a debt-settlement algorithm that separates people into debtors and creditors based on their net balances, sorts each group by amount owed, and greedily matches the largest debtor with the largest creditor to minimize the number of transactions.

Writing people list rendering...

Populating payer dropdown...

Writing the expense list renderer...

I'll put the static explanatory subtext for balances directly in HTML rather than generating it dynamically, then move to building the footer logic that hides the new-trip confirmation when there's no data yet.

For the pulse text, I'm writing a function that shows an encouraging message for an empty trip, or a summary of people/expenses/total spent so far once data exists, using pluralization helpers. Then I'm starting on the action functions, beginning with removing a person from the trip.

Adding more actions...

I'm writing the undoRemove function that restores the last deleted expense back into its original position, then double-checking that hideNotice doesn't clobber the lastRemoved state before I use it for the undo action.

Now I'm sketching recordPayment, which pushes a new synthetic settlement expense representing one person paying another back.

I'm verifying the math works out: the debtor's balance nets to zero and the creditor's balance nets to zero after the payment expense is applied, confirming the settle-up logic is correct. Then I move to startNewTrip, which resets state to empty people/expenses and clears the expense form.

Now I'm adding the reset logic for the person form, clearing errors, committing state, hiding the new-trip confirmation, rerendering the footer, and focusing the name input—then wiring up the person form's submit handler to validate the name isn't empty and check for duplicate names before adding someone to the trip.

I like that the duplicate warning is specific, showing the exact name match versus the existing person's name. Now I'm starting the expense form submit handler, first checking that at least one person exists on the trip before allowing an expense to be added.

Continuing the validation chain, requiring a description, a valid parsed amount with specific error messages, and a payer selected from existing people before proceeding to figure out the split.

Once validated, I'm adding the expense to state with a unique id, timestamp, and 'expense' kind, committing the change, then resetting the form fields, re-checking all split checkboxes by default, updating the summary display, refocusing the description field, and announcing the addition for accessibility.

I'm double-checking the filter logic for split selection works correctly with the findPerson lookup, then tracing through other event listeners: amount input triggering preview updates, split-all clicks, new-trip buttons, and storage sync events. I also verify the person name validation handles whitespace-only input by trimming before checking emptiness, triggering the proper error state and focus behavior.

Now I'm reviewing the various empty-state and hint messages across the app — for expenses, balances, settle-up, and the error elements tied to person/expense forms — along with the metadata line format showing payer, split count, and date for each expense entry.

I'm double-checking tabular number formatting on amounts, spacing for the people section, and potential overflow issues at the 360px breakpoint — making sure the transfer row, balance states, and expense grid all wrap or flex properly without breaking, and reviewing how the masthead brand elements fit at that narrow width.

Then I'm checking the "Add person" form row fits at mobile card padding, confirming the split tools link and selection count read well, and reviewing legend/fieldset spacing for a11y. I'm also considering adding a small hint like "Up to two decimal places" tied via aria-describedby to the amount input.

Skipping the hint since the placeholder "0.00" is sufficient — I'm confirming the static card subtext, tabindex="-1" on the settle/expenses headings and notice region, and the `:has()` fallback where unchecked chips still show state via checkbox visuals. I'm ready to write the final document now, verifying the skip link target points to the main element with id="main" as I go.

Adding `tabindex="-1"` to main so Safari handles skip-link focus correctly, and removing the focus outline on main via `:focus-visible` since it isn't interactive. Double-checking the currency formatter: `en-CA` locale renders as `$1,234.50` with no negative cases since amounts are always shown as absolute values.

Writing the full HTML markup now, adding `autocomplete="off"` to the amount field and keeping `inputmode="decimal"` for the numeric keypad, while verifying the flex width rules on `.input` and `.select` resolve correctly in the inline layout.

