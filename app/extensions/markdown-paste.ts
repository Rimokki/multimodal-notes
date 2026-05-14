import { Extension } from '@tiptap/vue-3'
import { Plugin, PluginKey } from '@tiptap/pm/state'

const SIGNIFICANT_TAGS = /<(?!br\s*\/?>)(?!\/?span\b)(?!\/?div\b)[a-z][^>]*>/i

function isPlainHtml(html: string): boolean {
  return !SIGNIFICANT_TAGS.test(html)
}

function looksLikeMarkdown(text: string): boolean {
  let signals = 0
  if (/^#{1,6}\s+/m.test(text)) signals++ // headings
  if (/^\s*[-*+]\s+/m.test(text)) signals++ // unordered list
  if (/^\s*\d+\.\s+/m.test(text)) signals++ // ordered list
  if (/^>\s+/m.test(text)) signals++ // blockquote
  if (/```/.test(text)) signals++ // code fence
  if (/\[.+?\]\(.+?\)/.test(text)) signals++ // link
  if (/!\[.*?\]\(.+?\)/.test(text)) signals++ // image
  if (/\*\*.+?\*\*|__.+?__/.test(text)) signals++ // bold
  if (/^---+|^\*\*\*+|^___+/m.test(text)) signals++ // hr
  return signals >= 2
}

export const MarkdownPaste = Extension.create({
  name: 'markdownPaste',

  addProseMirrorPlugins() {
    const editor = this.editor

    return [
      new Plugin({
        key: new PluginKey('markdownPaste'),
        props: {
          handlePaste(_view, event) {
            const clipboardData = event.clipboardData
            if (!clipboardData) return false

            const html = clipboardData.getData('text/html')
            const text = clipboardData.getData('text/plain')
            if (!text) return false

            // No HTML or HTML is just structural wrappers → markdown
            if (!html || isPlainHtml(html)) {
              editor.commands.insertContent(text, { contentType: 'markdown' })
              return true
            }

            // HTML has real formatting, but plain text looks like markdown source
            // (e.g. copied from Yuque, GitHub, or a markdown editor)
            if (looksLikeMarkdown(text)) {
              editor.commands.insertContent(text, { contentType: 'markdown' })
              return true
            }

            return false
          },
        },
      }),
    ]
  },
})
