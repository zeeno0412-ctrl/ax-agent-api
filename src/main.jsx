import React from 'react'
import ReactDOM from 'react-dom/client'
import Providers from './components/Providers.jsx'
import RootApp from './RootApp.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Providers>
      <RootApp />
    </Providers>
  </React.StrictMode>
)
