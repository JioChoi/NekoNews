let typing = false;

const msgDefault = [
	"릴리가 쓴 기사들 재밌게 봐달라냥!",
	"냥냥! 릴리는 기사 쓰는게 좋다냥!",
	"오늘은 날씨가 엄청 좋다냥! 햇살 아래에서 낮잠 자고 싶다냥!",
	"참치캔 냄새가 솔솔 난다냥... 릴리 배고프다냥...",
	"털 엉키는 건 너무 싫다냥! 빗질 좀 해줘야겠다냥!",
	"고양이 밥은 역시 참치캔이 최고다냥!!!",
	"냥냥!! 릴리 오늘 엄청 예쁘다냥! 자랑스럽다냥!",
	"냥냥!! 릴리는 쥐 잡는 것도 잘한다냥! 멋지다냥!",
	"냥냥! 릴리 오늘 기사 쓰는거 잊지 않았다냥!! 뿌듯하다냥!",
	"고양이 장난감은 역시 깃털 장난감이 최고다냥! 릴리 엄청 좋아한다냥!",
	"오늘은 낮잠 자고 싶다냥... 릴리 졸리다냥...",
	"냥냥!! 릴리 오늘 기분 최고다냥! 신난다냥!",
	"고양이들은 엄청 똑똑하다냥!! 릴리도 엄청 똑똑하다냥!",
	"릴리 오늘 힘들다냥... 푹 쉬어야겠다냥...",
	"냥냥!! 릴리는 고양이 기자로서 최선을 다할 거다냥!!",
]

const msg10 = [
	"오늘도 릴리를 보러 와 줘서 고맙다냥!!",
	"냥냥!! 또 만났다냥!!",
	"냥냥! 오늘도 릴리를 찾아와줘서 고맙다냥!",
	"냥냥! 릴리는 방문자 좋아한다냥!!",
	"냥냥!! 릴리는 오늘도 기사 쓰는 중이다냥!!",
	"또 만나서 반갑다냥!!",
	"냥냥!! 릴리는 오늘도 열심히 일하는 중이다냥!!",
	"냥냥! 오늘도 릴리를 찾아와줘서 고맙다냥!",
];

const msg50 = [
	"냥냥!! 릴리는 방문자가 엄청 많아서 기뻐한다냥!!",
	"냥냥!! 방문자가 많아서 릴리는 기분이 좋다냥!!",
];

function loadingFinished() {
	let location = window.location.pathname;
	const visitCount = getVisitCount();

	animateCat();

	if (location == '/') {
		if (visitCount == 1) {
			show_msg_a("안녕하다냥! 네코뉴스의 고양이 기자, 릴리라고 한다냥!");	
		}
		else {
			show_msg_a(msgDefault[Math.floor(Math.random() * msgDefault.length)]);
		}
	}
}

window.addEventListener('load', function () {
	let location = window.location.pathname;

	if (location != '/') {
		showPage(location.split('/')[2]);
		animateCat();
	}

	this.document.getElementById('header').querySelector('img').addEventListener('click', function () {
		window.location.href = '/';
	});
});

function show_msg_a(text) {
	document.getElementById('msg_a').classList.add('shown');

	setTimeout(() => {
		typeWriter('msg_a_text', text, 50);
	}, 300);
}

function hide_msg_a() {
	typing = false;
	document.getElementById('msg_a_text').innerHTML = '';
	document.getElementById('msg_a').classList.remove('shown');
}

function show_msg_b() {
	document.getElementById('msg_b').classList.add('shown');
}

function typeWriter(id, text, delay) {
	typing = true;
	let i = 0;
	let speed = delay;
	let element = document.getElementById(id);
	element.innerHTML = '';

	function type() {
		if (!typing) {
			return;
		}
		if (i < text.length) {
			element.innerHTML += text.charAt(i);
			i++;

			if (text.charAt(i) == ' ') {
				element.innerHTML += text.charAt(i);
				i++;
			}

			setTimeout(type, speed);
		}
		else {
			typing = false;
		}
	}

	type();
}

function getVisitCount() {
	let count = localStorage.getItem('visitCount');

	if (count === null) {
		count = 0;
	}

	count++;
	localStorage.setItem('visitCount', count);

	return count;
}

function openPage(id) {
	window.location.href = '/article/' + id;
}

function showPage(id) {
	document.body.classList.add('disableScroll');
	show_msg_b();
}