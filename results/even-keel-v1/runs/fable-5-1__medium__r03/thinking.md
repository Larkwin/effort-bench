I'm planning the full app structure: form validation for people and expenses, integer-cent math with remainder distribution by join order, balance tracking with data attributes, a greedy settle-up algorithm, localStorage persistence, and locale-aware currency formatting, all styled responsively within the brand palette.

I'm also deciding on practical details: using a text input with decimal validation for amounts so I can parse cents precisely, preserving user input on validation errors instead of clearing it, skipping person removal to avoid complexity with existing expenses, and keeping split checkboxes and payer selection stable across re-renders while defaulting new people to checked. I'm figuring out how to surface validation errors accessibly, likely toggling a data-testid error element with an alert role only when needed.

For the settling logic, I'm using a greedy two-pointer approach between sorted debtors and creditors to minimize transfers, and I'm computing fair shares by dividing cents evenly with the remainder distributed to the first people in order. I'm structuring data as arrays of people and expenses with payer/split info, rendering newest expenses first, and laying out the page with distinct panels for people, expenses, balances, and settle-up using a paper-and-rope visual theme with specific fonts, focus styles, button colors, and contrast choices.

Now I'm checking color contrast ratios between text and background colors — verifying Fog against Sailcloth and Paper, and starting to check Kelp against white to make sure everything meets accessibility standards.

For displaying balances, I'm thinking of showing the person's name, a signed dollar amount, and a status label like "is owed," "owes," or "settled," using the Kelp and Harbour colors for positive/negative amounts. Expense list items will show description, amount, who paid, who it's split between, and a remove button — now I need to think through responsive behavior for the form.

For small screens I'll keep the form as a single column grid, widening to multiple columns with auto-fit minmax sizing on larger screens, making sure inputs have full width and min-width zero so nothing overflows. I'm also planning empty-state messages for each section — prompting to add people first, then log an expense, then showing balances only once there's data, and a "Everyone is even" message when settled. For the split checkboxes, I'll wrap them in a fieldset with a "Split between" legend and attach the test id to the inner container for accessibility.

Validation will show one error at a time in a fixed order — description, amount, payer, then split selection — each tied to aria-invalid on the relevant field, and I'll keep the payer select enabled by default rather than disabling the whole form when there are no people yet. After a successful submission I'll clear the description and amount, reset the split checkboxes to all-checked, keep the last payer selected, and refocus the description field. I'm also settling on a localStorage key and wrapping reads/writes in a try/catch for safety before moving into writing the actual render logic.

Writing HTML structure and styles...

I should fix the gap to 8px instead of 12 to stay on the spacing scale, and keep panel padding at 16px. Now I'm writing the app's state management logic, setting up localStorage persistence with a storage key, load/save functions, and a currency formatter for the expense tracker.

For parsing dollar amounts, I'm validating the input string carefully (stripping dollar signs and commas, enforcing at most two decimal places, rejecting zero or empty values) before converting to integer cents for precise arithmetic. Next I need to work out how shares get split across people for each expense.

I'm computing balances by iterating expenses—adding what each person paid and subtracting their share—then settling debts using a greedy algorithm that sorts creditors and debtors by amount and matches them with a two-pointer approach. I'm also writing helper functions to show and hide validation errors, setting ARIA attributes and focus so screen readers announce the error properly.

Now I'll move on to building out the HTML structure.

