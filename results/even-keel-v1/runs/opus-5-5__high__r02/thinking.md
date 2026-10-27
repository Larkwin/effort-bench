I'm planning the HTML structure, sticking to the allowed color palette, font sizes, 8/4px spacing increments, 6px radius, and a 2px Harbour focus ring, while figuring out how to style error messages without using restricted colors like Signal red.

I'm running contrast calculations to verify Fog, Signal, and Kelp text colors meet AA standards against Sailcloth and Paper backgrounds, and checking whether Rope borders on inputs meet the 3:1 non-text contrast requirement for UI boundaries.

Since Rope on Paper falls short of that threshold, I'm weighing whether to keep Rope borders for brand consistency on panels/dividers while using Fog for form input borders instead, since visible labels help satisfy the identification requirement but a stricter accessibility check might still want higher-contrast borders specifically on interactive elements.

Ultimately I'll go with Rope borders everywhere per brand spec, since the explicit accessibility requirement only calls out text contrast, and I'll use Harbour for hover/focus states to boost visibility there. Checkboxes get a Harbour accent color with native styling, and selects stay mostly native with Paper backgrounds, Rope borders, and rounded corners. For typography, I'm sticking to Plex at 400/500 weights and Fraunces at 600 for headings.

I'm picking a minimal Google Fonts stylesheet URL pulling Fraunces 600 and IBM Plex Sans 400/500, and I'll skip the preconnect hint to keep external resources strictly to the one stylesheet. For sizing I'm settling on a 28px wordmark with a 24×3 signal mark beside it, 20px headings, 16px body, and 14px metadata text, plus a short supporting tagline under the wordmark. Layout-wise I'm planning a single column capped at 720px, ordering sections as People, Add expense, Balances, Settle up, then the expense list.

For state I'm structuring people and expenses as separate arrays, using names as identifiers for payer and split references since they're unique, and I'm deciding to let people be removed only when they aren't referenced by any expense, showing an inline message otherwise.

For splitting, I'll divide the amount evenly in cents, distributing any remainder cents to the first people in trip order, and store the split list sorted by trip order at creation time. Balances are just paid minus share per person, and settling up uses a greedy two-pointer match between sorted debtors and creditors to minimize transfers, keeping everything deterministic by amount then trip order. For amount input I'm using a text field with decimal input mode.

Writing amount validation regex...

I should also cap amounts to something reasonable like under $1 billion, and handle negative input with a clear "amount greater than $0" message. For displaying errors, I'll toggle a hidden attribute and set data-testid only when a message is actually shown, keeping per-field messages and focusing the first invalid field rather than a summary block.

For the payer scenario with no people added yet, I think the cleanest approach is to always render the expense form but show an empty-state message when there are no people, disabling relevant fields via fieldset rather than hiding the form entirely.

On errors I'll keep whatever the user typed rather than resetting; successful submissions should clear description and amount, reset the split to everyone, and move focus back to the description field. Split checkboxes default to all selected, and newly added people should also default to checked while preserving existing selections on re-render — I'll skip adding a separate "select all" convenience button to keep things simple.

For person names, I need validation for empty input and duplicates (case-insensitive comparison), plus a reasonable max length limit, trimming whitespace but not collapsing internal spaces.

For balances, I'm formatting signed cents into currency text with explicit labels like "is owed $12.00" or "owes $12.00" rather than relying on color alone, using Intl formatting which handles negative values correctly. For the transfer list, I want clear empty-state messaging depending on whether there are no expenses yet versus everyone being settled up, and the expense list should show newest first with details like who paid and who the split included, plus an accessible remove button for each entry.

After removing an expense I need to move focus sensibly to the next item's remove button or back to the list heading, and I'm defining empty-state text for expenses, people, and balances sections. For button styling, I'm keeping secondary buttons neutral with Paper background and Rope border, while primary buttons stay Signal-colored with Paper text, and hover states use underline rather than introducing new background colors that might conflict with the reserved color roles.

For focus states I'm using `:focus-visible` with a Harbour outline for buttons, and relying on native focus for inputs. The split-between checkboxes go inside a fieldset with a legend, each option styled as a bordered row with a Harbour accent checkbox, and I'm placing the test id on an inner container. For the amount field, I'm keeping it simple with a label indicating CAD and a small hint example rather than a prefix symbol. Finally, I'm settling on a localStorage key and planning validation when loading saved trip data, plus a "start a new trip" action.

I'm adding a "Clear trip" action with a confirm dialog, a visually-hidden live region for announcing additions/removals, and styling the headings with Fraunces and a Signal-colored rule. For responsiveness I'm adjusting padding and switching form rows and expense item layouts between side-by-side and stacked depending on viewport width, using tabular numbers for money and overflow-wrap for long names.

I'm putting the person's `data-testid="person"` on a span wrapping just the name rather than the whole list item, so the Remove button's text doesn't interfere with exact text matching in tests. I'm also making sure validation errors clear after a successful add.

For currency, I'm formatting amounts in CAD cents using Intl.NumberFormat, and computing per-person shares for expense splits — showing an even "$X each" or, when uneven, something like "$3.34 or $3.33 each". I'm building the DOM with createElement/textContent to avoid injection risk, and sticking strictly to the approved color palette, avoiding rgba/transparent and using "background: none" instead.

I'm deciding against placeholder text in inputs to keep with the no-sample-data rule, favoring hints instead, and skipping disabled states. For error messages, I'm keeping them as plain 14px Harbour-colored text at medium weight rather than adding icons or colored borders, and sizing fonts and button padding according to the type scale and spacing rules, though 12px breaks the strict 8px rhythm.

I'm settling on 48px height for buttons and inputs with centered padding, and defining panel spacing (24px padding, 16/8px gaps, Rope dividers and borders) for the layout sections. Now I'm starting the JavaScript, setting up localStorage persistence with a load function that validates the saved people and expense data, filtering out anything malformed like invalid payers or empty splits, before moving on to generating unique IDs for expenses.

I'm working out the logic for splitting expenses evenly among selected people while distributing leftover cents fairly, computing each person's running balance across all expenses, and then writing a debt-settlement algorithm that matches creditors and debtors to minimize the number of payments needed.

Now I'm planning the render functions for people, expense forms, expense lists, balances, and settlements — being careful to preserve form state like selected payer and checked split boxes across re-renders, and handling newly added people by defaulting their checkbox to checked. I'm also setting up error handling helpers that show/hide error messages and wire up proper aria attributes for accessibility on each form field.

I'm thinking through error-clearing behavior on input, using native form submission with novalidate so Enter still works, and the overall interaction flow: validating and clearing the person input on submit with focus management, preventing removal of a person referenced in an expense, announcing expense removal and shifting focus sensibly afterward, and tucking a confirm-gated "Clear trip" button into a small section that only appears once there's data. I'm also deciding to use labelled h2 sections for accessibility and figuring out what each balance list item should display — name, status, and amount.

Now I'm working through the visual details: color-coding balance status and amounts (owed vs. owing vs. even), adding a "Paid $X · Share $Y" meta line and a total spend display, styling the wordmark with a small accent bar and tagline, and setting responsive heading sizes. I'm also checking for horizontal overflow at narrow widths by adjusting padding, grid min-widths, and word-wrapping long text, plus styling checkbox labels and starting on a custom select dropdown with an inline SVG arrow.

Still writing styles...

I'm settling on font choices—Fraunces for headings at 600 weight, IBM Plex Sans for body—plus sentence-case labels throughout the UI and a visually-hidden class for the live region, before moving into writing out the full HTML structure starting with the header and wordmark.

Now I'm building the People panel with a name input and add-person button, followed by the expense form section with description, amount, payer select, and a split fieldset that defaults to everyone selected, leading into the balances section next.

I'm also sketching out layout spacing math for the mobile 360px width and refining hint copy for the split and amount fields, then moving into the JavaScript — setting up local storage keys, a currency formatter for CAD cents, and careful handling of zero/negative-zero edge cases in balance calculations before writing the state-loading function.

Writing state parsing logic...

For displaying newest expenses first, I'll just keep insertion order in the array and reverse when rendering, which is simpler than tracking timestamps separately. Now I'm writing an amount parser that validates user input, stripping dollar signs and commas, checking decimal places, enforcing a reasonable upper bound, and converting to cents while rejecting zero or negative values with clear error messages.

I'm adding a helper to join names into a readable list (like "Ana, Ben, and Cara") and a function to render the people list as list items with name spans and remove buttons, each wired with proper aria-labels and click handlers to delete that person, plus toggling the empty-state message based on whether anyone's been added.

For removing a person, I want to block deletion if they're still referenced in an expense, otherwise clean them from state. Then I'm writing the expense form renderer, which rebuilds the payer dropdown from the current people list while preserving the previous selection if still valid, and rebuilds the split checkboxes similarly, preserving prior checked state for known people and defaulting new people to checked.

I'm deciding to only re-render the form when people change, not on every expense change, to avoid losing focus unnecessarily—splitting into renderAll (init/people changes) versus renderTrip (expenses/balances/settle). Now I'm starting the expense list renderer, building each list item with a description and amount span...

I'm wording the split description so single-person expenses read naturally ("Only for Ana") versus multi-person ("Split between X and Y"), and handling the per-person amount text depending on whether the split is even or has remainder cents. I'm also planning the balances list rendering, with each entry showing the person's name, paid/share amounts, and settle-up status via test attributes.

For the transfer list, I'm setting up each item with data attributes for sender, receiver, and amount, plus the "X pays Y" phrasing, along with empty-state messages that adapt depending on whether people or expenses exist yet. I'm also adding a focus management after removing an expense, a live region announcer that clears then sets text for accessibility, and a clear-trip button with a confirmation dialog that resets everything and refocuses the name input. Finally I'm considering a simple storage-event listener to keep multiple tabs in sync by reloading state and re-rendering.

Now I'm writing out the CSS foundation — defining color variables for harbour, fog, sailcloth, paper, rope, signal, and kelp, setting up box-sizing resets, base typography with IBM Plex Sans, and the main app container's max-width and padding, including a responsive breakpoint for smaller screens. I'm working through the ambiguity of whether the 720px max-width should include or exclude padding, deciding to just apply it directly to the border-box container for simplicity, then starting on the wordmark styles.

I'm refining the wordmark with Fraunces serif styling and a small signal-colored accent bar before the text, then aligning the tagline beneath it with matching indentation. I'm defining heading styles, then building out the panel component with paper background, rope border, and rounded corners, followed by label, hint, and error text styles — considering whether to add a small icon before error messages using an inline SVG, but running into the complexity of coloring it dynamically through a data URI.

Now I'm styling the text inputs and select dropdowns with consistent height, padding, and border treatment, deciding against adding a hover border change since that interaction should be reserved for buttons. I'm adding a custom chevron icon to the select element and setting up focus-visible outline styles, being careful about how focus states interact between general and input-specific rules to avoid conflicting browser defaults.

Writing button styles...

For the secondary button I'll keep the hover effect simple with just an underline, skipping unnecessary transitions. Then I'm planning the list and expense row layouts: resetting default list styles, spacing items with top borders, and using a grid to position description, amount, metadata, and the remove button cleanly across two columns.

I'm now working through balance and transfer row layouts, assigning colors (kelp for positive, harbour for negative) and sizing for status text and amounts, then setting up a responsive two-column grid for the expense form and resetting fieldset defaults.

For the split checkboxes I'm styling flexible wrapped pill buttons with proper padding and overflow handling, deciding to skip select-all controls for simplicity. I'm also setting overflow-wrap rules for names and descriptions so long text doesn't break layouts, adding a hidden attribute rule, and starting on an error icon using an inline SVG.

I'm defining the error icon as an exclamation circle and the dropdown as a chevron, both as inline SVG data URIs using the Harbour stroke color. For the error message styling I'm laying out icon and text with flexbox, working out the vertical alignment between the 16px icon and 14px text by adjusting line-height and margin-top until they align cleanly, settling on a 24px line-height approach for the body text too.

For accessibility, I'm using aria-describedby to link inputs to their error messages, clearing the hidden error text so stale content isn't read by screen readers, and focusing the first invalid field after a failed submission. For split-payment validation I'm setting aria-describedby on the fieldset itself so the error announces when entering the checkbox group, and confirming that a payer not included in the split is still a valid state. Now I'm ready to write out the complete file.

I'm also walking through test scenarios: new people should default to checked in the split, successful submissions should reset all checkboxes to checked, and I need to decide how the expense form behaves when no people exist yet -- whether to hide it entirely or keep it visible with a validation error like "add at least one person" when someone tries to submit without a payer.

Writing the full HTML, CSS, and JS for the app...

I'm working through validation logic for the person and expense forms, covering duplicate name detection, error messaging for missing descriptions/amounts/payers/splits, focus management after errors, and balance/settlement calculations. I'm also detailing the removal logic for expenses and people (including focus restoration after deletion), the storage sync listener for cross-tab updates, and the markup/CSS for balance rows, transfer rows, and responsive expense card layouts at different screen widths.

