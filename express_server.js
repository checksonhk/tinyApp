const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine','ejs');
app.use(cookieParser());

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

const users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "me@me.com",
    password: "123"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

// Returns user object if there is matc with the email
const findUserByEmail = function(email) {
  const usersArr = Object.values(users);
  
  for (const user of usersArr) {
    if (user.email === email) {
      return user;
    }
  }
  return false;
};

const doUserPasswordMatch = function(userId , email, password) {
  return (users[userId].email === email && users[userId].password === password) ? true : false;
};

// Returns Array of the Keys of Url by the specified UserID
const urlsForUser = function(userId) {
  return Object.keys(urlDatabase).filter( url => (urlDatabase[url].userID === userId));
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
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.cookies.userId],
  };
  if (users[req.cookies.userId]) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  // console.log(req.params.shortURL);
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.get('/login', (req,res) => {
  let templateVars = {
    user: users[req.cookies.userId],
  };
  res.render("login", templateVars);
});

app.post('/login', (req,res) => {
  if (req.body.email.length === 0 || req.body.password.length === 0) {
    res.status(403).send("");
  }
  if (findUserByEmail(req.body.email)) {
    const userId = findUserByEmail(req.body.email).id;
    if (doUserPasswordMatch(userId, req.body.email, req.body.password)) {
      res.cookie('userId', userId);
      res.redirect('/urls');
    } else {
      res.status(403).send("");
      console.log('hi1');
      // res.redirect('/login');
    }
  } else {
    res.status(403).send("");
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('userId');
  res.redirect('/urls');
});

app.get('/register' ,(req, res) => {
  let templateVars = {
    user: users[req.cookies.userId],
  };
  res.render("register", templateVars);
});

app.post('/register', (req,res) => {
  
  if (req.body.email.length === 0 || req.body.password.length === 0) {
    res.send(400);
    res.redirect('/register');
  }

  if (findUserByEmail(req.body.email)) {
    res.send(400);
    res.redirect('/resgiter');
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
  let temp = {shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies.userId]};
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