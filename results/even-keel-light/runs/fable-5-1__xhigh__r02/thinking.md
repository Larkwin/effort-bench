I'm planning out the app structure: handling people with unique name validation and error messages, and expenses with description, amount validation to two decimals, payer selection, and split checkboxes, distributing leftover cents fairly among participants.

I'm also designing the balances and settle-up logic with data attributes for testing, limiting transfers to n-1, plus money formatting via Intl.NumberFormat, localStorage persistence, empty states, responsive layout, and accessibility.

For visual identity I'm settling on a nautical name "Even Keel" with a navy and warm red-orange palette, and weighing font pairings like Fraunces/Inter or DM Serif Display/DM Sans to convey a steady, honest, quietly confident feel.

For the palette I'm thinking Harbour (dark navy) for primary elements like headers and buttons, with Signal (a warm red-orange) reserved for primary actions rather than for marking negative balances — since owing money isn't an error state. I want to avoid color-coding "owes" as a problem, so I'm considering a muted teal for "is owed" and a muted clay tone for "owes" instead, keeping both feel neutral and non-judgmental.

For the broader surface I'm settling on a warm off-white paper background with white cards, Harbour text, soft borders, and a muted secondary text color to keep the whole thing calm and readable.

That contrast ratio comes out around 5.5, which passes AA comfortably on both white and the paper tone. Now I'm checking the signal color #C2462B against white using the same luminance calculation.

The luminance works out to 0.1603, giving a contrast ratio near 4.99 against white — just clears the 4.5 AA threshold for normal text, and white text on that signal color works the same way. Moving to the harbour color #1F3A4D, I'm running the luminance math on each RGB channel.

The resulting contrast against white comes out around 11.85, which is excellent. For error messaging I'll darken the signal tone to something like #A6391F for readability, and I'll give the focus ring a 3px solid signal outline with an offset so it stays clearly visible. For layout, I'm sketching a header with the "Even Keel" brand name and tagline, then a two-column desktop grid — people and add-expense form on one side, expenses list, balances, and settle-up on the other — collapsing into a single stacked column on mobile.

On mobile I'm thinking the order should flow People → Expense form → Expenses list → Balances → Settle up, keeping setup logical while still surfacing the settle-up result near the end. I'll use CSS grid with named areas so I can reorder sections independently for desktop versus mobile. For state, I'm structuring data as a people array with id/name pairs and an expenses array with id, description, amount in cents, payer id, and split ids, and weighing whether to key people by name or by generated id since names are case-insensitive unique identifiers.

Since there's no person removal or renaming feature, I'm deciding to just use names directly as stable keys instead of generating ids, which simplifies the select and checkbox values in the form to match person names directly rather than mapping ids to names.

For splitting amounts, I'm distributing cents evenly across selected people in trip order, giving the remainder to the first few people so totals stay exact. For balances, I'm computing each person's paid amount minus their owed share, then using a greedy settle-up algorithm that matches the largest debtor with the largest creditor repeatedly until all balances are resolved.

I'm confirming this approach yields at most n-1 transfers since each step zeroes out at least one party, and the sum of balances is guaranteed zero since shares sum to the total amount. For amount validation, I'm planning to trim the input, strip an optional leading dollar sign and commas, then validate against a regex allowing up to two decimal places.

Now I'm converting the validated string into integer cents, requiring the result to be greater than zero, with specific error messages for empty, zero, or malformed input. I'm also deciding to use a plain text input with `inputmode="decimal"` rather than `type="number"`, since that preserves the raw typed value and lets me properly catch cases like more than two decimal places that a number input might silently mangle.

For the payer and split fields, I'm keeping the inputs enabled even when there are no people yet, rather than disabling the form or button, since disabling could cause test timeouts if a test interacts with the form before adding people. Instead, I'll surface a clear error on submit, like "Add at least one person before you log an expense," when the people list is empty.

For splitting, everyone should be checked by default, and when a new person is added mid-session, their checkbox should default to checked while preserving any existing unchecked selections the user made — resetting to all-checked only after a successful expense submission. On any validation error, I'll keep the user's typed values intact rather than clearing the form.

On success, I'll clear description and amount but keep the payer selection, since people often log multiple expenses for the same payer. For the form error element, I'll render it conditionally with role="alert" so it's inserted into the DOM only when there's an error, which should trigger proper announcement.

I'm also tying errors to their inputs with aria-describedby and aria-invalid. For person validation, errors cover empty names and case-insensitive duplicates, referencing the existing matching name in the message. For expense validation, I'll just surface the first error and focus that field rather than listing every issue at once.

I should keep only a single form-error visible at a time, since tests likely use strict-mode queries that would fail if multiple error nodes appeared simultaneously—so triggering one form's error should probably clear any lingering error from the other.

To be safest, I'll clear all errors on any form submission and also clear a form's own error as soon as the user edits its input, so a duplicate-name error disappears once they start typing a fix while still preserving what they've typed. Now I'm setting up currency formatting using `Intl.NumberFormat` with the Canadian locale.

For negative balances I'll show "owes $X.XX" using the absolute value, and I'll persist state to localStorage under a versioned key, saving on every change and loading with try/catch validation on startup. I'm also considering adding a small "Start over" button with a confirm dialog to reset the trip, though tests likely won't check for it.

Since Playwright auto-dismisses native `confirm()` calls, I'll instead build a simple two-step inline confirmation ("Are you sure?" with Yes/Keep buttons) rather than relying on the browser dialog. I'm skipping an editable trip name to keep scope focused, and planning the expense list to show newest entries first with description, amount, payer, and split details.

For the split display, I'll name everyone involved explicitly rather than saying "everyone" — something like "Split between Ana, Ben and Cal (3 ways)" — since uneven splits mean per-person amounts aren't identical anyway.

For deletion, I'll add a "Remove" button with a proper aria-label referencing the expense description, and after removal move focus to the Expenses heading for good accessibility.

For balances, I'm showing each person's name with their status (owed/owes/settled) plus a breakdown of what they paid versus their fair share, which gives useful transparency into the numbers.

Now I'm working through settle-up transfers phrasing and empty states — for no people, no expenses, and all-settled scenarios — and deciding whether to still render zeroed balance rows when there are no expenses yet, leaning toward showing them as "even" rather than hiding the section entirely.

I'm also planning a running total line summarizing the trip's spending across expenses, handling name uniqueness checks with trimmed, case-insensitive comparisons, and making sure forms, buttons, and checkboxes stay keyboard-accessible with visible focus styling.

For responsiveness, I'm ensuring the layout avoids horizontal scroll at narrow widths by constraining grid children and letting long names wrap. Now I'm writing the HTML document structure with meta tags, title, and font links...

Building header and main form markup...

Still writing form markup...

I'm weighing whether the payer dropdown should include a placeholder option when no people exist yet, versus only listing actual person names once added — want to avoid confusing default-selection behavior for tests that don't explicitly pick a payer.

Deciding to skip the placeholder once people exist and just default to the first person, preserving the previous selection across re-renders when someone new is added. Now I'm sketching the desktop grid layout, arranging people, balances, add-expense, settle, and expenses sections into named grid areas with a column split favoring the expenses panel.

Actually I'm reconsidering the grid-area approach since spanning items with auto rows could create uneven gaps between sections. Simpler to use two flex columns instead — left with people and add-expense, right with balances, settle, and expenses — and on mobile just stack everything in a sensible single-column order like People → Log expense → Expenses.

Thinking about user journey, I want the summary (Balances, Settle up) visible before the long expense log, both on desktop in the right column and on mobile when scrolling down past the form.

For the header, I'm picturing a harbour-colored background with white text, the "Even Keel" wordmark in Fraunces, and a tiny logo mark — a simple waterline with a hull arc beneath it to evoke a boat staying level. I'll keep the tagline short, something like "Split the costs of a trip so everyone ends up even," and add a footer reassuring users that everything stays local in the browser.

Now I'm thinking through card styling — white background, thin border, rounded corners, generous padding, with Fraunces headings in Harbour color. I'm weighing whether to number sections like steps, but decide against it since Balances and Settle Up don't fit a step metaphor. For buttons, I'm debating whether Signal or Harbour should be the primary action color, leaning toward Signal as the accent for key actions like adding people or expenses, checking contrast ratios to make sure the text stays readable.

I'm settling on a hierarchy: solid Harbour for adding a person (a setup action), solid Signal for adding an expense (the main action), and a quiet text-style button in muted Harbour for delete. I'm also considering using Signal to highlight key transfer amounts in Settle Up, and testing a sea-green color for positive "is owed" balances, working through the contrast math to confirm it reads well on white.

I'll settle on: is owed → Tide green, owes → Harbour ink, keeping it simple. I'm considering whether a diverging bar visualization per balance row would add a nice touch, but it might be unnecessary complexity—could skip it or keep a minimal version with a thin center track.

For typography, I'm setting body text in Inter at 16px with 1.5 line-height, tabular numerals for money, and Fraunces for headings, working out the variable font weight/optical-size range syntax for the Google Fonts URL.

I'll skip the SOFT axis to avoid a malformed URL and just keep the simpler Fraunces font query. Now I'm setting up the JavaScript module with a storage key and a currency formatter for CAD.

I'm writing the load function to parse saved state from localStorage, sanitizing the people array by filtering valid strings and deduping names case-insensitively.

Falling back to empty data on parse failure. I'm keeping expenses in insertion order but rendering newest-first, and writing a shares function that splits cents evenly among participants, distributing the remainder cent-by-cent to the first few members by trip order.

Now I'm writing a balances function that accumulates paid and share totals per person to compute net amounts, then starting a settle algorithm that identifies debtors and sorts them by amount owed...

This greedy settlement approach guarantees at most n-1 transfers. Now I'm writing a parser for amount strings that strips dollar signs and commas, validates the dollars/cents format, and returns clear error messages for malformed input like too many decimal digits.

I'm converting the parsed dollars and cents into a safe integer cent value, rejecting non-numeric or oversized amounts, and requiring the result to be strictly positive. I'm also checking edge cases like trailing decimal points, leading decimal points, and scientific notation to make sure the regex rejects invalid formats while accepting valid partial amounts.

For rendering, I'll rebuild the lists from scratch each time using safe DOM creation with textContent rather than innerHTML to avoid injection risks, using a small helper to construct elements with props and children. Now I'm writing the submit handler for the person form, trimming the name input and validating it's non-empty before checking for duplicates in state.

Still writing form logic...

I'm figuring out validation order: check people exist first, then description, amount, payer, and split selection, while preserving typed values on error. On success, I push the new expense, save and re-render, clear the description/amount fields, reset split checkboxes to all-checked, keep the payer selected, focus the description field, and announce success—then set up delete handling via event delegation on the expenses list.

For rendering, I'm building person chips with initials, rebuilding the payer dropdown while preserving valid selections, and rebuilding split checkboxes so existing people keep their checked state while new people default to checked. I'm also adding small "select all" and "clear" buttons for the split list to make it easier on mobile with many people, and structuring each expense list item with a main content block.

Each expense item shows the description, a meta line summarizing who paid and how it's split, the amount, and a remove button. For balances, each item shows the person's name, their net amount owed or owing with styling, a visual bar representing the balance proportion, and a detail paragraph explaining the breakdown.

I'm defining the transfers markup showing who pays whom and the settlement amount, along with empty state messages for the people, expenses, and balances sections depending on whether people and expenses exist yet.

For balances, I decide showing rows at "$0.00, even" is better than an empty state once people exist, since it reassures users everyone starts level. For the settle section, I'm adding messages for no people ("Nothing to settle yet") and for when everyone's balance nets to zero ("Everyone's even. Nothing to settle.").

Now I'm working out the "Start a new trip" control, using a button that reveals an inline confirmation rather than a modal, plus a totals summary line showing trip total, expense count, and people count. I'm defining the color palette variables for the CSS styling...

I'm picking a light tint color that passes contrast against Harbour, then setting up the grid layout: single column on mobile, switching to a 5fr/7fr two-column split at wider widths, with nested column wrappers keeping consistent gap spacing.

I'm deciding against a sticky left column since overflow behavior would be awkward, and moving on to input styling — fixed height, soft borders, rounded corners, and focus-visible outlines that work consistently for keyboard and typing interactions.

Now I'm defining button variants: primary, dark, and ghost styles with consistent height and padding. For the person form row, I'm using flexbox so the input and button fit side by side even at narrow widths.

For chips, I'm giving each person a pill with an initial avatar circle and their name, deciding against showing explicit ordering numbers and keeping it simple with just initials.

For the expense form, I'm stacking labeled fields with consistent gaps, then styling the split checkboxes as pill toggles that highlight when checked using `:has()`, keeping the native checkbox visible with an accented color. For the expense list items, I'm setting up a grid layout with description and amount columns plus a remove button, adjusting the arrangement for narrow screens.

Writing expense item styles...

Now I'm working out how to lay out balance rows and transfer rows, planning the transfer display like "Ben → Ana $8.00" with a flexible wrapping layout.

I also need to handle copy for the settle-up summary (pluralizing "transfer" vs "transfers"), accessibility details like aria-live error slots tied to inputs via aria-describedby and aria-invalid, a screen-reader-only status region, and moving focus to the expenses heading after a delete action.

Writing footer markup...

Still writing SVG code...

Adding accessibility helpers and starting the masthead styling with a dark harbour-colored background and signal-colored border accent.

Still writing form field styles...

Styling the checkbox pills...

Computing the contrast ratio gives roughly 7.07, which passes comfortably. Now I'm defining the button styles.

Adding button variant styles...

Still styling avatars and chips...

Styling the transfer rows...

I'll go with "Ben pays Ana" phrasing for accessibility, then style the footer with flexible spacing. Now I'm starting the JS module with storage keys, currency formatting helpers, and a DOM query shorthand.

Defining element references...

Now I'm setting up a unique ID generator and a helper function for building DOM elements with attributes, event listeners, and child nodes.

I'm also adding a formatter that joins names into readable lists like "Ana, Ben and Cal," then starting the render logic for displaying people with avatars showing their initials.

Next I need to handle the payer dropdown, preserving the current selection on re-render and adding a placeholder option if no people have been added yet.

Other fields stay enabled; only the payer select gets disabled with "Add people first". For rendering the split checkboxes, I'm preserving which names were previously unchecked, then rebuilding the checkbox list from state.people with unique ids per index, checking each box unless resetAll is true or the name was previously unchecked.

I'm deciding to set `checked` as a property rather than relying on attribute defaults, to avoid ambiguity on newly created elements, while treating `disabled`, `selected`, and `value` as safe to set via attribute. I'll skip wrapping the label with a `for`/`id` pair since the input is nested directly inside it. I'm also considering showing an empty-state message when there are no people, and whether the select-all/none buttons should always be visible or only enabled when there's more than one person.

For rendering the expense list, I'm reversing the array so newest entries show first, then mapping each expense into a meta line describing who paid and how the split works across members — figuring out the right wording for one-way splits versus multi-way splits among several people.

I'll settle on always listing names rather than "everyone." Now I'm building the expense list item with description, amount, meta text, and a remove button with an aria-label — though I realize the aria-label overriding the visible "Remove" text might cause an accessibility mismatch worth reconsidering.

I'm also adding a per-person share calculation to each expense's meta line, showing either an even split or a rounded range when it doesn't divide evenly. Then for the balances summary, I'm computing total spent, formatting a summary sentence, and figuring out the max absolute balance to scale the display rows.

Writing balance row markup...

I'm switching to a `<span>` for the bar segment instead of `<i>` to be safer, and planning the transfer rendering logic to show lead text depending on whether there are people, settled balances, or pending transfers. I also need save() with localStorage wrapped in try/catch, plus a renderAll() that calls all the individual render functions in sequence.

Now I'm writing error-handling functions: showError clears existing errors, builds an error message element with an icon and alert role, links it to the input via aria-describedby, and focuses the input; clearErrors resets both error slots and strips aria-invalid attributes from the relevant inputs.

I realize the amount field already has a default aria-describedby pointing to a hint, so I need to preserve that base value in a data attribute and append the error message id on error, restoring just the base on clear. For the split checkboxes group, I'm figuring out how to focus the first checkbox and attach the error description to the fieldset.

For announcing errors, I'm deciding between aria-live="polite" and "assertive" — settling on using `role="alert"` on the error slot containers themselves since that implies assertive and atomic behavior, which fits form submission errors well.

I'm wiring up input listeners to clear errors as the user types in either form, then handling expense submission: pushing the new expense into state, saving, re-rendering everything, resetting the form fields, refocusing the description input, and announcing the addition with the amount and payer. I'm also setting up the delete handler for expense list items using event delegation on the list container.

Writing delete handler logic...

For focus management after deletion, I'm weighing whether moving focus to the next delete button risks an accidental double removal if the user presses the key again too quickly.

Better to move focus to the heading itself since it's already set up with tabindex="-1" for this purpose. I'm also sketching out the reset confirmation flow—showing/hiding the confirm dialog, resetting state, clearing forms, and announcing the new trip—along with the select-all/none buttons for splits and the announce helper that clears then sets status text with a small delay so screen readers pick up the change.

I'm checking edge cases: names with special characters are safe since I'm using setAttribute, and names get trimmed of leading/trailing whitespace but keep internal spacing. For listing names with proper grammar, I'm using Intl.ListFormat when available, falling back to manual comma-and-"and" joining otherwise, so names render naturally like "Ana, Ben, and Cal."

Now I'm adding font preconnect links for Google Fonts and planning count badges like "3 people" in the card headers, then writing out the full HTML document starting with the doctype and meta tags.

Writing the page head...

Building the masthead with the brand logo and tagline, then starting the main app layout with a People section card and its form.

Building the expense form fields...

Still building the form markup...

Now I'm checking placeholder text color contrast against WCAG guidelines, calculating luminance values to ensure the placeholder styling stays readable at roughly a 4.5:1 ratio.

That gives a solid 4.8 contrast ratio, good enough. I'll settle on #65747F for placeholder text and a darker --ink-soft: #52626E for secondary text with even better contrast, add a visible-on-focus skip link, and use a hidden paragraph element that JS toggles for empty states. Now I'm structuring the responsive grid layout with a two-column desktop arrangement using CSS grid.

I'm sizing the columns so forms take roughly 40% and the expense list with its wider metadata takes 60%, which works out nicely within the 1120px container. For the select dropdown, I'm embedding a custom chevron icon as an inline SVG data URI, styled and positioned to sit on the right side of the control.

For numbers I want tabular alignment, so I'm applying tabular-nums to amounts, and letting Fraunces headings use automatic optical sizing. I'm also adding a subtle underline rule below card headings as a small brand touch, reserving the Signal accent color for actions and key figures, and keeping transitions minimal to respect reduced-motion preferences.

Now I'm defining the hover style for the text-only "Remove" button with an underline and softened ink color for sufficient contrast, then writing the full balances logic — verifying the greedy debt-settlement algorithm pairs largest debtors and creditors to minimize transfer count — and drafting the summary copy for different empty and populated states of the balances view.

For the settle-up section, I'm writing conditional lead copy for each state: no people, no expenses, everyone even, or a count of remaining transfers, plus a short reassuring hint line about why settling up matters. I'm also adding a `tabindex="-1"` to the main element so the skip link has a valid focus target.

Also planning focus management for the expenses heading after a delete, making sure error clearing logic works across both person and expense forms, and hiding empty error slots with CSS so they don't take up space.

Writing CSS variables for the color palette...

Checking that the border color for inputs meets contrast requirements against white backgrounds.

Settling on a strong border color around #8F8779 for visual contrast, roughly 3.5:1 ratio. Now I'm starting to write out the full HTML file with base styles for box-sizing, typography, and body/heading rules.

Still writing styles...

I'm styling the tagline text color and verifying its contrast ratio against the harbour background meets accessibility standards—confirming it comes out to roughly 8:1. At narrow 360px widths, the brand and tagline will simply wrap onto two lines, which is acceptable.

Now I'm setting up the app's grid layout with responsive column widths that switch to two columns at wider breakpoints, and double-checking that the expense-split container has exactly one checkbox per person and that the amount field's accessibility hint attribute is wired up correctly before writing the final JS and full document.

I'm handling the payer select rendering so it rebuilds options from the current people list, disables itself with a placeholder when empty, and otherwise preserves the previously selected value if it still exists.

For renderSplit, I'm tracking which checkboxes were manually unchecked before the rerender (unless resetAll is true), then rebuilding checkbox/label pairs for each person while restoring their checked state, and toggling the empty-state message based on whether any people exist.

Now I'm setting up the expense form submit handler, which prevents default, clears old errors, validates that people exist, validates a non-empty description, and parses the amount field for errors.

I'm continuing the validation chain: checking that the payer is a valid person, gathering checked split checkboxes, and erroring if nobody's selected to split with. I'm also second-guessing the focus target when there are no people yet—maybe it should focus the person name input instead of the description field, since the error message tells them to add a person first.

Actually, I think the simplest choice is best: don't move focus away in that edge case. Just leave focus on the Add expense button rather than jumping somewhere confusing on mobile, since the error is announced via role=alert anyway.

I'll make focusEl optional, add autocapitalize to the name input, and polish small details—amount input maxlength, parseAmount handling for a leading `$`, the footer note, and reset behavior. I'm also considering a `storage` event listener so state stays synced across tabs, which is cheap to add. After double-checking the net value formatting, I'm ready to write the final document with clean, deliberate styling.

Styling the net amount display with distinct colors for owed/owes/even states, splitting it into a label span and a bolder amount span for readability, and making sure the row with input and button stays responsive without horizontal scroll on small screens.

Checking card padding math at 360px width confirms the inner content fits fine, and expense/transfer list items need overflow-wrap so long names or descriptions don't break layout. Writing SVG code...

I'm adding defensive CSS so `[hidden]` always overrides display rules and empty error slots collapse, then moving on to assemble the final HTML.

