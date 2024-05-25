<!-- src/components/Operations.vue -->
<template>
  <div>
    <h1>Operations</h1>
    {{ user.First }}
    <br />
    <label for="warehouse-select">Location: </label>
    <select
      id="warehouse-select"
      v-model="selectedWarehouse"
      @change="fetchClientsByWarehouse"
    >
      <option
        v-for="warehouse in warehouses"
        :key="warehouse.value"
        :value="warehouse.value"
      >
        {{ warehouse.label }}
      </option>
    </select>
    <p>
      <!-- <label for="client-select">Client: </label> -->
      <SearchableDropdown
        id="client-select"
        v-model="selectedClient"
        :options="clientOptions"
      />
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import SearchableDropdown from '../components/SearchableDropdown.vue';

const AIRTABLE_BASE_ID = 'appfSMa2B57aLHxkj';
const AIRTABLE_API_KEY =
  'patpkTQuzTkB1Pq6T.c313a918507d89a256eecd75f176cc6bc65396a0c4655431bb86caa10f02727e';
const AIRTABLE_TABLE_NAME_USERS = 'Team';
const AIRTABLE_TABLE_NAME_WAREHOUSES = 'Warehouses';
const AIRTABLE_TABLE_NAME_CLIENTS = 'Clients';

const route = useRoute();
const user = ref({}); // Initialize as an empty object
const warehouses = ref([]);
const selectedWarehouse = ref(''); // Initialize selected warehouse
const clients = ref([]); // Initialize clients array
const selectedClient = ref(''); // Initialize selected client

const fetchUserById = async (id: string) => {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME_USERS}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });
    const data = await response.json();

    const users = data.records.filter(
      (record: any) => record.id === id && record.fields.Status === 'Active'
    );
    user.value = users[0].fields;
  } catch (error) {
    console.error('Error fetching data from Airtable:', error);
  }
};

const fetchAssignedWarehouses = async (ids: string[]) => {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME_WAREHOUSES}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });
    const data = await response.json();

    const allWarehouses = data.records;

    let assignedWarehouses = allWarehouses
      .filter((record: any) => ids.includes(record.id))
      .map((record: any) => ({
        label: record.fields.City,
        value: record.id,
      }));

    if (assignedWarehouses && assignedWarehouses[0].label === 'All') {
      assignedWarehouses = allWarehouses
        .map((record: any) => ({
          label: record.fields.City,
          value: record.id,
        }))
        .filter((record: any) => record.label !== 'All');
    }

    warehouses.value = assignedWarehouses;
  } catch (error) {
    console.error('Error fetching warehouses from Airtable:', error);
  }
};

const fetchClientsByWarehouse = async () => {
  const warehouseId = selectedWarehouse.value;
  if (!warehouseId) return;

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME_CLIENTS}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });
    const data = await response.json();

    clients.value = data.records
      .filter((record: any) => record.fields.Warehouses.includes(warehouseId))
      .map((record: any) => ({
        id: record.id,
        label: `${record.fields['Parent Account']}${
          record.fields['Location'] ? ' - ' + record.fields['Location'] : ''
        }`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch (error) {
    console.error('Error fetching clients from Airtable:', error);
  }
};

const clientOptions = computed(() =>
  clients.value.map((client) => ({
    value: client.id,
    label: client.label,
  }))
);

// Watch for changes in user object and fetch warehouses
watch(
  () => user.value,
  (newUser, oldUser) => {
    if (newUser && newUser !== oldUser) {
      fetchAssignedWarehouses(newUser.Warehouses);
    }
  }
);

// Watch for changes in warehouses and set the first warehouse as the selected option
watch(
  () => warehouses.value,
  (newWarehouses) => {
    if (newWarehouses.length > 0) {
      selectedWarehouse.value = newWarehouses[0].value;
      fetchClientsByWarehouse();
    }
  }
);

onMounted(() => {
  fetchUserById(route.params.id);
});
</script>

<style>
/* Add any custom styles here */
</style>
