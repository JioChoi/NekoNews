let host = 'https://nekonews.onrender.com';
//host = 'http://127.0.0.1';

document.addEventListener('DOMContentLoaded', function () {
	window.scrollTo(0,0); 
	document.body.style.height = window.innerHeight + 'px';

	if (document.getElementById('loading') != null) {
		document.getElementById('loading').addEventListener('click', function (e) {
			e.stopPropagation();
		});
	}
});

function finishLoading() {
	if (document.getElementById('loading') != null) {
		document.getElementById('loading').style.display = 'none';
	}
}

function waitForAll(...ps) {
	return Promise.all(ps.map(p => p.catch(e => e)));
}

function animateCat() {
	document.getElementById('cat').style.animation = 'talk 0.15s linear 3';
}