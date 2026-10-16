import { useEffect, useState } from 'react'
import type { MotionPreference } from './motion'

// Start from the system setting and follow its changes until the user picks a
// value on the page; that choice then stays, including after starting over.
export default function useReducedMotion(motion: MotionPreference) {
  const [system, setSystem] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [choice, setChoice] = useState<boolean | null>(null)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setSystem(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  const reduced = choice ?? system
  useEffect(() => { motion.reduced = reduced }, [motion, reduced])
  return { reduced, setReduced: setChoice }
}
