I'm planning the data model: people in order added, expenses with description, amount in cents, payer, and selected participants, splitting remainders fairly across sorted participants. For balances I'll compute paid minus share per person, then settle debts with a greedy matching so it takes at most n-1 transfers. I'll skip allowing people removal to keep things simple, and handle amount input validation with a regex that accepts decimals, stripping stray characters like currency symbols or commas before parsing into cents.

Payer and split selections default to including everyone, with newly added people automatically checked, and I'll track unchecked names separately to preserve state across re-renders. After a successful expense submission I'll reset the description and amount fields but keep the payer and full split selection. Errors will only render into the DOM when actively shown, using a dedicated test id, and name uniqueness checks will be case-insensitive after trimming whitespace.

For balances and transfers I'll render data attributes for person, cents, from, and to so tests can read values directly, showing every person's balance even when zero, and the expense list will display newest-first by reversing the stored order rather than resorting. I'll persist state to localStorage under a versioned key wrapped in a try/catch for safety.

For the visual design, I'm settling on Source Serif 4 for headings paired with Public Sans for body text and tabular figures for currency, aiming for a steady, trustworthy feel, and now I'm working out the color palette starting with a deep harbour blue.

I'm defining a warm, approachable palette (paper background, ink text, a sea green for positive balances and a muted signal color for owed amounts, avoiding alarming reds) along with a "keel bar" visualization that extends left or right from center to show who's owed or owes money, tying into the app's name and tone.

I'm laying out the structure: a harbour-colored header with a simple logo and tagline, a two-column desktop layout (forms on the left, balances/expenses on the right) collapsing to one column on mobile, visible focus states, and accessible checkbox-based split selection with "select all" convenience and careful focus management after deleting an expense.

I'm working out formatting details — using Intl.NumberFormat for currency display, writing clear language for how expenses are split and settled, placing validation errors near their fields with aria-live announcements, and preserving user input and form state (like selected payer and split checkboxes) across re-renders instead of wiping the form on error.

Now I'm defining the validation rules and parsing logic for expense amounts, handling stripped currency symbols and thousands separators, capping digit length, and setting a clear priority order for which error message to show first (missing people, then description, amount, payer, and split selection).

I'm sketching out the settle-up algorithm using sorted creditors and debtors with a two-pointer approach, plus empty-state copy for each section (people, expenses, balances, settle) and a "start a new trip" reset option with a confirmation dialog.

Writing CSS variables and layout styles...

Now I'm planning the JavaScript structure: state shape, localStorage load/save with validation, a unique ID generator, an amount parser that handles edge cases like commas and decimal precision, and share/balance computation functions that iterate expenses to tally what each person paid and owes.

I'm outlining the render functions for each section (people, balances, settle, expenses, summary) along with helper functions for showing and clearing field errors, toggling aria-invalid, and managing focus after deletions so keyboard users land somewhere sensible. I'm also deciding to keep person avatars as CSS-generated content so they don't pollute the text content that tests might check, and planning the post-submission behavior of clearing the expense form while announcing the addition via a live region.

