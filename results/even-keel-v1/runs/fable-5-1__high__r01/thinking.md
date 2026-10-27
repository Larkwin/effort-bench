I'm planning the data model and validation rules: unique trimmed names for people, and expenses requiring a description, positive amount with max two decimals, a payer, and split checkboxes defaulting to all selected, with equal splits computed in integer cents and leftover pennies distributed to people in the order they joined the trip, newest expenses listed first with a remove option.

For balances I'm defining paid-minus-share per person with test attributes for value and ownership, and for settling up I'm using a greedy algorithm capped at n-1 transfers, also tagged with test attributes for sender, receiver, and amount. I'm also setting money formatting via Canadian locale currency, persisting state to localStorage, handling empty states, and ensuring responsiveness from 360px plus accessibility.

Now I'm working through the brand system: restricted color palette, negative balances in Harbour with a minus sign, positive in Kelp, Signal reserved for primary buttons and the wordmark rule, secondary remove buttons styled with Paper background and Rope border, and a 2px Harbour focus ring offset by 2px—alongside the Fraunces/IBM Plex Sans typography scale and the "Even Keel" wordmark treatment. I'm also refining the regex for amount validation to enforce at most two decimal places.

For amount parsing I'm converting to cents via string manipulation rather than floats, leniently accepting dollar signs and commas, and defining clear error messages for empty, zero, too-many-decimal, or invalid inputs. I've decided to use a text input with decimal inputmode so tests can type freeform values, and I'm skipping person deletion entirely to keep scope manageable.

I'm weighing whether to add a "Clear trip" reset button with a confirm dialog—useful but not strictly required by spec, and risky if it interferes with test interactions, though tests shouldn't click it by accident. I'll include it modestly since a trip tool without any reset feels incomplete.

For adding people, I'll track unchecked names in a set so split checkboxes stay "everyone selected by default" while preserving manual unchecks, and resetting all to checked after a successful expense submission along with clearing description and amount. I'll leave the payer selection untouched between submissions for convenience rather than resetting it.

I'm also deciding how to handle an empty people list for the expense form — rather than disabling inputs (which would break Playwright fill calls), I'll keep fields enabled and just show a validation message like "Add a person first" if someone tries to submit without any people added, with validation ordered as description, amount, payer, then split.

For the expense list display, I'll show each entry as "Paid by X · Split between A, B, C" and include a smaller line with per-person share amounts so it's easy to verify the math.

For splitting logic, I'm dividing the amount by the number of selected people, flooring to get a base share, then distributing the remainder cent-by-cent to the first few people in trip order. For settling up, I compute net balances per person, then greedily match creditors with debtors (sorted by amount, ties broken by trip order) to minimize the number of transfers, and display each balance as "is owed," "owes," or settled.

For persistence, I'm storing people and expenses in localStorage under a versioned key, validating the shape on load, and using data attributes with generated IDs so checkboxes can safely reference names even with special characters.

I'm also planning Enter-to-submit on the input forms, and sketching out the single-column layout with styled panels for People, Expenses, Balances, and Settle up, including the font sizes and colors for the wordmark and headings.

Now I'm working out input and button styling — bordered inputs with focus outlines, and since tints/opacity variants aren't allowed, I'm deciding hover states should swap to solid Harbour backgrounds or borders instead, with a 150ms transition.

Checkboxes get an accent color of Harbour, and I'm planning how to format the "Ben pays Ana $12.00" settlement display as a list, with flex-wrap for responsive form rows and expense list items.

I'm also mapping out accessibility details — an alert role with aria-live for form errors, aria-invalid on failing inputs, and a fieldset with legend wrapping the split checkboxes for the expense-split container. Now starting on the HTML document itself.

Setting up the page head...

Deciding to nest the header inside the main app wrapper for simplicity, then moving on to the JavaScript setup, starting with a storage key constant and a currency formatter for Canadian dollars.

I'm writing load and save functions that read and write the people/expenses state to localStorage with validation, plus a parseAmount helper that strips dollar signs and commas, checks for empty input, and uses a regex to validate decimal number formats before converting to cents.

Now I'm working out the shares calculation, splitting cents evenly among participants with remainder distributed to the first few, then tracking balances by subtracting shares from each payer's credit. For settling up, I'm separating people into creditors and debtors based on their balance sign so I can match them off.

Still writing settle logic...

I'm reasoning that the number of transfers is bounded since each one zeroes out at least one party, so the max is participants minus one. For rendering, I need separate functions for people, expenses, and balances, while preserving the payer dropdown's selected value across rerenders — and I don't think removing a person needs to cascade into existing expenses. For expense deletion, I'll skip confirmation and just move focus to the expenses heading afterward, and I'm setting up a showError helper to display validation messages tied to a specific input.

Now I'm structuring the markup for each expense list item, showing the description, amount, payer, and a readable breakdown of who owes what, plus a remove button labeled with the expense name for accessibility.

For splitting text, I'm handling the case where shares are equal by writing "Split equally between A, B and C ($X each)" versus listing individual amounts otherwise, and I need a small helper to join names naturally like "A, B and C" without a heavy dependency.

Then I'm laying out each balance row with the person's name, a status word ("is owed" or "owes"), and a signed dollar amount styled positive or negative depending on their balance.

I'm also covering settle-up rows showing who pays whom and how much, plus empty-state messages for no people, no expenses, and everyone settled, and adding a "Start a new trip" reset button with a confirmation and warning hint, while making sure the layout stays usable on narrow screens.

Writing CSS variables and layout rules...

Adding more styles...

Adding button hover states...

Since I can't use red for errors, I'm keeping the error text in Harbour color with medium weight instead of a warning color, and finalizing the responsive padding for mobile versus desktop.

Now I'm building flexible row layouts for forms, with fields that grow and buttons that stack full-width on small screens, plus a checkbox group styled as a reset fieldset with accent-colored inputs.

Styling the chip list and expense list...

Checking mobile widths at 360px looks fine. For the amount input I'll add a hint about decimal places and CAD formatting, and I'll build all DOM elements via createElement/textContent rather than innerHTML to avoid injection risk. For duplicate name validation I'll preserve the existing stored casing in the error message rather than the newly typed casing.

After adding a person I'll clear the input and refocus it; after logging an expense I'll clear description and amount, reset all split checkboxes to checked, and refocus the description field while keeping the payer selection. For re-rendering the split checkboxes, I'll read currently unchecked names straight from the DOM before rerendering so existing choices persist, with new people defaulting to checked. I'll validate that at least one person is checked for the split, that people exist before allowing an expense to be logged, and that a valid payer is chosen, each with its own error message.

When there are no people yet, I'll show a note inside the expenses panel telling the user to add people first. For focus management after deleting an expense, I'll move focus to the "Expenses" heading (given tabindex -1) rather than jumping into the form unexpectedly.

For storage, I need to validate loaded data carefully: people must be unique strings, expenses must have valid descriptions, positive integer cents, a payer that exists in the people list, and a non-empty subset of people for the split — filtering out anything invalid. For generating expense IDs I'll use crypto.randomUUID when available, falling back to a timestamp-based approach otherwise.

Setting up the core app structure...

I'm wiring up the reset button as a destructive secondary action with a confirm prompt, then working out the empty-state logic for balances and transfers—showing balances for all people once expenses exist, and messaging like "Everyone is even" when there's nothing to settle up.

For the share breakdown text, I'm handling the single-person case separately from equal splits so it doesn't read awkwardly, phrasing it as "Not split, X owes the full amount" rather than listing one name with an "each" suffix.

