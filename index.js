const express = require('express');
const cookieParser = require('cookie-parser');
const mustacheExpress = require('mustache-express');

const bodyParser = require('body-parser');
const path = require('path');
const public = path.join(__dirname,'public');
const router = require('./routes/tspnRoutes');
const PORT = process.env.PORT || 3000;

require('dotenv').config();

const app = express();

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(public));
app.use('/css', express.static(__dirname +'/css/styles.css'));
app.use('/', router);

app.engine('mustache', mustacheExpress());

app.set('view engine', 'mustache');
app.set('views', path.join(__dirname, 'public', 'views'));

app.listen(PORT, () => {
	console.log(`Server is running on port http://localhost:${PORT}`);
});