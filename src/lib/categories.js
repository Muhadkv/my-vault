// Each category can define a custom label for its optional note field
// (e.g. "Restaurant name" for Tea, "Shop name" for Dress). Categories
// without a noteLabel just get a generic "Note".
export const EXPENSE_CATEGORIES = [
  { name: 'Food', icon: '🍽️' },
  { name: 'Breakfast', icon: '🍳', noteLabel: 'Restaurant name' },
  { name: 'Lunch', icon: '🍛', noteLabel: 'Restaurant name' },
  { name: 'Dinner', icon: '🍽️', noteLabel: 'Restaurant name' },
  { name: 'Tea', icon: '🍵', noteLabel: 'Restaurant name' },
  { name: 'Coffee', icon: '☕', noteLabel: 'Restaurant name' },
  { name: 'Mess', icon: '🍲' },
  { name: 'Dress', icon: '👗', noteLabel: 'Shop name' },
  { name: 'Shopping', icon: '🛍️' },
  { name: 'Transport', icon: '🚌' },
  { name: 'Taxi', icon: '🚕' },
  { name: 'Bus Recharge', icon: '🚏' },
  { name: 'Electric Scooter', icon: '🛴', noteLabel: 'Remarks' },
  { name: 'Mobile Recharge', icon: '📱', noteLabel: 'Remarks' },
  { name: 'Bills', icon: '🧾' },
  { name: 'Room Rent', icon: '🏠' },
  { name: 'Loan', icon: '💰' },
  { name: 'Tabby', icon: '💳', noteLabel: 'Remarks' },
  { name: 'Transfer to India', icon: '🌍', noteLabel: 'Remarks' },
  { name: 'Transfer to Person', icon: '💸', noteLabel: 'Remarks' },
  { name: 'Fine', icon: '⚠️', noteLabel: 'Remarks' },
  { name: 'Health', icon: '🏥' },
  { name: 'Entertainment', icon: '🎬' },
  { name: 'Other', icon: '🗂️' },
]

export function noteLabelFor(categoryName) {
  const found = EXPENSE_CATEGORIES.find((c) => c.name === categoryName)
  return found?.noteLabel || 'Note'
}

export function iconFor(categoryName) {
  const found = EXPENSE_CATEGORIES.find((c) => c.name === categoryName)
  return found?.icon || '💳'
}

export const CURRENCY = 'AED'

export function formatMoney(amount) {
  return `${CURRENCY} ${Number(amount).toFixed(2)}`
}
