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
	api = 'http://api.ownradio.ru/v3';

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
							dateFormat = date.getFullYear()+'-'+(date.getMonth()<9?'0'+(date.getMonth()+1):date.getMonth()+1)+'-'+date.getDate()+"'T'"+
										(date.getHours()<10?'0'+date.getHours():date.getHours())+':'+
										(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes())+':'+
										(date.getSeconds()<10?'0'+date.getSeconds():date.getSeconds()),
							data = new FormData();
						data.append('isListen',(prm.ended?'1':'-1'));
						data.append('methodid',prm.currentTrack.methodid);
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
			}
		}

	
	fnc.init();
	fnc.nextTrack();

	return fnc;
}

var player = player();





