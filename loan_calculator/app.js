/*
P:
-APR set to 5%
-loan amount and loan duration (in years) passed in a query params
-formula for monthly payment is:
let monthlyPayment = loanAmount * (monthlyInterest / (1 -
  Math.pow((1 + monthlyInterest), (-loanDurationMonths))));
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
const HANDLEBARS = require('handlebars');

const SOURCE = `
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
        <tbody>
        <tr>
          <th>Amount:</th>
          <td>
            <a href='/?amount={{amountDecrement}}&duration={{durationInYears}}'>- $ {{amountInterval}}</a>
          </td>
          <td>$ {{loanAmount}}</td>
          <td>
          <a href='/?amount={{amountIncrement}}&duration={{durationInYears}}'>+ $ {{amountInterval}}</a>
          </td>
        </tr>
        <tr>
          <th>Duration:</th>
          <td>
            <a href='/?amount={{loanAmount}}&duration={{durationDecrement}}'>- {{durationInterval}} year</a> 
          </td>
          <td>{{durationInYears}} years</td>
          <td>
            <a href='/?amount={{loanAmount}}&duration={{durationIncrement}}'>+ {{durationInterval}} year</a> 
          </td>
        </tr>
        <tr>
          <th>APR:</th>
          <td colspan='3'>{{apr}}%</td>
        </tr>
        <tr>
          <th>Monthly payment:</th>
          <td colspan='3'>$ {{monthlyPayment}}</td>
        </tr>
      </tbody>
    </table>
  </article>
  </body>
</html>
`;

const LOAN_DATA_TEMPLATE = HANDLEBARS.compile(SOURCE);

function render(template, data) {
  let html = template(data);
  return html;
}

function getParams(path) {
  const myURL = new URL(path, `http://localhost:${PORT}`);
  return myURL.searchParams;
}

function calculateMonthlyPay(loanAmount, durationInYears, APR) {
  let durationInMonths = durationInYears * 12;
  let monthlyInterest = (APR / 100) / 12;

  let payment = loanAmount * (monthlyInterest / (1 - Math.pow((1 +
    monthlyInterest), (-durationInMonths))));

  return payment.toFixed(2);
}

function createLoanObject(params) {
  let data = {};
  const APR = 5;
  const [DEFAULT_AMOUNT, DEFAULT_DURATION] = [5000, 10];
  const [AMOUNT_INTERVAL, DURATION_INTERVAL] = [100, 1];

  data.loanAmount = Number(params.get('amount')) || DEFAULT_AMOUNT;
  data.amountInterval = AMOUNT_INTERVAL;
  data.amountIncrement = data.loanAmount + AMOUNT_INTERVAL;
  data.amountDecrement = data.loanAmount - AMOUNT_INTERVAL;

  data.durationInYears = Number(params.get('duration')) || DEFAULT_DURATION;
  data.durationInterval = DURATION_INTERVAL;
  data.durationIncrement = data.durationInYears + DURATION_INTERVAL;
  data.durationDecrement = data.durationInYears - DURATION_INTERVAL;

  data.apr = APR;

  data.monthlyPayment = calculateMonthlyPay(data.loanAmount,
    data.durationInYears, APR);

  return data;
}

const SERVER = HTTP.createServer((req, res) => {
  // let method = req.method;
  let path = req.url;

  if (path === '/favicon.ico') {
    res.statusCode = 404;
    res.end();

  } else {
    let data = createLoanObject(getParams(path));
    let content = render(LOAN_DATA_TEMPLATE, data);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.write(`${content}\n`);
    res.end();
  }
});

// listens
SERVER.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});