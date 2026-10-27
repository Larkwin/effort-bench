I'm planning the visual design: a warm off-white paper background with ink-colored text, harbour navy and signal orange as accent colors used sparingly, keeping in mind that owing money should be framed as normal rather than alarming so negative balances shouldn't use harsh warning colors.

I'm checking contrast ratios manually for the signal orange against the paper background to make sure text stays accessible, confirming it barely clears AA standards for normal text and comfortably works as white-on-signal for buttons.

Now I'm thinking through typography choices—weighing editorial serifs like Fraunces or Newsreader for headings against something steadier and more trustworthy like Public Sans or IBM Plex Sans for body text, with tabular figures for numbers to keep financial data readable.

I also like the idea of a "balance" visualization: a horizontal bar centered on a zero line, where each person's balance extends left or right from center depending on whether they owe or are owed—a nice nautical "even keel" motif that fits the brand.

For layout, I'm thinking a header with wordmark and small logo, then a two-column desktop layout (people/add-expense on the left, balances/settle-up/expenses on the right) collapsing to a single column on mobile. I'm also considering adding an optional "clear trip" reset button with a confirm dialog, though I'm weighing whether that's worth the complexity.

I've decided against allowing people removal since the spec just says to list everyone. For data, I'm settling on a state shape with people (id, name) and expenses (id, description, cents, payer, split, timestamp), keyed by name since they're unique, with leftover cent distribution following the order people were added.

For amount parsing, I want to strip dollar signs and commas then validate with a regex allowing up to two decimal places, computing cents from integer parts to avoid float errors, requiring values greater than zero and capping at a reasonable max like $1,000,000.

I'll use a text input with decimal inputmode for the amount field so I control validation fully rather than relying on native number input quirks. Validation errors should only render (with their test id) when actually shown, toggling a hidden attribute rather than always being in the DOM.

Required fields are description, a valid amount, a payer, and at least one split participant, plus checking that people exist before allowing an expense at all -- if not, I'll show an inline message rather than disabling buttons, so they stay focusable. On error I'll leave the user's input intact; on success I'll clear description and amount, keep the payer, reset the split to everyone selected, and refocus the description field.

New people added later should default to checked in the split, so I'll track unchecked names in a set rather than checked ones, re-rendering checkboxes and the payer select while preserving current state, and add quick "All/None" toggles. For settling up, I'll use a greedy algorithm matching the largest debtor to largest creditor each round, sorted deterministically, guaranteeing at most n-1 transfers, and I'll keep the expense list in insertion order internally but render it newest-first.

For each expense row I'll show description, payer, and the split names (listing everyone explicitly rather than just saying "everyone"), plus the per-person share amount, rounding evenly or showing a range like "$33.33–$33.34 each" when it doesn't divide evenly. Deletion needs a labeled remove button with proper aria text, focus moved sensibly afterward, and I'm considering a lightweight undo toast in a status region.

I also need to handle validation (duplicate or empty names, max length 40), safely build DOM nodes to avoid XSS, persist state to localStorage with a versioned key and try/catch, format currency using Intl.NumberFormat for CAD, and make sure accessibility basics are covered — visible labels, fieldset/legend grouping, visible focus outlines, and a polite live region for announcements.

Now I'm thinking through error messaging tied via aria-describedby/aria-invalid, a header summary showing trip totals, and writing clear empty-state copy for the people, expenses, balances, and settle-up sections depending on whether data exists yet. I'm also planning the balance visualization as rows with a name, a centered bar track, and an amount, where bar width scales with the balance magnitude.

Now I'm deciding on color roles: owed amounts get a harbour-blue bar to the right, owed-to-others get a warm sand tone to the left, keeping the framing neutral rather than alarming. Signal color stays reserved for primary buttons, focus rings, and brand accents, while harbour blue becomes the main action color — checking contrast ratios to make sure buttons and focus states remain accessible against their backgrounds.

For settling up, I'm adding a "Record as paid" action that creates a special payment-type expense (Ben paid Ana directly), which shifts balances correctly while being excluded from trip totals and displayed distinctly in the list.

For the dark Settle Up card, I'm adjusting accent colors to lighter tones for sufficient contrast, and planning the overall layout as a responsive grid—two columns above 900px with People/Add expense on the left and Settle up/Balances/Expenses on the right, collapsing to a natural stacked order on mobile.

I'm also defining the typography scale (Newsreader for headings, Plex Sans for body) and setting up a color palette with paper, surface, ink, and harbour tones, while making sure narrow screens avoid horizontal overflow through flexible widths and word wrapping.

Checking contrast ratios for muted text, lines, signal, and owe colors against the surface background, making sure graphical bars and text both meet accessibility minimums, then sketching a simple circle-with-a-keel-line logo concept.

For layout, I'm planning the header with wordmark and trip stat chips, then the expense form fields: description, amount with dollar prefix, payer dropdown, split checkboxes with select all/none, and an add-expense button, considering how description and amount might sit side by side in the narrower column.

I'm styling the split checkboxes as accessible native checkboxes dressed up as chips with harbour-colored accents and a checked-state style via the :has selector, defaulting the payer dropdown to the first person, and now working out the share-splitting logic that divides cents evenly among selected people and distributes any remainder.

Now I'm thinking through validation messages for the expense form — checking that split names stay valid, and writing clear, friendly error text for missing people, empty descriptions, missing amounts, and invalid or zero amounts, each paired with proper aria-invalid focus handling.

I'm continuing to spell out the remaining errors (amount too large, no payer chosen, no split selected), and deciding when these messages should clear — likely on successful submission rather than every keystroke, so the message stays visible until the user tries again, while still testing that invalid input triggers the right error on submit.

For the person-add form, I'm planning to clear the input and refocus it after adding someone, plus announce the addition via a live region for accessibility. For the people list, I'm debating whether each person's list item should show just their name or also an avatar and balance, and worrying about how strict tests might be about matching exact text content.

I realize that if tests check exact text, adding an avatar initial as visible text could break things — so I'm leaning toward using a CSS ::before trick with an empty span and a data-initial attribute, since generated content via CSS isn't included in textContent, keeping the actual accessible text clean while still showing the avatar visually.

For the undo flow, I'm planning to store the last removed expense with its index so it can be restored, and show a toast-style status message like "Removed "Dinner"." with an Undo button, using a persistent live region instead of an auto-hiding one to avoid accessibility issues with timed disappearance.

For focus management after a delete, I'll move focus to the Undo button itself rather than the heading, since it's the natural next action for the user.

For recording a payment, clicking "Mark paid" on a transfer row will create a special payment-type expense entry linking the payer and recipient, which then shows up in the expense list.

Now I'm planning the footer: a "Start a new trip" button with a confirmation dialog warning it clears everything, plus a small "Saved on this device only" notice. For the balance display, each person gets a row showing their name, a status ("is owed", "owes", or "is all square"), their paid/share breakdown, and a visual bar where the width is proportional to their balance relative to the largest balance in the group, split left/right from a centerline for negative/positive amounts.

I'm also sketching the settle-up section — showing who pays whom and how much, with calm, friendly phrasing like "3 payments settle everything," plus empty states for when there's only one person or no expenses yet. The header's trip total should sum only real expenses, excluding payment records. Now I'm starting to write the HTML document structure with the page title and viewport meta tags.

Writing font links and CSS variables...

I'll keep the header on paper with a waterline divider — a thin harbour line with a signal marker — and make the settle-up card the dark harbour focal point. For accessibility I'm adjusting focus outlines to use a lighter signal tone inside dark cards for contrast, then defining button styles (solid harbour primary, quiet underline, muted remove-button) and input borders.

I'm checking contrast ratios for field borders, styling the amount field with a prefixed dollar sign, custom-styling the select chevron, and working out error message colors to ensure the signal-ink text passes contrast against its tinted background.

That contrast checks out fine, sand-ink on card is well above threshold too. Now I'm moving into the JavaScript implementation, setting up state management with localStorage persistence, currency formatting, and tracking for split-off items and removal history.

I'm adding validation logic for loading saved data, checking that people have valid id/name pairs and expenses have proper cents, payer, and split info, plus a safe save function and a unique ID generator. Then I'm sketching out the render functions—people list, expense form with payer select and split checkboxes, expenses list, balances, settle-up view, and stats—all tied together through a single render() call, while being careful to preserve input focus across re-renders.

Now I'm working out the balance computation (tracking paid vs owed per person) and a greedy settle-up algorithm that matches debtors to creditors by amount to minimize the number of transfers needed.

Writing the amount parser...

I need to only strip commas when they match proper thousands-grouping format, otherwise something like "12,5" would silently misparse. I should also reject negative amounts explicitly with a clear "enter a positive amount" message rather than letting it fall through to a generic format error.

For the name field, I'll trim and collapse internal whitespace so extra spaces don't create false duplicates, and handle empty input with a prompt to type a name, plus a friendly duplicate-name message suggesting a last initial to disambiguate.

For the expense list markup, each item shows description, payer and split members, a per-person share line, the total amount, and a remove button; settle-up payments get their own simplified layout showing who paid whom with a badge, and I'm handling the split display logic for when it matches everyone on the trip versus a subset.

For naming people in the split text, I'll use Intl.ListFormat for natural "Ana, Ben and Cy" phrasing with a manual join as fallback. For the per-person share amount, I'm splitting into whole cents so if there's a remainder I show both values like "$11.67 or $11.66 each," with special wording for single-person splits. I'm also considering whether to show a small creation date on each entry.

Now I'm structuring the balance list items — each shows a name, an "is owed" or similar status with the amount, a two-sided bar visualizing their position, and a detail line like "Paid $50.00 · Their share $38.00." I also want an "Expenses (3)" style count heading above the list.

For the Settle up section, I'm adding a heading and subtitle like "N payments and everyone's even," plus transfer rows showing who pays whom with the amount and a "Mark paid" button (with an accessible label like "Mark paid: Ben pays Ana $12.00"). I'm thinking through a grid layout so names and amounts align cleanly even when wrapped on mobile.

For the header stats, I'm using a definition list showing trip total, people count, and expenses count, with a hint below the form explaining that shares split to the cent and leftover cents go to whoever joined first. I'm also planning "Select all"/"Clear" buttons for the split checkboxes, with a change listener using event delegation.

I'm rendering each person as a chip with a checkbox, handling the payer select to preserve the current value or fall back to the first person (disabling it with a placeholder if no people exist), adding an empty-state message when no one can be split with, and building an undo mechanism for removed expenses that reinserts them at their original index, clearing the undo notice whenever a new expense or person is added.

Now I'm adding a clear-trip button that resets state and focus, a live region for screen reader announcements, and helper functions to show and clear validation errors with an alert role so they're announced automatically.

I'm linking inputs to their hints and errors via aria-describedby and aria-invalid, then designing a small harbour-themed logo icon—a rounded dark square with a horizontal line and a small circle to evoke a level bubble.

For the layout below the header, I'm keeping a simple thin divider rather than anything decorative, then planning section cards with 1px borders, 16px radius, consistent padding, and Newsreader headings alongside a count. I'm also considering small "Step" eyebrow labels above section titles like "Who's on the trip" and "Log an expense" to guide users through the flow.

Writing CSS reset and base styles...

Still writing styles...

Styling form fields with hover states and invalid input indicators using a red outline...

Still writing button and chip styles...

For the expense form, I'm setting up a responsive grid that collapses to one column on narrow screens since two 150px columns won't fit in a 280px card width at 360px viewport, plus a money input wrapper with an absolutely positioned currency symbol.

Now I'm working out the fieldset and legend layout -- since placing a legend inside a flex container behaves oddly, I'm thinking of keeping the legend as a plain block element and putting the split toggles in a separate row below or positioned to align with it on the right.

Styling the checkbox chips...

Now I'm reconsidering focus visibility—since :has() support isn't universal, I should keep the native input focus outline rather than relying on the container, so I'll leave the default focus-visible rule on the input itself. Then I'm building the error message box with an icon and a signal-colored accent border, and starting the expense list grid layout.

Writing balance bar styles...

Styling the dark settle card...

Adding more UI details... undo notice banner, dashed empty-state boxes with a muted title, a simple footer with a "Start a new trip" link, and an sr-only utility class for accessibility.

Now I'm starting the JavaScript module, setting up storage keys, limits for amount and name length, and currency formatting helpers using Intl for CAD values and name lists.

Writing load/save logic...

Writing balance calculation logic...

I realize payments shouldn't just add to "share" since that conflates transfers with expense splitting—I need to track sent/received separately from paid/share so the detail text reads clearly, like "Paid $50.00 · Share $38.00 · Received $12.00", only showing sent/received when nonzero. Now I'm moving on to rendering the people list.

Still writing people list markup...

Then I need to handle the empty-state toggle and pluralize the count label, and start rebuilding the payer dropdown in the form, clearing it and checking if people exist.

I'm planning the expense split checkboxes to show a placeholder when no people exist yet, and ordering rendered expenses newest-first since undo reinsertion preserves original index order. Then I'll wire up the balances, settle-up, and stats renderers, followed by the person-submission event handler.

For the person submit handler, I'm trimming and normalizing whitespace in the entered name, rejecting empty or overly long names, and checking for case-insensitive duplicates to suggest adding a distinguishing initial.

On success, I push the new person, save state, clear errors, reset the input, re-render, and announce the addition for accessibility while keeping focus stable; on failure I show the error, mark the input invalid, and focus it while preserving the typed text.

For the expense form submission, I'm clearing prior errors, checking that at least one person exists before proceeding, then validating the description field for presence and an 80-character limit before moving on to amount validation.

Continuing validation, amount parsing fails back to the field, payer must be one of the existing names, and the split must include at least one selected person in trip order, otherwise each case shows an inline error and focuses the right field. On success I push the new expense record, persist it, reset the description and amount fields, clear the split selection back to everyone by default, hide any undo banner, re-render, and announce the added expense with its amount and payer before returning focus to the description field.

For deleting an expense, I'm wiring a delegated click handler on the list that reads the item's id, finds and splices it out, stores it as the last removed item for undo, saves, re-renders, and shows an undo button announcing what was removed while moving focus there. Undo reverses that by splicing the item back (after confirming its payer and split names still exist), clearing the undo state, re-rendering, and announcing that it was restored.

Marking a transfer as paid works similarly through delegation on the transfer list, reading the from/to/amount data attributes to create a payment-type record, then saving, rendering, announcing it, and moving focus to the settle-up heading. I'm also sketching out the reset flow, which should ask for confirmation before clearing state.

I'm also adding a storage event listener so the UI reloads and re-renders automatically if another tab changes the shared data, plus drafting the lede text that adapts depending on whether there are outstanding transfers, settled expenses, or nothing logged yet, along with copy explaining what the balance numbers mean and labels for buttons and header stats like trip total, people count, and expense count.

I'm working out edge cases like avatar initials from a person's name, making sure the net balance never renders as "-0", computing bar widths as a percentage of the largest absolute balance, and writing the descriptive meta text for expense and payment line items (who paid, who split it, or who paid whom back).

I'm phrasing how each person's share gets displayed — showing "all of it is X's share" when there's just one person, or splitting the remainder evenly with a cent adjustment otherwise. I'm also deciding to skip showing the date in the meta line, then moving on to structuring the final HTML with the main wrapping the full app and testid attribute set.

For labels and accessibility, I'm adding visible labels for name, description, amount (with CAD), payer, and the split section, plus a hint under the amount field describing valid decimal formatting tied in via aria-describedby. I'm also thinking through edge cases for amount validation, like fractional cent inputs that should trigger errors.

I also want to make sure payer selection and split checkboxes work properly when people are added or removed mid-flow, and I'm deciding whether to cap the name and description fields with maxlength so validation errors still fire correctly instead of silently truncating input.

Now I'm building out the main HTML structure: a header with the brand, tagline, and a trip summary stats panel showing totals and people count.

Writing more HTML markup...

Footer text clarifies privacy, data stays local, with a button to start a new trip. Now I'll finalize and write out the complete code.

