I'm checking contrast ratios for the limited color palette, confirming Fog text on Sailcloth background and Signal red against white both meet accessible contrast levels.

Now I'm sketching the overall layout: a header with wordmark and a supporting tagline, followed by sections for People, adding an expense, Balances, Settle up, and the expense list, with a consistent type scale for headings and body text.

I'm planning the data model around a people array and an expenses array, where each expense tracks description, amount, payer, and split participants, with splits ordered by each person's position in the people list rather than selection order so leftover cents distribute predictably.

For the amount input, I'm deciding to skip person removal for simplicity and validate dollar amounts with a regex allowing up to two decimal places, using a text input with decimal inputmode so invalid entries can show proper error messages, while capping the maximum accepted amount to avoid absurdly large numbers.

I'm planning distinct error-message regions for the person and expense forms, each using an always-present aria-live container with an inner error paragraph shown conditionally and a data-testid for tests, plus aria-invalid/aria-describedby wiring on inputs. For the expense form specifically, I'm defining targeted messages for empty description, invalid or non-positive amount, too many decimal places, and no payer selected.

On success I want to clear the description and amount fields, reset the split selection to everyone, and return focus to the description input, while keeping typed values intact when validation fails. For the payer dropdown I'm deciding to default to the first person rather than use a placeholder option, and for split checkboxes I'm tracking an "unchecked" set so newly added people default to checked while preserving the user's existing selections across re-renders.

Now I'm working out balances per person as paid minus their share, rendering each with a data-testid and signed amount — positive meaning "is owed" (shown with a plus) and negative meaning "owes" (shown with a minus), with settled-up as a neutral state. For settle-up suggestions, I'm using a greedy algorithm that sorts creditors and debtors by amount and matches the largest debtor against the largest creditor repeatedly.

For the expense list, I'm deciding to show the description, amount, who paid, and who it was split between, with a "Remove" button whose accessible name should still match simple role queries despite including the description in the aria-label. I'm also handling empty states with distinct messages depending on whether expenses exist yet or transfers are needed.

I'm planning the remove button to skip confirmation, using a small helper to escape text safely when building DOM nodes, and persisting data to localStorage under a versioned key with validation on load. For the person list, I'm defining the empty state copy, making the add-person flow a proper form, and styling buttons so the primary "Add" actions use Signal while "Remove" uses a secondary Paper/Harbour/Rope styling.

For hover states, secondary buttons shift to Sailcloth and primary buttons shift to Harbour background, keeping within the allowed palette. For the expense form, I'm deciding to keep it visible even with no people yet, showing a hint message and a disabled placeholder option in the select rather than hiding the form entirely, so submitting without a person still surfaces a clear error.

I'm laying out the form fields—description, amount with a "$" prefix and "Amount (CAD)" label, payer select, and a fieldset for splitting with checkboxes arranged in a grid, each with generous touch targets. I'm adding consistent focus-visible outlines in Harbour across all interactive elements, styling checkboxes with the Harbour accent color, using tabular figures for money values, and pulling in Fraunces and IBM Plex Sans from Google Fonts with sensible fallbacks before moving into the base body layout styles.

Now I'm working out the broader page structure: background in Sailcloth, a max-width main container with responsive padding, bordered Paper-colored panels with consistent spacing and radius, and safeguards like overflow-wrap and min-width:0 so long names don't break the layout. I'm also designing the expense row as a grid that holds the details, amount, and remove button, wrapping gracefully on narrow screens, and building the heading hierarchy—an h1 wordmark in Fraunces with a decorative rule, h2 section headers, and a supporting subline describing the app's purpose.

For money display I'm using Intl.NumberFormat for CAD currency formatting, with a minus sign prefix for negative balances. I'm also planning form error handling—showing one message near the action button with aria-invalid set on the relevant field, specific error text for duplicate or empty person names, clearing errors on input, and refocusing after successful submission with a max length on the name field. Then I'm starting to work out how balances are computed by mapping each person's name to a running cents total.

I'm working out the fair-share split logic by dividing cents evenly among selected people and distributing any remainder to the first few. Writing render functions for people, form controls, balances, settlements, and expenses, with a renderAll that calls them together, plus logic to preserve the select dropdown's value across rerenders. I'm also setting character limits for expense descriptions and planning the CSS—restricting font sizes to a fixed scale, using 16px inputs to avoid iOS zoom, and keeping heights as multiples of 8.

Now I'm defining section headings for People, Add an expense, Balances, Settle up, and Expenses, along with empty-state messaging for balances when there are no people or no expenses yet. Writing the h() DOM helper function to build elements with attributes, event listeners, and children, then using data attributes to store signed cent values for balances and structuring each expense list item with description and metadata.

Adding amount styling in the Harbour typeface and a hint line below the amount field noting the currency and decimal precision, linked via aria-describedby for accessibility.

