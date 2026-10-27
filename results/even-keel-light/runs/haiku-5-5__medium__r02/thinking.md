I'm planning the single-file HTML app's structure: validation rules for adding people (trimmed, unique, case-insensitive) with inline errors, and expense entry fields covering description, amount formatting, payer selection, and split checkboxes.

For splitting, I'll use integer cents with the remainder distributed to the first selected people in trip order, show expenses newest-first with delete buttons, and compute signed balances. For settling up, I'm using a greedy creditor/debtor matching algorithm that guarantees at most n-1 transfers, persisting everything to localStorage and formatting currency with Intl.NumberFormat. I'm also considering edge cases like what happens if a person tied to existing expenses gets removed.

Rather than supporting person removal, I'll skip that complexity and keep people permanent once added, disabling the expense form with an empty-state message if no people exist yet. For amount validation I'm working out a regex that accepts plain decimals with up to two decimal places while rejecting ambiguous comma-formatted numbers, then converting the validated string into integer cents by splitting on the decimal point and padding the fractional part.

For description and split validation, I'm requiring non-empty trimmed text and at least one selected person, while payer selection just needs to exist in the people list without necessarily being part of the split. I'm settling on a storage model with a people array and an expenses array containing id, description, cents, payer, and split fields, rendered newest-first by sorting on id, and I'm planning to build the DOM mostly with createElement plus an escape helper for any innerHTML usage to safely handle names with special characters. I also need to make sure re-rendering the payer select and split checkboxes doesn't wipe out whatever the user has already typed into the description and amount fields.

For split checkboxes, I'll track an "unchecked" set of names the user has manually deselected, so newly added people default to checked while existing selections persist across re-renders; the payer select keeps its current value if still valid, otherwise falls back to the first person. After a successful expense submission I'll clear the description, amount, and unchecked set but retain the payer choice, and I'm figuring out how to handle the form-error element so it only renders when there's an actual error to show.

I'll make each form include an error slot that's empty by default and only populated with a role="alert" paragraph (with the form-error test id) when a validation message exists, clearing it automatically as the user edits inputs. For person name validation I need empty-name and duplicate-name messages with a reasonable max length, and for balances I'll compute each person's paid total minus their share across expenses, confirming the balances always net to zero, then work out a greedy settle-up algorithm pairing debtors and creditors.

For display I'm formatting money with a currency formatter (handling negative balances cleanly), labeling each balance as owed/owes/even, and showing an empty state when everyone's settled. For expense entries I'll list who the cost was split between along with each person's individual share for transparency, and give delete buttons proper aria-labels. I'm also setting up localStorage persistence with safe error handling and starting to build the header layout with the "Even Keel" branding and tagline.

I'm checking color contrast ratios to make sure the navy and signal-red accent colors meet accessibility standards for text readability against their backgrounds, confirming both pass AA contrast requirements for buttons and headers.

Now I'm checking contrast for muted text, positive/negative balance colors against the paper background, settling on a darker signal shade for negative amounts to stay accessible. I'm also planning the typography pairing—Fraunces for headings, Inter or Public Sans for body—with tabular figures for money, plus a visible focus outline style for keyboard navigation.

Writing the HTML structure...

I'm deciding what happens when there are no people yet—should the form disable itself, or stay enabled but show a validation message like "Add at least one person first" on submit? Leaning toward keeping it enabled since tests likely add people before interacting with the expense form.

I'll keep the expense form enabled and just show a submit-time error if no people exist, rather than disabling inputs—simpler and more testable. Then I'm laying out the remaining sections: an expenses list, a balances section, and a settle-up section with transfer suggestions, using a fieldset with legend for the split controls and a data-testid on the inner container.

Now I'm defining how balance and transfer list items render (name/amount/status for balances, "X pays Y $amount" for transfers), with a single renderAll() to refresh everything on state change. I'm also writing an amount parser that validates dollar strings and converts them to integer cents, handling edge cases like "5." or ".5", and starting on a function to split a total evenly across an ordered list of names.

Next I work out the debt-settlement algorithm: sort creditors and debtors by amount, greedily match them into minimal transfers, and skip zero balances so the number of transfers stays below the number of people involved. I also note that split/payer names need to match people's names exactly, and start thinking through how adding a new person works.

Adding a person requires trimming and validating the name, checking for case-insensitive duplicates against existing people, and persisting the updated state after each change. I'm designing the expense data structure with id, description, cents, payer, and split array, and planning to render expenses newest-first by reversing the stored order, with each card showing description, payer/split metadata, and per-person share amounts.

After adding an expense, I want to clear the form and refocus the description field for quick entry, while the payer dropdown should preserve its selected value across re-renders by checking if the previous selection still exists in the people list. The split checkboxes get rebuilt each render as labeled inputs per person.

I decide not to re-render the split checkboxes on toggle, only on person/expense add or delete, so focus isn't disrupted mid-interaction. The checkbox handler just adds or removes the person from the unchecked set, and error messages get injected as alert-role paragraphs for accessibility, with validation checking description first, then amount format.

I'm ordering validation checks: no people first, then payer missing, then empty split selection, each with a specific error message, and focusing the first invalid field. For money I'm using Intl.NumberFormat for CAD currency display, with balance labels like "is owed," "owes," or "is even" shown as text rather than relying on color alone, and a settle-up summary that says everyone's even when there's nothing to transfer.

I'm also drafting empty-state copy for people, expenses, and balances sections, plus thinking through the friendly, reassuring voice for the settle-up hint ("Owing a friend is normal..."). I'm deciding to skip a "clear trip" or "new trip" button to keep scope tight, and settling on Fraunces for headings paired with a clean sans body font.

Now I'm picking the color palette, checking contrast ratios for muted text against the paper background to make sure accessibility holds up.

For layout, I'm planning a navy header band with white brand text and a thin signal-colored "keel" line underneath, then a responsive wrapper grid that switches from one column to multiple columns at wider breakpoints.

I'm also working out the section order (people, add expense, expenses spanning full width, balances, settle up), input styling sized to avoid iOS zoom with adequate contrast, and button styles using the signal color with hover states.

Now I'm handling layout details like wrapping rows, flexible inputs, a dollar-sign prefix for the amount field, pill-style checkboxes, and preventing text overflow for long names. Then I'm starting the JS logic with a localStorage key and state loader...

Writing load/save and render functions...

Wait, I realize the avatar initial will leak into textContent since aria-hidden doesn't remove it from text, which could break tests that check person names via textContent — I need to avoid adding that extra character.

I'll skip the avatar entirely and use a CSS dot instead. Then I'm structuring the balance and transfer list items with data attributes and escaped text for names and amounts, and starting the computeBalances function that tallies each payer's contributions and divides shares among participants.

I'm also sketching out splitShares to divide cents evenly among selected people in trip order, plus the form submit handlers for adding people and expenses, and the delete logic that filters expenses by id and re-renders.

For focus management after deletion, I'll shift focus to the expenses list heading using tabindex -1 rather than leaving it on body. Then I'm working out the settle-up algorithm: separating people into creditors and debtors based on their balance sign, sorting each by amount, then matching them off to generate minimal payment transactions.

Now I'm drafting the full HTML document with the viewport meta tag and page title, then starting the CSS with box-sizing resets and base typography. Writing more layout styles...

Adding more styles...

Adding consistent focus-visible outlines and invalid-field styling...

Still writing button and input field styles...

Styling checkbox chips...

Adding more styles...

Adding more expense row styles...

Adding more styles...

Now I'm moving to the JavaScript logic—setting up element references, rendering the payer dropdown with escaped option values, and building out the split rendering function for each person.

Writing the expense form submit handler...

For the new expense I'll generate a unique id combining timestamp and random string, then store it with the split in trip order. After saving, I'll reset the form fields, clear the unchecked set, re-render the split checkboxes, save state, refresh the view, and refocus the description input.

I'm confirming renderAll correctly rebuilds checkboxes as all-checked via renderSplit, and that the payer selection persists through a reset. For adding a person, I'll trim the input name (deciding against collapsing internal whitespace to match the spec exactly), show "Enter a name to add someone to the trip." if empty, and show a duplicate-name error using the existing person's name as typed.

Now I'm wiring up the delete button: clicking it finds the closest matching element via its test id, pulls the expense id from the list item's data attribute, removes it from state, and moves focus to the expenses heading (made focusable via tabindex -1) for accessibility. Then I'm building renderExpenses, which reverses the expense list and maps each one into a list item showing the description and computed per-person shares joined with a separator, with all dynamic text escaped for safety.

I'm switching away from plain object literals for share and balance data since keys like "constructor" could collide with inherited prototype properties — using Map instead everywhere for safety. I'm also laying out the balances rendering logic, including empty states for when there are no people yet, and starting on the settle-up transfer list rendering.

For the settle section, I'm writing a reassuring note explaining the transfers square everyone up efficiently, plus handling the case where everyone's already even. I'm also considering adding a small summary line showing total spend across all expenses, and finalizing the overall HTML structure with the main element wrapping the full app grid, header placed outside it.

