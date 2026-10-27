I'm thinking through the visual design: a warm off-white paper background with navy ink text, using the signal red-orange sparingly as an accent rather than for negative balances, since owing money should feel normal rather than alarming.

I'm checking color contrast ratios to make sure the signal accent and harbour navy meet accessibility standards against the paper background for both text and buttons.

For typography, I'm weighing a trustworthy, steady feel — considering Fraunces or Source Serif for display headings paired with a civic sans like Public Sans or IBM Plex Sans for UI, plus a monospace for tabular figures. Leaning toward Fraunces for display type with a coherent, engineered pairing rather than overused combos like full Plex family.

Now I'm sketching the overall layout: a header with the "Even Keel" wordmark, a balanced-hull mark, and a tagline about fair cost splitting, followed by a trip summary bar, then a desktop grid separating people/expense entry from balances/settle-up, possibly structured as a clear three-step flow.

For the balance visualization I like the idea of a horizontal "keel" bar centered on zero, extending right for money owed and left for what someone owes — reinforcing the nautical "even keel" idea that owing isn't a problem, so I want to avoid alarming red tones and instead lean on calmer navy and warm sand hues, using the Signal color sparingly for primary actions rather than negative balances.

For settle-up logic, I'm planning a greedy matching algorithm that pairs the largest debtor with the largest creditor each round, which guarantees at most n-1 transfers to zero everyone out, with deterministic ordering by amount and then by person.

I'm weighing whether to add person removal, but worried it could break tests that check the person element's exact text content—if I add a "Remove" button inside the same testid element, the text would become "AnaRemove" instead of just "Ana". I'm considering wrapping the name in its own inner span so the testid element's text stays clean while still allowing a separate remove control, limited to cases where that person has no expenses.

For the form error element, I'm deciding to only render it when an error actually exists rather than hiding it with styling, so tests checking for its presence or absence behave predictably.

I'm also weighing whether typing in the field should clear the error automatically. I'll go with clearing it on input since that's the expected UX pattern, though I want to make sure that doesn't conflict with test sequences that check error persistence immediately after a failed submission.

I'll scope errors per-field rather than one global message, placing each beneath its relevant input and focusing the first invalid one. If several fields fail at once, multiple error elements can show simultaneously.

Successful actions should clear all errors. I'm also considering edge cases like adding an expense with no people — rather than disabling the button (which would break tests waiting for it to be clickable), I'll keep the form always rendered with testids present, showing a placeholder/empty-state message and an error if someone tries to add an expense prematurely. For the payer select, I need to decide whether it defaults to the first person or requires an explicit choice, since tests may rely on either behavior.

I'll skip the placeholder option and just default the payer select to the first person whenever people exist, keeping the selection persistent across submissions. For splits, everyone should be checked by default including newly added people, and after submitting an expense I'll reset description, amount, and split checkboxes back to all-checked, while leaving the payer selection as-is unless there's a reason to reset it too.

I also need to preserve checkbox states when re-rendering the split section after adding a person, only re-rendering the people-dependent parts rather than the whole form. For the amount field, I'm switching to type="text" with inputmode="decimal" instead of type="number", since Playwright can't fill invalid characters into a number input but needs to test rejection of bad values like "abc" or "-5" — I'll keep validation lenient, maybe allowing comma thousands separators.

I'm working out the parsing logic: trimming, stripping a leading dollar sign, handling comma-grouped numbers, and allowing leading/trailing decimal points like ".5" or "5." as valid. Decimal places beyond two should trigger a clear "at most 2 decimal places" error, negative or zero values get a "greater than $0" message, non-numeric input gets a "like 24.50" format hint, and I'm considering capping unreasonably large amounts.

I'm settling on converting the validated amount into integer cents by parsing the integer and decimal portions separately, with a length check to guard against overflow. For description and name fields, I'm requiring non-empty trimmed values, adding a generous max length, and planning to enforce case-insensitive uniqueness for person names while considering whitespace normalization.

I'm working out friendly, specific error messages: empty name prompts, duplicate name messages that reference the existing person's casing (so "ana" vs "Ana" gets a clear "already on the trip" note), and expense validation messages for missing people, empty descriptions, and empty or invalid amounts—each phrased with helpful examples. I also want rejected inputs to stay in the field, and successful submissions to clear and refocus.

Now I'm thinking through amount validation specifics (must be a positive number with at most two decimals), payer/split selection requirements, and where errors should visually attach—under the relevant field, with focus moving to the first invalid element, and for split errors, to the first checkbox. I'm also weighing whether combining aria-live regions with focus-based aria-describedby causes redundant announcements for screen readers, deciding it's an acceptable tradeoff if it means errors are reliably communicated.

For splitting money evenly, I'm working out a plan: divide the amount into equal cents per person in trip order, then distribute any leftover pennies to the first few people in that order so totals always add up exactly. I'm also settling the data model—people and expenses stored with stable ids, with payer and split selections mapped from names to ids at submit time—and considering whether to allow removing a person, deciding it should be blocked if they're already involved in an expense to avoid data loss.

I'm also planning the expense list display: newest entries first, showing description, amount, who paid, who it was split between (listing names rather than vague labels), and each person's share, accounting for rounding so shares don't always look identical.

For deleting expenses, I'm adding a clear "Remove" button with a descriptive aria-label, plus an undo toast so accidental deletions are recoverable, and I'm thinking through where focus should land afterward for accessibility.

For resetting a trip, I'll skip a native confirm dialog in favor of an inline two-step confirmation that's more visible and keyboard-friendly. For balances, each person shows their paid amount, share, and resulting balance with a "gets back"/"owes"/"all square" label, plus a signed bar chart centered on a zero axis to visualize who's over or under.

I'm now working through money formatting details — using Intl.NumberFormat for CAD currency, and deciding whether to use a true minus sign or a hyphen so the formatted negative amounts stay consistent with what tests might expect, while pairing the number with plain-language labels like "owes" or "gets back" for clarity.

For the settle-up view, I'm planning a transfers list showing who pays whom with data attributes for amounts, plus empty states for when there's nothing to log yet or when everyone's balances are already even, and maybe a copy-to-text button for sharing the settle-up summary with the group.

I'm implementing the greedy debt-simplification algorithm: repeatedly matching the largest creditor with the largest debtor, transferring the minimum of their balances, zeroing out whoever's settled, and re-sorting until everyone's at zero — guaranteeing at most n-1 transfers since balances sum to zero exactly.

For persistence, I'm using localStorage with a versioned key, wrapping load/save in try/catch to handle corrupted data or private-browsing failures gracefully, and considering listening for the storage event to keep multiple tabs in sync.

Now I'm working out the color palette — a harbour-blue ink for headings, a warm paper background, a rust-orange signal color for accents and buttons, and checking contrast ratios to decide which teal-green works for positive balances versus which tone best represents amounts owed.

I check muted text contrast against the paper background and confirm it passes comfortably, around 5.16 on cream and 5.7 on white. For type, I decide Fraunces suits the wordmark, headings, and trip total display, while balance amounts use Public Sans with tabular numerals for clarity.

For the header mark, I'm sketching a simple logo concept: a horizon line with a small boat hull and keel, or alternatively a level motif, set against a red-orange disc in the Harbour band alongside the paper-colored wordmark.

I settle on "Even Keel" with the hull mark, plus a header tagline and trip stats shown on the right. Then I work through the layout grid for desktop versus mobile, deciding the content order should prioritize outcomes (Balances, Settle up) before the full expense history, while keeping DOM order matched to visual order for accessible keyboard focus flow.

I resolve the accessibility concern by grouping desktop columns into an "inputs" wrapper (People, Add expense) and an "outputs" wrapper (Balances, Settle up), with the Expenses section spanning full width below, so DOM order and visual reading order align cleanly.

For section labels, I'm leaning toward plain, specific headings like "Who's on the trip," "Log an expense," "Where everyone stands," "Settle up," and "Expenses" rather than numbered steps. I'm also deciding to make the Settle up card use a dark Harbour background to signal it's the outcome/answer, checking that paper text and muted text colors against that dark background still meet strong contrast ratios.

For the balance cards I'm sketching a responsive grid where name and amount sit on one row with the bar below on narrow screens. For empty states, I'm writing friendly copy for when there are no people yet, deciding to disable the payer select with a placeholder option when there's no one to choose from, and planning similar reassuring messages for balances before any expenses exist.

I'm working out balance display for people-but-no-expenses cases, showing $0.00 rows since they're still testable and useful, plus settle-up and expense-list empty states, and drafting reassuring copy explaining that owing isn't a big deal and just reflects someone covering you temporarily. For the split checkboxes, I'm designing pill-styled labels wrapping native checkboxes with accent coloring, using :has() for checked styling, plus quick "Select all" and "Clear" buttons.

I'm adding a live preview line showing each person's share under the split section, planning the amount field with currency prefix/suffix adornments, and laying out the form responsively. I'm defining button styles with Signal-colored primary actions and Harbour outlines for secondary ones, then checking focus-visible contrast ratios — finding Signal doesn't meet contrast on dark Harbour backgrounds and considering a lighter accent for that case.

I'm introducing a context-aware focus color variable that switches to a lighter signal tone in dark sections to maintain sufficient contrast, and setting checkbox accent colors to Harbour. For the remove button, I'm making sure the accessible name includes the visible "Remove" text plus the expense description via a visually-hidden span to satisfy label-in-name requirements. I'm sketching the expense row layout showing description, amount, payer, split breakdown, and remove button, plus the header's running trip total and a toast notification positioned at a fixed spot.

Now I'm wrestling with keyboard accessibility for the delete-undo flow: a floating toast at the bottom of the viewport would be out of logical tab order since its DOM position wouldn't match its visual placement, so I'm considering instead placing an inline status notice with an Undo button directly above the expenses list, within the natural document flow, even though that could be out of view if the user is scrolled further down the list.

I'm deciding against an auto-dismiss timer since it risks pulling focus away mid-interaction, so instead I'll keep the notice persistent until either dismissed or overridden by another mutation like adding an expense or person. For restoring, I'll store the removed expense along with its original index so Undo reinserts it in the right position, and I'm checking that this doesn't conflict with how tests might be locating expense elements.

I'm working through edge cases: if removing an expense makes a person uninvolved and they get auto-removed, undo could reference a missing person, so any other mutation (especially person removal) should simply clear the pending undo state. For the reset trip flow, I'm designing an inline confirmation in the footer with clear destructive warning text, deciding to place and focus the "keep trip" option first for safety, and making sure reset also clears localStorage. I'm also nailing down test-relevant details -- the person testid should wrap the name text, payer option values/text should both be the name, and checkboxes should use the name as their value with matching label text.

Now I'm thinking about the DOM structure: balances, transfers, and expenses each get their own testid elements with data attributes (person, cents, from/to), and expenses include a delete button with its own testid. The tricky question is whether the `<main data-testid="app">` wrapper needs to contain everything with testids, since scoped locators might query within it -- I'm weighing whether header and footer content (which lack testids) can safely live outside main, or whether I should move more into main to be safe.

I decide to keep a minimal brand header outside main and move trip summary, functional sections, and the reset button inside main, with a small footer note outside. I'm also adding a skip link, handling mobile layout at 360px with overflow-wrap and box-sizing fixes so nothing overflows horizontally, and planning the person-name form to submit on Enter via a native form submit handler with a labeled add-person button.

For the expense form, I'm using `required` with `novalidate` so native validation is suppressed but screen readers still announce required fields. I'm also designing the render logic so people controls only rebuild when the list changes, preserving payer selection and checkbox state while defaulting new people to checked, and after adding an expense I reset the form fields, keep the payer, refocus the description input, and announce the addition through a live status message.

Now I'm working out balance computation: summing each person's paid and share totals by iterating expenses, splitting each expense's cents across the involved people in trip order, and handling leftover cents by giving the extra penny to whoever was added earliest among the split participants. For display, when the split divides evenly I'll show a simple "$X each" message, but when there's a remainder I want specific wording like "$33.34 for Ana; $33.33 each for Ben and Cara" rather than a vague average.

I'm also deciding how to handle larger groups so the text doesn't get unwieldy—using phrasing like "for everyone else" when the remainder list is long, and special-casing single-person splits as "for Ana only." I want to avoid saying "split between everyone" since that phrase could become inaccurate if people join the trip later, so I'll always list actual names of who's included in each split.

For the settle-up section, I'm designing a readable text format like "Ben pays Ana $12.00" with a visual arrow, plus a "copy list" button using the clipboard API with a textarea fallback so people can paste payment instructions into a group chat. I'm also considering adding a trip summary strip showing the total and expense/people counts, deciding whether it belongs in the header band or inside the main content area.

I'm thinking through edge cases for localStorage persistence: validating that loaded expense data has proper string IDs, positive integer cents, a valid payer, and non-empty split selections, dropping anything malformed. For ID generation I'll use crypto.randomUUID with a timestamp-based fallback, and I'm making sure all user-provided names get rendered via textContent or setAttribute rather than innerHTML to avoid injection issues with special characters in data attributes like data-person.

For the settlement algorithm, I'm settling on a greedy approach that caps transfers at one less than the number of people with nonzero balances, sorting by absolute amount descending and breaking ties by original trip order for consistent results.

Now I'm defining the color palette as CSS custom properties, working through harbour blues, signal oranges, sea greens, and paper neutrals, and calculating contrast ratios to make sure input borders meet the 3:1 non-text contrast requirement against the background.

For typography, I'm setting Fraunces for headings with specific weights and letter-spacing, Public Sans for body text and labels, and tabular numerals for any numeric displays, while noting how to configure the Fraunces variable font axes through the Google Fonts request. I'm also sketching card styling with a white background, subtle border, rounded corners, and layered shadow, plus a nice idea for a decorative header stripe inspired by a boat's painted waterline.

Now I'm working out copy for each section: a "Where everyone stands" heading with a helper note clarifying that a negative balance just means someone's owed money, a "Settle up" heading explaining the minimal-payment approach, and an "Expenses" heading with a count badge and running total. I'm starting to lay out the balance row markup showing each person's name, their running total, and a visual bar representing their position relative to even.

For each balance row I'm defining three states: "Gets back $X" for positive, "Owes $X" for negative, and "All square" for zero, paired with a smaller "Paid $X · Share $X" detail line, plus a bar that fills from a center line outward in sea or harbour color depending on sign, with a small dot marking zero balances. I'm also setting the amount text colors to match — sea green for positive, harbour ink for negative, muted for zero — and starting to style the dark settle-up card with harbour background and a list of payment entries.

For each settle-up row I'm laying out "payer pays recipient" on the left with a large tabular amount on the right, an arrow icon colored signal-light, thin divider lines between rows, and a copy button styled as a paper outline on the dark card. Now I'm moving to the site header, building the brand mark with wordmark and tagline alongside a trip-stats summary (total, people, expenses count), with a more compact mobile version stacking stats in a row beneath the brand, then starting the main layout grid with an input column.

I'm working out the responsive grid: on desktop the input column stays slightly narrower than the output column, deciding against a sticky output panel and against a three-column layout. For the people section I'm designing pill-style chips for each person with a small "×" remove button that has a proper accessible label while keeping the touch target large enough per accessibility guidelines.

I'm also thinking about adding initial-letter avatar circles for each person using a calm color palette, reused consistently in both the people chips and balance rows, with the initials kept separate from the testid span for cleanly structured markup. I'm adding a count label showing how many people are on the trip, plus a gentle note explaining that someone can only be removed before they're part of an expense. Now starting the add-expense form with a labeled description field for what the expense was for.

Writing form markup...

I'm now double-checking contrast ratios for placeholder text and deciding on button labels like "Select everyone" and "Select none" for clarity. I'm also working out how the split preview text should behave dynamically based on amount validity and number of people selected, distinguishing it from error messaging since it has no test id.

Then I move on to structuring the expenses list itself—each expense item needs a description, amount, payer/split metadata, per-person share, and a remove button, with a responsive grid layout on desktop separating description, amount, and remove controls into columns.

I add a low-key reset section at the bottom for starting a new trip with inline confirmation, plus a trust-building footer clarifying everything stays local in the browser, and a hidden live region for screen reader announcements.

Now I'm setting up the JavaScript with a storage key constant and a currency formatter for CAD amounts.

I'm writing a load function that reads from localStorage, parses JSON safely, and sanitizes the data inside a try/catch so corrupt storage doesn't crash the app. For save, I'm wrapping setItem in a try block too, flagging a user-facing note if storage fails (e.g. quota exceeded).

For name matching, I'm normalizing names with NFC and lowercasing them so duplicates are caught regardless of accents or capitalization. The addPerson function trims input, rejects empty or overly long names, and checks for existing matches—suggesting the user add a last initial if they're adding someone with a similar name.

Now I'm working through error handling details: I want a setError/clearErrors pattern that removes form-error elements and clears aria-invalid flags, tracking the current error state. For accessibility, I'm deciding to statically include the error slot id in aria-describedby alongside hints, since an empty error element just won't be read aloud—simpler than toggling it dynamically. For the split fieldset, I'm considering whether fieldset-level aria-describedby works reliably or if I should attach it to each checkbox instead, since fieldset support is inconsistent.

I'll keep each checkbox's describedby pointing just to the error slot rather than also the preview text, to avoid chatty announcements, relying on the live region for updates. The live region should use aria-live="polite" so errors get announced without interrupting, and I'm reasoning that clearing then re-inserting the same error text should still trigger re-announcement even if the message repeats. I'm also planning input listeners to clear errors as soon as the user corrects the relevant field—person name, expense controls, or any checkbox change clearing the split error.

Now I'm thinking through edge cases for when validation runs: typing a valid amount after an error should clear it before the next submit attempt, and similarly for names, walking through test scenarios to confirm clearing on input won't break expected flows like duplicate rejection or sequential fills. I'm starting to sketch the addExpense function, calling clearErrors first, then checking for the no-people case and figuring out which error slot that failure should populate.

For the no-people error, I'm deciding to put the message in a form-level slot above the submit button rather than moving focus to the person-name input, since jumping focus there would feel disconnected from where the error is shown — better to leave focus alone and let the live region announce it. Then I'll validate fields in order (description, amount, payer, split), surfacing and focusing the first invalid one, since tests likely just check that a form-error exists and inputs retain their values without incrementing the expense count. For the payer select, since there's no placeholder option and people always exist when this validation runs, I need to match the selected value against the person by name.

Split selections come from checked boxes, mapped to person IDs in the people's display order. Adding an expense builds a record with id, description, amount in cents, payer, split IDs, and a timestamp, then pushes it onto the expenses array — rendered newest-first by reversing for display while keeping insertion order intact for undo purposes. After adding, I reset the form, update the preview, refocus the description field, and announce the addition via the live region with the description, amount, and payer. Deleting an expense removes it from the array, stores an undo snapshot, re-renders, and announces removal with an undo hint; undoing reinserts it at its original index, clears the undo state, restores focus to its remove button, and announces that it's been restored. Removing a person requires checking they're not involved in any expense first before allowing removal, with its own undo handling.

Now I'm laying out the render functions — separate renderers for header stats, the people list, payer/split controls, balances, settle-up suggestions, and the expense list, plus a preview updater. The full render() call triggers most of these, but renderControls gets called selectively (on people changes and at init) and can skip re-rendering if the people signature hasn't changed, avoiding unnecessary DOM churn. Balances and settle amounts get computed via computeTransfers, with bar widths scaled against the max absolute balance. For the copy-to-clipboard feature, I'm building a plain-text summary of who-pays-whom, then using the Clipboard API with a textarea/execCommand fallback, showing a polite live-region status message like "Copied. Paste it into your group chat." inside the settle card.

I'm hiding the copy button when there are no transfers to show. For name joining, I'm checking Intl.ListFormat support and writing a fallback that joins names with commas and "and" in the proper grammatical style. For describing how an expense is split among people, I'm writing logic that divides the cost evenly, distributes any leftover cents fairly, and phrases the result naturally — e.g. "$5 each" when even, or "$5 for Ana and Ben, $4 for everyone else" when there's a remainder, with a special single-payer case like "For Ana only."

For the live preview in the expense form, I'm reusing that same share-calculation logic but adding a small transparent note when the split is uneven, explaining that the extra cent goes to whoever joined the trip first — keeping things honest. I'm also deciding on balance summary wording: showing "Paid $90.00 · Share $45.00" alongside status words like "gets back," "owes," or "all square" depending on whether the balance is positive, negative, or zero.

For layout, I'm placing a small uppercase status label like "GETS BACK" above the signed amount, with the name and payment meta above that, so screen readers and sighted users both get a clear reading order: name, paid/share breakdown, status label, then the amount.

I'm weighing whether to show "Owes $45.00" as plain language versus a signed negative number, since double negatives like "Owes -$45.00" read awkwardly — Splitwise-style apps typically color-code "owes" in orange with a positive-looking number rather than a literal negative sign, so I'm leaning toward following that convention while letting the label carry the meaning.

For the settle-up summary line, I'll phrase it as "2 payments settle the whole trip" or singular "1 payment settles the whole trip" depending on count.

I should double-check edge cases: data-attributes should stay reliable after deletions, names with quotes or odd characters need proper attribute escaping via setAttribute, and checkbox values must still correctly carry the person's name even if it contains special characters.

For defaults, every person should start checked including newly added ones. I'm also sizing the layout for a 360px viewport, checking that the input and "Add person" button fit comfortably side by side within the card padding.

For the amount and payer row, I'll stack them below 520px. For the header stats, I'm wrapping the flex layout so "Trip total" can take its own line on narrow screens while people/expenses counts stay inline.

Now I'm checking how large amounts like $99,999,999.99 render in the balance row at 360px, using a smaller tabular-number font and ensuring names truncate properly.

I need to let names wrap with overflow-wrap and min-width:0 instead of forcing truncation. I'm also setting up font fallbacks for Fraunces and Public Sans, respecting reduced-motion preferences for bar transitions, and making sure focus outlines and bar visibility hold up under forced-colors mode.

Skipping dark mode since the design is paper-anchored, so I'll lock color-scheme to light. Now I'm starting the full HTML document with the page head, meta tags, theme color, and Google Fonts preconnect links...

Adding font import...

I'm also adding an inline SVG data URI favicon so no extra external resources are needed beyond the Google Fonts stylesheet.

Defining color variables...

Still defining color variables...

I'm computing the relative luminance values for the muted and paper colors to verify sufficient contrast between them.

Checking the contrast ratio comes out to about 5.44, which is good. But the signal color against the paper background lands at exactly 4.50 — right at the borderline threshold.

That's risky, so I should limit signal color use to text on white, or use a deeper signal variant for text elsewhere. The focus ring on paper still clears 3:1 fine, and button backgrounds with white text hit 4.99, well above threshold, same for eyebrow text on white cards. I'm also checking sea green on white (around 6.2, solid) and considering how harbour fog chips with harbour text hold up.

Now I'm setting base body styles for box-sizing, background, font, and smoothing, then defining focus-visible outlines with different offsets for inputs versus general elements, plus a dark-mode override for the focus color. I'm also building the header styles with a dark harbour background and a signal-colored accent bar along the bottom edge.

Checking the contrast ratio comes out around 7.7, well above threshold. For the stats, I'm styling the labels as small uppercase with wide tracking in a muted blue-gray, and the values in Fraunces at a larger size.

For layout, I'm setting a max-width wrapper with responsive padding, then building a two-column grid above 960px using CSS grid with aligned start content, collapsing to a single column on smaller screens, with the expenses section getting extra top margin.

Now I'm styling the card component with background, border, rounded corners, shadow, and responsive padding, plus the card header using flexbox to space out the title and any trailing element, with the heading styled in the display font at a medium weight and tight letter-spacing.

I decide against adding numbered step markers to headings since it would be inconsistent across sections like Balances versus Settle, so I'll keep headings plain with a simple lede underneath. Now I'm moving to the form field styles, defining grid-based layout for fields, label typography, and input/select sizing.

Still writing input styles...

For the money input I'm wrapping it with a dollar-sign prefix positioned absolutely inside, padding the input to make room for it, and adding a "CAD" suffix on the right in muted color.

For error states, I'm styling a flex container with an icon and message, using a warm red-orange tone against a soft wash background, checking the contrast ratio works for accessibility.

Now I'm starting the button styles with flexible sizing, rounded corners, and consistent padding...

Adding more button variants...

Now I'm debating color semantics for primary buttons—using Signal as the action color for things like "Add expense" makes sense since it's meant to draw attention, but I'm second-guessing whether Harbour should be primary instead with Signal reserved for higher-priority cases.

Writing the person form markup...

I'll drop the maxlength attribute and instead validate name length in JavaScript with a proper error message, since 40 chars felt arbitrary and risky for edge-case tests.

Adding autocomplete off and autocapitalize words for better mobile input on the name field, then building out the people list with an accessible unordered list plus an empty-state message and styling.

Writing chip styles...

Adding chip remove button styling...

Checking the contrast ratios for each color against white text, I confirm harbour and sea pass, and the dusty plum works out to roughly 7.9:1, well above the 4.5 threshold.

Ochre also passes at about 5.9:1. Signal red clears the bar too at 4.99, but I'm wary of using it for people since it reads more like an action/alert color -- better to reserve it for something else and stick with harbour, sea, plum, and ochre as the rotation for people.

For assigning colors to people, I want something stable rather than dependent on insertion order, since removals could shift indices. Hashing the person's id or name to pick a consistent color index seems more reliable than storing a counter.

For the monogram, I'll use the first grapheme of the name uppercased, which handles emoji names gracefully, and I'll add a small helper note under the people list clarifying removal rules. Then I'm moving on to the "Log an expense" section with its heading and descriptive lede text.

Now I'm styling the split chips as checkbox-style pills with rounded borders and flexible wrapping...

Resetting the fieldset styles to remove default borders and spacing, and giving the legend a bold weight with tools positioned to the right via a flex container.

Since a legend must be the first child of a fieldset, I'm working around the flex layout constraint by keeping the legend on its own line and placing the "select everyone / select none" controls as a separate quiet row beneath or beside it.

Styling the preview box and balances list grid...

Adding more styles...

Adding more balance bar styles...

I'm adding a small axis legend with "Owes", "Even", and "Gets back" labels, marked aria-hidden since the rows already spell things out in words. I also want a short principle note under the balances section noting that owing is the norm, not a problem.

Now I'm styling the settle-up card with a dark harbour background and transfer list, laying out each transfer row with who's paying whom in a grid.

Styling expense row layout...

Defining grid areas...

I'll make the meta line read "Paid by **Ana** · Split between Ana, Ben and Cara" with a muted share line showing "$15.00 each". Now I'm sketching the undo bar markup that appears after a delete action.

For the expenses section, I want an h2 heading reading "Expenses" with a count summary like "7 expenses · $1,234.50 total", and the heading needs a tabindex of -1 so focus can be managed programmatically. Then I'm moving on to the reset section markup...

Writing reset section markup...

I'm deciding to hide the reset section entirely when there's no trip data rather than showing a disabled state, and making the dangerous "clear everything" button use a solid deep-red background with white text to signal destructiveness.

Now I'm writing the footer copy about local-only storage, then moving into the JavaScript module using an IIFE with a versioned storage key constant, and setting up a currency formatter with Intl.NumberFormat for CAD that safely handles null or NaN cent values by defaulting to zero.

I'm also adding a small DOM query helper and a lightweight `h()` element-builder function that creates elements, applies props (handling classes, text, event listeners, and styles specially), and appends children while filtering out null or false values.

Now I'm setting up the global state object for people and expenses, plus a `uid()` helper that uses `crypto.randomUUID` when available and falls back to a timestamp-based random id otherwise.

I'm also writing the `load()` function to safely read from localStorage, wrapping it in a try/catch so storage errors set a flag instead of crashing.

Still writing parser...

Still writing parser...

Still writing parser...

Still writing parsing logic...

Other malformed inputs like "5.5.5" or space-separated thousands should also fail the format check. I'm drafting the user-facing error messages for each failure case: empty input, bad format, non-positive amount, too many decimals, and amount exceeding the max limit.

I'm setting a max expense limit of $10,000,000 using integer cents, with the error message dynamically inserting the formatted max value. For splitting amounts evenly among people, I'm writing a function that distributes remainder cents one at a time to the first few people so totals always add up exactly, plus a helper to get the ordered list of people included in a split. Now I'm starting the balance computation function that tracks what each person paid versus their fair share across all expenses...

For settling up, I'm writing a greedy algorithm that repeatedly matches the person owed the most against the person owing the most, transferring the smaller of the two amounts until all balances reach zero -- since total credits always equal total debts exactly, the loop is guaranteed to terminate cleanly.

Now I'm figuring out how to efficiently re-render the controls panel only when people actually change, by comparing a signature string and preserving previous checkbox states and selected payer values keyed by person id so toggling doesn't reset user selections.

Setting payerSel.value by name works since it matches the option value. Now I'm rebuilding the split section, showing a placeholder message when there are no people yet.

Otherwise I'm generating a checkbox chip for each person, preserving prior checked state or defaulting to checked, so I need to double check how the empty-state paragraph interacts with the test ID attribute on the container.

Now I'm moving to the expense form submit handler, validating that people exist before logging an expense and checking the description field isn't blank before proceeding.

Still writing validation logic...

Building the expense split logic...

After adding, I'll focus back on the description field so users can quickly add another expense, and announce the addition with details on amount, payer, and split for accessibility.

Since the balances list may be offscreen after this, I'll also show a brief inline success message like "Added Groceries · $45.00" near the submit button that fades after a few seconds, giving sighted users visible confirmation too.

Now I'm writing the validation logic for adding a person to the trip, checking for an empty name and showing an error if so before proceeding.

I'll use dup.name instead for the suggestion so it reflects the actual existing person's name rather than the newly typed one. Now I'm writing the showError function, which clears existing errors and creates a paragraph element to display the validation message.

On mobile, focusing scrolls the field into view nicely. Checking screen reader behavior: focusing the invalid field announces it along with the describedby error text, plus the live region fires too, which seems redundant but acceptable.

I'm wiring up listeners so errors clear automatically once the user starts correcting the relevant field—matching on the control reference for inputs and checkboxes, and clearing the "no people" error specifically when someone adds a person. I want to make sure clearing only triggers when the edited control matches the one that caused the error, so unrelated fields don't prematurely dismiss it.

Now I'm building the function that renders the people list as chips, each showing the person's initial, their name, and a remove button (hidden for anyone currently involved in an expense), with event delegation handling the remove clicks and an empty-state message using Canadian spelling for "travelling."

I'm drafting the people-count note text, something like "You can remove someone until they're part of an expense," and sketching the balances renderer which computes each person's net position, labels it as "Gets back," "Owes," or "All square," and scales a visual bar against the largest absolute balance.

I'll set that bar style via setAttribute to avoid CSP issues. For an empty state I want a friendly hint like "Everyone's at $0.00 until you log an expense," and once expenses exist, a quiet trust signal underneath the list confirming balances add up to $0.00.

Now I'm writing the settle view: handling empty state with "Nothing to settle yet," an all-even state with "Everyone's even," and a summary line counting how many payments settle the trip, followed by building each transfer row with payer, arrow icon, and payee.

I'm also building the expenses list, rendering each entry with its payer and a description of who the expense was split between.

Beyond that, I need to handle the undo bar visibility, header total stats, a storage warning footer message for when saving isn't working, and a clipboard copy button for the settle-up summary.

Writing clipboard copy logic...

Now I'm wiring up the reset flow — clicking start reveals the confirm buttons, keep cancels back to the start state, and clear wipes people and expenses, resets undo, saves, re-renders, and announces the trip was cleared. I'm also adding a storage listener so other tabs reloading cleared state stay in sync, making sure load() resets to empty state when storage is null. Then I start drafting the preview update function, checking first whether there are any people at all.

I'm working out the preview text logic: showing guidance when no one's checked, singular vs plural share messages, and a shareSentence helper that explains even splits versus uneven ones where leftover cents go to whoever joined first (or in join order if there are multiple leftover cents) — and I'm weighing whether the preview needs aria-live since it updates on every keystroke.

I'm wiring up event listeners for the amount input, split mode toggle, and tool buttons, plus select-all/none logic that updates checkboxes and clears split errors. For removing a person, I'm writing the click delegation that finds the person by id, blocks removal if they're involved in the split, splices them out, clears undo state and errors, saves and re-renders, then figures out where to move focus afterward among the remaining remove buttons.

Now I'm handling expense deletion similarly: locating the clicked item's position, splicing it from state while storing it for undo, saving and re-rendering, then shifting focus to a nearby delete button or the undo button if the list is now empty, along with an announcement for screen readers.

The undo button restores the removed expense at its original index, re-saves and re-renders, then focuses the restored item's delete button with an announcement. A dismiss control clears the undo state and moves focus to the expenses heading, and I'm placing the undo bar above the expense list with a message describing what was removed.

Writing the main render function...

I'm also checking that control checkboxes preserve their previous checked states when people are added, so existing selections aren't lost, and planning to render icons as inline SVG fragments inserted via contextual fragments rather than innerHTML strings.

For the brand mark, I'm sketching a simple boat-shaped icon—a circle backdrop with a hull silhouette and waterline—to use as the small logo mark in the header.

Still writing shape coordinates...

I'll split the circle into a lighter top half for sky and a dark navy bottom half for the harbour water, adding a thin paper stroke around the edge so it stays visible against the dark header. Writing SVG code...

Keeping it minimal without a mast or sail. For the wordmark I'll use Fraunces 600 for "Even Keel" in plain style, no italics. Now I'm setting up the header layout with a flexible container that wraps, centers the brand elements, and spaces things out responsively.

Still writing styles...

At 360px wide, I'm checking that the brand row and stats row wrap properly, with the total, people, and expenses figures sized and spaced so everything fits within 328px.

I'm wiring up focus-visible outlines and checked-state styling for the checkbox chips using `:has()` with a `@supports` fallback for browsers that don't support it, so the clickable label still shows checkbox state visually either way. I'm also crafting an inline SVG chevron for the select dropdown's background arrow.

Now I'm styling the money input wrapper with a fixed currency prefix and unit suffix positioned absolutely, using tabular numerals so amounts align cleanly, plus disabled-select styling using muted fog tones.

For the field row grid, I'm switching to container queries instead of media queries so the layout responds to the card's own width rather than the viewport, defaulting to single column and expanding to two columns once the container is wide enough—applying this same approach to balance and expense rows, and planning the expense list row structure with description and metadata on the left and amount aligned right for the desktop width.

Still writing grid layout...

For the payer meta line, I'll render it simply as "Paid by **Ana**" using a bold name within the text.

I'm reconsidering accessibility for the separator dot between meta items — CSS pseudo-content might get read oddly by screen readers, so splitting into two separate lines (one for "Paid by Ana", another for "Split between...") is cleaner for mobile and avoids that issue.

I'm also drafting the "balances add up" integrity line with muted styling and a checkmark, plus an uppercase axis legend ("Owes / Even / Gets back") above the balances list that hides when empty. Now I'm moving to the settle card's HTML structure with a card-head and title section.

Still writing settle card markup...

Now I'm adding CSS to make the hidden attribute always hide elements, screen-reader-only utility classes, skip link focus styles, and a reduced-motion media query that disables transitions and animations for users who prefer less motion.

I want a subtle highlight animation for newly added expense rows, tracking the just-added ID and fading in a background tint over 1.6 seconds, respecting the reduced-motion preference. I'm also checking that long unbroken names won't cause horizontal scrolling at 360px width, so I'm adding overflow-wrap to chips, selects, and balance displays throughout the layout.

Now I'm verifying that grid columns use minmax(0,1fr) everywhere so flex items shrink properly, checking the inline row layout for the person input and button, and making sure amounts stay nowrap while name columns flex to absorb space. I'm running through the math at 360px width to confirm the balance figures and header stats with large totals still fit without overflow.

I'm also checking color contrast ratios for accessibility — body ink on paper, muted text on white and paper backgrounds, checkbox label states, and the "gets back"/"owes" balance labels — confirming each pairing meets or exceeds WCAG AA thresholds.

Checking dt header contrast on harbour comes out around 6.7, plenty safe. No eyebrow element to check, and badge/icon colors are non-text so they're fine either way. For non-text contrast, input borders and checkbox chip borders hit roughly 3.5:1 against white, and while the balance bar track itself has low contrast, that's decorative since the actual values are conveyed in text, so it's acceptable.

Focus rings test well above 4.5:1 on white, paper, and against dark cards with glow. All interactive controls are native or properly built buttons, headings follow a clean h1/h2/h3 hierarchy, and landmarks (banner, main, contentinfo, labelled regions) plus lang="en-CA" are set. I'm now weighing whether to add a "load a sample trip" button for first-time users, but want to make sure that doesn't interfere with tests expecting an empty starting state.

I'll gate the sample-trip button so it only appears when the trip is genuinely empty, populating a small cast of people and a handful of varied expenses (covering accents, different payers, and partial splits) that users can clear with reset — a nice touch for empty states without risk since tests won't click it. This rounds out the empty-state coverage across people, expenses, balances, and settle-up views before there's any real data.

For implementation details: I need payer selects and checkboxes to stay disabled until people exist, then enable automatically once added, with option values matching names exactly. For descriptions, I'll validate length with a clear inline JS message rather than a silent maxlength truncation, trimming whitespace but not worrying about collapsing internal spaces.

I'm verifying the settle-up logic transfers names only with an arrow between them, confirming the greedy algorithm needs at most one fewer transfer than the number of people with nonzero balances. I'm also tracing through expected test behaviors: expenses render newest-first, deleting the first one removes the most recent entry and updates balances correctly, reloaded state keeps all checkboxes checked by default, and splitting leftover cents across three people needs to distribute correctly.

I'm now stress-testing amount parsing edge cases — rejecting invalid formats like negative numbers, empty strings, non-numeric text, scientific notation, and comma-separated thousands, while accepting trimmed values, trailing decimals, and dollar signs, and flagging anything with more than two decimal places as invalid.

Duplicate name detection needs to catch whitespace variations and case differences like "  Ana  " or "ANA" matching an existing "Ana". I'm also confirming that form errors persist until cleared, focus stays on rejected inputs, and Enter key submits the expense form properly.

For the success message near the add button, I'm deciding to make it visible text without being a live region itself, since the announcer already handles the accessibility announcement—avoiding duplicate screen reader output. It should auto-hide after 5 seconds, and I'm considering whether the same pattern applies when adding a person.

Now I'm moving to writing the actual HTML structure: a skip link, header with branding and trip stats (total, people count, expenses count), and the main content area with tabindex for proper skip-link focus handling, making sure to suppress the focus outline there since the skip link shouldn't look odd. Writing the body markup...

Adding empty-state markup for when no people are listed yet, with a prompt to start with your own name and a link to try a sample trip.

Now I'm building the expense logging section, with a form card that has fields for describing what the expense was for.

Adding more form fields...

Finishing form markup...

I'm deciding on "Select all"/"Select none" for the picker buttons, hiding split tools when fewer than two people are selected, and sketching the balances section with an axis legend (Owes/Even/Gets back) and a list that explains each person's standing in plain terms.

Now I'm structuring the expenses card with a newest-first summary and an undo bar that appears after deletions, giving users a quick way to reverse an action.

I'm also adding an empty state message guiding people to log expenses, though I'm noting a wording issue since "log it above" assumes a desktop layout where the form sits above the expenses list—something I should double check against responsive positioning.

For the reset section, I'm building a confirmation flow: a "Start a new trip" button reveals a hidden warning panel with "Keep this trip" and a destructive "Clear the trip" action, making sure resets require explicit confirmation before wiping data.

The footer just reassures users their data stays local in the browser, with a hidden storage note placeholder. I'm adding a screen-reader-only live region outside the main content for status announcements, with the announce function briefly clearing and resetting text so repeated identical messages still get read aloud. For styling, I'm giving link-style buttons proper touch target sizing and underline treatment, and defining a dashed-border empty-state box with muted coloring against the card background.

Now I'm moving into the JavaScript module, setting up constants for storage keys, currency limits, and field length caps, along with a currency formatter and helper functions for joining names into readable lists, normalizing name keys, pluralizing words, and a shorthand DOM selector.

I'm defining a deterministic color palette for avatars, hashing each person's name into one of five hues, extracting their initial letter, and building a small "mono" component that renders a colored circle with that initial—accepting that two people could occasionally land on the same color since it's a minor cosmetic collision.

Now I'm writing inline SVG icons for close, arrow, and alert symbols...

Writing icon helper and render functions...

Building person chips...

Writing balance row markup...

I'm adding an aria-hidden separator span for the visual dot while keeping the screen reader text clean, then moving on to building the settle-up transfers renderer.

Then I'm wiring up the render logic: populating the transfer list, toggling visibility of the actions and footer based on whether any transfers exist, and setting a pluralized summary message. For the empty state, I'm tailoring the message depending on whether people or expenses are missing, so users get useful guidance instead of a generic blank screen.

Now I'm moving on to building the expense list renderer, mapping each expense to its payer and split details, and creating list items marked as newly added when applicable.

Still writing expense split logic...

Writing undo bar text...

I'm also handling the reset section's visibility, hiding the confirm panel when the trip has no people or expenses left. For the newly-added expense highlight, I need to think about when to clear that marker—clearing it immediately after render could cause it to disappear before other unrelated re-renders happen.

Now I'm writing a sample trip loader with fictional people and a few example expenses to populate the app for demo purposes.

I'll move focus to the people-title heading since it's closest to where the sample button was, rather than jumping to balances which might disorient on mobile. Then I'm double-checking the sample math: groceries split 4 ways gives an uneven remainder so Ana gets 3415 vs 3414 for others, while ferry splits evenly—good test cases for the rounding logic.

Working through the net balances for each person and confirming they sum to zero, which they do, resolving into three clean transfers to Ana. That settles the reset-confirm sample data, and now I'm writing the `h()` DOM helper that handles class and text props plus string children as safe text nodes.

For event wiring, I'm setting up input listeners that clear validation errors when the relevant control changes — payer select, split checkboxes, and the "no people" error all get cleared appropriately since modern browsers fire 'input' on selects too.

I'm also thinking about the error slot's accessibility: using display:none with aria-live is risky since many screen readers won't announce content inserted into a region that was hidden, so I should keep the slot in the layout but visually collapsed instead.

I switch `.field` to a flex column with spacing handled by margins on the label and hint rather than grid gap, so an empty error slot doesn't add unwanted space. Now I move on to the preview update function for the expense form, starting to write the logic that reads the current UI state and refreshes the displayed preview.

Still writing preview logic...

I'm formatting the share display with bold labels, hiding the CSS for hidden elements, and adjusting split tool visibility to only show when there are at least two people. I'm also writing a helper to collect the currently checked people from the split box checkboxes.

Checking edge cases around control rendering—initial state uses a null signature so the first render always builds, and rebuilding checkboxes when people change doesn't disrupt focus in any problematic way. Now I'm moving on to writing the final CSS, including a media query for wider layouts and setting up container queries so card components can respond to their own size.

I need to be careful with `container-type: inline-size` since it can collapse elements to zero width if their size depends on content, but since cards sit in grid columns that stretch to fill space, this should be safe. I'm planning container queries to switch field rows to two columns and expand the experience section layout once the card reaches certain widths, with graceful single-column fallback for browsers lacking support, plus basic font sizing and a subtle background touch below the header.

On layout order, I'm deciding balances should appear before the settle-up card since it tells the story of where things stand before showing the resolution. Now I'm writing the base CSS reset and global styles — box-sizing, hidden utility, text rendering, and body defaults with the paper background and ink color.

I'm also adding accessibility helpers: a screen-reader-only class, a skip link that appears on focus, and a visible focus outline convention, while making sure focus is removed only on non-interactive headings that get programmatic focus for accessibility navigation.

Writing button styles...

Defining button variant styles...

I'm checking that the sample-trip link button wraps correctly in the empty state, then verifying the danger color meets white contrast requirements with a ratio around 7.0, confirming the transfer amount text stays white on dark backgrounds, and starting to adjust the settle dark card's copy button styling.

Now I'm designing the split-list chip layout as a flex-wrap container with consistent gaps, then moving into the balance list grid structure with columns for avatar, name, and amount, plus border dividers between rows and styling for name and metadata text.

Styling the figure labels...

Still styling the bar...

Styling the settle card...

Still writing transfer-list styles...

Adding wide-container grid variant...

I'm drafting the payer, split, and share copy like "Paid by Ana," "Split between Ana, Ben and Cara," and "$15.00 each," then adding a subtle arrival flash animation for new expense rows, extending the row's padding and negative margins so the highlight doesn't look clipped.

Now I'm styling the undo bar with flexible wrapping, spacing, and a soft background container, then starting on the reset section layout.

Writing responsive layout styles...

I'm keeping the tagline visible but shrinking it for mobile, then checking the 360px width math so the person form's input and "Add person" button fit side by side without overflow. I'm also planning the tools row to wrap gracefully and making sure the chip remove buttons are properly wired.

Satisfied that a single person can still add an expense (valid though pointless), and that select disabled states still show labels correctly, I'm moving to finalize the checkbox creation logic and confirm the helper function handles label "for" attributes properly.

Writing the h() helper function...

Still mapping UI elements...

Still mapping UI elements...

Finishing the success flasher that hides the message after a timeout and clears errors when it shows. I'm planning the "add at least one more person" guidance and the empty-split-state messaging with payer select disabled until people exist, plus a dashed-box style for the empty split area and an announcement string for newly added people.

I'm also double-checking edge cases: trimmed names store correctly, person testid spans only expose the clean name text, and the monogram letter inside balance rows gets swept into textContent even though it's aria-hidden—which could affect exact text assertions, though contains-text checks should still pass fine.

For transfer rows like "Ben pays Ana $12.00", I'm making sure to insert proper spacing between the name, verb, and amount spans so the concatenated textContent reads naturally rather than running words together.

I'm adding an arrow icon next to "pays" for visual clarity, and applying consistent mono-colored avatar chips per person across balances and expenses. Writing avatar chip CSS...

Styling person chips with pill-shaped backgrounds, monogram avatars, and remove buttons, then moving on to style the empty-state box.

Styling empty state colors...

Adding more form styles...

Adding more layout styles...

Still writing styles...

I'm also considering adding a small decorative accent before section headings, like a short rule mark, to give the Signal branding a subtle visual touch.

I decide the top stripe on the card already carries enough brand presence, so I'll skip extra flourishes and move on to writing the final file, starting with a helper function that builds a set of all IDs involved in expenses by tracking payers and split participants.

Still writing parser...

Finishing the cap check and verifying edge cases like "." alone, negative decimals, and the max dollar threshold all map to the right error codes before defining the error message constants.

Building the final HTML structure now—header with brand mark and stats, then the main layout with a skip link and columns for the people card and expense form, making sure every referenced id actually exists in the markup.

Now writing the settle-up card itself, with a hidden summary and transfer list that populate once balances are calculated, plus an empty state and footer actions for copying the settlement plan.

I'm trimming that overreaching closing sentence down to just the practical instruction about sending payments, since the app can't actually verify anyone paid. Now I'm starting the copy fallback function that creates a temporary textarea to hold the clipboard text for browsers without native clipboard support.

Beyond that, I'm confirming the copy text should only include transfers, not full balances, and making sure reset and sample buttons behave correctly—sample button only shows when the people list is empty. I also want to add tabindex to the people and expenses section titles so focus can move there after loading a sample or dismissing an undo action.

For delete-expense focus handling, I'm figuring out which button to focus next after removal by tracking the deleted item's index and falling back to the undo button if nothing else remains. For undo restoration, I'm planning to locate the restored delete button by its data-id using CSS.escape, or fall back to iterating through the list if needed.

I also need a renderReset function that toggles visibility of the reset button based on whether people/expenses exist, resetting confirm state when hidden. For the h() helper, I'm checking that it handles null props correctly, and reviewing a few examples like checkbox labels and balance chip styling before writing renderBalances with its axis visibility logic.

For renderBalances, I'm handling the empty case by hiding the list and showing an empty message, then building a fragment of balance rows scaled against the max absolute net value. Finally, I add a confirmation message depending on whether expenses exist, confirming balances sum to zero or prompting the user to log an expense.

Now I'm adding the favicon as an inline SVG data URI with a colored circle.

Still computing the arc path...

Writing SVG mark geometry...

I should reuse the same paths for the favicon without the ring, and make sure the hull sits in the sky region while the keel dips below the waterline. Now I'm moving to implementation details—making sure the script runs after the DOM loads, the select options carry proper data attributes, and the controls render correctly on initial load.

Checking edge cases: controls signature starts null so everything renders fresh, unchecked names default to checked, and the payer selection falls back to the first person if none was previously set. After a reset, the form should show a placeholder when there are no people, and storage events need to properly sync new people as checked. I also want to make sure the "name rejected" message displays clearly, and that the expense form shows a helpful note when there are no people yet to split with, placed right before the submit row with proper aria-describedby linking for accessibility.

Now I'm writing the mobile CSS for the stats grid with wrapping flex layout and definition term/description styling, plus thinking about header polish like the brand tagline sizing and a subtle Signal-style top stripe instead of decorative patterns. I'm also adding a forced-colors media query to ensure the balance bars, buttons, and chips remain visible in high-contrast mode. For the final copy, I'm refining the lede text for the balances and people sections to reinforce the friendly, non-judgmental tone around who owes whom.

Now I'm writing the lede text for expenses and settle-up sections, plus the empty-state messaging for when everyone's balances are even. I'm drafting the JavaScript that renders the people note, pluralizing correctly and adding contextual hints about adding more people or removing someone tied to an expense, along with the clipboard copy text and the accessibility announcer string for newly added expenses.

I'm double-checking edge cases: selecting none before adding an expense should trigger an error and focus the first checkbox, the card's container-type setup should make the container queries work correctly against the nearest ancestor, and the narrow-width layout for the person form row holds up. I'm also confirming the aria-hidden attribute is set properly on the relevant element.

Writing the empty-state rendering now, using replaceChildren to update the settle card's content, and adding a noscript fallback message telling users JavaScript is required.

