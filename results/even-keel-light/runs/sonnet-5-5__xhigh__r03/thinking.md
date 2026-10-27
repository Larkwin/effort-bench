I'm planning the HTML structure carefully, thinking through validation rules for people (trimmed, unique, non-empty names with inline errors) and expenses (required description, positive amounts with up to two decimals, a single payer, and at least one split participant), making sure error messages only appear in the DOM when relevant.

For the amount field, I'm leaning toward a text input with decimal mode rather than a native number input, since Playwright would throw on invalid number inputs. I'm working out a parsing strategy that trims whitespace, strips a leading dollar sign, optionally allows comma-grouped thousands, and validates against a strict decimal pattern, with distinct error messages for negative values versus too many decimal places.

I want to compute cents as integers instead of floats to avoid rounding issues, capping the max amount around $10 billion with a "too large" error, and treating zero as invalid with a "greater than 0" message. On a successful submission I'll clear the description and amount while keeping the payer selection, and I'm considering resetting the split back to everyone selected by default.

When people are added or removed, I need the payer dropdown and split checkboxes to re-render while preserving existing check states and payer selection, and newly added people should default to checked. The description and amount fields should stay static so typed values aren't wiped out during re-renders.

For defaulting the payer, I'm leaning toward defaulting to the first person in the list rather than a blank placeholder, since tests that forget to explicitly select a payer would likely expect some sensible default rather than a rejection. Option values will just be the person's name.

Since names could contain special characters like quotes or script tags, I need to build the DOM with createElement and textContent rather than innerHTML to avoid injection issues, and use setAttribute for any data attributes like person identifiers. I'll skip adding a feature to remove people entirely to keep scope minimal, since the spec doesn't require it and it introduces unnecessary complexity around expenses referencing removed people.

I'll also consider a "reset trip" option for reusability but decide to skip it to stay focused, since confirm dialogs could complicate testing anyway. On person removal, I'll land on allowing it only when a person isn't tied to any expense, reasoning that test IDs make this low-risk, though I keep second-guessing whether a test might count buttons unexpectedly.

Now I'm realizing there's a real danger: if a test checks person names with an exact text match like `toHaveText(['Ana','Ben'])`, adding a "Remove" button inside that same element would break the match since the full text would include both the name and button label. So I need to keep the person element's text content strictly the name, meaning the remove control should live outside that element.

I'm also considering an avatar chip with an initial letter next to the name, but want to avoid it polluting the text content. I could place the chip as a separate `aria-hidden` sibling element outside the person test-id node, or use a CSS pseudo-element whose content isn't captured by textContent, keeping the testable element clean while still showing a nice initial badge.

For expenses and balances, I'm planning to keep the same pattern — a `data-testid` wrapping all relevant text (description, amount, payer, splits, remove button for expenses; name and cents for balances) so tests can use simple text-contains checks. I need to be careful with zero balances displaying as "0" rather than "-0", and make sure every person shows a balance even if settled. Now I'm moving on to the transfer settlement algorithm, planning a greedy approach that sorts people by balance to minimize the number of payments.

For transfers, I'm settling on a greedy match of the largest debtor against the largest creditor each round, which guarantees at most n-1 transfers since each step zeros out at least one party. I'll use deterministic tie-breaking by amount then by original order, and format each transfer with `data-testid="transfer"` attributes plus readable text like "Ben pays Ana $12.50". I also want to handle the edge cases: showing a friendly "everyone's even" message when balances are zero, and an empty state when there are no expenses at all, while formatting currency with `Intl.NumberFormat` and choosing calm, neutral wording like "owes" and "is owed" instead of anything alarming.

Now I'm working through the color palette, checking contrast ratios for a brick-red "Signal" accent color against white and off-white backgrounds to make sure it meets accessibility standards for text, since the marginal contrast on paper-toned backgrounds means I may need to reserve that color for white backgrounds only.

For the overall concept, I'm landing on "Even Keel" — a nautical but understated design using a waterline motif, where each person's balance is shown as a horizontal bar extending left or right from a centered midline to represent what they owe or are owed.

Since owing is meant to feel normal rather than alarming, I want to avoid treating Signal as an "error" color tied to owing; instead Harbour could dominate as the primary color for headers, text, and buttons, while Signal gets reserved for key accents like the logo mark, transfer arrows, or focus states, with errors needing their own distinct treatment separate from the owing/owed bars.

Signal stays reserved for brand moments—step indicators, the pay arrow, focus states, and errors—while balance bars use Harbour for "owed" and Signal for "owes" since warm naturally reads as "to pay." I want the settle-up section to feel reassuring rather than punitive, with labels like "owes," "is owed," and "is even," plus a calm subheading like "A few transfers and everyone's even."

For typography I'm weighing a sturdy, honest grotesque for UI text against a serif option like Newsreader or Source Serif 4 for headings, and making sure numbers use tabular figures so balances align cleanly.

Actually I'll pair "Newsreader" for headings and emphasized numbers with "Public Sans" for body text — sturdy and government-grade honest, with good tabular number support. I'm settling on the Google Fonts import with the right weight and optical size ranges, plus a preconnect link and Georgia as an offline fallback.

Now I'm thinking through the layout: a navy header band with the "Even Keel" wordmark and a small keel-line mark, plus a calm, specific tagline like "Log who paid. See who owes whom." The main app area should flow through People, Add expense, Expenses list, Balances, and Settle up, likely split into two columns on desktop.

I'm planning a CSS grid with named areas — on mobile, the order flows top to bottom as people, form, summary, log, so the payoff (balances and settle up) isn't buried at the very end; on desktop, the summary column sits to the side spanning rows, possibly sticky, while people, the expense form, and the log stack in the main column.

To avoid awkward gaps when the sticky summary grows taller than the stacked rows, I'm setting the row sizing so the last row absorbs any extra height, with items aligned to the top rather than stretched. Then I'm setting up the two-column desktop layout with flexible, minimum-respecting column widths.

For the sections, I want a quieter, tool-like feel rather than card-heavy marketing design—warm paper background, thin-bordered white panels, and clear headings like "People," "Add an expense," "Balances," "Settle up," and "Expenses," with Balances and Settle up grouped together as subsections within one summary panel. I'm also working out the balances display as a horizontal bar centered on an axis, scaled relative to the largest balance, with name and status stacked above the bar on narrow screens for consistent readability.

Now I'm defining each balance row's markup, pairing a name and signed amount text with a visual bar whose fill width reflects the magnitude, and making sure the text output ("Ana is owed $40.00" vs "Ben owes $40.00") stays human-readable while the signed cents value lives in a data attribute for testing purposes. I'm also starting to sketch the markup for individual settle-up transfer items in the list.

I need to decide whether to show per-person shares in the expense list, always listing names explicitly (like "Split between Ana, Ben and Cal") rather than collapsing to "Everyone" since tests likely check for individual names. For uneven splits I'm weighing whether to add something like "$33.33–$33.34 each" versus keeping it simple, since extra text shouldn't break tests checking for the total amount.

I'm also considering adding a delete confirmation via an undo toast — storing the last removed expense, showing a status message with an Undo button that gets replaced on subsequent actions, and making sure focus moves somewhere sensible after deletion rather than getting lost.

For re-rendering, I'm planning a single function that rebuilds the people list, payer select, split checkboxes, expense list, balances, and transfers while leaving form inputs untouched, and I'm figuring out how to preserve which split checkboxes were checked by reading the DOM state before re-rendering.

I want to keep focus in the person-name input after adding someone so users can quickly add several in a row, and I'm deciding to use forms with novalidate plus the required attribute so native validation doesn't block submission but screen readers still get the semantic cue.

For error display, I'll use an alert region per form that's always in the DOM but gets content injected on validation failure, paired with aria-invalid and aria-describedby on the offending field, and I'll move focus to that field (or the first checkbox for the split-selection error) so assistive tech announces it. I'll clear these errors on successful submission or when the user corrects the input.

A tricky edge case: if both the person form and expense form errors are visible simultaneously, a test querying by testid in strict mode would hit two matches, so I need to clear the other form's error whenever one form shows a new error or succeeds, keeping only one error visible at a time.

For the expense form specifically, if multiple fields are invalid at once, I should surface just a single error message tied to the first invalid field in validation order (description, amount, payer, split) rather than stacking multiple errors.

I'm also drafting the specific wording for each error state — empty name, duplicate name (referencing the actual existing name and clarifying case-insensitivity) — aiming for calm, clear phrasing.

Now I'm working through the rest: missing description, invalid/empty/negative/too-precise amounts, no payer, no split selection, and the case where no people exist yet. For that last case, rather than disabling the add-expense button (which would hang a Playwright test waiting for it to become enabled), I'll leave the form active and instead show an error on submit telling the user to add people first.

For the payer dropdown with zero people, I'll give it a single disabled placeholder option, and the split section will just note that people will appear there once added. Once people do exist, the first person becomes the default payer rather than using a "choose..." placeholder, and the select will naturally retain whatever was last chosen after logging an expense.

I'm also sketching empty-state copy: for the People panel when there's no one yet, and for the expenses list when nothing's been logged, plus starting to think through what the Balances view should say when there are no people at all.

For balances, once people are added but no expenses exist, I'll show everyone at $0.00 with a note rather than hiding them, since tests likely expect zero balances once people exist. Settle Up gets its own messages for "nothing to settle" and "everyone's even." For persistence, I'm using a versioned localStorage key storing people and expenses with validation/sanitization on load, falling back to in-memory operation if storage throws. For ordering, I'll store expenses chronologically but display newest first by reversing the array rather than relying on timestamps, since same-millisecond adds could collide.

For share computation, I'm splitting cents evenly among participants sorted by people order, distributing any remainder cents to the first few people, then computing each person's balance as what they paid minus what they owe. On load I sanitize corrupted data by dropping expenses referencing people who no longer exist. For the settle-up algorithm, I'm matching the largest creditor against the largest debtor repeatedly, transferring the minimum of their amounts each time and advancing whichever side hits zero, which works in a simple two-pointer pass since balances always sum to zero with integer cents.

Now I'm thinking through name handling: trim whitespace but preserve internal spacing as typed, and treat names as duplicates if they match case-insensitively after Unicode normalization. For length limits, I'll avoid an HTML maxlength attribute that could silently truncate input and instead just rely on flexible text wrapping in the layout so long names don't break anything visually.

For the checkbox grid, I want pill-style toggles that still use real native checkboxes for accessibility, styled with accent color and highlighted via `:has(input:checked)` and focus-visible outlines, while making sure the clickable hit target stays on the actual input so automated tools like Playwright can interact with it reliably even if it's visually wrapped inside a styled label.

I'll also keep the native select element but restyle its appearance with a custom chevron, and consider adding small "Select all"/"Clear all" buttons near the split section for convenience, positioning them outside the testid container so they don't interfere with tests counting inputs.

I'm also thinking through a live share preview below the amount field—showing something honest like "$33.34 for Ana, $33.33 each for the others" to clarify how rounding remainders are distributed, computed from the base amount plus remainder cents assigned to the first person(s).

But I'm now worried this preview text could collide with `getByText` queries elsewhere in tests, since a substring like "$30.00" inside the preview sentence might match multiple elements if an expense in the list also shows that exact amount, causing strict-mode ambiguity.

Since tests likely scope lookups to test IDs anyway, I'll keep both the preview and the compact "each" annotation on expense items, clearing the preview after submission to reduce duplicate matches. Now I'm moving on to defining the color palette, starting with a harbour blue tone.

Picking out the ink, paper, and panel colors, checking contrast ratios against white and paper backgrounds to make sure text stays readable. I'm also working through the border color math to ensure inputs meet the 3:1 non-text contrast requirement against both background variants.

Then I move to the signal red accent and focus ring design, deciding on a 3px Signal-colored outline with offset for accessible focus states across light backgrounds. For the header, I land on a nice idea: a navy "harbour" header with a thin signal-red stripe at the bottom, echoing a boat's boot-top waterline stripe.

For the logo, I sketch a simple mark reading as a plumb bob over a line — a cream horizontal waterline with a signal-colored triangle keel below, nodding to "even keel." The wordmark uses Newsreader in cream with a plain, specific subtitle like "Log who paid. See who owes whom," keeping the tone direct rather than clever.

I'm considering adding a quick stats strip at the top of the Expenses panel showing trip total, expense count, and people count, but worried the dollar total might duplicate individual expense amounts and cause test ambiguity — so I'll scope it to a "Total $412.50" label only shown when expenses exist, keeping to test-id-based assertions. For panel styling, I settle on a white background, thin #DAD5C9 border, modest 10px radius, and generous padding, using Newsreader 600 at 24px for section headings while avoiding excessive style variation.

Now I'm designing primary buttons with Harbour background, white text, 8px radius, and a 44px minimum height, then thinking through where Signal accents belong versus Harbour fills across the two primary actions. I consider making the Settle Up panel a special navy-filled section with cream text for contrast, but checking the contrast math shows Signal text on navy would be too weak, so I decide to reserve Signal for accents only and use cream for the actual names and amounts.

For the transfer indicator, I settle on a Signal-colored circular chip with a white arrow inside since that combination passes contrast comfortably, treating the arrow as decorative since the accompanying text already conveys meaning. Then I work out the overall layout: a grouped summary wrapper holding the Balances panel (white) and Settle Up panel (navy) as a single grid item, with mobile ordering as people, form, summary, then log.

When all expenses are settled, the Settle panel shows a cream "You're all even" message instead. For the Balances panel, I'm designing a small legend above the bars clarifying which side represents "owes" versus "is owed," with each bar row showing the person's name, their balance amount, and a horizontal bar with a center dividing line.

For the bar fill logic, I'm calculating fill width as a percentage of the max absolute balance so it never exceeds half the track, coloring owed amounts with Harbour on the right side and owed debts with Signal on the left, and showing plain "is even" text when a balance is zero.

To give the bars some life, I'm adding a scaleX growth animation anchored at the center line, respecting prefers-reduced-motion, kept short at around 350ms so it stays subtle even though every re-render replays it. I'll skip separate entry animations for new expenses to keep things simple, and move on to thinking about the people list, likely a row-based layout with initials as chips next to names.

For the people list I'm going with wrapping pill-shaped items, each containing an initial circle and the person's name plus a remove button with a proper aria-label when they're unused; the test id for identifying each person goes on the name span inside the pill, and I'm assigning each person a color by cycling through a small palette based on their index.

I'm keeping chip colors calm with a single navy tint rather than a rainbow of hues, and I want to add a small explanatory hint under the people list when there are two or more people, clarifying that leftover cents from uneven splits go to whoever was added first, since list order determines trip order and that rule deserves clear microcopy.

After removing a person, I'll move focus to the name input in the people form for accessibility. For the expense form, I'm laying out description full-width, then amount (prefixed with "$") and the paid-by selector as two columns on wider screens, while working out whether that two-column layout still fits comfortably at a 360px width given the padding constraints.

I'm also planning the split-between section as a fieldset with a responsive checkbox grid, a preview line, error messaging, and a full-width submit button on mobile, with careful attention to accessible labeling like "Description," "Amount (CAD)," "Paid by," and "Person's name" for each field.

Checking contrast ratios for placeholder text to ensure it meets AA standards, settling on a darker gray tone, and laying out the add-person form as a flexible row with the input growing to fill space and the button staying fixed at narrow widths.

Now I'm designing the inline error display with a tinted background, left border accent, and icon, verifying the text color against the tint still passes contrast requirements.

For invalid input, I'll use a thicker colored border. For the footer, I'm settling on an honest, reassuring line about local-only storage: "Everything is saved in this browser. Nothing is sent anywhere."

I'll note amounts are in Canadian dollars, set the page language to en-CA, and pick a title like "Even Keel — trip expense splitter." For headings, I'll keep things simple—h1 for the wordmark, h2 for panels like Settle Up and Balances—and avoid cluttering with h3s by using plain paragraphs and strong text for expense descriptions instead.

A skip-to-main-content link is worth adding cheaply for accessibility, with the main element getting a focusable id. For currency, I'm setting up an Intl.NumberFormat helper for CAD that converts stored cents into properly formatted dollar strings, confirming en-CA formatting works as expected. Now I'm defining the localStorage key and starting to sanitize the data model being loaded from storage.

Adding load/save logic...

For sanitizing people and expenses, I need to dedupe names case-insensitively, validate expense amounts as positive integers, ensure payers and split members exist in the people list, and assign each expense an id -- using crypto.randomUUID since file:// URLs should count as a secure context in Chrome.

Now I'm writing a small DOM helper to create elements with attributes and children...

I'm also planning the render function for the people list, including toggling empty-state messages with the hidden attribute when the list has no items.

Now I'm structuring each expense list item, with a body section showing the description, who paid, and the split breakdown, plus a side section with the amount and quick-action buttons.

I'm checking the delete button's accessible name "Remove expense: Dinner" against its visible text "Remove" — since the visible text matches the start of the accessible name, this satisfies the label-in-name accessibility requirement. For the split text, I'm deciding a plain sentence like "Split between Ana, Ben and Cal" is simpler and more mobile-friendly than rendering individual chips, and I'm thinking through how to phrase the edge case where only one person is involved.

I'll skip showing the date to keep things simple, and I'm designing an undo notification area using a live region so screen readers announce removals like "Removed 'Dinner'. [Undo]" — it should persist until another action occurs or possibly auto-hide after a short delay.

Actually, I'm worried this creates a test conflict: if a test checks that "Dinner" is no longer visible after deletion, the undo message itself containing "Dinner" could cause a false positive on text-matching assertions.

To stay safe, I'll make the status message generic — "Expense removed. Undo" — instead of naming the item. The aria-labels on delete buttons can still reference the description since those won't collide with plain text queries.

I'm also considering whether adding a person should announce something to screen readers, but a live region saying "Ana added." risks colliding with substring text queries like `getByText('Ana')` in strict mode, so I need to avoid that pattern too.

Given names show up in too many places anyway, I'll avoid tying the live announcement to the person's name entirely and just use a generic message like "Person added" to sidestep any ambiguity.

I'll keep focus on the cleared description input after adding an expense, with the status update handled through the hidden live region separately from the visible undo notice. Now I'm sketching out the validation flow for the expense form submission handler.

I need to decide the error priority order: if no people exist yet, I should show a message directing them to add trip members first before logging what someone paid, with focus moving to the person-name field, otherwise check description, amount, and payer selection against valid state values.

For the amount parsing, I'm designing a function that cleans the raw input string (stripping dollar signs, whitespace, handling comma-separated thousands), then distinguishes empty, negative, and malformed inputs with specific error codes, and finally uses a regex to split the number into integer and decimal parts to convert into cents safely.

Computing cents by combining whole and decimal parts, treating zero cents as invalid ('nonpositive'), and flagging values as 'toolarge' if the whole part exceeds 11 digits or isn't a safe integer.

I'm also setting a cap around $1 billion for the 'toolarge' threshold, handling negative inputs with a regex that catches patterns like "-5" and treats them as nonpositive errors, and routing non-numeric or malformed strings like "abc" or "1e3" to the invalid-format error message. I'll use a text input with numeric inputmode so form-filling tests work fine even though it's not a native number field.

After a successful submission, I'm clearing the description and amount fields, resetting the split to include everyone, clearing the preview, and refocusing the description input, with autocomplete disabled on both fields. The preview recalculates whenever the amount, split checkboxes, or people list change, showing text only when the amount is valid and at least one person is selected.

For balances, I'm writing a function that tallies each person's net position by adding what they paid and subtracting their share of every expense, using a separate helper to compute per-person shares based on the split selection and the group's indexed ordering.

I'm also working out edge cases: expenses store the split in trip order, people used in a split can't be removed, transfer elements carry payer/creditor data attributes, balance rows track signed cents per person, and a fully settled trip with expenses should still show a "settled" message. Now I'm starting to write the CSS with custom properties for the color palette and panel styling.

I'm calculating the luminance of that tagline color to verify it meets contrast requirements against the harbour background.

For layout, I'm planning the header with the brand and tagline stacked on the left, and thinking about whether to add a "saved on this device" indicator—probably better suited for the footer. I'm sketching the main container with a centered max-width layout.

I'm setting up a responsive grid that stacks sections vertically on mobile and switches to a two-column layout on larger screens, with people/form/log on one side and a sticky summary panel on the other. Now I'm double-checking that the sticky positioning will actually work correctly within a grid cell that spans multiple rows.

I'm weighing whether sticky positioning causes problems if the summary panel grows taller than the viewport—long lists of people could push its content below the fold with no easy way to scroll back up to it. I'm considering whether to just drop the sticky behavior entirely versus adding a max-height with internal scrolling, but that tradeoff feels awkward for usability either way.

That hidden content would only surface near the end of a long enough container, which is generally fine. I could gate the sticky behavior behind `@media (min-height: 700px)` so it only applies on tall viewports.

Now I'm styling the panels, giving them a distinct background, border, and radius, with a heading and subtitle treatment, but I want to avoid a generic "default card" look—maybe add a distinct left accent.

Okay, I'll settle on the waterline/center balance bars plus hull-stripe header and navy settle panel as the signature devices, with big serif numerals for money and otherwise restrained white panels with thin borders and no shadows. Now I'm writing the form control styles for labels and inputs...

Writing focus and select styles...

Still writing button styles...

For the destructive action, I want a warm but calm color using the deep signal tone, maybe with a subtle border to give it a touch more weight without being alarming.

Now I'm styling the checkbox rows with a responsive grid layout, then defining the check item style with flexbox alignment, padding, border, and rounded corners for a clean card-like look.

Still writing styles...

I considered focus-within versus :has(:focus-visible) to avoid double rings, but decided the simplest approach is just styling input:focus-visible directly, which should be good enough.

Now I'm checking that each checkbox label properly associates with its input so screen readers and test queries like getByLabel can find them by name, and planning the split group as a fieldset with a legend "Split between" wrapping a div with the testid for the checkboxes.

For the select-all/clear controls, I'm deciding where to place them so they don't crowd the legend -- maybe as small text-link buttons placed below the checkbox grid alongside the selection preview text.

Now I'm styling the person pills in the list: flex-wrapped rounded pill badges with soft harbour background and a circular initials avatar.

I'm sizing the remove button at 28-32px to meet target-size accessibility guidelines while keeping a visible focus ring, balancing touch area against pill height.

I'm also reconsidering whether the pill's leading circle should show the person's initial or their order number, since the leftover-cents distribution rule depends on ordering, so surfacing that number could make the logic clearer to the user.

Now I'm sketching the Balances panel markup with a heading, subtitle explaining it shows paid minus share, a visually-hidden axis row labeling "owes" and "is owed" with arrows, and a list plus an empty-state message. I'm styling the axis as a flex row with small uppercase, letter-spaced, muted text.

Then I'm working out the balance row layout -- flex with wrapping, bold overflow-safe names, and status text using tabular numbers where the owed amount is emphasized. I'm deciding how to phrase zero balances, leaning toward showing "$0.00" explicitly rather than just "is even" so the amount is always visible.

Adding visual bar markup...

Still writing bar styles...

Styling the transfer row layout...

I'm checking whether the amount column still fits comfortably at narrow widths, since the text and numeric columns are competing for limited space and may need to wrap or stack instead.

I'm okay with the name wrapping across a couple lines if needed, and I'm structuring the sentence into styled spans—bold names with a lighter "pays" in between—so it reads naturally regardless of wrapping.

For empty/calm states, I want reassuring micro-copy: specific transfer counts like "2 transfers and everyone's even," a nudge to log an expense when there's nothing yet, and a friendly "You're all even" message when balances are settled. I'm also drafting a short subtitle for the balances panel explaining it shows what each person paid minus their share.

Still writing component styles...

For empty states I'm designing a dashed-border box with soft background and muted text for calm visual treatment, plus starting to draft the actual copy for each empty scenario like the people list.

I'm writing the empty-state and hint copy for each section—people, expense form, expenses list, balances, and the footer disclaimer about local storage and Canadian dollars.

For the error display, I'm setting up a message slot that gets populated with a styled paragraph containing an icon and the error text, and I'm checking whether the test expects the testid element to directly contain the text.

I'm deciding to use a CSS pseudo-element badge for the icon since that won't interfere with text content matching, and since role="alert" is already present, screen readers should announce content changes when they occur. For accessibility, I'm linking invalid inputs to their error messages via aria-describedby and setting aria-invalid, clearing both when errors are resolved.

Now I'm figuring out when to clear errors — removing aria-invalid once error slots are empty, focusing the offending field after an error appears, and deciding whether typing in any input/change event within the form should clear the relevant error. I'm checking this logic against test cases where invalid input triggers an error but preserves typed values, then correcting the amount should clear the error and allow successful submission.

I'm also mapping out select-all/none buttons to trigger preview updates and clear errors, confirming keyboard and Enter-key submission work through native form controls, and outlining the renderAll flow that re-renders people, payer/split options, expenses, balances, and settle-up sections while saving state on each mutation. I'm writing the function that rebuilds the payer and split inputs while preserving the previously selected payer and checked participants.

I should set autocomplete off so the browser doesn't restore stale field values on reload. For deleting expenses, I'll use event delegation on the list and figure out which index to focus next.

For deleting a person, I'll only allow it if they're unused, then re-render and refocus the name input afterward. I'll add a data-testid on the payer select with the option value set to the person's name, and set up a named Intl.NumberFormat instance for formatting. I'm debating whether to handle cross-tab sync via the storage event, but I'll probably skip that for simplicity.

Now I'm starting the HTML document structure, setting up the head with meta tags, title, theme color, font preconnects, and the Newsreader/Public Sans font imports, then planning an inline SVG favicon.

I'll simplify to just requesting the weight axis for both fonts, since opsz will default fine without being specified explicitly.

I'm fairly confident the correct axis syntax pairs opsz and wght ranges together like `opsz,wght@6..72,200..800`, matching Google Fonts' documented examples for Roboto Flex.

Using `Newsreader:opsz,wght@6..72,500..700` fits within its declared 200-800 weight range, and `Public+Sans:wght@400;500;600;700` works fine as discrete values on a variable font. Now I'm starting to write the JavaScript, setting up a storage key constant for persisting trip data.

I'm defining helper functions for currency formatting, DOM selection, and element creation, then building out the state management with load/save functions that read from localStorage and sanitize the parsed data by validating the people and expenses arrays before accepting them.

Writing the save function now, wrapping localStorage access in try/catch since even accessing it can throw a SecurityError in sandboxed contexts.

For computing balances, I'm splitting expense costs evenly among participants with any remainder cents distributed to the first few people in trip order, then tallying each person's net balance by adding what they paid and subtracting their share of each expense.

Writing settlement algorithm code...

Writing balances rendering logic...

Still writing list markup...

Working out expense details next: sorting newest first, totaling cents, formatting who paid, who split, and the share note with an even split or a range using an en dash. I also need a helper to join names naturally depending on how many people are in the split.

For the preview update logic, I'm figuring out how to compute each person's share by dividing cents evenly and distributing any remainder, then phrasing the sentence differently depending on whether it divides evenly or not.

I should shorten for larger groups: when there's just one remaining person, name them directly; otherwise say "the other N" to keep it concise rather than listing everyone, like "$33.34 for Ana; $33.33 for the other 2."

For the summary list at the top, I'll just name people directly if there are three or fewer, otherwise show a count instead—no need to overcomplicate it. I'll note that leftover cents from uneven division go to whoever was added first, which makes sense to mention in the help text.

Now I'm writing the form submission handler that trims the entered name, rejects empty names, and checks for duplicates against existing people in the trip before adding someone new.

For the duplicate-name case, I'm crafting an error message that tells the user their name conflicts with an existing one regardless of capitalization, suggesting they add a last initial to differentiate it—while keeping whatever they typed in the input instead of clearing it. I'm also building out the generic failure handler that clears prior errors, displays the new one, marks the field invalid with proper ARIA attributes, and moves focus to it, with special handling for cases where the field in question is actually a group of checkboxes.

On success for adding a person, I'm pushing the new entry to state, saving, re-rendering, clearing and refocusing the input, and announcing the addition for accessibility. For expense submission success, similarly pushing the new expense object with its ordered split data, saving, clearing undo state, resetting the form, and refocusing the description field.

For the undo flow, I'm building a function that replaces the undo slot with a message and an undo button, and wiring up the click handler to splice the expense back into its original position, save, re-render, hide the undo UI, and shift focus to the restored item's delete button. I'm also setting up a delegated click handler on the expense list to find the right delete button and resolve it back to an index in the expenses array.

After deleting an expense, I need to recompute focus based on the reversed display order, falling back to the undo button if the list becomes empty — and I'll apply similar logic for removing a person pill. For screen reader announcements, I'm using a clear-then-set trick on the status element so repeated identical messages still get announced. I'm also thinking through responsive layout concerns, like ensuring long money values and user text wrap properly without causing horizontal scroll at narrow widths.

Working through the grid math for the transfer card at 360px, I'm checking whether the amount and text columns will fit, and considering switching to a stacked icon/text/amount layout below 520px to avoid overflow.

Since the right column on desktop doesn't scale the same way with viewport width, I'm thinking I should use a container query instead, sizing the transfer list based on its own container width rather than the viewport.

Actually, maybe simpler to just always keep it stacked regardless of width: icon on the left, a sentence like "Ben pays Ana" on top, and the amount as a large number beneath it.

The wrapped amount would land left-aligned under the icon when space runs out, which looks off, so I'm considering using container queries on the list with `container-type: inline-size` to control that layout behavior more precisely.

For typography, I'm setting a base of 16px Public Sans with 1.5 line-height, Newsreader for headings and display numbers, and using lining tabular figures for money values since Newsreader defaults to that style. I'm also planning to respect `prefers-reduced-motion` and keep the header compact on mobile.

Writing the HTML skeleton now...

The skip link stays visually hidden until focused, then becomes visible. For the People panel, I'm structuring a form with a labeled name input for adding trip participants.

Adding more form fields...

Finishing the form markup with a message slot and submit button, I'm reconsidering whether to keep both the split-empty hint and a separate "needs people" note, or consolidate into just one clear message so the empty state doesn't look redundant.

I'm settling on a responsive grid for the two-column fields—single column on narrow screens, switching to two columns around 560px breakpoint—and double-checking it holds up across tablet and mid-desktop widths before adding the basic field spacing styles.

Now I'm writing out the base CSS reset and typography, and catching a subtle accessibility issue: removing list-style globally strips list semantics from Safari's VoiceOver, so I need to add explicit role="list" to the markup to compensate.

Adding the skip-link styles and a visible focus ring, then checking where focus states actually matter across the navy settle panel and header -- mostly the white button areas need the focus outline treatment.

Now I'm setting heading sizes and laying out the expenses panel head with a flexible, wrapping row showing title and total side by side. I'm styling the total display with a soft label and a bold harbour-colored figure, then adding a signal-colored stripe under the header for visual punch.

I'm now running through contrast checks across the UI—hint text, primary and remove buttons, links, error messages, settle screen subtext, axis labels, and placeholder text—confirming each pairing meets readable contrast ratios against its background.

Writing the pill rendering logic...

Actually this could collide with expense removal tests if they use a generic `/remove/i` role query, since the people panel appears first in the DOM. To avoid that ambiguity, I should phrase the person's aria-label differently, like "Take Ana off the trip," while keeping expense removal buttons labeled clearly with "Remove" to match the spec.

Now I'm writing the expense rendering function, which rebuilds the list in reverse order, toggles empty-state visibility, and computes per-person share amounts for each expense item, formatting them as "each" when shares are equal.

I notice a wording edge case: with a single-person split, saying "$90.00 each" sounds odd, so I should drop the "each" suffix when there's only one person in the split.

Still writing the el() helper...

For icons I'll use static innerHTML SVG markup inside a helper function since the content is fixed and safe, so I'm building the transfer arrow icon this way.

Now I'm writing the renderSettle function, which computes the transfers from balances, updates the list, and shows contextual subtext depending on whether there are people, expenses, or remaining transfers to settle.

I'm also planning an empty-state message box in the settle panel with a dashed border, plus deciding on careful wording for the subtext—avoiding overclaiming "fewest payments" since the greedy algorithm doesn't guarantee optimality, settling on "a short list of payments that puts everyone back at zero."

Now I'm wiring up the render pipeline so a single renderAll function updates people, expenses, balances, and settle lists together, and hooking up the split-all/split-none buttons to toggle all expense participants at once.

I'm adding shared input/change listeners on the expense form so any edit clears validation errors and refreshes the live preview, though I need to double-check that clearing errors doesn't wipe out an unrelated error the user hasn't fixed yet.

Now I'm writing the renderBalances function, computing the max absolute balance for scaling, then mapping each balance into a status label describing whether that person is owed money, owes money, or is settled.

I should enforce a minimum visible bar width so tiny balances still show, and double-check that the data-cents attribute and "$0.00" formatting read correctly for edge cases like an even split. Then I need to move on to rendering expense inputs and verifying the parseAmount function's return value.

Each amount validation case needs a clear message—empty, invalid, nonpositive, too many decimals, or too large—plus a description error reminding users to add a short label. I should also make sure clearErrors properly resets the aria-invalid attributes.

I need to handle focus management when splits or people validation fails, reload state and re-render on storage events to sync across tabs, and add a noscript fallback message plus a small SVG logo mark in the footer.

Checking the logo's contrast against the navy background, it's weak but exempt as a brand mark; still, I should lighten the tile fill to cream so it reads better.

Finalizing on a cream rounded tile with a navy waterline and a red keel triangle beneath it, it evokes something like a plumb bob or level — simple and legible at small sizes. I'll use this as both the header mark and the favicon, then move on to working out the "Even Keel" typographic lockup with Newsreader for the headline.

For mobile flow, I'm settling on people → expense form → summary → expenses as the order, keeping focus on the description field after adding an entry so users can keep entering quickly. The sticky layout stays desktop-only, and I'm setting panel children to allow shrinking so the grid doesn't overflow. Now I'm writing the settle panel's styles with a harbour-colored background, cream text, rounded corners, and responsive padding adjustments.

Still writing styles...

I'm giving the settle note a dashed empty-state variant for when all balances are zero, using mist-colored text on navy, and a regular style for the active state showing transfer counts. Then I'm laying out the transfers list as a grid with icon, text, and amount areas that rearranges from stacked to a single row once the container passes 400px using a container query.

Adjusting alignment for the remove button and considering whether it should sit more subtly within the row.

Now I'm styling the expense meta line showing who paid, plus the amount display with a bold, non-wrapping font treatment since the left column handles overflow. I'm also writing the undo bar styling, using flex layout with soft background and rounded corners, and leveraging the `:empty` pseudo-class to hide it automatically when there's no content.

For the undo bar and message slot, I need to make sure the initial HTML markup has no whitespace inside so `:empty` actually triggers, and I'll toggle content via `replaceChildren()` to keep it truly empty when cleared. I'm also weighing a tricky accessibility issue: since the message slot uses `role="alert"` but starts hidden with `display:none`, screen readers may fail to announce it when content is injected, since the element isn't in the accessibility tree until it becomes visible.

Better approach: keep the slot always rendered but let it collapse naturally when empty, applying margin only to the inner error/status child rather than the slot itself. Now I'm styling the form error component with a flex layout, warning icon, and signal-colored background and border.

I'm adding a fallback for the "!" icon content so screen readers and unsupported browsers don't lose the decorative mark, plus a focus style for invalid fields using a border and box-shadow in the signal color.

Now I'm sketching the inline-field flex layout for errors and form inputs, handling the full-width button on mobile versus auto-width at larger breakpoints, normalizing the name field for consistent key comparisons, and running through test scenarios like adding a new person to verify everything holds together.

Checking duplicate-name detection shows the error correctly, whitespace-only input also triggers an error, and the input field behaves properly. For expenses, I walk through filling out the description, amount, payer, and split checkboxes to confirm the balance calculation splits correctly across participants in cents.

Testing the full flow: splitting $100 among three people, verifying Ana's balance comes out to 6666 cents with Ben and Cal each owing 3333, and the transfer suggestions correctly show two payments settling the debt. Reload persistence works for people and expenses, deleting an expense resets balances to zero, and I'm validating edge cases like decimal amounts, zero, negative numbers, and non-numeric input all produce appropriate errors.

I'm also considering "1e2" as invalid input, confirming "10.5" rounds correctly to $10.50, checking that adding an expense before any people exist triggers an error, and verifying checkboxes default to checked including for newly added people. I want to make sure balance elements only appear when people exist, settle-up transfers stay within the expected count and sum, and localStorage gets populated after mutations even if not explicitly saved on initial load.

I'm also walking through edge cases like clearing localStorage and reloading to confirm state resets properly, keyboard accessibility such as Enter submitting the add-person form, the required/novalidate combination suppressing native browser validation bubbles, and focus-visible styling behaving correctly when focus is set programmatically after a mouse click versus a keyboard interaction.

Now I'm setting up accessibility and mobile details like 16px input font-size to prevent Safari zoom, ensuring color isn't the only indicator by pairing bars with text, and adding a color-scheme meta tag.

Setting up DOM element references...

Adding error handling helpers that clear messages and ARIA attributes, then set new error states on invalid fields.

Writing form handler logic...

I'm now adding an optional `mark` flag to `showError` so some validation failures don't flag the person field. Then I'm writing the expense submit handler, checking first that people exist, then validating the description and parsing the amount field with error messages for each failure case.

Beyond that, I need to validate the payer is a known person and that at least one split participant is checked, preserving the description text exactly as typed on error. Then I'm setting up an undo mechanism that tracks the last deleted expense and its index, with a delegated click handler for the undo button.

For deletion, the handler finds the expense by id, splices it from the array, stashes it for undo, re-renders, shows the undo bar, and moves focus to a sensible nearby delete button (or the undo button if none remain), while announcing the removal for screen readers.

I'm weighing whether this announcement duplicates the undo status region's own announcement, but decide the redundancy is acceptable since focus still lands correctly and the pill UI updates correctly when a person's expenses clear out.

For the expense inputs, I'm rewriting the render function to preserve the payer selection and checked split state across re-renders, rebuilding the payer dropdown options from the current people list while tracking which boxes were previously checked.

I'm wondering if browsers restore form state on reload, which could reintroduce stale checkbox values — adding `autocomplete="off"` on the form might prevent Firefox from persisting that state.

I'm also checking the checkbox labels for accessible names and planning CSS so long name text wraps properly, plus laying out the balance axis row with "owes" and "is owed" indicators above the list.

Writing axis CSS...

Adding the finishing touches now: pseudo-element borders for the axis line, arrow indicators for owed/owing text, conditional total display in the expenses header, and a custom select-arrow icon via inline SVG data URI. I'm also double-checking test-id attributes and overall CSS organization before writing out the final complete answer.

For the remaining layout, I'm adding spacing between sections and a subtle growth animation for the balance bars, wrapped with a reduced-motion media query to disable animations for accessibility. I need to make sure this animation only replays on actual data mutations rather than every re-render.

Now I'm drafting the actual page copy: the title "Even Keel" with tagline "Log who paid. See who owes whom," plus descriptive subtext for the People, Expense, and Balances panels explaining their purpose in plain terms.

I settle on "Paid minus share. Owing is a normal part of sharing costs." for the balances panel, and "A short list of payments that puts everyone back at zero" for the settle panel. I'm also starting a hint about how uneven splits handle leftover cents.

Now I'm verifying implementation details: hidden/empty states for the transfers list, conditional rendering of list items, inline style attributes for bar widths, and toggling an "is-empty" class on the settle note.

I'm writing a helper to join names with proper comma/and formatting, then building the preview-text function that splits amounts evenly among checked people and describes who carries which share.

Let me change the prefix to "Works out to " instead, so single-person cases read naturally like "Works out to $90.00 for Ana," while unifying that case with the general split logic. I'm also noting the "Select everyone"/"Clear" controls need handling.

Now thinking about French-Canadian locale conventions where decimal commas are common, like "12,50" instead of "12.50" — I want to detect when a comma likely represents a decimal separator versus thousands grouping, so something like "12,50" parses as 12.5 while "1,234" is treated as 1234.

I'm writing the parsing function that strips currency symbols, checks for negative values, detects thousands-grouping commas versus decimal commas, and normalizes the string before extracting the numeric value.

I'm validating the decimal precision and whole-number length, converting the amount into cents while rejecting zero or malformed inputs, then tracing through edge cases like "1,234" and "12,50" to confirm the grouping versus decimal detection works correctly.

Confirming the language attribute and checking the balance row borders styling, plus header stripe design elements like marks, bars, error states, and focus indicators. Everything looks solid, so I'm ready to write the final document.

