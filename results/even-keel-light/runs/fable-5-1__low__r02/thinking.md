I'm planning out the full HTML structure: handling people management with validation, expense entry with payer/split logic using integer cents and leftover distribution in trip order, and a balances section with settle-up calculations.

For settle-up, I'll use a greedy algorithm pairing debtors and creditors, which guarantees at most n-1 transfers. I'm also deciding on fonts (Fraunces for headings, Inter for body), currency formatting via Intl, localStorage persistence, and amount validation that strips currency symbols/commas and checks decimal precision without float rounding issues. I'll keep invalid form input visible rather than clearing it, dynamically render error elements only when needed, and skip person removal to keep the data model simple.

Now I'm planning the checkbox behavior for expense splitting (new people default to checked, resetting after each expense), the two-column grid layout for people/expenses/balances/settle-up sections, and the localStorage schema for people and expenses. I'm working out balance computation by distributing remainder cents fairly among split participants, ordering the expense list newest-first, handling empty-state messaging, and checking color contrast ratios for the chosen palette.

Writing focus and color styles...

