/// <reference path="../../debug/Nvx.ReDoc.WebInterfaceModule/Content/lib/jQuery/jquery.min.js" />
/* 
* jQueryExtention.js 
*/
(function ($, window, document, undefined) {
	/**
	 * Расширение, чтобы отправлять модели как JSON через POST запрос.
	 * @param {string} url - Адрес сервера.
	 * @param {Object} data - Объект, который будет отправлен как JSON.
	 * @returns {Object} - jQuery promise.
	 */
	$.postJSON = function (url, data, doneCallback) {
		var o = {
			url: url,
			type: "POST",
			dataType: "json",
			contentType: 'application/json; charset=utf-8'
		};
		if (data !== undefined) {
			o.data = JSON.stringify(data);
		}
		if (doneCallback != undefined) {
			o.success = doneCallback;
		}
		return $.ajax(o);
	};

	var $window = $(window);
	//возвращает параметры строки запроса и параметры строки запроса в нижнем регистре(значения параметров остаются в оригинальном виде)
	//http://localhost:29929/WebInterfaceModule/File?fileId=ebcde6eb-22c0-41ff-8d18-9301b8a4c881&block=a&elementId=111%20-%20Copy.txt
	// для данной ссылки вернёться массив
	//block: "a"
	//elementId: "111%20-%20Copy.txt"
	//elementid: "111%20-%20Copy.txt"
	//fileId: "ebcde6eb-22c0-41ff-8d18-9301b8a4c881"
	//fileid: "ebcde6eb-22c0-41ff-8d18-9301b8a4c881"
	$.getUrlVarsFunction = function (url, param) {
		if (url === undefined || url === null) url = window.location.href;
		if (param !== '#') param = '?';

		///<summary>Расширение jQuery, позволяющее получать параметры строки запроса.</summary>
		var vars = [], hash;
		var hashes = url.slice(url.indexOf(param) + 1).split('&');
		for (var i = 0; i < hashes.length; i++) {
			//hash = hashes[i].split('='); // для параметров в которых есть = такой вариант не подходит
			var indexOfEq = hashes[i].indexOf('=');
			hash = [hashes[i].substring(0, indexOfEq), hashes[i].substring(indexOfEq + 1)];

			var lower = hash[0].toLowerCase();
			if (!vars[lower] && !vars[hash[0]]) {
				vars.push(hash[0]);
				vars[hash[0]] = hash[1];
				if (lower != hash[0]) {
					vars.push(lower);
					vars[lower] = hash[1];
				}
			}
		}
		return vars;
	};

	$.queryToObject = function (querySearch) {
		var urlParams;
		var match,
		    pl = /\+/g, // Regex for replacing addition symbol with a space
		    search = /([^&=]+)=?([^&]*)/g,
		    decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
		    query = querySearch.substring(0);

		urlParams = {};
		while (match = search.exec(query))
			urlParams[decode(match[1])] = decode(match[2]);

		return urlParams;
	};

	$.extend({
		//Возвращает массим имен параметров строки запроса.
		getUrlVars: function (url) {
			var vars = $.getUrlVarsFunction(url, '?');
			return vars;
		},
		//Возвращает значение конкретного параметра строки запроса.
		getUrlVar: function (name) {
			///<summary>Получает значение конкретного параметра строки запроса.</summary>
			///<param name="n" type="string">Имя параметра.</param>
			name = name.toLowerCase();
			// так вроде не будет влиять на остальные функции
			return $.getUrlVarsFunction()[name];
		},
		//Трактует данные в строке запроса после символа # как url и возвращает массив имен параметров этой строки запроса.
		getUrlVarsHash: function (url) {
			var vars = $.getUrlVarsFunction(url, '#');
			return vars;
		},
		//Трактует данные в строке запроса после символа # как url и возвращает значение указанного параметра этой строки запроса.
		getUrlVarHash: function (name) {
			///<summary>Получает значение конкретного параметра строки запроса.</summary>
			///<param name="n" type="string">Имя параметра.</param>
			return $.getUrlVarsHash()[name];
		},
		//Возвращает объект, представляющий собой параметры строки запроса после хеш-символа.
		getHashQueryObject: function (url) {
			if (url === undefined || url === null || url === '') {
				url = window.location.href;
			}

			var querySearch = '';
			var index = url.indexOf('#');
			if (index > -1) {
				querySearch = url.slice(url.indexOf('#') + 1);
			}
			return $.queryToObject(querySearch);
		},
		//Возвращает строку, представляющую собой строку параметров для строки запроса.
		objectToQuery: function (queryObject) {
			return $.param(queryObject);
		},
		removeUrlParameter: function removeUrlParameter(url, parameter) {
			//prefer to use l.search if you have a location/link object
			var urlparts = url.split('?');
			if (urlparts.length >= 2) {

				var prefix = encodeURIComponent(parameter) + '=';
				var pars = urlparts[1].split(/[&;]/g);

				//reverse iteration as may be destructive
				for (var i = pars.length; i-- > 0;) {
					//idiom for string.startsWith
					if (pars[i].lastIndexOf(prefix, 0) !== -1) {
						pars.splice(i, 1);
					}
				}

				url = urlparts[0] + '?' + pars.join('&');
				return url;
			} else {
				return url;
			}
		},
		deparam: function (params, coerce) {
			var obj = {},
				coerce_types = { 'true': !0, 'false': !1, 'null': null };

			// Iterate over all name=value pairs.
			$.each(params.replace(/\+/g, ' ').split('&'), function (j, v) {
				var param = v.split('='),
					key = decodeURIComponent(param[0]),
					val,
					cur = obj,
					i = 0,

					// If key is more complex than 'foo', like 'a[]' or 'a[b][c]', split it
					// into its component parts.
					keys = key.split(']['),
					keys_last = keys.length - 1;

				// If the first keys part contains [ and the last ends with ], then []
				// are correctly balanced.
				if (/\[/.test(keys[0]) && /\]$/.test(keys[keys_last])) {
					// Remove the trailing ] from the last keys part.
					keys[keys_last] = keys[keys_last].replace(/\]$/, '');

					// Split first keys part into two parts on the [ and add them back onto
					// the beginning of the keys array.
					keys = keys.shift().split('[').concat(keys);

					keys_last = keys.length - 1;
				} else {
					// Basic 'foo' style key.
					keys_last = 0;
				}

				// Are we dealing with a name=value pair, or just a name?
				if (param.length === 2) {
					val = decodeURIComponent(param[1]);

					// Coerce values.
					if (coerce) {
						val = val && !isNaN(val) ? +val              // number
							: val === 'undefined' ? undefined         // undefined
							: coerce_types[val] !== undefined ? coerce_types[val] // true, false, null
							: val;                                                // string
					}

					if (keys_last) {
						// Complex key, build deep object structure based on a few rules:
						// * The 'cur' pointer starts at the object top-level.
						// * [] = array push (n is set to array length), [n] = array if n is 
						//   numeric, otherwise object.
						// * If at the last keys part, set the value.
						// * For each keys part, if the current level is undefined create an
						//   object or array based on the type of the next keys part.
						// * Move the 'cur' pointer to the next level.
						// * Rinse & repeat.
						for (; i <= keys_last; i++) {
							key = keys[i] === '' ? cur.length : keys[i];
							cur = cur[key] = i < keys_last
							  ? cur[key] || (keys[i + 1] && isNaN(keys[i + 1]) ? {} : [])
							  : val;
						}

					} else {
						// Simple key, even simpler rules, since only scalars and shallow
						// arrays are allowed.

						if ($.isArray(obj[key])) {
							// val is already an array, so push on the next value.
							obj[key].push(val);

						} else if (obj[key] !== undefined) {
							// val isn't an array, but since a second value has been specified,
							// convert val into an array.
							obj[key] = [obj[key], val];

						} else {
							// val is a scalar.
							obj[key] = val;
						}
					}

				} else if (key) {
					// No value was defined, so set something meaningful.
					obj[key] = coerce
					  ? undefined
					  : '';
				}
			});

			return obj;
		},
		htmlEncode: function (html) {
			return document.createElement('a').appendChild(
				document.createTextNode(html)).parentNode.innerHTML;
		},
		htmlDecode: function (html) {
			var a = document.createElement('a'); a.innerHTML = html;
			return a.textContent;
		}
	});


	$.fn.serializeObject = function () {
		///<summary>Расширение, позволяющее сериализовать данные полей формы в javascript-объект
		///(а не в массим объектов со свойством "ключ" и свойством "значение")</summary>
		var o = {};
		var a = this.serializeArray();
		$.each(a, function () {
			if (o[this.name] || o[this.name] == '') {
				if (!o[this.name].push) {
					o[this.name] = [o[this.name]];
				}
				o[this.name].push(this.value || '');
			} else {
				o[this.name] = this.value || '';
			}
		});
		return o;
	};

	//Расширение, позволяющее получать и менять textNode.
	$.fn.textNodeContent = function (n) {
		///<summary>Расширение, позволяющее получать и менять textNode.</summary>
		///<param name="n" type="string">Новое значение тектовой ноды.</param>
		var o = $(this).clone();
		var c = o.children().remove();
		if (typeof n === "string") {
			o.html(n);
			$(this).html(c).append(n);
		}
		return o.html();
	};

	//Проверка - вернула ли выборка элементы.
	$.fn.exists = function () {
		return this.length !== 0;
	};

	$.fn.getOuterHTML = function () {
		var wrapper = $('<div></div>');
		wrapper.append(this.clone());
		return wrapper.html();
	};

	$.fn.getWrappedByDiv = function () {
		var wrapper = $('<div></div>');
		wrapper.append(this.clone());
		return wrapper;
	};

	//расширение для jQuery, которое позволяет получать по ajax бинарнные данные
	$.ajaxTransport("+binary", function (options, originalOptions, jqXHR) {
		// check for conditions and support for blob / arraybuffer response type
		if (window.FormData && ((options.dataType && (options.dataType == 'binary')) || (options.data && ((window.ArrayBuffer && options.data instanceof ArrayBuffer) || (window.Blob && options.data instanceof Blob))))) {
			return {
				// create new XMLHttpRequest
				send: function (headers, callback) {
					// setup all variables
					var xhr = new XMLHttpRequest(),
			url = options.url,
			type = options.type,
			async = options.async || true,
			// blob or arraybuffer. Default is blob
			dataType = options.responseType || "blob",
			data = options.data || null,
			username = options.username || null,
			password = options.password || null;

					xhr.addEventListener('load', function () {
						var data = {};
						data[options.dataType] = xhr.response;
						// make callback and send data
						callback(xhr.status, xhr.statusText, data, xhr.getAllResponseHeaders());
					});

					xhr.open(type, url, async, username, password);

					// setup custom headers
					for (var i in headers) {
						xhr.setRequestHeader(i, headers[i]);
					}

					xhr.responseType = dataType;
					xhr.send(data);
				},
				abort: function () {
					jqXHR.abort();
				}
			};
		}
	});

	var isMobileDevice = ('ontouchstart' in window) ||
						(window.DocumentTouch && document instanceof DocumentTouch) ||
						/Windows Phone/.test(navigator.userAgent);

	function FixedScrollBlock(options) {
		this.options = $.extend({
			fixedActiveClass: 'fixed-position',
			slideBlock: '[data-scroll-block]',
			positionType: 'auto',
			fixedOnlyIfFits: true,
			container: null,
			animDelay: 100,
			animSpeed: 200,
			extraBottom: 0,
			extraTop: 0
		}, options);
		this.initStructure();
		this.attachEvents();
	}
	FixedScrollBlock.prototype = {
		initStructure: function () {
			// find elements
			this.win = $(window);
			this.container = $(this.options.container);
			this.slideBlock = this.container.find(this.options.slideBlock);

			// detect method
			if (this.options.positionType === 'auto') {
				this.options.positionType = isMobileDevice ? 'absolute' : 'fixed';
			}
		},
		attachEvents: function () {
			var self = this;

			// bind events
			this.onResize = function () {
				self.resizeHandler();
			};
			this.onScroll = function () {
				self.scrollHandler();
			};

			// handle events
			this.win.on({
				resize: this.onResize,
				scroll: this.onScroll
			});

			// initial handler call
			this.resizeHandler();
		},
		recalculateOffsets: function () {
			var defaultOffset = this.slideBlock.offset(),
				defaultPosition = this.slideBlock.position(),
				holderOffset = this.container.offset(),
				windowSize = this.win.height();

			this.data = {
				windowHeight: this.win.height(),
				windowWidth: this.win.width(),

				blockPositionLeft: defaultPosition.left,
				blockPositionTop: defaultPosition.top,

				blockOffsetLeft: defaultOffset.left,
				blockOffsetTop: defaultOffset.top,
				blockHeight: this.slideBlock.innerHeight(),

				holderOffsetLeft: holderOffset.left,
				holderOffsetTop: holderOffset.top,
				holderHeight: this.container.innerHeight()
			};
		},
		isVisible: function () {
			return this.slideBlock.prop('offsetHeight');
		},
		fitsInViewport: function () {
			if (this.options.fixedOnlyIfFits && this.data) {
				return this.data.blockHeight + this.options.extraTop <= this.data.windowHeight;
			} else {
				return true;
			}
		},
		resizeHandler: function () {
			if (this.isVisible()) {
				FixedScrollBlock.stickyMethods[this.options.positionType].onResize.apply(this, arguments);
				this.scrollHandler();
			}
		},
		scrollHandler: function () {
			if (this.isVisible()) {
				if (!this.data) {
					this.resizeHandler();
					return;
				}
				this.currentScrollTop = this.win.scrollTop();
				this.currentScrollLeft = this.win.scrollLeft();
				FixedScrollBlock.stickyMethods[this.options.positionType].onScroll.apply(this, arguments);
			}
		},
		refresh: function () {
			// refresh dimensions and state if needed
			if (this.data) {
				this.data.holderHeight = this.container.innerHeight();
				this.data.blockHeight = this.slideBlock.innerHeight();
				this.scrollHandler();
			}
		},
		destroy: function () {
			// remove event handlers and styles
			this.slideBlock.removeAttr('style').removeClass(this.options.fixedActiveClass);
			this.win.off({
				resize: this.onResize,
				scroll: this.onScroll
			});
		}
	};

	// sticky methods
	FixedScrollBlock.stickyMethods = {
		fixed: {
			onResize: function () {
				this.slideBlock.removeAttr('style');
				this.recalculateOffsets();
			},
			onScroll: function () {
				if (this.fitsInViewport() && this.currentScrollTop + this.options.extraTop > this.data.blockOffsetTop) {
					if (this.currentScrollTop + this.options.extraTop + this.data.blockHeight > this.data.holderOffsetTop + this.data.holderHeight - this.options.extraBottom) {
						this.slideBlock.css({
							position: 'absolute',
							top: this.data.blockPositionTop + this.data.holderHeight - this.data.blockHeight - this.options.extraBottom - (this.data.blockOffsetTop - this.data.holderOffsetTop),
							left: this.data.blockPositionLeft
						});
					} else {
						this.slideBlock.css({
							position: 'fixed',
							top: this.options.extraTop,
							left: this.data.blockOffsetLeft - this.currentScrollLeft
						});
					}
					this.slideBlock.addClass(this.options.fixedActiveClass);
				} else {
					this.slideBlock.removeClass(this.options.fixedActiveClass).removeAttr('style');
				}
			}
		},
		absolute: {
			onResize: function () {
				this.slideBlock.removeAttr('style');
				this.recalculateOffsets();

				this.slideBlock.css({
					position: 'absolute',
					top: this.data.blockPositionTop,
					left: this.data.blockPositionLeft
				});

				this.slideBlock.addClass(this.options.fixedActiveClass);
			},
			onScroll: function () {
				var self = this;
				clearTimeout(this.animTimer);
				this.animTimer = setTimeout(function () {
					var currentScrollTop = self.currentScrollTop + self.options.extraTop,
						initialPosition = self.data.blockPositionTop - (self.data.blockOffsetTop - self.data.holderOffsetTop),
						maxTopPosition = self.data.holderHeight - self.data.blockHeight - self.options.extraBottom,
						currentTopPosition = initialPosition + Math.min(currentScrollTop - self.data.holderOffsetTop, maxTopPosition),
						calcTopPosition = self.fitsInViewport() && currentScrollTop > self.data.blockOffsetTop ? currentTopPosition : self.data.blockPositionTop;

					self.slideBlock.stop().animate({
						top: calcTopPosition
					}, self.options.animSpeed);
				}, this.options.animDelay);
			}
		}
	};

	// jQuery plugin interface
	$.fn.fixedScrollBlock = function (options) {
		return this.each(function () {
			var params = $.extend({}, options, { container: this }),
				instance = new FixedScrollBlock(params);
			$.data(this, 'FixedScrollBlock', instance);
		});
	};

	// module exports
	window.FixedScrollBlock = FixedScrollBlock;

	function Tabset($holder, options) {
		this.$holder = $holder;
		this.options = options;

		this.init();
	}

	Tabset.prototype = {
		init: function () {
			this.$tabLinks = this.$holder.find(this.options.tabLinks);

			this.setStartActiveIndex();
			this.setActiveTab();

			if (this.options.autoHeight) {
				this.$tabHolder = $(this.$tabLinks.eq(0).attr(this.options.attrib)).parent();
			}
		},

		setStartActiveIndex: function () {
			var $classTargets = this.getClassTarget(this.$tabLinks);
			var $activeLink = $classTargets.filter('.' + this.options.activeClass);
			var $hashLink = this.$tabLinks.filter('[' + this.options.attrib + '="' + location.hash + '"]');
			var activeIndex;

			if (this.options.checkHash && $hashLink.length) {
				$activeLink = $hashLink;
			}

			activeIndex = $classTargets.index($activeLink);

			this.activeTabIndex = this.prevTabIndex = (activeIndex === -1 ? (this.options.defaultTab ? 0 : null) : activeIndex);
		},

		setActiveTab: function () {
			var self = this;

			this.$tabLinks.each(function (i, link) {
				var $link = $(link);
				var $classTarget = self.getClassTarget($link);
				var $tab = $($link.attr(self.options.attrib));

				if (i !== self.activeTabIndex) {
					$classTarget.removeClass(self.options.activeClass);
					$tab.addClass(self.options.tabHiddenClass).removeClass(self.options.activeClass);
				} else {
					$classTarget.addClass(self.options.activeClass);
					$tab.removeClass(self.options.tabHiddenClass).addClass(self.options.activeClass);
				}

				self.attachTabLink($link, i);
			});
		},

		attachTabLink: function ($link, i) {
			var self = this;

			$link.on(this.options.event + '.tabset', function (e) {
				e.preventDefault();

				if (self.activeTabIndex === self.prevTabIndex && self.activeTabIndex !== i) {
					self.activeTabIndex = i;
					self.switchTabs();
				}
			});
		},

		resizeHolder: function (height) {
			var self = this;

			if (height) {
				this.$tabHolder.height(height);
				setTimeout(function () {
					self.$tabHolder.addClass('transition');
				}, 10);
			} else {
				self.$tabHolder.removeClass('transition').height('');
			}
		},

		switchTabs: function () {
			var self = this;

			var $prevLink = this.$tabLinks.eq(this.prevTabIndex);
			var $nextLink = this.$tabLinks.eq(this.activeTabIndex);

			var $prevTab = this.getTab($prevLink);
			var $nextTab = this.getTab($nextLink);

			$prevTab.removeClass(this.options.activeClass);

			if (self.haveTabHolder()) {
				this.resizeHolder($prevTab.outerHeight());
			}

			setTimeout(function () {
				self.getClassTarget($prevLink).removeClass(self.options.activeClass);

				$prevTab.addClass(self.options.tabHiddenClass);
				$nextTab.removeClass(self.options.tabHiddenClass).addClass(self.options.activeClass);

				self.getClassTarget($nextLink).addClass(self.options.activeClass);

				if (self.haveTabHolder()) {
					self.resizeHolder($nextTab.outerHeight());

					setTimeout(function () {
						self.resizeHolder();
						self.prevTabIndex = self.activeTabIndex;
					}, self.options.animSpeed);
				} else {
					self.prevTabIndex = self.activeTabIndex;
				}
			}, this.options.autoHeight ? this.options.animSpeed : 1);
		},

		getClassTarget: function ($link) {
			return this.options.addToParent ? $link.parent() : $link;
		},

		getActiveTab: function () {
			return this.getTab(this.$tabLinks.eq(this.activeTabIndex));
		},

		getTab: function ($link) {
			return $($link.attr(this.options.attrib));
		},

		haveTabHolder: function () {
			return this.$tabHolder && this.$tabHolder.length;
		},

		destroy: function () {
			var self = this;

			this.$tabLinks.off('.tabset').each(function () {
				var $link = $(this);

				self.getClassTarget($link).removeClass(self.options.activeClass);
				$($link.attr(self.options.attrib)).removeClass(self.options.activeClass + ' ' + self.options.tabHiddenClass);
			});

			this.$holder.removeData('Tabset');
		}
	};

	$.fn.tabset = function (options) {
		options = $.extend({
			activeClass: 'active',
			addToParent: false,
			autoHeight: false,
			checkHash: false,
			defaultTab: true,
			animSpeed: 500,
			tabLinks: 'a',
			attrib: 'href',
			event: 'click',
			tabHiddenClass: 'js-tab-hidden'
		}, options);
		options.autoHeight = options.autoHeight && $.support.opacity;

		return this.each(function () {
			var $holder = $(this);

			if (!$holder.data('Tabset')) {
				$holder.data('Tabset', new Tabset($holder, options));
			}
		});
	};

	function OpenClose(options) {
		this.options = $.extend({
			addClassBeforeAnimation: true,
			hideOnClickOutside: false,
			activeClass: 'active',
			opener: '.opener',
			slider: '.slide',
			animSpeed: 400,
			effect: 'fade',
			event: 'click'
		}, options);
		this.init();
	}
	OpenClose.prototype = {
		init: function () {
			if (this.options.holder) {
				this.findElements();
				this.attachEvents();
				this.makeCallback('onInit', this);
			}
		},
		findElements: function () {
			this.holder = $(this.options.holder);
			this.opener = this.holder.find(this.options.opener);
			this.slider = this.holder.find(this.options.slider);
		},
		attachEvents: function () {
			// add handler
			var self = this;
			this.eventHandler = function (e) {
				e.preventDefault();
				if (self.slider.hasClass(slideHiddenClass)) {
					self.showSlide();
				} else {
					self.hideSlide();
				}
			};
			self.opener.bind(self.options.event, this.eventHandler);

			// hover mode handler
			if (self.options.event === 'over') {
				self.opener.bind('mouseenter', function () {
					if (!self.holder.hasClass(self.options.activeClass)) {
						self.showSlide();
					}
				});
				self.holder.bind('mouseleave', function () {
					self.hideSlide();
				});
			}

			// outside click handler
			self.outsideClickHandler = function (e) {
				if (self.options.hideOnClickOutside) {
					var target = $(e.target);
					if (!target.is(self.holder) && !target.closest(self.holder).length) {
						self.hideSlide();
					}
				}
			};

			// set initial styles
			if (this.holder.hasClass(this.options.activeClass)) {
				$(document).bind('click touchstart', self.outsideClickHandler);
			} else {
				this.slider.addClass(slideHiddenClass);
			}
		},
		showSlide: function () {
			var self = this;
			if (self.options.addClassBeforeAnimation) {
				self.holder.addClass(self.options.activeClass);
			}
			self.slider.removeClass(slideHiddenClass);
			$(document).bind('click touchstart', self.outsideClickHandler);

			self.makeCallback('animStart', true);
			toggleEffects[self.options.effect].show({
				box: self.slider,
				speed: self.options.animSpeed,
				complete: function () {
					if (!self.options.addClassBeforeAnimation) {
						self.holder.addClass(self.options.activeClass);
					}
					self.makeCallback('animEnd', true);
				}
			});
		},
		hideSlide: function () {
			var self = this;
			if (self.options.addClassBeforeAnimation) {
				self.holder.removeClass(self.options.activeClass);
			}
			$(document).unbind('click touchstart', self.outsideClickHandler);

			self.makeCallback('animStart', false);
			toggleEffects[self.options.effect].hide({
				box: self.slider,
				speed: self.options.animSpeed,
				complete: function () {
					if (!self.options.addClassBeforeAnimation) {
						self.holder.removeClass(self.options.activeClass);
					}
					self.slider.addClass(slideHiddenClass);
					self.makeCallback('animEnd', false);
				}
			});
		},
		destroy: function () {
			this.slider.removeClass(slideHiddenClass).css({ display: '' });
			this.opener.unbind(this.options.event, this.eventHandler);
			this.holder.removeClass(this.options.activeClass).removeData('OpenClose');
			$(document).unbind('click touchstart', this.outsideClickHandler);
		},
		makeCallback: function (name) {
			if (typeof this.options[name] === 'function') {
				var args = Array.prototype.slice.call(arguments);
				args.shift();
				this.options[name].apply(this, args);
			}
		}
	};

	// add stylesheet for slide on DOMReady
	var slideHiddenClass = 'js-slide-hidden';
	(function () {
		var tabStyleSheet = $('<style type="text/css">')[0];
		var tabStyleRule = '.' + slideHiddenClass;
		tabStyleRule += '{position:absolute !important;left:-9999px !important;top:-9999px !important;display:block !important}';
		if (tabStyleSheet.styleSheet) {
			tabStyleSheet.styleSheet.cssText = tabStyleRule;
		} else {
			tabStyleSheet.appendChild(document.createTextNode(tabStyleRule));
		}
		$('head').append(tabStyleSheet);
	}());

	// animation effects
	var toggleEffects = {
		slide: {
			show: function (o) {
				o.box.stop(true).hide().slideDown(o.speed, o.complete);
			},
			hide: function (o) {
				o.box.stop(true).slideUp(o.speed, o.complete);
			}
		},
		fade: {
			show: function (o) {
				o.box.stop(true).hide().fadeIn(o.speed, o.complete);
			},
			hide: function (o) {
				o.box.stop(true).fadeOut(o.speed, o.complete);
			}
		},
		none: {
			show: function (o) {
				o.box.hide().show(0, o.complete);
			},
			hide: function (o) {
				o.box.hide(0, o.complete);
			}
		}
	};

	// jQuery plugin interface
	$.fn.openClose = function (opt) {
		return this.each(function () {
			jQuery(this).data('OpenClose', new OpenClose($.extend(opt, { holder: this })));
		});
	};

	function MobileNav(options) {
		this.options = $.extend({
			container: null,
			hideOnClickOutside: false,
			menuActiveClass: 'nav-active',
			menuOpener: '.nav-opener',
			menuDrop: '.nav-drop',
			toggleEvent: 'click',
			outsideClickEvent: 'click touchstart pointerdown MSPointerDown'
		}, options);
		this.initStructure();
		this.attachEvents();
	}
	MobileNav.prototype = {
		initStructure: function () {
			this.page = $('html');
			this.container = $(this.options.container);
			this.opener = this.container.find(this.options.menuOpener);
			this.drop = this.container.find(this.options.menuDrop);
		},
		attachEvents: function () {
			var self = this;

			if (activateResizeHandler) {
				activateResizeHandler();
				activateResizeHandler = null;
			}

			this.outsideClickHandler = function (e) {
				if (self.isOpened()) {
					var target = $(e.target);
					if (!target.closest(self.opener).length && !target.closest(self.drop).length) {
						self.hide();
					}
				}
			};

			this.openerClickHandler = function (e) {
				e.preventDefault();
				self.toggle();
			};

			this.opener.on(this.options.toggleEvent, this.openerClickHandler);
		},
		isOpened: function () {
			return this.container.hasClass(this.options.menuActiveClass);
		},
		show: function () {
			this.container.addClass(this.options.menuActiveClass);
			if (this.options.hideOnClickOutside) {
				this.page.on(this.options.outsideClickEvent, this.outsideClickHandler);
			}
		},
		hide: function () {
			this.container.removeClass(this.options.menuActiveClass);
			if (this.options.hideOnClickOutside) {
				this.page.off(this.options.outsideClickEvent, this.outsideClickHandler);
			}
		},
		toggle: function () {
			if (this.isOpened()) {
				this.hide();
			} else {
				this.show();
			}
		},
		destroy: function () {
			this.container.removeClass(this.options.menuActiveClass);
			this.opener.off(this.options.toggleEvent, this.clickHandler);
			this.page.off(this.options.outsideClickEvent, this.outsideClickHandler);
		}
	};

	var activateResizeHandler = function () {
		var win = $(window),
			doc = $('html'),
			resizeClass = 'resize-active',
			flag, timer;
		var removeClassHandler = function () {
			flag = false;
			doc.removeClass(resizeClass);
		};
		var resizeHandler = function () {
			if (!flag) {
				flag = true;
				doc.addClass(resizeClass);
			}
			clearTimeout(timer);
			timer = setTimeout(removeClassHandler, 500);
		};
		win.on('resize orientationchange', resizeHandler);
	};

	$.fn.mobileNav = function (options) {
		return this.each(function () {
			var params = $.extend({}, options, { container: this }),
				instance = new MobileNav(params);
			$.data(this, 'MobileNav', instance);
		});
	};

	// Opera Mini v7 doesn’t support placeholder although its DOM seems to indicate so
	var isOperaMini = Object.prototype.toString.call(window.operamini) == '[object OperaMini]';
	var isInputSupported = 'placeholder' in document.createElement('input') && !isOperaMini;
	var isTextareaSupported = 'placeholder' in document.createElement('textarea') && !isOperaMini;
	var prototype = $.fn;
	var valHooks = $.valHooks;
	var propHooks = $.propHooks;
	var hooks;
	var placeholder;

	if (isInputSupported && isTextareaSupported) {

		placeholder = prototype.placeholder = function () {
			return this;
		};

		placeholder.input = placeholder.textarea = true;

	} else {

		placeholder = prototype.placeholder = function () {
			var $this = this;
			$this
				.filter((isInputSupported ? 'textarea' : ':input') + '[placeholder]')
				.not('.placeholder')
				.bind({
					'focus.placeholder': clearPlaceholder,
					'blur.placeholder': setPlaceholder
				})
				.data('placeholder-enabled', true)
				.trigger('blur.placeholder');
			return $this;
		};

		placeholder.input = isInputSupported;
		placeholder.textarea = isTextareaSupported;

		hooks = {
			'get': function (element) {
				var $element = $(element);

				var $passwordInput = $element.data('placeholder-password');
				if ($passwordInput) {
					return $passwordInput[0].value;
				}

				return $element.data('placeholder-enabled') && $element.hasClass('placeholder') ? '' : element.value;
			},
			'set': function (element, value) {
				var $element = $(element);

				var $passwordInput = $element.data('placeholder-password');
				if ($passwordInput) {
					return $passwordInput[0].value = value;
				}

				if (!$element.data('placeholder-enabled')) {
					return element.value = value;
				}
				if (value == '') {
					element.value = value;
					// Issue #56: Setting the placeholder causes problems if the element continues to have focus.
					if (element != safeActiveElement()) {
						// We can't use `triggerHandler` here because of dummy text/password inputs :(
						setPlaceholder.call(element);
					}
				} else if ($element.hasClass('placeholder')) {
					clearPlaceholder.call(element, true, value) || (element.value = value);
				} else {
					element.value = value;
				}
				// `set` can not return `undefined`; see http://jsapi.info/jquery/1.7.1/val#L2363
				return $element;
			}
		};

		if (!isInputSupported) {
			valHooks.input = hooks;
			propHooks.value = hooks;
		}
		if (!isTextareaSupported) {
			valHooks.textarea = hooks;
			propHooks.value = hooks;
		}

		$(function () {
			// Look for forms
			$(document).delegate('form', 'submit.placeholder', function () {
				// Clear the placeholder values so they don't get submitted
				var $inputs = $('.placeholder', this).each(clearPlaceholder);
				setTimeout(function () {
					$inputs.each(setPlaceholder);
				}, 10);
			});
		});

		// Clear placeholder values upon page reload
		$(window).bind('beforeunload.placeholder', function () {
			$('.placeholder').each(function () {
				this.value = '';
			});
		});

	}

	function args(elem) {
		// Return an object of element attributes
		var newAttrs = {};
		var rinlinejQuery = /^jQuery\d+$/;
		$.each(elem.attributes, function (i, attr) {
			if (attr.specified && !rinlinejQuery.test(attr.name)) {
				newAttrs[attr.name] = attr.value;
			}
		});
		return newAttrs;
	}

	function clearPlaceholder(event, value) {
		var input = this;
		var $input = $(input);
		if (input.value == $input.attr('placeholder') && $input.hasClass('placeholder')) {
			if ($input.data('placeholder-password')) {
				$input = $input.hide().next().show().attr('id', $input.removeAttr('id').data('placeholder-id'));
				// If `clearPlaceholder` was called from `$.valHooks.input.set`
				if (event === true) {
					return $input[0].value = value;
				}
				$input.focus();
			} else {
				input.value = '';
				$input.removeClass('placeholder');
				input == safeActiveElement() && input.select();
			}
		}
	}

	function setPlaceholder() {
		var $replacement;
		var input = this;
		var $input = $(input);
		var id = this.id;
		if (input.value == '') {
			if (input.type == 'password') {
				if (!$input.data('placeholder-textinput')) {
					try {
						$replacement = $input.clone().attr({ 'type': 'text' });
					} catch (e) {
						$replacement = $('<input>').attr($.extend(args(this), { 'type': 'text' }));
					}
					$replacement
						.removeAttr('name')
						.data({
							'placeholder-password': $input,
							'placeholder-id': id
						})
						.bind('focus.placeholder', clearPlaceholder);
					$input
						.data({
							'placeholder-textinput': $replacement,
							'placeholder-id': id
						})
						.before($replacement);
				}
				$input = $input.removeAttr('id').hide().prev().attr('id', id).show();
				// Note: `$input[0] != input` now!
			}
			$input.addClass('placeholder');
			$input[0].value = $input.attr('placeholder');
		} else {
			$input.removeClass('placeholder');
		}
	}

	function safeActiveElement() {
		// Avoid IE9 `document.activeElement` of death
		// https://github.com/mathiasbynens/jquery-placeholder/pull/99
		try {
			return document.activeElement;
		} catch (err) { }
	}

	/*TouchNov*/

	function TouchNav(opt) {
		this.options = {
			hoverClass: 'hover',
			menuItems: 'li',
			menuOpener: 'a',
			menuDrop: 'ul',
			navBlock: null
		};
		for (var p in opt) {
			if (opt.hasOwnProperty(p)) {
				this.options[p] = opt[p];
			}
		}
		this.init();
	}
	TouchNav.isActiveOn = function (elem) {
		return elem && elem.touchNavActive;
	};
	TouchNav.prototype = {
		init: function () {
			if (typeof this.options.navBlock === 'string') {
				this.menu = document.getElementById(this.options.navBlock);
			} else if (typeof this.options.navBlock === 'object') {
				this.menu = this.options.navBlock;
			}
			if (this.menu) {
				this.addEvents();
			}
		},
		addEvents: function () {
			// attach event handlers
			var self = this;
			var touchEvent = (navigator.pointerEnabled && 'pointerdown') || (navigator.msPointerEnabled && 'MSPointerDown') || (this.isTouchDevice && 'touchstart');
			this.menuItems = lib.queryElementsBySelector(this.options.menuItems, this.menu);

			var initMenuItem = function (item) {
				var currentDrop = lib.queryElementsBySelector(self.options.menuDrop, item)[0],
					currentOpener = lib.queryElementsBySelector(self.options.menuOpener, item)[0];

				// only for touch input devices
				if (currentDrop && currentOpener && (self.isTouchDevice || self.isPointerDevice)) {
					lib.event.add(currentOpener, 'click', lib.bind(self.clickHandler, self));
					lib.event.add(currentOpener, 'mousedown', lib.bind(self.mousedownHandler, self));
					lib.event.add(currentOpener, touchEvent, function (e) {
						if (!self.isTouchPointerEvent(e)) {
							self.preventCurrentClick = false;
							return;
						}
						self.touchFlag = true;
						self.currentItem = item;
						self.currentLink = currentOpener;
						self.pressHandler.apply(self, arguments);
					});
				}
				// for desktop computers and touch devices
				jQuery(item).bind('mouseenter', function () {
					if (!self.touchFlag) {
						self.currentItem = item;
						self.mouseoverHandler();
					}
				});
				jQuery(item).bind('mouseleave', function () {
					if (!self.touchFlag) {
						self.currentItem = item;
						self.mouseoutHandler();
					}
				});
				item.touchNavActive = true;
			};

			// addd handlers for all menu items
			for (var i = 0; i < this.menuItems.length; i++) {
				initMenuItem(self.menuItems[i]);
			}

			// hide dropdowns when clicking outside navigation
			if (this.isTouchDevice || this.isPointerDevice) {
				lib.event.add(document.documentElement, 'mousedown', lib.bind(this.clickOutsideHandler, this));
				lib.event.add(document.documentElement, touchEvent, lib.bind(this.clickOutsideHandler, this));
			}
		},
		mousedownHandler: function (e) {
			if (this.touchFlag) {
				e.preventDefault();
				this.touchFlag = false;
				this.preventCurrentClick = false;
			}
		},
		mouseoverHandler: function () {
			lib.addClass(this.currentItem, this.options.hoverClass);
			jQuery(this.currentItem).trigger('itemhover');
		},
		mouseoutHandler: function () {
			lib.removeClass(this.currentItem, this.options.hoverClass);
			jQuery(this.currentItem).trigger('itemleave');
		},
		hideActiveDropdown: function () {
			for (var i = 0; i < this.menuItems.length; i++) {
				if (lib.hasClass(this.menuItems[i], this.options.hoverClass)) {
					lib.removeClass(this.menuItems[i], this.options.hoverClass);
					jQuery(this.menuItems[i]).trigger('itemleave');
				}
			}
			this.activeParent = null;
		},
		pressHandler: function (e) {
			// hide previous drop (if active)
			if (this.currentItem !== this.activeParent) {
				if (this.activeParent && this.currentItem.parentNode === this.activeParent.parentNode) {
					lib.removeClass(this.activeParent, this.options.hoverClass);
				} else if (!this.isParent(this.activeParent, this.currentLink)) {
					this.hideActiveDropdown();
				}
			}
			// handle current drop
			this.activeParent = this.currentItem;
			if (lib.hasClass(this.currentItem, this.options.hoverClass)) {
				this.preventCurrentClick = false;
			} else {
				e.preventDefault();
				this.preventCurrentClick = true;
				lib.addClass(this.currentItem, this.options.hoverClass);
				jQuery(this.currentItem).trigger('itemhover');
			}
		},
		clickHandler: function (e) {
			// prevent first click on link
			if (this.preventCurrentClick) {
				e.preventDefault();
			}
		},
		clickOutsideHandler: function (event) {
			var e = event.changedTouches ? event.changedTouches[0] : event;
			if (this.activeParent && !this.isParent(this.menu, e.target)) {
				this.hideActiveDropdown();
				this.touchFlag = false;
			}
		},
		isParent: function (parent, child) {
			while (child.parentNode) {
				if (child.parentNode == parent) {
					return true;
				}
				child = child.parentNode;
			}
			return false;
		},
		isTouchPointerEvent: function (e) {
			return (e.type.indexOf('touch') > -1) ||
					(navigator.pointerEnabled && e.pointerType === 'touch') ||
					(navigator.msPointerEnabled && e.pointerType == e.MSPOINTER_TYPE_TOUCH);
		},
		isPointerDevice: (function () {
			return !!(navigator.pointerEnabled || navigator.msPointerEnabled);
		}()),
		isTouchDevice: (function () {
			return !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch);
		}())
	};


	// initialize fixed blocks on scroll
	function initFixedScrollBlock() {
		jQuery('#wrapper').fixedScrollBlock({
			slideBlock: '#header',
			positionType: 'fixed'
		});
	}

	// fade gallery init
	function initSlideShow() {
		jQuery('.slideshow').fadeGallery({
			slides: '.slide',
			btnPrev: 'a.btn-prev',
			btnNext: 'a.btn-next',
			generatePagination: '.pagination',
			event: 'click',
			disableWhileAnimating: true,
			disableFadeIE: true,
			useSwipe: true,
			autoRotation: true,
			autoHeight: true,
			switchTime: 4000,
			animSpeed: 500
		});
	}

	// open-close init
	function initOpenClose() {
		jQuery('.open-close').openClose({
			hideOnClickOutside: true,
			activeClass: 'active',
			opener: '.opener',
			slider: '.slide',
			animSpeed: 400,
			effect: 'slide'
		});
		jQuery('.open-close-open').openClose({
			activeClass: 'active',
			opener: '.opener',
			slider: '.slide',
			animSpeed: 400,
			effect: 'slide',
			//passive: true
		});

		jQuery('.open-close-select').openClose({
			hideOnClickOutside: true,
			activeClass: 'active',
			opener: '.opener-select',
			slider: '.slide-select',
			animSpeed: 400,
			effect: 'none'
		});
	}

	// fancybox modal popup init
	function initLightbox() {
		if (jQuery.fancybox != null) {
			jQuery('a.lightbox, a[rel*="lightbox"]').fancybox({
				helpers: {
					overlay: {
						css: {
							background: 'rgba(0, 0, 0, 0.65)'
						}
					}
				},
				afterLoad: function(current, previous) {
					// handle custom close button in inline modal
					if (current.href.indexOf('#') === 0) {
						jQuery(current.href).find('a.close').off('click.fb').on('click.fb', function(e) {
							e.preventDefault();
							jQuery.fancybox.close();
						});
					}
				}
			});
		}
	}

	// mobile menu init
	function initMobileNav() {
		jQuery('body').mobileNav({
			hideOnClickOutside: true,
			menuActiveClass: 'nav-active',
			menuOpener: '.nav-opener',
			menuDrop: '#nav'
		});
		jQuery('body').mobileNav({
			hideOnClickOutside: true,
			menuActiveClass: 'form-active',
			menuOpener: '.form-opener',
			menuDrop: '.form-search-slider'
		});
		jQuery('body').mobileNav({
			hideOnClickOutside: true,
			menuActiveClass: 'topbar-active',
			menuOpener: '.topbar-opener',
			menuDrop: '.top-bar'
		});
		jQuery('html').mobileNav({
			hideOnClickOutside: true,
			menuActiveClass: 'body-lock',
			menuOpener: '.main-panel .opener',
			menuDrop: '.main-panel'
		});
	}

	// content tabs init
	function initTabs() {
		jQuery('.tabset').tabset({
			tabLinks: 'a',
			addToParent: true,
			defaultTab: false
		});
	}

	// handle dropdowns on mobile devices
	function initTouchNav() {
		jQuery('#nav').each(function () {
			new TouchNav({
				navBlock: this,
				menuDrop: '.drop'
			});
		});
	}

	// add classes if item has dropdown
	function initDropDownClasses() {
		jQuery('#nav li').each(function () {
			var item = jQuery(this);
			var drop = item.find('ul');
			var link = item.find('a').eq(0);
			if (drop.length) {
				item.addClass('has-drop-down');
				if (link.length) link.addClass('has-drop-down-a');
			}
		});
	}

	/*
	 * Utility module
	 */
	lib = {
		hasClass: function (el, cls) {
			return el && el.className ? el.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)')) : false;
		},
		addClass: function (el, cls) {
			if (el && !this.hasClass(el, cls)) el.className += " " + cls;
		},
		removeClass: function (el, cls) {
			if (el && this.hasClass(el, cls)) { el.className = el.className.replace(new RegExp('(\\s|^)' + cls + '(\\s|$)'), ' '); }
		},
		extend: function (obj) {
			for (var i = 1; i < arguments.length; i++) {
				for (var p in arguments[i]) {
					if (arguments[i].hasOwnProperty(p)) {
						obj[p] = arguments[i][p];
					}
				}
			}
			return obj;
		},
		each: function (obj, callback) {
			var property, len;
			if (typeof obj.length === 'number') {
				for (property = 0, len = obj.length; property < len; property++) {
					if (callback.call(obj[property], property, obj[property]) === false) {
						break;
					}
				}
			} else {
				for (property in obj) {
					if (obj.hasOwnProperty(property)) {
						if (callback.call(obj[property], property, obj[property]) === false) {
							break;
						}
					}
				}
			}
		},
		event: (function () {
			var fixEvent = function (e) {
				e = e || window.event;
				if (e.isFixed) return e; else e.isFixed = true;
				if (!e.target) e.target = e.srcElement;
				e.preventDefault = e.preventDefault || function () { this.returnValue = false; };
				e.stopPropagation = e.stopPropagation || function () { this.cancelBubble = true; };
				return e;
			};
			return {
				add: function (elem, event, handler) {
					if (!elem.events) {
						elem.events = {};
						elem.handle = function (e) {
							var ret, handlers = elem.events[e.type];
							e = fixEvent(e);
							for (var i = 0, len = handlers.length; i < len; i++) {
								if (handlers[i]) {
									ret = handlers[i].call(elem, e);
									if (ret === false) {
										e.preventDefault();
										e.stopPropagation();
									}
								}
							}
						};
					}
					if (!elem.events[event]) {
						elem.events[event] = [];
						if (elem.addEventListener) elem.addEventListener(event, elem.handle, false);
						else if (elem.attachEvent) elem.attachEvent('on' + event, elem.handle);
					}
					elem.events[event].push(handler);
				},
				remove: function (elem, event, handler) {
					var handlers = elem.events[event];
					for (var i = handlers.length - 1; i >= 0; i--) {
						if (handlers[i] === handler) {
							handlers.splice(i, 1);
						}
					}
					if (!handlers.length) {
						delete elem.events[event];
						if (elem.removeEventListener) elem.removeEventListener(event, elem.handle, false);
						else if (elem.detachEvent) elem.detachEvent('on' + event, elem.handle);
					}
				}
			};
		}()),
		queryElementsBySelector: function (selector, scope) {
			scope = scope || document;
			if (!selector) return [];
			if (selector === '>*') return scope.children;
			if (typeof document.querySelectorAll === 'function') {
				return scope.querySelectorAll(selector);
			}
			var selectors = selector.split(',');
			var resultList = [];
			for (var s = 0; s < selectors.length; s++) {
				var currentContext = [scope || document];
				var tokens = selectors[s].replace(/^\s+/, '').replace(/\s+$/, '').split(' ');
				for (var i = 0; i < tokens.length; i++) {
					token = tokens[i].replace(/^\s+/, '').replace(/\s+$/, '');
					if (token.indexOf('#') > -1) {
						var bits = token.split('#'), tagName = bits[0], id = bits[1];
						var element = document.getElementById(id);
						if (element && tagName && element.nodeName.toLowerCase() != tagName) {
							return [];
						}
						currentContext = element ? [element] : [];
						continue;
					}
					if (token.indexOf('.') > -1) {
						var bits = token.split('.'), tagName = bits[0] || '*', className = bits[1], found = [], foundCount = 0;
						for (var h = 0; h < currentContext.length; h++) {
							var elements;
							if (tagName == '*') {
								elements = currentContext[h].getElementsByTagName('*');
							} else {
								elements = currentContext[h].getElementsByTagName(tagName);
							}
							for (var j = 0; j < elements.length; j++) {
								found[foundCount++] = elements[j];
							}
						}
						currentContext = [];
						var currentContextIndex = 0;
						for (var k = 0; k < found.length; k++) {
							if (found[k].className && found[k].className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'))) {
								currentContext[currentContextIndex++] = found[k];
							}
						}
						continue;
					}
					if (token.match(/^(\w*)\[(\w+)([=~\|\^\$\*]?)=?"?([^\]"]*)"?\]$/)) {
						var tagName = RegExp.$1 || '*', attrName = RegExp.$2, attrOperator = RegExp.$3, attrValue = RegExp.$4;
						if (attrName.toLowerCase() == 'for' && this.browser.msie && this.browser.version < 8) {
							attrName = 'htmlFor';
						}
						var found = [], foundCount = 0;
						for (var h = 0; h < currentContext.length; h++) {
							var elements;
							if (tagName == '*') {
								elements = currentContext[h].getElementsByTagName('*');
							} else {
								elements = currentContext[h].getElementsByTagName(tagName);
							}
							for (var j = 0; elements[j]; j++) {
								found[foundCount++] = elements[j];
							}
						}
						currentContext = [];
						var currentContextIndex = 0, checkFunction;
						switch (attrOperator) {
							case '=': checkFunction = function (e) { return (e.getAttribute(attrName) == attrValue) }; break;
							case '~': checkFunction = function (e) { return (e.getAttribute(attrName).match(new RegExp('(\\s|^)' + attrValue + '(\\s|$)'))) }; break;
							case '|': checkFunction = function (e) { return (e.getAttribute(attrName).match(new RegExp('^' + attrValue + '-?'))) }; break;
							case '^': checkFunction = function (e) { return (e.getAttribute(attrName).indexOf(attrValue) == 0) }; break;
							case '$': checkFunction = function (e) { return (e.getAttribute(attrName).lastIndexOf(attrValue) == e.getAttribute(attrName).length - attrValue.length) }; break;
							case '*': checkFunction = function (e) { return (e.getAttribute(attrName).indexOf(attrValue) > -1) }; break;
							default: checkFunction = function (e) { return e.getAttribute(attrName) };
						}
						currentContext = [];
						var currentContextIndex = 0;
						for (var k = 0; k < found.length; k++) {
							if (checkFunction(found[k])) {
								currentContext[currentContextIndex++] = found[k];
							}
						}
						continue;
					}
					tagName = token;
					var found = [], foundCount = 0;
					for (var h = 0; h < currentContext.length; h++) {
						var elements = currentContext[h].getElementsByTagName(tagName);
						for (var j = 0; j < elements.length; j++) {
							found[foundCount++] = elements[j];
						}
					}
					currentContext = found;
				}
				resultList = [].concat(resultList, currentContext);
			}
			return resultList;
		},
		trim: function (str) {
			return str.replace(/^\s+/, '').replace(/\s+$/, '');
		},
		bind: function (f, scope, forceArgs) {
			return function () { return f.apply(scope, typeof forceArgs !== 'undefined' ? [forceArgs] : arguments); };
		}
	};

	// handle flexible video size
	function initFitVids() {
		jQuery('#wrapper').fitVids();
	}

	// checked classes when element active
	function initCheckedClasses() {
		var checkedClass = 'input-checked', parentCheckedClass = 'input-checked-parent';
		var pairs = [];
		jQuery('label[for]').each(function (index, label) {
			var input = jQuery('#' + label.htmlFor);
			label = jQuery(label);

			// click handler
			if (input.length) {
				pairs.push({ input: input, label: label });
				input.bind('click change', function () {
					if (input.is(':radio')) {
						jQuery.each(pairs, function (index, pair) {
							refreshState(pair.input, pair.label);
						});
					} else {
						refreshState(input, label);
					}
				});
				refreshState(input, label);
			}
		});

		// refresh classes
		function refreshState(input, label) {
			if (input.is(':checked')) {
				input.parent().addClass(parentCheckedClass);
				label.addClass(checkedClass);
			} else {
				input.parent().removeClass(parentCheckedClass);
				label.removeClass(checkedClass);
			}
		}
	}

	/*
	 * jQuery SlideShow plugin
	 */

	function FadeGallery(options) {
		this.options = $.extend({
			slides: 'ul.slideset > li',
			activeClass: 'active',
			disabledClass: 'disabled',
			btnPrev: 'a.btn-prev',
			btnNext: 'a.btn-next',
			generatePagination: false,
			pagerList: '<ul>',
			pagerListItem: '<li><a href="#"></a></li>',
			pagerListItemText: 'a',
			pagerLinks: '.pagination li',
			currentNumber: 'span.current-num',
			totalNumber: 'span.total-num',
			btnPlay: '.btn-play',
			btnPause: '.btn-pause',
			btnPlayPause: '.btn-play-pause',
			galleryReadyClass: 'gallery-js-ready',
			autorotationActiveClass: 'autorotation-active',
			autorotationDisabledClass: 'autorotation-disabled',
			autorotationStopAfterClick: false,
			circularRotation: true,
			switchSimultaneously: true,
			disableWhileAnimating: false,
			disableFadeIE: false,
			autoRotation: false,
			pauseOnHover: true,
			autoHeight: false,
			useSwipe: false,
			swipeThreshold: 15,
			switchTime: 4000,
			animSpeed: 600,
			event: 'click'
		}, options);
		this.init();
	}
	FadeGallery.prototype = {
		init: function () {
			if (this.options.holder) {
				this.findElements();
				this.attachEvents();
				this.refreshState(true);
				this.autoRotate();
				this.makeCallback('onInit', this);
			}
		},
		findElements: function () {
			// control elements
			this.gallery = $(this.options.holder).addClass(this.options.galleryReadyClass);
			this.slides = this.gallery.find(this.options.slides);
			this.slidesHolder = this.slides.eq(0).parent();
			this.stepsCount = this.slides.length;
			this.btnPrev = this.gallery.find(this.options.btnPrev);
			this.btnNext = this.gallery.find(this.options.btnNext);
			this.currentIndex = 0;

			// disable fade effect in old IE
			if (this.options.disableFadeIE && !$.support.opacity) {
				this.options.animSpeed = 0;
			}

			// create gallery pagination
			if (typeof this.options.generatePagination === 'string') {
				this.pagerHolder = this.gallery.find(this.options.generatePagination).empty();
				this.pagerList = $(this.options.pagerList).appendTo(this.pagerHolder);
				for (var i = 0; i < this.stepsCount; i++) {
					$(this.options.pagerListItem).appendTo(this.pagerList).find(this.options.pagerListItemText).text(i + 1);
				}
				this.pagerLinks = this.pagerList.children();
			} else {
				this.pagerLinks = this.gallery.find(this.options.pagerLinks);
			}

			// get start index
			var activeSlide = this.slides.filter('.' + this.options.activeClass);
			if (activeSlide.length) {
				this.currentIndex = this.slides.index(activeSlide);
			}
			this.prevIndex = this.currentIndex;

			// autorotation control buttons
			this.btnPlay = this.gallery.find(this.options.btnPlay);
			this.btnPause = this.gallery.find(this.options.btnPause);
			this.btnPlayPause = this.gallery.find(this.options.btnPlayPause);

			// misc elements
			this.curNum = this.gallery.find(this.options.currentNumber);
			this.allNum = this.gallery.find(this.options.totalNumber);

			// handle flexible layout
			this.slides.css({ display: 'block', opacity: 0 }).eq(this.currentIndex).css({
				opacity: ''
			});
		},
		attachEvents: function () {
			var self = this;

			// flexible layout handler
			this.resizeHandler = function () {
				self.onWindowResize();
			};
			$(window).bind('load resize orientationchange', this.resizeHandler);

			if (this.btnPrev.length) {
				this.btnPrevHandler = function (e) {
					e.preventDefault();
					self.prevSlide();
					if (self.options.autorotationStopAfterClick) {
						self.stopRotation();
					}
				};
				this.btnPrev.bind(this.options.event, this.btnPrevHandler);
			}
			if (this.btnNext.length) {
				this.btnNextHandler = function (e) {
					e.preventDefault();
					self.nextSlide();
					if (self.options.autorotationStopAfterClick) {
						self.stopRotation();
					}
				};
				this.btnNext.bind(this.options.event, this.btnNextHandler);
			}
			if (this.pagerLinks.length) {
				this.pagerLinksHandler = function (e) {
					e.preventDefault();
					self.numSlide(self.pagerLinks.index(e.currentTarget));
					if (self.options.autorotationStopAfterClick) {
						self.stopRotation();
					}
				};
				this.pagerLinks.bind(self.options.event, this.pagerLinksHandler);
			}

			// autorotation buttons handler
			if (this.btnPlay.length) {
				this.btnPlayHandler = function (e) {
					e.preventDefault();
					self.startRotation();
				};
				this.btnPlay.bind(this.options.event, this.btnPlayHandler);
			}
			if (this.btnPause.length) {
				this.btnPauseHandler = function (e) {
					e.preventDefault();
					self.stopRotation();
				};
				this.btnPause.bind(this.options.event, this.btnPauseHandler);
			}
			if (this.btnPlayPause.length) {
				this.btnPlayPauseHandler = function (e) {
					e.preventDefault();
					if (!self.gallery.hasClass(self.options.autorotationActiveClass)) {
						self.startRotation();
					} else {
						self.stopRotation();
					}
				};
				this.btnPlayPause.bind(this.options.event, this.btnPlayPauseHandler);
			}

			// swipe gestures handler
			if (this.options.useSwipe && window.Hammer && isTouchDevice) {
				this.swipeHandler = new Hammer.Manager(this.gallery[0]);
				this.swipeHandler.add(new Hammer.Swipe({
					direction: Hammer.DIRECTION_HORIZONTAL,
					threshold: self.options.swipeThreshold
				}));
				this.swipeHandler.on('swipeleft', function () {
					self.nextSlide();
				}).on('swiperight', function () {
					self.prevSlide();
				});
			}

			// pause on hover handling
			if (this.options.pauseOnHover) {
				this.hoverHandler = function () {
					if (self.options.autoRotation) {
						self.galleryHover = true;
						self.pauseRotation();
					}
				};
				this.leaveHandler = function () {
					if (self.options.autoRotation) {
						self.galleryHover = false;
						self.resumeRotation();
					}
				};
				this.gallery.bind({ mouseenter: this.hoverHandler, mouseleave: this.leaveHandler });
			}
		},
		onWindowResize: function () {
			if (this.options.autoHeight) {
				this.slidesHolder.css({ height: this.slides.eq(this.currentIndex).outerHeight(true) });
			}
		},
		prevSlide: function () {
			if (!(this.options.disableWhileAnimating && this.galleryAnimating)) {
				this.prevIndex = this.currentIndex;
				if (this.currentIndex > 0) {
					this.currentIndex--;
					this.switchSlide();
				} else if (this.options.circularRotation) {
					this.currentIndex = this.stepsCount - 1;
					this.switchSlide();
				}
			}
		},
		nextSlide: function (fromAutoRotation) {
			if (!(this.options.disableWhileAnimating && this.galleryAnimating)) {
				this.prevIndex = this.currentIndex;
				if (this.currentIndex < this.stepsCount - 1) {
					this.currentIndex++;
					this.switchSlide();
				} else if (this.options.circularRotation || fromAutoRotation === true) {
					this.currentIndex = 0;
					this.switchSlide();
				}
			}
		},
		numSlide: function (c) {
			if (this.currentIndex != c) {
				this.prevIndex = this.currentIndex;
				this.currentIndex = c;
				this.switchSlide();
			}
		},
		switchSlide: function () {
			var self = this;
			if (this.slides.length > 1) {
				this.galleryAnimating = true;
				if (!this.options.animSpeed) {
					this.slides.eq(this.prevIndex).css({ opacity: 0 });
				} else {
					this.slides.eq(this.prevIndex).stop().animate({ opacity: 0 }, { duration: this.options.animSpeed });
				}

				this.switchNext = function () {
					if (!self.options.animSpeed) {
						self.slides.eq(self.currentIndex).css({ opacity: '' });
					} else {
						self.slides.eq(self.currentIndex).stop().animate({ opacity: 1 }, { duration: self.options.animSpeed });
					}
					clearTimeout(this.nextTimer);
					this.nextTimer = setTimeout(function () {
						self.slides.eq(self.currentIndex).css({ opacity: '' });
						self.galleryAnimating = false;
						self.autoRotate();

						// onchange callback
						self.makeCallback('onChange', self);
					}, self.options.animSpeed);
				};

				if (this.options.switchSimultaneously) {
					self.switchNext();
				} else {
					clearTimeout(this.switchTimer);
					this.switchTimer = setTimeout(function () {
						self.switchNext();
					}, this.options.animSpeed);
				}
				this.refreshState();

				// onchange callback
				this.makeCallback('onBeforeChange', this);
			}
		},
		refreshState: function (initial) {
			this.slides.removeClass(this.options.activeClass).eq(this.currentIndex).addClass(this.options.activeClass);
			this.pagerLinks.removeClass(this.options.activeClass).eq(this.currentIndex).addClass(this.options.activeClass);
			this.curNum.html(this.currentIndex + 1);
			this.allNum.html(this.stepsCount);

			// initial refresh
			if (this.options.autoHeight) {
				if (initial) {
					this.slidesHolder.css({ height: this.slides.eq(this.currentIndex).outerHeight(true) });
				} else {
					this.slidesHolder.stop().animate({ height: this.slides.eq(this.currentIndex).outerHeight(true) }, { duration: this.options.animSpeed });
				}
			}

			// disabled state
			if (!this.options.circularRotation) {
				this.btnPrev.add(this.btnNext).removeClass(this.options.disabledClass);
				if (this.currentIndex === 0) this.btnPrev.addClass(this.options.disabledClass);
				if (this.currentIndex === this.stepsCount - 1) this.btnNext.addClass(this.options.disabledClass);
			}

			// add class if not enough slides
			this.gallery.toggleClass('not-enough-slides', this.stepsCount === 1);
		},
		startRotation: function () {
			this.options.autoRotation = true;
			this.galleryHover = false;
			this.autoRotationStopped = false;
			this.resumeRotation();
		},
		stopRotation: function () {
			this.galleryHover = true;
			this.autoRotationStopped = true;
			this.pauseRotation();
		},
		pauseRotation: function () {
			this.gallery.addClass(this.options.autorotationDisabledClass);
			this.gallery.removeClass(this.options.autorotationActiveClass);
			clearTimeout(this.timer);
		},
		resumeRotation: function () {
			if (!this.autoRotationStopped) {
				this.gallery.addClass(this.options.autorotationActiveClass);
				this.gallery.removeClass(this.options.autorotationDisabledClass);
				this.autoRotate();
			}
		},
		autoRotate: function () {
			var self = this;
			clearTimeout(this.timer);
			if (this.options.autoRotation && !this.galleryHover && !this.autoRotationStopped) {
				this.gallery.addClass(this.options.autorotationActiveClass);
				this.timer = setTimeout(function () {
					self.nextSlide(true);
				}, this.options.switchTime);
			} else {
				this.pauseRotation();
			}
		},
		makeCallback: function (name) {
			if (typeof this.options[name] === 'function') {
				var args = Array.prototype.slice.call(arguments);
				args.shift();
				this.options[name].apply(this, args);
			}
		},
		destroy: function () {
			// navigation buttons handler
			this.btnPrev.unbind(this.options.event, this.btnPrevHandler);
			this.btnNext.unbind(this.options.event, this.btnNextHandler);
			this.pagerLinks.unbind(this.options.event, this.pagerLinksHandler);
			$(window).unbind('load resize orientationchange', this.resizeHandler);

			// remove autorotation handlers
			this.stopRotation();
			this.btnPlay.unbind(this.options.event, this.btnPlayHandler);
			this.btnPause.unbind(this.options.event, this.btnPauseHandler);
			this.btnPlayPause.unbind(this.options.event, this.btnPlayPauseHandler);
			this.gallery.unbind('mouseenter', this.hoverHandler);
			this.gallery.unbind('mouseleave', this.leaveHandler);

			// remove swipe handler if used
			if (this.swipeHandler) {
				this.swipeHandler.destroy();
			}
			if (typeof this.options.generatePagination === 'string') {
				this.pagerHolder.empty();
			}

			// remove unneeded classes and styles
			var unneededClasses = [this.options.galleryReadyClass, this.options.autorotationActiveClass, this.options.autorotationDisabledClass];
			this.gallery.removeClass(unneededClasses.join(' '));
			this.slidesHolder.add(this.slides).removeAttr('style');
		}
	};

	// detect device type
	var isTouchDevice = /Windows Phone/.test(navigator.userAgent) || ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch;

	// jquery plugin
	$.fn.fadeGallery = function (opt) {
		return this.each(function () {
			$(this).data('FadeGallery', new FadeGallery($.extend(opt, { holder: this })));
		});
	};

	window.addEventListener('load', function () {
		var loader = document.querySelector('html.loader');

		if (loader) {
			loader.classList.add('loaded');
		}
	});


	jQuery(function () {
		initFixedScrollBlock();
		initTabs();
		initTouchNav();
		initLightbox();	//todo
		initMobileNav();
		initSlideShow();
		initOpenClose();
		initDropDownClasses();
		initCheckedClasses();
		//initFitVids();	//todo
		jQuery('input, textarea').placeholder();
	});

	return $;

})(jQuery, window, document);

/*! fancyBox v2.1.5 fancyapps.com | fancyapps.com/fancybox/#license */
; (function (r, G, f, v) { var J = f("html"), n = f(r), p = f(G), b = f.fancybox = function () { b.open.apply(this, arguments) }, I = navigator.userAgent.match(/msie/i), B = null, s = G.createTouch !== v, t = function (a) { return a && a.hasOwnProperty && a instanceof f }, q = function (a) { return a && "string" === f.type(a) }, E = function (a) { return q(a) && 0 < a.indexOf("%") }, l = function (a, d) { var e = parseInt(a, 10) || 0; d && E(a) && (e *= b.getViewport()[d] / 100); return Math.ceil(e) }, w = function (a, b) { return l(a, b) + "px" }; f.extend(b, { version: "2.1.5", defaults: { padding: 15, margin: 20, width: 800, height: 600, minWidth: 100, minHeight: 100, maxWidth: 9999, maxHeight: 9999, pixelRatio: 1, autoSize: !0, autoHeight: !1, autoWidth: !1, autoResize: !0, autoCenter: !s, fitToView: !0, aspectRatio: !1, topRatio: 0.5, leftRatio: 0.5, scrolling: "auto", wrapCSS: "", arrows: !0, closeBtn: !0, closeClick: !1, nextClick: !1, mouseWheel: !0, autoPlay: !1, playSpeed: 3E3, preload: 3, modal: !1, loop: !0, ajax: { dataType: "html", headers: { "X-fancyBox": !0 } }, iframe: { scrolling: "auto", preload: !0 }, swf: { wmode: "transparent", allowfullscreen: "true", allowscriptaccess: "always" }, keys: { next: { 13: "left", 34: "up", 39: "left", 40: "up" }, prev: { 8: "right", 33: "down", 37: "right", 38: "down" }, close: [27], play: [32], toggle: [70] }, direction: { next: "left", prev: "right" }, scrollOutside: !0, index: 0, type: null, href: null, content: null, title: null, tpl: { wrap: '<div class="fancybox-wrap" tabIndex="-1"><div class="fancybox-skin"><div class="fancybox-outer"><div class="fancybox-inner"></div></div></div></div>', image: '<img class="fancybox-image" src="{href}" alt="" />', iframe: '<iframe id="fancybox-frame{rnd}" name="fancybox-frame{rnd}" class="fancybox-iframe" frameborder="0" vspace="0" hspace="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen' + (I ? ' allowtransparency="true"' : "") + "></iframe>", error: '<p class="fancybox-error">The requested content cannot be loaded.<br/>Please try again later.</p>', closeBtn: '<a title="Close" class="fancybox-item fancybox-close" href="javascript:;"></a>', next: '<a title="Next" class="fancybox-nav fancybox-next" href="javascript:;"><span></span></a>', prev: '<a title="Previous" class="fancybox-nav fancybox-prev" href="javascript:;"><span></span></a>' }, openEffect: "fade", openSpeed: 250, openEasing: "swing", openOpacity: !0, openMethod: "zoomIn", closeEffect: "fade", closeSpeed: 250, closeEasing: "swing", closeOpacity: !0, closeMethod: "zoomOut", nextEffect: "elastic", nextSpeed: 250, nextEasing: "swing", nextMethod: "changeIn", prevEffect: "elastic", prevSpeed: 250, prevEasing: "swing", prevMethod: "changeOut", helpers: { overlay: !0, title: !0 }, onCancel: f.noop, beforeLoad: f.noop, afterLoad: f.noop, beforeShow: f.noop, afterShow: f.noop, beforeChange: f.noop, beforeClose: f.noop, afterClose: f.noop }, group: {}, opts: {}, previous: null, coming: null, current: null, isActive: !1, isOpen: !1, isOpened: !1, wrap: null, skin: null, outer: null, inner: null, player: { timer: null, isActive: !1 }, ajaxLoad: null, imgPreload: null, transitions: {}, helpers: {}, open: function (a, d) { if (a && (f.isPlainObject(d) || (d = {}), !1 !== b.close(!0))) return f.isArray(a) || (a = t(a) ? f(a).get() : [a]), f.each(a, function (e, c) { var k = {}, g, h, j, m, l; "object" === f.type(c) && (c.nodeType && (c = f(c)), t(c) ? (k = { href: c.data("fancybox-href") || c.attr("href"), title: c.data("fancybox-title") || c.attr("title"), isDom: !0, element: c }, f.metadata && f.extend(!0, k, c.metadata())) : k = c); g = d.href || k.href || (q(c) ? c : null); h = d.title !== v ? d.title : k.title || ""; m = (j = d.content || k.content) ? "html" : d.type || k.type; !m && k.isDom && (m = c.data("fancybox-type"), m || (m = (m = c.prop("class").match(/fancybox\.(\w+)/)) ? m[1] : null)); q(g) && (m || (b.isImage(g) ? m = "image" : b.isSWF(g) ? m = "swf" : "#" === g.charAt(0) ? m = "inline" : q(c) && (m = "html", j = c)), "ajax" === m && (l = g.split(/\s+/, 2), g = l.shift(), l = l.shift())); j || ("inline" === m ? g ? j = f(q(g) ? g.replace(/.*(?=#[^\s]+$)/, "") : g) : k.isDom && (j = c) : "html" === m ? j = g : !m && (!g && k.isDom) && (m = "inline", j = c)); f.extend(k, { href: g, type: m, content: j, title: h, selector: l }); a[e] = k }), b.opts = f.extend(!0, {}, b.defaults, d), d.keys !== v && (b.opts.keys = d.keys ? f.extend({}, b.defaults.keys, d.keys) : !1), b.group = a, b._start(b.opts.index) }, cancel: function () { var a = b.coming; a && !1 !== b.trigger("onCancel") && (b.hideLoading(), b.ajaxLoad && b.ajaxLoad.abort(), b.ajaxLoad = null, b.imgPreload && (b.imgPreload.onload = b.imgPreload.onerror = null), a.wrap && a.wrap.stop(!0, !0).trigger("onReset").remove(), b.coming = null, b.current || b._afterZoomOut(a)) }, close: function (a) { b.cancel(); !1 !== b.trigger("beforeClose") && (b.unbindEvents(), b.isActive && (!b.isOpen || !0 === a ? (f(".fancybox-wrap").stop(!0).trigger("onReset").remove(), b._afterZoomOut()) : (b.isOpen = b.isOpened = !1, b.isClosing = !0, f(".fancybox-item, .fancybox-nav").remove(), b.wrap.stop(!0, !0).removeClass("fancybox-opened"), b.transitions[b.current.closeMethod]()))) }, play: function (a) { var d = function () { clearTimeout(b.player.timer) }, e = function () { d(); b.current && b.player.isActive && (b.player.timer = setTimeout(b.next, b.current.playSpeed)) }, c = function () { d(); p.unbind(".player"); b.player.isActive = !1; b.trigger("onPlayEnd") }; if (!0 === a || !b.player.isActive && !1 !== a) { if (b.current && (b.current.loop || b.current.index < b.group.length - 1)) b.player.isActive = !0, p.bind({ "onCancel.player beforeClose.player": c, "onUpdate.player": e, "beforeLoad.player": d }), e(), b.trigger("onPlayStart") } else c() }, next: function (a) { var d = b.current; d && (q(a) || (a = d.direction.next), b.jumpto(d.index + 1, a, "next")) }, prev: function (a) { var d = b.current; d && (q(a) || (a = d.direction.prev), b.jumpto(d.index - 1, a, "prev")) }, jumpto: function (a, d, e) { var c = b.current; c && (a = l(a), b.direction = d || c.direction[a >= c.index ? "next" : "prev"], b.router = e || "jumpto", c.loop && (0 > a && (a = c.group.length + a % c.group.length), a %= c.group.length), c.group[a] !== v && (b.cancel(), b._start(a))) }, reposition: function (a, d) { var e = b.current, c = e ? e.wrap : null, k; c && (k = b._getPosition(d), a && "scroll" === a.type ? (delete k.position, c.stop(!0, !0).animate(k, 200)) : (c.css(k), e.pos = f.extend({}, e.dim, k))) }, update: function (a) { var d = a && a.type, e = !d || "orientationchange" === d; e && (clearTimeout(B), B = null); b.isOpen && !B && (B = setTimeout(function () { var c = b.current; c && !b.isClosing && (b.wrap.removeClass("fancybox-tmp"), (e || "load" === d || "resize" === d && c.autoResize) && b._setDimension(), "scroll" === d && c.canShrink || b.reposition(a), b.trigger("onUpdate"), B = null) }, e && !s ? 0 : 300)) }, toggle: function (a) { b.isOpen && (b.current.fitToView = "boolean" === f.type(a) ? a : !b.current.fitToView, s && (b.wrap.removeAttr("style").addClass("fancybox-tmp"), b.trigger("onUpdate")), b.update()) }, hideLoading: function () { p.unbind(".loading"); f("#fancybox-loading").remove() }, showLoading: function () { var a, d; b.hideLoading(); a = f('<div id="fancybox-loading"><div></div></div>').click(b.cancel).appendTo("body"); p.bind("keydown.loading", function (a) { if (27 === (a.which || a.keyCode)) a.preventDefault(), b.cancel() }); b.defaults.fixed || (d = b.getViewport(), a.css({ position: "absolute", top: 0.5 * d.h + d.y, left: 0.5 * d.w + d.x })) }, getViewport: function () { var a = b.current && b.current.locked || !1, d = { x: n.scrollLeft(), y: n.scrollTop() }; a ? (d.w = a[0].clientWidth, d.h = a[0].clientHeight) : (d.w = s && r.innerWidth ? r.innerWidth : n.width(), d.h = s && r.innerHeight ? r.innerHeight : n.height()); return d }, unbindEvents: function () { b.wrap && t(b.wrap) && b.wrap.unbind(".fb"); p.unbind(".fb"); n.unbind(".fb") }, bindEvents: function () { var a = b.current, d; a && (n.bind("orientationchange.fb" + (s ? "" : " resize.fb") + (a.autoCenter && !a.locked ? " scroll.fb" : ""), b.update), (d = a.keys) && p.bind("keydown.fb", function (e) { var c = e.which || e.keyCode, k = e.target || e.srcElement; if (27 === c && b.coming) return !1; !e.ctrlKey && (!e.altKey && !e.shiftKey && !e.metaKey && (!k || !k.type && !f(k).is("[contenteditable]"))) && f.each(d, function (d, k) { if (1 < a.group.length && k[c] !== v) return b[d](k[c]), e.preventDefault(), !1; if (-1 < f.inArray(c, k)) return b[d](), e.preventDefault(), !1 }) }), f.fn.mousewheel && a.mouseWheel && b.wrap.bind("mousewheel.fb", function (d, c, k, g) { for (var h = f(d.target || null), j = !1; h.length && !j && !h.is(".fancybox-skin") && !h.is(".fancybox-wrap") ;) j = h[0] && !(h[0].style.overflow && "hidden" === h[0].style.overflow) && (h[0].clientWidth && h[0].scrollWidth > h[0].clientWidth || h[0].clientHeight && h[0].scrollHeight > h[0].clientHeight), h = f(h).parent(); if (0 !== c && !j && 1 < b.group.length && !a.canShrink) { if (0 < g || 0 < k) b.prev(0 < g ? "down" : "left"); else if (0 > g || 0 > k) b.next(0 > g ? "up" : "right"); d.preventDefault() } })) }, trigger: function (a, d) { var e, c = d || b.coming || b.current; if (c) { f.isFunction(c[a]) && (e = c[a].apply(c, Array.prototype.slice.call(arguments, 1))); if (!1 === e) return !1; c.helpers && f.each(c.helpers, function (d, e) { if (e && b.helpers[d] && f.isFunction(b.helpers[d][a])) b.helpers[d][a](f.extend(!0, {}, b.helpers[d].defaults, e), c) }); p.trigger(a) } }, isImage: function (a) { return q(a) && a.match(/(^data:image\/.*,)|(\.(jp(e|g|eg)|gif|png|bmp|webp|svg)((\?|#).*)?$)/i) }, isSWF: function (a) { return q(a) && a.match(/\.(swf)((\?|#).*)?$/i) }, _start: function (a) { var d = {}, e, c; a = l(a); e = b.group[a] || null; if (!e) return !1; d = f.extend(!0, {}, b.opts, e); e = d.margin; c = d.padding; "number" === f.type(e) && (d.margin = [e, e, e, e]); "number" === f.type(c) && (d.padding = [c, c, c, c]); d.modal && f.extend(!0, d, { closeBtn: !1, closeClick: !1, nextClick: !1, arrows: !1, mouseWheel: !1, keys: null, helpers: { overlay: { closeClick: !1 } } }); d.autoSize && (d.autoWidth = d.autoHeight = !0); "auto" === d.width && (d.autoWidth = !0); "auto" === d.height && (d.autoHeight = !0); d.group = b.group; d.index = a; b.coming = d; if (!1 === b.trigger("beforeLoad")) b.coming = null; else { c = d.type; e = d.href; if (!c) return b.coming = null, b.current && b.router && "jumpto" !== b.router ? (b.current.index = a, b[b.router](b.direction)) : !1; b.isActive = !0; if ("image" === c || "swf" === c) d.autoHeight = d.autoWidth = !1, d.scrolling = "visible"; "image" === c && (d.aspectRatio = !0); "iframe" === c && s && (d.scrolling = "scroll"); d.wrap = f(d.tpl.wrap).addClass("fancybox-" + (s ? "mobile" : "desktop") + " fancybox-type-" + c + " fancybox-tmp " + d.wrapCSS).appendTo(d.parent || "body"); f.extend(d, { skin: f(".fancybox-skin", d.wrap), outer: f(".fancybox-outer", d.wrap), inner: f(".fancybox-inner", d.wrap) }); f.each(["Top", "Right", "Bottom", "Left"], function (a, b) { d.skin.css("padding" + b, w(d.padding[a])) }); b.trigger("onReady"); if ("inline" === c || "html" === c) { if (!d.content || !d.content.length) return b._error("content") } else if (!e) return b._error("href"); "image" === c ? b._loadImage() : "ajax" === c ? b._loadAjax() : "iframe" === c ? b._loadIframe() : b._afterLoad() } }, _error: function (a) { f.extend(b.coming, { type: "html", autoWidth: !0, autoHeight: !0, minWidth: 0, minHeight: 0, scrolling: "no", hasError: a, content: b.coming.tpl.error }); b._afterLoad() }, _loadImage: function () { var a = b.imgPreload = new Image; a.onload = function () { this.onload = this.onerror = null; b.coming.width = this.width / b.opts.pixelRatio; b.coming.height = this.height / b.opts.pixelRatio; b._afterLoad() }; a.onerror = function () { this.onload = this.onerror = null; b._error("image") }; a.src = b.coming.href; !0 !== a.complete && b.showLoading() }, _loadAjax: function () { var a = b.coming; b.showLoading(); b.ajaxLoad = f.ajax(f.extend({}, a.ajax, { url: a.href, error: function (a, e) { b.coming && "abort" !== e ? b._error("ajax", a) : b.hideLoading() }, success: function (d, e) { "success" === e && (a.content = d, b._afterLoad()) } })) }, _loadIframe: function () { var a = b.coming, d = f(a.tpl.iframe.replace(/\{rnd\}/g, (new Date).getTime())).attr("scrolling", s ? "auto" : a.iframe.scrolling).attr("src", a.href); f(a.wrap).bind("onReset", function () { try { f(this).find("iframe").hide().attr("src", "//about:blank").end().empty() } catch (a) { } }); a.iframe.preload && (b.showLoading(), d.one("load", function () { f(this).data("ready", 1); s || f(this).bind("load.fb", b.update); f(this).parents(".fancybox-wrap").width("100%").removeClass("fancybox-tmp").show(); b._afterLoad() })); a.content = d.appendTo(a.inner); a.iframe.preload || b._afterLoad() }, _preloadImages: function () { var a = b.group, d = b.current, e = a.length, c = d.preload ? Math.min(d.preload, e - 1) : 0, f, g; for (g = 1; g <= c; g += 1) f = a[(d.index + g) % e], "image" === f.type && f.href && ((new Image).src = f.href) }, _afterLoad: function () { var a = b.coming, d = b.current, e, c, k, g, h; b.hideLoading(); if (a && !1 !== b.isActive) if (!1 === b.trigger("afterLoad", a, d)) a.wrap.stop(!0).trigger("onReset").remove(), b.coming = null; else { d && (b.trigger("beforeChange", d), d.wrap.stop(!0).removeClass("fancybox-opened").find(".fancybox-item, .fancybox-nav").remove()); b.unbindEvents(); e = a.content; c = a.type; k = a.scrolling; f.extend(b, { wrap: a.wrap, skin: a.skin, outer: a.outer, inner: a.inner, current: a, previous: d }); g = a.href; switch (c) { case "inline": case "ajax": case "html": a.selector ? e = f("<div>").html(e).find(a.selector) : t(e) && (e.data("fancybox-placeholder") || e.data("fancybox-placeholder", f('<div class="fancybox-placeholder"></div>').insertAfter(e).hide()), e = e.show().detach(), a.wrap.bind("onReset", function () { f(this).find(e).length && e.hide().replaceAll(e.data("fancybox-placeholder")).data("fancybox-placeholder", !1) })); break; case "image": e = a.tpl.image.replace("{href}", g); break; case "swf": e = '<object id="fancybox-swf" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="100%" height="100%"><param name="movie" value="' + g + '"></param>', h = "", f.each(a.swf, function (a, b) { e += '<param name="' + a + '" value="' + b + '"></param>'; h += " " + a + '="' + b + '"' }), e += '<embed src="' + g + '" type="application/x-shockwave-flash" width="100%" height="100%"' + h + "></embed></object>" } (!t(e) || !e.parent().is(a.inner)) && a.inner.append(e); b.trigger("beforeShow"); a.inner.css("overflow", "yes" === k ? "scroll" : "no" === k ? "hidden" : k); b._setDimension(); b.reposition(); b.isOpen = !1; b.coming = null; b.bindEvents(); if (b.isOpened) { if (d.prevMethod) b.transitions[d.prevMethod]() } else f(".fancybox-wrap").not(a.wrap).stop(!0).trigger("onReset").remove(); b.transitions[b.isOpened ? a.nextMethod : a.openMethod](); b._preloadImages() } }, _setDimension: function () { var a = b.getViewport(), d = 0, e = !1, c = !1, e = b.wrap, k = b.skin, g = b.inner, h = b.current, c = h.width, j = h.height, m = h.minWidth, u = h.minHeight, n = h.maxWidth, p = h.maxHeight, s = h.scrolling, q = h.scrollOutside ? h.scrollbarWidth : 0, x = h.margin, y = l(x[1] + x[3]), r = l(x[0] + x[2]), v, z, t, C, A, F, B, D, H; e.add(k).add(g).width("auto").height("auto").removeClass("fancybox-tmp"); x = l(k.outerWidth(!0) - k.width()); v = l(k.outerHeight(!0) - k.height()); z = y + x; t = r + v; C = E(c) ? (a.w - z) * l(c) / 100 : c; A = E(j) ? (a.h - t) * l(j) / 100 : j; if ("iframe" === h.type) { if (H = h.content, h.autoHeight && 1 === H.data("ready")) try { H[0].contentWindow.document.location && (g.width(C).height(9999), F = H.contents().find("body"), q && F.css("overflow-x", "hidden"), A = F.outerHeight(!0)) } catch (G) { } } else if (h.autoWidth || h.autoHeight) g.addClass("fancybox-tmp"), h.autoWidth || g.width(C), h.autoHeight || g.height(A), h.autoWidth && (C = g.width()), h.autoHeight && (A = g.height()), g.removeClass("fancybox-tmp"); c = l(C); j = l(A); D = C / A; m = l(E(m) ? l(m, "w") - z : m); n = l(E(n) ? l(n, "w") - z : n); u = l(E(u) ? l(u, "h") - t : u); p = l(E(p) ? l(p, "h") - t : p); F = n; B = p; h.fitToView && (n = Math.min(a.w - z, n), p = Math.min(a.h - t, p)); z = a.w - y; r = a.h - r; h.aspectRatio ? (c > n && (c = n, j = l(c / D)), j > p && (j = p, c = l(j * D)), c < m && (c = m, j = l(c / D)), j < u && (j = u, c = l(j * D))) : (c = Math.max(m, Math.min(c, n)), h.autoHeight && "iframe" !== h.type && (g.width(c), j = g.height()), j = Math.max(u, Math.min(j, p))); if (h.fitToView) if (g.width(c).height(j), e.width(c + x), a = e.width(), y = e.height(), h.aspectRatio) for (; (a > z || y > r) && (c > m && j > u) && !(19 < d++) ;) j = Math.max(u, Math.min(p, j - 10)), c = l(j * D), c < m && (c = m, j = l(c / D)), c > n && (c = n, j = l(c / D)), g.width(c).height(j), e.width(c + x), a = e.width(), y = e.height(); else c = Math.max(m, Math.min(c, c - (a - z))), j = Math.max(u, Math.min(j, j - (y - r))); q && ("auto" === s && j < A && c + x + q < z) && (c += q); g.width(c).height(j); e.width(c + x); a = e.width(); y = e.height(); e = (a > z || y > r) && c > m && j > u; c = h.aspectRatio ? c < F && j < B && c < C && j < A : (c < F || j < B) && (c < C || j < A); f.extend(h, { dim: { width: w(a), height: w(y) }, origWidth: C, origHeight: A, canShrink: e, canExpand: c, wPadding: x, hPadding: v, wrapSpace: y - k.outerHeight(!0), skinSpace: k.height() - j }); !H && (h.autoHeight && j > u && j < p && !c) && g.height("auto") }, _getPosition: function (a) { var d = b.current, e = b.getViewport(), c = d.margin, f = b.wrap.width() + c[1] + c[3], g = b.wrap.height() + c[0] + c[2], c = { position: "absolute", top: c[0], left: c[3] }; d.autoCenter && d.fixed && !a && g <= e.h && f <= e.w ? c.position = "fixed" : d.locked || (c.top += e.y, c.left += e.x); c.top = w(Math.max(c.top, c.top + (e.h - g) * d.topRatio)); c.left = w(Math.max(c.left, c.left + (e.w - f) * d.leftRatio)); return c }, _afterZoomIn: function () { var a = b.current; a && (b.isOpen = b.isOpened = !0, b.wrap.css("overflow", "visible").addClass("fancybox-opened"), b.update(), (a.closeClick || a.nextClick && 1 < b.group.length) && b.inner.css("cursor", "pointer").bind("click.fb", function (d) { !f(d.target).is("a") && !f(d.target).parent().is("a") && (d.preventDefault(), b[a.closeClick ? "close" : "next"]()) }), a.closeBtn && f(a.tpl.closeBtn).appendTo(b.skin).bind("click.fb", function (a) { a.preventDefault(); b.close() }), a.arrows && 1 < b.group.length && ((a.loop || 0 < a.index) && f(a.tpl.prev).appendTo(b.outer).bind("click.fb", b.prev), (a.loop || a.index < b.group.length - 1) && f(a.tpl.next).appendTo(b.outer).bind("click.fb", b.next)), b.trigger("afterShow"), !a.loop && a.index === a.group.length - 1 ? b.play(!1) : b.opts.autoPlay && !b.player.isActive && (b.opts.autoPlay = !1, b.play())) }, _afterZoomOut: function (a) { a = a || b.current; f(".fancybox-wrap").trigger("onReset").remove(); f.extend(b, { group: {}, opts: {}, router: !1, current: null, isActive: !1, isOpened: !1, isOpen: !1, isClosing: !1, wrap: null, skin: null, outer: null, inner: null }); b.trigger("afterClose", a) } }); b.transitions = { getOrigPosition: function () { var a = b.current, d = a.element, e = a.orig, c = {}, f = 50, g = 50, h = a.hPadding, j = a.wPadding, m = b.getViewport(); !e && (a.isDom && d.is(":visible")) && (e = d.find("img:first"), e.length || (e = d)); t(e) ? (c = e.offset(), e.is("img") && (f = e.outerWidth(), g = e.outerHeight())) : (c.top = m.y + (m.h - g) * a.topRatio, c.left = m.x + (m.w - f) * a.leftRatio); if ("fixed" === b.wrap.css("position") || a.locked) c.top -= m.y, c.left -= m.x; return c = { top: w(c.top - h * a.topRatio), left: w(c.left - j * a.leftRatio), width: w(f + j), height: w(g + h) } }, step: function (a, d) { var e, c, f = d.prop; c = b.current; var g = c.wrapSpace, h = c.skinSpace; if ("width" === f || "height" === f) e = d.end === d.start ? 1 : (a - d.start) / (d.end - d.start), b.isClosing && (e = 1 - e), c = "width" === f ? c.wPadding : c.hPadding, c = a - c, b.skin[f](l("width" === f ? c : c - g * e)), b.inner[f](l("width" === f ? c : c - g * e - h * e)) }, zoomIn: function () { var a = b.current, d = a.pos, e = a.openEffect, c = "elastic" === e, k = f.extend({ opacity: 1 }, d); delete k.position; c ? (d = this.getOrigPosition(), a.openOpacity && (d.opacity = 0.1)) : "fade" === e && (d.opacity = 0.1); b.wrap.css(d).animate(k, { duration: "none" === e ? 0 : a.openSpeed, easing: a.openEasing, step: c ? this.step : null, complete: b._afterZoomIn }) }, zoomOut: function () { var a = b.current, d = a.closeEffect, e = "elastic" === d, c = { opacity: 0.1 }; e && (c = this.getOrigPosition(), a.closeOpacity && (c.opacity = 0.1)); b.wrap.animate(c, { duration: "none" === d ? 0 : a.closeSpeed, easing: a.closeEasing, step: e ? this.step : null, complete: b._afterZoomOut }) }, changeIn: function () { var a = b.current, d = a.nextEffect, e = a.pos, c = { opacity: 1 }, f = b.direction, g; e.opacity = 0.1; "elastic" === d && (g = "down" === f || "up" === f ? "top" : "left", "down" === f || "right" === f ? (e[g] = w(l(e[g]) - 200), c[g] = "+=200px") : (e[g] = w(l(e[g]) + 200), c[g] = "-=200px")); "none" === d ? b._afterZoomIn() : b.wrap.css(e).animate(c, { duration: a.nextSpeed, easing: a.nextEasing, complete: b._afterZoomIn }) }, changeOut: function () { var a = b.previous, d = a.prevEffect, e = { opacity: 0.1 }, c = b.direction; "elastic" === d && (e["down" === c || "up" === c ? "top" : "left"] = ("up" === c || "left" === c ? "-" : "+") + "=200px"); a.wrap.animate(e, { duration: "none" === d ? 0 : a.prevSpeed, easing: a.prevEasing, complete: function () { f(this).trigger("onReset").remove() } }) } }; b.helpers.overlay = { defaults: { closeClick: !0, speedOut: 200, showEarly: !0, css: {}, locked: !s, fixed: !0 }, overlay: null, fixed: !1, el: f("html"), create: function (a) { a = f.extend({}, this.defaults, a); this.overlay && this.close(); this.overlay = f('<div class="fancybox-overlay"></div>').appendTo(b.coming ? b.coming.parent : a.parent); this.fixed = !1; a.fixed && b.defaults.fixed && (this.overlay.addClass("fancybox-overlay-fixed"), this.fixed = !0) }, open: function (a) { var d = this; a = f.extend({}, this.defaults, a); this.overlay ? this.overlay.unbind(".overlay").width("auto").height("auto") : this.create(a); this.fixed || (n.bind("resize.overlay", f.proxy(this.update, this)), this.update()); a.closeClick && this.overlay.bind("click.overlay", function (a) { if (f(a.target).hasClass("fancybox-overlay")) return b.isActive ? b.close() : d.close(), !1 }); this.overlay.css(a.css).show() }, close: function () { var a, b; n.unbind("resize.overlay"); this.el.hasClass("fancybox-lock") && (f(".fancybox-margin").removeClass("fancybox-margin"), a = n.scrollTop(), b = n.scrollLeft(), this.el.removeClass("fancybox-lock"), n.scrollTop(a).scrollLeft(b)); f(".fancybox-overlay").remove().hide(); f.extend(this, { overlay: null, fixed: !1 }) }, update: function () { var a = "100%", b; this.overlay.width(a).height("100%"); I ? (b = Math.max(G.documentElement.offsetWidth, G.body.offsetWidth), p.width() > b && (a = p.width())) : p.width() > n.width() && (a = p.width()); this.overlay.width(a).height(p.height()) }, onReady: function (a, b) { var e = this.overlay; f(".fancybox-overlay").stop(!0, !0); e || this.create(a); a.locked && (this.fixed && b.fixed) && (e || (this.margin = p.height() > n.height() ? f("html").css("margin-right").replace("px", "") : !1), b.locked = this.overlay.append(b.wrap), b.fixed = !1); !0 === a.showEarly && this.beforeShow.apply(this, arguments) }, beforeShow: function (a, b) { var e, c; b.locked && (!1 !== this.margin && (f("*").filter(function () { return "fixed" === f(this).css("position") && !f(this).hasClass("fancybox-overlay") && !f(this).hasClass("fancybox-wrap") }).addClass("fancybox-margin"), this.el.addClass("fancybox-margin")), e = n.scrollTop(), c = n.scrollLeft(), this.el.addClass("fancybox-lock"), n.scrollTop(e).scrollLeft(c)); this.open(a) }, onUpdate: function () { this.fixed || this.update() }, afterClose: function (a) { this.overlay && !b.coming && this.overlay.fadeOut(a.speedOut, f.proxy(this.close, this)) } }; b.helpers.title = { defaults: { type: "float", position: "bottom" }, beforeShow: function (a) { var d = b.current, e = d.title, c = a.type; f.isFunction(e) && (e = e.call(d.element, d)); if (q(e) && "" !== f.trim(e)) { d = f('<div class="fancybox-title fancybox-title-' + c + '-wrap">' + e + "</div>"); switch (c) { case "inside": c = b.skin; break; case "outside": c = b.wrap; break; case "over": c = b.inner; break; default: c = b.skin, d.appendTo("body"), I && d.width(d.width()), d.wrapInner('<span class="child"></span>'), b.current.margin[2] += Math.abs(l(d.css("margin-bottom"))) } d["top" === a.position ? "prependTo" : "appendTo"](c) } } }; f.fn.fancybox = function (a) { var d, e = f(this), c = this.selector || "", k = function (g) { var h = f(this).blur(), j = d, k, l; !g.ctrlKey && (!g.altKey && !g.shiftKey && !g.metaKey) && !h.is(".fancybox-wrap") && (k = a.groupAttr || "data-fancybox-group", l = h.attr(k), l || (k = "rel", l = h.get(0)[k]), l && ("" !== l && "nofollow" !== l) && (h = c.length ? f(c) : e, h = h.filter("[" + k + '="' + l + '"]'), j = h.index(this)), a.index = j, !1 !== b.open(h, a) && g.preventDefault()) }; a = a || {}; d = a.index || 0; !c || !1 === a.live ? e.unbind("click.fb-start").bind("click.fb-start", k) : p.undelegate(c, "click.fb-start").delegate(c + ":not('.fancybox-item, .fancybox-nav')", "click.fb-start", k); this.filter("[data-fancybox-start=1]").trigger("click"); return this }; p.ready(function () { var a, d; f.scrollbarWidth === v && (f.scrollbarWidth = function () { var a = f('<div style="width:50px;height:50px;overflow:auto"><div/></div>').appendTo("body"), b = a.children(), b = b.innerWidth() - b.height(99).innerWidth(); a.remove(); return b }); if (f.support.fixedPosition === v) { a = f.support; d = f('<div style="position:fixed;top:20px;"></div>').appendTo("body"); var e = 20 === d[0].offsetTop || 15 === d[0].offsetTop; d.remove(); a.fixedPosition = e } f.extend(b.defaults, { scrollbarWidth: f.scrollbarWidth(), fixed: f.support.fixedPosition, parent: f("body") }); a = f(r).width(); J.addClass("fancybox-lock-test"); d = f(r).width(); J.removeClass("fancybox-lock-test"); f("<style type='text/css'>.fancybox-margin{margin-right:" + (d - a) + "px;}</style>").appendTo("head") }) })(window, document, jQuery);