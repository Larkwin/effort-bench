I'm planning the full single-file app structure: handling person entries with validation, expenses with payer/split logic using integer cents and leftover distribution by add-order, plus how balances will be calculated and displayed.

For settlement, I'm designing a greedy algorithm pairing creditors and debtors to minimize transfers to at most n-1. I'm also deciding on fonts (Fraunces for headings, Inter for body), amount validation via regex to avoid floating-point errors, and how error messages should appear/disappear based on form validity. Skipping person deletion to keep scope manageable.

For expenses, I'm defining the data shape with id, description, cents, payer, and split array, then computing shares by distributing cents evenly across split members with remainder going to the first few in people order. I'm working through form reset behavior — clearing description and amount after successful submission while resetting split checkboxes to all-selected, and re-rendering the payer/split UI whenever the people list changes. I'm also checking color contrast for the accent color (a reddish-orange) against white text to ensure accessibility.

For styling, I'm choosing a warm off-white background with a dark harbour-navy text color and muted secondary text, verifying all pass contrast guidelines. I'm laying out the page as a two-column grid on desktop (people/add-expense on the left, expenses/balances/settle on the right) collapsing to a single column on mobile, with a visible focus outline using the accent color. Now I'm writing the balance display logic, showing "is owed" for positive amounts, "owes" for negative, and "even" for zero.

Now I'm deciding to keep the add-expense form always visible even when there are no people yet, showing a submit-time error instead of disabling the form, and starting to write the state management code for loading and persisting data from localStorage...

Continuing with render functions for people, expense form, expense list, balances, and settlement summary, plus an HTML escaping helper and a robust amount parser that validates dollar strings and converts them to integer cents.

For the amount input I'm using a text field with decimal input mode rather than a number type, since that lets me preserve exactly what the user typed instead of losing invalid entries. For the settle-up algorithm, I'm separating people into creditors and debtors, sorting them by amount, then greedily matching the largest debts against the largest credits to minimize the number of transactions needed.

