I need to plan the HTML file carefully, sticking strictly to the color palette with no tints, using Rope for borders and Harbour for focus rings, then I'm checking the contrast ratio of the signal button color against white text to make sure it meets accessibility standards.

For error messages, I'm deciding to use Harbour text at 500 weight rather than red, keeping things simple without extra borders or icons, and planning to insert/remove error elements from the DOM dynamically with a persistent aria-live region for accessibility.

For the data model, I'm structuring state as people names and expenses with ids, descriptions, amounts in cents, payer, split list, and timestamps, skipping person deletion to avoid complicating logic. Split calculations divide the amount by number of participants using floor division, distributing any remainder cents to the first selected people in trip order.

For amount parsing, I'm writing a regex to accept up to two decimal places, stripping leading dollar signs, and surfacing specific error messages for invalid formats or non-positive amounts, using a text input with decimal inputmode to support flexible entry.

For validation ordering, I'm checking description, amount, payer, and split selection in sequence, and deciding to always render the expense form even with no people present, showing an explanatory note rather than hiding the form entirely to keep behavior predictable for tests.

For preserving state across re-renders, I'm tracking checkbox selections in memory so newly added people default to checked while existing selections persist, and I'm rebuilding payer and split options without disturbing the static description/amount inputs. After an expense is added, I'm resetting description and amount, keeping the payer, and resetting the split back to everyone.

For balance display, I'm computing paid minus share per person using Intl currency formatting, labeling positive balances as "is owed" in one color and negative as owed-by in another, with zero balances marked as settled.

For the settle-up algorithm, I'm designing a greedy approach that matches the largest debtor to the largest creditor repeatedly, guaranteeing at most n-1 transfers, with deterministic tie-breaking by original person order, and rendering each transfer as a sentence like "Ben pays Ana $12.00".

For the expense list, I'm sorting entries newest-first and showing description, amount, payer, and split names, with a remove button whose accessible name stays plain "Remove" but is linked via aria-describedby to the expense description for context, and after deletion I'm moving focus to the expenses heading for good keyboard flow.

For persistence, I'm using localStorage with a versioned key and wrapping read/write in try/catch, including shape validation on load. For name validation, I'm trimming input, rejecting duplicates case-insensitively with a clear message, and preserving the input value on error while clearing and refocusing it after successful submission.

For layout and styling, I'm laying out panels with consistent border radius, padding, and typography scale using Fraunces for headings and IBM Plex Sans for body text, structuring sections in order as People, Expenses (form plus list), Balances, and Settle Up, and defining primary/secondary button styles with hover transitions on border and background color.

I'm weighing whether to use the brand's muted border color for inputs versus a more visible option for accessibility, ultimately deciding to follow the brand palette while acknowledging the contrast tradeoff. For checkboxes, I'm styling a fieldset with a legend "Split between" and a wrapped grid of bordered checkbox labels, skipping a "select all" shortcut for simplicity.

For the form error UI, I'm using an aria-live region with a styled message box and setting aria-invalid plus a non-red border color on invalid fields to match the brand's no-red-for-errors constraint. For empty states, I'm writing specific fallback messages for balances and settle-up sections depending on whether people or expenses exist, and adding a small running total next to the expenses heading.

I'm sketching a money formatting helper using Intl.NumberFormat for CAD currency, and planning the computeShares function to calculate per-person splits, plus a balances calculator that accumulates payments and subtracts shares across all expenses. Finally I'm outlining the render functions and event wiring, including focusing the