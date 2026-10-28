# Design review: the Maine Ledger front page

**Scope:** the home page of [maineledger.netlify.app](https://maineledger.netlify.app/), with the archive, report, 404 and offline pages read for context.
**Audit date:** 7 October 2026. **Status re-checked against the code:** 28 October 2026.
**Result at audit:** 22 of 40 on a ten-heuristic design health score, with one blocking issue and three high-priority issues.

This is the audit that drove the site's first three weeks of iteration. It is published here as a record of how the site was evaluated, what was found, and what was done about it. Findings are written as they were at the time; each carries a status line checked against the current codebase.

## Method

- A structured heuristic review against Nielsen's ten usability heuristics, each scored 0 to 4, run twice independently and reconciled.
- Hands-on passes at desktop width, 375px and 320px, with a keyboard and a screen reader.
- Measured evidence taken in the browser: text contrast on every pair, horizontal overflow, console errors, payload size, tap-target sizes.
- Three reader personas walked through the page: a first-time public reader, a keyboard and screen-reader user, and a one-handed phone reader.

Measurements at the time of the audit: every text pair passed contrast (lowest 6.56:1), no horizontal overflow at 375px or 320px, zero console errors, zero images, about 177 KB cold load of which about 148 KB was fonts.

## Design health score

| # | Heuristic | Score | Key issue at audit |
|---|---|---|---|
| 1 | Visibility of system status | 2 | Dead links failed silently by jumping to the top of the page |
| 2 | Match between system and real world | 3 | Ledger metaphor works; "LD 1962", "MDOC", "JAIL $" were unglossed for a public reader |
| 3 | User control and freedom | 2 | A record click lost the reader's place; under 560px the nav was removed with nothing in its place |
| 4 | Consistency and standards | 2 | 21 links looked live and were not; rows ran Oct 01, Sep 30, Oct 02, Oct 01 with no stated order |
| 5 | Error prevention | 2 | Subscribe field was typed and required; nothing said what happens to the address |
| 6 | Recognition rather than recall | 3 | Column heads were clear on desktop and disappeared under 980px |
| 7 | Flexibility and efficiency | 2 | No per-entry permalinks, no feed, no link to the print edition that already existed |
| 8 | Aesthetic and minimalist design | 3 | Restrained and confident; the 76px numerals were the only filler |
| 9 | Error recovery | 2 | 404 and offline pages well written; form failure state not verified |
| 10 | Help and documentation | 1 | No About or method page; "About the mark" opened a brand swatch sheet |
| | **Total** | **22/40** | **Acceptable** (all ten heuristics apply) |

## Design specificity

The structure was authored and the skin was category-default.

Authored: the four-column row (date, place, entry, record) ending in a document card with type, title, date and pin cite; the "What changed since the last issue" before-and-after panel; the issue strip that counts records cited; the footer policy lines; a 404 that reads "No entry at this address".

Default: a serif and a monospace on cream with hairline rules and one green accent, the standard independent-newsletter kit, plus giant stat numerals and a "read time" cell. Nothing visual said Maine, and nothing separated jails from prisons from courts, the three beats in the tagline. A record-based brief on Ohio school boards could have taken this page unchanged.

## Overall impression

The row is the argument: claim on the left, document on the right, "check me" built into the layout. Then the document would not open. The biggest opportunity was making the record the largest, most clickable thing in each row instead of the smallest.

## What was working

- **The row grammar.** A lawmaker's staffer can see at a glance that every claim has a paper behind it, with a page and item number on the Aroostook entry.
- **The "what changed" panel.** Three before-and-after lines answer the weekly reader's only question. This is the most ownable idea on the page.
- **Voice in the small places.** "Set at the same size as the error" and "Documents are preferred over characterizations" do more for trust than any visual. The focus ring was visible (7.22:1) and body contrast was strong.

## Priority issues

### P0. The record could not be opened

- **What:** 21 of the 37 links on the front page pointed nowhere: all four document cards, all sixteen county links, and Unsubscribe. Clicking one scrolled to the masthead.
- **Why it mattered:** the tagline is "by the record" and the lead said each row carries "the document itself". The two long reports linked out heavily; the front page was the weakest-sourced page on the site.
- **Fix proposed:** link each card to the official URL and make the whole card the target. Where no document is ready, print "document pending" as plain text, not a link. Pull the county links until county views exist. Remove Unsubscribe from the web footer; it belongs in the email.
- **Status: fixed.** Every record card now links to the government's own copy of the document, with the host named at the foot of the card. County links were removed; facility pages replaced them. The footer explains that each emailed issue carries its own unsubscribe link.

### P1. Sample content was published as the sent record

- **What:** the page said "ALL 12 ISSUES", the archive said "every issue, as sent", counties showed year-to-date entry counts, and issues 8 to 11 linked to an archive where they could not be opened. The site was indexable. It was not possible to verify which of the four entries in the current issue were real.
- **Why it mattered:** accountability outlets rarely get discredited on their reporting. They get discredited on one thing on the page that is not true, and an agency press office looks for exactly that. An archive that claims issues nobody received is that thing.
- **Fix proposed:** keep it a design preview (noindex, a one-line "sample entries" banner) until launch, or renumber to the real No. 1 and show only entries that exist.
- **Status: fixed.** The first issue was renumbered as No. 1, every reference to earlier issues was removed, and the archive lists only what has been published. Each issue now has a permanent address.

### P1. No publisher, no method

- **What:** the front page never named who edits it. "About the mark" opened an internal brand sheet. Corrections and tips went to a personal mailbox.
- **Why it mattered:** the first question from a staffer deciding whether to forward this is "who is this". What gets forwarded has a named editor, a stated method and a corrections log.
- **Fix proposed:** one About and Method page (editor, location, what counts as a record, how entries are chosen, funding, corrections policy), linked in nav and footer; a role address for corrections.
- **Status: mostly fixed.** An About and method page now states what counts as a record, how entries are chosen, how to read an entry, the funding policy, the filing system and the corrections policy. It is linked from the nav and every footer, and the brand sheet is gone. Still open: a named editor and a role address for corrections.

### P1. Phone readers lost the nav and the labels

- **What (confirmed in a 375px render):** under 560px the header kept only Subscribe; This week, By county and Archive vanished with no replacement. Under 980px the column heads were hidden, so date, place and record type stacked unlabeled. The email field was 15px, which makes iOS Safari zoom on focus, and it and the button were 40px tall. The page ran 4,281px long at 375px.
- **Fix proposed:** keep a compact text nav at every width; 16px input, 44px controls; make the whole document card the tap target; inline labels on stacked rows.
- **Status: fixed.** The nav wraps to a full-width row on narrow screens instead of dropping links. Each stacked row carries its own inline Date, Place and Record labels. The email field is 16px and both it and the button are 44px tall.

### P2. Type scale and accent colour editorialised on a page that promised no commentary

- **What:** the loudest element was a 76px prison count, larger than the masthead (56px) and the headline (40px), set in the accent green. Green on "Enacted", "Closed" and "+$4M" read as approval. The strip said "4 documents" while the numerals cited a fifth, unlinked source. Rows were out of date order. Only one of four cards had a pin cite.
- **Fix proposed:** cut the numerals to about 40px under a "Standing counts" label with a linked, dated source; reserve green for links and focus; sort rows by date or state the rule; give every card a page or section cite.
- **Status: fixed.** The stat numerals were removed from the front page. Entries run newest first by the date on the document, and the About page states that rule. Each record card carries a date and an article, page or section cite.

## Persona red flags

**The first-time public reader.** Followed the lead sentence, hit "LD 1962", "MDOC" and "JAIL $" with no gloss, clicked a meeting entry, landed at the masthead, and decided the site was broken. Looked for who runs it and found colour swatches.
*Since:* the About page glosses LD and MDOC, entries open the document, and the About page answers "who is this".

**The keyboard and screen-reader user.** No h1, no main landmark, no skip link; five tab stops before content. The ledger was tabular data built from spans, so cells were read without column names. Sixteen county links were announced without their counts and went nowhere. No visited colour on a page whose job is tracking which documents you have opened. The input border was 1.46:1 against the page, under the 3:1 bar for control boundaries.
*Since:* the page has an h1, a main landmark and a skip link to the entries. Every cell carries a label. Opened documents show a visited colour. The input has a stronger border and an inset shadow.

**The one-handed phone reader.** Header offered only Subscribe. Scrolled four stacked entries and two giant numerals to reach the reports, the only fully sourced content. The input zoomed on focus. 29 of 36 tap targets were under 44px tall.
*Since:* full nav at every width, numerals gone, 16px input, 44px controls.

## Minor observations

| Observation at audit | Status |
|---|---|
| The service worker served the stylesheet cache-first under a fixed name, so style fixes would not reach returning readers until the name changed | Cache name is bumped on each release |
| A second, unused design system sat in the repo | Removed |
| Google Fonts loaded through an `@import` inside the stylesheet, a chained blocking request; one weight was requested and never used | Fonts load from a preconnected link in the head; the unused face is gone |
| The front page had no print styles and did not link to the print edition | Print edition exists; a link from the front page is still open |
| The email template still carried a placeholder postal address | Removed |
| A dash in one entry landed where it read as emphasis | Entry rewritten |
| 404 and thanks pages rendered the tagline cramped; the archive totals row drew stray rules | Pages moved to one shared stylesheet; not re-rendered for this check |
| No dark scheme | Display settings: system, light or dark theme, higher contrast, and three text sizes |
| The manifest was served as a generic binary type | Correct content type set in the host config |
| Five running-text sizes muddied the scale | Still open: five sizes between 13px and 18px remain in use |

## Questions the audit left open

- If the document is the product, why is it the smallest thing in the row? What would the page look like with the record leading and the summary following?
- What does this page show in a week when nothing changed? Is "no change" an entry?
- Does green on "Enacted" quietly say the paper approves?

## What shipped in the three weeks after the audit

- Every record linked to the government's own copy, with the host named on the card.
- Renumbering to a true No. 1 and removal of all sample history.
- An About and method page, linked everywhere.
- Full navigation at every width; labelled rows on narrow screens; 44px controls.
- Permanent addresses for every issue, with two-way links between issues and reports.
- Site search and an RSS feed.
- Topic, facility and bill pages, built from one tag file with structured data, so every piece is filed by subject, system and facility.
- A unified stylesheet with light and dark themes, a higher-contrast mode and adjustable text size.
- A build step that regenerates the pages from the issue sources and fails on a bad tag.
