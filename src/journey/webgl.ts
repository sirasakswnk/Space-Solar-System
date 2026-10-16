type ContextSource = { getContext(type: string): unknown }

// True when the browser can create any WebGL context for the 3D scene.
export function detectWebGL(create: () => ContextSource = () => document.createElement('canvas')) {
  try {
    const canvas = create()
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}
