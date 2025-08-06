// // frontend/src/main.jsx
//
// import React from 'react'
// import ReactDOM from 'react-dom/client'
// import App from './App'
// import './index.css'  // optional: import your global styles
//
// // Create the React root and mount your App component
// ReactDOM.createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// )

// frontend/src/main.jsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { BrowserRouter } from 'react-router-dom'   // ← new import

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>                             {/* ← wrap here */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
