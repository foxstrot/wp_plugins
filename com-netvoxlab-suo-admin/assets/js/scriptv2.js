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

SuoAdminModule.myPlaces = function(places) {
  console.log("--> myPlaces()");

  var content = '<h1>Администрирование и настройка</h1><h2>Мои организации</h2><table id="nvx-suo-admin-places" cellspacing="0" cellpadding="0"><tbody><tr><td>МФЦ г.Владимир (Октябрьский пр-т)</td><td><div class="dropdown"><i class="fa fa-ellipsis-v dropbtn" aria-hidden="true"></i><div class="dropdown-content"><a href="#">Изменить</a><a href="#">Расписание</a><a href="#">Удалить</a></div></div></td></tr><tr><td class="nvx-suo-draft">МФЦ г.Хрустальный (черновик)</td><td><div class="dropdown"><i class="fa fa-ellipsis-v dropbtn" aria-hidden="true"></i><div class="dropdown-content"><a href="#">Изменить</a><a href="#">Расписание</a><a href="#">Удалить</a></div></div></td></tr><tr><td class="nvx-suo-draft">МАУ МФЦ Алексеевского района (черновик)</td><td><div class="dropdown"><i class="fa fa-ellipsis-v dropbtn" aria-hidden="true"></i><div class="dropdown-content"><a href="#">Изменить</a><a href="#">Расписание</a><a href="#">Удалить</a></div></div></td></tr></tbody></table><div class="nvx-suo-actions"><a class="nvx-suo-button" id="create-place"><i class="fa fa-plus-circle" aria-hidden="true"></i>Добавить</a><a class="nvx-suo-admin-link" id="edit-template">Редактировать шаблон</a><a class="nvx-suo-admin-link" id="edit-day">Редактировать день</a><a class="nvx-suo-admin-link" id="place-settings">Настройки организации</a><a class="nvx-suo-admin-link" id="my-schedules">Мои расписания</a><a class="nvx-suo-admin-link" id="my-templates">Мои шаблоны</a></div><br><p>HTML-код для вставки виджета:</p><textarea><div class="nvx-mfc-suo-widget"></div><script type="text/javascript">SuoSettings = {};SuoSettings.host = "http://sqtest.egspace.ru/";SuoSettings.app_id = "5e07086e-7326-43d4-8c70-1631b4b4af82";SuoSettings.region_id = "1cc12792-fb12-41f4-b9c5-363087a7dc6d";</script><script type="text/javascript" src="http://widgets.mfc.ru/nvx-suo-widget/widget.js"></script></textarea>';

  $(".nvx-suo-admin").html(content);

  var placesHtml = '';
  $.each(places.placeList, function(index, place) {
    console.log("Index = " + index);
    console.log(place);
    placesHtml += '<tr>';
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

  $("#create-place").click(SuoAdminModule.createPlace);
  $("#edit-template").click(SuoAdminModule.editTemplate);
  $("#edit-day").click(SuoAdminModule.editDay);
  $("#place-settings").click(SuoAdminModule.placeSettings);
  $("#my-schedules").click(SuoAdminModule.mySchedules);
  $("#my-templates").click(SuoAdminModule.myTemplates);

  $(".nvx-suo-admin-editlink").click(function(){
    var id = $(this).siblings('input').val();
    console.log(id);

    SuoAdminModule.updatePlace(id);
  });
  $(".nvx-suo-admin-schedlink").click(function(){
    var value = $(this).siblings('input').val();
    console.log(value);

    SuoAdminModule.myTemplates();
  });
  $(".nvx-suo-admin-removelink").click(function(){
    var id = $(this).siblings('input').val();
    console.log(id);

    $.ajax({
    headers: { 'app_id': SuoAdminModule.app_id, 'user_token' : SuoAdminModule.userToken, 'Content-Type' : 'application/json' },
      url: SuoAdminModule.host + '/v1/admin/place/delete/' + id,
      type: 'DELETE',
      success: function(result) {
        console.log("delete success");
        console.log(result);
        SuoAdminModule.adminGetPlaces();
      }
    });
  });
};

SuoAdminModule.createPlace = function() {
  console.log("--> createPlace()");

  var content = '<h1>Администрирование и настройка</h1><h2>Добавление (изменение) организации</h2><label>Полное название организации</label><input type="text" id="nvx-suo-admin-name" placeholder="Введите полное название организации"><label>Краткое название организации</label><input type="text" id="nvx-suo-admin-short" placeholder="Введите краткое название организации"><label>Адрес</label><input type="text" id="nvx-suo-admin-address" placeholder="Введите адрес организации"><label>Email</label><input type="text" id="nvx-suo-admin-email" placeholder="company@mail.com"><label>Телефон</label><input type="text" id="nvx-suo-admin-phone" placeholder="8 (1234) 56789"><label><input type="checkbox" id="nvx-suo-admin-enable" name="">Черновик <span>(В режиме черновика организация недоступна для выбора пользователям)</span></label><div class="nvx-suo-actions"><a class="nvx-suo-button" id="save-place"><i class="fa fa-check" aria-hidden="true"></i>Сохранить</a><a class="nvx-suo-button-minor" id="cancel-place"><i class="fa fa-ban" aria-hidden="true"></i>Отмена</a><div class="nvx-suo-admin-additional"><a class="nvx-suo-admin-link" id="place-settings"><i class="fa fa-cog" aria-hidden="true"></i>Дополнительно</a><a class="nvx-suo-admin-link" id="my-templates"><i class="fa fa-calendar" aria-hidden="true"></i>Расписание</a><a class="nvx-suo-admin-link" id="my-places">Назад к списку организаций</a></div></div>';

  $(".nvx-suo-admin").html(content);
  $("#place-settings").click(SuoAdminModule.placeSettings);
  $("#my-templates").click(SuoAdminModule.myTemplates);
  $("#cancel-place").click(SuoAdminModule.adminGetPlaces);
  $("#save-place").click(SuoAdminModule.adminCreatePlace);
  $("#my-places").click(SuoAdminModule.adminGetPlaces);
  //TODO other elements

};

SuoAdminModule.editTemplate = function() {
  console.log("--> editTemplate()");

  var content = '<h1>Администрирование и настройка</h1><h2>Изменение шаблона расписания организации</h2><p>Название шаблона:<span>*</span><input type="text" placeholder="Введите название шаблона" /></p><p>Продолжительность приема одного посетителя (в мин.):<span>*</span><input type="number" value="15" required></p><div class="nvx-suo-templates"><table cellpadding="0" cellspacing="0"><tr><td>ПН</td><td><select><option selected="true">Рабочий день (с 9 до 18 с перерывом на обед)</option><option>Сокращенный рабочий день (с 9 до 12 без обеда)</option><option>Выходной день</option></select></td><td><i class="fa fa-plus" aria-hidden="true"></i></td></tr><tr><td>ВТ</td><td><select><option selected="true">Рабочий день (с 9 до 18 с перерывом на обед)</option><option>Сокращенный рабочий день (с 9 до 12 без обеда)</option><option>Выходной день</option></select></td><td><i class="fa fa-plus" aria-hidden="true"></i></td></tr><tr><td>СР</td><td><select><option selected="true">Рабочий день (с 9 до 18 с перерывом на обед)</option><option>Сокращенный рабочий день (с 9 до 12 без обеда)</option><option>Выходной день</option></select></td><td><i class="fa fa-plus" aria-hidden="true"></i></td></tr><tr><td>ЧТ</td><td><select><option selected="true">Рабочий день (с 9 до 18 с перерывом на обед)</option><option>Сокращенный рабочий день (с 9 до 12 без обеда)</option><option>Выходной день</option></select></td><td><i class="fa fa-plus" aria-hidden="true"></i></td></tr><tr><td>ПТ</td><td><select><option>Рабочий день (с 9 до 18 с перерывом на обед)</option><option selected="true">Сокращенный рабочий день (с 9 до 12 без обеда)</option><option>Выходной день</option></select></td><td><i class="fa fa-plus" aria-hidden="true"></i></td></tr><tr><td>СБ</td><td><select><option>Рабочий день (с 9 до 18 с перерывом на обед)</option><option>Сокращенный рабочий день (с 9 до 12 без обеда)</option><option selected="true">Выходной день</option></select></td><td><i class="fa fa-plus" aria-hidden="true"></i></td></tr><tr><td>ВС</td><td><select><option>Рабочий день (с 9 до 18 с перерывом на обед)</option><option>Сокращенный рабочий день (с 9 до 12 без обеда)</option><option selected="true">Выходной день</option></select></td><td><i class="fa fa-plus" aria-hidden="true"></i></td></tr></table></div><p class="nvx-suo-check"><input type="checkbox" name="">Применять этот шаблон для создания расписания по-умолчанию</p><div class="nvx-suo-actions"><a class="nvx-suo-button" id="save-place"><i class="fa fa-check" aria-hidden="true"></i>Сохранить</a><a class="nvx-suo-button-minor" id="cancel-place"><i class="fa fa-ban" aria-hidden="true"></i>Отмена</a><a class="nvx-suo-admin-link" id="my-places">Назад к списку организаций</a></div>';

  $(".nvx-suo-admin").html(content);

  $("#my-places").click(SuoAdminModule.adminGetPlaces);
  //TODO other elements
};

SuoAdminModule.editDay = function() {
  console.log("--> editDay()");

  var content = '<h1>Изменение расписания на день</h1><p>Наименование дня:<span>*</span><input type="text" value="Рабочий день с 9:00 до 18:00"></p><div class="nvx-suo-block"><p>Рабочее время:<span>*</span></p><p>Начало рабочего дня <input type="text" name="start"> Окончание рабочего дня <input type="text" name="end"></p></div><div class="nvx-suo-block"><p><input type="checkbox" name="break">Перерыв на обед</p><p>Начало перерыва <input type="text" name="start"> Окончание перерыва <input type="text" name="end"></p></div><div class="nvx-suo-block"><p><input type="checkbox" name="">Наследовать от шаблона</p><p>Продолжительность приема одного посетителя (в мин.) <input type="number" name="time" /></p></div><div class="nvx-suo-actions"><a class="nvx-suo-button" href="#">Сохранить</a><a class="nvx-suo-button-minor" href="#">Отмена</a><a class="nvx-suo-admin-link" id="my-places">Назад к списку организаций</a></div>';
  $(".nvx-suo-admin").html(content);

  $("#my-places").click(SuoAdminModule.adminGetPlaces);

};

SuoAdminModule.placeSettings = function() {
  console.log("--> placeSettings()");

  var content = '<h1>Администрирование и настройка</h1><h2>Расширенные настройки организации "МФЦ г.Владимир (Октябрьский пр-т)"</h2><label>Тип организации</label><select><option>МФЦ</option></select><label>Email для рассылки уведомлений</label><input type="text" name="" value="inf@mfc.ru"><label>Официальный представитель организации</label><input type="text" name="" value="Иванов Иван Иванович"><label>Сайт организации</label><input type="text" name="" value="mfc.ru"><div class="nvx-suo-actions"><a class="nvx-suo-button" href="#"><i class="fa fa-check" aria-hidden="true"></i>Сохранить</a><a class="nvx-suo-button-minor"><i class="fa fa-ban" aria-hidden="true"></i>Отмена</a><a class="nvx-suo-admin-link" id="my-places">Назад к списку организаций</a></div>';
  $(".nvx-suo-admin").html(content);

  $("#my-places").click(SuoAdminModule.adminGetPlaces);

};

SuoAdminModule.mySchedules = function() {
  console.log("--> mySchedules()");

  var content = '<h1>Настройки расписания</h1><h2>Настройки расписания на день</h2><table cellspacing="0" cellpadding="0"><tbody><tr><td>Рабочий день (с 9:00 до 18:00 с перерывом на обед)</td><td><div class="dropdown"><i class="fa fa-ellipsis-v dropbtn" aria-hidden="true"></i><div class="dropdown-content"><a href="#">Изменить</a><a href="#">Удалить</a></div></div></td></tr><tr><td>Сокращенный рабочий день (с 9:00 до 12:00 без обеда)</td><td><div class="dropdown"><i class="fa fa-ellipsis-v dropbtn" aria-hidden="true"></i><div class="dropdown-content"><a href="#">Изменить</a><a href="#">Удалить</a></div></div></td></tr><tr><td>Выходной день</td><td><div class="dropdown"><i class="fa fa-ellipsis-v dropbtn" aria-hidden="true"></i><div class="dropdown-content"><a href="#">Изменить</a><a href="#">Удалить</a></div></div></td></tr></tbody></table><div class="nvx-suo-actions"><a class="nvx-suo-button" href="#">Добавить</a><a class="nvx-suo-admin-link" id="my-places">Назад к списку организаций</a></div>';
  $(".nvx-suo-admin").html(content);
  $("#my-places").click(SuoAdminModule.adminGetPlaces);

};

SuoAdminModule.myTemplates = function() {
  console.log("--> myTemplates()");

  var content = '<h1>Администрирование и настройка</h1><h2>Шаблоны расписания организации "МФЦ г.Владимир (Октябрьский пр-т)"</h2><table cellspacing="0" cellpadding="0"><tbody><tr><td><label><input type="radio" name="rd">Обычное расписание организации</label></td><td><div class="dropdown"><i class="fa fa-ellipsis-v dropbtn" aria-hidden="true"></i><div class="dropdown-content"><a href="#">Изменить</a><a href="#">Расписание</a><a href="#">Удалить</a></div></div></td></tr><tr><td><label><input type="radio" name="rd">Расписание для Госуслуг слабослышащих граждан</label></td><td><div class="dropdown"><i class="fa fa-ellipsis-v dropbtn" aria-hidden="true"></i><div class="dropdown-content"><a href="#">Изменить</a><a href="#">Расписание</a><a href="#">Удалить</a></div></div></td></tr><tr><td><label><input type="radio" name="rd">Расписание для услуг Росжелдора</label></td><td><div class="dropdown"><i class="fa fa-ellipsis-v dropbtn" aria-hidden="true"></i><div class="dropdown-content"><a href="#">Изменить</a><a href="#">Расписание</a><a href="#">Удалить</a></div></div></td></tr></tbody></table><div class="nvx-suo-actions"><a class="nvx-suo-button" id="new-template"><i class="fa fa-plus-circle" aria-hidden="true"></i>Добавить</a><a class="nvx-suo-button-minor" id="schedule-settings"><i class="fa fa-cog" aria-hidden="true"></i>Настройки расписания</a><a class="nvx-suo-admin-link" id="my-places">Назад к списку организаций</a></div>';
  $(".nvx-suo-admin").html(content);

  $("#new-template").click(SuoAdminModule.editTemplate);
  $("#schedule-settings").click(SuoAdminModule.mySchedules);
  $("#my-places").click(SuoAdminModule.adminGetPlaces);

};

SuoAdminModule.adminGetPlaces = function() {
  console.log("--> adminGetPlaces()");

  $.ajax({
    headers: { "user_token" : SuoAdminModule.userToken, 'app_id': SuoAdminModule.app_id },
    url: SuoAdminModule.host + "v1/admin/place/getplaces",
    dataType: 'json',
  })
  .done(function (data, status, jqxhr) {
    console.log("adminGetPlaces done!");
    console.log(data);

    SuoAdminModule.placeList = data.placeList;
    SuoAdminModule.myPlaces(data);

  })
  .fail(function() {
    alert("Admin: Ошибка получения списка организаций!");
  });
};

SuoAdminModule.updatePlace = function(placeId) {
  console.log("--> updatePlace()");

  var content = '<h1>Администрирование и настройка</h1><h2>Добавление (изменение) организации</h2><label>Полное название организации</label><input type="text" id="nvx-suo-admin-name" placeholder="Введите полное название организации"><label>Краткое название организации</label><input type="text" id="nvx-suo-admin-short" placeholder="Введите краткое название организации"><label>Адрес</label><input type="text" id="nvx-suo-admin-address" placeholder="Введите адрес организации"><label>Email</label><input type="text" id="nvx-suo-admin-email" placeholder="company@mail.com"><label>Телефон</label><input type="text" id="nvx-suo-admin-phone" placeholder="8 (1234) 56789"><label><input type="checkbox" id="nvx-suo-admin-enable" name="">Черновик <span>(В режиме черновика организация недоступна для выбора пользователям)</span></label><div class="nvx-suo-actions"><a class="nvx-suo-button" id="save-place"><i class="fa fa-check" aria-hidden="true"></i>Сохранить</a><a class="nvx-suo-button-minor" id="cancel-place"><i class="fa fa-ban" aria-hidden="true"></i>Отмена</a><div class="nvx-suo-admin-additional"><a class="nvx-suo-admin-link" id="place-settings"><i class="fa fa-cog" aria-hidden="true"></i>Дополнительно</a><a class="nvx-suo-admin-link" id="my-templates"><i class="fa fa-calendar" aria-hidden="true"></i>Расписание</a><a class="nvx-suo-admin-link" id="my-places">Назад к списку организаций</a></div></div>';

  $(".nvx-suo-admin").html(content);
  $("#place-settings").click(SuoAdminModule.placeSettings);
  $("#my-templates").click(SuoAdminModule.myTemplates);
  $("#cancel-place").click(SuoAdminModule.adminGetPlaces);
  $("#save-place").click(SuoAdminModule.adminCreatePlace);
  $("#my-places").click(SuoAdminModule.adminGetPlaces);

  var place = SuoAdminModule.placeList.find(function(element, index, array){
    return (element.recId == placeId);
  });

  $("#nvx-suo-admin-name").val(place.name);
  $("#nvx-suo-admin-short").val(place.shortName);
  $("#nvx-suo-admin-address").val(place.address);
  $("#nvx-suo-admin-email").val(place.placeEmail);
  $("#nvx-suo-admin-phone").val(place.phones);

};

SuoAdminModule.adminCreatePlace = function() {
  console.log("--> adminCreatePlace()");
  console.log(SuoAdminModule.app_id);
  console.log(SuoAdminModule.userToken);
  $.ajax({
    headers: { 'app_id': SuoAdminModule.app_id, 'user_token' : SuoAdminModule.userToken, 'Content-Type' : 'application/json' },
    type: "POST",
    contentType: "application/json",
    url: SuoAdminModule.host + "v1/admin/place/addorupdate",
    data: JSON.stringify({
      "recId": null,
      "id": null,
      "name": $("#nvx-suo-admin-name").val(),
      "attributes": {},
      "shortName": $("#nvx-suo-admin-short").val(),
      "groupName": "Владимирская область",
      "address": $("#nvx-suo-admin-address").val(),
      "isEnabled": true,
      "contactInfo": "info",
      "engineId": "7975131d-dc70-467e-a0b9-673b893e5432",
      "endPoint": "",
      "city": {
        "recId": "d26360df-8f4c-4c75-8a8b-b890d9744cd5",
        "name": "Владимир",
        "childs": null
      },
      "placeTypeId": "866dc938-1d0e-44f3-8709-dd5cd0bd6901",
      "placeEmail": $("#nvx-suo-admin-email").val(),
      "placeSubEmail": "",
      "headPerson": "",
      "site": "http://www.umfc.avo.ru/index.htm",
      "phones": $("#nvx-suo-admin-phone").val(),
      "fiasId": null,
      "regionId": "59edbd09-d885-4584-a2f2-2d0dfb53839f"
      }),
      dataType: 'json'
  })
  .done(function (data, status, jqxhr) {
    console.log('adminCreatePlace done!');
    console.log(data);

    SuoAdminModule.adminGetPlaces();

  })
  .fail(function() {
    alert("Ошибка!");
  });
};

SuoAdminModule.adminUpdatePlace = function() {
  
};


$(document).ready(function() {
  SuoAdminModule.init(SuoSettings);

  SuoAdminModule.userToken = suo_user_token_response.recId;
  
  SuoAdminModule.adminGetPlaces();

});
