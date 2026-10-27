I'm working through the app design: people need unique, trimmed names with inline validation, and expenses need a description, valid CAD amount, payer, and split logic that divides equally in cents with leftover pennies distributed to the earliest-added participants, displayed newest first.

For balances, I'm defining owed/owes as paid minus share, with settle-up using a greedy largest-debtor-to-largest-creditor algorithm guaranteed to need at most n-1 transfers. For money formatting I'll rely on Intl.NumberFormat with en-CA/CAD, including its default hyphen-minus handling for negative values rather than substituting a true minus sign.

I'm also checking off persistence, empty states, responsive layout, and accessibility needs, then manually verifying contrast ratios for the Fog-on-Paper text color to make sure it meets AA standards.

Finishing that luminance calc gives contrast of 4.88 against the Sailcloth background, which passes AA for normal text at the 4.5 threshold. Now I'm checking Kelp green against Paper, computing its relative luminance component by component.

That gives roughly 5:1 contrast, passing AA. Now I'm weighing whether Rope borders on Paper backgrounds meet the non-text contrast requirement for UI components — the ratio is weak at ~1.5:1, but since the stated requirement only covers text contrast, I'll treat border styling as acceptable despite not meeting WCAG 1.4.11 for component boundaries.

I'll settle on Rope for input borders rather than overthinking hover variants. For checkboxes, I'm deciding to use native inputs with accent-color set to Harbour for the checked state, but I'm wrestling with the fact that unchecked browser-default borders are grey and not part of the brand palette, so I may need to custom-style with appearance:none to keep strictly to approved colors.

I'll go with a data URI SVG checkmark stroked in Paper white for contrast. For click handling, custom appearance-none checkboxes still work fine with testing tools, so I'll keep a 20px clickable size with the label included. For selects, I can use appearance:none with a custom Harbour-colored arrow while leaving the native dropdown popup alone, and I'll pull in Fraunces and IBM Plex Sans from Google Fonts for the typography.

Simplifying the Fraunces import to just the weight axis should keep it compatible with the css2 API, and I'm weighing whether to add a preconnect to fonts.gstatic.com — it's technically implied by loading the stylesheet, but I want to avoid tripping any check that flags external URLs outside fonts.googleapis.com, so I'm leaning toward skipping it to be safe.

Now I'm settling on a type scale of 14, 16, 20, 28, 40px, with the wordmark sized 40px on desktop and 28px on mobile, headings at 20px, body at 16px, and meta text at 14px. I'm keeping everything sentence case, with plain labels like "People," "Expenses," "Add an expense," "Balances," "Settle up," and buttons like "Add person" and "Add expense."

I'm deciding to skip adding a remove-person feature since it could complicate test assertions that check element text content, and it adds unnecessary scope. I'll keep the feature set focused on what's required rather than adding clearing or removal actions.

For the data structures, I'm planning the person element to hold just the name, the balance element to carry data attributes for person and cents alongside readable text like "is owed" or "owes", and the transfer element to show something like "Ana pays Ben $12.50" with from/to/cents attributes. For form validation, I'm deciding the error message element should only render when an actual error exists, rather than always being present but hidden.

I'm keeping a persistent aria-live region in the DOM so screen readers announce new errors, inserting the form-error paragraph inside it only when there's a validation problem and clearing it on fix, plus wiring aria-invalid and aria-describedby on the input. I also need to decide when errors clear—likely on successful submission, and probably testing duplicate name detection like adding "Ana" then "ana" to confirm the error shows.

To avoid the person-name error lingering and breaking an unrelated expense-related check, I'll clear it specifically when the user edits the person name field, not just on submit.

I'll go with errors clearing on successful submission of that same form, or when the user edits the field causing the error—keeping it simple so a different form's error isn't affected by another form succeeding. That matches typical test expectations like a rejected duplicate person not clearing until a valid person is added, while an expense error stays independent of person additions.

For the expense form with zero people, I'll keep the form always rendered rather than disabling controls, but add an empty-state note near the split area prompting the user to add people first, and let submission validation catch the missing-person case with a clear message.

For the payer select, I'll default to the first person rather than a placeholder, since tests likely assume a payer is always set and defaulting reduces friction; this selection should persist when new people are added.

For splits, everyone is checked by default, and new people added later should also be checked automatically unless someone's unchecked existing selections. After a successful expense submission, I'll reset the description, amount, and split checkboxes back to all-checked, but I'm leaning toward keeping the payer selection intact since it's common for the same person to pay multiple expenses in a row.

After adding an expense I'll move focus back to the description field for faster entry, and after adding a person I'll clear and refocus the name input. For amount validation, I need required, positive values with at most two decimal places, and I'm deciding between a text input with decimal inputmode versus a native number input.

Going with type="text" avoids issues where Playwright can't type non-numeric characters into number inputs, which would break tests expecting to fill invalid values. I'll parse the input tolerantly, trimming whitespace and stripping an optional leading dollar sign, and consider whether to allow comma thousands separators too.

For deciding whether to strip commas, I only treat them as thousands separators when the whole string matches that pattern, to avoid misreading something like "12,5" as 125 instead of a European-style decimal. After cleanup I validate with a regex requiring digits with an optional decimal part, allow a trailing dot as shorthand for whole numbers, and enforce at most two decimal places. I'm now drafting the error messages for empty input and invalid number formats.

I'll set a reasonable upper cap, like $1,000,000,000.00, so integer math stays safely within safe number limits, and show a clear message like "Enter an amount of $1,000,000,000.00 or less." if exceeded.

For parsing the amount into cents, I'll split on the decimal point and combine the integer and fractional parts manually to avoid floating-point errors. For description validation, I need a required, trimmed field with a placeholder like "Enter a description, for example Groceries," and I'm weighing whether to add maxlength limits on description and name fields, worried that long test inputs might exceed them unexpectedly.

I'll use overflow-wrap and min-width settings so long strings wrap instead of causing horizontal scroll at narrow widths, and I'll set generous maxlength values (names 60, description 120) since Playwright's fill should respect those limits. For validation messages, I'm defining specific errors: one for choosing a payer, one for selecting split participants, and one for when there are no people in the trip yet, plus figuring out how the expense form should display a single error message.

Given that tests likely use `getByTestId('form-error')` with `toBeVisible()`, having multiple matching elements at once would trigger a Playwright strict-mode violation, so I need to ensure only one form-error element exists at any time -- both within a single form and across different forms that might trigger errors simultaneously.

I'll place each error message right next to its specific field rather than at the top, using a slot per field with aria-describedby linking it so screen readers announce it when focus moves there. Validation still checks all fields but surfaces just the first failure, and I won't clear what the user typed. For the person field, I'll use "Enter a name." for empty input and a duplicate-name message when they try adding someone already on the list.

Data structure thoughts: storing people as {id, name} objects with expenses referencing ids, since ids are cleaner than relying on name text for splits. For splitting leftover cents, I compute each person's share by trip order using floor division with the remainder distributed to people early in that order, not in whatever order they're selected in.

For display, I decide against showing "everyone" even when an expense is split among all current people, since that could break tests expecting specific names to appear — safer to always list actual names, possibly with each person's individual share shown alongside who paid.

For the single-person case I'll use "For Ana only" instead of the awkward "Split between Ana." I'll skip displaying the date for now, and for the remove button I need to make sure the aria-label includes the visible "Remove" text plus the expense name and amount.

I'll avoid confirm() dialogs since Playwright auto-dismisses them, which would break removal — so I'll just remove directly and handle focus afterward by moving it to the next remove button or a heading with tabindex, plus announce the removal through a live region. For balances, I'm thinking through how to format each person's name and amount, with positive values styled distinctly.

I should stick to the exact Intl.NumberFormat('en-CA', currency: CAD) output rather than adding signDisplay, since tests likely compare against that exact formatted string — so negative values will naturally show the minus sign, and I just need to wrap the sentence around it rather than altering the number format itself.

I'm thinking each row should show the amount prominently with a small status label underneath like "is owed" or "owes." Maybe even better to show both the paid total and share alongside the balance for transparency, like "Ana · Paid $60.00 · Share $35.00" with the balance on the right.

For the zero-balance case, I need to format it as "$0.00" with a "settled" label, and make sure the math never produces a negative zero by keeping all cent calculations as clean integers.

For settle-up transfers, I'm using a greedy approach: sort debtors and creditors by amount, then repeatedly match the largest debtor with the largest creditor, transferring the minimum amount between them until one side zeroes out. This guarantees at most n-1 transfers total since every step clears at least one party, with ties broken deterministically by amount and then by original order.

Sorting transfers by debtor then creditor trip order. Now thinking through empty states: a friendly nudge for no people ("Add everyone on the trip, starting with yourself"), no expenses ("Log your first expense with the form above"), the split area when there are no people yet, and balances explaining they'll appear once people and expenses exist.

For settle up, handling the case of no expenses versus everyone being even ("Everyone is even, so there is nothing to settle"). Now I'm laying out the page structure as a single column capped at 720px, starting with the header wordmark and tagline, then the People panel with its form and a wrapped list of name chips bordered in Rope with a small count label, followed by the Expenses panel heading.

For the expense form, I'm adding description, amount with a CAD prefix, a "paid by" selector, and split-between checkboxes with optional "Select all"/"Clear" quick buttons styled as secondary actions outside the checkbox container, then the "Add expense" submit button. Finally the expense list section gets its own heading and total.

Now I'm working out section ordering — people, add expense, balances, settle up, expenses history — weighing whether balances/settle-up should come before or after the expense log so the most important outcomes aren't buried once the list grows long.

I also want a visible confirmation after adding an expense, like a small status message "Added Groceries for $45.00" near the form, plus a live region announcement, while making sure it's not mistaken for a form-error element.

Reconsidering layout order, I'll stick with a single centered column (max 720px) rather than two columns, following the spec's order: People, Expenses (form + list), Balances, then Settle up. Though I worry that on mobile, a long expense list pushes Balances and Settle up far down, making them annoying to reach after scrolling past many entries.

Actually, separating "Add an expense" from the expense list by Balances feels a bit odd. I'll just go with the natural spec order: People, Expenses (form plus list together), Balances, Settle up — trips usually have fewer than 30 expenses so no scrolling issues. I considered adding a small jump-nav under the wordmark, but that doesn't fit as supporting text, so I'll skip it.

Final structure: People, Add an expense, Balances, Settle up, Expenses list — this way the balances and settle-up results appear right after adding an expense, creating a clear feedback loop, while the expense log sits at the bottom as reference. I'll use a data-testid of "expense" for each list item and show newest first. Now I'm defining CSS color variables for the design system.

Still writing styles...

I'm settling on 16px gaps for the wordmark spacing, with the h1 "Even Keel" set in Fraunces 600 at 40px/48px line-height (28px on mobile), plus a 16px fog-colored supporting line beneath it. I'm also checking that Fraunces' optical sizing axis will engage automatically via the font-optical-sizing property.

Now I'm working out panel styling: Paper background, 1px Rope border, 6px radius, 24px padding (16px mobile), 24px gaps between panels, and h2 headings at 20px Fraunces to balance against the 40px wordmark, with panel headers pairing a left-aligned title and right-aligned fog-colored meta text at 14px. I'm also sizing inputs to a 48px touch-friendly height with 16px/24px text.

For the box model, I'm settling on 48px-tall inputs and buttons using box-sizing border-box with 0 16px (inputs) or 0 24px (buttons) horizontal padding to keep things aligned to the 8px spacing scale, avoiding awkward values like 12px, and I'm leaning toward 14px labels for readability.

Now I'm working through focus states: labels at 16px/500 weight, hints at 14px, an 8px gap between label and input, and applying a visible outline via :focus-visible for buttons while using plain :focus on inputs and selects to ensure focus is reliably visible across browsers during keyboard and mouse interaction.

For primary buttons I'm considering hover treatment since Signal can't use tints—since Harbour's documented use is text/headings/focus rings rather than button backgrounds, I'm leaning toward an underline text-decoration on hover as the safest option that respects the color system's constraints.

Secondary buttons get Paper background with a 1px Rope border and Harbour text, radius 6px, with border shifting to Harbour on hover over a 150ms transition. For Remove, I'll keep it text-only at a 40px height for touch target compliance, skipping icons since the label is already clear. For the checkbox list, each item gets padding and a rounded border with a custom 20x20 checkbox design.

I'll settle on 6px radius for the checkbox despite it being noticeable on a small square. For the option tiles, I'm designing them as bordered label elements with rounded corners and flex layout, adding a checked-state border enhancement. Then I'm working out the custom select arrow styling and starting the dollar-prefixed amount input wrapper.

Now I'm laying out the responsive grid for the expense form, with description full-width and amount/paid-by side by side on wider screens, plus working through the people-management section where the input and "Add person" button sit in a flexible row that wraps on narrow viewports.

For the people list and expense list items, I'm planning tight pill-like entries with names, a count summary like "3 people," and overflow handling for long names. Each expense row gets a grid layout with description and meta text on the left, and the amount plus remove button stacked on the right, adjusting gracefully for mobile.

For balances, each row shows a name with payment/share details, and on the right a tabular amount colored by status—Kelp for positive, Harbour for negative, Fog for neutral—paired with text labels like "is owed," "owes," or "settled." The settle-up list follows a similar pattern, showing who pays whom with the amount aligned right.

I'm weighing whether to add a "Record payment" feature that would log a repayment as an expense to actually zero out balances, but deciding it's optional complexity since tests likely won't trigger it anyway.

For persistence, I'm planning a localStorage schema under a versioned key storing people, expenses, and a counter, with validation on load and graceful fallback if storage access throws. IDs can just be a simple incrementing counter rather than anything fancier.

For rendering, lists get rebuilt on data changes, but I want to avoid rebuilding form inputs so typed values aren't lost — except payer select and split checkboxes need to sync when the people list changes, preserving selections where possible and defaulting new people to checked. Forms should use native submission and `novalidate` to avoid browser popups interfering with validation logic.

I'm thinking through labeling: visible labels for name, description, amount, payer, and a fieldset legend for the split checkboxes, with hint text under amount and description rather than placeholder text, since placeholders could be mistaken for pre-filled data. Still need to pick an accessible color for error messaging since Signal isn't appropriate here.

Since Kelp signals positive states, I'm leaning toward using Harbour for errors instead of red, skipping decorative icons since they wouldn't clarify an action, and marking invalid inputs with a Harbour border plus bold Harbour error text to keep things distinct without relying on color alone.

I also want to add a visually-hidden aria-live polite status region so success messages get announced to screen readers.

I'll make the error container itself an aria-live="polite" region holding the error paragraph, so even if focus doesn't move (already on the field), the announcement still fires; there may be slight double-announcing with describedby but that's acceptable.

For the expense form, each field (description, amount, payer, split) gets its own live-region error slot, and describedby always includes the hint id plus the error id when present. For currency, I'm using Intl.NumberFormat for CAD and dividing cents by 100, which stays precise enough for values well into the hundreds of millions.

For equal splits, I'm computing base cents per person by integer division and distributing the remainder one cent at a time across the first few people in trip order. I also need to sanitize on load by dropping invalid split ids and expenses with missing payers or empty splits, then start building the balance calculation per person.

For settlement, I'm matching debtors and creditors with exact matching amounts first, then falling back to a greedy two-pointer approach on sorted lists to minimize the number of transactions, accepting that re-sorting at each step would be more optimal but a single sort upfront is a reasonable tradeoff.

Writing HTML markup...

Writing people form markup...

Adding more expense form fields...

Finishing the form with the submit button and status message, then thinking through hint text alignment — adding a payer hint so the amount and payer fields stay visually aligned in their row, while keeping hint examples like "groceries" since those are fine as illustrative text rather than pre-filled data.

Split between legend with a hint explaining equal sharing, plus small "Select all" and "Clear" buttons shown when people exist, using type="button" so they don't submit the form. For an empty people list, I'll show guidance text and a disabled placeholder option in the payer select.

For validation ordering, a missing people list triggers a single top-level error above the submit button without moving focus away from it, and only if people exist do I move on to checking description, amount, and payer.

Now I'm structuring the expenses list panel with a heading, running total, list container, and empty-state message, following the same pattern as the people section. I'm drafting friendly empty-state copy for each section, pointing users toward the exact next action—like adding themselves first or using the expense form above the list.

For balances, I decide to always render every person's balance (even $0.00) once people exist, reserving the empty state only for when there are no people at all. Settle-up gets similar logic: it prompts to add an expense if none exist, and shows an "everyone is even" message when all balances are zero. Now I'm starting to lay out the markup for an individual expense list item.

For the uneven case, I'll show each person's exact share inline, like "Split between Ana ($3.34), Ben ($3.33) and Cara ($3.33)", since the extra cent goes to whoever's first in order. For even splits I'll keep the simpler "$15.00 each" phrasing.

I'll split "Paid by Ana" and the split-between line onto separate lines for mobile clarity, no numbering needed. For the balance list item markup, I'm structuring each row with the person's name, a meta line showing "Paid $X · share $Y", and a balance amount with positive/negative styling plus an "is owed"/"owes" state label.

Thinking about phrasing for the balance state—considering "Is owed" versus a friendlier "Gets back $25.00" instead of a bare label.

I want to avoid a double negative where "Owes" pairs with a negative amount like "-$12.50", so placing the label beneath the amount rather than beside it feels cleaner. Settling on sentence-case labels: "Is owed", "Owes", "Even".

Since the requirement calls for showing negative balances with a minus sign, I'll keep signed display rather than hiding the sign. I'm now sketching the transfer list item markup with person names and amount, then thinking through how to phrase the expenses meta line in sentence case, like "3 expenses · $123.45 total".

For people counts I want proper singular/plural handling. Then I'm moving to focus styling, giving focus-visible outlines in Harbour color with offset so they're visible against Paper backgrounds, making sure custom checkboxes also pick up keyboard-only focus rings. Finally I'm adding baseline responsive resets—box-sizing, margin removal, text-size-adjust—to prevent horizontal overflow issues.

Line heights set for each size, with tabular-nums applied to money and amount fields for alignment. Now I'm moving into the JavaScript, starting with a currency formatter using Intl.NumberFormat for CAD, a max-cents cap, and a load function that reads saved state from storage...

Writing sanitization logic...

Finishing the parsed expense objects and setting the sequence counter from saved data. I'm also thinking about id collisions after reload—better to generate new ids using a combination of the sequence counter and a random suffix, or just use crypto.randomUUID when it's available, to avoid duplicates.

For comparing names case-insensitively, I'm considering whether to just use toLowerCase() or something more robust like normalizing unicode first, plus handling extra whitespace between words.

I'll just stick to the spec: trim and compare case-insensitively, without collapsing internal spaces. Expenses render newest first by reversing insertion order, and I'll persist state to localStorage wrapped in a try/catch for safety.

For save failures, I should show a subtle notice in the header saying the trip couldn't be saved. I also want to listen for the storage event so other tabs stay in sync by reloading state and re-rendering. Now I'm writing the person form submit handler that trims and validates the name, checking for duplicates case-insensitively before adding a new person.

I'm refining the duplicate-name error message to be more specific and helpful, suggesting the user try a distinguishing variant of the name rather than just rejecting it outright.

I also want the input field to retain the rejected value rather than clearing it, and I'm setting up a mapping of field keys to their corresponding input elements and error message slots so I can build a unified showError function for the form.

For each field, this function creates an error paragraph, marks it with a test id, links it to the input, sets aria-invalid, wires up aria-describedby, and focuses the invalid field. For the checkbox group specifically, I'll apply aria-invalid and aria-describedby to the fieldset itself and focus the first checkbox, using a static describedby pointing at the error slot so it stays valid even when empty.

Now I'm moving to clearing errors across all targets by emptying their slots and removing aria-invalid, then writing the expense form's submit handler, which first checks that at least one person exists before proceeding and begins pulling the description field from the form.

Writing the validation logic...

Once the split selection is confirmed, I push the new expense object, save state, reset the form, re-render everything, and show a confirmation status message before refocusing the description field. Now I'm writing the parseAmount helper to trim input, reject empty values, and strip leading currency symbols like $ or CA$ before parsing.

Still writing amount validation...

I'm checking more edge cases like trailing dots, stray periods, zero amounts, excess decimal places, scientific notation, and comma-formatted thousands to make sure the regex correctly accepts or rejects each. Then I start thinking about how payer selection values map to names in the dropdown.

For resetting the form, I decide to clear the description and amount, reset the payer to the first person for consistency, and recheck all checkboxes. I lay out that renderAll calls the various render functions for people, payer options, split, expenses, balances, and settle. For renderPayerOptions, I'm writing logic to preserve the currently selected payer if they still exist, otherwise rebuild the options list and fall back appropriately.

For renderSplit, I'm writing code that preserves the checked state of each split checkbox across re-renders by capturing previous values into a map, then rebuilding the checkboxes and restoring their checked status (defaulting to checked for new people).

I realize rebuilding the split checkboxes on every renderAll call could cause unwanted focus loss, so I should only trigger that rebuild when the people list actually changes, rather than after every expense add or remove.

I'm also adding Select All/Clear buttons for the split checkboxes, plus a live hint that updates to show the per-person share amount as the user enters an expense, like "$15.00 each" when the split is even.

Still building expense logic...

For removing an expense, I'm wiring up event delegation on the list so clicking a delete button finds the item's id, removes it, saves, re-renders, and manages focus sensibly—landing on the next item's delete button or falling back to the heading—while announcing the removal. Then I'm working out balance computation, tallying how much each person paid versus their fair share by iterating through expenses and summing into a per-person map.

For settling up, I'm designing an algorithm that first matches debtors and creditors with exact equal amounts to clear in one transfer, then falls back to a greedy approach sorted by amount to minimize the total number of transfers needed.

Sorting debtors by amount first for determinism, I confirm no duplicate transfer pairs can arise since exact matches and greedy steps always zero out one side before removal. I'm now thinking through rendering balances with cents as data attributes and setting up expense totals and announcement logic.

I'm adding a visually hidden live region for status announcements, but deciding to only use the visible status text for expense additions to avoid double announcements—clearing it when the form changes so it doesn't go stale. I'm also figuring out placement for a save-failure notice about the trip not persisting, weighing whether it belongs near the header or within the People panel.

For the people list, I'm styling each person as a small bordered item with modest radius and padding, sticking to multiples of 8px for spacing, and leaning toward a compact tag-like layout over a numbered list or avatars.

Writing header markup...

I'm adding the tagline below the wordmark in Fog gray, then setting spacing rules for the masthead, panel gaps, and bottom padding. I'm also defining font fallback stacks for both the sans and serif typefaces, and starting the form styles for labels and hint text.

Styling input fields...

I'm second-guessing whether using Fog as a hover border color deviates from the stated palette rules, since Fog's defined purpose is secondary text—maybe I'll skip hover border changes on inputs entirely and rely on the focus ring to indicate state instead.

For invalid inputs I'll use Harbour as the border color to signal emphasis, and I'm noting the Rope border on Paper has low contrast but the label positioning handles boundary clarity. No placeholder styling needed. Now I'm writing the custom dropdown arrow icon as an inline SVG data URI...

Still writing checkbox styles...

Actually the selection highlight reinforces choice, so I'll keep it and skip adding hover styles since checked state already covers it. I need to reset fieldset defaults carefully—particularly setting min-inline-size to zero since fieldsets default to min-content width and can cause overflow. For the legend, I'm weighing simple padding/margin resets versus float tricks, and thinking about how to position "Select all/Clear" buttons alongside the legend text in the header row.

Instead I'll arrange it as legend, then a hint row with the hint text on one side and small action buttons on the other using flex layout, followed by the options list. Writing button styles...

Still working out borders...

I'm laying out the expense, balance, and transfer row grids with their main/side columns and alignment rules, then setting up the panel head as a flex row with spacing and defining the empty state styling.

For the error text, I'm weighing whether color alone communicates the error state and deciding to reinforce it with bolder weight and descriptive wording rather than icons, plus marking invalid inputs with a distinct border so the status reads clearly without relying on color alone.

I'm also working through supporting form details: spacing for form actions, placement of the form-level error above the buttons, a visually-hidden utility class, keeping typed values after a duplicate rejection, defaults restoring after reload, and letting Enter submit the name field.

For the expense split checkboxes, I'm verifying that unchecking a person's custom checkbox works properly with test locators and toggling via the label. I'm confirming newest-first ordering holds after removals, then starting to write out the CSS, beginning with the root variables.

Writing base styles...

I'll set main to max-width 720px with box-sizing border-box so the checker's width measurement matches exactly, with padding inside giving 672px of actual content space, and smaller padding on mobile. Then I'm styling the headings with the serif font and harbour color, and setting up a wordmark element using flexbox alignment.

Still writing styles...

I should also confirm reduced-motion disables transitions, then move to the JS side — I'm writing a small helper function for safely building DOM elements with attributes and text content, using append so strings become safe text nodes rather than raw HTML.

Next I'm drafting a function to join names into readable lists ("Ana, Ben and Cara") and another to describe how a split works — handling single-person splits, even splits, and uneven splits with per-person amounts shown in parentheses.

I'm also figuring out summary labels for the expense list ("3 expenses, $123.45 in total") and settlement list ("2 transfers"), then setting up a click handler that finds the delete button for an expense, locates its list item and index so I can manage focus after removal.

After removing the expense, saving, and re-rendering, I move focus to the button at the same index (or the previous one if it was last), falling back to the expenses heading if the list is empty, and announce the removal for screen readers.

I'm also thinking through status clearing on form edits, and how select-all/clear/checkbox/amount changes should update the split hint without triggering validation errors. Now I'm writing the logic for the split hint text based on how many people are checked and the parsed amount.

For k=1, I'll settle on "The full amount is Ana's share." For uneven splits I'll show both rounding possibilities like "$3.33 or $3.34 each," handling edge cases where the base amount is zero gracefully, and I need to be careful with possessives for names ending in "s" like "James's."

I also need to add a live region announcement when someone's added to the trip, sync state across tabs via storage events with a signature check to avoid unnecessary re-renders, and make sure trimmed duplicate names and empty/whitespace-only names are validated correctly. For the person form error I'll place it below the input with proper aria-describedby, and for expense-level errors like "no people selected" I'll add a dedicated error slot without stealing focus.

Checking the no-people scenario: if someone fills in an expense but no people exist, I show a clear error directing them to add a person first. Validation order between description, amount, and people checks shouldn't matter much. I'm also verifying that the Playwright select option values map correctly to person names, even ones with special characters, and adding a small noscript fallback message plus confirming my text sizes stick to the defined scale (14, 16, 20, 28, 40).

For balances I'll bump the amount to 20px/500 weight for emphasis while keeping expense line amounts at 16px, and I need to override default bold weight on strong/b tags since the font only supports 400 and 500 weights, making sure headings, buttons, and labels all use consistent weights without any unintended bolding.

Checking the contrast ratios, everything looks solid — fog on paper, kelp on paper, paper on signal all pass comfortably. Now I'm drafting the copy: a short tagline like "Split trip costs and see who owes whom," an empty state nudging users to add themselves and others to the trip, and I'm working out a similarly inviting line for the empty expenses state.

Now I'm filling in the remaining empty states — balances with no people, settle-up with no expenses, and the all-even case — plus a small meta line noting how many transfers are needed to settle up.

Writing the HTML document...

Confirming the font URL format is valid, then moving into writing the base CSS reset and typography styles for the page.

Writing layout styles...

Writing form control styles...

For the inline person-form row, I'm checking the flex math at 296px width—input basis 180 plus gap plus button ~125 exceeds the container, so it wraps with the button dropping to its own line, and I'm considering giving the button flex-grow so it fills the width when wrapped.

Recalculating with a tighter input basis of 140px, the row fits comfortably within 294-298px available content width at common viewport sizes, so I'm settling on that value and setting the button to flex 0 0 auto so it doesn't stretch unexpectedly.

Still writing button styles...

Adding more styles...

Styling the pills, hiding empty states, and defining error and status text styles...

Adding responsive breakpoints for field layout and panel padding, plus forced-colors mode handling for checkboxes.

Now I'm moving to the JS implementation, starting with the storage key setup and currency formatting using Intl.NumberFormat for CAD values.

Wiring up DOM references for all the form elements and lists...

Now I'm setting up state helpers: generating unique IDs for people and expenses, creating a blank trip structure, sanitizing loaded data, and loading the trip from local storage.

I'm defining save logic that writes the trip to storage and toggles a storage warning if it fails, plus small helpers for finding a person by ID and normalizing names for comparison. Next I'm starting on share calculations...

Writing share-splitting logic...

Now I'm moving into rendering, starting with the people list markup.

Still building payer/split sync logic...

I'm handling edge cases like a single person or no payer, then moving to renderExpenses, building each expense row with payer info and share breakdowns...

Still writing component markup...

Finishing the row layout with paid/share amounts and balance label, then considering whether "Is owed" reads well for screen readers alongside the amount — deciding it's acceptable as is.

Moving on, I'm thinking the middle dot separator might read oddly to screen readers, so I decide to just switch to a plain comma-separated sentence like "Paid $60.00, share $35.00" instead of fussing with hidden spans. Now I'm starting the settle-up render function, building list items with transfer data attributes for from, to, and amount in cents.

Writing component styles...

I'm also planning an empty-state hint line reassuring users everyone's even once payments are made, and designing an announce function that clears and resets the live-region text with a short delay so repeated identical messages still get read aloud.

Now I'm mapping each form field to its error slot and building clearErrors and showError helpers that clear or set validation messages and toggle aria-invalid attributes accordingly.

I'm deciding errors should persist until the next submit attempt rather than clearing on input, which keeps the UX simple—if the user fixes a field, the old error message stays visible until they resubmit. I want to make sure this matches test expectations around preserving typed values and re-validating on resubmission.

After a successful expense submission, I'm resetting the form fields (description, amount, payer, checkboxes), updating the split hint, and setting a status message with role="status" so screen readers announce it, clearing that status on subsequent input. I'm also wiring up a storage event listener to reload and re-render the trip when another tab updates localStorage, being careful to handle the case where the key is null (as happens on a full clear).

I'm also handling initialization by loading the trip and rendering everything, deciding against autofocusing the person name field since that could feel jarring, and double-checking small details like the split hint's aria-describedby references, checkbox attributes, and making sure the "Select all" and "Clear" buttons have clear, accessible labels.

I'm also verifying responsive behavior at narrow widths—making sure long names and dollar amounts wrap or truncate properly instead of overflowing, and that expense panels and row layouts hold up with long text or large totals.

Then I'm stress-testing the transfer-minimization algorithm against edge cases, like debtors [5,5] matched against creditors [5,3,2], to confirm the exact-match-first approach still falls back to greedy correctly when no perfect match remains.

I also want to verify rounding distribution when splitting amounts like $10.00 three ways—checking that leftover cents go to whoever was added first in trip order, and that balances net out correctly regardless of payer order. I should also make sure currency formatting like "$1,234.50" displays properly.

Now I'm assembling the final HTML structure, starting with the main app container, header with the wordmark and tagline, and a noscript fallback message...

Writing more markup...

I'll add 16px top margin to the people list and empty text, then start building the expense form section with its description field, label, and error slot following the same pattern as the person name field.

Now I'm adding the amount field with a dollar prefix and decimal input mode, plus a payer dropdown select alongside it in a field row.

Finishing the form structure...

Wait, I realize the empty form-error slot sitting before the actions could still consume space -- grid gap applies between items even when an element is empty, so that zero-height slot would still add an unwanted 24px gap.

Spacing within fields and fieldsets seems consistent now—label margins, error slots, legend-hint pairing all tight. Moving on to building the Balances section panel with its heading and meta description.

I'm drafting explanatory text for each section: balances meta clarifying "what each person paid minus their share," settle-up intro describing it as a short list of payments to even things out (shown only when transfers exist, otherwise an empty state), and starting the Expenses section heading.

Now I'm settling on the page's section order: People, Add an expense, Balances, Settle up, and Expenses, with the expense log placed last and its heading set as a focus target for accessibility.

Setting up the core JS structure now with storage keys, a currency formatter for CAD, and DOM helper functions...

Mapping all the form elements — person and expense forms with their error fields, the split fieldset, payer dropdown, and related hints...

Finishing up the DOM element references, then I'm adding helper functions: one to join names into a readable list with commas and "and", and another to summarize expense splits by mapping share entries to names and amounts.

I'm building the split summary logic, handling equal versus uneven splits with different phrasing, then moving on to a function that updates a hint showing which checkboxes are selected for splitting expenses.

Finishing split hint logic...

Now I need to move on to the renderAll function, which calls renderPeople, renderExpenseOptions, and updateSplitHint together to keep everything in sync.

Writing balance calculation logic...

I need to differentiate empty-state messages depending on whether people exist yet, and figure out the plural "payments" label for the settle-up summary. Now I'm writing the transfer list item markup with data attributes for testing and the payment details.

For wiring up events, I'm planning input/change handlers that clear status messages, update split hints, and handle select-all/select-none checkbox logic, plus setting up an announce function with a timer for screen reader announcements.

I'm also walking through edge cases: default checked boxes for new participants, form reset after adding expenses, and making sure newly added people get included in splits going forward.

One thing I'm weighing is where focus should land after adding an expense — moving it to the description field speeds up repeated entries but might pop the keyboard unexpectedly on mobile, versus leaving focus near the status message after the button.

Now I'm writing out styling details: amount and balance text sizes, a color class for owed amounts, a visually-hidden utility, and notice box spacing.

I realize the notice panel's hidden state could still trigger adjacent-sibling margins, so I'm switching to a flex column wrapper with a gap instead, since hidden elements won't contribute to that gap — this avoids the margin-stacking issue cleanly.

Now I'm styling the split-option buttons: flex-wrapped tags with borders that highlight on hover or when their radio input is checked, using the harbour color for emphasis.

Writing custom checkbox styles...

Writing form layout styles...

I'm thinking through edge cases when there are no people or just one—whether the split-head container still keeps its spacing, and confirming tools only show with multiple people while hint text appears for a single person. Now I'm defining the rows container with a top border and each row as a grid with content and actions columns, spaced and padded consistently.

I'll drop the top border and set first-child padding-top to 0 instead. For the balances section, I'm deciding to tuck the intro paragraph inside the panel-head block, spacing it below the heading before the list starts.

Making the panel-head a flex-wrap container lets the intro text sit as a full-width second line with a small gap below the heading, so I can reuse this pattern for both panels: balances gets a heading plus intro, settle gets a heading plus a count and a wrapping intro.

For wording, balances explains that a positive balance means someone is owed money, while settle's intro just says to make these payments to even things out, shown only when transfers actually exist. I'm also sketching the expenses meta line to show a count and total.

Now I'm styling the empty-state paragraphs in a muted fog color, then moving to the masthead: spacing out the wordmark with a small accent rule, aligning the tagline underneath the wordmark text rather than the rule itself, and tuning the Fraunces typography size and spacing. Finishing up by confirming heading colors and button sizing/line-height match the 48px touch target.

Writing form submit handler...

I'm refining the error messages to be clearer—"Enter a name to add a person" and a friendlier duplicate-name message suggesting a last initial. Then I'm starting the expense form submit handler, which validates that people exist on the trip before reading the description field.

Continuing the validation logic...

If none are selected I show an error pointing to the first checkbox. Otherwise I push the new expense record, save, reset the form, re-render everything, and update the status message confirming what was added.

I'm checking that clearing status on input events won't accidentally fire when focusing the description field, and confirming checkbox changes still trigger input properly. Now I'm writing resetExpenseForm, which clears the description and amount fields, resets the payer dropdown to the first person, and unchecks all the split checkboxes.

For the payer error case, that should only happen with an empty people list, which is already handled elsewhere. I'm also drafting the specific validation messages for parseAmount—covering empty input, negative values, non-numeric entries, too many decimal places, zero amounts, and amounts exceeding the max limit.

Writing parseAmount logic...

Still validating input...

Now I'm writing a sanitize function that rebuilds a trip object from raw data, checking each person entry has a valid string id and type before including it.

Still validating expenses...

I notice I'm reusing the `trip` variable name for a local clean object, so I should rename it to `clean` to avoid the conflict. Now I'm ready to assemble the complete file carefully.

I'm checking the small UI details: the HTML language attribute, font loading with display=swap, delete button test IDs scoped to each expense, and ensuring the expense list sorts newest first. I also want to remove default iOS input shadows and tap highlights by using appearance:none and adjusting border-radius so everything matches the clean brand style.

Now I'm nailing down heading sizes and hierarchy (h1 for the wordmark, h2 for section titles), plus styling for balance rows, money amounts, and reducing strong font-weight for a lighter touch.

For the tabular-nums requirement, I'm deciding to just apply `font-variant-numeric: tabular-nums` body-wide rather than scattering it across individual classes — simplest way to guarantee all numerals align consistently.

I don't need to worry about preserving checkbox focus in renderExpenseOptions since rebuilds only happen on person form submits, and I've confirmed the storage event comparison and data-id attributes are handled correctly. Now I'm writing the renderBalances function to build the balance list items...

Writing balances rendering code...

Still writing balance row markup...

I settle on short labels "Is owed", "Owes", "Even" for the status text. I also double-check the edge case of negative zero in formatted currency, but since net differences from equal integer subtraction always yield positive zero, there's no risk of displaying "-$0.00".

Now I'm finalizing the document title as "Even Keel · Split trip expenses" and adding accessibility touches like aria-labels on the people and expense lists. Writing the HTML document structure...

Adding base styles...

Writing layout styles for the app container and wordmark...

Adding more styles...

I'm reasoning through how the panel-head wraps: heading and meta on one line, the intro text dropping to a full-width line below, and confirming the mobile tagline padding stays consistent. For simpler panels like "Add an expense" with just a heading, the layout still holds fine.

Now I'm tightening up the form internals: making inline fields flex properly with a minimum width, zeroing out fieldset borders and padding so they don't interfere with layout, keeping legends compact at the top, and letting option labels wrap anywhere they need to. I'm also making sure error slots stay collapsed when empty and spacing out correctly when populated, especially within the form footer.

For the form actions row, I'm using a flexible wrapped layout with consistent gaps, and styling the status message to grow and shrink within that row while handling long text and empty states gracefully. I'm confirming the expense list items don't need extra remove icons and that balances expose the right test attributes for person and amount. Writing the transfer computation logic...

Still writing settlement logic...

I'm adding an accessible live region for announcements, then double-checking that status roles aren't redundantly paired with aria-live, and reviewing all the UI copy strings to make sure none contain exclamation marks or casual phrases like "Oops" — confirming messages like name validation, expense descriptions, payer selection, and split selection all read clearly and consistently.

I'm also rewording the storage warning to use direct "your" phrasing, and checking the noscript message and sentence-case labels (like "Paid by", "Select all", "Settle up") before writing out the full implementation carefully to avoid syntax mistakes.

