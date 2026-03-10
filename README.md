# paperflow-mcp

Minimal MCP server that converts PDF files into structured Markdown using PaperFlow.

## Install

```bash
npm install -g paperflow-mcp
```

Or run without global install:

```bash
npx -y paperflow-mcp
```

## Tool

`convert_pdf`

- Input:
  - `source` (required): PDF URL, base64 payload, `file:///...`, or absolute local path.
  - `filename` (optional): display filename for upload.
- Output:
  - Structured Markdown content from the PaperFlow backend.

## Quick Config

Claude Desktop on macOS/Linux:

```json
{
  "mcpServers": {
    "paperflow": {
      "command": "npx",
      "args": ["-y", "paperflow-mcp"]
    }
  }
}
```

Claude Desktop on Windows:

```json
{
  "mcpServers": {
    "paperflow": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "paperflow-mcp"]
    }
  }
}
```

## Docs

https://www.paperflowing.com

## Environment Variables

- `PAPERFLOW_API_BASE` (optional): API host. Defaults to `https://paperflow-production-daf5.up.railway.app`.
- `PAPERFLOW_EMAIL` (optional): user email for quotas and support. Defaults to `mcp@paperflowing.com`.
- `PAPERFLOW_TIMEOUT_MS` (optional): conversion timeout in milliseconds. Default `360000`.

## Local Development

```bash
npm install
npm run start
```

## Repository Docs

- Setup details: [install.md](./install.md)
- Usage examples: [examples.md](./examples.md)
- Security policy: [SECURITY.md](./SECURITY.md)

