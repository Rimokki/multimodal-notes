<template>
  <div v-if="items.length > 0" class="toc-panel">
    <ToCItem
      v-for="(item, i) in items"
      :key="item.id"
      :item="item"
      :index="i + 1"
      :is-active="isItemActive(item)"
      @item-click="onItemClick"
    />
  </div>

  <Teleport to="#toc-actions-target">
    <button
      v-if="items.length > 0"
      class="toc-back-top text-gray-500 font-medium"
      type="button"
      @click="scrollToTop"
    >
      回到顶部
    </button>
  </Teleport>

  <div v-if="items.length === 0" class="toc-empty-hint">添加内容标题后自动生成目录</div>
</template>

<script>
  import { TextSelection } from '@tiptap/pm/state'
  import { defineComponent } from 'vue'

  import ToCItem from './ToCItem.vue'

  export default defineComponent({
    components: {
      ToCItem,
    },

    props: {
      items: {
        type: Array,
        default: () => [],
      },
      editor: {
        type: Object,
        required: true,
      },
    },

    data() {
      return {
        manualActiveId: null,
      }
    },

    watch: {
      items: {
        handler(nextItems) {
          const activeItem = nextItems.find((item) => item.isActive && !item.isScrolledOver)

          if (activeItem) {
            this.manualActiveId = activeItem.id
            return
          }

          if (nextItems.length === 0) {
            this.manualActiveId = null
          }
        },
        deep: true,
        immediate: true,
      },
    },

    methods: {
      isItemActive(item) {
        return item.id === this.manualActiveId || (item.isActive && !item.isScrolledOver)
      },

      getVisibleHeadingElements() {
        const selector =
          '.note-rich-content .ProseMirror h1, .note-rich-content .ProseMirror h2, .note-rich-content .ProseMirror h3'

        return Array.from(document.querySelectorAll(selector)).filter(
          (el) => el.offsetParent !== null,
        )
      },

      getFallbackElementByItemOrder(id) {
        const itemIndex = this.items.findIndex((item) => item.id === id)

        if (itemIndex < 0) {
          return null
        }

        const visibleHeadings = this.getVisibleHeadingElements()

        return visibleHeadings[itemIndex] || null
      },

      getVisibleAnchorElement(id) {
        const selector = `[data-toc-id="${id}"]`
        const candidates = Array.from(document.querySelectorAll(selector))

        const visibleEl = candidates.find((el) => el.offsetParent !== null)

        if (visibleEl) {
          return visibleEl
        }

        return (
          this.getFallbackElementByItemOrder(id) ||
          this.editor?.view?.dom?.querySelector(selector) ||
          null
        )
      },

      getScrollContainer(element) {
        const explicitContainer = document.getElementById('editor-scroll-container')

        if (explicitContainer) {
          return explicitContainer
        }

        let current = element?.parentElement || null

        while (current) {
          const style = window.getComputedStyle(current)
          const canScrollY = /(auto|scroll)/.test(style.overflowY)

          if (canScrollY && current.scrollHeight > current.clientHeight) {
            return current
          }

          current = current.parentElement
        }

        return window
      },

      scrollToElement(element) {
        const scrollContainer = this.getScrollContainer(element)

        if (scrollContainer === window) {
          window.scrollTo({
            top: element.getBoundingClientRect().top + window.scrollY,
            behavior: 'smooth',
          })
          return
        }

        const containerRect = scrollContainer.getBoundingClientRect()
        const elementRect = element.getBoundingClientRect()
        const top = scrollContainer.scrollTop + (elementRect.top - containerRect.top)

        scrollContainer.scrollTo({
          top,
          behavior: 'smooth',
        })
      },

      onItemClick(id) {
        if (this.editor) {
          const element = this.getVisibleAnchorElement(id)

          if (!element) {
            return
          }

          this.manualActiveId = id

          if (this.editor.view.dom.contains(element)) {
            const pos = this.editor.view.posAtDOM(element, 0)

            // Keep editor selection in sync when navigating from the outline.
            const tr = this.editor.view.state.tr

            tr.setSelection(new TextSelection(tr.doc.resolve(pos)))

            this.editor.view.dispatch(tr)

            this.editor.view.focus()
          }

          if (history.replaceState) {
            history.replaceState(null, null, `#${id}`)
          }

          this.scrollToElement(element)
        }
      },

      scrollToTop() {
        const scrollContainer = this.getScrollContainer(null)

        if (scrollContainer === window) {
          window.scrollTo({
            top: 0,
            behavior: 'smooth',
          })
          return
        }

        scrollContainer.scrollTo({
          top: 0,
          behavior: 'smooth',
        })
      },
    },
  })
</script>

<style scoped>
  .toc-panel {
    padding: 0 1rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .toc-empty-hint {
    padding: 0 1.5rem;
    color: #9ca3af;
    font-size: 0.875rem;
    line-height: 1.25rem;
  }

  .toc-back-top {
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    line-height: 1rem;
    padding: 0.375rem 0.5rem;
    background: #ffffff;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .toc-back-top:hover {
    border-color: #d1d5db;
    background: #f9fafb;
    color: #1f2937;
  }
</style>
