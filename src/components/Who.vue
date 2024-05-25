<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';

defineProps<{ msg: string }>();
const options1 = ref(['Option 1-1', 'Option 1-2', 'Option 1-3']);
const options2 = ref(['Option 2-1', 'Option 2-2', 'Option 2-3']);
const selectedOption1 = ref(options1.value[0]);
const selectedOption2 = ref(options2.value[0]);
const selectedUsername = ref('');
const firstName = ref('');
const warehouse = ref('');
const userId = ref('');
const confirmedId = computed(() =>
  userId.value && userId.value !== 'Not found.'
    ? userId.value
    : selectedOption2.value
);

// Navigation
const router = useRouter();
const goToNextPage = () => {
  //router.push({ name: 'About' });
  router.push({ name: 'Operations', params: { id: confirmedId.value } });
};

console.log(router.options.routes);

const AIRTABLE_API_KEY =
  'patpkTQuzTkB1Pq6T.c313a918507d89a256eecd75f176cc6bc65396a0c4655431bb86caa10f02727e';
const AIRTABLE_BASE_ID = 'appfSMa2B57aLHxkj';
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

    console.log('warehouses');
    console.log(data.records);
    const warehouses = data.records.map((record: any) => ({
      label: record.fields.City,
      value: record.id,
    }));

    console.log('filtered');
    const filteredWarehouses = warehouses.filter(
      (warehouse: string) => warehouse.label !== 'All'
    );
    console.log(filteredWarehouses);
    options1.value = filteredWarehouses;
    selectedOption1.value = filteredWarehouses[0]?.value || '';
  } catch (error) {
    console.error('Error fetching data from Airtable:', error);
  }
};

const fetchUsers = async (warehouseId: string) => {
  console.log(`want ${warehouseId}`);

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME_USERS}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });
    const data = await response.json();

    console.log('team');
    console.log(data.records);
    const users = data.records
      .filter(
        (record: any) =>
          record.fields.Warehouses &&
          record.fields.Warehouses.includes(warehouseId) &&
          record.fields.Status === 'Active'
      ) // Assuming 'Warehouses' is the field name for the warehouse reference array
      .map((record: any) => ({
        label: record.fields.Username,
        value: record.id,
      }));
    console.log('filtered');
    console.log(users);
    options2.value = users;
    selectedOption2.value = ''; // Set the first username as the selected option
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
  console.log('watcher');
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
  <h1>Who {{ msg }}</h1>

  <label for="username">Username or nickname: </label>
  <input type="text" id="username" v-model="selectedUsername" />

  <br />

  <label for="userId">ID found: </label>
  <input type="text" id="userId" v-model="userId" readonly />

  <h3>OR</h3>

  Select by warehouse
  <div class="card">
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

    <div>
      <p>Warehouse ID: {{ selectedOption1 }}</p>
      <p>Team ID from dropdown: {{ selectedOption2 }}</p>
    </div>

    <h3>Confirmed</h3>

    <div>
      <label for="info">Team member ID:</label>
      <p>
        {{ confirmedId }}
      </p>
    </div>

    <button @click="goToNextPage">Continue</button>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
