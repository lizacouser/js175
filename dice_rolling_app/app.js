/*
P:
-simulate a six sided die
-generate random number between 1 + 6
-return result in body of HTTP response
-also return method and path into body for logging purposes

*/

const HTTP = require('http');
const PORT = 3000;
const NUM_SIDES_DICE = 6;

const SERVER = HTTP.createServer((req, res) => {
  let method = req.method;
  let path = req.url;

  if (path === '/favicon.ico') {
    res.statusCode = 404;
    res.end();
  } else {
    let randomNumber = Math.floor(Math.random() * NUM_SIDES_DICE + 1);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.write(`You rolled a ${randomNumber}\n`);
    res.write(`${method} ${path}\n`);
    res.end();
  }
});

// listens 
SERVER.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});