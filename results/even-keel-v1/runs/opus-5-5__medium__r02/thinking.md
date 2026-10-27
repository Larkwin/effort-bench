I'm planning the constraints carefully — restricting colors to the allowed palette without tints or opacity, keeping font sizes to the fixed set, and using spacing multiples of 8. For settling debts, I'm working out a greedy algorithm that matches debtors with creditors to minimize the number of transactions.

Now I'm thinking through amount input validation using a regex that allows decimals with up to two places, stripping dollar signs and commas, and converting to cents using string parsing to avoid float errors, plus capping the max amount. I'm deciding to use a text input with inputmode="decimal" instead of type=number so user input isn't sanitized unexpectedly, and working out how payer selection and split checkboxes should default to everyone checked, resetting after each expense is added.

For errors, I'm planning to show per-field messages with a data-testid that only appears when there's an actual error, rather than always rendering an empty placeholder, and keeping aria-invalid on inputs without clearing what the user typed when validation fails. I'm also sketching the localStorage schema to persist people and expenses with unique ids.

Expenses will store amounts in cents with payer and split names as identifiers, and I'm computing balances as paid minus share with signed cents so I can format them as "is owed" or "owes" using locale-aware currency strings, checking color contrast for the positive/negative/settled states against the background. For settling up I'll use a greedy largest-balance matching algorithm to generate transfer suggestions, and for the expense list I'll sort newest first, phrase the payer/split summary in plain language, add accessible remove buttons, and manage focus sensibly after deletion — then move on to header layout details like the wordmark sizing and rule styling.

Now I'm checking contrast ratios for the primary button colors and deciding on hover/focus states, landing on an underline for hover to stay within the palette, Harbour-colored focus outlines, and Harbour accent checkboxes, while reconsidering whether Rope is dark enough for input borders or if Fog would meet contrast requirements better.

I'm settling on using Fog for input borders despite the guideline favoring Rope, since accessibility takes priority here. I'm also sketching the responsive grid layout for amount and payer fields, spacing rules, and a supporting subheading line for the page.

Now I'm defining the four main sections—People, Expenses, Balances, Settle up—each as a Paper panel with Rope borders and consistent padding. For each I'm writing specific empty-state copy depending on whether people or expenses exist yet, plus deciding that person list items should show just the name for test consistency, balance items should pair name with amount, and transfer messages should read like "Ana pays Ben $12.50." I'm also starting on validation error text for the person name field.

Writing cents-parsing logic...

I need to handle negative amounts with a clearer "greater than $0" message, and figure out how shares get divided among people splitting an expense using floor division with remainder distributed to the first few people in trip order. For rendering, I need to make sure the form re-renders lists while preserving the currently selected payer and split selections.

For the payer dropdown, I'm deciding to default to the first person rather than use a placeholder, since that avoids failures if a test forgets to explicitly select a payer. Now I'm planning the CSS—setting up root variables, body typography with IBM Plex Sans, responsive padding for mobile, and heading styles using Fraunces for the "Even Keel" title and section headers.

Writing more styles...

Styling list items...

Pulling in Fraunces and IBM Plex Sans from Google Fonts, keeping it to a simple stylesheet link rather than adding extra preconnect hints.

I'm using :focus-visible with a Harbour-colored outline for accessibility, and setting up currency formatting with Intl.NumberFormat for CAD values, making sure negative balances display with a minus sign in Harbour color as the spec requires.

Now I'm planning the state shape for people and expenses, persisted to localStorage under a versioned key, with save wrapped in a try/catch to handle storage errors gracefully. I also want a visually-hidden live region for polite status announcements, and proper focus management after deletions—moving focus to the next remove button or the expenses heading.

Writing form validation logic...

For duplicate names and empty inputs I'm building an error-slot system that creates accessible error messages tied to each field via aria-invalid and aria-describedby, with helper functions to show and clear those errors. The expense form needs similar validation across description, amount, payer, and split selection, focusing the first invalid field and otherwise pushing a new expense record, resetting description and amount while preserving payer and split state.

For split validation I'm requiring at least one person be checked, and if there are no people at all, showing a prompt to add someone before logging an expense. The form render logic preserves the previously selected payer when possible, defaults new people to checked for splits, and shows a hint when there are no people to split with instead of empty checkboxes.

For the expenses list, I'm sorting by timestamp descending with ties broken by insertion order, rendering each item with the description, a "Paid by X · Split between..." meta line, the amount, and a remove button, using textContent throughout for safety. Balances are computed by summing payer credits and subtracting each person's share, then I settle debts by matching creditors and debtors greedily so the number of transfers stays minimal, guarding against corrupted data where a payer might no longer be a valid person.

Now I'm laying out the page structure: a branded header with the "Even Keel" title and tagline, an expense form with description, amount/payer grid, split fieldset, and submit button, followed by sections for People, Add an expense, Expenses, Balances, and Settle up, with visually-hidden labels for accessibility.

