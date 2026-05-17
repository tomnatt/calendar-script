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

- **`content.js`** — injects a button into the weekly view header via MutationObserver (to survive Google Calendar's SPA navigation), scrapes Work event durations from the DOM, and renders a modal overlay with per-day subtotals and a weekly total
- **`styles.css`** — modal overlay styles

The DOM scraper parses event label text matching the format `"HH:MM to HH:MM, Work, ..."`. The button is only shown in week view; the MutationObserver re-injects it on navigation.

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
