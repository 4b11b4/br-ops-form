<template>
  <div>
    <h1>Operations</h1>
    
    <span v-if="user.Greeting">{{ user.Greeting }},</span>
    {{ user.First }}
    <p>
      <SearchableDropdown
        id="warehouse-select"
        v-model="selectedWarehouse"
        :options="warehouseOptions"
        @update:modelValue="fetchClientsByWarehouse"
      />
    </p>
    <p>
      <SearchableDropdown
        id="client-select"
        v-model="selectedClient"
        :options="clientOptions"
      />
    </p>
    <div v-if="clientDetails">
      <div v-if="inventoryDetails.length">
        <SearchableDropdown
          id="inventory-select"
          v-model="selectedInventoryId"
          :options="inventoryOptions"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import SearchableDropdown from '../components/SearchableDropdown.vue';

// const AIRTABLE_BASE_ID = 'appfSMa2B57aLHxkj';
// const AIRTABLE_API_KEY = 'patpkTQuzTkB1Pq6T.c313a918507d89a256eecd75f176cc6bc65396a0c4655431bb86caa10f02727e';
const AIRTABLE_BASE_ID = import.meta.env.AIRTABLE_BASE_ID;
const AIRTABLE_API_KEY = import.meta.env.AIRTABLE_API_KEY;
const AIRTABLE_TABLE_NAME_USERS = 'Team';
const AIRTABLE_TABLE_NAME_WAREHOUSES = 'Warehouses';
const AIRTABLE_TABLE_NAME_CLIENTS = 'Clients';
const AIRTABLE_TABLE_NAME_INVENTORY = 'Inventory';

const route = useRoute();

const user = ref({});
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
    if (users.length > 0) {
      user.value = users[0].fields;
      fetchAssignedWarehouses(user.value.Warehouses);
    }
  } catch (error) {
    console.error('Error fetching data from Airtable:', error);
  }
};

const fetchUserByNickname = async (nickname: string) => {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME_USERS}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });
    const data = await response.json();

    const users = data.records.filter(
      (record: any) => record.fields.Nickname === nickname && record.fields.Status === 'Active'
    );
    if (users.length > 0) {
      const matchedUser = users[0].fields;
      user.value = matchedUser;
      fetchAssignedWarehouses(matchedUser.Warehouses);
    }
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

    // Set selectedWarehouse to user's default warehouse if available
    if (user.value['Warehouse Default']) {
      selectedWarehouse.value = user.value['Warehouse Default'][0];
      fetchClientsByWarehouse();
    }
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
        label: `${record.fields['Parent Account']}${record.fields['Location'] ? ' ' + record.fields['Location'] : ''}`,
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
      inventory: data.fields['Inventory Estimates'],
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
      estimatedInventory: record.fields['Estimated Inventory by SKU'],
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

const inventoryOptions = computed(() => inventoryDetails.value.map(item => ({
  value: item.id,
  label: `${item.product} (Estimated: ${item.estimatedInventory})`,
})));

// Watch for changes in selected warehouse and clear client options if empty
watch(
  () => selectedWarehouse.value,
  (newWarehouse) => {
    if (newWarehouse === '') {
      clients.value = [];
      selectedClient.value = '';
    } else {
      fetchClientsByWarehouse();
    }
  }
);

// Watch for changes in selected client and fetch client details
watch(
  () => selectedClient.value,
  (newClient, oldClient) => {
    if (newClient === '') {
      inventoryDetails.value = [];
      clientDetails.value = null;
    } else if (newClient && newClient !== oldClient) {
      fetchClientDetailsById(newClient);
    }
  }
);

onMounted(() => {
  const { userId, warehouseId, clientId, nick } = route.query;

  if (nick) {
    fetchUserByNickname(nick as string);
  } else if (userId) {
    fetchUserById(userId as string);
  }

  if (warehouseId) {
    selectedWarehouse.value = warehouseId as string;
  }

  if (clientId) {
    selectedClient.value = clientId as string;
  }
});
</script>

