I'm planning the data model: people stored as an ordered list, expenses with description, amount, payer, and split participants, all persisted to localStorage. For splitting costs, I'll divide evenly with remainder cents distributed to the first few people in trip order, then work out how to calculate each person's net balance.

For settling up, I'm using a greedy matching of creditors to debtors, which guarantees at most (number of nonzero balances - 1) transfers since balances sum to exactly zero with integer cents. For validation, I'm checking the amount format with a regex allowing up to two decimal places, requiring a positive value, a valid payer, at least one split participant, and a non-empty description — while skipping person removal since it's not required and would break expense references.

Since I only re-render lists rather than the whole form, typed values persist naturally, but I need to rebuild payer/checkbox controls whenever people change, preserving existing selections and defaulting new people to checked. I'm also adding accessibility touches like alert roles, aria-live regions, aria-describedby associations, and focus management on errors, plus picking a warm, high-contrast color palette and font pairing (Fraunces for headings, a clean sans for body) for the overall design.

I'm computing relative luminance for the signal red against the background to confirm it clears WCAG contrast thresholds, settling on a slightly darker red for error text safety and white-on-brand for buttons. Now I'm planning the layout structure: a branded header, then a responsive grid that stacks on mobile and splits into two columns above 880px, with people and expense entry on one side and the expense list on the other.

For state management I'm defining how data loads and saves, and writing the validation logic for adding people (trimming names, checking duplicates case-insensitively) and adding expenses (requiring a description, a valid payer, at least one split participant, and a properly formatted dollar amount).

For amount parsing I'm using a regex that accepts whole numbers or up to two decimal places, converting the string into integer cents and rejecting non-positive amounts. For errors, I'm designing a single error container per form that gets dynamically created and removed rather than just hidden, so tests checking the DOM behave predictably, and now I'm thinking through how to render expenses with the newest ones listed first.

Expenses display payer and split details with a delete button, while balances are computed per person as paid minus owed share and labeled as owing, owed, or settled. For settling up I'm using a two-pointer approach matching creditors to debtors, with empty-state messages for no people, no expenses, and fully settled balances, and I'm working out how to preserve select and checkbox state across re-renders by syncing controls rather than rebuilding them from scratch.

I'm handling edge cases like disabling the expense form when there are no people yet, defaulting new people to checked in the split, escaping all user-provided text to prevent injection, wrapping localStorage access in try/catch, and writing mobile-first CSS with a minimum width and 16px input font size to avoid iOS zoom.

Now I'm settling on accessible focus outlines and a color palette with paper, ink, harbour, and signal tones, plus pairing Fraunces for headings with Atkinson Hyperlegible for body text. Starting the HTML document structure with meta tags and font links...

Building the header and the People section with a form for adding names...

Now I'm moving to the expense form section, adding fields for description, a dollar-prefixed amount input with decimal keyboard support, a payer selector, and a "Split between" fieldset with checkboxes for splitting costs.

I'm also planning the overall layout, deciding on DOM order for mobile (people, expense form, balances, settle up, expenses) versus a two-column grid arrangement for desktop.

Now I'm starting the JavaScript, setting up a localStorage key, a currency formatter for CAD, and a load/save state system with validation fallback to empty people and expenses arrays.

Still writing helper functions, including an HTML-escaping utility, and error display functions that insert accessible error messages with role="alert" into designated slots, plus a clearError to reset them.

I'm now writing the person form submit handler: it trims and normalizes the name, shows an error and focuses the input if empty, checks for case-insensitive duplicates against existing people, and otherwise pushes the new name, saves state, clears the input and error, and re-renders. I'm now starting the expense form submit handler, pulling in the description, amount, and payer fields.

Continuing the expense handler: I'm validating description text, parsing the amount into cents with a helper that rejects invalid or non-positive values, checking that people exist before logging an expense, verifying the payer is valid, and gathering checked split participants in trip order, each with a corresponding error message and focus target if validation fails.

I'm now generating a unique id for the new expense entry, resetting the description and amount fields after a successful submit while preserving the payer and split selections for convenience, then re-rendering and refocusing the description input. I'm also deciding to clear validation errors as the user types rather than only on submit, and writing the amount parser to accept plain decimal strings with up to two decimal places, rejecting anything like commas or currency symbols for now.

Next I'm writing the splitting logic that divides a cost evenly across selected people while distributing any leftover cents to the first few in order, then computing each person's overall balance by summing what they paid minus what they owe across all expenses. Finally I'm working out a simple debt-settlement algorithm that sorts people into creditors and debtors by amount, then greedily matches the largest creditor against the largest debtor to minimize the number of payments needed.

Now I'm moving to rendering the payer dropdown and split checkboxes, preserving previous selections where possible when the people list changes.

One issue: using a plain object to track previous checkbox states risks prototype pollution bugs for names like "constructor," so I should use a Map instead, and similarly use a null-prototype object for the balances map to safely handle any name including "__proto__." I also want to add a help message when there are no people yet, both in the split section and payer dropdown area.

For rendering people, I'll list each one with their name in a simple list item. For expenses, I'll show them newest first with description, amount, who paid, and a breakdown of how it's split among participants with each person's share amount. Each expense gets a delete button with an accessible label referencing the description. Balances render per person showing whether they're owed money, owe money, or are settled up, and the settlement transfers list shows who pays whom and how much, with appropriate empty states throughout.

I'm adding a total spent figure to the expenses header, moving focus to the heading when an expense is deleted so keyboard users don't lose their place, and being careful to only re-render the people/controls section when people actually change so I don't disrupt checkbox or input focus during typing. Now I'm writing the CSS for the page layout, starting with the body styles, header styling with the brand colors and typography, and the main content wrapper width.

Still writing styles...

Adding checkbox chip styles...

I'm also styling the error message block with a soft red background, dark red text for contrast, a signal-colored left border, and rounded corners to make validation errors stand out clearly.

Continuing the design, I'm setting muted help text, list items with flex layout and bottom borders, an empty-state box with dashed borders, tabular numbers for amounts, and balance colors that pair color with text labels (not color alone) to show who owes whom—plus a simple "Ana pays Ben" phrasing for transfers instead of arrow icons.

For remaining details I'm styling a ghost-style remove button, adding a "Balances always add to zero" summary line, and settling on the tagline "Owing a friend is normal. These are the fewest payments that square everyone up." I'm also double-checking the Fraunces font URL syntax, then finalizing the file with a data-testid on the balance element, the person's name included, the script placed at the end of the body, and aria-live added for accessibility.

