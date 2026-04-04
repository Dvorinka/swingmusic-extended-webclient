<template>
  <div class="confirm-modal">
    <div class="modal-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
    </div>
    <p class="modal-text">{{ text }}</p>
    <div class="modal-actions">
      <button class="action-btn secondary" @click="cancelAction">Cancel</button>
      <button class="action-btn danger" @click="confirmAction">Delete</button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  text: string
  confirmAction: () => void
  cancelAction: () => void
}>()
</script>

<style lang="scss">
@import "@/assets/scss/_modal.scss";

.confirm-modal {
  @include modal-base;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.5rem;
  max-width: 24rem;
  margin: 0 auto;

  .modal-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.5rem;
    height: 3.5rem;
    margin-bottom: 1rem;
    background: rgba(248, 113, 113, 0.1);
    border: 1px solid rgba(248, 113, 113, 0.2);
    border-radius: 50%;

    svg {
      width: 1.75rem;
      height: 1.75rem;
      color: #f87171;
    }
  }

  .modal-text {
    margin: 0 0 1.5rem;
    font-size: 1rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.85);
    line-height: 1.5;
  }

  .modal-actions {
    display: flex;
    gap: 0.75rem;
    width: 100%;
  }

  .action-btn {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.5rem;
    padding: 0.625rem 1rem;
    border-radius: 0.625rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    &.secondary {
      @include modal-button-secondary;
    }

    &.danger {
      @include modal-button-danger;
    }
  }
}
</style>
