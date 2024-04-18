const UserDAO = require('../src/UserDAO');
const ListingDAO = require('../src/ListingDAO');

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
		res.status(401).send('no user or password')
		return;
	}

	UserDAO.lookup(user, function(err, u) {
		if (u) {
			res.send(401, "User exists:", user);
			return;
		}

		UserDAO.create(user, password);
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
	res.render('createListing');
}

exports.postListing = function (req, res) {
	const pictures = req.files.map(file => file.path.replace(/^public\//, ''));
	const title = req.body.title;
	const location = req.body.location;
	const expireDate = req.body.expireDate;
	const amount = req.body.amount;
	const description = req.body.description;

	console.log(pictures);

	if (!title || !location) {
		res.status(401).send('no title or location')
		return;
	}

	ListingDAO.create(pictures, title, location, expireDate, amount, description);
	console.log("Created listing", title);
	res.redirect('/');
}

exports.showListings = function (req, res) {
	ListingDAO.getAllListings().then(filteredListings => {
		if (filteredListings.length === 0) {
			res.status(401).send('No listing found');
		} 
		else {
			console.log(filteredListings);
			res.render('listing', { listings: filteredListings });
		}
	})
	.catch(error => {
		console.error('Error fetching listings:', error);
		res.status(500).send('Error fetching listings');
	});
};


exports.settings = function (req, res) {
	
}

// setTimeout(waitPrint, 1000);
// function waitPrint() {
	
// }