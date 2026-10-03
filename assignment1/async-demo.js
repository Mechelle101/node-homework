const fs = require('fs');
const path = require('path');

// Write a sample file for demonstration
const sampleFilePath = path.join(__dirname, 'sample-files', 'sample.txt');
// the sync version is more simple for a simple file
fs.writeFileSync(sampleFilePath, "Hello, async world!");

// 1. Callback style


  // Callback hell example (test and leave it in comments):


  // 2. Promise style


      // 3. Async/Await style
