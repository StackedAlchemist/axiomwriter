import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    // Chunk load failures happen when a new deploy invalidates cached JS bundles.
    // The only fix is a hard reload — the old chunk URL no longer exists.
    const isChunkError = this.state.error?.message?.includes('dynamically imported module')
      || this.state.error?.message?.includes('Failed to fetch')
      || this.state.error?.name === 'ChunkLoadError'

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-8">
        <div className="w-14 h-14 rounded-full bg-red-900/20 border border-red-500/30 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <h2 className="font-serif text-xl text-slate-200 mb-2">
          {isChunkError ? 'App updated — reload required' : 'Something went wrong'}
        </h2>
        <p className="text-sm text-slate-500 mb-1 max-w-sm">
          {isChunkError
            ? 'A new version of Axiom was deployed. Please reload the page to continue — your work is saved.'
            : 'An unexpected error occurred. Your work is saved automatically via Firestore.'}
        </p>
        {!isChunkError && this.state.error?.message && (
          <p className="text-xs text-slate-700 font-mono mb-6 max-w-sm break-all">
            {this.state.error.message}
          </p>
        )}
        <button
          onClick={() => isChunkError ? window.location.reload() : this.setState({ hasError: false, error: null })}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-axiom-surface2 hover:bg-axiom-border text-slate-300 text-sm font-medium transition-colors mt-4"
        >
          <RefreshCw className="w-4 h-4" />
          {isChunkError ? 'Reload Axiom' : 'Try again'}
        </button>
      </div>
    )
  }
}
