<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import api from '../api/client';

const props = defineProps({
  modelValue: { type: [Number, null], default: null },
  initialLabel: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue']);

const query = ref('');
const displayLabel = ref('');
const options = ref([]);
const open = ref(false);
const loading = ref(false);
const root = ref(null);
let debounceTimer = null;

async function fetchUsers(search = '') {
  loading.value = true;
  try {
    const { data } = await api.get('/users', {
      params: { search: search || undefined, limit: 15 },
    });
    options.value = data;
  } catch {
    options.value = [];
  } finally {
    loading.value = false;
  }
}

function onInput() {
  open.value = true;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchUsers(query.value), 250);
}

function selectUser(user) {
  emit('update:modelValue', user.id);
  displayLabel.value = user.name;
  query.value = user.name;
  open.value = false;
}

function clearAssignee() {
  emit('update:modelValue', null);
  displayLabel.value = '';
  query.value = '';
  open.value = false;
}

function onFocus() {
  open.value = true;
  if (!options.value.length) fetchUsers(query.value);
}

function onClickOutside(e) {
  if (root.value && !root.value.contains(e.target)) {
    open.value = false;
    if (props.modelValue && displayLabel.value) {
      query.value = displayLabel.value;
    }
  }
}

watch(
  () => [props.initialLabel, props.modelValue],
  ([label, id]) => {
    if (!id) {
      displayLabel.value = '';
      query.value = '';
      return;
    }
    if (label) {
      displayLabel.value = label;
      query.value = label;
    }
  },
  { immediate: true }
);

onMounted(() => {
  document.addEventListener('click', onClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside);
  clearTimeout(debounceTimer);
});
</script>

<template>
  <div ref="root" class="user-select">
    <label class="label">Assignee</label>
    <div class="input-wrap">
      <input
        v-model="query"
        type="text"
        placeholder="Search by name or email..."
        autocomplete="off"
        @input="onInput"
        @focus="onFocus"
      />
      <button
        v-if="modelValue"
        type="button"
        class="clear-btn"
        title="Clear assignee"
        @click="clearAssignee"
      >
        ×
      </button>
    </div>
    <ul v-if="open" class="dropdown">
      <li v-if="loading" class="muted">Searching...</li>
      <li v-else-if="!options.length" class="muted">No users found</li>
      <li
        v-for="user in options"
        :key="user.id"
        class="option"
        :class="{ selected: user.id === modelValue }"
        @mousedown.prevent="selectUser(user)"
      >
        <span class="name">{{ user.name }}</span>
        <span class="email">{{ user.email }}</span>
      </li>
      <li class="option muted" @mousedown.prevent="clearAssignee">Unassigned</li>
    </ul>
  </div>
</template>

<style scoped>
.user-select {
  position: relative;
}
.label {
  display: block;
  margin-bottom: 0.35rem;
  color: var(--muted);
  font-size: 0.875rem;
}
.input-wrap {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.input-wrap input {
  flex: 1;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
}
.clear-btn {
  background: transparent;
  border: none;
  color: var(--muted);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0 0.5rem;
  line-height: 1;
}
.clear-btn:hover {
  color: var(--text);
}
.dropdown {
  position: absolute;
  z-index: 300;
  left: 0;
  right: 0;
  top: calc(100% + 4px);
  max-height: 220px;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 0.25rem 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}
.option {
  padding: 0.5rem 0.75rem;
  cursor: pointer;
}
.option:hover,
.option.selected {
  background: rgba(59, 130, 246, 0.15);
}
.option .name {
  display: block;
  font-weight: 500;
}
.option .email {
  display: block;
  font-size: 0.75rem;
  color: var(--muted);
}
.muted {
  color: var(--muted);
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
  cursor: default;
}
.option.muted {
  cursor: pointer;
  border-top: 1px solid var(--border);
  margin-top: 0.25rem;
}
</style>
