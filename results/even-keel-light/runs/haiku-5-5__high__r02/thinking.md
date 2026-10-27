I'm mapping out the single-file app's requirements: people need unique names with validation and error messaging, while expenses need descriptions, valid amounts, a payer selector, and split checkboxes, all tied to specific test IDs for reliable testing.

Splitting logic needs integer cents to avoid rounding errors, distributing remainder cents to the first participants in trip order, and balances should be computed as paid minus share, displayed with signed cents. For settling up, I want a greedy algorithm pairing the largest creditor and debtor to minimize transfers, plus currency formatting via Intl.NumberFormat, localStorage persistence, empty states, responsive design, and accessibility.

I'm deciding against adding person removal since the spec doesn't require it — keeping things simple and avoiding edge cases around deleting people referenced in expenses.

For amount parsing, I'm settling on a regex requiring a positive number with at most two decimal places, and stripping things like leading "$" signs or commas for convenience.

Still writing parsing logic...

I'm capping amounts at a sane maximum to avoid unsafe integers, and planning validation errors to render only when present, using a data-testid of "form-error" per field so tests can target inline messages.

I'll link each input's aria-describedby to its message and set aria-invalid appropriately. For expense errors, I'll show a single message at the top covering cases like no split selection, while payer doesn't need to be part of the split. When there are no people yet, I'll show an empty state and likely disable the expense form, assuming tests add people before filling it out.

For validation, rather than disabling everything when no people exist, I'll let the payer selection stay empty and show a clear error like "Add at least one person first" on submit, keeping the empty-state text alongside active controls. For syncing checkboxes, new people should default to checked since everyone is selected by default, so I need to rebuild the payer options and checkbox list whenever the people list changes while preserving the current payer value and the user's typed description/amount so nothing gets reset.

I'm settling on a draft object holding description, amount, payer, and a split set, with a single render function that updates distinct regions — people list, payer select, split container, expense list, balances, transfers, and error states — without wiping the raw text inputs. The draft gets updated on every input/change event so state survives re-renders, and checkbox checked status is derived from whether the draft's split set contains that person's name.

I'm switching to an "unchecked" exclusion set instead, since defaulting everyone to selected is simpler than tracking inclusions for newly added people. For the payer select, I'm defaulting to the first valid person when the draft's payer is invalid or missing, falling back to a disabled placeholder option when there are no people yet, and escaping names when building DOM strings so special characters in data attributes don't break anything.

Expenses will store person names directly rather than ids, since names are unique and renaming isn't supported, with the split list filtered against the people array to preserve addition order. Balances are computed by summing paid cents and share cents per person from each expense's stored split, using integer cents throughout, and I'll represent balances as a list of name/cents pairs that should sum to zero before generating transfers.

For settling up, I'll use a greedy two-pointer approach: sort creditors descending and debtors by most negative, repeatedly matching the largest amounts and reducing balances until all are zero, with deterministic tie-breaking by cents then by people order, keeping transfers to at most k-1. Display-wise, all people show a balance (even zero) with sign-aware language like "Owed", "Owes", or "Even", transfers read as "X pays Y $amount", and currency is formatted via Intl with cents divided by 100.

I'll persist state to localStorage under a versioned key, loading with validation and saving on every mutation, and I'm considering a "Start a new trip" reset button with a confirm dialog for shared-device use. Expenses will be stored with an id/createdAt and rendered newest-first by reversing the array, with delete-by-id support but no editing. For layout, I'm planning a calm "Even Keel" header with a small icon mark and tagline, organized into People, Expenses, and Balances/Settle-up sections, using a two-column grid on desktop.

People and expense form, right: balances and expenses list. To avoid messy auto-placement, I'll wrap each column in its own div so DOM order stays people→form→balances→expenses on mobile while desktop splits cleanly into two columns via grid. I'm also deciding to wrap everything in a main element with the header placed outside it.

Now I'm working through the color palette, calculating contrast ratios for the navy and signal-red colors against white and off-white backgrounds to make sure text meets accessibility standards.

Finishing the luminance math, I get a contrast ratio of about 6.6 against the paper background, which comfortably passes. Now I'm noting the paper background color as a warm off-white tone, #F5F2EA.

I'm picking a harbour-blue ink for text that contrasts strongly with the paper, and testing a muted secondary color around #56656F, working through its luminance calculation to confirm it still hits roughly a 5:1 ratio.

Now I'm thinking about secondary surfaces — a light tint of harbour blue for chips — and deciding on a tight color scheme where balances owed use a sea-green teal while amounts owing use the signal color.

For fonts, I'm considering Fraunces as a soft serif for headings to give the brand some personality.

Adding fallback fonts and layout details: a paper-like background, warm-grey bordered cards with rounded corners, and a navy header band featuring the "Even Keel" wordmark in cream Fraunces alongside a small icon.

Working out accessibility details now—44px minimum touch targets for buttons and inputs, 16px font sizes to avoid iOS zoom, and focus-visible outlines using the Harbour and Signal colors with proper contrast against the navy header and buttons.

For checkboxes, I'll use native inputs styled with accent-color set to Harbour for keyboard-accessible, chip-like tiles. Expense amount fields will use a wrapper with a dollar-sign prefix for visual clarity.

Now I'm working through smaller layout details for the 360px breakpoint: tight padding, single-column grids, and wrapping text to avoid horizontal scroll. For each expense item, I'm laying out the description and tabular amount on one row, with a meta line below showing who paid and how the cost splits between people.

For sharing precision, since amounts can differ by a cent per person, I decide to keep the visible meta line simple ("Paid by X · Split between...") and add a collapsible `<details>` element with a "See shares" summary listing each person's exact share — a nice native, keyboard-accessible touch.

I'm also deciding not to add a confirmation step before removing an expense, since that would block simple test interactions, and for the person list I'm adding a "Remove" button that should stay disabled if the person is already used in an expense, with a hint noting that.

Now I'm working through empty-state copy for each section — no people, no expenses, balances with no one yet, and settle-up when everyone's even or there's nothing to settle. Then I'm designing the balances list itself, each item showing a name and plain-language status like "is owed $x" or "owes $x," plus considering a small visual bar centered on an axis where positive balances extend right in green and negative ones extend the opposite way, scaled relative to the largest balance.

For settle-up I'm drafting transfer items like "Ben pays Ana $12.50" with clear direction, plus a confirm-protected "clear trip" action and an accessible live region that quietly announces actions like "Ana added." I'm also nailing down validation messages for names — catching empty input, duplicates, overly long entries, and collapsing extra whitespace.

Now I'm defining the full set of expense error messages, covering missing descriptions, bad or missing amounts, no participants, missing payer, and empty splits, with checks run in a specific order so only the first relevant error shows and focus moves to that field with proper aria-invalid and aria-describedby wiring.

For the forms, I'm using native form submission so Enter key works, with submit buttons wired to each form and Playwright-friendly test ids. On successful expense submission I clear the description and amount, reset the split selection to everyone, keep the last payer selected, and move focus back to the description field, while rebuilding just the payer dropdown and split checkboxes when the list of people changes, preserving the current selection.

Adding a new person re-renders the split checkboxes with them checked by default since they're not in the unchecked set yet. I'm wrapping the split checkboxes in a fieldset with a legend "Split between" and the required data-testid, and labeling the payer dropdown "Paid by". Now I'm setting up the storage key, currency formatter, and cent-to-dollar conversion helper for the app's logic.

I'm defining the app state shape: a list of people, expenses with description/amount/payer/split info, and UI state for errors, draft input, and unchecked split members. Rather than storing error messages in state, I'll keep them in the DOM and clear them automatically when the user types in the corresponding field, which should satisfy test expectations about error visibility. I'm now writing the load function that reads and parses saved state from localStorage...

Writing load function logic...

I'm adding validation for expense fields (checking that description is a string, cents is a positive integer, payer is a string, split is an array), sanitizing lightly, and wrapping the save call in a try/catch. Then I'm writing a shares function that divides an expense's cents evenly among selected members, distributing any remainder cent-by-cent so the total always sums correctly, preserving people-list order.

Now I'm building balances by iterating expenses, crediting each payer and debiting each member's share, guarding against edge cases where a payer or split name doesn't match a real person. I'm starting a settle function that separates people into creditors and debtors, sorts them by amount owed, and begins matching the largest debts against the largest credits to minimize the number of transactions.

Writing settle algorithm...

I'm verifying the algorithm produces at most k-1 transfers since each step zeroes out at least one party and the final step zeroes both simultaneously, confirming correctness given balances sum to zero. Now I'm starting the rendering logic for balances, computing the max absolute balance to scale progress bars proportionally for each person.

I'm figuring out the markup for each balance item, using a scale visual where positive balances fill rightward from center and negative balances fill leftward, with distinct ink colors for "owes" versus "is owed" status text, and embedding the signed cents value as a data attribute for testing.

For transfers and expenses, I'm drafting list item markup showing who pays whom and the amount, plus expense cards with a description, total, a "Paid by X · Split between Y" meta line using a list formatter for joining names, a collapsible shares breakdown, and a remove button.

I'm ordering expenses newest-first by reversing the array, and planning a header summary like "3 people · 5 expenses · $240.00 spent" with proper pluralization. For the people list, each entry shows an avatar initial, name, and a remove button that's disabled with a hint when that person has existing expenses tied to them.

Now I'm writing the submit handler for adding a new person, validating that the name isn't empty, isn't too long, and isn't already a duplicate on the trip.

Still writing error rendering logic...

I'll track expense errors as {msg, field}, marking the relevant field aria-invalid and focusing it, while clearing aria-invalid on other expense fields when there's no error.

For submission, I've decided to read values directly from the DOM (description, amount, payer, checked boxes) rather than relying on draft state, since that avoids any sync issues and tests fill fields before clicking anyway. Draft state is only needed to preserve values across re-renders.

I'm checking which re-renders actually touch which DOM nodes — renderAll only rebuilds the select and fieldset, leaving the desc/amount inputs untouched, so I can simplify by capturing the current payer selection and unchecked checkboxes right before rebuilding those elements, rather than maintaining a separate draft object at all.

When the fieldset starts empty, everything defaults to checked, which handles new or removed people correctly without extra bookkeeping. After a successful expense add, I'll reset the description and amount fields and re-check all boxes while preserving the payer, and clear any form error as soon as the user edits the expense inputs again.

Now I'm working out amount parsing: stripping a leading dollar sign and commas, validating the remaining string against a decimal pattern, and distinguishing between an empty value, a malformed value, a zero value, and one that's unreasonably large before converting to cents.

I should also catch negative numbers like "-5" under the format error, so I'll word that message as "Use a positive amount with up to two decimal places, like 42.50" to cover that case too.

For validation order: no people yet takes priority with "Add at least one person before logging an expense", and an empty split selection gives "Choose at least one person to split this between." Then when adding an expense I push it with an auto-incrementing id, description, cents, payer, and the split list filtered to match people order. For deletion and removing a person, I'm using event delegation with data attributes on the list items to find the right id, and I'm adding a "Start a new trip" button that confirms before resetting the whole state and draft.

I also set up a screen-reader-only status announcer, and a single renderAll function that calls all the individual render functions for people, payer/split, expenses, balances, settle-up, summary, and errors. Each list needs an empty-state message toggled via the hidden attribute rather than a data-testid, with specific wording depending on whether people exist, expenses exist, or everything is settled — like "Everyone's even" versus "Add people to see balances."

For copy, I'm drafting friendly microcopy: a helper note on the expense form about default equal splits, a settle-up subtitle emphasizing that owing money is normal, a header tagline like "Shared trip costs, settled plainly," and a footer reassurance that data stays in the browser with a "Start a new trip" button.

Writing CSS custom properties...

I'm manually verifying contrast ratios for several color pairs—signal button hover state with white text, white text on the base signal color, and owed-chip text—to make sure everything meets accessibility thresholds, and settling on Figtree for body text and Fraunces for headings with optical sizing.

Now I'm designing the header band, confirming contrast for the wordmark and tagline against the navy Harbour background, then sketching out a logo SVG combining a level beam, fulcrum, and small signal dot.

Writing SVG code...

Now I'm setting up the overall page layout with cards for each section, defining spacing and a two-column grid structure for desktop view.

On mobile the stacking order works out fine as People, Expense form, Balances, Settle, Expenses. For desktop I'm still deciding placement—colA gets People then Expense form, while colB holds Balances, Settle up, and the Expenses list.

For section headings I like adding a small uppercase eyebrow label above each, like "The group" or "Log it", styled in a tiny tracked-out sans-serif above the Fraunces heading for an editorial feel—pairing with "People", "Add an expense", "Balances", "Settle up", and "Expenses".

For form fields, I'm checking contrast ratios on the input borders to make sure they meet WCAG's 3:1 non-text contrast requirement against the card background, landing on a border color around #8A8270 that gives roughly 3.7:1.

I'm styling focused inputs with a thick harbour-colored outline, and setting up checkbox chips as flex containers with rounded borders that highlight with a tinted background and border when checked, using the `:has()` selector with checked-state styling and keeping native checkbox sizing with an accent color. I'm also keeping selects native but styled to match input height and spacing, and now defining the primary button's base styles.

Button variants use the signal accent for primary actions with hover darkening and a slight press effect, while ghost buttons stay transparent with harbour-colored borders and text; I'm checking touch target sizes against WCAG guidance for smaller buttons. I'm also setting up focus-visible outlines consistently across interactive elements, including checkbox labels, and now laying out expense list items with top borders, plain unstyled lists, and balance rows with flexible wrapping header text for names, statuses, and amounts.

Now I'm working on the balance scale visualization with a background track and center marker line, plus a fill indicator using absolute positioning. I'm styling transfer rows to show who pays whom with bold tabular amounts, adding a trip summary stat line to the header showing people/expense counts and total, and making sure the layout stays responsive without horizontal overflow, including dashed-border styling for the empty state.

Now I'm laying out the person-entry form row with a flexible input and add button that wraps gracefully on narrow screens, sizing things so they fit at 360px width. I'm also setting up the amount input with a dollar-sign prefix, structuring the amount/payer fields into a responsive grid, and placing the footer disclaimer text with a "start new trip" button, while making sure the header and main app structure nest correctly for testing purposes.

Writing HTML boilerplate...

Building the people section form, and I'm reconsidering the maxlength attribute since it could block validation feedback for names over 40 characters.

Now I'm moving to the expense form markup with a description field and a hint about everyone being split in by default, setting up the fields for logging an expense.

Adding the message slot before the submit button...

Now I'm building the Balances card for column two, with a hint clarifying that a positive balance means the group owes the user money.

I'm continuing to lay out the Settle up and Expenses sections, each with their own lists and empty-state placeholders, plus starting the page footer noting that data is only saved locally in the browser.

Now I'm shifting into the JavaScript logic, setting up a storage key and constants for name length and max cents to cap expense amounts sensibly.

I set up currency and list formatters, a DOM query helper, and an HTML-escaping function to keep rendered text safe, then start the load function that reads saved data and falls back to an empty state with people, expenses, and an ID counter.

Writing load validation logic...

I'll ignore duplicate name edge cases on load since the filter already handles invalid entries. Now I'm sketching the save function to persist state to localStorage with error handling, plus a basic UI state object tracking person and expense errors, and a helper to extract the list of people names from state.

For rendering, I'm writing the people list function, which tracks which names appear in any expense, builds avatar initials and name tags, and shows a remove button only for unused people, with an empty-state message shown when no one has been added.

I need a click handler on the people list that detects the remove button via closest and reads the person's name from the dataset attribute, then a removal function that filters them out of state, saves, announces the change, re-renders everything, and shifts focus back to the add-person input.

Now I'm starting the function that renders the payer dropdown and split checkboxes for the expense form.

Still writing form logic...

Delete expense click is trickier though: the delete button sits inside the re-rendered list, so focus gets lost to body afterward. I should redirect focus somewhere sensible post-delete, maybe to the expenses heading with a tabindex set so it's focusable.

Since renderAll preserves DOM-based checkbox state, it should be safe to call everywhere rather than splitting into separate render functions. I'll just make sure each action explicitly restores focus afterward: name input after adding/removing a person, description input after adding an expense, and the heading after deleting one.

Now I'm writing the expense list renderer, building each list item with the description, amount, payer, split members, and a collapsible shares breakdown showing each person's cost.

I move on to renderBalances, computing each member's balance relative to the max absolute value to size a visual bar, then labeling whether they're owed money or owe money.

Checking that integer subtraction never produces a stray negative zero, and confirming the "even" status class displays correctly when balance is exactly zero.

Now I'm writing the renderSettle function, which builds the simplified payment list items with escaped names and formatted amounts, and handles the empty-state messaging depending on whether people or expenses exist yet.

I'm also setting up renderStats to compute totals and display a summary line counting people and expenses with proper pluralization.

For renderErrors, I want to make sure aria-invalid gets a proper "true"/removed state rather than an empty string, so I'll use setAttribute/removeAttribute instead of toggleAttribute's boolean-value quirk.

I'm also wiring up aria-describedby to point to the error message id when present, and handling expense field errors by targeting each relevant input—though for the 'split' error, since it maps to a fieldset of checkboxes rather than a single input, I'll just flag the fieldset itself as invalid since treating it as a group is acceptable for ARIA purposes.

For the error message markup, I'm deciding against adding a decorative "!" glyph since it could pollute the text content checked by tests, opting instead for a simple styled border to indicate the error visually while keeping the alert role for screen reader announcements. Now I'm starting to write the main renderAll function that orchestrates re-rendering people and payer/split sections...

Writing event listener logic...

Still defining validation order...

Still writing validation logic...

I'll cap the description at 80 characters with a validation message, and confirm selected values map correctly to names with no duplicate issues. Now I'm adding the delete expense handler that listens for clicks on the delete button within the expense list.

For deletion, I'm finding the expense by its data-id, filtering it out of state, saving, re-rendering, and shifting focus back to the expenses heading with an announcement of what was removed. The heading needs a tabindex of -1 to be focusable, and I'll keep the visible focus ring rather than suppressing it for accessibility. I'm now moving on to writing the reset button handler, starting with a confirmation check.

Still validating amount format...

Checking the other edge cases too — leading zeros collapse correctly, and stripping the dollar sign with stray spaces works fine after trimming.

For rounding, leftover cents go one-by-one to selected people in the order they joined the trip, which matches the requirement. Expenses can't reference removed people since that's already guarded against. Now I'm moving on to writing the full CSS carefully.

Writing global reset and body styles...

Actually I realize the negative-margin trick for the header won't go full-bleed since it's constrained by the max-width container—I need to restructure so the header sits outside that container entirely.

Still writing header styles...

Setting up the wrap container and a responsive column layout that stacks on mobile and switches to a grid on wider screens.

Styling card headings and form fields...

Checking that contrast ratio again, I settle on a slightly darker placeholder color, #6E695B, for a safer margin. Now I'm adding a clear focus-visible outline style for inputs and selects using the harbour color.

Thinking through the invalid state styling and the input row layout, I realize the button alignment breaks when the field wrapper includes a label, input, and message slot stacked together—the button in the second grid column ends up aligned with the label instead of the input itself, so I need to restructure the grid for the person form to keep things visually aligned.

I'm moving the message slot outside the field wrapper so the form itself becomes a flex row with the field and button as siblings, letting flex align-items:flex-end keep the button bottom-aligned with the input regardless of whether a message appears. On narrow screens the field and button will wrap naturally once the combined minimum widths exceed the container.

For the message styling, I'm defining `.msg-slot:empty{display:none}` so it collapses when there's no content, and an error style with a tinted background, rounded corners, bold text, and a colored left border for visual emphasis, checking contrast ratios land comfortably above accessibility thresholds. Then I'm setting up the money input with a positioned currency symbol overlay and padded input text with tabular numerals for alignment.

Now I'm laying out the expense form fields as a responsive grid that stacks on mobile and goes two-column at wider widths, then building pill-shaped chip selectors for categories with checkboxes styled as custom radio-like controls, tinted backgrounds when checked, and focus outlines -- though I note the focus-within ring might double up with the native checkbox focus ring, which I'll leave as is for now.

I'm fixing the double focus ring by disabling focus-visible on the inner checkbox and relying on the chip's own outline for visibility, adding a hint text style for empty chip states, then defining button styles -- primary, ghost, and small variants with consistent heights, hover/active states, and a shared focus ring treatment.

Checking contrast: ghost buttons read fine as harbour text on white or paper backgrounds, and the signal primary button's harbour focus ring stays visible against paper too. I'm then building list styles for people entries with circular avatars (harbour background, paper text for contrast), flexible name text, and rounded tag pills, plus starting an expense row style with a top border separator.

Adding more expense layout...

I decide to switch to Figtree for amounts since Fraunces' numeral style is uncertain, keeping Fraunces reserved for headings only. I'm now styling the balance rows with color-coded owed/owes/even states and a visual scale bar with a center marker to represent debt direction.

Still writing styles...

For transfers, I'm giving each entry a card-like layout with bold highlighted amounts in the harbour color, and building an empty-state placeholder with a dashed border for when there's nothing to show.

I'm also double-checking that the `hidden` attribute won't get overridden by any `display` rule I set, so I'm planning to add a global `[hidden]{display:none!important}` safeguard. Then I'm laying out the footer as a flexible row with muted text, and noting that default details/summary markers and mobile card padding should be fine as-is.

I'm checking expense form details like the hint text, verifying inputs are type=text so Playwright's fill works, and planning font fallbacks to Georgia/system if Google Fonts are blocked. I'm also confirming mobile layouts wrap correctly for amount/description and header elements, and working through whether focus-visible will reliably show outlines for programmatically focused elements like the heading with tabindex=-1.

I'm walking through a settlement example: Ana pays 60 split three ways, leaving Ben and Cy each owing 20, which resolves in two transfers matching the expected bound for three people. Now I'm testing a rounding edge case to make sure the cent-splitting logic holds up.

I'm checking the rest of the spec requirements: trimmed non-empty names, proper labels and fieldsets for accessibility, an alert-role live region for errors, and consistent language tagging. With these verified, I'm ready to write out the full implementation.

Good, escaping is confirmed throughout. Now I'm ready to write the final HTML, starting with the logo SVG mark...

Still writing SVG code...

Writing the full JS now, using flex styling for the mark element and Intl.ListFormat for formatting, plus a form with novalidate and a submit button.

I'm writing helper functions for validation state: a `flag` function to toggle aria-invalid, and a `renderErrors` function that updates error messages and aria-describedby attributes for both the person name field and expense field.

Still writing validation logic...

I'm checking that clearing the expense error on input works correctly, confirming change events don't trigger unnecessary re-renders, and now thinking through whether clearing other error states could have edge cases.

I'll skip autofocus on the name input to avoid popping the mobile keyboard, verify the settle-up logic uses minimal transfers, and confirm trip stats display dollar amounts properly. Time to write out the final file now.

For the markup, I'm tagging the main element with a test id, keeping the footer and status region nested inside it, and giving the expenses heading a tabindex so it's focusable for accessibility. Then I'm finalizing the empty-state copy: people empty state invites users to add everyone splitting costs, expenses empty state nudges them to log the first paid item, and balances empty state tells them to add people first to see who's owed what.

Now I'm pulling everything together into the final document — layout wrapper with header, content, and footer, plus a hint paragraph for the split fieldset when there are no people yet, and setting the color scheme to light. Writing final HTML...

