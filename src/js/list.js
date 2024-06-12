const host = 'http://127.0.0.1'

document.addEventListener('DOMContentLoaded', function () {
	for(let i = 0; i < 2; i++)
		addCardItem('https://plus.unsplash.com/premium_photo-1669865741911-fdc00c7c3859?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MXx8RWFydGhxdWFrZSUyMHxlbnwwfHx8fDE3MTgxNjMyMDJ8MA&ixlib=rb-4.0.3&q=80&w=1080', "충격적인 고양이 뉴스다냥!!", "qrqrqrqr");

	for(let i = 0; i < 10; i++)
		addListItem('https://plus.unsplash.com/premium_photo-1669865741911-fdc00c7c3859?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MXx8RWFydGhxdWFrZSUyMHxlbnwwfHx8fDE3MTgxNjMyMDJ8MA&ixlib=rb-4.0.3&q=80&w=1080', "충격적인 고양이 뉴스다냥!!", "2024.04.05 24:24:53", "qrqrqrqr");

	const more = document.getElementById('more');
	more.addEventListener('click', function () {
		more.innerText = '로딩중...';
	});
});

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
		window.history.replaceState(null, '', '/article/' + id);
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
		window.history.replaceState(null, '', '/article/' + id);
	});

	document.getElementById('popularNews').appendChild(card);
}