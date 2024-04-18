const bcrypt = require('bcrypt');
const userModel = require('../src/UserDAO.js');
const jwt = require("jsonwebtoken");

exports.verify = function(req, res, next) {
	let accessToken = req.cookies.jwt;
	let payload;

	if (!accessToken) {
		return res.redirect("/login");
	}

	try {
		payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
		next();
	}
	catch (err) {
		res.status(401).send();
	}
};

exports.login = function(req, res, next) {
	let email = req.body.email;
	let password = req.body.password;

	userModel.lookup(email, function (err, user) {
		if (err) {
			console.log("error looking up user", err);
			return res.status(401).send();
		}

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

				next();
			}
			else {
				return res.status(403).send();
			}
		});
	});
};