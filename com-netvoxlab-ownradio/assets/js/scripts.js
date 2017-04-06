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
	api = nvxOwnRadioServerUrl;//'http://api.ownradio.ru/v3';

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
			play:false,
			loading:false,
			currentTrack:null,
			nextTrack:null,
			intNext:null,
			loadNext:false,
			waitNext:false,
			ended:false
		},
		fnc = {
			play:function(){
				console.log('play');
				if(!prm.currentTrack && prm.nextTrack){
					if(prm.play){
						prm.play = false;
						obj.audio.pause();
					}

					prm.currentTrack = Object.assign({},prm.nextTrack);
					prm.ended = false;
					prm.nextTrack = null;
					fnc.nextTrack();

					obj.name.innerHTML = prm.currentTrack.name;
					obj.group.innerHTML = prm.currentTrack.artist;

					obj.audio.src = api+'/tracks/'+prm.currentTrack.id;
				}

				if(prm.currentTrack){
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
				if(prm.loadNext){
					prm.waitNext = true;
				}else if(!prm.nextTrack){
					prm.waitNext = true;
					fnc.nextTrack();
				}else{
					if(prm.currentTrack){
						var xhr = new XMLHttpRequest(),
							date = new Date,
							dateFormat = date.getFullYear()+'-'+(date.getMonth()<9?'0'+(date.getMonth()+1):date.getMonth()+1)+'-'+date.getDate()+"T"+
										(date.getHours()<10?'0'+date.getHours():date.getHours())+':'+
										(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes())+':'+
										(date.getSeconds()<10?'0'+date.getSeconds():date.getSeconds()),
							data = new FormData();
						data.append('isListen',(prm.ended?'1':'-1'));
						data.append('lastListen',dateFormat);
						/*	json = JSON.stringify(
								{
									isListen:prm.ended?'1':'-1',
									methodid:prm.currentTrack.methodid,
									lastListen:dateFormat
								}
							);*/
						xhr.open("POST", api+'/histories/'+ownRadioId+'/'+prm.currentTrack.id, true);
						//xhr.setRequestHeader('Content-Type', 'multipart/form-data; charset=utf-8');
						xhr.onreadystatechange = function(){
							if (xhr.readyState != 4) return;

							//console.log(xhr);

							if(xhr.status == 200){
								console.log('Данные о треке записаны в историю');
								
							}else{
								console.log('Ошибка отправки данных о треке.');

							}
						}
						xhr.send(data);
					}

					prm.waitNext = false;
					prm.currentTrack = null;
					fnc.play();
				}
			},
			ended:function(){
				prm.ended = true;
				prm.play = false;
				fnc.next();
			},
			nextTrack:function(){
				if(!prm.loadNext){
					prm.loadNext = true;
					var xhr = new XMLHttpRequest();
					xhr.open('GET', apiNext, true);
					xhr.onreadystatechange = function(){
						if (xhr.readyState != 4) return;

						prm.loadNext = false;

						if(xhr.status == 200){
							prm.nextTrack = JSON.parse(xhr.response);

							if(!prm.currentTrack){
								//todo
								if (obj.name == null) {
									fnc.init();									
								}
								if (obj.name != null) {
									obj.name.innerHTML = prm.nextTrack.name;
									obj.group.innerHTML = prm.nextTrack.artist;
								}								
							}

							if(prm.waitNext){
								fnc.next();
							}
						}else{
							console.log('Ошибка получения данных с сервера.');
							console.log(xhr);
						}
					}
					xhr.send();
				}
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
						var data = prm.currentTrack || prm.nextTrack;
						console.log(data);
					});
				}
				var nvxTxtUserID = document.getElementById('nvxTxtUserID');
				if(nvxTxtUserID != null)
					nvxTxtUserID.value = loadUid();

			}
		}

	
	fnc.init();
	fnc.nextTrack();

	return fnc;
}

var player = player();

	var usersRating = null,
		usersDevices = null,
		lastTracks = null,
		countUsers = -1,
		countTracks = -1,
		deviceid = null,
		userId = null,
		test = null;


//функция просмотра рейтинга пользователей по количеству своих треков и количеству полученных за последние сутки треков
	function nvxGetUsersRating() {
		var countUsers = jQuery("#nvxTxtCountRows").val();
		var apiUsersRating = api + '/statistics/usersrating/' + countUsers;
		var xhr = new XMLHttpRequest();
					xhr.open('GET', apiUsersRating, true);
					xhr.onreadystatechange = function(){
						if (xhr.readyState != 4) return;
						
						if(xhr.status == 200){
							usersRating = JSON.parse(xhr.response);

						document.getElementById('nvxOwnradioSQLUsersRating').innerHTML = '<div id="nvxOwnradioSQLUsersRating"><table id="nvxOwnradioSQLTableUsersRating" class="table table-bordered">    <thead>      <tr>        <th>userID</th>        <th>recName</th>        <th>recCreated</th>        <th>recUpdated</th>        <th>lastListenTracks</th>   <th>ownTracks</th>   </tr>    </thead>    <tbody></tbody></table> </div>';

						for(i=0;i<usersRating.length;i++) {
								jQuery('#nvxOwnradioSQLTableUsersRating > tbody:last').append('<tr><td><a href="#" onclick="nvxGetUserDevices('+"'"+usersRating[i].userid+"'"+')">'+ usersRating[i].userid+' <a/> </td><td>'+usersRating[i].recname+'</td><td>'+usersRating[i].reccreated+'</td><td>'+usersRating[i].recupdated+'</td><td>'+usersRating[i].lasttracks+'</td><td>'+usersRating[i].owntracks+'</td></tr>');
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
				
				document.getElementById('nvxOwnradioSQLUserDevices').innerHTML = '<div id="nvxOwnradioSQLUserDevices"><table id="nvxOwnradioSQLTableUserDevices" class="table table-bordered">    <thead>      <tr>        <th>deviceId</th>        <th>recName</th>        <th>recCreated</th>        <th>recUpdated</th>        <th>userId</th>      </tr>    </thead>    <tbody></tbody></table> </div>';

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
						jQuery('#nvxOwnradioSQLTableUserDevices > tbody:last').append('<tr><td><a href="#" onclick="nvxGetLastTracks('+ "'"+usersDevices[i].recid+"'"+',-1)">'+ usersDevices[i].recid+'</td><td>'+usersDevices[i].recname+'</td><td>'+dateCreated+'</td><td>'+dateUpdated+'</td><td>'+usersDevices[i].user.recid+'</td></tr>');
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
		var apiGetUserDevices = api + '/statistics/' + deviceId + '/' + countTracks + '/getlasttracks';
		var xhr = new XMLHttpRequest();
		xhr.open('GET', apiGetUserDevices, true);
		xhr.onreadystatechange = function(){
			if (xhr.readyState != 4) return;
			
			if(xhr.status == 200){
				lastTracks = JSON.parse(xhr.response);//Object.assign({},JSON.parse(xhr.response));
				
				document.getElementById('nvxOwnradioSQLDevicesLastTracks').innerHTML = '<div id="nvxOwnradioSQLDevicesLastTracks"><table id="nvxOwnradioSQLTableLastTracks" class="table table-bordered">    <thead>      <tr>        <th>trackID</th>        <th>title</th>  <th>artist</th>      <th>recCreated</th>        <th>recUpdated</th>        <th>methodid</th>     <th>txtrecommendinfo</th>  <th>userrecommend</th>   </tr>    </thead>    <tbody></tbody></table> </div>';

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


