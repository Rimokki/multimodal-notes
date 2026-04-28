import { Details as BaseDetails } from '@tiptap/extension-details'

const mergeAttributes = (...sources: Array<Record<string, any> | undefined>) => {
  const result: Record<string, any> = {}

  sources.forEach((source) => {
    if (!source) {
      return
    }

    Object.entries(source).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return
      }

      result[key] = value
    })
  })

  return result
}

export const Details = BaseDetails.extend({
  addNodeView() {
    return ({ editor, getPos, node, HTMLAttributes }) => {
      const dom = document.createElement('div')
      const attributes = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': this.name,
      })

      Object.entries(attributes).forEach(([key, value]) => dom.setAttribute(key, String(value)))

      const toggle = document.createElement('button')
      toggle.type = 'button'

      const renderToggleButton = (options: { isOpen: boolean; node: any }) => {
        this.options.renderToggleButton({
          element: toggle,
          ...options,
        })
      }

      dom.append(toggle)

      const content = document.createElement('div')
      dom.append(content)

      const toggleDetailsContent = (options?: { setToValue?: boolean; node?: any }) => {
        const { setToValue, node: currentNode = node } = options || {}

        if (setToValue !== undefined) {
          if (setToValue) {
            if (dom.classList.contains(this.options.openClassName)) {
              return
            }
            dom.classList.add(this.options.openClassName)
          } else {
            if (!dom.classList.contains(this.options.openClassName)) {
              return
            }
            dom.classList.remove(this.options.openClassName)
          }
        } else {
          dom.classList.toggle(this.options.openClassName)
        }

        const isOpen = dom.classList.contains(this.options.openClassName)

        renderToggleButton({
          isOpen,
          node: currentNode,
        })

        const event = new Event('toggleDetailsContent')
        const detailsContent = content.querySelector(':scope > div[data-type="detailsContent"]')
        detailsContent?.dispatchEvent(event)
      }

      renderToggleButton({
        isOpen: Boolean(node.attrs.open),
        node,
      })

      if (node.attrs.open) {
        setTimeout(() => toggleDetailsContent())
      }

      toggle.addEventListener('click', () => {
        toggleDetailsContent()

        if (!this.options.persist) {
          editor.commands.focus(undefined, { scrollIntoView: false })
          return
        }

        if (editor.isEditable && typeof getPos === 'function') {
          const { from, to } = editor.state.selection

          editor
            .chain()
            .command(({ tr }) => {
              const pos = getPos()

              // Fix: first top-level node position can be 0, which is a valid position.
              if (pos === undefined) {
                return false
              }

              const currentNode = tr.doc.nodeAt(pos)

              if (currentNode?.type !== this.type) {
                return false
              }

              tr.setNodeMarkup(pos, undefined, {
                open: !currentNode.attrs.open,
              })

              return true
            })
            .setTextSelection({
              from,
              to,
            })
            .focus(undefined, { scrollIntoView: false })
            .run()
        }
      })

      return {
        dom,
        contentDOM: content,
        ignoreMutation(mutation: any) {
          if (mutation.type === 'selection') {
            return false
          }

          const target = mutation.target
          const isInsideWrapper = dom.contains(target)
          const isInsideToggleButton = toggle.contains(target)

          return isInsideToggleButton || !isInsideWrapper || dom === target
        },
        update: (updatedNode) => {
          if (updatedNode.type !== this.type) {
            return false
          }

          if (updatedNode.attrs.open !== undefined) {
            toggleDetailsContent({
              setToValue: updatedNode.attrs.open,
              node: updatedNode,
            })
          } else {
            renderToggleButton({
              isOpen: dom.classList.contains(this.options.openClassName),
              node: updatedNode,
            })
          }

          return true
        },
      }
    }
  },
})
