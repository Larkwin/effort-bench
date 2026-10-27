I'm thinking through the visual design: a warm, calm palette with navy and a muted signal color used sparingly, built around the principle that owing money is normal rather than alarming, so I want to avoid harsh red tones for negative balances.

I'm running contrast calculations to make sure the signal color works for buttons and text against both white and paper backgrounds, settling on Harbour for primary actions and a deeper signal shade for errors so everything stays accessible but still calm.

For typography I'm leaning toward pairing Fraunces for headings with Public Sans for body text, giving tabular number alignment for money values. For layout I'm planning a two-column desktop grid with people and the add-expense form on the left, settle-up and balances with the expenses list on the right, collapsing into a sensible vertical order on mobile. For state, I'm sketching a simple data model of people and expenses persisted to localStorage, skipping person deletion since expenses reference them directly.

I'm deciding to allow removing a person only when they aren't referenced in any expense, keeping it low-risk. For amount input, I'm working out strict validation logic that parses the amount as a string to avoid floating-point errors, enforcing up to two decimal places, requiring a positive value, and capping the number of digits to prevent overflow, using a text input with decimal inputmode instead of a native number input.

For splitting and balances, I'm computing each person's share by dividing total cents evenly and distributing the remainder in trip order starting from the payer, then deriving balances as paid minus share, displayed per person in trip order with signed values for testing.

For settlement, I'm using a greedy algorithm that matches the largest debtor with the largest creditor repeatedly, breaking ties by trip order, guaranteeing at most n-1 transfers; for form errors, I'm deciding to render them into a persistent alert container rather than toggling visibility, to make hidden/shown states more reliably testable.

Now I'm working through the expense form's edge cases—deciding not to disable fields when there are no people yet, instead showing an inline "add people first" message, and weighing whether the payer dropdown should default to the first person or force an explicit choice via a placeholder option, since that affects how tests interact with it.

I'm also planning how re-renders should work: preserving selected payer and checkbox states across people updates, resetting the split selection to "everyone" after a successful expense add, and keeping focus on the description field. For checkbox chips, I'm settling on a native checkbox with accent-color styling inside a pill-shaped label, making sure the focus-visible outline still shows properly.

I'm adding "Everyone" and "Clear" link-style buttons for quickly toggling the split selection, and deciding each expense list item should show the description, amount, payer, split participants, and a delete button with an accessible label—no confirmation step needed since tests expect immediate removal.

For dates, I'm storing a timestamp and displaying newest-first with a formatted short date, and for balances I'm adding simple status text plus a small diverging bar visualization to show who owes or is owed money.

For color, I'm settling on a warm sea-green for amounts owed and a muted harbour-blue for amounts owed by someone, keeping the brand accent color reserved for actions like transfer arrows so debt doesn't feel alarming—plus signed amount prefixes and accessible aria-hidden bars since color alone shouldn't convey meaning. I'm also planning the settle-up transfer list format and empty-state messaging for when there are no people or expenses yet.

For the header, I'm designing a small SVG mark—a simple hull shape with a triangular sail—to go with the "Even Keel" brand name, plus adding a trip summary line showing total spent and expense count. I'm also setting up HTML escaping via a helper function and defining name validation rules: trimmed input, 40-character max, case-insensitive duplicate checks, with friendly error messages for blank or duplicate names.

Now I'm making data loading robust with try/catch and shape validation, filtering out expenses that reference unknown people. For the forms, I'm wiring up submit handlers so Enter key and button clicks both work, using novalidate and clearing errors on input. I'm weighing how to render the person list—thinking about avatar initials and remove buttons—since adding extra text inside each list item could break tests expecting exact name matches, so I need to be careful about the markup structure there.

I'm deciding to skip individual person removal to avoid that text-content risk, and instead offer a "Start a new trip" reset button with an inline two-step confirmation instead of a native confirm dialog. For expense and balance display, I'm keeping descriptions, amounts, and payer names together in the text content since that's expected. I'm also defining the color palette variables, checking contrast ratios like muted text against the paper background to make sure they're accessible.

Now I'm planning the header design with a Harbour-colored band, paper-colored text, and a thin Signal-colored line at the bottom like a waterline, plus deciding on card styling with white backgrounds, thin borders, and rounded corners. I'm working through focus-visible outline styles, weighing whether to use Signal or Harbour colored rings with proper offset so they're visible against both white cards and filled buttons without clashing with the brand palette.

I'm settling on button hierarchy — Signal-filled for primary actions like adding expenses, Harbour outlines for secondary actions, and text-style underlined buttons for removal. For inputs, I'm specifying a minimum 44px height, 16px font size to prevent iOS zoom, and a dollar-prefixed amount field labeled "Amount (CAD)". On mobile I'm making the layout single-column with wrapping chips and flexible expense item rows that handle long text gracefully, then moving into a two-column grid layout for wider screens with people and the expense form on the left, and settle-up/balances/expenses on the right.

I'm building out the data layer now: localStorage persistence with try/catch fallbacks, a currency formatter using Intl.NumberFormat for CAD display, and a parseAmount function that validates decimal inputs, rejects malformed numbers, caps decimal places, and allows comma-separated thousands for convenience. I'm also deciding validation should surface the first error found per form, with focus moving to the offending field.

Writing calculation logic...

I'm structuring the debt-settlement algorithm — sorting creditors and debtors by amount, repeatedly matching the largest creditor against the largest debtor, transferring the minimum of their balances, and removing settled parties until everyone's at zero. I'm also planning the rendering functions for people, balances, settle-up transfers, and expenses, each with data-testid attributes for amounts and names.

Writing component rendering functions...

I'm deciding on supporting details: avatar initials cycling through a few accessible color pairs, expense cards showing "Paid by X · Split between Y, Z" with readable date formatting, and dynamic error containers using aria-live regions placed contextually below their relevant form fields. I'm also settling on landmark structure — keeping the header outside the main content area — and finalizing the checkbox-chip rendering logic that preserves checked state across re-renders while defaulting new people to checked.

I'm now ready to assemble the complete implementation, keeping focus management tight (returning focus to inputs after adding people, moving focus to errors when validation fails) and syncing the payer dropdown's selected value across re-renders.

