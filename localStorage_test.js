// Test localStorage functionality for file search tools

// Test data structure for file search tool
const testFileSearchConfig = {
  selectedFiles: ['file1', 'file2'],
  selectedVectorStores: ['vs_123', 'vs_456'],
  vectorStoreNames: ['Store One', 'Store Two']
};

console.log('File Search Config:', testFileSearchConfig);

// Test combined key generation
const combinedKey = testFileSearchConfig.selectedVectorStores.sort().join('|');
console.log('Combined key:', combinedKey);

// Test localStorage data structure
const fileSearchToolsMap = {};
fileSearchToolsMap[combinedKey] = {
  selectedFiles: testFileSearchConfig.selectedFiles,
  selectedVectorStores: testFileSearchConfig.selectedVectorStores,
  vectorStoreNames: testFileSearchConfig.vectorStoreNames,
  lastUpdated: new Date().toISOString()
};

console.log('localStorage structure:', JSON.stringify(fileSearchToolsMap, null, 2));
console.log('Test completed successfully!');