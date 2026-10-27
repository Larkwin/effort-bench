I'm planning the full app structure: adding people with validation, tracking expenses with split calculations using integer cents to avoid rounding errors, computing balances, and implementing a greedy debt-settlement algorithm, all persisted to localStorage with proper money formatting.

For the design, I'm picking a warm off-white background with navy text and a signal-red accent color, pairing Fraunces for headings with Inter for body text, and checking contrast ratios to make sure everything meets accessibility standards.

I'm deciding to keep the people list simple without a removal feature since that adds complexity and risk without being required. For amount validation, I'll use a strict regex pattern with text input and decimal inputmode to control formatting while keeping the parsing logic simple.

For the split checkboxes, I'll rebuild them whenever people change, defaulting everyone to checked rather than trying to preserve prior unchecked states—this keeps the logic simpler even if it resets some user selections. After submitting an expense, the form resets fully: description and amount cleared, all checkboxes checked again, and payer selection reset too.

For errors, I'll dynamically render an error element with data-testid="form-error" only when there's something to show, rather than toggling visibility on a permanent node. For settling debts, I'll sort debtors and creditors, then use a two-pointer greedy match to minimize transfers to at most n-1.

Balances display will use data-cents per person with "is owed"/"owes" phrasing, and "settled" when the amount is zero. Expense shares split evenly with the remainder cents distributed to the first few selected people in order, and everything persists to localStorage under a versioned key storing people and expense records with payer and split info.

For layout, I'm planning a responsive grid with people and the expense form on one side, and expenses/balances/settle-up on the other, stacking on mobile. Checkboxes stay native for accessibility with styled focus states rather than custom chip replacements, and I'm adding empty-state messaging like prompting the user to add their first person. Starting to write the actual JavaScript now...

Setting up local storage persistence...

Now I'm planning the balances/settle calculation logic and the rendering functions for people, expense forms, expenses list, balances, and settlement suggestions, plus focus management after adding items and HTML-escaping for user-entered names.

Writing checkbox and ID generation logic...

I'm also setting up the fonts and CSS styling, then writing the full implementation.

