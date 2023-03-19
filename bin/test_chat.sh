#!/bin/bash

set -o xtrace

curl --no-buffer $URL \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d "$(cat << EOF
{
  "model": "gpt-3.5-turbo",
  "stream": true,
  "messages": [{"role": "user", "content": "Hello!"}]
}
EOF
)"
