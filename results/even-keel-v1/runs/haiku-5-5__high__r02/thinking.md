I'm planning the full HTML structure, covering validation rules for adding people and expenses, including name uniqueness checks, amount formatting constraints, and the payer/split selection UI.

For splitting costs, I'm working through equal division in integer cents with remainder cents distributed to people in trip order. The expense list should show newest entries first with delete buttons, and balances need signed cent values tracked per person.

For settling up, I'm using a greedy debtor-creditor matching algorithm to minimize the number of transfers to at most n-1, then formatting all currency values with Intl.NumberFormat for CAD, deciding how to display signed balances clearly.

Now I'm defining validation for amount input — requiring plain numeric strings with at most two decimal places, rejecting things like negative numbers, zero, or malformed text, and deciding whether to allow comma thousands separators or dollar signs before settling on a strict numeric regex.

For the split logic, I'm converting dollar amounts to cents, then computing how to divide evenly among selected participants using floor division plus distributing the remainder to the first few people in list order.

I'm deciding not to support removing people to keep scope manageable, since balances derive purely from stored expenses with payer and participant references. For validation, I'll keep the add-expense form visible even with no people added, just surfacing a clear error message if someone tries to submit without a valid payer selected.

For rendering, I'll use a single render function that rebuilds lists from state, but I need checkboxes and the payer select to preserve their current selections when rebuilding, while leaving the person-name input untouched so focus and typing aren't disrupted. New people should default to checked in the split, and the expense form should reset to all-checked after a successful submission but retain entered description/amount values if there's an error.

For focus management after deleting an expense, I'll shift focus to the expense list heading instead of letting it fall back to the body. For errors, rather than having multiple hidden elements sharing the same test id, I'll have each form only insert its error element into the DOM when there's actually an error to show, keeping things unambiguous for selectors.

I'm also adding aria-invalid and aria-describedby on the inputs, and deciding to keep the amount field as type="text" with inputmode="decimal" rather than type="number" so user input like "$12.50" isn't silently mangled by the browser.

For the split fieldset, I'll put data-testid="expense-split" directly on the fieldset wrapping the checkboxes rather than an inner div. For balances, I'm rendering a list where each item carries data-person and data-cents attributes plus readable text like "is owed" or "owes" or "settled up". Transfers get similar list items with data-from, data-to, and data-cents, with fallback messages like "Everyone is even" or a prompt to add expenses when there's nothing to settle.

I'm working out the settle-up algorithm: build a balance map, split into creditors and debtors sorted deterministically by original person order, then greedily match them two-pointer style to minimize the number of transfers.

For persistence, I'm storing everything under a single localStorage key as JSON containing the people array and expenses with ids, descriptions, cents, payer, and split info, with newest expenses unshifted to the front for display order, and defensive try/catch parsing when loading. I also need to make sure expense descriptions are escaped properly when rendered to avoid HTML injection.

For the split display, I'm deciding to show the per-person share amounts alongside names, like listing each person's cents share, which makes the leftover-cent rounding rule visible to users. Name matching for uniqueness will just compare trimmed, lowercased values without other normalization.

Now I'm thinking through the header layout, with a wordmark treatment and a supporting tagline about splitting costs without arguments.

For page structure, I'm organizing sections in order: People, Expenses, Balances, and Settle up, each with their own heading, all wrapped inside a main element with the app test id, and I'm putting the header inside main for simplicity. I'm also settling on a type scale using Fraunces for headings, with the wordmark sized larger than section headings, which are larger than body text and hints.

Since I'm restricted to the defined color palette with no tints or opacity, I'm figuring out hover and focus states using only palette swaps — like having the primary button switch to a different palette color on hover, secondary buttons use a border color change, and focus rings use a consistent outline color and offset. I'm also running contrast calculations between the Fog text color and Sailcloth background to make sure the combination meets accessibility requirements.

I'm checking the Signal button text contrast against Paper, which comes out just under 5 but still passes the 4.5 AA threshold, and verifying Kelp and Harbour combinations also hold up well. Now I'm noticing Rope's border color against white only hits about 1.4 contrast, which fails the 3:1 non-text contrast requirement for UI component boundaries, so I need to reconsider that border choice.

I'm deciding to keep Rope for borders per brand guidelines since the WCAG text requirement only strictly applies to text, not decorative borders, though this is a tradeoff I'm noting. Now I'm setting up the focus ring using a 2px solid Harbour outline with offset, applied via :focus-visible, and starting to style the checkbox with an accent color.

I'm also setting transition timing for hover/focus states, specifying the font imports with fallbacks, applying tabular numerals to money values, and working out the layout spacing and padding system using 8px multiples with responsive breakpoints for panels and main content width. For responsiveness I'm handling the expense item layout at narrow widths, making inputs full-width, switching between grid and stacked layouts for the description/amount row, and adding box-sizing and min-width rules to prevent horizontal overflow.

Now I'm writing copy for empty states across the people, expenses, balances, and settle-up sections, plus defining how balance amounts should be labeled depending on whether someone owes, is owed, or is even.

I'm deciding on currency formatting using Intl.NumberFormat for cents-to-dollars conversion, and planning to use Intl.ListFormat to naturally join names like "Ana, Ben and Cy" in sentences.

Starting the HTML document...

Writing CSS variables and layout styles...

For focus states I'm using a harbour outline for keyboard navigation. Since signal is reserved for primary buttons, errors need to rely on harbour text and borders instead—I'm building an error box with harbour-colored text, an icon, and a bordered container rather than using color alone. I'm also setting up tabular numerals for money display, with positive balances in kelp and negative ones in harbour.

Now I'm working through the list layouts for expenses and people: flex rows with wrapping for small screens, remove buttons with proper aria-labels that start with the visible text, and a fieldset for the split checkboxes with a styled legend and wrapped checkbox pills that meet the 44px touch target minimum.

For the responsive form layout, I'm setting up a grid that collapses to one column on mobile and becomes a two-column layout (description wider than amount) at 600px and up, with the payer field spanning full width below. The submit button stays left-aligned on desktop but goes full-width on mobile, and I'm placing the error message slot right before the button.

Starting the JS now — setting up the localStorage key, a currency formatter using Intl.NumberFormat for CAD, and a helper to convert cents into formatted currency strings.

I'm adding a name-joining helper that uses Intl.ListFormat when available (falling back to a simple comma join) so lists of people read naturally, like "Alice, Bob and Carla." Then I'm writing the load/save functions that read state from localStorage, validating that people are strings and expenses have the right shape before accepting them, with a save function wrapped in try/catch to handle storage errors silently.

Now I'm starting a function to parse amount input...

Still writing parser...

For splitting expenses, I'm dividing cents evenly among selected participants in their stored order, giving the remainder cents to the first few people so totals always add up exactly. For balances, I'm iterating all expenses, crediting each payer the full amount and debiting each participant their computed share, making sure to use the split order saved at expense creation time rather than recomputing it later.

For settling up, I'm writing a greedy matching algorithm that pairs the biggest creditors with biggest debtors, transferring the minimum of what's owed between them until one side zeroes out, which keeps the total number of transactions minimal — at most one less than the number of people involved.

Writing render function...

Now I'm working out how to sync the payer dropdown and split checkboxes whenever the people list changes, preserving the user's previous selections for existing people while defaulting new people to checked. I'm tracking a set of previously known people and previously checked values so the rebuild only resets what's necessary.

I'm fleshing out form submission handlers for adding people and expenses, including validation order (description, amount, payer, split), error messaging, and resetting fields while preserving typed input on failure. I'm also planning the HTML templates for rendering expenses, balances, and settle-up transfers, including escaping values, formatting money with signs, and showing appropriate empty-state messages when there are no people or expenses.

