I'm mapping out the core requirements for the expense splitter: unique-name validation for people, expense entries with amount and split logic using integer cents to avoid rounding errors, and distributing leftover cents fairly among selected participants.

For balances and settling up, I'm figuring out a greedy debtor-creditor matching algorithm to minimize transfers, plus thinking through money formatting, localStorage persistence, and responsive/accessible design. I'm also weighing whether to allow removing people — deciding to permit it only when they're not involved in any expense, to keep things safe but still useful.

For the payer selection, I'm debating whether to use a placeholder option or default to the first person, leaning toward defaulting to avoid breaking tests that forget to explicitly select a payer, since the spec only requires picking one person who paid.

For split checkboxes, I'm planning to default new people to checked while preserving existing selections, and reset everyone to checked after a successful expense is added. For the amount field, I'm weighing type="number" versus text with inputmode="decimal," since type="number" could cause issues if tests try filling invalid strings like "abc".

For parsing the amount, I'm considering how to handle stripping dollar signs and spaces, and debating whether commas should be treated as thousands separators or decimal points given French Canadian locale conventions—leaning toward keeping the validation simple rather than over-engineering locale support.

I'm also handling edge cases: zero should trigger "enter an amount greater than $0.00", negative numbers get a similar friendly error, and I'm debating whether to cap the maximum allowed amount to avoid overflow, though it's probably unnecessary for typical test cases.

For the error display, I want the error element to only exist (with its data-testid) when there's an actual error, and be fully removed or cleared otherwise, so tests checking visibility or absence work correctly.

I'm deciding to keep the live region container always present but empty of content when no error, inserting a paragraph with the testid when an error occurs, so screen readers announce it properly, and I'll also tie aria-invalid and aria-describedby to the input.

Now I'm thinking about when errors should clear—probably on successful submit rather than on every keystroke, since clearing on input could interfere with tests expecting the error to persist until resubmission.

For multiple errors, I'll show one message at a time for the first invalid field and focus it, rather than listing every problem, since tests reference a single error element like `data-testid="form-error"`.

If that element could match multiple visible errors simultaneously in strict Playwright mode, that would break things — so I need to ensure only one error is ever visible globally, clearing any unrelated error when a different form is submitted. I'll place each field's error in its own live-region slot near that field.

For focus management, moving focus to the invalid field and linking it via aria-describedby ensures screen readers announce the error naturally. For duplicate-name validation, I should compare names case-insensitively with lowercasing, and likely collapse internal whitespace too so "Ana Lee" and "Ana  Lee" are treated as matches.

I'll skip adding a maxlength constraint since there's uncertainty about how Playwright's fill interacts with it, and it's unlikely tests use unusually long names anyway.

For rendering, I'll use textContent and setAttribute to avoid XSS, keeping data-person, option values, and checkbox values consistent with the name strings used in selectors.

For the settle-up logic, I'm working out a greedy algorithm: separate people into creditors and debtors based on signed balances, then repeatedly match the largest debtor with the largest creditor, transferring the minimum amount until balances zero out.

At most n-1 transfers result, with ties broken by trip order for determinism. I'm also planning a pre-pass that matches exact debtor/creditor amounts before falling back to the greedy approach, which can reduce the total number of transfers while still staying within the n-1 bound.

I'm structuring expenses as records with id, description, amount in cents, payer id, split array of person ids, and creation time, while people are simple id/name pairs — using ids internally and names only for display attributes. Since people can't be removed once referenced in expenses or renamed, shares get computed at render time ordered by each person's position in the trip, and leftover cents get distributed following that same trip order.

For the expense list, I'm deciding to list split participants by name explicitly rather than saying "everyone," since tests may check for specific names in the text — and I want to also show the per-person share, like noting even splits as "each owes $X" versus uneven splits showing the two different share amounts.

33 each · Ana covers the extra 1¢" for one person, or "each cover an extra 1¢" when multiple people split the leftover — always the first few people in trip order among those selected. For deleting an expense, I'll use a "Remove" button with a clear aria-label, moving focus afterward to the next remove button or the list heading, and I'm leaning toward an undo option rather than a confirmation dialog.

A confirm() dialog would actually break automated tests since Playwright auto-dismisses dialogs, so I'll skip that and instead show an undo toast like "Removed 'Dinner'. Undo" with role="status" for accessibility, re-inserting at the original index if triggered. To avoid timing-related accessibility issues, I'll keep the toast visible until another action occurs rather than auto-dismissing it. For persistence, I'll store data under a versioned localStorage key wrapped in try/catch.

I'm also weighing a "clear trip" reset action with inline two-step confirmation for when a trip ends, and considering whether to add an editable trip name for warmth, though I'll likely skip that to keep scope tight. Now I'm moving into the visual design direction, starting with a steady navy brand color.

Signal red-orange should stay reserved for primary actions, not debts, since owing money is normal and shouldn't read as alarming — so balances will use calm, worded framing like "is owed" and "owes" rather than colored plus/minus signals. I'm liking the idea of an "Even Keel" balance bar: a centered zero line with bars extending left for owing and right for being owed, each in muted harbour and warm neutral tones.

For errors though, I'm checking whether Signal's contrast ratio against white actually holds up for accessibility, working through the luminance math to confirm it reads clearly enough for form error states.

Maybe errors should use a darker red variant instead to avoid conflating brand with error states. I'm settling on Harbour navy as the main structural ink, a pale warm canvas background, and Signal as the accent for keel lines, primary buttons, and focus rings — checking that the focus ring hits 3:1 contrast with proper offset. Now I'm building out the palette with Harbour ink, a deeper Harbour shade, and a mid-tone Harbour for secondary text that still needs to clear 4.5:1 contrast.

Now I'm working through the remaining palette: a cool mist tint, a warm canvas background, a paper tone for cards, and a border line color, while checking that input borders meet the 3:1 non-text contrast requirement by computing luminance values for a candidate cool-gray border color.

I'm also assigning functional colors — a signal red for alerts with a deeper hover/error variant, and distinguishing "owed" versus "owes" states with a harbour-blue and an ochre/sand, making sure text placed on these backgrounds will still read clearly.

Actually, I want to avoid the typical green/red debt-signaling, so I'm leaning toward a neutral brass tone for "owes" and a teal "harbour" shade for "owed," since both bars are supplementary to text labels rather than the sole indicator. Now I'm considering font options like Fraunces for the typography.

Considering alternatives like Libre Caslon, Spectral, or Literata for a bookish feel, and weighing Public Sans or Atkinson Hyperlegible for body text given their honest, neutral character. I need tabular figures for money alignment, and I think Public Sans supports that better than Atkinson Hyperlegible.

I'm leaning toward Fraunces or Newsreader for headings to give an editorial, well-made-tool feel, paired with Public Sans body text using tabular numbers—deciding against mono figures since they'd feel too ledger-like.

I considered alternatives like Source Serif 4, Literata, or Young Serif, but settled on Fraunces paired with Public Sans for a warm yet sturdy feel without defaulting to generic choices. Now I'm moving on to layout, starting with a header wordmark "Even Keel" styled with a small m.

For the mark, I like the idea of a spirit level vial with a bubble centered between tick lines — it ties nicely into the "even keel"/balance concept and uses Signal for the bubble. I'm also drafting the tagline "Split trip costs fairly and see who owes whom" and a summary strip showing trip total, people count, and expense count.

Now I'm thinking through the layout flow: add people, log expenses, then view balances and settle up. On desktop I'll split into a narrower left column with People and Add Expense cards, and a right column with Balances (including the keel visualization), Settle Up, and the Expenses list below. On mobile everything stacks in that same logical order: People, Add Expense, Balances, Settle Up, Expenses.

Keeping max width around 1120px, with plain section headings like "Who's on the trip" and "Log an expense" rather than numbered steps. For balances, I'm picturing a diverging bar chart per person with a zero-line center—teal bars extending right for money owed to them, brass bars extending left for what they owe, scaled to the max absolute value, with plain-language labels like "is owed $40.00."

For settling up, I'm considering a "Record as paid" feature that actually works within the existing expense model: a payment from Ben to Ana is just a special expense where Ben pays and the full amount is split only to Ana, canceling out their balance. It's elegant and genuinely useful for real settling, though it would add an extra expense entry to the list, which adds some complexity to think through.

This feels like a worthwhile closure signal for the "settle up" flow rather than scope creep. For empty states, I want a friendly message when there's no one on the trip yet, and I'm weighing whether the expense form should be disabled or just left enabled with an empty payer field until people are added.

I'll keep inputs enabled but make the payer select show a disabled placeholder like "Add people first" when there's no one yet, with a note near the split section and an error if someone tries to submit anyway — simpler and more robust than disabling the whole form. I'm also drafting empty-state copy for the expenses list and balances view, thinking through whether balances should show as "$0.00, all even" when people exist but no expenses have been logged.

For settle-up with nothing to transfer, I want distinct messages for "no expenses at all" versus "expenses exist but everyone's already even." For money formatting I'm leaning on Intl.NumberFormat for CAD-style amounts, and debating whether negative balances should show as "owes $12.50" in words plus the absolute value, or whether tests expect the literal signed "-$12.50" text.

I'll settle on "Paid $30.00 · Share $42.50" since test authors likely just check data-cents values rather than exact signed formatting.

Now thinking through the interaction design: the people form submits on Enter, clears the input, keeps focus for rapid entry, and announces additions via a status region; the expense form needs a description field, a dollar-prefixed amount input, a payer selector, and a split fieldset with checkboxes.

I'm also weighing adding "All"/"Clear" quick-toggle buttons for the split selection (must be type="button" so they don't submit the form), and considering whether to style the checkboxes as chips while keeping them accessible -- worried that visually hiding the native input could cause Playwright visibility checks to fail depending on how it's hidden.

I'm not fully certain Playwright's hit-target logic forgives labels wrapping inputs, so the safest approach is to keep the native checkbox visible and clickable with accent-color styling and a larger size, wrapped in a label with the chip name — robust and accessible. For the payer field, I'll use a native select styled with a custom arrow.

For the amount field, I'm using a text input with decimal inputmode, autocomplete off, a visual "$" prefix, and an aria-describedby hint for currency format. On successful submit, I'll add the expense, reset description/amount/split while keeping the payer, refocus description, and announce the addition via live region. Keyboard focus will rely on native controls with a visible focus-visible outline, and I'm double-checking text contrast ratios like ink-on-canvas colors.

Finishing that calculation gives L≈0.1159 for the secondary text, yielding contrast ratios around 5.6 against canvas and 6.3 against white—solid enough, so I'll settle on #4A5D6B for safety. Now I'm checking the canvas color #F4F0E8's luminance to confirm its contrast role.

Working through it, canvas luminance comes out to about 0.8739, which means Signal blue on canvas only achieves a 4.40 ratio—failing AA for normal-size text. So I need to restrict Signal to white cards or large text only, and for error states I'll switch to a darker red, #A63B23, and start computing its luminance.

Checking #A63B23 against both white and canvas backgrounds gives ratios of 6.4 and 5.65, both comfortably passing AA—so that's my error-text color. For buttons, Signal with white text hits 4.99 against white (passes for normal text), with a darker hover state also passing; Harbour with white text works for secondary buttons. Now I'm settling on card background colors, likely white or a near-white cream tone.

Testing #FFFCF7 as a warm paper background, Signal text against it still passes at 4.88. Moving to the owed/owes palette, I'm considering a teal "Tide" color for positive balances—working through contrast calculations for a darker tide variant against white to see if it's usable for labels.

Finishing that contrast check gives roughly 7.2 against white, which passes fine. For the settle-up bars, brass works well for "owes" since it's warm and neutral like nautical fittings, while tide blue suits "owed" — neither feels alarming, and zero balances can just read "Even" in the secondary harbour tone. Now I'm sketching the settle-up row layout itself, like "Ben → Ana" with the amount shown alongside.

I'm deciding to include plain-text screen reader content like "Ben pays Ana $42.50" alongside the visual arrow layout, and adding a small secondary "Mark paid" button that wraps on mobile. For expense list items, I'm settling on showing description, amount, and a meta line like "Ana paid · Split between Ana, Ben, Cy · $33.33 each" while skipping the date to keep things simple. I'm also working out the remove button's small ghost styling and its descriptive aria-label.

For the aria-label, I want it to start with the visible "Remove" text to follow accessibility naming conventions, so "Remove Dinner" works fine. I'm placing the undo notification inline at the top of the expenses list rather than as a fixed bottom bar, since that's simpler and more accessible, and after deletion I'll move focus to the Undo button so keyboard users can continue naturally from there.

I need to show a trip total summary excluding payments, mark settle-up payments with a distinct "Payment" tag and description like "Ben paid Ana back $42.50", and add a quiet confirm-protected "clear trip" action at the bottom along with an honest note that everything is saved locally in the browser only.

Now thinking through layout: a compact header with wordmark on the left and a small "saved on this device" status on the right, keeping it tool-like rather than playful. Section cards should use a subtle 1px border, modest radius, and restrained styling rather than heavy shadows, with headings set in Fraunces.

I'm deciding on numbered step markers for the three sections -- "Who's coming," "Log an expense," "Where everyone stands" -- with settle-up folded into the standings view, and sketching the markup for each balance row showing name, amount owed, a visual bar, and paid total.

Now I'm working out the bar visualization with a centered track, plus the transfer list markup for settle-up suggestions showing who pays whom with a "Mark as paid" button, and thinking about how tests might check the transfer text.

I also need the settle algorithm to produce no more transfers than necessary—first matching exact debt/credit amounts directly, then falling back to a greedy approach for the rest.

Exact match zeroes out two people per transfer, and the greedy remainder adds at most k-1 transfers for k nonzero balances, so the total stays bounded by n-1 overall. I'm now working out transfer ordering for readability, then moving to computing balances per expense by tracking what each payer contributed versus their share, splitting shares evenly with remainder distributed by order.

For the data model I'm defining a state shape with versioned people and expenses, where expenses store description, amount, payer, split participants, kind, and timestamp—kept chronological internally but shown newest-first, with undo reinserting at the original index. IDs combine a timestamp and random string, and on load I'll validate that referenced payer and split IDs actually exist and amounts are valid positive integers before trusting the saved data.

For rendering, I need to avoid resetting user selections on re-render—only refresh form controls like the payer select or split checkboxes when the people list actually changes, preserving prior choices by id. I also need to handle focus explicitly after removing a person, since re-rendering the list would otherwise destroy the focused button; I'll move focus to the next remove button or the name input and show a status message confirming the removal, while only allowing removal when the person has no linked expenses.

Now I'm worried about test assumptions: if each person's list item includes a "Remove" button, the combined text content would be "AnaRemove" rather than just "Ana," which could break exact text-match assertions like toHaveText(['Ana','Ben']). I need to structure the markup so the name and remove button have separate test identifiers to avoid that mismatch.

Maybe monograms could help scanning in balances too, but I'll keep it simple with initials in the people list. I'm sketching the payer dropdown and split checkboxes using names as values, then drafting the validation messages for people (empty name, duplicate with a helpful suggestion, name too long) and starting on the expense validation order, beginning with requiring at least one person before an expense can be added.

Now I'm working through the remaining expense validation messages in order: empty description, empty amount, non-numeric amount, zero or negative amount, too many decimal places, and finally capping the maximum allowed amount, debating whether to cap at a round number like $1,000,000,000 or something tighter.

8. Payer not selected: "Choose who paid."
9. No split selected: "Choose at least one person to split this between."

I also need to decide the order of checks when an amount has too many decimals and is also ≤0, like with "0.001".

Writing parsing logic...

I'm checking more edge cases like "12,50" which fails the pattern and returns nan, and deciding how to handle decimal precision quirks like "12.500" with trailing zeros—I'll treat those as invalid since they're written with more than two decimal places. I'm also settling on description field validation, keeping it required with a trim and a reasonable max length around 100 characters.

Now I'm moving to visual design: setting a canvas background color, and considering a Harbour-colored header band with the wordmark rendered in canvas color for brand presence, plus a compact header height and accent mark styling.

For the heading structure, I'm making the wordmark itself the h1 inside the header, with a short supporting subtitle like "Split trip costs evenly. See who owes whom," rather than marketing copy. Then I'll add a summary strip showing trip total, number of people, and expense count near the standings section.

For layout, I'm setting up a max-width container with responsive padding and a two-column grid at wider breakpoints, with cards styled in a warm off-white with subtle borders and rounded corners, each featuring a step number badge plus heading.

For input fields, I'm settling on a 44px touch-friendly height with a warm gray border color, checking the contrast ratio against both the paper background and white to make sure it passes accessibility thresholds—landing on #857F72 which gives good contrast against both.

Now I'm thinking about focus states, deciding to use a Signal-colored outline with offset for visibility, and planning button hierarchy: Signal color for the primary "Add expense" action at 46px height, while debating whether "Add person" should use Harbour navy instead to avoid having two competing primary colors.

"Mark as paid" becomes outline Harbour and "Remove" ghost text, keeping one hero action per screen. I'm weighing whether a Signal focus ring against a Signal button feels distinct enough, considering a two-tone ring or switching to Harbour-dark with offset so it reads clearly against both light and dark backgrounds.

For contrast, a 3px Signal ring with 2px offset actually passes WCAG 2.4.11/13 comfortably since the gap still clears 3:1 against the card background. For the split chips, I'm using checked-state styling with a Harbour tint background and border, relying on `:has(input:checked)` which now has broad browser support, with the checkbox itself as a safe fallback. I'm also adding small "Everyone"/"No one" quick-action text links beside the legend.

For the amount field, I'm adding a dollar-sign prefix positioned absolutely inside the input wrapper with adjusted padding, plus a muted "CAD" suffix for currency clarity. Then I'm working out the expense form grid so amount and payer fields sit side by side even at a 360px viewport, checking that the math for two ~140px columns with gaps actually fits within the padded card width.

For the expense list item, I'm sketching a layout with a main block showing description, payer and split metadata, and a per-person share line, alongside a side block with the total amount and a remove button—using Intl.ListFormat to naturally join the names of who the expense is split between.

I'm also thinking through edge cases: how to phrase single-person splits ("for Ana only"), avoiding pronoun ambiguity when the payer is also the sole recipient, and steering away from "everyone" phrasing since group membership could change later.

Now I'm handling text overflow for long names and descriptions using overflow-wrap and min-width resets so nothing scrolls horizontally at narrow widths. For payment items I'm settling on a small "Payment" pill tag with description like "Ben paid Ana" and metadata noting it was recorded from Settle up. I'm sketching the Balances/standings section structure, including the header, a summary line showing expense and people counts, and a balances list.

For the Settle Up section I'm considering making it a visually distinct dark Harbour-colored card to emphasize it as the "answer" of the trip, checking contrast ratios to confirm white text works well on that background while avoiding Signal-colored text there due to poor contrast, and thinking a light peach accent could work instead.

For the focus ring on dark backgrounds I need a different approach since the standard Signal ring fails contrast against Harbour, so I'll use a lighter signal tone there with a per-context focus variable. I'm now working out the right column ordering — likely Balances leading into Settle Up since showing where everyone stands first, then the resolution, feels more logical than leading with the answer.

Actually reconsidering: since the settle-up list directly answers "who owes whom," I'll put it first as a dark card, followed by Balances then Expenses, keeping DOM order as People, Add expense, Settle up, Balances, Expenses for accessibility. I'll keep the empty-state settle-up card compact so it doesn't feel too heavy, and make the header light canvas with the wordmark in Harbour so I'm not stacking two large navy blocks.

For the header, I'm adding the mark plus "Even Keel" in Fraunces with a tagline, and a trip total stat shown in Fraunces on the right (stacking below on mobile). For the balances section, I'm using a thin Signal-colored vertical line as a visual "keel" representing zero, with bars for owed/owes on either side and a small legend clarifying the left/right meaning.

For typography, I'm setting base text at 16px/1.5 line-height, Fraunces for headers and the big trip total number, and Public Sans with tabular figures for money values in lists. I'm sticking to just the opsz and wght axes for the Fraunces Google Fonts import rather than dealing with the more complex SOFT/WONK variable axes.

Building the font import URL with variable weight ranges for both Fraunces and Public Sans, plus preconnect links for performance.

Now I'm starting the main JS module, setting up currency formatting helpers and a localStorage-backed state loader with an undo mechanism for deleted expenses.

I'm writing a sanitize function that validates loaded data, deduplicating people by id and name, then continuing on to clean and validate the expenses array similarly.

Adding the save function with a persisted-state indicator, then setting up share calculations that order people and split amounts evenly across each expense.

I realize I need to separate expense-based paid/share from actual payments sent/received, so the balance becomes paidExp minus shareExp plus sent minus received, with the meta text showing both expense totals and payment adjustments separately for clarity. Now I'm moving on to building the render functions for people and other UI sections.

For the split checkboxes, I'm figuring out how to preserve their checked states across re-renders by reading existing checkbox values from the DOM before rebuilding, defaulting new people to checked and resetting everything after a successful expense submission. I'm also handling the payer selector so it keeps the previously selected person, defaults to the first person if none chosen, and shows a disabled placeholder when the people list is empty, mapping names back to ids on submit.

Now I'm writing the person form submit handler, which trims and validates the name, checks for duplicate names (case-insensitive) and suggests adding a last initial if there's a conflict, then adds the new person to state and saves.

I'm also designing clearer duplicate messaging and planning showError/clearErrors helpers that insert error text near the relevant field, set aria-invalid and aria-describedby for accessibility, and focus the problematic field so screen reader users get immediate feedback.

For the "no people" expense case, I'm weighing where to place the error — decided to show it in a general slot within the expense form itself and keep focus on the submit button rather than jumping focus up to the people section, since the live region announcement should suffice.

Now I'm wiring up input listeners so each field clears its specific error on change, then writing the submit handler: prevent default, clear errors, check for people first, validate the trimmed description, validate and parse the amount, then look up the payer by matching the selected name.

I'm continuing validation by checking a payer was selected, then gathering checked split checkboxes to find which people are included, failing if none are checked. I'm also thinking through accessibility for the checkbox group error—whether to put aria-describedby on the fieldset or each checkbox, and considering a live region to announce the split error since focus moves to the first checkbox.

I'm deciding to use role="alert" or an aria-live region with polite announcement so the error message gets read without double-interrupting the focus announcement, settling on polite to avoid conflicting with the screen reader's focus change announcement. Now I'm starting on the delete expense handler, setting up an event listener on the expense list.

Writing event handler logic... I also need to handle undo by reinserting the removed expense at its original index, but I'm realizing that deleting an expense could leave a person unreferenced, which might allow them to be removed elsewhere even though the undo could bring back a reference to them.

The simplest fix is to clear the undo state whenever a person is removed or another meaningful change happens, rather than letting it persist indefinitely as clutter — essentially any action besides undo itself invalidates the pending undo.

For the settle-up button, clicking it should push a new expense record representing the payment (payer, recipient, amount, kind "payment"), announce confirmation, then move focus to the next relevant button. I'll label it "Mark as paid" with a descriptive aria-label including names and amount, keeping the visible text concise.

I'm also thinking through focus management after re-renders: actions should only rebuild the parts of the list that actually changed, so inputs and checkboxes don't lose focus unnecessarily, and split checkboxes shouldn't rebuild unless the people list itself changes.

Better approach: only rebuild the split UI when the set of people actually changes, comparing a signature of ids against the last one, which avoids losing focus unnecessarily—same logic applies to the payer select. I'm also deciding where to put the testid for the split container, keeping buttons outside the checkbox wrapper, and planning the expense list to render newest-first and the balance bars scaled by the max absolute amount.

For the summary header I want a trip total plus a "N people · M expenses" line, and I'm working out the settle-up copy for each state—no people, people but no expenses, pending transfers, and everyone settled—aiming for a direct "you" voice rather than "we".

For balance labels I'm settling on phrasing like "is owed $40.00", "owes $12.50", "is even", with a meta line like "Paid $120.00, share $80.00". I want a gentle hint under the Balances heading reframing owing as normal, something like "Owing just means someone covered you for a while," plus a people-section hint to add everyone including yourself, and a small honest note that leftover cents from equal splits go to whoever was added first.

Defining color variables for the harbor and signal palette...

Checking contrast ratios for the ink-soft text color against the paper background to confirm accessibility.

Checking harbour's dark-mode ratio comes out to about 6.86, which passes. Now I'm computing luminance for the on-dark signal color #F2B7A5 to verify its contrast against the dark background.

Moving to the bar colors: verifying tide (#3B7A8A) against paper gives roughly 4.7 contrast, which passes, then starting the luminance calculation for the brass accent (#B8862F).

Now I'm sketching the color coding for balance text—brass-ink for "owes" amounts, tide-ink for "is owed"—and laying out the typography scale, with Fraunces for the brand and headers, Public Sans for small-cap labels, and defined sizes for body, small text, and monetary figures.

Writing header markup...

I'm now considering whether the header should live inside the main app container, since tests likely scope queries to the main element's testid. Since the header has no test ids of its own, keeping it outside main as a semantic header should be safe.

Now I'm sketching a spirit-level icon design for the logo mark: a rounded square background with a horizontal capsule vial outline, a centered bubble, and tick marks.

Writing SVG code...

Finishing the icon with tick marks, then thinking through the balance-bar layout for each row: a centered track with owed/owes bars extending from the midpoint, and a grid structure for the desktop column widths.

I'm planning to use container queries to make the balance rows and expense items responsive, defaulting to a stacked layout that degrades gracefully everywhere. For the expense list, I'm adding dividers between items, a small tag for payments, and an undo notice above the list with a button to restore a removed item.

Since the notice is dynamically injected, I need a persistent aria-live region so screen readers actually announce it, and I'll move focus to the Undo button afterward so the message and control are both accessible. For the footer, I'm adding a simple "saved locally" status message alongside a "Start a new trip" reset link.

For the clear-trip confirmation, I'm swapping content in place with a warning message and two buttons ("Yes, clear the trip" and "Keep it"), defaulting focus to the safer "Keep it" option, then after clearing I'll move focus to the person-name input and announce the reset.

I'm also checking the layout at 360px width—accounting for padding to confirm the inner card width, making sure the people form's input and button sit side by side with the input flexing and the button staying compact, and verifying the expense form fields and chips wrap properly at that size.

For the trip stats header, I'm arranging the brand and three stats (total, people count, expense count) to wrap with flex-gap on narrow screens. The settle-up transfer rows use a grid so the name and amount sit on one line with the "Mark as paid" button below on mobile, but align into a single row on desktop; long names wrap with overflow-wrap, and the payer select truncates with ellipsis. Now I'm starting the people list markup with an avatar and row structure for each person.

Thinking it through more, I decide a wrapped chip layout works best for displaying multiple people compactly — each chip has an avatar, name, and an accessible remove button sized for easy tapping. I'll cycle avatar backgrounds through a few calm tint colors with dark ink text, using each person's first initial as the avatar content.

Now I'm writing a small DOM-building helper function that creates elements and assigns props, handling classes, text, event listeners, and attributes...

Finishing it with child-appending logic, then noting special cases like checkbox and option properties needing explicit assignment after creation, and sketching the top-level render order that recomputes balances before rendering stats, people, form controls, settle-up, balances, and expenses.

Now I'm writing the payer select renderer, which rebuilds the dropdown options from the people list, preserves the previously selected payer by id when possible, and handles the empty-list case with a disabled placeholder option.

I'm also thinking through defaults: keep the previous payer selection across re-renders, but fall back to the first person when none was selected before (like right after the first person is added). I need to compute a signature from the joined people ids to decide when to actually rebuild the select, and separately handle the "select everyone/clear" checkbox buttons and the split error state on clear.

Now I'm writing the expense list rendering, iterating expenses in reverse order, building each item's description, amount, payer/split line, and a per-person share breakdown using an order index and share calculation helper.

For splitting cents evenly, I compute a base share and remainder, phrasing single-payer cases as "covers all of it" and remainder cases as noting who covers the extra cent(s). For payment-type entries, I render a distinct item showing who paid whom, tagged as "Payment" with a note that it was recorded from Settle up.

I'm adding accessible delete buttons with descriptive aria-labels, an empty state for balances when no people exist, a hint line explaining what owing means, and a legend. I'm computing bar widths as a percentage of the max balance, rendering settle-up transfers and stats sections, and setting up a polite live region that clears and re-sets its text to ensure screen readers re-announce updates.

Writing layout grid styles...

Rather than complex grid-template-areas, I'm simplifying to two wrapper columns: one holding people and add-expense, the other holding settle-up, balances, and expenses — so mobile stacking naturally follows the DOM order while desktop splits into two side-by-side columns, with the left column sticky.

I'm considering sticky positioning for the left column but deciding against it since tall content could get stuck off-screen. Settling on a max-width wrapper with a fixed-ish left column around 420px and a breakpoint at 900px, then starting on card styling with rounded corners, padding, and borders.

Adding card header styles...

I'll number the three main stages—people, log an expense, settle up—while leaving balances and expenses as unnumbered supporting cards for clearer hierarchy. Now I'm styling the settle card with a dark harbour background and adjusting the transfer row contrast for that theme.

I'm detailing the transfer row typography and button sizing, favoring Public Sans tabular numerals and a 40px "mark as paid" button to comfortably clear touch-target guidelines. I'm also adding a calm "Everyone's even" celebration state with a level icon rather than anything game-like, and sketching the form field styles now.

Writing input and error styles...

Styling chip selection states and button base styles...

Styling expense list items...

Defining balances grid layout...

Now I'm adding a center tick mark on the track and colored fill segments extending from the midpoint—teal for owed amounts with a rounded right edge, brass for owed-to amounts with a rounded left edge. For the amount label, I'm right-aligning a small "is owed" word above the dollar figure.

I'm also thinking about a tiny legend caption beneath the balance bars explaining the left/right convention, plus a container query setup for the balances card and flexbox stats layout in the header.

For the masthead, I'm considering a subtle bottom border as a "waterline" divider, adding a visually-hidden utility class, and making sure to respect prefers-reduced-motion for transitions.

I need to track whether localStorage actually works and show a footer message confirming the save state or warning the user their changes won't persist if it fails. For the payer select, I'm styling a custom chevron arrow while falling back to the native appearance in forced-colors mode for accessibility, and now I'm working through JS details like trimming whitespace in names and handling case-insensitive duplicate checks.

Testing duplicate name rejection (including with extra whitespace), making sure rejected input stays in the field for editing, and designing the chip removal button so it's only shown for unreferenced people since removing a referenced person would affect expense calculations.

For the split checkboxes, payer select, and amount field, I'm checking they work correctly with standard locator interactions like uncheck, selectOption, and fill. After adding an expense, I'm resetting description, amount, and split selections but keeping the payer selected since re-picking it each time would be redundant, though I'm uncertain if tests expect the payer to reset to the first person instead.

For settle-up and balance data attributes, I'm making sure names and signed cent amounts are correctly attached, and using Intl.NumberFormat to produce proper currency strings. I'm also setting up error clearing logic so each error only disappears when its specific field changes.

Now I'm starting to build out the full HTML document structure with the page title and viewport settings.

Building the layout...

Still laying out markdown structure...

Thinking about the status region placement outside main, and whether placeholder text like "e.g. Priya" needs sufficient contrast—leaning toward using the soft ink color since it still passes contrast requirements.

Writing the expense form fields...

Still writing form markup...

Sticking with "What was it for?" as the label. For the legend row with select-all/clear tools, I'm figuring out the layout trick since legends don't behave like normal flex children—likely wrapping the legend text and tools in a styled div instead of fighting legend positioning.

Good, floating the legend works fine in modern browsers, so I'll go with that for the split section layout. For the buttons I'll use clearer labels like "Select all" and "Clear" instead of "Everyone"/"No one", and I'll wire up the amount hint with aria-describedby that expands to include the error message when validation fails. Now I'm starting the showError function that maps field keys to their input and error slot elements.

Writing clearError logic...

I'm wiring up input/change listeners on each field so errors clear as the user corrects them, making sure this doesn't interfere with validation that happens on submit.

Thinking through where to show the "no people" error: putting it near the Add button could scroll it out of view after the page jumps to the name input, so instead I should display it inline under the people name field and focus that input, keeping the error visible right where the fix needs to happen.

For success confirmation on mobile, I should add a small status element under the button, like "Added 'Groceries' · $84.20," using an announce call for screen readers plus a visible persistent line that stays until the next action.

Now I'm working through focus management across flows: after marking paid, focus moves to the next "Mark as paid" button or the settle heading if none remain; after removing a person, focus returns to the person input; after undo, focus should land on the restored expense's remove button found by its data-id; after deleting an expense, focus moves to the Undo button.

I'm also drafting the actual copy for each card—tagline, headings, lede text, and empty/note states for the people and expense sections, aiming for concise, specific wording.

For the settle, balances, expenses cards, and footer, I'm writing the headings, ledes, and empty-state copy, plus conditional intro text for settle-up depending on whether people or expenses exist yet.

Now I'm working out the messaging for remaining transfers and the fully-settled state, plus the balance line showing paid versus share with sent/received amounts, and starting to define what counts toward the trip's total stats.

Writing base styles...

Still writing masthead styles...

Still writing card head styles...

Now I'm sketching the person form stack layout and checking that the "Add person" button fits at 360px width alongside the input field, then starting on the people chips styling with flex-wrap and avatar-sized chip containers.

Adding chip remove button styles...

Now I'm laying out the expense form grid with responsive two-column fields on desktop, checking that the payer field and amount field with its hint text still align properly across breakpoints.

Styling the money input with a prefix symbol and suffix label positioned absolutely, plus a custom-styled select dropdown with its own arrow icon.

For the error message, I'm keeping the container's margin rather than relying on an empty-state class, since display:none on a live region would break accessibility—so the slot itself stays empty of styling when there's no error.

Switching to block layout for the field (label with bottom margin, hint with top margin) avoids the grid-gap issue of an empty slot adding unwanted spacing. Now writing the success feedback styling...

Styling dark settle-themed cards...

Writing responsive grid styles...

I'm deciding on phrasing for the transfer line — settling on "Ben pays Ana" for readability over an arrow notation — and now checking contrast ratios for a transparent button border against the dark harbour background.

I'm now defining styles for an "everyone's even" empty state, balance card layout, and uppercase payment tags.

Next up is the undo notice banner styling and a footer with flexible spacing, top border, and soft ink coloring for secondary text.

I'm also planning a danger button style for clearing data, an accessible skip link that stays hidden until focused, and respecting reduced-motion preferences while adding a subtle highlight flash animation for newly added expenses. Now I'm starting the JavaScript module, setting up storage keys and input length constraints before building out the app logic.

Writing currency formatting helpers...

Still writing helper function...

Now I'm defining computeBalances, which tracks each person's paid, share, sent, and received amounts by iterating through expenses and splitting payments versus shared costs according to the computed order.

Still writing people list rendering...

Rebuilding the payer dropdown options...

Now I'm regenerating the split checkboxes, preserving previous checked states where people still exist and defaulting new ones to checked, then handling the reset case by checking all boxes.

I'm toggling visibility of empty-state and tools based on people count, keeping the payer select enabled even when empty, and building the expense list by iterating expenses in reverse order with lookups for people and ordering.

Now I'm writing the expenseItem function, handling the "payment" kind specially by labeling it as a payer-to-recipient transfer tagged "Payment" with a note that it was recorded from Settle up...

For regular expenses, I'm setting the title to the description, building meta text showing who paid and how the expense was split (either "for X only" or "split between" multiple names), and computing a share breakdown per person. I settle on phrasing like "Ana paid · split between Ana, Ben, and Cy" as natural enough, and confirm the title array format works fine with my h() helper since it flattens arrays.

I'm now writing the shareText function, which handles dividing the expense evenly among participants, distributing any leftover cents to the first few people, and phrasing the remainder as "covers the extra cent" for one person or "each cover an extra cent" for multiple. I check edge cases like a single payer or a tiny amount like $0.01 split three ways, both of which produce sensible output.

I'm moving to renderBalances, which checks if the balances list is empty and shows an empty message while hiding the legend, then computes the max absolute balance and classifies each person as "owed," "owes," or "even" to generate descriptive wording...

Adding balance item markup...

For the even case I'm debating whether to still show "$0.00" alongside "is even" for visual consistency, and I think I'll keep the amount displayed as $0.00 rather than omitting it.

I'm structuring the row so the name sits on the left, with a stacked label ("is owed"/"owes"/"even") plus amount on the right, followed by the progress bar and meta line, making sure the screen-reader text reads naturally like "Ana is owed $40.00, paid $120.00, share $80.00" since the avatar is hidden from accessibility.

Now I'm writing the settle-up renderer, filtering out zero balances, computing transfers, and setting an intro message that changes depending on whether there are no people yet, no expenses logged, or no transfers needed once balances are settled.

Writing transfer list items...

Writing the mark-paid handler...

I realize there's a subtle bug: since renderUndo runs on every renderAll call, re-rendering identical undo notice content inside an aria-live region could re-announce it repeatedly to screen readers. I should check whether every state change actually clears the undo state to avoid stale re-announcements.

For the undo button itself, I'm validating that the people involved in the restored expense still exist before splicing it back into the expenses array — if someone was deleted, I cancel the undo and announce a failure instead; otherwise I restore the expense, commit, flash it, and announce success.

Since any state change clears the pending undo, removing a person naturally invalidates undo too, so that check is more of a safety net. For the remove-person handler, I'm blocking removal if the person is still referenced anywhere, otherwise filtering them out of state, clearing undo, committing, and announcing the removal while refocusing the input. I'm now setting up the reset flow, starting with a click handler that shows a confirmation step.

Writing reset confirmation logic...

I'm also handling visibility of the reset button based on whether the trip has any data, resetting the confirm view back to idle if it gets hidden mid-confirmation, clearing the expense form fields on reset, and building an announce function that clears then resets the live-region text with a short delay so screen readers reliably pick up the message. I'm setting up a similar polite live-region feedback element for expense submissions.

Now I'm adding a brief highlight animation for newly added expense items by tagging the rendered list item, then clearing that flag afterward. I'm also wiring up a storage event listener so that if the app is open in multiple tabs, state changes in one tab reload and re-render in the other, while trying to avoid unnecessary rebuilds when the people list hasn't actually changed.

I'm double-checking the footer save-status text for warning states, confirming the initial render call, and verifying the test IDs for the people list and expense-split chips container work correctly with checkbox interactions in Playwright.

Now I'm drafting the amount input's validation messages—covering empty, non-numeric, non-positive, too many decimals, and overly large values—each with clear, specific wording guiding the user to the correct format.

I'm also writing description validation (empty and too-long cases) and person-name validation, including handling duplicate names with a friendly suggestion to add a last initial if it's actually a different person.

Then I define messages for missing payer, missing split selection, and no people on the trip. I walk through a concrete test case—Ana, Ben, Cy splitting a $100 dinner—computing share amounts, balances, and then working through the greedy debt-settlement algorithm to generate transfers between them.

I continue verifying edge cases: uneven splits, unchecking a participant, the data-cents attribute format, deletion zeroing out balances, and localStorage persistence surviving a reload while undo state doesn't need to. I also check that names with special characters like apostrophes work correctly when set as attributes and queried via CSS selectors in tests.

I'm now confirming that newly added people default to being checked in the expense split, that form controls rebuild correctly when the people list changes while preserving existing selections, and that submitting the form via Enter key or button click both trigger properly.

I decide to skip native `required` attributes and instead use `aria-required="true"` on description and amount fields for accessibility, keeping `novalidate` to avoid browser validation bubbles. Writing the container query CSS for the balance layout...

Still writing balance styles...

I'm adding a legend below the list showing owes/even/owed indicators, considering whether to mark it aria-hidden since the textual info is already conveyed elsewhere for screen readers.

Now I'm setting avatar size at 30px for balances and structuring the expense item layout as a grid with areas for description, amount, meta info, and details/actions...

Still writing styles...

Drawing a pill-shaped level icon with a center circle, then defining the brand mark as a 40x40 rounded square containing it. Now I'm checking the masthead stats layout on mobile, with three stats in a row sizing the trip total and smaller people/expense figures.

I'm reconsidering whether a skip link is needed — since the header lacks interactive elements, I decide to drop it since the form is first anyway. I'm also weighing dark-card heading colors, the count badge, and whether forced-colors mode needs special border handling for chips and bars.

For fonts, I'll rely on automatic optical sizing for Fraunces rather than manual variation settings, and use tabular numbers for Public Sans. Now I'm ready to start writing the full HTML document carefully for correctness.

Writing the document head...

Writing the header markup...

I should drop the aria-label on the stats dl since it isn't well supported. For the settle section, I'm structuring a card with a step badge, heading, a body container for JS-rendered content, and a list to hold the computed payment transfers.

Writing more markup...

I'm also thinking about how the expense count should be announced to screen readers—whether to fold it into the heading text or keep it as a separate visually-hidden label so it reads naturally as "Expenses, 3 logged."

For the empty state, I'm styling it with a dashed border and soft ink coloring to make it feel like a gentle placeholder rather than an error. Then I'm starting on the footer markup with a save status indicator and a reset area that toggles between an idle "Start a new trip" button and presumably a confirmation state.

Adding the reset confirmation dialog...

Now I'm moving into the main script, starting with the IIFE wrapper and setting up strict mode.

Setting up storage keys, formatting limits, currency formatting with Intl.NumberFormat, and a list formatter for joining names together. Starting to define an avatar color palette for user identification...

Adding SVG icon definitions...

Still writing SVG icons...

Now I'm setting up element references by grabbing DOM nodes via their IDs for the stats display.

Still mapping DOM elements...

Now I'm writing load and save functions that read and write trip data to localStorage, falling back to an empty trip if storage fails or data is corrupted, and updating a save-status indicator accordingly.

I'm adding a name-cleaning helper to normalize whitespace, then working through the debt-settlement algorithm: separating balances into creditors and debtors, then greedily matching debtors to creditors with equal outstanding amounts to generate minimal transfers. I need to guard against empty arrays causing Math.max to return -Infinity.

The exact match pass looks correct since debtors iterate in order and match the first creditor with equal amount. Now I'm writing the form submit handler for adding a person, validating the name length and checking for duplicates...

Adding more validation...

Then I gather the checked split participants, require at least one, and build the expense object with a unique id, amount, payer, and split list before pushing it to state, clearing undo, flashing the new row, and committing with a split reset. Finally I reset the description and amount input fields.

I should double check whether checkbox split should match by value or data-id since both exist, and consider wiring an input listener on the expense form to clear feedback messages as the user starts typing again after submission.

Now I'm mapping each error field (person, desc, amount, payer, split) to its corresponding slot and target element so showError can locate where to display and focus.

The showError function clears existing errors, inserts an alert icon and message into the right slot, wires up aria-describedby for accessibility, and marks the invalid field (or group) appropriately while tracking the active error state.

I'm also defining clearErrors to reset all invalid states, remove ARIA attributes, and restore the original aria-describedby value. I'm noting the error slot uses aria-live polite so screen readers announce the message, but I need to handle the edge case where the split fieldset has no single focusable target.

Now I'm adding input/change listeners on each field so their error states clear as soon as the user starts editing, plus a broader input listener on the form to clear general feedback messages.

Adding split-all/split-none button handlers and a showFeedback function that displays a success message with a checkmark icon...

Adding delete/undo logic...

I'm adding the click handler for marking a transfer as paid, which looks up the payer and payee by their IDs, validates the amount, then pushes a new payment expense recording that transfer.

Adding save status text...

I'm wiring up reset handlers that hide the reset area when the trip is empty, defining a central renderAll function that recomputes balances and refreshes all UI sections, and setting up a cross-tab storage listener to keep tabs in sync.

I also want to verify storage availability on initial load by testing a write, and make sure a cleared or sanitized trip falls back gracefully to the empty state. Now I'm writing the settle rendering logic, handling the case where there are no people yet.

Finishing the settle view code...

I want the copy to use proper typographic apostrophes, and I'm settling on messaging for the empty-people case: a lead like "Who pays whom shows up here" with a sub nudging users to add people and log expenses.

I'm thinking through edge cases too — once everyone's settled up, the UI should show a satisfying "Everyone's even" message; the balances list should handle empty states gracefully (no people vs. people with zero expenses); and I'm double-checking that my helper function correctly handles null attributes when building elements.

Now I'm writing the icon helper to render an inline SVG with aria-hidden, and an avatar function that picks a background/foreground color pair based on the person's index in the trip order, matching their position in the balances list. I'm also verifying the avatar color contrast meets accessibility standards by calculating luminance values for the color pairs.

Setting stat dd font sizes responsively, then writing out the full CSS with color variables for harbour, signal, canvas, and line tones...

I'm verifying the contrast ratio calculation for a color against both dark and white backgrounds, confirming it passes accessibility thresholds. Now I'm checking hover and focus states for inputs on the dark card variant, then moving to finalize the HTML markup, double-checking button widths and labels like "Add person" at smaller screen sizes.

I'm also considering a subtle design touch — a thin horizontal stripe at the top of the page resembling a hull line, using a gradient to create a short accent segment within the harbour color band.

Now I'm finalizing the expense count pill next to the "Expenses" heading, and writing the function that renders each expense item, handling the special case where the entry is a payment between people (showing names, a "Payment" tag, amount, and a note it was recorded from settling up).

Finishing the list item markup...

I notice the "Payment" tag text would run into the payer line without a space, so I need to insert a space before the tag to keep it readable for screen readers. I'm also double-checking the aria-label naming, array flattening in the helper, and confirming the remove button's touch target meets the 32px minimum.

For the layout, I'm reconsidering the grid areas—putting the remove button spanning the meta and detail rows on the right, aligned vertically, so when there's no detail row it just leaves a small empty gap rather than breaking alignment.

I'm also adding a highlight animation for newly-arrived expense entries, using negative horizontal margins plus matching padding so the background flash extends edge-to-edge instead of hugging just the text.

Respecting reduced-motion preferences, I'm making sure the chip component still works without `:has` support by letting the checkbox show its own state, while using `:has` where available to move the focus outline from the input onto the chip itself. I confirm the whole label area is clickable since it wraps the input, then move on to considering whether Fraunces supports tabular numerals for the masthead stats.

Now I'm settling on mobile heading sizes, label markup conventions, and finalizing the actual copy for the expense card: the lede text, the split-hint explaining how leftover cents get distributed, the amount placeholder format, and labels for "Who paid?" and "Split between." I also check how the masthead stats row wraps at a 360px viewport.

I'm then verifying width math for the settle-up transfer rows at narrow screens, confirming names and buttons wrap correctly, checking the balance rows and chip layouts hold up, and making sure very long unbroken names get overflow-wrap handling everywhere they appear.

Checking that dropdowns and chips with long names don't force horizontal overflow, and confirming the layout avoids fixed min-widths that could cause scrollbars. I'm also matching this against key test requirements—rejecting invalid names and expenses with clear inline errors while preserving user input.

I verify error-display logic clears previous errors before showing new ones, and confirm the currency formatter handles negative zero and CAD formatting correctly. I'm also adding a noscript fallback message and checking the container query CSS syntax before finalizing everything.

Writing the HTML structure and base styles...

Writing masthead styles...

Writing layout grid styles...

Now I'm planning to write out the full JS carefully afterward and double-check edge cases, like making sure the payer dropdown correctly sets its value when a previous selection no longer exists among the options.

Writing reset area logic and handlers...

I don't need pagehide handling. The usedIds helper correctly collects payer and split IDs into a set, and the removal messaging and focus behavior check out. I'm also confirming small details like the Fraunces font weight range, optical sizing default, and icon coloring before writing out the complete final code.

Writing track and legend styles...

Now I'm settling small details: the person-name label, button labels for desktop (Harbour for add person, Signal for add expense), select font-size, and the announce helper using the screen-reader element. I'm also double-checking the initial form render handles an empty payer list safely, then drafting the final empty-state messages for settlement and expenses before writing out the complete file.

Finishing with the last placeholders: people empty state says "No one's on the trip yet. Start with your own name." and split empty state says "Add people above, then choose who shares this cost." I also want "e.g." style placeholders for expense description and name fields, and I've confirmed the Google Fonts usage is fine. Time to write the whole thing out and review it.

