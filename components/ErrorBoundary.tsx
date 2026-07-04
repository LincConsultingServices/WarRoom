'use client'

import React from 'react'

type Props = {
  children: React.ReactNode
  fallbackTitle?: string
}

type State = {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null })
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-center">
        <h1 className="font-got text-2xl text-amber-200">
          {this.props.fallbackTitle ?? 'Something went sideways in the Chessboard.'}
        </h1>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          {this.state.error?.message ?? 'An unexpected error occurred.'}
        </p>
        <button
          onClick={this.handleReload}
          className="mt-6 rounded-md border border-amber-200/30 bg-amber-200/10 px-4 py-2 text-amber-100 transition hover:bg-amber-200/20"
        >
          Reload phase
        </button>
      </div>
    )
  }
}

export default ErrorBoundary
