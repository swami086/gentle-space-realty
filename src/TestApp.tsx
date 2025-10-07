import React from 'react';

const TestApp: React.FC = () => {
  console.log('🧪 TestApp component is rendering');
  
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333' }}>🧪 Test App is Working!</h1>
      <p>This is a simple test component to verify React is rendering correctly.</p>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '15px', 
        border: '1px solid #ccc',
        borderRadius: '5px',
        margin: '10px 0'
      }}>
        <h2>Debug Information:</h2>
        <ul>
          <li>React: ✅ Loaded and rendering</li>
          <li>Timestamp: {new Date().toISOString()}</li>
          <li>Environment: {import.meta.env.MODE}</li>
          <li>Vite Dev Server: ✅ Active</li>
        </ul>
      </div>
      <button 
        onClick={() => alert('Button clicked! React event handling works.')}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Test Click Event
      </button>
    </div>
  );
};

export default TestApp;