const express = require('express');
const router = express.Router();
const controller = require('../controllers/tspnController');
const setLoginStatus = require('../controllers/setLoginStatus');
const {login} = require('../auth/auth')
const {verify} = require('../auth/auth')

router.use(setLoginStatus);

router.get('/', controller.landingPage);
router.get('/about', controller.about);
router.get('/search', verify, controller.search);

router.get('/messages', verify, controller.messages);
router.get('/create/listing', verify, controller.createListing);
router.get('/view/listings', verify, controller.showListings);
router.get('/settings', verify, controller.settings);

router.get('/login', controller.showLogin);
router.get("/logout", controller.logout);
router.get('/registration', controller.showReg);

router.post('/signin', login, controller.postLogin);
router.post('/register', controller.postNewUser);

router.use(function(req, res) {
	res.status(404);
	res.type('text/plain');
	res.send('404 Not found.');
});

router.use(function(err, req, res, next) {
	res.status(500);
	res.type('text/plain');
	res.send('Internal Server Error.');
});

module.exports = router;