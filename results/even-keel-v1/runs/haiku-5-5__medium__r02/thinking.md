I'm designing the data model: people stored uniquely in order added, expenses with payer and split lists, and a fair-share algorithm that divides costs evenly while distributing any remainder cents to the first people in trip order. I'm also planning how balances get computed from these splits.

For settling up, I'll use a greedy two-pointer approach matching largest creditors with largest debtors, which guarantees at most n-1 transfers since balances always sum to zero. I'm also working out input validation rules for amounts (requiring positive values with at most two decimal places) and deciding whether removing a person should be supported, given it could orphan existing expense references.

I'll skip person removal since the app only needs to list trip members, and the payer doesn't need to be part of the split. For the UI, I want new people to be checked by default in the split while preserving existing checked states when the form rebuilds, and I'll render everything through DOM-building helpers rather than raw HTML strings to avoid injection risks, plus add a single error element for form validation messages.

For form errors, I'll create the error element on demand and remove it from the DOM entirely when not shown, so tests querying for it only find it when visible. I'm also settling on localStorage persistence under a versioned key, sentence-case copy throughout, and specific empty-state messages guiding users to add people and expenses first.

For balance display, I'll format positive balances with a "+" sign in Kelp and negative balances with a minus sign in Harbour using Intl.NumberFormat, pairing each with clear "is owed" or "owes" labels for readability.

Now I'm thinking through transfer and expense row layouts -- showing who pays whom, description, amount, and a clearly labeled remove button with proper aria-label. For overall styling, I'm using Sailcloth background with Harbour text and IBM Plex Sans, keeping spacing in multiples of 8px, and switching input borders from Rope to Fog since Rope doesn't meet the 3:1 contrast requirement against white backgrounds.

I'm checking contrast ratios for the Signal button background against white text (~5:1, passes AA), Kelp against Sailcloth, and Fog against Sailcloth (~5:1, passes). For error messages I'll stick to Harbour text with a Harbour left border since Signal is reserved only for primary buttons and the wordmark, and I'm setting the focus ring to a 2px solid Harbour outline with offset. For checkboxes I'm leaving the accent color default rather than using Signal, to keep that color restricted to its designated uses.

Setting accent-color to Harbour for checkboxes, and defining hover states using Harbour background instead of tints since those aren't in the palette. I'm pulling in Google Fonts for Fraunces and IBM Plex Sans, then building the wordmark markup with a decorative rule element styled in Signal color, and mapping out the type scale across headings, body, and hint text with tabular numbers for money values.

Now I'm starting the JavaScript, setting up a storage key and an Intl.NumberFormat instance for CAD currency formatting.

I'm defining the state structure for people and expenses, with expenses displayed newest-first, and deciding name storage should be trimmed with lowercase comparison for duplicate checks. I'm writing the add-person handler with validation for empty or duplicate names, then moving into the expense form handler logic for validating description and amount input with a regex to enforce proper decimal formatting.

I'm refining the amount parsing to distinguish between invalid characters, too many decimal places, and zero/empty amounts, converting valid input into cents. Then I'm defining validation order for payer selection (requiring at least one person exists) and split checkboxes, settling on description → amount → payer → split as the validation sequence.

After saving an expense I'll clear the description and amount fields, reset the split to everyone checked, but keep the payer selection. I'm also working out the math for splitting cents evenly across selected people (distributing remainder cents one-by-one), tracking running balances per person from payments and shares, then using a two-pointer greedy algorithm to match debtors with creditors into a minimal set of settlement transfers. Finally I'm planning the render function to rebuild the people list, payer dropdown, split checkboxes, expense list, and balances display.

For re-rendering I need to preserve checkbox and payer selection state by reading the current DOM before rebuilding, defaulting new people to checked and falling back to the first person if the prior payer no longer exists. I'm organizing the UI into sections for people, expenses, balances, and settle-up, each with their own form and list, and setting up inline error messages that get created and cleared appropriately on form submission.

Now I'm defining the person and expense forms with proper labels, input types, and data-testid attributes, including a fieldset with checkboxes for splitting an expense between people.

For the empty-people state, I'm weighing options: disabling the form, hiding it entirely, or just showing a hint and letting submission fail with an error. I'll go with keeping the form visible but relying on an error message if someone tries to add an expense with no people and no payer options available.

Now I'm planning the expense list items (description, amount, "Paid by X, split between Y" meta, remove button), the balance list showing each person's owed/owes/even status with signed cents, and the transfer list showing who pays whom—each with appropriate empty-state messages when there are no people or no expenses yet. I'm also noting that storage needs to save after every mutation and validate on load.

Writing the stylesheet variables and base layout rules...

Still writing component styles...

Now I'm moving into the JavaScript logic, setting up currency formatters with Intl.NumberFormat for signed and unsigned money display, and starting the state load function that reads from localStorage.

I'm defining validation for stored expenses and people data, a save function that persists to localStorage, and a query helper for grabbing DOM elements by selector. I'm also planning the error-display helper, which inserts an accessible error message above a form and focuses the invalid field for keyboard users.

Now I'm writing the submit handlers for adding a person (trimming the name, checking for case-insensitive duplicates, showing errors, then saving and re-rendering) and for adding an expense, including a careful amount-parsing function that validates numeric input and decimal places and converts to integer cents.

Next I'm handling expense validation overall — requiring a description, at least one person, a valid payer, and at least one person selected to split with — then building the expense object and resetting the form while preserving the payer selection.

I'm working through how to rebuild the payer dropdown and split checkboxes on every render while preserving the previously selected payer and checkbox states, defaulting new people to checked.

Now I'm designing the expense list rendering (description, payer, split summary, formatted amount, and a remove button with an accessible label) and the balance calculation logic that sums each person's net position and labels them as owing, owed, or even.

I'm now working out the settle-up transfer list — computing who pays whom and rendering each as "X pays Y" with the amount — along with empty-state messages for when there are no people, no expenses, or everyone is already even.

I'm defining a small DOM-building helper function to construct elements with attributes, classes, text, and children more concisely.

Now I'm writing the HTML structure: the document head with font links, the main app container, the header with the "Even Keel" title and tagline, and the people section with its add-person form, hint text, list, and empty-state message.

Writing expense section markup...

