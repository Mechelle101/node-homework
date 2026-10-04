const fs = require("fs");
const path = require("path");

// Write a sample file for demonstration
const sampleFilePath = path.join(__dirname, "sample-files", "sample.txt");
// the sync version is more simple for a simple file
fs.writeFileSync(sampleFilePath, "Hello, async world!");

// wrap the callback in a promise
function readTextFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data);
    });
  });
}

// async/await
async function asyncReadTextFile(asyncPath) {
  try {
    const data = await readTextFile(asyncPath);
    console.log("Async await read:", data);
  } catch (err) {
    console.log("Async await read failed:", err.message);
  }
}

// 1. Callback style
fs.readFile(sampleFilePath, "utf8", (err, data) => {
  if (err) {
    console.log("Callback read failed:", err.message);
    return;
  }
  console.log("Callback read:", data);

  // 2. Promise style
  readTextFile(sampleFilePath)
    .then((data) => {
      console.log("Promise, reading file:", data);
      // 3. Async/Await style
      asyncReadTextFile(sampleFilePath);
    })
    .catch((err) => {
      console.log("Promise read failed:", err.message);
    });
}); 
// Callback hell example (test and leave it in comments):
