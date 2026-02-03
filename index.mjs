#!/usr/bin/env node
/**
 * Better Playwright MCP - Token-efficient browser automation
 *
 * MCP wrapper for better-playwright HTTP server that exposes
 * getOutline and searchSnapshot tools for ~95% token savings.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const HTTP_SERVER = process.env.BETTER_PLAYWRIGHT_URL || 'http://localhost:3102';

async function request(method, path, body) {
  const response = await fetch(`${HTTP_SERVER}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }
  return response.json();
}

const server = new Server(
  { name: 'better-playwright', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'create_page',
      description: 'Create a new browser page and navigate to URL. Returns pageId for use with other tools.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Page identifier name' },
          description: { type: 'string', description: 'Page description' },
          url: { type: 'string', description: 'URL to navigate to' }
        },
        required: ['name', 'url']
      }
    },
    {
      name: 'get_outline',
      description: 'Get compressed page structure (max ~200 lines). Saves ~95% tokens vs full snapshot. Use this to understand page structure and find element refs.',
      inputSchema: {
        type: 'object',
        properties: {
          pageId: { type: 'string', description: 'Page ID from create_page' }
        },
        required: ['pageId']
      }
    },
    {
      name: 'search_snapshot',
      description: 'Search page content with regex pattern. Returns only matching lines (max 100). Much more efficient than full snapshot for finding specific content.',
      inputSchema: {
        type: 'object',
        properties: {
          pageId: { type: 'string', description: 'Page ID' },
          pattern: { type: 'string', description: 'Regex pattern to search' },
          ignoreCase: { type: 'boolean', description: 'Case insensitive search', default: false },
          lineLimit: { type: 'number', description: 'Max lines to return', default: 100 }
        },
        required: ['pageId', 'pattern']
      }
    },
    {
      name: 'click',
      description: 'Click element by ref ID (e.g., "e5", "e12"). Get refs from get_outline or search_snapshot.',
      inputSchema: {
        type: 'object',
        properties: {
          pageId: { type: 'string', description: 'Page ID' },
          ref: { type: 'string', description: 'Element ref like e3, e4' }
        },
        required: ['pageId', 'ref']
      }
    },
    {
      name: 'type_text',
      description: 'Type text into element by ref ID',
      inputSchema: {
        type: 'object',
        properties: {
          pageId: { type: 'string', description: 'Page ID' },
          ref: { type: 'string', description: 'Element ref' },
          text: { type: 'string', description: 'Text to type' }
        },
        required: ['pageId', 'ref', 'text']
      }
    },
    {
      name: 'navigate',
      description: 'Navigate to URL',
      inputSchema: {
        type: 'object',
        properties: {
          pageId: { type: 'string', description: 'Page ID' },
          url: { type: 'string', description: 'URL to navigate to' }
        },
        required: ['pageId', 'url']
      }
    },
    {
      name: 'screenshot',
      description: 'Take screenshot of page',
      inputSchema: {
        type: 'object',
        properties: {
          pageId: { type: 'string', description: 'Page ID' },
          fullPage: { type: 'boolean', description: 'Capture full page', default: true }
        },
        required: ['pageId']
      }
    },
    {
      name: 'close_page',
      description: 'Close browser page',
      inputSchema: {
        type: 'object',
        properties: {
          pageId: { type: 'string', description: 'Page ID' }
        },
        required: ['pageId']
      }
    },
    {
      name: 'list_pages',
      description: 'List all open browser pages',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'hover',
      description: 'Hover over element by ref ID',
      inputSchema: {
        type: 'object',
        properties: {
          pageId: { type: 'string', description: 'Page ID' },
          ref: { type: 'string', description: 'Element ref' }
        },
        required: ['pageId', 'ref']
      }
    },
    {
      name: 'scroll_to_bottom',
      description: 'Scroll to bottom of page',
      inputSchema: {
        type: 'object',
        properties: {
          pageId: { type: 'string', description: 'Page ID' }
        },
        required: ['pageId']
      }
    },
    {
      name: 'scroll_to_top',
      description: 'Scroll to top of page',
      inputSchema: {
        type: 'object',
        properties: {
          pageId: { type: 'string', description: 'Page ID' }
        },
        required: ['pageId']
      }
    },
    {
      name: 'press_key',
      description: 'Press keyboard key (Enter, Tab, Escape, etc.)',
      inputSchema: {
        type: 'object',
        properties: {
          pageId: { type: 'string', description: 'Page ID' },
          key: { type: 'string', description: 'Key to press' }
        },
        required: ['pageId', 'key']
      }
    }
  ]
}));

server.setRequestHandler('tools/call', async (req) => {
  const { name, arguments: args } = req.params;

  try {
    let result;

    switch (name) {
      case 'create_page':
        result = await request('POST', '/api/pages', {
          name: args.name,
          description: args.description || args.name,
          url: args.url
        });
        return { content: [{ type: 'text', text: `Page created. pageId: ${result.pageId}` }] };

      case 'get_outline':
        result = await request('POST', `/api/pages/${args.pageId}/outline`);
        return { content: [{ type: 'text', text: result.outline }] };

      case 'search_snapshot':
        result = await request('POST', `/api/pages/${args.pageId}/search`, {
          pattern: args.pattern,
          ignoreCase: args.ignoreCase || false,
          lineLimit: args.lineLimit || 100
        });
        const truncatedNote = result.truncated ? ' (truncated)' : '';
        return { content: [{ type: 'text', text: `Found ${result.matchCount} matches${truncatedNote}:\n${result.result}` }] };

      case 'click':
        await request('POST', `/api/pages/${args.pageId}/click`, {
          ref: args.ref,
          element: `Element ref=${args.ref}`
        });
        return { content: [{ type: 'text', text: `Clicked ${args.ref}` }] };

      case 'type_text':
        await request('POST', `/api/pages/${args.pageId}/type`, {
          ref: args.ref,
          text: args.text,
          element: `Element ref=${args.ref}`
        });
        return { content: [{ type: 'text', text: `Typed "${args.text}" into ${args.ref}` }] };

      case 'navigate':
        await request('POST', `/api/pages/${args.pageId}/navigate`, { url: args.url });
        return { content: [{ type: 'text', text: `Navigated to ${args.url}` }] };

      case 'screenshot':
        result = await request('POST', `/api/pages/${args.pageId}/screenshot`, {
          fullPage: args.fullPage !== false
        });
        return {
          content: [{
            type: 'image',
            data: result.screenshot,
            mimeType: 'image/png'
          }]
        };

      case 'close_page':
        await request('DELETE', `/api/pages/${args.pageId}`);
        return { content: [{ type: 'text', text: `Closed page ${args.pageId}` }] };

      case 'list_pages':
        result = await request('GET', '/api/pages');
        if (result.pages?.length === 0) {
          return { content: [{ type: 'text', text: 'No open pages' }] };
        }
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };

      case 'hover':
        await request('POST', `/api/pages/${args.pageId}/hover`, {
          ref: args.ref,
          element: `Element ref=${args.ref}`
        });
        return { content: [{ type: 'text', text: `Hovered over ${args.ref}` }] };

      case 'scroll_to_bottom':
        await request('POST', `/api/pages/${args.pageId}/scroll-bottom`, {});
        return { content: [{ type: 'text', text: 'Scrolled to bottom' }] };

      case 'scroll_to_top':
        await request('POST', `/api/pages/${args.pageId}/scroll-top`, {});
        return { content: [{ type: 'text', text: 'Scrolled to top' }] };

      case 'press_key':
        await request('POST', `/api/pages/${args.pageId}/press`, { key: args.key });
        return { content: [{ type: 'text', text: `Pressed ${args.key}` }] };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
