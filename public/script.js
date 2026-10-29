// Base API Endpoint
const API_URL = '/api/items';

// DOM Elements
const itemForm = document.getElementById('item-form');
const itemIdInput = document.getElementById('item-id');
const itemNameInput = document.getElementById('item-name');
const itemPriceInput = document.getElementById('item-price');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const formTitle = document.getElementById('form-title');
const editBadge = document.getElementById('edit-badge');
const itemsTbody = document.getElementById('items-tbody');
const itemsCount = document.getElementById('items-count');
const emptyState = document.getElementById('empty-state');
const notification = document.getElementById('notification');

let isEditing = false;
let notificationTimeout = null;

// --- Notification Helper ---
function showNotification(message, type = 'success') {
  if (notificationTimeout) clearTimeout(notificationTimeout);
  
  notification.textContent = message;
  notification.className = `notification ${type}`;
  
  notificationTimeout = setTimeout(() => {
    notification.className = 'notification hidden';
  }, 3500);
}

// --- REST API Operations ---

// 1. Fetch & Render All Items (GET)
async function fetchItems() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch items: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.success) {
      renderTable(result.data);
    } else {
      showNotification(result.message || 'Error fetching items', 'error');
    }
  } catch (error) {
    console.error('Error fetching items:', error);
    showNotification('Could not connect to server. Is Express running?', 'error');
  }
}

// 2. Render Table Rows
function renderTable(items) {
  itemsCount.textContent = `${items.length} ${items.length === 1 ? 'item' : 'items'}`;

  if (items.length === 0) {
    itemsTbody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  itemsTbody.innerHTML = '';

  items.forEach(item => {
    const tr = document.createElement('tr');
    tr.id = `item-row-${item.id}`;

    // Format price with 2 decimal places if has decimals or plain integer
    const formattedPrice = Number.isInteger(item.price) 
      ? item.price 
      : Number(item.price).toFixed(2);

    tr.innerHTML = `
      <td class="td-id">${item.id}</td>
      <td class="td-name">${escapeHtml(item.name)}</td>
      <td class="td-price">${formattedPrice}</td>
      <td class="td-actions">
        <div class="action-btn-group">
          <button class="btn-action-edit" onclick="startEditItem(${item.id})">Edit</button>
          <button class="btn-action-delete" onclick="deleteItem(${item.id})">Delete</button>
        </div>
      </td>
    `;
    itemsTbody.appendChild(tr);
  });
}

// 3. Form Submit Handler (CREATE or UPDATE)
itemForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = itemNameInput.value.trim();
  const price = parseFloat(itemPriceInput.value);

  if (!name) {
    showNotification('Please enter a valid item name.', 'error');
    return;
  }

  if (isNaN(price) || price < 0) {
    showNotification('Please enter a valid non-negative price.', 'error');
    return;
  }

  if (isEditing) {
    // UPDATE (PUT)
    const id = itemIdInput.value;
    await updateItem(id, { name, price });
  } else {
    // CREATE (POST)
    await createItem({ name, price });
  }
});

// 4. Create Item (POST /api/items)
async function createItem(itemData) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(itemData)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      showNotification(`Item "${result.data.name}" added successfully!`, 'success');
      resetForm();
      fetchItems();
    } else {
      showNotification(result.message || 'Failed to add item.', 'error');
    }
  } catch (error) {
    console.error('Error creating item:', error);
    showNotification('Error creating item. Check network connection.', 'error');
  }
}

// 5. Update Item (PUT /api/items/:id)
async function updateItem(id, itemData) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(itemData)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      showNotification(`Item #${id} updated successfully!`, 'success');
      resetForm();
      fetchItems();
    } else {
      showNotification(result.message || 'Failed to update item.', 'error');
    }
  } catch (error) {
    console.error('Error updating item:', error);
    showNotification('Error updating item. Check network connection.', 'error');
  }
}

// 6. Delete Item (DELETE /api/items/:id)
async function deleteItem(id) {
  if (!confirm(`Are you sure you want to delete item ID ${id}?`)) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (response.ok && result.success) {
      showNotification(`Item #${id} deleted successfully.`, 'success');
      if (isEditing && itemIdInput.value == id) {
        resetForm();
      }
      fetchItems();
    } else {
      showNotification(result.message || 'Failed to delete item.', 'error');
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    showNotification('Error deleting item. Check network connection.', 'error');
  }
}

// 7. Initiate Edit Mode (GET /api/items/:id)
async function startEditItem(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`);
    const result = await response.json();

    if (response.ok && result.success) {
      const item = result.data;
      itemIdInput.value = item.id;
      itemNameInput.value = item.name;
      itemPriceInput.value = item.price;

      isEditing = true;
      formTitle.textContent = `Edit Item #${item.id}`;
      submitBtn.textContent = 'Update';
      cancelBtn.classList.remove('hidden');
      editBadge.classList.remove('hidden');

      // Scroll to form smoothly
      itemNameInput.focus();
    } else {
      showNotification(result.message || 'Failed to load item for edit.', 'error');
    }
  } catch (error) {
    console.error('Error starting edit:', error);
    showNotification('Error fetching item details.', 'error');
  }
}

// 8. Cancel & Reset Form
function resetForm() {
  itemForm.reset();
  itemIdInput.value = '';
  isEditing = false;
  formTitle.textContent = 'Add New Item';
  submitBtn.textContent = 'Submit';
  cancelBtn.classList.add('hidden');
  editBadge.classList.add('hidden');
}

cancelBtn.addEventListener('click', resetForm);

// Helper to escape HTML characters to prevent XSS
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Load items on page load
document.addEventListener('DOMContentLoaded', fetchItems);
