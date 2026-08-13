# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bundle install                        # Install Ruby dependencies
rake                                  # Default: runs list_gym
rake list_gym[start_date,blocks]      # List gym slots (start_date: YYYY-MM-DD, blocks: count of 8-slot groups)
rake update_gym[start_date,write]     # Update gym slot labels; pass write='w' to persist changes
rake work[monday]                     # Show work hours for week starting monday (YYYY-MM-DD)
rubocop                               # Lint Ruby code
```

## Architecture

Two independent components share no code:

### Chrome Extension (`chrome-extension/`)

Manifest V3 extension targeting `https://calendar.google.com/*`. Works entirely client-side — no backend calls.

- **`content.js`** — injects two buttons into the weekly view header via MutationObserver (to survive Google Calendar's SPA navigation): an hours-count button and an availability button
- **`styles.css`** — modal overlay styles

The DOM scraper parses event label text matching the format `"HH:MM to HH:MM, Work, ..."`. Both buttons are only shown in week view; the MutationObserver re-injects them on navigation.

- **Hours count** (`wcm-btn` → `showOverlay`) — scrapes Work events, buckets them into projects (`POL` for "Work"/"Work - POL", `DBT` for "Work - DBT"), and renders per-project columns with per-day subtotals and a weekly total. A project's column is hidden entirely when it has no hours that week; if no project has any hours, a "no hours logged" message is shown instead. Also renders a spreadsheet-paste section (day-by-day values per project for pasting into a spreadsheet) — hidden entirely when the week has no hours, and per-project within it hidden when that project has no hours that week.
- **Availability** (`avail-btn` → `showAvailabilityOverlay`) — scrapes all calendar events, merges them into busy intervals, and computes free slots Mon–Fri within working hours (08:30–17:00, Tuesday starting 10:00), excluding Work events and past time on the current day. Renders a copyable "my availability" summary.

### Ruby Backend (`lib/`, `Rakefile`)

Local CLI tools for reading and writing Google Calendar via the Calendar API v3 with Service Account authentication.

- **`lib/calendar.rb`** — base class; handles Service Account auth and wraps `list_events`
- **`lib/work.rb`** (`Work < Calendar`) — calculates total hours worked for a given Mon–Sun week
- **`lib/gym_slots.rb`** (`GymSlots < Calendar`) — reads and updates gym booking event titles to mark first/last in a set; writes changes back via API only when explicitly requested
- **`lib/display.rb`** — formatting module for CLI output; not a class, just a module with static methods

## Environment Variables

```
GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_FILE   # Path to Service Account JSON key file
GOOGLE_CALENDAR_ID                         # Calendar ID (usually an email address)
```
