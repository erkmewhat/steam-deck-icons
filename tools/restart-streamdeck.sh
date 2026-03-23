#!/bin/bash
# Restart the Elgato Stream Deck application.
# Usage: bash tools/restart-streamdeck.sh

SD_EXE="$PROGRAMFILES/Elgato/StreamDeck/StreamDeck.exe"

echo "Stopping Stream Deck..."
taskkill //IM "StreamDeck.exe" //F 2>/dev/null

# Wait for process to fully exit
sleep 2

echo "Starting Stream Deck..."
start "" "$SD_EXE"

echo "Stream Deck restarted."
