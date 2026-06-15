import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './fonts.css'
import './index.css'
import App from './App'

// react-grid-layout (via react-draggable) reads `process.env` at runtime.
// In the browser/extension `process` is undefined, so provide a minimal shim
// before anything tries to use it (avoids "process is not defined" on drag).
if (typeof (globalThis as { process?: unknown }).process === 'undefined') {
	;(globalThis as { process?: unknown }).process = {
		env: { NODE_ENV: import.meta.env.MODE },
	}
}

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>
)
