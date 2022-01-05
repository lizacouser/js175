/*
P:
-APR set to 5%
-loan amount and loan duration (in years) passed in a query params
-formula for monthly payment is:
let monthlyPayment = loanAmount * (monthlyInterest / (1 - Math.pow((1 + monthlyInterest), (-loanDurationMonths))));
-returns:
Amount: $5000
Duration: 10 years
APR: 5%
Monthly payment: $53.03

E:
-$5000, 10 years, APR 5%, monthly payment $53.03
-$5000, 6 months, APR 5%, monthly payment $845.53
-$AMOUNT_INTERVAL000, 8 years, apr 5%, monthy payment #1265.99

D:
-input strings (amt + duration)
-output strings written to html file

A:
-import http and url
-declare post const and APR const

-create function to get parameters

-create function to calculate monthly payment
  -given amount and duration
  -convert APR to months (divide by 12)
  -convert duration to months (multiply by 12)
  -plug into formula and return monthly payment

-create function to get results into string
  -given params
  -get loan amount and convert to number
  -get loan duration and convert to number
  -get interest and convert to number
  -get monthly payment
  -return string
*/

const HTTP = require('http');
const URL = require('url').URL;
const PORT = 3000;

const APR = 0.05;
const DEFAULT_AMOUNT = 5000;
const DEFAULT_DURATION = 10;
const AMOUNT_INTERVAL = 1000;
const DURATION_INTERVAL = 5;


const HTML_START = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Loan Calculator</title>
    <style type="text/css">
    body {
      background: rgba(250, 250, 250);
      font-family: sans-serif;
      color: rgb(50, 50, 50);
    }

    article {
      width: AMOUNT_INTERVAL%;
      max-width: 40rem;
      margin: 0 auto;
      padding: 1rem 2rem;
    }

    h1 {
      font-size: 2.5rem;
      text-align: center;
    }

    table {
      font-size: 2rem;
    }

    th {
      text-align: right;
    }
  </style>
  </head>
  <body>
    <article>
      <h1>Loan Calculator</h1>
      <table>
        <tbody>`;

const HTML_END = `
        </tbody>
      </table>
    </article>
  </body>
</html>`;

function yearOrYears(num) {
  return Math.abs(num) === 1 ? `${num} year` : `${num} years`;
}

function getParams(path) {
  const myURL = new URL(path, `http://localhost:${PORT}`);
  return myURL.searchParams;
};

function calculateMonthlyPayment(loanAmount, durationInYears) {
  let durationInMonths = durationInYears * 12;
  let monthlyInterest = APR/12;

  return loanAmount * (monthlyInterest / (1 - Math.pow((1 + monthlyInterest), (-durationInMonths))))
}

function getLoanData(params) {
  let loanAmount = Number(params.get('amount')) || DEFAULT_AMOUNT;
  let durationInYears = Number(params.get('duration')) || DEFAULT_DURATION;
  let monthlyPayment = calculateMonthlyPayment(loanAmount, durationInYears);

  let content = `
    <tr>
      <th>Amount:</th>
      <td>
        <a href='/?amount=${loanAmount - AMOUNT_INTERVAL}&duration=${durationInYears}'>- $${AMOUNT_INTERVAL}</a>
      </td>
      <td>$${loanAmount}</td>
      <td>
      <a href='/?amount=${loanAmount + AMOUNT_INTERVAL}&duration=${durationInYears}'>+ $${AMOUNT_INTERVAL}</a>
      </td>
    </tr>
    <tr>
      <th>Duration:</th>
      <td>
        <a href='/?amount=${loanAmount}&duration=${durationInYears - DURATION_INTERVAL}'>- ${yearOrYears(DURATION_INTERVAL)}</a> 
      </td>
      <td>${durationInYears} years</td>
      <td>
        <a href='/?amount=${loanAmount}&duration=${durationInYears + DURATION_INTERVAL}'>+ ${yearOrYears(DURATION_INTERVAL)}</a> 
      </td>
    </tr>
    <tr>
      <th>APR:</th>
      <td colspan='3'>${APR * 100}%</td>
    </tr>
    <tr>
      <th>Monthly payment:</th>
      <td colspan='3'>$${monthlyPayment.toFixed(2)}</td>
    </tr>`;

  return `${HTML_START}${content}${HTML_END}`;
}

const SERVER = HTTP.createServer((req, res) => {
  let method = req.method;
  let path = req.url;

  if (path === '/favicon.ico') {
    res.statusCode = 404;
    res.end();

  } else {
    let params = getParams(path);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.write(getLoanData(params));
    res.end();
  }
});

// listens 
SERVER.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});