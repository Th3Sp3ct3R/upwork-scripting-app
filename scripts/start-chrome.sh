#!/bin/bash
# Launch Chrome with CDP enabled for Upwork scraping/auto-submit.
# First login to Upwork in this Chrome instance — session persists across restarts.
PROFILE_DIR="$HOME/.upwork-chrome-profile"
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
    --remote-debugging-port=9222 \
    --user-data-dir="$PROFILE_DIR"
