# Better Playwright MCP

Token-efficient Playwright MCP with `getOutline` and `searchSnapshot` - saves ~95% tokens vs full snapshots.

This is a fork of [livoras/better-playwright-mcp](https://github.com/livoras/better-playwright-mcp) with critical fixes applied.

## Token Savings

| Method | Lines | Characters | Savings |
|--------|-------|------------|---------|
| Official Playwright MCP (full snapshot) | 673 | ~42,000 | - |
| Better Playwright (getOutline) | 48 | ~2,100 | **95%** |

## Fixes Applied

### 1. Snapshot Bug Fix
The original package's `page._snapshotForAI()` returns `{ full: "..." }` object instead of string in newer Playwright versions, causing `snapshot.split is not a function` error.

```javascript
// Before (broken):
const snapshot = await pageInfo.page._snapshotForAI();

// After (fixed):
const rawSnapshot = await pageInfo.page._snapshotForAI();
const snapshot = typeof rawSnapshot === 'string' ? rawSnapshot : rawSnapshot?.full ?? '';
```

### 2. Missing MCP Server
The original npm package references `dist/mcp-server.js` which doesn't exist. This fork includes a proper MCP wrapper (`index.mjs`).

### 3. MCP SDK API Compatibility
The MCP SDK (v1.0+) changed from string-based to schema-based request handlers. This fork uses the new API:

```javascript
// Old API (broken with MCP SDK v1.0+):
server.setRequestHandler('tools/list', async () => {...});
server.setRequestHandler('tools/call', async (req) => {...});

// New API (fixed):
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

server.setRequestHandler(ListToolsRequestSchema, async () => {...});
server.setRequestHandler(CallToolRequestSchema, async (req) => {...});
```

## Installation

### Global Installation (Recommended)

```bash
npm install -g github:ekuznetski/better-playwright-mcp
```

### Per-Project Installation

```bash
# npm
npm install github:ekuznetski/better-playwright-mcp

# pnpm
pnpm add github:ekuznetski/better-playwright-mcp

# yarn
yarn add github:ekuznetski/better-playwright-mcp
```

## Setup

### Step 1: Start HTTP Server

The HTTP server must be running for the MCP to work.

```bash
# If installed globally
better-playwright-server

# If installed per-project
./node_modules/.bin/better-playwright-server

# Or with npx
npx better-playwright-server
```

By default, the server runs on port 3102. Set `PORT` environment variable to change.

### Step 2: Configure MCP

#### Claude Code (Project Config)

Create `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "better-playwright": {
      "command": "better-playwright-mcp",
      "env": {
        "BETTER_PLAYWRIGHT_URL": "http://localhost:3102"
      }
    }
  }
}
```

#### Claude Code (Global Config)

Add to `~/.claude.json`:

```json
{
  "mcpServers": {
    "better-playwright": {
      "command": "better-playwright-mcp",
      "env": {
        "BETTER_PLAYWRIGHT_URL": "http://localhost:3102"
      }
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `create_page` | Create a new browser page and navigate to URL. Returns `pageId`. |
| `get_outline` | Get compressed page structure (max ~200 lines). **95% token savings.** |
| `search_snapshot` | Search page content with regex. Returns only matching lines (max 100). |
| `click` | Click element by ref ID (e.g., "e5", "e12"). |
| `type_text` | Type text into element by ref ID. |
| `hover` | Hover over element by ref ID. |
| `navigate` | Navigate to URL. |
| `screenshot` | Take screenshot of page. |
| `press_key` | Press keyboard key (Enter, Tab, Escape, etc.). |
| `scroll_to_top` | Scroll to top of page. |
| `scroll_to_bottom` | Scroll to bottom of page. |
| `list_pages` | List all open browser pages. |
| `close_page` | Close browser page. |

## Usage Example

```
1. create_page(name: "hn", url: "https://news.ycombinator.com")
   -> Returns pageId: "abc-123"

2. get_outline(pageId: "abc-123")
   -> Returns compressed page structure with element refs

3. click(pageId: "abc-123", ref: "e5")
   -> Clicks on element with ref="e5"
```

## Running HTTP Server as Background Service

### macOS (launchd)

```bash
cat > ~/Library/LaunchAgents/com.better-playwright.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.better-playwright</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/better-playwright-server</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
EOF

launchctl load ~/Library/LaunchAgents/com.better-playwright.plist
```

### Linux (systemd)

```bash
mkdir -p ~/.config/systemd/user

cat > ~/.config/systemd/user/better-playwright.service << 'EOF'
[Unit]
Description=Better Playwright HTTP Server

[Service]
ExecStart=/usr/local/bin/better-playwright-server
Restart=always

[Install]
WantedBy=default.target
EOF

systemctl --user enable better-playwright
systemctl --user start better-playwright
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3102 | HTTP server port |
| `BETTER_PLAYWRIGHT_URL` | http://localhost:3102 | URL for MCP to connect to HTTP server |

## Troubleshooting

### MCP not connecting / "Schema is missing a method literal"

If you see this error when Claude Code tries to connect:
```
Error: Schema is missing a method literal
```

This means the MCP SDK API changed. Ensure you have the latest version of this package:

```bash
npm update -g github:ekuznetski/better-playwright-mcp
```

The fix uses schema-based handlers instead of string-based ones (see "Fixes Applied" section above).

### Server not starting

```bash
# Check if port is in use
lsof -i :3102

# Kill existing process
lsof -ti :3102 | xargs kill -9
```

### ripgrep binary missing

If you see `/bin/sh: .../rg: No such file or directory`:

```bash
cd node_modules/@vscode/ripgrep && npm run postinstall
```

### Connection refused

Make sure the HTTP server is running before using the MCP tools:

```bash
better-playwright-server
```

The server should output: `Better Playwright HTTP server running on port 3102`

## License

MIT

## Credits

- Original: [livoras/better-playwright-mcp](https://github.com/livoras/better-playwright-mcp)
- Fork with fixes: [ekuznetski/better-playwright-mcp](https://github.com/ekuznetski/better-playwright-mcp)
