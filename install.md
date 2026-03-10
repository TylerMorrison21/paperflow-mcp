# Install Guide

## 1. Install

```bash
npm install -g paperflow-mcp
```

## 2. Configure your MCP client

Use one of these command options:

- `npx -y paperflow-mcp`
- `paperflow-mcp` (if globally installed and in PATH)

## 3. Optional environment configuration

Set before launching your MCP client:

```bash
PAPERFLOW_EMAIL=you@example.com
PAPERFLOW_API_BASE=https://paperflow-production-daf5.up.railway.app
PAPERFLOW_TIMEOUT_MS=360000
```

## 4. Verify

Ask your MCP-enabled assistant:

`Convert https://arxiv.org/pdf/1706.03762.pdf with convert_pdf`

