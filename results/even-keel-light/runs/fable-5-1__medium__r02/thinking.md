I'm planning out the full single-file HTML structure: a people list with validation for unique trimmed names, and an expense form with description, amount (integer cents, two-decimal max), payer selection, and split checkboxes defaulting to all checked.

For expenses I'll list newest first with delete buttons, rejecting invalid input while preserving typed values. Balances display per-person cents, and settle-up uses a greedy creditor/debtor matching algorithm to minimize transfers to at most n-1. I'm also deciding on money formatting via Intl.NumberFormat for CAD, localStorage persistence, empty states, responsive design at 360px, and accessibility — plus picking a font pairing (leaning toward a serif display paired with a clean sans) and a navy/signal-red color palette for a steady, trustworthy feel.

Now I'm checking color contrast ratios for the palette — verifying the signal red against white backgrounds passes AA for normal text, and working out complementary green/red tones for positive and negative balances that also meet contrast requirements.

For layout, I'm planning a header with wordmark and tagline, then a two-column desktop grid (people and add-expense form on left, expenses/balances/settle-up on right) that stacks on mobile. I'm deciding to skip person deletion to avoid orphaned-expense complexity, keeping the people list simple. For expense input, I'm using a text field with decimal inputmode and a regex to validate amounts to two decimal places.

Converting amounts to integer cents, I'm computing even splits by dividing cents by the number of participants, distributing any remainder cent to the first few people in list order. Balances are then derived by subtracting each person's share total from what they actually paid, recalculated from stored expense records each time.

For settling up, I'm sorting creditors and debtors by magnitude and greedily matching them with a two-pointer approach to minimize the number of transfers, capping at n-1. I'm also planning per-form error displays (shown only on error, with alert roles) that preserve typed input on failure, and figuring out how adding a new person should update the payer selector and split checkboxes while keeping existing selections intact.

For the expense list, I'll show newest-first with payer, split details, and a delete button, plus a balances view stating who's owed, who owes, or who's even — along with sensible empty states when there are no people yet, deciding whether the expense form should be disabled until people exist.

I'm leaning toward keeping the form enabled with a validation hint rather than disabling it, using a placeholder "choose who paid" option when no people exist and defaulting to the first person otherwise. I also need to handle focus management after adding a person or expense, plus localStorage persistence under a versioned key with sanitization on load.

Now I'm planning transfer descriptions like "Ana pays Ben $12.00", an "everyone's even" message when balances are zero, and a small summary stat showing total spent across expenses. I'm also noting accessibility needs—labeled fieldsets for split checkboxes and visible focus outlines—before moving into CSS variables for the color palette.

I'm checking contrast ratios for the muted text color against white and defining the full palette including harbour, signal, sand, and a positive "tide" green. I'm sketching the header design with the Fraunces wordmark "Even Keel," a tagline, and the trip total, plus body typography using Public Sans with Fraunces headings and white cards with subtle borders and rounded corners.

Now I'm setting up the responsive grid layout, button styles for primary and secondary actions, and deciding to keep native checkboxes visible as accessible chip-style labels. I'm defining the core app state with a localStorage key, people and expenses arrays, and a currency formatter for Canadian dollars.

I'm writing a parser that converts dollar-string input into integer cents, validating the format with a regex and rejecting empty, non-numeric, or non-positive values with distinct error messages. I'm also working out a function to calculate each person's share of an expense based on who's included in the split.

Now I'm planning balances() to total what each person owes or is owed, then settle() to greedily match creditors and debtors to minimize transactions. I'm sketching out the render functions (people list, expense form with checkboxes, expenses list, balances, and settlement suggestions), plus a shared render() that calls them all and an error-display helper, keeping selections intact across re-renders and skipping confirmation dialogs on delete.

For each expense item I'm designing markup showing the description, amount, who paid, and who it's split between, with a delete button — and figuring out how to phrase the split info, showing an even "$X each" when shares divide evenly or a range otherwise.

For balances, I'm listing each person with their status ("is owed", "owes", or "even") plus a colored amount. For settle-up, I'm rendering transfers as "X pays Y" lines with a summary note on transfer count, and writing friendly empty-state copy for when there are no people or no expenses yet.

I'm making sure state persists on every change and validating the shape of any loaded data before using it. Now I'm writing the HTML, starting with an escaping helper for safe text insertion and a fieldset wrapping the split checkboxes with a legend.

For the form, I'll wrap inputs in a `<form>` with a submit handler so pressing Enter works, and make the add-person button a submit type. Now I'm writing out the full implementation.

