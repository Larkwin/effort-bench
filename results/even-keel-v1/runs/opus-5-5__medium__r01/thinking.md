I'm planning the full HTML structure now, sticking to the limited color palette, using Fraunces and IBM Plex Sans from Google Fonts, fixed type sizes, and designing the data model for people and expenses.

I'm working out the split calculation to divide amounts evenly in cents with remainder distribution, plus a greedy debt-settlement algorithm that minimizes transfers, and a regex to validate currency input while handling edge cases like trailing decimals.

I'm listing out the specific error messages for each validation failure, and planning how the error element should toggle visibility with proper ARIA attributes. I'm also thinking through how checkbox states persist across re-renders when people are added or expenses are submitted.

Now I'm working out the expense list display and formatting details—ordering newest first, how remove buttons should be labeled, button styling by role, and how balances should be formatted with signed amounts (owed vs. owes) using proper currency notation.

Balances are shown for everyone on the trip, including people settled at zero. I'm also checking contrast ratios for the Kelp, Fog, and Signal colors against their backgrounds to make sure text stays readable.

I'm working out the empty states too: no expenses prompts adding one, zero balances say everyone's even, and no people prompts adding them to the trip. I'm also planning the transfer phrasing and the overall page layout—wordmark header, supporting tagline, and the panel structure for people, expenses, balances, and settle up sections.

Now I'm detailing panel styling (rounded corners, padding), form rows with flex-wrap for inputs and buttons, and the split checkbox fieldset. I'm also settling on focus-visible outlines for accessibility and accent-color styling for checkboxes, plus heading typography using Fraunces.

Moving to type scale decisions for headings and body text, picking the Google Fonts import for Fraunces and IBM Plex Sans while skipping preconnect to keep things minimal. I'm also planning localStorage persistence under a versioned key with try/catch validation, and thinking through focus management after deleting an expense so keyboard focus lands somewhere sensible.

I'm making sure names get escaped safely using createElement rather than innerHTML, and that split remainders follow the stable order of the people array. I'm adding an aria-live status region for actions like adding a person, handling mobile word-wrapping for long names, and giving the amount field a currency label with a descriptive hint tied via aria-describedby. For the payer select, I'm defaulting to the first person rather than a placeholder, while still keeping validation in place.

Rather than disabling the add-expense button when there are no people (which breaks keyboard focus), I'm keeping it enabled and showing an inline error instead, along with a helpful empty-state hint. Now I'm writing the render function for the people list, payer options, split checkboxes, and expenses list, along with the balance computation that nets each person's paid and owed amounts, and a settle-up algorithm that pairs creditors and debtors by sorted amounts, plus a helper to display form errors by targeting each form's error container.

For error display, I'm setting aria-invalid on the relevant field and focusing it, with the split checkbox error focusing the first checkbox, and deciding to clear errors only on next submit rather than on every edit. I'm also laying out each expense item with description and amount on top and a meta line showing who paid and who split it, plus a remove button, while working through which colors are allowed for hover states given the limited palette.

I'm deciding to wrap the header inside the main element for simplicity, using a label-wrapped checkbox layout with flex-wrap and adequate spacing for touch targets, and setting up currency formatting for Canadian dollars.

For balances, I'm planning signed amounts colored in Kelp for positive and Harbour for negative, paired with "is owed" or "owes" status text, persisting state to storage after every change, and enforcing maxlength limits on the name and description fields before moving into the JS logic for loading saved state.

Now I'm building out the data model: people as string arrays, expenses with id/desc/cents/payer/split/createdAt fields rendered newest-first, with sanitization filtering invalid entries and a splitShares function that divides costs evenly with remainder distribution. I'm also adding a case-insensitive uniqueness check for names.

I'm working through UI details: trimming input, preserving checkbox state across renders, managing focus after deleting an expense (jumping to the next button or heading), and setting up a live region to announce additions and removals for accessibility.

