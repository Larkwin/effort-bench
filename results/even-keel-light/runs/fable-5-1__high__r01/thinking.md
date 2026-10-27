I'm planning the structure of a self-contained HTML app: people get added with trimmed, unique names and inline validation errors, while expenses require a description, a positive amount with at most two decimals, a payer dropdown populated from the people list, and a checkbox group for splitting that defaults to everyone selected.

Expenses render newest first with delete buttons and reject invalid entries while preserving typed input; splits divide amounts in integer cents with remainder cents distributed in order of when people joined. I'm working out balance displays with person and cents data attributes, plus a settle-up algorithm that greedily matches creditors to debtors to minimize transfers to at most n-1.

For formatting I'm using Intl.NumberFormat with en-CA locale for CAD currency display, persisting everything to localStorage, handling empty states, ensuring responsiveness down to 360px, and keeping accessibility solid with visible labels and focus states. For visual design I'm picking a navy "Harbour" and rust "Signal" color palette with Fraunces for headings and a complementary sans-serif body font.

Now I'm settling on Fraunces paired with IBM Plex Sans for its tabular figures, and working out a warm off-white background palette with navy text and tinted accents, checking that the rust Signal color has sufficient contrast against white by computing its relative luminance manually.

Muted text contrast checks out at 5.67, plenty for AA. Now I'm thinking through the layout: a Harbour-colored header band with the wordmark, then a two-column desktop grid splitting people/add-expense forms on the left from expenses list, balances, and settle-up on the right, stacking on mobile under three sections like "Who's on the trip," "What was paid," "Where you stand." I'm starting to sketch the header markup with the wordmark and tagline.

Still writing layout markup...

For form errors, I'll only render the error paragraph in the DOM when there's an actual error, using role="alert" so it's announced, keeping in mind dynamically inserted alert elements do get picked up by most screen readers even without pre-existing aria-live containers.

For amount input, I'm deciding to use a text field with inputmode="decimal" rather than type="number" so I can control formatting and validation precisely, parsing cents from integer/decimal parts without floating-point errors and requiring a positive value.

For splitting, I'm computing an even share via floor division then distributing the remainder cents to the first people in trip order. Balances come from paid minus owed per person, and settlement uses a greedy two-pointer approach matching creditors against debtors to minimize the number of transfers, capped at n-1. I'm also weighing whether to support removing a person, leaning toward only allowing it when they have no associated expenses to keep things simple.

For storage, I'll use a single localStorage key holding people (ordered by add time) and expenses (with id, description, cents, payer, split list, and timestamp), rendering the expense list newest-first. For the split checkboxes, I'm deciding to track an "unchecked" set so new people default to checked while preserving existing unchecked selections.

After submitting an expense, I'll clear description and amount and reset the split to everyone, but leave the payer selection as-is since it's convenient for logging multiple expenses from the same person. I still need to handle the empty-people case -- probably rendering the form but disabling it with a message prompting users to add people first.

Actually, I'll keep inputs enabled by default and instead show an error on submit if there are no people, plus a disabled placeholder option in the payer select reading "Add a person first." Submission happens via Enter in the form or clicking the buttons.

For displaying each expense, I'm listing the description, amount, who paid, and who it's split between.

The balance list needs each person's name with their signed status ("is owed $X" or "owes $X" or even), using a signed data-cents attribute. Settle-up suggestions read like "Ben pays Ana $12.00," with fallback messages for empty or fully-settled states. I'm also adding a header summary showing total spent, people count, and expense count, plus pulling in Fraunces and IBM Plex Sans fonts from Google Fonts.

Now I'm working through the visual styling: cream background, white cards with subtle borders and rounded corners, focus outlines that adapt color depending on whether they're on the navy header or elsewhere, and button styles distinguishing primary from secondary actions.

For layout, I'm setting up a responsive grid that stacks on mobile but splits into two columns on larger screens, with people/expense-entry on one side and the expenses list, balances, and settle-up section on the other, making sure long names wrap properly and nothing scrolls horizontally. I also want an HTML-escaping helper to keep user input safe.

Now I'm writing the core JS logic — a storage key and currency formatter for displaying amounts in CAD, plus the state shape holding people and expenses, with a loader that validates the parsed data before use.

Adding validation functions...

I should also catch amounts with too many decimal places and tell the user to round to the nearest cent. For error handling, I'll just show the first validation error and keep focus on that field, since the form stays static otherwise and preserves typed values. For the people-dependent controls (split checkboxes, payer dropdown), I'll only re-render those when the people list changes, carefully preserving which checkboxes were checked and which payer was selected.

On successful add, I'll reset the description and amount fields, re-check all split checkboxes, clear errors, refocus the description field, and re-render the lists. Deleting an expense is straightforward by id; deleting a person should be blocked with an error message if they're still part of any expenses. I'll skip confirmation dialogs for simplicity, just emitting a brief status message through a live region like "Removed 'Dinner'."

Now I'm writing the share computation function that splits an expense's amount among selected participants in cents.

I'm building the balances function, which tracks what each person paid versus owes, and the settlement function, which greedily matches creditors and debtors to produce the minimal set of payments needed, sorted deterministically so the output is stable across renders.

For displaying balances I want to avoid framing owing money as alarming—since owing between friends is normal—so I'm choosing neutral wording like "gets back" and "chips in" rather than red/green color coding, with subtle tonal differences in ink color rather than stark warning colors.

For settle-up, I'm formatting it as "Ben pays Ana $12.00" with bold names. I'm also planning a header summary stat line, a reset trip button with confirmation, and empty-state copy for people, expenses, and balances that feels warm and encouraging rather than clinical.

Now I'm setting up the color variables for the CSS...

I'm checking that gray tone against white for contrast ratio — it only scores 3.56, falling short of AA for small text, so I'll restrict it to decorative lines only and avoid it for any readable text. Then I'm defining the masthead styling with the harbour background, cream text, and the Fraunces wordmark at 28px alongside a tagline.

Now I'm verifying another muted tone against the harbour background for the stats row, which comes out to a strong 7.0 contrast ratio, well above AA. I'm laying out the stats row with uppercase labels and Fraunces values, section headings using step-numbered titles like "People" and "Expenses" at 22px Fraunces, card styling with border and padding, and I'm starting on the chip checkbox styling for flexible inline labels with padding and borders.

Styling checkbox chips and buttons...

I'm also checking input field styling, verifying the border color #9AA8B1 against contrast requirements—it only hits 2.44:1 against white, short of the 3:1 needed for UI components, so I need a darker border shade instead.

I calculate alternatives: #7A8A95 gives 3.56:1 and #6E8290 gives 3.59:1, so I'll settle on #6E8290 as the control-line color. Then I move to the error message styling (keeping it simple with signal-ink color and a left accent bar, no icon) and start structuring the expense list item markup with description, metadata, and amount in a layout.

For the expense row I'm using a grid with description/meta on the left and amount/delete button stacked on the right, falling back to flex-wrap for smaller screens. I decide to format the payer names using Intl.ListFormat for proper "Ana, Ben and Cho" phrasing with a plain-join fallback, and I'm weighing whether to add a logged date to the meta line—deciding it's a nice touch worth including alongside the "paid · split between" text.

For balances I'll render a list with names and right-aligned amounts plus a small "Total spent $X" summary line. I'm adding a polite live region for status announcements like adding a person or removing an expense, proper heading/aria-labelledby associations, a novalidate form, and descriptive remove buttons like "Remove Ana from the trip".

I need to block removing a person who's still referenced in expenses, showing an error like "Ana is on 2 expenses. Remove those first, then remove Ana."

Setting up the JS module now, starting with storage keys and currency formatting helpers...

Adding HTML escaping and load/save logic...

I'm clearing the aria-invalid attributes when errors reset, and setting up the error slot with aria-live="assertive" so the form-error paragraph announces properly. I'm also mapping out the expense form's validation order—description, amount, payer, split—plus a guard requiring at least one person before logging an expense, and sketching the render functions needed: renderPeople, renderPeopleControls, renderExpenses, renderBalances, renderSummary, and an overarching renderAll.

I'm designing the amount input with a decimal keyboard mode and dollar-sign prefix, then checking placeholder text contrast ratios against the background to make sure they meet accessibility standards, settling on a slightly darker shade that passes.

I also need to display split details like "split 3 ways between Ana, Ben and Cho" in the expense meta, plus header stats for people count, expense count, and total spent that refresh on render. The footer needs a privacy note and a "Start a new trip" reset button with a confirm dialog, and I'm planning the delete-person logic to check if someone is involved in any expense before removal, along with click handlers for the people and expenses lists.

Everything else uses native buttons and checkboxes for accessibility, with a responsive breakpoint around 880px. For the "Add person" form I'm laying out the name input and button in a row that still fits at 360px wide, and for the expense form I'm stacking amount/payer fields on narrow screens while adding "Select all" and "Clear" quick-action buttons for the split chips.

Now I'm structuring each balance row as a list item with the person's name on the left and their status ("is owed"/"owes"/"even") plus amount on the right, and considering adding a subtle proportional bar to visualize the balance magnitude using tinted colors.

Writing transfer markup...

I'll format dates with a short month/day style, generate ids combining timestamp and random base36 strings, and make sure split lists capture people in the order they existed at time of entry before writing out the full document.

