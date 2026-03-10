# PaperFlow MCP

**PaperFlow MCP** converts academic PDFs into clean, structured Markdown optimized for AI tools and research workflows.

Instead of sending raw PDF text to AI models, PaperFlow extracts high-quality Markdown with preserved LaTeX equations, figures, tables, and citation footnotes.

This makes research papers readable for tools like **Claude, AI agents, Obsidian, and Notion**.

---

## Features

- Convert **PDF -> clean Markdown**
- Preserve **LaTeX equations**
- Extract **figures and tables**
- Convert citations into **Markdown footnotes**
- Structured output optimized for **AI workflows**
- Compatible with **Claude MCP**

---

## Install

```bash
npm install paperflow-mcp
```

---

## Quick Config (Claude Desktop)

macOS/Linux:

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

Windows:

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
