I need to plan out the full single-file app: people management with trimmed, unique, case-insensitive names and inline validation errors; expense entry with description, positive amounts rounded to cents, payer and split selection defaulting to everyone checked, with leftover cents distributed to the earliest-added selected people. I'm also working out balances as paid-minus-share with signed cent values, a greedy settle-up algorithm capped at n-1 transfers, and currency formatting using Canadian locale conventions.

I'm deciding to use text inputs with decimal input mode rather than number fields so I can properly validate and message amounts with more than two decimal places, parsing the string manually into integer cents while allowing an optional leading dollar sign and comma separators.

For the payer selector, I'll default to the first person added so there's always a valid selection, and for the expense form itself when no people exist yet, I'll keep the add button enabled but show a validation message rather than disabling it, since disabled buttons could break test interactions. Split checkboxes default to all checked.

After adding an expense, I'll reset the description and amount fields and re-check all split boxes, but keep the payer selection since people often log consecutive expenses as the same payer. Each expense will store id, description, cents, payer, and the list of split names, with shares computed at display time based on the current people order.

Shares get calculated by dividing the cents evenly with floor division and distributing the remainder cent-by-cent to the earliest selected people in trip order. Balances are just paid minus share, shown as signed cents — positive meaning owed money, negative owing, zero meaning settled.

For the settle-up algorithm, I'll use the standard greedy approach: sort creditors and debtors by magnitude, match the largest against each other repeatedly since each match zeroes out at least one party, guaranteeing at most n-1 transfers overall.

For display, money formats using cents divided by 100, with negative values rendered using a minus sign prefix like "-$12.50". For error messages, I want an always-present paragraph element with aria-live so screen readers catch updates, but I'll only attach the test id attribute when there's an actual message to show, plus a hidden attribute when empty. Expense removal just needs a labeled "Remove" button with no confirmation step, and I'm now thinking about the empty-state copy for when no people have been added yet.

I'm sketching out the layout, starting with a header containing a small rule mark beside the "Even Keel" wordmark in Fraunces, a short tagline underneath, and the main content broken into bordered panel sections with consistent padding and heading styles.

For buttons I'm sticking to the approved palette: Signal background with Paper text for primary actions, and Paper background with a Rope border for secondary ones like Remove. Since I can't use tints or shadows for hover states, I'm working out alternatives like underlining text or shifting border color to Harbour to signal interactivity without breaking the color constraints.

I'm also running contrast calculations on Signal red against white to verify it meets accessibility thresholds for text and buttons.

Finishing contrast checks: Fog on Sailcloth gives ~5.0 ratio, Kelp on white gives ~6.3, both passing accessibility standards. Now I'm moving to pick fonts, planning to use Fraunces at weight 600 paired with IBM Plex for the typography.

Setting up the Google Fonts stylesheet link with preconnect hints, then turning to the mobile layout — panel padding, full-width fields, and structuring the expense form with description, amount, and payer stacked, plus a fieldset for split checkboxes.

Now I'm designing the balance list with name on the left and amount on the right, plus meta text like "owes" or "is even," and formatting transfer suggestions like "Ana pays Ben $12.50." For expense items I'm laying out the description, amount, and metadata showing who paid and who split it, alongside a remove button, and sketching the simple name/input/button structure for adding a person.

I'm deciding to persist state to localStorage under a versioned key, loading it with validation and fallback handling, and generating expense IDs using timestamps or UUIDs when available. To avoid losing typed input, I'll only re-render the payer and split options when the people list changes rather than fully rebuilding the form. I'm also making sure labels, ARIA attributes, and list roles are properly set for accessibility, and adding a simple heading for the app's title.

Still writing storage and parsing logic...

Also capping overly long digit strings with a smaller-amount message. For validation order on expenses, I'll check people exist first, then description, amount, payer membership, and split selection, focusing whichever field is wrong.

For splitting shares, I'm writing a function that divides cents evenly among selected people and distributes any remainder one cent at a time to the first few people in the list. Now I'm starting on the balances calculation, initializing each person's balance to zero before iterating through expenses.

Finishing the balances function by adding payer contributions and subtracting shares, then writing a debt-settlement algorithm that greedily matches creditors with debtors to minimize the number of transactions, confirming the totals will always balance out exactly. I also need to remember to escape HTML in names and descriptions for safety.

I'll build DOM elements with a small helper function instead of using innerHTML to avoid injection issues. I'm capping person names at 40 characters and checking for duplicate names case-insensitively, showing a clear error message when someone tries to add a name already on the trip, with dedicated error elements for person and expense validation.

Now I'm setting up the base styles—defining a color palette with harbour blues and warm sail tones, establishing body typography with Plex Sans, and laying out the main container with responsive padding for mobile.

I'm also designing the wordmark with a small signal-colored accent mark paired with a Fraunces headline, double-checking the gap spacing against my 8px spacing rule since 12px sits awkwardly between the allowed increments.

I'm defining the text input and select styles with consistent padding and a 40px minimum height, confirming the math works out with 1.5 line-height at 16px plus padding. Now I'm styling the base button, matching the same padding, radius, and height conventions, with a quick transition on border and background color.

Adding hover and primary button variants...

For selects I'm leaving the native appearance mostly intact since custom arrows would need SVG icons, just adjusting border and radius. For checkboxes I'm setting a 20px size with accent-color matching the harbour variable, wrapping label text with flex-wrap and consistent gap spacing, then moving into panel styling with background and border definitions.

Now I'm styling list items with border-top dividers using adjacent sibling selectors to avoid a border on the first item, then setting up balance rows as flex containers with space-between alignment and tabular numerals for money values, including a positive-amount color class, before sketching the markup for an expense list item with description and amount spans.

For layout I'm using flex-wrap on desktop so the expense body can flex while the remove button stays fixed-size, and considering how to phrase the meta line showing who paid and how the expense splits between participants, possibly listing each person's share explicitly for clarity.

For the settle-up section, I'll show "Everyone is even." when balances are all zero, and "Add an expense to see who owes whom." for the empty state. I'm also considering whether to include a total spent summary panel.

I decide to skip the meta summary line and keep things plain, focusing instead on responsive layout: stacking amount and description on mobile, switching to a two-column grid on desktop for the expense form fields.

For the person-adding form, I'm laying out the label above the input with the input and button sharing a flexible row that wraps gracefully on narrow screens. I also want to standardize heading styles and handle focus management carefully—keeping focus on the input after adding a person, moving to the description field after adding an expense, and shifting focus to the expenses heading after removing one, so keyboard and screen reader users aren't left stranded. Finally, I'm making sure hidden error elements stay properly hidden via a simple attribute selector.

Now I'm starting to write the actual HTML document, setting up the page head with fonts, title, and viewport meta, then beginning the body structure with a branded header containing the app name and tagline.

Writing people section markup...

I'll switch aria-live to "polite" for a calmer announcement, then start building the expense form fields for description, amount, and payer.

Finishing the split-between fieldset with checkboxes and an error paragraph, I decide the amount hint showing an example format is fine since it's just a hint, not placeholder data. I also need to handle the empty state when there are no people yet, showing a hint to add a person first.

I'm planning to add a disabled option like "Add a person first" to the payer select only when no people exist, keeping it empty otherwise. Then I outline the rendering functions I need — renderPeople, renderExpenseForm, renderExpenses, renderBalances, renderSettle, all called by renderAll — and note that renderExpenseForm needs to preserve the current payer selection and checkbox states, defaulting new names to checked.

I'm writing a small DOM helper function to create elements with attributes and children, then setting up currency formatting using Intl.NumberFormat for CAD, verifying it renders amounts correctly including negatives. I'm also starting to check if Intl.ListFormat is available for formatting lists of names.

Now I'm deciding how balance rows should display: who owes vs is owed vs even, with styled spans for names, status text, and colored amounts, plus a transfer row format showing who pays whom. I'm also making sure transfer amounts store positive integer cents, and planning the expense form reset logic to clear fields after submission.

Writing checkbox and layout styles...

