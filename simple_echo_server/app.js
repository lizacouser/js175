const HTTP = require('http');
const PORT = 3000;

// creates http server and assigns it to constant
// req means request
// res means response
// req.url represents the path to the resource, not the full url
const SERVER = HTTP.createServer((req, res) => {
  let method = req.method;
  let path = req.url;

  if (path === '/favicon.ico') {
    res.statusCode = 404;
    res.end();
  } else {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.write(`${method} ${path}\n`);
    res.end();
  }
});

// listens 
SERVER.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});