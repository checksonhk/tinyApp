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
  isUrlInDB,
  addUrl,
  logVisit} = require('./helpers');

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
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW", dateCreated: "", visits: 3, uniqueVisits : [{visitorId: 123832, timeStamp: ""}]},
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW", dateCreated: "", visits: 5, uniqueVisits : [] }
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
    error: null
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.session.userId],
    error: null,
  };
  if (isLoggedIn(users, req)) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

app.delete("/urls/:shortURL/delete", (req, res) => {
  const userUrlDB = urlsForUser(urlDatabase, req.session.userId);
  
  if (isUrlInDB(userUrlDB, req)) {
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect('/urls');
});

app.get('/login', (req,res) => {
  
  if (isLoggedIn(users, req)) {
    res.redirect('/urls');
  } else {
    // Updates Session
    let templateVars = {
      user: users[req.session.userId],
      error: null,
    };
    res.render("login", templateVars);
  }

});

app.post('/login', (req,res) => {

  if (containsEmtpyFields(req)) {
    throw Error("Email and/or Password cannot be blank!");
  }
  if (getUserByEmail(users, req.body.email)) {

    const userId = getUserByEmail(users, req.body.email);
    if (doUserPasswordMatch(users, userId, req.body.email, req.body.password)) {

      req.session.userId = userId;
      res.redirect('/urls');
    } else {
      throw Error("User and Password don't match our records...Try again");
    }
  } else {
    throw Error("Cannot find user in the database..Try again");
  }

});

app.post('/logout', (req, res) => {
  
  // Deletes Session
  req.session = null;
  res.redirect('/urls');
});

app.get('/register' ,(req, res) => {
  
  if (isLoggedIn(users, req)) {
    res.redirect('/urls');
  } else {
    let templateVars = {
      user: users[req.session.userId],
      error: null,
    };
    res.render("register", templateVars);
  }
  
});

app.post('/register', (req,res) => {
   
  if (isLoggedIn(users, req)) {
    res.redirect('/urls');
  }

  if (containsEmtpyFields(req)) {
    throw Error("Email and/or Password cannot be blank!");
  }

  if (getUserByEmail(users, req.body.email)) {
    throw Error("Cannot find user in Database... Try again");
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

    let templateVars = {shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.session.userId], visits: urlDatabase[req.params.shortURL].visits, uniqueVisits: urlDatabase[req.params.shortURL].uniqueVisits, error: null};

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
  if (isUrlInDB(userUrlDB, req)) {
    // Update Url
    urlDatabase[req.params.id].longURL = req.body.longURL;
  } //  TODO else throw error ...
  res.redirect('/urls');
});

app.put('/urls', (req, res) => {
  let newShortURL = generateRandomString();
  
  // database Function - newURL
  addUrl(urlDatabase, newShortURL, req)
  
  res.redirect(`/urls/${newShortURL}`);
});

app.get("/u/:shortURL", (req, res) => {

  // Check if shortUrl exist in urlDatabase
  if (!isUrlInDB(urlDatabase, req)) {
    // TODO: send error msg saying: "shortUrl does not exist..."
    res.redirect('/urls');
  } else {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    let visitorId;

    // Check if user has userId
    if (isLoggedIn(users, req)) {
      visitorId = req.session.userId;
    } else {
      visitorId = generateRandomString();
    }
    logVisit(urlDatabase, req, visitorId);
    // Adds Visitor Count;
    urlDatabase[req.params.shortURL].visits += 1;
    res.redirect(longURL);
  }

});

// Handles Login/Register Errors
app.use('/:credType(register|login)', function(err, req, res, next) {
  const templateVars = {
    user: users[req.session.userId],
    error: err,
  };
  res.status(403);
  res.render('login', templateVars);
});

// Handles other Errors
app.use((err, req, res, next) => {
  const user = isLoggedIn(users,req);
  
  const userUrlDB = urlsForUser(urlDatabase, req.session.userId);
  const templateVars = {
    urls: urlDatabase,
    userUrl: userUrlDB,
    user: users[req.session.userId],
    error: err
  };

  res.status(400);
  res.render('urls_index', templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});