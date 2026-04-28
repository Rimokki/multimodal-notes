<script lang="ts" setup>
  import { computed, ref, watch } from 'vue'

  type ColorPickerPanelProps = {
    modelValue?: string
  }

  type PaletteColor = {
    hex: string
    border?: boolean
  }

  const neutralRow: PaletteColor[] = [
    { hex: '#000000' },
    { hex: '#2f3438' },
    { hex: '#676c70' },
    { hex: '#888d8d' },
    { hex: '#bfc1c1' },
    { hex: '#d2d4d4' },
    { hex: '#dde0e1' },
    { hex: '#e9ebec' },
    { hex: '#f3f4f5', border: true },
    { hex: '#fafafa', border: true },
  ]

  const paletteRows: PaletteColor[][] = [
    [
      '#e52f45',
      '#f27d0c',
      '#efb006',
      '#efd529',
      '#78b700',
      '#24b3b7',
      '#2179df',
      '#3a56d9',
      '#652bd2',
      '#cc2d92',
    ].map((hex) => ({ hex })),
    [
      '#e7cfd4',
      '#edd7c5',
      '#e8ddba',
      '#e7dfb8',
      '#d5e1bb',
      '#b9dee4',
      '#b9cde9',
      '#bcc4e8',
      '#cbc3e1',
      '#e2c5d9',
    ].map((hex) => ({ hex })),
    [
      '#e69ba3',
      '#e8aa6b',
      '#e7c979',
      '#e8d560',
      '#abd15f',
      '#7fc6ca',
      '#7da9de',
      '#8693df',
      '#a28adb',
      '#de8bbe',
    ].map((hex) => ({ hex })),
    [
      '#e75061',
      '#ee8f3e',
      '#efbe42',
      '#e1cd00',
      '#86c81f',
      '#1ea9a9',
      '#318ad5',
      '#5468d3',
      '#7c51cd',
      '#d84da8',
    ].map((hex) => ({ hex })),
    [
      '#be2534',
      '#cc6a00',
      '#c99700',
      '#a99700',
      '#618f07',
      '#1a7f80',
      '#1d66bb',
      '#334dbe',
      '#5727aa',
      '#b11f7e',
    ].map((hex) => ({ hex })),
    [
      '#7d0010',
      '#7f4500',
      '#765b00',
      '#665b00',
      '#355100',
      '#0a4b4f',
      '#083f79',
      '#1b2f72',
      '#2d0f75',
      '#670046',
    ].map((hex) => ({ hex })),
  ]

  const props = withDefaults(defineProps<ColorPickerPanelProps>(), {
    modelValue: '',
  })

  const emit = defineEmits<{
    (event: 'update:modelValue', color: string): void
  }>()

  const activeColor = ref('')
  const customHexInput = ref('')

  const HEX_COLOR_REGEXP = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

  const normalizeHexColor = (value: string) => {
    const trimmed = value.trim().toLowerCase()

    if (!trimmed) {
      return ''
    }

    const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`

    if (!HEX_COLOR_REGEXP.test(withHash)) {
      return ''
    }

    if (withHash.length === 4) {
      const [r, g, b] = withHash.slice(1)
      return `#${r}${r}${g}${g}${b}${b}`
    }

    return withHash
  }

  const customColorIcon = computed(() => {
    const normalizedInputColor = normalizeHexColor(customHexInput.value)
    if (normalizedInputColor) {
      return normalizedInputColor
    }

    const normalizedActiveColor = normalizeHexColor(activeColor.value)
    if (normalizedActiveColor) {
      return normalizedActiveColor
    }

    return '#000000'
  })

  watch(
    () => props.modelValue,
    (value) => {
      const normalized = normalizeHexColor(value ?? '')
      activeColor.value = normalized
      customHexInput.value = normalized
    },
    { immediate: true },
  )

  const handlePickColor = (color: string) => {
    const normalized = normalizeHexColor(color)
    activeColor.value = normalized
    customHexInput.value = normalized
    emit('update:modelValue', color)
  }

  const handleCustomHexApply = () => {
    const normalized = normalizeHexColor(customHexInput.value)

    if (!normalized) {
      return
    }

    customHexInput.value = normalized
    handlePickColor(normalized)
  }

  const isColorSelected = (hex: string) => activeColor.value === hex.toLowerCase()

  const isLightColor = (hex: string) => {
    const r = Number.parseInt(hex.slice(1, 3), 16)
    const g = Number.parseInt(hex.slice(3, 5), 16)
    const b = Number.parseInt(hex.slice(5, 7), 16)
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b

    return luminance > 180
  }
</script>

<template>
  <div>
    <el-card class="custom-card flex justify-evenly rounded-lg! w-70">
      <div class="mb-1">
        <button
          type="button"
          class="w-full h-8 px-1.25 rounded-xs hover:bg-gray-200 transition-colors flex items-center gap-2 text-gray-700"
          @click="handlePickColor('')"
        >
          <span :style="{ backgroundColor: '#000000' }" class="w-4.75 h-4.75 rounded-xs shrink-0" />
          <span class="text-[14px] font-semibold leading-none">默认</span>
        </button>
      </div>
      <div class="flex justify-evenly">
        <button
          v-for="item in neutralRow"
          :key="item.hex"
          type="button"
          class="rounded-xs border border-transparent transition-colors flex items-center justify-center min-w-6 h-6 hover:border-gray-300 hover:shadow-sm"
          :class="{
            'border-gray-500': isColorSelected(item.hex),
            'border-gray-300': item.border,
          }"
          @click="handlePickColor(item.hex)"
        >
          <span
            :style="{ backgroundColor: item.hex }"
            class="color-swatch w-4.75 h-4.75 rounded-xs"
          >
            <span
              v-if="isColorSelected(item.hex)"
              class="color-selected-dot"
              :class="{ 'is-dark': isLightColor(item.hex) }"
            />
          </span>
        </button>
      </div>
      <div v-for="(row, rowIndex) in paletteRows" :key="rowIndex" class="flex justify-evenly">
        <button
          v-for="item in row"
          :key="item.hex"
          type="button"
          class="rounded-xs border border-transparent transition-colors flex items-center justify-center min-w-6 h-6 hover:border-gray-300 hover:shadow-sm"
          :class="{
            'border-gray-500': isColorSelected(item.hex),
          }"
          @click="handlePickColor(item.hex)"
        >
          <span
            :style="{ backgroundColor: item.hex }"
            class="color-swatch w-4.75 h-4.75 rounded-xs"
          >
            <span
              v-if="isColorSelected(item.hex)"
              class="color-selected-dot"
              :class="{ 'is-dark': isLightColor(item.hex) }"
            />
          </span>
        </button>
      </div>
      <div class="mt-1">
        <div class="w-full h-8 px-1.25 rounded-xs flex items-center gap-2 text-gray-700">
          <div
            class="flex w-full gap-2 items-center text-[14px] font-semibold leading-none custom-color-input"
          >
            <span :style="{ backgroundColor: customColorIcon }" class="w-5 h-5 rounded-xs" />
            <el-input
              v-model="customHexInput"
              class="flex-1 min-w-0"
              size="small"
              placeholder="输入hex值以自定义颜色，如#000000"
              @keyup.enter="handleCustomHexApply"
              @blur="handleCustomHexApply"
            />
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style>
  .custom-card.el-card .el-card__body {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 2px;
    padding: 8px;
  }

  .color-swatch {
    position: relative;
    display: block;
  }

  .color-selected-dot {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 5px;
    border-radius: 9999px;
    background-color: #ffffff;
    transform: translate(-50%, -50%);
  }

  .color-selected-dot.is-dark {
    background-color: #1f2937;
  }
</style>
