const EXPRESS = require('express');

const APP = EXPRESS(); // means we can use all of the different functions

APP.set('view engine', 'pug'); // lets us use pug inside of express application. sets view engine to pug.

APP.get('/', (request, response) => {
  response.render('index');
});

APP.get('/account', (request, response) => {
  response.render('account', {money: '$100', recentTransaction: true});
});

APP.listen(3000, () => {
  console.log('Listening on port 3000...');
}); // starts a new server on a specific port

 

