<template>
  <div
    class="toc-item"
    :class="{
      'is-active': isActive,
    }"
    :style="{ '--level': item.level }"
  >
    <a
      class="toc-link"
      :href="'#' + item.id"
      :data-item-index="item.itemIndex"
      @click.prevent="onItemClick"
    >
      {{ item.textContent }}
    </a>
  </div>
</template>

<script>
  import { defineComponent } from 'vue'

  export default defineComponent({
    props: {
      item: {
        type: Object,
        required: true,
      },
      isActive: {
        type: Boolean,
        default: false,
      },
      index: {
        type: Number,
        required: true,
      },
    },

    emits: ['item-click'],

    methods: {
      onItemClick() {
        this.$emit('item-click', this.item.id)
      },
    },
  })
</script>

<style scoped>
  .toc-item {
    padding-left: calc((var(--level) - 1) * 0.75rem);
    min-width: 0;
  }

  .toc-link {
    display: block;
    font-size: 0.875rem;
    line-height: 1.35rem;
    color: #4b5563;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    border-left: 2px solid transparent;
    padding: 0.2rem 0.25rem 0.2rem 0.5rem;
    transition:
      color 0.2s ease,
      border-color 0.2s ease,
      background-color 0.2s ease;
    border-radius: 0.25rem;
  }

  .toc-item.is-active .toc-link {
    color: #1f2937;
    border-left-color: #10b981;
    background: #ecfdf5;
    font-weight: 600;
  }

  .toc-link:hover {
    color: #111827;
    background: #f3f4f6;
  }
</style>
