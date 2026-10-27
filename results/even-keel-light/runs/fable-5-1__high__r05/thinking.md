I need to plan out a single-file expense splitter app: adding people with validation, recording expenses with integer-cent splitting and remainder distribution, computing balances, and a greedy settle-up algorithm, all persisted to localStorage with CAD currency formatting and responsive design down to 360px.

Now I'm thinking through the visual identity — choosing Fraunces for display headings and Inter for body text with tabular figures for numbers, and picking a warm off-white background with navy and signal-red accents while checking contrast ratios for accessibility.

Finishing the luminance calc for the Harbour color gives a contrast ratio near 11.85 against white, which is excellent. Now I'm testing a green-teal accent color (#1F6F5A) for contrast as well, working through the same relative luminance formula for its RGB channels.

Next I'm checking a muted text color option, #5B6B76, running the same gamma-correction math on each channel to get its luminance value.

Then I'm confirming its contrast ratio against white comes out around 5.5, which still works well against both white and the off-white #F6F3EE background.

Now I'm shifting to planning the page layout — a header with a wordmark and tagline, a 12-column grid for desktop, and sections for people, an add-expense form, expense list, balances, and settle-up, plus I'm considering adding a "Start over" button with a confirm prompt.

For the people section I'm sketching a name input with an Add button, error messaging, and a list. For the expense form I'm handling the edge case of no people existing yet — rather than disabling the form, I'll keep it enabled and show a friendly error prompting the user to add someone first, which seems safer for testing. I'm also deciding that new people should default to checked in the split-between checkboxes while preserving any choices the user already made for existing people.

After adding an expense, I'll reset the description and amount but keep the payer and re-check all split boxes. For deleting people, I'm leaning toward allowing removal only when they aren't involved in any expense, otherwise showing a message — a bit more complex but safer than outright banning deletion.

Actually, I'm deciding to skip person removal entirely to keep scope tight, since a disabled button would hurt accessibility. For amount validation, I want to strip dollar signs, commas, and spaces before testing against a pattern that allows up to two decimal places.

I'll use a text input with inputmode="decimal" rather than type="number" to avoid browser quirks with number parsing, converting the validated string to cents by splitting on the decimal point to avoid floating point errors. For splitting expenses, I'm storing each expense with a payer, an ordered list of participants, and the cents amount, computing each person's share by dividing cents evenly and distributing the remainder to the first few people in order.

For settling up, I'm using a greedy algorithm that matches the largest debtor against the largest creditor repeatedly, which guarantees at most n-1 transfers since balances sum to zero. I'm planning render functions that rebuild list contents from scratch, using event delegation for deletions and restoring focus to the name input after adding a person, while escaping names to prevent HTML injection.

For errors, I'm using an aria-live container that only gets the test-id attribute when a message is actually shown, linked to the input via aria-describedby, and I'm setting up empty-state messaging for when no people have been added yet.

I'm now working through empty states for expenses, balances, and settle-up views, plus deciding how to phrase balance amounts -- "gets back" versus "owes" versus "even" -- and how to format expense rows showing who paid and how the cost was split.

I'm also adding a short date display for each expense, setting up responsive grid breakpoints, focus-visible outline styling, and checkbox chip styling with accent coloring.

For fonts, I'm pulling in Fraunces and Inter from Google Fonts with proper preconnect, and setting tabular numerals for consistent number alignment. I'm settling on a design direction with a light sand background, white cards with hairline borders, and a navy wordmark with a thin signal-colored rule for that "not a bank" feel.

I'm defining the color roles: harbour navy fills primary buttons with white text, signal color highlights key amounts and focus states, and delete buttons stay ghosted until hover reveals signal color. I'm structuring the settle-up row to show who pays whom and how much, storing everything under an "evenkeel.v1" localStorage key with validated state for people and expenses, then writing the form validation logic to catch missing people, empty descriptions, and invalid amounts with friendly error messages.

Writing amount parsing and share-splitting logic...

Still writing settlement algorithm...

I'm also planning accessibility details like error ids and aria-describedby links, plus a small header stats summary and a confirm-protected "Start over" button, before moving into defining the CSS color variables.

Still writing styles...

I'm also thinking through responsive layout rules—two-column grids above 480px collapsing to one column, and expense list items wrapping their amount/remove controls on narrow screens.

Now I need to write the full file, making sure forms use proper submit handling so Enter key works, with the add-person button as a submit type inside its form.

