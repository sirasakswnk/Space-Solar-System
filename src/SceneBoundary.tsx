import { Component } from 'react'
import type { ReactNode } from 'react'

// A WebGL context that fails after detection would otherwise unmount the whole
// app; switch to the readable fallback instead.
export default class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onError() }
  render() { return this.state.failed ? null : this.props.children }
}
