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

// Callback hell happens when each async step depends on the one before it.
// With callbacks, the only way to make step 2 wait for step 1 is to put it inside step 1's callback, then step 3 inside step 2, etc. The code is referred to as a pyramid of doom.
// step1(() => {
//   step2(() => {
//     step3(() => {
//       step4(() => {
//        DONE!
//       });
//     });
//   });
// });

// const hellFilePath = path.join(__dirname, "sample-files", "hell-demo.txt");

// fs.writeFile(hellFilePath, "Step 1: file was created\n", (err) => {
//  if (err) {
//   console.log("Write failed:", err.message);
//   return;
//  }
//  fs.appendFile(hellFilePath, "Step 2: line appended\n", (err) => {
//   if (err) {
//     console.log("Appended failed:", err.message);
//     return;
//   }
//   fs.readFile(hellFilePath, "utf8", (err, data) => {
//     if (err) {
//       console.log("Read failed:", err.message);
//       return;
//     }
//     console.log("Callback hell result:", data);
//   });
//  });
// });

// Problems with this style
// 1. readability, 2. repeated error handling, 3. difficult to refactor

// To fix this promises and async/await flatten the pyramid
// async function noMoreHell() {
//   try {
//     await fs.promises.writeFile(step 1);
//     await fs.promises.appendFile(step 2);
//     const data = await fs.promises.readFile();
//     console.log(data);
//   } catch (e) {
//     console.log(e.message);
//   }
// }
