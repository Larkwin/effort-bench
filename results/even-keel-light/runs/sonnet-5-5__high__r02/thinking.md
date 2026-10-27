I'm planning the visual palette, favoring warm off-white paper tones and a muted navy/signal color scheme, while being careful not to treat "owing" balances as alarming errors since that's a normal state.

For typography I'm leaning toward Fraunces for headings paired with Instrument Sans for body text, with tabular figures for money display. I'm sketching the layout as a two-column desktop view (People/Add expense on the left, Settle up/Balances/Expenses on the right) collapsing to a single stacked column on mobile, and now I'm sketching the underlying state model tracking people, expenses, and their splits.

I'm debating whether to allow removing a person — deciding to permit it only when they're not tied to any expense, keeping the feature modest. I'm also working out amount parsing rules, needing a regex that handles plain decimals, optional leading dollar signs, and comma-formatted thousands like "1,234.50".

I'll convert amounts to cents by parsing the whole and fractional parts separately to avoid floating-point errors, and I'm settling on a text input with decimal inputmode rather than a number input so invalid entries like "12.345" or "abc" can still be typed and properly rejected with a validation message.

For splitting, I'm computing base shares via integer division with the remainder distributed one cent at a time to the first people in trip order, then calculating each person's balance as paid minus their share. I also need to guard against no payer selected, default the payer to the first person, and preserve selection state (who's included in the split) across re-renders by tracking it in a separate set that updates when people are added, resetting only the description and amount fields after a successful expense submission.

For errors, I'm keeping a single aria-live region per form with a testid'd paragraph that's emptied when there's nothing to show, linking inputs via aria-describedby and aria-invalid, and displaying just the first validation problem while focusing the relevant field rather than listing everything at once. For settling up, I'm sorting debtors and creditors by amount and greedily matching the largest debtor against the largest creditor to minimize transactions.

Balances will render for every person via data-testid="balance" with person/cents attributes even at zero, and transfers get data-from/to/cents attributes with readable text like "Ana pays Ben $12.00". I need an escaping helper for user-entered names since I'm building HTML via templates with data attributes, making sure quotes get escaped too.

Expenses will display newest-first by reversing the insertion order, and I'll skip showing an added-date to limit risk. For persistence I'm using a versioned localStorage key wrapped in try/catch with shape validation on load, and enforcing case-insensitive name uniqueness via lowercasing while just trimming whitespace rather than collapsing internal spaces.

For deleting an expense, I'll remove it immediately but add an undo affordance by tracking the last removed item and index, announced through a status/live region. I'm also adding a small trip total stat, an empty-state message encouraging the first person to be added, and keeping the expense form enabled even with no people so I can show an inline error instead of disabling controls that tests might try to interact with.

Now I'm thinking through the balance row visual: a centered track with an axis, filling right in teal for someone owed and left in a sand/navy tone for someone who owes, treating "owes" as neutral rather than negative, and reserving the brand accent color for primary actions like the transfer button.

Checking contrast ratios for the primary button using Signal orange with white text, which comes out around 5.0 and passes AA. For error text on the paper background, the straight Signal color is borderline, so I'm darkening it to #9E3520 for better accessibility.

I'm also verifying muted text colors like a blue-gray against the paper background land safely above 5:1, and checking the teal used for "is owed" text for similar contrast adequacy.

Now I'm designing the page structure: a navy header with the brand mark in Fraunces and the tagline, cards with subtle borders instead of shadows, Fraunces for headings, and tabular numerals for all numbers. I'm planning a prominent dark "Settle up" card showing transfers like "Ana → Ben $12.00" in white text, plus an empty state message for when everyone's balanced.

I'm working out the responsive two-column grid layout with people/add-expense on the left and settle/balances/expenses on the right at wider screens, collapsing to a sensible mobile order, and styling accessible checkboxes with a fieldset/legend grouping for the split options.

For each expense item I'll show the description bold, amount on the right, who paid, and the split breakdown with per-person shares, plus a labeled remove button, and I'm deciding to keep just one "Select everyone" toggle rather than separate select-all/none buttons.

For adding a person, submitting via Enter or the add button clears and refocuses the input while preserving typed text on error. For the person list, I'm weighing whether to put the remove button inside the same test-id element as the name (risking text mismatches in tests) versus wrapping the name alone in its own data-testid element with the remove button as a sibling -- I'll go with the sibling approach to keep the name text clean.

I'm also keeping the avatar initial outside the test-id element for the same reason, and only showing balances when people exist. Now I'm setting up currency formatting using Intl.NumberFormat for CAD, converting cents to dollars, and displaying negative amounts as their absolute value.

For state persistence, I'm writing a loader that pulls from localStorage, validates the shape of people and expenses arrays, and falls back to an empty state if anything's malformed—filtering out invalid entries like non-positive amounts, unknown payers, or empty splits. IDs are generated with a timestamp plus random suffix.

Writing balance calculation logic...

Now I'm working out the settlement algorithm that matches creditors to debtors by sorting both by amount and greedily pairing the largest balances to minimize the number of transfers needed.

Next I'm planning the render functions needed for people, payer/split selection, expenses, balances, settlement, and summary views, making sure the payer dropdown preserves its selected value across re-renders.

For the split selection, I'm rendering a checkbox chip per person tied to a shared set, syncing it on add/remove and also re-reading checkbox states directly from the DOM at submit time so tests that click checkboxes work correctly, then parsing the description, amount, payer, and split list for the expense handler.

I'm defining the validation order and messages: no people, empty description, missing/invalid/too-precise/non-positive amount, no split selection, and missing payer, each with a specific user-facing error and a focus target, then writing a parseAmount helper that normalizes the input string and returns either a cents value or an error.

Checking edge cases like negative numbers and trailing decimals to make sure the error messages stay clear and sensible.

Now I'm planning an undo feature: a live-region notice with an undo button that reappears after deletion and reinserts the expense at its original index, clearing on the next action. I also need to think about where focus should land after a delete, likely moving it to the undo button since the delete button itself vanishes.

For the brand mark, I'm sketching a simple navy SVG icon combining a horizon line with a signal-colored triangular keel shape. Writing SVG code...

Now I'm planning the header layout with "Even Keel" as the title and a subtitle explaining the app's purpose, plus a summary strip showing trip totals, people count, and expense count. I need to decide whether the header sits inside or outside the main wrapper, and I'm leaning toward nesting it within main since the banner role requires it to be a direct child of body otherwise.

I'm also adding a skip-to-main link for accessibility, then setting up the CSS color palette with harbour navy, signal orange/rust, warm paper backgrounds, and muted ink tones for text.

Now I'm working through input styling—44px height, subtle borders with enough contrast, and focus rings using a thick harbour-navy outline with offset, making sure focus states are visible against both light paper and dark navy backgrounds.

For the amount field, I'm planning a wrapper with a "$" prefix hidden from assistive tech, keeping the label as "Amount (CAD)." For the expense form layout, I'm thinking through how description, amount, and payer fields should grid out responsively, making sure payer names don't get awkwardly truncated at narrow widths.

Checking the 360px breakpoint math, I confirm the two-column layout stacks correctly since the combined column widths exceed the available inner card space. For balance rows, I'm structuring each item with the name and amount on top, a status line like "is owed $12.00" beneath, and a progress bar underneath that to visualize the balance.

For the track bar, I'm positioning it relatively with a center line at 50%, where positive balances fill rightward from center and negative balances fill leftward, scaled by the max absolute value. For transfer rows, I'm laying out "who pays whom" with the amount in large Fraunces type on the navy card background, but I notice the signal color has poor contrast (around 1.9) against the navy, which I'll need to fix.

I'll switch the signal color to decorative use only—maybe a left border accent on rows—while keeping all text white or cream for readability. I'm also drafting empty states for the settle section ("Nothing to settle yet" and "Everyone's even"), adding a reassuring principle line under the heading when transfers exist, and handling responsiveness with overflow-wrap on names and min-width:0 on grids, plus minimal transitions for reduced-motion preference. Now I'm ready to write the full implementation, rendering each section by setting innerHTML on its container.

For the person form, I'm setting up an error slot with aria-live="polite" and a setError helper that injects or clears an error paragraph, making sure aria-invalid and aria-describedby stay wired to that slot, and errors clear only on successful submission rather than on every keystroke. For adding a person, I'm validating that the trimmed name isn't empty and isn't a duplicate, showing appropriate messages for each case.

For expenses, I'm designing a list item showing the description, who paid, and who the split is between, with an amount and a remove button that includes a descriptive aria-label, and I'm considering how to phrase the split text when everyone is included versus a subset of named people.

I'm working out the naming convention for listing participants with proper comma-and-"and" joining, plus showing per-person cost either as a flat "each" amount or a min-max range. For removing a person from the trip, I'm deciding to only allow it if they're not tied to any existing expense, with an appropriate aria-label, and I'm setting up an escaping helper for safe HTML attribute rendering along with persisting state after every mutation.

Now I'm wiring up delegated removal handling for the person list using data attributes, adding meta tags for color scheme and theme color, picking the Fraunces and Instrument Sans font imports, and structuring heading levels along with making sure the header stats wrap nicely on mobile.

