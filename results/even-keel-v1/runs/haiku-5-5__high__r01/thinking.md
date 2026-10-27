I'm planning out the full structure of the single HTML file, covering validation rules for adding people and expenses—name uniqueness checks, required fields, amount formatting, payer selection, and split checkboxes with appropriate test IDs.

For splitting costs, I'm distributing cents evenly with the remainder going to the first selected people in trip order, then computing each person's net balance. For settling up, I'm using a greedy algorithm that matches debtors to creditors so the number of transfers stays minimal, formatting all amounts as CAD currency.

For balances, I'll show the signed amount with clear "owes"/"is owed"/"even" labels alongside a minus sign for negatives. State persists in localStorage with people and expenses stored in insertion order but displayed newest-first, and I'm skipping person removal since it's not in the spec.

For amount input, I'm deciding on a text field with decimal keyboard support rather than a strict number input, and designing a validation regex that strips an optional leading dollar sign and commas before checking for a valid decimal format with up to two decimal places.

I'm also mapping out error messages for each failure case—zero or missing amount, missing description, no people added, no split selection, and no payer chosen—while confirming the payer doesn't need to be part of the split itself.

For the amount field, I'll use a decimal-mode text input labeled "Amount (CAD)" with autocomplete off, and I'm working through how to structure the error elements so tests reliably find only the currently visible one rather than conditionally rendering duplicates across form sections.

I'll keep an always-present error slot container in the DOM, but only insert the actual error paragraph with its test id when there's a message to show. For accessibility, I'll link the input to the error via aria-describedby and set aria-invalid, keeping focus on the input itself rather than moving it to the error.

For rendering, I decide against a full innerHTML re-render since that would wipe out focus and typed values—instead I'll write separate render functions for the lists (people, expenses, balances, transfers, payer select, split checkboxes) while leaving form inputs untouched. The split checkboxes sync logic adds new checked boxes for new people while preserving existing checked states, and on successful expense submission I'll clear the description and amount fields and reset the split selection.

On successful person addition, I clear and refocus the input, defaulting new split checkboxes to checked. For the payer select, I'll add a placeholder option when there are no people yet, default to the first person if none is selected, and preserve the current selection if it's still valid; I'm leaning toward keeping the expense form enabled even with no people, just relying on tests to add people first rather than disabling fields outright.

For balances, I'm computing each person's total paid minus their share across expenses, with splits distributed according to the order people were added to the trip. Each balance row shows the person's name and status ("Is owed", "Owes", or "Even"), formatting negative amounts with a proper minus sign prefix on the absolute value.

I'll lay out the row as name on the left and the signed formatted amount on the right, with a small status label—"is owed", "owes", or "even"—colored Kelp for positive balances and Harbour for zero or negative ones.

For transfers I'll phrase them as "Ana pays Ben $12.00", using the positive cents value. For settle-up, I'm computing a balances array and using a greedy algorithm: repeatedly match the largest creditor with the largest debtor, transfer the minimum amount between them, zero out whichever side clears, and remove settled entries—this guarantees the transfer count stays deterministic and bounded.

Now I'm drafting copy for empty states: prompting users to add people when there are none, to log an expense when there are none, noting that balances only appear once an expense exists, and showing "Everyone is even" or a prompt to log an expense for the settle-up view depending on whether expenses exist. I'm also finalizing the wordmark treatment—"Even Keel" in Fraunces with a small rule accent—plus a short supporting tagline about splitting trip expenses evenly.

I'm setting heading hierarchy, with "Even Keel" as h1 and section labels like People, Expenses, Balances, and Settle up as h2s, plus sentence-case field labels like Name, Amount, Paid by, and Split between. I'm also laying out the overall page structure—a centered max-width container with bordered white panels and consistent 8px spacing—and thinking through how to handle button hover states within the restricted color palette, since tints aren't allowed and only Signal is reserved for primary buttons.

For hover states I'm settling on shifting the primary button background to Harbour since it's already in the palette, and defining secondary button styles with Paper background, Rope border, and Harbour text. I'm also specifying input styling—Paper background, Rope border, 16px font to avoid mobile zoom, and a Harbour focus outline—along with checkbox accent colors, then checking text contrast ratios for Fog on Sailcloth, Kelp on white, and Signal with Paper text to make sure everything meets accessibility thresholds.

Now I'm finalizing the type system: linking Fraunces and IBM Plex Sans from Google Fonts with system fallbacks, picking a size scale of 14/16/20/28/40px, and deciding the wordmark should be 40px on desktop and 28px on mobile. I'm also adding tabular numbers styling for monetary values to keep digits aligned.

I'm using sentence case throughout, avoiding all-caps labels, and structuring the expense form with a fieldset/legend for the "Split between" checkboxes so it's accessible. For mobile I'm making inputs full width with safeguards against horizontal overflow, and laying out each expense row with the description and amount aligned, plus a meta line showing who paid.

For the split and person lists, I'll list actual names rather than summarizing as "everyone" since tests likely check for specific name text, and I'll build elements safely using textContent or an escape helper to avoid injection when rendering the remove button's aria-label and list items.

After deleting an expense, I'm moving focus to the expenses heading (made focusable with tabindex -1) instead of letting it fall back to body. For persistence, I'm using a versioned localStorage key with defensive validation on load, and structuring state as a list of people plus expenses that each carry an id, description, amount in cents, payer, and split array.

Expenses stay stored in chronological order but display reversed, and shares are computed at render time by dividing cents evenly across split members with any remainder distributed to the first few by people order. Balances are derived by adding the full amount to the payer and subtracting each person's share. For names, I'm just trimming and comparing case-insensitively for uniqueness, without collapsing internal whitespace.

Now I'm drafting the specific validation error messages for each form field — empty name, duplicate name, empty description, invalid or zero amount, missing people, missing payer, and empty split selection — along with deciding where each error should appear within its form section.

I'll place the error block right above the submit button for simplicity, using an alert role so screen readers announce it and shifting focus to the offending field. For the amount input I'm setting it up as a decimal text field with a CAD hint example, and the description field gets a character limit, while the add-person form just needs a simple name label.

For form submission I'll use preventDefault handlers so Enter still works naturally, but I'll add novalidate and avoid the required attribute so native browser validation doesn't interfere with my custom error messages, relying on aria-required instead for accessibility. There's no cap on the number of people, and for the settle-up section I'm building a list of transfer items like "Ana pays Ben $12.00" with test-friendly data attributes for the sender, recipient, and amount in cents.

I'm designing the balances list next, with each entry showing a name, a status phrase (owes, is owed, or even), and a formatted amount colored to match the status, handling the edge cases like negative zero formatting correctly with Intl's currency formatter.

For the transfers, I'm writing a greedy debt-settlement algorithm: splitting people into creditors and debtors, then matching the smallest outstanding amounts between them until all balances reach zero, recording each match as a transfer.

I'm confirming the loop bound stays within k−1 transfers since each step zeroes out at least one person, and planning to save state after every mutation and render the people list and split sections from persisted data.

For the render pass, I need a single function that refreshes the expense list, balances/transfers, and the payer select while preserving user selections—so checkboxes keep their checked state and the payer dropdown retains its previous value if that person still exists, defaulting to the first person otherwise, with a disabled placeholder option shown when there are no people yet.

I'm deciding to keep the expense form inputs enabled even with no people, instead showing an inline message prompting the user to add people first, and surfacing validation errors on submit rather than disabling fields outright. Now I'm starting to lay out the HTML structure for the app, beginning with the main container and header markup.

Building the people panel markup...

For the person form layout, I'm planning a flex row that wraps on smaller screens, with the name field taking available space and the error slot spanning full width below. The aria-describedby link to an empty error slot is fine semantically.

Now I'm starting the expense panel with its own form, beginning with a description field.

Continuing, I'm adding the amount field with a hint, a payer dropdown, and a fieldset for split options containing a container for checkboxes, plus an error slot and submit button. Then I'm sketching the expenses list section with a focusable heading and an empty list placeholder.

Now I'm planning balances and settle-up sections with similar list structures and empty states, wrapping everything in a top-level main element. I'm also thinking through hint text wording (like clarifying name uniqueness) and styling details for panels, list dividers using subtle borders, and button typography.

Working out button states next, including primary and secondary variants with hover and focus-ring treatments for accessibility, plus input field styling—though I'm flagging a potential contrast issue where border colors on inputs might not meet WCAG's non-text contrast requirement for UI component boundaries.

Now I'm structuring the checkbox and split-option layouts with flex wrapping, then moving to the expense item row design with description on one side and amount/remove-button on the other, wrapping responsively on mobile.

For the person, balances, and transfer list items, I'm keeping names simple without extra stats, laying out balances as flex rows with name/status on the left and tabular-aligned amount on the right, and formatting transfers as "Name pays Name" with the amount styled using a monospace-numeric money class for alignment.

Now I'm setting heading sizes and typography: h1 as the wordmark at 28px mobile/40px desktop using Fraunces 600, h2 at 20px Fraunces 600, and a 16px Fog-colored tagline beneath it. I'm adding a small colored rule bar to the left of the wordmark text, then setting up the body and main layout with Sailcloth background, Harbour text, IBM Plex Sans at 16px, centered 720px-max content with responsive padding, and ensuring long names wrap safely on narrow screens.

I'm defining focus styles using a universal outline rule in Harbour color with offset, plus transition timing for buttons and inputs. Now I'm starting the JavaScript module, setting up currency formatting with Intl.NumberFormat for CAD and beginning the state loading logic that reads trip data from localStorage.

I'm writing validation logic to filter expenses by checking description, cents, payer, and split array types, then adding save and ID generation functions. Writing amount-parsing logic...

I'm now adding name validation for adding a person, checking for empty input and duplicate names case-insensitively.

Writing error display logic...

I'll clear the error message when the user starts typing again in that field, so stale errors don't linger after they've made a correction attempt.

For the expense submission logic, I'm writing validation that checks for at least one person before logging, requires a non-empty description, and validates the amount isn't zero or blank before proceeding.

Now I'm handling the payer validation and selecting who the expense splits between by reading the checked checkboxes, then requiring at least one person selected for the split. Once validation passes, I push the new expense with its id, description, amount in cents, payer, and split list, save state, and reset the form fields and checkboxes back to default.

For rebuilding the split checkboxes when people change, I'm preserving each person's checked state in a map before regenerating the checkbox list, defaulting new people to checked.

I'm also worried about losing focus if a checkbox is focused during rebuild, but since deletions happen in the person list rather than the split box, that's not an issue. To avoid unnecessary rebuilds, I'll compare a cached key of the current names against the new names and only rebuild when the set actually changes.

When an expense is added, I reset every checkbox to checked. For the payer select, I keep track of the previous selected value and preserve it after rebuilding options unless that person was removed, in which case I fall back to the first option. If there are no people, I disable the select and show a placeholder option, plus a hidden note reminding the user to add people before logging an expense.

For the people list, I toggle between an empty-state message and the populated list using hidden attributes rather than testids, and I'll write a small setEmpty helper to manage that. For expenses, I render them in reverse chronological order using a reversed copy of the array.

Each expense item shows the description, payer, and split participants with a remove button whose aria-label includes "Remove" plus the description so the visible text matches the accessible name. Deletion uses event delegation on the list, matching the clicked remove button's data-id, filtering it out of state, saving, and re-rendering. For balances, I'm computing a map of name to cents owed and starting to render each as a list item.

For transfers, I'm handling empty states too: no people/expenses shows a hint, everyone even shows "Everyone is even," otherwise each transfer lists who pays whom and the amount formatted as currency. Then I'm wiring up the render calls and event listeners for the person and expense forms to trigger re-rendering.

I also need an escape helper for safe HTML output, logic to clear and reset the expense form fields after submission while keeping the payer selection, and auto-focus/payer defaults when a new person is added. I should also make sure hidden elements are properly styled and that the fieldset for splitting between people has its default browser styling reset.

Checking accessible checkbox labels and select options, defining the color palette as CSS variables, and tuning responsive layouts so the person form and expense grid wrap sensibly on mobile.

For error messages, I'm reserving Signal red strictly for primary buttons and the wordmark rule, so errors instead use Harbour-colored, medium-weight text with padding rather than alarming red styling.

Now I'm setting up the item list styling: negative money values in Harbour, positive in Kelp, list items with flex layout and top borders between entries except the first child.

Meta text and balance status lines ("Is owed"/"Owes"/"Even") use 14px Fog. I'm double-checking the type scale stays within the allowed sizes (14, 16, 20, 28, 40) for amounts, buttons, headers, and the wordmark.

Setting up the document head now with language, title, favicon, and font preconnect links, with a fallback stack of Fraunces/Georgia/serif and IBM Plex Sans/system-ui/sans-serif in case the Google Fonts load fails.

Writing HTML head boilerplate...

Now I'm defining the CSS custom properties for the colour palette—harbour, fog, sailcloth, paper, rope, signal, kelp—and setting up base body styles with the sans-serif font stack, then adjusting the main container's max-width and padding with a mobile breakpoint.

Writing layout styles...

Designing the expense form as a responsive grid, stacking into a single column on mobile and expanding to a two-column layout with description taking more space on wider screens.

Checking the mobile width math confirms amount and payer will wrap onto separate rows since they don't fit together at narrow widths, which seems acceptable.

For the add-expense button, I'm making it stay full-size while letting the error slot take its own line so the button naturally drops below the split row. In the person form, I'm setting the field to flex-grow with a fixed button width, keeping align-items at flex-end so the button lines up with the bottom of the input.

I realize putting a hint paragraph under the input would break that bottom alignment, so I'll move hints out of the flex row entirely—placing them above the form, right after the heading, and associating them via aria-describedby instead of nesting them inside the field.

For the empty error slot, I'll just set it to `display: none` when `:empty`, so it collapses cleanly without leaving stray gaps, while still rendering when an actual error message is injected into it.

For the person form, I'll restructure so the error slot sits outside the flex row entirely—field and button stay on one line, with the error message rendered below as a separate sibling element, keeping aria-describedby intact. I'll apply the same pattern to the expense form.

For expense, order is description, amount, payer, split fieldset, error slot, then button. I'll style the error slot to take full width and hide itself when empty using an empty-state selector, so it only appears when there's actual error text inside.

Working out flex sizing for the checkboxes and split options...

Now styling the empty state message and list items with top borders between entries, keeping consistent padding and removing extra spacing on the first child.

Still writing layout styles...

Defining button color variants...

Adding focus outline styles...

Now I'm moving into the JavaScript, setting up a storage key and currency formatter before building out the main app logic with element lookups and helper functions.

Adding escape and state-loading helpers...

Still validating data structure...

Trimming people names on input, then wrapping saveState in a try/catch for localStorage writes. I'm generating a short unique ID using timestamp plus random base36 strings, and now sketching a helper to split cents evenly among members for each expense's share calculation.

Moving to balances: I'm iterating people to zero out balances, then applying each expense's payer gain and recipients' shares subtracted, using a null-prototype object to avoid key collisions like "__proto__". I'm also considering edge cases like empty splits, which should already be caught by validation before reaching this calculation.

For the debt-settling algorithm, I'm splitting people into creditors and debtors based on sign of balance, then greedily matching the largest debtor against creditor using a two-pointer approach, transferring the minimum amount each time and advancing whichever side hits zero — this guarantees termination since at least one side zeroes out per step. Now I'm starting the render functions, beginning with the people list markup.

For split options, I need to detect when the people list has changed so I can preserve checkbox states — I'm using a serialized key (switching to JSON.stringify for safety against odd characters) stored as a data attribute, and if it's unchanged I skip re-rendering; otherwise I capture the previous checked states by iterating existing checkboxes before rebuilding.

Now I'm doing the same pattern for the payer dropdown — tracking a key to avoid unnecessary rebuilds, preserving the previously selected value, and falling back to a disabled "No people yet" placeholder when the list is empty.

Writing expense list markup...

Still writing balance row markup...

Writing empty-state messages...

Now I'm defining the transfer list item markup with payer/payee names and formatted amounts, then wiring up a top-level render function that calls all the individual render routines for people, payer/split options, expenses, balances, and transfers in sequence.

I also need to show a helpful empty-state message prompting users to add people before logging expenses, hiding it once people exist. Then I'm writing error-handling helpers that inject an accessible error message into a section's error slot and mark the related field as invalid and focused, plus a corresponding clear-error function to remove that state.

I want clearing to also strip aria-invalid from any form fields, and I'm wiring up input listeners on both the person and expense forms so errors clear automatically as the user types.

Writing handlePersonSubmit...

Now I'm handling amount parsing errors, showing distinct messages for invalid format versus zero/empty amounts, then validating that a valid payer was selected before moving to split checkbox collection.

I'm checking that at least one person is selected for the split, then focusing the first checkbox if not. On successful submission I push the new expense into state, save it, clear errors, reset the form fields and checkboxes, re-render, and refocus the description input. For deleting an expense, I'm wiring a click handler on the list that finds the delete button, filters out the matching expense by id, saves and re-renders, then moves focus to the expenses heading for accessibility.

Now I'm going through the markup details — confirming data-testid attributes on person list items, labels tied to inputs by id, the split fieldset and legend text, button types inside forms, and making sure all section headings use sentence case ("People", "Add an expense", "Expenses", "Balances", "Settle up"). I'm also reviewing the hint text under the person name field about uniqueness being case-insensitive.

I'm figuring out layout alignment for form buttons — wanting the submit button bottom-aligned with its adjacent input, using flex align-self rules, while accounting for hint text and error slots that may or may not be visible and shift the layout.

I should double-check maxlength values for name and description fields to make sure they're generous enough, and confirm the error slot spans the full width when rendered on its own line.

I'm also checking that empty error messages collapse away via the `:empty` selector, and finalizing the legend and wordmark styling along with header spacing between panels.

Checking the narrow-width case at 360px: with panel padding accounted for, the person form's field and "Add person" button combined slightly exceed available space, but since the field can flex-shrink below its basis, it compresses to fit without overflow.

Then I'm checking the expense row similarly and confirming both wrap gracefully at this width. I'm adding `overflow-wrap: anywhere` and `min-width: 0` on titles/meta to protect against long names breaking layout, setting font-size to 16px on inputs to avoid iOS zoom, and making sure buttons/inputs inherit the page font.

Verifying edge cases: no placeholder text used, balance labels read correctly as "Is owed"/"Owes", settle-up transfer count logic holds, member ordering for leftover-cent distribution matches insertion order, payer-not-in-split still balances correctly, and empty/whitespace descriptions are rejected. All controls are native and keyboard-accessible, so I'm moving on to assembling the full HTML document, including the empty-state note prompting users to add people before logging an expense.

Now I'm positioning the various empty-state messages: the "add people to start logging expenses" note goes below the people form and list, the expenses-empty text sits under the expense form, and the balances-empty message covers the no-people case. I'm also confirming settle-up data attributes use "from" for debtor and "to" for creditor, balance elements carry a signed cents value as a data attribute, and checking how Intl formats negative currency in en-CA locale (expecting a leading hyphen before the dollar sign).

With the CSS kept compact but complete, I'm finalizing hover/focus transition timing under 150ms and moving into the JavaScript. Setting up local storage state management...

Writing storage load/save functions...

Now I'm adding an ID generator and an amount parser that validates dollar strings and converts them safely to integer cents, then starting a function to compute each person's fair share of an expense split, handling remainder distribution.

Writing balance computation logic...

Then I'm wiring up event listeners for the person and expense forms, including input/change handlers that clear validation errors as the user types.

Now I'm writing the onAddExpense handler, validating that people exist, the description isn't empty, and the amount parses correctly before proceeding.

The payer validation always passes since people is nonempty, and the split error correctly focuses the first checkbox. I'm double-checking that description length is capped via maxlength and that escaping is handled in render, then looking at clearError resetting the error message and aria-invalid attributes—it's fine to call on every keystroke even when empty. Now I'm checking the ordering logic in onAddPerson.

I'm reviewing showError, which sets the error message and focuses the invalid field. To ensure only one form-error shows at a time across both sections, I'm updating showError to clear all section errors before displaying the new one.

I'll add a shared clearErrors() helper used by both the typing listener and successful submissions, so adding a person or expense successfully wipes any lingering errors. Now I'm writing the renderPeople function to populate the people list.

Still writing styles...

Now I'm setting up renderSplitOptions with a cached key based on the serialized people list, so it only rebuilds the split options UI when the people actually change.

Payer select needs its value reassigned the same way after rebuild. The checkbox label markup is set, so I just need to double-check the hint text and the expense-split container structure before finalizing.

I'm verifying that the error slot and form elements are wired up correctly for clearErrors, then adding CSS for form errors and making sure fieldsets behave properly as flex items with min-width zero. Finally I'll add aria-required attributes to the name, description, and amount inputs and write everything out.

