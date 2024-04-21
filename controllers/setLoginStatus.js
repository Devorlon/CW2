const jwt = require("jsonwebtoken");

const admins = [
	"admin@example.com",
];

const setLoginStatus = function(req, res, next) {
	if (req.cookies.jwt) {
		res.locals.user = true;
	} 
	else {
		res.locals.user = false;
	}

	try {
		if (admins.includes(jwt.verify(req.cookies.jwt, process.env.ACCESS_TOKEN_SECRET).email)) {
			res.locals.admin = true;
		}
	} 
	catch {
		res.locals.admin = false;
	}

	next();
}

module.exports = setLoginStatus;