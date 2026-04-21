import { Node, mergeAttributes } from '@tiptap/vue-3'
import { Plugin } from '@tiptap/pm/state'

function extractAttrsFromCardElement(element: HTMLElement) {
  const wrapperHref = element.getAttribute('data-href') || ''
  const wrapperTitle = element.getAttribute('data-title') || ''

  const anchor = element.querySelector('a[data-kind="FILE"], a[href*="kind=FILE"]')
  const anchorHref = anchor?.getAttribute('href') || ''

  let anchorTitle = ''
  if (anchor) {
    const cloned = anchor.cloneNode(true) as HTMLElement
    const strong = cloned.querySelector('strong')
    if (strong) {
      strong.remove()
    }
    anchorTitle = cloned.textContent?.replace(/\n/g, '').trim() || ''
  }

  return {
    href: wrapperHref || anchorHref,
    title: wrapperTitle || anchorTitle,
  }
}

export const FileCard = Node.create({
  name: 'fileCard',
  group: 'block',
  atom: true,
  selectable: true,
  isolating: true,

  addAttributes() {
    return {
      href: {
        default: '',
      },
      title: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="file-card"]',
        getAttrs: (element: unknown) => {
          if (!(element instanceof HTMLElement)) {
            return false
          }

          return extractAttrsFromCardElement(element)
        },
      },
      {
        tag: 'a[href*="kind=FILE"]',
        getAttrs: (element: unknown) => {
          if (!(element instanceof HTMLElement)) {
            return false
          }

          const title =
            element.getAttribute('data-title') ||
            element.textContent?.replace(/\n/g, '').trim() ||
            ''

          return {
            href: element.getAttribute('href') || '',
            title,
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    const href = String(HTMLAttributes.href || '')
    const title = String(HTMLAttributes.title || '未命名文件')

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-type': 'file-card',
        class: 'file-card',
        contenteditable: 'false',
        'data-href': href,
        'data-title': title,
      }),
      [
        'a',
        {
          href,
          target: '_blank',
          rel: 'noopener noreferrer',
          'data-kind': 'FILE',
        },
        ['strong', {}, '附件'],
        ['br'],
        title,
      ],
    ]
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleClickOn: (_view, _pos, node, _nodePos, event) => {
            if (node.type.name !== 'fileCard') {
              return false
            }

            const target = event.target
            if (!(target instanceof HTMLElement)) {
              return true
            }

            const anchor = target.closest('a[data-kind="FILE"]') as HTMLAnchorElement | null
            const href = anchor?.getAttribute('href') || String(node.attrs.href || '')

            if (!href) {
              return true
            }

            event.preventDefault()
            return true
          },
        },
      }),
    ]
  },
})
