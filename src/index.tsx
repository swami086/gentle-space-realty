import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import '@crayonai/react-ui/styles/index.css';

console.log('🚀 index.tsx is executing');
console.log('📋 DOM element check:', document.getElementById('app'));

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('✅ ReactDOM.createRoot called successfully');