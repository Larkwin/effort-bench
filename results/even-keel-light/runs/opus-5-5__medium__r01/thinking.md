I'm thinking through the font pairing, leaning toward Fraunces for warm display headings paired with Public Sans or IBM Plex for honest, civic-feeling body and numeric text.

For color, I'm checking contrast ratios: Harbour blue and a brick-red Signal color against white pass around 5:1, but against a cream background the ratio drops below accessible thresholds for small text. I'll solve this by keeping the signal color for text only on white cards, or darkening it slightly to a muted rust tone so it still reads clearly against the warm sand page background.

For the money logic, I'm deciding that owing money should feel neutral rather than alarming, so I'll avoid red for debt and instead use a calm harbour tone for "owes" and a teal for "is owed," reserving the signal accent for primary actions. I like the idea of a centered balance bar like a waterline, with positive tipping right and negative tipping left. For settling up, a greedy algorithm pairing the biggest debtor with the biggest creditor gives at most n-1 transfers, and for splitting costs I'm distributing the remainder cents one-by-one to the first few people after an even floor division.

Now I'm thinking through amount input validation — using a text field with decimal input mode instead of a number type to avoid float quirks, and parsing cents by splitting on the decimal point as a string rather than using floating point math. I'm also weighing whether to allow removing people from a trip, leaning toward only permitting removal if they're not tied to any existing expense, though that adds some complexity.

I'm deciding against a full "reset trip" feature for now and focusing on the expense data model instead: each expense stores an id, description, amount in cents, payer, split list of names, and a timestamp, with shares recalculated on render. For the split checkboxes, everyone is checked by default, newly added people default to checked too, and after a successful expense submission the form clears and all checkboxes reset to checked.

For empty states, I'll keep the expense form enabled even with zero people rather than disabling it, showing a validation message instead. Validation errors will use an aria-live alert paragraph that's hidden by default, only gaining a testid attribute and being shown when there's actually an error, paired with aria-invalid and aria-describedby on the relevant inputs, and I'm ordering the checks starting with missing people, then description, amount, and payer.

I'm planning duplicate and empty-name messages for people entry, expenses sorted newest-first, and balance rows showing signed amounts with "is owed", "owes", or "settled up" text plus transfer suggestions like "Ana pays Ben $12.00". For layout, I'm sketching a header with a wordmark and small boat icon, a summary strip, and a two-column desktop layout (forms left, balances/expenses right) collapsing to a stacked mobile view.

For mobile ordering I'm putting People, Add expense, Balances, Settle up, then Expenses, while desktop keeps a narrow left column for forms and a right column for balances, settle up, and the expense list. I'm also making sure names are escaped via textContent, using index-based checkbox ids, and giving focus states a visible 3px outline with enough contrast against the background.

I'll persist state under "evenkeel.v1", wrap inputs in forms so Enter submits naturally, and format money with cents-to-dollar conversion labeled "Amount (CAD)" with a dollar prefix. Delete buttons get descriptive aria-labels and shift focus appropriately afterward, paired with a live region announcing actions like additions and removals. Person entries show as chips with initial avatars in rotating muted colors, each carrying a testid for identification.

For the split section, I'm adding "All"/"None" toggle buttons alongside a live preview showing the per-person amount, including a note when remainders mean some pay a cent more. Now I'm defining the color palette variables, checking contrast ratios for text legibility against both white and sand backgrounds.

For balances, I'm designing a bar with a center divider line that fills left for amounts owed and right (in teal) for amounts owed to the person, making sure the distinction isn't color-only. I'm linking Fraunces and Public Sans from Google Fonts, then starting the JavaScript state setup with people and expenses loaded from storage.

Now I'm working out the settlement algorithm: computing each person's balance by adding what they paid and subtracting their share of each expense, then splitting people into debtors and creditors sorted by amount owed. I'm using a greedy two-pointer approach that matches the largest debtor with the largest creditor repeatedly, zeroing out at least one side each round so the total number of transactions stays minimal.

I also need rendering functions for people, payer/split selection, expenses, balances, and settlement, while preserving which names are checked for splitting—defaulting new people to checked and resetting everyone after a successful add. I'm also writing a parseCents function to safely convert user-entered dollar strings (handling optional dollar signs, commas, and decimals) into integer cents for accurate math.

I'm being more careful with comma handling, only stripping commas when they match a proper grouping pattern like "1,234" rather than arbitrary placement. I'm also defining clear validation error messages for empty input, non-numeric input, too many decimal places, zero amounts, and an upper limit to prevent absurdly large values, plus a regex to catch more than two decimal digits. Now I'm thinking through how each expense line item should display, with description and right-aligned amount.

For the "split between" line, I'll always list the actual names rather than collapsing to "everyone" since tests likely check for explicit names. I'm also deciding defaults for the payer dropdown (first person, or a disabled placeholder if no one's added yet) and writing friendly empty-state messages for the people, expenses, and balances sections -- with balances showing each person at $0/"Even" once people exist but before any expenses are logged.

For the settle-up section I'm drafting the empty and all-even states, plus a simple "N transfers settle everything" header with from→to transfer cards like "Ana pays Ben." I'm skipping a "mark as paid" feature since it would complicate expense-counting logic, and noting layout details like 360px width with 16px padding and wrap-anywhere for long names.

Now I'm designing the header: a wordmark with a simple horizon-line icon, a tagline about settling trips fairly, and a summary band showing trip total, people count, and expense count in harbour colors with sand text, using the signal accent color for primary buttons with sufficient contrast. I'm also planning a ghost-style "Start a new trip" reset button in the footer, and starting to write the HTML structure for the header markup.

Now I'm building out the main layout with two columns -- an input column containing the people form (with name field, error messaging via aria-live, and a people list) and the expense form (with split controls and validation), and an output column containing the balances, settle-up, and expenses sections, followed by a footer and considerations for mobile ordering.

I'm defining helper functions for showing and clearing form errors with proper data-testid attributes, deciding to clear person errors on input but only clear expense errors after a successful submit. I'm also picking a set of muted avatar background colors that maintain good contrast with white initial text, then starting to lay out the expense list item markup.

Still writing markup...

I'm working out the keel bar fill logic based on proportional cents, and deciding wording for balance states like "is owed", "owes", and "is even". For settle-up transfers, I'm structuring accessible text like "Ben pays Ana $20.00" and drafting the note explaining it's the minimal number of payments needed.

For focus management, I'm deciding where focus should land after adding a person, adding an expense, or deleting one — likely moving to the expenses heading with tabindex -1 in the delete case. I'm also planning to wrap storage access in try/catch for resilience, and working out the split preview text to explain how leftover cents get distributed among the first few people in trip order.

Now I'm writing the page styles, setting up the color variables, typography, and layout for the masthead and brand header.

Writing card and form styles...

Adding secondary button and error message styles...

I'm checking color contrast ratios for the error text and focus rings against their backgrounds, then setting up a flex-based chip layout for the split checkbox options.

For the checkboxes I'm using :has() to style the checked state with a harbour accent color, styling the fieldset to remove default borders, and adding a prefixed amount input with left padding for the currency symbol. I'm also working out a responsive grid for the amount and payer fields using auto-fit with a minimum column width so it holds up on both desktop and mobile card widths.

For the person chips, I realize putting the avatar initial directly as text would break textContent equality checks in tests, so I'm using a CSS ::before with attr(data-initial) to render it visually without adding it to the actual text content.

Now I'm writing out the full JavaScript logic: setting up storage key and currency formatter, a load function that validates and filters saved state, and handlers for adding a person that trim whitespace, enforce a 40-character limit, and check for duplicate names with appropriate error messages.

I'm also sketching the expense submission flow, pulling description, amount, payer, and the split selection from checked people, with validation that there's at least one person on the trip before an expense can be added.

Each step checks for a required field and surfaces a specific error message with focus moved to the problem input: missing description, invalid amount, no payer chosen, or nobody selected to split with. On success, I'm creating an expense record with a generated id, amount in cents, and timestamp, adding it to the newest-first list, then resetting the description, amount, and split checkboxes while keeping the payer selected.

I'm wiring up the split selector so each person gets a checkbox chip that toggles their inclusion and updates the preview live, along with "All"/"None" quick-select buttons and amount-driven preview recalculation. Deleting an expense filters it out of state, persists, and re-renders with focus management, and I still need to build the balances/settlement view and a compact per-expense summary like "$3.33–$3.34 each" showing who split what.

For the balances copy, I want a reassuring note like "Owing a bit is normal — it just means someone else paid first," plus a footer noting local storage with a reset option. Planning's done, time to write the full implementation.

