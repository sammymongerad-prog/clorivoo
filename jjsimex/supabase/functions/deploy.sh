#!/bin/bash
# Deploy Supabase Edge Functions
# Run: bash supabase/functions/deploy.sh

echo "Deploying send-push..."
supabase functions deploy send-push --no-verify-jwt

echo "Deploying send-email..."
supabase functions deploy send-email --no-verify-jwt

echo "Setting secrets..."
echo "Run these commands with your actual values:"
echo "supabase secrets set RESEND_API_KEY=your_key"
echo "supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key"

echo "Done!"
