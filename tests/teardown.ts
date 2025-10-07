export default async (): Promise<void> => {
  // Clean up test containers and resources
  console.log('🧹 Cleaning up test environment...');
  
  // Close any open database connections
  if (global.testDbPool) {
    await global.testDbPool.end();
  }
  
  // Close Redis connections
  if (global.testRedisClient) {
    await global.testRedisClient.disconnect();
  }
  
  // Clean up test files if any
  const fs = require('fs');
  const path = require('path');
  const testUploadsDir = path.join(process.cwd(), 'tests', 'fixtures', 'uploads');
  
  if (fs.existsSync(testUploadsDir)) {
    const files = fs.readdirSync(testUploadsDir);
    files.forEach((file: string) => {
      if (file.startsWith('test_')) {
        fs.unlinkSync(path.join(testUploadsDir, file));
      }
    });
  }
  
  console.log('✅ Test cleanup completed');
};