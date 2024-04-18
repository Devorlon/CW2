const jwt = require("jsonwebtoken");

const setLoginStatus = function(req, res, next) {
    if (req.cookies.jwt) {
        res.locals.user = true;
    } 
    else {
        res.locals.user = false;
    }

    next();
}

module.exports = setLoginStatus;
