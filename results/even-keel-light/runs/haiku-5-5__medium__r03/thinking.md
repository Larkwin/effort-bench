I'm planning out the app structure for a single-file HTML expense splitter: validating people names for uniqueness and non-emptiness, validating expense inputs like description, positive amounts with at most two decimals, payer selection, and a checkbox group for splitting, while working out how to distribute remainder cents fairly among participants.

For listing, I'll show expenses newest first with delete buttons, compute each person's net balance as paid minus share, then implement a greedy settle-up algorithm that minimizes transfers by always matching the largest creditor with the largest debtor. I'll format currency with Intl.NumberFormat, persist state in localStorage, and keep the design simple by not supporting person removal since the spec only calls for adding people.

For amount validation, I'll use a regex requiring a positive number with up to two decimal places, stripping optional "$" and commas for friendliness, then convert to integer cents by splitting the string into whole and fractional parts rather than relying on floating-point multiplication. Split selection needs at least one person chosen, and the payer defaults to the first person in the list, with appropriate empty-state handling when no people exist yet.

For state, I'm structuring it as a list of people names plus a list of expenses (each with id, description, cents, payer, and split array), appending new expenses but rendering them newest-first. Since there's no renaming, I can reference people by name directly, comparing names case-insensitively for uniqueness while preserving the original typed casing for display.

I'm planning to avoid full re-renders of the form on every update so typed values aren't lost, instead only rebuilding payer options and split checkboxes when the people list changes, making sure newly added people are checked by default while preserving existing selections.

For the balance logic, I'm calculating each person's paid total and their share from each expense's split, then settling debts with a greedy two-pointer approach that matches the largest creditor against the largest debtor repeatedly until all balances are zero, sorting by amount and name for consistent output. I'm also making sure to use textContent/DOM methods rather than innerHTML to avoid any XSS issues when rendering names and descriptions.

For empty states and errors, I'm planning specific messages for no people, no expenses, and nothing to settle, plus a dynamically inserted error slot that gets cleared and repopulated rather than just toggled hidden, so it's truly absent from the DOM when there's no error.

I'm keeping person and expense form errors as separate elements tied to their own forms, with aria-describedby and aria-invalid wired to the inputs for accessibility. Now I'm checking color contrast for a signal-red button background against white text, working through the luminance calculation channel by channel.

I'm confirming the Signal button color passes AA contrast at roughly 5:1, then verifying navy headers on the paper background and a muted grey body text color both clear the 4.5:1 threshold comfortably (around 6.5:1). I'm also sketching out the owed/owes semantic colors — a green-teal for positive balances and a darker red for negative ones — checking that the red text still holds up against the paper background.

For typography I'm pairing Fraunces for headings with Source Sans 3 for body text, using tabular numbers for all money figures, with Georgia/system-ui as safe fallbacks. Now I'm planning the page layout: a header with the "Even Keel" wordmark and tagline, then a responsive grid of cards (People, Add Expense, Balances, Settle Up) that collapses to two columns on wider screens with the expense list spanning full width. I want the settle-up section to carry a reassuring, normalizing tone about splitting costs with friends.

For the form structure, I'm using a fieldset with a legend "Split between" and a data-testid on the container, with each person represented as a labeled checkbox. Each expense gets a clearly labeled remove button, each person appears in a list item with a testid, and each balance entry includes the person's name and a formatted, signed dollar amount with corresponding data attributes for testing.

For money, I'm writing a formatter that converts cents to dollars for display, with signed values used internally for balances but shown as absolute amounts with directional wording. Storage uses a versioned key with safe loading via try/catch and basic shape validation, and expense IDs combine a timestamp with randomness.

For empty states, I'm making sure the expense form stays usable even with no people added, showing guidance text and surfacing a clear error on submit rather than disabling inputs outright, and planning similar validation for when no split members are selected.

Now I'm starting to build out the HTML document and CSS variables for the colour palette, fonts, and layout foundation.

Writing more component styles...

I'm checking contrast ratios for input borders and buttons, then designing the person list with avatar-initial chips, balance rows showing owed/owes amounts, and transfer entries formatted like "Ben pays Ana $12.50".

Now I'm setting up the core JS state: a localStorage key with versioned schema, currency formatting via Intl.NumberFormat, load/save functions with validation guards to filter out malformed people or expense entries.

I'm writing the addPerson function — trimming the name input, validating it's non-empty and under a length cap, checking for case-insensitive duplicates against existing people, and showing inline error messages like "There is already someone called 'X' on this trip" before pushing to state and re-rendering. I'm also designing the error display pattern with an accessible live-region paragraph tied to each input via aria-invalid.

Now I'm starting the expense form's addExpense function, validating the description field first with a prompt asking for something like "Groceries" or "Ferry tickets" if it's left blank.

Writing validation logic...

I verify the regex rejects malformed decimals like "1.234" correctly, then I'm working out the share-splitting function that distributes cents evenly among people with remainders allocated one-by-one, followed by starting the balances function that tracks what each person paid versus owes.

Writing render functions...

For the split checkboxes, I'm putting the data-testid on the fieldset itself since it contains the legend and checkboxes together. When there are no people, I'll show a message prompting the user to add people first, and handle the payer select showing a placeholder/disabled option in that case too, while preserving the previously selected payer when possible. For expenses rendering, each list item needs a header with description and amount, plus metadata showing who paid and how the expense is split among which people.

I'm adding a remove button with an aria-label to each expense and deciding how to handle focus after deletion -- moving it to the expenses section heading with a tabindex of -1 rather than letting it fall back to the body. For balances, I'm building out list items per person showing their name, whether they're owed, owe, or are even, and the formatted amount, with a zero-balance case showing "All square."

For the settle-up section, I'm using an ordered list of transfer items with different empty-state messages depending on whether there are no people, no expenses, or everyone's already even, and each transfer line shows who pays whom and how much with data attributes for testing. I'm also setting up forms for adding people and expenses with preventDefault submission so Enter key works, keeping inputs simple without maxlength restrictions that might interfere with tests.

I'm working through labels and headings for each section — "Trip people", "Log an expense", "Expenses", "Balances", "Settle up" — plus a small footer note and an optional "Clear trip" button with a confirm dialog for resetting everything.

Now I'm writing responsive styles for mobile: stacked input rows, full-width buttons, flex-wrapping expense list items, and overflow handling for long names, along with focus-visible outlines and checkbox accent colors to match the theme.

Writing the full CSS...

Still writing form styles...

Still writing styles...

Now I'm laying out the balances and transfers sections, using color coding for owed versus owes amounts, then moving into the header markup with the brand name and tagline.

For the main structure, I'm organizing cards for People, Log an expense, Expenses, Balances, and Settle up, each with proper heading IDs for accessibility. I'm building the person-add form with a name field and error slot, then starting the expense form with a description field.

Still writing expense form...

I'm laying out the description and amount fields side by side, adding a payer dropdown and split-between checkboxes, plus an error slot before the submit button. The expenses list section will show a count in the heading and an empty state message explaining expenses get split once logged.

Now I'm defining a small `h()` helper to build DOM elements with attributes, event handlers, and child nodes, then using it to render the people list—each person getting an avatar initial and name inside a list item.

I'm also handling the empty-state logic by rendering a placeholder paragraph when there are no people instead of toggling hidden attributes, and building the controls section: populating the payer dropdown with current people (falling back to a prompt when empty) while preserving the previous selection, and rebuilding the split-options checkboxes while remembering which were previously checked.

For expenses rendering, I'm deciding to use a consistent hidden-state pattern instead of swapping list items in and out — a dedicated empty-state paragraph toggled with a hidden class alongside the list. Then for each expense I'm computing which people are included in the split and checking whether everyone in the trip is covered to format the split description accordingly.

Still refining the split text logic...

For the delete handler, I'm filtering the expense out by id, saving, re-rendering, and moving focus back to the expenses heading (which needs a tabindex for that to work). For balances, I'm building each list item with the person's name, a status label ("is owed", "owes", or "all square"), and the formatted amount, plus data attributes storing the raw cents value for testing purposes.

Now I'm handling edge cases: avoiding "-0" display issues, showing an empty-state message when there are no people yet, and keeping balances at "all square" when people exist but no expenses have been logged. For the settle-up section I'm laying out conditional empty states -- prompting to add people, prompting to log an expense, or confirming everyone's even -- before falling back to rendering the actual list of suggested transfers, each one tagged with data attributes for the payer and payee.

Writing transfer list markup...

I'm adding a confirmation-gated "Clear trip" button that wipes all people and expenses, plus validation for overly long names, error-display helpers that attach messages near the relevant input and set aria-invalid/aria-describedby for accessibility, and focus management so errors pull attention to the right field. I'm also planning the responsive CSS -- stacking form rows on mobile, aligning buttons with input bottoms, adding visible focus outlines that adapt to the navy header background, and giving the footer a reassuring note about local-only storage. With the structure and styling decided, I'm ready to write out the complete HTML, CSS, and JS file.

