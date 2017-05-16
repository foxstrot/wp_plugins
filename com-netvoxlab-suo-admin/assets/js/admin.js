var SuoAdminModule = {};

SuoAdminModule.host = "http://sqtest.egspace.ru/";
SuoAdminModule.currentPlace = {};
SuoAdminModule.userToken = "";

SuoAdminModule.init = function(settings) {
  console.log("SuoAdminModule init()");

  if(settings != null) {
    if(settings.app_id != null)
      SuoAdminModule.app_id = settings.app_id;
    if(settings.region_id != null)
      SuoAdminModule.region_id = settings.region_id;
    if(settings.host != null)
      SuoAdminModule.host = settings.host;

    console.log(SuoAdminModule.host);
  }
}

/* Main page */
SuoAdminModule.myPlacesView = function(places) {
  console.log("--> myPlacesView()");

  var content = '<h1>Администрирование и настройка</h1><h2>Мои организации</h2><table id="nvx-suo-admin-places" cellspacing="0" cellpadding="0"></table><div class="nvx-suo-actions"><a class="nvx-suo-button" id="create-place"><i class="fa fa-plus-circle" aria-hidden="true"></i>Добавить</a></div><br><p>HTML-код для вставки виджета:</p><textarea><div class="nvx-mfc-suo-widget"></div><script type="text/javascript">SuoSettings = {};SuoSettings.host = "http://sqtest.egspace.ru/";SuoSettings.app_id = "5e07086e-7326-43d4-8c70-1631b4b4af82";SuoSettings.region_id = "1cc12792-fb12-41f4-b9c5-363087a7dc6d";</script><script type="text/javascript" src="http://widgets.mfc.ru/nvx-suo-widget/widget.js"></script></textarea>';

  $(".nvx-suo-admin").html(content);

  var placesHtml = '';
  $.each(places.placeList, function(index, place) {
    console.log("Index = " + index);
    console.log(place);
    placesHtml += '<tr>';
    if(place.isEnabled)
      placesHtml += '<td class="nvx-suo-draft">' + place.shortName + ' (черновик) </td>';
    else
      placesHtml += '<td>' + place.shortName + '</td>';

    placesHtml += '<td>';
    placesHtml += '<div class="dropdown">';
    placesHtml += '<i class="fa fa-ellipsis-v dropbtn" aria-hidden="true"></i>';
    placesHtml += '<div class="dropdown-content">';
    placesHtml += '<input type="hidden" value="' + place.recId + '">';
    placesHtml += '<a class="nvx-suo-admin-editlink" href="#">Изменить</a>';
    placesHtml += '<a class="nvx-suo-admin-schedlink" href="#">Расписание</a>';
    placesHtml += '<a class="nvx-suo-admin-removelink" href="#">Удалить</a>';
    placesHtml += '</div>';
    placesHtml += '</div>';
    placesHtml += '</td>';
    placesHtml += '</tr>';
  });
  $('#nvx-suo-admin-places').html('<tbody>' + placesHtml + '</tbody>');
  $("#create-place").click(SuoAdminModule.editPlaceView);

  $(".nvx-suo-admin-editlink").click(function(){
    var id = $(this).siblings('input').val();
    console.log(id);

    var place = SuoAdminModule.placeList.find(function(element, index, array){
      return (element.recId == id);
    });

    SuoAdminModule.editPlaceView(place);
  });
  $(".nvx-suo-admin-schedlink").click(function(){
    var id = $(this).siblings('input').val();
    console.log(id);

    SuoAdminModule.getTemplates(id);
  });
  $(".nvx-suo-admin-removelink").click(function(){
    var id = $(this).siblings('input').val();
    console.log(id);

    $.ajax({
    headers: { 'app_id': SuoAdminModule.app_id, 'user_token' : SuoAdminModule.userToken, 'Content-Type' : 'application/json' },
      url: SuoAdminModule.host + 'v1/admin/place/delete/' + id,
      type: 'DELETE',
      success: function(result) {
        console.log("delete success");
        console.log(result);
        SuoAdminModule.getPlaces();
      }
    });
  });
};

/* AddOrUpdate place view */
SuoAdminModule.editPlaceView = function(place) {
  console.log("--> editPlaceView()");

  var content = '<h1>Администрирование и настройка</h1><h2>Добавление (изменение) организации</h2><label>Полное название организации</label><input type="text" id="nvx-suo-admin-name" placeholder="Введите полное название организации"><label>Краткое название организации</label><input type="text" id="nvx-suo-admin-short" placeholder="Введите краткое название организации"><label>Адрес</label><input type="text" id="nvx-suo-admin-address" placeholder="Введите адрес организации"><label>Email</label><input type="text" id="nvx-suo-admin-email" placeholder="company@mail.com"><label>Телефон</label><input type="text" id="nvx-suo-admin-phone" placeholder="8 (1234) 56789"><label><input type="checkbox" id="nvx-suo-admin-enable" name="">Черновик <span>(В режиме черновика организация недоступна для выбора пользователям)</span></label><div class="nvx-suo-actions"><a class="nvx-suo-button" id="save-place"><i class="fa fa-check" aria-hidden="true"></i>Сохранить</a><a class="nvx-suo-button-minor" id="cancel-place"><i class="fa fa-ban" aria-hidden="true"></i>Отмена</a><div class="nvx-suo-admin-additional"><a class="nvx-suo-admin-link" id="place-settings"><i class="fa fa-cog" aria-hidden="true"></i>Дополнительно</a><a class="nvx-suo-admin-link" id="my-templates"><i class="fa fa-calendar" aria-hidden="true"></i>Расписание</a><a class="nvx-suo-admin-link" id="my-places">Назад к списку организаций</a></div></div>';

  $(".nvx-suo-admin").html(content);
  $("#place-settings").click(SuoAdminModule.placeSettings);
  //$("#my-templates").click(SuoAdminModule.myTemplatesView);
  $("#cancel-place").click(SuoAdminModule.getPlaces);
  $("#my-places").click(SuoAdminModule.getPlaces);

  $("#nvx-suo-admin-address").suggestions({
    token: "8dc53e3e7433a62222e2cabb494aedec79bc3e90",
    type: "ADDRESS",
    count: 5,
    onSelect: function(suggestion) {
      console.log('fias_id: ' + suggestion.data.fias_id);
      SuoAdminModule.fias_id = suggestion.data.fias_id;
    }
  });

  if(place != null) {
    $("#nvx-suo-admin-name").val(place.name);
    $("#nvx-suo-admin-short").val(place.shortName);
    $("#nvx-suo-admin-address").val(place.address);
    $("#nvx-suo-admin-email").val(place.placeEmail);
    $("#nvx-suo-admin-phone").val(place.phones);
    $("#nvx-suo-admin-enable").prop("checked", place.isEnabled);
  };

  $("#save-place").click(function() {
    $.ajax({
      headers: { 'app_id': SuoAdminModule.app_id, 'user_token' : SuoAdminModule.userToken, 'Content-Type' : 'application/json' },
      type: "POST",
      contentType: "application/json",
      url: SuoAdminModule.host + "v1/admin/place/addorupdate",
      data: JSON.stringify({
        "recId": place == null ? null : place.recId,
        "id":  place == null ? null : place.id,
        "name": $("#nvx-suo-admin-name").val(),
        "attributes": {},
        "shortName": $("#nvx-suo-admin-short").val(),
        "groupName": "", // TODO
        "address": $("#nvx-suo-admin-address").val(),
        "isEnabled": $("#nvx-suo-admin-enable").is(':checked'),
        "contactInfo": "info", // TODO
        "engineId": "7975131d-dc70-467e-a0b9-673b893e5432",
        "endPoint": "",
        "city": { // TODO
          "recId": "d26360df-8f4c-4c75-8a8b-b890d9744cd5",
          "name": "Владимир",
          "childs": null
        },
        "placeTypeId": "866dc938-1d0e-44f3-8709-dd5cd0bd6901",
        "placeEmail": $("#nvx-suo-admin-email").val(),
        "placeSubEmail": "",
        "headPerson": "",
        "site": "",
        "phones": $("#nvx-suo-admin-phone").val(),
        "fiasId": SuoAdminModule.fias_id,
        "regionId": "59edbd09-d885-4584-a2f2-2d0dfb53839f" // TODO
        }),
        dataType: 'json'
    })
    .done(function (data, status, jqxhr) {
      console.log('adminCreatePlace done!');
      console.log(data);

      SuoAdminModule.getPlaces();
    })
    .fail(function() {
      alert("Ошибка!");
    });
  });
};

/* Шаблоны расписаний */
SuoAdminModule.myTemplatesView = function(templates, placeId) {
  console.log("--> myTemplatesView()");

  var place = SuoAdminModule.placeList.find(function(element, index, array){
      return (element.recId == placeId);
  });

  var content = '<h1>Администрирование и настройка</h1><h2>Шаблоны расписания организации "'+ place.shortName +'"</h2><table cellspacing="0" cellpadding="0" id="nvx-suo-admin-templates"></table><div class="nvx-suo-actions"><a class="nvx-suo-button" id="new-template"><i class="fa fa-plus-circle" aria-hidden="true"></i>Добавить</a><a class="nvx-suo-button-minor" id="schedule-settings"><i class="fa fa-cog" aria-hidden="true"></i>Настройки расписания</a><a class="nvx-suo-admin-link" id="my-places">Назад к списку организаций</a></div>';
  $(".nvx-suo-admin").html(content);

  var templatesHtml = '';
  $.each(templates, function(index, template) {
    console.log("Index = " + index);
    console.log(template);

    var checked = "";
    if(template.isDefault == true) {
      checked = "checked";
    };

    templatesHtml += '<tr>';
    templatesHtml += '<td><label><input type="radio" value="'+template.recId+'" name="rbTemplate" '+ checked +'>' + template.recName + '</label></td>';
    templatesHtml += '<td>';
    templatesHtml += '<div class="dropdown">';
    templatesHtml += '<i class="fa fa-ellipsis-v dropbtn" aria-hidden="true"></i>';
    templatesHtml += '<div class="dropdown-content">';
    templatesHtml += '<input type="hidden" value="' + template.recId + '">';
    templatesHtml += '<a class="nvx-suo-template-edit" href="#">Изменить</a>';
    templatesHtml += '<a class="nvx-suo-template-sched" href="#">Расписание</a>';
    templatesHtml += '<a class="nvx-suo-template-remove" href="#">Удалить</a>';
    templatesHtml += '</div>';
    templatesHtml += '</div>';
    templatesHtml += '</td>';
    templatesHtml += '</tr>';

  });
  $('#nvx-suo-admin-templates').html('<tbody>' + templatesHtml + '</tbody>');

  $("#new-template").click(function() {
    $.ajax({
      headers: { "user_token" : SuoAdminModule.userToken, 'app_id': SuoAdminModule.app_id },
      url: SuoAdminModule.host + "v1/admin/schday/getlist/" + placeId,
      dataType: 'json',
    })
    .done(function (dayList, status, jqxhr) {
      console.log("Get dayList by place id done!");
      console.log(dayList);

      SuoAdminModule.editTemplateView(null, dayList, placeId);
    })
    .fail(function() {
      alert("Ошибка");
    });
  });
  $("#my-places").click(SuoAdminModule.getPlaces);
  $("#schedule-settings").click(function() {
    $.ajax({
      headers: { "user_token" : SuoAdminModule.userToken, 'app_id': SuoAdminModule.app_id },
      url: SuoAdminModule.host + "v1/admin/schday/getlist/" + placeId,
      dataType: 'json',
    })
    .done(function (data, status, jqxhr) {
      console.log("done!");
      console.log(data);

      SuoAdminModule.dayList = data;

      SuoAdminModule.myCalendarView(placeId, data);
    })
    .fail(function() {
      alert("Ошибка получения шаблонов дней!");
    })
  });

  $(".nvx-suo-template-edit").click(function() {
    var templateId = $(this).siblings('input').val();
    console.log(templateId);
    console.log("!!!!!!!!!!! Templates");
    console.log(templates);

    // get template by id
    $.ajax({
      headers: { "user_token" : SuoAdminModule.userToken, 'app_id': SuoAdminModule.app_id },
      url: SuoAdminModule.host + "v1/admin/schtemplate/getbyid/" + templateId,
      dataType: 'json',
    })
    .done(function (data, status, jqxhr) {
      console.log("Get template by id done!");
      console.log(data);

      $.ajax({
        headers: { "user_token" : SuoAdminModule.userToken, 'app_id': SuoAdminModule.app_id },
        url: SuoAdminModule.host + "v1/admin/schday/getlist/" + data.placeId,
        dataType: 'json',
      })
      .done(function (dayList, status, jqxhr) {
        console.log("Get dayList by place id done!");
        console.log(dayList);

        SuoAdminModule.editTemplateView(data, dayList, placeId);
      })
      .fail(function() {
        alert("Ошибка");
      });
    })
    .fail(function() {
      alert("Ошибка: " + SuoAdminModule.host + "v1/admin/schtemplate/getbyid/" + templateId);
    });
  });
  $(".nvx-suo-template-sched").click(function() {
    console.log("click!");
  });
  $(".nvx-suo-template-remove").click(function() {
    console.log("delete click!");

    var id = $(this).siblings('input').val();

    $.ajax({
    headers: { 'app_id': SuoAdminModule.app_id, 'user_token' : SuoAdminModule.userToken, 'Content-Type' : 'application/json' },
      url: SuoAdminModule.host + 'v1/admin/schtemplate/delete/' + id,
      type: 'DELETE',
      success: function(result) {
        console.log("delete success");
        console.log(result);

        SuoAdminModule.getTemplates(placeId);
      }
    });

  });

  $('input[type=radio][name=rbTemplate]').change(function() {

    $.ajax({
      headers: { 'app_id': SuoAdminModule.app_id, 'user_token' : SuoAdminModule.userToken, 'Content-Type' : 'application/json' },
      type: "POST",
      contentType: "application/json",
      url: SuoAdminModule.host + "v1/admin/schtemplate/setdefault/" + placeId + "/" + this.value,
      dataType: 'json'
    })
    .done(function (data, status, jqxhr) {
      console.log('done!');
      console.log(data);
    })
    .fail(function() {
      alert("Ошибка!");
    });
  });


};

/* Редактирование шаблона расписания */
SuoAdminModule.editTemplateView = function(template, dayList, placeId) {
  console.log("--> editTemplateView()");

  var content = '<h1>Администрирование и настройка</h1><h2>Изменение шаблона расписания</h2><p>Название шаблона:<span>*</span><input type="text" id="nvx-suo-template-name" placeholder="Введите название шаблона" /></p><p>Продолжительность приема одного посетителя (в мин.):<span>*</span><input type="number" id="nvx-suo-template-time" required></p><div class="nvx-suo-templates"><table cellpadding="0" cellspacing="0" id="nvx-suo-templates-table"><tr><td>ПН</td><td><select><option selected="true">Рабочий день (с 9 до 18 с перерывом на обед)</option><option>Сокращенный рабочий день (с 9 до 12 без обеда)</option><option>Выходной день</option></select></td><td><i class="fa fa-plus" aria-hidden="true"></i></td></tr><tr><td>ВТ</td><td><select><option selected="true">Рабочий день (с 9 до 18 с перерывом на обед)</option><option>Сокращенный рабочий день (с 9 до 12 без обеда)</option><option>Выходной день</option></select></td><td><i class="fa fa-plus" aria-hidden="true"></i></td></tr><tr><td>СР</td><td><select><option selected="true">Рабочий день (с 9 до 18 с перерывом на обед)</option><option>Сокращенный рабочий день (с 9 до 12 без обеда)</option><option>Выходной день</option></select></td><td><i class="fa fa-plus" aria-hidden="true"></i></td></tr><tr><td>ЧТ</td><td><select><option selected="true">Рабочий день (с 9 до 18 с перерывом на обед)</option><option>Сокращенный рабочий день (с 9 до 12 без обеда)</option><option>Выходной день</option></select></td><td><i class="fa fa-plus" aria-hidden="true"></i></td></tr><tr><td>ПТ</td><td><select><option>Рабочий день (с 9 до 18 с перерывом на обед)</option><option selected="true">Сокращенный рабочий день (с 9 до 12 без обеда)</option><option>Выходной день</option></select></td><td><i class="fa fa-plus" aria-hidden="true"></i></td></tr><tr><td>СБ</td><td><select><option>Рабочий день (с 9 до 18 с перерывом на обед)</option><option>Сокращенный рабочий день (с 9 до 12 без обеда)</option><option selected="true">Выходной день</option></select></td><td><i class="fa fa-plus" aria-hidden="true"></i></td></tr><tr><td>ВС</td><td><select><option>Рабочий день (с 9 до 18 с перерывом на обед)</option><option>Сокращенный рабочий день (с 9 до 12 без обеда)</option><option selected="true">Выходной день</option></select></td><td><i class="fa fa-plus" aria-hidden="true"></i></td></tr></table></div><p class="nvx-suo-check"><input type="checkbox" id="nvx-suo-template-default">Применять этот шаблон для создания расписания по-умолчанию</p><div class="nvx-suo-actions"><a class="nvx-suo-button" id="nvx-suo-template-save"><i class="fa fa-check" aria-hidden="true"></i>Сохранить</a><a class="nvx-suo-button-minor" id="cancel-place"><i class="fa fa-ban" aria-hidden="true"></i>Отмена</a><a class="nvx-suo-admin-link" id="my-places">Назад к списку организаций</a></div>';

  $(".nvx-suo-admin").html(content);
  if(template != null) {
    $("#nvx-suo-template-name").val(template.recName);
    $("#nvx-suo-template-default").prop("checked", template.isDefault);
    $("#nvx-suo-template-time").val(template.defaultSlotLength);
  };

  var names = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

  var contentHtml = "";
  for (var i = 0; i < 7; i++) {
    contentHtml += '<tr>';
    contentHtml += '<td>'+names[i]+'</td>';
    contentHtml += '<td>';
    contentHtml += '<select id="nxv-suo-day'+i+'">';

    $.each(dayList, function(index, day) {
      console.log(day);
      var selected = '';
      if(template != null) {
        if(template.days[i] == day.recId)
          selected = 'selected="true"';
      };

      contentHtml += '<option '+ selected +' value="'+day.recId+'">' + day.recName + '</option>';

    });

    if(template.days[i] == null) {
      contentHtml += '<option selected="true" value="null">Выходной день</option>';
    } else {
      contentHtml += '<option value="null">Выходной день</option>';
    };

    contentHtml += '</select>';
    contentHtml += '</td>';
    contentHtml += '<td class="nvx-suo-new-day"><i class="fa fa-plus" aria-hidden="true"></i></td>';
    contentHtml += '</tr>';
  }

  $("#nvx-suo-templates-table").html(contentHtml);
  $("#my-places").click(SuoAdminModule.getPlaces);

  $(".nvx-suo-new-day").click(function() {
    SuoAdminModule.editDayView(null, template.placeId);
  });

  $("#nvx-suo-template-save").click(function() {

    $.ajax({
      headers: { 'app_id': SuoAdminModule.app_id, 'user_token' : SuoAdminModule.userToken, 'Content-Type' : 'application/json' },
      type: "POST",
      contentType: "application/json",
      url: SuoAdminModule.host + "v1/admin/schtemplate/addorupdate",
      data: JSON.stringify({
        "recId": template == null ? null : template.recId,
        "recName": $("#nvx-suo-template-name").val(),
        "isDefault": $("#nvx-suo-template-default").is(':checked'),
        "placeId": placeId,
        "defaultSlotLength": parseInt($("#nvx-suo-template-time").val(), 10),
        "days": [
          $("#nxv-suo-day0").val() == "null" ? null : $("#nxv-suo-day0").val(),
          $("#nxv-suo-day1").val() == "null" ? null : $("#nxv-suo-day1").val(),
          $("#nxv-suo-day2").val() == "null" ? null : $("#nxv-suo-day2").val(),
          $("#nxv-suo-day3").val() == "null" ? null : $("#nxv-suo-day3").val(),
          $("#nxv-suo-day4").val() == "null" ? null : $("#nxv-suo-day4").val(),
          $("#nxv-suo-day5").val() == "null" ? null : $("#nxv-suo-day5").val(),
          $("#nxv-suo-day6").val() == "null" ? null : $("#nxv-suo-day6").val()
        ]
      }),
      dataType: 'json'
    })
    .done(function (data, status, jqxhr) {
      console.log('done!');
      console.log(data);

      if(data.result == true){
        SuoAdminModule.getTemplates(placeId);
      } else {
        alert("Ошибка создания/изменения расписания!");
      };
    })
    .fail(function() {
      alert("Ошибка!");
    });

  });
};

SuoAdminModule.myDaysView = function(days, placeId) {
  console.log("myDaysView");

  var content = '<h1>Настройки расписания</h1><h2>Настройки расписания на день</h2><div class="nvx-suo-tab-block"><a class="nvx-suo-tab" id="nvx-suo-tab-holydays">Текущее расписание</a><a class="nvx-suo-tab-active" id="nvx-suo-tab-sched">Управление расписанием</a></div><table cellspacing="0" cellpadding="0" id="nvx-suo-days"><tbody><tr><td>Рабочий день (с 9:00 до 18:00 с перерывом на обед)</td><td><div class="dropdown"><i class="fa fa-ellipsis-v dropbtn" aria-hidden="true"></i><div class="dropdown-content"><a href="#">Изменить</a><a href="#">Удалить</a></div></div></td></tr><tr><td>Сокращенный рабочий день (с 9:00 до 12:00 без обеда)</td><td><div class="dropdown"><i class="fa fa-ellipsis-v dropbtn" aria-hidden="true"></i><div class="dropdown-content"><a href="#">Изменить</a><a href="#">Удалить</a></div></div></td></tr><tr><td>Выходной день</td><td><div class="dropdown"><i class="fa fa-ellipsis-v dropbtn" aria-hidden="true"></i><div class="dropdown-content"><a href="#">Изменить</a><a href="#">Удалить</a></div></div></td></tr></tbody></table><div class="nvx-suo-actions"><a class="nvx-suo-button" id="nvx-suo-day-add"><i class="fa fa-plus-circle" aria-hidden="true"></i>Добавить</a><a class="nvx-suo-admin-link" id="my-places">Назад к списку организаций</a></div>';
  $(".nvx-suo-admin").html(content);

  $("#my-places").click(SuoAdminModule.getPlaces);

  var daysHtml = '';
  $.each(days, function(index, day) {
    daysHtml += '<tr>';
    daysHtml += '<td>'+ day.recName +'</td>';
    daysHtml += '<td>'
    daysHtml += '<div class="dropdown">'
    daysHtml += '<i class="fa fa-ellipsis-v dropbtn" aria-hidden="true"></i>'
    daysHtml += '<div class="dropdown-content">'
    daysHtml += '<input type="hidden" value="' + day.recId + '">';
    daysHtml += '<a class="nvx-suo-day-edit" href="#">Изменить</a>'
    daysHtml += '<a class="nvx-suo-day-remove" href="#">Удалить</a>'
    daysHtml += '</div>'
    daysHtml += '</div>'
    daysHtml += '</td>'
    daysHtml += '</tr>'
  });

  $("#nvx-suo-days").html(daysHtml);

  $(".nvx-suo-day-edit").click(function() {
    console.log('click!');

    var id = $(this).siblings('input').val();
    console.log(id);

    var day = SuoAdminModule.dayList.find(function(element, index, array){
      return (element.recId == id);
    });

    SuoAdminModule.editDayView(day, placeId);
  });

  $(".nvx-suo-day-remove").click(function() {
    console.log("day delete click!");
    var id = $(this).siblings('input').val();

    $.ajax({
    headers: { 'app_id': SuoAdminModule.app_id, 'user_token' : SuoAdminModule.userToken, 'Content-Type' : 'application/json' },
      url: SuoAdminModule.host + 'v1/admin/schday/delete/' + id,
      type: 'DELETE',
      success: function(result) {
        console.log("delete success");
        console.log(result);
        SuoAdminModule.getTemplateDays(placeId);
      }
    });
  });

  $("#nvx-suo-day-add").click(function() {
    SuoAdminModule.editDayView(null, placeId);
  });

  $("#nvx-suo-tab-holydays").click(function() {
    SuoAdminModule.myCalendarView(placeId, days);
  });

  $("#nvx-suo-tab-sched").click(function() {
    SuoAdminModule.getTemplateDays(placeId);
  });
};

SuoAdminModule.editDayView = function(day, placeId) {
  console.log("--> editDayView()");

  var content = '<h1>Изменение расписания на день</h1><p>Наименование дня:<span>*</span><input type="text" id="nvx-suo-day-name" value=""></p><div class="nvx-suo-block"><p>Рабочее время:<span>*</span></p><p>Начало рабочего дня <input type="text" id="nvx-suo-day-start"> Окончание рабочего дня <input type="text" id="nvx-suo-day-end"></p></div><div class="nvx-suo-block"><p><input type="checkbox" id="nvx-suo-day-break">Перерыв на обед</p><p>Начало перерыва <input type="text" id="nvx-suo-day-break-start"> Окончание перерыва <input type="text" id="nvx-suo-day-break-end"></p></div><div class="nvx-suo-block"><p><input type="checkbox" id="nvx-suo-day-inherit">Наследовать от шаблона</p><p>Продолжительность приема одного посетителя (в мин.) <input type="number" id="nvx-suo-day-duration" /></p></div><div class="nvx-suo-actions"><a class="nvx-suo-button" id="nvx-suo-day-save"><i class="fa fa-check" aria-hidden="true"></i>Сохранить</a><a class="nvx-suo-button-minor" id="nvx-suo-day-cancel"><i class="fa fa-ban" aria-hidden="true"></i>Отмена</a><a class="nvx-suo-admin-link" id="my-places">Назад к списку организаций</a></div>';
  $(".nvx-suo-admin").html(content);

  if(day != null) {
    $("#nvx-suo-day-name").val(day.recName);
    $("#nvx-suo-day-start").val(day.timeStart);
    $("#nvx-suo-day-end").val(day.timeEnd);
    $("#nvx-suo-day-duration").val(day.slotLength);
    $("#nvx-suo-day-break-start").val(day.breakStart);
    $("#nvx-suo-day-break-end").val(day.breakEnd);
    $("#nvx-suo-day-inherit").prop("checked", day.isInheritSlotlength);
    $("#nvx-suo-day-break").prop("checked", day.isBreakeExists);
  };

  $("#my-places").click(SuoAdminModule.getPlaces);
  $("#nvx-suo-day-cancel").click(function() {
      SuoAdminModule.getTemplateDays(placeId);
  });
  $("#nvx-suo-day-save").click(function() {
    console.log("click!");
    console.log(placeId);
    console.log(day);

    $.ajax({
      headers: { 'app_id': SuoAdminModule.app_id, 'user_token' : SuoAdminModule.userToken, 'Content-Type' : 'application/json' },
      type: "POST",
      contentType: "application/json",
      url: SuoAdminModule.host + "v1/admin/schday/addorupdate",
      data: JSON.stringify({
        "recId": day == null ? null : day.recId,
        "recName": $("#nvx-suo-day-name").val(),
        "timeStart": $("#nvx-suo-day-start").val(),
        "timeEnd": $("#nvx-suo-day-end").val(),
        "isBreakeExists": $("#nvx-suo-day-break").is(':checked'),
        "breakStart": $("#nvx-suo-day-break-start").val(),
        "breakEnd": $("#nvx-suo-day-break-end").val(),
        "isInheritSlotlength": $("#nvx-suo-day-inherit").is(':checked'),
        "slotLength": parseInt($("#nvx-suo-day-duration").val(), 10),
        "placeId": placeId
      }),
      dataType: 'json'
    })
    .done(function (data, status, jqxhr) {
      console.log('done!');
      console.log(data);

      SuoAdminModule.getTemplateDays(placeId);
    })
    .fail(function() {
      alert("Ошибка!");
    });
  });
};

SuoAdminModule.placeSettings = function() {
  console.log("--> placeSettings()");

  var content = '<h1>Администрирование и настройка</h1><h2>Расширенные настройки организации "МФЦ г.Владимир (Октябрьский пр-т)"</h2><label>Тип организации</label><select><option>МФЦ</option></select><label>Email для рассылки уведомлений</label><input type="text" name="" value="inf@mfc.ru"><label>Официальный представитель организации</label><input type="text" name="" value="Иванов Иван Иванович"><label>Сайт организации</label><input type="text" name="" value="mfc.ru"><div class="nvx-suo-actions"><a class="nvx-suo-button" href="#"><i class="fa fa-check" aria-hidden="true"></i>Сохранить</a><a class="nvx-suo-button-minor"><i class="fa fa-ban" aria-hidden="true"></i>Отмена</a><a class="nvx-suo-admin-link" id="my-places">Назад к списку организаций</a></div>';
  $(".nvx-suo-admin").html(content);

  $("#my-places").click(SuoAdminModule.getPlaces);
};

SuoAdminModule.getPlaces = function() {
  console.log("--> getPlaces()");

  $.ajax({
    headers: { "user_token" : SuoAdminModule.userToken, 'app_id': SuoAdminModule.app_id },
    url: SuoAdminModule.host + "v1/admin/place/getplaces",
    dataType: 'json',
  })
  .done(function (data, status, jqxhr) {
    console.log("getPlaces done!");
    console.log(data);

    SuoAdminModule.placeList = data.placeList;
    SuoAdminModule.myPlacesView(data);

  })
  .fail(function() {
    alert("Admin: Ошибка получения списка организаций!");
  });
};

/* Получение шаблонов */
SuoAdminModule.getTemplates = function(placeId) {
  console.log("getTemplates()");

  $.ajax({
    headers: { "user_token" : SuoAdminModule.userToken, 'app_id': SuoAdminModule.app_id },
    url: SuoAdminModule.host + "v1/admin/schtemplate/getlist/" + placeId,
    dataType: 'json',
  })
  .done(function (data, status, jqxhr) {
    console.log("getTemplates done!");
    console.log(data);

    SuoAdminModule.myTemplatesView(data, placeId);
  })
  .fail(function() {
    alert("Admin: Ошибка получения шаблонов!");
  })
};

/* Получение шаблонов-дней */
SuoAdminModule.getTemplateDays = function(placeId) {
  console.log("getTemplateDays");

  $.ajax({
    headers: { "user_token" : SuoAdminModule.userToken, 'app_id': SuoAdminModule.app_id },
    url: SuoAdminModule.host + "v1/admin/schday/getlist/" + placeId,
    dataType: 'json',
  })
  .done(function (data, status, jqxhr) {
    console.log("getTemplateDays done!");
    console.log(data);

    SuoAdminModule.dayList = data;

    SuoAdminModule.myDaysView(data, placeId);
  })
  .fail(function() {
    alert("Admin: Ошибка получения шаблонов дней!");
  })
};

SuoAdminModule.myCalendarView = function(placeId, days) {
  var content = '<h1>Настройки расписания</h1><h2>Настройки нерабочих и праздничных дней</h2><div class="nvx-suo-tab-block"><a class="nvx-suo-tab-active" id="nvx-suo-tab-holydays">Текущее расписание</a><a class="nvx-suo-tab" id="nvx-suo-tab-sched">Управление расписанием</a></div><div id="nvx-suo-datepicker"></div><div><p>Статус дня:</p><select id="nvx-suo-excl"><option>Рабочий день</option><option>Выходной день</option></select></div><div class="nvx-suo-actions"><a class="nvx-suo-button">Сохранить</a><a class="nvx-suo-admin-link" id="my-places">Назад к списку организаций</a></div>';
  $(".nvx-suo-admin").html(content);

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

  $("#nvx-suo-datepicker").datepicker({
        showOtherMonths: true,
        beforeShowDay: $.datepicker.noWeekends,
        dateFormat: 'yy-mm-dd'
  });

  var options = '';
  $.each(days, function(index, day) {
      options += '<option value="'+day.recId+'">' + day.recName + '</option>';
  });
  options += '<option value="null">Выходной день</option>';
  $("#nvx-suo-excl").html(options);

  SuoAdminModule.getExcl(placeId);

  $("#my-places").click(SuoAdminModule.getPlaces);

  $("#nvx-suo-tab-holydays").click(function() {
    SuoAdminModule.myCalendarView(placeId, days);
  });

  $("#nvx-suo-tab-sched").click(function() {
    SuoAdminModule.getTemplateDays(placeId);
  });

  $("#nvx-suo-excl").change(function() {
    console.log("change");

    $.ajax({
      headers: { 'app_id': SuoAdminModule.app_id, 'user_token' : SuoAdminModule.userToken, 'Content-Type' : 'application/json' },
      type: "POST",
      contentType: "application/json",
      url: SuoAdminModule.host + "v1/admin/schtemplateexcl/addorupdate",
      data: JSON.stringify({
        "recId": null,
        "recName": "Test",
        "placeId": placeId,
        "date": $("#nvx-suo-datepicker").val() + "T00:00:00",
        "isOfficialHoliday": true,
        "dayRuleId": $("#nvx-suo-excl").val() == "null" ? null : $("#nvx-suo-excl").val()
      }),
      dataType: 'json'
    })
    .done(function (data, status, jqxhr) {
      console.log('done!');
      console.log(data);
    })
    .fail(function() {
      alert("Ошибка!");
    });

  });
};

SuoAdminModule.getExcl = function(placeId) {
  console.log("SuoAdminModule.getExcl");

  $.ajax({
    headers: { "user_token" : SuoAdminModule.userToken, 'app_id': SuoAdminModule.app_id },
    url: SuoAdminModule.host + "v1/admin/schtemplateexcl/getlist/" + placeId,
    dataType: 'json',
  })
  .done(function (data, status, jqxhr) {
    console.log("getExcl done!");
    console.log(data);

    var holidays = [];
    $.each(data, function(index, day) {
      holidays.push(day.date.substring(0, 10));
    });

    console.log(holidays);

    $('#nvx-suo-datepicker').datepicker("option", "beforeShowDay", function(date){
      var datestring = jQuery.datepicker.formatDate('yy-mm-dd', date);

      // get template by id

      if(holidays.indexOf(datestring) != -1)
        return [true, 'nvx-suo-datepicker-holiday', 'Выходной день'];
      else return [true];
    });

  })
  .fail(function() {
    alert("Admin: Ошибка получения исключений!");
  })
};

$(document).ready(function() {
  SuoAdminModule.init(SuoSettings);
  SuoAdminModule.userToken = suo_user_token_response.recId;
  SuoAdminModule.getPlaces();
});
