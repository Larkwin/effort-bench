I'm planning the HTML structure: people management with trimmed, unique, case-insensitive names and inline validation errors, plus an expense form requiring description, a positive amount with up to two decimals, a payer selector, and split checkboxes that default to all checked, working internally in cents.

For splitting, I'll distribute cents evenly in trip order, giving any remainder to the first few selected people. Expenses will track payer, selected splits, and amount in cents, displayed newest first, with balances computed as paid minus share and settle-up handled via a greedy debt-minimizing algorithm.

I need to make sure balances always sum to zero, persist data to localStorage with validation on load, and format currency using Intl.NumberFormat for CAD with minus signs on negatives. For the layout, I'm planning the app structure with a wordmark header "Even Keel" and a supporting tagline about splitting trip costs.

I'm also thinking through the sections: People, Add expense, Expenses, Balances, Settle up. For the payer select, I need to handle the empty-people case — showing a placeholder option like "Add a person first" rather than disabling the whole form, so validation errors can still surface naturally if someone tries to log an expense with no people.

For the split checkboxes, I'm planning to persist which people are unchecked across re-renders by tracking an excluded-names set that updates on checkbox change, rather than resetting everything to checked whenever the people list changes — resetting this set after an expense is successfully added.

For form errors, I'll use a single error element per form that only renders when a message exists, clearing it on the other form when one is submitted so only one error shows at a time, plus adding aria-invalid and aria-describedby (and possibly role="alert") for accessibility.

I also need specific empty-state messages for people, expenses, balances, and settle-up views, plus validation text for name, amount, and description errors. For styling, I'll stick strictly to the defined palette with no tints or opacity, using Rope for borders, Sailcloth/Paper for backgrounds, Harbour for focus rings, and Signal with Paper text for primary buttons, keeping contrast in mind.

I'm checking contrast ratios for Signal, Fog, and Kelp colors against their backgrounds to confirm they meet AA accessibility standards, and they all pass comfortably. I'm also planning the secondary button styling with Paper background, Harbour text, and Rope border, and setting up Google Fonts for Fraunces and IBM Plex Sans with appropriate fallbacks.

Now I'm finalizing font sizes (14, 16, 20, 28, 40) and spacing on an 8px scale, deciding the wordmark uses 28px, section headings 20px, body 16px, and hints 14px. I'm also working out the expense list items with description, amount, payer, and split details, a remove button with proper aria-label, accent-colored checkboxes using Harbour, and a balance list showing who owes or is owed with name left-aligned and amount right-aligned.

Writing HTML structure...

Writing markup for header...

I'm thinking through whether the error element should stay hidden by default and only be toggled visible via JS, since tests likely check that element's visibility or text content rather than its mere existence.

I'll build a showError helper that injects the error message into a slot element only when an error is present, linking it via aria-describedby. Now I'm writing out the expense form's HTML structure with labeled fields for description and amount.

I'll skip the placeholder and move to the expense list markup, building each item with a title, metadata showing who paid and the split, and a side section for actions.

I'll use textContent for safety and a small helper function to construct DOM elements. For the balances list, I'm planning to show each person's name with their balance labeled as "is owed," "owes," or "even," formatting negative amounts properly with the currency sign.

For settling debts, I'm sketching a greedy algorithm: separate debtors and creditors, then repeatedly match the smallest outstanding amounts between them until both lists are exhausted, producing minimal transfer records like "Ben pays Ana $12.00." Now I'm working out how to split a total amount into cents fairly across multiple people, handling rounding remainders.

I'm also defining how to parse user-entered dollar amounts, stripping symbols and validating decimal places, then deciding on friendly error messages for cases like empty input, non-numeric text, zero amounts, or invalid decimals.

For adding a new person, I'm trimming the name, rejecting empty entries, and checking case-insensitively against existing people to avoid duplicates, using a message like "already on the trip."

I'm structuring expenses with an id, description, amount, payer, and a split array of names, validating that the description is non-empty, the payer exists in the people list, and at least one split participant is checked—keeping entered values on failure. When people change, I'll re-render the payer dropdown and split checkboxes, preserving the payer if still valid, and tracking excluded split members in a set that resets after a successful add while keeping the payer selection intact.

I'm also thinking about focus management: re-rendering after adding people or expenses shouldn't disrupt focus since those come from form submissions, but deleting an expense currently sends focus to body with no visible indicator. I want to fix this by shifting focus to the next delete button or a focusable heading after a deletion, though I'll keep this handling fairly minimal rather than building something elaborate.

I'm also planning persistence with localStorage under a versioned key, saving after every mutation and loading safely with a try/catch, plus using a Map instead of plain objects for balances to avoid prototype pollution issues with names like "__proto__". For rendering, I'm setting expenses to display newest first and adding empty-state messaging for both the people list and the expense form's payer dropdown when no people exist yet.

I'm designing empty-state copy for expenses, balances, and settle-up sections depending on whether people or expenses exist, along with accessible balance labels like "owes," "is owed," or "even," and transfer text formatted as "X pays Y" with the amount. Deleting an expense filters it out by id, and I'm adding focus-visible outlines plus consistent paper-background input styling with rounded borders.

Now I'm working out button hover states using brand colors like harbour instead of opacity tricks, styling lists with rope borders and paper backgrounds, applying tabular numerals for money display, sticking to a limited type scale, and setting up flex-wrapped rows so inputs and buttons stack properly on narrow mobile screens.

I'm structuring the checkbox group with wrapped flex layout and labeling each checkbox for the expense split feature, then moving into the JavaScript: setting up currency formatting with Intl.NumberFormat for CAD, defining the app state shape with people, expenses, and an excluded set for UI purposes, and writing a safe localStorage load function that validates the shape of saved data before using it.

For IDs I'm using a timestamp plus random string instead of a counter. I'm building error-handling helpers that clear and populate error message slots with alert-role paragraphs, tie them to aria-invalid/aria-describedby on inputs, and focus the offending field, then wiring the person form's submit handler to trim and validate the name input before adding a new person.

Now I'm handling the expense form's submission, validating description, amount, presence of people, payer selection, and split selection in order, with a fail helper setting errors and focus for each case, before pushing the new expense and resetting the form fields.

I'm also wiring up the split checkboxes with change listeners that add or remove people from the excluded set, rendering the payer dropdown while preserving the previously selected value when possible, and setting up delete buttons and an empty-state message for the expense list.

For the people and expense lists, I'm using container divs that get replaced with either list items or an empty-state paragraph. After deleting an expense, focus moves to the delete button at the same position in the refreshed list, falling back to the previous item or the section heading if needed.

Now I'm planning the visual layout: a wordmark with a small decorative rule before "Even Keel", panels for People, Add Expense, Expenses, Balances, and Settle Up with consistent padding and spacing, plus explanatory hints for how balances and settlements work. Writing the base styles...

Adding more section and form field styles...

Now I'm checking contrast concerns—the rope-colored border on white background might be too subtle for accessibility standards.

Using Fog for input borders is a deviation from the listed role but defensible since the brand guidance only explicitly ties WCAG AA to text, not non-text elements — so I'll keep Rope for panels and dividers while applying Fog specifically to meet the border contrast requirement.

I'm styling the buttons with Signal as the primary color, a secondary variant using the navy outline, hover states that swap to navy, and a visible focus outline for accessibility — making sure the secondary remove button still hits the 44px touch target, and confirming Signal stays reserved for the primary Add action only.

For the error message, I'm switching away from a Signal border since that color's meant only for primary buttons, instead using navy text on a tan background with a navy border. Then I'm laying out the row with flex-wrap for responsive inputs, and building the list structure with bordered items, spacing between rows, and flexible title/content areas.

Still writing styles...

Now I'm moving into the balance display logic—positive values in Kelp green, negative in Harbour navy, zero treated as neutral—and building checkbox controls with proper tap target sizing and accent coloring. With the CSS settled, I'm starting the JavaScript implementation.

Writing state management code...

Writing settle-up algorithm...

Writing element creation helper...

Rendering the people list as list items, then moving on to building the form for payer and split selection...

For the payer dropdown, I'm populating it with a disabled placeholder option when there are no people yet, using a native Option object with disabled and selected flags set directly as properties.

Now I'm filling the split checkboxes section: if no people exist, showing a hint message, otherwise rendering a checkbox label for each person with its checked state based on whether they're excluded.

Moving to renderExpenses, I'm writing the logic to show an empty-state message when there are no expenses, otherwise building a reversed list of expense entries and filtering each expense's split participants against the current people list.

Adding delete buttons and building each list item...

For removing an expense, I need to figure out which displayed index corresponds to the clicked id, since the list is shown in reverse order, then filter it out of state, save, and re-render with focus management.

For the balances section, I'm rendering a list showing each person's net balance with status labels like "is owed" or "owes" based on positive or negative amounts.

Adding styling for the positive color class, plus a hint explaining that a positive amount means money is owed to that person while negative means they owe the group.

Now I'm writing the settle-up rendering function, handling empty states for no expenses or everyone being even, then building a list of transfer items with data attributes for sender, recipient, and amount in cents.

I'm defining a top-level render function that calls all the sub-renderers in sequence—people, form, expenses, balances, and settle. I'm double-checking that re-rendering the form on every update correctly preserves excluded-checkbox state without disrupting focus, since render only fires on submit or delete actions.

Now I'm adding a delegated change listener on the split container to toggle people in/out of the excluded set based on checkbox state, plus an error-clearing helper that wipes both person and expense error slots. I'm also building a fail() function that injects an accessible error message into the right slot and focuses the offending input, while deciding whether to mark aria-invalid on fields and clear it during cleanup.

I'm writing the amount parser that strips a leading dollar sign and commas, validates the format with a regex for up to two decimal places, converts to cents safely, and returns errors for empty, malformed, too-large, or non-positive amounts—checking edge cases like "0.5" and "$0.00". I'm keeping in mind that inputs should stay populated after a failed submission rather than being cleared.

Now I'm filling in remaining details: initializing the app with load/render calls and form listeners, assigning heading ids for each section, writing the split-expense legend and hint text, and labeling the amount field clearly as CAD. I'm also deciding to nest the header inside main, double-checking the helper for creating elements with attributes, and reviewing panel layout and list styling to make sure everything stays consistent, sentence-cased, and free of exclamation marks or emoji.

