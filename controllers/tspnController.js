const DB = require('../src/DB');
const Product = require('../src/Product');
const dao = require('../src/UserDAO');

exports.landingPage = function (req, res) {
    res.render("index");
}

exports.showLogin = function (req, res) {
    res.render("user/login");
}

exports.postLogin = function (req, res) {
	res.redirect("/");
}

exports.showReg = function (req, res) {
    res.render('user/register', { email: req.query.email });
}

exports.postNewUser = function (req, res) {
    const user = req.body.email;
	const password = req.body.password;

	if (!user || !password) {
		res.status(401).send('no user or no password')
		return;
	}

	dao.lookup(user, function(err, u) {
		if (u) {
			res.send(401, "User exists:", user);
			return;
		}

		dao.create(user, password);
		console.log("Register user", user, "password", password);
		res.redirect('/login');
	})
}

exports.logout = function (req, res) {
	res
	.clearCookie("jwt")
	.status(200)
	.redirect("/");
}

exports.search = function (req, res) {
    const searchQuery = req.query.q;

	// todo
}

exports.about = function (req, res) {
	
}

exports.messages = function (req, res) {
	
}

exports.createListing = function (req, res) {
	
}

exports.showListings = function (req, res) {
	
}

exports.settings = function (req, res) {
	
}

// setTimeout(waitPrint, 1000);
// function waitPrint() {
	
// }