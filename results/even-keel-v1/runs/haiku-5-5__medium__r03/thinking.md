I'm planning the data model for people and expenses, deciding how to validate names for uniqueness, and working out the split logic—computing equal shares with remainder cents distributed to the first people in trip order, plus a regex for validating amount input.

For settling up, I'm using a greedy debtor/creditor matching algorithm that guarantees at most n-1 transfers, excluding anyone with a zero balance, and formatting negative balances with a proper minus sign for currency display.

I'll persist trip data to localStorage under a single key, wrapping the parse in a try/catch for safety, and I'm deciding to skip person removal/renaming for now since it adds complexity around expenses referencing them.

For the expense list, I'll render newest-first by reversing insertion order. For the split checkboxes, I need to rebuild them on every render while preserving which names are currently unchecked, defaulting new people to checked, and resetting everything to all-checked after a successful add—while leaving the form untouched if the submission was invalid so the user doesn't lose their input.

I'm planning a single shared `data-testid="form-error"` pattern, using separate error containers for people and expense forms that stay hidden until there's a message to show, plus wiring up `aria-describedby`, `aria-invalid`, and `aria-live` for accessibility.

For the payer select, I need to handle the empty-people case: keep the expense form visible but surface a clear validation message like "Add at least one person before adding an expense" on submit rather than disabling the form outright.

For expense validation, I'm sequencing checks in order — description required, amount must be a valid positive number with at most two decimals, a payer must be chosen, and at least one split participant selected — each with its own specific error text.

Now for deleting an expense, I'll add a remove button labeled with an aria-label referencing the expense description, and display each expense showing who paid and who it's split between.

For adding people, I'm defining the name input, add button, and validation messages for empty names and duplicates, quoting the typed name back in the error.

I'm also planning the balances list to always render per-person entries even at zero, and the settle-up section to list suggested transfers or show an "everyone is settled" message when no transfers are needed. Structurally, everything including the header wordmark and supporting tagline should live inside a single main wrapper, with section headings for People, Expenses, Balances, and Settle up.

Now I'm setting up the Google Fonts links for Fraunces and IBM Plex Sans with preconnect tags and fallback fonts, then working through the CSS color constraints—since tints and opacity aren't allowed, I'm using underline and border-color changes for hover states instead, with a consistent focus outline. I'm also deciding how checkboxes, inputs, and error text should use the limited palette, reserving the Signal color for primary buttons and the rule, and using Harbour for error messaging instead.

I'm verifying contrast ratios manually—checking Fog on Sailcloth, Kelp on Paper, and especially Paper text on Signal by computing the relative luminance step by step, confirming it clears the AA threshold for normal text at around 5:1. With the palette validated, I'm moving into the layout structure, setting the body background to Sailcloth and defining the main content width and padding for desktop and mobile.

For panels, I'm using Paper background with a thin Rope border and rounded corners, keeping all spacing to multiples of 8 and a consistent type scale from 14px up to 40px for the wordmark. I'm also planning the form structure—using a fieldset with a legend for the split-between checkboxes, labeling each input clearly, and setting the amount field to use inputmode decimal for numeric validation. Writing HTML markup...

Still writing the form markup...

I'm building out the People section with a form, name input, error messaging, and an empty-state hint, then moving into the expense form structure with similar fields.

Now I'm planning the balance list items with name, signed amount, and status text ("is owed", "owes", "settled up"), plus the settle-up transfer list showing who pays whom. For expense rows, I'm structuring each as a description and metadata line (payer and split members) alongside the amount and a delete button.

Setting up persistence next: loading and saving trip state (people and expenses) from localStorage with validation, generating unique expense IDs, and formatting currency values using Intl.NumberFormat, handling negative amounts by using absolute values with explicit signs.

I'm working out the amount parsing logic now — matching valid decimal formats, rejecting things like "5." or "1,000", and picking error messages depending on the failure case: empty input gets "Enter an amount greater than $0," unparseable text gets "Enter the amount as a number, like 12.50," and too many decimal places gets its own message about at most two decimal places.

Now I'm designing how cents get split evenly across selected people, with any remainder cents distributed to the first few people in trip order, and sketching the balance calculation that sums what each person paid minus their share of each expense.

For settling up, I'm writing a greedy algorithm that pairs creditors and debtors to minimize transfer count. I also want to make sure names are compared case-insensitively for uniqueness while preserving the original casing for display, and handle rendering logic that preserves the selected payer across re-renders and shows a placeholder when no people exist yet.

For split checkboxes, I'm building one per person with checked state based on whether they're in the excluded set, and listening for changes to update that set. Since rebuilding the person list, payer select, and checkboxes only happens when people change (not during typing), state is preserved safely across re-renders.

For the expense list I'll render with createElement and textContent rather than innerHTML to avoid injection risks, with a small helper for building DOM nodes. Deleting an expense updates state, saves, and re-renders, with focus shifted to a tabindex-accessible heading afterward for accessibility.

Form submissions use preventDefault with validation helpers that show inline errors and set aria-invalid; adding a person checks for empty input or a case-insensitive duplicate name before accepting it.

Adding an expense validates description, amount, that at least one person exists, that a valid payer is chosen, and that at least one person is included in the split before pushing the new expense and resetting the form while keeping the payer selection.

I'm working out empty-state messaging for people, expenses, balances, and transfers depending on whether people/expenses exist yet, plus deciding to call the full render on page load since the script runs at the end of the body.

Now I'm defining the CSS custom properties for the brand palette (harbour, fog, sail, paper, rope, signal, kelp) and base typography using Fraunces for headings and IBM Plex Sans for body text.

Writing layout and panel styles...

I'm choosing to use Fog instead of Rope for input and button borders since Rope doesn't meet the 3:1 contrast requirement against white backgrounds, keeping within the allowed palette while satisfying accessibility needs.

Writing button and focus styles...

Laying out the person and expense forms with flexible rows and wrapping fields, plus styling checkboxes with accent-color for the split selection.

Styling error messages, lists, and money formatting...

I'm finishing the list and balance item styles along with responsive tweaks at narrow widths like reducing the wordmark font size.

I'm beginning the JavaScript: setting up constants for the storage key and currency formatter, then caching references to all the form, list, and error DOM elements I'll need.

Writing the load/save functions that read and sanitize trip data from localStorage, filtering out invalid people or expenses (bad payers, non-positive amounts, empty splits) before returning clean state.

Writing formatting helpers for cents, signed amounts, and a generic error-display function that toggles an error box's visibility and sets aria-invalid on the related input.

Writing the amount parser...

