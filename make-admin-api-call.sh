#!/bin/bash

# Script to make a user admin via API call
# Usage: ./make-admin-api-call.sh <email> [server_url]

EMAIL=${1:-"ardikmachhi@gmail.com"}
SERVER_URL=${2:-"https://your-app-url.com"}
ADMIN_KEY="make-admin-2024"

echo "Making user admin..."
echo "Email: $EMAIL"
echo "Server: $SERVER_URL"
echo ""

curl -X POST "$SERVER_URL/api/setup/make-admin" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"adminKey\": \"$ADMIN_KEY\"
  }" \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "Done!"