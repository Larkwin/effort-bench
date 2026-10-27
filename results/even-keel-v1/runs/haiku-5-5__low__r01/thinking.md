I'm planning the data model: storing people and expenses in localStorage, calculating each person's share by dividing costs evenly with remainder distribution, computing balances as paid minus owed, then working out a greedy settlement algorithm to minimize transactions.

I also need to handle input validation—parsing dollar amounts with proper decimal rules, requiring at least one person before adding expenses, trimming and deduplicating names case-insensitively, and surfacing a single clear error message near the form when something's invalid.

For rendering, I want to preserve form state carefully: keep the payer and typed values intact on error, reset description/amount but not payer on success, and rebuild the split checkboxes and payer dropdown whenever the people list changes while preserving existing checked/selected states.

Expenses should display newest first while stored chronologically internally, with removal by id. Balances and transfers display signed cents via Intl currency formatting, and I'm planning the overall visual styling—fonts, panel layout, colors for buttons and sections—plus escaping user input safely through DOM creation helpers rather than raw HTML strings.

Now I'm working through contrast ratios for button colors, input handling with decimal mode, and state management functions: loading/saving state, normalizing names, parsing currency strings into cents with careful regex validation, splitting shares among people, and computing running balances per person from the expense list.

I'm also designing the debt-settlement algorithm using a two-pointer approach between creditors and debtors, plus defining form validation order and error messaging for the expense entry flow (checking description, amount, payer, and split selection in sequence), along with how errors get displayed and cleared.

For the person form, I'm specifying name validation errors (empty name, duplicate name) and focus behavior on error. I'm also planning empty-state messages for the people list, expense list, balances section, and settle-up view, plus how to render balance and transfer line items with proper test IDs and dollar formatting.

Now I'm deciding the expense form stays enabled even without people, just showing an error instead, and I'm structuring the split-between section as a fieldset with checkboxes for accessibility. I'm also planning each expense's rendered text ("Paid by X. Split between A, B.") with a visible Remove button, plus responsive layout for narrow screens and the wordmark styling using Fraunces at 28px for the heading.

Writing HTML and CSS...

Adding button styles...

Writing more styles...

Adding more styles...

Now I'm sketching the expense form fields, then moving into the JS logic: setting up localStorage persistence with a versioned key, a load/save function pair with safe JSON parsing fallback, and a currency formatter for CAD.

Adding element creation helper...

No internal space collapsing needed. For the split checkboxes, I'll track unchecked names in a Set so toggles persist across rerenders, clearing it after each expense is added rather than persisting it long-term. For the payer select I'll preserve the current selection if still valid, otherwise default to the first person, and I'm sketching renderPeople and renderPayer/renderSplit as part of renderAll.

I decide it's simpler to just rebuild the people list and split checkboxes on every renderAll call rather than diffing, since interactions like adding/deleting people or expenses don't happen mid-typing anyway, so losing focus isn't a real concern. Now I'm writing the addExpense function: trimming and validating the description, parsing the amount into cents with error messaging for invalid values, validating the payer exists in state.people, and computing the split list from people not in the unchecked set.

Continuing to flesh out addExpense, I push a new expense object with a generated id, description, cents, payer, and split array, then save, reset the form inputs, clear unchecked, and re-render. I note that the split should be computed against the current state.people order at display time rather than stored order, since people are only ever appended and never removed, so this stays consistent.

I'm now writing a shares function that divides an expense's cents evenly among the selected split participants, distributing any remainder cents one at a time to ensure the total always sums correctly. Then I start sketching the balance and settle-up logic, separating people into creditors and debtors based on their net balance.

I'm working out the settle-up algorithm to greedily match debtors to creditors, transferring the minimum amount between them each time, advancing whichever side reaches zero first, and making sure everything stays in integer cents.

I'm planning the rendering details next: balance list items showing each person's name alongside whether they're owed money, owe money, or are even, with appropriate data attributes for testing; transfer list items describing who pays whom and how much; and expense list items showing description, amount, payer, and split info with a remove button. I also want empty-state hints, a form error display using an alert role for accessibility, and I'm making sure the "Fraunces" font family is included in the font stack before finalizing the code.

