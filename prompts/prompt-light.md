Build a small web app for **Even Keel**, a trip expense splitter. A group of friends adds the people on the trip, logs who paid for what, and sees who owes whom so everyone ends up even.

Deliver one complete, self-contained HTML file. Reply with the HTML document only, starting at `<!doctype html>`. No explanation before or after it.

## What the app must do

**People**
- Add a person by name. Names are trimmed, cannot be empty, and must be unique ignoring case ("ana" is a duplicate of "Ana"). Show a clear inline message when a name is rejected.
- List everyone on the trip.

**Expenses**
- Add an expense with: a description (required), an amount in Canadian dollars (required, greater than 0, at most 2 decimal places), who paid (one person), and who it's split between (one or more people; everyone is selected by default).
- The amount is split equally between the selected people. Work in integer cents. When the cents don't divide evenly, give the leftover cents one each to the selected people in the order they were added to the trip, so the shares always add up exactly to the amount.
- List expenses, newest first, each with description, amount, payer, and who it was split between. Each expense can be removed.
- Reject an invalid expense with a clear inline message and keep what the user typed.

**Balances and settling up**
- Show each person's balance: total they paid minus their total share. Positive means they are owed money; negative means they owe.
- Show a "Settle up" list of transfers (who pays whom, how much) that brings every balance to zero, using at most one fewer transfer than the number of people with a non-zero balance.

**General**
- Format money as Canadian dollars (for example `$1,234.50`), using `Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' })`.
- Save everything in `localStorage` so a page reload keeps the trip.
- Useful empty states before there are people or expenses.
- Works well from 360px wide (no horizontal scrolling) up to a desktop browser.
- Accessible: every input has a visible label, everything works by keyboard, focus is always visible, text meets WCAG AA contrast.
- Plain HTML, CSS and JavaScript in the one file. No frameworks, build steps, or external scripts. The only external resources allowed are Google Fonts stylesheets.

## QA hooks (required)

Automated tests drive the app through these attributes. Use them exactly; you may add any other markup you like.

| Element | Attribute(s) |
|---|---|
| The `<main>` element wrapping the app | `data-testid="app"` |
| Person name input | `data-testid="person-name"` |
| Add person button | `data-testid="add-person"` |
| Each person in the people list | `data-testid="person"` |
| Expense description input | `data-testid="expense-desc"` |
| Expense amount input | `data-testid="expense-amount"` |
| Payer `<select>` (option `value` = person's name) | `data-testid="expense-payer"` |
| Container of the split checkboxes | `data-testid="expense-split"`, containing one `<input type="checkbox">` per person whose `value` is the person's name |
| Add expense button | `data-testid="add-expense"` |
| Each expense in the list | `data-testid="expense"` |
| Remove button inside each expense | `data-testid="delete-expense"` |
| Each person's balance | `data-testid="balance"` plus `data-person="<name>"` and `data-cents="<signed integer cents>"` |
| Each settle-up transfer | `data-testid="transfer"` plus `data-from="<name>"`, `data-to="<name>"`, `data-cents="<positive integer cents>"` |
| Any inline validation message, while shown | `data-testid="form-error"` |

## Even Keel

**Who it's for.** Groups of friends sorting out the costs of a trip together, often on a phone, sometimes passing one laptop around a table at the end of the week.

**What it should feel like.** Even Keel keeps money between friends simple and fair. It is steady, honest and quietly confident: a well-made tool people trust, not a game and not a bank.

**Anchor colours.** Harbour `#1F3A4D`, a deep navy, and Signal `#C2462B`, a warm red-orange. Build the rest of the palette around them.

**Type.** Choose typefaces from Google Fonts that suit the personality.

**Voice.** Plain, calm and specific. Talk to people as "you".

**One principle.** Owing money between friends is normal, not a problem.

**Scope.** This page is the tool itself, not a marketing site.

Design it the way a strong product designer would for this brand: make deliberate choices about type, colour, spacing and hierarchy that express who Even Keel is, rather than reaching for a default look.
