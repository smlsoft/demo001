#!/bin/bash
# ตั้งค่า Telegram Webhook
# ใช้: ./scripts/setup-telegram.sh <BOT_TOKEN> <YOUR_DOMAIN>
# ตัวอย่าง: ./scripts/setup-telegram.sh 123456:ABC https://thaiclaw.example.com

BOT_TOKEN=$1
DOMAIN=$2

if [ -z "$BOT_TOKEN" ] || [ -z "$DOMAIN" ]; then
  echo "Usage: ./scripts/setup-telegram.sh <BOT_TOKEN> <DOMAIN>"
  echo "Example: ./scripts/setup-telegram.sh 123456:ABC https://thaiclaw.example.com"
  exit 1
fi

WEBHOOK_URL="${DOMAIN}/api/telegram"

echo "Setting webhook to: ${WEBHOOK_URL}"
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${WEBHOOK_URL}" | jq .

echo ""
echo "Checking webhook info:"
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo" | jq .
