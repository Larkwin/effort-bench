I'm planning the single-page app's structure: adding people with unique-name validation, expense entry with payer/split checkboxes and strict amount validation, integer-cents splitting with leftover distribution by trip order, and computing balances from paid versus owed shares.

I'm working through a greedy settle-up algorithm pairing largest debtors with largest creditors, formatting currency with Intl.NumberFormat for CAD, and handling localStorage persistence with validation on load. I also check color contrast ratios for the brand palette against backgrounds to ensure accessibility, and plan form error messaging, empty states, and re-render logic that preserves user selections when people or expenses change.

Writing data layer functions...

