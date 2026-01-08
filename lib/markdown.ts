/**
 * Markdown Renderer Utility
 *
 * A simple markdown-to-HTML renderer that handles common markdown syntax
 * including headers, bold/italic, links, code blocks, lists, and tables.
 *
 * @module lib/markdown
 * @example
 * import { renderMarkdown } from '@/lib/markdown'
 * const html = renderMarkdown('# Hello **World**')
 */

/**
 * Converts markdown text to HTML
 *
 * Supports:
 * - Headers (h1, h2, h3)
 * - Bold and italic text
 * - Links
 * - Inline code and code blocks
 * - Unordered lists
 * - Horizontal rules
 * - Tables (GitHub-flavored markdown style)
 *
 * @param markdown - The markdown string to convert
 * @returns HTML string
 *
 * @example
 * // Basic text formatting
 * renderMarkdown('**bold** and *italic*')
 * // Returns: '<p><strong>bold</strong> and <em>italic</em></p>'
 *
 * @example
 * // Table rendering
 * renderMarkdown('| Col1 | Col2 |\n|---|---|\n| A | B |')
 * // Returns: '<table>...</table>'
 */
export function renderMarkdown(markdown: string): string {
    // Handle empty input
    if (!markdown) return ''

    let html = markdown

    // Parse markdown tables first (before other processing)
    const tableRegex = /\|(.+)\|\n\|[-:\| ]+\|\n((?:\|.+\|\n?)+)/g
    html = html.replace(tableRegex, (_match, headerRow: string, bodyRows: string) => {
        // Parse header cells
        const headers = headerRow
            .split('|')
            .map((h: string) => h.trim())
            .filter((h: string) => h)

        const headerHtml = headers
            .map(
                (h: string) =>
                    `<th class="px-4 py-2 text-left font-semibold text-gray-900 bg-gray-50">${h}</th>`
            )
            .join('')

        // Parse body rows
        const rows = bodyRows.trim().split('\n')
        const bodyHtml = rows
            .map((row: string) => {
                const cells = row
                    .split('|')
                    .map((c: string) => c.trim())
                    .filter((c: string) => c)
                const cellsHtml = cells
                    .map((c: string) => `<td class="px-4 py-2 border-t border-gray-200">${c}</td>`)
                    .join('')
                return `<tr>${cellsHtml}</tr>`
            })
            .join('')

        return `<table class="w-full border border-gray-200 rounded-lg overflow-hidden my-4"><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`
    })

    // Code blocks (must be before inline code)
    html = html.replace(
        /```(\w+)?\n([\s\S]*?)```/g,
        '<pre class="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto my-4"><code class="language-$1">$2</code></pre>'
    )

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-8 mb-3">$1</h3>')
    html = html.replace(
        /^## (.*$)/gim,
        '<h2 class="text-2xl font-bold mt-10 mb-4 pb-2 border-b border-gray-200">$1</h2>'
    )
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-10 mb-6">$1</h1>')

    // Bold and italic
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')

    // Links
    html = html.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>'
    )

    // Inline code (not inside pre blocks)
    html = html.replace(
        /`([^`]+)`/g,
        '<code class="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>'
    )

    // Horizontal rules
    html = html.replace(/^---$/gim, '<hr class="border-gray-200 my-8" />')

    // List items
    html = html.replace(/^\- (.*$)/gim, '<li class="ml-4">$1</li>')

    // Paragraphs (convert double newlines)
    html = html.replace(/\n\n/g, '</p><p class="my-4">')

    // Wrap consecutive list items in ul
    html = html.replace(/(<li[\s\S]*?<\/li>)+/g, '<ul class="list-disc pl-6 my-4">$&</ul>')

    // Clean up multiple ul tags
    html = html.replace(/<\/ul>\s*<ul[^>]*>/g, '')

    return `<div class="prose prose-slate max-w-none"><p class="my-4">${html}</p></div>`
}

/**
 * Escapes HTML special characters to prevent XSS
 *
 * @param text - The text to escape
 * @returns Escaped text safe for HTML insertion
 */
export function escapeHtml(text: string): string {
    const htmlEntities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }
    return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char)
}

/**
 * Strips all markdown formatting from text
 *
 * @param markdown - The markdown string to strip
 * @returns Plain text without markdown formatting
 */
export function stripMarkdown(markdown: string): string {
    return markdown
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/`([^`]+)`/g, '$1') // Remove inline code
        .replace(/\*\*\*(.*?)\*\*\*/g, '$1') // Remove bold+italic
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1') // Remove italic
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
        .replace(/^#+\s*/gm, '') // Remove headers
        .replace(/^\-\s*/gm, '') // Remove list markers
        .replace(/\|/g, '') // Remove table markers
        .trim()
}
