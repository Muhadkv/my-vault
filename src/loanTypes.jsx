import { FaUser, FaUniversity, FaMobileAlt, FaComments, FaEllipsisH } from 'react-icons/fa'

export const LOAN_TYPES = [
  { key: 'person', label: 'Person', Icon: FaUser, color: '#5C9DE8' },
  { key: 'tabby', label: 'Tabby', Icon: FaMobileAlt, color: '#B05CE8' },
  { key: 'botim', label: 'Botim', Icon: FaComments, color: '#3FA796' },
  { key: 'bank', label: 'Bank', Icon: FaUniversity, color: '#E8A65C' },
  { key: 'other', label: 'Other', Icon: FaEllipsisH, color: '#8B97A6' },
]

export function getLoanType(key) {
  return LOAN_TYPES.find((t) => t.key === key) || LOAN_TYPES[LOAN_TYPES.length - 1]
}

// Returns { label, isOverdue, isSoon } describing how many days remain
// until a due date (or how many days overdue it is).
export function dueDateStatus(dueDateStr) {
  if (!dueDateStr) return null
  const due = new Date(dueDateStr)
  due.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((due - today) / 86400000)

  if (days < 0) return { label: `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} overdue`, isOverdue: true, isSoon: false }
  if (days === 0) return { label: 'Due today', isOverdue: false, isSoon: true }
  if (days <= 3) return { label: `Due in ${days} day${days !== 1 ? 's' : ''}`, isOverdue: false, isSoon: true }
  return { label: `Due in ${days} days`, isOverdue: false, isSoon: false }
}
