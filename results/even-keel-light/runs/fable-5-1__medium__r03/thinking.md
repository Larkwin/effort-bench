I'm mapping out the full design: people must be unique and trimmed, expenses need validated amounts with payer and split selection, splits divide into integer cents with remainders distributed to earlier-added people, and the list displays newest first with removable entries. I'm also planning balance calculations with a greedy settle-up algorithm, currency formatting via Intl.NumberFormat for CAD, and persistence through localStorage.

For the visual design I'm settling on a navy and signal-orange palette with Fraunces for headings and IBM Plex Sans for body text, using tabular numerals for money values. I'm deciding to use a text input with inputmode="decimal" for amounts so I can reliably validate the string format rather than relying on number input quirks.

For the split checkboxes, everyone defaults to checked, new people added default to checked too, and I need to preserve existing checkbox states on rerender while resetting everything after a successful submission but keeping typed values on error. For settling up I'm using a greedy two-pointer approach sorting creditors and debtors to minimize transfers to at most n-1, and I'm skipping person deletion entirely to avoid complications with expense references.

Now I'm deciding on storage key naming, expense ordering (newest first via reversed display), and how to handle error messaging with conditional rendering plus aria-live and aria-describedby for accessibility. For the overall layout I'm sketching a header with branding, then arranging people/balances cards above the expense form and list below.

For structure I'm settling on a people-then-expenses-then-balances flow, with a two-column desktop layout (people and new expense form on the left, expenses/balances/settle up on the right) collapsing to a single stack on mobile. On color, I'm choosing a harbour blue as the primary brand color for headings and buttons, a signal red reserved for accents and focus states rather than marking "owed" amounts as alarming, and a warm off-white paper background with white cards and subtle borders.

I'm checking contrast ratios for the signal red text color against both white and off-white backgrounds to make sure error text stays AA-compliant, while using a calmer teal-green for "is owed" and a neutral slate for "owes" to keep the tone non-alarming.

The Harbour dark blue passes contrast easily for button text, and I'm planning a visible focus outline using the signal color with an offset. Now I'm setting up the data model: people with ids and names, and expenses with description, amount in cents, payer, and split participants, using names as identifiers since that's how the tests reference them.

I'm computing splits by preserving people's addition order, dividing the cents evenly with remainder distributed to the first few people in that order, then calculating balances by adding what each person paid and subtracting what they owe, and finally settling debts by matching creditors and debtors by amount to minimize transactions.

Now I'm planning the render functions for people, expense forms, expenses list, and balances, all funneling through a single render call that preserves existing state. For amount parsing, I'm writing a function that strips dollar signs and commas, validates the format with a regex, and converts the string into integer cents, rejecting invalid or zero amounts with distinct error messages for non-numeric input versus other issues.

I'm working out the UI details: how expense form errors focus on the first invalid field, how the people list displays names, how expense items show description and split info with accessible remove buttons, and what empty-state messaging should appear when no people exist yet or before an expense can be logged.

I'll skip disabling the expense form when there are no people and instead rely on validation messaging to prompt adding someone first. I'm also drafting empty states for the expenses list, balances, and settle-up sections, plus considering a confirm-protected "Start a new trip" reset button in the footer.

Now planning the mobile-first layout: a container capped at 1100px that shifts to a two-column grid on wider screens, a header with "Even Keel" branding in Fraunces type and a tagline, and checkbox chips for selecting who's splitting each expense, along with a quick "select all / none" toggle.

I also want to keep select-all/none as simple "Everyone"/"No one" buttons, preserve the payer selection if still valid, add an aria-live error region, use form submission so Enter works, escape names for safety, and represent balances as signed cent integers. Pulling in Fraunces and IBM Plex Sans via Google Fonts with preconnect, then writing the full implementation.

