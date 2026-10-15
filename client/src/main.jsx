import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthProvider } from './auth.jsx'
import Root from './Root.jsx'
import { installRipple } from './ripple.js'
import { ThemeProvider } from './theme.jsx'

installRipple()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
