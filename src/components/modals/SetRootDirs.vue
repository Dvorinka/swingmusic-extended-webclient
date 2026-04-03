<template>
  <div class="folder-browser-modal">
    <!-- Breadcrumb Navigation -->
    <div class="breadcrumb-nav">
      <button class="breadcrumb-root" @click="fetchDirs('$root')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
        </svg>
        <span>Root</span>
      </button>
      <div class="breadcrumb-items">
        <BreadCrumbNav :sub-paths="subPaths" @navigate="fetchDirs" />
      </div>
    </div>

    <!-- Current Path Display -->
    <div class="current-path">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
      </svg>
      <span>{{ current || 'Select a folder' }}</span>
    </div>

    <!-- Folder Browser -->
    <div class="browser-content">
      <div v-if="no_more_dirs" class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
            <path d="M12 11v6M9 14h6"/>
          </svg>
        </div>
        <h4>No folders here</h4>
        <p>This directory is empty. You can add this location as a music folder.</p>
      </div>

      <div v-else class="folder-grid scrollable">
        <FolderItem
          v-for="dir in dirs"
          :key="dir.name"
          :folder="dir"
          :is_checked="selected.includes(dir.path)"
          @navigate="fetchDirs(dir.path)"
          @check="handleCheck(dir.path)"
        />
      </div>
    </div>

    <!-- Selected Folders Summary -->
    <div v-if="selected.length > 0" class="selected-summary">
      <div class="summary-label">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span>{{ selected.length }} folder{{ selected.length !== 1 ? 's' : '' }} selected</span>
      </div>
      <div class="selected-list">
        <div v-for="path in selected.slice(0, 3)" :key="path" class="selected-item">
          {{ truncatePath(path) }}
        </div>
        <div v-if="selected.length > 3" class="selected-more">
          +{{ selected.length - 3 }} more
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="browser-actions">
      <button class="action-btn secondary" @click="selectHere" :disabled="current === '$root' || current === '/'">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        <span>Add Current Folder</span>
      </button>
      <button class="action-btn primary" @click="submitFolders" :disabled="getNewDirs().length === 0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 13l4 4L19 7"/>
        </svg>
        <span>Add Selected ({{ getNewDirs().length }})</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, Ref, ref } from "vue";

import { addRootDirs, getFolders, getRootDirs } from "@/requests/settings/rootdirs";

import { Folder, subPath } from "@/interfaces";
import useSettingsStore from "@/stores/settings";
import { createSubPaths } from "@/utils";

import BreadCrumbNav from "../FolderView/BreadCrumbNav.vue";
import FolderItem from "../FolderView/FolderItem.vue";

const settings = useSettingsStore();

const dirs: Ref<Folder[]> = ref([]);
const no_more_dirs = ref(false);
const selected = ref<string[]>([]);

const subPaths = ref<subPath[]>([]);

const prev_selected: string[] = [];

let oldpath = "";
let current = "";

const emit = defineEmits<{
  (e: "hideModal"): void;
}>();

function fetchDirs(path: string) {
  getFolders(path)
    .then((folders) => {
      dirs.value = folders;
      no_more_dirs.value = folders.length == 0;
      const res = createSubPaths(path, oldpath);
      oldpath = res[0];
      subPaths.value = res[1];
    })
    .then(() => (current = path == "$home" ? "" : path));
}

function handleCheck(path: string) {
  if (selected.value.includes(path)) {
    selected.value = selected.value.filter((p) => p != path);
  } else {
    selected.value.push(path);
  }
}

// All dir entries that were unchecked.
function getRemovedDirs() {
  return prev_selected.filter((dir) => !selected.value.includes(dir));
}

// All dir entries that were newly checked.
function getNewDirs() {
  return selected.value.filter((dir) => !prev_selected.includes(dir));
}

function truncatePath(path: string, maxLength: number = 40): string {
  if (path.length <= maxLength) return path;
  const parts = path.split('/');
  const fileName = parts[parts.length - 1];
  if (fileName.length >= maxLength - 3) return '...' + fileName.slice(-(maxLength - 3));
  return '...' + path.slice(-(maxLength - 3));
}

function submitFolders() {
  const new_dirs = getNewDirs();
  const removed_dirs = getRemovedDirs();

  if (new_dirs.length == 0 && removed_dirs.length == 0) {
    emit("hideModal");
    return;
  }

  addRootDirs(new_dirs, removed_dirs)
    .then((res) => settings.setRootDirs(res))
    .then(() => emit("hideModal"));
}

function selectHere() {
  if (current == "$root" || current == "/") return;

  addRootDirs([current], [])
    .then((res) => settings.setRootDirs(res))
    .then(() => emit("hideModal"));
}

onMounted(() => {
  fetchDirs("$root");
  getRootDirs().then((_dirs) => {
    selected.value = _dirs;
    prev_selected.push(..._dirs);
  });
});
</script>

<style lang="scss">
.folder-browser-modal {
  @include modal-base;
  display: flex;
  flex-direction: column;
  min-height: 28rem;
  max-height: calc(100vh - 6rem);
  gap: 1rem;

  // Breadcrumb Navigation
  .breadcrumb-nav {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.75rem;
    overflow-x: auto;
    @include hideScrollbars;

    .breadcrumb-root {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.625rem;
      background: rgba(0, 110, 255, 0.1);
      border: 1px solid rgba(0, 110, 255, 0.25);
      border-radius: 0.5rem;
      color: $highlight-blue;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;

      svg {
        width: 0.875rem;
        height: 0.875rem;
      }

      &:hover {
        background: rgba(0, 110, 255, 0.18);
        border-color: rgba(0, 110, 255, 0.4);
      }
    }

    .breadcrumb-items {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;
    }
  }

  // Current Path Display
  .current-path {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.625rem 0.875rem;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 0.5rem;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.85rem;
    font-family: 'SF Mono', monospace;

    svg {
      width: 1rem;
      height: 1rem;
      flex-shrink: 0;
      color: rgba(255, 255, 255, 0.4);
    }

    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  // Browser Content
  .browser-content {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2rem;

    .empty-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 4rem;
      height: 4rem;
      margin-bottom: 1rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 1rem;

      svg {
        width: 2rem;
        height: 2rem;
        color: rgba(255, 255, 255, 0.3);
      }
    }

    h4 {
      margin: 0 0 0.5rem;
      font-size: 1.1rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.8);
    }

    p {
      margin: 0;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.5);
      max-width: 20rem;
    }
  }

  .folder-grid {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 0.5rem;
    scrollbar-gutter: stable;
    -webkit-overflow-scrolling: touch;

    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
    gap: 0.75rem;
    align-content: start;

    // Folder item styling
    :deep(.f-item) {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 0.75rem;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.12);
      }

      &.selected {
        background: rgba(0, 110, 255, 0.12);
        border-color: rgba(0, 110, 255, 0.35);

        svg {
          color: $highlight-blue;
        }
      }
    }
  }

  // Selected Summary
  .selected-summary {
    padding: 0.875rem 1rem;
    background: rgba(74, 222, 128, 0.06);
    border: 1px solid rgba(74, 222, 128, 0.15);
    border-radius: 0.75rem;

    .summary-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: #4ade80;

      svg {
        width: 1rem;
        height: 1rem;
      }
    }

    .selected-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;

      .selected-item {
        padding: 0.25rem 0.5rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 0.375rem;
        font-size: 0.75rem;
        font-family: 'SF Mono', monospace;
        color: rgba(255, 255, 255, 0.7);
      }

      .selected-more {
        padding: 0.25rem 0.5rem;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 0.375rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.5);
      }
    }
  }

  // Browser Actions
  .browser-actions {
    display: flex;
    gap: 0.75rem;
    padding-top: 0.5rem;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    flex: 1;
    min-height: 2.75rem;
    padding: 0.75rem 1.25rem;
    border-radius: 0.75rem;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    svg {
      width: 1rem;
      height: 1rem;
    }

    &.primary {
      @include modal-button-primary;
    }

    &.secondary {
      @include modal-button-secondary;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

// Responsive
@include allPhones {
  .folder-browser-modal {
    .folder-grid {
      grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
    }

    .browser-actions {
      flex-direction: column;
    }
  }
}
</style>
