<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api/client';
import { on, off } from '../services/socket';
import { useToastStore } from '../stores/toast';
import TaskForm from '../components/TaskForm.vue';

const router = useRouter();
const toast = useToastStore();
const tasks = ref([]);
const meta = ref({ page: 1, totalPages: 1, total: 0 });
const loading = ref(false);
const showForm = ref(false);
const editing = ref(null);

const filters = ref({
  page: 1,
  limit: 10,
  status: '',
  priority: '',
  search: '',
  sortBy: 'created_at',
  sortOrder: 'desc',
});

async function loadTasks() {
  loading.value = true;
  try {
    const params = { ...filters.value };
    Object.keys(params).forEach((k) => !params[k] && delete params[k]);
    const { data } = await api.get('/tasks', { params });
    tasks.value = data.data;
    meta.value = data.meta;
  } catch (e) {
    toast.show('Failed to load tasks', 'error');
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editing.value = null;
  showForm.value = true;
}

function openEdit(task, e) {
  e?.stopPropagation();
  editing.value = { ...task };
  showForm.value = true;
}

async function handleSave(payload) {
  try {
    if (editing.value?.id) {
      await api.put(`/tasks/${editing.value.id}`, payload);
      toast.show('Task updated', 'success');
    } else {
      await api.post('/tasks', payload);
      toast.show('Task created', 'success');
    }
    showForm.value = false;
    loadTasks();
  } catch (e) {
    toast.show(e.response?.data?.message || 'Save failed', 'error');
  }
}

async function deleteTask(task, e) {
  e.stopPropagation();
  if (!confirm(`Delete "${task.title}"?`)) return;
  await api.delete(`/tasks/${task.id}`);
  toast.show('Task deleted', 'info');
  loadTasks();
}

function goToTask(id) {
  router.push(`/tasks/${id}`);
}

function onTaskCreated(task) {
  tasks.value.unshift(task);
  toast.show('New task (live)', 'info');
}

function onTaskUpdated(task) {
  const i = tasks.value.findIndex((t) => t.id === task.id);
  if (i >= 0) tasks.value[i] = { ...tasks.value[i], ...task };
}

function onTaskDeleted({ id }) {
  tasks.value = tasks.value.filter((t) => t.id !== id);
}

onMounted(() => {
  loadTasks();
  on('task:created', onTaskCreated);
  on('task:updated', onTaskUpdated);
  on('task:deleted', onTaskDeleted);
});

onUnmounted(() => {
  off('task:created', onTaskCreated);
  off('task:updated', onTaskUpdated);
  off('task:deleted', onTaskDeleted);
});
</script>

<template>
  <div class="dashboard">
    <div class="toolbar">
      <h1>Tasks</h1>
      <button class="btn btn-primary" @click="openCreate">+ New Task</button>
    </div>

    <div class="filters card">
      <input v-model="filters.search" placeholder="Search..." @keyup.enter="loadTasks" />
      <select v-model="filters.status" @change="loadTasks">
        <option value="">All statuses</option>
        <option value="todo">Todo</option>
        <option value="in_progress">In Progress</option>
        <option value="review">Review</option>
        <option value="done">Done</option>
      </select>
      <select v-model="filters.priority" @change="loadTasks">
        <option value="">All priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>
      <select v-model="filters.sortBy" @change="loadTasks">
        <option value="created_at">Created</option>
        <option value="due_date">Due date</option>
        <option value="title">Title</option>
        <option value="priority">Priority</option>
      </select>
      <button class="btn btn-ghost" @click="loadTasks">Apply</button>
    </div>

    <div v-if="loading" class="loading">Loading...</div>
    <div v-else class="task-list">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="card task-card"
        @click="goToTask(task.id)"
      >
        <div class="task-header">
          <h3>{{ task.title }}</h3>
          <span class="badge" :class="task.status">{{ task.status }}</span>
        </div>
        <p class="desc">{{ task.description || 'No description' }}</p>
        <div class="meta">
          <span class="priority" :class="task.priority">{{ task.priority }}</span>
          <span v-if="task.assignee">→ {{ task.assignee.name }}</span>
          <span v-if="task.due_date">Due {{ task.due_date }}</span>
        </div>
        <div class="actions" @click.stop>
          <button class="btn btn-ghost" @click="openEdit(task, $event)">Edit</button>
          <button class="btn btn-danger" @click="deleteTask(task, $event)">Delete</button>
        </div>
      </div>
    </div>

    <div v-if="meta.totalPages > 1" class="pagination">
      <button
        class="btn btn-ghost"
        :disabled="filters.page <= 1"
        @click="filters.page--; loadTasks()"
      >
        Prev
      </button>
      <span>Page {{ meta.page }} / {{ meta.totalPages }}</span>
      <button
        class="btn btn-ghost"
        :disabled="filters.page >= meta.totalPages"
        @click="filters.page++; loadTasks()"
      >
        Next
      </button>
    </div>

    <TaskForm
      v-if="showForm"
      :task="editing"
      @close="showForm = false"
      @save="handleSave"
    />
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.filters input,
.filters select {
  flex: 1;
  min-width: 120px;
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
}
.task-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.task-card {
  cursor: pointer;
  transition: border-color 0.15s;
}
.task-card:hover {
  border-color: var(--primary);
}
.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}
.badge {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
  background: var(--border);
}
.badge.done { background: #14532d; color: #86efac; }
.badge.in_progress { background: #1e3a5f; color: #93c5fd; }
.desc {
  color: var(--muted);
  font-size: 0.9rem;
  margin: 0.5rem 0;
}
.meta {
  font-size: 0.8rem;
  color: var(--muted);
  display: flex;
  gap: 1rem;
}
.priority.urgent { color: var(--danger); }
.priority.high { color: var(--warning); }
.actions {
  margin-top: 0.75rem;
  display: flex;
  gap: 0.5rem;
}
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}
.loading {
  text-align: center;
  color: var(--muted);
  padding: 2rem;
}
</style>
