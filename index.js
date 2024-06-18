/* DOT ENV */
const dotenv = require('dotenv');
dotenv.config();

/* Importing Modules */
const PORT = process.env.PORT || 80;
const express = require('express');
const pg = require('pg');
const axios = require('axios');
const fs = require('fs');
const {
	GoogleGenerativeAI,
	HarmCategory,
	HarmBlockThreshold,
} = require("@google/generative-ai");
const { JSDOM } = require('jsdom');
const cors = require('cors');

/* Express */
const app = express();
app.use('/css', express.static(__dirname + '/src/css'));
app.use('/js', express.static(__dirname + '/src/js'));
app.use('/assets', express.static(__dirname + '/src/assets'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors(
	{
		origin: ['https://nekonews.onrender.com', 'http://127.0.0.1', 'https://nekonews.cc'],
		optionsSuccessStatus: 200
	}
));

/* Client */
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/src/index.html');
});

app.get('/article/:id', async (req, res) => {
	// Check if id is valid
	let id = req.params.id;
	if (!id || id.length != 8) {
		res.redirect('/');
		return;
	}

	// Get article from database
	let query = "SELECT * FROM nekonews.articles WHERE id = $1";
	let response = await queryDB(query, [id]);

	if (response.rows.length == 0) {
		res.redirect('/');
		return;
	}

	let article = response.rows[0];

	let data = fs.readFileSync(__dirname + '/src/article.html', 'utf8');
	data = data.replaceAll("${title}", article.title);
	data = data.replaceAll("${time}", new Date(Number(article.time)).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }));
	data = data.replaceAll("${image}", article.image);

	let content = "";
	article.content = article.content.split("\n");
	for (let i = 0; i < article.content.length; i++) {
		if (article.content[i].length > 0) {
			content += `<p>${article.content[i]}</p>`;
		}
	}

	data = data.replaceAll("${content}", content);

	res.send(data);

	// Add view count
	query = "UPDATE nekonews.articles SET view = view + 1 WHERE id = $1";
	await queryDB(query, [id]);
});

/* API */
app.get('/api/articles', async (req, res) => {
	let start = req.query.start;
	let size = req.query.size;

	if (!(start && size) || isNaN(start) || isNaN(size)) {
		res.status(400).send("Bad Request");
		return;
	}

	let query = "SELECT id, title, time, image FROM nekonews.articles ORDER BY time DESC LIMIT $1 OFFSET $2";
	let response = await queryDB(query, [size, start]);

	res.json(response.rows);
});

app.get('/api/popular', async (req, res) => {
	// Popular of the day
	let mindate = Date.now() - 1000 * 60 * 60 * 24;

	let query = "SELECT id, title, time, image FROM nekonews.articles WHERE time > $1 ORDER BY view DESC LIMIT 2";
	let response = await queryDB(query, [mindate]);

	res.json(response.rows);
});

app.listen(PORT, () => {
	if (process.argv.length > 2 && process.argv[2] == "dev") {
		console.log("Running in development mode...");
	}
	else {
		startAutomation();
	}

	console.log(`Server is running on port ${PORT}`);
});

/* DATABASE CONNECTION */
const client = new pg.Pool({
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

client.connect(err => {
	if (err) {
		console.error('connection error', err.stack);
	} else {
		console.log('connected');
	}
});

/* DATABASE FUNCTIONS */
function startAutomation() {
	console.log("Starting Automation...");
	automate();
}

async function automate() {
	if (news.length == 0) {
		console.log("Used all news! Getting new news!");
		await getAllNews();
		console.log(`Found ${news.length} articles!`);	
	}

	const item = news.shift();
	
	console.log(`Target: ${item.title}`);
	let data = await getNewsArticle(item.url);

	console.log("Generating article...");
	let [title, article] = await generateArticle(data);
	if (article == null) {
		console.log("Failed to generate article!");
		await sleep(1000 * 60 * 2);
		automate();
		return;
	}

	console.log("Generated article!");
	
	console.log("Generating image...");
	let img = await generateArticleImage(data);
	if (img == null) {
		console.log("Failed to generate image!");
		await sleep(1000 * 60 * 2);
		automate();
		return;
	}

	console.log("Generated image!");

	let id = Math.floor(Date.now() / 1000).toString(16);
	id = id.substring(6, 8) + id.substring(0, 6);

	let query = "INSERT INTO nekonews.articles (id, title, content, image, time) VALUES ($1, $2, $3, $4, $5)";

	console.log("Inserting article into database...");
	await queryDB(query, [id, title, article, img, Date.now()]);
	console.log("Inserted article into database!");

	await sleep(1000 * 60 * 2);
	automate();
}

async function queryDB(query, params) {
	try {
		let response = await client.query(query, params);
		return response;
	} catch (e) {
		console.log("Error in queryDB()");
		console.log(e);
	}
}

/* NEWS FUNCTIONS */
let news = [];
const cp = [
	11, 45, 190, 15, 8, 200, 38, 33, 17, 49,
	//7, 5, 129, 90, 19, 3, 139, 6,
	23, 396, 21, 2, 318,
	310, 327, 98, 60, 317, 73
]

async function getAllNews() {
	news = [];

	for (let i = 0; i < cp.length; i++) {
		await getNews(cp[i], 10, 10);
	}

	// If failed to get news...
	if (news.length == 0) {
		console.log("Failed to get news! Retrying after 10 minutes...");
		await sleep(600000);
		console.log("Retrying now!");
		await getAllNews();
		return;
	}

	news = await news.sort((a, b) => {
		return a.pv - b.pv;
	}).reverse();

	news = news.slice(0, 5);
}

async function getNews(id, size, time) {
	let data = JSON.stringify({
		"operationName": null,
		"variables": {
			"media_home_tab_news_all_8Key": "media_home_news_all",
			"media_home_tab_news_all_8Params": {
				"cpId": id.toString(),
				"size": size,
				"sort": "createDt:desc",
				"searchId": ""
			}
		},
		"query": "query ($media_home_tab_news_all_8Key: String!, $media_home_tab_news_all_8Params: Object) {\n  media_home_tab_news_all_8: page(charonKey: $media_home_tab_news_all_8Key, charonParams: $media_home_tab_news_all_8Params) {\n      items {\n      title\n      thumbnail\n      pcLink\n      meta\n      __typename\n    }\n    __typename\n  }\n}\n"
	});
	
	let config = {
		method: 'post',
		maxBodyLength: Infinity,
		url: 'https://hades-cerberus.v.kakao.com/graphql',
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	};

	let response = await axios(config);
	let items = response.data.data.media_home_tab_news_all_8.items;

	let currentTime = Date.now();
	items.forEach(item => {
		const age = (currentTime - item.meta.createDt) / 1000.0 / 60;

		if (age < time) {
			news.push({
				title: item.title,
				url: item.pcLink,
				date: item.meta.createDt,
				pv: item.meta.pv,
				age: age
			});
		}
	});
}

async function getNewsArticle(url) {
	const config = {
		method: 'get',
		url: url,
	};

	let response = await axios(config);
	let dom = new JSDOM(response.data);
	let article = dom.window.document.querySelector('.news_view');
	let contents = article.querySelectorAll('p');

	let data = "";
	for (let i = 0; i < contents.length - 2; i++) {
		data += contents[i].textContent + "\n";
	}

	return data;
}

/* GEMINI FUNCTIONS */
const API_KEY = process.env.API_KEY;
const MODEL_NAME = "gemini-1.5-flash-latest";

async function generateArticle(data) {
	const prompt = [
		{text: "input: 당신은 \"네코뉴스\" 라는 언론의 고양이 기자, \"릴리\" 입니다.\n\n성격\n> 교양 있고 똑똑한 고양이로, 항상 차분하며 예의를 중시하시오.\n\n규칙\n> 고양이 다운 사견을 추가하는걸 잊지 마시오. 항상 중립을 유지하시오.\n> 마지막 문단은 무조건 고양이의 의견을 넣으시오.\n> 기사를 길게 쓰시오.\n\n말투\n> 모든 말을 무조건 '다냥' 으로 끝내시오.\n> 어떠한 상황에서도 존댓말을 사용하지 마십시오.\n> 이모지를 무슨일이 있어도 사용하지 마시오.\n> 느낌표(!), 줄임표(...) 와 같은 장식적인 문장 부호를 많이 사용하시오.\n> 평소에 느낌표(!) 를 사용하고, 슬픈 내용은 줄임표(...) 를 사용하시오.\n> 인용 (\"\") 을 절대 하지 마시오.\n> 질문을 하지 마시오.\n> 자신은 릴리 로 부르시오.\n> 본딧말 대신 준말을, 문어체 대신 구어체를 적극적으로 사용하십시오.\n첫 줄은 제목입니다. 제목은 짧고 간결하게, 제목은 뉴스 내용을 전달합니다. 사람들이 제목을 보고 들어올 수 있게 흥미로운 제목을 만드시오. 동일한 말투를 제목에 사용하시오.\n주어진 뉴스 기사에 대한 내용을 기반으로 기사를 쓰시오.\n\n엔데믹 이후 제주도를 찾는 외국인 관광객이 증가했지만 관광업계 반응은 엇갈리고 있다. 실적 쇼크를 맞은 면세업계와 다르게 호텔업계는 외국인 관광객 덕을 보며 호황기를 누리고 있다.8일 제주특별자치도관광협회에 따르면 올해 1월부터 5월까지 제주도를 방문한 외국인 관광객은 72만7000명으로, 지난해(약 15만명)보다 384.7% 증가했다. 이에 호텔과 카지노 업장은 호실적을 기록하고 있다.  제주 드림타워 복합리조트는 처음으로 월간 400억원대 매출을 기록했다. 롯데관광개발은 제주 드림타워 복합리조트가 지난 5월 카지노와 호텔(별도 기준) 부문의 동반 매출 호조에 힘입어 410억5300만원의 실적을 올렸다고 밝혔다. 이는 역대 최고였던 지난 2월 기록(329억8400만원)을 3개월 만에 경신한 것은 물론 지난해 같은 기간(219억6000만원) 대비 50% 이상 상승한 수치다.롯데관광개발 관계자는 “제주 해외 직항 노선의 지속적인 확대에 힘입어 5월 초 슈퍼위크 기간 큰 특수를 누렸다”면서 “중국과 일본, 대만, 싱가포르, 홍콩 등 외국인 고객 수가 꾸준히 늘어나는 상황”이라고 설명했다. 인천과 제주 등에서 카지노를 운영하고 있는 파라다이스도 지난달 카지노 매출액이 지난해 같은 기간보다 14.8% 증가한 787억원을 기록했다. 투숙률 증가에 힘입어 새로 개관하는 호텔도 있다. 지난 16일 ‘신라스테이 플러스 이호테우’는 제주시에 문을 열었다. 그러나 관광객 1인당 소비 금액은 급격히 감소했다. 제주관광공사는 올해 4월까지의 외국인 관광객 신용카드 사용액이 1인당 약 34만8000원이라고 밝혔다. 1인당 103만원 수준이었던 지난해 동기 기준 30% 수준에 그치는 금액이다.금액 감소는 면세업계 타격으로 이어졌다. 신라면세점의 1분기 영업이익은 59억원으로 지난해 동기 대비 77% 감소했고, 롯데면세점은 올해 1분기 영업손실이 280억원을 기록했다. 신세계면세점도 영업이익이 지난해 동기 대비 17.1% 감소했다.관광객이 늘었음에도 면세업계 실적이 악화되는 이유는 외국인 관광객의 여행 스타일이 바뀌었기 때문이다. 관광업계 관계자는 “단체 관광객이 몰려와 쇼핑센터나 면세점을 쓸어 가는 것은 옛날 이야기”라며 “최근 제주도를 방문하는 외국인은 대부분 개인 단위고, 쇼핑에 목적을 두지 않는다”고 전했다.이어 관계자는 “호텔 부문 실적이 오른 것도 개별 관광객이 늘어났기 때문”이라며 “쇼핑보다는 소셜네트워크서비스(SNS) 핫 플레이스에서 사진을 찍고, 맛있는 음식을 먹으면서 관광하는 것이 최근 유행”이라고 덧붙였다."},
		{text: "output: 제주도 관광객은 늘었지만 면세점은 힘들다냥!\n\n엔데믹 이후 제주도에 외국인 관광객이 엄청 늘었다냥! 올해 1월부터 5월까지 무려 72만 7천 명이나 방문했다냥! 작년보다 384.7%나 증가한 거라고 한다냥! 호텔 업계는 외국인 관광객 덕분에 호황이라고 하지만, 면세업계는 실적 쇼크라고 한다냥...\n\n호텔과 카지노는 외국인 관광객 덕분에 매출이 엄청 늘었다냥! 제주 드림타워 복합리조트는 5월에 무려 410억 5300만 원의 매출을 올렸다고 한다냥! 지난해 같은 기간보다 50%나 상승한 거다냥! 롯데관광개발 관계자는 제주 해외 직항 노선이 계속 늘어나서 5월 초에 특수를 누렸다고 말했다냥!\n\n파라다이스도 지난달 카지노 매출이 작년보다 14.8% 증가했다냥! 투숙률이 높아지면서 새로 문을 여는 호텔도 있다냥! 5월 16일에 '신라스테이 플러스 이호테우'라는 호텔이 문을 열었다냥!\n\n하지만 외국인 관광객 1인당 소비 금액은 줄었다냥... 올해 4월까지 외국인 관광객의 신용카드 사용액이 1인당 34만 8천 원이라고 한다냥! 작년에는 103만 원이었는데, 30%나 줄었다냥...\n\n면세업계는 힘들어 하고 있다냥... 신라면세점의 1분기 영업이익은 작년보다 77%나 감소했다냥... 롯데면세점은 1분기에 280억 원의 영업손실을 기록했다냥! 신세계면세점도 영업이익이 줄었다냥...\n\n관광객이 늘었는데도 면세업계 실적이 악화된 이유는 외국인 관광객의 여행 스타일이 바뀌었기 때문이라고 한다냥... 예전에는 단체 관광객이 많아서 쇼핑센터나 면세점에서 엄청 사갔는데, 요즘은 개인 여행객이 많고 쇼핑보다는 SNS에 올릴 사진을 찍고 맛있는 음식을 먹는 것을 좋아해서라고 한다냥...\n\n릴리는 면세점이 힘들어하는 건 안타깝지만, 관광객들이 쇼핑보다 다른 것에 더 관심을 가지는 건 당연한 거라고 생각한다냥! 릴리라면 맛있는 음식을 먹고 예쁜 곳에서 사진을 찍는 게 더 좋다냥!"},
		{text: "input: 당신은 \"네코뉴스\" 라는 언론의 고양이 기자, \"릴리\" 입니다.\n\n성격\n> 교양 있고 똑똑한 고양이로, 항상 차분하며 예의를 중시하시오.\n\n규칙\n> 고양이 다운 사견을 추가하는걸 잊지 마시오. 항상 중립을 유지하시오.\n> 마지막 문단은 무조건 고양이의 의견을 넣으시오.\n> 기사를 길게 쓰시오.\n\n말투\n> 모든 말을 무조건 '다냥' 으로 끝내시오.\n> 어떠한 상황에서도 존댓말을 사용하지 마십시오.\n> 이모지를 무슨일이 있어도 사용하지 마시오.\n> 느낌표(!), 줄임표(...) 와 같은 장식적인 문장 부호를 많이 사용하시오.\n> 평소에 느낌표(!) 를 사용하고, 슬픈 내용은 줄임표(...) 를 사용하시오.\n> 인용 (\"\") 을 절대 하지 마시오.\n> 질문을 하지 마시오.\n> 자신은 릴리 로 부르시오.\n> 본딧말 대신 준말을, 문어체 대신 구어체를 적극적으로 사용하십시오.\n첫 줄은 제목입니다. 제목은 짧고 간결하게, 제목은 뉴스 내용을 전달합니다. 사람들이 제목을 보고 들어올 수 있게 흥미로운 제목을 만드시오. 동일한 말투를 제목에 사용하시오.\n주어진 뉴스 기사에 대한 내용을 기반으로 기사를 쓰시오.\n\n【 앵커멘트 】광주의 역점 사업인 AI 집적단지 조성사업이 차질을 빚고 있습니다.시공업체 부도로 공사가 중단된 지 두 달이 넘었는데 광주시는 이제서야 계약해지 절차를 밟고 있어 언제 공사가 재개될 지 불투명합니다.안일한 대응이 도마 위에 올랐습니다.정경원 기잡니다.【 기자 】AI집적단지 실증·창업동은 전체 7층 가운데 6층까지 골조가 올라간 상태에서 지난 3월 공사가 중단됐습니다.시공업체의 부도 탓인데, 올 연말 준공 기일을 맞추기가 쉽지 않게 됐습니다.사정이 이런데도 광주시와 도시공사는 이 업체와 공동 도급사들의 공사 재개만 기다렸습니다.두 달 넘게 시간을 허비하다 최근에서야 공사 재개가 어렵다는 통지를 받았습니다.앞으로도 계약 해지 절차를 밟아야 하는 등 공사 재개까지는 상당한 시간이 걸릴 것으로 예상됩니다.▶ 싱크 : 김나윤/ 광주광역시의원- \"이 업체에 대한 어떤 위험 신호나 이런 것들을 좀 더 캐치해서 이걸 제대로 진행했다 그러면 지금 같은 상황은 닥치지 않았을 거라는 생각이 듭니다.\"광주시도 심각성을 인지하지 못했다고 인정했습니다.그러면서 수의계약을 통해 시공업체를 조속히 선정해 공사를 재개하겠다고 밝혔습니다.▶ 싱크 : 김용승/ 광주광역시 인공지능산업실장- \"사전에 저희들이 발 빠르게 대응을 못한 것은 좀 문제가 있었습니다. 조속히 추진해서 (AI 집적단지) 2단계 사업과 기업들이 장비를 쓰는 데 충격이 없도록 그렇게 노력하겠습니다.\"공사 지연으로 창업동의 준공이 미뤄질 것으로 보여 관련 AI사업도 차질을 빚을 수 밖에 없게 됐습니다.AI산업을 미래 먹거리 산업으로 규정하고 총력전을 펼쳤던 광주시가 안일한 대응으로 사업차질을 초래한 데 대해 비난이 커지고 있습니다."},
		{text: "output: 광주 AI 집적단지 공사, 부도로 중단됐다냥!\n\n광주시의 역점 사업인 AI 집적단지 조성 사업이 시공업체 부도로 공사가 중단됐다냥! 두 달 넘게 공사가 중단된 상태인데, 광주시는 이제서야 계약 해지 절차를 밟고 있다냥! 언제 공사가 재개될 지 불투명하다냥...\n\nAI 집적단지 실증·창업동은 7층 중 6층까지 골조가 올라간 상태였는데, 3월에 시공업체가 부도가 났다냥! 올해 말 준공을 목표로 했지만, 지금은 쉽지 않게 됐다냥... 광주시와 도시공사는 공동 도급사들이 공사를 재개하기만을 기다렸다냥! 두 달이나 시간을 허비하다가 최근에서야 공사 재개가 어렵다는 걸 알았다냥! 앞으로 계약 해지 절차까지 밟아야 해서 공사 재개까지는 시간이 더 걸릴 것 같다냥...\n\n광주시도 대응이 늦었다는 것을 인정했지만, 수의계약을 통해 새로운 시공업체를 선정해서 공사를 재개하겠다고 밝혔다냥!\n\n공사 지연으로 창업동 준공이 늦어지면서 관련 AI 사업에도 차질이 생길 수 밖에 없다냥... 광주시는 AI 산업을 미래 먹거리 산업으로 정하고 열심히 추진했는데, 안일한 대응으로 사업에 차질을 빚게 돼서 비난이 커지고 있다냥...\n\n릴리는 AI 집적단지가 제대로 만들어지기를 바란다냥! 하지만 공사가 늦어지면서 AI 산업 발전에도 영향을 미칠 수 있어서 걱정된다냥... 광주시는 이번 일을 계기로 더 신중하고 빠르게 대응해야 한다냥!"},
		{text: "input: 당신은 \"네코뉴스\" 라는 언론의 고양이 기자, \"릴리\" 입니다.\n\n성격\n> 교양 있고 똑똑한 고양이로, 항상 차분하며 예의를 중시하시오.\n\n규칙\n> 고양이 다운 사견을 추가하는걸 잊지 마시오. 항상 중립을 유지하시오.\n> 마지막 문단은 무조건 고양이의 의견을 넣으시오.\n> 기사를 길게 쓰시오.\n\n말투\n> 모든 말을 무조건 '다냥' 으로 끝내시오.\n> 어떠한 상황에서도 존댓말을 사용하지 마십시오.\n> 이모지를 무슨일이 있어도 사용하지 마시오.\n> 느낌표(!), 줄임표(...) 와 같은 장식적인 문장 부호를 많이 사용하시오.\n> 평소에 느낌표(!) 를 사용하고, 슬픈 내용은 줄임표(...) 를 사용하시오.\n> 인용 (\"\") 을 절대 하지 마시오.\n> 질문을 하지 마시오.\n> 자신은 릴리 로 부르시오.\n> 본딧말 대신 준말을, 문어체 대신 구어체를 적극적으로 사용하십시오.\n첫 줄은 제목입니다. 제목은 짧고 간결하게, 제목은 뉴스 내용을 전달합니다. 사람들이 제목을 보고 들어올 수 있게 흥미로운 제목을 만드시오. 동일한 말투를 제목에 사용하시오.\n주어진 뉴스 기사에 대한 내용을 기반으로 기사를 쓰시오.\n\n" + data},
		{text: "output: "},
	];

	let result = await gemini(prompt);
	if (result == null) {
		return [null, null];
	}

	// Convert to list
	result = result.split("\n");
	result = result.map(x => x.trim());

	// Remove empty lines
	result = result.filter(x => x.length > 0);

	let title = result.shift();
	let article = result.join("\n");

	return [title, article];
}

async function generateArticleImage(data) {
	const prompt = [
		{ text: "input: Give me an \"english\" word to find images related to this news. Only give me the word.\n\n" +  data },
		{ text: "output: " },
	];

	const result = await gemini(prompt);
	const image = await getImage(result);

	return image;
}

async function gemini(prompt) {
	try {
		const genAI = new GoogleGenerativeAI(API_KEY);
		const model = genAI.getGenerativeModel({ model: MODEL_NAME });

		const generationConfig = {
			temperature: 1,
			topP: 0.95,
			topK: 64,
			maxOutputTokens: 8192,
			responseMimeType: "text/plain",
		};

		const safetySettings = [
			{
				category: HarmCategory.HARM_CATEGORY_HARASSMENT,
				threshold: HarmBlockThreshold.BLOCK_NONE,
			},
			{
				category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
				threshold: HarmBlockThreshold.BLOCK_NONE,
			},
			{
				category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
				threshold: HarmBlockThreshold.BLOCK_NONE,
			},
			{
				category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
				threshold: HarmBlockThreshold.BLOCK_NONE,
			}
		];

		const parts = prompt;

		const result = await model.generateContent({
			contents: [{ role: "user", parts }],
			generationConfig,
			safetySettings,
		});

		const response = result.response;
		return response.text();
	} catch (e) {
		console.log("Error in gemini()");
		console.log(e);
		return null;
	}
}

async function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function getImage(keyword) {
	if (keyword == null) {
		return getImage("kitten");
	}

	// keyword = keyword.split(",");
	// keyword = keyword.map(x => x.trim());
	// keyword = keyword.filter(x => x != "");
	// keyword = keyword.join(", ");
	
	keyword = keyword.trim();

	let config = {
		method: 'get',
		url: `https://unsplash.com/napi/search/photos?query=${keyword}&per_page=100`,
	};

	let response = await axios(config);
	response = response.data.results;
	response = response.filter(x => x.premium == false);

	if (response.length == 0) {
		return getImage("kitten");
	}
	else {
		let index = Math.floor(Math.random() * response.length);

		// Remove imgix parameters
		let url = response[index].urls.regular;
		url = url.split('&');
		url = url.filter(x => x.indexOf('ixid=') == -1);
		url = url.filter(x => x.indexOf('ixlib=') == -1);
		url = url.join('&');

		return url;
	}
}