# Changelog

All notable changes to the Maine Ledger site are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the site uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html). The current version is in `VERSION`.

## [Unreleased]

## [0.1.0] - 2026-11-09

The first numbered version. It covers the site as it stood on this date. Changes made before this date were not tracked by version.

### Added

- Motion layer (shipped 2026-11-01). Content below the top of the page fades and slides into view as it scrolls in: 0.7s, 64px of travel, easeOutQuint cubic-bezier(0.22, 1, 0.36, 1), with siblings staggered 80ms apart up to 250ms. The header, masthead strip, lead story and page heads do not move, and neither does the footer.
- Motion is applied on the home page (and /issue/1) to the column labels (they come down), each entry row, the calendar heading and row, the archive and library block, and the subscribe panel. On Facilities it is applied to the section headings, every facility card and the bill list. On Topics it is applied to both section headings and every topic card. Long-form story pages and the about page stay still for reading.
- The subscribe form's button lifts 5px on hover and keyboard focus.
- whysice-motion.css and whysice-motion.js load on every page except the print editions, and the service worker precaches both (cache v16). With JavaScript off or reduced motion on, everything is visible and nothing moves.

[Unreleased]: https://github.com/whysice/the-maine-ledger/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/whysice/the-maine-ledger/releases/tag/v0.1.0
