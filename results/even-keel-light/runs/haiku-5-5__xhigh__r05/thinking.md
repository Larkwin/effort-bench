I need to produce a single HTML file starting directly with the doctype declaration, with no surrounding explanation or code fences — just raw HTML output.

For people, I'm requiring trimmed, unique, non-empty names with inline errors on invalid input, and a simple list of everyone added. For expenses, I need description, amount (CAD, positive, max 2 decimals), a single payer, and one or more split participants — defaulting to everyone selected — storing amounts as integer cents to avoid rounding issues, splitting equally with leftover cents distributed to people in trip-join order, and listing expenses newest-first with a remove option and inline validation that preserves user input on error.

For balances, I'm computing each person's paid-minus-share as signed integer cents with proper test attributes, then implementing a settle-up algorithm that greedily matches creditors and debtors so the transfer count stays at or below one less than the number of nonzero balances.

I'm confirming that balances always sum to exactly zero in integer cents since each expense's payer total matches its split total, which guarantees the greedy settlement terminates correctly — and deciding to skip person removal since the spec only requires expense removal and removing people would complicate things unnecessarily.

For currency display, I'll use Intl.NumberFormat with en-CA locale and CAD currency, converting cents to dollars for formatting balances and amounts.

For the amount input, I'm deciding to accept plain text with a decimal input mode, stripping leading dollar signs and validating the format with a regex that allows optional comma grouping and up to two decimal places.

Still refining the validation regex...

That regex rejects overly precise decimals while allowing valid dollar formats. I'm converting the validated string into cents by splitting on the decimal point and padding the fractional part, capping the total to stay well under the safe integer limit with a "too large" validation message, and ensuring the final amount is strictly greater than zero.

Now I'm defining a parseAmount function that strips dollar signs, trims whitespace, and returns specific error messages for each failure case: empty input, invalid number format, too many decimal places, non-positive amounts, and oversized values, handling comma-separated thousands along the way.

I'll cap the dollar amount around 1 billion to keep the cents conversion safe from overflow, and make sure the comma-formatted number regex handles grouped thousands correctly.

For names, I'm deciding to trim and compare case-insensitively for duplicates, and I'll also collapse repeated internal whitespace to a single space for consistency, even though that's a minor edge case unlikely to be tested.

I'm settling on a 40-character cap for names with a friendly error message, and for duplicates I'll show something like "Ana" is already on the trip. I'm storing people simply as an ordered array of names, and expenses as objects with description, cents, payer, split list, and timestamp -- using names directly rather than ids since renaming isn't supported.

For splitting amounts evenly among selected people in trip order, I'm computing a base share plus one extra cent for the first few people to cover any remainder, rather than storing shares at creation time -- recomputing them on demand works fine since the people list never changes. Now I'm working out the balance and debt-settlement logic, tracking each person's paid total against their owed share to build a list of creditors and debtors.

With these lists sorted, I'm writing a greedy matching loop that pairs the largest debtor with the largest creditor repeatedly, transferring the minimum of their amounts each time until everyone's balance zeroes out, which keeps the number of transfers minimal and deterministic given the stable ordering. I'm also deciding how to display each transfer, like "Ben pays Ana $12.50," along with showing every person's running balance including those already settled.

Now I'm thinking through re-rendering: adding a person should update the people list, payer dropdown, and split checkboxes without losing the user's current form input, so I want to track a draft state (description, amount, payer, and a set of who's included in the split) separately from the DOM, defaulting newly added people to be checked in the split since everyone starts selected unless manually unchecked.

On submission, invalid entries shouldn't wipe what was typed, so I'll only reset fields after a successful add — clearing description and amount, but I'm debating whether to reset the split selection back to everyone or preserve the user's last chosen subset, leaning toward keeping it simple and just resetting the text fields while leaving payer and split as-is.

For the empty-people edge case, I want the expense form to stay enabled rather than disabled, since disabling inputs could break tests that try to fill them. Instead, submitting without any people should trigger a form error message telling the user to add someone first.

I also need validation for split (at least one person selected) and payer (must be set) with their own error messages, checked in order: description, amount, payer, split. Rather than scattering error messages per field, I'll use one shared form-error element per form so tests can reliably target it, showing whichever validation fails first and marking that field invalid with focus for accessibility.

To avoid strict-mode violations from duplicate test-id matches, I'll keep a single active error state tracking which form it belongs to, so only one error element renders at a time. I'll clear that error when the user edits a field in the relevant form, so corrections don't leave stale messages behind.

For the overall layout, I'm picturing a header with an "Even Keel" wordmark and a tagline, maybe a simple keel/balance icon, and possibly a "Clear trip" button with a confirm dialog to reset everything.

I'm planning four numbered sections that mirror the user flow: People, Expenses, Balances, and Settle up, each framed with small "Step N" eyebrow labels in a calm, plain "you"-voice. Stacking into a single column on mobile, with pairing of Fraunces for display headings and a clean sans like Instrument Sans for body/UI text, using tabular numerals for money figures.

Now I'm settling on a warm sand/linen paper background with navy-derived ink and muted text colors, carefully checking contrast ratios to make sure the muted gray reads clearly against the off-white surface.

I'm also testing the Signal red against the paper background—it's borderline for small text use, so I'll reserve pure Signal for buttons with white text (which passes comfortably) and define a slightly darker Signal-ink variant for any readable text applications.

Checking Harbour blue against white shows excellent contrast, well above AA requirements for both text and button use. Now I'm sketching out a positive/negative balance color scheme—thinking a calm teal-green for "owed" amounts paired with the Signal-ink for "owes" amounts, and starting to verify the teal's contrast ratio against the paper background.

I'm also thinking through the broader surface palette: light harbour-tinted chips and borders, plus a bold Harbour-colored header band for brand identity with Fraunces type and a small wave mark. For balances, I'm considering a horizontal "level meter" visualization centered at zero, extending left in Signal for debts and right in teal for credits, kept decorative with the real info conveyed in text for accessibility. I'm also planning the settle-up transfer cards showing who pays whom.

Now I'm drafting empty-state copy for no people, no expenses, zero balances, and nothing-to-settle cases, plus how balances display as zero when people exist but no expenses do. I'm also working out expense list formatting—bold description, right-aligned amount, and a meta line showing who paid and how the cost was split, deciding how to phrase splits among multiple people versus "everyone."

I'm settling on always listing names rather than collapsing to "everyone," and considering adding per-person share chips under each expense to transparently show exact amounts owed (including cent rounding) alongside the "Paid by" line.

For accessibility, I'm planning a remove button with a clear aria-label, a fieldset with a legend wrapping the split checkboxes as the container, a select element for choosing the payer, and a labeled amount input with decimal input mode and a dollar sign visual cue.

Description, person-name, and other inputs get clear labels and placeholders, and I'm using a form with novalidate plus aria-required attributes instead of native required validation, so error messages can be shown via our own form-error logic rather than browser validation bubbles.

For balances I'm rendering a list of items with data attributes for person name and amount in cents, displaying status text like "is owed" or "owes" alongside a formatted dollar amount. I'm using Intl.NumberFormat with the en-CA locale for CAD currency, which gives clean "$" formatting including negatives, and dividing cents by 100 for display is precise enough. Transfers get similar list items with from/to/amount data and readable text, and everything persists to localStorage under a versioned key storing people and expenses.

For IDs I'm generating a simple timestamp-plus-random string to avoid relying on crypto.randomUUID, and I'm keeping expenses stored in chronological order internally while reversing them for newest-first display. For splitting costs I'm writing a function that filters trip members included in the expense's split, divides the total evenly, and distributes any leftover cents one by one to members in the order they joined the trip.

For computing balances overall I'm iterating through expenses, adding the paid amount to the payer and subtracting each person's share, while guarding against corrupted data where a payer or split member isn't a valid current trip member. I'm switching from using a plain object keyed by names to a Map, since names like "__proto__" could cause issues with object property access.

For rendering, I want to avoid XSS by escaping all user-provided content rather than using raw innerHTML insertion, so I'll write a small escape helper and apply it consistently across list items, labels, and attribute values. I'm planning to fully re-render lists like people, expenses, balances, and transfers on every state change, since focus typically stays in the form rather than inside these lists.

For the expense form specifically, I don't want to wipe out in-progress selections, so I'm designing a sync function that rebuilds the payer dropdown and split checkboxes while preserving the current selection and checked states by reading the existing DOM before rebuilding, then restoring matching values and defaulting new entries to checked. I'll keep the checkbox list in its own wrapper div so I can rebuild just that piece without disturbing the surrounding fieldset and legend.

After a successful expense submission, I'll clear the description and amount but keep the payer selection and reset all split checkboxes to checked, then refocus the description field for fast repeated entry.

Now I'm drafting the actual page copy — a plain header and tagline, plus short explanatory lines for each step (adding people, logging expenses, viewing balances, settling up), along with a quiet reassurance that owing friends money is normal. I'm also thinking through visual details: a paper-toned background, a harbour-colored header band with a thin horizon-line accent, and a simple brand mark.

Writing SVG code...

For layout, I'm planning a max content width around 1080px with a two-column grid on desktop — a narrow people list beside the expense log, then balances and settle-up stacked similarly, collapsing gracefully on mobile.

people, expenses, balances, settle naturally fills a two-column grid without reordering. I'm settling on card styling—off-white background, subtle border, flat shadow, generous padding and radius—plus Fraunces headings and small-caps eyebrow labels for each step. Now I'm checking input field contrast ratios, realizing the lighter border color fails WCAG's 3:1 non-text contrast requirement and that I need a darker border tone instead.

I'm calculating contrast values for candidate border colors to land on one that clears the 3:1 threshold, settling on a muted brown around #857D70. Then I work through focus ring design, deciding on a Signal-colored outline with offset that passes contrast against white, and I'm figuring out color roles for buttons: Harbour for calm primary actions, Signal reserved for things needing attention like owed amounts, errors, and the step markers.

Now I'm nailing down the visual system more concretely—primary buttons use Harbour with a darker hover state, secondary buttons stay transparent with bordered outlines, checkboxes get styled with accent-color matched to Harbour and wrapped in pill-shaped labels that highlight when checked, money values use tabular numerals for alignment, and balance bars are built as a two-sided track split at the center with Signal-ink representing owed debts on one side and sea green representing credits on the other, sized proportionally to the amount.

I'm working through mobile responsiveness at 360px, making sure long names wrap properly and nothing causes horizontal scroll, padding stays comfortable, and form fields stack into a single column instead of a cramped grid. The expense form splits amount and payer into adjacent fields that collapse on narrow screens, with split options as wrapping chips and a full-width submit button on mobile. I'm also sketching out the people list with initial-circle avatars and the expense list as bordered, card-like rows with a small remove action per item.

Next I'm designing the error and empty states, checking color contrast ratios against white and the paper background to make sure the Signal-ink and muted text tones are accessible. I'm also thinking about adding a header summary line showing people count, expense count, and total spent, plus a "start a new trip" button that likely needs a confirmation step before resetting data.

Now I'm moving to the JS logic: setting up a localStorage key, loading and validating saved state by filtering out malformed people or expense entries, and writing a save function wrapped in try/catch to handle storage failures gracefully.

For adding a person, I'm validating the trimmed input—rejecting empty names, names over 40 characters, and duplicates (case-insensitive) with a clear error message referencing the existing name on the trip.

Once valid, I push the name to state, save, clear the input, re-render, and refocus the field. For the expense form, I'm building out validation: require a description under 80 characters, parse and validate the amount, ensure people exist on the trip before allowing an expense, confirm a valid payer is selected, and gather the checked participants for the split.

On success I create the expense record with id, description, amount, payer, split, and timestamp, save it, reset the form fields, re-render, and focus the description input. I'm also writing a shared fail helper that sets the active error, marks the field as invalid via aria-invalid, re-renders the error message, and focuses the offending field — plus handling aria-describedby linking and clearing invalid states when errors are resolved.

I'm deciding to place error messages just above each form's submit button, rendered with role="alert" for accessibility, and planning input listeners on each field that clear the active error as soon as the user starts correcting it.

For deleting an expense, I'll use event delegation on the list, matching clicks on the delete button to find the item's id, filter it out, and re-save and re-render. After removal, I need to manage focus sensibly since the deleted element disappears—shifting focus to the list container (with tabindex -1) or back to the description input if the list becomes empty.

I'm weighing whether programmatic focus after deletion should land on the next delete button in the same position, falling back to the description field if none exists, keeping accessibility and focus-visible quirks in mind.

For resetting the trip, I'm planning a confirm dialog before wiping state and refocusing the person input, leaning toward wording it as "Start a new trip" rather than "Start over." Then for the balances display, I'm working out how to phrase each person's status—owed, owes, or settled—favoring something like "all square" over a more awkward "is even."

For the balance row layout, I'm deciding to keep it simple: name on the left, with a bold sign-coded amount on the right and a small tag beneath it reading "owed," "owes," or "even," making sure the status isn't conveyed by color alone for accessibility.

For the settle-up list, I'm planning each item as "Ben pays Ana" text alongside the amount, and thinking through empty states: a prompt to add people when there are none, a message that everyone's even when expenses exist but no payments are needed, and a footnote explaining the suggested payments minimize the number of transactions. Now I'm starting to lay out the expense list markup with a description and amount per item.

For the expense entries, each shows who paid, a shares breakdown listing what each person owes, and a remove button, with "Split between" names joined naturally using Intl.ListFormat for proper grammar. I'm deciding to order expenses newest-first in the array itself rather than relying on a separate timestamp field.

For the people list, I'm giving each person an avatar initial and a testid, while keeping the header count display separate so I don't accidentally duplicate the testid elsewhere. I still need to make sure balances include everyone even if their total is zero, and I'm working out whether the header should live inside or outside the main app container.

I decide to nest everything inside a single main element with a header section inside it to keep things simple and safe for the "wraps the app" requirement. Now I'm defining the CSS color variables and tokens for the harbour and signal theme...

Finishing variables...

I'm picking Fraunces for display type and Instrument Sans for UI text, pulling both in via a Google Fonts link with appropriate weight ranges, then setting up base body typography using Instrument Sans with a comfortable line height and the ink color.

Now I'm structuring the masthead with a navy background, a thin signal-colored accent line at the bottom, and a flex layout pairing the brand mark and tagline against summary stats and a call-to-action button, with wrapping for mobile. I'm also defining the container width constraint, the responsive two-column grid for the main layout, and the card component styling with its border, radius, and shadow.

I'm settling on a universal focus-visible outline pattern to keep accessibility consistent across inputs, and using 16px font-size to avoid iOS zoom. For the add-person row I'm planning a flexible layout with the input and button wrapping gracefully at narrow widths, plus a dollar-prefixed money input and a fieldset-based split options layout.

Now I'm styling the split-option chips as pill-shaped checkboxes, working out how to make the checkbox visible against the dark selected background by adjusting its accent color so the checkmark stays legible when checked.

Switching to a simpler fallback that doesn't depend on `:has()`: checked chips get a light mist background with harbour border and ink text, unchecked stays white, and the native checkbox uses harbour accent color for contrast either way. Then I'm defining button styles -- filled harbour buttons, a quiet outlined variant, and a text-only button with hover tints.

Now I'm styling the masthead's new trip button for dark backgrounds with a subtle translucent border, then setting up the people list with avatar circles showing initials, and the expense list rows with a grid layout and a top border separator, placing the remove button in the bottom-right grid area.

Restructuring the expense item markup to drop the grid approach in favor of a simpler stacked layout—heading row with description and amount, a metadata line for payer and split info, a shares list, then an actions row with the remove button aligned right via negative margin. For money display I'm leaning toward Instrument Sans with tabular numerals rather than Fraunces, since I'm unsure about Fraunces' figure style, and using a heavier weight for larger settle amounts. Now starting on the balances list styling with a flex header row.

Still writing styles...

I want a reassuring summary line for the settle view, something like "Owing each other is normal. This just squares it up." I'm also adding an honest footer note that data stays on-device, laying out form field groups and row spacing, and deciding on hint text styling plus button width behavior—full-width on mobile for forms where the button sits below fields.

Now I'm sketching the masthead markup with a brand logo, tagline, and a live summary showing people/expense/spending counts alongside a reset button, then designing a small balance-scale SVG mark with a beam, pivot triangle, and end circles to serve as the logo.

I check the tagline's opacity-based contrast against the harbour background and confirm it passes accessibility thresholds, then move into writing the full HTML document — setting up the head metadata, styles, and beginning the main layout with the masthead and the first step card for adding people.

For the people list, I'm thinking through the empty-state handling: rather than toggling visibility on separate elements, I'll render either the list or an empty message into a shared container depending on whether anyone's been added yet.

Moving to the expense section, I'm laying out a form for logging who paid what—description field, then an amount field styled with a currency symbol and decimal input mode.

Finishing the markup...

I'm thinking through the payer dropdown behavior: showing a disabled placeholder prompting to add people first when none exist, otherwise listing each person as a selectable option. For the balance section, I'm drafting the explanatory copy using "you" framing—positive balances mean you're owed money, negative means you owe the group.

Now I'm sketching the settle-up section markup and a footer noting data stays local in the browser, then moving into the JavaScript setup—defining storage keys, input limits, and a currency formatter for displaying dollar amounts.

Writing the load function to restore saved trip data, sanitizing and deduplicating people names from localStorage while filtering out invalid entries.

Continuing to validate expenses on load, checking that each entry has a valid description, positive integer amount, a payer who exists in the people list, and a split list filtered down to only real participants. I'm also setting up unique ID generation for new entries and a safe save function that writes to localStorage, plus starting to define a helper for computing each person's share of an expense.

I'm building out the share calculation so remainders from division get distributed one cent at a time to the earliest members, verifying the math balances for a few test cases. Then I write a balances function that tallies what each person paid minus what they owe, and start a settle function that separates people into creditors and debtors.

I greedily match the largest creditor against the largest debtor each round, transferring the minimum of the two amounts and advancing whichever side hits zero first. I reason through why this guarantees at most n-1 transfers, since the remaining creditor and debtor totals always stay equal and the process terminates once both sides are drained simultaneously at the end.

Now I'm writing the renderPeople function, which displays an avatar and name for each person in a list, showing an empty-state message when no one's been added yet, and deriving each person's avatar initial from the first character of their name.

Moving to renderExpenses, I'm building the expense list markup, showing each expense's description, amount, payer, and the people it's split between, along with a per-person share breakdown, falling back to an empty-state message when there are no expenses yet.

I'm debating whether the "Split between" meta line and the shares chips are redundant since both show names, but I'll keep both since the meta gives a quick summary while the chips show exact per-person amounts.

For the remove button, I'm making the aria-label specific like "Remove Groceries" so it still matches substring tests on "Remove" while being more descriptive for screen readers.

Now I'm writing the balances rendering function, which shows an empty state when there are no people, otherwise computes each person's balance and colors them as owed, owes, or even based on the sign...

Writing balance list markup...

I'm deciding on fill positioning so positive balances extend right of center and negative extend left, with color classes for owed/owes/even states, then moving on to building the settle-up view that shows transfer suggestions or an "everyone is even" message when there's nothing to reconcile.

I need a masthead summary line showing people/expense counts and total spent, then a renderAll function that coordinates all the render calls and syncs the form. For the form sync, I'm rebuilding the payer dropdown and split checkboxes only when the set of people actually changes, preserving previously checked state where possible.

Still writing sync logic...

Finishing the submit handler validation: checking description, people existence, valid amount, valid payer, and at least one person selected for the split before pushing the new expense object with a generated id, description, amount in cents, payer, and split list onto state.expenses.

After saving, I reset the form fields, re-check all split checkboxes by default, clear any active error, re-render, and refocus the description input for quick entry of the next expense. I'm now setting up a click handler on the expense list body to handle delete button clicks, finding the closest expense list item and grabbing its id from a data attribute.

For deletion, I filter the item out by id, save and re-render, then try to keep focus sensible by moving it to the delete button at the same index position in the remaining list, or falling back to the description field if the list becomes empty. There's a minor tradeoff worth noting—focusing the description field on mobile after deleting the last expense would pop up the keyboard unexpectedly, which isn't ideal but is a small concern.

I'm reconsidering a better fallback than the description input for the empty-list case, maybe focusing a heading with tabindex="-1" instead, so the keyboard doesn't appear and there's still a visible focus outline for accessibility, even if it looks slightly unconventional on a heading element.

I'll stick with `:focus-visible` as the general rule, accepting that mouse-clicked buttons won't show rings (standard behavior) while inputs still will. Now I'm writing the person form submission handler, validating the trimmed name against length limits and checking for duplicate names case-insensitively before showing an error.

Still writing validation logic...

I'm wiring input and change listeners on both forms so that typing clears any active error tied to that scope, which feels like the expected behavior. Then I'm setting up the reset trip button to confirm before wiping all people and expenses back to an empty trip state, clearing the active error and saving afterward.

I'm reasoning through edge cases: renderAll correctly rebuilds the expense form's person selector when the people list becomes empty, and I'm deciding to skip the confirm dialog entirely if there's nothing to reset rather than showing an unnecessary prompt. Now I'm starting the summary renderer that totals expense amounts and formats a pluralized count of people.

Writing amount parser...

I'm verifying the padding logic for cents handles short and empty fractional parts correctly, and that input with stray spaces or extra decimal places gets rejected properly. For currency display, I confirm Intl.NumberFormat with en-CA locale renders CAD amounts with a plain dollar sign as expected.

For initialization, I'm structuring the render pipeline so renderAll triggers summary, people list, expense form sync, expenses, balances, and settle-up views, plus error rendering — making sure re-running error display on every render cycle won't cause issues with stale ARIA attributes.

Now I'm tracing through timing edge cases: clearing the active error before re-rendering after a successful expense add, and confirming that adding a new person properly syncs the expense form's checkbox options. I'm also cross-checking every required data-testid attribute against the spec — app, person-name, add-person, person, expense fields, payer select, split container, add-expense, expense, delete-expense, balance with data-person/data-cents, transfer with data-from/to/cents, and form-error — to make sure each is wired to the correct element.

I'm verifying remainder distribution goes to selected people in join order, settle-up uses at most n-1 transfers, balance sign conventions match "positive means owed," and localStorage saves/loads on every mutation. Keyboard accessibility relies on native buttons/inputs/checkboxes, so no extra work needed there, and I'm deciding to skip animated transitions since reduced-motion and full DOM re-renders make them unnecessary. Now I'm checking heading hierarchy to ensure h1/h2/h3 nest correctly across sections.

Shifting to visual design, I'm sketching the masthead as a deep Harbour-colored band with a serif wordmark and a thin Signal-colored rule beneath it, paired with a small-caps summary and outline button on the right. The body uses a paper background with warm-white cards, hairline borders, Fraunces headings, tabular numbers in Instrument Sans, sea-green for "owed" amounts and Signal-ink for "owes," and I'm thinking through how the header should stack and whether the button goes full-width on mobile.

Writing masthead CSS...

I'm mapping out the grid layout for desktop, thinking through whether expenses should span two rows alongside a shorter people/balances column, and considering how DOM order affects reading flow when columns have different heights.

Writing full HTML document...

Writing masthead and brand styles...

Still writing card and form styles...

I'm styling the currency input with a positioned dollar sign prefix, then working through focus states for inputs and selects—deciding to rely on outline-based focus rings instead of box-shadow since forced-colors/high-contrast modes can strip box-shadow styling.

Now I'm laying out the inline input rows and responsive grid columns, checking that auto-fit grids collapse properly from two columns on desktop to one on mobile. I'm also designing the pill-style split-option buttons with checked-state border and background changes...

Writing button styles...

Now I'm designing the people list with avatar circles and name labels, plus an empty-state placeholder using a dashed border, before moving into the expenses list layout.

Continuing the expense styling...

Still styling balance bars...

Styling hints and footer text with muted colors, then double-checking touch target sizes and overflow behavior at 360px width—verifying card padding, expense amounts, and settle-up text all wrap properly without breaking layout.

I'm working through the inline input/button flex layout so it wraps gracefully on narrow screens, with the input and button each expanding to full width when stacked. Then I'm finalizing the person and expense forms with proper labels, placeholders, and hint text about name uniqueness, before moving into writing the JavaScript logic.

Writing storage and formatting helpers...

Still writing validation logic...

I'm fleshing out renderErrors, syncExpenseForm, renderSummary, renderPeople, and the balance/settle rendering functions, making sure empty states and ARIA attributes behave correctly across resets and edits. Then I shift to finalizing all the copy: taglines, step descriptions, empty-state messages, and error strings, aiming for plain, specific wording that speaks directly to the user ("you") and explains tricky behaviors like leftover-cent splitting and settle-up logic clearly.

