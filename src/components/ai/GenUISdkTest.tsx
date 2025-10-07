import React from 'react';

// Test GenUI SDK imports and basic functionality
const GenUISdkTest: React.FC = () => {
  let testResults: string[] = [];

  // Test 1: Import GenUI SDK components
  try {
    const { C1Component, ThemeProvider } = require('@thesysai/genui-sdk');
    testResults.push('✅ GenUI SDK imports successful');
    
    // Test 2: Check if components are functions/classes
    if (typeof C1Component === 'function' || typeof C1Component === 'object') {
      testResults.push('✅ C1Component is valid React component');
    } else {
      testResults.push('❌ C1Component is not valid');
    }
    
    if (typeof ThemeProvider === 'function' || typeof ThemeProvider === 'object') {
      testResults.push('✅ ThemeProvider is valid React component');
    } else {
      testResults.push('❌ ThemeProvider is not valid');
    }
  } catch (error) {
    testResults.push(`❌ GenUI SDK import failed: ${error}`);
  }

  // Test 3: CSS import verification
  const cssImported = document.querySelector('style[data-source*="crayonai"], link[href*="crayonai"]') !== null;
  if (cssImported) {
    testResults.push('✅ Crayon UI CSS detected');
  } else {
    testResults.push('⚠️ Crayon UI CSS not detected in DOM');
  }

  // Test 4: Font verification
  const hasInterFont = document.fonts ? Array.from(document.fonts).some(font => font.family.includes('Inter')) : false;
  if (hasInterFont || getComputedStyle(document.body).fontFamily.includes('Inter')) {
    testResults.push('✅ Inter font available');
  } else {
    testResults.push('⚠️ Inter font not detected');
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="font-bold text-lg mb-3">GenUI SDK Configuration Test</h3>
      <div className="space-y-2">
        {testResults.map((result, index) => (
          <div key={index} className="text-sm font-mono">
            {result}
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-white border border-gray-200 rounded">
        <h4 className="font-medium mb-2">Test Simple C1Component</h4>
        <div className="text-xs text-gray-600 mb-2">Testing basic C1Component rendering:</div>
        
        {(() => {
          try {
            const { C1Component, ThemeProvider } = require('@thesysai/genui-sdk');
            const testResponse = JSON.stringify({
              type: "content",
              components: [{
                type: "text",
                content: "Test response from GenUI SDK"
              }]
            });
            
            return (
              <ThemeProvider>
                <C1Component 
                  c1Response={testResponse}
                  onAction={(action, data) => {
                    console.log('GenUI Test Action:', action, data);
                  }}
                />
              </ThemeProvider>
            );
          } catch (error) {
            return (
              <div className="text-red-600 text-sm">
                Failed to render C1Component: {String(error)}
              </div>
            );
          }
        })()}
      </div>
    </div>
  );
};

export default GenUISdkTest;