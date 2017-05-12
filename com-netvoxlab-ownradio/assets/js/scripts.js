document.addEventListener('DOMContentLoaded', function() {
    nvxInitJSFuncs();
}, false);

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function getCookie(name) {
  var matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : undefined;
}

function saveUid(uid){
	var date = new Date;
	date.setTime(date.getTime() + (60*24*60*60*1000));
	document.cookie = 'ownRadioId='+uid+'; expires='+date.toUTCString()+'; path=/';
	localStorage.setItem('ownRadioId', uid);
	sessionStorage.setItem('ownRadioId', uid);
	var deviceName = window.location.host + window.location.pathname + ', ' + browserInfo;
	var apiGetLastTracks = nvxOwnRadioServerUrl + '/devices/' + uid + '/' + deviceName.replace(/([\.$?*|{}\(\)\[\]\\\/\+^$])/g, '.') + '/registerdevice';
		var xhr = new XMLHttpRequest();
		xhr.open('GET', apiGetLastTracks, true);
		xhr.onreadystatechange = function(){
			if (xhr.readyState != 4) return;
			
			if(xhr.status == 200){
			}
		}
		xhr.send();
}

function loadUid(){
	var cookie = getCookie('ownRadioId'),
		local = localStorage.getItem('ownRadioId'),
		session = sessionStorage.getItem('ownRadioId'),
		uid = cookie || local || session || null;

	if( (!cookie || !local || !session) && uid){
		saveUid(uid);
	}

	return uid;
}

var ownRadioId = loadUid(),
	api = nvxOwnRadioServerUrl;//'https://api.ownradio.ru/v4';

if(!ownRadioId){
	ownRadioId = guid();
	saveUid(ownRadioId);
}

var apiNext = api+'/tracks/'+ownRadioId+'/next';

console.log('deviceId: '+ownRadioId);


function player(){
	var obj = {
			play:document.querySelector('#radioPlay'),
			next:document.querySelector('#radioNext'),
			audio:document.createElement('audio'),
			name:document.querySelector('#radioName'),
			group:document.querySelector('#radioGroup')
		},
		prm = {
			play:true,//состояние проигрывание/пауза
			nextTrack:null, //трек к проигрыванию
			waitNext:false, //ожидается получение информации о следующем файле
			ended:false, //файл проигрался до конца
			loadTrack:true //трек только загружен (если да-инициализоровать audio, вывести инфу о треке)
		},
		fnc = {
			play:function(){

				if(!prm.nextTrack && !prm.waitNext){
					fnc.nextTrack();
				} else if(!prm.nextTrack && prm.waitNext) {
					return;
				}

				if(prm.nextTrack){
					if(prm.loadTrack){
						prm.loadTrack = false;
						
						if(prm.play){
							prm.play = false;
							obj.audio.pause();
						}

						prm.ended = false;
						
						obj.name.innerHTML = prm.nextTrack.name;
						obj.group.innerHTML = prm.nextTrack.artist;
						
						obj.audio.src = api+'/tracks/'+prm.nextTrack.id;
						
						// ОБРЕЗАЕМ ИМЯ ТРЕКА ДЛИННЕЕ 26 СИМВОЛОВ
						var strTrakName = document.getElementById('radioName');
						var cutTrakName = strTrakName.innerText;
						var slicedName = cutTrakName.slice(0,20);
						if (slicedName.length < cutTrakName.length) {
							slicedName += '...';
							obj.name.innerHTML = slicedName;
						}

						var strTrakGroup = document.getElementById('radioGroup');
						var cutTrakGroup = strTrakGroup.innerText;
						var slicedGroup = cutTrakGroup.slice(0,26);
						if (slicedGroup.length < cutTrakGroup.length) {
							slicedGroup += '...';
							obj.group.innerHTML = slicedGroup;
						}
					
					//
						console.log('upload path ' + prm.nextTrack.pathupload)
						console.log('time execute: ' + prm.nextTrack.timeexecute)
					}
					
					console.log('play');
					
					prm.play = !prm.play;
					if(prm.play){
						obj.audio.play();
						obj.play.classList.add('pause');
					}else{
						obj.audio.pause();
						obj.play.classList.remove('pause');
					}
				}
			},
			next:function(){
				if(!prm.nextTrack){
					prm.waitNext = true;
					fnc.nextTrack();
				}else{
					//если проигрывался трек - отдаем историю его прослушивания
					if(prm.nextTrack){
						var xhr = new XMLHttpRequest(),
							date = new Date,
							dateFormat = date.getFullYear()+'-'+(date.getMonth()<9?'0'+(date.getMonth()+1):date.getMonth()+1)+'-'+date.getDate()+"T"+
										(date.getHours()<10?'0'+date.getHours():date.getHours())+':'+
										(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes())+':'+
										(date.getSeconds()<10?'0'+date.getSeconds():date.getSeconds()),
							data = new FormData();
						data.append('isListen',(prm.ended?'1':'-1'));
						data.append('lastListen',dateFormat);
						xhr.open("POST", api+'/histories/'+ownRadioId+'/'+prm.nextTrack.id, true);
						xhr.onreadystatechange = function(){
							if (xhr.readyState != 4) return;
							if(xhr.status == 200){
								console.log('Данные о треке записаны в историю');
								
							}else{
								console.log('Ошибка отправки данных о треке.');

							}
						}
						xhr.send(data);
					}

					prm.waitNext = false;
					prm.nextTrack = null;
					fnc.play();
				}
			},
			ended:function(){
				prm.ended = true;
				prm.play = false;
				fnc.next();
			},
			nextTrack:function(){
				prm.waitNext = true;
					var xhr = new XMLHttpRequest();
					xhr.open('GET', apiNext, true);
					xhr.onreadystatechange = function(){
						if (xhr.readyState != 4) return;

						if(xhr.status == 200){
							prm.nextTrack = JSON.parse(xhr.response);

							if(!prm.nextTrack){
								//todo
								if (obj.name == null) {
									fnc.init();									
								}
								if (obj.name != null) {
									obj.name.innerHTML = prm.nextTrack.name;
									obj.group.innerHTML = prm.nextTrack.artist;
									obj.audio.src = api+'/tracks/'+prm.nextTrack.id;
									console.log('upload path' + prm.nextTrack.pathupload)
								}								
							}
							prm.waitNext = false;
							prm.loadTrack = true;
							fnc.play();
						}else{
							console.log('Ошибка получения данных с сервера.');
							console.log(xhr);
						}
					}
					xhr.send();
			},
			init: function() {
				obj = {
					play:document.querySelector('#radioPlay'),
					next:document.querySelector('#radioNext'),
					audio:document.createElement('audio'),
					name:document.querySelector('#radioName'),
					group:document.querySelector('#radioGroup')
				};
				if (obj.play != null) {
					obj.play.addEventListener('click', fnc.play);
					obj.next.addEventListener('click', fnc.next);
					obj.audio.onended = fnc.ended;

					obj.name.addEventListener('click', function(){
						var data = prm.nextTrack;
						console.log(data);
					});
				}
				var nvxTxtUserID = document.getElementById('nvxTxtUserID');
				if(nvxTxtUserID != null)
					nvxTxtUserID.value = loadUid();

			}
		}

	
	fnc.init();

	return fnc;
}

var player = player();

	var usersRating = null,
		usersDevices = null,
		lastTracks = null,
		tracksHistory = null,
		lastDevices = null,
		countUsers = -1,
		countTracks = -1,
		deviceid = null,
		userId = null,
		test = null;

		
	function nvxInitJSFuncs(){
		// console.log(window.location.search);
		var params = getParam();
		
		for(var key in params){
			//console.log(key + 's ' + params[key]);
			if(key == 'type' && params[key] == 'listdevice')
					nvxGetLastDevices();
			if(key == 'type' && params[key] == 'listusers')
				if(params['userid']!=null){
					nvxGetUserDevices(params['userid']);
				}
				
			if(key == 'type' && params[key] == 'listtracks')
				if(params['deviceid'] != null){
					nvxGetTracksHistory(params['deviceid'], params['limit']);
				}
				
			if(key == 'type' && params[key] == 'listusersrating')
				if(params['limit'] != null){
					nvxGetUsersRating(params['limit']);
				} else{
					nvxGetUsersRating(-1);
				}
		}
	}
		

	function getParam(){
		var tmp = new Array();      // два вспомагательных    
		var tmp2 = new Array();     // массива    
		var param = new Array();    
				
		var get = window.location.search;  // строка GET запроса    
		if(get != '')    
		{    
			tmp = (get.substr(1)).split('&');   // разделяем переменные    
			for(var i=0; i < tmp.length; i++)    
			{    
				tmp2 = tmp[i].split('=');       // массив param будет содержать    
				param[tmp2[0]] = tmp2[1];       // пары ключ(имя переменной)->значение    
			}    
			var obj = document.getElementById('greq');  // вывод на экран    
		  
			return param;
			// for (var key in param)    
			// {    
				// console.log(key+param[key]);  // здесь мы получаем значение параметра  
			// }     
		}    
	}
	

	//функция просмотра рейтинга пользователей по количеству своих треков и количеству полученных за последние сутки треков
	function nvxGetUsersRating(countUsers) {
	//	var countUsers = jQuery("#nvxTxtCountRows").val();
		var apiUsersRating = api + '/statistics/usersrating/' + countUsers;
		var xhr = new XMLHttpRequest();
					xhr.open('GET', apiUsersRating, true);
					xhr.onreadystatechange = function(){
						if (xhr.readyState != 4) return;
						
						if(xhr.status == 200){
							usersRating = JSON.parse(xhr.response);

						document.getElementById('nvxOwnradioSQLGetRequests').innerHTML = '<div id="nvxOwnradioSQLGetRequests"><h3>Рейтинг пользователей по количеству прослушанных треков и по количеству за последние сутки</h3><table id="nvxOwnradioSQLTableUsersRating" class="table table-bordered">    <thead>      <tr>        <th>userID</th>        <th>recName</th>        <th>recCreated</th>        <th>recUpdated</th>        <th>lastListenTracks</th>   <th>ownTracks</th>   </tr>    </thead>    <tbody></tbody></table> </div>';

						for(i=0;i<usersRating.length;i++) {
								jQuery('#nvxOwnradioSQLTableUsersRating > tbody:last').append('<tr><td><a href="'+window.location.origin+window.location.pathname+ '?type=listusers&userid='+usersRating[i].userid+'">'+ usersRating[i].userid+' <a/> </td><td>'+usersRating[i].recname+'</td><td>'+usersRating[i].reccreated+'</td><td>'+usersRating[i].recupdated+'</td><td>'+usersRating[i].lasttracks+'</td><td>'+usersRating[i].owntracks+'</td></tr>');
									console.log(xhr);
								}
						}else{
							console.log('Ошибка получения данных с сервера.');
							console.log(xhr);
						}
					}
					xhr.send();
	}
	
	//функция возвращает все устройства пользователя
	function nvxGetUserDevices(userId) {
		//var userId = jQuery("#nvxTxtUserID").val();
		var apiGetUserDevices = api + '/statistics/' + userId + '/getuserdevices';
		var xhr = new XMLHttpRequest();
		xhr.open('GET', apiGetUserDevices, true);
		xhr.onreadystatechange = function(){
			if (xhr.readyState != 4) return;
			
			if(xhr.status == 200){
				usersDevices = JSON.parse(xhr.response);//Object.assign({},JSON.parse(xhr.response));
				
				document.getElementById('nvxOwnradioSQLGetRequests').innerHTML = '<div id="nvxOwnradioSQLGetRequests"><h3>Устройства пользователя</h3><table id="nvxOwnradioSQLTableUserDevices" class="ownRadioTable">    <thead>      <tr>        <th>deviceId</th>        <th>recName</th>        <th>recCreated</th>        <th>recUpdated</th>        <th>userId</th>      </tr>    </thead>    <tbody></tbody></table> </div>';

				for(i=0;i<usersDevices.length;i++) {
					var date = new Date();
					var dateCreated, dateUpdated;
					if(usersDevices[i].reccreated != null) {
						date.setTime(usersDevices[i].reccreated);
						dateCreated =  date.getFullYear()+'-'+(date.getMonth()<9?'0'+(date.getMonth()+1):date.getMonth()+1)+'-'+date.getDate()+" "+
										(date.getHours()<10?'0'+date.getHours():date.getHours())+':'+
										(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes())+':'+
										(date.getSeconds()<10?'0'+date.getSeconds():date.getSeconds())+'.'+date.getMilliseconds();
					} else{
						dateCreated = null;
					}
					if(usersDevices[i].recupdated != null){
						date = date.setTime(usersDevices[i].recupdated);
						dateUpdated = date.getFullYear()+'-'+(date.getMonth()<9?'0'+(date.getMonth()+1):date.getMonth()+1)+'-'+date.getDate()+" "+
										(date.getHours()<10?'0'+date.getHours():date.getHours())+':'+
										(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes())+':'+
										(date.getSeconds()<10?'0'+date.getSeconds():date.getSeconds())+'.'+date.getMilliseconds();
					} else{
						dateUpdated = null;
					}			
						jQuery('#nvxOwnradioSQLTableUserDevices > tbody:last').append('<tr><td><a href="'+window.location.origin+window.location.pathname+ '?type=listtracks&deviceid='+usersDevices[i].recid+'&limit=100">'+ usersDevices[i].recid+'</td><td>'+usersDevices[i].recname+'</td><td>'+dateCreated+'</td><td>'+dateUpdated+'</td><td>'+usersDevices[i].user.recid+'</td></tr>');
				}
				console.log(xhr);
			}else{
				console.log('Ошибка получения данных с сервера.');
				console.log(xhr);
			}
		}
		xhr.send();
		
	}
	
	//функция просмотра последних выданных устройству треков
	function nvxGetLastTracks(deviceId, countTracks) {
		var apiGetLastTracks = api + '/statistics/' + deviceId + '/' + countTracks + '/getlasttracks';
		var xhr = new XMLHttpRequest();
		xhr.open('GET', apiGetLastTracks, true);
		xhr.onreadystatechange = function(){
			if (xhr.readyState != 4) return;
			
			if(xhr.status == 200){
				lastTracks = JSON.parse(xhr.response);//Object.assign({},JSON.parse(xhr.response));
				
				document.getElementById('nvxOwnradioSQLDevicesLastTracks').innerHTML = '<div id="nvxOwnradioSQLDevicesLastTracks"><h3>Выданные пользователю треки</h3><table id="nvxOwnradioSQLTableLastTracks" class="table table-bordered">    <thead>      <tr>        <th>trackID</th>        <th>title</th>  <th>artist</th>      <th>recCreated</th>        <th>recUpdated</th>        <th>methodid</th>     <th>txtrecommendinfo</th>  <th>userrecommend</th>   </tr>    </thead>    <tbody></tbody></table> </div>';

				for(i=0;i<lastTracks.length;i++) {
					var date = new Date();
					var dateCreated, dateUpdated;
					if(lastTracks[i].reccreated != null) {
						date.setTime(lastTracks[i].reccreated);
						dateCreated =  date.getFullYear()+'-'+(date.getMonth()<9?'0'+(date.getMonth()+1):date.getMonth()+1)+'-'+date.getDate()+" "+
										(date.getHours()<10?'0'+date.getHours():date.getHours())+':'+
										(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes())+':'+
										(date.getSeconds()<10?'0'+date.getSeconds():date.getSeconds())+'.'+date.getMilliseconds();
					} else{
						dateCreated = null;
					}
					if(lastTracks[i].recupdated != null){
						date = date.setTime(lastTracks[i].recupdated);
						dateUpdated = date.getFullYear()+'-'+(date.getMonth()<9?'0'+(date.getMonth()+1):date.getMonth()+1)+'-'+date.getDate()+" "+
										(date.getHours()<10?'0'+date.getHours():date.getHours())+':'+
										(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes())+':'+
										(date.getSeconds()<10?'0'+date.getSeconds():date.getSeconds())+'.'+date.getMilliseconds();
					} else{
						dateUpdated = null;
					}			
						jQuery('#nvxOwnradioSQLTableLastTracks > tbody:last').append('<tr><td>'+ lastTracks[i].track.recid +'</td><td>'+ lastTracks[i].track.recname +'</td><td>' + lastTracks[i].track.artist +'</td><td>'+dateCreated+'</td><td>'+dateUpdated+'</td><td>'+lastTracks[i].methodid+'</td><td>'+lastTracks[i].txtrecommendinfo+'</td><td>'+lastTracks[i].userrecommend+'</td></tr>');
				}
				console.log(xhr);
			}else{
				console.log('Ошибка получения данных с сервера.');
				console.log(xhr);
			}
		}
		xhr.send();
	}	
		
	//функция просмотра последних выданных устройству треков
	function nvxGetTracksHistory(deviceId, countTracks) {
		var apiTracksHistory = api + '/statistics/' + deviceId + '/' + countTracks + '/gettrackshistorybydevice';
		var xhr = new XMLHttpRequest();
		xhr.open('GET', apiTracksHistory, true);
		xhr.onreadystatechange = function(){
			if (xhr.readyState != 4) return;
			
			if(xhr.status == 200){
				tracksHistory = JSON.parse(xhr.response);//Object.assign({},JSON.parse(xhr.response));
				
				document.getElementById('nvxOwnradioSQLGetRequests').innerHTML = '<div id="nvxOwnradioSQLGetRequests"><h3>История выданных устройству ' + deviceId + ' треков и их прослушивания</h3><table id="nvxOwnradioSQLTableLastTracks" class="table table-bordered">    <thead>      <tr>        <th>trackID</th>        <th>title</th>  <th>artist</th>      <th>recCreated</th>        <th>isListen</th>        <th>methodid</th>     <th>txtrecommendinfo</th>  <th>userrecommend</th>  <th>localdevicepathupload</th> </tr>    </thead>    <tbody></tbody></table> </div>';

				for(i=0;i<tracksHistory.length;i++) {
					var date = new Date();
					var dateCreated, dateUpdated;
					if(tracksHistory[i].downloadTrack.reccreated != null) {
						date.setTime(tracksHistory[i].downloadTrack.reccreated);
						dateCreated =  date.getFullYear()+'-'+(date.getMonth()<9?'0'+(date.getMonth()+1):date.getMonth()+1)+'-'+date.getDate()+" "+
										(date.getHours()<10?'0'+date.getHours():date.getHours())+':'+
										(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes())+':'+
										(date.getSeconds()<10?'0'+date.getSeconds():date.getSeconds())+'.'+date.getMilliseconds();
					} else{
						dateCreated = null;
					}
					if(tracksHistory[i].downloadTrack.recupdated != null){
						date = date.setTime(tracksHistory[i].downloadTrack.recupdated);
						dateUpdated = date.getFullYear()+'-'+(date.getMonth()<9?'0'+(date.getMonth()+1):date.getMonth()+1)+'-'+date.getDate()+" "+
										(date.getHours()<10?'0'+date.getHours():date.getHours())+':'+
										(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes())+':'+
										(date.getSeconds()<10?'0'+date.getSeconds():date.getSeconds())+'.'+date.getMilliseconds();
					} else{
						dateUpdated = null;
					}			
						jQuery('#nvxOwnradioSQLTableLastTracks > tbody:last').append('<tr><td>'+ tracksHistory[i].downloadTrack.track.recid +'</td><td>'+ tracksHistory[i].downloadTrack.track.recname +'</td><td>' + tracksHistory[i].downloadTrack.track.artist +'</td><td>'+dateCreated+'</td><td>'+/*dateUpdated+'</td><td>'+*/(tracksHistory[i].history != null ? tracksHistory[i].history.isListen : null) +'</td><td>'+tracksHistory[i].downloadTrack.methodid+'</td><td>'+tracksHistory[i].downloadTrack.txtrecommendinfo+'</td><td>'+tracksHistory[i].downloadTrack.userrecommend+'</td><td>'+tracksHistory[i].downloadTrack.track.localdevicepathupload+'</td></tr>');
				}
				console.log(xhr);
			}else{
				console.log('Ошибка получения данных с сервера.');
				console.log(xhr);
			}
		}
		xhr.send();
	}	

	//функция возвращает последние активные устройства
	function nvxGetLastDevices() {
		var apiGetLastDevices = api + '/statistics/getlastdevices';
		var xhr = new XMLHttpRequest();
		//var params = getParam();
		//window.location.search = '';
		xhr.open('GET', apiGetLastDevices, true);
		xhr.onreadystatechange = function(){
			if (xhr.readyState != 4) return;
			
			if(xhr.status == 200){
				lastDevices = JSON.parse(xhr.response);//Object.assign({},JSON.parse(xhr.response));
			//	window.location.search = 'type=listdevice';
				document.getElementById('nvxOwnradioSQLGetRequests').innerHTML = '<div id="nvxOwnradioSQLGetRequests"><h3>Последние активные устройства</h3><table id="nvxOwnradioSQLTableLastDevices" class="table table-bordered">    <thead>      <tr>        <th>deviceId</th>        <th>deviceName</th>  <th>userId</th>   </tr>    </thead>    <tbody></tbody></table> </div>';

				for(i=0;i<lastDevices.length;i++) {
					jQuery('#nvxOwnradioSQLTableLastDevices > tbody:last').append('<tr><td><a href="'+window.location.origin+window.location.pathname+ '?type=listtracks&deviceid='+lastDevices[i].recid+'&limit=100">'+  lastDevices[i].recid +'</a></td><td>'+ lastDevices[i].recname +'</td><td><a href="'+window.location.origin+window.location.pathname+ '?type=listusers&userid='+lastDevices[i].user.recid+'"</a>'+lastDevices[i].user.recid+'</td></tr>');
				}
				console.log(xhr);
			}else{
				console.log('Ошибка получения данных с сервера.');
				console.log(xhr);
			}
		}
		xhr.send();
	}
	
	function nvxBtnLastDevice(){
		window.location.search = "type=listdevice";
	}
	
	function nvxBtnUsersRating(){
		window.location.search = "type=listusersrating&limit=-1";
	}