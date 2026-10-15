import { useEffect } from 'react'
import type { MotionPreference } from './motion'

// Follow the system setting, including changes while the page is open.
export default function useReducedMotion(motion: MotionPreference) {
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => { motion.reduced = query.matches }
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [motion])
}
