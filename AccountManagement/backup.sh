#!/bin/bash

# Set the date format for the backup file
DATE=$(date +"%Y-%m-%d_%H-%M-%S")

# Create a directory for backups if it doesn't exist
mkdir -p backups

# Use the Supabase CLI to create a backup
echo "Creating database backup..."
npx supabase db dump -f "backups/backup_$DATE.sql"

echo "Backup created: backups/backup_$DATE.sql"
