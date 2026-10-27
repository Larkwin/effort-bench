I'm planning the data model for people and expenses stored in localStorage, plus a greedy settle-up algorithm that matches creditors and debtors to minimize transactions.

For splitting amounts I'm distributing remainder cents to the first people in trip order, and setting up amount validation with a regex allowing up to two decimal places. I also need name uniqueness checks and a form that preserves payer selection and split checkboxes when the people list updates.

Skipping person deletion since it's not required. I'm planning to render error messages only when present, using a data-testid element that's inserted into the DOM conditionally rather than just hidden, so it's absent entirely when there's no error.

On rejection I'll preserve the input values instead of clearing them, but on success I'll clear the description/amount fields and reset checkboxes to all checked. I also need to escape user input carefully using an escape helper in templates rather than raw interpolation, add a delete button with a descriptive aria-label, and build out the balances and transfers displays with their respective data attributes and wording like "is owed", "owes", or "settled up".

For visual design, I'm settling on Fraunces for headings paired with Figtree for body/UI text, and sketching out a warm paper-toned color palette while checking contrast ratios for accessibility.

Checking contrast math for the error text and accent colors...

I'm finalizing the primary button colors, accent usage for positive/negative balances, and focus-ring styling, then planning a responsive two-column layout for wider screens before starting to write the actual state and code.

Defining state loading and validation...

I'm working out the core functions: normalizing names, validating person entries against duplicates and length limits with specific error messages, and parsing currency strings into integer cents with proper decimal handling.

Now I'm designing expense creation and splitting logic - validating descriptions, payers, and split selections, then calculating per-person shares by dividing cents evenly and distributing any remainder, before moving on to computing overall balances.

For settling debts, I'm using a greedy algorithm that pairs creditors and debtors to minimize the number of transfers, then handling HTML escaping for names in rendered output and formatting expense rows to show who paid and how the cost was split.

For rebuilding form controls, I need to preserve checkbox and payer selections across re-renders — tracking unchecked names in a set so new people default to checked, and keeping the payer selection if that person still exists. I'll only rebuild the form's options when the people list actually changes, to avoid disrupting active typing or focus.

For errors, I'm adding a dedicated alert slot in each form with aria-invalid and aria-describedby wiring, plus wrapping localStorage writes in try/catch for safety. Now I'm ready to write the actual HTML markup.

Moving to CSS, I'm planning the warm cream background with Figtree body text and Fraunces for the "Even Keel" wordmark, a simple header rule instead of a custom mark, card styling with soft borders and rounded corners, tabular numerals for money values, and balance chip colors.

I'm settling on copy for the settle-up summary and empty states, using a direct "you" voice, then moving into the actual markup with sections for people, expenses, balances, and settling up, plus the JavaScript setup for state persistence and currency formatting.

Writing state load/save logic...

I'll structure the app around a render function that rebuilds the lists and balances display, a separate function for controls like selects and checkboxes, and a function for showing form errors that persist until the next submission attempt.

I'm clearing errors when the user edits an input rather than waiting for resubmission, which feels friendlier. For the people list I'm adding a colored avatar circle derived from a hash of each name's initial letter for a nice visual touch. Expense items get a description, metadata, amount, and a remove button with an aria-label, while transfer and balance list items carry data attributes for the payer, recipient, amounts, and person status for easy testing and display.

Now I'm wrapping the person and expense inputs in actual forms so pressing Enter submits them, with submit buttons carrying proper data-testid attributes, and generating unique ids for expenses using crypto.randomUUID with a timestamp-based fallback. I'm also structuring the split-selection UI as a fieldset with a legend and checkboxes per person, plus a select dropdown for choosing the payer with properly escaped option values — now I'm assembling all these pieces into the final markup.

