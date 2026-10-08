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
const joinedPath = path.join(sampleFilesDir, "system-folder", "systemFile.txt");
console.log("Joined path:", joinedPath);

// fs.promises API
const demoFilePath = path.join(sampleFilesDir, "demo.txt");

async function fsPromisesDemo() {
  try {
    // write
    await fs.promises.writeFile(demoFilePath, "Hello from fs.promises!");
    // read
    const data = await fs.promises.readFile(demoFilePath, "utf8");
    console.log("fs.promises read:", data);
    

  } catch (err) {
    console.log("fs.promises demo failed:", err.message);
  }
}

fsPromisesDemo();

// Streams for large files- log first 40 chars of each chunk
