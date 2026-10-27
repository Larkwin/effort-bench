I'm planning out the single-file HTML app's requirements: adding people with validation (trimmed, unique, non-empty names with inline errors), and expense entries needing a description, a valid CAD amount, a payer dropdown, and checkboxes for splitting among participants.

For splitting I'll work in integer cents and distribute leftover remainder cents to people in the order they joined the trip, listing expenses newest-first with delete buttons and preserving invalid input on error.

For balances, I'm computing signed cents per person (paid minus share) and designing a greedy settle-up algorithm that pairs debtors and creditors so each transfer zeroes out at least one party, guaranteeing no more than n-1 total transfers.

I'm deciding to format currency with Canadian locale settings, persist people and expenses to localStorage under a versioned key, and skip implementing person removal since the spec doesn't require it and it would add complexity around expenses referencing deleted people.

For the expense form, the payer select and split checkboxes populate from the people list, with new people automatically checked by default in the split since everyone should be selected initially.

I need to preserve draft state—desc, amount, payer, and a set of selected split members—so unchecking someone isn't lost when the people list changes; new additions just get added to that selected set. Invalid submissions should keep the typed values and show an inline error rather than clearing anything, and each form should likely have its own form-error element so multiple forms can show messages independently.

I'm also thinking about edge cases where both the people form and expense form could show errors at once—since a strict locator would break with duplicates, I should clear one form's error when a new submission happens on the other, so only one error is visible at a time.

I should also clear a form's error as the user edits the offending field, which is better UX than leaving stale errors. For the expense form with multiple validation issues (empty description, invalid amount), I'll decide whether to show one combined message or just the first problem.

Actually a summary list is more helpful than a single deterministic message, so I'll check description, amount, payer, and split in order and render all failing messages together in one alert container with multiple paragraphs, keeping a single testable element.

For amount validation, I need to decide how lenient parsing should be — trimming whitespace, rejecting non-numeric input, zero, negatives, and more than two decimal places, while considering whether to tolerate a leading dollar sign or thousands separators since test expectations for formats like "1,234.50" are unclear.

I'm also weighing type="text" versus type="number" for the input, since number inputs trigger browser constraint validation that could interfere with form submission behavior and don't cleanly return invalid values.

I'll go with type="text" and inputmode="decimal" plus a dollar sign prefix, since that gives full control over what's typed. I'll also think about capping the max amount, maybe around a billion, to avoid absurd values, though the task doesn't specify one.

I'll add a safe-integer check on the cents calculation to avoid overflow issues.

For the description field, I'll require it trimmed and non-empty, with a maxlength of 120 characters on the input. The payer needs to be selected from the people list, and if no people exist yet, I'll show an empty state disabling the expense form until people are added.

Rather than fully disabling fields, I'll keep the form enabled and surface a clear error like "Add at least one person to the trip first" when submission is attempted with no people, since the payer select would otherwise be ambiguous. For the split selection, I'll require at least one person checked with an error message "Choose at least one person to split this between," and allow the payer to be excluded from the split since they may have paid on behalf of others.

Checkboxes should display people in the order they were added, and shares should divide evenly with the remainder distributed to the first people in that order rather than stored explicitly—computed on the fly from a shares function using cents, selected names, and the people list. Each expense record stores description, amount, payer, split names, and timestamp, and the display line shows who paid and who it was split between alongside the amount.

I'll show per-person shares explicitly like "Ana $33.34 · Ben $33.33 · Cam $33.33" so names and amounts are both visible and testable, plus the total amount formatted as currency. For balances, I'm computing each person's total paid minus total share, then displaying it as "is owed", "owes", or "settled up" depending on sign, with a dedicated balance element for testing.

For settle-up, I'm working out a greedy transfer algorithm: sort creditors and debtors by magnitude, then pair them off minimizing the number of transfers, making sure the tie-breaking order is deterministic so results are reproducible across runs.

I should also handle empty states: when everyone's settled, show "Everyone is square. Nothing to settle." And for missing data, show prompts like "Add the people on this trip to get started" or "No expenses yet."

I'll persist the trip to localStorage under a namespaced key, saving on every change and loading with validation so corrupted data just resets to empty. A "Start over" reset button with a confirm dialog could be handy too, though I'll keep it simple since tests likely won't require it.

Each expense needs a delete button with a clear aria-label like "Remove expense: Dinner," skipping confirmation or undo for simplicity. I also want to make sure every input and checkbox has a visible, accessible label and that focus states are visible throughout.

I'm now checking color contrast ratios for the Signal color against white backgrounds to ensure AA compliance, working through the luminance calculations for the red tone.

That passes AA for normal text. But on off-white paper around L=0.90, the contrast drops to roughly 4.52, which is borderline — I need to compute this more carefully.

Testing a slightly different paper color (#F7F4EE) and recalculating its luminance, I get L≈0.9066, so I'm now working out the contrast ratio against that.

Contrast comes out to about 4.55, which barely passes AA for normal text but is risky, so Signal should probably stay reserved for large text or button backgrounds with white text (4.99 passes comfortably). For text links on paper, I'll use a darker variant like #A93A22 instead, and I'm computing its luminance now.

Checking that color: it lands around 5.77 contrast against paper, which is solid, so I'll use it for error text. I'm also checking a navy option (#1F3A4D) against paper, working out its luminance to see how it performs.

Now computing a muted gray-blue text color (#5B6670) and its luminance against the paper background to confirm it also clears readable contrast thresholds.

I'm settling on an overall design direction described as steady, honest, and quietly confident, sketching out a palette with a warm off-white paper background, a slightly lighter surface tone, a dark harbor ink color, a muted slate, and subtle line colors.

I'm introducing a muted teal "Tide" color to represent positive owed balances, contrasting with a Signal accent for negative balances and primary actions, then checking Tide's contrast ratio against the paper background to confirm it reads clearly.

For typography, I'm leaning toward pairing a soft serif like Fraunces for headings with a clean UI font like Inter, Instrument Sans, or Figtree, using tabular numerals for money figures.

Now I'm mapping out the page sections: People, Expenses, Balances, and Settle Up, with the tagline "Trip expenses, settled fairly." under the wordmark. I'm thinking through the layout — single-column centered on mobile, shifting to a two-column desktop grid with People/Expenses on the left and a sticky Balances/Settle Up panel on the right at wider viewports.

Let me settle on: header spans full width, then column A holds People, the expense form, and the expenses list, while column B holds Balances and Settle up, stacking A before B on mobile — though that does push balances pretty far down after a long expense list on small screens.

On desktop I'll use a two-column CSS grid (something like 1fr next to a fixed 380px sidebar) with the sidebar column pinned via sticky positioning, keeping DOM order as People, expense form, expense list, then Balances and Settle up.

I'm also sketching a small header wordmark — a rounded square mark in Harbour color with a horizontal "level" bar and a signal dot to evoke balance.

Header design: wordmark "Even Keel" in Fraunces 600 at 28px in Harbour, with a tagline underneath: "Split trip costs. Settle up. Stay friends."

For the subline I'm thinking something like "Owing each other is normal. Here's where everyone stands" to echo the principle without being preachy. Below that, a summary strip reading "3 people · 5 expenses · $412.50 total" in a small caps style. I'm also drafting the empty states and balance phrasing — plain, direct, addressing the user as "you", like "No one's here yet" and "Ana is owed $20.00" / "Ben owes $20.00."

Now I'm working through settle-up messaging, error copy for validation (missing name, duplicate name, bad amount, no payer chosen, no people added), and the rule for comparing names: trim, collapse internal whitespace, and compare case-insensitively so "ana" and "Ana " count as duplicates. I'm also considering a reasonable max length for names, like 40 characters, and making sure the data-person attribute still matches the display name exactly.

For rendering, I want to avoid XSS and attribute-escaping bugs, so I'm leaning toward building DOM nodes directly or writing a small escape helper for text and attribute values rather than injecting raw strings. I also realize I shouldn't fully re-render the expense form while someone is mid-typing, since that would wipe their input and drop focus — instead I'll only rebuild the payer dropdown and split checkboxes when the people list changes, preserving the current selection and checked states where possible.

I'm now working out a `formState` structure tracking the split set and known names, so new people default to checked while existing selections persist across rebuilds, and the payer falls back to the first person if the previous payer no longer exists.

I'm leaning toward only rebuilding the split/payer UI when the people list actually changes, which avoids losing focus mid-interaction since people are added from a separate form. After a successful expense submission, I'll clear the description and amount but keep the payer, and I'm debating whether to reset the split back to "everyone selected" or leave it as-is for repeated same-group splits.

For focus management, I'm thinking through deletion flows: after removing a person or expense, the list and balances re-render, but I need to decide where focus should land — the next item's delete button, a heading, or the list container with tabindex=-1 — since losing focus entirely to the body is bad for accessibility.

For the balance display, I'm considering adding a visual touch: a horizontal "scale" bar per person showing their balance relative to the max, extending left for debtors and right for creditors from a centered track.

Writing balance row markup...

Labels should use natural language like "gets back $20.00" or "owes $20.00" or "square" for zero balance, with the data-cents attribute storing the signed integer for logic purposes.

For the meter, I'm computing fill width as a percentage based on the ratio to max absolute value, positioned relative to a center marker in the track. On mobile at 360px, I'll stack name and amount on one row with the meter spanning full width below, since cramming everything inline won't fit. For the settle-up section, I need a list of simple transfer instructions like "Ben pays Ana $X.00."

I'm marking up each transfer with semantic spans for from/to/amount so it reads naturally to screen readers as "Ben pays Ana $20.00," plus a summary line stating how many transfers it takes to settle everyone. Then I'm structuring the expense list items with a heading for description, metadata showing who paid and the split, the total amount, a breakdown of each person's share, and a delete button.

I'm designing the shares as a chip list showing each name with their owed amount, deciding to skip timestamps for simplicity, and planning expense IDs with a timestamp-plus-random string. I'm settling on a data shape storing people and expenses with payer, split, and amount fields, validating and sanitizing on load, and newest-first display by reversing the array—while noting renaming people won't be supported and setting up currency formatting with Intl.NumberFormat.

Writing amount parser...

Continuing validation logic...

I'm also drafting the error messages for amount input—something like "Enter an amount, like 42.50" for empty input, and a clearer prompt for invalid numbers.

For the full submit validation I'm building a list of errors: missing description, amount problems, no people added to the trip, an invalid payer selection, or no one chosen to split with. I'm deciding to read the checked split checkboxes directly from the DOM at submit time rather than relying on separate form state, since that's simpler.

Actually, I realize I should keep a persistent draft object tracking payer, the split selection, and which names have already been seen, so new people default to checked and existing choices are preserved across rebuilds. The checkbox and payer change handlers update this draft, and after a successful submission the draft resets with all people re-checked for the split.

For errors, I'll place a form-level error box near the top of the form with role="alert" for screen readers, and mark invalid fields with aria-invalid.

For the person form, I'll apply the same approach: validate on submit, show an error message if needed, flag the input as invalid, and preserve the entered value.

I'm using proper form elements with submit handling so Enter key works, controlling validation manually instead of relying on native validation, and wrapping everything inside the main app container. The person name field itself gets a labeled text input with a character limit and a helpful hint about using the name people recognize.

Now I'm laying out the expense fields: description with a visible label and example placeholder, amount with a currency prefix and decimal input mode, and a payer dropdown populated with each person's name as an option. For splitting, I'm wrapping the per-person checkboxes in a fieldset with a legend, trying to figure out whether the test ID belongs on the fieldset itself or a wrapping div.

Writing chip styles...

Checking contrast ratio for the hover state against white, confirming it passes. For focus-visible, I'm weighing a Harbour-colored outline versus a dedicated focus ring color like #1F3A4D at 3px with an offset.

I'm settling on a 3px Harbour outline with 2px offset on paper background for strong contrast, since dark Signal would clash. Then I'm working through secondary and ghost button styles using Harbour text with borders, and Delete buttons in Slate with Signal hover, while also checking input borders meet the 3:1 non-text contrast requirement from WCAG 1.4.11.

I'm verifying that #8A8576 as an input border gives roughly 3.7:1 contrast against white and 3.4:1 against paper, which both pass, and I'm noting that purely decorative card border lines can use a lighter, non-essential color like #E2DCCF since they don't need to meet contrast minimums.

Checkbox and chip borders should reuse #8A8576 since those are interactive controls. For muted text I'm settling on something close to #5B6571, trusting it clears 4.5:1 against both paper and white based on earlier similar calculations, and I'm laying out the final palette variables for paper, card, ink, harbour, signal, tide, and line colors to use across the design.

I'm verifying contrast ratios for negative balances and tide (positive) text colors against the card background, both landing safely above 5:1. Now I'm working out the typography scale—Fraunces for headings, Figtree for labels and body, tabular numerals for money—plus setting 16px input font size to avoid iOS zoom, and defining card styling with background, border, radius, padding, and a subtle shadow.

For structure, I'm considering small-caps eyebrow labels above each section heading ("Crew", "Spending", "Balances", "Settle up") to add an editorial touch without being too cute, plus a header summarizing people/expenses/total spent with a thin decorative rule beneath it. I'm also sketching the balance meter as a rounded 8px track on a sand background.

I'm deciding to skip dark mode to stay focused, and making sure the layout handles narrow screens gracefully with word-wrapping for long names and flexible wrapping chips, along with minimal transitions for reduced-motion users. Now I'm setting up the JavaScript foundation: a storage key, currency formatting helper, and a load function that reads state from localStorage with validation.

Writing data validation logic...

Still writing split logic...

Still writing settlement algorithm...

I'm verifying termination and correctness: each iteration advances at least one pointer, balances always net to zero, and leftover lists must be fully settled since totals match. Now moving on to the rendering function.

I'm writing a full re-render function that updates people, form, expenses, summary, balances, and settlement views on every change — simple but safe for a small app, since the focused element is never destroyed mid-action (delete buttons get refocused, and the name input stays untouched when adding a person).

For the form sync, I'm adding new people to the known/split sets automatically, keeping the payer valid, and only rebuilding the payer dropdown and split checkboxes when the set of names actually changes, using a signature string to detect that. I want the checkboxes to preserve their checked state from draft.split, and I'm keeping the split fieldset's legend static while only rebuilding the inner chips container.

When there are no people yet, I'm showing a hint message instead of chips, telling the user to add people before splitting costs, while still leaving the controls enabled so form validation can still run and show relevant errors. Now I'm starting the submit handler for the expense form, preventing default and beginning to pull values from the inputs.

Collecting validation errors for the description, amount, and people selections, including checking the payer and at least one split recipient, then showing a form error if any exist. On success I push the new expense, persist state, reset the form, and re-render, and I'm also planning to add a visually hidden live region so screen readers get a polite announcement like "Added Groceries: $100.00 split 3 ways."

I'm deciding to keep the split source of truth in `draft.split`, synced via change handlers, rather than re-reading checkboxes directly from the DOM on submit. Now I'm moving to the person form submission logic — validating the trimmed name isn't empty and checking for case-insensitive duplicates against existing people, with a clear error message like "already on the trip."

On success I push the new person, persist, clear the input, and re-render everything while keeping focus in place. I'm also adding a nice touch: avatar initials for each person in the list, plus a people count near the heading, and I'm starting to build the expense list sorted newest first.

Each expense card shows the description, amount, who paid, and a breakdown of shares per person, with a "Remove" action. I'm refining the subtext to read naturally depending on how many people split the bill—handling the edge case where only one person is in the split so it doesn't awkwardly say "split 1 way."

For the balances list, each person's row shows their name, whether they're owed or owe money with the amount, and a visual meter bar reflecting the proportion. I'm deciding how to phrase a zero balance so it reads as "square" rather than showing an awkward owed/owes verb with $0.00.

Now I'm figuring out meter bar widths relative to the max absolute balance, and setting up the settle-up transfers list structure.

For the summary line, I want it to count transfers naturally ("One transfer" vs "N transfers") and handle edge cases: no expenses yet gets an encouraging prompt to log one, while zero balances with existing expenses gets a "you're all square" message. Each transfer line reads as "Ben pays Ana" plus the amount, with a trailing note clarifying payments happen directly between people.

I'm also planning a header summary strip showing people/expense/total counts, a footer "Start a new trip" reset button guarded by a confirm dialog that clears state and re-renders, and focus handling after deletions. I'm writing an HTML-escaping helper and starting the page skeleton...

Adding the person input field...

I'm also finishing the list container for people on the trip and reconsidering accessibility: rather than wiring aria-describedby to a conditional error id, I'll rely on role="alert" for announcing errors and use aria-invalid to flag the field.

Settling on placement: the form will have an empty slot div for the error, which JS fills with a role="alert" error element (with its own id and test id) when validation fails, and clears when resolved.

For clearing behavior, I'm attaching input listeners so typing clears the error — for simplicity, I'll clear the whole form error rather than tracking per-field, even though that means the error vanishes as soon as one field changes while others are still invalid.

Also, I want errors from one form to clear when the other form submits, so I'll just clear both error slots on any submit and then show whichever one is relevant. Now I'm sketching the expense form's layout with a card header and form fields matching the structure of the person form.

Building description, amount, payer, and split fields...

I'm deciding to remove the input's own outline and instead apply focus-within styling to the wrapper so the whole field shows a visible focus ring, though I reconsider and lean toward just giving the input its own border with the dollar prefix padded inside.

For responsive layout, I'm keeping the grid stacked into a single column below 520px since amount and payer fields still fit at narrower widths, and I'm folding the CAD unit directly into the label text rather than a separate span. Now I'm starting to mark up the expenses card section with its header.

I'm sketching out the balances and settle-up cards for the sidebar—balances show positive/negative amounts with a one-line explainer, and the settle-up card lists the minimal set of transfers needed to clear everyone's debts, plus a footer note that data stays local in the browser with a reset button.

Now I'm defining the CSS color palette and design tokens—paper and ink tones, harbour and signal accent colors with their tints, plus border radius and other base variables.

I'm choosing the typefaces, Fraunces for display and Figtree for UI text, then setting up the base body styles with the paper background. I'm also considering a subtle header band in the harbour color to give the design a stronger brand presence at the top.

Checking contrast ratios for the header text against the harbour background confirms good readability, and I'm adding a thin Signal-colored stripe beneath the header as a design accent. Now I'm setting up the layout grid with responsive max-width wrapping and padding.

Still writing styles for cards and typography...

Now I'm defining label and input styles for the form fields, setting minimum heights, padding, borders, and colors to keep things legible and consistent with the design tokens.

I'm working out focus states, making sure text inputs show a visible outline ring using the harbour color, and that error states use a signal-colored border plus a soft glow via box-shadow. I'm also tuning placeholder text color for sufficient contrast, then moving on to define the base button styles with their font weight, padding, border radius, and transparent border.

Now I'm defining the primary, quiet, and link button variants with their hover and active states, then double-checking that white text on the signal-red background clears the 4.5 contrast ratio threshold for normal text — it comes out to roughly 4.99, which passes. I'm also starting to lay out the input-row flex container for pairing a text field with a button.

Adding wrap and chip styles...

Still writing form error styles...

Styling rows with avatars...

Now I'm thinking about the empty state for the people list, considering a dashed-border box with muted text on a paper background to keep it visually distinct but calm.

Moving to expense entries, I'm styling each row with a bottom divider, a title/amount grid header using tabular numerals for alignment, a muted subtitle line, and a flex-wrapped list for showing individual shares.

Still writing styles...

For balances, I'm giving each row a header with name and signed status color-coded by positive, negative, or zero, plus a tabular-numeral amount and a meter element taking shape next.

Still writing styles...

Still writing header styles...

Good, contrast ratio checks out at 8.0. I'm also verifying the header stripe design, keeping the desktop wrap width around 1080px, and confirming there's nothing unnecessarily focusable in the header since nothing there needs a focus ring. Overall I want the "quietly confident" tone preserved throughout.

Now I'm making sure there's no horizontal scrolling by using overflow-wrap on long names and letting min-width:0 handle flex overflow rather than forcing overflow-x hidden. For the select element, I'm planning to use appearance:none with a custom SVG chevron background to keep it minimal while staying native and accessible—encoding the SVG as a data URI...

Setting up core JS state with a storage key, currency formatter, DOM helpers, and name normalization utilities, then initializing the trip data and a draft object to track payer, known participants, and split selections.

I'm writing a load function that safely parses saved trip data from localStorage, validating each person's name and deduplicating them, then filtering expenses to ensure they reference valid payers, positive integer amounts, and legitimate split participants.

Now I'm sketching helper functions: a save function that persists the trip state, a uid generator for unique IDs, and a balance calculator that tracks how much each person paid versus what they owe based on splitting each expense's cost among the selected participants...

I'm writing the function that divides an expense into shares, assigning the base amount per person and distributing leftover cents one at a time to those listed earlier in the trip. Then I'm building the settlement logic, separating people into creditors and debtors based on their balances so I can figure out who owes whom...

Finishing the settlement planner...

Now I'm moving into the rendering functions, starting with the one that displays the people list — updating the count label and showing an empty state message when no people have been added yet.

For expenses, I'm building the rendering logic that reverses the list for most-recent-first display and generates markup for each expense card, showing the description, who paid, how the amount was split among participants, and a breakdown of each person's share.

I'm also finishing the remove button with an accessible label that includes the expense name, checking that "Remove" as visible text still satisfies label-in-name accessibility requirements, and adding a small "Split between" caption above the shares list instead of relying solely on aria-label.

Now I'm writing the delete handler that uses event delegation on the expense list, finds the clicked expense by its data-id, splices it out of the trip's expenses array, saves, and re-renders. Since the list displays newest-first (reversed), I need to carefully work out which display index to refocus after removal so keyboard focus lands on a sensible neighboring delete button rather than being lost.

I'm also adding a status announcement naming the removed expense, and making sure focus falls back to the heading when the list becomes empty. For accessibility, I'm adding a focus-visible outline style so programmatically focused headings with tabindex="-1" get a visible ring when navigation was keyboard-driven.

Now I'm writing the balances renderer, which computes each person's bar width relative to the max absolute balance and labels them as owed, owing, or square, then double-checking that zero balances never render as negative zero since they come from integer subtraction.

Now I'm moving to the settle-up view, computing a settlement plan from balances and rendering it as a summary message plus a transfer list, with an empty-state message when there are no expenses yet.

I'm adding a header stats line showing people count, expense count, and total spent, falling back to "$0.00 spent" when empty, then starting the renderAll function that computes balances and triggers the various render calls.

Now I'm writing syncForm, which keeps the draft state in sync with the people list—adding new names to known/split sets, resetting the payer if needed, and only rebuilding the payer dropdown and split checkboxes when the people list actually changes, then restoring checked states on the chips.

I'm also checking edge cases: HTML entity escaping for names like "O'Brien" decodes correctly back to the original string for both option values and checkbox values, and empty people lists gracefully show a hint instead of breaking the payer dropdown. Now I'm setting up the change event listeners for the payer select and a delegated change listener on the split chips container.

For the person-add form submission, I'm validating the trimmed name: rejecting empty input, rejecting duplicates case-insensitively with a clear error message, and enforcing a 40-character max length as a backup to the HTML maxlength attribute for pasted text.

I'm deciding that on error, focus should move to the input field since that's helpful for keyboard users, especially when the submit came via button click rather than the input itself. For expense form errors, I want to restructure validation to return a list of errors paired with their associated elements, so I can focus the first invalid field automatically while the error summary announces via alert role.

I'm writing the showError and clearError functions that inject an alert-role error box into a designated slot, plus a helper to toggle aria-invalid on fields and reset it when errors clear.

Keeping the expense error box at the top of the form, since focus moves to the first invalid field anyway which handles visibility on mobile. The person error slot stays below its input row.

Now I'm writing the expense submit handler that clears existing errors, grabs the description, amount, payer, and split inputs, then starts validating the description — checking it's non-empty and not over 80 characters, collecting problems with their messages and associated elements.

Validating the rest...

I'll read the split selections directly from the checked checkboxes to be safe, then build the expense object and push it to the trip, saving and resetting the form fields afterward. After submission I reset the split selection to all people checked, re-render everything, refocus the description field, and announce the added expense for accessibility.

Now I'm writing a parseAmount function that strips a leading dollar sign, validates comma formatting in thousands, checks for valid decimal structure, limits to two decimal places, and converts the result to an integer cent value while guarding against unsafe or non-positive amounts. I'm tracing through edge cases like "12.5" and "12." to confirm the padding and parsing logic behaves correctly.

For extremely large whole-number strings beyond MAX_SAFE_INTEGER, the float math stays exact since isSafeInteger correctly rejects anything above that threshold, while values under it compute precisely.

For clearing errors, I'm wiring up a clearAllErrors helper that resets both person and expense error states and strips aria-invalid from all flagged fields, then attaching input/change listeners on the name field and expense form so errors clear as soon as the user starts correcting them -- simplest approach is clearing the expense error on any input within the expense form itself.

Now I'm building the stats rendering, computing total cents spent and assembling a summary line showing counts of people and expenses plus the total formatted amount, joined with separator dots.

For the reset button, I'm writing a confirm dialog that, if accepted, clears the trip's people and expenses, resets the draft state, clears errors, saves, re-renders everything, and announces the reset to screen readers.

I'm considering whether to add multi-tab sync via storage events, but deciding it's probably unnecessary complexity for now and might conflict with the draft logic.

Checking that `syncForm` resetting the payer select on every renderAll stays consistent with the user's actual selection, and that adding a person mid-expense-entry doesn't disrupt focus since it rebuilds split chips safely while the user's attention is elsewhere.

For the reset-after-add flow, I realize it's simpler to always refresh checkbox checked states from `draft.split` inside `syncForm` rather than relying on signature changes, so resetting the draft and calling renderAll naturally re-checks everything without a separate helper. I'm also confirming unchecking a box doesn't need to trigger renderAll since the change handler alone updates the draft state.

Now I'm working out the people list rendering: each row gets a data-testid, and avatar initials are derived from the first letters of up to two words in the name, using Array.from to safely handle unicode characters. I'm also drafting the empty-state messaging for the people and expenses lists, plus how balances should display when there are no people versus people with no expenses yet.

For balances, I'll keep a simple hint explaining each balance as what someone paid minus their fair share, rather than a wordier color-coded explanation. I'm considering whether to add eyebrow labels like "Who's coming," "What was spent," and "Where things stand" above each section, though I'm leaning toward skipping them to avoid clutter and just using plain headers instead.

For the list markup, I'll use proper ul/li elements for accessibility. The header wraps the brand with the "Even Keel" wordmark as an h1 for correct semantic structure.

I'm checking that `main` uses `data-testid="app"` with the header placed outside it, and confirming the layout holds up at 360px width—padding, grid stacking, chip wrapping, and transfer row flex behavior all need to work at that narrow size.

Now I'm sketching the wordmark SVG: a small balance-beam icon with a rounded square background, a horizontal beam, a center post, and a bead on top, paired with a Fraunces-set heading using Figtree as the fallback font.

Writing root CSS variables...

Adding more base styles...

Adding header styles with a colored bar accent and brand layout...

Checking contrast on the separator color confirms it passes even though it's decorative, then I'm setting up the main layout padding and spacing structure...

Writing layout CSS...

Adding form field styles...

Adding custom dropdown styling...

Adding grid styles...

Checking the math: with input basis 180px and button basis ~125px, the combined 315px exceeds the 292px container width, so the row wraps the button onto its own line.

I'm reconsidering a smaller basis like 120-140px so input and button fit on one row at 292px width, with the input flexing to fill remaining space. Also checking the button's rendered width for "Add person" text with padding to confirm it fits comfortably.

Now I'm writing the button style classes—primary, quiet, and link variants with their hover and active states, padding, border radius, and typography.

Next I'm setting up form actions alignment, making the "Add expense" and "Add person" buttons full-width on mobile and auto-width above 520px breakpoint, then starting on chip styling with flex layout and spacing.

Finishing the chip styles with checked/focus states using the harbour color scheme, and noting I need to scope the label styling to `.field > label` specifically so it doesn't accidentally override the chip labels nested inside fieldsets. Now moving into styling the expenses list section.

Still writing styles...

Styling balance status colors...

Now I'm designing the meter bar with a centered zero-mark divider and fill colors that switch between tide-green for positive and signal-red for negative values, checking that the class names don't visually clash with the status text colors.

Then I'm styling the settle-up section: a tinted harbour note, transfer rows with flexible text wrapping, and tabular-numeral amounts in Figtree so the dollar figures align cleanly and the harbour-ink text reads well against the tinted background.

Now I'm defining the empty-state placeholder with a dashed border and muted bolded title, a centered footer with muted small text, and a form-error banner using the signal-tinted background with a warm border and an icon placeholder before the text.

I'm checking the color contrast between the dark red text and the tinted background, confirming it passes readability, and adding reduced-motion overrides so transitions and scroll behavior are disabled for users who prefer it. I'm also verifying that the sidebar column reorders correctly on mobile and that fieldset spacing, payer select values, and balance data attributes are all wired up properly.

Now I'm walking through edge cases: confirming the person count matches the data-testid elements, that error messages disappear once input is valid, that invalid form values persist rather than clearing, and that the split checkboxes default to checked for everyone. I'm also verifying the payer select defaults to the first person and keeps the chosen value after submission, while the amount and description fields reset on success, and checking how a comma-formatted amount like "12,50" triggers the validation error.

I'm also setting input attributes like autocomplete, autocapitalize, and inputmode appropriately for names, descriptions, and amounts, and making sure focus rings stay visible across text inputs, buttons, and chip checkboxes even via mouse clicks. I'm noting that the chip highlight relies on the :has() selector, which isn't supported in older Firefox versions, so I'm considering a fallback rule that bolds the label text when the checkbox is checked.

Now I'm shifting to writing the actual copy in a plain, calm, specific voice using "you": drafting header taglines, empty-state messages for the people list, hint text for names, and the split hint explaining that everyone's included by default and you untick anyone who didn't share the cost.

I'm also working through balances and settle-up copy — explaining that each balance reflects what someone paid minus their share, and that settling shows the fewest payments needed to clear everything — plus error messages for empty names, duplicate names, and names that are too long.

I'm drafting the remaining validation messages for descriptions, amounts (empty, non-numeric, too many decimals, zero or negative, too large), missing payer, and missing split selection, along with announcements for adding/removing items and a footer note about local saving. I want to soften the "fewest payments" claim since the algorithm isn't a guaranteed minimum, so I'll phrase it as each payment clearing debt between two people rather than claiming optimality.

Now I'm starting the HTML document structure with the page title, meta tags, and basic setup.

Still writing SVG icon...

I'm second-guessing whether CSS-generated separator dots get announced by screen readers, so I'll likely use explicit aria-hidden spans for the dots instead of relying on pseudo-element content.

Simplifying the approach: dropping the separator and switching stats to pill-shaped chips with a translucent background, checking contrast against the harbour color to confirm it still meets accessibility ratios. Now I'm starting the main HTML structure, building out the People card section with its header, count display, and the beginning of a person entry form.

Adding the name input field...

Still writing form markup...

Now I'm setting the legend style globally and moving on to building the expenses ledger card, starting with the header section showing an "Expenses" title.

Writing side column layout...

I'll show that note as a default hint when there are no expenses yet, hide the transfers list entirely when empty, and keep the footer text muted against the paper background, with the script tag placed at the end of the document.

Now I'm writing the JavaScript module—setting up storage keys, formatting helpers for currency, escaping and whitespace-normalizing strings, and utility functions like pluralization and unique ID generation.

Still writing utility logic...

I'm also implementing the load function to safely parse localStorage data, deduplicating people entries and validating the stored structure before use.

I'm wrapping the parsed result in a try/catch so any malformed or null JSON falls back to the empty state, and double-checking that the split array stays valid since people is fully built before filtering and splitShares reorders by people anyway.

Now I'm writing the save function with a try/catch around localStorage.setItem to silently handle storage errors, plus an announce helper that sets the status text for accessibility, and showError/clearError functions that render validation messages into an error slot and clean up aria-invalid attributes on the form fields.

I'm double-checking the clearError wiring: calling clearError('expense') on input events correctly clears aria-invalid from the expense form, including when toggling split checkboxes, and setInvalid just marks a field with aria-invalid="true".

For the error icon, I'm drawing a small inline SVG warning circle with an exclamation mark for the error display.

For form submission, I decide both submit handlers should clear errors from both forms first before validating, then focus the first invalid field. Now I'm writing the renderPeople function, which updates the people count label, toggles the list visibility, and builds the list markup for each person.

I realize I need to override the `hidden` attribute globally with `[hidden]{display:none !important}` since flex display rules on `.people` could otherwise break it. Now I'm adding the empty-state message and styling for the person avatars list.

Thinking about layout order, I'm debating whether the people list should appear above or below the add-name form. I'll go with showing the list (or empty state) first, then the form at the bottom with a separating border, keeping it consistent with how the expense section is structured.

For expenses, I'm writing a render function that updates the expense count label, toggles visibility of the list versus empty state, and renders each expense in reverse chronological order. Then I'm building a stats renderer that summarizes people count, expense count, and the running total.

For the settle view, I'm writing logic to generate a friendly note depending on whether there are no expenses yet, nothing left to settle, or a set number of payments needed to even everyone out, then rendering the transfer list accordingly.

Writing transfer list markup...

For balances, I'm rendering an empty state when there are no people yet, and computing the max absolute balance to use for scaling the display.

Writing expense item markup...

Finishing the share list markup and adding a remove button with a proper aria-label for accessibility.

I decide to special-case single-person splits with "for X only" instead of "split 1 ways" for better readability. I'm wiring up a click listener on the expense list that finds the delete button, extracts the expense id from its parent, and locates the matching index in the expenses array to remove it.

Now I'm working out which item should receive focus after deletion, since the list displays newest-first while the array stores oldest-first: I compute the pre-removal display index of the deleted item, then after splicing out the expense, use that same display index to refocus the next logical item (or the last one if it was the final entry).

If the list becomes empty, focus falls back to the ledger title, which I've given tabindex -1 for that purpose. I'm deciding not to add a delete confirmation since the spec doesn't call for one, and I'm also setting up a simple change listener so edits to the payer field update the draft state.

For the split-chips checkboxes, I'm rewriting the toggle logic as a proper if/else rather than a bare ternary expression, since checkboxes fire both 'input' and 'change' in modern browsers and I want to listen for both to be safe. I'm making clearError idempotent by checking whether the slot already has content before touching the DOM, so redundant calls from double-firing events are harmless, and removing the aria-invalid attribute each time is similarly low-cost.

Now I'm double-checking other details: the expense description field's maxlength, the amount parser reading from the correct input, and the zero-balance "square" using a cents data attribute of zero. I'm also reviewing CSS for the stats list, card-head count styling, and the focus behavior on the expenses card heading — since it uses tabindex -1, I want to make sure focus-visible outlines still show when it's focused programmatically rather than suppressing them.

I'm also sketching the responsive grid: a `.col` class with grid display and stable sizing, a sticky sidebar column, and desktop column proportions (roughly 1.15fr to 1fr) that keep things balanced around a 1080px max width, plus checking the header layout and heading font size at desktop widths.

Now I'm writing the base reset and typography styles — box-sizing, body font and smoothing, heading/list/fieldset margin resets, and inherited font styling for inputs, selects, and buttons, along with a focus-visible outline style using the harbour color.

I'm picturing the overall visual design: a signal-colored stripe under the header, paper-toned background, white cards with soft shadows, Fraunces display type for titles in harbour, and colored balance/status indicators. I'm working out the pill-shaped stat badges' background and checking color contrast math to make sure the paper-tinted text stays legible against the harbour background.

Now I'm going through accessibility and test-compatibility details: confirming headings nest properly, checkboxes for each person are labeled with their name, buttons like "Add expense" and "Add person" have accessible names, and form fields like "Name" and "What was it for?" are properly labeled for test queries.

I need to verify the sig tracking logic so split-chips rebuild correctly when the people list is empty, making sure the hint text still shows properly. I'm also reconsidering the hint wording "Add people above to split costs between them" since the people card does sit above the expense card in the layout.

For the payer select with no people, I'll add a disabled-looking placeholder option like "Add people first" with an empty value, so the select doesn't look broken even though it's not submitted. Now I'm writing the syncForm function that updates the known/split sets, resolves the payer default, and rebuilds the payer dropdown and split chips whenever the people signature changes.

Writing chips and payer HTML...

I'm checking edge cases: setting the payer value back after rebuilding options, syncing checkbox states to draft.split, and handling names with odd whitespace since tidy already normalizes them. For submit, I'm gathering the checked chip values into a chosen array to build the split list.

Now I'm fleshing out the submit handler for the expense form—clearing prior errors, grabbing the description, amount, payer, and chips elements, validating the description and parsed amount, and starting to build the problems list for when there are no people to split with.

I'm double-checking the edge case where no people exist yet—pointing the error at the person-name field is a reasonable redirect even though it's on the other form, and minor aria-invalid cleanup gaps there are acceptable. I also want to make sure amount.cents is only used when there's no amount parsing error.

Then I'm verifying that after adding an expense, the re-render correctly syncs the checkboxes and payer field from the draft, and that focusing the description input still works post-render since it's the same DOM element.

Now I'm writing the person-form submit handler: clearing errors from both forms, trimming the name input, and validating it against emptiness, max length, and duplicate names (case-insensitive) before building an error message if needed.

I'm checking that duplicate-name errors show the correctly cased name, that clearing input value and announcing success happens on valid submission, and that input/change listeners properly clear errors as the user edits either form.

Now I'm verifying aria-invalid attributes and alert roles cover both the amount field and name field, then moving to write out the full CSS stylesheet with root variables, box-sizing resets, and base typography.

Writing base styles...

Still writing header styles...

Writing card styles...

Styling form field spacing and labels...

Adding a custom dropdown arrow icon...

I'm also styling invalid form fields with a border and glow using the signal-ink color, checking that it has good contrast against white.

Actually I realize the `!important` isn't needed here, but I need to be careful about CSS specificity so the invalid-state selector properly overrides the base input/select styling—targeting both element types directly rather than relying on the attribute selector alone.

For the money input, I'm positioning a currency symbol absolutely inside a relative container, offsetting it vertically, and padding the input field to make room for it, while keeping the digits aligned with tabular numerals. I need to make sure this rule is declared after the base input type rule so it wins given equal specificity.

Now I'm setting up the paired field grid that becomes two columns on wider screens, plus a flexible wrapping row layout...

Still writing button styles...

Still writing chip styles...

Now I'm styling the form error message with a flex layout, warning-tinted background, and an icon sized and aligned at the top.

I'm reconsidering the structure — placing the error slot inside the add-person form rather than above the list, with the card showing a header, optional list, then the form with error slot, field, and button. Now I'm writing the CSS for the people list rows, with spacing and bottom borders separating each person entry.

Adding expense row styles...

Adding more styles...

Styling the balances section...

Adding fill bar styles...

That checks out for the zero state too. Now I'm styling the transfer list items, with a settle note banner, flex-based rows with text wrapping and tabular numeric amounts for alignment.

I'm also defining empty state styling with a dashed border and muted text, then moving on to the footer layout with centered, stacked content.

Since `.wrap` and `.foot` share class on the same element, I need to check which padding rule wins by CSS order—`.foot` comes later so it overrides `.wrap`'s padding at both mobile and wider breakpoints, which should still look fine.

Now I'm walking through a 360px-wide screen mentally: checking the wordmark size, chip wrapping, card inner widths, expense row layout with wrapping descriptions and nowrap amounts, balance name/status wrapping, and transfer text alignment—all seem to fit without overflow. I'm also verifying the person-form row inputs behave correctly at this width.

I'm confirming the add-expense button goes full width on mobile, pair elements stack properly, desktop card shadows look right, focus-visible outlines work on the ledger title and chip inputs, and now I'm checking where stats rendering gets placed in the code.

I'm verifying the Google Fonts import URL for Figtree and Fraunces uses valid axis syntax, and that Fraunces' optical sizing will give that nice display look at larger sizes. Now I'm moving on to writing the final version.

I need to output raw HTML starting directly with `<!doctype html>`, with no code fences or explanation around it. I'm also double-checking that the settlement plan sorts ties using the trip's people order, and that the balance computation initializes a map entry for every person before splitting expenses.

I'm verifying that split shares only ever include valid people, so leftover cents always distribute correctly and totals sum exactly to the original amount—confirmed with a $10 example split three ways (334/333/333). The settle-up algorithm should use at most one fewer transfer than the number of people with nonzero balances, which checks out, though I'm unsure how specific the UI copy needs to be for expense sub-lines like "Paid by X · split N ways."

I'm running through validation edge cases: non-numeric amounts, zero, negative, and too many decimals should all trigger errors while preserving user input; blank descriptions should error too. For names, trimming whitespace and catching duplicates (case-insensitive) both work as expected, and localStorage saves correctly after every mutation—adding, deleting, resetting. I also note the payer field isn't persisted across reloads, defaulting back to the first person, which seems acceptable.

Now I'm confirming the empty-state placeholder sits correctly before the expense list, and finalizing wording for the reset confirmation dialog. Then I start writing the full HTML document, beginning with the page head—title, viewport meta, and description meta tags.

Setting up the color palette and font variables now, defining the paper, card, ink, and accent tones along with the display and UI typefaces, then checking contrast ratios between the muted text color and the paper background to make sure they're readable.

Placeholder gray on white checks out at 5.04, and the other remaining text/background combinations all pass contrast too. Satisfied with the accessibility checks, I'm ready to write the full JavaScript implementation, starting with storage constants, currency formatting helpers, and DOM utility functions.

Writing storage and split logic...

Still writing settlement logic...

Now I'm settling on the render order: renderStats, renderPeople, syncForm, renderExpenses, renderBalances.

Writing event handlers...

The order of the change event versus my handler doesn't really matter here. Clearing the error on input also covers typed text correctly, and clearError clears aria-invalid across all expense-form fields, which is what I want.

I'm tracing clearError's logic: it empties the error slot and strips aria-invalid from matching form elements, so calling it for 'person' or 'expense' only touches that form's fields, which checks out for both submission flows and input events.

Now I'm writing showError, which builds an alert box with a warning icon and a bullet list of error messages injected into the form's error slot.

Role="alert" plus focus shift could double-announce to screen readers, but that's acceptable. I'm checking the CSS for the error list grid layout, then moving to finalize the full HTML structure—wrapping forms and lists in main with the app test id, placing header stats outside main, and double-checking balance elements expose data-cents for tests.

Now I'm writing the reset button label and verifying the settle wording renders correctly with escaped names. For expense items, I'm building each list entry to show description, payer, split info (either "for X only" or "split N ways"), and the formatted amount.

Finishing the expense item with a shares list showing each participant's name and owed amount, plus a remove button. I'm renaming the amount span class to share-amt for clarity, and confirming the "Split between" label displays once per expense.

Now writing the renderExpenses function, which updates the expense count label, toggles visibility of the list versus an empty state message, and renders each expense in reverse chronological order—checking that the empty-state copy correctly references the form above it in the layout.

I'm confirming the same "above/below" directional logic for the people and balance empty states, matching copy to actual form placement in the DOM, and double-checking small details like safely handling empty strings for initials and excluding zero balances from the summary display.

Tightening the remaining wording details, like the balance tone text and header stats, and finalizing small layout touches for the card headers and wordmark before assembling the complete stylesheet.

Building out the people card markup...

Building the expense form fields...

Finishing the form markup...

Adding a reset so the second field in the pair has no extra top margin, keeping desktop alignment clean while the mobile stacking still gets proper spacing.

Adjusting margin rules...

Defining margin rules so fields get consistent top spacing by default, but reset to zero for first fields, those following error slots, and fields inside pairs.

Checking the delete handler logic: clicking on the expense list uses event delegation, finding the closest expense item and its id via dataset, then locating the matching expense by index to remove it.

For reset, clicking the button prompts for confirmation before wiping the trip entirely, clearing people and expenses, resetting the draft payer/split state, re-saving, and refocusing the name input. I'm confirming the draft signature reset properly triggers the form sync, and that trip being a mutable closure variable works fine for re-renders. Now I'm putting together the full document, double-checking details like pluralization for the people count display.

I'm also reviewing the CSS layout — checking sticky positioning for the sidebar, confirming padding overrides on main and footer sections don't clobber the horizontal padding from the wrapper, and verifying the header's spacing is handled correctly. Everything checks out, so I'm finalizing the complete output now.

