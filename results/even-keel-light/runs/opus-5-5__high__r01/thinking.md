I'm planning the color palette, picking a warm off-white paper background with navy and signal-red accents, and checking the contrast ratios to ensure text stays readable.

For meaning, I want to avoid treating debt as alarming — owed vs owes should use neutral, non-red colours like harbour teal and muted amber, reserving the signal red for primary buttons and errors, though I'm wary that overlapping red for both actions and errors could be confusing.

Now I'm weighing typefaces: something honest and steady rather than quirky, leaning toward Source Serif 4 for headings paired with Public Sans for UI text.

For layout, I'm planning a header with a simple keel-line brand mark, then a two-column desktop grid (people/add-expense on the left, balances/settle-up/expenses on the right) that stacks on mobile. I like the idea of a centered "keel line" balance bar extending left for debts and right for credits as a signature visual touch, kept accessible with accompanying text.

For state, I'm structuring people and expenses as simple objects, using names as identifiers since they're unique, to keep the data model lightweight.

Shares get computed by sorting split participants in trip order, taking the floor division of cents by count, then distributing the remainder cents one each to the first people in that order. I'm debating whether to allow removing a person from the trip — deciding to permit it only when they're not involved in any expense, keeping the feature simple but still useful.

For amount validation, I want to trim the string and use a regex allowing optional decimals, but I'm wary of accepting comma-separated inputs since that could misinterpret European decimal formats like "1,5" — so I'll only strip a leading dollar sign and accept commas strictly as thousands separators, using a text input with decimal inputmode so I can control validation myself.

I'll go with a text input type so invalid strings like "abc" are properly rejected, then compute cents using integer arithmetic on the parsed whole and fractional parts to avoid floating-point errors. I'm also considering capping the maximum accepted amount, maybe around $10,000,000, to guard against absurdly large or overflowing values while not interfering with normal test cases.

For expense validation, I need at least one person added, a payer selected, and at least one split chosen before submission is allowed. Inline errors should use a `form-error` test id and only appear in the DOM when there's an actual error — I'll create and remove the error elements dynamically rather than just toggling visibility, support multiple per-field errors with proper aria attributes, and focus the first invalid field when validation fails.

I'm also weighing whether to disable buttons when there are no people yet versus just validating on click — I'll keep the form visible with a placeholder payer select and a "no one yet" message for splits, and decide whether the payer defaults to the first person or starts unselected so submission without a chosen payer correctly triggers a validation error.

After adding an expense, I'll reset the description and amount but keep the payer selected, since resetting to placeholder every time seems less useful. For split selection, I'll default new people to checked, preserve existing checked states on re-render, add "Everyone"/"No one" toggle buttons, and reset to all-checked after submitting an expense—while making sure form inputs themselves aren't wiped out by re-renders except for the payer options and checkboxes.

For settling up, I'll use a greedy algorithm matching the largest debtor against the largest creditor each round, which guarantees at most n-1 transfers and stays deterministic by using trip order for tie-breaking. Balances will be tracked as signed integer cents per person, displaying zero as "0", and expenses will render newest-first by storing them in add order and reversing for display. Since Playwright auto-dismisses confirm dialogs as cancel, I'll avoid confirmation prompts for deletion and instead implement an undo toast with a live region announcing the removal and an undo button.

After deleting an expense, I'll move focus to the next delete button or back to the list heading. I'll persist data to localStorage under a versioned key with try/catch error handling and validation on load, and include a "Clear trip" reset option in the footer -- using confirm is harmless since dismissal just cancels the action. For accessibility I'm adding visible labels, a fieldset legend for the split section, a live region for status messages, and focus-visible outlines meeting contrast requirements. Money will be formatted using Intl's en-CA CAD formatter, showing negatives with a minus sign before the dollar amount.

Now I'm working out balance phrasing like "Ana is owed $40.00" or "owes $20.00" or "is even," with a bar visualizing the proportion relative to the largest balance. The header will show a trip summary like total spend and expense count. I'm skipping an editable trip name to keep things simple, and writing calm, plain-voice empty states for the people, expenses, and balances sections, including a friendly message when everyone's settled up.

For expense items, I want to show who paid, who it's split between, and per-person shares—handling remainders gracefully like "$13.33–$13.34 each." I'm also planning for responsive layout down to 360px wide, handling long names with overflow wrapping and a length cap, and now moving into defining the color palette for the CSS, including harbour blues, a signal red, and paper/surface neutrals.

I'm working out contrast ratios for card surfaces, muted text, and lines, then deciding how to visually distinguish "owed" versus "owes" amounts—leaning toward a teal harbour tone for amounts owed and a warm ochre/sand tone for amounts owed by the user, avoiding red since owing isn't inherently negative.

For errors I want a soft background with a signal-colored left rule rather than harsh red text. The header could use a deep navy band with a simple nautical brand mark—a hull silhouette with a waterline accent—paired with Source Serif for headings, Public Sans for body text, and tabular numerals for monetary figures.

For sections, I'll label them with step numbers like "1 People", "2 Expenses", "3 Settle up" to suggest a flow, using a two-column desktop layout with people and expense entry on the left and balances plus the expense list on the right. Now I'm setting up the storage and state management code, defining currency formatting and a load function that reads from localStorage.

Writing save and sanitize functions...

Still writing settle logic...

I should also normalize names by trimming and comparing case-insensitively, keeping the matching logic consistent with how names are stored.

I need to be careful about where "person" test id lives — if I nest a remove button and stats inside the list item, the text content check could pick up extra words, so the name itself probably needs its own dedicated element with clean text.

Since Playwright's toHaveText does an exact match on strings rather than substring, I'll put the testid on a span wrapping just the name, keeping remove buttons separate. For expenses I'll use a simpler approach — testid on the li itself since tests likely use toContainText there — and apply the same pattern for balance and transfer elements.

The avatar circle with initials sits inside the li but outside the name span, marked aria-hidden. The remove button only appears if the person isn't part of any expense, showing an accessible "Remove Ana" label; otherwise I'll show something like "In 3 expenses" instead.

Writing expense form markup...

Placeholder text is fine alongside a visible label as long as contrast holds up, so I'm checking the placeholder color meets accessibility thresholds, then moving to the split tools buttons for selecting everyone or no one.

I'm adding a live share preview beneath the split controls that computes each person's amount, and writing a helper function that renders error messages into designated slots while marking inputs as invalid via ARIA attributes.

Now I'm drafting the specific validation messages for the person and expense forms — covering empty names, duplicates, missing descriptions, invalid amounts, and formatting rules like decimal limits.

Writing amount parser logic...

Now I'm sketching the expense list item markup with description, amount, and payer details.

Each balance item should show name, status like "is owed $40.00" or "owes $20.00", plus paid/share amounts. I'll render balances for everyone even with no expenses, showing a zero-state note instead. For settlements, I'll list transfers like "Ben pays Ana $20.00" with an "everyone's even" message when there's nothing to settle.

I like the idea of adding a "Mark paid" button that records the settlement as its own expense (payer pays the recipient back), tagged as a settlement kind so it's distinguishable from regular expenses — it's a nice feature but low risk since tests likely won't click it.

I'm also planning an undo mechanism for deletes using a toast with a status role and aria-live, keeping the last-removed expense around until the next action clears it. After deleting, focus should move to the next or previous delete button, falling back to the expenses heading. The header should show a summary line with trip total, people count, and expense count, excluding settlements from the total.

Then I'm structuring the render pipeline to update people, form options, expenses, balances, and summary before saving, while tracking a set of checked names for the split selection so it persists correctly across add/reset actions. I'm also handling the payer dropdown to preserve its selected value when possible and making sure data attributes handle special characters safely.

Now I'm polishing the visual style: rounded cards with subtle borders and shadows, circular step numbers, a serif-accented header with a "keel line" motif, and a harbour-toned color palette with contrast-checked text colors for the hero stats.

I'm defining button states and interactions—primary and secondary styles, ghost remove buttons, focus outlines—while verifying accessibility contrast ratios, and sketching the toast notification styling against the dark harbour background.

For inputs, I'm setting a border color with sufficient contrast, a 44px height, and 16px font to avoid iOS zoom. Checkboxes become styled chips using native checkboxes with harbour accent color, leveraging modern `:has()` selectors for checked states while keeping the fallback accessible. For balance bars, I'm calculating fill width as a proportion of the max value centered on a track line.

Now I'm styling positive and negative bar segments with harbour and ochre colors, treating the color as decorative since the number itself conveys the status. I'm also right-aligning amounts in tabular format and planning avatar circles that rotate through a small color palette, checking white text contrast against each background.

Writing full HTML document...

I'm reconsidering whether the test-id-scoped main element should wrap the header too, since putting a header inside main is semantically valid and keeps everything accessible to test locators.

I'm planning out the masthead with a brand mark, "Even Keel" title, tagline, and trip stats, then laying out the grid sections in order: adding people, adding expenses, balances/settle up, and the expenses list.

For layout, I'm grouping sections 1-2 in a left column and 3-4 in a right column on desktop, collapsing to a single stacked order on mobile. I'm also designing a fixed-position toast notification at the bottom center with an accessible live region role, including an optional Undo action.

Writing storage and formatting setup...

Writing the load/sanitize logic...

Returning an empty trip on parse failure, falling back safely. For name matching I decide to normalize whitespace and case using NFC normalization plus lowercase comparison. Now I'm moving to rendering the people list, handling the empty state, showing a count label, and preparing to compute paid/involved totals per person before looping through them.

Adding list item markup...

Now I'm handling avatar coloring by cycling through classes, and deriving initials safely from name characters including emoji. For removing a person, I need to filter them out, clean up any split checkboxes referencing them, reset the payer selector if needed, announce the removal, and move focus back to the name input. Then I'm wiring up the add-person form to validate input, checking for empty names, length limits, and duplicates against existing people.

Still writing validation logic...

For the duplicate case, I'm surfacing a helpful error suggesting adding a last initial to disambiguate. Once validated, I push the new person, mark them as included in the split, clear the input and any errors, commit state, and announce the addition before refocusing the input.

Writing expense form submission logic...

I'm handling focus-on-error for the payer dropdown and split checkboxes, then wiring up live preview updates whenever the amount or split selections change. For rendering, I'm reversing the expense list order and distinguishing payment-type entries with a "Payment" tag and descriptive text about who paid whom back, while regular expenses show per-person share amounts—splitting evenly when possible, rounding pennies otherwise, and using simplified phrasing when only one person is included in the split.

Now I'm working out how to join multiple names into a readable list using Intl.ListFormat for proper locale-aware conjunctions, then building the balances rendering logic that computes each person's paid/owed totals and displays their status as owing, being owed, or even.

For the settlement view, I'm designing transfer list items with a "Mark as paid" button that records a payment as a special expense reducing the payer's debt and the receiver's credit—while making sure these settlement payments are excluded from the trip total so they don't get double-counted as regular spending.

Then I'm drafting the copy explaining the settle-up transfers and reassuring users that having a balance is normal for shared trips. I'm now writing the toast notification logic, tracking a timer and building an announce function that shows a message with an optional undo button...

For deleting an expense, I'm figuring out how to compute the next item to focus after removal, by working out the display order and finding the next or previous id to move focus to.

Then I splice the expense out, commit, focus the appropriate delete button or the heading if none remain, and announce the removal with an undo callback that reinserts the removed expense at its original position and restores the toast. I need to double check that undo doesn't break if the payer or split participants were removed from the people list in the meantime.

I'm thinking through commit as a save-then-render step, managing focus after deletes, marking paid, or removing people, resetting state on clearing a trip, and adding a storage event listener so changes sync across tabs. I'm also planning split tool buttons like "Select everyone" and "Clear," plus the masthead summary stats like the trip total.

Now I'm starting the CSS with a mobile-first approach, defining color variables for a harbor/signal/paper palette along with spacing and shadow tokens.

For the masthead, I'm thinking background should be the harbour color with a subtle signal-colored line at the bottom, like a plimsoll line on a ship, rather than a heavy 4px border which would feel too loud.

That gives me an idea for the brand mark itself: a circle bisected by a horizontal line, echoing the plimsoll/load-line symbol, which feels perfect for Even Keel — a paper-colored circle outline with a signal-colored line through it.

Now I'm working out the masthead layout with brand on the left and stats on the right for desktop, stacking below on mobile, using a three-column grid with uneven proportions so the trip total has room since it could be a long dollar figure, checking how that fits at narrow 360px widths.

Styling the cards...

Still writing input styles...

Deciding to just keep the input's own focus outline rather than relying on :has for accessibility, which is simpler and more robust. Now I'm defining button styles for primary, secondary, and quiet variants...

I'm working through where Signal should appear beyond just focus states — settling on Harbour as the primary button color while reserving Signal as a deliberate brand accent for things like the plimsoll line, step numbers, waterline, transfer arrows, and focus rings. Now I'm starting the error message styling.

I'm checking the contrast ratio of the error text color against its background, confirming it passes at roughly 5.86:1. Now I'm building out the balance item layout markup with an avatar and name row.

I'm structuring the transfer item to read clearly as "Ben pays Ana $20.00" with a Mark paid button, keeping the arrow visual simple and the word "pays" plainly shown rather than hidden.

Now I'm laying out the rest of the balances and expenses sections: a "Settle up" subheading within a harbour-tinted panel, a grid-based expense list divided by lines instead of cards, and a "Newest first" header. I'm also defining the toast notification styling—fixed position, dark background with light text, rounded corners, hidden by default with reduced-motion support—plus a visually-hidden utility class and a footer noting the trip persists on reload with a "Start a new trip" button.

I'm making sure the hidden attribute properly forces elements to disappear, then starting to write the actual HTML markup for the app shell, including the header with the Even Keel logo and tagline.

Adding the waterline stripe styling, then building the People card section with a form for adding names and a step indicator showing this is step 1 of the setup flow.

I'm settling on a 40-character maxlength for names rather than 60, simplifying validation since the limit itself prevents overly long entries. Then I'm sketching out the headings and descriptions for the remaining cards: the expense logging form (step 2) and the balances summary (step 3) showing who owes what.

I'm also deciding the layout order—balances before expenses in the desktop column, but people, expense, balances, expenses on mobile—plus empty-state messaging for when there's no data yet.

Now I'm writing the function that renders the split section, looping through each person to build their input row and handling the case where no people have been added yet.

Adding checkbox handlers for each person...

I should regenerate ids if they don't match a safe pattern, and I'm writing a function to populate the payer dropdown with each person's name, preserving the current selection if still valid. I'm wondering whether to auto-select a single person as payer or leave it as a placeholder default.

Writing preview text logic...

I'm handling the remainder case by noting honestly that extra cents go to the first people on the list, and sketching out parseAmount's error-vs-cents return shape. I also note some edge cases to verify, like accessibility tabindex on headings and matching names case-insensitively for payers.

I'm double-checking color contrast ratios for the muted text, paper background, and placeholder text colors to make sure everything meets accessibility standards, then I'll finalize the code with careful attention to quote escaping in JS strings.

Now I'm working through responsive layout details — checking that the inline person-entry row fits at 360px width, and planning when the expense form's amount/payer fields should stack versus sit side-by-side based on container width.

Writing masthead styles...

Still writing stat styles...

I'll pair serif for brand and headings with tabular sans for numbers to keep things legible, then build the card header with a numbered step circle, serif title, and muted lede text, checking that the harbour color reads well against white.

For the expense list, I'll skip the numbered step and treat it as history instead, keeping steps 1-3 for the main flow. I need to make sure error elements only render when there's an actual validation error, errors persist with the user's typed input intact, and inline errors clear as soon as the user edits the relevant field — description, amount (which also refreshes the preview), payer, or person name.

Now I'm writing the function that renders the expense list, building each row's display text by filtering people names against the split participants and determining whether it's a payment or a shared expense entry.

Still writing expense list markup...

I'm handling the single-person case by saying the share counts fully toward that person, and joining multiple names with "each" otherwise. I'm also confirming the `el` helper handles 'for' labels, aria-label, and click handlers correctly before writing out the final file.

For the balance logic, I'm building a map keyed by person name tracking how much each paid and owes, looping through expenses to add to the payer's paid total and each sharer's owed total — payments get folded into the same paid/share totals for display purposes.

I also need to sort out the settle-up copy for each case: hide the section with no people, show "Everyone's even" when there are no transfers and everything's zero but expenses exist, "Nothing to settle yet" when there are no expenses, and a transfer count lede otherwise. Time to write the final version with clean CSS.

