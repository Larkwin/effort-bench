I'm planning out a single-file expense tracker app: adding people with validation for uniqueness and non-empty names, and setting up expense entry with description, amount, payer, and split logic that distributes cents evenly with remainders going to specific people.

For balances and settling up, I'm designing a greedy algorithm that matches debtors against creditors, ensuring the number of transfers stays at most n-1 since each transfer zeroes out at least one balance and the final transfer zeroes two at once.

Now I'm planning the visual design around the Even Keel brand — a warm paper background with deep navy ink text, checking contrast ratios of the Signal warm red-orange against white to make sure it meets WCAG AA requirements for accessibility.

Checking the Signal color against paper background, I find it falls just under 4.5:1, so I'll reserve it for white-text buttons rather than small text on paper. For error states, I'm testing a darker red like #9E3420, calculating its luminance to make sure it holds proper contrast against pale backgrounds.

I'm deciding to avoid alarming red for "owes" balances since owing money between friends should feel neutral, not like a problem, so I'm leaning toward calmer teal/warm tones for both directions of balance.

For typography, I'm pairing Fraunces (a warm editorial serif) for headings with Instrument Sans or Figtree for body text, using tabular figures for money display via font-variant-numeric.

I'm sketching the layout: a header with an "Even Keel" wordmark and a simple SVG logo suggesting balance, then a main app structure with a People section (name input, add button, inline validation error that only renders when needed) and an Expenses section. I'm deciding against letting users remove people to avoid cascading complexity with existing expenses, keeping scope tight to the spec.

I'm working through how the expense form should behave when people are added or missing — new people get checked by default in the split, existing checkbox states persist, and if no one's been added yet I'll show an inline error rather than disabling the form. The form resets description, amount, and split selections after a successful submission while keeping the payer selected for convenience.

Now I'm designing careful amount validation: stripping dollar signs and commas, matching decimal formats, catching empty or malformed input with friendly messages like "Enter a number, like 42.50," checking for more than two decimal places, and converting to cents while guarding against unsafe or excessively large values. I'm also starting to think through payer validation requirements.

