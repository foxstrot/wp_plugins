var SuoQueue = {};

SuoQueue.host = "http://sq.mfc.ru/";
SuoQueue.app_id = "00000000-0000-0000-0000-000000000000";
SuoQueue.region_id = "00000000-0000-0000-0000-000000000000";

SuoQueue.init = function(settings) {
	if(settings != null) {
		if(settings.app_id != null)
			this.app_id = settings.app_id;
		if(settings.region_id != null)
			this.region_id = settings.region_id;
		if(settings.host != null)
			this.host = settings.host;
	};
}

SuoQueue.getPlaces = function() {

}

SuoQueue.mainView = function() {
	console.log("mainView()");

	var content = '<h2>МАУ МФЦ Алексеевского района</h2>';
	content += '<p>Добро пожаловать!<p>';
	content += '<a href="#" id="suo-queue-create" class="suo-queue-button">Встать в очередь</a>';
	content += '<a href="#" id="suo-queue-ticket" class="suo-queue-button">По предварительной записи</a>';
	content += '<p>12:00 Понедельник 23 мая 2017 г.<p></div>';
	
	$(".suo-queue").html(content);

	$("#suo-queue-create").click(SuoQueue.categoryView);
	$("#suo-queue-ticket").click(SuoQueue.ticketView);
}

SuoQueue.categoryView = function() {
	console.log("categoryView()");

	var content = '<h2>МАУ МФЦ Алексеевского района</h2>';
	content += '<p>Добро пожаловать!<p>';
	content += '<p>Выбор услуги<p>';
	content += '<div><a href="#" class="suo-queue-category">Прочие услуги </a>';
	content += '<a href="#" class="suo-queue-category">Прочие услуги </a>';
	content += '<a href="#" class="suo-queue-category">Прочие услуги </a>';
	content += '<a href="#" class="suo-queue-category">Прочие услуги </a>';
	content += '<a href="#" class="suo-queue-category">Прочие услуги </a>';
	content += '<a href="#" class="suo-queue-category">Прочие услуги </a>';
	content += '<a href="#" class="suo-queue-category">Прочие услуги </a>';
	content += '<a href="#" class="suo-queue-category">Прочие услуги </a>';
	content += '<a href="#" class="suo-queue-category">Прочие услуги </a>';
	content += '<a href="#" class="suo-queue-category">Прочие услуги </a>';
	content += '</div><div><p>Назад<p>';
	content += '<p>12:00 Понедельник 23 мая 2017 г.<p></div>';

	$(".suo-queue").html(content);
	$(".suo-queue-category").click(SuoQueue.servicesView);
}

SuoQueue.servicesView = function() {
	console.log("servicesView()");

	var content = '<h2>МАУ МФЦ Алексеевского района</h2>';
	content += '<p>Добро пожаловать!<p>';
	content += '<p>Выбор услуги<p>';
	content += '<a href="#" class="suo-queue-service">Прочие услуги </a>';
	content += '<a href="#" class="suo-queue-service">Прочие услуги </a>';
	content += '<div><p>Назад<p>';
	content += '<p>12:00 Понедельник 23 мая 2017 г.<p></div>';

	$(".suo-queue").html(content);
}

SuoQueue.ticketView = function() {
	console.log("ticketView()");

	var content = '<h2>МАУ МФЦ Алексеевского района</h2>';
	content += '<p>Добро пожаловать!<p>';
	content += '<p>Укажите номер и пин-код Вашего талона предварительной записи<p>';
	content += '<label>Номер: <input type="text"><label>';
	content += '<label>Пин-код: <input type="text"><label>';
	content += '<p>Назад<p>';
	content += '<p>12:00 Понедельник 23 мая 2017 г.<p></div>';

	$(".suo-queue").html(content);
}

$(document).ready(function() {
	console.log("SuoQueue shortcode");
	SuoQueue.init(SuoSettings);

	SuoQueue.mainView();
});
