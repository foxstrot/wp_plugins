requirejs.config({
	baseUrl: window.nvxCommonPath.pluginScriptPath || '/wp-content/plugins/nvxRpguContent/Portal/',
			

	text: {
		useXhr: function(url, protocol, hostname, port) {
		},
		onXhr: function(xhr, url) {
		},
		createXhr: function() {
		},
		onXhrComplete: function(xhr, url) {
		}
	},

	paths: {
		//Объект для определения готовности DOM.
		domReady: 'script/requirejs/domReady.min',
		//Для асинхронной загрузки шаблонов представлений для knockout
		template: 'script/knockout-require-templates/template.min',
		stringTemplateEngine: 'script/knockout-require-templates/stringTemplateEngine.min',
		text: 'script/requirejs/text.min',
		//Knockout
		knockout: 'script/knockout/knockout.min',
		//Knockout-jQueryUI 2.1.0
		'knockout-jqueryui': 'script/knockout-jqueryui',
		//jQuery
		jquery: 'script/jquery/jquery.min',//'../js/jquery-1.11.2.min',//'script/jquery/jquery.min',
		//jquerymain: '../js/jquery.main1',
		//jquerycustom: '../js/custom1',
		jqueryExtention: 'script/lib.fix/jqueryExtention',
		//jQueryUI 1.11.2
		'jquery-ui': 'script/jquery-ui',
		'jquery.autosize': 'script/jquery.autosize/jquery.autosize.min',
		'jquery.form': 'script/jquery.form/jquery.form.min',
		'jquery.flot': 'script/jquery.flot/jquery.flot.min',
		//JavaScript
		javascriptExtention: 'script/lib.fix/javascriptExtention',
		//FileSaver
		filesaver: 'script/filesaver/FileSaver.min',
		//select2
		select2vendor: 'script/select2/select2.min',
		select2lib: 'script/select2/select2_locale_ru.min',
		//KoGrid
		koGrid: 'script/koGrid/koGrid.debug.min',
		//Наши кастомные байдинги.
		'customBindingHandlers': 'script/lib.fix/customBindingHandlers',
		//Для динамических форм.
		//Текстовый препроцессор.
		jsrender: 'script/jsrender/jsrender.min',
		//signalR
		'jquery.signalR': 'script/jquery.signalR/jquery.signalR.min',
		'signalr': "/signalr/js?",
		//Не помню зачем это уже. По-моему прикладывание аватарки в веб-админке сделано через эту библиотечку.
		'knockout-file-bindings': 'script/knockout-file-bindings/knockout-file-bindings.min',
		'knockout-file-bindings-fix': 'script/lib.fix/knockout-file-bindings',
		komapping: "script/knockout.mapping/knockout.mapping.min",
		'knockout.contextmenu': 'script/knockout.contextmenu/knockout.contextmenu',
		'sammy': 'script/sammy/sammy.min',
		'jquery.cookie': 'script/jquery.cookie/jquery.cookie.min',
		//Html-редактор
		//'trumbowyg': 'script/trumbowyg/trumbowyg.min',
		//'trumbowyg-ru': 'script/trumbowyg/langs/ru.min',
		select2Fix: 'script/lib.fix/extention',
		'koDelegatedEvents': 'script/knockout-delegatedEvents/knockout-delegatedEvents.min',
		//API для плагина КриптоПро
		'cadespluginApi': 'script/cadesplugin/cadesplugin_api.min',
		'opal': 'script/rubytojs/opal.min',
		'opal-parser': 'script/rubytojs/opal-parser.min',
		'opal-native': 'script/rubytojs/native.min',
		'opal-date': 'script/rubytojs/date.min',
		'opal-datetime': 'script/rubytojs/DateTime.min',
		'opal-guid': 'script/rubytojs/Guid.min',
		'knockout-jqueryui/dialog': 'script/knockout-jqueryui/dialog',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/ModalDialog': 'script/ModalDialog',
		//fullcalendar.io
		'fullcalendar': 'script/fullcalendar/fullcalendar.min',
		'fullcalendar.ru': 'script/fullcalendar/ru',
		'moment': 'script/moment/moment.min',
	},
	shim: {
		'jquery': {
			exports: 'jQuery'
		},
		'jquery.autosize': {
			deps: ['jquery']
		},
		'jquery.form': {
			deps: ['jquery']
		},
		'knockout-file-bindings': {
			deps: ['knockout-file-bindings-fix']
		},
		'jqueryExtention': {
			deps: ['jquery']
		},
		'knockout': {
			deps: ['jquery'],
			exports: 'ko'
		},
		'select2vendor': {
			deps: ['jquery']
		},
		'select2lib': {
			deps: ['knockout', 'select2vendor', 'select2Fix']
		},
		'jsrender': {
			deps: ['jquery']
		},
		'jquery.signalR': {
			deps: ['jquery']
		},
		'signalr': {
			deps: ['jquery.signalR']
		},
		'koGrid': {
			deps: ['jquery', 'knockout'],
			exports: 'koGrid'
		},
		'sammy': {
			deps: ['jquery'],
			exports: 'Sammy'
		},
		'jquery.cookie': {
			deps: ['jquery']
		},
		'trumbowyg-ru': {
			deps: ['trumbowyg'],
			exports: 'Trumbowyg-RU'
		},
		komapping: {
			deps: ['knockout'],
			exports: 'komapping'
		},
		'knockout.contextmenu': {
			deps: ['knockout'],
			exports: 'kocontextmenu'
		},
		//'cadespluginApi': {
		//	exports: 'cadesplugin2'
		//}
		'koDelegatedEvents': {
			deps: ['knockout'],
			exports: 'koDelegatedEvents'
		},
		'opal': {
			exports: 'Opal'
		},
		'opal-parser': {
			deps: ['opal']
		},
		'opal-native': {
			deps: ['opal']
		},
		'opal-date': {
			deps: ['opal']
		},
		'opal-datetime': {
			deps: ['opal']
		},
		'opal-guid': {
			deps: ['opal']
		},
		'fullcalendar.ru': {
			deps: ['fullcalendar', 'moment']
		},
		waitSeconds: 30, //Debug
		//waitSeconds: 27, //Release

		//Указываем версию для каждой сборки, чтобы избежать лишнего кэширования.
		urlArgs: '18_1466081988863'
	}
});
//используется что-бы не допустить повторной загрузки jquery!!! также не стоит добавлять скрипт jquery после require
var getLocation = function(href) {
	var l = document.createElement("a");
	l.href = href;
	return l;
};
var getUrlPath = function(url) {
	var href = getLocation(url);
	if (href.host == "") {
		href.href = href.href;
	}
	var path = href.pathname;
	var index = path.indexOf(':');
	if (index > -1) {
		return path.substr(index + 1);
	}
	return path;
};
var jQuery = jQuery || window["$"];
var reconfigJq = function(jq) {
	jq.ajaxSetup({
		globalUrl: window.nvxCommonPath.rdcurl,
		cache: false
	});

	if (navigator != null && navigator.userAgent != null && navigator.userAgent.indexOf('Trident') >= 0) {
		jq.ajaxSettings.globalUrl += '/';
	}

	var old = jq.ajax;
	jq.ajax = function(options) {
		var setup = jq.ajaxSetup();
		if (setup.globalUrl) {
			options.url = setup.globalUrl + options.url;
			var ttype = options.method || options.type;

			//IE11 fix
			if (navigator != null && navigator.userAgent != null && navigator.userAgent.indexOf('Trident') >= 0) {
				if (options.headers == null)
					options.headers = { proxy: true };
				else
					options.headers.proxy = true;
			}

			if (options.headers == null || options.headers.proxy !== true) {
				var setup = jq.ajaxSetup({
					url: options.url,
					headers: options.headers,
					type: ttype,
					data: options.data,
					dataType: options.dataType,
					contentType: options.contentType,
					error: options.error || function() {},
					beforeSend: options.beforeSend || function() {},
					success: options.success || function() {},
					complete: options.complete || function () {
						if (document.getElementsByClassName('throbber').length == 1) {
							if (document.getElementsByClassName('throbber')[0].remove != null)
								document.getElementsByClassName('throbber')[0].remove();
						}
					}
				});
			} else {
				var setup = jq.ajaxSetup({
					url: window.nvxCommonPath.proxyPath + '?_=' + Date.now(),
					crossDomain: true,
					headers: {
						'X-Proxy-URL': options.url,
						'X-Proxy-Cookie': document.cookie
					},
					type: ttype,
					data: options.data,
					dataType: options.dataType,
					contentType: options.contentType,
					error: options.error || function () { },
					beforeSend: options.beforeSend || function () { },
					success: options.success || function () { },
					complete: options.complete || function () {
						if (document.getElementsByClassName('throbber').length == 1) {
							if (document.getElementsByClassName('throbber')[0].remove != null)
								document.getElementsByClassName('throbber')[0].remove();
						}
					}
				});
			}
		}
		return old.call(this, arguments);
	};
};
if (typeof jQuery === 'function') {
	//jQuery already loaded, just use that
	define('jquery', function() { return jQuery; });
	var jq = jQuery || window["$"];
	reconfigJq(jq);
} else {
	require(['jquery'], function(jq) {
		reconfigJq(jq);
	});
}
//аналогично для knockout.
if (typeof ko === 'function') {
	define('knockout', function() { return ko; });
}