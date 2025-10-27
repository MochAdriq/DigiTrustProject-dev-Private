#!/bin/bash

# Check if a backup file is provided
if [ -z "$1" ]; then
  echo "Usage: ./restore.sh <backup_file>"
  exit 1
fi

# Check if the backup file exists
if [ ! -f "$1" ]; then
  echo "Error: Backup file not found: $1"
  exit 1
fi

# Use the Supabase CLI to restore the backup
echo "Restoring database from backup: $1"
npx supabase db restore -f "$1"

echo "Database restored successfully!"
