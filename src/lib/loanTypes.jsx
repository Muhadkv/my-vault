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
