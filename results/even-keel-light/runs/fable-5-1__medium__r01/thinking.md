I'm planning the data model and validation rules for Even Keel: unique trimmed names for people, and expense entries requiring a description, positive amount with at most two decimals, a payer, and split selections—defaulting to everyone checked, with equal division in integer cents and leftover cents distributed to people in the order they joined the trip, listing expenses newest first.

For settling up, I'm using a greedy debtor/creditor matching algorithm that guarantees at most n-1 transfers among people with nonzero balances, formatting all amounts with Intl.NumberFormat in en-CA CAD, persisting state to localStorage, and ensuring responsive, accessible layout down to 360px.

I'm settling on the visual identity now: Harbour navy and Signal orange as the core palette, pairing Fraunces for headings with Inter for body text (using tabular figures for numbers), and double-checking contrast ratios for the Signal color against white backgrounds.

Also passing right at the edge, so I'll play it safe and use a darker brand variant for small text while keeping the brighter brand color for buttons and accents. Now I'm checking Harbour against white (clearly fine) and starting to verify the muted gray text color's contrast ratio.

Muted text at 6.49 against white and 5.8 against the cream background both clear the bar comfortably. I'm settling on a warm sand background (#F4F1EB), white cards, and a Harbour-colored header, then moving into the layout structure with a brand header and a main content grid.

For desktop I'm planning two columns—people and add-expense on the left, expenses list and balances/settle-up on the right—while mobile stacks everything in a sensible order. Now I'm defining the app's state shape (people array and expenses with id, description, cents, payer, and split), deciding to skip deleting people to avoid inconsistencies, but adding a modest "clear trip" reset with confirmation. I'm moving into amount parsing logic for the input fields.

For amount validation, I'm trimming the string and stripping stray "$" or commas, then using a regex to ensure proper decimal format, converting to cents through string math to dodge floating-point issues, and using a text input with inputmode="decimal" so typed values stay exact. For splitting costs, I'm computing a base cents-per-person via floor division with remainder cents distributed to the first few people, then calculating each person's balance as paid minus their share, and starting to work out the debt-settling logic.

For settling debts, I'm separating people into debtors and creditors, sorting by magnitude, and running a greedy two-pointer match between them. For form errors, I'm rendering an alert element with a specific test id that disappears once input is valid, and I'm re-rendering person checkboxes when someone new is added while preserving existing selections and defaulting new entries to checked. I'm also setting up expense list rendering newest-first with delete buttons, handling add-person flow with input clearing and duplicate/empty validation, and planning an empty-state message in the expense form when no people have been added yet.

On validation, I'll avoid re-rendering form inputs when there's an error, only updating the alert message. After a successful expense submission, I'll reset the description and amount fields, re-check all split checkboxes, and reset the payer selection to the first person, while making sure that adding a new person preserves the currently selected payer. Now I'm pulling in the Google Fonts link for Fraunces and Inter to use in the page styling.

I'm setting up focus-visible outlines with a signal-colored 3px offset ring and ensuring buttons have a 44px minimum height for accessibility. For balance display, I'm keeping the tone neutral — "owes" isn't framed negatively, just stated plainly — and I'm writing calm empty states like "Nothing to settle — everyone's even" and prompts to add an expense first. Writing state persistence logic...

Writing settle-up logic...

I need to escape names for HTML safety with a helper function, then plan the rendering functions separately for people, expense form, expenses, balances, and settle sections. I'm sketching the page layout with a header and cards for People, Add an expense, Expenses, Balances, and Settle up, arranged in a two-column grid on desktop.

For the footer I'll add "Saved on this device" plus a "Start a new trip" button. For the amount field I'm using a simple label and placeholder rather than a prefix symbol, and for the split checkboxes I'm using a fieldset with chip-style labels, skipping extra quick-select buttons to keep it simple. Each expense item will show the description in bold with meta text summarizing who paid and how it's split.

For balances, I'm reconsidering the color choices—since owing money is normal rather than alarming, I want to avoid using red/signal colors for "owes" and instead keep both owed and owes text within the harbour/neutral palette, reserving signal colors strictly for action buttons.

Now I'm defining the validation rules for the expense form: requiring at least one person before logging, a non-empty description, a valid positive amount with up to two decimals, a valid payer, and at least one person in the split—each with its own specific error message, and focusing the first invalid field while preserving entered values. After a successful add, I'll clear the description and amount fields, re-validate, and refocus the description field, then handle expense deletion logic.

Writing styles...

