I'm laying out the core requirements: handling people additions with trimmed, case-insensitive uniqueness and inline errors, expense entry with validation on amount and split selection, computing splits in integer cents with remainder distribution, displaying balances with specific data attributes, and implementing a greedy settle-up algorithm that minimizes transfers.

I'm also planning formatting with Intl.NumberFormat for CAD currency, persistence via localStorage, responsive and accessible design starting at 360px, and choosing Google Fonts (leaning toward Newsreader for headings and Public Sans for body) alongside the navy and signal-red color scheme. I'm working through amount validation logic to parse strings safely into cents without float errors, and figuring out how to preserve payer/split selections when the people list re-renders.

I'm deciding to skip person deletion to avoid complicating balance calculations, and settling on a greedy debt-settlement algorithm pairing the most negative and most positive balances to minimize transfers to at most n-1. I'm also designing error display to dynamically create or remove the alert element rather than just toggling visibility, and planning the overall page structure with sections for people, adding expenses, and viewing expenses.

Now I'm working out the responsive grid layout and checking color contrast ratios for the Signal and Harbour palette colors against white backgrounds to ensure accessibility compliance.

I'm designing the data model for people and expenses, with each expense tracking its payer and split among participants, plus a fair-share algorithm that divides costs evenly and distributes remainder cents to the first few people. I'm also planning the render functions for each section while preserving user selections like the chosen payer and checked split boxes across re-renders.

I'm writing a currency parser that strips dollar signs and commas, validates the format, and converts the string into integer cents, choosing a text input with decimal mode to sidestep number-input quirks. I still need to handle the empty-state messaging when there are no people yet.

For the empty states, I'll keep the expense form enabled even without people, showing a validation error instead of disabling the button, since disabling might trip up test flows. For settlement display, I'll show "Everyone's even" when balances are zero with expenses logged, and a friendlier placeholder message when there are no expenses at all.

