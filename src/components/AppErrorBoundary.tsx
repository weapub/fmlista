import React from 'react'

type AppErrorBoundaryProps = {
  children: React.ReactNode
}

type AppErrorBoundaryState = {
  hasError: boolean
}

export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Avoid importing telemetry at module top-level to keep this boundary lightweight.
    void import('@/lib/clientTelemetry').then(({ reportClientError }) => {
      reportClientError({
        source: 'react-error-boundary',
        message: error.message,
        stack: error.stack,
        metadata: { componentStack: errorInfo.componentStack },
      })
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleHome = () => {
    window.location.href = '/'
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="min-h-screen bg-[#f5f5f9] dark:bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm text-center space-y-4">
          <h1 className="text-xl font-black text-[#566a7f] dark:text-white">Ocurrio un error inesperado</h1>
          <p className="text-sm text-[#697a8d] dark:text-slate-300">
            Ya registramos el problema. Puedes recargar la pagina o volver al inicio.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="rounded-xl bg-[#696cff] px-4 py-2 text-sm font-bold text-white hover:bg-[#5f61e6] transition-colors"
            >
              Recargar
            </button>
            <button
              type="button"
              onClick={this.handleHome}
              className="rounded-xl border border-gray-200 dark:border-slate-700 px-4 py-2 text-sm font-bold text-[#566a7f] dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    )
  }
}

