I'm planning out a self-contained HTML app: people get added with trimmed, unique names and inline validation errors, while expenses require a description, a positive amount with at most two decimal places, a payer, and a split among selected people computed in integer cents with remainders distributed in trip order, listed newest first and removable.

For balances, I'll compute paid minus share with testids for person and cents, then settle debts using a greedy algorithm that matches debtors and creditors to guarantee at most n-1 transfers. I'm also setting up money formatting via Intl.NumberFormat for CAD, persistence through localStorage, empty states, and responsive accessible design using a navy and signal-orange palette with a characterful serif for headings paired with a clean, honest sans-serif like IBM Plex Sans for the body, leaning toward tabular figures for money.

I'm checking the contrast ratio of the signal orange against white and off-white backgrounds to make sure text stays accessible, calculating luminance values to confirm it clears AA thresholds for normal text.

Since the orange is borderline on off-white, I decide to reserve it mainly for buttons with white backgrounds and switch to a darker red (#9A3520) for error text, verifying its contrast against the off-white page color comes out well above the minimum. Now I'm computing the luminance of the harbour navy color to check its own contrast properties.

5.5 against ink text — fine, and against the paper background it's about 4.9, still acceptable. For a positive balance indicator, I'm checking a green like #1E6B4A for contrast, which passes well against white, but I'm reconsidering whether color-coding fits the principle that owing is normal rather than alarming — so I'll likely keep both owed/owes states in neutral ink tones, distinguished by label text rather than red/green signaling.

Now thinking through layout: a header with wordmark and tagline, then a desktop grid splitting People/Add-expense forms from Balances/Settle-up/Expenses, collapsing to a single column on mobile ordered as People, Expense form, Expenses, then Balances & Settle up at the end since that's what matters most when the week wraps up.

For validation, I'm deciding on error messages for empty or duplicate person names, rendered through an aria-alert element that only appears when there's an actual error. I'm weighing whether to clear that error on typing versus only on the next successful action, leaning toward clearing it on the next add attempt rather than on every keystroke to avoid interfering with how tests might check persistence.

For the expense form, I'm settling on validation rules for the amount field—accepting decimals with optional dollar signs and commas but requiring a positive numeric value matched by a fairly strict pattern—and using a text input with decimal input mode so I can control parsing without the browser's native number input quirks getting in the way.

For payer requirements, I'll keep the fields enabled even when no people exist yet rather than disabling the form, and instead surface a message prompting users to add people first if they try to submit without any. And for splits, I'll require at least one checkbox selected or show an error prompting the user to choose participants.

New checkboxes default to checked while preserving existing selections on re-render, and after a successful submission I reset the form—clearing description and amount, rechecking everyone, and resetting the payer to the first person. For splitting amounts, I compute each share by dividing the total cents evenly among selected people, then distribute any remainder cents to the first few participants, and I calculate balances based on what each person paid versus their share.

For settling debts, I separate people into creditors and debtors, then use a greedy two-pointer approach matching the largest creditor against the largest debtor repeatedly, which keeps the number of transfers minimal. I'm tagging each transfer with debtor, creditor, and amount data attributes, and I'm deciding to skip person deletion for now unless they have no associated expenses, possibly just disabling the remove button with an explanatory tooltip instead.

For storage, I'm using a versioned localStorage key holding people and expenses, with each expense tracking id, description, amount, payer, split, and creation time, rendered newest-first. I'm planning static HTML forms with dynamic re-rendering for lists, generating expense IDs from timestamp plus randomness, and handling person removal only when they have zero expenses, while using proper labels and fieldsets for accessibility.

I'm wiring up error messages with aria-invalid and aria-describedby, applying visible focus outlines, and using Intl.NumberFormat for CAD currency display. I'm also drafting empty-state copy for the people, expenses, balances, and settle-up sections, and considering whether to surface a total trip spend figure in the header.

Now I'm thinking through the visual design: a harbour-themed top band with the wordmark in Fraunces on cream, a small signal line evoking a water level, and a tagline about splitting costs evenly. I'm settling on white cards with a thin border and rounded corners, with section headings also in Fraunces.

For buttons and accents, I'm debating whether to use the deep navy "Harbour" color or the warm "Signal" accent for primary actions, eventually deciding to keep Harbour as the main button color throughout and reserve Signal for focus rings, the keel line, transfer arrows, and settle-up amounts to maintain consistency.

Now I'm planning the delete buttons as ghost-style with muted text and proper aria-labels, the balance list rows showing name, status, and tabular amounts, and the settle-up display with an arrow between payer and recipient. For layout, I'm setting up a responsive two-column grid above 880px that collapses to a single column on smaller screens, using min-width and overflow-wrap to prevent text overflow with long names.

Writing the HTML structure...

I'm laying out the expense form, balances with settle-up suggestions, and expenses list sections, then planning a two-column CSS grid with named areas so people/add-expense sit on the left and balances/expenses on the right.

For mobile, I'll switch to stacked flex columns preserving a natural reading order: People, Add Expense, Balances, Expenses. For form validation, I'll dynamically insert an error paragraph with role="alert" and matching aria-describedby so screen readers announce it, removing it once the error clears.

Starting the JS logic now, beginning with a storage key constant and the initial state object.

Writing load/save functions and amount parsing...

Now I'm writing a function to split costs evenly among participants, distributing remainder cents to the first few people, then computing running balances per person by iterating expenses and crediting payers while splitting costs among included participants.

Next I'm sketching a greedy debt-settlement algorithm: separate people into creditors and debtors, sort each by amount, then repeatedly match the largest debtor with the largest creditor to produce minimal transactions.

For rendering, I'm planning the person list with name and avatar, plus a remove button only when they have no expenses, and the expense form needs to preserve the payer selection and checked split state while defaulting newly added names to checked.

Expenses display newest first, showing description, amount, and a "Paid by X · Split between Y, Z" meta line, with a delete button using a dedicated test id. I also want to keep focus flow smooth after adding a person or expense, and build DOM nodes safely with a helper to avoid HTML injection from user-entered names.

Now I'm defining the CSS color palette with harbour blues, a signal red accent, paper and ink tones for text, plus hover states and base typography settings.

Setting headings in Fraunces with tabular numerals for money values, giving inputs generous tap targets and clear focus outlines, and designing the masthead with a harbour-blue background, a small signal-colored keel bar above the wordmark, and a lightened tagline color to keep contrast comfortable.

Now I'm planning the card layouts: header rows, balance rows showing name/status/amount with a muted "even" state, settle rows phrased as readable sentences like "Ben pays Ana" with the amount bolded, and expense rows laid out in a grid with the description on the left.

For responsiveness at 360px, I'm checking that forms stack properly—person form inputs and buttons fit with flex-wrap, while the expense form uses a grid with auto-fit columns so the amount and payer fields fit two-across even on narrow screens. For checkboxes, I'm considering flex-wrap chip styling with a tinted background on the checked state, though I need to verify browser support for the `:has()` selector before relying on it.

Now I'm writing the error-handling helper functions: one to display an error message tied to a field via `aria-describedby` and focus it for accessibility, and another to clear errors by removing the message element and resetting `aria-invalid`. I'm also wiring up input listeners on each form so errors clear automatically as the user starts typing again.

For the expense form specifically, I should show only the first validation error at a time. If no people exist yet, I'll show an inline hint like "No one to split with yet" rather than disabling the submit button, and validate on submit instead. I also need to make sure the split checkboxes and payer select regenerate whenever people are added, using the person's name as the checkbox value, and I'm considering whether the payer select needs a placeholder option like "Choose who paid" versus defaulting to the first person.

I'll default the payer select to the first person rather than using a placeholder, since that reduces test failures and mirrors how tools like Splitwise default to "you" as payer. When removing a person, I need to guard against removing someone who's currently set as payer or included in any expense's split. For the expenses list, I'll show a summary header like "3 expenses · $412.00 total" and compute each person's paid versus share amounts to display in their balance row.

I'm writing a small DOM helper function that creates elements with attributes, event listeners, and child nodes in one call to keep the rest of the code concise. I'll use names directly as person identifiers, add a footer noting everything stays local to the browser with a "Start a new trip" reset button, then move on to finalizing the HTML structure with attention to list styling and flex min-width quirks.

Adding focus and chip styles...

I decide to keep the native checkbox focus outline rather than layering an extra one on the chip, simpler and still accessible. For the amount field I'll add a "$" prefix adornment inside the input wrapper with left padding adjustment.

For the balance status, I'll use plain ink color for both "is owed" and "owes" text rather than alarming colors, keeping tone neutral since owing is normal — maybe a subtle left marker for distinction. The transfer line and amounts use tabular Plex, and I'll store the signed cents value as a data attribute for sorting/testing.

No confirmation needed for delete since it's a small list — removing without a dialog is fine, though I'll move focus to the expenses heading afterward for accessibility. Now I'm ready to write out the final document, keeping it concise.

