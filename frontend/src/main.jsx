// frontend/src/main.jsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'  // optional: import your global styles

// Create the React root and mount your App component
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

