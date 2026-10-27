I'm planning the single HTML file structure: adding people with trimmed, unique, case-insensitive validation and inline errors, plus expense entries requiring a description, a positive amount with at most two decimals, a payer, and split checkboxes checked by default. I'm working out how to parse amounts into cents reliably without floating-point issues.

I'm also designing the share calculation by dividing cents evenly among selected people and distributing any remainder to the first few in order, keeping the expense list sorted newest first with delete buttons, computing each person's balance as paid minus their share, and implementing a greedy settle-up algorithm that matches the largest debtors with the largest creditors to minimize transactions.

I'm also planning persistence through localStorage with a simple id scheme, Intl-based currency formatting for CAD, responsive layout considerations down to 360px, accessibility basics like labels and focus states, and picking Fraunces for headings paired with Figtree for body text via Google Fonts.

Now I'm checking color contrast ratios for my palette — a warm paper background with harbour blue and signal red accents — computing luminance values to make sure the signal red works against white and the muted text works against the paper background.

Continuing the luminance computation for the RGB channels, I get contributions around 0.0843, 0.0303, and need the blue component to finish the sum for the contrast ratio check.

For color decisions: Harbour works well as the primary button background with white text, while Signal is reserved for accents and errors, with error text styled against a light tint. Positive balances use Harbour, negative use a darker Signal, but I'm also pairing these with explicit "is owed"/"owes" labels so meaning isn't conveyed by color alone. For branding, I'm leaning toward "Even Keel" with a calm, plain-spoken tagline about keeping the trip even, and starting to sketch out the page sections beginning with People.

Now I'm planning the overall layout with sections for People, Expenses, Balances, and Settle up, using a two-column CSS grid on wider screens and a stacked order on mobile. I'm also thinking through how the render function should rebuild the DOM from state without losing user input—particularly how payer selects and split checkboxes need to preserve selections as people are added, so I'm considering tracking selected splits in a dedicated state set rather than resetting checkboxes on every rerender.

For form validation, I'm deciding to give each form its own inline error element with a hidden attribute toggled based on whether there's an error, paired with aria-live and aria-invalid attributes for accessibility. I'm also working out the validation order for the expense form—description, amount, payer, then split selection—while making sure error states don't wipe out what the user already typed.

After a successful expense submission, I clear the description and amount but keep payer and split selections, then move focus back to the description field; similarly, adding a person clears and refocuses that input. I'm also handling edge cases like disabling the payer dropdown when there are no people yet, and planning the storage schema under a versioned key with loose validation on load, storing each expense as an object with id, description, cents, payer, and the array of people splitting the cost. I'm defining a shares function that computes each person's share based on the people array's insertion order, filtering by who's included in the split.

Now I'm working out balances: for each person, paid minus share gives their net balance, and I'm deciding to display this as "is owed", "owes", or "settled up" text with a signed cents data attribute, listing every person even if their balance is zero. For settling up, I'm writing a greedy algorithm that matches creditors to debtors in sorted order to minimize the number of transfers, with deterministic tie-breaking by insertion order, plus an empty-state message when everyone is already even.

For rendering, I'll escape user-provided strings carefully (including quotes in attributes) and use an escape helper with innerHTML-based rendering for lists, keeping focus stable by not rerendering the input fields themselves. I'm structuring the split-selection as a fieldset with delegated change listeners, the payer as a select populated from the people list, and wrapping inputs in forms so Enter submits properly.

For amount parsing, I'm writing a function that strips a leading dollar sign and commas, then validates with a regex allowing up to two decimal places, converting to integer cents while guarding against values that exceed a reasonable cap and rejecting zero or malformed decimal counts.

I decide to also handle cases with trailing zeros beyond two decimals, like "1.230", by checking if extra digits are all zero before accepting, and I make sure patterns like "5." or missing leading digits still parse correctly. I'm settling on formatting currency by dividing cents by 100 and letting the formatter handle negatives and precision.

I'm also planning expense display details—joining names for split shares, saving to localStorage after mutations—and sketching the visual design: a paper-toned background, dark ink text, and a navy header band with branded text.

Now I'm fleshing out the UI spec further: card styling with white backgrounds, subtle borders, rounded corners; typography choices for headings and tabular numbers for balances; accessible focus outlines and input sizing for touch targets; and the responsive grid layout, deciding how sections like people, expenses, balances, and settle-up should stack on mobile versus arrange in columns on desktop.

I'm drafting empty-state copy for no people, no expenses, and settle-up scenarios, and deciding to keep the expense form enabled even without people, showing errors on submit instead of disabling it. I'll generate expense IDs from timestamp plus random string, then start writing the HTML document with meta tags, fonts, and title "Even Keel — Trip expenses."

Writing HTML boilerplate...

I'm picking a colour palette with harbour blues, a signal red/orange accent, and paper/card tones, checking contrast ratios between text and background colours to ensure readability (muted text on card and paper backgrounds, tagline text on the harbour header).

Writing CSS styles...

Still styling buttons and form fields...

I'm designing checkbox chips for the split selector with rounded pill styling that highlights when checked, plus error message styling with high-contrast colors. Then I'm laying out the expense list items with description, payer/split metadata, and amount in a grid.

For the balances list, I'm planning a flex row showing each person's name alongside their amount and a status label like "is owed" or "owes" — keeping the display as absolute values with words rather than negative signs to avoid confusion, and skipping extra visual bars to keep things simple.

Now I'm writing the state management JS: a localStorage-backed load function that validates people and expenses arrays, plus a validator function checking expense shape (id, description, cents, payer, split array)...

Adding save, escape, and formatting helpers, and normalizing names by trimming and collapsing whitespace for case-insensitive uniqueness. I'm also writing a shares function that splits an expense's cents evenly among selected people, distributing any remainder cents one-by-one to keep totals exact.

For balances, I'll use a Map instead of a plain object to avoid prototype-pollution issues with names like "__proto__", crediting payers and debiting each person's share. Then I'm implementing a greedy settle algorithm that sorts debtors and creditors by amount and matches them to minimize the number of transactions.

Writing settlement matching loop...

Now I'm planning the rendering structure: a top-level render function calling sub-renderers for people, payer selector, split options, expenses, balances, and settlement suggestions, with empty-state messages shown when lists are empty.

For the payer dropdown I'm keeping the previously selected value if still valid, falling back to the first person, and leaving it enabled rather than disabled when empty. For the split section I'm rendering a checkbox chip per person with a change listener that toggles membership in the draft split set based on which checkbox fired.

New people get automatically added to the draft split when created, and I require at least one person checked before submitting an expense, erroring otherwise. For rendering expenses, I'm listing them newest-first with each showing the description, payer, split details, amount, and a remove button, working out the "split N ways between X, Y, Z" wording with a special case for when it's just one person.

Deleting an expense uses event delegation on the list, filters it out of state, saves, re-renders, and then moves focus to the expenses heading so keyboard users don't lose their place. For balances, I'm rendering a row per person showing their name, absolute amount owed/owing, and a status label, with an empty-state message when there are no people yet.

For the settlement section I'm handling the different cases: nothing to show if there are no expenses, a "you're all even" message if transfers are empty but expenses exist, and otherwise a list of transfers with a short summary line. Now I'm writing the person form's submit handler, trimming and normalizing the name, validating it's not empty, and checking for duplicate names against the existing people list.

Having two separate error elements with the same test id could trip up strict-mode locator matching in Playwright if both exist simultaneously. I think the safer approach is to only render the error element into the DOM when it's actually shown, so at most one instance with that test id exists at any time—using a slot container that conditionally inserts the error paragraph.

I'm also deciding to clear the opposite form's error when a user submits the other form, so person and expense errors never coexist, and adding input listeners so each field clears its own error as the user types. Now I'm writing the expense submit validation logic—checking the description, parsing the amount, and reading the payer/split values.

Still writing validation logic...

For the zero-amount case, I'm deciding parseMoney should distinguish "invalid" from "zero" so I can give a clearer message like requiring an amount greater than $0 with up to two decimals.

After validation passes, I push the new expense with its id, description, cents, payer, and selected split group, then save and re-render -- clearing description and amount but keeping payer and split selections for convenience, then refocusing the description field.

I'm now working out the parseMoney function itself: stripping dollar signs and commas, matching digits with an optional decimal part, rejecting malformed input, truncating extra decimal digits only if they're zero, and converting the result to an integer cents value, capping absurdly large inputs for sanity. I'm mentally testing cases like "1,234.50" being accepted, "0" being rejected downstream, and negative values needing to fail the regex.

I realize the comma-stripping is too permissive since something like "1,2" would wrongly parse as "12," so I'm refining it to only strip commas when they actually match a proper thousands-grouping pattern, otherwise leaving them in place so the regex naturally rejects malformed input.

I'm also sketching deletion logic that filters the expense out by id, deciding to wrap storage calls in error handling, and planning to move focus to the expenses heading after a deletion for accessibility.

Writing the header and main markup...

Building the expense form section with description, amount, payer dropdown, and split chips for selecting participants...

Now I'm closing out the markup with Expenses, Balances, and Settle sections—each getting a heading, hint text, and an empty list that I'll toggle visibility on. I want empty states rendered as paragraphs sitting alongside the lists rather than as list items, so test queries counting balance or transfer entries don't pick them up accidentally, and I'm drafting the friendly empty-state copy for when there are no people or expenses yet.

For settle up specifically, the empty message needs to be dynamic depending on context: prompting to add people and expenses, or telling the user things are already settled when balances are zero.

Writing list and avatar styles...

I'm also handling edge cases: long descriptions wrapping safely, button contrast, and checking the mobile layout fits comfortably at 360px width with proper flex behavior for expense rows. Then I'm setting up the desktop grid areas for people, form, and expenses sections.

Writing JavaScript setup...

I'm also setting up clearErrors to wipe out all error messages and aria-invalid states on input/change events, and marking error paragraphs with role="alert" so screen readers announce them. I'm thinking through edge cases like focusing checkboxes and whether clearing errors while typing is still acceptable behavior.

For the person form submit handler, I'm validating that a name isn't empty and isn't a duplicate (case-insensitive), then adding it to state and the draft split set before saving and re-rendering. For the expense form, I'm planning similar validation for description, amount, and payer fields, using the same showError helper to surface messages tied to the "expense-err" slot.

Writing validation logic...

For the error focus target I'll make the paragraph focusable when there's no input to focus. Then I'm validating the payer selection and the split checkboxes, making sure at least one person is ticked, and finally pushing the new expense object with a generated id before saving, clearing the form, and re-rendering. Now I'm starting the click delegation handler for the expense list.

Writing render functions for people list, payer dropdown, expense list, balances, and settle-up sections, each generating HTML with appropriate data attributes and empty-state messages. I'm wiring these into a central render() that recomputes balances and transfers, then saves state, while shares() and balances() handle splitting costs evenly with remainder distribution. Finishing up with CSS details for spacing, chip styling, and a small footer note about local-only storage before writing the final complete answer.

