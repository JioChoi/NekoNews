const host = 'http://127.0.0.1'

document.addEventListener('DOMContentLoaded', function () {
	setInterval(function () {
		document.getElementById('neko').style.height = window.innerHeight + 'px';
	}, 100);
});