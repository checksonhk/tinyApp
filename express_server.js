const express = require('express');
const app = express();
const PORT = 8080;

app.set('view engine','ejs');

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls', (req, res) => {
  let temp = { urls: urlDatabase};
  res.render('urls_index', temp);
});

app.get('/urls/:shortURL', (req, res) => {
  let temp = {shortURL: req.params.shortURL, longURL: req.params.longURL};
  res.render('urls_show', temp);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});