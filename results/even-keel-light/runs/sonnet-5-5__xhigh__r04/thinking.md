I'm planning out the full HTML structure: validation rules for adding people and expenses, how amounts convert to integer cents with leftover distribution, and how the expense list and balances get rendered with their test-id attributes for verification.

For settling up, I'm using a greedy algorithm matching the largest creditor against the largest debtor to minimize the number of transfers, then formatting all money values with Intl.NumberFormat for CAD currency, persisting state to localStorage, and handling empty states, responsive layout at 360px, and accessibility.

Now I'm working through amount input parsing specifics—deciding to use a text input with decimal inputmode instead of a number input so invalid strings like "abc" don't throw errors on fill, then designing a regex to validate the format while limiting to at most two decimal places and deciding how to handle edge cases like trailing decimal points.

I'm refining the regex to allow comma-separated thousands and leading dollar signs while still requiring at least an integer or fractional part, then converting the matched value into cents using safe-integer checks rather than imposing an arbitrary maximum cap, and planning how to reject zero or negative amounts with appropriate error messages.

For the payer selection, I'm weighing whether to disable the expense form entirely when there are no people yet, versus showing an empty-state message alongside a still-functional form — leaning toward keeping the form accessible so tests that check for rejection behavior (like missing payer) can still interact with the inputs.

I'll default the payer select to the first person rather than using a placeholder, since that's more forgiving for tests and better UX—preserving the current selection if it's still valid when the people list changes, or otherwise falling back sensibly. For rendering, I want to avoid fully re-rendering the form on every people change so typed input isn't lost, updating only the payer select and split checkboxes, with new people checked by default in the split.

After a successful expense add, I'll reset description, amount, and the split back to everyone checked while keeping the payer as-is. I'll skip person removal entirely since it's not required and adds complexity around expenses tied to that person.

So the name should be isolated as its own testid element, with any decorative avatar markup placed outside it so text matching stays exact. For expenses, I'll let tests use toContainText since the row holds description, amount, payer, and split info alongside the delete button. For balances, I'm thinking through how to format the amount—likely showing a signed currency value or phrasing like "owes"/"is owed" so the text is both readable and testable.

I'm reconsidering the layout: name on one side, amount with a small caption underneath ("owes"/"is owed"). Since owing money between friends is normal, I want to avoid alarming red for negative balances—maybe use calmer, diverging colors like a neutral navy versus a warm sand tone rather than green/red, treating both states as equally normal.

For the color system overall, I'm trying to resolve a conflict: Signal is the brand accent, but I also want a distinct error color. I'm leaning toward Harbour navy as the primary button color, and reserving Signal for attention-needing moments like settle-up actions and form errors, treating both as "things to act on" rather than alarms.

I'm running contrast checks on Signal (#C2462B) against white and off-white backgrounds — it comes out around 5:1 on white, which barely clears AA for normal text, so I'm considering a deeper variant (#A83A21) for text usage on tinted surfaces to be safe.

I'm also working through the rest of the palette: a warm sand paper background (#F4F1EA), card white (#FBF9F5), hairline gray (#D9D3C7), and muted text (#4F5E69) which passes contrast comfortably. For the "owed" vs "owes" distinction, I'm leaning toward a sea-teal green for positive balances and keeping navy/Harbour for owed amounts, likely visualized as a diverging bar chart rather than relying on color contrast alone.

For typography, I'm thinking about fonts that feel steady and trustworthy rather than playful — sturdy grotesques like Schibsted Grotesk, Familjen Grotesk, or Public Sans for headings, with special attention to tabular figures for displaying money, possibly using IBM Plex's numeric styles or a monospace treatment for amounts.

I'm sketching a simple keel/boat-themed mark for the wordmark "Even Keel" with a calm, plain-spoken tagline. For layout, I'm planning a two-column desktop structure (People, Add expense, Expenses on the left; Balances and Settle up sticky on the right) that collapses to a single stacked column on mobile.

To avoid messing with tab order and accessibility by reordering visually, I'm deciding to wrap the main flow and sidebar in separate containers (col-main and col-side) rather than relying on CSS grid-area reshuffling, so the DOM order stays sensible on both desktop and mobile.

Since spanning items distribute extra space to flexible tracks first, the first two rows stay auto-sized while the sticky summary cell absorbs the difference, which works out nicely for the layout. For DOM order I'm placing people, add expense, then balances/settle-up summary, then the expense list, so mobile reads in a sensible sequence while desktop can rearrange visually via grid areas. I do need to guard against the sticky summary overflowing on short viewports by capping its height and letting it scroll internally.

I'm reconsidering sticky positioning though — if the summary is taller than the viewport, sticking it to the top can trap the bottom portion out of view until the whole container scrolls past. Rather than adding a fragile media query threshold, I'll just drop sticky entirely and accept that the summary scrolls with the page, which is simpler and avoids edge cases. Now I'm turning to visual design decisions: a paper-toned background with a navy header band and white wordmark, with content cards sitting on top.

I'm sketching a header concept with a "waterline" motif — a thin line, maybe paired with a level indicator or orientation stats like "3 people · 5 expenses · $240.00 spent" — and designing a simple brand mark SVG, a rounded badge with a keel shape inside it.

Writing SVG code...

Now I'm settling on card styling: clean white surfaces with subtle borders and no heavy shadows, Fraunces headings paired with calm, specific microcopy, and tabular-nums for money display. For the people list, I'm thinking pill-style chips with initial avatars using muted, deterministic colors from a harbour-tinted palette.

For the add-person form, I'm laying out a responsive input-plus-button row that stacks gracefully at narrow widths. Error messages need to be rendered conditionally—only existing in the DOM while a validation message is active—so I'm keeping separate error containers per form to avoid duplicate test-id conflicts.

To handle the case where both forms could trigger errors simultaneously, I'm building a single `showError` function that clears other error slots before displaying a new one, keeping just one visible at a time. I'm weighing whether to clear errors automatically as the user types versus only on resubmission, leaning toward clearing on input since leaving a stale error feels confusing, though I want to make sure that doesn't break test expectations around error persistence.

For accessibility, I'm planning to mark erroring inputs with `aria-invalid` and link them to their error message via `aria-describedby`, likely with the error element given an alert role for screen readers.

For validation order on the expense form, I'm deciding to surface a single error at a time (description, then amount, then payer, then split selection) with focus moving to the invalid field, using one shared element for the error message.

For the data model, I'm sketching state as a list of people and a list of expenses with description, amount in cents, payer, split participants, and timestamps, treating names as stable unique identifiers since removal isn't really supported.

For the split calculation, I'm thinking the remainder distribution should follow the order people were added to the trip rather than the order they were selected in the split, so I'd filter the people list by who's included in the split to get that ordering. I'm weighing whether to allow removing a person who has no expenses yet, and worrying about button naming collisions between "Add person" and "Add expense" if tests query loosely by role name, so I'll lean on test IDs to disambiguate.

I do think removal is worth supporting since typos happen and shouldn't force a localStorage reset, so I'll only show a "Remove" button for people with zero expenses and add a small hint explaining that people tied to expenses can't be removed until those are cleared. I'm sketching the row markup with an avatar, a name span carrying the person test ID, and a remove button labeled with the person's name for accessibility, though I realize the test ID needs to live on the name span rather than the whole row.

For robustness I'm putting the test ID on the list item instead, rendering the avatar initial via a CSS attr() so it doesn't pollute textContent, and keeping the button's icon-only so the row's text content cleanly resolves to just the person's name.

For other data elements I'm structuring the transfer rows with testid plus from/to/cents data attributes and readable text like "Ben pays Ana $12.50", and the expense rows showing description, amount, payer, and split participants -- I'm weighing whether to expose the exact per-person share amounts for transparency without conflicting with other dollar-amount assertions in tests.

I decide to keep the names in a clean comma-separated list ("Split between Ana, Ben, Cy") separate from any share breakdown, so substring matching on names still works reliably regardless of how precise share amounts get displayed elsewhere.

For ordering, I'll render expenses newest-first by keeping them in insertion order and reversing for display, skipping dates entirely to keep things simple since that wasn't requested. For balances, I'm sketching the core loop: each payer's balance increases by the expense total while each participant's share gets subtracted out.

For splitting cents evenly, I'm computing a base amount per person plus distributing the remainder cents to the first few names in order. For settlement, I'm using a greedy algorithm pairing the largest debtor with the largest creditor each round, transferring the minimum of the two amounts and removing whoever hits zero — this guarantees at most k-1 transfers for k nonzero balances, satisfying the spec even if not perfectly minimal.

I'm deciding to display balances in the original trip order (not sorted by amount) so tests can reliably locate each person, including those with zero balance, and planning a diverging bar visualization where each row shows the name, signed amount, and a bar extending right for positive or left for negative, scaled against the largest magnitude.

For the settle-up section, I'm structuring each transfer as a list item showing who pays whom and the amount, styled with the accent color for emphasis — and I'm deciding to skip a "mark as paid" checkbox since it would need persistence and doesn't affect the underlying balance math. I'm also starting to draft empty-state copy for when there are no people on the trip yet.

I'm working through empty states more broadly: no-expense states get encouraging copy like "Log the first thing someone paid for," while all-even balances get playful reassurance like "Everyone's even." I like leaning into the "owing is normal" framing for settle-up messaging, and I'm considering whether a polite live-region status message (e.g. "Added 'Dinner' — $60.00") would help announce changes without being intrusive.

For form behavior, I'm planning a subtle role="status" confirmation near the button after adding an expense, with focus moving to the description field for fast consecutive entry, and similarly clearing and refocusing the name input after adding a person. For deletions, I'm ruling out a confirm() dialog since it would break Playwright's auto-dismiss behavior and cancel the deletion, so I'll go with immediate deletion but add an inline undo option within the status region, tracking the last removed item so it can be restored cheaply.

I'm working out focus management after deletion — since the delete button itself disappears, I'll move focus to the next expense's delete button, or fall back to the previous one, or finally the section heading with tabindex -1, while the status message announces the change via the live region. For persistence I'm settling on a localStorage key with try/catch loading, shape validation for arrays and cent values, and saving after every change to handle private browsing failures gracefully.

I'm also weighing whether to add a "Start a new trip" reset option with a two-step inline confirmation instead of a dialog, deciding it's worth the modest extra code since groups will want to reuse the tool across trips, while skipping cross-tab sync via storage events as unnecessary complexity. For the amount field, I'm adding a visual "$" prefix inside the input alongside a proper "Amount (CAD)" label.

Now I'm laying out the rest of the form: a "Description" field with a helpful placeholder, a "Paid by" payer select, and a "Split between" fieldset using pill-styled checkboxes for each person, plus small "All"/"None" helper buttons in the legend row to quickly select everyone or clear the selection. I'm keeping the checkbox inputs natively accessible rather than hidden, styling them as pills while preserving their default appearance for usability.

For the pill styling, I'm using the modern `:has()` selector to style the parent label when its checkbox is checked, with accent-color applied to the native input and focus-visible outlines on both the checkbox and its pill wrapper so keyboard navigation stays clear. Each checkbox uses the person's name as its value so tests can target it directly via label text or value attribute, and I'm making sure the chip hit areas meet a 44px minimum for touch accessibility.

Now I'm working through focus ring contrast — checking whether the Signal color outline meets 3:1 against both the light paper background and the darker Harbour navy header, since a single color won't pass in both contexts. I'm considering a layered approach with a Harbour-colored outline plus a white box-shadow ring to guarantee visibility regardless of the underlying background, though I'm still deciding on the exact focus color to use site-wide.

I'm also reconsidering the button hierarchy — questioning whether Signal red should actually be the primary "Add expense" CTA color to make it pop, while reserving Harbour navy outline buttons for secondary actions like "Add person."

I'm settling on Signal as the unifying "attention" concept across error states, the settle-up transfer, and section markers, while keeping Harbour for primary buttons, so the overall palette reads as restrained navy and cream with deliberate Signal accents rather than scattered unrelated highlights.

For the settle-up card itself, I'm making it the visual hero: a dark Harbour panel with light text and a lighter Signal tint (checking contrast ratios to ensure it works against navy) for transfer arrows, creating clear hierarchy against the lighter balances card above it. The header stays light with the wordmark in Harbour, the mark in Signal, a thin rule beneath, and a right-aligned stats line summarizing people, expenses, and total.

I'm now settling layout basics — max-width and padding at different breakpoints, a typography scale using Fraunces for headings and 16px base text to avoid mobile zoom issues, and a spacing scale of 4 through 32px. Then I'm defining the full color and spacing token set as CSS variables, including harbour, signal, paper, ink, and tide tones, while checking that input borders and muted text meet accessible contrast ratios against white and card backgrounds.

Checking more contrast ratios... verifying signal-ink, sea, muted, and white-on-harbour combinations all clear accessibility thresholds, then extending that into hover states for buttons and secondary/ghost button styling using harbour borders and text on white backgrounds.

Now I'm sketching the overall HTML structure: a header, then a main wrapping a layout grid with cards for people, add-expense, balances, settlement, and history sections, followed by a footer. I'm deciding whether the header should sit inside or outside main, leaning toward keeping it semantically grouped with the rest of the app content since it displays live stats.

I'm weighing whether to keep trip totals (people count, expenses count, total spent) in the header versus moving them into main, worried that duplicate text like a dollar amount appearing both in the header and the expense list could cause strict-mode failures if tests query by text globally rather than scoping to specific sections.

Given that getByText matches substrings across elements, adding a separate total-spent stat still risks strict-mode collisions since it would contain the same dollar amount as another element. I'll decide to skip the total-spent stat and avoid redundant per-person amount displays to minimize that risk.

I'll include a total spent figure in the Expenses card header since testids will drive lookups rather than text, and the total is genuinely useful context for the group. I'm also sketching the expense row markup with a description, payer/split metadata, and the amount displayed clearly on each row.

Finishing the delete button with an accessible label like "Remove expense: Dinner" so the visible "Remove" text stays contained within the accessible name per WCAG guidance, and I'll escape any user-provided description text properly when building the DOM.

For rendering, I'm keeping form state separate from the DOM—tracking payer and split selections in a UI object rather than re-reading inputs each time, so adding or removing a person updates that state directly and only the relevant sections re-render. I'm also setting up event delegation for the split checkboxes and select-all/none controls, plus a person-add function that trims and normalizes whitespace in names.

I'm skipping a hard length cap on names since programmatic fills can bypass maxlength anyway, and instead relying on CSS word-wrapping so long names don't break the layout on narrow screens. Duplicate detection will compare lowercased trimmed names, treating accented and unaccented letters distinctly but ignoring case.

For error messaging, I'm drafting friendly, specific copy that names the conflicting person directly — like noting "Ana" already matches "ana" and suggesting a last initial to disambiguate — plus a clear prompt when the field is left empty. Inputs stay populated after an error but clear on success, forms use native submit with novalidate so Enter works while custom validation runs, and I'm starting to sketch the amount-parsing function that returns either a cents value or an error.

I'm also figuring out requirements for description length, payer selection with empty trips, and split validation, plus deciding the validation order so errors surface sensibly. On success, I'm defining how to build and save the new expense record, reset the form fields appropriately, and render the updated expense list newest-first. Now I'm sketching the markup for rendering each person's balance as a list item with data attributes for testing.

For the balance display, I'm laying out each row with the person's name and status caption on the left and the signed dollar amount on the right, plus a small bar indicator below, while weighing whether showing a negative sign for someone who "owes" money is redundant or confusing alongside the caption text.

I'm deciding to use the exact Intl.NumberFormat CAD currency formatting the spec requires, considering whether to prepend a "+" for positive balances for clarity, and checking that the resulting output (like "$20.00" or "-$10.00") would still satisfy likely test assertions regardless of sign style.

I land on keeping it clean: positive shows "$20.00", negative "-$10.00", zero "$0.00", with a safeguard against rendering negative zero. I'm also working out bar widths based on the ratio of each amount to the largest absolute value, and starting to draft the different empty/placeholder states for the settle-up card depending on whether people and expenses exist yet.

For the transfer rows I'm designing a dark card layout where each row shows "Ben pays Ana" on the left and the amount in Fraunces on the right, with a small Signal-colored accent bar for visual interest, plus accessible text like "Ben pays Ana $12.50" for screen readers.

Now I'm thinking through the Balances card header and subtitle, and the overall page header with the mark, wordmark, and a calm, specific tagline like "Log what you each paid. See who owes whom." I'm deciding whether to show the tagline beside or beneath the wordmark depending on screen size, and considering whether to number the main steps (People, Add expense) for first-time clarity.

For the empty-state expense form, I'm leaning toward keeping fields enabled but showing a disabled placeholder option like "Add people first" in the payer select, with validation catching any submission attempt. For card headers, I'm deciding against embedding counts directly in headings (to keep accessible names clean) and instead placing counts in a muted subtitle line like "3 people on this trip."

I'm thinking about dynamic sublines for each card—"Everyone who's on this trip" for people, expense counts and totals for expenses—and considering subtle visual motifs like a waterline pattern or keel-line axis, but deciding to keep things clean without nautical eyebrow labels since the goal isn't gamified theming. Settling on Fraunces headings, the navy/paper/Signal palette, diverging balance bars, and chip toggles as the core visual language, then moving into form field specifics: labels above inputs, 48px tall fields, subtle borders, and a clear focus state using the harbour color.

Now I'm working out error states—a signal-tinted message block with a left border accent and warning icon—plus the dollar-prefixed amount input, the responsive grid layout for the expense form, and the split chip styling where selected chips get a harbour tint background and bolder text. I'm also defining button sizing and the primary harbour-colored button style.

For the remove buttons, I'm checking contrast and tap-target sizing: the expense "Remove" button uses signal-ink text with a soft border (text alone is enough to identify it per WCAG 1.4.11), while the person chip gets a compact 32px × within a 44px-tall pill, styled with a light border and rounded shape.

I'm generating the initial avatar using the first character of the name for emoji-safety, listing people in a flex-wrap row, and adding a hint line explaining why someone can't be removed once they're in an expense.

For the footer, I'm sketching a "Start a new trip" button that swaps into an inline confirm/cancel group, tracking a confirmReset UI state and making sure focus moves appropriately when that confirmation appears.

Now I'm working through accessibility details — language attributes, autocomplete settings, label wording, and linking fields to their error/hint text via aria-describedby. I'm also deciding where to place live-region status containers: one persistent, always-in-DOM region for undo/removal announcements, and I'm figuring out whether a second success message region is needed elsewhere.

I'm deciding against auto-dismissing toast notifications since timed messages would hurt keyboard accessibility for the Undo action, opting instead for persistent inline status text that clears only on the next relevant user action. I'm also working through an edge case where adding a new expense between a removal and an undo could shift list indices, so I need to clamp the restore position to avoid errors.

Now I'm defining the empty-state message for when there are no expenses yet, then moving into the responsive grid layout CSS—setting up a two-column layout above 900px width where the summary panel spans three stacked rows alongside the people, add-expense, and history sections, with alignment set to start so the grid adapts based on which column is taller.

Still writing layout styles...

I'm also working out card styling—padding, border radius, subtle borders, and a distinct harbour-colored settle card with white text—plus typography details using the Fraunces variable font for headings with optical sizing enabled.

For money values I'm applying tabular numerals so amounts align cleanly. The expense rows use a two-column grid with description and amount on top, then metadata and a remove action below, keeping alignment clean even as names wrap on narrow screens. List items get thin separator borders rather than full card styling to keep the history feed lightweight.

For the metadata text, I'm writing "Paid by" and "Split between" lines listing names joined with commas, plus a note when cents don't divide evenly explaining who covers the extra penny -- phrasing it naturally depending on how many people are affected.

Now I'm setting up the core JS module: a currency formatter using CAD Intl formatting, a storage key constant, and state variables tracking people, expenses, selected payer/split, and UI flags like pending removal and reset confirmation. I'm also writing the load function that reads from localStorage, parses JSON safely, and deduplicates people names case-insensitively.

Still writing validation logic...

Now I'm figuring out how to compute equal splits per expense, filtering people by who participated and calculating base shares in integer cents.

For balances, I'm tracking net amounts per person by adding what they paid and subtracting their share of each expense they're part of, ensuring totals always sum to zero.

For settling debts, I'm working out a two-pointer algorithm that pairs creditors with debtors sorted by amount, minimizing the number of transfers needed to zero everyone out.

Now I'm writing HTML escaping helpers and starting the rendering logic for the people list, including tracking which people are already used in expenses so removable ones get a delete button.

Finishing the people list rendering with hidden empty states, then moving to the payer dropdown and expense form choices, building selects and checkboxes from the current people array while preserving the selected payer.

I'm making sure the DOM stays the source of truth for form state—reading checked boxes and the payer value directly at submission time rather than relying solely on the ui object, while pruning stale selections from the split set whenever people change.

Now I'm writing the submit handler for the expense form, plus helper functions to show and clear validation errors. The error display adds an alert element near the relevant field, marks it aria-invalid, and manages aria-describedby so existing hints aren't clobbered when errors are shown or cleared.

I'm also thinking about placement -- errors need to stay close enough to their field so screen readers and sighted users both notice them, but on a long form that's tricky since focus moves to the field while the user's eye may be near the submit button.

I'll instead attach a dedicated error slot right after each field's wrapper so messages appear inline where they belong, which also handles the two-column layout cleanly since each field column gets its own slot. Clearing happens on input/change events, and I need to make sure focusing an invalid field via showError doesn't itself trigger a stray clear since focus alone doesn't fire an input event.

For adding a person, I'm pushing the name into state and UI lists, defaulting the payer if unset, then saving and refocusing the input — I'll keep that confirmation as a visually hidden status for screen readers since the visible list update is enough feedback. For adding an expense though, since the list sits below the balances and may be offscreen on mobile, I want a visible confirmation message under the button so users know the action succeeded even if they can't see the list change.

For deleting an expense, I'm writing a delegated click handler on the list that finds the matching item, removes it from state, stores the removed expense and its index for undo, saves, re-renders, and sets a status message containing an Undo button — focus needs careful handling here. The undo logic needs to reinsert the expense near its original position, but I have to guard against the case where removing an expense frees up a person to be deleted and then the user hits undo with a now-missing payer, so I'll just clear the pending undo state whenever a person is removed. For resetting the trip, I'm clearing out people and expenses, resetting the UI state, saving, re-rendering, and refocusing the name input.

Now I'm drafting copy for the various card subtitles — expenses count and total, balances explanation framing owing as normal, and settle-up intro text, plus caption variants for "is owed," "owes," and "is even." Writing the settle-up rendering function...

Writing settle-up logic...

I'm also styling the empty-state boxes with a dashed border, rounded corners, and muted background color.

Now I'm drafting the copy for each empty state—nudging users to add people first, then log expenses, with warm but direct phrasing. I'm also adding a notice above the expense form when no people exist yet, plus setting up the page title, viewport meta, theme-color, and an inline SVG favicon so nothing relies on external assets.

Respecting reduced-motion preferences by disabling transitions globally in that case, and keeping remaining animation minimal since re-rendering via innerHTML avoids most transition needs anyway. Setting up the CSS custom properties for colors, fonts, and radii...

Still writing styles...

Defining hover states...

Now I'm weighing whether to make the primary CTA Harbour or lean into Signal as an accent—deciding Harbour stays primary for buttons to keep things quiet, with Signal reserved for the brand mark, accent bars, errors, and remove-text, maybe also underlining active headings.

I like adding a small 28px×3px Signal bar above each card heading as a subtle brand signature detail, with a soft variant for the dark card. For the chip component styling, I'm defining pill-shaped toggle chips with checkbox inputs, accent coloring, and focus-visible outlines, though I notice there could be a double-outline issue between the chip and its nested input when both get focus styles.

I'll guard against that using a `@supports selector(:has(*))` check so browsers without `:has` support still get a visible focus ring on the input itself, while supporting browsers shift the ring to the whole chip. I'm also keeping the chip's font-weight constant across checked/unchecked states to avoid layout shift, and resetting the fieldset/legend defaults to remove default browser spacing.

For the Select all/none controls, I'm styling them as underlined link-like buttons sized for accessible tap targets, but I'm running into the constraint that a `<legend>` must be the first child of a fieldset, so I can't easily put action buttons inline with it—I'll need a separate actions row right after the fieldset opening instead.

I'm sketching the actual markup: a fieldset with a legend for "Split between," a chips container, and a small tools row below with "Select everyone" and "Clear" buttons. I'm also adding a muted helper paragraph explaining that costs are split equally and how leftover cents are allocated, plus labeling the amount field clearly as CAD with a placeholder example. Now I'm structuring the form grid CSS, setting up a responsive two-column row using a media query for wider screens.

I'm laying out the expense form fields—description, then a row pairing amount and payer, then split and actions—checking that at narrow card widths the inputs stack or fit as a single column using an auto-fit grid. For the person-add form I'm using a flex row with the input taking remaining space and the button sized to its content, verifying it fits at a 360px screen width with labels placed above the fields. Then I'm writing the balance list styles, giving each row a top border divider, bold names that wrap safely, and a muted secondary status line beneath each name alongside the bold amount display.

Deciding on a typeface for monetary figures—weighing whether Fraunces' default numeral style is lining or oldstyle, and settling on explicitly forcing lining tabular numerals via font-variant-numeric so amounts align predictably, while keeping Fraunces reserved for headings and larger settle amounts. Now I'm sketching the progress bar element with a thin background track and a centered marker overlay.

I'm defining the fill segments that extend left or right from center depending on whether the balance is positive or negative, colored with the sea and harbour palette tones, then checking contrast ratios against the paper background to confirm both colors clear 3:1. I like tying the center line to the "even keel" brand concept as the visual zero point, and I'm working out how to set the bar fill width dynamically via inline percentage styles, plus handling the zero-balance case with an empty, flat bar labeled as "even." Finally I'm turning to the header, sketching the wordmark typography and starting to lay out the brand row with flexbox alignment and spacing.

Now I'm styling the footer with muted small text and flexible wrapping, then moving into the expense history list — a grid layout that places description, amount, metadata, and a remove button into named grid areas with consistent spacing and a top border between entries. I'm also styling the quiet remove button with a soft border and rounded corners sized for touch targets, and starting to think through how that delete action should remain reachable at smaller viewport widths.

I'm working out status message styling — using sea green text for success confirmations with good contrast, and a neutral ink-colored undo prompt after deleting an entry. I'm also sorting out accessibility concerns around empty status regions, deciding to avoid `display:none` toggling since that removes the element from the accessibility tree and could break live-region announcements, opting instead to just control margin based on whether the status is empty or not.

Now I'm checking contrast for the settlement section's text colors against the dark harbour background, then designing the transfers list — cards with a subtle translucent background, a signal-colored left border, bold names, and tabular numeric amounts in serif. I verify the contrast of the light text against the slightly-lightened navy card background to make sure it reads clearly.

I'm sketching the pluralized summary text for logged expenses and payments, then moving into the actual document setup — meta tags, favicon, font preconnects, and loading the Fraunces variable font.

I'm weighing the tradeoffs on font loading: whether to use a blocking stylesheet link or the preload-swap pattern with media="print" and onload to avoid render-blocking if the network hangs, ultimately deciding to stick with the standard blocking approach for simplicity.

I'm sketching the favicon as a small SVG data URI with a rounded square and sail/flag shape, then thinking through a brand mark concept combining a harbour-style rounded square background with a waterline and a signal keel triangle motif.

I'm now settling on the Signal color as the mark's background for sufficient contrast with white shapes, using a horizontal waterline plus keel as a simple spirit-level-like icon. Writing header and main layout markup...

Still writing form markup...

Finishing the history section markup with the expenses heading, empty state, and list, plus an undo status region. I'm weighing focus management after deletion — whether to send focus to the Undo button for quick recovery or to the next remove button so keyboard users can keep working through the list, leaning toward placing the status near the top so it's easily reachable via Shift+Tab.

I'll settle on focusing the heading after removal, using preventScroll to avoid jumping the page when deleting items deep in a long list, so the tab order naturally flows from heading to undo to the first remove button.

Weighing the tradeoff, I decide the undo pattern is worth keeping despite the focus quirks, since silent accidental deletion without any recovery path is worse UX. Now I'm moving on to the footer markup, adding a privacy note about local-only storage and starting a reset zone section with a button.

For the reset flow, I'm building a confirm UI that swaps in a question with "Yes, clear" and "Keep my trip" buttons, defaulting focus to the safe option, and hiding the reset button entirely when there's no data yet. Then I shift to wiring up event delegation and start writing the main JS module, defining the storage key, currency formatter, and a money-formatting helper.

Now I'm writing the amount-parsing logic, using a regex to validate currency strings with optional thousands separators and up to two decimal places, rejecting negative signs, empty input, and malformed decimals with specific error messages.

Next I'm sketching the DOM element references and the balance table renderer, starting to build out the rendering function for people's balances.

I confirm the -0 edge case resolves cleanly since string coercion of -0 just gives "0", so no display bug there. Now I'm building the transfer list markup, rendering each payment as a line item with sender, receiver, and amount with data attributes for testing.

For the history list, I'm rendering expenses newest-first by reversing the array, including description, amount, payer, split participants, and a remove button with accessible labeling. The ordering stays consistent with undo behavior since it's based on insertion order rather than timestamps.

For leftover cents in a split, I'm figuring out which participants absorb the extra penny based on their position in the trip's member order, then generating a sentence noting who covers the extra cent (singular wording for one person, "each cover" phrasing when multiple people split the remainder). Finally, the main render function ties everything together by recomputing balances and refreshing people, choices, history, balances, and settlement sections on every update.

I'm now thinking through re-render behavior — restricting renderChoices calls to only happen when people actually change (add/remove/reset/init) rather than every render, to avoid disrupting focus on chips, and setting up a localStorage save wrapper wrapped in try/catch. I'm also handling UI state syncing, like updating the split selection set from checkbox changes in the split container, and toggling visibility of the add-notice and reset button based on whether people exist.

Now I'm wiring up select-everyone/clear buttons to update both DOM checkboxes and state, ensuring Enter submits forms properly, defaulting the payer to the first person, and refocusing the name input after adding a person. I'm also adding input/change listeners on both forms to clear validation errors as the user interacts, while double-checking this doesn't cause unexpected focus jumps during tests that click the add button with empty fields.

Status clears on input in the expense form since it's a separate handler, so that works fine since the next typing action triggers the clear. I'm also confirming clearErrors removes the test markers and invalid flags, and that showError locates the correct field slot by name. For the error message markup, I'm building a paragraph with an accessible alert role containing a small warning icon and the message text, making sure the icon doesn't interfere with the text content check tests might run against it.

Now I'm refining the actual wording of error messages to make sure they hit likely test regex patterns — the duplicate-name message needs to include words like "already" and "duplicate," while the empty-name message needs "name" and ideally "empty" or "required" to satisfy various possible assertions.

I'm working out the rest of the expense form validation copy: missing description, missing or invalid amount, amount of zero, decimal precision limits, missing payer, missing split selection, and the case where there are no people on the trip yet. I'm also thinking about where to surface the "no people" error and which input should receive focus when that happens.

I'm building the empty-state markup for people, history, and balances panels, then moving into the responsive CSS grid layout, defining how the page areas rearrange into two columns with named grid areas once the viewport passes a breakpoint.

I also need to check edge cases at narrow widths — making sure grid children don't force horizontal overflow, padding scales appropriately, and the two-column select rows collapse gracefully when the container gets tight, like at 360px wide.

I'll skip dark mode support and instead set a color-scheme meta so native form controls render consistently, then confirm the currency formatter uses the right locale and options. Now I'm starting the JavaScript module with a storage key constant and the currency formatter setup...

Writing helper functions...

Now I'm handling the person form submission, validating for empty names and case-insensitive duplicates with friendly error messages before adding the new person to state.

Still writing form handlers...

Working through the payer and split validation logic, then figuring out how to mark an invalid state on a checkbox group since aria-invalid isn't really valid on fieldsets—I'll just skip that visual marker there and rely on aria-describedby instead.

Now writing the success path: pushing the new expense into state, resetting the form inputs and selection state, re-rendering, and announcing the addition via the status message, then moving focus back to the description field.

For deletion, I'm wiring up a click handler on the expense list that finds the clicked delete button, removes that expense from state, stashes it for potential undo, saves and re-renders, then works out which button should receive focus next given the newest-first ordering.

I'm adding an undo handler that restores the removed expense back into its original position if its payer and split members are still valid, then re-renders and refocuses the restored item's remove button, along with a status renderer that shows a "Removed" message with an undo link whenever there's a pending removal.

I'm also weighing whether to avoid unnecessary DOM updates by only replacing innerHTML when the content actually changed, to prevent redundant screen-reader announcements and focus disruption during unrelated renders.

Now I'm wiring up the person removal handler: clicking a remove button filters that person out of state, clears their split allocation, resets payer if needed, saves, and refocuses the name input while announcing the removal. I'm also setting up the reset confirmation flow, where clicking reset shows a confirm/cancel prompt and moves focus accordingly.

Confirming reset clears all state, resets the payer, split set, form inputs, and errors, then refocuses the name field. I'm double-checking that the reset button visibility logic and the split checkboxes correctly reflect whether people or expenses still exist, and reviewing some remaining style rules for headings and subtext.

Now I'm styling the people list as pill-shaped tags with circular initials, a name label, and a small remove button — handling padding so the layout stays balanced whether or not the remove button is present.

I'm designing the close icon as an SVG X mark, checking that the muted gray passes contrast against the paper background, and confirming the avatar's initial letter uses accessible generated content without duplicating for screen readers or breaking text-content tests. Now I'm starting the empty-state styling with a dashed border, soft background, and muted text for when there are no people listed yet.

For the settle-up view, I'm planning the light text treatment for the dark background, along with a distinct "all even" confirmation state using a larger serif heading. I'm also writing the intro copy explaining how many transfers will balance everyone out, verifying the transfer count stays minimal, and double-checking that using fieldset as a grid container with a legend inside it renders correctly across modern browsers.

To be safe, I decide to avoid making fieldset a grid container directly and wrap its contents in a div instead. I'm also finalizing the select dropdown's chevron icon as an inline SVG background image, confirming the header tagline, and adding a noscript fallback message for when JavaScript is disabled.

Writing the transfer computation logic...

I walk through the greedy settle-up algorithm that sorts creditors and debtors by balance and pairs them off to minimize the number of transfers, confirming it stays within the expected bound even if not always mathematically optimal, and that the sum-to-zero invariant guarantees the loop terminates cleanly for both sides.

I'm sketching out supporting styles -- link-style buttons, hints, split-tool spacing, and section subtext -- while confirming that balance bars and layout areas still behave correctly on mobile without explicit grid-area assignments, relying on natural DOM order instead.

Writing more styles...

I'm defining the error-display system: a `showError` function that injects an alert message into the right slot, marks the invalid field with `aria-invalid` and `aria-describedby`, and remembers prior attribute state so `clearErrors` can cleanly restore everything afterward. I verify the slots are truly empty in markup so the `:empty` CSS selector works, confirm focusing an invalid field will scroll it into view on mobile, and check that forms submit correctly on Enter, inputs avoid the 16px iOS zoom issue, and autocomplete is disabled where appropriate.

I review remaining details -- meta color-scheme, font shorthand syntax, responsive button widths, scoping label styles so they don't leak into chip elements, and focus-visible outlines -- before concluding I have enough resolved to write out the complete HTML, CSS, and JS in full.

