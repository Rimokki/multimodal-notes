<template>
  <BubbleMenu
    :editor="editor"
    :should-show="isCanvasSelected"
    :get-referenced-virtual-element="getCanvasVirtualElement"
    :options="{
      placement: 'top',
      offset: 8,
    }"
    class="custom-bubble-menu"
  >
    <el-popover
      trigger="click"
      placement="bottom"
      width="auto"
      :show-arrow="false"
      popper-class="table-popover"
      :hide-after="0"
      :teleported="false"
    >
      <div class="flex gap-1.5 items-center" @mousedown.prevent>
        <button
          v-for="c in colors"
          :key="c"
          class="color-btn"
          :class="{ 'is-active': state.color === c }"
          :style="{ backgroundColor: c }"
          @click="state.color = c"
        />
      </div>
      <template #reference>
        <button type="button" @mousedown.prevent>
          <Palette size="18" />
        </button>
      </template>
    </el-popover>

    <el-popover
      trigger="click"
      placement="bottom"
      width="200"
      :show-arrow="false"
      popper-class="table-popover"
      :hide-after="0"
      :teleported="false"
    >
      <div class="flex items-center gap-3 px-1">
        <span class="text-xs text-gray-500 whitespace-nowrap">画笔粗细</span>
        <el-slider v-model="state.size" :min="1" :max="10" :step="1" size="small" />
      </div>
      <template #reference>
        <button type="button" @mousedown.prevent>
          <Brush size="18" />
        </button>
      </template>
    </el-popover>

    <button
      type="button"
      :class="{ 'is-active': state.eraser }"
      @mousedown.prevent
      @click="state.eraser = !state.eraser"
    >
      <Eraser size="18" />
    </button>

    <el-tooltip content="删除画布" placement="top" :show-arrow="false" effect="light">
      <button type="button" @click="deleteCanvas">
        <Trash2 size="18" />
      </button>
    </el-tooltip>
  </BubbleMenu>
</template>

<script setup>
  import { NodeSelection } from '@tiptap/pm/state'
  import { BubbleMenu } from '@tiptap/vue-3/menus'
  import { Palette, Brush, Eraser, Trash2 } from 'lucide-vue-next'

  const { editor } = defineProps({
    editor: {
      type: Object,
      required: true,
    },
  })

  const { colors, state } = useCanvasState()

  const isCanvasSelected = () => {
    const { selection } = editor.state
    return selection instanceof NodeSelection && selection.node.type.name === 'canvas'
  }

  const deleteCanvas = () => {
    const { selection } = editor.state
    if (selection instanceof NodeSelection && selection.node.type.name === 'canvas') {
      editor.chain().focus().deleteRange({ from: selection.from, to: selection.to }).run()
    }
  }

  const getCanvasVirtualElement = () => {
    if (!editor?.view?.dom) {
      return null
    }

    const { selection } = editor.state

    if (selection instanceof NodeSelection && selection.node.type.name === 'canvas') {
      const dom = editor.view.nodeDOM(selection.from)

      if (dom) {
        return {
          getBoundingClientRect: () => {
            const rect = dom.getBoundingClientRect()
            return new DOMRect(rect.x + rect.width / 2, rect.y, 0, 0)
          },
          getClientRects: () => [dom.getBoundingClientRect()],
        }
      }
    }

    return null
  }
</script>

<style lang="scss" scoped>
  .custom-bubble-menu {
    display: flex;
    gap: 8px;
    padding: 4px 8px;
    background: #ffffff;
    border: 1px solid #eee;
    border-radius: 8px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    z-index: 100;

    button {
      min-width: 32px;
      height: 32px;
      background: none;
      border: none;
      border-radius: 8px;
      padding: 4px 8px;
      cursor: pointer;
      font-size: 14px;
      color: #444;

      &:hover {
        background-color: #f0f0f0;
        border-radius: 8px;
      }

      &.is-active {
        background-color: #e8f5e9;
        color: #00dc82;
      }
    }
  }

  .color-btn {
    width: 24px !important;
    min-width: 24px !important;
    height: 24px !important;
    border-radius: 50% !important;
    border: 2px solid transparent !important;
    cursor: pointer;
    transition: border-color 0.2s;
    padding: 0 !important;

    &:hover {
      opacity: 0.8;
    }

    &.is-active {
      border-color: #333 !important;
    }
  }
</style>
