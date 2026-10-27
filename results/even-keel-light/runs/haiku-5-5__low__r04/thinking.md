I'm sketching the data model for people and expenses, planning to validate names for uniqueness and parse amounts carefully into integer cents to avoid floating-point errors.

For splitting, I'll divide the total evenly among selected people with any remainder cents distributed to the first few in order, then compute each person's balance as what they paid minus their share. For settling up, I'll use a greedy algorithm matching creditors and debtors to minimize the number of transfers, since balances always sum to zero.

I'm planning localStorage persistence under a versioned key, and deciding to skip person removal/renaming to avoid complicating existing expenses. I want error messages to appear inline near each form, preserving user input on failure rather than resetting fields, and keeping payer/split controls in sync when people are added without losing existing checkbox state.

I'm settling on a warm "Even Keel" visual theme with navy, signal red, and teal accent colors, checking contrast ratios for accessibility, and pairing a serif display font with a clean sans body font via Google Fonts.

Now I'm working out the HTML structure: a main wrapper containing a header, then card sections for people, add-expense form, expense list, balances, and settle-up, arranged in a responsive grid that stacks on mobile and splits into columns on larger screens.

