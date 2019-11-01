const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');
const {getUserByEmail,
  generateRandomString,
  urlsForUser,
  doUserPasswordMatch,
  isLoggedIn,
  containsEmtpyFields,
  encryptPassword,
  isUrlInDB} = require('./helpers');

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine','ejs');
app.use(methodOverride('_method'));

app.use(cookieSession({
  name: 'session',
  keys: ['userId'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

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

app.get('/', (req, res) => {
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  const userUrlDB = urlsForUser(urlDatabase, req.session.userId);
  let templateVars = {
    urls: urlDatabase,
    userUrl: userUrlDB,
    user: users[req.session.userId],
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.session.userId],
  };
  if (isLoggedIn(users, req)) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

app.delete("/urls/:shortURL/delete", (req, res) => {
  const userUrlDB = urlsForUser(urlDatabase, req.session.userId);
  
  if (userUrlDB.includes(req.params.shortURL)) {
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect('/urls');
});

app.get('/login', (req,res) => {
  
  if (isLoggedIn(users, req)) {
    res.redirect('/urls');
  } else {
    let templateVars = {
      user: users[req.session.userId],
    };
    res.render("login", templateVars);
  }

});

app.post('/login', (req,res) => {

  if (containsEmtpyFields(req)) {
    res.status(403).send("");
  }
  if (getUserByEmail(users, req.body.email)) {

    const userId = getUserByEmail(users, req.body.email);
    if (doUserPasswordMatch(users, userId, req.body.email, req.body.password)) {

      req.session.userId = userId;
      res.redirect('/urls');
    } else {
      res.status(403).send("");
    }
  } else {
    res.status(403).send("");
  }

});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.get('/register' ,(req, res) => {
  
  if (isLoggedIn(users, req)) {
    res.redirect('/urls');
  } else {
    let templateVars = {
      user: users[req.session.userId],
    };
    res.render("register", templateVars);
  }
  
});

app.post('/register', (req,res) => {
   
  if (isLoggedIn(users, req)) {
    res.redirect('/urls');
  }

  if (containsEmtpyFields(req)) {
    res.status(400).send("");
  }

  if (getUserByEmail(users, req.body.email)) {
    res.status(403).send("");
  }
  
  let newUserId = generateRandomString();

  const hashedPassword = encryptPassword(req.body.password);

  users[newUserId] = {
    id : newUserId,
    email : req.body.email,
    password : hashedPassword,
  };

  req.session.userId = newUserId;
  res.redirect('/urls');
});

app.get('/urls/:shortURL', (req, res) => {
  
  // Check if shortUrl exist in urlDatabase
  if (!isUrlInDB(urlDatabase, req)) {
    // TODO: send error msg saying: "shortUrl does not exist..."
    res.redirect('/urls');
  } else {

    let templateVars = {shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.session.userId]};
    
    const userUrlDB = urlsForUser(urlDatabase, req.session.userId);
    
    if (isLoggedIn(users, req) && userUrlDB.includes(req.params.shortURL)) {
      res.render('urls_show', templateVars);
    } else {
      // TODO: send error msg saying "This is not one of your urls/cannot accesss"
      res.redirect('/urls');
    }
  }

});

app.put('/urls/:id', (req,res) => {
  const userUrlDB = urlsForUser(urlDatabase, req.session.userId);
  
  // .includes should be part of database function
  if (userUrlDB.includes(req.params.id)) {
    urlDatabase[req.params.id].longURL = req.body.longURL;
  } //  TODO else throw error ... 
  
  res.redirect('/urls');
});

app.put('/urls', (req, res) => {
  let newShortURL = generateRandomString();
  
  // database Function - newURL
  urlDatabase[newShortURL] = {};
  urlDatabase[newShortURL].userID = req.session.userId;
  urlDatabase[newShortURL].longURL = req.body.longURL;
  
  res.redirect(`/urls/${newShortURL}`);
});

app.get("/u/:shortURL", (req, res) => {

  // Check if shortUrl exist in urlDatabase
  if (!isUrlInDB(urlDatabase, req)) {
    // TODO: send error msg saying: "shortUrl does not exist..."
    res.redirect('/urls');
  } else {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  }

});

// app.use('/:credType(register|login)', function(err, req, res, next) {
//   const templateVars = { urls: [], user: null, newUser: req.params.credType === 'register', error: err };
//   res.status(403);
//   res.render('login', templateVars);
// });

// app.use((err, req, res, next) => {
//   const user = isLoggedIn(req);
//   const templateVars = { urls: getOwnUrls(user.id, true), user, error: err };
//   res.status(400);
//   res.render('urls_index', templateVars);
// });

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});