// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css' 

// import App from './App.tsx';
import App from './AppFn.tsx'; // ← 開発中の関数型バージョンに切り替え

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
