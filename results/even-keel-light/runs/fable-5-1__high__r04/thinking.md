I'm planning the data model and validation rules: people need unique trimmed names, expenses need valid descriptions and amounts, with equal splits computed in cents and remainders distributed to selected people in the order they joined the trip, listing expenses newest first with removal support.

For balances I'm using paid-minus-share per person, and for settle-up I'm applying a greedy max-creditor-vs-max-debtor algorithm to guarantee at most n-1 transfers, formatting money with Intl.NumberFormat in CAD, persisting to localStorage, and handling empty states and responsiveness down to 360px.

For visual design, I'm settling on Fraunces for headings paired with IBM Plex Sans for body text, since Plex Sans supports tabular figures for clean money alignment, built around the navy and red-orange palette.

Now I'm checking the contrast ratio of the signal red-orange against a warm off-white background to make sure text stays accessible.

Contrast against the off-white background comes to about 4.51:1 — just barely passing. Given how marginal that is, I'll go with a darker red variant for text on light backgrounds, keep the standard signal red for buttons with white text since that passes comfortably, and consider using the navy as the primary button color instead for safer contrast.

That contrast ratio looks solid against white, around 11.9:1. I'm thinking Signal could work as an accent for "owes" amounts with a darker shade for better text contrast, plus for error messages and focus rings. For "is owed" I'm considering a sea-green/teal tone instead, and I'm working through its luminance calculation to check contrast against the off-white background.

Now checking a muted gray-blue text color (#5B6B77), running through its luminance math to confirm it passes contrast requirements against the off-white background.

For layout, I'm planning a header with the "Even Keel" wordmark and tagline, then a two-column desktop grid — people/add-expense on the left, expenses/balances/settle-up on the right — collapsing to a single stacked column on mobile.

On mobile I'd reorder the sections using grid-template-areas so the flow reads People, Add expense, Expenses, Balances, Settle up. I'm sketching the data model as people identified by unique names and expenses storing description, amount, payer, and split list, deciding to skip person deletion for now since removing someone with existing expenses tied to their name would complicate things unnecessarily.

For splitting, I'll order selected participants by their original trip order and distribute the amount by giving the first few people (equal to the remainder) one extra cent so the cents always add up exactly. Balances are each person's total paid minus their total share, and settling up works by matching the biggest creditor against the biggest debtor repeatedly, zeroing out at least one side each round, which guarantees no more than n-1 transfers are needed.

For validating the amount input, I'm stripping dollar signs, commas, and whitespace, then checking it matches a plain number with at most two decimal places, converting to integer cents via string splitting to avoid floating-point errors, and requiring the amount to be strictly positive with a helpful error message if not.

I'm using a text input with decimal inputmode so values like "12.345" actually reach my validation instead of being blocked by a native number input. For the error display, I'll dynamically insert and remove a paragraph with role="alert" and the form-error test id, linking it to the input via aria-describedby and toggling aria-invalid so screen readers announce problems properly.

For the expense form, I need the payer dropdown and split checkboxes to rebuild whenever the people list changes, preserving existing selections while defaulting new people to checked.

If there are no people yet, I'll keep the form visible but disable the payer select with a placeholder, and show a clear error message if someone tries to submit without anyone added. For validation I'm checking description, amount, payer, and split selection in order, surfacing one error at a time while keeping the entered values intact.

For each expense item I'll show the description, amount, who paid, and who it's split between by listing names explicitly, plus a remove button labeled with the expense description. For the balance list, I'll format each person's balance with plain wording like "owes $12.50", "is owed $12.50", or "all square" instead of showing raw signed numbers.

I'm defining the settle-up suggestion text as "X pays Y $amount", along with empty-state messages for no people, no expenses, and all-even balances/settle screens. I'll also show the trip total in the expenses header, persist data under a versioned localStorage key with safe loading, and start building the responsive grid layout CSS.

For the layout, I'm deciding between grid-template-areas or two flex columns — leaning toward two wrapper divs (left: People + Add expense, right: Expenses, Balances, Settle) so mobile stacking follows natural DOM order while desktop splits into two aligned columns, and I'm weighing whether Balances deserves more visual prominence since the core value is seeing who owes whom.

Actually I'll merge Settle up into a single "Where things stand" card with balances and settle-up transfers together, then an Expenses card below. I'm also adding a small "Clear trip" footer button with a confirm dialog, and designing the wordmark "Even Keel" in Fraunces with a simple keel-like mark and a tagline about splitting costs evenly. For currency, I'm formatting cents into CAD dollar amounts using Intl.NumberFormat.

I'm making sure labels stay visible, grouping the split checkboxes in a fieldset/legend, giving focus states a clear 3px outline, and keeping buttons at least 44px tall for touch targets. On mobile I want to avoid horizontal scrolling by constraining widths and allowing long text to wrap.

Writing HTML skeleton...

Building the expense form markup...

I'm adding the footer and finishing the fieldset for expense splitting, plus "Select everyone"/"Clear" toggle buttons for convenience. Now I'm starting the JavaScript with storage setup, currency formatting helpers, and a load function that reads from localStorage.

I'm writing the save function and a shares function that divides an expense's cents evenly among selected people, distributing any remainder cent-by-cent to preserve people-order consistency, confirming order stays stable since people are never removed.

Now I'm sketching balances calculation by tracking paid vs. owed share per person, then a settle function that greedily matches creditors to debtors sorted by amount to minimize the number of transactions.

Next I'm outlining the render functions (people, expense form, expenses list, balances) plus error display helpers, and starting the add-person handler that validates the input isn't empty and isn't already a duplicate name.

Then I'm detailing the add-expense handler to validate and push a new expense record with an id, description, amount, payer, and split before resetting the form, plus setting up event delegation for deleting expenses and adding a live region for screen-reader status announcements.

Now I'm defining the CSS color palette and font variables for the harbour theme, then styling the masthead with a dark harbour background, white serif wordmark, and a boat-shaped keel mark icon.

I'm designing the card components with white backgrounds, subtle borders, rounded corners, and Fraunces headings, then setting up balance rows with tabular numbers colored by status (owed, owes, even), and formatting transfer entries as readable sentences like "Ben pays Ana $12.50."

Now I'm defining button styles—primary filled with harbour color, secondary ghost outlines, danger text in signal-ink—plus focus-visible outlines for accessibility, and working through input border colors to hit the 3:1 contrast ratio required for non-text UI elements.

For the amount field I'm planning a "$" prefix adornment wrapped alongside the input, and for the people list I'm considering pill-style chips possibly with numbered markers, since the order people were added matters for how rounding gets distributed.

Each expense item shows description, amount, who paid, and who it's split between, with a remove button, laid out in a two-row grid so the amount sits right-aligned on top and the remove button sits near the meta line below. I'm using a list formatter to join names naturally like "Ana, Ben and Cho," plus singular/plural count labels like "1 person" vs "3 people," and I'm also planning a clear-trip button for the footer.

To avoid injection risks I'll build DOM nodes with createElement and textContent rather than raw HTML strings, using a small helper for constructing elements with attributes and children. For the expense form, the payer select should default to the first person and new-person checkboxes should start checked, and when re-rendering I need to preserve existing checkbox states and valid select values rather than resetting them every time the state updates.

Writing error display and clear logic...

For the amount field, I'm thinking through combining the hint text with error messages in aria-describedby, storing the base hint id separately so I can restore it when errors clear, and clearing errors automatically on input events. Now I'm starting the amount parsing function, stripping dollar signs and whitespace before validating the format.

Still writing parser...

I also want to cap unrealistic amounts and give a distinct "Enter an amount" message for empty input versus other validation failures.

Now I'm sketching the overall markup and styles: a responsive wrapper with a two-column grid layout, custom checkbox accent colors matching the harbour theme, and a footer noting that everything stays local with a clear-trip button.

For the people list, I want the visible text to equal just the name for testing purposes, so I'm avoiding putting initials directly in the markup — instead using a CSS `::before` pseudo-element with `attr(data-initial)` to render the avatar letter without it showing up in textContent, keeping it aria-hidden.

Now I'm writing the base CSS styles for the page foundation...

Still writing card and form styles...

Still writing button and pill styles...

Still writing styles...

Still writing checkbox styles...

Setting up constants for currency formatting and storage, then writing the state loading logic that validates and sanitizes saved people/expenses data...

Building out the expense form rendering logic...

I'm deciding to skip disabling the add button when there are no people, favoring an error message instead for better accessibility feedback. Now I'm starting on the expense form's submit handler, validating the description field by trimming its value.

Continuing validation logic...

After validating payer and split selection, I push the new expense to state, save, re-render, reset the form fields, and announce the addition for accessibility before focusing back on the description field. I need to make sure the reset happens before re-rendering so the checkbox states get properly reinitialized.

For deletion, I'm filtering out the removed expense, saving, re-rendering, announcing the removal, and shifting focus to the expenses heading using a tabindex. Now I'm starting the balances rendering function, clearing the balance and transfer lists and showing an empty state message when there are no people yet.

I'll hide the settle subsection when empty by toggling a hidden attribute, then loop through each computed balance to build list items showing name, owed/owes status with color classes, and the formatted amount...

Now I'm planning the grid layout so the name sits top-left, the status text sits below it, and the amount column spans both rows vertically centered, with $0.00 shown for anyone who's all square.

For the transfers section, I need to handle three cases: no expenses yet, expenses but everyone's even, or an actual list of settlements. I'm also setting the header to show expense count and total, wiring the clear-trip confirmation to reset state and refocus the name field, and making sure the status announcer clears briefly before showing a new message so screen readers pick it up, plus clearing form errors on input and letting Enter submit the person form.

With rounding verified to follow people-order for leftover cents, I'm now putting together the final markup, adding a color-scheme meta tag, and designing a small boat-themed SVG icon with rounded white strokes for the hull and waterline.

