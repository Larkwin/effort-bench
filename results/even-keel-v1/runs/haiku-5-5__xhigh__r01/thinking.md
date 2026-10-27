I'm planning the structure for a single HTML file covering people management with validation and uniqueness checks, plus an expense form requiring description, amount in CAD with proper decimal formatting, a payer selector, and split checkboxes tied to each person.

For splitting costs, I'm working out an integer-cents approach where leftover pennies go to the earliest-added people, then computing balances as paid minus share, displayed with data attributes for person and cents. For settling up, I'm using a greedy algorithm matching the largest debtor against the largest creditor, which guarantees at most n-1 transfers, formatting all amounts with Intl.NumberFormat for CAD currency and persisting everything to localStorage.

Now I'm nailing down visual details: since only the seven palette colors are allowed with no tints or opacity, I need hover and focus states built from existing colors alone—underline for primary buttons, border-color shifts for secondary ones, and a Harbour outline for focus rings. I'm also deciding that positive balances show in Kelp, negative ones in Harbour with a minus sign, and restricting all type sizes to just five fixed values: 14, 16, 20, 28, and 40px.

Spacing stays on 8px multiples (4px for tight pairs), with 6px radius on inputs/buttons/panels, 1px Rope borders, no shadows or gradients, and transitions capped at 150ms for hover/focus only. I'm keeping everything sentence case with no uppercase text, max content width of 720px, and a simple Fraunces wordmark "Even Keel" with a small Signal rule beside it and one short supporting line underneath—skipping icons entirely and writing copy in a plain, direct voice like "Enter an amount greater than $0."

I'll wrap the whole interface in the main element with data-testid="app", putting the header and wordmark inside it. For structure, I'm planning a People section with a name input, add-person button, uniqueness hint, error element, and a list of people with an empty-state message—deciding to skip person removal since it's not required and could complicate expense references, then moving on to the expenses section.

For expenses, I'm deciding to use a text input with decimal inputmode for the amount field so I can control validation myself rather than relying on type="number" quirks, labeling it "Amount (CAD)". I'll add a payer select labeled "Paid by" and a fieldset legend "Split between" wrapping checkboxes for each person, making sure the data-testid container includes one checkbox per person and shows an empty state when no people exist yet.

Now I'm planning the expense list markup: each item shows description, amount, payer, and split members, with a "Remove" button carrying an accessible name that includes the expense description so tests can target specific items while keeping the visible label simple.

For the empty-people case, I'm deciding whether to disable the expense form or just show a hint message like "Add people first." I lean toward disabling the controls when there are no people yet, reasoning that tests would naturally add people before attempting to log expenses, so this shouldn't interfere with validation checks on empty descriptions.

Moving to balances, I'm designing the list with each entry showing the person's name and amount, using Intl currency formatting so negative balances render with a minus sign automatically (like "-$12.00") while positive ones show as "is owed $X" versus negative as "owes $X," colored in Kelp or Harbour respectively.

For the settle-up section, I'm structuring transfer entries as "Ana pays Ben $12.00" with data attributes for from/to/cents, and handling empty states: one message when there's nothing to settle yet, and a different "everyone is even" message when all balances are zero but expenses exist.

For amount parsing, I'm deciding to be lenient—trimming whitespace, stripping an optional leading dollar sign, then validating against a pattern that allows a whole number with an optional one or two decimal places, while deciding whether to also permit comma thousand separators.

Refining the regex...

Still writing parser...

Still refining validation logic...

I should also guard against unreasonably large inputs by capping the dollar amount around a billion, showing an error if exceeded, to avoid overflow issues with parsing huge digit strings.

Now I'm writing the function that splits the total cents evenly among members, distributing the base amount to everyone and then handing out the remainder cents one by one to the first few people in order.

For storage, I'll keep a people array preserving the order names were added, and expenses as objects with id, description, cents, payer, split array, and createdAt. New expenses get added to the front so the newest shows first, with display order just following the array.

For balances, I'm computing each person's paid total from expenses where they're the payer, and their share by re-deriving the split order from the people array at compute time rather than trusting stored order, since names are compared as exact canonical strings.

For settling up, I'm implementing a greedy min-cash-flow algorithm: split people into creditors and debtors, sort each by amount (descending, tie-broken by trip order for determinism), then repeatedly match the largest debtor against the largest creditor, transferring the minimum of the two amounts and advancing whichever side hits zero. This guarantees the number of transfers never exceeds one less than the total count of nonzero balances.

For persistence, I'll use localStorage with a versioned key like 'even-keel-trip-v1' storing people and expenses, loading with a try/catch that validates the structure loosely. I also want to preserve what the user typed in a form even if it's rejected as invalid, so they don't lose their input.

On successful submission, I'll clear the description and amount fields, keep the payer selection, and reset the split checkboxes to all selected by default. When a new person is added, they should be checked by default in any existing split state too.

I'm thinking about re-render strategy to avoid destroying typed values or focus—rather than re-rendering the whole app on every keystroke, I'll only re-render on structural changes like adding a person, and explicitly refocus the name input afterward to keep the flow smooth.

I'm designing the markup as mostly static, with only dynamic sections (people/expense lists, payer dropdown, split checkboxes) rebuilt via targeted update functions that preserve state like checked boxes using a draft Set, so rebuilding doesn't wipe user selections.

For focus management, deleting an expense shouldn't orphan focus, so I'll redirect it to a tabindex="-1" heading after removal. For form errors, I'm considering whether to use one shared data-testid="form-error" element or separate ones per form, since tests likely expect a single visible error locator.

I think the safest approach is to only attach or render the testid element when a message is actually shown, removing it entirely when cleared so visibility checks behave correctly either way.

I'll keep the error element always present with role="alert" but hidden when empty, so toggling visibility triggers the announcement. I should also link errors to their inputs using aria-describedby and aria-invalid="true" for accessibility.

When a form is rejected, I'll move focus to the first invalid field to preserve typed values while guiding the user. For adding a person, I'll trim the name, reject empty input with a clear message, and check for case-insensitive duplicates, phrasing it as "${name} is already on the trip. Enter a different name." I'm deciding not to collapse internal whitespace since that could change what counts as a distinct name.

On success, I'll push the new person, clear the input, add them to the draft split as checked, default the payer to the first person if none is selected, and keep focus on the name field. For expense validation, the first check is whether any people exist at all, erroring with "Add at least one person before adding an expense." and focusing the person-name input.

For the remaining checks in order: empty description errors and focuses the description field, invalid amount focuses the amount field, missing payer errors with "Choose who paid." and focuses the payer select, and an empty split errors with "Choose at least one person to split between." and focuses the first checkbox. I'll trim the description before storing it, and I'm not requiring the payer to be included in the split since someone can pay without being part of it.

For rendering each expense list item, I'm laying out a top row with the description in bold and the amount right-aligned with tabular numbers, plus a meta line below showing who paid and who the expense is split between in a muted gray at smaller size.

I'm debating whether to also show the per-person share amounts since rounding means shares aren't always identical — it'd be more transparent to list each person's exact share rather than hiding the rounding difference, so I'm leaning toward including a compact line like "Ana $4.01 · Ben $4.00 · Cy $4.00" even though it adds a bit more text to the card.

For the remove button, I need to make sure the expense description gets inserted safely into the DOM rather than through raw string interpolation, since that could open an XSS risk — so I'm planning to build elements via safe DOM methods or an escaping helper instead of innerHTML concatenation.

For balances, I'm laying out each person's row with their name and status stacked on the left and the signed amount in tabular figures on the right, using color to distinguish owed vs owes, and relying on Intl's built-in minus sign for negative values. For settle-up transfers I'm structuring each line with data attributes for who pays whom and how much.

Now I'm thinking through empty states: when there are no people, every section should guide the user to add people first; once people exist but no expenses are logged, balances can still show everyone at zero as "is even" which is informative rather than confusing, while the expenses and settle-up lists get their own tailored empty messages.

I'm deciding to skip adding a total-spent summary line to keep the header focused, and instead sketching out the wordmark header structure—an h1 with a small decorative rule before the "Even Keel" text in Fraunces, paired with a one-line tagline underneath describing the app's purpose.

Now I'm planning section headings ("People", "Expenses", "Balances", "Settle up") in Fraunces 600 at 20px, with small Fog-colored hint text under them for things like name uniqueness rules. I'm also setting up the Google Fonts links for Fraunces and IBM Plex Sans with proper preconnects and fallback stacks, and settling on a type scale of just 14/16/20/28px without needing anything larger.

I'm now working out the overall layout: Sailcloth background, Harbour text, a centered 720px-wide main column with responsive padding that scales down on small screens, and panel sections using Paper backgrounds, Rope borders, 6px radius, and consistent 8px-multiple spacing with no shadows. For inputs and buttons, I'm defining consistent styling with Paper backgrounds, Rope/Signal borders, 44px minimum touch targets, 16px font size to avoid iOS zoom, and clear focus outlines using Harbour.

For the primary button hover state, since I can't use shadows or tinted colors, I'm settling on a simple underline text-decoration change to keep interactions subtle while staying within the limited palette.

Now I'm checking the secondary Remove button's border contrast—Rope on Paper barely clears 1.4:1, which falls well short of the 3:1 non-text contrast WCAG requires for identifying UI boundaries like inputs. This creates a conflict with the brand spec that mandates Rope specifically for borders and dividers, so I need to figure out how to resolve that tension without introducing an unauthorized color.

Settling on Rope borders throughout, then I'm working through the actual contrast math for Harbour text on the Sailcloth background to verify it clears WCAG AA, computing the relative luminance step by step.

That gives a contrast ratio of about 10.7, which is excellent. Now I'm checking Fog against Sailcloth, starting the luminance calculation for the red channel.

Finishing Fog's luminance gives 0.14027, so the contrast against Sailcloth comes out to 4.98 — just barely clears the 4.5 AA threshold for normal text, and against Paper it's a comfortable 5.52. Now I'm moving on to check Kelp.

For Kelp (#2F6B4F), the luminance works out to 0.11687, giving a contrast of 5.68 on Sailcloth and 6.29 on Paper — both solid passes. Next I'm starting the luminance calculation for the Signal button color (#C2462B) to check Paper text contrast against it.

For the secondary Remove button, I'm thinking Paper background with Harbour text and a Rope border, keeping it as a text-style button with underline on hover. Checkboxes can just use native styling with an accent color.

For checkbox-accent-color, I'm setting it to Harbour, sized at 20px with 16px labels, and wrapping each in a label with 44px min-height for touch targets. Instead of pill-shaped chips, I'll box each checkbox option in a 6px-radius bordered rectangle using the Rope color.

I'll use `:has(input:checked)` to swap the border to Harbour when checked, which has solid modern browser support. For selects I'm keeping the native element with custom border/radius but default appearance so the arrow stays native.

For lists I'm stripping default bullets and using top borders in Rope as dividers between items, with 16px vertical padding and no border on the first child. For the expense form layout, I'm stacking fields by default but switching description and amount to a 2fr/1fr grid on wider screens, with labels at 14px/500 weight in Harbour sitting above each input.

Now I'm working through the add-person form and smaller flex layouts — using flex-wrap so the input and button wrap gracefully at 360px without overflowing, checking the math on panel padding and borders to confirm nothing breaks, applying overflow-wrap to handle long names, and making sure box-sizing and full-width inputs prevent any horizontal scrolling.

I'm setting up currency formatting with Intl.NumberFormat for CAD, carefully guarding against the -0 edge case so balances never display as negative zero, and confirming negative amounts format correctly with a leading minus sign. Then I'm defining the app state with people and expenses arrays plus a draft object for the in-progress expense form, deciding the draft itself doesn't need to persist to localStorage since only the actual trip data matters.

Now I'm writing the load function that reads from localStorage, parses the JSON safely in a try/catch, and validates that people and expenses are arrays before sanitizing each expense entry -- checking description is a string, cents is a positive integer, payer exists in the people list, and split only contains valid names. For saving, I'm wrapping the localStorage.setItem call in a try/catch too, in case storage quota is exceeded or private browsing blocks it, and settling on an expense shape with id, description, cents, payer, and split array.

Computing shares...

Then I'm writing a greedy settle-up algorithm: splitting balances into debtors and creditors, sorting them by amount, and pairing largest debtor with largest creditor repeatedly until all balances are settled, producing a minimal list of transfers. I reason the number of transfers is bounded since each iteration fully zeroes out at least one person's balance.

For rendering, I'm planning the people list with an empty-state message when there are no people, a payer dropdown defaulting to the current draft or first person, and a split fieldset with checkboxes for each person (checked by default) plus a fallback message when there's nobody to choose from. I note the fieldset legend and helper text, and that the split checkboxes need to be rebuilt whenever people are added or removed.

Since re-rendering only happens when the data set changes (adding/deleting/loading), I decide to keep that full re-render approach rather than refreshing on every checkbox toggle, since the draft state (payer selection and split choices) is kept in sync via change/input handlers rather than triggering a complete re-render. This keeps rebuilding simple: when people change, the select and checkboxes regenerate from the draft, preserving whatever the user already selected.

For focus management after adding an expense, I'll move focus back to the description input so users can quickly log another entry, since the add button loses relevance once the list updates. I'm also considering a lightweight accessibility status message -- a visually-hidden, polite live region announcing something like "Expense added" -- to give screen reader users feedback without cluttering the visible UI.

For deleting an expense, I'll shift focus to the "Expenses" heading using tabindex -1 after removal, but I need to make sure that programmatic focus still shows a visible outline even when the browser's focus-visible heuristics might otherwise suppress it after a mouse interaction. To keep things predictable, I'll just apply a plain `:focus` outline style everywhere rather than relying on `:focus-visible`.

I'm deciding not to add a delete confirmation step since the spec and tests expect a straightforward removal on click, so I'll skip that extra complexity.

Now I'm starting the HTML document structure, setting up the page metadata, title, and font preconnect links.

Writing the body markup...

I'm making sure the form submits properly via Enter key or button click, avoiding native validation since I'm handling errors manually with aria-required instead of the required attribute. I'm also deciding where to place the error message within the form so the layout doesn't look odd when the input and button sit inline on desktop.

Now I'm setting up the Expenses section with its own panel, heading, and form containing description and amount fields similar to the earlier structure.

I'm reconsidering the placeholder values -- since no sample data should be pre-filled, I'll avoid placeholders like "0.00" or "Dinner" and use hint text instead, then continue defining the payer selector field.

For the split section, I'm wrapping the checkboxes in a fieldset with a testid and a hint explaining everyone's selected by default, followed by one checkbox per person and a note that leftover cents go to the first people listed, plus an error message placeholder for validation feedback.

Now I'm finishing the form with the submit button, then thinking through the rest of the panel structure—expenses list body, balances panel, and settle-up panel with their own headings. I'm also drafting the specific error copy, like prompting the user to enter a name when the person field is left blank.

Now I'm working through the remaining validation messages: duplicate person names, missing people before adding an expense, empty or malformed descriptions and amounts, zero or oversized amounts, missing payer selection, and empty split selections. I'm settling on concise, concrete phrasing like "Enter an amount greater than $0." and "Choose who paid," favoring static wording over dynamic formatting where possible.

I'm also designing a generic error-handling function that shows or hides an error box, sets its text, toggles its hidden state and test attributes, and manages aria-invalid and aria-describedby on the offending input so errors are cleared on each new validation pass and inputs stay accessible to screen readers.

Now I'm moving on to rendering the expenses list, starting with a check that shows an empty-state message when there are no expenses yet.

Adding expense item markup...

Actually, I could use Intl.ListFormat to handle the name joining automatically rather than writing custom logic for the "and" formatting.

For the layout, I'm placing the title and amount on one row, meta info below, and a Remove button at the bottom-left of each expense item. For the Remove button's accessible label, I need to make sure names with special characters get escaped properly when building the markup, so I should use safe string construction rather than raw interpolation.

Now I'm building the balances list, rendering each person's status as "is owed," "owes," or "is even" alongside their formatted dollar amount with appropriate positive/negative styling. I'm second-guessing whether showing "owes -$12.50" looks redundant since the word already implies a deficit, so I'm considering displaying the absolute value for the "owes" case instead of a negative sign.

Then I move to the transfer suggestions list, covering the empty states first: if there are no expenses, show a message to add one; if settled already, show that everyone's even. Otherwise, I'm rendering each payment item with testids and data attributes for who pays whom and how much.

Next I'm writing the people list renderer, handling the empty state and otherwise listing each person simply with their name escaped for safety.

For the add-person form, I'm validating the trimmed input, rejecting empty or duplicate names (case-insensitive), then pushing the new name into state, adding them to the current draft's split, and defaulting them as payer if none is set yet, before clearing the input and error.

Now moving to the expense submission handler, I'm starting to validate the description and amount fields, first checking that there's at least one person on the trip before allowing an expense to be logged.

Continuing the expense form logic, I'm validating the payer selection and split checkboxes, pushing the new expense to state, then resetting the form and syncing the draft's payer value whenever the select changes so it survives re-renders.

Checkboxes select correctly by value attribute, and if the payer somehow isn't in the people list I'll fall back to the first person. Now I'm moving on to writing the renderAll function.

renderAll just calls all the render functions in sequence — people, payer select, split, expenses, balances, settle. I'm checking that this doesn't wipe out the expense form's typed description/amount (it doesn't touch those) and that focus handling is safe when deleting an expense since I explicitly move focus to the heading afterward, though I need to double check what happens to focus when adding a new expense instead.

I'm setting up initial load: pulling saved state, initializing the draft split to all people and the default payer, then calling renderAll. I'm also adding a sr-only status element for announcements on add/remove, and wiring up the delete-expense click handler to filter out the removed expense, save, re-render, and shift focus to the expenses heading — adding a data-id attribute to each list item so the handler can identify which expense to remove. I'm also noting the heading needs tabindex=-1 so it's focusable, and considering whether the visible focus ring on an h2 after deletion looks acceptable.

For IDs, I'm swapping crypto.randomUUID for a simpler Date.now-plus-random string in case the environment isn't secure, and wrapping save operations in try/catch. Now I'm writing the amount-parsing function that trims whitespace, strips a leading dollar sign, rejects empty input, handles comma-formatted numbers, and validates the remaining string against a decimal pattern.

Still writing parser...

I'm checking edge cases like trailing decimals, comma-separated thousands, and empty strings, then adding bounds checks so amounts must be positive and under a billion dollars, with the final validated cents value returned.

Now I'm starting to write the CSS, defining custom properties for the color palette (harbour, fog, sail, paper, rope, signal, kelp) that will drive the overall visual theme.

Writing base styles...

Styling the wordmark and tagline...

The flex pseudo-element works fine as a flex item alongside the anonymous text node, and it's accessible since the rule content is empty. Now I'm styling the panel containers with padding, borders, and rounded corners, plus responsive padding adjustments and heading styles inside.

Writing form field styles...

I'm also resetting the default fieldset and legend styles to remove browser-added borders, padding, and floats so they fit cleanly into the layout.

Now I'm arranging the form row with flexbox so fields wrap into a responsive layout, making the error message span the full row width when it appears, and keeping the submit button sized to its content.

For the expense form specifically, I'm structuring it as a vertical stack with a paired row for description and amount, then separate rows for payer selection and the split fieldset, ending with the submit button and error message.

Then for the person form I'm planning a row layout combining the input field and button, with error text displayed below.

I'll give the person form column layout with wrapping and full-width errors, and now I'm styling the checkbox group with flexible wrapping and minimum tap-target sizing for accessibility.

Checking that the checkmark state has a distinct border color, the hidden native input stays large enough for touch, and text wraps properly — focus outlines on checkboxes look fine, and the select element just needs default padding.

Writing button styles...

Adding hover border transition to btn-text, and confirming the primary button's paper-on-signal contrast ratio passes at 4.99.

Now I'm styling the list component—removing default markers, adding top borders between items with 16px vertical padding, and stripping the border/padding from the first child. I'm thinking through how to space the list relative to the form above it, considering a divider between sections.

I'm structuring the expense item layout as a flexible row with the title and amount up top, then meta lines for who paid and how the split works, followed by action buttons at the bottom.

Building balance and transfer list items...

For empty and error states, I need to pick colors carefully: empty state text uses Fog with sufficient contrast, and error text should use Harbour rather than Signal since Signal is reserved strictly for primary buttons and the wordmark rule.

I'm overriding the hidden attribute with !important so it works reliably alongside my flex utility classes, and adding a standard sr-only utility class to visually hide the status region while keeping it accessible to screen readers.

Checking the layout math at a 360px viewport: with 16px padding on both main and panel, I land on a 296px inner width, which is enough for checks to wrap properly. I'm also setting overflow-wrap on the body so long names break cleanly instead of overflowing, and keeping input font-size at 16px to prevent iOS zoom-on-focus.

For the expense form row, I'm giving the description field more flex-grow than the amount field so it takes priority on wider screens, then verifying the flex-basis values still fit and wrap sensibly at the narrow 296px inner width.

Now I'm settling on the actual copy: sentence case for all labels and buttons ("Add person", "Add expense", "Remove", "Amount (CAD)", "Paid by", "Split between"), and writing helper text explaining that names are case-insensitive for uniqueness, amounts allow up to two decimals, everyone is selected by default for splits, and leftover cents from equal splitting need some explanation.

I'm drafting the tagline and empty-state messages too — one for no people, one for expenses with no people yet, one for expenses with people but none logged, and continuing to work out the balances empty state.

I'm also checking edge cases: the payer select needs a disabled placeholder option when there are no people yet, while checkboxes and expense items should only render from real data so tests counting elements by testid stay accurate.

I'm writing a small HTML-escaping helper and a getElementById shortcut, then tracing through how adding a person updates the draft state—setting it as the default payer and adding it to the split selection—before re-rendering the form.

For rendering, I'm setting the payer select's value directly after rebuilding its options, and structuring the split section as a fieldset containing a legend, a hint, and a checkbox container that gets swapped out, showing a fallback message when there are no people yet.

I'm wiring up a delegated change listener on the fieldset to add or remove people from the draft's split set based on checkbox state, plus a simpler listener on the payer select to update draft.payer. The split set gets reset to all current people after each expense is added, and I don't think it needs separate pruning logic elsewhere.

I'm also setting up localStorage persistence under a single key storing version, people, and expenses, with a load function that defensively parses JSON and filters out invalid or duplicate entries.

Writing load validation logic...

Now I'm moving into writing the actual HTML document structure, starting with the page head and title.

Writing CSS variables and base styles...

Adding focus outline styling...

Now I'm styling the brand wordmark with a small colored bar accent before the text and a tagline underneath.

Adding panel styles and responsive padding...

Refining the divider and list border styles...

Writing list divider styles...

Settling on spacing: 24px margin-top with 8px padding-top and a divider border for body sections, 16px vertical padding for list items, and matching 16px padding with muted color for empty states.

Now I'm building the form control styles — flex-based rows and stacked fields with consistent 16px/8px gaps, defining narrow and wide field variants so things like the expense description and amount inputs can wrap responsively with appropriate proportions.

Adding hint text styling...

Still writing styles...

Styling checkbox spacing and button typography...

Still writing styles...

Refining the error-flex rule...

Now I'm styling list sections with spacing, dividers, and an empty-state message, and thinking about how the person list items will share this same base styling.

For item headers, I'm weighing baseline versus center alignment for the title/amount row, settling on center alignment, then building out the title and metadata styles with word-wrapping to handle long text gracefully.

Continuing with amount styling...

Simpler to just set tabular-nums on body so all digits are affected uniformly, satisfying the requirement for money amounts. Now I'm doing a visual check on how "Ana owed" renders.

Inputs and checks handle overflow correctly with min-width 0 and wrapping for long names. Writing HTML structure...

Adjusting styles for spacing...

Checking that the form row's flex alignment keeps the button bottom aligned with the input bottom even though the field includes a label above it, which looks correct. I'm also considering a reasonable maxlength for the person name field, maybe around 40 characters.

I decide to skip maxlength attributes entirely to avoid surprises with test inputs, then move on to building the expense form section with description and amount fields, including a decimal input hint for the amount field.

I continue with a payer select dropdown and a fieldset for splitting the expense between participants, defaulting everyone to selected with a note about leftover cents going to earlier-added people, plus an error message area and submit button. I'm now checking spacing details, making sure the hint text margins work properly within the fieldset given the form's existing gap spacing.

I also reconsider whether wrapping the submit button in a div is necessary, since it stretches full-width in a column flexbox by default — I decide to use align-self: flex-start to keep it left-aligned instead. Satisfied with the expense form, I move on to sketching the balances section with a panel title.

I'm working out the spacing between the panel title, hint text, and body content, settling on hint margin-bottom of 16px and a border-top rule with small padding to visually separate the balances list from the heading.

Still adjusting spacing rules...

Adjusting margin rules...

Settling the panel copy: the hint text explaining it shows payments that zero out every balance, and that each payment flows from someone who owes to someone who is owed. Now moving on to write the JS logic.

Writing the setup...

Adding more helper functions...

Actually, using plain object keys risks collisions with names like "__proto__", so I switch to a Map instead, initializing each person's net balance to zero, then adding payments and subtracting their share for each expense to compute final balances.

For settlement, I split balances into debtors and creditors, sort each by amount, then greedily match the largest debtor with the largest creditor, transferring the minimum of their amounts until both lists are exhausted—verifying that transfer amounts always stay positive since depleted entries advance past.

Now I'm building error handling for the forms: functions to clear aria-invalid attributes and display or hide error messages with proper test IDs, and setting focus on the invalid field when a specific one is identified, like for the "choose at least one person" validation case.

Writing the status announcer and the expense form's submit handler...

Still writing validation logic...

I realize the person-name field lives in the person form, so clearing aria-invalid only in the expense form wouldn't reach it — I need showError to clear aria-invalid across both forms' fields before applying the new error state.

Each form clears its own error independently on submit, which is fine since they don't interfere. For deleting expenses, I'm setting up a delegated click listener on the expenses body that finds the delete button and extracts the expense id from its closest row...

Writing delete handler...

I'll move focus to the expenses title heading after removal and announce which expense was removed, with the heading given tabindex -1 so it's focusable. For initialization, I'm loading saved state, defaulting the split to all people and the payer to the first person, then rendering everything. For the payer select renderer, I decided not to disable it even when there are no people yet, just showing a placeholder option, so it stays focusable for testing purposes.

For the split checkboxes, I'm generating a checkbox list for each person showing which ones are currently selected, with a hint message shown instead when there are no people yet.

Moving to people rendering, I'm building a list of names with an empty-state message when none exist. Then for expenses, I'm handling the empty state differently depending on whether people exist yet, and starting to build the reversed expense list with per-person share breakdowns for each entry.

Continuing the expense item markup...

I'm double-checking the accessible labeling and spacing rules, then moving on to building the balances table rendering function.

I'm checking that the zero-balance edge case renders correctly as "is even" and that stringifying a possible -0 value still outputs "0" without issue.

Now I'm writing the renderSettle function, which shows an empty message when there are no expenses, computes transfers from the balances, shows an "everyone is even" message if no transfers are needed, and otherwise renders a list of payer-to-payee transfer items with formatted amounts.

Checking renderAll wiring up all the render functions together, and verifying that newly added people and expenses propagate correctly through split checkboxes, newest-first ordering, and currency formatting with Intl.NumberFormat for CAD.

Now I'm confirming accessibility details — landmark roles, labeled inputs, the error alert region, and test IDs on balance and error elements — and double-checking that the form-error attribute only appears when a message is actually set.

I'm also walking through edge-case validations: rejecting invalid expense amounts like "12.345", "0", "abc", "-5", trimming whitespace from input, and verifying rounding behavior when splitting amounts like $10.00 or $0.01 across multiple people, confirming the first person in trip order absorbs any extra cents.

Beyond that I'm checking name handling (trimming and case-insensitive duplicate detection), inline error messaging and aria-invalid attributes when a person name is rejected, CSS fallback behavior for browsers lacking `:has()` support, and spacing/sizing consistency across the wordmark, gaps, and input padding to keep things aligned to the 4px/8px grid.

Now checking font sizes are consistent: 28 for the wordmark, 20 for panel titles, 16 for body/inputs/buttons/list titles/amounts/empty states, and 14 for labels/hints/meta/error — verifying `.check` and default heading sizes align with this scale.

Confirming select and button elements inherit font properties then override to size 16, and inputs reset to the body's 16px too. For weights, I'm standardizing on 400/500 for IBM Plex Sans and 600 for Fraunces, overriding the default bold headings to 600 and setting buttons/labels/legends to 500, while loading only the needed weights from Google Fonts.

I'm double-checking there are no stray colors, shadows, gradients, or unnecessary transitions beyond the intended hover states on the secondary button, and confirming fieldsets get min-width reset to avoid overflow issues. I'm also verifying the item layout structure pairs title and meta correctly within list items, and reviewing the list item padding for consistency.

Now I'm checking responsive behavior at narrow widths, confirming the person form's row layout keeps inputs and buttons aligned while error messages drop to their own full-width line. I'm also finalizing heading IDs for each section and setting up a screen-reader-only status element for announcements.

I'm wrapping localStorage access in try/catch so the app doesn't break in privacy modes that throw on access, and double-checking the save function serializes people and expenses safely. I'm also refining duplicate-name and empty-name validation messages so they read naturally regardless of capitalization.

Now I'm walking through the accessibility behavior for focus management—only the expenses and balances headings get tabindex -1 for focus after deletions, while inputs regain focus appropriately after adding a person or expense. Finally I'm mentally tracing through the full user flow: empty states for people, expenses, balances, and settle-up sections, then adding three people and a shared dinner expense to verify the split amounts and resulting balances compute correctly.

Checking label display behavior within flex field containers looks fine, and the checkbox label's flex setup holds up too. I'm verifying the form-row field basis, the amount input's text type against test expectations, and confirming the payer select's data-testid and options are correctly structured.

I'm also reasoning through how the split checkboxes get accessible names via their wrapped labels, confirming the Remove button's aria-label still matches substring-based role queries, and checking small details like autocomplete, the html lang attribute for Intl formatting, and layout behavior on narrow viewports.

For the amount/title row, I'm making sure the amount stays non-wrapping and doesn't shrink below its content width while the title gets `flex:1 1 auto` with `min-width:0` so it truncates properly, applying the same min-width fix to the balances row. Now I'm finalizing the code and double-checking there's no leftover console output.

I'm also running through all the copy text to confirm it avoids icons, exclamation marks, and emoji, and that each hint line reads correctly—tagline, people uniqueness note, amount decimal format, split selection behavior with leftover cents going to the first people added, balances sign convention, and the settle-up explanation of payments flowing from debtors to creditors.

I'm confirming the empty states, error states, focus outlines, and balance color rules match the spec—negative balances stay in the neutral Harbour color with just a minus sign, never red. Now writing the full HTML document...

Writing the HTML head and font links...

Defining CSS custom properties for the color palette and base body styles...

Still writing styles...

Writing more panel styles...

Writing flexbox field styles...

Still writing form styles...

Writing button styles...

Styling the error message block now, then moving on to list styles...

Adding more item styles...

Adding more flex rules...

Checking the layout at 360px width: the person form-row's field with a 200px basis plus the button and gap exceeds the available space, so it'll wrap to a new line as expected.

On desktop, the field should grow to fill remaining space while the button stays right after it. For the expense row, I'm verifying the description and amount widths both wrap correctly at mobile sizes and split proportionally at the wider desktop container width.

Now I'm ready to write the final JS implementation.

Writing the storage setup...

Adding helper functions for joining names, generating unique IDs, and parsing amount strings with validation for formats like currency symbols and negative values.

Testing edge cases: a bare "$" trims to empty and correctly triggers the "must be greater than $0" message, and comma-formatted numbers like "1,234.5" parse correctly through the thousands regex into dollars and cents. I'm also checking malformed cases like "12,34" to make sure they get rejected properly.

Now I'm writing the showError function, which clears aria-invalid attributes across the form, then either displays an error message with a test id and focuses the invalid field, or hides the error box entirely when there's no message. I'm noting that an expense error left visible after a successful person submission is acceptable behavior, and confirming that each submit handler clears its own error state at the start.

I add a small announce helper that updates a status region, then build the person form's submit handler: it trims the name input, clears prior errors, rejects empty names or names already in the people list case-insensitively, and otherwise adds the new person to state, includes them in the split, assigns them as payer if none exists yet, and resets the input field.

I finish that handler by saving and re-rendering, focusing back on the input, and announcing that the person was added. Then I wire up the split-options checkbox listener to add or remove names from the draft split set based on checked state, and I'm about to handle the payer change event next.

The payer select listener just updates draft.payer directly from the chosen value, and the delete and init handlers follow the design I'd worked out. I'm double-checking edge cases: focus stays correctly placed after failed submits, the payer select preserves draft.payer across re-renders through renderPayer, and the initial draft.payer defaults to the first person. Now I'm verifying that renderSplit correctly handles a stale draft.split after loading.

After confirming the split set rebuilds correctly from the people list on load, I'm checking accessibility details—the split fieldset's legend, the hint message shown when no people exist, the sr-only status paragraph's placement in the markup, and that error elements with role="alert" properly announce once unhidden.

I'm also running through each required data-testid against the spec: add-person, person, expense-desc, expense-amount, payer, split container, add-expense, expense items, delete-expense, balance items with data-person and data-cents, transfer items, form-error, and the main app container—confirming each matches what's expected. I'm also double-checking the shares line formatting, like "Shares: Ana $3.34, Ben $3.33, Cy $3.33".

Now I'm assembling the full HTML, including a color-scheme meta tag to keep form controls light regardless of system theme, and starting to write out the body markup with the app header, people panel, and form structure.

Building the expenses and balances panels...

I'm adding the "Settle up" section with the same heading-hint-body pattern, confirming that each settlement line reads as one person paying another. Then I'm double-checking CSS specificity so `.hint + .body` correctly overrides the default `.body` margin, and verifying that both the people form and expense form (using classes "form-row" and "stack") properly trigger the 24px margin-top spacing before their result bodies.

Writing the shares-rendering function...

I'm sketching the balances calculation that nets each person's payments against their owed shares, then writing the load function that restores state from localStorage with validation and deduplication.

That filter logic checks out fine. I'm also confirming localStorage read handles null gracefully, and that negative currency formatting for en-CA CAD displays correctly as "-$1.00".

Going through final checks: no pre-filled sample data, no external scripts, tabular-nums inheriting properly on the body, and the `:has()` CSS selector degrading gracefully if unsupported. I'm also verifying focus outlines are consistent across inputs, labels, and selects, with the Harbour-colored 2px outline and offset applied correctly.

Confirming panel styling, wordmark margins, and absence of unwanted text-transform, then I'm ready to write out the complete HTML document starting from the doctype, with no markdown fences.

