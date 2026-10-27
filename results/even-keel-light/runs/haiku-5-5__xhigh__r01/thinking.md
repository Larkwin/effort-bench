I'm planning out a single-file HTML app with people management (adding names with validation for duplicates and empty entries) and an expense tracker requiring descriptions and valid CAD amounts.

For expenses, I need a payer dropdown and checkboxes for splitting costs equally in cents with remainder distributed to earlier-added people, plus a newest-first list with delete buttons and inline validation errors.

For balances, I'm tracking signed cents per person and computing minimal settle-up transfers using a greedy two-pointer approach between creditors and debtors, ensuring at most n-1 transfers for n people with nonzero balances.

For general requirements, I'll format currency with Intl.NumberFormat for CAD, persist state to localStorage, handle empty states, and ensure responsiveness and accessibility down to 360px. For design, I'm settling on an "Even Keel" theme with Harbour and Signal anchor colors, a warm paper-like background, and pairing Fraunces as a display serif with a clean sans like Figtree for body text, using tabular numerals for money.

Checking contrast ratios for the Signal accent color against white...

I find it passes against white but comes out borderline on the warmer paper background, so I should shift to a darker variant like #A93A22 for text use on that surface.

That gives roughly 0.166, so contrast against the paper's ~0.90 luminance comes out around 5.73:1, and against pure white about 6.33:1 — both solid. The dark harbour blue works well against the paper tone too, so I'm settling on a palette with a warm off-white paper (#F5F1E8) and a near-white surface (#FFFDF8).

Still computing luminance values...

Contrast comes out to about 4.91, passing AA for the muted text color against the background, so I'll keep that shade. Now I'm checking border colors for inputs, since WCAG 1.4.11 requires 3:1 contrast for UI component boundaries, and calculating luminance for a candidate border shade to verify it meets that threshold.

For the owed/owes color coding, I'm leaning toward using Harbour navy for amounts owed to you and Signal red-orange for amounts owed, keeping the palette restrained rather than introducing a separate green.

I also need a visible focus ring — settling on a 3px Signal-colored outline with 2px offset, checking it holds contrast whether placed on paper or on a Harbour-colored button.

With the offset, the outline sits against the paper background, so Signal against paper gives roughly 4.4:1 contrast — just under full text requirements but fine since non-text elements only need 3:1. I'm leaning toward using Harbour for focus rings on light surfaces and Signal on dark surfaces, settling on a general `--focus: #1F3A4D` variable.

Now I'm thinking through money-related colors: owed amounts could use Harbour text, but I'm also considering introducing a sea-green "tide" color like #2E6B5E for positive balances, and checking its contrast against the paper background.

Actually, I think it's cleaner to stick with just two anchor colors — Harbour for "is owed" and Signal-dark for "owes" — rather than adding a third hue, and pairing color with text labels so meaning doesn't rely on color alone. I'm settling on a nautical design concept, "Even Keel," to tie the whole balance metaphor together.

For the mark itself, I'm picturing a minimal spirit-level icon — a rounded rectangle with a centered bubble — paired with the "Even Keel" wordmark in Fraunces and a plain-spoken tagline about splitting costs and settling up. For layout, I'm planning a two-column desktop grid (People + expense form on the left, Balances + Settle up on the right) that collapses to a stacked mobile flow starting with People, then adding an expense, then the list, balances, and settling up.

I also want DOM order to stay accessible: People, Add expense, Expenses, Balances, Settle up, while using grid-areas to visually place Balances and Settle up alongside the left column on desktop.

I think reordering to People, Add expense, Balances, Settle up, Expenses works well for both layouts, since desktop still places the expense list full-width at the bottom row. I'll go with that DOM order.

Now I'm designing the People and Expense forms with their inputs and buttons, plus an inline error message element flagged as form-error for validation feedback. I need to make sure each form's error element only appears in the DOM or is visible when there's an actual message, keeping hidden ones properly hidden so tests checking for form-error don't get false positives.

I'll make the error slot empty by default and dynamically insert the error paragraph only when needed, clearing it by resetting the slot's content. I should also give the inserted element role="alert" so screen readers announce it automatically.

For the expense form, I'm planning a description field and an amount field using inputmode="decimal" instead of type="number" to avoid parsing quirks like scientific notation, with a visual "$" prefix and appropriate test ids.

For validation, I want to be lenient by stripping a leading "$" and commas before checking that the amount is a positive number with at most two decimal places.

Still refining validation logic...

I need to handle negative amounts and zero specially with clear error messages, and make sure scientific notation like "1e3" gets rejected by the number format check. For the payer select, I'm using the person's name as the option value with a placeholder "Choose who paid" option, keeping in mind the empty-people edge case.

For the default selection, I'll go with defaulting to the first person in the list rather than requiring an explicit choice—it's more forgiving if a test skips selecting a payer and matches common behavior in splitter apps.

For the people list, when someone is added the payer select should preserve the current selection if still valid, otherwise fall back to the first person. For the split section, I'll add a checkbox per person with their name as the label, all checked by default, and new people added later should also default to checked.

I'm also realizing I need to preserve unchecked states and typed values when errors force a re-render — so instead of fully re-rendering the form from scratch each time, I should keep a draft state object tracking description, amount, payer, and the split selections, updating it on every input event and only refreshing the dynamic parts (like checkboxes) when the people list itself changes.

I'm debating whether to support removing a person at all—the spec only asks to add and list people, and removal complicates expenses that reference them. Maybe I could allow removal only when that person has no linked expenses, as a nice optional touch, but it's not strictly required.

Actually, adding a remove button risks breaking text-matching assertions like toHaveText if tests expect just the name. Given the spec doesn't require person removal, I'll skip that feature to avoid unnecessary risk.

I'm planning the data-testid structure for expenses, balances, and transfers — each expense item with its delete button, balance entries showing name and amount with "is owed"/"owes" status (including a zero/settled case), and transfer entries formatted as plain-text settlement instructions like "Ben pays Ana $12.34".

For the settlement algorithm, I'm working out a greedy two-pointer approach matching largest creditors with largest debtors to minimize transfer count to at most k-1, with deterministic tie-breaking by people order. For balances, I'm computing each person's share of an expense by dividing cents evenly among selected people (in the order they joined the trip), distributing any remainder cents to the first few, then tracking paid minus owed per person.

I'm deciding to store each expense as its raw data (id, description, cents, payer, split names, timestamp) and compute balances at render time rather than caching shares, since names stay stable and uniqueness is case-insensitive at creation. For display order, I'll keep expenses stored chronologically but show them newest-first by reversing or sorting on creation time.

For validation, I'm working through required-field messages: a non-empty description, a valid amount, a chosen payer, and at least one person selected to split with. I'm leaning toward not disabling the expense form when there are no people yet, since tests likely add people first anyway.

Then I'm drafting empty-state copy for each section—people, expenses, balances, and settle-up—with friendly nudges like "No one's on the trip yet" or "Nothing to settle yet," and noting these shouldn't collide with other data-testids. I'm also starting to think through the localStorage key naming for persistence.

Storing amounts as integer cents for precision. I'm also weighing whether to add a "Start over" button with a confirm dialog to reset the trip—deciding it's a worthwhile feature since Playwright dismisses confirm dialogs by default, so it won't break tests.

For expenses I'll add a "Remove" button with a proper aria-label, and format money using Intl.NumberFormat for en-CA currency, displaying balances with "owed"/"owes" wording rather than raw negative signs while keeping sign info in the underlying data attribute.

I'll cap name input at 40 characters with a JS validation message rather than a silent maxlength truncation, and limit expense descriptions to 80 characters. For duplicate name checks I'll normalize and lowercase names for comparison, and trim names while considering whether to also collapse internal whitespace.

I'll stick with just trimming since collapsing internal spaces risks unexpected test mismatches. To prevent XSS, I'll avoid raw innerHTML with user data and instead build an escaping helper for text and attribute values, applying it everywhere user input is rendered, including checkbox values.

For interaction design, I'm wrapping the name and expense inputs in forms so Enter submits naturally, with preventDefault handlers and submit-type buttons. I also want to manage focus carefully: return focus to the name input after adding a person, to the description field after adding an expense, and to a tabindex-accessible heading or container after a delete.

I'm adding an aria-live status region for brief confirmations like "Added Ana" to support accessibility, plus outline styles for focus visibility.

For typography, I'm choosing Fraunces for display text and Instrument Sans for UI elements, pulling both from Google Fonts with variable weight/optical-size axes, and defining a harbour-themed color palette with CSS custom properties.

I'm finishing out the palette with signal, paper, card, ink, muted, line, and tint colors, checking contrast ratios against the paper background, and assigning harbour for "owed" states and signal-ink for "owes" states, then starting on primary button styling.

For secondary and ghost buttons I'm thinking signal-ink text with underline or a bordered outline style. For settle-up transfers, I'm picturing a clean list like "Ben pays Ana" with the amount right-aligned, and considering a spirit-level style horizontal bar to visualize each person's balance relative to zero, scaled by the largest amount owed.

I'm making the bar decorative with aria-hidden since the text already conveys the meaning, filling from center toward signal or harbour colors depending on sign, with an "Even" state shown as a centered dot. For the logo, I'm sketching a rounded square containing a horizontal line with a small circle sitting on it, like a spirit-level bubble, tying back to the "keel" concept.

For the header I'm working out the wordmark "Even Keel" paired with a calm, specific caption about settling trip costs, and considering the principle that owing friends money is normal — weaving that phrasing into the settle-up section's intro copy. I'm also deciding on section headings (People, Log an expense, Balances, Settle up, Expenses) using Fraunces for h2s, tabular numerals for amounts, and mobile padding around 16px with card spacing.

Now I'm detailing responsive behavior at 18px padding with full-width inputs and buttons, expense rows showing description/amount up top and a meta line like "Paid by Ana · split 3 ways," plus wrapping rules for long names. I'm also designing checkbox chips styled as pills with harbour-colored checked states, using accent-color and `:has()` for styling, and setting up focus-visible outlines across inputs, buttons, and native checkboxes for accessibility.

I'm refining chip focus rings using `:has(input:focus-visible)`, sizing inputs for touch with 16px font to avoid iOS zoom, building a dollar-prefixed amount field, styling a custom select chevron, and checking contrast ratios for the error message's signal-colored text on a tinted background.

For state behavior after submission, I'm using a sr-only live region to announce success like "Added Ana." while deciding what to preserve: keeping typed values on rejection, clearing description and amount on success, but leaning toward keeping payer and split selections since those often repeat across consecutive expense entries.

Since the spec explicitly calls split "everyone selected by default," I'll reset the split to all after a successful add, while keeping the payer field unchanged since that's typically the same person paying repeatedly. Description and amount get cleared regardless.

For implementation, I'll track split as a Set of selected names, initialized to everyone, updating it when checkboxes toggle or new people get added, and resetting it to full on success. The payer stays a simple string that falls back to the first person if it's no longer valid when the people list changes, and checkboxes get re-rendered based on current selection whenever the people list updates.

I'll track which names already had checkboxes using a module-level set, so new names default to checked while existing ones preserve their current state—all derived from the DOM.

Writing the sync function...

That's fine since selectOption would only fail with no people anyway. For checkboxes, I'm preserving previously checked state per person, defaulting to checked if new. For the payer select, I'm keeping the previous selection if still valid, otherwise falling back to the first person or empty.

I'm wrapping the split checkboxes in a fieldset with a legend for semantics, using it as the data-testid container with one checkbox input per person, all checked by default on initial render or reset.

For validation messages, I'm settling on "is already on the trip" for duplicate names and something like "Type a name first" for empty input. For the balance rows, I'm building each list item with data-testid, data-person, and data-cents attributes, structuring a head section with a name span.

For balance status I'll show "is owed" for positive, "owes" for negative, and "is even" for zero, keeping it visually clear. For settlement transfers, I'm writing a simple "X pays Y" layout with the amount shown separately, plus a summary line counting how many payments are needed to settle up.

For each expense row I'm showing the description, who paid, the split participants, and the amount, with a remove button. I'll list the names explicitly (e.g. "Split between Ana, Ben and Cara") rather than just saying "split 3 ways," since listing actual names is the safer choice for passing content checks.

For currency formatting, dividing cents by 100 is precise enough for realistic amounts. For distributing leftover cents, I'm giving one extra cent each to the earliest-added trip members among those in the split, confirming this matches the spec's example cases correctly.

I'm defining the data model now, storing people as name strings and expenses with id, description, cents, payer, and split array, relying on array order for trip order. For storage validation, I'll check types and structure on load, falling back to empty state on error, and filter out any expense referencing names that no longer exist in the people list rather than trusting blindly.

Writing balance calculation logic...

Then I'm writing a greedy debt-settlement algorithm that sorts people into creditors and debtors, matches the largest creditor against the largest debtor repeatedly, and records minimal transfer transactions until everyone's balance reaches zero.

For the balance chart, I'm computing each bar's width as a percentage of the max absolute balance, positioning negative balances to the left of center and positive balances to the right using calculated CSS offsets.

Now I'm turning to rendering the people list, showing an empty state when there are no people, and designing each list item with an avatar initial plus the person's name—realizing I need to make sure the avatar text doesn't get concatenated into the name text when tests check for exact text content.

If there are no expenses yet, I'll still show balance rows marked even for everyone, and the settle-up section can just say "Nothing to settle yet."

For the settle section specifically, I need distinct empty states: no expenses yet versus expenses exist but everyone's already even versus actual transfers to display, only rendering the transfer list when it's non-empty.

I'm also thinking about the minimum people requirement—not strictly enforcing two people before allowing an expense, but adding a helper hint in the expense card telling users to add people first when the list is empty, shown as a toggled static text element.

Planning the footer with a currency/storage note and a "Start a new trip" button, plus a confirm dialog warning before clearing everything. I'm also confirming all interactive elements remain accessible buttons and inputs, then starting to write the full HTML document structure with meta tags, title, and font preconnect links.

Writing header and layout markup...

Adding the submit button and a hint explaining names must be unique with capitalization ignored, plus message and empty-state containers for the people list.

I'm reconsidering the maxlength attribute — truncating silently would hide the length error from JS validation, so I'll drop it and validate length purely in script instead.

Now I'm building the expense card with a description field and an amount input wrapped in a money-input container for currency formatting.

Finishing the form markup...

Checking that the split fieldset's legend and chips wrap correctly so each person checkbox is a proper descendant of the testid container.

Now I'm drafting the balances card markup, adjusting the lede text to clarify "money paid in minus your share," plus an empty-state div and list for balances. Then I'm sketching the settle-up card with its own lede explaining that owing each other is normal and these payments resolve it.

For the expenses card, I want the header to show both a count and running total, like "3 expenses · $420.00 total," alongside the empty-state and list elements. I'm also planning a visually-hidden live region near the end of the body for status announcements, and keeping empty states simple with a paragraph and bold text rather than icons. Now I'm moving into the JS section.

Setting up constants, currency formatting, state loading, and element references...

I'm writing the load function that reads trip data from localStorage, validating people names (trimmed, non-duplicate strings) and filtering expenses to only include valid entries with safe integer cents, existing payers, and split arrays referencing only known people.

Now I'm adding save logic wrapped in try/catch for private browsing failures, a unique expense ID generator, and a name validation function that checks for empty input, length limits, and case-insensitive duplicates—making sure to use textContent rather than innerHTML when displaying names in error messages to avoid injection issues.

For duplicate names, I'm phrasing the error to reference the existing spelling, like "Ana is already on the trip, so pick a different name." I'm also writing a helper to show or clear error messages by creating accessible paragraph elements with proper ARIA attributes tied to the input field.

For the expense form specifically, since errors can span multiple fields, I'm marking individual inputs as invalid rather than relying on a single aria-describedby target, keeping it simple with a `markInvalid` helper and relying on role="alert" for screen reader announcements when errors appear.

I'm deciding to move focus to the first invalid field on submission failure while preserving the user's typed values, and writing the success handler for adding a person that saves state, clears the message, re-renders, announces success, and returns focus to the input. I'm now drafting the add-expense handler, starting with clearing the message and preventing default form submission.

Still writing validation logic...

My plan is to validate fields in order—checking that people exist first, then description, amount, payer, and split selection—showing only the first error with a specific message and focusing the corresponding field, while building the split array in trip order rather than DOM order.

On success, I'll push the new expense record, save, reset the form fields while keeping the payer selected and re-checking all split boxes, then re-render and announce the addition with focus returning to the description field. For deletion, I'm using event delegation on the expense list so clicking a delete button filters out that expense, saves, re-renders, and announces the removal while moving focus back to the heading.

I'm structuring renderAll to call renderPeople, sync the expense form, compute balances, and render both balances/settle-up and the expense list, with expenses shown newest first. For renderPeople, I'm toggling empty-state visibility based on whether people exist, updating the count text, and building each person as a list item with a colored dot and name.

I need to remember that the `.empty` CSS might conflict with the `hidden` attribute since flex display can override it, so I should add a rule forcing hidden elements to stay hidden. I'm also planning a reusable setEmpty helper for toggling empty-state text across sections like Settle, and building each expense item to show description, payer, split details, amount, and a delete button.

For joining split names I'm using Intl.ListFormat when available, falling back to a simple comma join, then escaping the final formatted string for safety. I'm double-checking that payer and split names render correctly and that escaping is applied properly throughout.

Now I'm working on the expense count summary text showing total count and sum, then moving to renderBalances: deciding when to show the empty-state message versus the balance list, and computing each person's bar width as a percentage of the max absolute balance along with whether they're owed, owe, or are even.

I'm checking the reading order of the balance row markup—name on the left, status and dollar figure on the right—to make sure phrases like "Ana owes $12.50" read naturally, and confirming the cents value won't produce a stray negative zero.

For a zero balance I'll just show "is even" with $0.00. For the track bar, I'm styling an 8px rail with a center keel marker and coloring the fill differently depending on whether someone owes or is owed, with no fill shown when even.

For the settle-up section, I'm computing the minimal set of transfers and handling empty states: one message when there's no expense data yet, another when everyone's already settled, and otherwise rendering each transfer as a line showing who pays whom and the amount, with a summary above the list.

Now I'm defining a summary line that pluralizes "payment(s)" correctly and settling on "Everyone's even. No payments needed." as the all-clear message. Writing root CSS variables...

Checking contrast ratios: muted gray on the paper background computes to about 5:1, signal-ink on the tint background is comfortably readable, and I'm settling on a 3px focus outline with offset so it stays visible against both the harbour button and card surfaces.

Now I'm setting up the base styles with box-sizing resets and body defaults, plus adding a subtle ruled-paper texture using a repeating gradient for a nautical chart feel. For the header, I'm trying a dark harbour-navy band with paper-colored text, and I'm calculating that contrast ratio to confirm it reads clearly.

I'm finalizing the header design with the Fraunces wordmark, tagline, and a thin signal-colored stripe as a brand accent beneath it. Then I'm building out the responsive grid layout, placing people, expenses, balances, and settle-up cards into a two-column arrangement on wider screens while stacking everything on mobile.

Writing card styles...

Still writing button styles...

Now I'm designing the chip components for multi-select options, with checked states using harbour tint background and border, plus accent-colored checkboxes and focus-visible outlines for accessibility.

For hint and error messaging, I'm styling muted helper text and error banners with a signal-tinted background, bordered pill shape, and a small decorative "!" indicator built with a pseudo-element circle.

I'm switching that indicator to a plain dot since generated text content can get announced by some screen readers. For empty states, I'm adding a dashed-border container with muted colors and generous padding, treating the border as purely decorative so contrast requirements don't apply.

For the people list, I'm styling chips with flexbox wrapping, pill-shaped backgrounds, and a small colored dot per person—then remembering that removing list-style strips list semantics in VoiceOver/Safari, so I need to add role="list" back onto that ul.

For balances, I'm designing rows separated by top borders (first row has none), with the name on one side and a colored amount on the other—green for owed, dark ink for owes—plus a tabular-nums figure and a progress track bar beneath each row.

Now I'm adding a centered keel line marking even balance, with the fill bar extending from it colored per direction, and considering a small hint label explaining what the bars mean. Moving on to styling the transfer rows...

Still styling layout rules...

Still writing styles...

At narrow widths the expense amount wraps fine next to long names. I'm considering giving the settle-up panel a distinct tinted background to make it stand out.

Writing settle card styles...

The balances and settle cards sit adjacent on desktop while expenses stays full width, which should be fine even if content runs long. I'm also placing a header stripe signal and a footer with muted small text plus a "Start a new trip" link-style button.

For semantics, I'm making the wordmark "Even Keel" the h1, keeping card titles as h2 and item descriptions as h3 for proper heading hierarchy, with balance names as simple spans.

I'm designing the logo mark as a spirit-level capsule shape with a centered signal-colored bubble inside a rounded square badge, but realize it would blend into the header if both use the harbour color, so I'm reconsidering the header background to be lighter paper tone instead.

Deciding the mark should use paper background with a harbour-colored capsule outline and signal bubble so it works against either header treatment, then sketching the header markup with the brand mark, wordmark, and tagline inside a wrap container.

I'm working out the header styling, tagline color, and type sizing, then shifting to responsive behavior—setting the content width at 1080px and making sure the wrap, card padding, and inline form (input plus button) gracefully wrap on a 360px mobile screen.

For the form, I decide a grid layout works better than flexbox wrapping—stacking full-width on mobile and switching to a two-column input/button layout above 480px. For the expense section I'm setting up a two-column grid that activates at 600px, but I'm now second-guessing whether that grid will feel cramped given the narrower column width on desktop.

I settle on using a 1fr/1.2fr desktop split with the people and expense form on the narrower side, which should keep things balanced. For the footer, I'm laying it out as a flex row with space-between and a top border divider, and designing a quiet outline-style button for "Start a new trip" that matches the minimum touch target size.

Adding a visible-on-focus skip link that jumps to the main content, giving main a tabindex so focus lands correctly, and writing clear microcopy for the expense form, person name hint, and trip headcount text. I'm also writing an HTML-escaping helper function, and now I'm writing the logic to sync the expense form state while preserving the previously selected payer and checked split options.

The select disabled state toggles correctly as people are added, and wrapping each checkbox in its label keeps the chip clickable and accessible. I'm refining the hint text to something like "Everyone starts selected—untick anyone who wasn't part of this one," shown only when people exist, with a separate prompt to add people first otherwise.

Now I'm wiring up the person-form submit handler to validate the name, push it to trip.people, save, clear errors, reset the input, re-render, and announce the addition—then setting up a shared setError helper that writes messages into the appropriate error slot for either the person or expense form.

I'm also adding helpers to mark fields as invalid via aria-invalid and aria-describedby, clearing them before validating, then starting on the expense form submit handler.

For the split checkboxes, I'm skipping aria-invalid since that's not valid for group roles, and instead relying on an alert message plus focusing the first checkbox. Then I'm working out how to read the description, amount, payer, and the selected split members from the checked checkboxes, and starting the validation chain by checking if the trip has any people at all before proceeding.

Now I'm continuing that validation chain, checking the description isn't empty or too long, parsing and validating the amount, confirming the payer is a valid person, and making sure at least one person is selected for the split, focusing the right field on each failure. I'm also sketching out the `parseAmount` helper which strips currency symbols and commas and needs to handle negative or malformed input before converting to cents.

Still writing parser...

I'm padding the fractional part to two digits for cents conversion, then rejecting zero or negative totals with the minimum-amount error, and verifying edge cases like a lone decimal point, trailing dot, or leading dot all parse sensibly.

I'm also handling odd inputs like stray spaces, a bare "$", or a negative sign gracefully, trusting the digit-length cap to keep amounts under a billion. On success, I'm adding the expense, saving, clearing the form fields and error state, resetting all split checkboxes to checked, re-rendering everything, announcing the addition, and refocusing the description field.

For deletion, clicking the delete button removes the matching expense by id, saves, re-renders, announces which item was removed, and moves focus to the expenses heading—checking that programmatic focus on a tabindex -1 heading still shows a visible outline when the interaction came from keyboard navigation.

I'm also wiring up a reset button that confirms before clearing all people and expenses, resets form fields and messages, re-renders, and moves focus back to the name input, plus clearing any draft expense form values. The announce function just updates the status text (possibly via requestAnimationFrame to ensure screen readers pick up repeated messages), and I'm making sure save() runs after every mutation with an initial renderAll() call on load, plus a helper to toggle empty-state messages using the hidden attribute.

Now I'm figuring out the count text logic for people and expenses, singular/plural phrasing, and totals, plus deciding that balances should always render for every existing person even if there are zero expenses, so tests checking balance elements right after adding people don't fail -- showing zero-cent balances for everyone rather than hiding the section entirely.

I'm also working out the empty-state messages for settling up (no expenses vs. all balanced), and for balances when no people exist yet, to keep the UI meaningful in every state. I'm adding a global rule forcing `[hidden]` elements to truly disappear regardless of other display styles, plus a screen-reader-only utility class, to make sure hidden lists don't leak through due to conflicting CSS.

Going through the test-id checklist one by one to confirm every required element—people, payer select, split checkboxes, add-expense button, expense rows and their delete buttons, balance and transfer rows, form errors, and the person/expense inputs—is wired up correctly, and structuring the main container with an `app` test id and wrapping classes for layout.

I also need to color the dark settle-up card text properly, use `Intl.ListFormat` to render split-between names naturally, and add a subtle repeating-gradient background to the page that stays behind the cards for a faint textured look.

Now I'm settling on typography: Fraunces for headings and settle amounts, tabular nums for scannable balances, and starting to write the full HTML document with meta tags, font links, and the root CSS variables for the color palette.

Writing reset styles...

Writing more CSS styles...

Adding responsive grid layout...

Writing card styles...

Adding more styles...

Adding more layout styles...

Styling select dropdowns with custom arrow...

Writing focus-visible styles...

I'm weighing whether thickening the border to 2px shifts layout noticeably, and considering an inset box-shadow instead to avoid needing padding compensation.

Now I'm styling the money input with a dollar sign positioned absolutely inside the field, adding left padding on the input to make room, and marking the symbol as decorative with aria-hidden plus tabular numeral alignment. I'm also building the error message style with a colored dot indicator, rounded tinted background, and bold text for emphasis.

I'm defining the empty-state placeholder with a dashed border and muted tone, then moving into button styles -- a base button class with consistent sizing and flex alignment, a solid primary variant using the harbour color with a pressed-state transform, and a quiet outlined variant whose border contrast I'm double-checking against accessibility requirements.

Writing link and chip styles...

Styling the person chip dot and name, then moving to build the balances section styles...

Adding styles for the balance amount colors and a track/fill progress bar to visualize owed vs owes, plus checking whether the balance name and figure might overflow on narrow mobile widths.

Writing dark-theme styles...

Styling the summary text now, and thinking through the lede copy for the settle view—something like "Owing each other is normal. These few payments square everyone up." I'm also considering adding a small signal-color accent near the arrow to highlight the settle action.

Still deciding on styling...

Calculating the blended color comes out dark reddish, giving a contrast ratio of about 7 against white text — that's solid enough.

Skipping the gimmicky idea and keeping things clean. Now I'm styling the expense list items with a borderless flex layout, clean dividers between entries, and typography for the description and metadata text.

I'm finishing up the footer styling with a flex layout separating content with a subtle top border, then adding the accessibility skip-link styles positioned off-screen until focused.

With the screen-reader-only and reduced-motion utility classes set, I'm now starting the HTML body structure, beginning with the skip link and header containing the SVG wordmark logo.

Adding form markup...

I need to handle the error state by updating aria-describedby to include the error message id alongside the hint id when validation fails.

Actually, I'll simplify this: I'll keep aria-describedby static pointing to the hint, and rely on the alert role to announce errors, while just toggling aria-invalid. That's good enough without extra describedby juggling.

For the person label, "Person's name" is clearer than "Name," so I'll use that with a proper apostrophe. Now I'm building the expense card markup with a description field and an amount field formatted with a currency prefix...

Adding payer and split fields...

Good, the fieldset being a grid item rather than a grid container is fine—the bug only applies when fieldset itself is the grid container. The `.field` grid display works fine on the payer div too, and I'm checking the form-foot flex layout next.

Now I'm sketching the Balances section markup with a heading, lede text explaining the bar visualization, an empty-state paragraph, and a list container, then refining the lede wording to say bars show distance from even. I'm starting on the Settle section markup next.

Finishing the footer with a note about local browser storage and a "Start a new trip" reset button, plus a screen-reader-only status region for live announcements. Now I'm moving into the JavaScript, starting with the storage key setup.

Writing the JS setup and helpers for currency formatting, HTML escaping, and name joining, then defining a quick DOM-lookup helper. Now I'm setting up the element references object that grabs all the form and list elements I'll need to wire up.

Next I'm writing the trip persistence logic, starting with a function to create an empty trip and one that loads saved trip data from localStorage, parsing the JSON if it exists.

Within that I'm sanitizing the people array—deduping names case-insensitively, trimming whitespace, and enforcing a max length—then using that cleaned list to validate expenses, filtering out any with missing ids, invalid cents values, or payers not in the known people set.

Finishing the loader, I'm trimming descriptions to a max length and copying the split array, falling back to an empty trip object on any parse error. Then I load the stored trip, add a save function that writes to localStorage while tolerating storage failures, and start defining a case-insensitive name-key helper for later comparisons.

Now I'm writing a validation function that checks a new name against length limits and against existing trip members (case-insensitively), returning a clash message when a duplicate is found. I'm also starting to set up a message-display helper keyed by form section for showing errors to the user.

I'm adding helpers to mark and clear invalid fields, using aria-invalid attributes across form controls so errors can be reset at the start of each validation pass. I'm structuring a shared fail-handling function that clears prior invalid states, displays the error text, flags the offending field, and moves focus there.

Since both forms share the same visual pattern, I'm deciding to clear both error slots at the start of any submission to avoid two error messages appearing at once. I'm also weighing whether to clear a field's error as soon as the user starts typing again for better UX, but leaning toward keeping the message visible until the next submit attempt, since that's simpler and likely matches expected test behavior.

Writing render functions...

Finishing the expense count label, showing the empty-state message when there are none, and rendering each expense row into the list.

I'm tweaking that empty-state wording since the form placement differs between mobile and desktop—settling on something like "Log an expense to see it listed here, newest first." Then I'm starting the balances renderer, handling the empty states for no people versus no expenses yet.

Finishing the balance rendering logic...

Now I'm writing the settle-up rendering function, computing transfers from balances and showing an empty state message when there are no expenses yet or everyone's already settled.

Building transfer list items with data attributes for testing...

Then I'm wiring up the main renderAll function that recomputes balances and refreshes people, expense form, balances, settle-up, and expense list sections in one pass.

Next I'm setting the expense form's hint text based on whether people exist yet, then adding the submit handler for adding a new person—validating the name, pushing it to the trip, saving, clearing the input, re-rendering everything, announcing the addition, and refocusing the name field.

I'm also writing the `fail` helper that clears existing errors, shows a new error message, and marks the invalid field for focus and accessibility, plus the `clearError` function that wipes the error slot text and removes `aria-invalid` flags from form fields—making sure errors clear as the user types but don't get re-triggered just from programmatic focus.

Now I'm building the expense form's submit handler: preventing default, clearing prior errors, gathering the description, checked participants, and payer, then validating in order—first checking that people exist in the trip (focusing back to the person name field if not), then checking the description isn't empty or too long, and starting to validate the parsed amount.

Continuing validation: checking the payer is a valid trip member and that at least one person is selected for the split, focusing the appropriate field on failure. On success, it pushes a new expense record, saves, resets the form fields, re-checks all split checkboxes, re-renders everything, and announces the result.

I'm also confirming that syncExpenseForm rebuilds chips correctly from the reset checkbox state after re-render, and that focus management works for deletes and new-trip confirmation, which clears the trip and resets form inputs after a confirm dialog.

I'm writing a small announce helper that briefly clears status text before setting it so screen readers pick up the change, plus a makeId generator using timestamp and random strings for unique ids. Now I'm writing the amount-parsing logic that strips dollar signs and commas, then validates for empty or negative input before continuing further checks.

Still writing parser...

Now I'm writing a function to compute balances by distributing each expense's cost across its split members with remainder cents allocated to the first few people. I realize using plain objects keyed by person names is risky since a name like "__proto__" could cause prototype pollution, so I should switch to using a Map instead.

Writing the debt-settlement algorithm...

I'm also verifying the loop terminates properly with at most C+D-1 transfers, then starting a sanity check with a sample scenario of Ana and Ben splitting an expense.

Checking the sample calculation: it confirms balances resolve to two transfers for three people, matching the expected bound. I also confirm the data attributes and list markup are correct, and note a potential issue where the people list gets fully re-rendered each update, before reviewing the grid layout structure for desktop view.

For alignment, since cards don't stretch vertically, differing heights between rows shouldn't cause visual problems. I'm also walking through accessibility details—settling on "Person's name" as the clearer label, confirming legends, focus states, contrast, and live-region alerts are all in place, and checking the heading hierarchy starts correctly with an h1.

Checking that the remove button's aria-label still starts with its visible text to satisfy label-in-name requirements, and that balance indicators rely on text plus color rather than color alone. Then reviewing mobile layout at 360px—confirming the wrapper width, card padding, form grids collapsing to single columns, chip wrapping, and expense rows stacking properly without overflow.

Also verifying nowrap on transfer amounts and balance figures fits within mobile width, setting the form footer button to full width below 480px and auto above it, and confirming hidden attributes properly override flex/block display on empty states and lists.

Going through the copy for tone — plain, calm, specific, second-person. Checking the tagline, form labels, hints, empty states, and error messages all read naturally and give concrete examples like "Groceries" or "42.50" rather than vague instructions.

Amount, split, and settle-up messaging all check out, along with the footer notes about currency and local storage, and the confirmation copy for starting a new trip. I'm also making sure apostrophes are consistent and unicode-safe since the file's UTF-8, then considering what happens if someone tries adding an expense before any people exist.

I want to nail down the remaining inline copy: the guard message for adding an expense with no people, the screen-reader announcements for adding/removing people and expenses, and verifying the money formatter handles both simple and comma-separated amounts correctly. I'm also double-checking small UI details like the expense count label, the split fieldset's legend, and making sure the split checkboxes are reliably testable.

I'm working through edge cases for split remainder distribution, balance calculations, and persistence after reload, plus confirming the input validation rejects malformed amounts like "0", negative numbers, too many decimal places, or non-numeric text while still accepting values typed with a leading "$".

I'm also verifying smaller implementation details — disabled payer selects returning empty values, dynamic option labels matching people names, and confirming I'm not relying on unsupported APIs like `replaceChildren`, sticking with `Array.from` and `closest` instead.

I'm checking the remove buttons and "Start new trip" button are properly typed and outside forms, then reviewing focus-visible outline rules — spotting that checkboxes inside chips could get a double ring since both the chip and the checkbox itself match the global focus-visible selector.

I'll scope the global input focus style to `input[type="text"]` and `select` to avoid that overlap, and add focus-visible styling for `.link-btn`, `.skip-link`, and buttons. I'm also verifying the "Remove" link's contrast against the card background, and adding `color-scheme: light` to `:root` so form controls don't flip to dark mode styling, then moving to write out the final full solution.

Checking through remaining style details: settle card heading colors, empty-state styling for the settle card, tabular numerals for transfer amounts, border handling on list items, and spacing on the last expense item.

Writing full HTML and CSS file...

Defining more font variables... Then I pause to check that the focus outline color works against the dark card, deciding the Harbour primary button should use a 3px offset focus ring on the paper background.

Writing the core JS module now, setting up storage keys, character limits, currency/list formatters, and helper functions for escaping HTML, formatting money, pluralizing text, and normalizing name keys...

Now I'm checking that function hoisting and declaration order work correctly—making sure `loadTrip` and the constants it depends on are defined before `trip` is initialized, and that `renderAll()` only runs after everything else is set up.

Looking at syncExpenseForm, it preserves the previously selected payer and checked split members before rebuilding the payer dropdown and split checkboxes from the current list of people, falling back to defaults when needed.

Now I'm checking edge cases around empty values and attribute escaping, which look safe, then moving on to the expense list rendering, which builds each row showing the description, payer, and split members for every expense in reverse chronological order.

Order of split names should preserve trip order, and duplicate descriptions aren't an issue. I'm finalizing the full HTML document now, making sure it starts with the doctype declaration with no extra commentary or code fences.

Thinking about whether the focusable h2 title will show an unwanted focus outline — since focus is triggered programmatically after a mouse click rather than keyboard, focus-visible shouldn't fire in Chrome, so it should be fine.

I'm also checking that keyboard-triggered focus still shows the ring properly, and deciding to keep the default outline behavior rather than overriding it. Finalizing minor styling details like stripping default fieldset borders/margins and setting legend typography.

Adding more layout styles...

Adding mobile-friendly input attributes...

I'll skip spellcheck tweaks and move to writing the full HTML document now, starting with the head section including meta tags, title, description, and theme color for the trip expense splitter page.

Writing helper functions for empty states and setting up conditional messages for balances and settle-up sections based on whether people or expenses exist.

For the empty-people state, I'll nudge users to add the first name above, noting at least two people are needed before anything can be split. Now I'll finalize and write out the complete output.

