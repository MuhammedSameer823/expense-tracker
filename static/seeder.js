const MOCK_TEMPLATES = [
  { title: 'Weekly Groceries', category: 'Food', note: 'Purchased from supermarket', minPrice: 1200, maxPrice: 4500 },
  { title: 'Uber Ride', category: 'Transport', note: 'Commute to office', minPrice: 150, maxPrice: 450 },
  { title: 'Internet Bill', category: 'Bills', note: 'Monthly subscription', minPrice: 799, maxPrice: 1299 },
  { title: 'Movie Night', category: 'Entertainment', note: 'Tickets and popcorn', minPrice: 350, maxPrice: 950 },
  { title: 'New Sneakers', category: 'Shopping', note: 'Running shoes from Nike', minPrice: 2500, maxPrice: 5999 },
  { title: 'Coffee with Client', category: 'Food', note: 'Meeting at Starbucks', minPrice: 180, maxPrice: 450 },
  { title: 'Electricity Bill', category: 'Bills', note: 'Auto-debited from credit card', minPrice: 1500, maxPrice: 3500 },
  { title: 'Lunch Salad', category: 'Food', note: 'Healthy office lunch', minPrice: 150, maxPrice: 350 },
  { title: 'Dinner with Family', category: 'Food', note: 'Celebration dinner at restaurant', minPrice: 1800, maxPrice: 4500 },
  { title: 'Spotify Premium', category: 'Entertainment', note: 'Monthly music subscription', minPrice: 119, maxPrice: 179 },
  { title: 'Books purchase', category: 'Other', note: 'Learning programming resources', minPrice: 399, maxPrice: 899 },
  { title: 'Gym Membership', category: 'Other', note: 'Monthly fitness club fee', minPrice: 1000, maxPrice: 2500 },
  { title: 'Metro Ticket', category: 'Transport', note: 'Commute travel fare', minPrice: 40, maxPrice: 120 },
  { title: 'Gas Station Refuel', category: 'Transport', note: 'Full tank fuel top-up', minPrice: 1500, maxPrice: 3500 }
];

async function seedMockData() {
  const seedBtn = document.getElementById('seed-data-btn');
  if (seedBtn) {
    seedBtn.disabled = true;
    seedBtn.textContent = 'Seeding...';
  }

  // Show status notification
  if (typeof showToast === 'function') {
    showToast('Generating realistic mock records...', 'success');
  }

  const now = new Date();
  const expensesToSeed = [];

  // Generate 12 random expenses spanning the last 45 days
  for (let i = 0; i < 12; i++) {
    const randomDaysAgo = Math.floor(Math.random() * 45);
    const expenseDate = new Date();
    expenseDate.setDate(now.getDate() - randomDaysAgo);
    const dateStr = expenseDate.toISOString().split('T')[0];

    // Pick a random template from the structured templates list
    const template = MOCK_TEMPLATES[Math.floor(Math.random() * MOCK_TEMPLATES.length)];
    const title = template.title;
    const category = template.category;
    const note = template.note;

    // Calculate a realistic price range value
    const randomAmount = Math.random() * (template.maxPrice - template.minPrice) + template.minPrice;
    const amount = parseFloat(randomAmount.toFixed(2));

    expensesToSeed.push({
      title,
      amount,
      category,
      expense_date: dateStr,
      note
    });
  }

  let successCount = 0;
  for (const exp of expensesToSeed) {
    try {
      // Calls POST API endpoint directly
      const response = await fetch('/api/expenses/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exp)
      });
      if (response.ok) {
        successCount++;
      }
    } catch (e) {
      console.error('Failed to seed record:', e);
    }
  }

  // Refresh UI metrics & records list
  if (successCount > 0) {
    if (typeof showToast === 'function') {
      showToast(`Seeded ${successCount} realistic expenses successfully!`, 'success');
    }
    if (typeof fetchExpenses === 'function') fetchExpenses();
    if (typeof fetchSummary === 'function') fetchSummary();
  } else {
    if (typeof showToast === 'function') {
      showToast('Failed to seed mock data', 'error');
    }
  }

  if (seedBtn) {
    seedBtn.disabled = false;
    seedBtn.innerHTML = '⚡ Seed Data';
  }
}
