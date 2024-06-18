const loadSize = 20;

let listPos = 0;
let listEnd = false;

document.addEventListener('DOMContentLoaded', function () {
	loadArticles(listPos, loadSize);

	for(let i = 0; i < 2; i++)
		addCardItem('https://plus.unsplash.com/premium_photo-1669865741911-fdc00c7c3859?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MXx8RWFydGhxdWFrZSUyMHxlbnwwfHx8fDE3MTgxNjMyMDJ8MA&ixlib=rb-4.0.3&q=80&w=1080', "충격적인 고양이 뉴스다냥!!", "qrqrqrqr");

	const more = document.getElementById('more');
	more.addEventListener('click', function () {
		more.innerText = '로딩중...';
	});
});

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

	const today = new Date();
	
	for (let i = 0; i < response.length; i++) {
		// Format time
		const date = new Date(Number(response[i].time));
		let time = '';

		// If the article is posted today, show how long ago it was posted
		if (today.getDate() == date.getDate()) {
			if (today.getHours() == date.getHours()) {
				if (today.getMinutes() == date.getMinutes()) {
					time = today.getSeconds() - date.getSeconds() + '초 전';
				}
				else {
					time = today.getMinutes() - date.getMinutes() + '분 전';
				}
			}
			else {
				time = today.getHours() - date.getHours() + '시간 전';
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