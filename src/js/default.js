const host = 'https://nekonews.onrender.com'

document.addEventListener('DOMContentLoaded', function () {
	document.getElementById('loading').addEventListener('click', function (e) {
		e.stopPropagation();
	});
});

function finishLoading() {
	document.getElementById('loading').style.display = 'none';
}

function waitForAll(...ps) {
	return Promise.all(ps.map(p => p.catch(e => e)));
}

function animateCat() {
	document.getElementById('cat').style.animation = 'talk 0.15s linear 3';
}