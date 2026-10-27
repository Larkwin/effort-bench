I'm designing the data model and validation rules for the expense splitter: unique names for people, expense validation with proper decimal handling, and splitting amounts into integer cents with remainders distributed fairly among selected participants.

For balances and settlements, I'm planning a greedy algorithm that matches debtors with creditors to minimize the number of transfers, keeping everything in cents for precision and formatting currency with Intl.NumberFormat for CAD. I'm also settling on a visual identity — a navy "Harbour" and rust "Signal" palette — paired with Fraunces for headings and a tabular-nums-friendly sans like IBM Plex Sans or Inter for body text and numbers.

I'm checking color contrast ratios to make sure the Signal red and Harbour navy meet accessibility standards against white backgrounds, calculating relative luminance values to confirm they pass WCAG AA thresholds for normal text.

I'm also testing a warm off-white paper background and a teal-green accent derived from the Harbour color, working through the luminance math to verify those pairings stay legible too.

Still checking contrast ratios...

Computing contrast ratio of 4.51 against the dark background—close to the AA threshold, so I'm checking alternatives: white cards give a much safer 4.99 ratio, and for negative balance text I'm testing a darker variant like #A83920 against the background to ensure readability there too.

Confirming the button text passes at 4.99 with semi-bold weight. Checking secondary muted text color against both backgrounds — contrast lands around 5.0 on off-white and 5.5 on white, both comfortably passing.

Now thinking through layout structure: focus rings using the signal outline with offset, header with brand name and tagline, and a two-column grid above 880px with a sidebar for People and Add Expense, and a main column for Expenses, Balances, and Settle Up. For mobile, I'm leaning toward ordering People, Add Expense, Expenses, Balances, Settle Up in the DOM to match how someone would actually use the app from their phone.

For state, I'm planning an object holding people (ordered list of names) and expenses (each with id, description, amount in cents, payer, and split list), with expenses kept in insertion order for display.

For shares, I'm computing an even split of cents among selected people using floor division plus distributing the remainder cents to the first few people, then deriving each person's balance as paid minus owed share. For settling up, I'm sorting debtors and creditors and greedily matching them to produce the minimum number of transfers, which will always net to zero since shares sum exactly to the total. I'm also working out amount validation logic, using a regex to allow decimal values with up to two decimal places.

I'll use a text input with inputmode="decimal" instead of a native number input, so I can fully control validation and keep whatever the user typed, with a placeholder hint like "e.g. 42.50". For name uniqueness, I'll compare trimmed, lowercased values; deleting a person isn't required so I'll skip that for now.

Instead of a native confirm() dialog for "Start a new trip" (which Playwright auto-dismisses by default), I'll build an inline two-step confirmation flow that clears everyone and every expense only after a second explicit click.

For validation errors, I'll only insert the data-testid="form-error" element into the DOM when there's an actual message, wrapped in an aria-live container with proper aria-describedby and aria-invalid wiring on the input.

For the expense form, I need to handle re-rendering the split checkboxes when a new person is added—defaulting to all checked but being careful not to clobber unchecked selections the user already made.

After submitting an expense, I'll reset the description and amount fields and recheck all split boxes, but I'm weighing whether to retain the current payer selection or reset it to the first person—retaining it seems more realistic for real usage, so I'll go with keeping the payer as-is unless tests suggest otherwise.

For the no-people edge case, I'll keep the inputs enabled with an empty placeholder in the payer dropdown rather than disabling anything, and show a clear error message like "Add a person before logging an expense" on submit attempt. For validation, I'll check description first, then amount, showing one error at a time rather than a combined list.

Lists get fully re-rendered via innerHTML with escaping, while the static form inputs stay untouched so typed text persists; only the payer dropdown and split checkboxes refresh when people change. I'm using a localStorage key for persistence, and each expense list item will show the description, amount, who paid, and the explicit split breakdown with names and per-person share amounts.

For balances, each person gets a signed data-cents attribute and status text like "is owed $X" or "owes $X". Settle-up shows transfer suggestions like "Ben pays Ana $20.00", with fallback messages for when everyone's even or there's nothing yet to settle.

Now I'm moving into the actual HTML/CSS build, picking Fraunces and IBM Plex Sans as the typefaces and setting up color variables for the harbour blues, signal red, paper background, and ink/muted text tones.

I'm planning out the header copy to feel plain and calm, then sketching the layout as a two-column grid above 900px wide, with cards using white backgrounds, subtle borders, and Fraunces headings. I'm also thinking through button styles—signal-colored primary buttons and harbour-outlined secondary ones.

For accessibility I want a clear focus outline that switches to white on harbour backgrounds, and I'm deciding to show people as a numbered ordered list since the order affects leftover cents. Forms will use full-width inputs with a 44px minimum height, errors shown in signal color with an exclamation mark, and for balances I'm considering a simple horizontal bar visualization scaled to the max absolute balance, though I might keep it simpler with just colored amount text instead.

Now I'm writing the JS code, starting with storage setup, currency formatting helpers, and a load function that reads and validates saved state from localStorage...

Adding share and balance calculation functions...

Finishing the settlement algorithm by matching debtors to creditors greedily, confirming it terminates in at most n-1 transfers. Now I'm moving on to rendering concerns: escaping HTML, listing people, and building the payer select dropdown that preserves the current selection if still valid.

For the expense form submission, I'm validating that people exist first, then checking the description, parsing the amount into cents with clear error messages for invalid or non-positive values, and confirming a valid payer was selected among the people list.

For the amount parser, I'm using a regex to handle optional dollar sign and decimal cents, keeping it simple by requiring at least one digit group to be present, then converting the matched groups into a cents value.

For adding a person, I'll validate the trimmed name isn't empty, check for duplicates using the existing entry's casing in the error message, and cap names at 40 characters. Expense deletion uses event delegation on the list keyed by data-id, and resetting a trip gets an inline confirm step. I'm also starting to plan empty state messaging for when there are no people added yet.

I'm making sure data-testid="person" only applies to person list items, keeping headings properly nested (h1 for brand, h2 for sections), and setting the document language to en-CA. Now I'm writing the base CSS styles for layout, typography, focus states, and the header.

I'm designing a small SVG brand mark to go next to the logotype — a simple boat/waterline motif suggesting "even keel" balance, using a circle and horizontal line shapes.

I'm checking the tagline color for contrast against the harbour background, opting for a light tint to keep it readable. Then I'm setting up the main app grid layout, using a single column on mobile and switching to a two-column layout with a fixed sidebar width on larger screens.

Adding card and input styles...

Checking that border color against white background actually hits 3:1 contrast for UI components — my math shows #9AA8B1 only reaches about 2.44:1, so I'm swapping to a darker #7A8A95 instead.

Now I'm moving on to the button styles, starting with sizing and layout for minimum touch target height.

Styling checkbox pills...

I'm structuring each expense list item with a description, amount, payer and split info, a breakdown of individual shares, and a remove button.

For balances, I'm designing a row showing each person's name, their net amount colored by sign, a visual track/fill bar representing the balance magnitude, and a note like "is owed $40.00" or "owes $40.00"—keeping the layout simple with name on the left and status on the right.

For transfer suggestions, I'm formatting rows as "X pays Y $amount" with bolded names and an arrow indicator. I'm also setting up the error messaging system: a live-region container holding the error text with a stable id, linked via aria-describedby on the relevant input so screen readers always have that association, and aria-invalid toggled only when an error is present.

I'm also adding a quiet status live region for announcements, placing a "start a new trip" reset flow in a page footer that reveals a confirm step on click, and handling edge cases like default payer selection, all-checked split checkboxes on initial load, quoted names in data attributes, and filtering out corrupted split entries that reference people no longer in storage.

Now I'm adding sanitization on load to keep only valid expenses, and designing the amount input with a decimal keypad, a dollar-sign prefix adornment, and helpful placeholder text. Writing the JS module...

Writing render functions...

Confirming the expense reset resets all checkboxes to checked, then sketching out the remaining render functions for expenses, balances, and settle transfers, plus wiring them all into a single render() call with status announcements. I'm also working out the balance bar fill width and positioning logic, then moving into writing the responsive CSS for the person form layout.

Now I'm laying out the expense form fields and preparing to assemble the final HTML document.

