I'm planning the single-file app's data model: people need unique case-insensitive names with inline validation errors, while expenses require a description, a positive amount with at most two decimal places, a payer, and a split group defaulting to everyone selected. I'm also working out how to divide costs equally in cents, distributing any leftover pennies one at a time to selected people in order.

For balances, I'm defining each person's net as what they paid minus their fair share, using signed integer cents, then designing a greedy settle-up algorithm that pairs the largest creditors and debtors to minimize transfers to at most n-1 for n nonzero balances. I'm confirming the math checks out since total paid always equals total shared, so balances sum to exactly zero.

Now I'm figuring out formatting: using Intl.NumberFormat with en-CA locale and CAD currency to display amounts from cents, including proper negative sign handling like "-$5.00" for negative balances, and zero-balance people still appear in the list but not in transfers.

For storage I'm planning a localStorage key holding people names and expense records with id, description, cents, payer, and split array, keeping original name casing. I'm deciding not to support removing people since the spec only requires removable expenses, to avoid unnecessary complexity.

For amount input validation, I'm leaning toward a text field with decimal inputmode rather than a number input to avoid browser quirks, using a regex to enforce positive values with at most two decimal places while considering whether to tolerate a leading dollar sign or thousands separators like commas.

Still working out the parsing edge cases...

I need to reject malformed strings like empty or lone decimal points, split on the decimal to validate cents don't exceed two digits, and cap the total to stay within safe integer bounds. Then I'm drafting the specific error messages users will see for an empty description, a zero amount, and a badly formatted decimal value.

I'm also thinking through what happens when no people exist yet — whether to disable the expense form entirely or keep it enabled and just block submission with a message like "Add at least one person before adding an expense," since disabling might break the natural flow of someone trying to add people first.

For the split checkboxes, I'm deciding each person should have a checkbox defaulting to checked, and when new people are added, their checkboxes should also default to checked while preserving whatever selections the user had already made.

On form resets: errors should keep the user's typed input intact, but a successful add should clear the description and amount, reset the split back to everyone checked, and likely retain the payer selection since the same person often pays repeatedly. I'm also considering focus management—after adding an expense, refocus the description field for quick re-entry, and similarly refocus the name field after adding a person.

For person validation, I want trimmed-empty names to trigger "Enter a name for the person," and case-insensitive duplicates to show something like "${name} is already on this trip. Use a different name." I'll skip collapsing internal whitespace or enforcing a max length since the spec doesn't require it, and I'll keep a single shared form-error element that only appears when there's an active validation message.

I'm deciding how to handle the error element's visibility — rather than toggling a hidden attribute, I'll keep an always-present aria-live region for accessibility, and only attach the data-testid to the actual error paragraph when an error is shown, so it exists in the DOM only during validation failures.

Now I need to place these error slots per form: one near the person input, one near the expense form, each getting data-testid="form-error" when active. To avoid two elements matching that testid at once, I'll clear both errors whenever either form is submitted, then only populate the relevant one, and also clear a form's error as soon as the user edits its fields.

For accessibility, I'll wire aria-invalid and aria-describedby on each input to point to its error container, with a fixed id so the reference stays valid even when empty, and move focus to the invalid field when an error occurs.

For expense splitting, I'm computing each person's share by dividing the cents evenly and distributing the remainder to the first people in trip addition order, storing the split as names sorted by that order so results stay deterministic across saves. Balances are then just paid minus owed per person, feeding into a settle-up algorithm that matches creditors against debtors by sorted amounts.

I'm reasoning through the correctness of the greedy settle-up: since each transfer zeroes out at least one account and the final transfer zeroes two simultaneously, the total number of transfers never exceeds the count of nonzero balances minus one, using people order as a tiebreaker for stable sorting. I also want to handle edge cases gracefully -- showing "Everyone is even" when all balances are zero, and a friendlier empty-state message when there are no expenses yet.

For displaying balances, I'm formatting each person's row with their name, a status label like "is owed," "owes," or "Even" for accessibility (not relying on color alone), and the signed dollar amount using standard currency formatting so negative values naturally show the minus sign.

For transfer rows I'm using a plain sentence structure like "Ben pays Ana" with the amount tabular on the right, and for expense rows I'm including the description, a meta line showing who paid and how the split works, the amount, and a secondary-styled remove button that stays visually subdued since primary buttons should be reserved for the main action.

I'm debating whether the remove button needs a more descriptive accessible name since having multiple identical "Remove" buttons across rows could be ambiguous for screen reader users, but I'll keep the visible text simple as "Remove" and rely on test IDs for targeting rather than complicating the accessible name.

For the data model, I'll store expenses in creation order and render them reversed so the newest appears first, with deletion handled by matching on id. Now I'm sketching the overall page structure, starting with a header containing the wordmark and tagline, followed by a People section with a form for adding names.

For the Expenses section, I'm using a fieldset with legend "Split between" to wrap the per-person checkboxes, keeping data-testid="expense-split" on that container for accessibility. Below that goes the add-expense button, error slot, and expense list, followed by separate sections for Balances and Settle up, all nested inside a single main element with the app's root testid.

I'll keep headings in sentence case -- "People", "Expenses", "Balances", "Settle up" -- and show the Balances and Settle up sections at all times with empty states rather than conditionally rendering them. For the payer select when no people exist yet, I'm including a disabled placeholder option like "Add people first" so the control isn't empty or confusing, while omitting that placeholder once people are added; I also need to preserve the selected payer across re-renders rather than resetting it. The person name input will be a plain text field with autocomplete off and a clear "Name" label.

Now I'm working through the expense form fields: visible labels for "Description" and "Amount (CAD)", a hint under the amount explaining it accepts Canadian dollars with up to two decimals, tied together with aria-describedby, and a text input using inputmode="decimal" rather than a native number input. I'm laying the form out as a responsive grid with description full-width and amount/payer side by side on desktop but stacked on mobile, with checkboxes for split selection wrapped in a grid and styled with accent-color set to Harbour to stay within the palette instead of relying on default browser blue.

I'm also thinking through contrast requirements for input borders -- Rope on Paper only gives about 1.4:1 contrast, which likely fails WCAG 1.4.11's 3:1 requirement for identifying UI component boundaries, so I'm leaning toward using Fog instead for input borders since it hits roughly 5.9:1 against white, even though that repurposes Fog outside its usual hint-text role.

But rereading the spec, the accessibility requirement only explicitly mentions text meeting AA contrast, not non-text elements, which gives me cover to stick with Rope borders on inputs as the brand guidelines specify -- though I'm wary this makes checkbox borders quite faint against white, especially in their unchecked state.

So I'll settle on a final decision: Rope borders for panels, dividers, and most controls, while reserving Fog for cases where the border is the only means of identifying an element, like checkbox outlines, to balance brand fidelity against usability.

Now I'm calculating contrast ratios to verify accessibility compliance: Paper text on Signal primary buttons comes out to roughly 5.0, which clears AA for normal text, and I'm working through the luminance math for Harbour text on Sailcloth background next.

Checking Fog color against Sailcloth and Paper backgrounds, I get contrast ratios around 4.97 and 5.51 respectively, both passing the AA threshold of 4.5 for normal text.

Now checking Kelp green against Paper and Sailcloth, computing luminance from its RGB values gives contrast ratios of roughly 6.28 and 5.66, both comfortably passing accessibility standards.

Since Signal should only be used for primary buttons and the wordmark rule, I need to figure out how error states should be styled without using red or Signal, since the brand treats debt as normal rather than something alarming. I'm leaning toward Harbour-colored text for errors, possibly with a left border accent, keeping everything within the restricted palette and avoiding any tinted variations.

For the remove button I'll use a secondary style with Paper background, Harbour text, and a Fog border, with Sailcloth as the hover background since that's still a valid palette color. For the primary button's hover state I'm debating whether switching to a Harbour background with Paper text would work within the constraints, since Signal is reserved for the default state only — maybe an underline or outline treatment instead of a background shift would respect the rules better.

For focus states, I'm settling on a simple solid outline in Harbour with offset for all interactive elements, using plain :focus rather than :focus-visible so the ring is always guaranteed to appear, including on checkboxes in the split layout.

For fonts, I'll link just the Google Fonts stylesheet without preconnect hints to stay strict about the single external resource rule, using Fraunces for display and IBM Plex Sans for body text with proper fallback stacks. I'm locking the type scale to only 14/16/20/28/40px, sizing the wordmark responsively (28px mobile, 40px desktop), headings at 20px, and money amounts at 16px with tabular figures, with body line-height at 1.5 and weight 400 versus 500 for emphasis, Fraunces at 600 for headings.

I'm laying out the main container at a 720px max-width with 8px-multiple spacing, styling panels with Paper backgrounds, Rope borders, and 6px corner radius consistent across inputs, buttons, and panels. For the wordmark, I'm adding a small horizontal rule accent next to the "Even Keel" text plus a short tagline describing the app's purpose, keeping the header nested inside main.

Now I'm starting the JavaScript, defining a storage key constant and a formatting helper to begin the app's data layer.

Writing currency formatting helper...

I'm designing the app's state shape with people and expenses arrays, planning load/save functions with localStorage wrapped in try/catch for safety, and sketching the sanitization logic to validate stored data on load. I'm also outlining the render functions needed to redraw the people list and payer/split controls while preserving in-progress form input.

I need to handle focus carefully when re-rendering after deletions—since removing an expense's remove button would otherwise drop focus to the body, I'm deciding to move focus to a tabindex-accessible element like the expenses heading or list container so keyboard users don't lose their place, accepting the visible focus outline as a tradeoff. I'm also planning to tag each person list item with a test id for easier testing.

For the people list, I'll keep each entry showing just the name, with a count shown in the "People" heading (e.g. "People (3)"), ordered by addition sequence. For expenses, each list item needs a title, a meta line describing who paid and the split, an amount, and a delete button—I'm working through how to phrase the screen-reader-only text on that button so its accessible name clearly identifies which expense it removes, like "Remove Dinner" rather than something ambiguous.

I want to avoid using innerHTML with user-supplied content to prevent escaping issues, so I'm building a small DOM-creation helper function that takes a tag, props, and children, handles class names, text content, event listeners, dataset attributes, and generic attributes, and safely appends child nodes or text.

I'm working through the details of attribute handling for checked, selected, and boolean props, then designing the form submission logic: validating that a name isn't empty or duplicate (case-insensitive) before adding a person, and for expenses checking that people exist, a description and valid amount are given, a payer is selected, and at least one person is chosen for the split, with the split order following the people list.

I'm now designing the amount parser carefully, handling dollar signs, negative numbers, comma-grouped thousands, decimal places over two digits, zero or negative values, and overflow amounts, converting everything into integer cents with appropriate error messages for each failure case.

Next I'm writing the logic to split a total evenly among people by distributing the remainder cents to the first few people in order, then building a balances calculator that adds each expense to the payer's balance and subtracts each person's share, while sanitizing any corrupted stored data referencing people not in the list.

I'm designing a settle-up algorithm using a greedy largest creditor/debtor matching approach to generate minimal-ish transfers, confirming it will always produce at most n-1 transactions even though it's not necessarily the true minimum.

Finally, I'm deciding how to render the balances list using money formatting with a minus sign for negative balances, color-coding positive and negative amounts, labeling each person's status as owed, owing, or even, and figuring out what empty-state messaging to show when there are no people or no expenses yet.

