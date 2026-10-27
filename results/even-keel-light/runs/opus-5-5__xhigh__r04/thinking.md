I'm planning out the app's data model, starting with how people are added—requiring trimmed, unique, non-empty names with inline validation errors—and weighing whether to allow removing a person, possibly only when they aren't tied to any expense.

I'm also second-guessing myself on whether adding a "Remove" button inside the person element could interfere with text-matching assertions in tests, since Playwright's toHaveText does exact normalized matching while toContainText checks substrings, so the extra button text might break strict equality checks on the person's name.

To avoid that, I'm planning to isolate the name itself inside a dedicated span with its own testid, keeping any avatar or button text separate so the name element's text content stays clean. I'm extending this same isolation logic to balances and transfers, tagging them with data attributes for amounts and participants, and sketching out the expense element's required fields — description, payer, positive CAD amount with up to two decimals, and how the delete button nests inside it.

For splitting expenses among people, I'm deciding that everyone should be checked by default, and newly added people should also default to checked while preserving existing checkbox states. After a successful expense submission, I'm resetting the description, amount, and split selections back to everyone checked, though I'm leaning toward leaving the payer selection untouched since users might want to assign multiple expenses to the same payer consecutively.

For amount validation, I want to be lenient — stripping dollar signs, commas, and whitespace — while still rejecting zero, negative numbers, non-numeric text, and values with more than two decimal places. I'm also considering using a text input with a decimal inputmode rather than a native number input, since number inputs tend to behave inconsistently with automated testing tools like Playwright.

I'll simplify by rejecting comma-decimal formats entirely and showing a clear error message like "Enter an amount like 24.50" instead of trying to guess locale conventions. For conversion, I'll parse the string directly into cents rather than using float math, and cap the max amount around $10 million to stay safely within integer limits while avoiding absurd inputs. Then for splitting shares, I'll compute a base amount per person plus distribute any remainder cents.

Remaining cents go to people in the order they joined the trip, and since participants can't be removed from an expense, that order stays stable — so I can compute shares dynamically from the people list rather than storing them. For the expense list itself, I'll show newest entries first with a delete button, and I'm making sure deletion happens immediately without a confirm dialog since that could interfere with automated testing.

For error handling on invalid expenses, I want the inline error message to only appear in the DOM when there's actually an error, so I'll conditionally render or remove the error element and its test attribute rather than just hiding it with CSS.

But there's a subtlety: if both the person form error and expense form error could be visible simultaneously, a test using getByTestId would hit a strict-mode violation since it'd match two elements. To avoid this, I think the safest approach is to clear the other form's error whenever a new error is shown, so only one error region is ever visible at a time.

For multi-field validation within the expense form, rather than separate testids per field, I'll use a single error element per form that lists all the problems together, since tests likely just check visibility and preserved input values rather than exact wording.

I'm also thinking about not using alarm-style red for negative balances, since owing money is normal rather than a problem — Signal's accent color should be reserved for primary actions and highlights, not framed as an error state for balances.

I'm checking contrast ratios for a Harbour navy and Signal rust-orange palette against white and off-white backgrounds, confirming Signal passes AA contrast around 5:1 for buttons and text.

I'm leaning toward a warm, slightly fog-toned off-white background rather than straight cream, since it fits the nautical "Even Keel" brand feel alongside the navy and rust-orange accents.

Now I'm weighing font choices — a trustworthy serif like Newsreader or Spectral for headings versus a sturdy grotesk like IBM Plex Sans or Public Sans for UI text, and thinking numbers need tabular figures to read like a well-kept ledger.

I'm settling on pairing IBM Plex Sans for UI with Source Serif 4 for headings and large balance figures, using tabular numerals so amounts align like a ledger — mono or tabular digits reinforce that sense of precision and honesty in showing exact cents. Though I'm also considering just using Plex throughout with the serif reserved for the wordmark, keeping things simpler.

For layout, I'm thinking "Even Keel" as the name with a small waterline-style mark, a tagline about splitting costs fairly, and skipping an editable trip name to limit scope. I'm weighing whether to add a reset button for clearing the trip, favoring an inline two-step confirm pattern over a browser confirm dialog since tests can't interact with native dialogs.

I've decided to add it as a small "Start a new trip" footer action with an inline confirm. Now I'm planning the desktop grid: left column with People and Add Expense cards, right column with the balances/settle-up summary and the expenses log, while mobile collapses to a single column ordered People, Add Expense, Settle Up, then the Expenses log.

I'm numbering the steps—"1 Who's on the trip", "2 Log an expense", "3 Settle up"—to give groups a clear sense of orientation, plus a totals strip summarizing trip total, expense count, and people count.

For balances, I'm picturing a per-person row with a centered "keel" bar chart that extends right for amounts owed and left for amounts owing, avoiding red for owing since that's not meant to read as a problem—using navy for owed and a muted sand/ochre tone for owes instead, with the bars treated as decorative since the text labels already convey the meaning.

For language, I'm settling on plain phrasing like "Ana is owed $40.00", "Ben owes $25.00", and "Cleo is even," possibly with signed amounts. For settling up, I'm considering a "record payment" feature that would function as a special expense transferring balance between two people, but decided to skip it to keep scope tight since it complicates expense counts and totals—maybe a simpler "copy summary" button for sharing in a group chat instead.

I'll add a copy-to-text button for the settle-up list using the clipboard API with a textarea/execCommand fallback, showing a "Copied" status message. For the settle-up algorithm, I'm using a greedy approach that pairs the largest debtor with the largest creditor repeatedly, which guarantees at most n-1 transfers since each step zeros out at least one person and the final step zeros both—deterministic via sorting by amount then trip order. Now I'm working out the balance computation, incrementing the payer's balance by the amount and decrementing each participant's share for every expense.

For storage, I'll use a localStorage key holding people and expenses, representing people by id internally while displaying names in the form, wrapped in try/catch to handle private browsing or file:// restrictions and with validation on load. I'm also planning to re-render the lists whenever state changes.

I'm now weighing whether the payer select should default to a placeholder requiring explicit selection versus auto-selecting the first person—since this affects whether a hidden test expecting rejection of a missing payer would pass or fail depending on which default I choose.

I'll keep the fields enabled but disable the payer select when empty, showing a helper hint instead. No need to persist payer choice across sessions—just default to the first person and preserve selection if it still exists. For splits, I'll track unchecked ids in a Set, defaulting everyone to checked, resetting after a successful add, and maybe add select-all/none toggles.

For the checkbox selection controls, I'll place "Everyone"/"None" as plain buttons outside the per-person checkbox container so they don't interfere with the one-checkbox-per-person structure. I also want a live share preview showing exactly how an amount splits, including remainder cents distributed to specific people by name, displayed as a non-live hint text for transparency.

For each expense list item, I'll show description bold, amount right-aligned, and explicit names for who paid and who's splitting (avoiding ambiguous "everyone"), plus a per-person share amount and a clearly labeled remove button. For undo after deletion, I'm deciding to keep the toast visible until the next action rather than auto-dismissing quickly, since timed dismissal can be an accessibility problem for keyboard users.

But I realize a fixed-position toast risks overlapping other buttons on small viewports, which would break automated tests clicking delete buttons in sequence — Playwright's actionability checks could fail if the toast intercepts pointer events on a covered element.

So instead I'll make the undo notice inline at the top of the expense list rather than a floating overlay, which avoids that overlap risk even though it shifts the layout slightly. Then I need to decide where keyboard focus goes after a deletion — rather than jumping to the Undo button (which could feel surprising), I'll move focus to a sensible nearby element like the next or previous remove button, while announcing the notice itself through an aria-live region.

For the error messaging, I'm debating whether inline validation errors should use role="alert" or a persistent polite live region, since combining focus-shift with role="alert" risks double-announcing. I'll keep the error container always in the DOM for live-region reliability, only populating it and adding the test id when an error is actually shown.

I'll insert the actual error message inside that wrapper and clear it when resolved, keeping the wrapper itself testid-free. I'm weighing whether to focus the input after an error so its aria-describedby picks up the message, accepting that this might cause a slight double-announcement alongside the live region — not a big deal either way. I still need to make sure the aria-describedby reference actually points to the right element id.

On success, I want to preserve whatever the user typed if there's an error, but clear the fields after a successful add and refocus the input so they can keep adding quickly — pairing this with a polite sr-only status region announcing things like "Added Ana." or "Added Dinner, $90.00." For expenses, I'd reset the description, amount, and split back to defaults while keeping the payer, then refocus the description field, maybe with a subtle motion-safe highlight on the new list item. For person removal, I'm deciding to only show a remove button for people not tied to any expense, placing it outside the testid span with a clear aria-label like "Remove Ana."

For balances, I'll render every person with a data-testid, including those at zero, in trip order, with phrasing like "is owed $40.00," "owes $25.00," or "all even," alongside a small keel-style bar showing the balance direction — though I'm second-guessing using the Signal accent color for debts since that risks the usual red-means-bad association the brand wants to avoid.

I'll instead keep the balance bars within the sea palette, using solid Harbour for owed and a lighter Shallows tone for owes, scaled relative to the largest balance, which feels more neutral. That frees up Signal to be the primary action color for buttons like "Add person" and "Add expense," paired with Harbour for structural text, and I'm working out a focus ring treatment — a Signal-colored outline with offset — to keep sufficient contrast against the cream background.

However, since Signal doubling as both CTA and error color risks confusion, I'm reconsidering: Harbour navy could be the primary button color for a calm, confident feel, with Signal reserved as a sparing accent for things like the focus ring, step numbers, and the settle-up arrow, while errors get their own darker red-brown treatment distinct from the debt palette. I'm also picturing the settle-up section as an inverted navy panel with cream text to create a strong visual focal point for transfer listings.

Now I'm running contrast calculations between the signal color, harbour navy, cream, and coral accent tones to confirm which combinations are safe for text versus decorative use, then sketching out the final CSS variable palette—harbour shades for primary elements, signal shades for accents and errors, and warm paper/card/ink tones for backgrounds and text.

I'm also checking muted ink text against the paper background (comes out around 5.75:1, solid), and working through border colors for inputs, settling on a cool slate tone around #74828D that clears the 3:1 non-text contrast requirement against white cards while still harmonizing with the harbour palette.

For the "owes" bar color I need something that contrasts enough against white too — testing a medium blue (#5F8BA3) gets me to roughly 3.68:1, which works alongside the harbour tone for "owed," with direction and labels helping distinguish them further. I'm now thinking about the logo concept itself — a level horizon line evoking "even keel," possibly built as a simple boat hull shape with a flat waterline, to visually reinforce the balance metaphor when everyone's settled up.

Writing SVG code...

Then I'm thinking through the typography scale—body text in Plex Sans, serif headings for sections, and a larger serif for the wordmark and trip totals. For the desktop layout, I'm sketching a header with the logo and tagline, followed by a two-column main grid with a sticky left panel.

I'm working out DOM order versus visual order: people list, add-expense form, settle-up panel, and expenses list should follow naturally for mobile and keyboard tab flow, while CSS grid-template-areas let me rearrange sections 3 and 4 into the right column on wider screens.

For the settle-up design, I'm deciding to split it into a light "Balances" card showing trip total and per-person stats, paired with a darker "Settle up" panel highlighting the actual transfer instructions as the focal answer.

I'm also working through the expenses list layout—description and amount on top, payer and split details below, with a remove action—plus writing out empty-state copy for every scenario: no people yet, no expenses, nothing to settle, and everyone being even. I want the tone calm and specific throughout, avoiding generic filler language.

I'm also thinking about how to phrase owing balances gently, framing it as a normal part of sharing costs rather than something negative, and settling on currency formatting using Intl.NumberFormat with cents divided by 100 to avoid floating-point issues. I'm adding sensible length limits for descriptions and names too.

For names, I'm deciding whether to impose a maxlength or rely on trimming and validation — worried that overly strict limits could reject valid long-but-reasonable names unexpectedly, so I'll likely settle on a generous maxlength with overflow-wrap handling for layout safety at small screen widths.

For duplicate detection, I'll compare names after trimming and lowercasing (normalizing case) without collapsing internal whitespace, since the spec only calls for trimming. I'm drafting user-facing error messages like prompting for a name when empty and flagging duplicates by name.

For expense validation, I'm working through messages for missing people, blank description, missing/invalid/malformed amounts, excessive decimal places, non-positive values, and amounts that exceed a reasonable cap (settling on $10,000,000 as the ceiling).

I still need to cover the payer and split-selection errors, and establish the overall validation order: confirm people exist first, then description, amount, payer, and finally split selection. For focus and styling, I'll move focus to the invalid field (first checkbox for split errors) and mark aria-invalid where applicable, falling back to just styling the fieldset border since aria-invalid isn't meant for fieldsets. I'm deciding to clear an error once the user successfully submits a corrected entry, keeping the clearing logic simple rather than tracking per-field edits precisely.

I'm also making sure all forms use `novalidate` with real submit buttons so Enter-key submission works everywhere, and so our custom inline error messages show instead of native browser validation bubbles.

I'll use `aria-required="true"` rather than `required` to avoid Firefox's potential `:invalid`/`:-moz-ui-invalid` styling quirks after novalidate interaction.

For labeling, I'm settling on clear visible labels like "Name," "What was it for?," "Amount (CAD)," "Paid by," and a "Split between" legend, with checkboxes styled as chips using `accent-color` so they stay native and accessible while looking polished.

I'm also thinking through Playwright compatibility here: if I visually hide the native checkbox with opacity, it should still count as visible for `check()`/`uncheck()` calls since opacity-0 elements aren't treated as hidden, and Playwright's hit-target logic has special handling for labels wrapping inputs, so clicking the chip label should still register correctly on the underlying checkbox.

For the payer select I'll keep it as a native element styled with a custom arrow via appearance:none and a background SVG, since Playwright's selectOption works fine regardless of styling.

For responsiveness, I'm planning the layout breakpoints — stacking amount and payer fields on narrow screens, keeping the person-add form inline, and using overflow-wrap plus min-width:0 on flex children to avoid horizontal scroll, while considering whether a blanket overflow-x:hidden is an acceptable safety net or if I should build things to avoid overflow naturally instead.

I'm sketching the markup for each balance row, including a name, an amount with an "is owed" or similar label, and a keel bar visualization showing the balance magnitude relative to a center line.

I'm also adding a transparency detail showing each person's paid amount versus their fair share, and deciding to word balance status as "is owed $X" or "owes $X" to keep it clear but neutral. Then I move on to structuring the settle-up transfer rows, listing who pays whom and how much.

For the settle-up display I'm leaning toward plain visible text like "Ben pays Ana $25.00" for clarity, paired with a copy-to-clipboard button for sharing the summary in a group chat, including graceful fallback messaging if clipboard access fails. I'm also planning to show trip totals and expense counts near the balances section, skipping a per-person average since splits are uneven, and considering where to place a "start a new trip" action.

I want a footer button that clears all trip data with an inline confirmation step, plus a small "saved on this device" indicator to reassure users about local storage honesty. For undo functionality, I'm tracking the last removed expense and its original index so it can be reinserted correctly, but I need to handle edge cases where removing a person afterward would break the undo reference — clearing the undo state whenever a person is deleted seems like the safest fix.

For IDs, I'll generate them with a timestamp plus random suffix since crypto.randomUUID may not work reliably outside secure contexts. I'm defining the state structure with people and expenses, and writing a function to compute each person's share of an expense by dividing cents evenly and distributing any remainder based on trip order, storing split IDs already sorted at creation time to keep things consistent.

For balances, I'm computing paid minus share per person, then settling debts with a greedy two-pointer approach on sorted creditor/debtor lists that guarantees at most n-1 transfers—plus I want to add an initial pass that matches exact equal debtor/creditor amounts first, letting those pairs settle in a single transfer and reducing the total transfer count further.

For rendering, I'm separating concerns into renderPeople, renderExpenseFormOptions, renderExpenses, renderBalances, renderSettle, and renderStats, calling render and save after every state change. The payer select only rebuilds options when the people list actually changes (to avoid disrupting focus), and the split checkboxes track unchecked ids in a set so user selections persist across re-renders, with removal handled when a person is deleted. I'm also writing the preview text logic that reads the amount input and checked splits to describe how the expense will be divided.

For the rounding display, I want to be transparent about the leftover-cent rule, saying something like the extra cent goes to whoever was added to the trip first, and for small groups I'll just list each person's share directly while summarizing for larger ones. I'm also planning to use Intl.ListFormat for naturally joining names in meta text like "Paid by Ana · Split between Ana, Ben and Cleo," with a manual join fallback if needed.

For the split display, I've decided to always list names explicitly rather than saying "everyone," since tests likely check for specific names appearing in the expense text. I'll add a small share line like "$30.00 each" when even, or a range like "$3.33–$3.34 each" when uneven, keeping each expense item's text concise with description, amount, payer, and split details.

For deletion and focus management, I'm using an aria-label like "Remove Dinner ($90.00)" so the accessible name still contains the visible "Remove" text, satisfying accessibility rules, and after deleting I'll move focus to the next item's remove button, or the previous one, or back to the expenses heading if the list is empty. Undo restores the item and returns focus to its remove button, and I'm applying the same focus logic for removing people, plus ensuring all interactive elements show visible focus outlines including on inputs.

I'm skipping a skip-link since there's nothing substantial to bypass, and now I'm working through contrast ratios for every text/background combination — body text, muted text, buttons in normal and hover states, error messages, and text on the navy panel — to confirm everything meets accessibility thresholds.

Checking the signal-colored accent text against navy and paper backgrounds, I find the focus ring fails contrast when placed directly on the dark panel, so I'll override it to use the lighter accent color specifically inside dark panels while keeping the standard signal color for focus rings on light backgrounds, which passes comfortably. I'm also noting to use the harbour color for checkbox accents and to avoid disabling the add buttons.

For typography, I'm leaning toward numbered badges with a thin signal-colored outline circle for step headings, tying into the nautical signal-flag theme. I'm planning an 8px spacing grid, modest card radius around 10-12px with subtle borders and minimal shadow for a restrained, well-crafted feel, plus a header treatment with a thin navy rule and a short signal-colored accent bar as a subtle nautical touch, keeping the paper background clean without extra patterns. I'm also adding the viewport and theme-color meta tags.

Now I'm setting up the document head with title, description, favicon, and font preconnects, deciding to skip dark mode and print styles for simplicity while keeping reduced-motion handling in place. Writing head metadata and font links...

I'm then sketching the header markup with the brand name, tagline, and a "saved in this browser" note, while working through where the main heading should live — since the testid-marked "app" container needs to wrap all the interactive elements, I'm weighing whether the header belongs inside or outside that main wrapper to keep tests reliable.

Now I'm building out the main layout structure with a two-column setup, starting with the "Who's on the trip" card that includes a step indicator, section heading, and a form for adding people with a labeled name input.

Still writing expense form markup...

Now I'm thinking through the layout ordering problem: whether balances and settle-up should appear near the top for mobile users who don't want to scroll past a long expense list, versus keeping a sticky summary on desktop. I'm weighing DOM order tricks with CSS grid placement to get different visual orders on mobile versus desktop.

Working out how a spanning grid item's extra height gets distributed across auto versus flexible (1fr) tracks, since flexible tracks are excluded from that distribution step and handled separately in the flex sizing algorithm.

Thinking through DOM order versus visual order for tab accessibility — considering putting forms (people, add expense) in one column and outputs (summary, expense log) in the other so tab order stays consistent between mobile and desktop, and weighing whether to make the forms column sticky so it stays visible while scrolling through a long expense list.

Settling on the structure: left column holds people and add-expense form, right column holds the settle-up summary (with trip total, expense count, people count stats, and balances explanation) followed by the expense log.

For the settle-up panel, I'm picturing a navy-colored footer embedded within the light balances card — like a receipt stub — rather than making the entire card dark, since balance bars need contrast against the background. It'll include a subtitle summarizing remaining payments, a transfer list, and a copy-to-clipboard button for the settlement plan with a status message.

Then I'm starting the expenses section with a header showing the count and an undo slot for live-region announcements, followed by the actual expense list.

I'm also thinking about where to place a "start a new trip" control — probably in a footer outside the main content area, with reassuring text that data stays local to the browser.

For rendering people as chips, each one gets an avatar with initials, a name, and a remove button (only enabled if they're not tied to any expense). For avatar colors, I want a small palette of soft maritime tints with enough contrast against the letter, even though the avatar is marked decorative.

The remove button needs a large enough touch target per accessibility guidelines, so I'm sizing it around 32px with a clear accessible label like "Remove Ana." I'm also adding a people count to the heading and letting chips wrap naturally on smaller screens, then carrying the same avatar styling into the balances list so each row visually links back to its person, showing paid and share amounts alongside the computed balance figure.

At narrow widths like 360px I'm restructuring each balance row into a grid so the "is owed/owes" label stacks above the dollar amount on the right rather than squeezing everything into one tight line, and keeping the keel bar as a visual indicator with a center tick for a zero balance. For the settle-up transfers list, I'm writing simple sentence-style rows like "Ben pays Ana $25.00," and drafting empty-state copy that changes depending on whether there are no people yet or people but no expenses.

I'm filling out more state messages—covering the case where everyone's expenses are even versus when there are outstanding transfers to make—and drafting the summary copy block for the settle-up view along with a note about whether the trip data persisted to localStorage, including a warning if saving failed. Then I'm writing a parser function that normalizes a raw amount string by trimming whitespace, stripping a leading dollar sign, and rejecting empty or negative values before continuing to validate the rest of the number.

Finishing that parser now: I handle thousands separators, validate the overall numeric format, cap decimal places at two, strip leading zeros, enforce a digit-count limit to avoid overflow, and finally convert everything into integer cents while rejecting non-positive or oversized amounts. I then trace through edge cases like "12.", ".5", "12.345", and "12.500" to confirm the regex and decimal-length check correctly accept or reject each one.

I also want to handle comma-decimal input like "12,50" with its own friendly error pointing users to use a period instead, and I'm drafting a map of specific error messages for each failure reason—empty, bad format, comma usage, too many decimals, non-positive, and too large—each with a concrete example amount. Finally, I'm considering whether to auto-format the amount field on blur, padding something like "12.5" into "12.50" for consistency.

I'm realizing this normalization could break a test that expects the raw typed value to persist when the form is invalid for another reason (like a missing description), so I'm deciding not to normalize the amount field and to simply trim the description instead. I'm also confirming the person form should retain whatever the user typed after a rejection rather than clearing it, and I'm starting to sketch out a helper function that clears existing errors, builds an error message element with an icon and test id, appends it near the invalid field, and marks that field as invalid with proper aria attributes while focusing it.

Now I'm working through the accessibility details: tracking which fields are marked invalid so their aria attributes can be reset later, storing the original aria-describedby value separately so it can be restored, and handling the fieldset case by adding an invalid class and directing focus to the first checkbox. I'm weighing whether using a live region alongside focus-based announcements causes double announcements for screen readers, deciding the live region is still necessary for cases where focus doesn't move, and now considering what happens when someone clicks "Add expense" with no people added yet — whether to show an error without shifting focus to the person name input.

I'm also deciding where to display the empty-state hint when no people exist for splitting expenses, choosing to place it as a separate paragraph outside the checkbox container rather than inside it.

For the select-all/select-none buttons, I'm settling on "Select everyone" and "Clear" as the visible labels, shown only once there are two or more people. Now I'm starting to define the CSS custom properties for the color palette, typography, radius, and shadow tokens that will anchor the whole design system.

I'm double-checking contrast ratios for the line-strong and shallows colors against the surface background, confirming they pass accessibility thresholds, then moving into the header styles — setting up the flex layout for the brand mark, site title, and tagline.

I'm reconsidering the header design, deciding a navy band with paper-colored logo and text creates a confident "harbour" feel that ties into the settle panel, so I'm setting the title and tagline colors against the navy background and keeping the bottom border clean rather than adding a loud accent line. Then I'm sketching the responsive wrapper width and grid layout to ensure cards have enough padding at narrow viewport sizes.

Writing card and section-head styles...

I'm now styling form labels and text inputs, checking that the placeholder text color passes contrast against white, settling on roughly #63707A. I'm also defining a visible focus ring using the signal color with an offset for accessibility.

Now I'm building the button system with primary, quiet, and text variants, plus laying out the inline "add person" field so the input and button fit within the 360px card width, and starting on a dollar-prefixed money input wrapper.

For the field layout, I'm reasoning through container queries so the amount and payer fields can switch from single-column to two-column depending on available space rather than viewport width, which handles both the mobile and desktop card widths better. I'm also sketching the split-options chips as wrapping, pill-shaped checkboxes with adequate tap targets.

For focus states, I'm handling the double-outline problem when using `:has()` to style the chip wrapper — wrapping both the chip and input focus rules in an `@supports selector(:has(*))` block so browsers without `:has()` support still get a visible input outline as a fallback. Now I'm working out how to position the fieldset legend alongside action tools in the same row, since a legend must remain a direct child of the fieldset to work as its caption, so I'm considering absolute positioning for the tools instead of flex layout.

I'm settling on floating the legend left and the tools right, with the options row cleared below, as a reliable cross-browser technique. Then I'm designing the error message styling with a soft red background, left border accent, and checking contrast ratios — confirming 5.76:1 for the error text, which passes accessibility standards, plus a small inline warning icon.

For the people list, I'm styling each person as a rounded chip with a flex layout containing a circular avatar (initials-based, 28px to meet touch target minimums) and an optional remove button that gets a subtle hover background. For empty states I'm considering a calm, icon-free dashed-border box using a muted line color to keep it understated.

Now I'm working out the stats row layout, thinking the trip total needs to be prominent but the three-column mobile layout feels cramped with large serif numbers, so I'm restructuring it so the total sits bigger on its own line with the people/expense counts as smaller muted text below or beside it. Then I move into styling the balance list rows, setting up a grid with name, muted detail text, and a right-aligned figure showing the amount in serif with a muted descriptor word above it.

I'm deciding how to color-code owed versus owing balances — using the harbour accent for money owed to the person and ink for money they owe — and considering whether to add explicit plus/minus signs to the amounts for faster scanning, settling on keeping the descriptive words but still differentiating by color. Then I start building the "keel" bar visualization, a thin horizontal track with a center waterline mark and colored bars extending left or right from center depending on whether the balance is positive or negative.

Now I'm indenting the keel bar to align with the name text, skipping the idea of adding a legend since the words already clarify direction. I'm also styling a dark "settle up" panel at the bottom with rounded corners, a header, and a list of transfer cards showing semi-transparent backgrounds and the amount owed between people.

Styling expense list entries...

Finishing the footer with a reset flow that requires confirmation before clearing trip data, using the danger button style for the actual destructive action. I'm also tweaking the privacy language to be more precise about what stays local versus what loads from the network.

Now I'm moving into the JavaScript, starting with storage constants, a currency formatter for Canadian dollars, and setting up a list formatter for displaying names.

I'm building the sanitize function to validate stored data — deduplicating people by name and ID, filtering out malformed entries, and ensuring everything loaded from localStorage is safe to use. Still writing sanitization logic...

I also need to handle the save function wrapping localStorage writes in a try/catch to track whether storage is working, and I should guard against localStorage access itself throwing in restricted environments.

I'm defining helper functions to normalize names for comparison, look up people by id, and sort id lists by their trip order based on the people array. I'm also writing a function to split an expense amount evenly across a list of participant ids in trip order, distributing any remainder cent-by-cent to the earliest people in the list, and I'm noting that splitIds should be sorted consistently at computation time for safety even though stored order should already be valid.

I then write a function to compute each person's balance by summing what they paid against their calculated share across all expenses, followed by a settle-up algorithm that separates people into debtors and creditors, sorts them by amount owed, and starts by matching pairs with exactly equal amounts before handling partial transfers.

I verify the exact-match-then-greedy approach still guarantees at most k-1 transfers total, since exact matches zero out two people at a time while leaving a zero-sum remainder that greedy still handles optimally. Then I consider sorting the final transfer list by payer's trip order for easier readability.

Now I'm setting up DOM element references for the form inputs, lists, and status areas, plus tracking which people are excluded from a split using a set tied to checkbox state. I'm writing the renderPeople function, starting by tracking which people have been used as payers or split participants across all expenses.

Rendering each person as a chip with an avatar and name, only showing a remove button if they're not referenced anywhere. I'm planning avatar colors by palette index and deriving initials from the first letters of up to two words in the person's name.

Now I'm writing renderFormOptions, which rebuilds the payer dropdown from the people list while preserving the previous selection if still valid, disabling it when there are no people, and rebuilding the split checkboxes as labeled chips tied to each person's checked state. Thinking through edge cases like a disabled empty select and whether to show a placeholder.

I'm deciding renderFormOptions should only rebuild when the people list actually changes, tracked by a signature of ids and names, so toggling a checkbox doesn't trigger a full re-render and lose focus — the split tools should only show once there are at least two people.

Now I'm writing the function that renders the expense list in reverse chronological order, building each item's markup with the description, amount, payer, and split participant names, plus a per-person share amount and a remove button for each entry.

I'm refining the share text wording for edge cases—showing "each" amounts when splits divide evenly, a range like "$3.33 or $3.34 each" when they don't, and special-casing single-person splits to read naturally. Then I'm drafting the balances renderer, which hides the list and shows an empty-state message when there are no people, otherwise computing the max absolute balance to scale the bars and rendering each row with test attributes for the person's name and balance in cents.

For wording, each balance gets labeled "is owed," "owes," or "is even" depending on sign, with a formatted dollar amount (or "$0.00" muted for even), and I'm checking the accessible row text reads naturally like "Ana, Paid $120.00 · Share $80.00, is owed $40.00." I'm also working out the settle-up panel's conditional messaging for no people, no expenses, everyone settled, or listing the minimal payments needed—while being careful not to overclaim the algorithm finds a mathematically optimal minimum transfer count.

Now I'm drafting the copy explaining that owing money is a normal, calm part of shared trips, plus the undo notice display logic and an announcer helper for screen readers that can re-announce repeated messages by clearing and resetting text.

I'm writing the person form submit handler that trims the name input, validates it's non-empty, and checks for duplicate names against existing people before allowing the add.

Writing form validation handlers...

I'm having it announce the addition for screen readers, then reading checked IDs directly from the DOM checkboxes at submit time so it stays in sync even if tests toggle them programmatically. I'm also considering adding a brief visual confirmation near the button after adding an expense, since the focus shift to the description field alone may not be enough feedback on mobile.

Now I'm defining a showError helper that clears prior errors and inserts a styled error message with an icon into the appropriate field's error slot...

Writing error-handling logic...

I'm thinking through how clearErrors and clearErrorFor should reset aria-invalid, describedby, and styling state per field, plus wiring up input listeners so typing anywhere in the expense form clears a pending expense error.

Writing delete-expense handler...

Continuing the person removal logic...

For the copy button, I'm handling the clipboard write with a fallback to a hidden textarea and execCommand for browsers without clipboard API support.

Now I'm thinking through accessibility for the reset confirmation flow, deciding where focus should land when the "clear trip" warning appears so screen reader users get proper context.

For the reset handlers, I'm wiring up: confirming clears the state, resets forms, and announces a message; canceling or hitting Escape just returns to the start view. The reset button should only show when there's actually data to clear, and I want the header to reflect whether saving succeeded or storage is blocked.

I'm also adding a storage event listener so changes sync across browser tabs automatically, a nice touch for shared-device use. Now I'm shifting to writing out the actual HTML and CSS, keeping the 360px layout in mind.

I'm checking that nothing forces horizontal overflow at narrow widths—long dollar amounts, transfer row names, select options, and chip labels should all wrap or truncate gracefully. Then I'm designing a small sailboat-themed logo mark using layered SVG paths for the mainsail, jib, hull, and a waterline beneath it, using the paper color against the navy header with reduced opacity on the jib for depth.

For the waterline color I'm weighing Signal against navy contrast and deciding a light paper-background header with a navy wordmark and Signal waterline reads calmer than a heavy dark band, saving the dark treatment for the settle panel as the visual focal point. I'm settling on Source Serif 4 at 600 weight for headings with optical sizing enabled, and locking in a type scale—16px body, 15px labels, 14px meta, 13px minimum for uppercase stat labels with added letter-spacing.

Now I'm moving into writing the actual microcopy in a plain, calm, direct voice that addresses the user as "you."

I'm drafting the step-by-step flow copy: adding a tagline about logging expenses, writing the empty-state and labels for adding people, then moving into the expense-logging step with fields for description, amount, payer, and split controls, followed by the balances step showing trip totals and who owes whom.

I still need to write the settle-up copy, expenses list with its empty state, and footer privacy note explaining data stays local to the browser. Then I'm working through layout ordering for desktop vs mobile and sketching a test scenario where three people split a $100 expense to verify the balance math comes out correctly in cents.

I also want to trace through the debt-settling algorithm with leftover cents, confirm balances and person/transfer identifiers persist correctly after reload, and check edge cases like unchecking someone before adding an expense, adding a new person afterward, and how the payer dropdown's options behave with zero versus multiple people.

Thinking about the literal spec ("option value = person's name") pushes me away from using a placeholder option — instead I'll keep the select empty and disabled when there are no people yet, with a hint text like "Add people in step 1 first" to explain the empty state, rather than violating the strict option requirement.

For the rest of the form behavior, pressing Enter in the description field should naturally submit via the native form submission, and checkboxes should just nest inside their labels without needing a separate `for` attribute. I'm now writing the preview update logic that reacts to changes in the amount field and checkbox selections, building a function that determines what status text to show based on how many people are selected and whether the amount is valid.

Writing preview text logic...

I'm finalizing the phrasing helper to naturally describe who gets the extra cents, using curly apostrophes for better typographic polish throughout the copy, then moving into writing the actual HTML document with proper charset and viewport setup.

Writing favicon and CSS reset...

Writing stats block styles...

I'm checking contrast and sizing for the stat labels, then sketching the stats markup with a trip total value and a meta line for people/expenses count, plus a focus-visible outline for the settle panel.

For the Expenses section, I'm giving the heading a tabindex for programmatic focus and keeping the default focus-visible outline visible for accessibility. Then I'm writing a small DOM helper function that creates elements with attributes, class/text/html shortcuts, and appends child nodes.

I'm confirming text content like names gets inserted via textContent to avoid any XSS risk, while static icon SVGs are the only things using innerHTML. Now I'm writing the renderPeople function, which builds the people list UI, showing counts, empty states, and avatar/name chips with a remove button for any person not currently in use.

I'm debating whether to add a small hint near the list explaining that people who are part of an expense can't be removed, deciding it's worth including as honest, muted text. Then I'm defining a helper for pluralizing counts and starting the avatar generation logic, picking background colors and deriving initials from a person's first and last name parts.

I want avatar color to be keyed off a stable hash of the person's id rather than their position, so colors don't shift when someone is removed, and I'm refining the palette to feel more maritime and ensure good text contrast. I'm also adding a signature check to `renderFormOptions` so it skips re-rendering when the people list hasn't actually changed, and wiring up hidden states for payer/split hint elements based on how many people exist.

Now I'm building out the split controls — all/none buttons that toggle every checkbox and update the unchecked set, a delegated change listener on the split container, and a `checkedIds` helper that reads checked ids directly from the DOM in trip order. Then I'm starting the expense list renderer, which counts expenses, toggles empty-state visibility, and begins mapping each expense into sorted split names, payer name, and the base amount calculation.

Finishing the remove button markup, then resetting justAddedId so re-renders don't replay the animation. I'm double-checking accessibility labels for the remove buttons, confirming substring matching works for role queries, and starting the renderBalances function with visibility toggles for empty states and legend based on whether expenses exist.

Now I'm building each balance row: an avatar, name and paid/share detail text, and a figure showing whether the person is owed, owes, or is even, plus a proportional keel bar visualizing the balance magnitude relative to the largest balance.

I catch that I've shadowed the global `state` variable name inside this function and need to rename it to `tone`. I'm also reconsidering the zero-balance case — instead of showing "is even $0.00," I'll simplify it to just display "Even" as a clean, muted label without a redundant word/amount pair. Then I move on to sketching out the settle-up section, starting with a subtitle that explains what to expect once people and expenses are added.

I'm storing the current transfers and resetting the copy status whenever the settlement plan changes. I'm also thinking through spacing details for the "pays" text between names, and now writing the undo notice render function that shows a message with the removed expense and an undo button.

I need to make sure the undo status region only re-renders when the removed expense actually changes, so screen readers don't repeat announcements unnecessarily. I'm also setting up a debounced announcer function for accessibility messages, and planning to show expense success feedback directly in the form status area rather than relying solely on the global announcer.

Writing error-handling helpers...

For the split checkbox error, I'm planning to set the group to the fieldset and focus to the first checkbox. I'm wiring up input listeners so typing in the name field or interacting with the expense form clears the relevant error, relying on modern browsers firing 'input' events for checkboxes and selects too, with manual clearing for programmatic changes like setAllChecks. I'm also noting that adding a person already triggers clearAllErrors, and I'm now considering whether the expense error message placement works well across desktop and mobile layouts.

Rather than one generic error area, I've decided per-field inline error slots are better UX — separate slots for description, amount, payer, split, and a general one for cases like "no people" positioned near the submit button, with person errors getting their own slot. I'm designing showError to accept a key, slot element, message, and options, storing which slot was used so clearing works correctly, and thinking through how a long amount error message would look within its column in the two-column amount/payer row.

I'm now moving on to other parts of the app: the settle panel's copy button and status text, the reset flow, cross-tab storage sync events, and edge cases like multiple Playwright test contexts, Enter-key form submission for adding people, whitespace-only name validation, error clearing on successful add, and handling special characters like apostrophes in person names when setting data attributes.

I'm also fleshing out the visual design more concretely — a warm paper background, cream cards with soft borders and shadows, serif headings, a dark "deep water" settle panel with light transfer rows, and directional keel bars for owed/owes amounts. I'm sketching out desktop layout proportions (a 5fr/7fr split within a 1160px max width) and checking how the card padding and wrapper width behave down at a 360px mobile viewport.

I'm then working through the narrow-width math for each component — the person form's input/button split, the expense form switching to a stacked layout via container queries, split chips wrapping, the expense item's amount/remove-button column sizing, and balance row spacing with avatar, name, and figure columns — confirming everything fits without overflow. I'm also noting that container-type: inline-size needs to go on the expense form wrapper since its width shouldn't depend on its own content, and planning the min-width 900px grid breakpoint along with consistent 16px field spacing before writing out the final file.

Starting the HTML structure with a screen-reader announcer region, then the header markup including an SVG brand mark depicting a stylized mountain/wave logo in navy and rust tones, paired with the "Even Keel" brand name and tagline text.

Writing main form markup...

I'm noticing redundancy between the section subtitle and the empty-state text, both mentioning adding names, so I'm tweaking the subtitle to "Add everyone who's sharing costs, including yourself" and reworking the empty message to something like "No one's on the trip yet. Names you add appear here."

Now I'm settling on a more useful empty-state message: "No one's on the trip yet. Once you add people, you can log expenses and split them." Then I'm moving on to building the expense form with a description field for what the expense was for.

Now I'm adding the amount field with a dollar prefix and decimal input, a payer dropdown with a hint to add people first, and starting a split fieldset with toggle tools for selecting who's included.

I'm noting that aria-describedby can still reference a hidden element and screen readers will read its text anyway, so the payer hint will be announced even when visually hidden—something to account for in the markup.

Deciding to skip the describedby reference since the select is already disabled when empty, keeping things simpler. I'm also sketching the summary card with step indicator, trip total stat, and other at-a-glance figures styled consistently with the earlier sections.

Adding the expenses section markup and footer with a privacy note explaining data stays local to the browser, plus a hidden reset control.

Now I'm setting up CSS custom properties for the color palette—harbour blues, signal reds, paper tones—establishing the design system's foundation.

Writing base layout styles...

Styling focus states, money prefixes, and custom select dropdown arrows...

Now writing button variants...

Then I'm catching an issue: putting display:none on an empty error slot that uses aria-live could cause problems, since a live region hidden by display:none is removed from the accessibility tree, so screen readers might not announce it when content gets inserted and it switches to display:block.

I decide to drop that rule since an empty div has no height anyway, and let the error paragraph itself carry the margin. Then I move on to styling the people list and person chips, giving each chip a pill shape with an avatar slot, flexible name text, and spacing for a removable state.

Adding avatar and remove button styles...

Now I'm setting up the empty-state placeholder with a dashed border and muted text, making sure it sits with the right spacing after the form, before starting the expense form grid layout with container queries for responsive field rows.

I realize the empty grid gaps are a problem — since empty slot divs still occupy grid gaps even without content, I'm switching the form to a block layout using margin-based spacing between children instead, with error slots zeroing out that margin so they don't add unwanted whitespace.

Now I'm styling the split fieldset using a floated legend so its margin-bottom behaves correctly, with the tools floated right and the options row clearing both, making sure any hint text or error slot underneath also clears the float. Then I'm defining the pill-shaped checkbox chip styles with flexible padding, rounded borders, and hover transitions...

I'm deciding to keep the success status element always rendered rather than toggling display, so screen readers reliably catch the update, and only applying margin-top when it actually has content. I'm then overriding the generic sibling-spacing rule for both the success message and error slots using specificity so they don't add unwanted gaps when empty.

For the checkmark icon, I'm avoiding text content in the live region and instead drawing it purely with CSS borders rotated into a check shape via `::before`, so it won't be announced by assistive tech.

Now I'm writing the balance list styles...

Adding more settle panel styles...

Still writing expense styles...

Writing footer and layout styles...

I'm checking container query breakpoints for card content stacking at narrower widths, then adding a reduced-motion media query to disable animations and transitions for accessibility, plus a forced-colors adjustment for keel bars. Now I'm starting the JavaScript module, setting up storage keys, currency formatting with Intl.NumberFormat for CAD, and list formatting utilities.

Still writing utility functions...

Now I'm adding inline SVG icon definitions for close and alert icons.

I'm setting up localStorage access helpers with safe fallbacks, plus load/save functions that serialize and sanitize the app's people/expenses state, then initializing the in-memory state and tracking variables for unchecked items and last-removed entries.

Now I'm defining friendly error messages for amount validation and writing the parseAmount function to strip currency symbols, whitespace, and handle negative values before checking numeric format.

Finishing the function: I'm handling comma-separated thousands versus invalid comma-decimal notation, enforcing a max of two decimal places, converting the string into cents as an integer, and rejecting values that are zero, negative, or exceed the maximum allowed amount.

Now I'm starting the expense form submission handler, which clears any previous status message and checks that people have been added before proceeding.

If no people exist, it shows an error directing the user to step 1. Otherwise it validates the description, parses and validates the amount, confirms a payer was selected, and ensures at least one person is checked for the split, surfacing a targeted error at whichever field fails first.

Still writing validation logic...

On success, it pushes the new expense, clears error state, resets the form fields and checkboxes back to checked, updates the preview, and announces the addition through a status message before refocusing the description field. Then it calls commit, which saves and triggers a full render of the saved note, people list, form options, and other UI pieces.

The render function also recomputes balances, stats, settlement suggestions, and expense/undo lists, then toggles visibility of the reset button based on whether any data exists. I'm refining that logic so the reset button and confirm state stay in sync when things get cleared. For renderSavedNote, I only want to update the DOM when the saved/unsaved state actually changes, phrasing it as "Saves automatically in this browser" versus a warning about the tab needing to stay open.

I'm wiring up a storage event listener that reloads state and re-renders whenever another tab changes or clears the data, treating a null key as a full clear. Then I'm handling the reset flow: clicking "start reset" swaps to a confirm view focused on the "no" button, escape or "no" closes it back, and confirming wipes the entire state, clears inputs and errors, commits the empty state, refocuses the name field, and announces that everything was cleared.

Now I'm writing the remove-person handler: it ignores clicks on people who are still used in expenses, otherwise removes them from state and unchecked set, commits, then moves focus to the next remaining removable chip (or the name input if none left) and announces who was removed. After that I start building a function that generates shareable plan text summarizing the trip total and transfers.

Then I'm verifying the transfer-matching algorithm — sorting debtors and creditors by amount with stable tie-breaking by original order, finding exact-amount matches first and zeroing them out before moving to partial matches.

Finishing the greedy matching loop, I pair remaining debtors and creditors by the minimum of their amounts, decrementing both until exhausted, then sort the final transfer list by original person order for consistent output. I confirm no duplicate from/to pairs can occur since exact matches zero out both sides before the greedy pass runs.

Now I'm writing the renderStats function to compute total spending and format counts of people and expenses for display.

I'm running through test scenarios mentally: verifying testid counts match expected people/expense totals, checking that checkboxes in expense-split match the person count, confirming balance rows carry correct data-person attributes, and making sure transfers only render when nonzero. I also verify error states preserve user input without clearing the form, and that payer selection and split checkboxes stay intact across validation failures. Finally I'm checking how renderFormOptions rebuilds the payer select when people change.

Animation plays once, fonts use swap loading. I'm reconsidering the visual hierarchy—summary card as hero with big serif trip total, a slim keel divider under the header. I'll go with h2 "Where everyone stands" and h3 "Settle up" for the balances section naming, and I'm checking that the hidden-attribute override doesn't conflict with button display styles, plus confirming focus-visible behavior on programmatic heading focus after keyboard activation.

Focus rings won't show after mouse-triggered programmatic focus to non-input elements, which is the desired behavior. I'm adding a noscript fallback message and double-checking the Google Fonts URL setup for IBM Plex Sans and Source Serif 4, including tabular number support, before moving on to finish writing the actual code.

Building out form input attributes...

Finishing up the element references with reset controls and the announcer, then I'm designing the keel key indicator above the balance list showing "Owes" and "Is owed" directions, and thinking through edge cases like how balances display when people exist but no expenses have been added yet, plus a short legend text explaining that owing isn't a judgment, just a snapshot before settling up.

Writing the DOM helper function...

I'm also working out avatar tinting using a simple hash or index-based color assignment, and writing a helper to extract initials from a person's name for their avatar.

Then I'm building the undo notification UI, tracking the last removed expense so I can show a dismissible notice with an undo button, and writing the restore logic that re-inserts the expense if the payer and split participants are still valid.

After restoring, I focus the delete button for that expense row (or fall back to the title), using plain child lookup instead of CSS.escape for safety, and announce the restoration to screen readers.

Now I'm starting renderFormOptions, computing a signature string from the people list so I can skip re-rendering the payer/split options when nothing's changed.

Finishing it now, I rebuild the payer dropdown from the people list, preserving the previous selection if it's still valid and disabling it when there are no people, then rebuild the split checkboxes checked-state from the unchecked set, and toggle the empty/hint messages and split tools visibility based on how many people exist.

I'm adding a change listener on the split checkbox group to sync the unchecked set when individual checkboxes toggle, which triggers a preview update; I'm also wiring amount input changes to refresh the preview, and now I'm writing the preview text logic that shows guidance messages when no people exist or none are selected.

When people are selected but the amount hasn't been entered, I describe the equal split in words ("split equally between X people"); when an amount is entered, I compute the per-person share, handle leftover cents by distributing them to whoever was added first, and phrase the result naturally — noting whether one person covers everything or several people split evenly or unevenly.

I also want to reconsider the "covers the whole amount" phrasing to avoid implying the payer rather than the share-owner, so I'm shifting it to something like "the whole amount is X's share" for clarity, and tightening the per-person phrasing to include the count of people for context.

Now I'm thinking through whether the people-note about removable expenses should always show once expenses exist, since that risks becoming unnecessary clutter rather than being limited to cases where it's actually relevant.

I decide to simplify the note text to something actionable like "To remove someone, first remove the expenses they're part of," and confirm the name-collision trimming logic is already handled. I'm now going through the contrast checks for each UI element—pills, hints, buttons, error states, and overlays—verifying text colors meet accessibility thresholds against their backgrounds before finalizing the CSS and JS.

I finish calculating placeholder text contrast and double-check disabled states, muted text, and dashed borders for the empty state. With everything verified, I'm ready to assemble the final CSS and the JS as an IIFE at the end of the body.

Now I'm working through fieldset layout details — making the legend float with tools aligned to the side, using min-width:0 to avoid overflow at narrow widths, and checking that the floated split-tools still fit within 360px alongside the legend text. I also trace through the spacing rules between form children, making sure margins between the fieldset, error slots, and submit button behave correctly when an error message appears.

With the layout logic settled, I'm starting to write out the full HTML document — setting up the doctype, meta tags for viewport and description, theme color, favicon, and font preconnects for the page.

Writing JS helper functions...

I double-check that usedPersonIds and computeBalances correctly track payer and split IDs, and verify the expense card's tab order flows logically from description through payer, split controls, checkboxes, and finally the add button. I settle on final copy for the autosave note and confirm person chip removal buttons are reachable via tab, then move to writing the final answer.

For balance display edge cases, I decide zero balances render simply as "Even" with accessible text like "Paid $0.00 · share $0.00, Even". For people not involved in any expense, I'll show "Not part of any expense yet" instead of showing confusing zero amounts. I verify the keel and keel-key margins align with the avatar width plus gap, and confirm the layout wraps gracefully at 360px with the saved-note dropping below the brand on narrow screens.

On focus management for errors, I decide to keep focus on the button rather than jumping to the name field when there are no people yet, since the error message appears near the button itself. I also confirm the payer select stays disabled until people exist, and I'm finalizing small CSS touches like bold notice text and the avatar grid styling, plus a background highlight animation for newly added expense rows.

No need to cap or collapse the expense list—time to write the final answer.

