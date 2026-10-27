I'm planning the data model for people and expenses, how shares get split with remainders distributed fairly, and a greedy debt-settlement algorithm that minimizes transfers to at most n-1. I'm also working out input validation for amounts, deciding to sanitize text input for currency formatting rather than relying on a strict number input type.

Now I'm thinking through UX details: how errors should appear and clear, what resets happen after adding an expense (clearing description/amount but keeping payer, resetting split to everyone checked), handling focus after deleting an expense, and persisting state to localStorage with a versioned key and error handling. I'm also starting to settle on fonts for the design, leaning toward a serif/sans pairing that feels steady and honest.

Now I'm working out the color palette and checking contrast ratios for accessibility, deciding that owed/owing balances should stay neutral rather than alarmist with red, reserving the accent color for primary actions and focus states, while figuring out a separate, distinct treatment for actual error messages.

For the balance display I'm sketching a "keel" bar visualization with an even-horizon center line — owed amounts tinted toward harbour, owing amounts a muted sand tone — paired with plain-language labels like "is owed," "owes," and "Settled." I'm also planning the responsive layout, with desktop split into two columns and mobile stacked in a people-first order, and I'm thinking through a simple logo concept of a horizon line with a small keel shape in the signal color.

I'm deciding to skip a "Clear trip" reset button to keep things minimal and low-risk, while prioritizing accessibility details like visible labels, legends, aria-live regions, and focus outlines. For expense items I want explicit names in the split text rather than vague "everyone" language, plus a live per-share preview that handles remainders gracefully, like splitting unevenly across people when the amount doesn't divide cleanly.

I'm using text content rendering everywhere instead of innerHTML to prevent XSS, and setting data-person attributes safely through setAttribute. For parsing dollar amounts into cents I'm splitting on the decimal point and combining the whole and fractional parts, capping the max amount around $999,999,999.99 to stay within safe integer bounds without being overly restrictive. I'm also limiting person names to 40 characters via maxlength, and planning separate error messages with proper ordering—checking for missing people first, then missing description—each tied to aria-invalid and positioned near their respective fields.

Now I'm mapping out each validation message for the expense form: missing description, missing or malformed amount, non-positive amounts, too many decimal places, missing payer, and missing split selection, with focus moving to the offending field each time and errors clearing as the user corrects input. I'm wrapping inputs in actual form elements so Enter submits naturally, with submit handlers calling preventDefault.

For the settle-up view, I'm handling three states: an empty state before any expenses exist, an all-settled message when balances are zero, and otherwise a list of greedy-matched transfer suggestions, with balances always shown as signed cent values for every person even when zero.

Now I'm working through the debt-settling algorithm, sorting creditors and debtors by amount to produce deterministic, trip-order tie-broken transfers, plus the data persistence shape for people and expenses with load-time filtering for validity.

Now I'm styling the layout: a max-width container with a responsive two-column grid above 880px, card surfaces with subtle borders and rounded corners, Fraunces for headings, tabular figures for amounts, accessible input borders and focus outlines in the signal color, checkbox rows styled as flexible chips with quick "select all/clear" buttons, and a bold navy header band for the brand and trip summary.

I'm naming the brand "Even Keel" with the tagline "Split trip costs. End up even," then designing the balance bars to avoid red for "owes" — using a warm sand tone for owed-money and harbour blue for owed-to, keeping all amount text in ink color for contrast, and collapsing the bar below the name/amount line on narrow screens. I'm also drafting the expense list item layout and empty-state copy for both the people and expenses sections, encouraging friendly, concrete placeholder text.

For the expense form, I'm deciding that when there are no people yet, the inputs stay enabled but the split section shows a hint to add people first, and the payer dropdown shows a disabled placeholder option. Writing the core JS now for persistence, formatting money as currency, splitting expense shares evenly with remainder distribution, and computing each person's running balance from payments minus their share.

I'm working through amount parsing logic—stripping currency symbols and commas, validating the numeric format, rejecting negative or empty values with clear error messages, and converting to cents. Then I'm sketching out the render functions for people, payer, split checkboxes, expenses, balances, and settlement, along with how errors get displayed as an accessible live region that only carries the test id while visible.

I'm also deciding on UI details: error messages clearing on successful submit, focus management after deleting an expense (moving to the next delete button or the heading), and using CSS pseudo-elements for avatar initials so they don't pollute the text content tests check against. Now I'm settling on fonts—Fraunces for display text and Public Sans for body—before moving into the header styling.

Setting color and contrast variables...

Defining the layout styles...

I'm checking the contrast ratio for the error text color against its background, confirming it passes accessibility standards. Then I'm designing the balances list with a visual bar showing who's owed versus who owes, using a centered track with colored segments, plus settle-up transfer rows with arrow icons and "pays" labels for clarity. For expenses, I'm laying out description and amount on top with payer/split details as smaller muted text below.

For uneven splits, I want the copy to be specific rather than vague — something like "with 1 extra cent going to Ana" instead of a generic rounding note, and I'm deciding when to show this live share preview based on whether an amount has been entered.

Now I'm sketching the names joining logic using Intl.ListFormat with a fallback, and starting to write the core JavaScript for loading and sanitizing saved state from localStorage, validating people and expense entries as they come in.

Still writing debt-settlement logic...

For the person form, I'm handling duplicate name checks case-insensitively and validating before adding someone to the trip, then saving state and announcing the update. For expense submission, I'm planning validation order with field-level error focus, then clearing the description and amount while resetting the split checkboxes and keeping the payer selected on success.

Now I'm working through error element styling and behavior—toggling hidden attributes and clearing messages when the user edits a field, plus setting up the live region announcer for accessibility. I'm also designing the markup for expense list items, balance rows with "is owed"/"is even" wording, and settle-up transfer entries showing who pays whom, along with a simple decorative boat/signal-line SVG logo and responsive styling considerations like text wrapping and custom select arrows.

