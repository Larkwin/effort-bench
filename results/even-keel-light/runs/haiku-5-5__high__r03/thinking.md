I'm planning out the single-file HTML app structure, starting with validation rules for adding people (unique, trimmed names) and then working through expense entry requirements like description, positive amounts with up to two decimals, payer selection, and split checkboxes.

For splitting money, I'm figuring out how to distribute cents fairly using floor division with remainder cents going to the first selected people in order added, and I'm designing the expense list display with delete buttons and inline validation errors.

For balances, I'm defining them as paid minus owed share per person, and for settling up I'm working through a greedy debtor-creditor matching algorithm that guarantees at most n-1 transfers while confirming balances always sum to zero since total paid equals total shared cost.

I'm deciding against supporting person removal to keep things simple, since the spec only asks for adding and listing people, and removal would complicate expense references. For the empty-people edge case, I'm planning to disable or hide the expense form with a prompt to add people first, since an expense needs a payer to exist.

Actually, I'm reconsidering—disabling the form could cause test interactions to hang waiting on disabled buttons, so instead I'll keep the form always rendered and enabled, but validate on submit and show a clear error like "Add people to the trip before logging an expense" if no people exist yet.

For amount validation, I want to allow a reasonable format like "12.50" while rejecting things like "12.345", "abc", "0", or negative numbers, so I'm trimming the input, stripping an optional leading dollar sign, and checking it against a regex that permits up to two decimal places.

I'm converting the validated amount into cents by splitting the whole and fractional parts, padding the fraction to two digits, and enforcing a reasonable upper limit. Names get trimmed, deduplicated case-insensitively, and whitespace collapsed, and I'll build the DOM safely with text content rather than innerHTML to avoid any injection issues from user-entered names or descriptions.

I'm thinking through rendering strategy: rather than re-rendering the whole expense form on every change, I'll update the payer select and split checkboxes independently when the people list changes, preserving existing selections while defaulting new people to checked. On a failed submission I'll leave the typed values intact, but on success I'll clear the description and amount while keeping the payer selected.

For storage, I'll persist people and expenses under a single localStorage key, storing each expense's split as a list of names since names are unique and immutable, with expenses displayed newest-first.

For balances, I'm computing each person's paid total minus their share total, then settling debts with a greedy creditor/debtor matching algorithm that transfers the minimum of the two balances each round so at least one side zeroes out per step, formatting the resulting transfer amounts as currency.

I'm also handling persistence by saving to storage after every mutation and loading with validation/fallback on startup, plus deciding whether expense removal should be a direct action or require confirmation—keeping it simple with direct removal to avoid dialog-handling complications in tests.

For validation messages, I realize having a single data-testid="form-error" shared across multiple forms could cause strict-mode violations in tests if two matching elements exist simultaneously, even if one is hidden. I need to ensure only one such element is present or visible at a time to keep locator queries reliable.

Safer to just remove the element from DOM when no error. I'll write a showError function that clears any existing error and inserts a new one near the relevant form fields, with aria-invalid on the input and aria-describedby linking to the error, plus a clearErrors function triggered on input/change within that form. I'll also move focus to the offending field when an error appears for better keyboard accessibility.

For layout I'm keeping everything within a 360px width with no horizontal scroll, using full-width inputs and wrapping flex layouts for checkboxes and expense rows. I'm now working through a warm off-white and navy/signal-red color palette, calculating luminance contrast ratios to make sure text colors meet accessibility thresholds against the background.

I'm also verifying contrast for a teal "owed" indicator color and settling on a focus-visible outline style using the Harbour navy with offset spacing, then moving into picking fonts—Fraunces for headings paired with a complementary sans for body text.

For the page structure, I'm sketching a header with the "Even Keel" brand mark, a plain-spoken tagline about tracking who owes whom, and a two-column layout pairing people/expense entry on one side with balances and the expense list on the other.

Thinking through section order, I'm leaning toward People, then Log expense, then Balances & Settle up, then the full Expenses list on mobile, while desktop uses a grid splitting people/balances into one column and the expense log/list into another.

I'm settling on a simpler grid approach: mobile stacks sections as people, form, list, settle; desktop uses a two-row grid pairing people+form on top and settle+list below, letting row heights adjust naturally with top alignment.

Now I'm working out the visual design: cards with white surfaces and subtle borders, Fraunces headings with muted descriptors, 44px touch-friendly inputs with borders meeting contrast requirements, and a color system where Harbour is used for primary buttons and Signal for accents and delete actions — checking contrast ratios for each pairing. I'm also planning checkbox chips as styled labels wrapping each input for the participant selection UI.

I'm refining the error-state colors since the initial red-on-tint combination failed contrast checks, settling on a darker red text over a light tint that passes AA. I'm also defining positive-balance teal, and structuring the semantic markup: balances, transfers, and expenses as list items with data-testid and data-attributes (person, cents, from/to) so each row carries machine-readable amounts alongside human-readable text like "Ben pays Ana $12.50" or "Paid by Ana · Split 3 ways."

For expenses, I'm considering showing each person's exact share (e.g. "$4.17 each" with rounding differences spelled out) for transparency, plus a header summarizing trip totals. I'm adding person avatars with palette-derived colors by index, and writing out empty-state copy for each section—people, expenses, balances, and settle-up—covering cases like no data yet versus everyone being even.

Now I'm working through form details: when there are no people, the expense form shows a hint to add people first, with empty payer/split selects and a submit error if attempted anyway. I'm using proper forms with novalidate for custom validation, inputmode="decimal" text fields for amounts to preserve exactly what the user typed, character limits on name and description fields, and a simple generated id for each expense, with all people checked by default when the split is built.

For keeping newly-added people checked by default in the split, I'm rebuilding the checkbox list on each render by comparing against the previous checked set and previous known people, so a person stays checked if they were checked before or if they're new since the last render.

I'm also working out the smaller UX details: preserving the payer selection across renders when possible, resetting the split and clearing the expense form (but keeping payer) after a successful add, clearing and focusing the name input after adding a person, and shifting focus to the expenses heading after a deletion so keyboard focus isn't lost.

I'm separating concerns so render() only touches the lists and balances, while form select options only refresh when people actually change—keeping typing in inputs untouched. I'm now sketching the people section markup, with a form for adding a name, an inline add button, a spot for validation errors, and a list (or empty state) below it.

For errors, I'm inserting the message element right after the input field group and linking it via aria-describedby, only adding that attribute when an error is actually showing. Now I'm building the expense form fields—description, amount with a dollar prefix, a payer dropdown, and a fieldset for selecting who's splitting the expense.

I'm skipping extra "select all/none" shortcuts to keep scope tight, and planning the settle card to show balances and suggested transfers, plus the expense list sorted newest first and a currency formatter using Intl.NumberFormat for CAD values stored in cents.

Now I'm working out balance display rules — "is owed," "owes," or "is even" depending on sign — and settle-up phrasing like "Ben pays Ana $12.50," along with responsive layout details for small screens, text wrapping for long names/descriptions, and avatar initials with a cycling background color palette.

I'm also double-checking contrast ratios for the remaining avatar colors against white text, confirming they're all accessible, and moving into the JavaScript logic: setting up a storage key, currency formatter, and a load function that validates and parses saved people and expenses from localStorage with a fallback to empty state.

Now I'm fleshing out the save function with error handling, utility functions for cleaning and comparing names, and the addPerson logic that validates name length, emptiness, and uniqueness before saving and re-rendering. I'm starting on an amount-parsing function that strips a leading dollar sign and trims whitespace before further validation.

Still writing parser...

Now I'm mapping out the different user-facing error messages for invalid amounts—covering empty input, bad formatting with too many decimal places, and zero or negative values—to guide people toward entering something like "24.50".

Beyond amounts, I'm working through validation for description, payer selection, and split checkboxes, prioritizing which error to surface first when multiple fields are invalid. Then I'm writing a function to divide the total cents evenly among selected people, distributing any remainder cent-by-cent so the sum always matches exactly, before structuring the final expense object to store.

For balances, I'm using a Map instead of a plain object to avoid issues with names that collide with built-in object properties, summing what each person paid and subtracting their share of every expense. Then I'm writing a greedy settlement algorithm that matches debtors against creditors one pair at a time, transferring the smaller of the two amounts until all balances are settled.

For rendering, I'm deciding to always keep the list container present but show an empty-state message when there are no people or expenses, rather than swapping out the whole structure, so the test selectors stay consistent. I'm also thinking through what each person list item needs to display -- an avatar, name, and maybe a small label -- while keeping the test id simple.

For expense items, I'm sketching out the markup: a header with title and formatted amount, a meta line describing who paid and how it's split (singular vs plural wording), a chip-style list showing each person's share amount, and a remove button with a descriptive aria-label for accessibility while keeping the visible text short.

For balances and transfers, I'm planning list items with data attributes for person and cents, rendering readable sentences like "Ben pays Ana $12.50" built from labeled spans. I'll also add a small stats line in the header summarizing people/expenses/total, and I'm setting up an escaping helper to sanitize all user-provided content before inserting it into the HTML, including attribute values and select option labels.

For the form, I'm wrapping each checkbox in a clickable chip label with focus styling, and writing renderFormOptions to preserve the previously selected payer and checked participants when the people list changes, defaulting sensibly when a new person is the first one added.

I still need to handle the empty-state hint when no people exist, finish the submit handler for the expense form, and write the error-display helper that clears any existing error message before showing a new one in the appropriate form.

I'm settling on placing the error message right after the form element itself using insertAdjacentElement, since that works consistently for both forms without disrupting their internal layouts—error appears below the form in each case.

For clearing errors, I'm writing a function that removes any existing error elements and strips aria-invalid attributes from inputs, triggered on input/change events, and focusing invalid fields when errors appear.

For deleting expenses, I'm using event delegation on the expense list, matching clicks on delete buttons via their data-id attribute, then filtering the expense out of state, saving, re-rendering, and moving focus to the expenses heading for accessibility.

Now I'm designing the main render pipeline that calls renderExpenses, renderBalances, renderSettle, and renderStats, plus the balance status logic (owed/owes/even) and the settle-up empty states depending on whether there are people, expenses, or everyone's already even.

I'm settling on fully rebuilding container innerHTML each render rather than toggling hidden elements, which keeps empty states simple across all lists. Now I'm defining the color palette variables for the design, checking contrast ratios between the signal color and white text to ensure accessibility.

Still defining color variables...

I'm thinking through the header design—a harbour navy band with paper-colored text for the "Even Keel" title and a softer tagline color, both checked for contrast. I also want a signature visual element: a thin waterline graphic under the header and a small balanced-line logo mark to reinforce the "even keel" theme.

Now I'm laying out the page structure: a max-width container, a responsive CSS grid for the board sections (people, form, list, settle cards) that reflows at wider breakpoints, and styling conventions for card headers and form fields—covering label and input typography, sizing, borders, and focus states.

I'm also defining the interactive controls: a flexible input-row layout for the add-entry form, primary and ghost/danger button styles with accessible color contrast, a prefixed dollar-amount input, and a chip component for tags using flexbox.

For deeper structure, I'm resetting fieldset styling, giving list items subtle bottom borders, creating a circular avatar element, and deciding to use Fraunces with tabular numerals for monetary amounts to give the balance figures more visual character while keeping numeric alignment consistent.

Now I'm color-coding balance states, styling transfer rows as tinted cards, laying out expense items with flexible headers and wrapping share chips, and planning spacing for actions, empty states, and form error styling.

I want the error styling to use a signal-colored left border for decorative emphasis, plus a muted hint style. I'm also refining the app's copy around debt being normal—tagline and lede text explaining that positive balances mean owed and negative mean owing. I need to prevent horizontal scroll by setting min-width:0 on grid children and adjusting mobile grid columns, and I'm considering focus handling for the expenses heading when it receives programmatic focus.

Now I'm building the header markup with a brand mark SVG showing a circle with a level line, plus a tagline and stats placeholder, while making sure the main app wrapper with its test id properly contains everything including this header.

I decide to nest the header inside main alongside the content wrap, keeping it full-width with an inner constrained container. Now I'm sketching the People card section with its form, starting on the name input field and label structure.

Writing form markup...

For the input row layout I'm planning flexbox with the label-input group growing and the button aligned to the bottom, wrapping gracefully at narrow widths. Now I'm moving on to the expense logging card, starting its heading and description text.

Building the expense form fields...

I'm laying out the expenses list, balances, and settle-up cards, with balances showing who owes or is owed, and a settle section listing suggested payments to even things out.

Now I'm starting the JavaScript module, setting up storage keys, formatting helpers for currency and names, and utility functions for escaping HTML and pluralizing words.

I'm writing the load function that validates data from localStorage, filtering out invalid people entries and deduplicating names case-insensitively, then validating each expense's structure including id, description, payer membership, and split validity.

Adding person validation with error handling...

I'm writing a `fail` helper that derives the form from the invalid field itself, inserting an accessible error message after the form and marking the field aria-invalid, then focusing it. I'm now thinking through how this applies to the payer select and split chips, since those fields need their own focus targets for error display.

For clearing errors, I'm adding a `clearError` function that removes error paragraphs and resets aria attributes, then wiring it to input/change events across both forms so typing or selecting anything clears stale validation messages.

Now I'm writing the expense submit handler, validating that people exist first, then checking the description isn't empty, parsing the amount into cents with bounds checks for zero and maximum values, each failure calling `fail` with a specific message and focus target.

I'll handle an empty amount field with a clearer "Enter an amount, like 24.50" message before running it through parseAmount, then validate the payer is a known person and the split includes at least one checked person. Once everything passes, I push the new expense object onto the trip, save, and reset the form fields and checkboxes.

For computing shares, I'm distributing an expense's cents evenly across its split members in people-order, giving the remainder cents one at a time to the first few members so everything sums exactly. Then for balances I'm tallying each person's net position by adding what they paid and subtracting their share across every expense.

Now I'm drafting the render functions: a top-level render that calls sub-renderers for balances, settle-up, expenses, and stats, a stats line summarizing people/expense counts and total spent, and a people list that shows an empty-state message or renders each person as a row with a colored avatar initial and position number.

For balances, I'm deciding to always show the list once people exist (even with zero expenses, showing everyone as "even"), and building each balance row with a class and status label based on whether the person is owed, owes, or is even, including a colored avatar and data attributes for testing.

For the settle-up section, I'm handling the empty states separately depending on whether expenses exist yet, then rendering a note about how many payments are needed, followed by transfer rows showing who pays whom with the formatted amount and data attributes for from/to/cents.

For expenses, I'm handling the empty case similarly, then rendering each expense in reverse order as a card showing the title, amount, payer, split description (single person vs split N ways), a shares list breaking down each person's portion, and a remove button with an accessible label referencing the expense description.

I'm settling on "Split between N person/people" phrasing for the meta line, and wiring up a click handler on the expenses list that finds the delete button via closest, filters the expense out by id, saves, re-renders, and then moves focus back to the expenses heading for accessibility.

I'm attaching listeners to the stable parent containers rather than individual rendered items so they survive re-renders, making sure renderFormOptions runs before the initial render, and wiring input/change events on both forms to clear validation errors as the user types or toggles the expense chips.

Now I'm writing a parseAmount function that trims input, strips a leading dollar sign, and uses a regex to validate whole and fractional dollar amounts up to two decimal places, converting the result into cents while rejecting invalid formats like negative numbers, scientific notation, or malformed decimals.

For amounts too large (more than 9 digits), I return a sentinel like Infinity so the cents comparison against MAX_CENTS catches it, and I settle on an error message guiding users toward valid formats like "24.50". Then I move on to styling the row lists -- removing default list styling, adding flex layout with spacing and top borders between rows, and defining the balance row's name and status styling.

I'm designing the transfer cards as sea-mist colored pills within a grid stack, with flexible wrapping layout and rounded corners, plus text wrapping rules to handle long content gracefully.

Writing button styles...

I'm also thinking through focus-visible outline accessibility — checking that the harbour-colored outline stays invisible against the masthead but visible on paper backgrounds, and weighing whether to switch to the signal color for better contrast and distinctiveness.

Now I'm finalizing the type system: setting font fallbacks for Public Sans and Fraunces, designing a wave-shaped SVG divider at the bottom of the masthead in the paper color, and laying out the brand mark, tagline, and stats line with appropriate contrast ratios on the harbour background. I'm also working through container widths, padding, and heading sizes for the rest of the layout.

Writing card and form styles...

I'll keep the native select appearance rather than custom-styling it, which simplifies things. Setting the document language to English (Canada), and adding a safety rule so any `[hidden]` elements are forced to `display:none` regardless of other CSS.

Now I'm writing the function that rebuilds the payer dropdown and split checkboxes, preserving the previously selected payer and checked participants before regenerating the options from the current list of names.

Checking a few edge cases: new people added to a trip get their checkbox checked by default while existing selections persist, and the hint message only shows when there are no people yet. I also need to decide how to pluralize "person" versus other nouns like "expense" and "payment" in the stats line, since "person" doesn't follow the regular plural pattern — I'll write a small helper that takes explicit singular and plural forms.

I'm also planning the Google Fonts link for Fraunces and Public Sans with the right variable axes, the CSS grid layout for the board (people, form, list, settle cards) with a responsive two-column arrangement on wider screens, and the wave decoration at the bottom of the masthead. I want to double check that error messages stay inline without clearing what the user typed, and that localStorage reads/writes are wrapped safely in try/catch. Finally, I'm putting together the complete HTML document from the doctype down, making sure the voice stays plain and direct throughout.

