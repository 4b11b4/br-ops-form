<template>
  <div>
    <h1>Operations</h1>
    <p>Gratitude, {{ firstName }}</p>
    <p>
      <!-- <label for="warehouse-select">Choose location: </label> -->
      <SearchableDropdown
        id="warehouse-select"
        v-model="selectedWarehouse"
        :options="warehouseOptions"
        @update:modelValue="fetchClientsByWarehouse"
      />
    </p>
    <p>
      <!-- <label for="client-select">Choose client: </label> -->
      <SearchableDropdown
        id="client-select"
        v-model="selectedClient"
        :options="clientOptions"
      />
    </p>
    <div v-if="clientDetails">
      <!-- <h2>Client Details</h2> -->
      <!-- {{ clientDetails.parentAccount }}
      <span v-if="clientDetails.location">{{ clientDetails.location }}</span> -->
      <!-- <p><strong>Inventory: </strong> {{ clientDetails.inventory }}</p> -->
      <div v-if="inventoryDetails.length">
        <!-- <h3>Inventory Details</h3> -->
        <RadioTable
          :items="inventoryDetails"
          v-model="selectedInventoryId"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import SearchableDropdown from '../components/SearchableDropdown.vue';
import RadioTable from '../components/RadioTable.vue';

const AIRTABLE_BASE_ID = 'appfSMa2B57aLHxkj';
const AIRTABLE_API_KEY =
  'patpkTQuzTkB1Pq6T.c313a918507d89a256eecd75f176cc6bc65396a0c4655431bb86caa10f02727e';
const AIRTABLE_TABLE_NAME_USERS = 'Team';
const AIRTABLE_TABLE_NAME_WAREHOUSES = 'Warehouses';
const AIRTABLE_TABLE_NAME_CLIENTS = 'Clients';
const AIRTABLE_TABLE_NAME_INVENTORY = 'Inventory';

const route = useRoute();

const user = ref({});
const firstName = ref('');
const warehouses = ref([]);
const selectedWarehouse = ref('');
const clients = ref([]);
const selectedClient = ref('');
const clientDetails = ref(null);
const inventoryDetails = ref<Array<{ product: string; estimatedInventory: number; id: string }>>([]);
const selectedInventoryId = ref<string | null>(null);

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
    firstName.value = users[0].fields.First;
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
          record.fields['Location'] ? ' ' + record.fields['Location'] : ''
        }`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch (error) {
    console.error('Error fetching clients from Airtable:', error);
  }
};

const fetchClientDetailsById = async (id: string) => {
  if (!id) {
    clientDetails.value = null;
    inventoryDetails.value = [];
    return;
  }

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME_CLIENTS}/${id}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });
    const data = await response.json();
    clientDetails.value = {
      parentAccount: data.fields['Parent Account'],
      location: data.fields['Location'],
      uniqueClient: data.fields['Unique Client'],
      inventory: data.fields['Inventory Estimates']
    };
    fetchInventoryDetailsByIds(clientDetails.value.inventory);
  } catch (error) {
    console.error('Error fetching client details from Airtable:', error);
    clientDetails.value = null;
    inventoryDetails.value = [];
  }
};

const fetchInventoryDetailsByIds = async (ids: string[]) => {
  if (!ids || ids.length === 0) {
    inventoryDetails.value = [];
    return;
  }

  const filterByFormula = `OR(${ids.map(id => `RECORD_ID() = '${id}'`).join(',')})`;
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME_INVENTORY}?filterByFormula=${encodeURIComponent(filterByFormula)}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });
    const data = await response.json();
    inventoryDetails.value = data.records.map((record: any) => ({
      id: record.id,
      product: record.fields.Product,
      estimatedInventory: record.fields['Estimated Inventory by SKU']
    }));
  } catch (error) {
    console.error('Error fetching inventory details from Airtable:', error);
    inventoryDetails.value = [];
  }
};

const warehouseOptions = computed(() => warehouses.value.map(warehouse => ({
  value: warehouse.value,
  label: warehouse.label,
})));

const clientOptions = computed(() => clients.value.map(client => ({
  value: client.id,
  label: client.label,
})));

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

// Watch for changes in selected client and fetch client details
watch(
  () => selectedClient.value,
  (newClient, oldClient) => {
    if (newClient && newClient !== oldClient) {
      fetchClientDetailsById(newClient);
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
