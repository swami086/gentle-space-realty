import React from 'react';

const MinimalApp: React.FC = () => {
  console.log('✅ MinimalApp is rendering successfully!');
  
  return (
    <div style={{padding: '20px', fontSize: '18px', fontFamily: 'Arial, sans-serif'}}>
      <h1 style={{color: 'green'}}>✅ React App is Working!</h1>
      <p>This is a minimal React component to test basic rendering.</p>
      <p>Timestamp: {new Date().toISOString()}</p>
      <div style={{
        backgroundColor: '#e7f5e7', 
        padding: '15px', 
        border: '1px solid #4CAF50',
        borderRadius: '5px',
        margin: '10px 0'
      }}>
        <strong>Success!</strong> If you can see this message, React is working correctly.
      </div>
    </div>
  );
};

export default MinimalApp;