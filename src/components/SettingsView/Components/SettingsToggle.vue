<template>
  <button
    class="settings-toggle"
    :class="{ active: modelValue }"
    type="button"
    role="switch"
    :aria-checked="modelValue ? 'true' : 'false'"
    @click="$emit('toggle')"
  >
    <span class="thumb"></span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean;
}>();

defineEmits<{
  (e: "toggle"): void;
}>();
</script>

<style lang="scss" scoped>
.settings-toggle {
  width: 56px;
  height: 32px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.16);
  padding: 2px;
  display: flex;
  align-items: center;
  transition: background-color 0.2s ease, border-color 0.2s ease;

  .thumb {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.2s ease, background-color 0.2s ease;
    transform: translateX(0);
  }

  &.active {
    background: #f4f5f7;
    border-color: #f4f5f7;

    .thumb {
      background: #060608;
      transform: translateX(24px);
    }
  }
}
</style>
