/*
P:
-simulate a six sided die
-generate random number between 1 + 6
-return result in body of HTTP response
-also return method and path into body for logging purposes

*/

const HTTP = require('http');

// imports URL constructor from node module URL
const URL = require('url').URL;

const PORT = 3000;

function rollDice(params) {
  let numRolls = params.get('rolls') || 1;
  let numSides = params.get('sides') || 6;

  let result = "You rolled:\n"
  for (let count = 0; count < numRolls; count += 1) {
    result += `${Math.floor(Math.random() * numSides + 1)}\n`;
  }
  return result;
}

function getParams(path) {
  const myURL = new URL(path, `http://localhost:${PORT}`);
  return myURL.searchParams;
};

const SERVER = HTTP.createServer((req, res) => {
  let method = req.method;
  let path = req.url;

  if (path === '/favicon.ico') {
    res.statusCode = 404;
    res.end();

  } else {
    let params = getParams(path);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.write(rollDice(params));
    res.write(`${method} ${path}\n`);
    res.end();
  }
});

// listens 
SERVER.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});