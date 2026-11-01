# Changelog

## 2026-11-01: Motion layer

1. Content below the top of the page fades and slides into view as it scrolls in: 0.7s, 64px of travel, easeOutQuint cubic-bezier(0.22, 1, 0.36, 1), with siblings staggered 80ms apart up to 250ms. The header, masthead strip, lead story and page heads do not move, and neither does the footer.
2. Marked on the home page (and /issue/1): the column labels (they come down), each entry row, the calendar heading and row, the archive and library block, and the subscribe panel. On Facilities: the section headings, every facility card and the bill list. On Topics: both section headings and every topic card. Long-form story pages and the about page stay still for reading.
3. The subscribe form's button lifts 5px on hover and keyboard focus.
4. whysice-motion.css and whysice-motion.js load on every page except the print editions, and the service worker precaches both (cache v16). With JavaScript off or reduced motion on, everything is visible and nothing moves.
