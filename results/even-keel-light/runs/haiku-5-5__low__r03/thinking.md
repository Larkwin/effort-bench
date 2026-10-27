I'm planning the data model and validation rules: people need unique trimmed names, expenses need a description, valid positive amount parsed into cents, a payer, and a list of split participants.

For splitting I'll compute equal shares using floor division with remainder cents distributed to the first participants in the order they joined the trip, then derive each person's balance from what they paid minus their share. For settling up, I'll use a greedy algorithm matching the largest creditor with the largest debtor repeatedly, which guarantees at most n-1 transfers.

I'm also deciding to persist people and expenses in localStorage under a single key, skip person removal to avoid reference issues, and re-render the whole app from state while preserving typed input on validation failures.

Payer dropdowns and split checkboxes need rebuilding whenever people change, preserving existing selections and defaulting new people to checked. For amount parsing I'll strip currency symbols and commas, validate with a decimal regex, and use safe DOM construction to avoid any HTML injection risks.

For the form error I'll only create the message element with its test id when there's actually an error to show, removing it entirely otherwise, and I'm adding delete buttons to each expense row. I'm also working through the color palette — Harbour blue and Signal red against a warm paper background — checking contrast ratios to make sure button text and negative balance indicators meet accessibility standards.

I'm settling on refined colors for owed versus owing amounts, both passing contrast checks comfortably, pairing Fraunces for headings with Figtree for body text, and planning a responsive grid layout that goes single-column on mobile and two-column on larger screens. For currency I'm using Intl.NumberFormat for CAD formatting with signed "owes"/"is owed" phrasing, and I'm starting to build the debt-settlement algorithm by splitting balances into sorted creditor and debtor lists.

Now I'm writing the HTML scaffold with the page head, font links, and the opening header markup for the app.

I'm planning out the form structure for people and expenses: name input with validation error slots, expense fields for description/amount/payer/split checkboxes, and list containers with data-testid hooks for people, expenses, balances, and transfers, each with appropriate empty states.

I'm designing the logic for syncing form options when people change, preserving previously checked split members while defaulting new people to checked, and resetting the expense form after a successful submission while keeping validation order consistent (description, amount, payer, split, and person-existence checks).

I'm writing the amount parser that strips currency symbols and commas, validates decimal format, and converts to integer cents, then the share-splitting function that distributes remainder cents evenly starting from the front of the ordered member list, and the balance calculator that nets each person's paid amounts against their owed shares.

I'm defining the settle-up algorithm along with expense storage shape, and establishing a careful load/save routine with validation on stored data.

I'm setting up the CSS custom properties for the color palette, checking contrast ratios for text and focus states, and choosing Fraunces for headings/amounts and Figtree for body text with tabular numerals for monetary values.

I'm building the responsive grid layout, splitting content into two columns on wider screens while keeping everything stacked and readable on narrow mobile widths, with careful attention to input sizing and text wrapping.

I'm finalizing the render functions for people and expenses lists, the delete handling via event delegation, and the formatting logic for balance and transfer display text, then writing the error-display and person-addition handlers with trimming, duplicate checks, and focus management before assembling the complete code.

