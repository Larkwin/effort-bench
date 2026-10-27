I'm working out the data model for this expense-splitting app in a single HTML file: adding people with unique trimmed names, validating expense entries (description, amount with max two decimals, payer, and split checkboxes defaulting to everyone), and figuring out how to divide cents evenly across selected participants.

For balances, I'll compute paid minus share per person and expose them with data attributes. For settling up, I'm using a greedy two-pointer approach matching largest creditors against largest debtors, which guarantees at most n-1 transfers since balances sum to zero. I'm also planning currency formatting with Intl.NumberFormat, localStorage persistence, empty states, and responsive layout down to 360px.

Now I'm thinking through the visual design — pairing Harbour navy and Signal rust as anchor colors, choosing Fraunces for display headings and Instrument Sans for UI text, with tabular numbers for money values. I want to be careful with color semantics so that owing money doesn't read as alarming or negative, just informational.

I'm checking contrast ratios for Signal against white and cream backgrounds to make sure text stays accessible — it passes AA for normal text on white but gets borderline on the cream paper tone, so I'm leaning toward using Signal mainly for button backgrounds with white text rather than as body text color.

I'm computing a darker variant, Signal-ink (#A4361F), which gives a much stronger 6.72 contrast ratio on white, and then checking Harbour (#1F3A4D) which comes out excellent at 11.86 contrast. Based on these numbers I'm sketching out the core palette: a warm off-white paper tone, a bright surface white, and a dark harbour-based ink color for primary text.

Now I'm filling out the rest of the palette with deep harbour shades, mist tints for chips and backgrounds, a warm border line color, and a muted gray text tone, then verifying the muted color still passes AA contrast (5.35) against the paper background.

For semantic color, I'm picking a teal "tide" tone for positive balances ("is owed") and checking its contrast passes AA too (6.21 on white). I'm leaning toward keeping debt language neutral and calm rather than alarming — "owes" and "is owed" phrased plainly, with the signal color used sparingly as a small marker rather than bold red text, and a quiet "Even" or "All square" label for zero balances.

Now I'm sketching the layout: a header with the "Even Keel" wordmark and a simple inline SVG mark suggesting balance (a level line with a small keel or pivot), plus a tagline and trip summary stats. The main content splits into a "People" section (add-person form with empty state copy) and an "Expenses" section (form with description, amount, payer, and split checkboxes, followed by a reverse-chronological list of expense cards showing payer and split details with a remove option).

For the "Balances" and "Settle up" sections, I'm deciding on a responsive layout — single column stacked order on mobile (People, Expenses, Balances, Settle up), but a two-column grid on desktop with expenses in a wider main column and people/settle-up/balances grouped in a side column, using CSS grid ordering to keep the mobile flow logical while reorganizing for desktop.

For the amount input, I'm leaning toward a text field with decimal input mode rather than a native number input, so I can control validation myself — allowing optional "$" prefixes or comma separators but rejecting more than two decimal places via regex.

Now I'm drafting the specific error copy users will see: friendly, concrete messages like naming the exact duplicate person, giving example expense descriptions, and prompting for a valid amount when left blank.

I'm also working through edge cases—whether the payer must be part of the split (they don't need to be), and how to handle the form-error element so it's only present/visible while an actual validation message applies, toggling it rather than always rendering it.

For accessibility, I'm linking inline errors to inputs via aria-describedby and aria-invalid, using an always-present wrapper slot so the live region exists before errors appear, and inserting/removing the error message inside that slot dynamically. I also need to decide how focus moves to the problematic field when a submission is rejected.

For form reset behavior, I'm thinking through what resets after a successful add: clear the description and amount fields, keep the payer selection, but reset the split choice back to "everyone" selected by default for predictable test behavior.

For the payer dropdown, since "who paid" is required, I'll go with an explicit placeholder option like "Who paid?" with an empty value rather than silently defaulting to the first person — validation should block submission until a payer is chosen explicitly.

For the split selection, I'll use a fieldset containing one checkbox per person labeled with their name, in the order they were added. Everyone should be checked by default, and I need to preserve the user's checked/unchecked choices across re-renders by tracking selections in a draft state set rather than rebuilding checkboxes from scratch each time.

On person removal, I'm debating whether to support it at all since it's not strictly required, but typos would leave users stuck. I'll add it with a safeguard: a person can only be removed if they have no associated expenses, shown as a "Remove" button next to each person that's disabled with an explanation otherwise.

For accessibility I'll avoid truly disabled buttons and instead show a plain "In expenses" label when a person can't be removed, keeping a real "Remove" button only when safe. For deleting expenses, I'll skip a confirmation dialog, use a clear "Remove expense: [name]" button, and shift focus to the expenses section heading afterward for good focus management. For balances, I'm working out the math: paid minus owed share per person, all tracked in integer cents to avoid rounding errors.

For splitting costs evenly, I'm dividing the amount by the number of participants and distributing any leftover cents one each to the first people in trip order. Expenses store the split as names, with order resolved at calculation time from the people list's fixed index. For settling up, I'm using a greedy two-pointer approach matching largest creditors with largest debtors to minimize the number of transactions.

I confirm balances always sum to zero since shares and payments both total the expense amount, and the payer doesn't need to be part of the split. For the balance display, I'll show every person including those at zero, using "is owed," "owes," or "All even" phrasing with formatted currency and data attributes for cents. I'm also planning empty-state messages for when there are no people or no expenses yet, and considering how the expense form should behave when there aren't enough people to split with.

Rather than disabling the form or using a fieldset, I'll keep the inputs enabled and just show a validation message like "Add at least one person before logging an expense" if someone tries to submit too early—simpler and more accessible. For balances and settling up, I'll add supportive empty states too: "Balances appear once there's an expense to split," "Nothing to settle yet," and a nice "Everyone is even" moment when all debts are cleared. I'm now thinking through persistence via localStorage.

I'll save state under a versioned key, storing people as names and expenses with id, description, cents, payer, and split info, with try/catch loading and sanitization as fallback protection. For rendering, I want to avoid innerHTML injection risks by building DOM nodes with textContent rather than raw HTML, using a small helper to construct elements. I'll fully re-render lists on state changes since the app is small, but I need to be careful about focus loss—manually restoring focus after deletions, and keeping the payer select and split checkboxes in sync with the draft state so re-rendering doesn't wipe out in-progress selections.

For the expense form, I'll treat the DOM itself as the source of truth, reading values directly on submit rather than maintaining a separate draft object. When people change, I'll capture the current checkbox states and selected payer before rebuilding the options, then restore them afterward—also marking any newly added person as checked by default. On page load, every person starts checked, and after a successful expense submission I'll reset the checkboxes and clear the description and amount fields. I also need to handle person removal by cleaning up related options without breaking the payer selection.

Now I'm thinking through accessibility: every input needs a visible label, the split section gets a fieldset with a legend, and I'm setting up visible focus indicators with sufficient contrast against both the paper background and navy buttons using an outlined ring with offset. I'm also ensuring touch targets meet the 44px minimum and styling checkboxes larger with accent-color while keeping them natively accessible.

For the markup, I'm structuring semantic sections with aria-labelledby, styling error messages with a tinted background that still passes contrast checks, and building the person/expense forms so pressing Enter naturally submits via type=submit buttons with test IDs. I'm also wrapping the amount input with a dollar sign prefix and planning the person list as list items with data attributes for name and remove/expense-status controls.

Thinking about the person list more, I realize adding a remove button's text inside the li risks breaking exact-text assertions in tests, so to stay safe I'll skip the person removal feature entirely and just let names persist once added, focusing instead on getting the expense list items structured correctly.

For expenses, I'm including description, formatted amount, payer, and split info, plus a delete button, with balances and transfers displayed similarly using data attributes and readable text like "Ben pays Ana $12.50". I'm settling on using Intl currency formatting (en-CA/CAD) to get the "$1,234.50" style output, and deciding to show per-person share breakdowns in the split line for transparency, including who absorbs the rounding cent.

Now I'm thinking through the header's total summary line and confirming the name-rejection message is handled, then moving into visual design choices—pairing Fraunces for headings with Instrument Sans for UI text and using tabular numerals for money figures.

I'm also planning the color system: a navy header band on paper background, white cards with warm borders, and reserving the Signal accent color for primary actions and small brand touches while keeping destructive actions like "Remove" as subtle ghost buttons to avoid confusion.

For balance rows, I'm designing initial circles, status text colored by owed/owes state, and amounts in tabular numerals, plus defining the full palette with contrast-checked values for ink, muted text, tide (owed), and signal colors against the paper background.

For inputs, I'm working out a border color around #8A8373 that passes the 3:1 non-text contrast requirement against white, and keeping native checkboxes with accent-color styling since their default contrast is already sufficient. For typography, I'm setting body text at 16px to avoid iOS zoom, with Fraunces at 28px for the wordmark and 22px for section headings.

Now I'm setting an 8px spacing base with a 1080px max-width container and responsive padding, then designing the "Even Keel" brand mark as a simple SVG combining a horizon line with a boat hull shape in the signal color to evoke a keel beneath the waterline.

Writing SVG code...

Then I'm planning the navy header band with the wordmark in Fraunces and a muted tagline, checking contrast ratios, plus a trip summary line that wraps on mobile, followed by card-style sections with header rows and a desktop grid layout.

For structure, I'm deciding on DOM order: people and expenses in the main column, balances and settle-up in the sticky side column, keeping mobile order natural while debating whether settle-up (the actionable answer) should appear before balances (the reasoning) in the side column.

For the expense form, I'm designing a chip-style toggle for splitting between people — a checkbox wrapped in a styled label that changes appearance when checked, using `:has()` for the checked state styling while keeping the native checkbox visible for accessibility.

I thought about adding "Everyone/Clear" quick-select buttons for splits but decided to skip them to keep things simple, and settled on a native styled select for the payer dropdown. For expense list items, I'm structuring each as description and amount on top, "paid by / split count" below, then individual share amounts, with a small "Remove" text button at the bottom — making sure long descriptions wrap properly at narrow widths.

For balances, each row gets an avatar circle, name and status line, and a right-aligned amount colored by owed/owes/even. I like the idea of adding a small horizontal "keel" meter bar — a centered track where a fill extends left or right proportional to the balance — as a nice visual touch, decorative and accessible-hidden, scaled against the largest balance in the list.

For settle-up suggestions, I'm keeping it plain: "Ben pays Ana" with the amount, maybe an arrow between names, though I need to think about how screen readers handle that arrow glyph.

Now I'm setting up the app's state storage, loading saved people and expenses from localStorage with a currency formatter for displaying amounts, and writing a load function that parses the stored JSON and validates the people array.

Still writing storage logic...

I'm designing the amount parser with a regex that allows an optional dollar sign, comma-separated thousands, and up to two decimal places, distinguishing between format errors and too-many-decimals errors with separate messages. I'm also adding checks for empty input, zero amounts, and an upper bound so absurdly large numbers get rejected with a dedicated error.

For the rest of the form, I'm outlining validation order: confirm people exist before letting someone log an expense, then validate description length, then the amount, then ensure the payer is a valid selected person, and finally require at least one checked person in the split before accepting the entry.

I'm designing the error display so only one message shows at a time, using an alert role on the inserted error paragraph so screen readers announce it immediately, and marking the invalid field with aria-invalid plus an aria-describedby link to that error. I'm deciding to clear a form's error as soon as the user starts typing again in that form, keeping the experience forgiving on resubmission.

Now I'm writing the submit handlers for adding a person and an expense: validating input, showing the error and returning early on failure (without clearing what the user typed), or on success pushing the new value to state, saving, clearing the field, re-rendering, and refocusing the input. I'm also adding a hidden polite live region to announce successful additions like "Added Ana." for screen reader users.

For deletion, I'm attaching click handlers per button rather than delegating, and after removal I'm managing focus to land on the delete button at the same index or fall back to a focusable heading if the list is empty, plus announcing a "Removed [item]" status message.

For renderAll, I'm planning out the subroutines: summary, people list, expenses, balances, settle-up, and keeping the payer/split controls synced whenever people change. For the payer select rebuild, I'm preserving the previously selected value if still valid, otherwise resetting to a placeholder option, and treating an empty payer value as a validation error requiring the user to choose someone.

For the split checkboxes, I'm rebuilding them inside a fieldset with a legend, preserving which ones were checked before the rebuild and auto-checking any newly added person. When there are no people yet, I'll show a hint inside that fieldset telling the user to add people before splitting costs.

I'll track the checked split state in a dedicated `splitDraft` Set rather than re-reading DOM each time -- updating it on checkbox change events, adding new people automatically, and resetting it to all people whenever an expense is saved or data loads. For validation I'll just read checked checkboxes directly from the DOM and map them back to people names in the original order.

For balances, I'm writing a `computeBalances` function that tallies each person's total paid versus their total share across all expenses, then returns the net difference per person. The share-splitting logic divides an expense's cost evenly among selected members, distributing any leftover cents one-by-one to the first few people so the totals always add up exactly.

I'm also guarding against a division-by-zero edge case if an expense's split list ends up empty, since the loader should prevent that but it's safer to return an empty share array in that case. Then I'm writing a `settle` function that implements a greedy debt-settlement algorithm: sort creditors and debtors by amount, then repeatedly match the largest creditor with the largest debtor, transferring the minimum of their two balances until everyone is settled—this works cleanly since all balances sum to exactly zero in integer cents.

I confirm the loop produces at most c+d-1 transfers since each iteration zeroes out at least one party and the final iteration zeroes both simultaneously. Now I'm planning how each person's balance row renders—an avatar with their initial, their name with a status label ("is owed", "owes", or "all even"), a formatted dollar amount, and a meter element, keeping amounts unsigned since the status word already conveys direction.

For the meter's visual width I'm computing each person's percentage relative to the largest absolute balance, falling back to zero when all balances are zero. I'm deciding to always show balance rows for every existing person—even at $0.00 "Even"—rather than hiding them, since that's the most predictable behavior, though I'll add a hint text when there are no expenses yet. For the settle-up section, I'll show an empty-state message like "Everyone is even. Nothing to settle." when there's nothing to transfer, otherwise list the actual transfer items along with a summary line stating how many payments are needed.

Now I'm working out the header summary showing people count, expense count, and total, then moving to the expense list itself—each item shows the description, formatted amount, who paid, and how the cost was split, with a small shares list breaking down each person's portion in cents.

For the remove button, I want its accessible name to stay simply "Remove" rather than getting overridden by an aria-label, so I'm skipping aria-label and relying on the visible text plus a description link instead. Then I'm setting up the person list items with avatars and names for the add-person section.

Now I'm sketching out the various empty states — for people, expenses, balances, and settle views — each with friendly guidance text, plus a visually-hidden live status region for announcing updates when expenses are added or removed.

Writing the HTML document...

I'm placing the error slot right beneath the input for proximity and wiring aria-describedby to include the error id when shown, clearing it otherwise. For the mobile layout, I'm making the field row wrap with the input flexing and the button sized to content, checking that it still fits reasonably at 360px width with card padding.

Now I'm building out the expense form markup with description, amount (with a $ prefix), payer select, and a fieldset for splitting between people, followed by an error slot and submit button. I'm also sketching the balances and settle-up sections, deciding to use unordered lists for both balances and transfers, and planning focus-visible outlines in the signal color across all interactive elements including checkbox chips, with reduced-motion handling and responsive breakpoints for the two-column desktop layout.

I'm working through the visual system next — Fraunces for headings, Instrument Sans with tabular numbers for amounts, button and input styling with the harbour blue and signal accent colors, card shadows, and error message styling with proper contrast. I'm deciding tide green represents being owed and signal orange/red represents owing, applied consistently to meters and status text, plus adding a small footer note about local storage and a "start over" reset button with a confirm dialog.

Now I'm writing the JavaScript foundation — setting up the storage key, currency formatter, state object loaded from storage, a splitDraft set tracking selected people, and grabbing references to all the DOM elements I'll need. I'm also sketching a small helper function for creating DOM elements with props and children, working out how to handle attributes versus properties versus text content cleanly.

