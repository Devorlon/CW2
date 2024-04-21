const express = require('express');
const router = express.Router();
const controller = require('../controllers/tspnController');
const setLoginStatus = require('../controllers/setLoginStatus');
const {login} = require('../auth/auth')
const {verify} = require('../auth/auth')

const multer = require('multer');
const upload = multer({ dest: './public/listings/images/' });

router.use(setLoginStatus);

// Regular Pages
router.get('/about', controller.about);
router.get('/welcome', controller.welcome);
router.get('/login', controller.showLogin);
router.get("/logout", controller.logout);

// Auth Required Pages
router.get('/', verify, controller.landingPage);
router.get('/search', verify, controller.search);
router.get('/admin', verify, controller.admin);
router.get('/messages', verify, controller.showMessages);
router.get('/listings', verify, controller.showListings);

// Unique Catch-all Pages
router.get('/view/chat/:chatID', verify, controller.showChat);
router.get('/admin/:adminPage', verify, controller.adminPage);

// Create Object Pages
router.get('/registration', controller.showReg);
router.get('/create/listing', verify, controller.createListing);

// Recive Post Request
router.post('/signin', login, controller.postLogin);
router.post('/post/listing', verify, upload.array('images', 3), controller.postListing);
router.post('/post/chat', verify, controller.startChat);
router.post('/post/message/:chatID', verify, controller.postMessage);
router.post('/remove/listing', verify, controller.removeListing);
router.post('/remove/chat', verify, controller.removeChat);
router.post('/remove/message', verify, controller.removeMessage);
router.post('/remove/user', verify, controller.removeUser);
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