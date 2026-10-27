#!/bin/zsh
# Start the Talk to Figma WebSocket relay (patched: 127.0.0.1:3055 only).
cd "${0:A:h}" && exec "${BUN:-$(command -v bun || echo "$HOME/.bun/bin/bun")}" run src/socket.ts
