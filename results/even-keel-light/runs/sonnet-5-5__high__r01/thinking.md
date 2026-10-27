I'm working out the visual palette: navy and warm off-white as base tones, with a signal color reserved for primary accents, and deliberately avoiding alarm-red for negative balances since owing money is framed as normal rather than alarming.

For typography I'm pairing Fraunces for headings and numbers with Public Sans for body text. On structure, I'm planning a responsive two-column layout (People/Add expense on one side, Balances/Settle up/Expenses on the other, collapsing to one column on mobile), and sketching the state shape as a list of people plus expenses with description, amount, payer, and split, keeping things simple by skipping person removal.

Now I'm working through amount validation logic -- handling dollar signs, comma-separated thousands, and decimal precision so user input parses cleanly into cents.

For the actual logic, I plan to use a text input with decimal inputmode to preserve raw typed values, convert amounts to integer cents for accuracy, then split shares evenly by distributing any remainder cents to the first people in line. Balances are computed per person as paid minus owed share, and settlement uses a greedy approach matching the largest debtor against the largest creditor repeatedly until everyone's balanced, keeping the number of transactions minimal.

Now I'm figuring out error handling — a single error element per form that only appears while an error is active, using a live-region container with a dynamically inserted child carrying the test id, and clearing errors on successful submission rather than on every keystroke.

I also need rejected forms to preserve what the user typed, so I'll render lists, the payer select, and split checkboxes independently while preserving their current selection/checked state. Newly added people should default to checked in the split list, so I'll track unchecked names separately rather than rebuilding state from scratch, and keep the payer select's chosen value intact across re-renders.

On successful submission, I'll clear description and amount but keep the payer and reset the split to everyone, then refocus the description field. For the no-people case, I'll keep the form visible but just show an error message rather than disabling fields, since disabled controls would block tests from triggering that error.

For validation, I'll just surface the first failing error and focus that field rather than listing every issue at once. Deleting an expense will remove it immediately without an undo feature, to keep things simple.

The expense list will show newest first, with description, amount, who paid, and the names split between. Balances will show each person's name with "owes" or "is owed" and a diverging bar visual scaled to the largest amount.

For Settle Up, I'll phrase transfers as "Ana pays Ben $12.00" and handle edge cases: an all-even state and an empty state before any expenses exist. I'll soften the "fewest payments" claim to "a short list of payments" since greedy settlement isn't guaranteed optimal, and I'll make sure focus states have visible offset outlines for accessibility.

I'm checking contrast ratios for the color palette—the terracotta accent is borderline on the paper background so I'll use a darker variant for text while keeping the lighter one for button fills with white text, which passes comfortably. I'm settling on a teal for "owed" amounts and a muted gray for secondary text.

For the layout, I'm sketching a navy header band with the "Even Keel" wordmark in Fraunces, a small keel/sail SVG mark, and a plain tagline about logging payments and seeing who owes whom. I'm also planning a stats row above the main balances showing trip total, expense count, and people count, then moving into the grid-based container layout.

Now I'm working through responsive details: a two-column grid above 900px with people/add-expense on the left and balances/settle/expenses on the right, collapsing naturally on mobile. For the split checkboxes I'm styling them as chip-like labels in a two-column grid with proper touch targets and accent-colored native checkboxes, and for inputs I'm using 16px text to prevent iOS zoom, 44px height, and a dollar-prefix styled amount field labeled "Amount (CAD)."

For localStorage I'm planning a versioned key with try/catch loading and shape validation, sanitizing people and expense references. For security I'm avoiding innerHTML in favor of textContent and a small element-builder helper. For person list items I'm being careful that adding an avatar initial via a real DOM node would pollute the text content used for test assertions, so I'm using a CSS-generated initial via a data attribute and ::before instead, keeping the li's actual text equal to just the name.

For transfers, balances, and expenses I'm structuring readable text like "Ana pays Ben $12.00" and similar descriptive strings. I'm handling focus by clearing and refocusing the input after adding a person, using aria-live/role=alert for error announcements, and wiring Enter-to-submit via actual form submission. For currency I'm setting up an Intl.NumberFormat-based money formatter for cents-to-CAD conversion.

Now I'm sketching state management: a localStorage key, loaded state, and a UI object tracking unchecked split participants and the selected payer, alongside a set of render functions for people, payer, split, balances, transfers, expenses, and summary, plus a renderAll that ties them together. Setting up expense IDs and checkbox handling...

I'm adding a "select all/clear all" toggle for the split checkboxes placed in the fieldset legend, keeping the testid container limited to just the checkboxes themselves. For the payer dropdown, I'm preserving the previously selected payer if it still exists, otherwise defaulting to the first person, and now moving into validation logic for adding a new expense.

Validation checks for a trimmed description, a properly parsed amount with at most two decimals and a value above zero, a payer selection that exists among current people, and at least one person checked for the split, each with a focused error message. I'm now writing a parser function that strips a leading dollar sign and handles comma-formatted numbers...

Still refining parser edge cases...

Now I'm writing a settlement function that separates balances into creditors and debtors sorted by amount, then plans to greedily match them to minimize the number of transactions needed.

For the summary stats, I'll add a small trip summary row with total cents near the top. For removing an expense, I'll move focus to the expense list heading afterward so keyboard users aren't left stranded.

Now I'm nailing down the visual language: a warm paper background with cream cards bordered in a soft tan, Fraunces headings in navy, a navy header with a thin accent stripe, and tabular numerals for all money values so totals align cleanly. I'm also setting focus outlines to navy with enough offset to stay visible against the paper background.

With styling settled, I'm drafting the empty-state copy for each section (people, expenses, balances, settle up) and planning the HTML skeleton—header outside main, with main wrapping the rest of the app content.

I'm working through the person-add form layout, expense item display (description, payer, split details, remove button), and starting on a small DOM helper function to build elements with attributes and children for the JS.

For balances, I'm designing a diverging bar visualization centered on a track, with teal fill extending right for someone owed money and extending left for someone who owes, scaled relative to the largest balance. I'm also adding accessibility touches like aria-hidden on decorative bars, a proper lang attribute, and a viewport meta tag, then starting to sketch a boat-themed SVG brand mark.

