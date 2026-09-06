// Each category can define a custom label for its optional note field
// (e.g. "Restaurant name" for Tea, "Shop name" for Dress). Categories
// without a noteLabel just get a generic "Note".
export const EXPENSE_CATEGORIES = [
  { name: 'Food' },
  { name: 'Breakfast', noteLabel: 'Restaurant name' },
  { name: 'Lunch', noteLabel: 'Restaurant name' },
  { name: 'Dinner', noteLabel: 'Restaurant name' },
  { name: 'Tea', noteLabel: 'Restaurant name' },
  { name: 'Coffee', noteLabel: 'Restaurant name' },
  { name: 'Mess' },
  { name: 'Dress', noteLabel: 'Shop name' },
  { name: 'Shopping' },
  { name: 'Transport' },
  { name: 'Taxi' },
  { name: 'Bus Recharge' },
  { name: 'Electric Scooter', noteLabel: 'Remarks' },
  { name: 'Mobile Recharge', noteLabel: 'Remarks' },
  { name: 'Bills' },
  { name: 'Room Rent' },
  { name: 'Loan' },
  { name: 'Tabby', noteLabel: 'Remarks' },
  { name: 'Transfer to India', noteLabel: 'Remarks' },
  { name: 'Transfer to Person', noteLabel: 'Remarks' },
  { name: 'Fine', noteLabel: 'Remarks' },
  { name: 'Health' },
  { name: 'Entertainment' },
  { name: 'Other' },
]

export function noteLabelFor(categoryName) {
  const found = EXPENSE_CATEGORIES.find((c) => c.name === categoryName)
  return found?.noteLabel || 'Note'
}
