I'm working out the color palette — a navy and signal red against a warm paper background — and checking contrast ratios to make sure the text colors remain accessible.

For balances, I'm leaning away from red-for-alarm framing since owing money shouldn't feel punitive; instead I'm thinking of a centered scale visual with navy for "owed" and a muted ochre for "owes." For typography, I'm debating between serif options like Fraunces or Source Serif for headings paired with something plain and honest like Public Sans for body text and numbers.

I'm now working through the full app structure: data model, split logic (dividing cents evenly with remainder distribution), validation rules for names and amounts, settle-up algorithm (greedy debtor/creditor matching), and all the copy for errors and empty states. I'm being careful about accessibility details — avoiding stray text content in avatar chips and remove buttons, using aria-live regions for errors, and ensuring focus management after actions like removing an expense or person. I'm also drafting the specific wording for validation messages and empty states to keep the tone warm and non-alarming throughout.

