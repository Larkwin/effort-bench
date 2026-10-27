I'm planning the full HTML structure, covering validation rules for adding people and expenses—trimmed unique names, positive amounts with at most two decimals, payer selection, and split checkboxes defaulting to checked—plus how to handle cents rounding and remainder distribution among selected people in the order they joined the trip.

Now I'm working out balances as paid minus share, and a greedy settle-up algorithm that sorts debtors and creditors to produce the minimum number of transfers. I'm also deciding on formatting money with Intl.NumberFormat for CAD, persisting state in localStorage, and handling empty states and responsive accessible layout down to 360px.

For visual personality I'm choosing Fraunces for display type and IBM Plex Sans for body text with tabular numerals, paired with a warm off-white background, deep harbour blue for primary text, and a muted signal red/teal pairing for negative/positive balances, checking contrast ratios as I go.

I'm checking WCAG contrast ratios for the signal red and harbour blue against white backgrounds by computing relative luminance manually, confirming both clear AA thresholds for text and button use. Now I'm sketching the grid layout — header plus a two-column arrangement for people/add-expense on one side and the expense list, balances, and settle-up on the other, collapsing to a single column on mobile — and defining the regex-based amount validation that converts valid decimal strings into integer cents.

I decide to use a text input with inputmode="decimal" instead of a number input to preserve exactly what the user typed and avoid number-input quirks, then sketch the expense data shape storing id, description, cents, payer, and the split array ordered by the people list so share calculations stay consistent.

For dividing costs, I compute a base share via integer division and distribute the remainder cents to the first few people in order so totals reconcile exactly. For settling up, I calculate each person's balance as paid minus owed, then greedily match creditors to debtors (sorted by amount) to minimize the number of transfers, which keeps transactions to at most n-1. I also plan to only render the error element when there's actually an error to show, rather than always rendering it hidden.

I'll keep expense form errors simple by surfacing just the first validation issue rather than listing everything, and mark the relevant inputs as aria-invalid for accessibility. The render function will need to redraw the people list, payer dropdown, and split checkboxes while preserving which people are currently selected, defaulting new additions to selected as well.

For deletion I'll just remove expenses directly without a confirmation step. For empty states, I'm drafting friendly placeholder text for each section—people, expenses, balances, and settling up—so the app doesn't feel broken before any data exists.

The expense form should stay enabled even without people, but show a message prompting the user to add someone first; attempting to submit with no people should fail validation. I'll persist state under a single localStorage key storing people and expenses together, make sure accessibility basics like labels and focus outlines are in place, and add an optional "Clear trip" reset button with a confirm dialog in the header, alongside a dark header band with the Even Keel wordmark and tagline.

Now I'm picking the color palette: a warm off-white background, white cards with a subtle border, Fraunces for headings, and tabular numerals for figures. I'm verifying contrast ratios for accent colors—checking that the teal green used for positive amounts and the muted gray text both meet accessibility contrast thresholds against the white background.

Now I'm sketching the page structure: a topbar with branding and a reset button, and a main grid with cards for the people form/list, expense form, and results list.

For the layout, I'm using a two-column CSS grid on desktop (People/Add Expense on the left, Expenses/Balances/Settle on the right), collapsing to a single stacked column with named grid-template-areas for mobile.

For the JS, I'm setting up a currency formatter for CAD and planning out an amount-parsing helper.

Writing amount validation logic...

I'll need an HTML escaping helper, then build out the expense list items showing description, amount, payer, and split participants, with a delete button labeled per expense. For balances I'll show each person's name with colored owed/owes/even status, and for settling up I'll format transfer suggestions like "Ben pays Ana $12.00" before assembling everything together.

