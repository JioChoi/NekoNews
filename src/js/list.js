const loadSize = 20;

let listPos = 0;
let listEnd = false;

document.addEventListener('DOMContentLoaded', function () {
	loadArticles(listPos, loadSize);
	loadPopularArticles();

	const more = document.getElementById('more');
	more.addEventListener('click', function () {
		more.innerText = '로딩중...';
	});
});

async function loadPopularArticles() {
	let response = await fetch(host + '/api/popular', {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json'
		}
	});
	response = await response.json();

	for (let i = 0; i < response.length; i++) {
		addCardItem(response[i].image, response[i].title, response[i].id);
	}
}

async function loadArticles(start, size) {
	let response = await fetch(host + '/api/articles?' + new URLSearchParams({ start: start, size: size }), {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json'
		}
	});
	response = await response.json();

	// Change list position
	listPos += response.length;
	if (response.length < size) {
		listEnd = true;
	}

	const today = Date.now();
	
	for (let i = 0; i < response.length; i++) {
		// Format time
		const date = Number(response[i].time);
		let time = '';

		if (today - date < 1000 * 60 * 60 * 24) {
			if (today - date < 1000) {
				time = Math.floor((today - date) / 1000) + '초 전';
			}
			else if (today - date < 1000 * 60 * 60) {
				time = Math.floor((today - date) / (1000 * 60)) + '분 전';
			}
			else {
				time = Math.floor((today - date) / (1000 * 60 * 60)) + '시간 전';
			}
		}
		else {
			time = date.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
		}

		addListItem(response[i].image, response[i].title, time, response[i].id);
	}
}

function addListItem(img, title, date, id) {
	const article = document.createElement('div');
	article.classList.add('article');

	const articleImg = document.createElement('img');
	articleImg.src = img;

	const info = document.createElement('div');
	info.classList.add('info');

	const articleTitle = document.createElement('h2');
	articleTitle.textContent = title;

	const articleDate = document.createElement('h3');
	articleDate.textContent = date;

	info.appendChild(articleTitle);
	info.appendChild(articleDate);

	article.appendChild(articleImg);
	article.appendChild(info);

	article.addEventListener('click', function () {
		openPage(id);
	});

	document.getElementById('recentNews').appendChild(article);
}

function addCardItem(img, title, id) {
	const card = document.createElement('div');
	card.classList.add('card');

	const cardImg = document.createElement('img');
	cardImg.src = img;

	const cardTitle = document.createElement('h2');
	cardTitle.textContent = title;

	card.appendChild(cardImg);
	card.appendChild(cardTitle);

	card.addEventListener('click', function () {
		openPage(id);
	});

	document.getElementById('popularNews').appendChild(card);
}