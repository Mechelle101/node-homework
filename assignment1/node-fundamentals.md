# Node.js Fundamentals

## What is Node.js?
Node.js is an open source, cross-platform JavaScript runtime environment that allows devs to execute JS code outside of a web browser, built on Googles V8 JS engine. It is the same language, JS, but runs in an environment that give it access to things the browser blocks, like the file system, networking, environment variables, and the OS.

## How does Node.js differ from running JavaScript in the browser?
The browser runs JS inside a sandbox to protect the user, so a website cant read your files or start a server. Browser JS works with the page through a window, document, or, DOM. Node has none of those because there is no web page. Instead Node provides backend tools. Node can read and write files, start webservers, and safely handle sensitive things like API keys because server codes isn't visible to users.

## What is the V8 engine, and how does Node use it?
V8 is the hight-performance JS engin Google built for the Chrome browser. An engin reads JS and compiles in into fast machine code the computer can run. Node takes V8 out of the browser and wraps extra abilities around it, like file system access, networking, and the event loop for asynchronous operations. 

## What are some key use cases for Node.js?
Web APIs and servers that respond to requests from browsers or apps.
Command-line tools that automation tasks in the terminal. 
Real-time apps like chat or live dashboards that push updates instantly. 
build tools and scripts that bundle code or process files.
***Node is strongest for I/O heavy work, where the program spends most of its time waiting on files, networks or DBs, because its non-blocking even loops can handle many requests while it waits. Although, it is weaker for CPU-heavy work like image processing or machine training. 

## Explain the difference between CommonJS and ES Modules. Give a code example of each.
CommonJS is Nodes's original module system. It imports with require(), exports with module.exports, and it is the default for .js files in Node. 
ES Modules are the official JavaScript standard use in browsers and React. They use import/export Node supports ES Modules in .mjs files or when "type":"module" is set in package.json. 

(mixing these two styles in one project can cause problems, best to pick one and go with it)

**CommonJS (default in Node.js):**
```js
// mathUtils.js
function add(a,b) {
    return a+b;
}
module.exports={add};

// app.js
const{add}=require("./mathUtils");
console.log(add(2,3));//output is 5
```

**ES Modules (supported in modern Node.js):**
```js
// mathUtils.mjs
export function add(a,b){
    return a+b;
}

//app.mjs
import{add}from"./mathUtils.mjs";
console.log(add(2,3));// output is 5
``` 