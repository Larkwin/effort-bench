Build a small web app for the brand described below: **Even Keel**, a trip expense splitter. A group of friends adds the people on the trip, logs who paid for what, and sees who owes whom so everyone ends up even.

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
- Plain HTML, CSS and JavaScript in the one file. No frameworks, build steps, or external scripts. The only external resource allowed is the Google Fonts stylesheet for the two brand typefaces.

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

## Even Keel brand guidelines

**Who we are.** Even Keel keeps money between friends simple and fair. The personality is steady, honest and quietly confident: a well-made tool, not a game and not a bank.

**Wordmark.** "Even Keel" set in Fraunces 600, Harbour colour, with a short horizontal rule (24 × 3px, Signal) to its left. Under the wordmark, at most one short line of supporting text.

**Colour.** Use only these colours. Tints and opacity variants of them are not allowed.

| Name | Hex | Use |
|---|---|---|
| Harbour | `#1F3A4D` | Primary text, wordmark, headings, focus rings |
| Fog | `#5B6B75` | Secondary text, hints, metadata |
| Sailcloth | `#F6F3EC` | Page background |
| Paper | `#FFFFFF` | Panels, inputs, list surfaces |
| Rope | `#D9D2C3` | Borders and dividers |
| Signal | `#C2462B` | Primary action buttons only (with Paper text), and the wordmark rule |
| Kelp | `#2F6B4F` | Positive balances ("is owed") |

Owing money is normal, not an error: show negative balances in Harbour with a minus sign, never in red or Signal. Use Signal for nothing except primary buttons and the wordmark rule.

**Type.** Fraunces (600) for the wordmark and headings; IBM Plex Sans (400 and 500) for everything else. Load both from Google Fonts. All money amounts use tabular figures (`font-variant-numeric: tabular-nums`). Size scale: 14, 16, 20, 28, 40px. Sentence case everywhere: no Title Case, no all-caps labels.

**Layout.** A single centred column, max 720px wide, with 24px side padding on desktop and 16px on small screens. Spacing in multiples of 8px (4px allowed for tight pairs). Corner radius 6px on inputs, buttons and panels; no pill shapes. 1px Rope borders. No shadows, no gradients, no blur or glass effects. Transitions only for hover and focus, 150ms or less. Focus ring: 2px Harbour outline with a 2px offset.

**Voice.** Plain, calm and specific. Talk to the user as "you". Buttons are short verbs in sentence case ("Add person", "Add expense", "Remove"). Error messages say what to fix ("Enter an amount greater than $0."). Empty states say what to do next in one sentence. No exclamation marks, no emoji, no jokes, no filler like "Oops" or "Awesome".

**Don't.** No marketing hero, feature cards, testimonials or footer credits. No sample or placeholder data pre-filled. No icons unless they clarify an action; if used, simple inline SVG line icons in Harbour.
