/* DOT ENV */
const dotenv = require('dotenv');
dotenv.config();

/* Importing Modules */
const PORT = process.env.PORT || 80;
const express = require('express');
const pg = require('pg');

const app = express();

app.use('/css', express.static(__dirname + '/src/css'));
app.use('/js', express.static(__dirname + '/src/js'));
app.use('/assets', express.static(__dirname + '/src/assets'));

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/src/index.html');
});

app.get('/article/:id', (req, res) => {
	res.sendFile(__dirname + '/src/article.html');
});

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});

/* DATABASE CONNECTION */
const pool = new pg.Pool({
	user: "avnadmin",
	password: process.env.DB_PASS,
	host: process.env.DB_HOST,
	port: 17890,
	database: "defaultdb",

	ssl: {
		require: true,
		rejectUnauthorized: false
    }
});

pool.connect((err, client, release) => {
	if (err) {
		return console.error('Error acquiring client', err.stack);
	}

	console.log('Connected to database');
});