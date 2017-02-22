function nvxCheckStatus(){
	jQuery.ajax({ url: 'http://sq.mfc.ru/v1' //, type: 'GET'
		//, data: { тут вот объект с каким-то полем, номер документа})
		// dataType: 'json',
	})
    .done(function (response) {
		//Это будет отрабатывать в случае успеха, тут в response будет объект с ответом, скорее всего json. Ты его разбираешь и отображаешь у себя на странице
    }).fail(function (jqXHR, textStatus, errorThrown) {
		//это будет отрабатывать в случае ошибки
		console.log(errorThrown);
		var checkStatus = document.getElementById('nvxStatus');
	checkStatus.innerHTML = '<div class="nvxCheckStatus"><div class="lupa"><h3>Статус вашего заявления неизвестен.</h3>Вы ввели неверный номер дела<br/>или<br/>МФЦ не подключен к системе Re:Doc Status.</div></div><img class="nvxStatusImg center" src="'+NETVOXLAB_URL+'assets/img/img2.jpg">'
    }).always(function () {
		//Это будет отрабатывать всегда, если надо, например, закрыть какой-нибудь троббер
	});
}

function checkStatusInit(){
	jQuery("#nvxNumber").on('keyup', function() {
		fieldIsFilled();
	});
	
}

function fieldIsFilled(){
	var field = document.getElementById('nvxNumber').value;
	if(field == "" || field == null)
		document.getElementById('checkStatusBtn').disabled = true;
	else
		document.getElementById('checkStatusBtn').disabled = false;
}

document.addEventListener("DOMContentLoaded", checkStatusInit);