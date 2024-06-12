const PORT = process.env.PORT || 80;
const express = require('express');
const fs = require('fs');

const app = express();

app.use('/css', express.static(__dirname + '/src/css'));
app.use('/js', express.static(__dirname + '/src/js'));
app.use('/assets', express.static(__dirname + '/src/assets'));

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/src/index.html');
});

app.get('/article/:id', (req, res) => {
	fs.readFile(__dirname + '/src/index.html', 'utf8', (err, data) => {
		if(err) {
			res.status(500).send('Internal Server Error');
			return;
		}

		data = data.replaceAll('/css', '../css');
		data = data.replaceAll('/js', '../js');
		data = data.replaceAll('/assets', '../assets');

		res.send(data);
	});
});

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});