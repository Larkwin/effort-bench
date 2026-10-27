I'm planning out the full app structure: adding people with validation against duplicates, handling expense entry with payer/split logic, computing signed balances, and implementing a greedy settle-up algorithm, plus persisting state with localStorage.

For splitting, I'll use integer cents with remainders distributed by the order people were added, skip person removal for simplicity, and parse amounts with a regex allowing up to two decimals. Balances render with Intl.NumberFormat for CAD, and I'll make sure form state is preserved across re-renders when validation errors occur.

Checkboxes and payer selects need to re-render when people are added, so I'll preserve existing checked states and default new people to checked, resetting to all-checked after a successful expense submission. The expense list will show description, amount, payer, and the split participants, with error containers using aria-live and a test id only present when a message is shown. For layout I'm settling on a 720px max-width container with Paper/Rope-themed panels, 6px radius, and a defined type scale with the wordmark sized larger on desktop.

Now I'm checking color contrast ratios for the button palette—Signal, Fog, and Kelp against white backgrounds—computing relative luminance for each to confirm they meet accessibility thresholds, with Signal and Fog both landing around a 5:1 ratio.

I'm planning the form layout, making expense and amount fields sit side-by-side on wider screens but stack on mobile, and designing the split-between checkbox group as a fieldset. I'm also drafting the empty-state copy for each section—people, expenses, balances, and settle-up—to guide users when there's no data yet.

Now I'm structuring the lists with proper test IDs for people and balance items before writing it all out.

