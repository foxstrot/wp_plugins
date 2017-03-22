function nvxCheckStatus(){
	jQuery.ajax({
		type: "POST", 
		url: nvxCheckStatus_server_url + '/status/send',
		contentType: "application/json",
		data: JSON.stringify({"docNumber":jQuery('#nvxNumber').val()}),
		dataType: 'json'
	})
    .done(function (response, status) {
		console.log('Status check: Status = ' + status + ', response = ' + response);
    }).fail(function (jqXHR, textStatus, errorThrown) {
		console.log(errorThrown);
    }).always(function () {
		var checkStatus = document.getElementById('nvxStatus');
		checkStatus.innerHTML = '<div class="nvxCheckStatus"><div class="lupa"><h3>Статус вашего заявления неизвестен.</h3>Вы ввели неверный номер дела<br/>или<br/>МФЦ не подключен к системе Re:Doc Status.</div></div><img class="nvxStatusImg center" src="'+NETVOXLAB_URL+'assets/img/img2.jpg">'
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