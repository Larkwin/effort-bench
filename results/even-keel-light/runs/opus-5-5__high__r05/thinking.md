I'm mapping out the full app structure: people management with validation, expense entry with cent-precise splitting and leftover distribution, a balance calculator, and a settle-up algorithm that greedily pairs largest debtors with largest creditors to minimize transfers. I'll skip person deletion to keep things simple, focusing instead on accessibility, responsive layout, and localStorage persistence.

Now I'm deciding on checkbox defaults for splits — new people get checked automatically while preserving existing selections on re-render, resetting to all-checked after each expense is added. For the payer, I'll default to the first person rather than use a placeholder, keeping their selection stable across re-renders, and I'm weighing whether to use a text input with decimal validation versus a native number input for the amount field to properly reject invalid entries like extra decimal places.

I'm settling on a text input for amount with regex validation accepting plain decimals (stripping currency symbols and commas), converting to cents via string parsing rather than floats to avoid rounding issues, and capping the max to prevent overflow. For form errors, I'm toggling the data-testid attribute on and off rather than always rendering the element, pairing it with aria-live and aria-invalid/aria-describedby for accessibility, and I'm also considering whether adding an expense with zero people should trigger a validation error or simply show an empty-state prompt instead.

For validation order, I'm deciding to show per-field error messages (description, amount, payer, split selection) rather than a single combined message, each tagged with data-testid="form-error" for better UX and easier testing. For balance calculations, I'm working out how to split costs evenly in cents using floor division with remainder distribution based on trip order, and sketching the expense record's shape in the store.

I'm settling on storing people by id with name for robustness, and expenses referencing payerId and an array of splitIds, with order determined by insertion. For settling up, I'm using a greedy algorithm that repeatedly matches the largest debtor with the largest creditor, transferring the minimum amount each time, guaranteeing at most n-1 transactions with deterministic tie-breaking by trip order.

For the expense list, I'm planning to show items newest-first with description, amount, payer, and explicit split names rather than vague terms like "everyone," plus per-person share amounts. I'm also adding a remove button with a descriptive aria-label and thinking about where focus should land after deletion.

I'm leaning toward adding a lightweight undo toast after removing an expense as a nice usability touch, while skipping date tracking since it isn't required. I'm also working out the color palette now, defining harbour navy and signal tones and manually computing relative luminance and contrast ratios to ensure the signal color meets accessibility standards against white backgrounds.

Thinking about tone, I want to avoid treating owed money as alarming — red isn't the right signal for debt since owing is just normal. I'm considering a balanced bar visualization with a neutral centerline, where both "owed" and "owes" sides carry similar visual weight rather than one feeling like a warning.

For copy, I'm drafting phrases like "Ana is owed $40.00," "Ben owes $20.00," "Cleo is even," and a settle-up line like "Ben pays Ana $20.00," plus an empty state of "Everyone's even. Nothing to settle." and a tagline "Split the costs. Stay even."

Now I'm weighing font pairings that feel nautical and trustworthy — considering serif options like Literata or Newsreader for headings paired with something clean like Instrument Sans or Figtree for body text, and thinking tabular figures are essential for the money displays.

I'm settling on Newsreader for display text and Public Sans for body copy since it supports tabular numerals cleanly, and sketching the page layout — a header with an "Even Keel" wordmark and small keel icon, then a grid splitting people/expense-entry on one side from balances/settle-up on the other for desktop, while mobile stacks everything in the natural flow of adding people, logging expenses, seeing balances update, then settling up.

I'll label the right column "The tally" and add a trip total summary near the header. For styling, I'm thinking warm paper background with white bordered cards, Newsreader headings with small numbered eyebrow labels like "1 People", "2 Expenses", plus a visible focus outline in Signal color with sufficient offset and contrast against the backgrounds.

For the color system, I'll make primary buttons Harbour-toned for calm consistency, reserving Signal as an accent for the focus ring, brand mark, and settle-up section. Owing and owed amounts will use muted tints of Signal and Harbour respectively rather than full-strength colors, with labels kept in plain ink so the "owes" side doesn't read as alarming — and I'll make the main "Add expense" button Signal-filled since it's the primary action.

Now I'm working through interaction details: checkbox chips for splitting people, quick "All"/"None" toggle buttons, a live share preview showing the per-person amount as they type, and the voice for error messages and empty states across the people, expenses, and balances sections.

For settle up, I want to show a friendly message when everyone's even versus when no expenses exist yet. I'm also weighing whether to allow removing people, but worried that adding a remove button inside the person element could break tests checking exact name text content, so I need to be careful about how I structure that markup.

Instead of using CSS pseudo-elements for avatar initials since those won't show up in text content checks, I'll use a data-initial attribute styled with ::before. I'm skipping person removal entirely and adding a two-step "Start a new trip" confirmation flow instead of a browser confirm dialog. I'm also defining the test IDs and data attributes for balance, transfer, and expense elements, plus planning to use a versioned localStorage key with graceful handling of parse errors and data validation.

For expense removal, I'm designing an undo flow that stores the last removed item with its index, shows a status message with an Undo button, and manages focus by moving it to the next expense's remove button while announcing the removal through a live region. For currency, I'm using Intl.NumberFormat for CAD formatting and writing a parser that strips dollar signs and commas from user input before validating it's a proper decimal number.

I'm refining validation rules: rejecting malformed decimals, empty values, amounts of zero or less, amounts over a million dollars, scientific notation, and giving specific error messages for negative inputs like "Amounts need to be more than $0." I also need to validate comma placement follows standard thousands grouping, and ensure the selected payer actually exists among the split participants, with the payer not automatically included in the split unless explicitly chosen.

I'm working out the logic for splitting costs evenly among participants in cents, distributing any remainder one cent at a time to the first few people, then computing each person's balance as what they paid minus their fair share before moving into the settlement calculation.

For settling up, I'm designing a greedy algorithm that repeatedly matches the largest creditor with the largest debtor, transferring the minimum of their amounts and removing anyone who reaches zero, continuing until all balances are settled.

I'm also planning how re-rendering should work after state changes—keeping existing form inputs and checkbox selections intact (new people default to checked, previously unchecked ones stay unchecked), preserving the payer dropdown's selected value when still valid, and mapping names back to IDs on submit since the UI displays names while the data model uses IDs. Forms should use proper submit handling so pressing Enter works, and after a successful expense is added I should clear the description and amount fields and reset the split selection.

I'd keep the payer selection as-is since the same person often pays repeatedly, and announce confirmations like "Added Dinner, $40.00, paid by Ana" after submission. For accessibility, I'm working through using a fieldset and legend for the split checkboxes, visible labels, aria-describedby linking fields to their error messages, focus management that moves to the first invalid field, and a polite live region to announce a brief summary when validation fails, while avoiding overly chatty alert roles on every individual field.

I don't think a skip link is necessary given how small the header is, so I'll skip it. Checking contrast ratios, the muted text color against both white and the paper background comfortably passes accessibility thresholds. For the balance visualization, I'm designing a horizontal bar per person showing name, status text, and a track with a center line where positive balances extend right in a harbour blue tone and negative balances extend left—though I'm second-guessing using a red/signal color for "owes" since that carries a judgmental connotation, and considering a softer clay/sand tone instead.

Since the bar graphic is supplemental to the text label rather than the sole conveyor of info, I don't need to hit the stricter 3:1 non-text contrast ratio, which gives me more freedom. I'm settling on a warm clay tone for "owes" and a harbour mid-tone for "is owed," both equal in visual weight, paired with transparent breakdown text like "Paid $60 · Share $20" beneath each name to keep things honest, and a small uppercase label on the right ("Owes"/"Is owed"/"Even") alongside the amount.

For settle-up suggestions, I'm formatting them as "Ben pays Ana" with the amount right-aligned, skipping the idea of auto-recording settlements as expenses to avoid scope creep, but adding a lightweight "copy summary" clipboard button since it's genuinely useful for sharing. For expense list items, I'm laying out description and amount on top, a muted line showing who paid and how the split breaks down, and a small ghost "Remove" button with proper aria-label.

I'm handling long text with overflow-wrap and length caps, tightening mobile padding, and designing a simple wordmark SVG—a boat hull shape with a keel line and waterline in white against the navy header. The header also includes a tagline and trip summary chips showing people count, expense count, and total, while the footer clarifies data is saved locally with a "Start new trip" button. Now I'm beginning to write the HTML structure with the header, main layout, and input column cards.

Writing form markup...

I'm deciding to keep the header outside main since tests likely scope all testids within the app container regardless. I'm sketching the error-handling helper that toggles hidden state, aria-invalid, and the data-testid attribute on error messages, plus mapping out which expense fields need their own error slots—including reusing the payer error to prompt adding a person first if the trip has nobody on it yet.

Now I'm working through the edge cases for empty state: the payer dropdown shows a disabled "No one yet" placeholder, the split area shows a hint instead of checkboxes, and the select-all/clear buttons get proper button types and aria-labels. I'm also planning the core data model and functions—state with people and expenses arrays, a uid generator, load/save with validation that filters out expenses referencing missing people, and a render function that updates all the UI sections.

I'm sketching out balance computation, expense list ordering (newest first, with undo reinserting at the original index), and the removal flow with focus management after deletion. I'm also designing the undo bar that hides on any new mutation rather than auto-timing out, plus the copy-summary feature using the clipboard API with a textarea fallback, and a simple inline-confirm reset trip action.

For name validation I'm trimming input and checking case-insensitive duplicates, with error messages like "is already on the trip" or "Type a name first," plus maxlength limits on name and expense fields. Now I'm structuring the balance row markup with a keel-bar visualization showing each person's owed/owes amount as a proportional width.

I'm designing the keel visual as a centered track with a positioned bar (left for positive, right for negative) and accessible labels like "is owed" or "owes," plus a legend row and explanatory note about the settle-up list minimizing transfers. I'm now laying out the transfer list items showing who owes whom and how much.

For the overall styling, I'm planning the masthead with a harbour-blue background, white wordmark, and muted tagline text, choosing Newsreader for headings and tabular-numeral money figures alongside Public Sans for body text, and setting up the Google Fonts import and CSS color variables for the harbour theme.

Still defining color variables...

For the focus outline, I'm handling the double-ring problem by removing the input's inner outline in browsers that support `:has()`, keeping the chip's outline as the visible ring. Then I'm working through chip checkbox styling, the amount input with a dollar sign prefix, touch-friendly input sizing with 16px font to prevent iOS zoom, and responsive form layout with side-by-side fields collapsing to stacked on narrow screens, plus the overall container grid structure.

Now I'm respecting reduced-motion preferences for transitions before moving into the JavaScript. Writing JS helper functions and state loading logic...

Writing balance and settlement logic...

I realize the CSS generated content for the initial might get read by screen readers, causing duplicate announcements like "A Ana". I should use the alt-text syntax for generated content so accessible browsers skip the redundant initial while keeping a fallback for others.

Now I'm writing the payer dropdown renderer that preserves the previous selection when possible, falling back to the first person or a placeholder if no people exist, and starting the split section renderer that shows an empty-state message when there are no people yet.

I'm finishing the split checkboxes, each wired to toggle participants via an onchange handler that updates an unchecked set and preview without forcing a full re-render, which avoids losing focus while a user is interacting with the checkboxes directly.

For submitting an expense, I'm reading the description, amount, and payer from the form, then pulling the checked split checkboxes directly from the DOM (more reliable than the stored set) to determine which people are included, and starting to build up validation errors for missing fields.

I'm thinking through focus targets for each error type and whether a missing-people case needs its own split error or if the payer message already covers it. For the amount validation, I'm drafting friendly messages for empty input ("Enter the amount, like 24.50") and negative amounts ("Amounts need to be more than $0").

I'm adding more amount validation rules now—messages for invalid number format, too many decimal places, zero amounts, and an upper cap around $1,000,000 to keep expenses reasonable. Writing the amount parser...

Still writing validation logic...

I'm also tracing through edge cases like "12.345" (too many decimals, caught) and "abc" (fails the format regex), confirming the parser rejects them correctly.

Now I'm sketching the preview logic: parse the amount and person count, then if valid and count>0, compute per-person splits—showing an even split message, or a remainder message noting extra cents go to the first people, or a special case when there's only one person getting the full amount.

For invalid input, I'll fall back to a default hint explaining equal splitting, attached near the split fieldset.

I'm also writing the expense list rendering function, building each list item with the description and a summary of who the expense is split between, detecting when it's split evenly across everyone.

For the payer and split text, I'm formatting the payer's name and joining the split participants' names into a readable list, considering using Intl.ListFormat for a natural "Ana, Ben and Cleo" style grouping.

I'm also thinking about adding per-person share info like "$13.34 each" or a range when the split isn't even, plus the expense count in the heading, then handling focus management after removing an expense from the list.

Since sequential deletions via locators make focus placement less critical for tests, I'll settle on focusing the undo button to make the undo action discoverable for keyboard users, accepting that the next tab will land on the first remove button.

Undo logic restores the expense at its clamped index, and since payers and split participants always persist unless a trip reset clears everything, there's no need to validate them. I'm making sure the undo bar hides and clears its state whenever a new person or expense is added, and the reset trip button in the footer should reveal a confirmation panel before clearing everything.

The summary text shows total spent and counts of people/expenses, with a friendly empty-state prompt, plus a live region for screen reader announcements and a copy-settlement button that only appears when there are actual transfers to settle. I'm now writing the balance rendering function that builds a scaled bar visualization for each person's net position.

For the zero-balance case, I'm deciding to just show "Even" as the label without an awkward "$0.00" amount appended.

For empty states I'm working out the logic: hide the balances list entirely when there are no people, with a message that balances appear once people join the trip; when people exist but no expenses yet, show everyone as "Even" with a note that logging an expense will show where things stand. I'm also adding a legend row above the list, visible only when the list itself is shown, labeling the "Owes" and "Is owed" sides.

For the settle-up section, I'm writing a render function that shows an empty message when there are no expenses yet, a "Everyone's even, nothing to settle" message when balances are already settled, and otherwise a footnote summarizing how many payments will even everyone out. I'm also planning the visual for each transfer row, showing the payer's name, an arrow, and the recipient's name.

Writing base CSS styles...

Still writing styles...

Adding card styling...

Still writing card styles...

Adding input field states...

That contrast ratio comes out around 6.8, which passes. I'm considering whether the error state needs a small "!" icon mark for visual reinforcement.

Now I'm styling the select dropdown with a custom chevron arrow, and laying out the inline field with flex so the input stretches while the button stays fixed width, checking it fits within a 360px card. Then I'm defining the base button styles with proper sizing, padding, and border treatment.

Adding button variants...

I'm also thinking about whether the "Add expense" button should be full width on mobile versus auto-width on desktop, leaning toward keeping it left-aligned.

Now I'm sketching the chip component styles—pill-shaped selectors with wrapping flex layout, rounded borders, and a built-in checkbox sized for touch targets.

I realize my generic input sizing rule would accidentally style checkboxes too, so I need to scope the full-width/min-height treatment to text inputs and selects only. Then I'm working out the fieldset/legend reset, stripping default borders and padding so I can position "All/None" toggle buttons alongside the legend text on the same row.

Since legend must stay the fieldset's first child for accessibility, I decide to position it with the fieldset set to relative and the quick-select buttons absolutely placed top-right, giving the legend padding-right so they don't overlap—confirming this stays compact even at narrow widths.

Now I'm spacing out the form fields and sizing the preview text, then working through a grid layout for field rows that switches to two columns above 440px, checking the math on how that fits within the card's padding at a 900px viewport.

I'm switching to container queries on the card itself so the layout responds to the card's own width rather than the viewport, falling back to a single column when narrow. I'm also styling the people list as pill-shaped tags with flex layout, rounded backgrounds, and initials shown via a pseudo-element.

Now I'm designing empty states with a dashed border and muted text, plus the expenses list layout with top-border dividers between rows and flexible description/meta text that wraps safely.

Still writing styles...

Adding keel marker and balance bar styles...

I'm thinking the settle-up card could stand out as a dark harbour-colored block with white text, listing transfers in rows with light dividers to give it strong visual hierarchy as the "answer" element.

I need to check contrast ratios for the focus ring on that dark background — the signal color fails at 3:1, so I'll switch to a lighter version of the signal hue for focus states, and use an inverted secondary style for the copy button inside the dark card.

Now I'm laying out the transfer row styling — flex alignment with spacing, a top border divider, a muted verb color, and tabular numerals for the amount using Newsreader. I'm also setting the step number's border to white for contrast on the dark card.

I'm continuing with the trip stats summary layout, footer copy and link styling, an undo bar with a subtle background and border, accessibility helpers like sr-only, reduced-motion handling, and reordering the right column on larger screens to prioritize balances and settle sections.

I'm also checking for overflow issues at small screen widths, making sure long names wrap properly across name chips, selects, and pills, and ensuring flexible elements like name fields and transfer labels shrink correctly with min-width:0.

For keyboard behavior, everything relies on native controls, with the name input set to disable autocomplete, use word-based capitalization, and show a "done" key. I'm deciding the masthead should always show stats—even zeros—for simplicity, and now I'm drafting the actual copy for each section, starting with "Who's on the trip" and its empty-state message encouraging the user to add themselves first.

I'm writing labels and hints for the expense form, landing on a shorter split-equally explanation, then working through copy for the balances, settle-up, and expenses sections, adjusting empty-state wording since "above" doesn't make sense in the desktop layout. I'm also deciding the step numbering only applies to the main flow cards, leaving the expenses list unnumbered intentionally.

Now I'm defining announcement messages for adding/removing people and expenses, including an undo restore message, and making sure the undo logic reinserts items at the correct clamped index. I'm confirming the required attribute works fine for accessibility alongside novalidate, and that validation errors don't clear the user's typed input on failed submission.

I'm wiring up input/change handlers so each field clears its own error state and updates the live preview as the user edits amount, description, payer, or split selections, while making sure duplicate person names preserve what was typed rather than resetting the field.

Now I'm writing the clipboard copy function for the settle-up summary, with a fallback using a hidden textarea and execCommand when the Clipboard API fails, plus a temporary "Copied" button state and an announcement for accessibility. I'm also adding a save failure notice area and setting up a storage event listener to sync state across browser tabs.

Then I'm double-checking the greedy settle algorithm bounds and reviewing where the Signal design accents show up—masthead border, focus rings, step numerals, error text, and the keel logo—before sketching the SVG masthead logo itself.

Still writing SVG code...

Contrast checks out at about 6.6:1 against the cream background, well above the 4.5 threshold. Ink-2 also works fine on the harbour-50 background, and I'm now checking whether the muted text color holds up against the dark card background color.

I'm good with the decorative accent color against the track color too, and the layout works well up through desktop sizes. Now I'm writing the final HTML, making sure the hidden attribute properly overrides any CSS display rules, and setting up field error markup with proper aria-describedby linking so screen readers announce validation errors even while they're visually hidden.

I'm planning out the amount input's hint and error associations, the masthead stats using a definition list with specific ids, and a pluralization helper for the summary text. Now I'm finishing the render function, setting up the balance computation and ordering the rendering of rows and expenses.

For the expense row's share text, I'm figuring out how to display who paid and who split the cost, settling on a cleaner two-line format showing "Paid by [name]" and "Split between [names]" with the per-person amount shown near the total.

I'll show each person's share as the base amount when it divides evenly, or both possible amounts ("$13.33 or $13.34 each") when there's a remainder, placed in the meta line under the split.

For formatting the list of names, I'll use Intl.ListFormat with a fallback for environments that don't support it. I'm also double-checking that the expense-split container wraps the checkboxes correctly, payer selection works via the select dropdown, and the payer defaults sensibly when new people are added without an explicit choice.

Now I'm designing the "start a new trip" reset flow in the footer: a link-style button opens a confirmation panel with accessible labeling, offering "Clear the trip" (danger styled with sufficient contrast) and "Keep it" options, managing focus appropriately on open and cancel.

Writing button styles...

I'm also setting base typography — 16px body text, heading sizes, and a larger brand size in the masthead that scales up on wider screens. Time to put it all together.

