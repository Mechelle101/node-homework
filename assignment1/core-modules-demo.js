const os = require('os');
const path = require('path');
const fs = require('fs');

const sampleFilesDir = path.join(__dirname, 'sample-files');
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

// OS module (look back at this for task 5...)
console.log("Platform:", os.platform());

const cpuList = os.cpus();
const firstCpu = cpuList[0];
const cpuName = firstCpu.model;
console.log("CPU:", cpuName);

console.log("Total Memory:", os.totalmem());

// Path module
const joinedPath = path.join("Joined path:", sampleFilesDir, "system-folder", "systemFile.txt");
console.log(joinedPath);

// fs.promises API


// Streams for large files- log first 40 chars of each chunk
