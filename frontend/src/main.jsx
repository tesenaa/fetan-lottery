import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // 👈 ካለዎት የግሎባል ስታይል ፋይል ያክሉ

// 🌐 Telegram WebApp ማስጀመሪያ
if (window.Telegram?.WebApp) {
  window.Telegram.WebApp.ready();
  window.Telegram.WebApp.expand();
  window.Telegram.WebApp.setHeaderColor('#0c0c1e');
  window.Telegram.WebApp.setBackgroundColor('#0c0c1e');
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);