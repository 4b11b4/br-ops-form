<!-- src/components/Login.vue -->
<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';

const options1 = ref(['Option 1-1', 'Option 1-2', 'Option 1-3']);
const options2 = ref(['Option 2-1', 'Option 2-2', 'Option 2-3']);
const selectedOption1 = ref(options1.value[0]);
const selectedOption2 = ref(options2.value[0]);
const selectedUsername = ref('');
const userId = ref('');
const selectedMethod = ref('username');

const confirmedId = computed(() => {
  if (selectedMethod.value === 'username') {
    return userId.value && userId.value !== 'Not found.' ? userId.value : '';
  } else if (selectedMethod.value === 'warehouse') {
    return selectedOption2.value;
  }
  return '';
});

const isUserIdValid = computed(() => userId.value.length === 17);

// Navigation
const router = useRouter();
const goToNextPage = () => {
  router.push({ name: 'Operations', query: { userId: confirmedId.value } });
};

const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;
const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY;
const AIRTABLE_TABLE_NAME_WAREHOUSES = 'Warehouses';
const AIRTABLE_TABLE_NAME_USERS = 'Team';

const fetchWarehouses = async () => {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME_WAREHOUSES}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });
    const data = await response.json();

    const warehouses = data.records.map((record: any) => ({
      label: record.fields.City,
      value: record.id,
    }));

    const filteredWarehouses = warehouses.filter(
      (warehouse: string) => warehouse.label !== 'All'
    );
    options1.value = filteredWarehouses;
    selectedOption1.value = filteredWarehouses[0]?.value || '';
  } catch (error) {
    console.error('Error fetching data from Airtable:', error);
  }
};

const fetchUsers = async (warehouseId: string) => {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME_USERS}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });
    const data = await response.json();

    const users = data.records
      .filter(
        (record: any) =>
          record.fields.Warehouses &&
          record.fields.Warehouses.includes(warehouseId) &&
          record.fields.Status === 'Active'
      )
      .map((record: any) => ({
        label: record.fields.Username,
        value: record.id,
      }));
    options2.value = users;
    selectedOption2.value = '';
  } catch (error) {
    console.error('Error fetching data from Airtable:', error);
  }
};

const fetchUserId = async (username: string) => {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME_USERS}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });
    const data = await response.json();
    const user = data.records.find(
      (record: any) =>
        (record.fields.Username === username ||
          record.fields.Nickname === username) &&
        record.fields.Status === 'Active'
    );
    const foundUser = user ? user.id : 'Not found.';
    userId.value = foundUser;
    return user ? user.id : 'Not found.';
  } catch (error) {
    console.error('Error fetching data from Airtable:', error);
    return 'Not found.';
  }
};

onMounted(fetchWarehouses);

watch(selectedOption1, (newWarehouse) => {
  if (newWarehouse) {
    fetchUsers(newWarehouse);
  }
});

watch(selectedUsername, async (newUsername) => {
  if (newUsername) {
    userId.value = await fetchUserId(newUsername);
  } else {
    userId.value = '';
  }
});
</script>

<template>
  <h1>Login</h1>

  <div>
    <input
      type="radio"
      id="methodUsername"
      value="username"
      v-model="selectedMethod"
    />
    <label for="methodUsername">name: </label>
    <input type="text" id="username" v-model="selectedUsername" />
    <span v-if="isUserIdValid" class="checkmark">✔️</span>
  </div>
  <br />
  <div>
    <input
      type="radio"
      id="methodWarehouse"
      value="warehouse"
      v-model="selectedMethod"
    />
    <label for="methodWarehouse">Select by warehouse</label>
  </div>

  <div>
    <label for="dropdown1">City: </label>
    <select id="dropdown1" v-model="selectedOption1">
      <option
        v-for="option in options1"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>

    <br />

    <label for="dropdown2">ID: </label>
    <select id="dropdown2" v-model="selectedOption2">
      <option
        v-for="option in options2"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
  </div>

  <br />

  <button @click="goToNextPage">Continue</button>
</template>

<style scoped>
.checkmark {
  color: green;
  font-weight: bold;
  margin-left: 8px; /* Adjust spacing as needed */
}
.read-the-docs {
  color: #888;
}
</style>
