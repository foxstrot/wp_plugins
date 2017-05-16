var SuoModule = {};

SuoModule.host = "http://sq.mfc.ru/";
SuoModule.app_id = "00000000-0000-0000-0000-000000000000";
SuoModule.region_id = "00000000-0000-0000-0000-000000000000";
SuoModule.current = {};

SuoModule.init = function(settings) {
	console.log("SuoModule init()");

	if(settings != null) {
		if(settings.app_id != null)
			this.app_id = settings.app_id;
		if(settings.region_id != null)
			this.region_id = settings.region_id;
		if(settings.host != null)
			this.host = settings.host;

		console.log(SuoModule.host);
	};

	this.getPlaces();

	$.datepicker.regional['ru'] = {
		closeText: 'Закрыть',
		prevText: '&#x3c;Пред',
		nextText: 'След&#x3e;',
		currentText: 'Сегодня',
		monthNames: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
		'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
		monthNamesShort: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
		'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
		dayNames: ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'],
		dayNamesShort: ['вск', 'пнд', 'втр', 'срд', 'чтв', 'птн', 'сбт'],
		dayNamesMin: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
		weekHeader: 'Нед',
		firstDay: 1,
		isRTL: false,
		showMonthAfterYear: false,
		yearSuffix: ''
	};
	$.datepicker.setDefaults($.datepicker.regional['ru']);

	$("#datepicker").datepicker({
		onSelect: function(date) {
			var placeId = $("#suoOrg option:selected").val();
			console.log("DATE : " + date)
			SuoModule.getServices(placeId, date);
		},
		dateFormat: 'yy-mm-dd',
		minDate: 0,
		maxDate: '+30D'//,
		//beforeShowDay: SuoModule.available
	});

/*
	natDays = [
		[1, 1, 'ru'], [1, 2, 'ru'], [1, 3, 'ru'],
		[1, 4, 'ru'], [1, 5, 'ru'], [1, 6, 'ru'],
		[1, 7, 'ru'], [1, 8, 'ru'], [2, 23, 'ru'],
		[3, 8, 'ru'], [5, 1, 'ru'], [5, 9, 'ru'],
		[6, 12, 'ru'], [11, 4, 'ru']
	];

	function nationalDays(date) {
		for (i = 0; i < natDays.length; i++) {
			if (date.getMonth() == natDays[i][0] - 1
				&& date.getDate() == natDays[i][1]) {
				return [false, natDays[i][2] + '_day'];
			}
		}
		return [true, ''];
	}
	
	function noWeekendsOrHolidays(date) {
		var noWeekend = $.datepicker.noWeekends(date);
		if (noWeekend[0]) {
			return nationalDays(date);
		} else {
			return noWeekend;
		}
	}*/

	$("#suoOrg").change(function() {
		console.log("Handler for .change() called.");
		var serviceId = $("#suoOrg option:selected").val();
		var date = $("#datepicker").val();
		SuoModule.getServices(serviceId, date);
	});

	$("#suoName").keyup(function() {
		SuoModule.checkFields();
	});

	$("#suoSend").click(SuoModule.submit);

}

SuoModule.getPlaces = function() {
	console.log("SuoModule getPlaces()");
	console.log("app_id = " + this.app_id);
	console.log("region_id = " + this.region_id);

	$.ajax({
		headers: { 'app_id' : this.app_id, 'region_id': this.region_id },
		url: this.host + "v1/reception/getplaces/mfc",
		data: { isAll: "true" },
		dataType: 'json',
	})
	.done(function (data, status, jqxhr) {
		console.log("getPlaces done!");
		console.log("placeList:");
		console.log(data);

		SuoModule.current.placeList = data.placeList;

		$.each(data.placeList, function(index, place) {   
			$('#suoOrg')
				.append($("<option></option>")
				.attr("value", place.recId)
				.text(place.shortName));
		});

		if(data.placeList.length > 0)
			SuoModule.getServices(data.placeList[0].recId);
	})
	.fail(function() {
		alert("Ошибка получения списка организаций!");
	});
}

SuoModule.getServices = function(placeId) {
	console.log("SuoModule getServices()");
	console.log("place_id = " + placeId);

	SuoModule.current.placeId = placeId;

	$.ajax({
		headers: { 'app_id': this.app_id },
		url: this.host + "v1/reception/getservices?placeId=" + placeId,
		data: { isAll: "true" },
		dataType: 'json',
	})
	.done(function (data, status, jqxhr) {
		console.log("getServices done!");
		console.log("services:");
		console.log(data);

		SuoModule.current.serviceList = data.serviceList;
		
		if(data.serviceList.length > 0) {
			SuoModule.current.serviceId = data.serviceList[0].recId;

			var dateFrom = $.datepicker.formatDate('yy-mm-dd', new Date());
    		var after30days = new Date(new Date().setDate(new Date().getDate() + 30));
    		var dateTo = $.datepicker.formatDate('yy-mm-dd', after30days);

			console.log("!! dateFrom = " + dateFrom);
			console.log("!! dateTo = " + dateTo);

			SuoModule.getSpecialists(data.serviceList[0].recId, dateFrom, dateTo);
		}
	})
	.fail(function() {
		alert("Ошибка получения списка услуг!");
	});
}

SuoModule.getSpecialists = function(serviceId, dateFrom, dateTo) {
	console.log("SuoModule getSpecialists()");

	$.ajax({
		headers: { 'app_id': this.app_id },
		url: this.host+"v1/reception/getspecialists?serviceId="+serviceId+"&dateFrom="+dateFrom+"&dateTo="+dateTo,
		dataType: 'json'
	})
	.done(function (data, status, jqxhr) {
		console.log("getSpecialists done()");
		console.log(data);

		SuoModule.current.availableDates = new Array();

		$.each(data.schedule[0].dateList, function(i, item) {
	        //console.log(item.name);
			SuoModule.current.availableDates.push(item.name);
    	});

    	$('#datepicker').datepicker("option", "beforeShowDay", SuoModule.available );

		var date = $("#datepicker").val();
		SuoModule.getTimeSlots(serviceId, date);
	})
	.fail(function() {
		alert("Ошибка получения специалистов!");
	});
}

SuoModule.getTimeSlots = function(serviceId, date) {
	console.log("SuoModule getTimeSlots()");
	console.log("ServiceId: " + serviceId);

	$.ajax({
		headers: { 'app_id': this.app_id },
		type: "POST",
		contentType: "application/json",
		url: this.host + "v1/reception/gettimeslots/"+serviceId+"/"+date,
		data: JSON.stringify({
			"date": { "date" : date + "T00:00:00" } 
		}),
		dataType: 'json',
	})
	.done(function (data, status, jqxhr) {
		console.log("getTimeSlots done!");
		console.log("timeSlots:");
		console.log(data);

		SuoModule.current.positions = data.positions;
		SuoModule.current.date = data.date;

		$("#suoTimepicker tr").remove();

		var htmlTime = "<tr>";
		$.each(data.positions, function(index, position) {
			var isAvailable = position.isAvailable ? '' : ' suo-time-filled';
			htmlTime += "<td><div class='suo-time" + isAvailable + "'>" + position.name;
			htmlTime += "<input type='hidden' value='" + position.recId + "'/>";
			htmlTime += "</div></td>";
			if((index+1) % 4 == 0) { htmlTime += '</tr><tr>'; }
		});
		htmlTime += '</tr>';
		$('#suoTimepicker').html(htmlTime);
		//SuoModule.checkFields();

		SuoModule.getTicketsByPlace();


		$(".suo-time").click(function() {
			console.log("click!");
    		var id = $(this).children('input').val();
    		console.log(id);

			var content = '';
			$.each(SuoModule.current.tickets, function(index, ticket) {
				if(id == ticket.timeSlotId) {
					content += '<div class="suo-operator-entry">';
					content += '<p>Дата: '+ $("#datepicker").val() +'</p>';
					content += '<p>Время: '+ ticket.attributes.pName +'</p>';

					var fields = JSON.parse(ticket.attributes.fields);

					content += '<p>ФИО: '+ fields.Family +'</p>';
					content += '<p>Телефон: </p>';
					content += '<p>Email: '+ fields.email +'</p>';
					content += '</div>';
				};
			});

			$('.suo-operator-info').html(content);
		});




	})
	.fail(function() {
		alert("Ошибка получения тайм-слотов!");
	});
}



SuoModule.available = function(date) {
	var sdate = $.datepicker.formatDate('dd.mm.yy', date);
	if($.inArray(sdate, SuoModule.current.availableDates) != -1) {
		return [true];
	}
	return [false];
};

SuoModule.getTicketsByPlace = function() {
	console.log("getTicketsByPlace()");

	$.ajax({
		headers: { 'app_id' : this.app_id, 'region_id': this.region_id },
		url: this.host + "v1/operator/geticketsbyplace/" + SuoModule.current.placeId + "/" + SuoModule.current.date,
		data: { isAll: "true" },
		dataType: 'json',
	})
	.done(function (data, status, jqxhr) {
		console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!getTicketsByPlace done!");
		console.log(data);
		SuoModule.current.tickets = data;



		/*
		var content = '';

		data.forEach(function(item, i, data) {
			content += '<div class="suo-operator-entry">';
			content += '<p>Дата: '+ $("#datepicker").val() +'</p>';
			content += '<p>Время: '+ item.attributes.pName +'</p>';

			var fields = JSON.parse(item.attributes.fields);

			content += '<p>ФИО: '+ fields.Family +'</p>';
			content += '<p>Телефон: </p>';
			content += '<p>Email: '+ fields.email +'</p>';
			content += '<a href="#">Удалить</a>';
			content += '<a href="#">Редактировать</a>';
			content += '</div>';
		});


		$('.suo-operator-info').html(content);*/
	})
	.fail(function() {
		alert("Ошибка получения слотов!");
	});
}

$(document).ready(function() {
	console.log("!!!!!!! SUO OPERATOR !!!!!!");
	SuoModule.init(SuoSettings);
});
