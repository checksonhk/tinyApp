const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine','ejs');
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

const findUserByEmail = function(email) {
  const usersArr = Object.values(users);
  
  for (const user of usersArr) {
    if (user.email === email) {
      return true;
    }
  }
  return false;
};

const generateRandomString = function() {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 6; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
};

app.get('/', (req, res) => {
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.userId],
  };
  console.log(users[req.cookies.userId]);
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  // console.log(req.params.shortURL);
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.post('/login', (req,res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

app.get('/register' ,(req, res) => {
  res.render("register");
});

app.post('/register', (req,res) => {
  
  if (req.body.email.length === 0 || req.body.password.length === 0) {
    res.sendStatus(400);
  }

  if (findUserByEmail(req.body.email)) {
    res.sendStatus(400);
  }
  
  let newUserId = generateRandomString();

  users[newUserId] = {
    id : newUserId,
    email : req.body.email,
    password : req.body.password,
  };

  res.cookie('userId', newUserId);
  res.redirect('/urls');
});

app.get('/urls/:shortURL', (req, res) => {
  let temp = {shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
  res.render('urls_show', temp);
});

app.post('/urls/:id', (req,res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  // console.log('shortURL:', req.params);
  res.redirect('/urls');
});


app.post('/urls', (req, res) => {
  let newShortURL = generateRandomString();
  urlDatabase[newShortURL] = req.body.longURL;
  res.redirect(`/urls/${newShortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});


app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});