I'm planning the data model for people and expenses, including name validation rules and how to compute split shares with remainder distribution so totals always balance exactly.

For amount parsing I'm deciding on a regex that accepts whole numbers or decimals with up to two decimal places, converting everything to integer cents to avoid floating-point errors, and rejecting non-numeric or zero values. I'm also working out that each expense needs a description, a valid payer, and at least one person in the split, then computing each person's net balance as what they paid minus their share before moving into the settle-up logic.

For settling up, a standard greedy algorithm matching the largest creditor against the largest debtor repeatedly will minimize transfers to at most one less than the number of people with nonzero balances, and balances will always sum to zero since shares are derived from the same total cents as payments. I'm deciding to display every person's balance including zero, mark transfer amounts with signed cents, skip person removal to keep scope contained, but maybe add a simple reset-trip button with a confirmation. For persistence I'm settling on a single localStorage key with try/catch parsing, and for rendering I'm planning a full re-render approach that rebuilds the payer dropdown and split checkboxes each time while trying to preserve the current selection.

For the split checkboxes specifically, I want new people added to the trip to default to checked, so instead of tracking a separate draft set I'll read the existing DOM checkboxes before rebuilding to preserve which names were checked, defaulting any name not previously present to checked. I also want form inputs to stay intact and not get cleared if the user submits something invalid, so I won't reset the form on validation errors.

For error messaging, I'm adding a single alert paragraph per form with a shared test id, but rendering it conditionally — only inserting it into the DOM when there's an actual error, rather than just toggling a hidden attribute, since the test checks for its presence while shown. I'll also wire up aria-invalid and aria-describedby on the relevant inputs so the error is properly associated with them.

For the expense list, each entry needs to show description, amount, who paid, and who the cost is split between, plus a delete button, with expenses rendered newest-first based on insertion order.

Now I'm planning the balance display elements with person and cents data attributes, formatted money labels indicating whether someone is owed, owes, or is settled, plus transfer suggestions phrased as "X pays Y $Z" with their own data attributes. I'm also deciding on money formatting using Intl, using a text input with decimal inputmode for amounts, and making sure names are inserted safely via textContent rather than innerHTML to avoid injection. For visual design, I'm settling on Fraunces for headings paired with Inter or Figtree for body text, pulled from Google Fonts, with a warm paper background, navy and rust accent colors, and muted ink tones chosen to meet contrast requirements.

Checking contrast ratios for the rust accent color against white and paper backgrounds -- the math comes out around 5:1 on white but borderline around 4.5:1 on the paper tone, so I'm considering darkening it slightly or reserving it for buttons rather than body text on the lighter background.

Now I'm sketching the overall page structure: a header with the brand name in Fraunces and a tagline, then sections for People, Expenses, Balances, and Settle Up. I'm leaning toward a single centered column on mobile that expands into a two-column grid at wider breakpoints for a more polished desktop layout.

For accessibility, I'm defining a focus-visible outline using the Signal color, native checkboxes styled with accent-color and proper labels, and a visible label for the payer select. I'm also drafting empty-state copy for each section—like prompting users to add people first, noting when there are no expenses yet, and celebrating when everything is settled—and deciding to keep the expense form enabled even without people, relying on submission validation rather than disabling inputs outright.

Now I'm working through the validation order and messages for the expense form: requiring a description, checking amount format and positivity, enforcing at most two decimal places, requiring at least one person and a chosen payer, and requiring at least one split participant. I'm also setting rules for person names—no blanks, no duplicates—and wrapping inputs in proper form elements so Enter submits correctly, with semantic data-testid attributes for testing.

I'm starting to work out the balance calculation logic across expenses.

I'm figuring out how shares split evenly among selected people, distributing any leftover cents to the first few by index. I'm also deciding on the storage format for people and expenses, how deletion and IDs work, and sketching a greedy debt-settlement algorithm that matches creditors to debtors by largest amounts until balances zero out.

Now I'm starting to write the HTML structure for the page, including the header with branding and tagline, and the main layout with a card section for the people list.

For settle-up transfers I'm structuring an ordered list where each item describes who pays whom and how much, like "Ben pays Ana $12.00". For balance rows I'm deciding to show the absolute formatted amount alongside "is owed" or "owes" or "settled up" status, with signed cents for zero shown as "0". For each expense item I'm laying out the description, payer, split details, amount, and a delete button with an accessible label, while considering whether to show "split between everyone" as a shorthand when all people are included.

I'm now working through the visual design: a paper-toned background with ink text, a harbour-colored header featuring a balanced-level brand icon, white cards with subtle borders and rounded corners, Fraunces headings, accessible input borders, a signal-colored primary button with a darker hover state, tabular numerals for money values, and distinct colors for positive versus negative balances.

For responsiveness, I'm planning a two-column grid above 900px wide that collapses with flex-wrap below that, keeping inputs and buttons from overflowing small screens. I'm also structuring the expense form with a fieldset for the split checkboxes, a payer dropdown labeled "Paid by," and a decimal-input amount field labeled "Amount (CAD $)" with a dollar placeholder.

Now I'm setting up the persistence layer: a localStorage key, a currency formatter using Intl.NumberFormat for CAD, and load/save functions that validate and sanitize the stored people and expenses arrays before use, falling back to empty state on any parsing errors. I'm also adding a case-insensitive name normalization helper for comparing person names.

For adding a person, I'm trimming the input, validating it's non-empty, checking it's not already on the trip (case-insensitive, referencing the existing name in the error), and on success pushing it to state, saving, clearing the input, and re-rendering. I'm also sketching out a simple error-state object per form so error messages can be shown and cleared independently for the person and expense sections.

For accessibility, I'm having error messages render as an alert element with an id, so inputs can reference it via aria-describedby and get aria-invalid toggled appropriately when an error is shown or cleared.

For the expense form, I'm trimming the description and amount fields, stripping a leading dollar sign from the amount, and weighing whether to also strip commas for thousands separators versus treating them as invalid input.

I'm rejecting commas outright with a clear hint message rather than trying to parse thousands-grouping formats. For converting the amount string into cents, I'm validating it matches a plain decimal number pattern, splitting on the decimal point, rejecting more than two decimal places, computing whole and fractional cent values, and checking that the result is positive -- working through edge cases like "12." or "1." where the fractional part is empty and should default to "00".

Now I'm planning the expense-creation flow: building the split array from checked person checkboxes in DOM order (filtered against state.people for safety), assembling the expense object with id, description, cents, payer, and split, then resetting the form and re-rendering. I'm also outlining the render functions needed -- people list, payer/split options, balances, transfers, expenses, and errors -- plus making sure state gets saved on every mutation.

I'm writing a sync function that rebuilds the split checkboxes and payer dropdown while preserving which checkboxes were checked and which payer was selected, defaulting new people to checked. I realize rebuilding on every render would steal focus from the user mid-interaction, so I'm deciding to only call this sync function when the people list actually changes, like when someone is added.

Now I'm handling the rest: resetting an expense form keeps the payer but re-checks all split boxes, resetting the whole trip clears state and re-syncs everything, and I'm working out the balance calculation logic so each expense's cost gets split evenly among selected people (distributing any remainder cent by cent) and subtracted from their running totals while the payer's balance gets credited.

For displaying balances, I'm planning list items showing each person's name and whether they're owed, owe, or are settled up, with the amount formatted as currency. For the settle-up section, I'm structuring transfer suggestions like "Ben pays Ana $12.00," with fallback messages for when everyone's square or when there's no data yet, using a Map instead of a plain object to avoid any key collision issues with special property names.

Now I'm working through the full CSS styling — colors for the harbour/signal theme, typography pairing Fraunces for headings and Figtree for body text, card layouts, form inputs, chip-style person tags, expense and balance list rows, and focus states for accessibility.

I'm now writing the JavaScript logic: setting up element references, building an error-display system that shows validation messages tied to specific form fields with proper aria attributes, and handling the person-add form by trimming input, checking for duplicates case-insensitively, and pushing the new name into state.

