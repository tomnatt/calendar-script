# Calendar scripts

Scripts to maintain entries in my Google calendar.

Designed to be run locally. Requires Google OAuth credentials.

```
rake list_gym[start_date,blocks]   # List gym slots in calendar
rake update_gym[start_date,write]  # Update gym slots in calendar
rake work[monday]                  # List work entries and total hours worked for a given week
```

## Setup

* Create a Service Account with Calendar read/write permissions and get key file
* Ensure the Service Account has access to your calendar

## ENVARS

```
GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_FILE     # Path to Service Account key file
GOOGLE_CALENDAR_ID                           # ID of calendar to read / edit
```
