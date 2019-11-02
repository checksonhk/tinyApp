const bcrypt = require('bcrypt');

// Returns user object if there is matc with the email
const getUserByEmail = function(database, email) {
  const usersArr = Object.values(database);
  
  for (const user of usersArr) {
    if (user.email === email) {
      return user.id;
    }
  }
  return undefined;
};

const doUserPasswordMatch = function(database, userId , email, password) {
  return (database[userId].email === email && bcrypt.compareSync(password, database[userId].password)) ? true : false;
};

// Returns Array of the Keys of Url by the specified UserID
const urlsForUser = function(database, userId) {
  return Object.keys(database).filter(url => (database[url].userID === userId));
};

// Returns 6 character long random string
const generateRandomString = function() {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 6; i > 0; -- i) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

const isLoggedIn = function(database, req) {
  return database[req.session.userId] ? true : undefined;
};

const containsEmtpyFields = function(req) {
  return (req.body.email.length === 0 || req.body.password.length === 0) ? true : false;
};

const encryptPassword = function(password) {
  return bcrypt.hashSync(password, 10);
};

const isUrlInDB = function(database, req) {
  return Object.prototype.hasOwnProperty.call(database, req.params.shortURL) || database.includes(req.params.shortURL);
};

const addUrl = function(database, url, req) {
  // database Function - newURL
  database[url] = {};
  database[url].userID = req.session.userId;
  database[url].longURL = req.body.longURL;
  database[url].dateCreated = new Date();
  database[url].visits = 0;
  database[url].uniqueVisits = [];
};

const logVisit = function(database, req, visitorId) {
  database[req.params.shortURL].uniqueVisits.push({'visitorId': visitorId, 'timeStamp': new Date()});
};

module.exports = {
  getUserByEmail,
  doUserPasswordMatch,
  urlsForUser,
  generateRandomString,
  isLoggedIn,
  containsEmtpyFields,
  encryptPassword,
  isUrlInDB,
  addUrl,
  logVisit
};