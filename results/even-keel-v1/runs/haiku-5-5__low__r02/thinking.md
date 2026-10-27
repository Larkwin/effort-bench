I'm working out the core data model and logic: tracking people and expenses with their splits, computing each person's share with remainder distribution, calculating balances from paid versus owed amounts, and designing a greedy algorithm to settle debts with minimal transfers.

For validation, I'm defining strict rules for amount inputs (digits with up to two decimal places, optional leading dollar sign, must be positive) and name inputs (trimmed, non-empty, case-insensitive uniqueness), with inline error messages displayed per form.

I'm also thinking through expense form requirements — description, amount, valid payer, at least one split recipient — and deciding not to support removing people once added, to keep things simple. For rendering, I'll rebuild the split checkboxes whenever the people list changes, defaulting new entries to checked, while leaving other form inputs untouched during re-renders to avoid losing user-typed values.

I'm also planning persistence via localStorage under a trip-specific key, storing people and expenses as JSON with safe loading and validation, generating expense IDs from timestamp plus randomness, and formatting money using Intl.NumberFormat for CAD currency so balances and transfers display correctly with proper sign handling and color coding. I also want to avoid any HTML injection by building DOM nodes programmatically rather than using innerHTML, and to keep accessibility solid with visible labels and focus outlines.

Now I'm working through the layout structure—wrapping everything in a main container with sections for people, expenses, balances, and settling up, rendering the expense list newest-first, and designing the split checkboxes with labeled inputs per person. I'm also defining empty-state messaging for when there are no people or expenses, handling form submission via Enter key, and adding a delete button with a descriptive aria-label for each expense.

Now I'm designing the balance and transfer elements with data attributes for person, direction, and amount, then moving into the color system: mapping palette colors to backgrounds, panels, text, and buttons while checking contrast ratios for accessibility, defining focus rings, and choosing border colors for inputs and secondary buttons to stay consistent with the brand palette.

With the visual system settled, I'm working through typography — the wordmark styling, supporting tagline, and a type scale for headings, body, and hints across breakpoints. Then I start writing the actual app code: setting up currency formatting, a localStorage key, state loading/saving with validation for people and expense entries, and a name validation function for new people.

Writing input validation and calculations...

I continue defining the amount parsing logic, split calculation (dividing cents evenly with remainder distribution), balance computation across expenses, and a debt-settlement algorithm that matches creditors to debtors. I lay out the validation rules for adding an expense — checking for people present, description filled, valid amount, valid payer, and at least one person selected for the split — along with how error messages display per form.

Writing rendering functions...

I work through rendering logic for people, the payer/split form (preserving selections across re-renders), expense list items, balance displays with signed currency formatting, and settlement transfers, then plan how these render functions get called together after state changes. I draft the HTML structure for the header/wordmark, then move into CSS — background and base typography, panel styling, the signature rule element, input and button styles including hover and focus states, error message styling using Harbour color and border instead of Signal, money formatting with tabular numbers, list styling, and mobile-responsive adjustments. I sketch out the expense form markup with labeled fields for description, amount, payer, and a fieldset of split checkboxes, plus a hidden error paragraph, making sure hidden attributes are enforced with CSS. Finally I start writing the expense submission handler, checking for people existing, description present, and valid amount before continuing into further validation.

