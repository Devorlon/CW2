const bcrypt = require('bcrypt');
const UserDAO = require('../src/UserDAO.js');
const jwt = require("jsonwebtoken");

exports.verify = function(req, res, next) {
    let accessToken = req.cookies.jwt;
    let payload;

    if (!accessToken) {
        return res.redirect("/login");
    }

    try {
        payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        req.headers.email = payload.email;
        next();
    }
    catch (err) {
        res.status(401).send();
    }
};


exports.login = function(req, res, next) {
	let email = req.body.email;
	let password = req.body.password;
	
	UserDAO.lookup(email).then((user) => {
		if (!user) {
			console.log("User", email, "not found");
			return res.redirect("/registration?email=" + encodeURIComponent(email));
		}

		// Compare provided password with stored password
		bcrypt.compare(password, user.password, function (err, result) {
			if (result) {				
				let payload = { email: user.email };
				let accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET);
				res.cookie("jwt", accessToken)
				req.headers.email = user.email;

				next();
			}
			else {
				return res.status(403).send();
			}
		});
	})
	.catch((err) => {
		console.error("Error:", err);
		res.status(401).send("Error looking up user");
	});
};