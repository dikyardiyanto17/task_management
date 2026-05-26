<script setup>
import { ref, watch, computed } from 'vue';
import UserSelect from './UserSelect.vue';

const props = defineProps({
  task: { type: Object, default: null },
});
const emit = defineEmits(['close', 'save']);

const form = ref({
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  assigned_user_id: null,
  due_date: '',
});

const assigneeLabel = computed(() => props.task?.assignee?.name || '');

watch(
  () => props.task,
  (t) => {
    if (t) {
      form.value = {
        title: t.title,
        description: t.description || '',
        status: t.status,
        priority: t.priority,
        assigned_user_id: t.assigned_user_id ?? null,
        due_date: t.due_date || '',
      };
    } else {
      form.value = {
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        assigned_user_id: null,
        due_date: '',
      };
    }
  },
  { immediate: true }
);

function submit() {
  const payload = { ...form.value };
  if (!payload.assigned_user_id) delete payload.assigned_user_id;
  if (!payload.due_date) delete payload.due_date;
  emit('save', payload);
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="card modal">
      <h2>{{ task ? 'Edit Task' : 'New Task' }}</h2>
      <form @submit.prevent="submit">
        <div class="form-group">
          <label>Title</label>
          <input v-model="form.title" required />
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea v-model="form.description" rows="3" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Status</label>
            <select v-model="form.status">
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div class="form-group">
            <label>Priority</label>
            <select v-model="form.priority">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        <UserSelect
          v-model="form.assigned_user_id"
          :initial-label="assigneeLabel"
        />
        <div class="form-group">
          <label>Due date</label>
          <input v-model="form.due_date" type="date" />
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" @click="emit('close')">Cancel</button>
          <button type="submit" class="btn btn-primary">Save</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 1rem;
}
.modal {
  width: 100%;
  max-width: 480px;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}
</style>
