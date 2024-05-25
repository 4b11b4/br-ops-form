<template>
    <table class="radio-table">
      <thead>
        <tr>
          <th></th>
          <th>Product</th>
          <th>Estimated Inventory</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in items"
          :key="item.id"
          :class="{ selected: item.id === modelValue }"
        >
          <td>
            <input
              type="radio"
              :value="item.id"
              v-model="selectedId"
              @change="onSelectionChange"
            />
          </td>
          <td>{{ item.product }}</td>
          <td>{{ item.estimatedInventory }}</td>
        </tr>
      </tbody>
    </table>
  </template>
  
  <script setup lang="ts">
  import { ref, watch } from 'vue';
  
  interface Item {
    id: string;
    product: string;
    estimatedInventory: number;
  }
  
  const props = defineProps<{
    items: Item[];
    modelValue: string | null;
  }>();
  
  const emits = defineEmits(['update:modelValue']);
  
  const selectedId = ref(props.modelValue);
  
  watch(selectedId, (newId) => {
    emits('update:modelValue', newId);
  });
  
  const onSelectionChange = () => {
    emits('update:modelValue', selectedId.value);
  };
  </script>
  
  <style scoped>
  .radio-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1em;
  }
  
  th, td {
    border: 1px solid #ddd;
    padding: 8px;
  }
  
  th {
    background-color: #f2f2f2;
    text-align: left;
    color: black;
  }
  
  tr.selected {
    background-color: #d7fa00;
    color: #200f5c;
    font-weight: bolder;
  }
  
  tr.selected td {
    color: #200f5c;
  }
  </style>
  