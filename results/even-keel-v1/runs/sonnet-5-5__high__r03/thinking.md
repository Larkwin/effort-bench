I'm planning the HTML structure, making sure to stick to the approved color palette and verifying contrast ratios for text on the signal buttons meet accessibility standards.

I'm picking Fraunces for headings and IBM Plex Sans for body text, with a simple size scale from 14 to 40px.

For the data model, I'm planning people as an ordered array and expenses with payer, split, and amount, computing each person's share by dividing evenly and distributing any remainder cents to earlier people in trip order; I'm also working out how amount input should be validated and parsed.

Now I'm figuring out the settle-up algorithm: matching creditors and debtors greedily by largest balance first, which guarantees at most n-1 transfers, with deterministic tie-breaking.

For displaying balances, I want zero shown as $0.00 and nonzero amounts formatted with a minus sign (using the proper minus character) for people who owe money, plus clear "is owed" / "owes" labels.

Errors should only render in the DOM when present, using a data-testid element, with invalid inputs getting a Harbour-colored border and aria-invalid/aria-describedby wiring. On error I want to preserve what the user typed rather than resetting the form, only clearing fields on success.

On successful add, I'll clear amount and description but keep the payer, then reset the split selection to everyone checked by default. For the split checkboxes, I need to maintain selection state in memory with a set that persists across re-renders—new people default to checked, existing selections stay as-is, and after adding an expense the set resets to include everyone, while the payer selection persists with the first person as default.

I'm deciding not to re-render the description/amount inputs since they're static, only updating the payer dropdown and split container so focus isn't lost. For the empty-people case, I'll keep the expense form visible and enabled rather than hiding it, since tests might still interact with it even with no people added.

I'm settling on validation ordering: description, then amount, then payer, then split selection, each with its own clear error message. For no people selected, I'll add "Add a person first." as the most robust fallback error.

For the expense list, newest entries show first, each displaying description, amount, who paid, and who it's split between by name, plus a remove button with an accessible aria-label referencing the specific expense. Deletion happens without a confirmation step.

After deleting an expense, I'm handling focus by moving it to a tabindex -1 heading on the list section rather than leaving focus lost. For layout, I'm deciding on a header with the wordmark "Even Keel" in Fraunces, a supporting tagline, and ordering the sections as People, Add expense, Expenses, Balances, Settle up, all inside bordered paper-style panels with consistent padding and spacing between them.

Now I'm weighing contrast concerns for input borders — Rope on white is too low contrast to meet 3:1 for UI component boundaries, so I'm considering using Fog instead for input and checkbox borders while keeping Rope for panels, accepting that either choice could be seen as a reasonable interpretation of the brand guideline.

For the checkboxes, I'll use native inputs with Harbour as the accent color, laid out as a grid inside a fieldset with a "Split between" legend, placing the test id on an inner div so only that content updates on re-render. The add-person form will have a name input and submit button in a row that wraps on mobile, and the people list will render as list items with overflow-safe text wrapping for long names.

I'm planning balances as list items showing name, amount, and status ("is owed"/"owes"/"is settled up"), with tailored empty states depending on whether people or expenses exist yet, plus a settle-up section listing who pays whom. I'll build these elements via DOM helpers using textContent to avoid escaping issues, store data in localStorage under a versioned key with validated structure, and check for duplicate names case-insensitively.

For error messaging I'm settling on "already on the trip" wording, keeping typed input on error but clearing and refocusing on success. I'm formatting money with Intl.NumberFormat for CAD with tabular-nums styling, writing a helpful amount hint, and deciding to keep the select native with custom padding/border rather than fully restyling it. For buttons I'm using the Signal color for primary actions with fixed sizing, now working out hover states given the limited palette.

I'm defining a secondary "Remove" button style with Harbour text and Fog border, setting up focus-visible outlines instead of box-shadows, and adding smooth transitions for background and border color changes. For responsive layout I'm setting a 720px max-width container with side padding that adjusts below 600px, laying out expense rows with description and amount in a grid plus a secondary meta line, and designing balance rows so amounts use both color and text labels like "is owed" to avoid relying on color alone for meaning. I'm also sizing headings with Fraunces, considering a larger 40px treatment for the wordmark.

Setting up error message styling with a bordered, padded message using Sailcloth background and Harbour text, tied to an aria-live container so screen readers announce it, and ensuring the invalid field gets aria-invalid plus focus when an error occurs.

Writing state persistence logic...

For balances and settlement I'm computing each person's share of an expense by dividing cents evenly with remainder distribution, then tallying who owes what by subtracting shares from what they paid. The settle-up algorithm repeatedly matches the largest debtor with the largest creditor, transferring the minimum amount between them until all balances are resolved, and I'm organizing render functions for people, payer/split selection, expenses, balances, and settlements that all get triggered through a single renderAll call.

I'm wiring up the payer and split checkboxes so they stay in sync with the people list, defaulting the payer to the first person and preselecting everyone in the split by default, with an empty-state hint when there are no people yet. For adding expenses I'm validating the description and amount, pulling payer and split values from the DOM in trip order, generating a unique id, resetting the form afterward, and showing newest entries first — plus handling error display and clearing for the form fields.

Now I'm writing an amount parser that strips currency symbols and commas, rejects more than two decimal places, caps the integer portion to keep values safe, and converts to cents; I'm also wiring up accessible hints and error containers via aria-describedby, formatting the zero-balance case as "settled up," and adding the delete button and handler for individual expenses before moving on to CSS and section headings.

Still writing layout and styles...

