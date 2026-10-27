I'm planning the structure for the HTML app: handling people entry with validation, and expense entry with amount validation, payer selection, split checkboxes, and distributing leftover cents fairly to the earliest-added selected people.

For balances, I'm using data attributes to expose values for testing, and implementing a greedy settle-up algorithm that pairs the largest creditor with the largest debtor to minimize transfers. I'm also weighing whether to allow removing people, leaning toward skipping it since it adds complexity around existing expenses, though a typo would leave someone stuck.

I'll skip person removal to keep the text content clean and avoid breaking exact-text assertions. Instead, I'm considering a "Clear trip" or "Start a new trip" button, but native confirm() dialogs are risky with automated testing since Playwright auto-dismisses them—so I'd need an in-page two-step confirm instead, which adds some complexity but keeps it testable.

For the person display, I also want to avoid adding a visual initial circle whose text would merge with the name in textContent; I'll make any decorative initial an aria-hidden span so it doesn't interfere with exact name matching.

For balance, transfer, and expense elements, I'm planning testid-based data attributes (person, cents, from/to) alongside readable text content like "Ana pays Ben $12.50" or showing description, amount, payer, and split names for expenses.

I'm deciding to explicitly list names for splits ("Split 3 ways: Ana, Ben, Cy") rather than vague wording, adding a delete button with aria-label, and handling form errors by only rendering the error element when an error exists—removing it from the DOM rather than just hiding it, so tests checking element presence work correctly.

I'm also making sure only one error shows at a time globally, clearing the other error whenever a new one is set or a submission succeeds, to avoid strict-mode violations in tests that query a single error element.

I'll clear it via an input event on the form itself. I also need to avoid re-rendering the whole app on every state change since that would blow away focus and typed values—better to only re-render the lists and derived UI (payer select, split checkboxes, expenses, balances) while leaving form inputs alone, and when a new person is added, default them to checked in the split while preserving everyone else's existing checked state.

After a successful expense add, I'll reset the description and amount fields and reset the split back to everyone selected, but leave the payer selection as-is since tests likely set it explicitly each time, then return focus to the description input. I'm weighing whether the payer select should have an empty placeholder requiring validation, versus defaulting to the first person.

I'll default the payer select to the first person rather than using a placeholder, since tests likely expect a payer to already be chosen by default. I also need to handle the case of too few people—allowing expenses with at least one person but showing an empty state message prompting users to add people first if there are none.

I'll disable the split and payer controls with helper text pointing users to add people first, and block submission with a clear error if none exist. For validation order, I'll just surface the first error encountered (description, then amount, then payer, then split) rather than listing all errors, and I'm leaning toward a text input with decimal inputmode for the amount field rather than a native number type.

The reasoning is that type=number breaks Playwright's `fill` with non-numeric strings, which could trip up tests expecting to type arbitrary values like "abc" or malformed decimals -- so a plain text field with decimal formatting handled manually is more robust. I also need to decide whether to tolerate comma-separated or dollar-prefixed amounts during parsing.

I should also accept ".5" style inputs. I'm defining distinct error messages for empty input, non-numeric input, too many decimal places, and non-positive amounts, plus a cap around $999,999,999.99 to guard against unreasonably large values, and I want to parse everything into cents carefully to avoid floating-point rounding issues.

For splitting, I'll sort selected people by trip order, divide total cents evenly, and distribute the remainder cent-by-cent to the first few people in that order. Expenses will be stored as objects with id, description, cents, payer name, and split list, using names directly since they're unique and people aren't removed; I'll render newest-first by reversing the array rather than relying on timestamps. For balances, each person's paid amount minus their share gives their balance, and these should always sum to zero across everyone.

I'm now thinking through tone for displaying balances: positive balances read as "is owed," negative as "owes," and zero as settled, but I want to avoid alarming red coloring for debts since owing money between friends is normal, not a problem. Since Signal (red-orange) is likely the primary accent/error color, I need to be careful not to let it imply "owing is bad" — probably better to keep owing text in neutral navy and reserve any accent color for being owed, avoiding a simplistic good/bad green-red scheme entirely.

I'm settling on assignments: Harbour navy for text, headers, and primary buttons; Signal reserved for accents like the logo mark and error text, since a warm red-orange reads naturally as an error state while staying distinct from navy. Now I'm checking contrast ratios, working out the luminance of Signal against the cream background to confirm it's accessible for things like focus rings.

On cream background, contrast comes out to 4.47, just under the 4.5 AA threshold, so I need a darker Signal variant for text. I'm calculating the luminance of a darker red candidate like #A53A22 to check if it clears the bar.

Finishing the calculation, this darker shade gives contrast ratios of 5.83 on cream and 6.5 on white, both passing comfortably—so I'll use something like this "signal-ink" tone for text. White text on the base Signal color also passes AA, so a Signal button with white text works fine; now I'm deciding which color should be the primary button, leaning toward Harbour navy.

For the color system, I'm thinking navy stays primary for most actions while Signal gets used sparingly—maybe the logo mark, settle-up amounts, errors, and focus rings, checking that focus contrast holds at 3:1 against cream. I'm leaning toward keeping "Add expense" in navy but using Signal specifically to highlight the settle-up transfer amounts, making that card visually distinct as the "action" moment in the app.

Now I'm settling on the actual palette values: a deep navy harbour tone with a darker hover state, a warm red-orange signal color with a slightly darker ink variant for text, and a cream/sand paper background.

Checking contrast ratio confirms it passes well against the cream background, so now I'm computing luminance for a sea-green "tide" color to use for positive/owed amounts, verifying it reads clearly on the cream card.

For the balance bars, I'm thinking a diverging layout centered at zero makes sense: green for owed on one side, and a muted slate-blue for owes on the other, making sure that color also clears the 3:1 contrast threshold against the background.

A diverging bar actually fits the "even keel" brand nicely — a center keel line with balances extending left or right proportional to magnitude. I'm thinking each row shows name/descriptor on the left, amount on the right, with a track below showing a center tick and fill extending toward owing or owed.

For typography, I want something steady and quietly confident rather than playful or corporate-bank — considering serif headings like Fraunces, Newsreader, or Source Serif 4 paired with a clean sans body like Public Sans or IBM Plex Sans.

Weighing options for the heading font — Fraunces has warmth and editorial character, Newsreader feels more journalistic, Libre Franklin reads as honest and sturdy. I'm leaning toward Fraunces at a moderate weight for headings, giving it the feel of a ship's ledger, paired with a tabular-figure sans for the numbers.

I'll settle on Public Sans for its plain, neutral, government-designed feel, paired with Fraunces for display elements like the wordmark and headings, keeping amounts in Public Sans with tabular numerals for consistency.

Settling the font settings, I'm now planning the page layout: header with wordmark and trip summary, then deciding how to order People, Add expense, Balances/Settle up, and Expenses list across desktop two-column and mobile single-column views, prioritizing settle-up visibility.

Actually spanning the standing panel across rows would mess with row heights, so I'm reconsidering: wrap the stacked sections in a column container and use `display: contents` on mobile so ordering can be controlled independently, while switching to a flex column on desktop.

Since content could exceed viewport height, I'll skip sticky positioning on col-b. I'm also debating section ordering within that card — whether "Balances" or "Settle up" comes first — and leaning toward keeping Balances first as the explanation before the action, possibly combined into one "Where you stand" card with subsections.

Now I'm sketching the header design: a simple navy wordmark mark for "Even Keel," considering a minimal SVG badge with a hull-like half-disc shape and a small pennant or waterline detail to keep it clean and nautical.

Finishing the sailboat icon shapes. For the header, I'm thinking a wordmark "Even Keel" on the left paired with a compact summary strip showing spent, people, and expense counts to give quick context without cluttering the layout.

I won't worry about test text collisions since locators should be scoped by testid anyway. For the tagline, I want something plain and direct like "Log what you spend. Even Keel shows who owes whom so everyone ends up even." Then for section copy, the People section gets a simple header like "Who's on the trip" with clear field labels.

For the empty state, something like "No one's here yet. Add the people on your trip, starting with you," plus a small hint explaining that uneven splits assign leftover cents to whoever was added first. For the expense form, I'm thinking fields like Description with a placeholder example, Amount with a currency prefix, a "Paid by" selector, and a "Split between" checkbox group, maybe with a select all/none shortcut.

Since tests expect the split container to hold exactly one checkbox per person, I'll keep the select-all control as a separate button outside that container rather than adding an extra checkbox inside it, toggling its label between "Select all" and "Clear all" depending on state. I'll also add a small live preview beneath the split showing how the amount divides among selected people.

I'll keep this display-only for transparency, using something like Intl.ListFormat for natural name joining with a fallback. For each expense item, I'm showing the description, amount, and a meta line like "Paid by Ana · Split between Ana, Ben, Cy" — possibly even breaking down per-person shares like "Ana $3.34 · Ben $3.33" for extra clarity, though that adds visual weight.

I'll keep it simple with just the names shown, skipping extra detail tooltips. For deletion, I'll add a "Remove" button with a clear aria-label, and consider pairing it with a brief "Removed [item]. Undo" status message for better UX without overcomplicating the test surface.

For empty states, I'm drafting friendly copy: something inviting for the expenses list when it's empty, and conditional messaging for balances depending on whether people or expenses exist yet.

For settle-up, I'll vary the message based on state—no expenses yet versus everyone already even—and format transfer suggestions as simple "X pays Y $amount" lines, skipping a "mark as paid" feature since it'd complicate the state model unnecessarily. For the actual transfer calculations, I'll use a greedy algorithm.

Pairing exact matches first is cheap and still keeps the transfer count bounded by n-1, since the final transfer always zeroes both sides anyway. Now I'm sketching the storage schema: a versioned key holding people, expenses with id/description/amount/payer/split, and a counter for next id.

I should validate and sanitize on load, wrap localStorage access in try/catch for private browsing, and save after every mutation. For rendering, I'll split things into separate functions for people, payer/split selection, expenses, balances, transfers, and summary — building DOM nodes with textContent rather than innerHTML to avoid injecting raw names or descriptions. For uniqueness checks I'll lowercase names and trim whitespace so similar entries aren't treated as distinct.

I'm reconsidering the maxlength=40 attribute on the input — worried a test with a very long name could get truncated differently depending on how fill sets the value, causing a mismatch. Rather than risk that, I'll avoid hard-limiting input length and instead let CSS handle overflow for long names.

I'm making sure names stay safe from HTML injection by using textContent and setAttribute for data attributes, giving checkboxes a shared name, and wrapping the add-person flow in a form with novalidate so I can control validation and submission via JS, letting Enter key presses trigger the submit button naturally.

For error handling, I'll add a live region per form with aria-live="polite" that holds error text, link it to the offending input via aria-describedby and aria-invalid, and move focus to that field so screen reader and keyboard users notice the problem immediately.

For the person name validation, I'm drafting messages for empty input and duplicates — something like "Enter a name to add someone" and a duplicate message that names the existing match while noting names can't repeat even with different capitalization, suggesting adding an initial as a fix.

On duplicate I'll keep the typed value in place rather than clearing it, but after a successful add I'll clear the field and refocus it so people can quickly add several names in a row.

Now I'm working through expense form validation messages — missing people, empty description, missing/invalid/negative amounts, decimal precision, payer selection, and split selection — and thinking about validation order (description, amount, payer, split), considering edge cases like a negative amount paired with a blank description to decide which error should surface first.

For description validation, I'll trim whitespace and treat empty or whitespace-only input as an error.

Now I'm thinking through the visual design: a warm paper background with a navy header band carrying the wordmark and trip summary as a strong brand anchor, plus a thin Signal-colored stripe along the header's bottom edge as a subtle accent, maybe echoing a "keel line" motif with a notch.

Inside the header I'm placing the wordmark and mark on the left with three stat blocks on the right, a tagline underneath, and the stats wrapping into a row on narrow screens. I'm also checking contrast ratios for the paper text against the navy background to make sure the header text stays readable.

For the cards, I'm settling on a warm near-white background with a thin border, rounded corners, and generous padding, using Fraunces for section headings. I'm considering numbering the steps like "People" and "Expenses" with small numeral markers to visually convey a sequence through the flow.

Checking input field styling: 44px minimum height with a border that needs to meet 3:1 contrast against white for non-text UI elements per WCAG. I'm testing border colors and landing on #74838E for safe contrast, then moving on to focus state styling.

For focus visibility I'm making sure every focusable element gets a visible outline using the signal color, verifying its contrast against both the navy and cream backgrounds, and avoiding any `outline:none`. For checkboxes I'll use native inputs styled with accent-color for simplicity, and build the selectable "chip" pills using `:has(input:checked)` for the selected state.

Now I'm defining button styles: a primary harbour-background button with paper text, generous tap sizing and weight, plus secondary ghost and underlined text-link variants, including a compact but tappable "Remove" action styled with the signal color.

For the amount field, I'm adding a hidden "$" prefix span positioned over the input with left padding, paired with a clear "Amount (CAD)" label. I'm also setting up Intl.NumberFormat for CAD currency display, converting cents to dollars and handling negative values with absolute value formatting.

Now I'm laying out each balance row with the person's name, formatted amount, and a status note that reads "is owed $X" for positive, "owes $X" for negative, or "is all even" for zero, plus a hidden visual track element.

For the track bar, I'm designing an 8px rounded indicator with a centered tick mark splitting it in half, filling outward from center toward the right for amounts owed (in a calm green) and toward the left for amounts owed by the person (in a steadier navy tone), keeping both colors neutral rather than alarming.

I'm adding a small legend hint under the list explaining that bars left of center mean someone owes, while bars to the right mean they're owed, and checking that the green and navy shades are distinct enough for color-blind users since lightness differs noticeably.

Writing transfer list markup...

For accessibility I want each transfer to read naturally as "Ben pays Ana $12.50" to screen readers, so I'm structuring each line with bolded names around a "pays" verb and the amount aligned to the right, keeping it text-based rather than adding a decorative arrow graphic.

Above the transfers list I'll add a calm summary line like "2 payments settle everything," and the header will show total spent, people count, and expense count. The footer reassures users with "Saved on this device. Nothing leaves your browser." and includes a "Start a new trip" reset button that triggers an inline two-step confirmation, defaulting focus to "Keep trip" for safety.

For removed expenses, I'm adding an accessible status region near the list that shows an Undo button with a polite live-region announcement, staying empty otherwise. Each expense item is structured with description, who paid, who split it, and the formatted amount on the side.

I'm using a ul/li list and swapping the heading for a strong tag to avoid extra heading noise. For the split text, I'm considering Intl.ListFormat for the "Ana, Ben and Cy" phrasing, though the exact comma style varies by locale so I'll just make sure names appear individually in case tests check for that.

Starting to sketch the main JS module structure...

Writing the load function...

Finishing the load function with error fallback, I'm reasoning through edge cases: whether cleaning names on load could mismatch saved expense payers (it shouldn't, since saved names are already clean), and confirming split order follows trip order consistently. Now I'm starting to write the shares computation function that divides a cost evenly among participants using floor division, handling the remainder cents separately.

Now I'm building the balance computation that tracks net cents owed per person across all expenses, then writing the settlement algorithm that sorts people into creditors and debtors based on their balances, keeping trip order stable for ties as I work toward generating minimal transfer suggestions...

The nested loop structure is fine, and since debts and credits are sorted largest first, the first exact match found will naturally be the biggest one. Now moving on to the rendering helper function.

Writing element helper...

For the people list, I'm using a ul with li items marked with data-testid and an initial letter shown via a CSS pseudo-element pulling from a data attribute.

I'm also working out the payer select logic to preserve the previously chosen person when possible, and designing the split checkboxes as a fieldset with a legend for accessibility, considering whether the fieldset itself should serve as the designated container.

Finishing the fieldset structure with the chips container holding checkboxes. For tracking selection state, I'll read currently checked boxes from the DOM on each re-render rather than maintaining separate state, so adding a new person just unions them into the existing checked set while defaulting everyone to checked initially.

I'm adding a toggle button that switches between "Select all" and "Clear all" based on current checkbox state, plus a live preview element that updates whenever selections or the amount change, hiding itself if the input is invalid or nothing's selected. Now I'm writing the form submit handler that prevents default and trims the description input.

Writing amount parser...

"-0" counts as nonpositive, and I'm rejecting decimals with more than two textual digits even if mathematically equivalent, like "12.300". For the integer part I'm capping at 9 digits before flagging it too large, then computing cents by combining the integer and padded fractional parts, with "0" or "0.00" treated as nonpositive.

On a valid submission I push the expense, save state, reset the form, clear errors, and re-render everything including the balances, transfers, summary, and split checkboxes back to fully checked. I'm resetting the description and amount fields while keeping the payer, and rendering the expense list newest-first by reversing the array, with each remove button closing over its expense ID. For undo support, I'm storing the removed expense and its index when deleted, showing an undo notice, and restoring it via splice on undo.

For reinserting an undone expense, I realized index-based splicing could misorder things if a new expense was added meanwhile, so I'm instead finding the correct sorted position by comparing IDs and inserting there (or pushing if it belongs at the end) to keep the list properly ordered regardless of when undo happens.

Now I'm thinking about where keyboard focus should land after a removal — the remove button vanishes, so focus would otherwise fall back to the body. Putting focus on the Undo button seems tempting but risky, since a user hitting Enter again out of habit could trigger an accidental undo; I'm leaning toward moving focus to the next expense's remove button, falling back to the previous one or the section heading (with tabindex -1) if none remain.

I work out that clamping the focus index to the new array length handles the edge case cleanly. For resetting, I need to clear state entirely and re-render everything including form inputs and errors, plus persist the nextId counter. I'm also planning to wrap localStorage writes in try/catch and show a gentle inline notice if saving silently fails.

Now I'm setting up page metadata: title, viewport, language attribute, and an inline SVG favicon with proper URL encoding. I'm also adding an accessible skip link and structuring the markup so the app content sits inside `<main>` while header and footer remain as separate siblings.

I'll keep the brand header outside main as a true banner, and place the stats strip inside main as a card that overlaps the navy band with a negative top margin, creating a layered effect with three narrow columns for spent, people, and expenses.

Writing CSS custom properties...

Checking contrast ratios for error and tide color combinations — both come out comfortably above accessibility thresholds at roughly 5.3-5.7, so those palettes are safe to use.

Now I'm setting the typography scale: Fraunces for headings at 28px and 22px, 14px bold labels for accessibility, and 16px input text to avoid iOS zoom issues. I'm defining the header styling with harbour background, paper text, and a signal-colored bottom border, plus a wrapping layout with responsive padding and a flexbox brand lockup combining the logo, wordmark, and tagline.

I'm also designing a floating "glance strip" card that overlaps the header with negative margin, using a grid layout for three stats, subtle shadows, and a card background — and I'm deciding each stat should use small lowercase labels around 13px rather than uppercase to keep the voice casual, with values styled in tabular Fraunces or bold Public Sans.

Now I'm structuring that glance strip semantically as a definition list wrapped in a labeled section, then moving into the main content cards below — setting up card styling with rounded corners, padding that shrinks on mobile, and heading styles using the display font with adjusted optical sizing...

For the person-adding form, I'm laying out the input and button in a flex row so they share space responsively, and designing the people list as wrapping pill chips with initial circles that cycle through a set of muted palette colors to help visually distinguish each person.

Checking contrast ratios: I'm verifying white text passes 4.5:1 against several candidate circle colors (navy, tide, signal, plum, ochre-dark, slate), confirming ochre-dark and plum both comfortably clear the threshold.

Slate passes too, so I'm dropping signal from the avatar palette since that color semantically implies error/action, leaving five tones: harbour, tide, plum, ochre, slate. I'm thinking through how to cycle these across avatars using nth-child selectors so each person gets a consistent assigned color, and considering whether to reuse the same avatar styling in balance rows and checkboxes.

I'll reuse avatars in the balance rows since they follow the same person order, keeping the color assignment consistent, but skip them in the expense list. I'm building a small avatar helper that creates an aria-hidden span with a data-initial attribute pulling the first uppercase character from the person's name, letting a pseudo-element render the letter visually.

For layout, the expense form stacks fields vertically with the description full-width, while amount and payer collapse into a responsive two-column grid using auto-fit with a minimum width so it naturally stacks on narrow screens. The split chips use a flexible wrapping row with generous spacing and a minimum tap target height for accessibility.

I'm using inset box-shadow instead of border changes for the checked state so the chip size doesn't shift when toggled, pairing it with native checkboxes styled with an accent color for the harbour palette. For focus visibility I'm weighing focus-within versus a has(:focus-visible) selector to avoid showing a ring on plain mouse clicks while still being accessible for keyboard users, though I need to check browser support for that selector.

Settling on a global focus-visible rule with a signal-colored outline and offset so it applies consistently across checkboxes and inputs without extra chip-level logic. Now I'm defining the button system with a base class for sizing, padding, and flex alignment, then primary and quiet variants layered on top with their own background and border treatments.

I'm deciding the primary button stays navy rather than signal, keeping signal reserved for the header stripe, errors, transfer amounts, logo accent, and focus rings so it stays purposeful rather than overused. I'm also considering whether the Settle up card should get a signal-colored top border to reinforce that restraint.

Now I'm designing the transfer list item layout as a flex row with the person-to-person label and a bold tabular amount in signal-ink, styled as a clean rounded card with a thin border.

For empty states, I'm keeping it simple: a dashed-border box with soft ink text and no icon needed, just a strong title line and a sentence.

For the expense list items, I'm switching to a grid layout with separators between rows instead of individual cards, giving each item a clear two-column structure for content and metadata.

For the amount and remove button styling, I'm setting the amount in bold tabular numerals and sizing the remove button at 40px height normally, bumping to 44px on coarse pointers to meet touch target guidelines without making the list feel visually heavy.

For the undo notice, I'm laying it out as a flex row with space between content and the Undo button, rounded corners, and hiding the container entirely when empty. I'm also adding a visually-hidden utility class and styling the balance bars with a track, a centered tick mark, and an absolutely positioned fill indicator.

Checking color contrast for the "owes" fill color against the light track background, I'm settling on a muted slate blue (#4F6D84) that gives roughly 4.5:1 contrast, which is solid for accessibility.

Since I'm re-rendering lists rather than keeping persistent DOM elements, I'll skip width transitions entirely and just respect prefers-reduced-motion globally for safety. For the balance row layout I'm structuring it as avatar plus content grid, with a top line showing name and status text, then the track bar beneath—status text reads "is owed" or "owes" with the amount bolded, or "all even" for zero, using tide and slate ink colors for each state.

I'm also drafting the legend hint explaining the bar visualization, and working out the tagline copy for the header to establish a plain, calm voice that normalizes owing money between friends.

Now I'm starting the HTML document itself, setting up the page metadata, title, viewport, and theme color.

I'll actually drop the preconnect hint entirely for strictness, since it's safer to avoid any extra network trigger. If the network is blocked in tests, a render-blocking stylesheet could hang the load event, so I'm considering using a non-blocking load pattern with a print-media trick to avoid stalling.

Writing the skip link and body markup...

I'm weighing whether to suppress the focus ring on main when the skip link activates it, since a full outline around the whole container looks ugly but removing it risks hiding visible focus for keyboard users. I'll lean toward keeping the default focus-visible ring for accessibility despite the aesthetic tradeoff, and move on from this detail.

Instead I decide to point the skip link's href at the main content's id directly rather than adding a separate tabindex, since browsers will move the sequential focus starting point there without needing extra attributes. I'm sketching a glance summary section as the first child inside main, with a definition list showing spent total, people count, and expense count, but I need to work out how it overlaps visually with the header above it using a negative top margin.

I'm now structuring the two-column layout, grouping the people, add-person, and expenses cards in one column and the balances and settle cards in the other, while using CSS order and display:contents so the visual order collapses correctly into a single mobile stack before expanding into the grid layout on wider screens.

I'm catching an accessibility issue though: on mobile, the visual order (people, add, balances, settle, expenses) created by the CSS order property doesn't match the actual DOM order, which breaks keyboard focus order and conflicts with WCAG guidance on meaningful sequence. So I should reorder the DOM itself to match the intended mobile reading order instead of relying purely on order.

For the desktop two-column layout, I'm weighing grid placement options where balances and settle-up span multiple rows alongside people/add/expenses in the other column, but spanning items taller than their allotted rows can create uneven gaps since extra space distributes awkwardly across spanned rows.

If the balances column ends up taller than the people column, the leftover space distribution across spanning rows gets tricky with grid's fr/auto track behavior — I need to think about whether using a flexible track absorbs that extra space cleanly instead of creating uneven gaps.

Right, the spec confirms flexible tracks grow to cover spanning items' max-content when space is indefinite, so the fr row expands to fit b's height—this matches the common sidebar-spanning pattern browsers already handle well. With that resolved, I can confirm DOM order matches visual order on mobile, while desktop uses a left column with people, add, and expenses.

I'm wrapping balances+settle into a `.b` flex column spanning all three grid rows on the right side, while people/add/expenses occupy separate rows on the left with an auto auto 1fr sizing so expenses grows to fill remaining space, aligning its card to the top if the right column ends up taller. On mobile everything just stacks normally.

Now I'm writing the people-form markup...

I should add `role="list"` back to the ul since removing list-style strips semantics in Safari. Now building the expense form card with a description field and an amount field in CAD, noting costs split equally among everyone.

Adding the payer dropdown and split-between fieldset with checkboxes...

I'm deciding to stick with fieldset+legend and just place the toggle button below the chips alongside the preview text, rather than fighting with absolute positioning. Actually, I'm reconsidering whether the toggle button is even needed—since everyone defaults to selected, unchecking a couple is the common case, so maybe a simpler "Select all" control would suffice instead.

I'm placing the expense error message container right above the submit button for mobile visibility, then setting up the submit row with a full-width primary button. Now I'm writing the JS wiring, starting with a shorthand getElementById helper and an error-display function that clears existing errors and injects an alert paragraph into the right message box depending on whether the error is person- or expense-scoped.

I'm deciding to use a CSS ::before pseudo-element for the "!" icon instead of an inline span, so error text stays clean for test assertions, and I'm making sure invalid fields get aria-invalid, aria-describedby, and focus while clearErrors removes those attributes and the error nodes. Now I'm writing the person form's submit handler, starting with preventing default and sanitizing the entered name.

After adding a person, I also need to re-render transfers and the summary, clear the input, and refocus it. I'm deciding to skip verbose live-region announcements since the list re-render already shows the update, and I'm wiring input events to clear form errors as the user types again.

Global error clearing is fine since only one form error shows at a time, and offending fields keep their typed values when rejected so users don't lose input. Now I'm writing the function that computes and displays the split preview, parsing the amount, grabbing the selected names, and calculating each person's share to render.

For the phrasing, I'm handling singular vs plural cases: one person covers everything, equal splits get a simple "each person pays" message, and uneven splits need proper verb agreement ("pays" vs "pay") when listing who gets the higher or lower share amounts.

Still writing preview logic...

For the empty-state cases, I'm having the split container show a muted message when there are no people yet, keeping the payer select showing a disabled placeholder option, and routing validation errors back to focus the person-name input when someone tries to log an expense with nobody added. Now I'm starting the expense list rendering function.

Writing list item markup...

I'll keep the split display simple, skipping showing per-person uneven share breakdowns to avoid clutter. Now I'm moving on to writing the balances rendering function, which grabs the list and empty-state elements and updates the list contents.

Still writing balance logic...

Checking the arithmetic doesn't produce stray negative-zero display issues since string conversion normalizes it to "0" anyway.

For the bar widths, I'm computing percentages with a two-decimal rounded style width, skipping fill for zero values, and marking the track as aria-hidden. For the transfers section, I'm handling empty states with distinct messages depending on whether people or expenses exist yet, versus showing the settlement summary when transfers are needed.

I'm pluralizing the summary text correctly for one versus multiple payments, and tagging each transfer row with data attributes for from, to, and cents. Then I'm writing the reset function to clear state and re-render everything, plus the initial full render call and the undo notice renderer.

Now I'm drafting the base CSS—box-sizing resets, hidden attribute handling, body typography with the Fraunces display font and smoothing—while considering accessible label associations for the select inputs.

Shifting to the header styles, I'm setting a dark harbour-colored background with a signal-colored bottom border, defining a responsive wrapper with max-width and padding breakpoints, and laying out the brand mark alongside a bold wordmark using the display font.

Adding tagline and glance card styles...

I'm realizing the glance panel sits inside main rather than wrap, so I should apply the wrap class directly to main to keep layout consistent with the header.

I'm checking the overlap math between the header's bottom padding and the glance card's negative top margin, then stress-testing column widths at a 360px viewport to make sure larger dollar amounts like "$12,345.67" don't overflow — I'll need to shrink the font size on mobile to around 1.125rem to keep numbers from wrapping awkwardly.

Now I'm defining form element styles: labels with bold small text, and text inputs/selects sharing consistent padding, border, and radius, plus a custom chevron SVG for select dropdowns to replace the native arrow, along with a global focus-visible outline for accessibility.

For the money input, I'm positioning a currency symbol absolutely inside the field with padding to avoid overlap with typed text. I'm also checking placeholder text contrast ratios against WCAG requirements, adjusting the gray value slightly darker to ensure it passes 4.5:1.

Now I'm styling the checkbox chips and error message states, giving errors a soft red background with a left accent border and darker red text for emphasis.

Still writing styles...

Still writing styles... I'm also working out how each person's avatar gets its initial letter and color tone, using a rotating pattern across list items so the tone variable cascades down to the avatar unless overridden.

Writing balance list styles...

Adding styles...

I'm checking responsive details like flex layout for the person form row, preventing horizontal overflow at 360px with min-width and overflow-wrap rules, and handling long names in selects and chips gracefully. Skipping print and dark mode styles since the brand palette is fixed, then moving on to writing the JS.

Writing storage and formatting helpers...

Building the split-selection rendering, filtering checked people and generating checkbox chips for each name with empty-state messaging...

I'm now adding updateSplitUi to toggle the select-all/clear-all label based on whether all people are selected, and setting up a change listener on the split container to clear errors and refresh state when selections change.

Next I'm writing renderPayer, which rebuilds the payer dropdown from the people list, disabling it when empty and preserving the previously selected payer if still valid, defaulting to the first person otherwise.

Then I'm adding the expense form's submit handler, which prevents default, reads the description, parsed amount, payer, and selected participants, and validates that people exist before proceeding, showing errors otherwise.

Continuing those validations, I check for a missing description, invalid amount, unselected payer, and no split participants, each triggering a relevant error message and focusing the right field—using the first checkbox for the split error. I'm also considering whether focusing on error fields might cause unwanted scrolling on mobile, since the error appears just above the submit button.

I weigh moving the error message higher in the form versus using scrollIntoView to keep both the field and error visible, favoring focusing the field with scroll behavior set to bring the error into view afterward for keyboard accessibility.

Now I'm working out the logic for adding a new expense to state—pushing the parsed amount, payer, and split data, clearing stale removal state, saving, resetting the form inputs, and re-rendering the split, expenses, and balance views.

For removing an expense, I'm writing the handler to find it by id, store it for undo purposes, splice it from state, save, re-render everything, then focus a nearby delete button to preserve keyboard navigation flow.

I'm reasoning through focus ring visibility — since it's programmatic focus triggered after a mouse click, the focus-visible heuristic should suppress the ring for mouse users, which is the desired behavior.

Now I'm writing the undo render function that clears the undo box and, if there's a removed expense, displays a message with its description alongside an undo button.

For the undo click handler, I'm restoring the removed expense into the sorted list, saving, re-rendering everything, and then handling focus — since the undo button disappears afterward, I'm tagging each list item with a data-id so I can find the restored expense's remove button and focus it directly, which solves the lost-focus problem. I also need the notice box to hide properly when cleared by a reset.

For the reset flow, I'm wiring up open/cancel/confirm buttons to toggle the hidden confirm dialog, shifting focus appropriately between the open and cancel buttons, and on confirm actually performing the reset, hiding the confirm panel, and focusing back on the person-name field. I'm also clearing the form fields and any validation errors as part of the reset, then re-rendering the full split view on initial load. Now I'm considering whether localStorage persistence needs special handling across a page reload during testing.

Now I'm drafting the actual copy text for the UI: the header tagline, the "Who's on the trip" people card with its lede, name field label and placeholder, add-person button text, the empty state messaging encouraging users to add themselves and friends first, and a persistent hint explaining how leftover cents get distributed to people in the order they were added.

Moving on to the expense card copy ("Log an expense" with its lede about equal splitting in Canadian dollars) and the balances card ("Balances" with a reassuring lede and a legend explaining the left/right bar direction, plus an empty state). I'm also starting to phrase the settle-up card's lede, trying to avoid overpromising a mathematically optimal number of payments and instead describing it simply as a short list that evens everyone out.

Now I'm wrapping up the expenses list copy ("Expenses" with a "Newest first" lede and an empty state), plus the footer text reassuring users that data stays on-device and a "Start a new trip" action. I'm double-checking the save-note element's text and accessibility attributes, then starting to write out the full JavaScript implementation.

Setting up state and load logic...

I'm reusing the SVG mark in the header, sized to match the favicon. For the legend styling, I'm making sure fieldset legends display as full-width blocks without floating, and setting up checkbox chip states with a native fallback for browsers lacking `:has` support. Now I'm writing the desktop grid media query defining column and row layout for the two-panel design.

Positioning the sidebar...

Actually, sticky won't behave well here since a tall sidebar would get cut off mid-scroll with the middle portion hidden, so I'll skip that approach and keep it simple.

I'm placing `.glance` in main before `.layout`, checking heading margins on `.card h2` and `.lede`, and adding `aria-required="true"` to the description and amount fields for semantics. With `novalidate` on the form, native validation bubbles won't show, so I'm skipping `:invalid` styling, confirming Enter submits the form via the submit button, and adding a small `<noscript>` message. Now I'm writing the amount-parsing function logic.

Writing parser edge cases...

Still writing validation logic...

I'm also double-checking that inputs stay untouched on validation failure or when adding people, so nothing resets what the user typed, and that the payer selection correctly uses the person's name as its value. Now I'm moving on to verify the settle-up algorithm handles the test cases correctly.

I need to add whitespace text nodes between the name and status spans so textContent reads naturally, and make sure transfer and expense meta strings include proper spacing between elements.

Checking the narrow layout at 360px, I want the amount and Remove button stacked and right-aligned with nowrap so large amounts don't break. I'm also verifying keyboard accessibility through native buttons and labeled checkboxes, adding lang and title attributes, respecting reduced-motion preferences, and confirming text contrast meets WCAG AA throughout.

Specifically I'm checking the disabled select state, skip link visibility on focus, and muted/ink-soft colors against the paper and harbour backgrounds to make sure contrast ratios clear the 4.5:1 threshold.

Writing final component code...

Finishing renderPeople with list items tagged by initial for screen reader identification, then adding renderAll/renderData orchestration functions that call all the render helpers together, plus noting summary stats like total count and money displays.

Now I'm writing the transfers rendering function, which computes settlement payments between people, shows an empty state when balanced, and otherwise displays a summary note with the payment count alongside list items for each transfer...

I'm working out the empty-state copy for different scenarios: no people yet, people but no expenses, and expenses with nothing left to settle. I also need to wire up input/change listeners to clear validation errors across both forms, removing aria-invalid attributes from all flagged fields.

Laying out spacing with grid gaps for the stacked form fields and a responsive two-column row above 560px, then double-checking the skip link still works for keyboard users.

