I'm planning out the app structure: handling unique people entries, validating expenses with proper currency rounding, splitting costs evenly in cents with remainders distributed fairly, and displaying expenses newest-first with inline error handling for invalid inputs.

Balances will track paid minus share using signed cents, and settle-up will use a greedy largest-debtor-to-largest-creditor matching to minimize the number of transfers. I'm also checking color contrast ratios for the Fog, Kelp, and Signal accent colors against their backgrounds to make sure text stays accessible, along with planning localStorage persistence, empty states, and responsive layout down to 360px.

I'm now weighing whether Rope borders on inputs meet the 3:1 non-text contrast requirement, since brand guidelines specify Rope for borders/dividers while Fog is reserved for secondary text — I need to decide whether stronger borders are needed for accessibility without breaking the color role conventions.

For native checkboxes and selects, I'll use accent-color set to Harbour rather than Signal, since Signal is reserved for primary buttons, and I'm styling the dropdown arrow with an inline SVG using Harbour stroke color via appearance:none. For error messages, I'm considering Harbour text with a Rope-bordered box since Signal shouldn't be used outside primary actions.

I'll keep a persistent paragraph element with aria-live="polite" for validation errors, toggling its text content and a data-testid attribute only when a message is present, alongside aria-invalid and aria-describedby on the input itself, clearing errors on successful submit or when the user edits the field.

For the expense form, I need to handle the no-people case: I'll keep the form always rendered and enabled so tests can still interact with it, maybe showing a hint if the people list is empty, and validate on submit instead of disabling fields. For amount parsing, I'll strip leading dollar signs, commas, and spaces before validating the numeric format.

Input should use type="text" with inputmode="decimal" rather than type="number" so invalid strings like "abc" or "-5" can still be typed and rejected with a clear message, since zero, negative numbers, non-numeric input, and more than two decimal places each need their own specific error message.

I'll cap amounts at a billion dollars to avoid overflow issues, and require descriptions be trimmed with a reasonable max length. For errors, I'll show one summarized message per form rather than listing all issues. For people, I'll keep them in an ordered array referenced by name, and skip supporting deletion since it complicates expenses that reference them—though removing a person not tied to any expense could be useful later.

I considered adding a "Remove" button for unused people, but worry it would break tests checking exact text content on the person element (e.g. appending "Remove" to the name), so I'll omit that feature to stay safe.

For expenses, I need to store id, description, amount in cents, payer, split (names in trip order), and creation time, computing each share by dividing evenly and distributing remainder cents to the first people in order. The expense list shows newest first with description, amount, and a "Paid by X · Split between Y" summary, plus a labeled remove button that shifts focus sensibly afterward. New people default to being checked in the split, and I'm leaning toward resetting all checkboxes to checked after each expense is added.

I'll keep the payer dropdown defaulting to the first person rather than a placeholder, since tests likely won't manually select a payer, and preserve that selection across re-renders. Balances are computed per person as paid minus their total share, displayed as "is owed $X" or similar.

For showing signed balances, I'll use a proper minus sign (−) rather than a hyphen for negative amounts, labeling them "Owes" versus "Is owed" or "Even" for zero. For settle-up, I'm planning a greedy algorithm matching creditors and debtors by amount, sorted descending with tie-breaking.

Now I'm thinking through empty states for each section — people, expenses, balances, and settle-up — each needing a one-sentence call to action telling users what to do next when there's no data yet.

For layout, I'm sketching the header with a small wordmark mark and "Even Keel" title in Fraunces, plus a supporting subtitle line in Fog gray. I'm planning the page as stacked panels (People, Add an expense, Expenses, Balances, Settle up) in a single column capped at 720px wide, with the people input and button wrapping responsively, and settling on a type scale of 14/16/20/28px.

Now I'm working out spacing details, trying to keep padding and margins on 8px multiples (allowing 4px for tight pairs), and figuring out input padding so the height lines up cleanly given line-height and borders.

Simpler to just set height: 40px with padding 0 16px, keeping things on an 8px grid. For focus, I'll use :focus-visible for buttons/checkboxes and :focus for inputs so focus is always visible, with a 2px Harbour outline offset by 2px, plus 120ms transitions on hover for background and border colors.

For the Signal primary button, hovering could underline text rather than mess with the Harbour background since Signal should stay reserved for primary actions. Secondary buttons like Remove use Paper background with Rope border and Harbour text, switching border to Harbour on hover with a 120ms transition. Add expense/Add person should be primary Signal buttons, while Remove stays secondary -- and I should skip a confirm() dialog for deletion since that would break Playwright's auto-dismiss behavior.

For the expense list layout, I'm planning a grid with description and meta text on the left (like "Paid by Ana · Split between Ana and Ben") and amount plus remove button on the right, wrapping on small screens. For the split display, I'll list names using Intl.ListFormat for natural conjunction formatting with a join fallback, and skip showing per-person share amounts to keep things simple. For storage, I'm structuring the localStorage data under a versioned key containing people and expenses.

Now I'm thinking through validation details: name length capped at 40 characters with a clear error message, duplicate name detection, and empty name handling. I'm also deciding on test IDs for the payer select and checkbox fieldset, and where to place error messages — keeping person errors near their input but considering a single bottom-of-form error for expenses.

After a successful submit, I want to refocus the description field for quick repeated entry, while adding a person keeps focus on the name input. For checkbox state, I'll track unchecked names in a set so new people default to checked, clearing that set after a successful expense add, and I'll only re-render checkboxes and the payer select when the people list changes so focus and selection aren't lost. I'm also settling on sentence-case section headings like "People," "Add an expense," "Expenses," "Balances," and "Settle up."

Now I'm working out the balance row layout—name on the left, signed amount and status label ("is owed," "owes," "is even") on the right, with positive amounts styled one color and negative ones another, using data attributes for person and cents. Even with no expenses, every person should still show as $0.00 and even. Transfer rows read like "Ben pays Ana $15.00," and I'm considering adding a small "Total spent" summary near the expenses heading.

I'll add a "Total: $123.45" line to the expenses section. I'm skipping a "start new trip" clear button since it's not essential. For fonts, I'll link the Fraunces and IBM Plex Sans Google Fonts stylesheet but skip the preconnect hint to stay strictly within the single external resource allowance.

I'm settling on Fraunces at weight 600 for simplicity, building the wordmark with a flex layout and a decorative rule, and sizing checkboxes and chip labels for good touch targets. I've confirmed contrast ratios hold up and that negative amounts display with a minus sign as specified.

For interaction details, I'm making sure the "Remove" button's accessible name starts with visible text so role-based queries match, using native form submission with Enter-key support and novalidate for custom error messages, and defining the amount input with decimal inputmode, a CAD label, and example hint text rather than placeholder data.

Now I'm setting up responsive padding for mobile versus desktop and defining the color palette variables and base body styles...

Writing CSS variables and base styles...

Styling the wordmark and panel elements...

Styling select dropdowns with a custom chevron, then defining button styles — primary buttons with signal color and underline hover, secondary buttons with smaller size and border styling, settling on consistent padding and heights for touch targets.

Now I'm adding error message styling with a left border accent and hidden state handling, then laying out the people form as a flexible row with fields and an end-aligned button, followed by starting the people list styling...

Writing more layout CSS...

Still writing styles...

Now moving to JS: setting up a storage key, a CAD currency formatter converting cents to dollars, and a signed-money helper that prefixes negative amounts with a minus sign and positive ones with a plus, though I'm second-guessing whether positives should actually show the plus.

I'm sketching out the state shape with a people array and an expenses array, plus a load function that parses and validates stored data (checking arrays, names, and positive integer cents) and a save function wrapped in a try/catch for localStorage. I'm also considering a name normalization helper that lowercases and possibly collapses extra whitespace for case-insensitive matching.

I'm settling on trimming and collapsing whitespace in names, then writing functions to compute per-person shares of an expense (splitting cents evenly with remainder distributed by order), tally running balances across all expenses, and finally a settle-up algorithm that pairs creditors and debtors via a two-pointer approach to minimize transactions.

Next I'm planning the render functions (people, payer/split selectors, expenses, balances, and settle suggestions) that build DOM elements safely using textContent to avoid injection issues, tagging person elements with a data attribute for testing. Then I'm sketching the add-person handler, validating the normalized name against empty input, length limits, and duplicates before showing appropriate error messages.

For error display, I'm thinking through a helper that sets the error text, shows the element, marks it for testing, and flags the input as invalid while focusing it. For expense validation I'm considering whether to show just the first error or collect and list all problems in one error element for better feedback.

Now I'm drafting the specific wording for each validation case—missing people, empty description, missing or invalid amount, non-positive amounts, decimal precision, and amounts that are too large—aiming for friendly, example-driven phrasing.

I'm also working out the amount parsing logic, stripping dollar signs and commas, trimming whitespace, and using a regex to validate the numeric format while handling edge cases like negative or malformed inputs.

I realize I need to be careful about comma validation too, since something like "12,50" could be misread as a European-style decimal rather than a thousands separator, which would silently produce the wrong dollar amount—so I should restrict commas to strict thousands-separator patterns only.

For adding an expense, I'll push it onto the list with its id, description, cents, payer, and ordered split, then reset the form fields but preserve the payer and announce success. Deleting an expense means filtering it out, saving, re-rendering, and carefully managing focus afterward so it lands on a sensible nearby element.

For expense metadata, I'm formatting "Paid by X · Split between Y, Z and W" using the people's actual names rather than generic phrasing like "everyone." For balances, I'm wording the hint to be person-specific rather than second-person, explaining that a positive balance means they're owed and negative means they owe, while the settle-up row shows "from pays to" with bolded names and the amount aligned right. I also need a visually-hidden status live region and to make sure the payer dropdown keeps its selected value when re-rendered.

I'm deciding the split checkboxes container should show nothing but the checkboxes themselves, with a fallback hint like "Add people to choose who shares this cost" placed outside when there are no people yet. I'm also wrapping the whole app, including the header, inside a single main landmark element, and adding a lightweight storage event listener so changes sync across browser tabs.

Writing the main wrapper markup...

Writing form markup...

I'm thinking through accessibility for the error message—whether to keep it hidden and toggle visibility, or keep a live region always present in the DOM so screen readers reliably announce changes. I'm leaning toward a wrapper with aria-live="polite" that stays rendered but visually empty when there's no error, avoiding display:none issues with the accessibility tree.

Still building the expense form...

Setting up currency formatting and a name-joining helper using ListFormat with a fallback, then starting the localStorage load function with error handling for corrupted or missing data.

Now I'm adding validation rules for people and expenses—deduping names case-insensitively, checking expense fields like description, cents, payer, and split arrays—plus computing the next ID and rendering the people list and payer dropdown while preserving the previously selected payer when possible.

I'm also building the split checkbox UI, tracking which people are unchecked in a set so toggling updates state correctly when tests simulate clicks.

For the expense submission, I plan to read the description, amount, payer, and checked split boxes directly from the DOM, collecting any validation errors with references to the offending input for focus. Then I'm writing the render function for the expense list, iterating in reverse so newest entries appear first and accumulating the running total.

Each list item shows the description, who paid, and who split it, plus a delete button with an aria-label describing which expense it removes. I'm also planning the balances list with name, status (owed/owes/even), and amount, along with settle-up transfer logic and a running total display in the header.

I'm also working out smaller styling details: custom select arrows using an inline SVG, checkbox focus states, ensuring hidden attributes properly collapse elements with a `[hidden]{display:none}` rule, and settling on an overall width around 360px.

Now I'm checking how elements reflow at that narrower width—expense rows, person rows, and balance rows all need flex adjustments so buttons wrap gracefully instead of overflowing, and long names should break with overflow-wrap. I'm also finalizing heading sizes, like the wordmark scaling down on mobile.

I'm also nailing down the copy throughout: sentence-case labels like "Add an expense" and "Split between," plus friendly empty-state messages guiding users to add people first, then log expenses, varying the wording depending on whether people already exist.

Now I'm writing the helper that renders validation errors into an error region, creating a labeled div tied to the field via id, handling either a single message or multiple as separate lines.

I'm wiring up aria-describedby references for the name, amount, and description inputs, and deciding error-clearing behavior on input: person errors clear as soon as the user types a fix, while expense field errors persist until the next submit attempt for simplicity. I still need a balance computation helper to verify totals after an expense is removed.

Now I'm fleshing out the rest of the app logic: listening for storage events to sync state across tabs, normalizing names with whitespace trimming, defaulting the payer select to the first person, and building readable expense metadata lines like "Paid by X" and "Split between A, B, and C," including a per-person share amount that accounts for rounding when splits aren't perfectly even.

