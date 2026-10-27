I'm sketching out the data model for Even Keel: people need unique trimmed names with inline validation errors, and expenses need a description, amount in CAD validated to two decimals, a payer dropdown, and split checkboxes defaulting to everyone selected.

For math, I'm working out integer-cents splitting with leftover pennies distributed to the earliest-added selected people, and listing expenses newest-first with description, amount, payer, split, and a remove button. For balances, I'm computing paid-minus-share per person with test attributes for cents and person, then designing a greedy settle-up algorithm that matches largest debtor to largest creditor, which guarantees at most n-1 transfers since each transfer zeroes out at least one party. I also need to handle currency formatting with Intl.NumberFormat for en-CA and persist everything to localStorage.

Now I'm thinking through responsive and accessibility requirements, then moving into visual design — picking a navy and red-orange palette and weighing typeface pairings that feel steady and trustworthy, like a serif for headings paired with a clean sans for UI, with tabular figures for numbers.

Deciding on "Source Serif 4" for headlines and large amounts paired with "IBM Plex Sans" for UI elements, since Plex Sans carries an engineering sturdiness and supports tabular numerals well, giving a nice mix of serif warmth and plain-spoken clarity.

Now I'm settling on the palette — a navy "Harbour" primary and a rust-red "Signal" accent — and running contrast calculations to confirm the Signal color reads accessibly against white backgrounds.

Checking contrast ratios against the off-white background too, since Signal text there came in just under the AA threshold, so I'm darkening the accent slightly to a variant like `#AD3F26` to make sure it holds up.

With that resolved, I'm settling the palette: Signal (#C2462B) works well as the warm accent for buttons and emphasis, with Harbour navy (#1F3A4D) as the primary brand color — its contrast against white is excellent (nearly 12:1), so it's a strong choice for primary actions and text.

For the page background I'm leaning toward a warm sandy off-white (#F5F3EE) with white cards, dark navy ink (#182B3A) for body text, and a muted slate (#51616E) for secondary text — checking that it clears accessible contrast against the background. Now I'm thinking through how to color positive versus negative balances, wanting to avoid framing "owing money" as alarming, so I'm weighing whether Signal or Harbour should represent "owed" versus "owes."

Settling on green for "gets back" (#1F6F4A on pale green tint) and Harbour navy for "owes" (instead of red), since the brand philosophy treats owing as normal rather than a problem. That leaves Signal dedicated purely to action elements — primary buttons, the logo, focus rings — keeping the palette coherent. I'm double-checking the Signal red-orange's contrast ratio against white text for button accessibility, confirming it clears 4.5:1 by a narrow margin, and deciding to use a darker hover state as a safety buffer.

I'm now debating whether both "Add expense" and "Add person" should be Signal-filled buttons or whether one should be Harbour to avoid visual competition, eventually leaning toward both being Signal with a quiet ghost-style delete button elsewhere.

I'm sketching the page layout — header, then stacked sections for People, Add Expense, Expenses, Balances, and Settle Up — with a two-column desktop grid where the summary (Balances/Settle Up) sits in a sticky right column while forms and the expense list occupy the wider left column, using the same DOM order for mobile.

Moving to the data model, I'm structuring state as a list of people and a list of expenses with payer and split references, debating whether to key people by id or by their (unique, case-insensitive) name, and leaning toward names for simplicity since there's no renaming feature.

I'm weighing whether to allow removing a person, deciding it's only safe when they're not involved in any expense, and planning to isolate the person's name in its own test-id'd element so a sibling remove button doesn't pollute the text content that tests might check. I'm applying the same reasoning to expense delete buttons, keeping them inside the expense card without corrupting the testable content.

I'm also considering a "clear trip" / start-over action with an inline two-step confirmation instead of a native browser confirm dialog, for a cleaner feel.

Finally, I'm working out how validation error messages should render — specifically whether to conditionally mount the error element or toggle a hidden attribute — since that choice affects how test queries would detect its presence or absence.

