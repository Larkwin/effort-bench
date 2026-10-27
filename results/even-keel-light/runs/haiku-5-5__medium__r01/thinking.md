I'm planning the data model for a single-file HTML expense-splitting app, including how to validate people names for uniqueness and expenses for description, amount formatting, and converting amounts into cents for accurate calculations.

For splitting, I'm using a base-plus-remainder approach so cents divide exactly among selected people, then computing each person's balance as paid minus their share. For settling up, I'm using a greedy two-pointer method matching creditors and debtors, which guarantees minimal transfers since balances always sum to zero. I'm deciding to skip person removal to keep things simple, since it's not a required feature.

For the expense form, I need the payer dropdown and split checkboxes to update dynamically as people are added, preserving existing selections while defaulting new entries to checked. For amount validation, I'm settling on a regex requiring a positive number with up to two decimal places, rejecting negatives, scientific notation, and malformed decimals.

I'll store data in localStorage as a single JSON object with people and expenses arrays, parsed safely with error handling, and build the DOM manually using a helper function to avoid XSS rather than innerHTML. For currency, I'm using Intl.NumberFormat to format cents as CAD values, with negative balances shown with a minus sign.

I'm planning the empty-state messages for when there are no people, expenses, or when all balances are settled, plus wording for settle-up transfers like "Ana pays Ben $12.00". I also need to decide whether to require a minimum number of people before allowing expenses to be added.

For the form error element, I'll have it render only when there's an active validation message, using a hidden attribute otherwise so the test can detect its visibility state correctly.

I also need to preserve form input values when an expense is rejected rather than clearing them, so users don't lose their entry on validation failure.

After a successful person add, I'll clear the input but keep focus there; after a successful expense add, I'll clear description and amount, re-check all split checkboxes, but leave the payer selection as-is. For name uniqueness, I'll compare trimmed lowercase strings without collapsing internal whitespace. For the visual design, I'm going with a Harbour navy and Signal red-orange palette on a warm off-white background.

I'm checking contrast ratios -- navy text on the paper background looks fine, and I'm working through the luminance math for the signal red-orange against white to confirm it meets accessibility contrast thresholds.

White on Signal red comes out to about 4.99, which passes AA, but Signal text on the paper background is borderline at 4.52, so I'll switch to a darker variant like #A63B22 for error text to stay safely above the threshold while reserving the brighter signal color for button backgrounds with white text.

Checking the muted text color against paper gives a solid 5.1 contrast ratio, so that's fine. For balance indicators I'm considering a harbour teal for positive and the darker signal red for negative values, and for typography I'm leaning toward Fraunces for headings to give a steady, warm feel paired with a clean sans or serif body font like Source Sans or Source Serif.

I'll settle on Fraunces for headings and Figtree for body text, using tabular numerals for money values. For layout, I'm planning a single-column flow under 760px with a wordmark and a plain tagline like "Split the costs. Keep the peace." The page will have sections for people, expenses, balances, and settling up, collapsing to one column on mobile and a two-column grid on desktop, with accessible focus outlines and labeled remove buttons for each expense entry.

Expense list items will show the description, amount, who paid, and a breakdown of each person's share in smaller text, while balance rows will clearly state whether someone is owed, owes, or is even. Now I'm starting to write the HTML document structure with fonts linked and CSS custom properties being defined for the color palette.

Writing CSS variables...

Writing form markup...

Now I'm designing the expense form with description, amount, and payer fields, plus a split fieldset containing checkboxes for each person in a labeled group.

I'm also planning the data structures for the expense list, balances, and transfer suggestions using simple containers with test IDs, then sketching a settle-up algorithm that calculates creditors and debtors from balances.

Still writing share logic...

I'm planning to use a Map instead of plain object keys to avoid prototype pollution issues with names like "__proto__". For storage, I'm defining the state shape as people and expenses arrays, saving after each mutation, and generating ids from timestamp plus random, with newest expenses shown first by reversing the render order.

Now I'm working out validation rules: expense descriptions need a max length and non-empty trimmed text, amounts need specific error messages for empty, malformed, zero, or too-large values, and I'm deciding to validate fields in order (description, amount, payer, split) showing only the first error and focusing that field. I'm also defining name validation messages for empty and duplicate names, plus a max length, and starting to build a helper function to set error messages on form fields.

Next I'm detailing how errors display with aria-live regions and aria-invalid flags, clearing errors on input, and rendering the people list with initials shown simply rather than hashed colors. For the payer dropdown and split checkboxes, I'm working out how to rebuild them on each render while preserving selection state—using a map of names to checked status so new people default to checked, and resetting all checkboxes after an expense is added.

I'm deciding renders only need to rebuild the split/payer controls when the people list changes, not on every mutation, to avoid disrupting focus while typing. Then I'm planning the balances section: empty states for no people or no expenses, settle-up messaging when everyone's even versus listing transfers, and formatting each person's balance as "is owed," "owes," or "is even" with the amount aligned to the right.

Writing the expense list item markup...

I'm also sketching layout and accessibility details: card styling with white backgrounds and subtle borders, Fraunces headings, touch-friendly buttons with signal colors and darker hover states, ghost-style remove buttons, sufficiently contrasted input borders, visible focus outlines, and a two-column grid layout for balances and settle-up sections on wider screens.

Writing the JS state and formatting logic...

Writing validation and save logic...

Still writing parser...

Checking edge cases like "1234" or "1234.5" against the regex, they all parse correctly since whole-number digits of any length are accepted before an optional decimal portion.

Now I'm writing the addExpense handler, validating the description field and parsing the amount before checking the payer selection.

Writing the expense save and form-reset logic...

I'm also writing a `shares` function to split an expense's cents evenly among selected people, distributing any remainder cent-by-cent so totals stay exact. I'm thinking through the edge case where the split set could be empty, which would cause a divide-by-zero — need a guard there, though it shouldn't happen with valid data.

Next I'm building a `balances` function that tallies what everyone paid minus what they owe from each expense's shares, producing a net balance per person. Then I'm writing a small DOM helper `h()` to create elements and assign classes, text, event listeners, or attributes based on prop names, which will make rendering components much more concise.

Writing render functions for the people list and form options...

Still rendering expense items... After removing an expense, I need to handle focus properly rather than letting it fall to body — probably moving it to the section heading or next item's delete button.

Now I'm writing the balances rendering function, showing each person's status as owed, owing, or even, with amounts formatted as currency, defaulting to $0.00 when balanced.

For the transfers section, I'm computing settlement suggestions and handling empty states: showing a prompt to add people, or a message saying everyone's even when there's nothing to settle. I'm also planning a summary line showing counts of people and transfers, with a single render function that calls renderPeople, renderExpenses, and renderBalances together and persists state.

Thinking about render triggers, I realize renderPeople rebuilds the split checkboxes via refreshFormOptions every time, so I should scope that call to only happen on people changes rather than every render to avoid unnecessary rebuilding while the user interacts with the form. I'm also adding a focus-visible outline style for accessibility and a legend label "Split between" for the expense split fieldset.

Now I'm styling the header brand area with the harbour background color and crafting a small logo SVG with a rounded rect, a horizontal bar, and a triangular fulcrum shape to represent a balance/scale icon for the app's branding.

For the main layout, I'm sketching card components with rounded corners and subtle borders, then planning a responsive grid that splits into two columns on wider screens so the balances and settle-up sections can sit side by side, while people and expenses get their own cards.

Now I'm styling form elements -- labels, text inputs, and selects with consistent padding, rounded borders, and focus states, plus an invalid-state treatment using a deeper signal color and a button style with the signal accent background.

I'm checking contrast ratios for the signal button colors to confirm they clear AA thresholds, then adding styles for a positioned currency prefix inside an amount input field.

Now I'm laying out the expense form's responsive grid and building checkbox-style split selectors with pill-shaped borders and adequate tap-target sizing.

Styling balance rows...

Adding transfer row text styling and an error message style with a colored left border for emphasis.

Now I'm defining dashed-border empty-state styling, a small circular avatar style, and laying out the people list as wrapped flex items with avatars and names. I'm also adding a small footer note about local storage and currency, and confirming reduced motion isn't needed here.

Skipping a "clear trip" reset button since it's not requested. I'm planning the heading hierarchy (h1 for brand, h2 for sections, h3 for expense titles), setting up the person count text and form submit handling so pressing Enter works, configuring the expense amount input for decimal entry, and drafting a balances subtitle explaining that positive means owed and negative means owing.

The settle-up card gets a heading and subtitle about minimizing transfers. Writing the DOM helper function...

Adding event listeners and refreshing form options...

I also need a legend inside the fieldset and a data-testid on it. For adding the expense, I'll grab the checked checkboxes' values as the split list, then reset the checkboxes back to default after submission.

For initialization, I'm wiring up form submit listeners, refreshing dropdown options, and calling a render function that in turn calls renderPeople, renderExpenses, and renderBalances. I'll also add a count label that pluralizes "person/people" and show a total spent amount in the expenses subtitle.

Now I'm writing error handling helpers that insert and clear alert messages in a form, mark invalid fields with aria-invalid, focus the problem field, and clear those errors automatically when the user starts typing or changing input again.

I'm also deciding to skip maxlength restrictions on name and description fields, relying on CSS overflow-wrap for layout, while planning the amount label with a dollar prefix and finalizing the main app container structure.

