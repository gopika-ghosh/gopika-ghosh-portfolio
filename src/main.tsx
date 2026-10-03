import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/fredoka'
import '@fontsource-variable/nunito'
import 'lenis/dist/lenis.css'
import './index.css'
import App from './App'
import { reducedMotion } from './lib/env'

// Lets CSS honour the ?reduced test flag as well as the OS setting.
if (reducedMotion) document.documentElement.classList.add('reduced-motion')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
