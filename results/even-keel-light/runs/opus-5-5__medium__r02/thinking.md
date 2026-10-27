I'm planning the overall design direction—harbour navy and signal red-orange as the palette, pairing a soft serif display font with a clean sans body and tabular figures for a steady, honest feel.

I want to avoid alarming red for normal debt balances, instead using neutral navy/teal language like "Owes $x" and "Is owed $x," reserving signal red for primary actions and a darker variant for errors. I'm checking contrast ratios to make sure the error color stays accessible against white and cream backgrounds.

For layout, I'm planning a two-column desktop view with forms on the left and balances/settle-up/expenses on the right, collapsing to stacked on mobile, with a greedy settle-up algorithm that minimizes transfers to at most n-1, and splitting amounts by rounding to cents.

Now I'm thinking through amount parsing — using a text input with decimal inputmode so I preserve exactly what the user typed, validating with a regex that allows optional leading digits and up to two decimal places, requiring a positive nonzero value, and converting the validated string into integer cents by splitting on the decimal point.

For splitting leftover cents across people, I'll distribute the remainder one cent at a time to the first people in trip order. Expenses store the split as an array of names plus the amount in cents, with each person's share computed at render time rather than stored. I'll skip supporting person removal to keep things simple, but will add a "start a new trip" reset button guarded by a confirm dialog. For the payer select, I'm leaning toward defaulting to the first person rather than a blank placeholder, since that's likely safer for how tests will interact with it.

Split checkboxes default to all checked, including for newly added people, and reset back to all checked after an expense is submitted. For error messages, I'm using a hidden paragraph per form that gets the hidden attribute removed and a test id added only when an error needs to show, and I'll make sure errors clear out again on a successful submit.

For expense validation I need to check description, amount, payer, and that at least one split exists, surfacing the first error with aria-invalid and focus while preserving typed values. I'll wrap everything in proper forms so Enter submits, and each expense list item will show the description, amount, payer, and the split participants, with newest entries listed first and a labeled remove button.

After deletion I'll move focus to a sensible spot like the next delete button or the list heading. For balances I'm adding a data-testid row per person with name and cents, phrasing it as "is owed" or "owes" with a sign, plus a nice horizontal bar visualization centered at zero to show the balance direction, and settle-up suggestions phrased as "X pays Y $amount" with friendly empty-state messaging. I'll also include a trip summary with total spent and expense count, and set the data attributes programmatically.

I'm planning safe text rendering (textContent, not innerHTML), persistence via a versioned localStorage key wrapped in try/catch, and currency formatting using Intl.NumberFormat for CAD. For the 360px layout I'm making sure inputs stay full-width with wrapping for long names, adding clear focus-visible outlines with accent colors matching the brand palette, styling checkboxes as pill-style labels with accent-color, and double-checking text contrast ratios for muted text on the cream background.

Now I'm settling on the final color palette — navy harbour tones, a signal red-orange, sand and paper backgrounds, muted ink and line colors, plus distinct colors for "owed" versus "owes" states — and sketching the header design with a navy band, a Fraunces wordmark "Even Keel," a small keel-line mark, and a tagline about splitting trip costs fairly.

I'm laying out the app structure into numbered sections — People, Expenses, Settle up — with a two-column grid on desktop that collapses into a sensible mobile order, and deciding that the expense form stays enabled even without people, just validating and showing a helpful message if someone tries to submit without adding anyone first. For the people list, I'm planning each entry as a chip or list item showing the name and maybe an initial avatar.

Now I'm moving into the actual state and calculation logic: storing people and expenses in a simple object keyed by name, writing a function to compute each person's share of an expense by splitting cents evenly with remainders distributed, then tallying overall balances by adding what each payer contributed and subtracting what each participant owes. Finally I'm working out the settle-up algorithm — sorting people into creditors and debtors, then using a two-pointer approach to match the smallest amounts between them and generate a minimal set of "who pays whom" transactions.

I'm also planning the render functions for people, payer selection, split checkboxes, expense list, balances, and settle-up summary, making sure split checkboxes preserve their checked state across re-renders while defaulting new people to checked, and adding simple "select all / clear" toggle buttons for convenience. I'm also deciding to format the amount input with a dollar prefix and currency suffix, and drafting friendly error message wording for invalid inputs.

I'm working out the amount-parsing logic: trimming whitespace and currency symbols, then validating with a regex that distinguishes too-many-decimal-places errors from generally malformed numbers, and writing a distinct message for negative amounts.

For deleting expenses, I'll add a brief "Removed" status with an Undo button rather than a blocking confirmation, and similarly use a live status region when adding people for accessibility. I'm also planning a confirm-guarded "Start a new trip" reset button, then moving into CSS choices like pairing Fraunces for headings with Public Sans for body text.

Now I'm laying out the balance row visually as a name/bar/amount grid that stacks on mobile, with the bar filling from a center line based on the amount's proportion of the max. Building the HTML structure...

Still writing layout markup...

I'm deciding to keep the person chips simple with just an initial, since the balances section already shows who paid what. For the expense form, I'm planning fields for description, amount with a dollar prefix, a payer dropdown, and a "Split between" fieldset with a toggle and checkboxes.

I'm adding hint text explaining equal splits and leftover cents, error messaging tied via aria-describedby, and an empty-state message when no people exist yet. The payer select gets a disabled placeholder option when the list is empty. Now I'm starting the JavaScript, setting up storage keys, currency formatting helpers, and a DOM lookup shortcut before writing the load function.

Writing persistence logic...

Rendering newest expenses first with success handling that clears description and amount but preserves payer selection, then focuses the description field. I'm also setting up error display and clearing helpers that manage ARIA attributes and focus for invalid fields, including special handling to focus the first checkbox when the split fieldset is invalid, then moving into building each expense list item showing who paid and how the amount was split.

Each expense item also shows the per-person share amount alongside a delete button, and deletion includes undo support that tracks the last removed expense and its index with a status area for the undo action, plus careful focus management afterward. I'm rendering balances as a list showing each person's name, whether they're owed, owe, or are even, along with a visual bar and a breakdown of what they paid versus their fair share for transparency.

Now I'm planning the settlement list showing who pays whom and how much, plus a summary bar with trip totals, a reset button with a confirmation dialog, and a thoughtful framing message around balances to keep the tone warm rather than accusatory. Moving into CSS now, I'm setting up the sand and navy color palette with a masthead and a subtle waterline design element at the bottom.

Writing layout styles...

Fill direction mirrors the sign: owed extends right in tide, owes extends left in harbour, with matching text colors and a muted even state. I'm planning a responsive two-column layout at wider breakpoints, list items that wrap amount and delete controls onto a second row on narrow screens, a small ghost "Remove" button, and making sure the amount input retains typed text even on validation errors.

I'm using Intl.ListFormat for natural phrasing, building a share description that shows "$X each" when splits are equal or "$X or $Y each" when uneven, generating checkbox chips for each participant with a toggle button that switches between "Select everyone" and "Clear all," and sketching out a summary element plus a simple circular brand mark SVG.

Writing SVG code...

Now I'm checking the contrast ratio of the accent red against the navy background to make sure the graphic signal remains legible.

For the status bar, I'm deciding to make the undo toast persist until the user takes another action or dismisses it explicitly, rather than auto-hiding, since auto-hiding interactive content like an Undo button creates an accessibility timing issue. I'll include a visible "Dismiss" button alongside it, and keep separate visually-hidden live regions for announcing additions.

Now I'm writing the amount-parsing helper, validating that the input is a proper positive number and returning friendly error messages for empty or negative entries...

Capping at $10,000,000 with a clear error message beyond that, I need to be careful with comma stripping so it only treats commas as thousands separators in a strict pattern, not European decimal commas. I also want to handle focus management after re-render by targeting elements by id, and add a heading tabindex for accessibility. For the settle-up row, I'll show a "Ben pays Ana" style arrow with the amount and a note about how many transfers are needed to settle everyone.

