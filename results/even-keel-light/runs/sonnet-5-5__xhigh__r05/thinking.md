I need to plan the full HTML structure carefully, covering how people get added with validation (trimmed, non-empty, unique names ignoring case), and how form errors should appear and disappear using a shared test ID across both the person and expense forms.

For the expense form, I'm working out the validation rules: a required description, an amount in CAD limited to two decimal places and stored in integer cents, a single payer, and a split among one or more selected people with everyone included by default.

I'm deciding to use a plain text input with inputmode="decimal" instead of type="number" so tests can fill arbitrary strings without Playwright throwing errors, and I'm refining the regex to accept whole numbers and up to two decimals while rejecting negatives, zero, and malformed values like "1e3" or too many decimal places.

I'll also allow comma thousand separators with a stricter grouping regex, and cap the maximum accepted amount so cents stay well under JavaScript's safe integer limit. For splitting, I'm computing base cents per person plus distributing leftover remainder cents one each to the first selected people in trip order.

On people management, I'm deciding to skip removal entirely for simplicity, though I briefly consider allowing deletion only for people with no linked expenses to handle typos—ultimately weighing whether that extra complexity is worth it given the spec doesn't require it.

I'm also thinking through color accessibility calculations for the palette, checking contrast ratios between candidate colors like a navy harbour tone, a signal accent, teal, and cream backgrounds to make sure text remains readable (WCAG AA). I'm settling on navy for "owes" and teal for "is owed" balances, reserving the signal color exclusively for primary actions like settling up, since debt shouldn't read as alarming.

For typography, I'm weighing serif/sans pairings that feel like an honest ledger rather than a generic SaaS product—considering Newsreader for headings with a grotesque sans like Hanken Grotesk for body text, and thinking about tabular figures support for displaying money consistently.

