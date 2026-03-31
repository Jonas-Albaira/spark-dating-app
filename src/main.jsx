import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// React 18: createRoot API (replaces ReactDOM.render)
// Enables concurrent features: useTransition, useDeferredValue, Suspense
ReactDOM.createRoot(document.getElementById('root')).render(
  // StrictMode: renders components twice in dev to catch side-effect bugs
  // Warns about deprecated lifecycle methods and legacy patterns
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
