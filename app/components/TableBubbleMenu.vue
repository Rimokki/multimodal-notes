<template>
  <BubbleMenu
    :editor="editor"
    :should-show="
      ({ editor }) => {
        return editor.isActive('table')
      }
    "
    :get-referenced-virtual-element="getTableVirtualElement"
    :options="{
      placement: 'top',
      offset: 8,
    }"
    class="custom-bubble-menu"
  >
    <el-popover
      trigger="click"
      placement="bottom"
      width="160"
      :show-arrow="false"
      popper-class="table-popover"
      :hide-after="0"
      :teleported="false"
      content="插入行"
    >
      <div class="flex flex-col items-center justify-center insert-popover">
        <button @click="editor.chain().focus().addRowBefore().run()">
          <PanelBottomOpen :size="18" />
          <span>在上方插入行</span>
        </button>
        <button @click="editor.chain().focus().addRowAfter().run()">
          <PanelBottomClose :size="18" />
          <span>在下方插入行</span>
        </button>
      </div>
      <template #reference>
        <button type="button">
          <BetweenHorizontalEnd size="18" />
        </button>
      </template>
    </el-popover>

    <el-popover
      trigger="click"
      placement="bottom"
      width="160"
      :show-arrow="false"
      popper-class="table-popover"
      :hide-after="0"
      :teleported="false"
    >
      <div class="flex flex-col items-center justify-center insert-popover">
        <button @click="editor.chain().focus().addColumnBefore().run()">
          <PanelRightOpen :size="18" />
          <span>在左方插入列</span>
        </button>
        <button @click="editor.chain().focus().addColumnAfter().run()">
          <PanelRightClose :size="18" />
          <span>在右方插入列</span>
        </button>
      </div>
      <template #reference>
        <button type="button">
          <BetweenVerticalStart size="18" />
        </button>
      </template>
    </el-popover>

    <el-popover
      trigger="click"
      placement="bottom"
      width="100"
      :show-arrow="false"
      popper-class="table-popover"
      :hide-after="0"
      :teleported="false"
    >
      <div class="flex flex-col items-center justify-center insert-popover">
        <button @click="editor.chain().focus().deleteRow().run()">
          <span>删除整行</span>
        </button>
        <button @click="editor.chain().focus().deleteColumn().run()">
          <span>删除整列</span>
        </button>
        <button @click="editor.chain().focus().deleteTable().run()">
          <span>删除表格</span>
        </button>
      </div>
      <template #reference>
        <button type="button">
          <Trash2 size="18" />
        </button>
      </template>
    </el-popover>

    <el-tooltip
      content="合并/拆分单元格"
      placement="top"
      effect="light"
      :show-arrow="false"
      :hide-after="0"
    >
      <button type="button" @click="editor.chain().focus().mergeOrSplit().run()">
        <TableCellsMerge size="18" />
      </button>
    </el-tooltip>

    <el-tooltip
      content="设置/移除表头单元格"
      placement="top"
      effect="light"
      :show-arrow="false"
      :hide-after="0"
    >
      <button type="button" @click="editor.chain().focus().toggleHeaderCell().run()">
        <TableProperties size="18" />
      </button>
    </el-tooltip>

    <el-popover
      trigger="click"
      placement="bottom"
      width="120"
      :show-arrow="false"
      popper-class="table-popover"
      :hide-after="0"
      :teleported="false"
    >
      <div class="header-switches">
        <div class="header-switch">
          <span class="header-label">标题行</span>
          <el-switch :model-value="headerRowEnabled" size="small" @change="toggleHeaderRow" />
        </div>
        <div class="header-switch">
          <span class="header-label">标题列</span>
          <el-switch :model-value="headerColumnEnabled" size="small" @change="toggleHeaderColumn" />
        </div>
      </div>
      <template #reference>
        <button type="button">
          <PanelsTopLeft size="18" />
        </button>
      </template>
    </el-popover>
  </BubbleMenu>
</template>

<script setup>
  import { onBeforeUnmount, onMounted, ref } from 'vue'
  import { BubbleMenu } from '@tiptap/vue-3/menus'
  import {
    Trash2,
    TableProperties,
    BetweenVerticalStart,
    BetweenHorizontalEnd,
    PanelBottomOpen,
    PanelBottomClose,
    PanelRightOpen,
    PanelRightClose,
    PanelsTopLeft,
    TableCellsMerge,
  } from 'lucide-vue-next'

  const { editor } = defineProps({
    editor: {
      type: Object,
      required: true,
    },
  })

  const headerRowEnabled = ref(false)
  const headerColumnEnabled = ref(false)

  const findTableNode = () => {
    if (!editor?.state) {
      return null
    }

    const { $from } = editor.state.selection

    for (let depth = $from.depth; depth > 0; depth -= 1) {
      const node = $from.node(depth)

      if (node.type.name === 'table') {
        return node
      }
    }

    return null
  }

  const getTableVirtualElement = () => {
    if (!editor?.view?.dom) {
      return null
    }

    const { $from } = editor.state.selection

    for (let depth = $from.depth; depth > 0; depth -= 1) {
      const node = $from.node(depth)

      if (node.type.name === 'table') {
        const dom = editor.view.nodeDOM($from.before(depth))

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
    }

    return null
  }

  const hasHeaderRow = (tableNode) => {
    if (!tableNode || tableNode.childCount === 0) {
      return false
    }

    const firstRow = tableNode.child(0)

    if (!firstRow || firstRow.childCount === 0) {
      return false
    }

    for (let index = 0; index < firstRow.childCount; index += 1) {
      if (firstRow.child(index).type.name !== 'tableHeader') {
        return false
      }
    }

    return true
  }

  const hasHeaderColumn = (tableNode) => {
    if (!tableNode || tableNode.childCount === 0) {
      return false
    }

    for (let rowIndex = 0; rowIndex < tableNode.childCount; rowIndex += 1) {
      const row = tableNode.child(rowIndex)

      if (!row || row.childCount === 0) {
        return false
      }

      if (row.child(0).type.name !== 'tableHeader') {
        return false
      }
    }

    return true
  }

  const syncHeaderState = () => {
    const tableNode = findTableNode()

    headerRowEnabled.value = hasHeaderRow(tableNode)
    headerColumnEnabled.value = hasHeaderColumn(tableNode)
  }

  const toggleHeaderRow = () => {
    editor.chain().focus().toggleHeaderRow().run()
    syncHeaderState()
  }

  const toggleHeaderColumn = () => {
    editor.chain().focus().toggleHeaderColumn().run()
    syncHeaderState()
  }

  onMounted(() => {
    syncHeaderState()
    editor.on('selectionUpdate', syncHeaderState)
    editor.on('transaction', syncHeaderState)
  })

  onBeforeUnmount(() => {
    editor.off('selectionUpdate', syncHeaderState)
    editor.off('transaction', syncHeaderState)
  })
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
    }
  }

  .header-switches {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .header-switch {
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .header-label {
    font-size: 14px;
    color: #333;
  }

  .insert-popover {
    button {
      width: 100%;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: none;
      border: none;
      border-radius: 8px;
      padding: 8px;
      cursor: pointer;
      color: #444;

      &:hover {
        background-color: #f0f0f0;
        border-radius: 8px;
      }
    }
  }
</style>

<style>
  .table-popover {
    border-radius: 8px !important;
    padding: 8px 12px !important;
    min-width: 120px !important;
    font-weight: 500 !important;
  }
</style>
