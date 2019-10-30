// Returns user object if there is matc with the email
const getUserByEmail = function(email, database) {
  const usersArr = Object.values(database);
  
  for (const user of usersArr) {
    if (user.email === email) {
      return user;
    }
  }
  return false;
};

module.exports = {
  getUserByEmail
};