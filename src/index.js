#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = process.env.PAPERFLOW_API_BASE || 'https://paperflow-production-daf5.up.railway.app';
const DEFAULT_EMAIL = 'mcp@paperflowing.com';
const USER_EMAIL = (process.env.PAPERFLOW_EMAIL || DEFAULT_EMAIL).trim().toLowerCase();
const POLL_INTERVAL_MS = 3000;
const DEFAULT_TIMEOUT_MS = 360000;
const parsedTimeout = Number.parseInt(process.env.PAPERFLOW_TIMEOUT_MS || '', 10);
const TIMEOUT_MS = Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : DEFAULT_TIMEOUT_MS;

const server = new Server(
  { name: 'paperflow-mcp', version: '0.2.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'convert_pdf',
      description: 'Convert a PDF (URL, local path, or base64) into structured Markdown.',
      inputSchema: {
        type: 'object',
        properties: {
          source: {
            type: 'string',
            description:
              'PDF URL (http/https), base64 payload, file:/// URI, or absolute local path.',
          },
          filename: {
            type: 'string',
            description: 'Optional display filename. Defaults to paper.pdf.',
          },
        },
        required: ['source'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== 'convert_pdf') {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const args = request.params.arguments ?? {};
  return handleConvertPdf(args);
});

async function handleConvertPdf(args) {
  const sourceRaw = typeof args.source === 'string' ? args.source.trim() : '';
  const filename = typeof args.filename === 'string' && args.filename.trim() ? args.filename.trim() : 'paper.pdf';

  if (!sourceRaw) {
    return text('Missing required input: source.');
  }

  const isUrl = sourceRaw.startsWith('http://') || sourceRaw.startsWith('https://');
  const isDataUri = sourceRaw.startsWith('data:application/pdf;base64,');
  const localPath = normalizeLocalPdfPath(sourceRaw);
  const isLocalPath = Boolean(localPath);

  let pdfBuffer;
  if (isUrl) {
    const res = await fetch(sourceRaw).catch(() => null);
    if (!res || !res.ok) {
      return text(`Could not download PDF from ${sourceRaw}.`);
    }
    pdfBuffer = Buffer.from(await res.arrayBuffer());
  } else if (isLocalPath) {
    try {
      pdfBuffer = await fs.readFile(localPath);
    } catch {
      return text(`Could not read local PDF from ${localPath}.`);
    }
  } else {
    const payload = isDataUri ? sourceRaw.split(',', 2)[1] : sourceRaw;
    const compact = payload.replace(/\s+/g, '');
    if (!looksLikeBase64(compact)) {
      return text('Invalid base64 payload in source.');
    }
    pdfBuffer = Buffer.from(compact, 'base64');
  }

  if (!pdfBuffer || !pdfBuffer.length) {
    return text('No PDF bytes found in source.');
  }

  let jobId;
  try {
    const form = new FormData();
    form.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), filename);
    form.append('email', USER_EMAIL);

    const submitRes = await fetch(`${API_BASE}/api/submit`, { method: 'POST', body: form });
    if (!submitRes.ok) {
      const fallback = `PaperFlow submit failed (${submitRes.status}).`;
      const errorText = await submitRes.text().catch(() => '');
      return text(errorText || fallback);
    }

    const body = await submitRes.json();
    jobId = body.job_id;
    if (!jobId) {
      return text('PaperFlow submit succeeded but no job_id was returned.');
    }
  } catch {
    return text('Could not connect to PaperFlow service during submit.');
  }

  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);

    let status;
    try {
      const statusRes = await fetch(`${API_BASE}/api/jobs/${jobId}/status`);
      if (!statusRes.ok) {
        return text(`Could not poll PaperFlow status (${statusRes.status}).`);
      }
      status = await statusRes.json();
    } catch {
      return text('Could not connect to PaperFlow service during status polling.');
    }

    if (status.status === 'done') {
      break;
    }

    if (status.status === 'failed') {
      const reason = typeof status.error === 'string' && status.error.trim()
        ? status.error.trim()
        : 'PaperFlow failed to convert this PDF.';
      return text(`PaperFlow conversion failed: ${reason}`);
    }
  }

  if (Date.now() >= deadline) {
    return text(`PDF conversion timed out after ${Math.round(TIMEOUT_MS / 1000)} seconds.`);
  }

  try {
    const resultRes = await fetch(`${API_BASE}/api/jobs/${jobId}/result`);
    if (!resultRes.ok) {
      return text(`Could not fetch conversion result (${resultRes.status}).`);
    }
    const markdown = await resultRes.text();
    const sourceLabel = isUrl ? sourceRaw : isLocalPath ? localPath : filename;
    const output = [
      '---',
      `Source: ${sourceLabel}`,
      `Job ID: ${jobId}`,
      'Converted by: PaperFlow',
      '---',
      '',
      markdown,
    ].join('\n');
    return text(output);
  } catch {
    return text('Could not connect to PaperFlow service during result fetch.');
  }
}

function normalizeLocalPdfPath(input) {
  if (typeof input !== 'string') return null;
  const value = input.trim();
  if (!value) return null;

  if (value.startsWith('file://')) {
    try {
      return fileURLToPath(value);
    } catch {
      return null;
    }
  }

  if (/^[a-zA-Z]:[\\/]/.test(value)) {
    return path.normalize(value);
  }

  if (value.startsWith('\\\\')) {
    return value;
  }

  if (value.startsWith('/')) {
    return value;
  }

  return null;
}

function looksLikeBase64(value) {
  if (typeof value !== 'string' || !value) return false;
  if (value.length % 4 !== 0) return false;
  return /^[A-Za-z0-9+/]*={0,2}$/.test(value);
}

function text(content) {
  return { content: [{ type: 'text', text: content }] };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const transport = new StdioServerTransport();
await server.connect(transport);
