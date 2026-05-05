import { mergeAttributes, Node, VueNodeViewRenderer } from '@tiptap/vue-3'

import Canvas from '~/components/Canvas.vue'

export default Node.create({
  name: 'canvas',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      lines: {
        default: [],
        parseHTML: (element) => {
          const raw = element.getAttribute('data-lines')
          if (!raw) return []
          try {
            const parsed = JSON.parse(raw)
            return Array.isArray(parsed) ? parsed : []
          } catch {
            return []
          }
        },
        renderHTML: (attributes) => {
          return { 'data-lines': JSON.stringify(attributes.lines ?? []) }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="canvas"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'canvas' })]
  },

  addNodeView() {
    return VueNodeViewRenderer(Canvas)
  },
})
