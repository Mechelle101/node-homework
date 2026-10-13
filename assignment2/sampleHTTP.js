
// Imports
const http = require("http");

// Data
const htmlString = `
<!DOCTYPE html>
<html>
<body>
<h1>Clock</h1>
<button id="getTimeBtn">Get the Time</button>
<p id="time"></p>
<script>
document.getElementById('getTimeBtn').addEventListener('click', async () => {
  const res = await fetch('/time');
  const timeObj = await res.json();
  console.log(timeObj);
  const timeP = document.getElementById('time');
  timeP.textContent = timeObj.time;
});
</script>
</body>
</html>
`;

// Server
const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/time") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        time: new Date().toString(),
      }),
    );
  } else if (req.method === "GET" && req.url === "/timePage") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(htmlString);
  } else if (req.method === "POST" && req.url === "/echo") {
    let body = ""; //the container
    //data listener
    req.on("data", (chunk) => {
      body += chunk; //adding chunks as they come in
    });
    
    req.on("end", () => {
      try {
        const parsedBody = JSON.parse(body);//pars in

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            weReceived: parsedBody,//stringify out
          }),
        );
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json"});
        res.end(
          JSON.stringify({
            message: "Invalid JSON.",
          }),
        );
      } // catch() block
    }); // req.on(end...)
    } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message: "That route is not available.",
      }),
    );
   }
});

// Start Server
server.listen(8000);
