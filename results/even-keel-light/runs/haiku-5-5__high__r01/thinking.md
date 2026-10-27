I'm working out the requirements for a single-file app: validating people names for uniqueness and trimming, and handling expense entry with amount validation, payer selection, and splitting shares evenly in cents with remainders distributed to selected people in trip order.

For display, I'm planning newest-first expense lists with delete buttons, inline error handling that preserves typed values, and balance calculations (paid minus share) with signed cents in testid attributes. For settling up, I'm using a greedy algorithm matching largest creditors with largest debtors to minimize transfers to at most n-1. I'm also deciding on currency formatting via Intl.NumberFormat, localStorage persistence, empty states, responsive design at 360px, and accessibility — plus a visual direction using Harbour and Signal colors, pairing Newsreader for headings with Figtree for body text and tabular numerals for figures, on a warm paper-toned background.

Now I'm checking contrast ratios between my accent colors and backgrounds to make sure text stays readable, calculating luminance values to verify the Signal red passes accessibility standards against white and paper backgrounds, and adjusting to a darker shade for text use where the original color falls short.

For the design itself, I'm sketching a simple "Even Keel" wordmark with a small level/keel icon and a plain tagline, keeping the layout organized into clear sections for people, expenses, and balances.

For structure, I'm planning a header with the brand and tagline, and considering whether to add a "clear trip" reset feature — but I'll skip the confirm dialog approach since it risks interfering with automated testing, and a reset isn't essential anyway.

For the main app content, I'm laying out a People section with a name input, add button, validation error span, and a list with an empty state, followed by an Add an expense section with description, amount, payer select, and a fieldset for choosing who splits the expense via checkboxes.

I'll make that fieldset itself the container with the test id, add the expense button and error handling, then design the Expenses section listing each expense with description, amount, payer, and split details plus a delete button, followed by a Balances section showing a list of per-person balances.

Each balance item needs person and cents data attributes, labeled as owed/owes/settled, including people with zero balance. For Settle up, I'm listing transfer suggestions like "Ana pays Ben $12.50" with from/to/cents data. For the payer select, I'll disable or placeholder it when there are no people yet, and decide whether to block expense submission entirely or just show an error message when no people exist.

I'll keep the form always rendered and rely on validation error messages instead of disabling inputs. Names get trimmed and stored as-is, with an escape helper to safely render them in templates without injection risk, and since there's no rename or delete feature, storing expenses by payer name stays stable. For amount parsing, I'm using a regex to allow values like "12" or "12.5" with up to two decimal places.

For friendliness, I'll also strip optional "$" prefixes and comma thousands separators before validating, then convert the cleaned string into cents by parsing the integer and fractional parts separately, rejecting anything that comes out to zero or less with an error message.

I should cap the amount at some reasonable maximum like a billion dollars and give a specific "use at most two decimal places" error when there are three or more decimal digits, falling back to a generic format error otherwise. An empty amount field needs its own "Enter an amount" message.

For the split section, I need validation for unselected people and missing payer, then I'm working out the share computation by filtering selected people in their original insertion order and dividing the total among them.

I'll distribute remainder cents to the first few members so totals add up exactly, then compute each person's balance as paid minus owed, which should sum to zero across everyone by construction. For settling up, I'll use a greedy approach pairing the largest creditor with the largest debtor repeatedly, which guarantees the number of transactions stays bounded, breaking ties by original person order for determinism. I'm also considering showing a small breakdown like "Split 3 ways · Ana $4.17, Ben $4.17" under each expense for transparency, accepting it may wrap on narrow screens.

I'll settle on displaying "Split between: names" plus a separate "Shares:" line for clarity, format currency with Intl.NumberFormat for CAD, and label balances as "is owed $X" or "owes $X" depending on sign. For persistence I'm using a versioned localStorage key with validation on load and saving after every change, generating expense IDs from timestamp plus randomness, and rendering the list newest-first by reversing the insertion-ordered array. I'm also adding input validation for new people — trimming empty names, catching duplicates, and capping name length.

When a person is added, I need the expense form's split checkboxes to re-render with the new person checked by default while preserving any existing unchecked selections, tracking this with a draft selection set that resets after a successful expense submission but persists through validation errors. I'm also defining focus-visible outline styles using the Signal accent color with an offset for keyboard accessibility, and planning to shift focus to invalid inputs after form errors.

For focus management after actions, I'll return focus to the name input after adding a person and fall back to the section heading after deletions. For error display, I'm deciding to render the error element only when a message exists rather than toggling a hidden attribute, using a single paragraph with role="alert" per form so tests checking for the error element won't catch stray hidden nodes.

I'm keeping static form markup rendered once and using targeted innerHTML updates for lists, balances, select options, and checkboxes so typed input values and focus aren't lost on re-render. Each form gets its own error slot container that I update via a setError function, and I'm wiring aria-invalid on inputs with aria-describedby pointing to the error element id.

Writing the header and people section HTML...

Finishing the expense form markup...

Building the expenses list section, with each entry showing description, payer, and split details in a card-style layout.

Adding settle-up section...

For the transfer line item I'll show "Ben pays Ana $12.50" format, and I need to handle empty states too -- something like "Nothing to settle yet" when there are no expenses, and a celebratory message when everyone's balanced out.

For copy, I'm adding a reassuring note that owing money between friends is normal and the transfers just make things even. Now I'm picking fonts -- Newsreader for headings gives an editorial feel, paired with Figtree for body text.

Defining the color palette...

Writing responsive grid layout...

Defining layout grid areas...

I'll wrap sections into two column groups instead—col-a with people, add expense, and balances; col-b with expenses and settle—so the mobile stacking order naturally flows as people, form, balances, expenses, settle.

Finalizing the grid areas spanning expenses across two rows should work fine even if it leaves some gaps — acceptable tradeoff.

For desktop at 900px+, I'm setting up a two-column grid with people/add-expense on top and expenses spanning down alongside balances and settle. For card styling I'm planning white backgrounds, subtle borders, rounded corners, and Newsreader headings in the harbour color, plus thinking about a small brand mark — a level-line SVG with a centered dot in signal color — and a navy masthead with paper-colored text for strong identity.

I'm verifying contrast ratios for the masthead text and tagline colors against the navy background, both comfortably passing. Then I'm defining button styles — harbour-colored primary buttons with white text, visible focus rings in signal color, quiet bordered delete buttons, and input fields with borders chosen to meet the 3:1 non-text contrast requirement against white backgrounds.

For typography I'm setting body text in Figtree with tabular numerals for money values, considering Newsreader for larger balance figures to add editorial character. On mobile I'm laying out checkboxes in a responsive grid, stacking expense items vertically, and keeping balance rows as space-between flex containers while guarding against horizontal overflow.

Now I'm moving to the JavaScript, setting up a storage key, currency formatter, and state object, then designing a draft split selection using a Set that defaults to all people and updates as expenses are added or people change.

I'm writing the load function to safely parse and validate localStorage data, filtering out malformed people or expenses, along with a save function wrapped in a try/catch, a short unique ID generator based on timestamp and randomness, and normalized name keys for duplicate checking.

Writing addPerson validation...

If no error, I push the new person, save state, clear the input and error, add them to the draft split, re-render, and refocus the input field. Now I'm moving on to the expense-related logic.

I'm writing a parseAmount function that strips a leading dollar sign and commas, trims whitespace, and validates the result: empty input gives an error, amounts with more than two decimal places get flagged, and a regex extracts the integer and decimal parts to confirm the format is valid.

Now I'm converting the parsed dollars and cents into a total cents integer, checking for safe integer bounds and a max cap to catch overly large amounts, and rejecting zero or negative totals.

I'm laying out validation order: description trimmed and length-capped first, then amount, then payer (checking for an empty people list before an invalid selection), then the split selection requiring at least one chosen person. Now I'm writing a helper to divide the total cents evenly among the selected names, handling the remainder distribution...

Storing each expense as its description, amount in cents, payer, and the ordered list of split names, since shares can always be recomputed deterministically on render. After adding an entry I'm resetting the description and amount fields while keeping the last payer and split selections, then shifting focus back to the description input so another expense can be logged quickly.

Writing the balance computation logic...

Now I'm working out a settle-up algorithm using a two-pointer approach that matches debtors against creditors, transferring the minimum owed/overpaid amount each step and advancing whichever side reaches zero first, so every iteration resolves at least one person's balance.

For rendering, I'm planning the people list, payer/split selectors, expenses, balances, and settlement views, each preserving current selections, plus click-based deletion handling for expenses that updates state and re-renders everything.

When the expense list empties out, I'll shift focus to the expenses heading for accessibility. I'm also deciding to clear form errors as soon as the user edits a field, rather than waiting for resubmission, and setting up aria attributes for error messaging.

For split errors I'll just focus the first checkbox since aria-invalid doesn't apply cleanly to a fieldset. I'm also checking color contrast for the error text against its tinted background to make sure it's readable.

Each form error gets wrapped in a paragraph with role="alert" so screen readers announce it when inserted, and I'm writing an escaping helper to sanitize names in data attributes. For expense details I'm formatting the paid-by, split-between, and per-person share lines, plus a header showing total spent and expense count.

I'm also planning empty states for each section—people, expenses, balances, and settle-up—each with a short guiding message, and deciding whether to render lists as ordered lists or fallback paragraphs when empty.

For balances and settle sections I'll apply the same hidden-toggle pattern depending on whether there's data to show. Now I'm moving on to designing the masthead logo SVG.

I'm sketching a simple circle-and-line icon resembling a spirit level bubble, fitting the "even keel" theme nicely. I should also remember to mention "Canadian dollars" in the amount field.

Now I'm working out the heading hierarchy — brand name as h1 in the header, sections as h2, individual expenses as h3 — and confirming the main element should wrap all the app's content sections while the header sits outside it. I'll skip adding a skip-to-content link for now, and plan a small footer note reminding users that data is saved locally and amounts are in Canadian dollars.

Writing CSS variables...

Styling the masthead now...

Setting up the wrapper width constraints and defining a single-column grid layout with named areas for people, add, expenses, balances, and settle sections...

Adding form field styles...

Adding button and focus styles...

Styling the checked state with a highlighted border and background, relying on modern :has() support, and making sure the checkbox input itself gets proper focus styling via the global focus-visible rule.

Now I'm adding the form error banner with a signal-colored background and border for validation messages, then styling people as pill-shaped chips using flex-wrap layout with harbour-mist backgrounds, and starting on an empty-state style.

For the expenses list, I'm sketching out a card-based grid layout for each expense entry, trying to balance description, amount, meta info, and a delete button — considering whether to use grid or flexbox for the top row before settling on a simpler block structure.

For the balances list, I'm styling each row as a flex layout with name on the left and amount on the right, using tabular numbers for alignment, a subtle top border between items, and color coding — harbour blue for positive, signal red for negative amounts.

For transfers, I'm laying out each transfer as a flex row with "Ben pays Ana" style text on one side and the amount on the other, giving it a rounded card background with wrapping support for smaller screens. Then I'm moving on to style the footer text with muted coloring and a smaller font size.

Now I'm starting the full HTML document structure, setting up the meta tags, fonts, and page title before building the masthead header with the brand name.

Writing the people section...

Adding the empty-state message for the people list, and reconsidering where to place the error slot — I'll put it right after the field inside the form, before the list, keeping the describedby association intact.

I'll manage aria-describedby dynamically, combining the hint id with the error id only when an error exists. For layout, I'm using a flex row with the input taking remaining space and the button fixed-width, checking it fits comfortably at 360px viewport width. Now starting the expense form section markup.

Finishing the split-options checkboxes and error slot, then I realize the fieldset reusing the "field" grid class might clash visually, so I'll give it its own styling instead.

I'm working out the responsive grid for amount/payer fields—stacking to one column below 560px and two columns above—checking that it fits within a 360px card without overflow. I'll skip adding quick-select "Everyone/Clear" shortcuts for the split options since they're not essential, and move on to the expenses section.

I'm structuring the expenses section with a heading, summary hint, an ordered list for entries, and an empty-state message, followed by a balances section showing each person's net position and a settle-up section listing the minimal set of payments needed to even everyone out.

Now I'm starting the JavaScript, setting up storage keys, currency formatting helpers, DOM shortcuts, HTML escaping, a unique ID generator, and length limits for names and descriptions, then beginning the load function that parses saved state from localStorage.

The load function validates that people and expenses arrays exist, filters people to only those with valid names, and ensures expenses reference valid payers and split members with positive integer cents amounts, falling back to empty arrays if anything is malformed or parsing fails. I'm considering whether people need their own IDs but deciding names alone suffice as identifiers for now.

I'm writing the save function to persist state to localStorage with error handling, plus a splitCents helper that divides a total evenly among names while distributing any remainder cents to the first few people. I want expense splits stored in trip order rather than arbitrary order, so I'm mapping each person's name to their index in the people array and sorting splits accordingly for robustness. Now I'm setting up error handling helpers that insert error messages into designated slots in the form and manage focus for accessibility.

Writing error handling helpers...

Checkboxes already fire "input" events in modern browsers, so both listeners cover them fine, and clearing errors only on input (not on focus) seems right. Now moving on to the person form.

I'm wiring up the submit handler to trim and normalize the entered name, validate it's non-empty, within the max length, and not already used (case-insensitively), then add the new person to state and save.

I should improve the duplicate-name error to reference the existing entry's casing, something like `"${name}" is already on the trip as "${existing.name}". Names must be unique, ignoring capitals.` Then clear the input, reset errors, re-render, and refocus the field.

Now I'm writing the expense form's submit handler: trimming and normalizing the description, validating it's non-empty and under the max length, parsing the amount into cents, and checking that at least one person exists before proceeding.

Finishing the submit logic: verify a payer was selected, ensure at least one split participant is checked, then push the new expense into state, save, reset the form fields, and re-render. I should double-check the validation order—checking for people before description, and surfacing the right focus target for each error.

For the split checkboxes, I'm wiring a change listener that adds or removes names from the selected set as boxes are toggled, and making sure error clearing fires correctly whether triggered by input or change events.

I'm reasoning through when renderSplit should rebuild the checkboxes versus leaving them alone, deciding it's fine to rebuild on every full render since there's no real focus conflict. Now I'm writing the payer dropdown logic, preserving the previously selected value and disabling the select with a placeholder option when there are no people yet.

Writing checkbox markup...

Now I'm setting up the people list and expense list rendering, using chips for people and preparing an ordered list for expenses based on person order.

For each expense, I'm building a card showing the description, amount, payer, split participants, and each person's calculated share, plus starting on action buttons.

I also toggle the empty-state message versus the list and compute a summary line with total count and sum. I'm double-checking that split names and order lookups are always valid since they're validated on load, so no undefined cases slip through.

For deleting expenses, I'm wiring up a delegated click handler on the list that filters out the removed item by id, saves, re-renders, then moves focus back to the expenses heading—acceptable even though it's a slight UX compromise versus focusing the next delete button. Now I'm writing the balances rendering logic, mapping each balance to a status of "is owed" or "owes" based on the sign of the cents value.

Adding transfer list rendering...

That case works fine when there are no expenses at all. I'm now setting up a renderAll function that calls all the individual render functions in sequence—people, payer, split, expenses, balances, settle—to keep everything in sync.

I should check that renderSplit preserves checkbox selection state across rebuilds, shows a hint when no people exist yet, and handles the initial render with all checkboxes selected by default, including a test scenario where some checkboxes get unchecked before submitting an expense.

I'm also verifying error-handling behavior: invalid submissions keep what the user typed rather than resetting, only one error message shows per invalid field, and errors clear when the person form receives input. I want to make sure amount validation handles decimals and comma-separated numbers correctly, and that the form uses novalidate with visible labels and proper ARIA attributes for accessibility.

I'm writing the parseAmount function to strip dollar signs and commas, validate the numeric format with a regex, reject more than two decimal places, cap the max dollar value, and convert to cents while rejecting zero or negative amounts -- checking edge cases like empty strings, malformed decimals, and negative numbers to make sure each produces the right error message.

Now I'm moving to CSS for mobile layout at 360px width, checking that the masthead, card padding, inline input/button row, and checkbox grid all fit comfortably without overflow.

Beyond that, I'm making sure expense headers wrap correctly with long text, settle-up rows wrap on narrow screens, and grid items use min-width:0 to avoid overflow. I'm also adding overflow-wrap to chips for long words, confirming the desktop column layout works, and considering a small stylistic touch like numbered section labels.

I'm thinking of adding editorial eyebrow labels above each section heading — small uppercase text in signal-ink color with letter spacing — to give each step a short descriptive tag like "The group," "New cost," "The ledger," "Where things stand," and "Next step," implemented as a span above each h2.

I'm now verifying smaller UI details: a signal-colored top rule under the masthead, keeping button styling consistent with a single primary class, checking the tagline color contrast against the navy background (comes out around 7.7, solidly passing), and confirming delete buttons and input placeholder colors stay legible and unobtrusive.

Writing base CSS...

Styling the brand and tagline...

Adding more component styles...

Styling balance list rows...

Good, color isn't the only signal since status text conveys meaning too. Now I'm styling the transfer list items as flexible cards with rounded corners and spacing...

I realize I need to force `[hidden]` to use `display:none !important` so it properly overrides the grid display on balances. Then I'm styling the chips as pill-shaped tags with wrapping and a soft background.

Now I'm setting up the two-column grid layout for form fields with responsive breakpoints, spacing out fields and fieldsets with legends, and starting on footer styles...

Setting footer padding, eyebrow label styling with uppercase letter-spacing, heading typography using the serif font, and defining visible focus outlines for accessibility.

Rather than relying on focus-visible nuances for programmatic focus, I'll simplify by always showing a solid outline on focus globally, ensuring requirement compliance even if it means mouse clicks also show the outline.

Settling on grid-area classes for the layout regions, keeping main as the wrapper with its testid, and finalizing card headers like "Expenses" before writing out the full stylesheet.

Handling edge cases now: showing a hint message when there are no people to split with, using a placeholder option in the payer select, and confirming expenses can be removed. I'm verifying the split fieldset holds one checkbox per person, no stray error elements appear when there's no error, and running through a quick balance example with Ana, Ben, and Cy on a $10 expense to sanity-check the math.

The remainder-cent rule distributes leftover pennies to selected people in the order they joined the trip, which checks out against the settle-up logic. I'm also confirming form submission handling, native keyboard support, and font fallback behavior before moving to the masthead icon.

Writing SVG code...

Now I'm verifying field labels match expected text, setting the document language to en-CA, assigning the expense-summary element its id, and planning to write the full document in one pass, confirming the script runs after the DOM loads and checking that error-clearing functions reference the correct form and slot ids for both person and expense forms.

I'm also refining accessibility: making sure each field's aria-describedby combines both its hint and error ids rather than overwriting the hint, so screen readers still get context like "person-hint" alongside "person-error", and ensuring clearErrors restores the describedby back to just the hint when an error is cleared.

