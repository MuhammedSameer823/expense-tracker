// Global state
let currentExpenses = [];
let summaryData = { totalSpent: 0, breakdown: {} };
let debounceTimer;

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other'];

// Document elements
const expensesTableBody = document.getElementById('expenses-table-body');
const totalSpentValue = document.getElementById('total-spent-value');
const currentMonthLabel = document.getElementById('current-month-label');
const breakdownList = document.getElementById('breakdown-list');
const expensesCount = document.getElementById('expenses-count');
const emptyState = document.getElementById('empty-state');
const loadingState = document.getElementById('loading-state');

// Filter inputs
const filterSearch = document.getElementById('filter-search');
const filterCategory = document.getElementById('filter-category');
const filterStartDate = document.getElementById('filter-start-date');
const filterPageEndDate = document.getElementById('filter-end-date');

// Form inputs
const expenseForm = document.getElementById('expense-form');
const expenseIdInput = document.getElementById('expense-id');
const expenseTitleInput = document.getElementById('expense-title');
const expenseAmountInput = document.getElementById('expense-amount');
const expenseCategoryInput = document.getElementById('expense-category');
const expenseDateInput = document.getElementById('expense-date');
const expenseNoteInput = document.getElementById('expense-note');
const submitBtn = document.getElementById('submit-btn');
const modalTitle = document.getElementById('modal-title');

// On Load
document.addEventListener('DOMContentLoaded', () => {
  // Set default date in modal to today
  setDefaultDate();
  // Fetch initial data
  fetchSummary();
  fetchExpenses();
});

function getModalElement() {
  return document.getElementById('expense-modal');
}

/**
 * Set default date input in the modal to local today (YYYY-MM-DD)
 */
function setDefaultDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  expenseDateInput.value = `${yyyy}-${mm}-${dd}`;
}

/**
 * Fetch monthly summary from backend
 */
async function fetchSummary() {
  try {
    const response = await fetch('/api/expenses/summary');
    const result = await response.json();
    
    if (result.success) {
      summaryData = result.data;
      updateSummaryUI();
    } else {
      showToast(result.message || 'Error fetching summary', 'error');
    }
  } catch (error) {
    console.error('Error fetching summary:', error);
    showToast('Failed to connect to backend server', 'error');
  }
}

/**
 * Fetch expenses list from backend with current filters
 */
async function fetchExpenses() {
  showLoading(true);
  
  try {
    const params = new URLSearchParams();
    
    if (filterSearch.value.trim()) {
      params.append('search', filterSearch.value.trim());
    }
    if (filterCategory.value) {
      params.append('category', filterCategory.value);
    }
    if (filterStartDate.value) {
      params.append('startDate', filterStartDate.value);
    }
    if (filterPageEndDate.value) {
      params.append('endDate', filterPageEndDate.value);
    }

    const url = `/api/expenses?${params.toString()}`;
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.success) {
      currentExpenses = result.data;
      renderExpensesTable(currentExpenses);
    } else {
      showToast(result.message || 'Error fetching expenses', 'error');
    }
  } catch (error) {
    console.error('Error fetching expenses:', error);
    showToast('Failed to connect to backend server', 'error');
  } finally {
    showLoading(false);
  }
}

/**
 * Update the Monthly Summary Widget and Breakdown Bars
 */
function updateSummaryUI() {
  currentMonthLabel.textContent = summaryData.month || 'Current Month';
  totalSpentValue.textContent = formatCurrency(summaryData.totalSpent);
  
  breakdownList.innerHTML = '';
  
  const total = summaryData.totalSpent || 0;
  
  CATEGORIES.forEach(cat => {
    const amount = summaryData.breakdown[cat] || 0;
    const percentage = total > 0 ? Math.round((amount / total) * 100) : 0;
    const catClass = `cat-${cat.toLowerCase()}`;
    
    const itemEl = document.createElement('div');
    itemEl.className = 'breakdown-item';
    itemEl.innerHTML = `
      <div class="breakdown-info">
        <span class="breakdown-cat-name">
          <span class="cat-dot" style="background-color: var(--${catClass})"></span>
          ${cat}
        </span>
        <span class="breakdown-value">
          ₹${amount.toFixed(2)}
          <span class="breakdown-percentage">(${percentage}%)</span>
        </span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" style="width: ${percentage}%; background-color: var(--${catClass})"></div>
      </div>
    `;
    
    breakdownList.appendChild(itemEl);
  });
}

/**
 * Render expense rows inside table
 */
function renderExpensesTable(expenses) {
  expensesTableBody.innerHTML = '';
  expensesCount.textContent = `${expenses.length} item${expenses.length !== 1 ? 's' : ''}`;
  
  if (expenses.length === 0) {
    emptyState.classList.remove('hidden');
    // Update metrics dynamically
    updateMetricsUI(expenses);
    return;
  }
  
  emptyState.classList.add('hidden');
  
  expenses.forEach(expense => {
    const tr = document.createElement('tr');
    tr.id = `expense-row-${expense.id}`;
    
    const formattedDate = formatDateString(expense.expense_date);
    const catClass = `cat-${expense.category.toLowerCase()}`;
    
    tr.innerHTML = `
      <td class="expense-title-col">${escapeHtml(expense.title)}</td>
      <td class="expense-amount-col">₹${parseFloat(expense.amount).toFixed(2)}</td>
      <td>
        <span class="category-badge ${catClass}">${expense.category}</span>
      </td>
      <td>${formattedDate}</td>
      <td class="text-muted" style="font-size: 0.85rem">${escapeHtml(expense.note || '—')}</td>
      <td class="text-right">
        <div class="action-buttons">
          <button class="btn-icon-only edit" title="Edit expense" onclick="openEditModal('${expense.id}')">
            <!-- Edit Icon -->
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path></svg>
          </button>
          <button class="btn-icon-only delete" title="Delete expense" onclick="deleteExpense('${expense.id}')">
            <!-- Delete Icon -->
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      </td>
    `;
    
    expensesTableBody.appendChild(tr);
  });
  
  // Calculate and update dashboard stats metrics dynamically
  updateMetricsUI(expenses);
}

/**
 * Handle form submission (create or update)
 */
async function handleFormSubmit(event) {
  event.preventDefault();
  clearFieldErrors();
  
  const id = expenseIdInput.value;
  const isEdit = !!id;
  
  // Note: key mapped to 'expense_date' to align with Pydantic ExpenseBase
  const expenseData = {
    title: expenseTitleInput.value.trim(),
    amount: parseFloat(expenseAmountInput.value),
    category: expenseCategoryInput.value,
    expense_date: expenseDateInput.value,
    note: expenseNoteInput.value.trim() || null
  };
  
  // Basic validation checks
  let clientValid = true;
  if (!expenseData.title) {
    showFieldError('title', 'Title is required');
    clientValid = false;
  }
  if (isNaN(expenseData.amount) || expenseData.amount <= 0) {
    showFieldError('amount', 'Enter a valid positive amount greater than 0');
    clientValid = false;
  }
  if (!expenseData.category) {
    showFieldError('category', 'Category is required');
    clientValid = false;
  }
  if (!expenseData.expense_date) {
    showFieldError('date', 'Date is required');
    clientValid = false;
  }
  
  if (!clientValid) return;
  
  setFormSubmitting(true);
  
  try {
    const url = isEdit ? `/api/expenses/${id}` : '/api/expenses';
    const method = isEdit ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(expenseData)
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      showToast(isEdit ? 'Expense updated successfully' : 'Expense added successfully', 'success');
      closeModal();
      fetchExpenses();
      fetchSummary();
    } else {
      // Backend validation error handling (FastAPI returns Pydantic details)
      if (result.errors) {
        Object.keys(result.errors).forEach(field => {
          // If validator returned error for 'expense_date', map to 'date' input
          const fieldMap = field === 'expense_date' ? 'date' : field;
          showFieldError(fieldMap, result.errors[field]);
        });
        showToast('Validation failed. Please check fields.', 'error');
      } else {
        showToast(result.message || 'Operation failed', 'error');
      }
    }
  } catch (error) {
    console.error('Error submitting form:', error);
    showToast('Network error, please try again', 'error');
  } finally {
    setFormSubmitting(false);
  }
}

/**
 * Handle Delete expense call
 */
async function deleteExpense(id) {
  if (!confirm('Are you sure you want to delete this expense?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/expenses/${id}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    
    if (result.success) {
      showToast('Expense deleted successfully', 'success');
      fetchExpenses();
      fetchSummary();
    } else {
      showToast(result.message || 'Error deleting expense', 'error');
    }
  } catch (error) {
    console.error('Error deleting expense:', error);
    showToast('Failed to delete expense', 'error');
  }
}

/**
 * Filter change with debounce
 */
function handleFilterChange() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    fetchExpenses();
  }, 250);
}

/**
 * Reset filters input elements
 */
function clearFilters() {
  filterSearch.value = '';
  filterCategory.value = '';
  filterStartDate.value = '';
  filterPageEndDate.value = '';
  fetchExpenses();
}

/* Modal management functions */
function openModal() {
  resetForm();
  modalTitle.textContent = 'Add Expense';
  submitBtn.textContent = 'Save Expense';
  getModalElement().classList.remove('hidden');
}

function openEditModal(id) {
  const expense = currentExpenses.find(exp => exp.id === id);
  if (!expense) return;
  
  resetForm();
  modalTitle.textContent = 'Edit Expense';
  submitBtn.textContent = 'Update Expense';
  
  expenseIdInput.value = expense.id;
  expenseTitleInput.value = expense.title;
  expenseAmountInput.value = expense.amount;
  expenseCategoryInput.value = expense.category;
  expenseDateInput.value = expense.expense_date;
  expenseNoteInput.value = expense.note || '';
  
  getModalElement().classList.remove('hidden');
}

function closeModal() {
  getModalElement().classList.add('hidden');
}

function resetForm() {
  expenseForm.reset();
  expenseIdInput.value = '';
  clearFieldErrors();
  setDefaultDate();
}

/* Loading indicators */
function showLoading(show) {
  if (show) {
    loadingState.classList.remove('hidden');
    emptyState.classList.add('hidden');
  } else {
    loadingState.classList.add('hidden');
  }
}

function setFormSubmitting(submitting) {
  if (submitting) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';
  } else {
    submitBtn.disabled = false;
  }
}

/* Field errors logic */
function showFieldError(field, message) {
  const errEl = document.getElementById(`error-${field}`);
  if (errEl) {
    errEl.textContent = message;
    const inputEl = document.getElementById(`expense-${field}`);
    if (inputEl) inputEl.style.borderColor = 'var(--danger)';
  }
}

function clearFieldErrors() {
  ['title', 'amount', 'category', 'date', 'note'].forEach(field => {
    const errEl = document.getElementById(`error-${field}`);
    if (errEl) errEl.textContent = '';
    const inputEl = document.getElementById(`expense-${field}`);
    if (inputEl) inputEl.style.borderColor = '';
  });
}

/* Toast Messages */
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? '✓' : '✗';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

/* Utility Formatters */
function formatCurrency(amount) {
  return parseFloat(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatDateString(dateStr) {
  if (!dateStr) return '—';
  // Parse date as UTC to avoid local timezone offset shifts
  const [year, month, day] = dateStr.split('-');
  const dateObj = new Date(year, month - 1, day);
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Recalculates and updates the live metrics widgets card values dynamically
 */
function updateMetricsUI(expenses) {
  const avgEl = document.getElementById('metric-avg');
  const maxEl = document.getElementById('metric-max');
  const maxTitleEl = document.getElementById('metric-max-title');
  const topCatEl = document.getElementById('metric-top-cat');

  if (!avgEl || !maxEl || !maxTitleEl || !topCatEl) return;

  if (expenses.length === 0) {
    avgEl.textContent = '0.00';
    maxEl.textContent = '0.00';
    maxTitleEl.textContent = 'No items';
    topCatEl.textContent = '—';
    topCatEl.style.color = 'var(--text-primary)';
    return;
  }

  let total = 0;
  let maxExpense = expenses[0];
  const catSums = {};

  expenses.forEach(exp => {
    const amt = parseFloat(exp.amount) || 0;
    total += amt;
    if (amt > (parseFloat(maxExpense.amount) || 0)) {
      maxExpense = exp;
    }
    catSums[exp.category] = (catSums[exp.category] || 0) + amt;
  });

  // 1. Average Expense calculation
  const avg = total / expenses.length;
  avgEl.textContent = formatCurrency(avg);

  // 2. Largest Expense calculation
  maxEl.textContent = formatCurrency(maxExpense.amount);
  maxTitleEl.textContent = maxExpense.title;
  maxTitleEl.title = maxExpense.title;

  // 3. Top Category calculation
  let topCat = '—';
  let topCatAmt = -1;
  Object.keys(catSums).forEach(cat => {
    if (catSums[cat] > topCatAmt) {
      topCatAmt = catSums[cat];
      topCat = cat;
    }
  });
  topCatEl.textContent = topCat;
  
  // Color Top Category text with its respective category color variable
  const catClass = `cat-${topCat.toLowerCase()}`;
  topCatEl.style.color = `var(--${catClass})`;
}

/**
 * Downloads a spreadsheet CSV file representing current filtered rows
 */
function exportToCSV() {
  if (currentExpenses.length === 0) {
    showToast('No data to export', 'error');
    return;
  }

  // Column Headers
  const headers = ['Title', 'Amount (INR)', 'Category', 'Date', 'Note'];
  
  // Format Row Contents
  const csvRows = [
    headers.join(','),
    ...currentExpenses.map(exp => [
      `"${exp.title.replace(/"/g, '""')}"`,
      exp.amount,
      `"${exp.category}"`,
      exp.expense_date,
      `"${(exp.note || '').replace(/"/g, '""')}"`
    ].join(','))
  ];

  // Create Blob & triggers browser download anchor click
  const csvContent = "\uFEFF" + csvRows.join('\n'); // Excel friendly UTF-8 BOM prefix
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `spender_expenses_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast('Spreadsheet CSV exported successfully', 'success');
}
