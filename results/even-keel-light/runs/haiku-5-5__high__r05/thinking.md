I'm laying out the plan for a single-file expense splitter: people added with validated unique names, expenses requiring description, positive amount with up to two decimals, payer, and split checkboxes defaulting to checked. For splitting, I'll work in integer cents, computing a base share per person and distributing any remainder cent-by-cent to the first selected participants.

I'm also planning balance calculations as paid minus share with test-friendly data attributes, a greedy debt-settlement algorithm guaranteed to need at most n-1 transfers, localStorage persistence, empty states, CAD currency formatting via Intl, and responsive/accessible markup down to 360px — while deciding I don't need to support removing people from a trip.

For expenses, the payer doesn't have to be part of the split, but at least one person must be selected in the split, and adding an expense should be blocked or flagged if there are no people yet. I'm working out amount validation rules — requiring a positive number with up to two decimals, stripping things like leading "$" signs or commas, and rejecting malformed values like negatives, letters, or too many decimal places.

I'm settling on a text input with decimal inputmode for amount so it's easy to test and still accepts decimals cleanly. For the data model, I'm storing people as simple name objects and expenses with description, amount in cents, payer, split list, and timestamp, keeping names stable since people can't be removed.

Order of remainder distribution should follow the order people were added. I'll unshift new expenses so the list naturally shows newest first, and compute per-person balances by summing what they paid versus their share across all expenses, formatting negative/positive balances as "owes" or "is owed." For settling up, I'm using a greedy algorithm to generate minimal transfers like "Ana pays Ben $12.00," showing all people even with zero balance, and displaying a friendly message when everyone is already even.

For rendering, I'll rebuild the lists from state on each change but keep the form inputs static, only updating payer options and split checkboxes when people are added or removed—new people default to checked in the split. After adding an expense, I'll reset the description and amount fields and restore default split selections while leaving the payer choice as-is. For validation, I'm using separate error elements for the person and expense forms, each tagged with data-testid="form-error" only when visible.

I'll avoid leaving a hidden element with that testid present since tests might still find it—instead I'll dynamically insert or clear the error paragraph inside a message container, plus set aria-invalid and aria-describedby on the related inputs. For person errors I'm defining messages for empty names, duplicates, and names exceeding 40 characters, and for expense errors I'm writing messages for missing descriptions and invalid amounts.

I'm detailing specific validation copy for amount formatting, zero amounts, decimal precision, missing people, missing payer, and empty splits, with only one error shown at a time and focus moving to the invalid field for accessibility, using role="alert" so screen readers pick it up. I'm also planning the delete-expense button with a descriptive aria-label, deciding on a storage key with safe parsing, and weighing whether to add a "start new trip" reset feature or keep scope tight.

Now I'm settling on fonts, pairing Fraunces for headings with Figtree for body text, and working through the color palette—calculating the luminance and contrast ratio for the Signal red against white to confirm it clears WCAG AA for normal text, landing right around a 5:1 ratio.

Checking the muted gray text against the warm paper background confirms good readability, so I'm settling on a palette with a teal "owed" color, a harbour-dark ink, and making sure negative balances use text labels rather than relying on color alone. For the layout I'm sketching a header with the wordmark "Even Keel" in Fraunces, a short tagline, and a simple inline SVG mark suggesting a balance line.

For structure, I'm planning sections for People, Expenses, Balances, and Settle Up, laid out as two columns on desktop (people/expense-entry on the left, balances/settle-up on the right) collapsing to a single stacked column on mobile with balances surfaced early. I want forms to submit on Enter, use novalidate so I can control validation messaging myself, and keep every label visibly attached to its input, wrapping the whole thing in a main landmark for testability.

For the expense split, I'm using checkbox chips labeled with each person's name, styled with a focus ring so keyboard navigation is clear. For the payer dropdown, I'm deciding to keep the add-expense button always enabled but show a clear inline message like "Add at least one person" when the form can't be submitted, rather than disabling controls outright.

For generating expense ids, I'll combine a timestamp with a random string fragment for uniqueness. Each expense item renders as a list entry with the description, a meta line showing who paid and who the cost is split between, the formatted amount, and a labeled remove button — keeping the split description simple as just a list of names rather than showing individual share amounts to avoid clutter.

I'll need an escaping helper since I'm building HTML via template strings, applying it to both text content and attribute values like data-person. Balance items show a person's name, their formatted dollar amount, and a status word — "is owed", "owes", or "even" — with the displayed amount always shown as a positive number even when the underlying signed value is negative. Transfer items display who pays whom and how much.

For settling balances, I'm implementing a greedy algorithm that separates people into debtors and creditors, sorts each group by magnitude so the biggest amounts get matched first, then uses a two-pointer approach to generate the minimum number of transfers.

For formatting money I'll use Intl.NumberFormat for CAD currency, and I'm handling uneven expense splits by giving each selected person a base share plus one extra cent to the first few people until the remainder is used up, keeping their order consistent with when they joined the trip. For storage, I'm persisting people, expenses, and version info as JSON after every change, validating the shape on load and filtering out anything malformed, with expenses displayed newest-first to match their stored order.

I'm giving each person a small avatar with their initial on a tinted background for a nice visual touch, and writing empty-state messages for the people, expenses, balances, and settle-up views so the app feels guided rather than blank. I'm also adding a quick summary line showing total trip spend and expense count, and defining a focus-visible outline style using the harbour color with sufficient offset and contrast, though I need to double check it stays visible against darker button backgrounds too.

Now I'm working through button styles—primary buttons in signal color with white text, secondary ones with harbour borders, and understated danger/remove links—and pairing Fraunces for headings and tabular-numeral amounts with Figtree for body text, pulling both from Google Fonts. I'm also setting up responsive rules with a max-width container, a two-column grid above 880px, and safeguards like overflow-wrap for long names, plus a flexible layout for expense rows so descriptions can shrink properly on mobile.

For the add-expense form, I'm sketching a grid where the description spans full width while amount and payer share a row on desktop but stack below 480px, and I'm keeping the split fieldset simple with just chip selection rather than adding select-all shortcuts to limit scope. I'm also deciding how to style error messages—plain text with a signal-colored left border rather than icons—and considering whether a live region is needed for success confirmations.

Now I'm setting up the storage layer: defining a localStorage key, character limits for names and descriptions, and a currency formatter, then writing a load function that parses saved trip data and validates that people and expenses are proper arrays before falling back to an empty trip. I'm refining the validation logic to check that each expense has a valid description, positive integer cents, a payer who exists in the people list, and a non-empty split array of valid participants, then moving on to writing the corresponding save function.

For adding a person, I'm deciding to trim names rather than collapse internal whitespace to match the spec literally, comparing duplicates case-insensitively, and refining the error message to reference the exact existing name on the trip so users understand why their entry was rejected.

I'm building error-display helpers that insert an accessible error message into a container and link it to the relevant field via aria-invalid and focus, plus a clear function to remove it. I still need to decide whether errors persist until resubmission or clear as soon as the user edits the field again.

For the expense amount parser, I'm writing logic that trims and normalizes the raw input, validates it's a proper decimal number with at most two decimal places and a reasonable size, then converts it into integer cents while handling edge cases like missing fractional digits, trailing dots, or malformed strings like "1.2.3" or scientific notation.

Now I'm building out the submission flow: validating description, amount, that people exist, that a valid payer is selected, and that at least one split participant is checked, with specific error messages and focus targeting for each failure case. On success, I prepend the new expense to the list, persist it, re-render, reset the form fields while keeping split checkboxes checked, and announce the update.

For computing each person's share, I'm writing a function that divides the total cents evenly among selected members and distributes any remaining pennies across them.

I'm also adding a balances function that sums what each person paid and subtracts their share of every expense, while being mindful that using plain objects keyed by person names could cause issues if a name happens to be "__proto__".

I'm switching to using Map for balances and shares to avoid prototype pollution issues with special key names. For settling debts, I'm writing a greedy algorithm that matches the largest creditor with the largest debtor repeatedly until all balances reach zero, keeping the total number of transfers minimal.

Now I'm thinking through how the UI should render people and expense forms, specifically how to preserve checkbox states for split selection and the payer dropdown when people are added or removed, so new people default to checked and existing selections persist across re-renders.

For the expenses list, I'm planning event delegation for deletion with proper focus management afterward—moving focus to the section heading rather than letting it fall to the body—along with handling balances, settle-up calculations, and a trip total summary display.

I'm adding an escaping helper for safe text insertion and a small status note for announcing person additions. Now I'm starting the HTML structure: a masthead with an SVG brand mark and tagline, then a layout with a People card containing the person-adding form.

Adding more form fields...

I'm finalizing the column layout: People, Add expense, and Expenses list on the left, Balances and Settle up on the right, which stacks sensibly on mobile. Now I'm styling the chip components for the split selector, using a pill shape with a checked state that highlights background and border.

I'm working through accessibility details—ensuring minimum touch targets, strong focus outlines, and sufficient contrast ratios for input borders and text. I'm also defining the full color palette (paper background, harbour blues, signal reds, sea green for positive balances, muted grays) and checking each against contrast requirements, plus setting up card styling with subtle shadows and borders.

Now I'm designing the typography pairing (Fraunces for display, Figtree for body) and laying out the balance rows, transfer cards, and masthead—considering a navy header band with high-contrast white wordmark and a nautical "keel" mark icon as the brand symbol.

Writing HTML head and font imports...

Still writing button styles...

I'm weighing which accent color should represent "primary action" versus "amount owed" — leaning toward keeping signal reserved for buttons while using sea green for positive balances so owing doesn't read as negative.

Still writing the expense item layout...

I'm structuring the balance row with an avatar circle, name, status text ("is owed" / "owes"), and amount, then moving on to the settle-up transfer row showing who pays whom.

Now I'm defining the empty state styling and the settlement summary text, then setting up DOM element references for the people and expense forms in JavaScript.

I'm writing the renderPeople function to show an empty-state message when no one's added yet, otherwise listing each person with an avatar initial, handling edge cases like emoji names using Array.from for proper character extraction.

Still writing render functions...

I need to keep the split checkboxes synced with the checked state via a change listener, and make sure the form's chip rendering only happens when the people list actually changes, not on every render, so I don't lose user focus on checkboxes. When an expense is reset and uiSplit is reset to include everyone, I'll explicitly re-render the form options to reflect that.

Now I'm drafting the expense list rendering logic, showing a total summary line and an empty-state message when there are no expenses, then building each list item's markup with the description, payer, and metadata.

Writing expense item markup...

I'm using Intl.ListFormat to naturally join the names of people splitting each expense, and I'm considering adding a collapsible "shares" details section so users can see exactly how much each person owes without cluttering the main view. Then I move on to sketching the balances rendering function, starting with its own empty-state handling.

For settle-up, I'm structuring the logic so it shows a clear "everyone is even" message when no transfers are needed, and a distinct empty state when there are no expenses at all. I'm also carefully checking that subtraction operations on cents can't accidentally produce a negative-zero value when a balance is actually zero.

Now I'm wiring up persistence: calling save() after adding people, adding expenses, and deleting expenses, with unique IDs generated via random UUID fallback. Deleting an expense filters it out of the trip data and refocuses the expenses heading, while form submissions handle their own status messages like confirming who joined or what expense was added, clearing inputs and refocusing them afterward.

I'm adding an HTML-escaping helper and a showError function that injects an accessible error message, marks the field invalid, and focuses it, along with wiring aria-describedby to the error container and a matching clearError function to reset validation state.

For the expense form's submit handler, I'm validating in order: non-empty description, length under the max, a valid parsed amount, and at least one person added to the trip, calling the error helper with a specific message and focus target for each failure case before proceeding to read the selected payer.

Now I'm thinking about validating the payer selection and then checking the split checkboxes. I'm deciding to read the checked values directly from the DOM rather than relying on the separate uiSplit set, since that's more robust, and keeping uiSplit only for re-rendering chips when new people are added -- using a checked flag or preserving existing checked state on rebuild.

After validation passes, I'm pushing the new expense object onto the trip, saving and re-rendering, then clearing the description and amount fields while resetting the split selection to include everyone and refocusing the description input. I decide to keep the payer selection as-is for convenience rather than resetting it.

I'm also confirming that person names get trimmed before storage and uniqueness checks, and that adding a new person updates the split set and re-renders the form options so the payer dropdown includes them. Now I'm writing the load function that reads from localStorage, safely parses the JSON, and rebuilds the people and expenses arrays while validating each entry's shape.

Still writing load validation...

For saving, I'm just calling localStorage.setItem with the stringified trip object, ignoring any write errors silently since that's acceptable behavior here.

Now I'm working out how expense splits render in people order using a shares map, plus setting up an Intl.ListFormat helper to join names naturally (falling back to a simple comma join if unsupported). Then I move into CSS, laying out the masthead header with the logo mark and wordmark, followed by the responsive grid layout for the main content area.

Continuing with card styling — background, border, padding, shadow, responsive headers and hints — then into form field styles with labels, inputs, and focus/invalid states using consistent border colors and outlines.

Now I'm defining layout rules for rows, person forms, and expense forms with flexible grids, plus fieldset and legend resets, chip styling, and an error banner checking contrast ratios between the text color and its background wash. I'm also setting up a status text element with minimal height so it stays unobtrusive when empty, and starting on button styles with consistent height and padding.

Writing button and list styles...

Adding more CSS styles...

I'm sketching the logo mark as a small rounded square icon with a dot and line suggesting a signal/level indicator, then setting up proper heading hierarchy with the wordmark as h1 and section labels like People, Add an expense, Expenses, and Balances as h2s.

Writing the core JavaScript module now—setting up state persistence with localStorage, currency formatting helpers, and DOM element references for all the form inputs and display containers.

Still writing core logic...

Building out the balance calculation functions that split expense amounts evenly across selected people (distributing remainder cents fairly), tally each person's running balance from payments and shares, and generate a settle-up plan of who should pay whom.

Writing form validation and submit handlers...

I'm wiring up event listeners for adding people and expenses with inline validation—checking for empty or duplicate names case-insensitively, enforcing character limits, and showing accessible error messages that focus the relevant field. I'm also handling checkbox changes for the expense split selection and a delete handler for removing expenses from the list.

Writing render functions for balances and settle-up...

I'm building the balances list to show each person's avatar initial, name, and whether they're owed money, owe money, or are even, plus a settle-up section that lists the minimal set of payments needed and a summary sentence describing how many transfers will even things out.

Writing the expense form options renderer...

I'm populating the payer dropdown and the per-person split checkboxes dynamically based on the current list of people, falling back to helpful placeholder text when no people have been added yet, and resetting the split checkboxes back to all-checked after a successful expense submission.

