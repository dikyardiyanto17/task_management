import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const usePresenceStore = defineStore('presence', () => {
  const onlineUsers = ref([]);
  const onlineCount = computed(() => onlineUsers.value.length);

  function setOnline(users) {
    onlineUsers.value = Array.isArray(users) ? users : [];
  }

  function reset() {
    onlineUsers.value = [];
  }

  return { onlineUsers, onlineCount, setOnline, reset };
});
