import { FcGoogle } from 'react-icons/fc'
import {
  FaFacebook, FaInstagram, FaMicrosoft, FaLinkedin, FaGithub,
  FaUniversity, FaDatabase, FaWifi, FaFolder, FaKey, FaEnvelope,
  FaGamepad, FaShoppingCart, FaHome, FaPlane, FaLaptopCode, FaVideo,
} from 'react-icons/fa'
import { SiSamsung, SiIcloud } from 'react-icons/si'

// `key` is what gets stored in the database. Rendering always looks the
// icon up by key, so changing the visual style later never breaks old data.
export const VAULT_ICONS = [
  { key: 'folder', Icon: FaFolder, label: 'Folder' },
  { key: 'key', Icon: FaKey, label: 'Key' },
  { key: 'email', Icon: FaEnvelope, label: 'Email' },
  { key: 'gaming', Icon: FaGamepad, label: 'Gaming' },
  { key: 'shopping', Icon: FaShoppingCart, label: 'Shopping' },
  { key: 'home', Icon: FaHome, label: 'Home' },
  { key: 'travel', Icon: FaPlane, label: 'Travel' },
  { key: 'google', Icon: FcGoogle, label: 'Google' },
  { key: 'facebook', Icon: FaFacebook, label: 'Facebook' },
  { key: 'instagram', Icon: FaInstagram, label: 'Instagram' },
  { key: 'microsoft', Icon: FaMicrosoft, label: 'Microsoft' },
  { key: 'linkedin', Icon: FaLinkedin, label: 'LinkedIn' },
  { key: 'samsung', Icon: SiSamsung, label: 'Samsung' },
  { key: 'bank', Icon: FaUniversity, label: 'Bank' },
  { key: 'icloud', Icon: SiIcloud, label: 'iCloud' },
  { key: 'database', Icon: FaDatabase, label: 'Database' },
  { key: 'github', Icon: FaGithub, label: 'GitHub' },
  { key: 'cctv', Icon: FaVideo, label: 'CCTV' },
  { key: 'wifi', Icon: FaWifi, label: 'WiFi' },
  { key: 'software', Icon: FaLaptopCode, label: 'Software' },
]

export function getVaultIcon(key) {
  return VAULT_ICONS.find((i) => i.key === key)
}

// Renders a vault category icon by key. Falls back to showing the raw
// value as text/emoji for categories created before this icon set existed.
export function VaultIconDisplay({ iconKey, size = 18 }) {
  const found = getVaultIcon(iconKey)
  if (found) {
    const { Icon } = found
    return <Icon size={size} />
  }
  return <span style={{ fontSize: size }}>{iconKey || '📁'}</span>
}
