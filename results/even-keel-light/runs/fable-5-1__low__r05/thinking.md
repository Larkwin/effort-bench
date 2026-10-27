I'm planning out the full app structure: adding people with validation, expenses with split logic that distributes remainder cents fairly, balance tracking with data attributes, and a greedy settle-up algorithm to minimize transactions.

For styling, I'm going with harbour navy and signal red-orange colors, pairing Fraunces for headings with Inter for body text, keeping the CSS compact but responsive down to 360px with proper accessibility.

For amount parsing, I'm handling it as strings to avoid floating-point issues, validating two decimal places, and converting to cents before doing the equal-split math with remainder distribution based on the order people were added. I'm also making sure expense form errors preserve the user's input rather than clearing it, and that split checkboxes stay in sync when new people are added.

Now I'm structuring the app itself: a header with the Even Keel name, a main grid of sections for People, Add Expense, Expenses, Balances, and Settle Up, with state tracking people and expenses, and using Intl.NumberFormat for CAD currency display with signed cent values for balances.

