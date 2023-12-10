import React from 'react'
import ReactDOM from 'react-dom/client'
import Home from './home.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <header>
      <img className='header-content' src='./app/assets/icon.svg' />
      <div className='header-content'>Allures Athlétic Cœur de fond</div>
    </header>
    <main>
      <Home />
    </main>
  </React.StrictMode>,
)
