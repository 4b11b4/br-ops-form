<template>
  <div class="searchable-dropdown">
    <div class="searchable-dropdown-container">
      <input
        type="text"
        v-model="searchQuery"
        @input="onSearch"
        @keydown.enter.prevent="selectFirst"
        placeholder="Search..."
      />
      <ul v-if="filteredOptions.length" class="dropdown-menu">
        <li
          v-for="option in filteredOptions"
          :key="option.value"
          @click="selectOption(option.value)"
          class="dropdown-item"
        >
          {{ option.label }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

// Define the shape of your options
interface Option {
  label: string;
  value: string | number;
}

const props = defineProps<{
  options: Option[];
  modelValue: string | number;
}>();


const emits = defineEmits(['update:modelValue']);

const searchQuery = ref('');
const filteredOptions = computed(() =>
  props.options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
);

const onSearch = () => {
  if (
    !filteredOptions.value.some((option) => option.value === props.modelValue)
  ) {
    emits('update:modelValue', '');
  }
};

const selectOption = (value) => {
  emits('update:modelValue', value);
  searchQuery.value =
    props.options.find((option) => option.value === value)?.label || '';
};

const selectFirst = () => {
  if (filteredOptions.value.length > 0) {
    selectOption(filteredOptions.value[0].value);
  }
};

watch(
  () => props.modelValue,
  (newValue) => {
    searchQuery.value =
      props.options.find((option) => option.value === newValue)?.label || '';
  },
  { immediate: true }
);
</script>

<style scoped>
.searchable-dropdown {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.searchable-dropdown-container {
  width: 100%;
}

.searchable-dropdown input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}

.dropdown-menu {
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  background: white;
  border: 1px solid #ccc;
  z-index: 1000;
  margin-top: 0;
  list-style-type: none; /* Remove bullet points */
  padding: 0; /* Remove default padding */
}

.dropdown-item {
  padding: 1px 8px; /* Further reduce padding to decrease whitespace */
  cursor: pointer;
  color: black; /* Set the text color to black */
  font-size: 14px; /* Make the text slightly smaller */
}

.dropdown-item:hover {
  background: #f0f0f0;
}
</style>
