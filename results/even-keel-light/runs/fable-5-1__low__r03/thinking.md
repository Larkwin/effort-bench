I need to plan out the full single-file app: people management with validation, expense entry with cent-precision splitting and remainder distribution in trip order, newest-first listing with delete, balance calculations with proper data attributes, a settle-up algorithm minimizing transfers, and CAD currency formatting with localStorage persistence.

For styling I'm leaning toward Fraunces for headings paired with Inter for body text, using tabular numbers for money, with a harbour navy and signal red-orange palette, plus empty states and responsive support down to 360px with accessibility in mind.

For amount input, I'll use a text field with decimal inputmode and regex validation requiring up to two decimal places, computing cents directly from the string split rather than floating-point math to avoid rounding errors, then handling balances as paid minus share in cents with a greedy settle-up algorithm sorting creditors and debtors.

No person deletion is needed, and balances should display for everyone including zero amounts. Form errors render as elements that only appear while active, payer selection persists across re-renders, and split checkboxes default to everyone checked, with new people added as checked while preserving existing selections -- resetting to all-checked after a successful expense submission.

I'm keeping the expense form enabled even with no people present, showing a validation message on submit instead of disabling it. Now I'm planning the layout as a responsive grid with people/expense entry on one side and expenses/balances/settle-up on the other, picking out a color palette (harbour blue, signal orange-red, cream background) that meets contrast requirements, before moving into writing the actual JavaScript.

Writing state model and logic...

