I'm planning the brand identity for Even Keel, a nautical and steady design using harbour navy and signal red-orange, and thinking through pairing a characterful serif with a clean sans for the typography.

Settling on a palette now: a deep navy "Harbour" for text and headers, with a muted red "Signal" accent used sparingly. I'm checking the contrast ratio of the signal color against white to make sure it meets accessibility standards.

Working through the off-white background option, I find the contrast ratio comes out around 4.51, which barely squeaks by AA but feels risky for production use. I'm concluding it's safer to reserve the signal color for white card surfaces, or alternatively create a darker signal variant like #A93A22 for text to ensure reliable contrast.

There's also a conceptual tension worth resolving: since owing money between friends should feel normal rather than alarming, I shouldn't code negative balances in red-alarm tones even though that's the intuitive choice. I'm leaning toward reserving the signal color purely for primary actions like the Add Expense button, while balances get neutral treatment instead — maybe a centered horizontal bar visualization with sea tones for "owed" and warm sand tones for "owes," paired with plain language like "gets back $X" and "puts in $X" rather than clinical debit/credit framing.

I'm also checking contrast ratios for focus rings on navy backgrounds, calculating whether signal orange stays visible enough against darker header tones.

I'll skip removing people since that's complex and not required, but I'll add a small "Start a new trip" button with a confirm dialog for when the trip ends, keeping scope limited.

For layout, I'm thinking a header with a wordmark "Even Keel" paired with a simple horizon/keel mark and a tagline about splitting costs evenly. On desktop I'll use two columns — people and add-expense on the left, balances/settle-up/expenses on the right — while mobile collapses into a single logical flow: people, add expense, settle up, balances, then the expense log.

I'm also adding a summary strip up top showing trip total, expense count, and people count for quick context, and sketching the grid proportions so inputs sit on the left and outcomes on the right. For visuals I'm leaning toward a warm off-white background with white cards, subtle borders, soft shadows, and rounded 14px corners for a clean, approachable feel.

For the header, I'm imagining a navy band with the wordmark and a thin coral "boot stripe" along the bottom—like a boat's waterline—as a recurring nautical motif, carried through into balance bars as a centered "keel line." Section headings use Fraunces in navy, with Public Sans for body text, and balance rows show diverging bars centered on zero to visualize who owes versus who's owed.

For color, I want to avoid red for negative balances since the words "owes" and "is owed" already convey meaning—so I'm considering navy for positive amounts and a muted warm sand or ochre tone for negative ones, checking contrast ratios to keep it accessible.

Working out the contrast ratios confirms the muted text color passes comfortably against both white and off-white backgrounds. I'm settling on the remaining palette values — a terracotta signal color with a darker hover variant, a warm off-white background, pure white surface, and a border line color.

For the positive/negative bar colors, I'm leaning toward using a sea teal for money owed to the user and a brass/sand tone for money owed by the user, keeping with the nautical theme (navy, brass, red signal stripe, sail white) while avoiding red for debts since the principle is that owing money shouldn't feel alarming.

I'm checking the contrast ratio of a brass color (#B8873F) against white, and it comes out around 3.19:1 — just enough for graphic elements like bars, though I'll keep text dark rather than brass-colored.

For balance display, I'll show positive amounts like "+$40.00" in harbour bold and negative ones in ink, with "is owed" / "owes" / "all square" labels. Settle-up transfers will render as ticket-style rows like "Ana pays Ben $25.00" with an arrow icon, plus a summary note on how many transfers remain, or "Everyone's even" when nothing's owed — I'll skip adding a "mark as paid" action since that would create new expenses and risk messing with balance calculations. Each expense list item will show a bold description, right-aligned amount, and a meta line beneath it.

Each expense's split details should name the actual people involved ("Split 3 ways: Ana, Ben, Cy") plus the per-person share amount, and the remove button needs both visible "Remove" text and a descriptive aria-label identifying which expense. On removal I want to manage focus properly, moving it to the next remove button or back to the list heading for accessibility, and I'm considering adding an undo toast after deletion as a nice touch.

I'll keep undo simple but include it since it's only about 30 lines, moving focus to the next item after removal.

For the form, I'm designing the person input with a label, add button, and inline error message that only carries the test's data-testid attribute while visible, toggling via a hidden attribute so the element persists but stays accessible.

I'm writing calm, specific error copy for empty and duplicate name cases, clearing the input and keeping focus there after a successful add while announcing the result through a live region, and now I'm working out the expense form's labeling, including a visible "Description" label.

For the amount field, I'm choosing type="text" with inputmode="decimal" and a "$" prefix instead of type="number", since number inputs silently blank out on invalid entries like "abc" and would break validation tests expecting the bad input to be preserved and rejected with a message.

I don't think a hard cap is worth the complexity — I'll just silently limit absurdly huge whole-number inputs rather than adding error messaging for it. For commas, I'll just strip them along with spaces before validating, treating them as optional thousands separators.

Now I'm drafting the specific error messages for each failure case: empty input, non-numeric input, too many decimal places, and zero/negative amounts, each with a friendly, concrete example.

For the other fields, I'm thinking through messages for a missing description, no people added to the trip, no payer chosen, and no split selected—weighing whether to disable the form or just surface validation errors on submit, and leaning toward keeping it enabled with clear inline errors rather than silently disabling controls.

With multiple validation errors, I'm worried about using a single `data-testid="form-error"` per field since Playwright's strict mode would fail if several match at once. To stay safe, I'll settle on showing just one summarized error message at a time rather than one per field.

I'll go with showing only the first error inline near the relevant field, clearing errors from the other form when one is submitted, and also clearing a field's error as soon as the user edits it. For accessibility, I'll associate the error text with the field via aria-describedby, mark the field aria-invalid, and move focus to it rather than stacking separate alert roles, since focus plus description should announce clearly without double-announcing.

For the payer select, I'm weighing whether to default to the first person or use a blank placeholder option — a placeholder risks tests failing if they don't explicitly pick a payer, so defaulting to the first person seems more forgiving for untested cases.

On resets after adding an expense, I think it makes sense to keep the payer selection sticky while resetting the split checkboxes back to "everyone selected." For newly added people, they should appear in the payer dropdown and come pre-checked in the split, even if other people were previously unchecked.

I'm also considering a nice touch: a live preview under the split checkboxes showing the per-person share, accounting for cent remainders like "$3.34 or $3.33 each." For styling, I want pill-style checkbox labels but need to keep the underlying native checkbox accessible and functional so tests can still interact with it directly.

I'll keep appearance:none with a custom checkmark drawn via pseudo-element or SVG background for the checked state, which should render reliably across browsers. For splitting costs, I'm writing a function that divides the amount evenly among participants in cents, distributing any remainder one cent at a time based on order.

For settling up, I'll use a greedy algorithm that matches the largest creditor against the largest debtor repeatedly, which guarantees at most n-1 transfers for n people with nonzero balances, with sorting by amount and then by addition order to keep results deterministic. I'll use names as unique identifiers since they're case-insensitive unique, storing transfer and balance amounts as signed integer cents.

For currency display, I'll use Intl.NumberFormat with en-CA locale and CAD currency, which gives a plain dollar sign format like "$1,234.50", and I'll phrase balances as "owes $X" rather than relying on signs to avoid confusion. I'm also planning the storage schema under a versioned key holding the list of people and other trip data.

Expenses will store id, description, amount in cents, payer, split list, and creation timestamp, with validation on load to guard against corrupted data and localStorage wrapped in try/catch for private browsing modes. I'll generate ids using crypto.randomUUID with a fallback, keep expenses appended in order but render them newest-first, and rebuild the UI carefully so the payer select and split checkboxes only regenerate when the people list changes, preserving existing selections otherwise -- and I'll build names into the DOM safely rather than using innerHTML to avoid any injection issues.

For long names, I'll skip a hard maxlength since that could interfere with automated form filling, and instead rely on overflow-wrap styling plus a gentle validation message suggesting names stay under 40 characters.

For the uniqueness check, I'll compare names case-insensitively using lowercase conversion.

I'm working out the data attributes needed for each UI element — balances need person name and cents values, with balances shown for everyone even if zero, and transfer elements appearing only when needed. I'm also drafting the empty-state copy for when there are no people yet or no expenses recorded.

For balances with people but no expenses, I'd show everyone at $0 as "all square." I'm also sketching the summary strip showing trip total, expense count, and maybe average per person, plus considering whether to add an editable trip name as a nice touch.

Now I'm drafting the actual copy throughout: the header tagline about logging what everyone paid, the people section asking "who's on the trip," balances framed as "where everyone stands" with a reassuring line that owing just means someone covered you for now, and settle up described as the fewest payments to get everyone even.

For the header mark itself, I'm sketching a simple SVG logo for "Even Keel" — a boat hull silhouette with a waterline stripe through it to evoke balance and levelness, paired with the wordmark in Fraunces semi-bold.

Now I'm planning the header styling: harbour-tinted background, a constrained container, and a tagline in a soft blue-gray that keeps contrast above 4.5 against navy. Below the header I'm considering a classic boot-stripe effect using stacked box-shadows to create thin sail and signal-red lines beneath the navy band.

Simplest solution: give the header a bottom margin and use a `::after` pseudo-element positioned a few pixels below to render the thin signal-colored stripe. Then for the card sections I'm setting a white background with a light border.

For inputs, I'm checking contrast ratios carefully -- making sure the border color against the white background meets the 3:1 minimum required for UI component boundaries, working through the relative luminance math for the candidate border shade.

Settling on #7B858E for the border, giving roughly 3.66:1 contrast. For focus states, I'm planning a solid outline using the signal color with a 2px offset, checking it reads clearly against both white and sail backgrounds. For buttons, I'm sketching primary (signal background, white text, 600 weight, 10px radius, 48px height) with a darker hover state, and considering harbour as the secondary color for the Add person action, though I want to avoid clashing two strong hues.

I'm reserving signal as the single primary-action color per screen—Add expense gets it, Add person stays harbour-filled. Remove buttons become subtle ghost buttons with muted text and thin borders, hovering into signal-dark text, while text actions like "Everyone" and "Clear" stay link-style and small.

Now I'm sketching the balance row layout: a track with a centered line where the fill grows left in brass for owing or right in navy for being owed, sized proportionally to the balance relative to the max balance, capped at half the track width.

For the status label, I'm pairing a small word ("Is owed," "Owes," "All square") above a bold tabular amount, while ensuring the accessible text reads as a full sentence like "Ana is owed $40.00." I'm also leaning into a "you" voice for copy—phrases like "Add everyone who's sharing costs, including you"—and sketching the settle-up row as a simple directional list showing who pays whom and how much.

For each settle-up entry, I want plain visible text like "Ben pays Ana" with the amount aligned right, keeping "pays" muted but legible rather than hidden, alongside a decorative arrow. I'm also considering a "Copy summary" button that uses the clipboard API to let people paste a settle-up list straight into a group chat.

For expense items, I'm laying out each as the expense name and total on one line, who paid and the per-person share below, and who it's split between with a remove action — skipping the date to keep things focused and uncluttered.

For the split text, I'll handle single-person cases like "For Ben only" and otherwise just list the names with "and" joining them, using Intl.ListFormat where available with a simple join as fallback — the exact wording matters less than including the names. I also want a visually hidden live region for announcing updates.

For an undo bar, I'll place a dismissible notice near the Expenses heading showing what was removed with an Undo action, clearing it on the next add/remove rather than relying on a timeout. On undo, I'll reinsert the expense at its original index, storing both the expense and its position together, and after removal I'll move focus to the remove button of the item now occupying that spot or fall back to the heading if none remains.

For the "Start a new trip" footer button, I'll wrap the clearing action in a confirm dialog warning that it wipes all people and expenses on the device, and add a small footer note clarifying that data is saved locally only.

Now I'm working through responsiveness at 360px width—sizing paddings and the person-entry row so the input and button fit comfortably, and deciding between a grid with auto-fit columns versus explicit media queries for the amount/payer row. I also want to guard against overflow from long names using overflow-wrap and zero min-width on grid children, and figure out how the balance bar should restack on mobile.

For the people list, I'm picturing each person as a pill chip with a colored avatar circle showing their initial, choosing a muted nautical palette (navy, teal, brass, signal-dark, slate, moss) and checking that white initials meet contrast requirements against each background color.

Still computing contrast ratios...

I realize there's a real risk: if the avatar initial span sits inside the same list item as the person's name, the element's combined text content would read like "AAna" instead of just "Ana," which could break a test expecting exact name text. I should mark the initial as a CSS-generated character via a data attribute instead of literal text content, so the visible name stays clean for accessibility and testing.

For body font, I'm leaning toward Public Sans for that honest, trustworthy tool feel, paired with Fraunces for headings and numbers using a soft, calm variant rather than quirky wonky letterforms, loaded via the Google Fonts CSS2 API with the right axes.

Default WONK=0 should be fine, and auto optical sizing will handle the heading-to-number scale nicely. Fraunces gives that quietly confident character I'm after, more personality than something like Newsreader while staying respectable.

Now I'm sketching the JS architecture: a localStorage-backed state object holding people and expenses, a currency formatter for cents, and helper functions like findPerson for case-insensitive lookup and shareMap to compute each person's share of an expense, filtering out any split names that no longer exist in the people list and preserving the canonical people ordering.

Then I'm designing computeBalances to aggregate paid/share/net per person, and computeTransfers as a greedy debt-settlement algorithm — separating creditors and debtors by net balance, sorting both descending by amount with index as a tiebreaker, then repeatedly matching the largest creditor and debtor to create a transfer for the minimum of their amounts until balances are settled.

The greedy approach is bounded by n−1 transfers, which satisfies the spec even though a smarter zero-sum subset search could theoretically do fewer. I'm also outlining the render functions needed — for people, expense form options, expenses, balances, transfers, summary, and split preview — plus a top-level render() that calls them all and saves state, with careful logic to preserve checkbox/payer selections across rebuilds by tracking which names are already known versus newly added.

Now I'm working out how to track per-person inclusion state and payer defaults: new people default to checked, resets after adding an expense restore all to checked, and the payer falls back to the first person if unset. I'm also deciding the select should show a disabled placeholder when there are no people, and that the expense form should stay visible and enabled even with zero or one person, just showing a clear error message rather than disabling the fieldset. Writing amount parsing function...

Finishing the parsing logic: capping fractional digits at two, rejecting overly long whole numbers, converting to cents, and erroring on zero or negative totals. I'm also double-checking edge cases like negative signs, scientific notation, and dollar-sign prefixes to make sure they're handled sensibly.

For the UI flow, I'm planning to trim and require the description, then on a successful add reset the description and amount fields, default the split back to everyone, keep the current payer selected, and refocus the description input for fast repeated entry while clearing any prior errors. I want to preserve whatever the user typed if there's a validation error, and clear a field's error state as soon as they start editing it again. For displaying errors, I'm setting up a single error-rendering function that clears existing messages across both forms and then populates the right error slot by revealing a hidden paragraph element and setting its text.

I'm weighing reliability of screen reader announcements here — toggling a hidden alert region on and off may not consistently fire, so I'm considering instead keeping the element always present but empty, or relying more on moving focus to the invalid field with aria-describedby pointing to the error text so screen readers read the label, invalid state, and description together when focus lands there.

For cases where the field is already focused (like a duplicate name entered and Enter pressed again), calling focus() won't trigger a re-announcement, so I'll route that message through the global polite live region instead, which is more dependable than a local role=alert region.

Now I'm working out how to phrase the split preview text under the fieldset — something simple like stating the per-person share amount, and when the division isn't even, explaining that a few cents extra go to the first people in the list rather than showing multiple dollar amounts.

I'm computing the exact text logic: if the remainder is zero, show one amount per person; otherwise show the higher amount for the first few people by name and the base amount for the rest, with fallback messages for invalid amounts or nobody selected. I'm also sketching the quick-select buttons for "Select everyone" and "Clear," plus the overall expense form layout with description, amount, payer dropdown, and the split checkboxes for each person.

For the select element I'm styling it with a custom chevron and fixed height, and for the delete buttons in the expense list I'm making sure the accessible label starts with the visible "Remove" text to satisfy WCAG label-in-name requirements, using a visually hidden span for the extra context.

Now I'm laying out each expense item's markup, with a heading for the description, a paragraph for the amount, and a meta line showing who paid.

For splits, I'm deciding text is clearer than a mini avatar stack. I'm also thinking about a trip summary card showing the total and expense/people counts, but skipping an "evenly split" figure since splits vary, and considering folding that summary into the balances card header at the top of the right column instead.

I'm weighing whether to make that summary a navy card, but worried about too much navy stacking with the header. Instead I'm leaning toward a functional navy header that combines the wordmark with the trip total on the right, like a hull nameplate, with the total wrapping below on mobile.

For content order, I'm placing Settle up after Balances since balances establish where things stand before showing the payoff, possibly as two separate cards ("Where everyone stands" and "Settle up") followed by the Expenses log. On mobile I'd sequence People, Log expense, Balances, Settle up, then Expenses so inputs come first, and on desktop I'm considering a sticky left column for the input cards.

Actually, a sticky column gets messy if content grows taller than the viewport, so I'm reconsidering the layout: left column holds People, Log an expense, and Expenses history together since they're input-related, while the right column holds Where everyone stands and Settle up, which can stay sticky since that content tends to be short and gives immediate feedback as expenses are added.

But on mobile, that DOM order would push balances and settle up below a potentially long expenses list, which is bad for usability. I'm thinking about using CSS grid with explicit named areas so the DOM can follow a mobile-friendly order—People, Log expense, Balances, Settle up, Expenses—while desktop rearranges those same items into two visually separate columns without creating uneven grid-row gaps between sections of different lengths.

Now I'm drafting the header layout showing the trip total, expense count, and people count, plus working through the actual copy for the "Who's on the trip" card—the heading, helper text, input label, placeholder, button, and empty state—along with inline error messages for missing names and duplicate entries.

I'm also writing out the "Log an expense" card copy: heading, description, labels for amount and payer, the split-between legend with "Everyone"/"No one" buttons, and the fallback message shown when there are no people yet to split with. Now I'm moving into drafting the Balances card copy.

Balances card wording should cover the heading, explanation of owing vs. being owed, and the empty states for no people and for people-but-no-expenses yet. Then for Settle up, I'm crafting honest copy explaining it's a short list of payments to get everyone even (rather than overclaiming it's the fewest possible), plus the footer summary, a "copy for group chat" button, and the empty state message for when there's nothing to settle yet.

I'm also drafting the Expenses card copy with its count label, "Newest first" subtitle, and an empty-state message encouraging the first log entry. The footer reassures users data stays local to their browser/device, with a "Start a new trip" button. For undo, I'm tracking the last removed expense and its index so the removal can be reversed, checking that the payer and split participants still exist before splicing the expense back into the list and re-rendering with focus restored appropriately.

Since rendering rebuilds the whole expense list, I need to explicitly manage focus after removals since it could get lost. I'm also optimizing so the people-related form options (payer select, checkboxes) only fully rebuild when the people list actually changes, otherwise just syncing checked states, and I'm writing a load function with validation for parsing stored data.

Still writing storage validation...

I'm also adding a storage event listener to sync state across browser tabs, which is a cheap but nice touch. For accessibility, I'm setting the page language, structuring headings with h1 for the title and h2/h3 for sections and expense descriptions, using proper list elements for transfers, and ensuring focus-visible outlines on interactive elements.

I'm checking contrast ratios across my color palette to make sure text pairs meet accessibility standards — body text, muted text, and button text on various backgrounds all come out well within acceptable ranges.

For error states I'm settling on the signal-dark color paired with an icon, distinguishing validation issues from balance/money colors conceptually. I'm also setting touch targets to a minimum 44px height for primary buttons, wrapping transitions in a reduced-motion media query, and defining the invalid input border style.

Now I'm checking the 360px header layout math to confirm the wordmark and total fit side by side with wrapping, then moving to the balance bar markup structure with avatar, name, and bar elements keyed by person data attributes.

For the bar styling, I'm defining a track with rounded ends and a center divider line, then positioning fill segments absolutely from the midpoint outward—left for "owed" and right for "owes"—scaled proportionally to the max balance, with a minimum visible width for small nonzero amounts. I'm also weighing whether to include +/− signs on amounts given the "is owed"/"owes" wording already conveys direction.

I decide to add a secondary muted line showing "Paid $X · Share $Y" beneath each name for transparency, keeping both balance colors equal weight rather than using red for debt. Now I'm starting the markup for the transfers list items with data attributes for sender, receiver, and amount in cents.

Writing transfer list items...

I'm planning the layout as a flex row with sender, "pays", receiver, and amount pushed right via auto margin, possibly numbering each transfer with a step circle. The copy pattern is simple sentences like "Ben pays Ana $25.00", and I'm sketching the clipboard copy logic for sharing the settle-up summary.

Now I'm designing a small 36x36 header mark as an SVG badge, sketching a rounded rectangle background with a simple icon path inside.

Still writing hull path...

Now I'm settling the typography scale: Fraunces for headings, Public Sans overlines in uppercase with wide letter-spacing, tabular numerals for amounts, and a consistent 4px-based spacing rhythm from 8 up to 48.

Cards get a soft white surface with a thin warm border, 16px radius, and a layered shadow for subtle depth, with section headers pairing a title and description alongside a count badge. I'm keeping the sail-colored background clean rather than adding texture, then setting up a responsive grid layout that collapses to one column on mobile and splits into a wider primary panel plus sidebar on larger screens.

Now I'm weighing whether the main element should wrap the header too—since the instructions say main wraps the app, but semantically a header/banner usually sits outside main. I'm leaning toward nesting it inside main anyway so all test hooks stay within scope, since a header element nested in main doesn't break landmark semantics in a meaningful way here.

I want to avoid fixed widths beyond 328px and let long names wrap naturally instead of forcing horizontal scroll. For the select element I'm adding a custom chevron using an inline SVG background, and for the checkbox I'm building a pill-shaped chip toggle with a minimum tap target size that highlights when checked.

Styling the checkbox input...

Thinking through focus states, I want the outline to wrap the whole chip when possible using `:has()`, with a fallback outline directly on the input for browsers that don't support it yet, while avoiding a doubled-up outline effect.

For the payer selection, if the current payer isn't among the people listed I'll default to the first person, and selecting a payer shouldn't automatically add them to the split. I'm keeping all expense fields required without extra required-indicator UI since everything is mandatory, making sure pressing Enter in the description or amount field submits the form, and confirming that invalid expenses get a clear inline error while preserving what the user already typed.

I'm also working through amount parsing edge cases like "12.5" becoming 1250, decimal-heavy values like "1.234" erroring out, and invalid, empty, zero, or negative inputs all failing validation. For names, I'm trimming whitespace before duplicate checks so " Ana " matches "ana", and data attributes need to store the exact trimmed name. I verified a three-way $10 split among Ana, Ben, and Cy works out with remainder shares of 334/333/333, resulting in Ben and Cy each transferring 333 to Ana.

I'm settling tie-breaking in the settle-up list by sorting descending by amount then by people index for determinism, making sure transfer amounts are positive integer cents, confirming balances re-render correctly on each change, and computing trip total as the sum of expense cents. For the live region announcing changes, I'm clearing then resetting the message with a timeout so repeated identical messages still get announced.

Writing CSS variables...

Writing header styles...

Now I'm styling the trip total display with a right-aligned overline and large tabular value, then adjusting it to stack into a bordered row for mobile layouts. I'm also setting up the main container's max-width and padding before moving into the card component styles.

Adding card styles...

Placeholder contrast checks out around 4.92, which passes. Now I'm adding hover, focus-visible, and invalid states for the input field, using an outline ring for focus and a thicker red-tinted border for validation errors.

I'm second-guessing whether the signal-colored focus ring might be confused with the error state since they're similar hues—considering switching to a navy ring instead, which tests well against both white and sail backgrounds, though I'm weighing whether a two-tone ring could resolve the ambiguity better.

Decided: focus ring will be 3px solid signal with 2px offset, keeping it visually distinct from error indicators since those also include text and icons. Now moving on to building the amount input with its currency prefix.

Adding button style variants...

I'm thinking through whether the add-expense button should span full width on mobile versus auto-width on desktop, deciding full width works fine as a primary card action. For the person form row, I'm laying out fields with flexbox so the button aligns to the bottom, but realize error text under a field would throw off that alignment, so I need to move error messages below the whole row instead.

Now I'm designing the person form markup with a label, input/button row, and a hidden error paragraph, checking that it fits at narrow widths like 360px, then moving on to style the people list as wrapped chips with avatars, padding, and rounded borders against the card background.

Styling the avatar...

I'm styling the error icon circle, then thinking through accessibility: using the dual `content` declaration trick so screen readers don't announce the "!" glyph in unsupported browsers, and noting the same concern applies to the avatar initial rendered via ::before.

Rather than fighting pseudo-element alt-text support, I decide to just mark those decorative spans `aria-hidden="true"` directly, and wrap the error icon in its own empty hidden child span so the paragraph's accessible text stays clean for the test hook reading textContent.

For the split fieldset, I realize the legend needs to stay a direct child of the fieldset for proper semantics, so wrapping it in a div to align with the toolbar buttons would break that. I'm restructuring so the legend and split-tools sit as siblings directly inside the fieldset instead.

I'm floating the legend left and the split-tools right as a common trick to make the legend render like a normal box, then clearing the chips container below it. The chips get a flex-wrap layout with gap and top margin, and I'm adding a muted preview text line beneath for showing the split summary.

Setting up the expense-form grid to stack fields on narrow screens and switch to a two-column layout at wider viewports, checking the math on how the card's inner width divides at desktop sizes.

Now I'm resetting the fieldset's default border, padding, and margin so it doesn't interfere with the grid, then designing the balances list with each row split into a name/amount line above a bar area, separated by top borders between items, and deciding to keep that stacked layout consistent at all screen sizes rather than adding a wider breakpoint variant.

For the balance row content, I'm pairing an avatar and name with a muted breakdown line showing paid and share amounts, while the right side shows a small muted status label ("is owed," "owes," or "all square") above the numeric value in bold tabular figures for clarity. I'm leaning toward using tabular Public Sans for the balance numbers even though Fraunces looks nicer for the trip total, accepting the mixed typography as fine, and planning an 8px-tall progress bar beneath each row with a special "All square" treatment replacing both label and value when the balance is zero.

Now I'm starting the CSS for the settle-up transfers list, using a counter reset and removing default list styling.

I'm reconsidering accessibility — using ol semantics with role="list" since removing list-style can strip screen reader list announcements in Safari, and deciding to skip visual number circles in favor of a simpler arrow layout for each transfer row showing the payer avatar and name.

Still writing styles...

I'm laying out the expense row with description and amount on top, payer/split details below, and a Remove button anchored to the bottom-right spanning those meta rows, checking that it still fits reasonably at a 360px width.

Now I'm thinking the "Paid by" line should include a small 20px avatar next to the bold name for a nicer visual touch. I'm also styling the undo notice as a flex row with space-between alignment on a light background, with a small quiet-style undo button, and defining an empty-state block with a dashed border and muted text for when there's nothing to show.

I decide against adding decorative icons to the empty states, keeping things lean with just copy and the dashed box instead. I'm also sketching the footer markup with a privacy note and a "Start a new trip" link button, noting I'll swap that note for a warning message if saving ever fails.

I confirm edge cases are fine — selecting "No one," a payer excluded from their own split, and showing balances for every person regardless of involvement — then move into setting up the JS module with its storage key and currency formatter.

Writing the JS setup...

Setting up state management...

Finishing the element builder helper, then writing an avatar function that assigns each person a consistent colour based on their index and renders their initial as a styled badge.

Now I'm writing the load() function to pull saved state from localStorage, falling back to an empty state if parsing fails, and starting a sanitize() function to validate and dedupe the people list.

Finishing expense validation to skip invalid payers or empty splits, then adding a save function that persists state to localStorage and tracks success, plus starting a helper to compute each person's share of an expense.

The sharesFor function divides an expense's cents evenly among split members, distributing any remainder cent-by-cent to the first few people so totals always match exactly. I'm now starting a computeBalances function that initializes a row per person tracking what they paid, owe, and their net balance.

Writing balance calculation logic...

Writing error-clearing logic...

I'm confirming that since hidden error text is emptied, nothing gets announced accidentally even though it's referenced via aria-describedby. For the split-checkbox error, I'll attach describedby on the fieldset, focus the first checkbox, and route the message through a live region—now writing the announce function that clears and resets the live text with a timeout.

Next I'm wiring up the "add person" form submit handler: it trims the name, rejects empty input or duplicates (suggesting a last-initial disambiguation), then pushes the new person into state, marks them checked for splitting, resets the input, commits the change, refocuses the field, and announces the addition.

Now I'm starting on the expense form submission handler...

I need to check first whether any people exist on the trip—if not, I should show an error since there'd be no one to assign payer or split to. I'll add a general error slot in the expense form for this case, display "Add at least one person to the trip before logging an expense," and decide validation order: check for people first, then description, amount, payer, and split.

Still writing submit handler...

Now I'm writing the parseAmount function to strip currency symbols and whitespace, validate the input isn't empty, and handle negative sign detection.

Still finishing parser logic...

I'm tracing through edge cases: a lone decimal point hits the format error correctly, trailing-dot amounts like "12." parse fine, and tiny negative decimals trigger the decimal-length error before the negative check, which is acceptable either way. The description validation order matches the spec, so now I'm moving on to wiring up the payer change event listener.

Now I'm building the split checkbox handlers, the everyone/no-one toggle buttons, and the amount/description input listeners that clear errors and refresh the preview. Then I'm writing renderFormOptions, which recomputes a signature for the people list and rebuilds the payer dropdown options when that list changes.

Still writing payer/split sync logic...

Writing preview message logic...

Rendering the person list items with just names, then handling the empty-state toggle and people count label. For balances, I'm computing each person's net as a percentage of the max absolute balance to drive a visual bar, labeling it "Is owed" or "Owes" depending on sign.

Finishing the balance bar markup with the fill width based on percentage, then double-checking that net never ends up as negative zero so the display stays clean. I'm also considering adding a helper note under the list when there are no expenses yet, prompting the user to log one to see balances update.

I like the idea of a trust-building footer: when balances are non-zero, show a line confirming that what's owed and what's owing both total the same amount, reinforcing that everything evens out. For the transfers section, I'm computing the settle-up list from the rows, handling three states: an empty prompt when there are no expenses at all, a calm "you're all even" message with a check icon when no transfers are needed, and otherwise the actual list with a footer.

For the expenses list, I'm rendering newest-first with each item tagged by id, showing the payer's avatar and name, then a line describing the split—either "Just for Ben" for a single person or "Split between Ana, Ben and Cy" with the per-person share amount, accounting for cases where the split isn't perfectly even by showing a small range like "$28.06 or $28.07 each."

I'm also adding a remove button with hidden descriptive text for accessibility, and wiring up a delete handler that finds the expense by id, calculates its displayed position for undo purposes, splices it out of state, and stores the removed expense so it can be restored later.

After removal I want focus to move sensibly—back to the next delete button in the list, or to the Undo button if nothing's left—and I'm announcing the removal via a live region so screen reader users know they can undo it. Now I'm starting the undo logic itself, which needs to validate that the payer and split participants from the removed expense still exist before restoring it to its original position.

Totals show trip sum and a meta line with expense/people counts, falling back to "No expenses yet". For the copy-to-clipboard function, I'm building settle-up text lines, attempting the clipboard API with a textarea fallback for older browsers, then updating the status message.

I'm deciding to keep the settle card's footer static rather than re-rendering it, so the copy status doesn't get wiped out. For the reset button, I'm adding a confirmation dialog before clearing all people and expenses back to an empty state.

I'm also wiring up a storage event listener so changes in another tab sync by reloading state and re-rendering, and setting the footer's save note to warn users if localStorage isn't working. Finally I'm sketching out an ID generator function for new entries.

Now I'm thinking through the finer UI wording: showing the trip total prominently in the header, clarifying the "Split between" legend with a count like "(3 of 4)," and writing distinct empty-state messages depending on whether people exist yet. I'm also debating the clearest button labels for selecting everyone versus clearing the selection, since "Everyone"/"No one" could be ambiguous without context.

Checking that the legend and selection controls fit comfortably at narrow widths, then adding the Google Fonts preconnect and stylesheet links for Fraunces and Public Sans.

I'll add a small inline SVG favicon to keep everything self-contained, skip dark mode to preserve brand contrast, and use optical sizing for Fraunces. Now I'm starting to write the full HTML document with meta tags, title, and description.

Setting up the head with font preconnects, stylesheet link, and the opening of the masthead and brand elements in the body...

Finishing the layout structure with balances, settle, and expenses sections, then adding a live region and footer. Now I'm thinking through whether the tally display belongs in the header or main, deciding it's fine outside since it's just a readout, and sketching how it should stack responsively on mobile with the label and value arranged in a grid.

Now I'm sketching the "Who's on the trip" card with a heading, subtitle, a count badge, and the start of a form for adding people to the trip.

Building the expense form now, starting with a description field for what the expense was for.

Adding form fields...

Checking accessible names and label pairings, then moving on to review the balances card markup.

Still drafting the HTML markup...

I finish the footer with a reset link to start a new trip, then design a calm "all even" empty state with a different visual treatment than the dashed empty state—using a muted background and reassuring copy like "You're all even" instead of a border. Now I'm starting the final CSS reset and base styles.

Writing base styles...

Still writing masthead styles...

Checking that light gray text against the navy background gives a contrast ratio around 7.8, which passes comfortably. Now I'm setting up the overall app container with max-width and padding, and starting the grid layout structure.

Styling the card header...

Still writing input styles...

Writing form styles...

Adding more button variants...

Still writing styles...

I'm checking the grid math for the money input field with its dollar sign prefix, confirming the layout holds up at both desktop widths and the 480-920px breakpoint range.

Adding checkbox-styled chip states...

I'm checking contrast ratios for the chip borders versus checkbox borders, and verifying the legend float behavior works correctly at narrow widths when the split-tools wrap below.

For the checkmark SVG, I'm thinking through how it renders as an inline data URI with a simple stroke path, but I need to consider forced-colors mode on Windows, since the background-image approach for the custom checkbox might get stripped out entirely when high contrast mode is active.

I'm adding a media query fallback so the checkbox reverts to its native appearance under forced colors, preserving accessibility. Now I'm styling the people list with pill-shaped avatars and flexible wrapping.

Adding empty-state styling...

Now I'm building the balances list layout, with each balance row using a grid structure for the person name, amount, and progress bar underneath.

Adding bar visualization styles...

I'm thinking through the balance check text styling and wording, like "Owed and owing both total $66.67, so it all evens out," and considering whether a small legend is needed to clarify which side of the bar represents owing versus being owed.

Now I'm styling the transfers list, laying out each transfer as a flexible row with party names and verb text between them for readability.

I'm reconsidering the empty-state copy status element—rather than fighting flex gap spacing, I'll place it as a separate block after settle-foot with its own margin, accepting minor height when empty.

Now I'm building out avatars, the arrow icon, and the expense list structure with a grid layout and top-border dividers between items.

Adding styles for the notice banner...

Now I'm defining the footer layout with flex spacing and muted colors, confirming contrast on the sail background passes at 5.58, then adding a reduced-motion media query to disable transitions and animations for accessibility.

I'm also considering a subtle entrance flash animation for newly added expense items, fading from harbour-50 to transparent, but deciding it adds complexity with negative margins for the background bleed and might skip it in favor of simpler feedback like updating the total and announcing the change live.

Since the expenses list sits below the form on mobile and the header total may be scrolled off, I'm adding an inline status line below the add button that confirms "Added Groceries ($84.20), paid by Ana" and persists until the next submission, replacing the need for a separate live announcement for that action. I'll style this status line with the harbour color scheme, a checkmark, and soft background padding.

Now I'm starting the JavaScript module, setting up storage key constants, currency formatting helpers, and a list formatter for joining names naturally.

I need to check the hoisting order for load() and storageWorks, make sure the expense status message clears properly on errors, and handle the edge case where no people exist yet so the payer dropdown doesn't get stuck on a disabled placeholder.

When the people list is empty I should also hide the split tools, and verify that adding a new person re-renders the split checkboxes while preserving existing checked states through the splitChecked map. Now I'm writing the renderExpenses function to display the expense count with proper pluralization.

For empty expenses, I'm showing a contextual empty state message depending on whether people exist yet, and reversing the expenses list for display when items are present.

I'm computing how to split each expense evenly among its members, handling remainder cents by showing a range, then building the list item markup with description and split summary text.

Still working out grid placement...

I'll just set explicit rows for the meta elements instead, and rename the shares class to avoid confusion with the data-testid. Now I'm handling the empty states for balances and settle views, writing friendly placeholder copy for when there are no people or expenses yet.

For the settle summary I'm computing when everyone's even by checking if owed totals balance out, writing phrases like "you're all even" and pluralizing payment counts correctly. I'm also building the totals header meta text that shows expense and people counts, falling back to "nothing logged yet" when empty, then starting the setEmpty helper function.

Writing setEmpty helper...

Now I'm adding the copy-to-clipboard function for settle-up transfers, formatting each transfer as "X pays Y amount" and attempting to use the clipboard API with a secure context check.

I'm checking that storage sync resets split selections and forces a rebuild for new names, and making sure test IDs stay unique across elements. I'm walking through the Playwright test cases—filling amounts, clicking add-expense, verifying checkbox defaults, and confirming people get added correctly.

I'm also tracing through validation scenarios: duplicate names show form errors without adding a person, invalid expense amounts (like negatives, zero, or too many decimals) keep the typed values and show errors, while valid entries clear those errors. I'm confirming remainder handling, transfer sums, and that reloading the page persists state from localStorage while leaving transient choices like payer unsaved, then checking the layout doesn't introduce horizontal scrolling at narrow viewport widths.

Checking potential overflow sources at 360px: chip and person name spans use overflow-wrap anywhere with min-width zero so long names wrap instead of overflowing, and large totals should fit within their allotted column widths.

I'm verifying the mobile layout math at 360px — the person row input and "Add person" button fit within the card's inner width, the form collapses to a single column below 480px, and headers/footers wrap naturally. I also want to make sure the balance and tally numbers stay large and legible since people will be passing one laptop around a table.

Checking focus-visible contrast: the checkbox outline against the chip's light background passes contrast ratios comfortably, as do footer links against the sail-colored background. For the expenses heading with tabindex -1, I'll focus the Undo button when the list empties, keeping the heading as a fallback only if Undo isn't present.

Switching to the fonts now—Fraunces falls back to Georgia, Public Sans falls back to system-ui, and I'm relying on Public Sans' tabular figures support since it's based on Libre Franklin which has that built in. Now I'm writing the SVG mark logo, starting with a clip path defining a hull shape for the navy background version.

Simplifying the hull arc into a cleaner quadratic curve path, and considering adding a subtle waterline beneath the keel to suggest the boat sitting level in water.

Still drawing hull shape...

Calculating trapezoid coordinates so the stripe's slanted edges align precisely with the hull's taper...

Moving to copy decisions: keeping "owing" framed as neutral and temporary rather than negative, using brass instead of red for owed amounts, and keeping error messages calm, like directing users to the Name field when no people exist yet. Now I'm ready to write out the full implementation.

Balances should count correctly per person, and names only need to match exactly as strings, even with odd spacing or special characters since I'm using setAttribute safely. Now I'm writing the helper function for creating DOM elements with their properties and children.

Adding the SVG arrow icon...

Writing the settle-up rendering logic...

I realize the adjacent spans could concatenate without spaces for screen readers, so I need to insert explicit whitespace text nodes between the party, verb, and amount elements to keep the reading natural.

Finishing the undo render to hide or show the notice with removed expense details, then handling the commit function that saves and re-renders, plus the undo button's accessible label wording.

I'm writing a function to toggle the save status message, showing a confirmation when storage works and a warning about private browsing when it doesn't, styling the warning state accordingly. I also note that cross-tab storage events and adding people while an undo is pending don't need special handling, and that select/clear buttons still need review.

Clicking those buttons should refresh the preview and clear split errors, and checkbox changes fire properly for split calculations too. I'm verifying focus visibility works correctly across inputs via keyboard and mouse, making sure no outlines are accidentally suppressed, and considering adding scroll-margin-top so focused elements aren't hidden behind sticky headers.

I'm double-checking select styling (chevron, padding, min-height), simplifying field layout to block instead of grid, and confirming color contrast ratios for badges and labels all meet accessibility standards. Now I'm thinking through the overall desktop header composition.

For the settle-up card, I want to give it slight visual emphasis as the payoff moment — considering a top accent border or an inset shadow stripe using the signal color to make it stand out from the other cards without overpowering the layout.

I'm also finalizing details like font loading with display=swap, adding a color-scheme meta tag to avoid unwanted dark-mode form controls, confirming no unsafe innerHTML usage, and writing a parseAmount helper that correctly handles unicode minus signs in input strings.

Still writing parser...

I'm also capping whole-number length to avoid absurdly large values, and checking the header/stripe spacing works visually against the body background. Now I'm writing the form-status styling for flex alignment and spacing.

Thinking about the status role accessibility though — a display:none element that becomes visible might not reliably get announced by screen readers, so I'm reconsidering: better to keep it always rendered but collapse its padding and background when empty, and move it outside the grid with its own margin-top so it doesn't leave a gap when hidden.

I'll add a people chips section listing everyone on the trip, then write out the final file. I'm also refining small details like uppercasing initials for avatars and reconsidering the color palette so no one's avatar reads as a negative signal.

Checking contrast ratios confirms plum works better than the dark red tone, so I'll settle on navy, teal, brass-dark, slate, moss, and plum as the avatar colors, then start writing the preview update logic.

For the split preview, I'm handling empty states first—hiding it if there are no people, showing a prompt if no one's selected—then building a human-readable description of who's splitting the cost (singular name, "everyone," or a count) and prompting for an amount if none's entered yet.

For the amount breakdown itself, I want one person to see "covers the full $X," equal splits to show "$X each for N people," and uneven splits to list amounts per person with a note that leftover cents go to whoever joined the trip first—keeping things transparent. I'm also defining checkedMembers() to read the checked checkboxes from the DOM and filter the people list down to just those selected.

Now I'm ready to write out the complete file in one pass, double-checking that split-tools stays hidden when there are no people, and confirming that floating the legend and tools in the fieldset still lets the chips clear both properly in Chrome.

