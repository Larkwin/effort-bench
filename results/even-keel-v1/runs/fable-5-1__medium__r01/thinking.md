I'm planning the full HTML structure: a header with the app title, then sections for managing people, tracking expenses with split options, computing balances, and settlement details.

For the data model, I'll keep people and expenses in state persisted to localStorage, validate amounts to two decimal places, and compute splits using integer cents with remainder distribution so totals always reconcile exactly. Balances come from paid-minus-share per person, and I'll implement a greedy settle-up algorithm that pairs creditors and debtors to minimize the number of transfers needed—keeping person removal out of scope to stay simple.

I'm tracking an unchecked-names set so new people default to checked while preserving other selections across rerenders, and I'll make the form error element conditionally rendered with aria-live for accessibility, along with proper labels, fieldset/legend grouping, and focus styles. For layout I'm using a responsive grid that collapses at narrow widths, and formatting money with Intl.NumberFormat in CAD while deciding how to represent negative balances.

I'm drafting the empty-state copy for each section (no people, no expenses, no balances, settled-up states), rendering expenses newest-first by reversing the stored array, and setting a type scale (14/16/20/28/40px) for headings and buttons. I'm building DOM nodes directly with textContent rather than innerHTML to avoid any HTML injection from names, with the payer select defaulting to the first person or preserving prior selection.

Starting to write the storage key constant...

Now I'm defining a currency formatter using Intl.NumberFormat for CAD, an amount parser that validates the string format and converts dollars/cents into integer cents, and the validation error messages for empty names, duplicate names, empty descriptions, and invalid amounts.

I'm also writing a settle-up algorithm that separates balances into creditors and debtors, sorts each by amount, then greedily matches the largest debtor against the largest creditor to minimize the number of transactions needed.

With shares always computed in trip order, I'm now finalizing styling details like focus outlines and button color schemes for primary and secondary actions.

Now planning the expense list item layout, showing description, amount, and a meta line with payer and split info, plus a remove button. Time to start writing the actual HTML, keeping it concise.

