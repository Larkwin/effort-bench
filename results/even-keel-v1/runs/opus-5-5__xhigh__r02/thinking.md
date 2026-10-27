I'm planning out the data model and validation rules: unique names for people, required expense fields with amount validation, and an equal-split algorithm that distributes rounding remainders in cents to the earliest-added participants.

For balances I'll compute paid minus share per person, then settle debts with a greedy largest-debtor-to-largest-creditor matching that keeps transfers to at most n-1. I'll use Intl.NumberFormat for CAD currency display, letting the formatter's built-in hyphen-minus handle negative balances, and I still need to cover localStorage persistence, empty states, responsive layout at 360px, and accessibility basics like visible labels and focus states.

I'm double-checking color contrast ratios between my palette choices (Fog, Sailcloth, Paper, Kelp) to make sure text stays readable against backgrounds and meets AA standards.

Now I'm checking the Signal red against Paper, confirming it still clears 4.5:1 for normal text, and I'm running into a problem with the Rope border color — it's too light to meet the 3:1 non-text contrast WCAG requires for identifying input boundaries, so I'm weighing whether Fog could serve as an alternative border color instead.

Given the task requirement only explicitly specifies text contrast, I decide Rope borders are technically compliant even if faint, and since the brand spec designates Rope specifically for "Borders and dividers" while Fog is reserved for secondary text, I'll stick with Rope for input borders rather than mixing in Fog, since swapping would break the intended color-role mapping even though Fog is in the palette.

I'll skip the hover border idea to keep things strict. For checkboxes, I'll just set accent-color to Harbour rather than fully custom-styling the control, since that's simpler and the native rendering still looks reasonable.

For the select element, I'm styling it with appearance:none, a Rope border, 6px radius, and an inline SVG chevron icon in Harbour as a background image to signal it's a dropdown.

For typography, I'm settling on a scale of 14/16/20/28/40px — wordmark around 28-40, section headings at 20px Fraunces, body text at 16px, and metadata at 14px.

I'm setting line-heights as multiples of 4 (24px, 20px, 28px, 36px) to pair with the font sizes, and designing the wordmark with a small Signal-colored rule beside it plus a short supporting tagline in Fog.

Now I'm planning the People section: a form with a name input and "Add person" button, basic validation, and a simple list showing each person's name without pill-shaped chips.

I'm considering whether to allow removing people who aren't part of any expense (to fix typos), but worrying about test fragility if I add a "Remove" button inside the same element tagged data-testid="person" -- it could break equality checks on textContent. I'm deciding to isolate the name in its own inner span and place the Remove button separately in the list item so tests checking exact name text still pass.

For the expenses form, I'm planning a description field, amount input, "paid by" select, and a split-between checkbox group wrapped in a fieldset with a legend, plus an "Add expense" button and error messaging. I'm also thinking through the empty state -- showing a message telling users to add people first if the list is empty, and deciding whether the form itself should be hidden or disabled in that case.

I think it's safer to always render the form so elements with test IDs are present, and rely on validation errors rather than disabling inputs, since hidden or disabled fields could break tests expecting them to exist. For the amount field I'm leaning toward a text input with decimal inputmode rather than type="number", since browser constraint validation on number inputs could interfere with entering invalid values that tests expect to trigger error messages -- using novalidate and a flexible text field avoids that problem.

Now I'm working out how to parse the amount string safely, since commas are ambiguous between thousands separators and decimal separators in different locales. I'm designing a parser that only accepts commas as proper three-digit groupings (rejecting something like "12,50" as invalid rather than misreading it), strips an optional leading dollar sign, and returns clear error messages for empty, negative, or malformed input.

I still need to handle decimal precision -- capping at two decimal places with a friendly error, converting the validated amount into integer cents, rejecting zero or negative totals, and putting some sane upper bound on the amount so absurdly large numbers don't break things. I'm also thinking through edge cases like "12." or "0.001" to make sure the error priority (too many decimals vs. too small) makes sense.

For payer selection, I want the dropdown to always have a valid default and to persist whatever was last chosen after submitting an expense, rather than resetting it. The split checkboxes should default to everyone selected, but I need to track which people have been manually unchecked in a set so that adding a new person automatically checks them while preserving existing unchecks, and clearing that tracking once an expense is successfully added or a person is removed.

For validation ordering, I'm deciding to check for missing people first, then empty description, then amount format issues, then missing payer, then empty split selection — surfacing each as its own inline error rather than bailing after the first failure.

One concern: if both the person form and expense form show error messages simultaneously, a test using `getByTestId('form-error')` with `toBeVisible()` would hit Playwright's strict mode and fail on multiple matches. So I should ensure only one form-error is visible at a time — likely by clearing one form's error whenever the other form is submitted, and clearing an error once its form is successfully resubmitted.

For the live region implementation, I'm leaning toward keeping a persistent `aria-live="polite"` container in the DOM at all times, and only inserting or removing the error text node inside it, since screen readers announce changes more reliably when the live region itself doesn't get added/removed from the DOM.

I also want the problematic input to carry `aria-invalid` and `aria-describedby` pointing to the error message, with focus moving to that field on validation failure so the error gets read out alongside the live region update. For styling, since I can't rely on signal colors outside primary buttons, I'm thinking Harbour-colored text at medium weight with no icons, since icons without a clear action don't fit the guidelines, and skipping a background box unless it feels necessary for visibility.

For the balances list, I'm working out how to display each person's name with their amount and status word -- "is owed" for positive balances shown in Kelp, "owes" for negative balances shown in Harbour with a minus sign, keeping the formatting calm and consistent across both cases.

I'm deciding to stick with the exact Intl.NumberFormat options specified rather than adding signDisplay, since the standard formatter already outputs "-$12.50" with a proper hyphen-minus for negative values. Each balance item will carry a data-cents attribute and show the person's name, status word, and formatted amount, with zero balances marked "settled" in Fog and an empty state message guiding users to add people and expenses.

For balances, I'm deciding to always render a row per person—even at $0.00—rather than hiding them when there are no expenses, with a separate hint when the expense list is empty. For settle-up, I'm defining an empty state for no data, a "no transfers needed" message when balances are already even, and a transfer item format showing who pays whom with data-from/data-to/data-cents attributes, plus a greedy debtor-creditor matching algorithm to minimize the number of transfers.

I'm also considering a pre-pass that pairs debtors and creditors with exactly matching amounts before running the greedy algorithm, since that can reduce the total transfer count while still keeping the bound at n-1 transfers overall.

For the expense list UI, I'm figuring out how to display who paid and who split each expense, including per-person share amounts with cent rounding, and designing the remove button with a proper aria-label like "Remove Dinner" so its accessible name still starts with the visible "Remove" text.

I'm deciding against a confirmation dialog for removal to keep tests passing, instead moving focus to a sensible neighboring element afterward and considering a visually hidden live region to announce additions and removals. For persistence, I'm settling on a localStorage schema storing people and expenses with ids, using person ids internally for payer/split references even though names are stable since renaming isn't supported.

For distributing leftover cents, I'm sorting selected people by their trip order, computing a base share via integer division, then giving the remainder one extra cent each to the first people in that order. I'm also planning to sanitize loaded data against corrupted references and normalize name comparisons for case-insensitive uniqueness checks using locale-aware lowering.

I decide to only trim names rather than collapse internal whitespace, since trimming alone satisfies the spec and avoids altering data-person attributes unexpectedly. I'm also skipping maxlength restrictions on inputs, relying on CSS word-break instead so long names don't get truncated or mismatched in tests, and drafting clear error messages for empty names and duplicates that reference the existing stored name.

For the remaining form fields, I'm writing specific error copy for empty descriptions, invalid or zero amounts, too many decimals, missing payer, missing split selection, and the no-people case — deciding to show only the first relevant error to keep things testable with strict locators. I'm placing each error inline near the field it refers to using per-field slots, with focus movement to the offending field plus aria-live regions so screen reader users still hear the message even when focus doesn't change (like pressing Enter while already in a field).

I settle on validation order checking for people first, since nothing else matters without participants, then description, amount, payer, and split. For keyboard and focus styling, I'm using `:focus-visible` for a modern, accessible focus ring across buttons and inputs, accepting the minor quirks with programmatic focus after mouse clicks. For button hover states, I'm using text underline rather than introducing new background colors, keeping to the palette's intended usage for Signal, Harbour, and Rope.

Finally I'm deciding on page layout order — People, then Add an expense, then Balances, then Settle up, then the expense history list — matching the spec's natural reading order, and drafting a short one-line supporting tagline under the "Even Keel" wordmark describing the app's purpose around splitting trip costs and seeing who owes whom.

