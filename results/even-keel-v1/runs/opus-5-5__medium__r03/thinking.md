I'm planning the HTML structure, sticking to the allowed color palette and font sizes, and deciding how to show error messages without using the restricted Signal color. I'm also sketching the data model for people and expenses.

I'm working out split calculations in trip order, a greedy debt-settlement algorithm that minimizes transfers, and careful amount parsing using integer cents to avoid floating-point issues, plus deciding to use a text input with decimal mode so I can control validation precisely.

For errors, I'll only render the error element when an error exists, tying it to aria-invalid and aria-describedby for accessibility. For the expense form, I'm deciding to always show it even with no people, defaulting all checkboxes to selected and resetting them after each submission, while newly added people get checked by default too.

On invalid submission I'll preserve whatever the user typed rather than clearing it, but after a successful add I'll clear description and amount, reset the split selection, and refocus the description field. New expenses get added to the top of the list, showing payer and specific split names, with a remove button labeled by the expense description.

For balances I'm using a plus sign with Kelp color for positive amounts and a minus sign (−) with Harbour color for negative ones, checking contrast ratios against the background colors, and persisting everything to localStorage under a versioned key with try/catch safety. Headings use sentence case like "People" and "Add an expense", while the "Even Keel" wordmark stays as a proper noun.

Now I'm working out layout details—max-width and padding for the main container, panel styling with Paper backgrounds and Rope borders—plus checkbox accent colors, a fieldset with a "Split between" legend, and focus-visible outlines in Harbour blue to ensure visibility everywhere, including a secondary button style for the remove action that avoids color tints by using underline on hover instead.

I'm settling on currency formatting with Intl.NumberFormat for CAD, using names as unique keys for expenses, and writing out the empty-state messages for each section—people, expenses, balances, and settle-up—making sure each gives clear guidance like "Add people first" or "Everyone is even. Nothing to settle."

Now I'm working through validation rules: case-insensitive duplicate names with a length cap, requiring at least one person selected for splitting, and keeping descriptions trimmed with a max length. I'm deciding on error presentation—one error region per form, aria-invalid with focus management, and simple removal of expenses without confirmation, just shifting focus afterward.

For layout, I'm planning the people form as label-above with a flexible input-and-button row that holds up at narrow widths, and the expense form with description/amount fields stacking on mobile but side-by-side on desktop, plus a wrapping checkbox grid for splits. I'm skipping extras like "select all" or a full trip reset to keep things simple, and settling on a compact meta line showing who paid and who split the expense, with a plain-text transfer summary like "Ben pays Ana $12.50."

I'm picking Fraunces and IBM Plex Sans from Google Fonts with proper preconnect links, sizing the wordmark larger on desktop and smaller on mobile, with consistent heading and body text scales.

Now I'm writing the state logic: loading saved data with sane defaults, validating expenses against the current people list, and computing each person's share and running balance before generating the settle-up transfers between creditors and debtors.

For the UI, I'm making sure the split checkboxes preserve their checked state across re-renders while defaulting new people to checked, building everything safely with DOM methods instead of innerHTML to avoid any escaping issues with user-entered names. I'm also writing a parser for amount input that strips currency symbols and commas and validates the result is a proper number before accepting it.

Now I'm refining the amount validation: converting the string into cents, rejecting negative or zero amounts with a clear message, capping the input under $10,000,000, and giving a specific error for too many decimal places. I'm also deciding error priority so only the first validation failure shows, in order of description, amount, payer, then split selection, and starting on the matching error message for an empty name field.

For duplicate names, I want the error to echo back the existing person's casing. I'm making sure forms submit properly on Enter by using submit-type buttons with novalidate, and handling the payer dropdown gracefully when there are no people yet by showing a disabled placeholder option. I also like the idea of surfacing a running total spent somewhere in the page metadata.

Writing base styles...

Actually checking contrast, Rope border on white fails the 3:1 non-text contrast requirement, so I should switch input borders to Fog instead, reserving Rope for panel/divider borders where contrast isn't as critical.

For the checkbox I'll set the accent color to Harbour at 20px, and for the primary button I'm verifying white text on the Signal background meets contrast — working through the luminance math gives roughly 5:1, which should pass.

Still defining component styles...

Still styling layout...

Also planning focus management after deleting an expense: move focus to the next delete button, falling back to the previous one or the expenses heading if none remain.

I'm adding visually-hidden live announcements for additions and removals, like "Added Ana" or "Removed expense," plus a visually-hidden utility class and making sure rendering happens right after load. Now I'm writing the load/validate logic for the stored data, checking people and expense shapes, dedupe names, and filtering out invalid entries.

Defining the state structure with people and expenses arrays, keeping expenses in insertion order internally but rendering them newest-first. Now writing the full file...

