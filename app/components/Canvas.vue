<template>
  <node-view-wrapper class="draw">
    <svg
      ref="canvasRef"
      viewBox="0 0 500 250"
      class="rounded-lg my-4 w-full"
      :class="{ 'pointer-events-none': !isEditable, 'cursor-eraser': canvasState.eraser }"
    >
      <template v-for="item in lines" :key="item.id">
        <path
          v-if="item.id !== currentLineId"
          :id="`id-${item.id}`"
          :d="item.path"
          :stroke="item.color"
          :stroke-width="item.size"
        />
      </template>
    </svg>
  </node-view-wrapper>
</template>

<script setup>
  import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
  import { nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'
  import * as d3 from 'd3'
  import { v4 as uuid } from 'uuid'

  const props = defineProps(nodeViewProps)

  const { state: canvasState, setActiveCanvas } = useCanvasState()

  const canvasRef = ref(null)
  const currentLineId = ref(uuid())

  const lines = computed(() => {
    const raw = props.node.attrs.lines
    if (Array.isArray(raw)) return raw
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }
    return []
  })

  const isEditable = computed(() => props.editor.isEditable)

  let svg = null
  let path = null
  let points = []
  let drawing = false
  let erasing = false

  // --- Drawing ---
  const onStartDrawing = (event) => {
    if (canvasState.eraser) return

    drawing = true
    points = []

    path = svg
      .append('path')
      .data([points])
      .attr('id', `id-${currentLineId.value}`)
      .attr('stroke', canvasState.color)
      .attr('stroke-width', canvasState.size)

    const moveEvent = event.type === 'mousedown' ? 'mousemove' : 'touchmove'
    svg.on(moveEvent, onMove)
  }

  const onMove = (event) => {
    event.preventDefault()
    points.push(d3.pointers(event)[0])
    tick()
  }

  const onEndDrawing = () => {
    svg.on('mousemove', null)
    svg.on('touchmove', null)

    if (!drawing) return

    drawing = false
    svg.select(`#id-${currentLineId.value}`).remove()
    currentLineId.value = uuid()
  }

  const tick = () => {
    requestAnimationFrame(() => {
      if (!drawing) return
      const pathData = d3.line().curve(d3.curveBasis)(points)

      const filteredLines = lines.value.filter((item) => item.id !== currentLineId.value)

      props.updateAttributes({
        lines: [
          ...filteredLines,
          {
            id: currentLineId.value,
            color: canvasState.color,
            size: canvasState.size,
            path: pathData,
          },
        ],
      })

      path.attr('d', pathData)
    })
  }

  // --- Eraser (pointer-based, supports drag) ---
  const eraseAtPoint = (x, y) => {
    const el = document.elementFromPoint(x, y)
    if (!el || el.tagName !== 'path' || !el.getAttribute('stroke-width')) return

    const pathId = el.getAttribute('id')
    if (!pathId) return

    const lineId = pathId.replace('id-', '')
    // Read lines directly from ProseMirror state (synchronously updated),
    // not from Vue computed (lagging behind during rapid pointer moves)
    const { node } = props.editor.state.selection
    if (!node || node.type.name !== 'canvas') return

    const currentLines = Array.isArray(node.attrs.lines) ? node.attrs.lines : []
    const filtered = currentLines.filter((item) => item.id !== lineId)
    if (filtered.length !== currentLines.length) {
      props.updateAttributes({ lines: filtered })
    }
  }

  const onPointerDown = (event) => {
    if (!canvasState.eraser) return
    erasing = true
    eraseAtPoint(event.clientX, event.clientY)
  }

  const onPointerMove = (event) => {
    if (!canvasState.eraser) return
    if (!erasing) return
    eraseAtPoint(event.clientX, event.clientY)
  }

  const onPointerUp = () => {
    erasing = false
  }

  // --- Event binding ---
  const bindEvents = () => {
    if (!svg) return
    svg
      .on('mousedown', isEditable.value ? onStartDrawing : null)
      .on('mouseup', isEditable.value ? onEndDrawing : null)
      .on('mouseleave', isEditable.value ? onEndDrawing : null)
      .on('touchstart', isEditable.value ? onStartDrawing : null)
      .on('touchend', isEditable.value ? onEndDrawing : null)
      .on('touchleave', isEditable.value ? onEndDrawing : null)
      .on('pointerdown', isEditable.value ? onPointerDown : null)
      .on('pointermove', isEditable.value ? onPointerMove : null)
      .on('pointerup', isEditable.value ? onPointerUp : null)
  }

  watch(canvasRef, (el) => {
    if (!el) return
    svg = d3.select(el)
    bindEvents()
  })

  watch(isEditable, () => {
    bindEvents()
  })

  onMounted(() => {
    setActiveCanvas(props.editor)
  })

  onBeforeUnmount(() => {
    if (svg) {
      svg.on('.draw', null)
    }
  })
</script>

<style lang="scss">
  .draw {
    svg {
      background: #f1f3f5;
      cursor: crosshair;

      &.pointer-events-none {
        cursor: default;
      }

      &.cursor-eraser {
        cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2'%3E%3Cpath d='m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21'/%3E%3Cpath d='M22 21H7'/%3E%3Cpath d='m5 11 9 9'/%3E%3C/svg%3E") 10 10, auto;
      }
    }

    path {
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
      pointer-events: visibleStroke;
    }
  }
</style>
