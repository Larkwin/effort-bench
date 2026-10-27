You are reviewing one submission for a design and engineering review. A developer was given the brief below and produced a single-file web app. You will see three screenshots (desktop with no data, desktop with a sample trip entered, mobile with the same trip) and the full HTML source.

Review it the way a senior product designer and a senior front-end engineer would together. Judge only this submission against the brief and the anchors below. Do not guess who or what made it.

<brief>
{{BRIEF}}
</brief>

## How to score

Score each dimension 1–5 using the anchors. Use the whole scale: a 3 is competent but unremarkable, a 5 is rare. For each score, give the evidence: the concrete elements, colours, lines of copy or CSS rules it rests on, in two or three sentences.

**brand_fidelity**: does it express the Even Keel brand in the brief: the personality (steady, honest, quietly confident; not a game, not a bank), the anchor colours and how the palette is built around them, typefaces that suit it, the voice, and the principle that owing money is normal rather than a problem?
- 5: unmistakably Even Keel; every choice serves the brand.
- 3: compatible with the brand but could belong to many products; or one clear misreading of it.
- 1: ignores the brand or contradicts it.

**visual_craft**: hierarchy, alignment, spacing rhythm, typographic quality, density, and polish at both widths.
- 5: a designer would ship it as is; clear hierarchy, consistent rhythm, nothing awkward.
- 3: tidy but generic or uneven; some misalignment, cramped or bloated areas.
- 1: cluttered, broken layout, or no discernible hierarchy.

**copy_voice**: UI text against the voice rules: plain, calm, specific; useful errors and empty states; verb buttons; no filler.
- 5: every string is purposeful and on-voice.
- 3: mostly fine with some generic, wordy, or off-voice strings.
- 1: filler, marketing tone, jokes, exclamation marks, or unclear messages.

**ux_completeness**: the brief's behaviour and states: empty, validation, feedback after actions, readable expense and balance lists, a settle-up that is easy to act on, mobile usability.
- 5: every state considered and handled well; nothing a user would trip over.
- 3: the main flow works; some states are thin or missing.
- 1: key parts of the brief are missing or confusing.

**code_quality**: structure and readability, integer-cents correctness, state handling, semantic HTML and accessibility, no dead or redundant code.
- 5: clean, correct, idiomatic; easy to extend.
- 3: works but has duplication, fragile spots, or weak semantics.
- 1: tangled, likely buggy, or inaccessible.

**directed_design**: does it read as the product of deliberate decisions by someone with taste who was paying attention to this brand, or as unsupervised AI output?
- 5: cohesive, restrained, specific to Even Keel; choices feel intentional.
- 3: competent but template-like; a few default-looking choices.
- 1: generic AI-default look and feel throughout.

**overall**: 1–10, your holistic judgement of the submission as something you would put in front of the client.

## Lists to return

**ai_tells**: specific signs that output went out without human design direction. Name each tell with its evidence. Common examples (not exhaustive, and only list what you actually see): decorative gradients; purple or indigo accents; emoji in headings or empty states; a generic system or Inter typeface where a brand face was specified; cards nested in cards; everything centred; pill buttons or oversized radii; shadows on every surface; an icon on every label; marketing filler ("effortlessly", "seamless"); "Welcome to…" headings; stat tiles with oversized numbers; toasts for every action; uniform visual weight with no hierarchy; sample data left in; banner comments and unused CSS variables in the code. Return an empty list if you see none.

**brand_violations**: each specific Even Keel rule that is broken, with where. Return an empty list if none.

**best_detail** and **worst_detail**: the single strongest and single weakest decision in the submission, one sentence each.
