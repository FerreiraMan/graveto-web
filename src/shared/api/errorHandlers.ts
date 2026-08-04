// apiRequest (client.ts) is a plain function, not a component, so it can't call
// useContext directly. App.tsx wires the real notify/logout implementations in
// once at startup via registerGlobalErrorHandlers, similar in spirit to how
// token.ts exposes module-level get/set without needing context.
interface GlobalErrorHandlers {
  notify: (message: string) => void
  onUnauthorized: () => void
}

let handlers: GlobalErrorHandlers | null = null

export function registerGlobalErrorHandlers(next: GlobalErrorHandlers): void {
  handlers = next
}

export function getGlobalErrorHandlers(): GlobalErrorHandlers | null {
  return handlers
}
