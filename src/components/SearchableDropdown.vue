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
          @click="handleOptionClick(option.value)"
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

const handleOptionClick = (value) => {
  selectOption(value);
  if (filteredOptions.value.length === 1) {
    searchQuery.value = '';
  }
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
  display: flex;
  flex-direction: column;
  width: 100%;
}

.searchable-dropdown input {
  width: 99%;
  padding: 5px;
  font-size: 14px;
  box-sizing: border-box;
  align-self: center; /* Center the input */
}

.dropdown-menu {
  width: 100%;
  max-height: 102px; /* Adjust this value to show exactly 4 items */
  overflow-y: auto;
  background: white;
  border: 1px solid #ccc;
  z-index: 1000;
  margin-top: 0;
  list-style-type: none; /* Remove bullet points */
  padding: 0; /* Remove default padding */
}

.dropdown-item {
  padding: 2px 8px; /* Reduce padding to make it more compact */
  cursor: pointer;
  color: black; /* Set the text color to black */
  font-size: 14px; /* Make the text slightly smaller */
  height: 20px; /* Adjust height to be more compact */
  box-sizing: border-box; /* Include padding in height calculation */
}

.dropdown-item:hover {
  background: #f0f0f0;
}
</style>
