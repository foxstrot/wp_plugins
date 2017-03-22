require([], function () {
	if (window.nvxCommonPath == null) {
		window.nvxCommonPath = {
			departmentView: '/department/index.php?departmentId=',
			mfcCommonView: '/mfc/',
			mfcView: '/mfc/index.php?mfcId=',
			mfcTospView: '/mfc/index.php?tosp=true&mfcId=',
			serviceView: '/service/index.php?serviceId=',
			categoryView: '/category/index.php?categoryId=',
			situationView: '/category/index.php?situationId=',
			catalogView: '/services/',
			formView: '/cabinet/request/index.php?fileId=',
			infoView: '/cabinet/information/index.php?fileId=',
			attachmentView: '/cabinet/attachment/index.php?fileId=',
			cabinetReceptionList: '/cabinet/#tab5',
			treatmentCreateView: '/treatment/index.php?serviceId=',
			searchView: '/searchservice/index.php',
			payView: '/pay/index.php',
			authRedirectPath: 'http://bitx.egspace.ru/authRequest.php',
			authPortalPath: 'http://testrpgu.egspace.ru',
			fileProxyPath: 'http://bitx.egspace.ru/proxy4file.php',
			igtnServiceList: []
		};
	}
	if (window.sessionStorage) {
		if (window.sessionStorage.getItem('nvxUserType') == null) {
			window.sessionStorage.setItem('nvxUserType', 'physical');
		}
	}
	if (window.getUrlVarsFunction == null) {
		window.getUrlVarsFunction = function(url, param) {
			if (url === undefined || url === null)
				url = window.location.href;
			if (param !== '#') {
				param = '?';
				if (url.contains('#')) {
					url = url.substring(0, url.indexOf('#'));
				}
			}

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
	}
	if (window.getCurrentLocationFromCookie == null) {
		window.getCurrentLocationFromCookie = function () {
			var cookieValue = document.cookie.replace(/(?:(?:^|.*;\s*)depslocationstorecurrentlocation\s*\=\s*([^;]*).*$)|^.*$/, "$1");
			return cookieValue;
		};
	}
});
define('Nvx.ReDoc.Rpgu.PortalModule/Portal/Script/cabinetPageController', [], function () {
	var controller = (function() {});

	controller.navigate = null;

	return controller;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/dynamicFormBindingHandlers',
	[
		'jquery',
		'knockout',
		'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormController/mainForm',
		'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/knockout/customBindingHandlers',
		'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/maskedInput/maskedInputBinding',
		'select2lib'
	], function($, ko, mainForm) {

		//Select2 для динамических форм.
		ko.bindingHandlers.select2 = {
			init: function(element, valueAccessor, allBindings) {
				var value = valueAccessor();
				var $element = $(element);
				var placeholder = allBindings.get('nullTitle');
				var opt = {
					current: function(el, callback) {
						var preitem = el.val() || value();
						if (preitem != null) {
							var result = {};
							for (var i = 0; i < element.options.length; i++) {
								if (element.options[i].value === preitem) {
									result = { id: element.options[i].value, text: element.options[i].text };
									break;
								}
							}
							callback(result);
						}
					},
					allowClear: false
				};
				if (placeholder != null) {
					opt.placeholder = placeholder;
					opt.allowClear = true;
					$element.append($("<option></option>"));
				}
				$element.select2(opt);

				ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
					$(element).select2('destroy');
				});
			},
			update: function(element, valueAccessor) {
				var value = valueAccessor();
				value = ko.utils.unwrapObservable(value);
				$(element).val(value).trigger('change');
			}
		};

		//#region Для динамических форм.

		//Кастомный visible.
		ko.bindingHandlers.nailVisible = {
			update: function(element, valueAccessor, allBindings) {
				// First get the latest data that we're bound to
				var value = valueAccessor();

				// Next, whether or not the supplied model property is observable, get its current value
				var valueUnwrapped = ko.unwrap(value);

				// Now manipulate the DOM element
				if (valueUnwrapped == true)
					$(element).show(); // Make the element visible
				else
					$(element).hide(); // Make the element invisible
			}
		};

		ko.bindingHandlers.selectExternal = {
			init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
				var quantEntities = 20;
				var placeholder = allBindings.get('nullTitle');
				var dataUrl = "/DynamicForm/GetDictionaryRegistryData";
				var dataDict = viewModel.DictionaryId();
				var dataParent = viewModel.ParentId;
				var displayFieldScript = ko.utils.unwrapObservable(viewModel.DisplayFieldScript);
				var currentFileId = $('#fileId').val() || viewModel.fileId;
				var currentComponentId = $('#componentId').val() || viewModel.componentId;

				if (viewModel.DictionarySource().startsWith('Dictionary') || viewModel.DictionarySource().startsWith('IDictionary')) {
					//это справочник внешний, или основанный на адаптере справочников IDictionary
				} else if (viewModel.DictionarySource().startsWith('Context')) {
					//это переменная контекста
					dataDict = viewModel.DictionarySource();
					dataParent = viewModel.DisplayFieldScript;
					dataUrl = "/DynamicForm/GetDictionaryRegistryContextData";
				} else {
					//viewModel.DictionarySource().startsWith('Value') это коллекция на форме
					dataUrl = "/DynamicForm/GetDictionaryRegistryViewModelData";
					dataParent = viewModel.DisplayFieldScript;
				}
				var valueProperty = allBindings.get('value');
				var cache = [];

				var $element = $(element);
				var opt = {
					allowClear: false,
					ajax: {
						type: "POST",
						url: dataUrl,
						dataType: 'json',
						quietMillis: 300,
						headers: { proxy: true },
						data: function(term, page) {
							if (viewModel.DictionarySource().startsWith('Value')) {
								return {
									Term: term.term,
									NeedLoad: quantEntities,
									LoadedEntities: ((term.page | 1) - 1),
									DictionaryId: dataDict,
									ParentId: dataParent(),
									"collectFormData": JSON.stringify(mainForm.collectFormDataKoVm()),
									"typename": $("#dynamic_form_right_typename_to_controller").val(),
									"projectNameWithSuffix": $("#dynamic_form_right_projectNameWithSuffix").val(),
									"currentPath": viewModel.Path,
									"neededPath": viewModel.DictionarySource(),
									DisplayFieldScript: displayFieldScript
								};
							} else {
								return {
									Term: term.term,
									NeedLoad: quantEntities,
									LoadedEntities: ((term.page | 1) - 1),
									DictionaryId: dataDict,
									ParentId: dataParent(),
									DisplayFieldScript: displayFieldScript
								};
							}
						},
						processResults: function(data) {
							if (data.hasError) {
								console.log(data.errorMessage);
								return {
									results: {}
								};
							}
							var currentItems = JSON.parse(data.serializedValue);
							cache = currentItems;
							return {
								results: currentItems,
								pagination: {
									more: currentItems.length == quantEntities
								}
							};
						},
						templateResult: function(item) {
							if (item.loading === true)
								return item.text;
							if (item.id == '' && item.text == '')
								return null;
							var classes = ['checkbox'];

							return $('<div>').html('<span>' + item.text + '</span>').addClass(classes.join(' '));
						}
					},
					syncElementValue: true,
					language: "ru",
					current: function(el, callback) {
						var value = valueProperty() || "";
						if (value !== "") {
							//если есть такое значение в кэше, то нам не надо идти на сервер
							var optionFromSelect2 = ko.utils.arrayFirst(cache, function(item) {
								return item.id === value;
							});

							if (optionFromSelect2 != null) {
								var opt = {
									id: optionFromSelect2.id,
									text: optionFromSelect2.text,
									metaData: optionFromSelect2.metaData
								};
								viewModel.metaData([opt]);
								callback(opt);
								//TODO valueAccessor -- заменить!!!
								valueAccessor().valueHasMutated();
							} else {
								$.ajax({
									url: dataUrl,
									data: {
										fileId: currentFileId,
										componentId: currentComponentId,
										DictionaryId: dataDict,
										ParentId: dataParent,
										Current: value,
										DisplayFieldScript: displayFieldScript
									},
									type: 'POST',
									headers: {proxy: true}
								})
									.done(function(response) {
										if (response.hasError === false) {
											var items = JSON.parse(response.serializedValue);
											//для метаданных
											viewModel.metaData(items);
											//для enumtitle
											callback(items);
											//для начального выполнения enumtitle
											valueAccessor().valueHasMutated();
										} else {
											callback(response);
										}
									}).fail(function(response) {
										console.error('error for external');
										callback(response);
									});
							}
						}
					}
				};
				if (placeholder != null) {
					opt.placeholder = placeholder;
					opt.allowClear = true;
				}
				$element.select2(opt);

				//для enumtitle в external dict
				$element.on("select2:selecting", function(e) {
					if (e.params && e.params.args && e.params.args.data)
						viewModel.metaData([e.params.args.data]);
				});

				$element.on("select2:unselect", function(e) {
					viewModel.metaData(null);
				});

				ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
					$(element).select2('destroy');
				});
			},
			update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
				var value = valueAccessor();
				value = ko.utils.unwrapObservable(value);
				var $element = $(element);
				//важно!!! без этого будет бесконечная рекурсия
				if ($element.val() !== value) {
					//$element.val(value).trigger('change');
					$element.selectOptionsForS2(value);
				}
				if (viewModel.ControlEnabling())
					$element.select2('enable', true);
				else
					$element.select2('enable', false);
			}
		};

		ko.bindingHandlers.selectExternalmulti = {
			init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
				var quantEntities = 20;
				var dataUrl = "/DynamicForm/GetDictionaryRegistryData";
				var dataDict = viewModel.DictionaryId();
				var dataParent = viewModel.ParentId;
				var valueProperty = viewModel.selectedValueS2;
				var displayFieldScript = ko.utils.unwrapObservable(viewModel.DisplayFieldScript);
				var currentFileId = $('#fileId').val() || viewModel.fileId;
				var currentComponentId = $('#componentId').val() || viewModel.componentId;

				if (viewModel.DictionarySource().startsWith('Dictionary') || viewModel.DictionarySource().startsWith('IDictionary')) {
					//это справочник внешний, или основанный на адаптере справочников IDictionary
				} else if (viewModel.DictionarySource().startsWith('Context')) {
					//это переменная контекста
					dataDict = viewModel.DictionarySource();
					dataParent = viewModel.DisplayFieldScript;
					dataUrl = "/DynamicForm/GetDictionaryRegistryContextData";
				} else {
					dataUrl = "/DynamicForm/GetDictionaryRegistryViewModelData";
					dataParent = viewModel.DisplayFieldScript;
				}

				var placeholder = null;
				var msie = document.documentMode;
				if (msie && msie <= 11) {
					console.log("Don't forget to update select on 4.0.1-rc.1 to fix placeholder problem in IE10+.");
				} else {
					placeholder = 'Выберите элементы';
				}

				var cache = {};

				var customSelect = $(element);
				var options = {
					ajax: {
						type: "POST",
						url: dataUrl,
						dataType: 'json',
						quietMillis: 300,
						headers: { proxy: true },
						data: function(term) {
							if (viewModel.DictionarySource().startsWith('Value'))
								return {
									Term: term.term,
									NeedLoad: quantEntities,
									LoadedEntities: ((term.page || 1) - 1),
									DictionaryId: dataDict,
									ParentId: dataParent(),
									"collectFormData": JSON.stringify(mainForm.collectFormDataKoVm()),
									"typename": $("#dynamic_form_right_typename_to_controller").val(),
									"projectNameWithSuffix": $("#dynamic_form_right_projectNameWithSuffix").val(),
									"currentPath": viewModel.Path,
									"neededPath": viewModel.DictionarySource(),
									DisplayFieldScript: displayFieldScript
								};
							else
								return {
									Term: term.term,
									NeedLoad: quantEntities,
									LoadedEntities: ((term.page || 1) - 1),
									DictionaryId: dataDict,
									ParentId: dataParent(),
									DisplayFieldScript: displayFieldScript
								};
						},
						processResults: function(data) {
							if (data.hasError) {
								console.log(data.errorMessage);
								return {
									results: []
								};
							}
							var currentItems = JSON.parse(data.serializedValue);
							cache = currentItems;
							return {
								results: currentItems,
								pagination: {
									more: currentItems.length == quantEntities
								}
							};
						}
					},
					placeholder: placeholder,
					allowClear: false,
					closeOnSelect: false,
					language: "ru",
					templateSelection: function(selection) {
						var res = $(element).val();
						var cd = null;
						if (res != null && typeof(res) === 'object' && res.length > 0)
							cd = 'Выбрано ' + res.length;
						else
							cd = 'Выберите элементы';
						return cd;
					},
					templateResult: function(item) {
						if (item.loading === true)
							return item.text;
						if (item.id == '' && item.text == '')
							return null;
						var classes = ['checkbox'];

						return $('<div>').html('<span>' + item.text + '</span>').addClass(classes.join(' '));
					},
					current: function(el, callback) {
						var data = [];
						var value = valueProperty() || [];
						if (dataUrl !== "/DynamicForm/GetDictionaryRegistryData") {
							$(value).each(function() {
								data.push({ id: this, text: this });
							});
							callback(data);
						} else if (value.length > 0) {
							$.ajax({
								url: dataUrl,
								data: {
									fileId: currentFileId,
									componentId: currentComponentId,
									DictionaryId: dataDict,
									ParentId: dataParent,
									Current: value.toString(),
									DisplayFieldScript: displayFieldScript
								},
								type: 'POST',
								headers:
								{
									proxy: true
								}
							})
								.done(function(response) {
									callback(response.hasError === false ? JSON.parse(response.serializedValue) : data);
								}).fail(function() {
									callback(data);
								});
						}
					},
					escapeMarkup: function(m) { return m; }
				};

				$.fn.select2.amd.require(["select2/defaults"],
					function(defaults) {

						var origMultiple = options.multiple;
						options.multiple = false;
						var defaultApplied = defaults.apply(options);
						options.multiple = origMultiple;

						options.dropdownAdapter = options.dropdownAdapter || defaultApplied.dropdownAdapter;


						if (!options.selectionAdapter) {
							var selectionAdapter = defaultApplied.selectionAdapter;
							//customize selectionAdapter
							//пишет выбрано x и тп
							selectionAdapter.prototype.update = function(data) {
								this.clear();

								if (data.length === 0) {
									return;
								}

								var template = this.options.get('templateSelection');
								var escapeMarkup = this.options.get('escapeMarkup');
								var $rendered = this.$selection.find('.select2-selection__rendered');
								var formatted = escapeMarkup(template(data, $rendered));

								$rendered.empty().append(formatted);
								$rendered.prop('title', formatted);
							};
							options.selectionAdapter = options.selectionAdapter || selectionAdapter;
						}

						customSelect.select2(options).data('select2');

						customSelect.on("select2:closing", function(event) {
							var optionValues = $(element).select2('data');
							var out = [];
							if (optionValues != null)
								for (var i = 0; i < optionValues.length; i++)
									out.push(optionValues[i].id);
							valueProperty(out);
						});

						customSelect.on("select2:open", function() {
							if (typeof(viewModel.selectedValueS2()) === 'string')
								return;
							//Первичная инициализация значений
							var valuesArray = viewModel.selectedValueS2();
							if (valuesArray == null || valuesArray.length === 0)
								return;
							$(element).val(valuesArray);
						});

						ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
							$(element).select2('destroy');
						});
					});

			},
			update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
				var value = viewModel.selectedValueS2;
				value = ko.utils.unwrapObservable(value);
				//важно!!! без этого будет бесконечная рекурсия
				var $element = $(element);
				$element.selectOptionsForS2(value);
			}
		};

		//#endregion
	});
define('Nvx.ReDoc.MfcUiModule/Web/Resources/Scripts/MfcUiWebController/mfcCommonMethods', [], function() {
	var mfcCommonMethods = function() {
		var self = this;

		self.serviceInfoViewModel = null;
		self.customerInfoViewModel = null;
		self.modalDialog = null;

		self.serviceTypeToString = function(type) {
			var result;
			var t = type + '';
			switch (t) {
			case '1':
				result = 'Можно оформить в МФЦ';
				break;
			case '2':
				result = 'Можно оформить онлайн';
				break;
			default:
				result = '';
				break;
			}
			return result;
		};

		self.typeToString = function(type) {
			var result;
			var t = type + '';
			switch (t) {
			case '1':
				result = 'Физическое лицо';
				break;
			case '2':
				result = 'Индивидуальный предприниматель';
				break;
			case '3':
				result = 'Юридическое лицо';
				break;
			case '4':
				result = 'Иностранный гражданин';
				break;
			case '-1':
				result = 'Неизвестный';
				break;
			case '0':
				result = 'Анонимный заявитель';
				break;
			default:
				result = 'Неизвестный';
				break;
			}
			return result;
		};

		self.readAboutServiceInfo = function(id, canCreateTreatment) {
			console.log('call mfcCommonMethods readAboutServiceInfo');
		};

		self.readAboutCustomer = function(id, canCreateTreatment) {
			console.log('call mfcCommonMethods readAboutCustomer');
		};
	};

	return mfcCommonMethods;
});
//Модель для вью-моделей, которые работают с модальным окном.
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/ModalDialog',
	[
		'knockout'
	],
	function(ko) {
		var ModalDialog = function() {
			var self = this;

			//Идентификатор шаблона модального окна.
			self.modalTemplateId = ko.observable('placeholderTemplate');
			//Вью-модель модального окна.
			self.modalTemplateViewModel = ko.observable(null);
			//Открыто или закрыто модальное окно.
			self.detailOpen = ko.observable(false);
		};

		//Закрытие модального окна.
		ModalDialog.prototype.closeModalWindow = function() {
			var self = this;

			//Скрываем окно.
			self.detailOpen(false);
			//Заменяем представление на заглушку.
			self.modalTemplateId('placeholderTemplate');
			//Обнуляем вью-модель.
			self.modalTemplateViewModel(null);
		};

		//Отображение модального окна.
		ModalDialog.prototype.showModalWindow = function(templateId, viewModel) {
			var self = this;

			//Заполняем вью-модеь.
			self.modalTemplateViewModel(viewModel);
			//Подтягиваем представление.
			self.modalTemplateId(templateId);
			//Показываем окно.
			self.detailOpen(true);

			return viewModel;
		};

		return ModalDialog;
	});
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
	['jquery', 'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/guid/guid', 'javascriptExtention'],
	function($, Guid) {
		var ModalWindowsFunction = function() {
			var self = this;

			///<summary>Объект предоставляет функции по управлению модальными окнами.</summary>
			//Идентификатор троббера.
			self.trobberId = '3e9b873d705b45c783984954';
			//Куча заявок на тробберы.
			self.stack = [];

			// создание затемняющего слоя поверх экрана. Кнопка закрытия не нужна: <a href=\"#\" onclick=\"ModalWindowsFunction.RemoveSelectedDiv('" + divName + "');\">X</a>
			self.AddShadowDivOverWindow = function(divName) {
				$("body").append("<div id='" + divName + "'></div>");
				$("#" + divName).css({ 'height': '100%', 'opacity': 0.75, 'position': 'fixed', 'top': 0, 'left': 0, 'background-color': 'black', 'width': '100%', 'z-index': 5000 });
			};

			// удаление указанного элемента по id
			self.RemoveSelectedDiv = function(divName) {
				if (document.getElementById(divName) != null && document.getElementById(divName) != undefined) {
					$('#' + divName).remove();
				}
			};

			// создание диалогового окна с содержимым по центру экрана 
			self.CreateNewModalDialog = function(id, htmlcontent, needshadowdiv, needbutton, buttonlabel) {
				if (document.getElementById(id)) {
					//Добавил для того чтобы было видно двойные попытки открытия диалога(или просто уже есть такой элемент)
					console.error('CreateNewModalDialog - элемент с id %s уже есть на странице', id);
				}

				var buttonContent = "";
				if (needbutton != null && needbutton) {
					var label = 'Закрыть';
					if (buttonlabel != null && buttonlabel.length > 0) {
						label = buttonlabel;
					}
					buttonContent += '<div class="btn primary pull-right" onclick="ModalWindowsFunction.CloseModalDialog(\'' + id + '\');">' + label + '</div>';
				}
				$('body').prepend('<div class="modalWindowOverlay" id="' + id + '" ><div class="modalWindow">' + htmlcontent + buttonContent + '</div></div>');
			};

			self.CreateInputDialog = function(dialogId, initialValue, okCallback) {
				if (document.getElementById(dialogId))
					console.error('CreateNewModalDialog - элемент с id %s уже есть на странице', dialogId);

				var overlay = document.createElement("div");
				overlay.setAttribute("class", "modalWindowOverlay");
				overlay.setAttribute("id", dialogId);
				var container = document.createElement("div");
				container.setAttribute("class", "modalWindow");
				overlay.appendChild(container);

				var input = document.createElement("input");
				input.setAttribute("id", dialogId + "_input");
				input.setAttribute("type", "text");
				input.setAttribute("value", initialValue);
				input.onkeydown = function(event) {
					if (event.keyCode === 13) {
						self.CloseModalDialog(dialogId);
						okCallback(input.value, true);
					} else if (event.keyCode === 27) {
						self.CloseModalDialog(dialogId);
						okCallback(input.value, false);
					}
				};

				container.appendChild(input);

				document.getElementsByTagName("body")[0].appendChild(overlay);
			};

			// создание модального окна вопросного типа (с двумя кнопками)
			self.CreateQuestionModalWindow = function(id, message, okButton, noButton, title, onClickFunctionButtonOk, onClickFunctionButtonNo) {
				if (id === null || id === '' || id === undefined) {
					id = Guid.raw();
				}

				var windowTitle = '';
				if (title != null && title != '') {
					windowTitle = '<h2>' + title + '</h2>';
				}

				if (okButton === null || okButton === '' || okButton === undefined) {
					okButton = 'Принять';
				}

				if (noButton === null || noButton === '' || noButton === undefined) {
					noButton = 'Отменить';
				}

				if (onClickFunctionButtonOk == null || onClickFunctionButtonOk == '') {
					onClickFunctionButtonOk = function() { self.CloseModalDialog(id, true); }
				}

				if (onClickFunctionButtonNo == null || onClickFunctionButtonNo == '') {
					onClickFunctionButtonNo = function() { self.CloseModalDialog(id, true); }
				}

				var buttonsHtmlContent =
					'<div class="btn primary pull-right" id="' + id + 'ButtonNo">' + noButton + '</div>' +
						'<div class="btn pull-right" id="' + id + 'ButtonOk">' + okButton + '</div>';

				var htmlContent = windowTitle + '<div>' + message + '</div>' + buttonsHtmlContent;
				self.CreateNewModalDialog(id, htmlContent, true, false);

				$('#' + id + 'ButtonOk').click(function() {
					//Идентификатор кнопки (включает в себя идентификатор окна) по которой кликнули.
					var buttonId = this.id;
					//Идентификатор окна (отрезаем фразу 'ButtonOk', приклеенную к идентификатору окна).
					var currentDialogWindowId = buttonId.substring(0, buttonId.length - 8);
					//Закрываем диалоговое окно.
					self.CloseModalDialog(currentDialogWindowId, true);

					//Запускаем зарегистрированный обработчик.
					onClickFunctionButtonOk();
				});
				$('#' + id + 'ButtonNo').click(function() { onClickFunctionButtonNo(); });

				return id;
			};

			// создание модального окна вопросного типа (с двумя кнопками)
			self.CreateCallbackModalWindow = function(message, okButton, title, onClickFunctionButtonOk) {
				var id = Guid.raw();
				var windowTitle = '';
				if (title != null && title != '')
					windowTitle = '<h2>' + title + '</h2>';

				if (okButton === null || okButton === '' || okButton === undefined)
					okButton = 'Закрыть';

				if (onClickFunctionButtonOk == null || onClickFunctionButtonOk == '')
					onClickFunctionButtonOk = function() { self.CloseModalDialog(id, true); };

				var htmlContent = windowTitle + '<div>' + message + '</div><div class="btn pull-right" id="' + id + 'ButtonOk">' + okButton + '</div>';
				self.CreateNewModalDialog(id, htmlContent, true, false);

				$('#' + id + 'ButtonOk').click(function() {
					//Идентификатор кнопки (включает в себя идентификатор окна) по которой кликнули.
					var buttonId = this.id;
					//Идентификатор окна (отрезаем фразу 'ButtonOk', приклеенную к идентификатору окна).
					var currentDialogWindowId = buttonId.substring(0, buttonId.length - 8);
					//Закрываем диалоговое окно.
					self.CloseModalDialog(currentDialogWindowId, true);

					//Запускаем зарегистрированный обработчик.
					onClickFunctionButtonOk();
				});
				return id;
			};

			//Создания дива с троббером
			self.CreateTrobberDiv = function() {
				if ($('.throbber.throbber-svg').length > 0)
					return;
				$('body').prepend('<div class="throbber throbber-svg throbber-abs"><!--?xml version="1.0" encoding="utf-8"?--><svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="92px" height="100px" viewBox="0 0 92 100" enable-background="new 0 0 92 100" xml:space="preserve"><path fill="#00aadd" class="throbber-path" d="M81.765,82.649L56.607,97.19c-6.479,3.744-14.462,3.746-20.942,0.01L10.493,82.682 C4.012,78.944,0.017,72.032,0.014,64.549L0,35.493c-0.003-7.482,3.985-14.398,10.463-18.141L35.621,2.811 c6.478-3.744,14.46-3.748,20.943-0.011l25.171,14.519c6.481,3.738,10.476,10.648,10.479,18.131l0.014,29.059 C92.231,71.989,88.244,78.905,81.765,82.649"></path></svg></div>');
			};

			//Создания дива с троббером
			self.CreateTrobberDiv2 = function (selector) {
				if ($('.throbber.throbber-svg').length > 0)
					return 'noneedtothrobberanymore';
				//Генерим идентификатор заявки.
				var guid = Guid.raw();
				//Добавляем заявку в кучу.
				self.stack.push(guid);
				var throbberInnerContent = '<div id="trobber-ie-rotate-hook-element" class="icon-throbber-black-ie-hook"></div>';
				if (document.getElementById(self.trobberId) == null) {
					$('body').append('<div id="{0}" class="nvxrpguthrobber" style="opacity:0">{1}</div>'.format(self.trobberId, throbberInnerContent));
					$('#{0}'.format(self.trobberId)).animate({ 'opacity': .4 }, 500);
				}
				return guid;
			};

			//Создания дива с троббером
			self.CreateTrobberDiv3 = function() {
				if ($('.throbber.throbber-svg').length > 0)
					return 'noneedtothrobberanymore';
				//Генерим идентификатор заявки.
				var guid = Guid.raw();
				//Добавляем заявку в кучу.
				self.stack.push(guid);
				//Рисуем троббер, если его еще нет.
				if (document.getElementById(self.trobberId) == null) {
					$('body').append('<div id = "{0}" class="global-throber" style="position: fixed; top: 0; left: 0; height: 100%; z-index: 200;">' + '<div class="throbber throbber-svg" style="opacity: 1; position: fixed; top: 300px; left: 48%; z-index: 201;"><!--?xml version="1.0" encoding="utf-8"?--><svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="92px" height="100px" viewBox="0 0 92 100" enable-background="new 0 0 92 100" xml:space="preserve"><path fill="#00aadd" class="throbber-path" d="M81.765,82.649L56.607,97.19c-6.479,3.744-14.462,3.746-20.942,0.01L10.493,82.682 C4.012,78.944,0.017,72.032,0.014,64.549L0,35.493c-0.003-7.482,3.985-14.398,10.463-18.141L35.621,2.811 c6.478-3.744,14.46-3.748,20.943-0.011l25.171,14.519c6.481,3.738,10.476,10.648,10.479,18.131l0.014,29.059 C92.231,71.989,88.244,78.905,81.765,82.649"></path></svg></div></div>'.format(self.trobberId));
				}
				return guid;
			};

			//Закрытие дива с троббером
			self.CloseTrobberDiv = function() {
				self.RemoveSelectedDiv('3e9b873d705b45c783984954');
			};

			//Закрытие дива с троббером
			self.CloseTrobberDiv2 = function (guid) {
				//Убираем заявку из кучи.
				self.stack.removeByValue(guid);
				//Убираем троббер, если не осталось заявок в куче.
				if (self.stack.length === 0 && document.getElementById(self.trobberId) !== null) {
					self.RemoveSelectedDiv(self.trobberId);
				}
			};

			self.CloseTrobberDiv3 = function(guid) {
				$('.global-throber').animate({ 'opacity': .1 }, 1000);
				//Убираем заявку из кучи.
				self.stack.removeByValue(guid);
				//Убираем троббер, если не осталось заявок в куче.
				if (self.stack.length === 0 && document.getElementById(self.trobberId) !== null) {
					$('#{0}'.format(guid)).animate({ 'opacity': .1 }, 1000);
					self.RemoveSelectedDiv(guid);
				}
				if (document.getElementsByClassName('global-throber').length > 0) {
					$('#{0}'.format(guid)).animate({ 'opacity': .1 }, 1000);
					$('.global-throber').remove();
				}
				if ($('.throbber.throbber-svg.throbber-abs') != null && $('.throbber.throbber-svg.throbber-abs').remove != null)
					$('.throbber.throbber-svg.throbber-abs').remove();
			};

			// закрытие окна
			self.CloseModalDialog = function(id, needshadowdiv) {
				self.RemoveSelectedDiv(id);
				//Если правая часть пуста, нужно активную плашку снова сделать активной, чтобы она отрисовалась
				var contentElement = window.document.getElementById('file-right-side-content');
				if (contentElement !== null) {
					var $contentElement = $(contentElement);
					if ($contentElement.html().length < 10) {
						require(['Nvx.ReDoc.WebInterfaceModule/Content/Scripts/FileController/fileComponents'], function(fileComponents) {
							//правой части нет, нужно отрисовать
							var koVm = fileComponents.getKoViewModel();
							if (koVm != null && koVm.selectedPave != null) {
								koVm.activate(koVm.selectedPave);
							}
						});
					}
				}
			};

			//функция перемещения элемента в центр экрана
			self.ResizeSelectedModalDialog = function(divname) {
				if (document.getElementById(divname) != null && document.getElementById(divname) != undefined && $('#' + divname).css('display') != 'none') {
					var thisDocW = $(window).width();
					var halfemptysizeW = (thisDocW - document.getElementById(divname).offsetWidth) / 2;
					if (halfemptysizeW > 5) {
						$('#' + divname).css('left', halfemptysizeW);
					} else {
						$('#' + divname).css('left', '5px');
					}

					var thisDocH = $(window).height();
					var halfemptysizeH = (thisDocH - document.getElementById(divname).offsetHeight) / 2;
					if (halfemptysizeH > 5) {
						if (document.getElementById(divname).offsetWidth != document.getElementById(divname).scrollWidth) {
							//we have a scroll here
							$('#' + divname).css('height', $('#' + divname).children()[0].offsetHeight + document.getElementById(divname).style.paddingTop + document.getElementById(divname).style.paddingBottom);
						} else {
							$('#' + divname).css('top', halfemptysizeH);
						}
					} else {
						$('#' + divname).css('top', '5px');
						//450px is minimum height
						if (thisDocH > 250) {
							$('#' + divname).css('height', thisDocH);
						} else {
							$('#' + divname).css('height', '250px');
						}
					}
				}
			};

			//Модальное окно с сообщением об ошибке.
			self.errorModalWindow = function(message) {
				self.CreateNewModalDialog("errorModalWindowDialog", '<h2>Ошибка</h2>' + message, true, true);
			};
			//Модальное окно с сообщением
			self.informationModalWindow = function(message, title) {
				self.CreateNewModalDialog("informationModalWindow", '<h2>' + title + '</h2>' + message, true, true);
			};

			self.placePopups = function(element) {
				var popUp = element.getElementsByClassName('popUp');
				for (var i = 0; i < popUp.length; i++) {
					popUp[i].style.position = 'absolute';
					popUp[i].style.top = popUp[i].parentNode.offsetTop + 'px';
				}
			};
		};

		var modalWindowsFunction = new ModalWindowsFunction();
		//Legacy support.
		window.ModalWindowsFunction = modalWindowsFunction;

		return modalWindowsFunction;
	});
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/nvxRedocCommon',
	['require', 'jquery', 'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction'], function (require, $, ModalWindowsFunction) {
		var NvxRedocCommon = function () {
			var self = this;
			//#region ajax-запросы.

			//Таймаут для ajax-запросов.
			self._ajaxTimeout = 60000;
			self._rightPanelResizeTimeout = 1000;

			//Отправка json запроса с целью получения json ответа.
			//Callback функция получает в качестве аргумента js-объект (результат распарсивания пришедшего json).
			self.ajaxSendJsonRequest = function (url, callbackFunction, requestData, callbackErrorFunction) {
				var troberId = '';

				return $.ajax({
					async: true,
					type: "POST",
					url: url,
					contentType: "application/json",
					//data: requestData,
					data: JSON.stringify(requestData),
					dataType: "json",
					timeout: self._ajaxTimeout,
					error: function (jqXHR, textStatus, errorThrown) {
						if (callbackErrorFunction != null) {
							callbackErrorFunction(jqXHR, textStatus, errorThrown);
						} else {
							//Подготавливаем текст ошибки.
							var content = "";
							if (textStatus !== null) {
								content = content + "<div><h3>" + textStatus + "</h3></div>";
							}
							var errorContents = errorThrown;
							//Предполагаем ошибочку от Nancy.
							if (jqXHR.responseText != null) {
								var text = $('#errorContents').text();
								if (text != null) errorContents = text;
							}

							content = content + "<div><h4>" + errorContents + "</h4></div>";
							//Выводим модальное окно с ошибкой.
							ModalWindowsFunction.CreateNewModalDialog("modalWindowDialog", content, true, true);
						}
					},
					beforeSend: function () {
						//индикатор загрузки
						troberId = ModalWindowsFunction.CreateTrobberDiv2();
					},
					success: function (responseData, textStatus, jqXHR) {
						//Разбираемся, что нам пришло.
						var ct = jqXHR.getResponseHeader("content-type") || "";
						//Если json, то всё гуд.
						if (ct.indexOf('json') > -1) {
							callbackFunction(responseData);
							//Если html.
						} else if (ct.indexOf('html') > -1) {
							//Выводим модальное окно с пришедшим контентом.
							ModalWindowsFunction.CreateNewModalDialog("modalWindowDialog", responseData, true, true);
							//Если что-то невнятное.
						} else {
							//Выводим модальное окно с ошибкой.
							ModalWindowsFunction.CreateNewModalDialog("modalWindowDialog", "<div><h3>{0}</h3></div>".format("Недопустимый тип контента!"), true, true);
						}
					},
					complete: function () {
						//Выключаем троббер.
						ModalWindowsFunction.CloseTrobberDiv2(troberId);
					}
				});
			};

			/// <summary>Функция отрисовывает кусочек дела по url, посредством ajax.</summary>
			/// <param name="url">Адрес для ajax-запроса</param>
			/// <param name="target">элемент, чьё содержимое будет заполнено ответом на ajax-запрос.</param>
			/// <param name="requestData">Дополнительные параметры запроса.</param>
			/// <param name="type">Сам глагол (GET-по-умолчанию; можно POST указать).</param>
			/// <param name="type">Тип контента (можно указать, например, json).</param>
			self.FillContent = function (url, target, requestData, type, contentType, hidetrobber) {
				type = (type != null ? type : "GET");
				contentType = (contentType != null ? contentType : "application/x-www-form-urlencoded; charset=utf-8");
				var guid;
				return $.ajax({
					async: true,
					type: type,
					url: url,
					contentType: contentType,
					data: requestData,
					timeout: self._ajaxTimeout,
					error: function (jqXHR, textStatus, errorThrown) {
						if (textStatus !== null) {
							$(target).empty();
							//добавляем полученный контент
							$(target).html("<div><h3>" + textStatus + "</h3></div>");
						}
						$(target).append("<div><h4>" + errorThrown + "</h4></div>");
					},
					beforeSend: function () {
						if (hidetrobber == null) {
							//индикатор загрузки
							guid = ModalWindowsFunction.CreateTrobberDiv2();
						}
					},
					success: function (responseData, textStatus, jqXHR) {
						if (responseData.hasError) {
							ModalWindowsFunction.errorModalWindow(responseData.errorMessage);
						} else {
							if (typeof(responseData) === 'object' && responseData.recid != null) {
								//window.NvxRedocCommon.FindAndClickLeftPaveTask(responseData);
							} else {
								//очищаем поле контента
								$(target).empty();
								//добавляем полученный контент
								$(target).html(responseData);
							}
						}
					},
					complete: function () {
						//Выключаем троббер.
						ModalWindowsFunction.CloseTrobberDiv2(guid);
					}
				});
			};

			/// <summary>Обработка клика по элементу имеющему атрибут data-redoc-href.</summary>
			/// <param name="selector">Объект, клики на котором регистрируем.</param>
			/// <param name="target">элемент, чьё содержимое будет заполнено ответом на ajax-запрос.</param>
			self.AttachClickEvent = function (selector, target) {
				//на каждый элемент меню вешаем событие отрисовки правой части дела.
				$(selector).on("click", function () {
					//Ссылка на получение представления компонента дела.
					var url = $(this).data("redoc-href");
					self.FillContent(url, target);
				});

			};

			/// <summary>Запуск события - клик по элементу дела.</summary>
			/// <param name="elementId">Идентификатор плашки, клик по которой мы эмулируем.</param>
			/// <summary>В случае отсутствия элемента, кликает по общей информации о деле</summary>
			self.RaseClickEvent = function (elementId) {
				var selector = "[data-redoc-id='" + elementId + "']";
				var element = $('#columnPrimary').find(selector);	// #columnPrimary - ищем плашку в левой панели
				if (element.size() > 0) {
					self.MoveBrowserWindowToPave(selector);
					$(element).trigger("click");
				} else if (elementId != 'common-info-uid') {		//чтобы не было бесконечного цикла
					self.RaseClickEvent("common-info-uid");
				}
			};

			/// <summary>Продвинутая привязка функции, вызываемой при submit формы по клику на кнопке, для того, чтобы инициировать валидацию HTML5.</summary>
			/// <param name="$form">Форма, для которой вызывается submit.</param>
			/// <param name="$button">Кнопка (<button> или <input>) по клике на которую вызывается submit.</param>
			/// <param name="submitFunction">Callback-функция без параметров, которая является обработчиком нажатия кнопки.</param>
			self.SubmitForm = function ($form, $button, submitFunction) {
				var isValid = null;
				//Поведение формы.
				$form.on("submit", function (e) {
					//prevent form from submitting valid or invalid
					e.preventDefault();
					//user clicked and the form was not valid
					if (isValid === false) {
						isValid = null;
						return false;
					}
					//user pressed enter, process as if they clicked save instead
					$button.trigger('click');
				});
				//Поведение кнопки.
				$button.on("click", function (event) {
					isValid = $form[0].checkValidity();
					if (false === isValid) {
						return true;
					}
					event.preventDefault();
					//Вызываем переданную функцию.
					submitFunction.call();
					//Отписываемся от событий
					$form.off("submit");
					$button.off("click");

					return true;
				});
			};

			//Отправка данных на сервер (включая значение hidden input, с id равным "fileId")
			self.SendFormData = function ($form, url, target) {
				//Собираем данные с формы.
				//var model = $form.serialize();
				var model = $form.formSerialize();
				//Добавляем идентификатор дела.
				model = model + "&fileId=" + $("#fileId").val();
				//Отправляем на сервер.
				self.FillContent(url, target, model, "POST");
			};

			//Отправка данных на сервер (включая значения тех input, чьи идентификаторы переданы в параметр idArray в виде массива)
			self.SendFormDataAdvanced = function ($form, url, target, idArray) {
				//Собираем данные с формы.
				var model = $form.serialize();
				//Добавляем значения прочих input по переданным идентификаторам.
				for (var i = 0; i < idArray.length; i++) {
					var inputValue = $("#{0}".printf(idArray[i])).val();
					model = model + "&{0}={1}".printf(idArray[i], inputValue);
				}
				//Отправляем на сервер.
				self.FillContent(url, target, model, "POST");
			};

			//#endregion

			self.isRightSideInFileNorm = function() {
				var rightPanel = $('.panel-secondary');
				var paveclass = $('.connected');

				if (paveclass.length != 1 || rightPanel.length != 1) {
					//console.log('error correct right pave! paveclass.length=' + paveclass.length + ', rightPanel.length=' + rightPanel.length);
					return;
				}

				var plt = paveclass[0].offsetTop;
				var plh = paveclass.height();
				
				var prt = rightPanel[0].offsetTop;
				var prh = rightPanel[0].clientHeight;
				
				if (plt + plh > prt + prh) {
					clearTimeout(self._rightPanelResizeTimeout);
					self._rightPanelResizeTimeout = setTimeout(function () {
						self.resizeRightSideInFileView();
						clearTimeout(self._rightPanelResizeTimeout);
					}, 500);
				}
			};
			//#endregion
			
			self.MoveBrowserWindowToPave = function (selector) {
				//Двинем окно браузера к элементу, на который перешли
				var element2 = $(document).find(selector);
				//сдвиг для адекватного восприятия
				var peopleLookSatisfaction = 160;
				//убедились, что плашка есть и она одна
				if (element2.size() === 1) {
					//нижняя граница окна
					var scrollY = (window.scrollY || window.pageYOffset);
					var bortop = scrollY + $(window).height() - peopleLookSatisfaction;
					//верхняя граница окна
					var borbot = scrollY;
					//расположение элемента окна относительно документа
					var eleTop = element2.offset().top;
					//если элемент (плашка слева) выходит за границы окна, двинем
					if (eleTop > bortop || eleTop < borbot) {
						if (eleTop > 80) {
							eleTop = eleTop - peopleLookSatisfaction;
						}
						$(document).scrollTop(eleTop);
					}
				}
			};

			self.ElementDisplayNone = function (elementId) {
				if (document.getElementById(elementId) != null) {
					$('#' + elementId).css('display', 'none');
				}
			};

			self.ElementDisplayBlock = function (elementId) {
				if (document.getElementById(elementId) != null) {
					$('#' + elementId).css('display', 'block');
				}
			};
			//#endregion

			//#region объект для работы с историей браузера.

			//Объект для работы с историей браузера.
			self.historyState = (function () {
				var state = window.history.state;
				if (state == null) state = {};
				var get = function (key) {
					return state[key];
				};
				var set = function (key, object) {
					state[key] = object;
					if (typeof history.replaceState == "function") {
						window.history.replaceState(state, 'Re:Doc');
					}
				};
				return {
					get: get,
					set: set
				};
			}());

			//#endregion

			self.setPageTitle = function(title) {
				if (window.location != null && window.location.pathname != null && window.location.pathname.startsWith('/portal'))
					return;
				title = title || 'Re:Doc';
				document.title = title;
			};
			
			self.FindAndClickLeftPaveTask = function (response) {
				var recid = response.recid;
				console.log('FindAndClickLeftPaveTask ' + recid);
			};
		};

		NvxRedocCommon.prototype.lowCaseReviver = function(key, val) {
			if (key) {
				this[key.charAt(0).toLowerCase() + key.slice(1)] = val;
			} else {
				return val;
			}
		};

		NvxRedocCommon.prototype.upperCaseReviver = function(key, val) {
			if (key) {
				this[key.charAt(0).toUpperCase() + key.slice(1)] = val;
			} else {
				return val;
			}
		};

		/**
		 * Возвращает новый объект со свойствами именованными в стиле CamelCase.
		 * @param {Object} object - Текущий объект.
		 * @returns {Object} - Новый объект. 
		 */
		NvxRedocCommon.prototype.toCamelCase = function (object) {
			var self = this;

			var stringfed = JSON.stringify(object);
			var parsed = JSON.parse(stringfed, function (key, value) {
				if (value && typeof value === 'object')
					for (var k in value) {
						if (/^[A-Z]/.test(k) && Object.hasOwnProperty.call(value, k)) {
							value[k.charAt(0).toLowerCase() + k.substring(1)] = value[k];
							delete value[k];
						}
					}
				return value;
			});

			return parsed;
		};

		/**
		 * Возвращает новый объект со свойствами именованными в стиле PascalCase.
		 * @param {Object} object - Текущий объект.
		 * @returns {Object} - Новый объект. 
		 */
		NvxRedocCommon.prototype.toPascalCase = function (object) {
			var self = this;

			var stringfed = JSON.stringify(object);
			var parsed = JSON.parse(stringfed, self.upperCaseReviver);

			return parsed;
		};

		var nvxRedocCommon = new NvxRedocCommon();
		//Legacy support.
		window.NvxRedocCommon = nvxRedocCommon;

		return nvxRedocCommon;
	});

//#endregion

define('Nvx.ReDoc.Rpgu.PortalModule/Portal/Script/portalPageController', [], function() {
	var controller = (function() {});

	controller.navigate = null;

	return controller;
});
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Helpers/proxyService', [], function() {
	var ProxyService = function() {
		var self = this;

		self.isChromium = function() { return false; };
	};

	return new ProxyService;
});
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Api/reDocUrlQualifier', [], function() {
	var reDocUrlQualifier = {};
	reDocUrlQualifier.possibleSchemes = [
		'skype',
		'ldap',
		'tel',
		'telnet',
		'urn',
		'ms-appx',
		'ms-appx-web',
		'ms-appdata',
		'ms-resource',
		'vsmacros',
		'net.pipe',
		'net.tcp',
		'uuid',
		'wss',
		'ws',
		'sip',
		'file',
		'ftp',
		'gopher',
		'http',
		'https',
		'mailto',
		'net.pipe',
		'net.tcp',
		'news',
		'nntp'
	];
	reDocUrlQualifier.reDocRegexUrl = /((?:[a-z][\w-]+:(?:\/{0,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s<>"]*))/i;
	reDocUrlQualifier.reDocRegexUrlGlobal = /((?:[a-z][\w-]+:(?:\/{0,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s<>"]*))/gi;

	reDocUrlQualifier.getPathInfo = function(path) {
		//  create a link in the DOM and set its href
		var link = document.createElement('a');
		link.setAttribute('href', path);

		//  return an easy-to-use object that breaks apart the path
		return {
			host: link.hostname,  //  'example.com'
			port: link.port,      //  12345
			path: link.pathname,  //  '/blog/foo/bar'
			protocol: link.protocol   //  'http:'
		};
	};

	reDocUrlQualifier.getReformated = function(text) {
		return text.replace(reDocUrlQualifier.reDocRegexUrlGlobal, function(str) {
			var pathinfo = reDocUrlQualifier.getPathInfo(str);
			var protocol = pathinfo.protocol.slice(0, -1);
			if (reDocUrlQualifier.possibleSchemes.indexOf(protocol) !== -1) {
				if (!str.startsWith(protocol)) {
					return '<a href=' + protocol + '://' + str + ' target="_blank">' + str + '</a>';
				} else {
					return '<a href=' + str + ' target="_blank">' + str + '</a>';
				}
			}
			return str;
		});
	};

	return reDocUrlQualifier;
});
define('Nvx/Script/serviceUtils',
[
	'jquery'
],
function($) {
	var ServiceUtils = function () {
	};

	//загрузить жизненные ситуации
	ServiceUtils.prototype.loadLifeSituations = function () {
		var deferred = $.Deferred();
		$.ajax({ url: '/Nvx.ReDoc.StateStructureServiceModule/ServiceController/GetLifeSituations', method: 'GET' })
			.done(function(response) {
				if (response.hasError) {
					deferred.reject();
				} else {
					deferred.resolve(response.result);
				}
			})
			.fail(function(jqXHR) {
				if (jqXHR.responseJSON) {
					console.error(jqXHR.responseJSON.errorMessage);
				} else {
					console.error(jqXHR.responseText);
				}
				deferred.reject();
			});
		return deferred.promise();
	};

	//загрузить популярные услуги
	//configLimited - ограничить длинну ответ настройками портала
	ServiceUtils.prototype.loadPopularServices = function (configLimited, onlyOnline) {
		var deferred = $.Deferred();
		var model = {
			onlyOnline: onlyOnline
		};

		if (configLimited) {
			model.configLimited = configLimited;
		}
		var url = '/Nvx.ReDoc.StateStructureServiceModule/ServiceController/GetPopularServices?' + $.param(model);
		$.ajax({ url: url, method: 'GET' })
			.done(function(response) {
				if (response.hasError) {
					console.error(response.errorMessage);
					deferred.reject();
				} else {
					deferred.resolve(response.result);
				}
			})
			.fail(function(jqXHR) {
				if (jqXHR.responseJSON) {
					console.error(jqXHR.responseJSON.errorMessage);
				} else {
					console.error(jqXHR.responseText);
				}
				deferred.reject();
			});
		return deferred.promise();
	};

	//загрузить Категории
	ServiceUtils.prototype.loadCategoriesServices = function () {
		var deferred = $.Deferred();
		$.ajax({ url: '/Nvx.ReDoc.StateStructureServiceModule/ServiceController/GetCategoriesServices', method: 'GET' })
			.done(function(response) {
				if (response.hasError) {
					console.error(response.errorMessage);
					deferred.reject();
				} else {
					deferred.resolve(response.result);
				}
			})
			.fail(function(jqXHR) {
				if (jqXHR.responseJSON) {
					console.error(jqXHR.responseJSON.errorMessage);
				} else {
					console.error(jqXHR.responseText);
				}
				deferred.reject();
			});
		return deferred.promise();
	};
	
	return ServiceUtils;
});
define('Nvx/AuthViewModel', ['knockout', 'jquery'], function (ko, $) {
	var AuthViewModel = function() {
		var self = this;

		self.rdcurl = window.nvxCommonPath != null ? window.nvxCommonPath.authPortalPath : null;

		self.loginUrl = window.nvxCommonPath != null ? window.nvxCommonPath.authRedirectPath : null;

		self.logoutUrl = '/WebInterfaceModule/EsiaControllers/OAuthLogout';

		//Идентификатор контакта.
		self.userContactId = ko.observable(null);
		//Login phrase.
		self.loginWellcome = 'Личный кабинет';
		//Заголовок для выхода
		self.logoutTitle = 'ВЫЙТИ';

		self.submenuVisible = ko.observable(false);

		//Для отображения текущего имени пользователя.
		self.currentUserName = ko.observable('');
		//Для отображения заголовка кнопки входа
		self.loginButtonTitle = ko.observable(self.loginWellcome);

		//Состояние - залогинен ли пользователь.
		self.userLoggedStatus = ko.observable(false);
		//Если пользователь разлогинен.
		self.userLoggedStatus.subscribe(function(newValue) {
			if (newValue === false) {
				//то обнуляем имя пользователя.
				self.userContactId(null);
				self.currentUserName('');
				self.loginButtonTitle(self.loginWellcome);
			}
		});

		self.click = function() {
			//Если пользователь залогинен.
			if (self.userContactId() != null) {
				self.cookieRefresh('_ncfa', '', -10);
				self.logout();
			} else {
				self.login();
			}
		};

		self.login = function () {
			if (self.loginUrl != null)
				window.location = self.loginUrl;
			else
				console.error('Отсутствует путь механизма авторизации');
		};

		self.logout = function() {
			window.location = self.rdcurl + self.logoutUrl + '?nocache=' + Date.now();
		};

		self.showMenu = function() {
			self.submenuVisible(!self.submenuVisible());
		};

		self.cookieRefresh = function (name, value, days) {
			var expires = "";
			if (days) {
				var date = new Date();
				date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
				expires = "; expires=" + date.toGMTString();
			}
			document.cookie = name + "=" + value + expires + "; path=/; domain="+ document.location.hostname;
		};

		//Запрашиваем с сервера информацию о контакте.
		self.start = function () {
			$.ajax({ url: '/Nvx.ReDoc.Rpgu.PortalModule/Esia/Controllers/OAuthController/ContactInfoBase', method: 'GET', cache: false, headers: { proxy: true } })
				.done(function(response) {
					if (response != null) {
						var userLoggedStatus = response.userLoggedStatus;
						//Если пользователь залогинен.
						if (userLoggedStatus === true) {
							//Идентификатор.
							self.userContactId(response.userContactId);
							//Имя
							if (response.userName != null && response.userName.contains(' ')) {
								var parts = response.userName.split(' ');
								var newName = parts[0] + ' ';
								for (var i = 1; i < parts.length; i++) {
									newName += parts[i].substr(0, 1) + '.';
								}
								response.userName = newName;
							}

							self.currentUserName(response.userName);
							//Заголовок кнопки
							self.loginButtonTitle(self.logoutTitle);
						} else {
							//Если пользователь не залогинен.
							//Идентификатор.
							self.userContactId(null);
							//Имя.
							self.currentUserName('');
							//Заголовок кнопки
							self.loginButtonTitle(self.loginWellcome);
						}
						//Устанавливаем статус, залогинен ли пользователь.
						self.userLoggedStatus(null);
						self.userLoggedStatus(userLoggedStatus);
					}
				});
		};
	};

	return AuthViewModel;
});
define('Nvx/CategoryServiceList', ['knockout', 'jquery', 'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction', 'jqueryExtention'],
	function (ko, $, modal) {
		var CategoryServiceList = function () {
			var self = this;

			self.title = ko.observable();

			self.services = ko.observableArray();

			self.page = ko.observable(0);

			self.keyId = ko.observable();
			self.key = ko.observable();

			self.onlyOnline = ko.observable(window.sessionStorage && window.sessionStorage.getItem('nvxOnlyOnline') === 'true');
			
			self.loadMoreVisible = ko.observable(false);

			self.goPassport = function(item) {
				window.location = (window.nvxCommonPath != null ? window.nvxCommonPath.serviceView : '/service/index.php?departmentId=') + item.id;
			};

			self.goCatalog = function() {
				window.location = (window.nvxCommonPath != null ? window.nvxCommonPath.catalogView : '/services/');
			};

			self.searchText = ko.observable(null);

			self.searchText.subscribe(function (newValue) {
				self.searchAgain();
			});
			self.goSearch = function () {
				self.searchAgain();
			};

			self.onlyOnline.subscribe(function(newValue) {
				if (window.sessionStorage) {
					window.sessionStorage['nvxOnlyOnline'] = newValue;
				}
				self.searchAgain();
			});

			self.searchAgain = function() {
				self.page(0);
				self.services.removeAll();
				self.loadList(null, false);
			};
		};

		CategoryServiceList.prototype.loadList = function (trId, isCommon) {
			var self = this;
			var filterKey = 'all';
			if (window.sessionStorage && window.sessionStorage.getItem('nvxUserType') != null) {
				filterKey = window.sessionStorage.getItem('nvxUserType');
			}

			$.ajax({
				async: true,
				type: "GET",
				url: '/Nvx.ReDoc.StateStructureServiceModule/ServiceController/ServiceGroupsList',
				cache: false,
				data: {
					"sortBy": "FullName",
					"sortOrder": "ASC",
					"groupBy": self.key(),
					"groupId": isCommon === true ? null : self.keyId(),
					"filterBy": filterKey,
					"onlyOnline": self.onlyOnline(),
					"adminLevel": 1,
					"page": self.page(),
					"searchText": self.searchText(),
					"depslocationstorecurrentlocation": window.getCurrentLocationFromCookie()
				},
				success: function(response) {
					if (response.hasError) {
						console.error(response.errorMessage);
					} else {
						self.page(self.page() + 1);
						var data = [];
						var count = 0;
						if (isCommon === true) {
							for (var num = 0; num < response.list.length; num++) {
								if (self.keyId() == response.list[num].groupId) {
									self.title(response.list[num].groupTitle);
									data = response.list[num].list;
									count = response.list[num].count;
									break;
								}
							}
						} else {
							data = response.list;
							count = response.count;
						}
						if (data != null) {
							for (var i2 = 0; i2 < data.length; i2++) {
								self.services.push(data[i2]);
							}
							if (self.services().length < count) {
								self.loadMoreVisible(true);
							} else {
								self.loadMoreVisible(false);
							}
						}
						if (self.title() == null) {
							self.title('Для данной категории или жизненной ситуации нет услуг, доступных для оформления на портале');
						}
					}
				},
				error: function(jqXHR, textStatus, errorThrown) {
					if (jqXHR.responseJSON) {
						console.error(jqXHR.responseJSON.errorMessage + ' Подробности: ' + errorThrown);
					} else {
						console.error(jqXHR.responseText);
					}
				},
				complete: function() {
					if (isCommon === true)
						modal.CloseTrobberDiv3(trId);
				}
			});
		};

		CategoryServiceList.prototype.start = function (trId) {
			var self = this;

			var keyId = window.getUrlVarsFunction()['categoryId'];
			var key = 'Category';
			if (keyId == null || keyId == '') {
				keyId = window.getUrlVarsFunction()['situationId'];
				key = 'LifeSituation';
			}
			console.log('keyId: ' + keyId);
			self.keyId(keyId);
			self.key(key);

			if (keyId == null) {
				console.error('Категория не определена');
				self.title('Категория не определена');
				return;
			}

			self.loadList(trId, true);
		};

		return CategoryServiceList;
	});
define('Nvx/CategoryViewModel',
	[
		'knockout',
		'Nvx/Script/serviceUtils'
	],
	function (ko, ServiceUtils) {
		var CategoryViewModel = function() {
			var self = this;

			self.serviceUtils = new ServiceUtils();
			self.cats = ko.observableArray();
		};

		//Показать весь контент
		CategoryViewModel.prototype.start = function() {
			var self = this;
			self.serviceUtils.loadCategoriesServices().done(function(list) {
				for (var i = 0; i < list.length; i++) {
					var item = list[i];
					var link = (window.nvxCommonPath != null ? window.nvxCommonPath.categoryView : '/category/index.php?categoryId=') + item.recId;
					self.cats.push({ title: item.title, link: link, recId: item.recId });
				}
			});
		};

		return CategoryViewModel;
	});
define('Nvx/CurrentLocationViewModel', ['knockout'],
	function(ko) {
		var CurrentLocationViewModel = function() {
			var self = this;

			self.locationBaseText = ko.observable('Выберите район');
		};

		CurrentLocationViewModel.prototype.start = function() {
			var self = this;
			if (window.sessionStorage && window.sessionStorage.getItem('nvxCurrentLocation') != null) {
				self.locationBaseText(window.sessionStorage.getItem('nvxCurrentLocation'));
			}
		};

		return CurrentLocationViewModel;
	});
define('Nvx/CustomerCabinetViewModel',
	[
		'knockout',
		'Nvx.ReDoc.Rpgu.PortalModule/Cabinet/Script/customer/CustomerViewModelService',
		'Nvx.ReDoc.Rpgu.PortalModule/Cabinet/Script/customer/CustomerViewModel',
		'Nvx.ReDoc.Rpgu.PortalModule/Cabinet/Script/customer/IndividualViewModel',
		'Nvx.ReDoc.Rpgu.PortalModule/Cabinet/Script/customer/JuridicalViewModel'
	],
	function (ko, CustomerViewModelService, CustomerViewModel, IndividualViewModel, JuridicalViewModel) {
		var CustomerCabinetViewModel = function() {
			var self = this;

			self.isPhysical = ko.observable(true);
			self.isIndividual = ko.observable(false);
			self.customerViewModel = ko.observable(null);
		};

		//Показать весь контент
		CustomerCabinetViewModel.prototype.start = function() {
			var self = this;
			var cvms = new CustomerViewModelService();
			cvms.loadCustomerInfo().done(function(response) {
				if (cvms.physical) {
					self.isPhysical(true);
					self.isIndividual(false);
					if (self.customerViewModel() == null) {
						self.customerViewModel(new CustomerViewModel());
						self.customerViewModel().applyResponse(cvms.physical);
					}
				} else if (cvms.juridical) {
					self.isPhysical(false);
					self.customerViewModel(new JuridicalViewModel());
					self.customerViewModel().applyResponse(cvms.juridical);
				} else if (cvms.individual) {
					self.isPhysical(true);
					self.isIndividual(true);
					self.customerViewModel(new IndividualViewModel());
					self.customerViewModel().applyResponse(cvms.individual);
				}
			});
		};

		return CustomerCabinetViewModel;
	});
define('Nvx/DepartmentTreeViewModel', [
		'knockout',
		'jquery',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/knockout/customBindingHandlers'],
	function(ko, $, modalWindowsFunction) {
		var DepartmentTreeViewModel = function() {
			var self = this;

			/*Региональные водомства*/
			self.regionalDepartments = ko.observable(null);
			/*Муниципальные водомства*/
			self.municipalDepartments = ko.observable(null);
			/*Территориальные водомства*/
			self.territorialDepartments = ko.observable(null);

			self.tdvis = ko.observable(true);
			self.rdvis = ko.observable(true);
			self.mdvis = ko.observable(true);

			self.tdvisClick = function() { self.tdvis(!self.tdvis()); };
			self.rdvisClick = function() { self.rdvis(!self.rdvis()); };
			self.mdvisClick = function() { self.mdvis(!self.mdvis()); };
		};

		DepartmentTreeViewModel.prototype.start = function() {
			var self = this;
			self.getDepartments();
		};

		/* Добавляет в модель ссылки на страницы ведомств */
		DepartmentTreeViewModel.prototype.setLink = function(department) {
			var self = this;
			if (department != null) {
				if (Array.isArray(department.subDepartments)) {
					department.subDepartments.forEach(function(item, i) {
						item.link = (window.nvxCommonPath != null ? window.nvxCommonPath.departmentView : '/department/index.php?departmentId=') + item.id; //todo
						self.setLink(item);
					});
				}
			}
		};

		DepartmentTreeViewModel.prototype.setOnClick = function(department) {
			var self = this;
			if (department) {
				department.renderChildren = ko.observable(false);
				department.spoilerClick = function() {
					department.renderChildren(!department.renderChildren());
				};

				if (Array.isArray(department.subDepartments)) {
					department.subDepartments.forEach(function(item, i) {
						self.setOnClick(item);
					});
				}
			}
		};

		DepartmentTreeViewModel.prototype.getDepartments = function() {
			var self = this;

			var currentLocation = window.getCurrentLocationFromCookie();
			if (currentLocation != null)
				currentLocation = '/' + currentLocation;

			var promise = $.ajax({ url: '/Nvx.ReDoc.StateStructureServiceModule/StateStructureController/GetDepartments' + currentLocation, method: 'GET' })
				.done(function(response) {
					if (response.hasError) {
						console.log(response.errorMessage);
					} else {
						self.setLink(response.result.regionalDepartments);
						self.setLink(response.result.municipalDepartments);
						self.setLink(response.result.territorialDepartments);

						self.setOnClick(response.result.regionalDepartments);
						self.setOnClick(response.result.municipalDepartments);
						self.setOnClick(response.result.territorialDepartments);

						self.regionalDepartments(response.result.regionalDepartments);
						self.municipalDepartments(response.result.municipalDepartments);
						self.territorialDepartments(response.result.territorialDepartments);
					}
				})
				.fail(function(jqXHR, textStatus, errorThrown) {
					if (jqXHR.responseJSON) {
						console.log(jqXHR.responseJSON.errorMessage);
					} else {
						console.log(jqXHR.responseText);
					}
				});

			return promise;
		};

		return DepartmentTreeViewModel;
	});
define('Nvx/DepartmentViewModel',
['knockout',
	'jquery',
	'Nvx.ReDoc.StateStructureServiceModule/StateStructure/Script/MfcViewModel',
	'Nvx.ReDoc.StateStructureServiceModule/StateStructure/Script/MfcServicesViewModel',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
	'Nvx.ReDoc.Rpgu.Core/Script/Tab',
	'Nvx.ReDoc.StateStructureServiceModule/StateStructure/Script/mfcUtils'],
function(ko, $, MfcViewModel, MfcServicesViewModel, inherit, Tab, mfcUtils) {
	var DepartmentViewModel = function(departmentId) {
		var self = this;

		//Вызываем конструктор родителя.
		DepartmentViewModel.superclass.constructor.apply(self, arguments);

		/*Контактные лица ведомства*/
		self.contacts = ko.observableArray(null);
		/*Подведомства*/
		self.subDepartments = ko.observableArray(null);
		/*Пкоазывать или нет вкладку подведомств*/
		self.visibleTabSubDepartments = ko.observable(false);

		//подписываемся на изменения списка подведомств и меняем значения флага видимости
		self.subDepartments.subscribe(function(newValue) {
			if (newValue != null && newValue.length > 0) {
				self.visibleTabSubDepartments(true);
			} else {
				self.visibleTabSubDepartments(false);
			}
		});

		/*Подведомственные территориальные органы*/
		self.territorialSubDepartments = ko.observableArray(null);

		/*Пкоазывать или нет вкладку территориальных органов*/
		self.visibleTabTerritorialSubDepartment = ko.observable(false);

		//подписываемся на изменения списка территориальных органов и меняем значения флага видимости
		self.territorialSubDepartments.subscribe(function(newValue) {
			if (newValue != null && newValue.length > 0) {
				self.visibleTabTerritorialSubDepartment(true);
			} else {
				self.visibleTabTerritorialSubDepartment(false);
			}
		});

		/*Места обращения*/
		self.placesTreatment = ko.observableArray(null);

		//Создать вкладки
		self.createTabs();

		self.mfcFunctionsViewModel = ko.observable(null);
	};

	//Наследуемся.
	inherit(DepartmentViewModel, MfcViewModel);

	DepartmentViewModel.prototype.getDepartmentUrl = function() {
		return '/Nvx.ReDoc.StateStructureServiceModule/StateStructureController/GetDepartment/';
	};

	/**
	* Создать вкладки
	* @returns {} 
	*/
	DepartmentViewModel.prototype.createTabs = function() {
		var self = this;
		self.tabs = {};
		self.tabs.unactiveTabs = function() {
			//Убираем активность у всех вкладок.
			for (var index in self.tabs) {
				if (typeof(self.tabs[index]) === 'object') {
					self.tabs[index].active(false);
				}
			}

			//self.normalizeHeight();
		};

		self.tabs.info = new Tab('Информация');
		self.tabs.info.onclick = function() {
			self.setActiveTab('info');
		};
		self.tabs.info.activate = function() {
			//Убираем активность у всех вкладок.
			self.tabs.unactiveTabs();
			//Выставляем активность вкладке по которой кликнули.
			self.tabs.info.active(true);
			self.showInfo();
		};

		self.tabs.services = new Tab('Услуги');
		self.tabs.services.onclick = function() {
			self.setActiveTab('services');
		};

		self.tabs.funcs = new Tab('Функции');
		self.tabs.funcs.onclick = function() {
			self.setActiveTab('funcs');
		};

		self.tabs.services.activate = function() {
			//Убираем активность у всех вкладок.
			self.tabs.unactiveTabs();
			//Выставляем активность вкладке по которой кликнули.
			self.tabs.services.active(true);
			self.showServices();
		};

		self.tabs.funcs.activate = function() {
			//Убираем активность у всех вкладок.
			self.tabs.unactiveTabs();
			//Выставляем активность вкладке по которой кликнули.
			self.tabs.funcs.active(true);
			self.showFunctions();
		};

		self.tabs.subDepartments = new Tab('Подведомственные организации');
		self.tabs.subDepartments.onclick = function() {
			self.setActiveTab('subDepartments');
		};
		self.tabs.subDepartments.activate = function() {
			//Убираем активность у всех вкладок.
			self.tabs.unactiveTabs();
			//Выставляем активность вкладке по которой кликнули.
			self.tabs.subDepartments.active(true);
			//self.showSubDepartments();
		};

		self.tabs.territorialSubDepartments = new Tab('Территориальные органы');
		self.tabs.territorialSubDepartments.onclick = function() {
			self.setActiveTab('territorial');
		};
		self.tabs.territorialSubDepartments.activate = function() {
			//Убираем активность у всех вкладок.
			self.tabs.unactiveTabs();
			//Выставляем активность вкладке по которой кликнули.
			self.tabs.territorialSubDepartments.active(true);
			//self.showTerritorialSubDepartments();
		};

		//setTimeout(function(){self.normalizeHeight()},100);
	};

	/**
	* Показать список функций
	* @returns {} 
	*/
	DepartmentViewModel.prototype.showFunctions = function() {
		var self = this;

		self.createFunctionsModel();
		//получить информацию о ведомстве, если нет заголовка
		if (!self.name() || self.name() === '') {
			self.getDepartment();
		}

		return self.getFunctionList();
	};

	/**
	* Создать модель для отображения списка функций.
	* @returns {} 
	*/
	DepartmentViewModel.prototype.createFunctionsModel = function() {
		var self = this;
		if (self.mfcFunctionsViewModel() == null) {
			var mfcFunctionsViewModel = new MfcServicesViewModel();
			//добавляем в параметр фильтрации идентификатор ведомства
			mfcFunctionsViewModel.item.selectionState.params.departmentId = self.departmentId;
			mfcFunctionsViewModel.item.selectionState.params.isFunction = true;
			//подменяем адрес страницы на текущий
			mfcFunctionsViewModel.item.selectionState.pageUrl = window.location.pathname;
			self.mfcFunctionsViewModel(mfcFunctionsViewModel);
		}
	};

	DepartmentViewModel.prototype.getFunctionList = function() {
		var self = this;
		var deferred = $.Deferred();
		self.mfcFunctionsViewModel().updateFilter();
		deferred.resolve();
		return deferred.promise();
	};

	/**
	* Применить ответ сервера к моделе
	* @param {} responseResult 
	* @returns {} 
	*/
	DepartmentViewModel.prototype.applyResponse = function(responseResult) {
		var self = this;
		//MfcViewModel.prototype.applyResponse.call(self, responseResult);

		var department = responseResult.department;
		self.name(department.name);
		self.address(department.address);
		self.headName(department.headName);
		self.workTime(department.workTime);
		self.phone(department.phone);
		self.webSite(mfcUtils.prototype.getWebLink(department.webSite));
		self.email(department.email);
		self.locationCoord(department.locationCoord);

		//подведомства
		responseResult.subdepartments.forEach(function (item, i) {
			item.link = (window.nvxCommonPath != null ? window.nvxCommonPath.departmentView : '/department/index.php?departmentId=') + item.id;
		});
		self.subDepartments(responseResult.subdepartments);

		//территориальные органы
		responseResult.territorialSubdepartments.forEach(function(item, i) {
			item.link = (window.nvxCommonPath != null ? window.nvxCommonPath.departmentView : '/department/index.php?departmentId=') + item.id;
		});
		self.territorialSubDepartments(responseResult.territorialSubdepartments);

		self.contacts(responseResult.department.contacts);
		self.placesTreatment(responseResult.department.placesTreatment);
	};

	/**
	* Создать модель для отображения списка услуг
	* @returns {} 
	*/
	DepartmentViewModel.prototype.createServicesModel = function() {
		var self = this;

		MfcViewModel.prototype.createServicesModel.apply(self, arguments);

		//удалить группировку по ведомствам
		var groups = self.mfcServicesViewModel().item.groups;
		var index = -1;
		for (var i = 0; i < groups.length && index === -1; i++) {
			var item = groups[i];
			if (item.id === 'Department') {
				index = i;
			}
		}

		if (index > -1) {
			groups.splice(index, 1);
		}
	};

	/**
	* Сделать активной вкладку
	* @param {} selectTab 
	* @returns {} 
	*/
	DepartmentViewModel.prototype.setActiveTab = function(selectTab) {
		var self = this;

		if (!selectTab) {
			selectTab = 'info';
		}

		selectTab = selectTab.toLowerCase();

		switch (selectTab) {
		case 'services':
			self.tabs.services.activate();
			break;
		case 'funcs':
			self.tabs.funcs.activate();
			break;
		case 'subdepartments':
			self.tabs.subDepartments.activate();
			break;
		case 'territorial':
			self.tabs.territorialSubDepartments.activate();
			break;
		default:
			self.tabs.info.activate();
		}

	};

	return DepartmentViewModel;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormFormViewModel', [
	'jquery',
	'knockout',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormController/mainForm',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormController/readonlyDynamicForm',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
	'jqueryExtention'
], function ($, ko, mainForm, readonlyDynamicForm, modalWindowsFunction) {
	var DynamicFormFormViewModel = function () {
		var self = this;

		/**
		 * Идентификатор компонента дела.
		 * @type {ko.observable.<String>}
		 */
		self.componentId = ko.observable('');
		/**
		 * Валидность формы.
		 * @type {Boolean}
		 */
		self.notValid = false;
		/**
		 * Состояние формы: только для чтения или можно редактировать.
		 * @type {ko.observable.<Boolean>}
		 */
		self.readOnly = ko.observable(true);
		/* Название формы.
		* @type {ko.observable.<String>}
		*/
		self.formTitle = ko.observable('');
		/**
		 * Описание TransitionButtons разметкой
		 * @type {ko.observable.<String>}
		 */
		self.relatedItemsViewModel = ko.observable(null);
		/**
		 * Доступные переходы.
		 * @type {ko.observable.<Array<Transition>>}
		 */
		self.transitions = ko.observable([]);

		/**
		 * Непосредственно вью-модель динамической формы со всякими элементами.
		 * @type {ko.observable.<DynamcFormViewModel>}
		 */
		self.dynamicFormViewModel = ko.observable(null);
		/**
		 * Разметка динамической формы со всякими элементами.
		 * @type {ko.observable.<String>}
		 */
		self.dynamicFormMarkup = ko.observable('');

		/**
		 * Идентификатор обработчика, обслуживающего эту вью-модель.
		 * @type {String}
		 */
		self.currentHubId = '';
	};

	/**
	 * Действие при клике по кнопке перехода.
	 * @param {} transition 
	 * @returns {} 
	 */
	DynamicFormFormViewModel.prototype.transitionClick = function (action, step) {
		mainForm.goToTransition(action, step);
	};

	/** Заполняем вью-модель данными.
	* @param {Object} model - Объект данных с сервера.
	*/
	DynamicFormFormViewModel.prototype.applyData = function (model) {
		var self = this;

		//Валидность формы.
		self.notValid = model.notValid;
		//Состояние формы.
		self.readOnly(model.readOnly);
		//Название формы.
		self.formTitle(model.formTitle);
		//Кнопки переходов.
		var transitions = [];
		if (model.transitions != null) {
			model.transitions.forEach(function (transition) {
				transitions.push(self.addColorToTransitionButton(transition, DynamicFormFormViewModel.prototype.transitionClick));
			});
		}
		//Кнопки переходов.
		self.transitions(transitions);
	};

	DynamicFormFormViewModel.prototype.addColorToTransitionButton = function(transition, callback) {
		var buttonClass = "btn";
		switch (transition.action) {
			case 3:
				transition.actionName = 'Abort';
				break;
			case 0:
				transition.actionName = 'Cancel';
				break;
			case 1:
				transition.actionName = 'Submit';
				break;
			case 2:
				transition.actionName = 'Error';
				break;
		}

		//Добавляем цвет.
		transition.bclass = buttonClass;

		//Добавляем действие.
		transition.onclick = function(data, event) {
			callback(data.actionName, data.to);
		};

		return transition;
	};

	/**
	 * Запуск логики формы.
	 */
	DynamicFormFormViewModel.prototype.start = function(fileId, componentId, fromPortal) {
		var self = this;
		if (fileId == null) {
			fileId = self.fileId;
		}
		if (componentId == null) {
			componentId = self.componentId();
		}
		if (fromPortal == null) {
			fromPortal = false;
		}

		var model = {
			fromPortal: fromPortal,
			fileId: fileId,
			componentId: componentId
		};
		//Получение описателя формы с единственной целью - понять js-это форма или ruby.
		$.ajax({ url: '/Nvx.ReDoc.Workflow.DynamicForm/Web/Controller/FormDataController/MainFormDescriptor', data: model, method: 'POST', headers: { proxy: true } })
			.done(function(response) {
				if (self.readOnly()) {
					readonlyDynamicForm.initHub(fileId, componentId, response);
					self.currentHubId = 'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormController/readonlyDynamicForm';
				} else {
					mainForm.initHub(fileId, componentId, response);
					self.currentHubId = 'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormController/mainForm';
					mainForm.formWasLoaded(false);
				}
			}).fail(function(jqXHR, textStatus, errorThrown) {
				if (jqXHR.responseJSON) {
					modalWindowsFunction.errorModalWindow(jqXHR.responseJSON.errorMessage);
				} else {
					modalWindowsFunction.errorModalWindow(jqXHR.responseText);
				}
			});
	};

	return DynamicFormFormViewModel;
});
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/FileController/FileComponentFormModule',
	[
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/FileController/FileComponentModule'
	],
	function(inherit, FileComponentModule) {
		var FileComponentFormModule = function() {
			var self = this;

			//Вызываем конструктор родителя.
			FileComponentFormModule.superclass.constructor.apply(self, arguments);

			//Это cshtml-реализация.
			self.legacy = true;
		};

		//Наследуемся.
		inherit(FileComponentFormModule, FileComponentModule);

		//Скрипт, который выполняется после отрисовки представления.
		FileComponentFormModule.prototype.action = function() {
			var self = this;

			//Вызов метода родителя.
			var parentPromise = FileComponentFormModule.superclass.action.apply(self, arguments);

			var deferred = $.Deferred();
			parentPromise.done(function() {

				deferred.resolve();
			});

			return deferred.promise();
		};

		return FileComponentFormModule;
	});
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/FileController/FileComponentModule',
	[
		'knockout',
		'jquery'
	],
	function(ko, $) {
		var FileComponentModule = function() {
		};

		FileComponentModule.prototype.action = function(data, event) {

		};

		// подпись на изменения дела(надо описывать dispose в templateViewModel!!!)
		FileComponentModule.prototype.subscribeFileChanges = function() {

		};

		// (надо описывать dispose в templateViewModel!!!)
		FileComponentModule.prototype.dispose = function() {

		};

		//Идентификатор шаблона представления.
		FileComponentModule.prototype.templateId = 'placeholderTemplate';
		//Вью-модель представления.
		FileComponentModule.prototype.templateViewModel = null;
		//Флаг, устаревший ли это модуль.
		//Т.е. еще не перетянутый с cshtml на чистый html.
		FileComponentModule.prototype.legacy = false;
		//Родительская вью-модель. Т.е. модель всего дела, чтобы модули могли воздействовать на 
		//поведение и представление дела. А также общаться с другими модулями через родительскую вью-модель.
		FileComponentModule.prototype.fileViewModel = null;

		//Загрузка cshtml в качестве шаблонов.
		//url - откуда получаем разметку.
		//templateId - под каким именем сохраняем в DOM, чтобы knockout смог потом добраться до этой разметки по заданному имени.
		FileComponentModule.prototype.loadTemplate = function(url) {
			var self = this;

			var deferred = $.Deferred();

			//Идентификатор шаблона.
			var templateId = self.templateId;

			//Получаем разметку.
			$.get(url).done(function(markup, textStatus, jqXHR) {
				//Добавляем разметку к шаблонам.
				ko.templates[templateId] = markup;
				deferred.resolve();
			}).fail(function(jqXHR, textStatus, errorThrown) {
				deferred.reject(errorThrown);
			});

			return deferred.promise();

		};

		return FileComponentModule;
	});
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/DefaultController/GroupPagedViewModel',
	[
		'knockout',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/DefaultController/indexBasePagedViewModel',
		'jquery',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Navigation/navigation',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Navigation/primaryMenuUrlBuilder',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
		'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/knockout/customBindingHandlers'
	],
	function (ko, indexBasePagedViewModel, $, navigation, primaryMenuUrlBuilder, inherit) {
		var groupPagedViewModel = function (groupPageFactory) {
			var self = this;
			groupPagedViewModel.superclass.constructor.apply(self, arguments);

			//шаблон для элементов списка
			self.listTemplateId = ko.observable('placeholderTemplate');

			self.childsTemplateId = ko.observable('placeholderTemplate');

			//класс вью-модели группы - должен быть наследником GroupViewModel
			self.groupPageFactory = groupPageFactory;
			//если включена данная опция то применение сортировки и группировки производиться через навигацию по url, 
			//если нет то производится внутренняя обработка  помощью applySelectionState
			self.enableNavigation = false;

			self.items = ko.observableArray();

			self.allItemsCount = ko.computed(function () {
				var total = 0;
				ko.utils.arrayForEach(self.items(), function(group) {
					total += group.items().length;
				});
				return total;
			});

			self.searchText = ko.observable('');
			self.canSearch = ko.observable(false);
			self.useDateControl = ko.observable(false);
			self.makeBeforeDate = ko.observable();
			self.useTaskControl = ko.observable(false);
			self.useArchivCheckBox = ko.observable(true);
			self.useChildOrgsControl = ko.observable(false);
			self.chosenUsers = ko.observable('');
			self.childOrgs = ko.observable('');
		
			/**
			 * Показывать фильтр
			 */
			self.canFilter = ko.observable(false);

			/**
			 * Заголовок для фильтра
			 */
			self.filterTitle = ko.observable('Фильтровать по');

			/**
			 * Заголовок для контрола группировки
			 */
			self.groupTitle = ko.observable('Группировать по');

			/**
			 * Выпадающий список фильтра
			 */
			self.filters = ko.observable([
				{
					title: 'Показать все',
					filterBy: 'all'
				}
			]);

			/**
			 * Выбранный элемент фильтра
			 */
			self.filter = ko.observable(null);

			/**
			 * Показывать контрол сортировки
			 */
			self.canSorts = ko.observable(true);

			self.sorts = ko.observable([
				{
					title: 'Дата изменения (по убыванию)',
					sortBy: 'ModifiedAt',
					sortOrder: 'DESC'
				},
				{
					title: 'Дата изменения (по возрастанию)',
					sortBy: 'ModifiedAt',
					sortOrder: 'ASC'
				}
			]);

			self.groups = ko.observable([
				{
					title: 'Не группировать',
					//groupBy: 'FileStatus'
					groupBy: ''
				},
				{
				title: 'По категориям',
				//groupBy: 'FileStatus'
				groupBy: 'Category'
			}]);

			self.sort = ko.observable(null);

			self.groupBy = ko.observable('');

			/**
			 * Показывать только электронные услуги
			 */
			self.onlyOnline = ko.observable(window.sessionStorage && window.sessionStorage.getItem('nvxOnlyOnline') === 'true');

			//self.sort = ko.observable(null); //предполагаю объект в виде {sortBy: 'ModifiedAt',sortOrder: 'ASC', ....}
			self.sort.subscribe(function (value) {
				var state = self.selectionState();
				if (state && (state.params['sortBy'] != value.sortBy
					||
					state.params['sortOrder'] != value.sortOrder)) {

					state.params['sortBy'] = value.sortBy;
					state.params['sortOrder'] = value.sortOrder;
					if (self.enableNavigation) {
						var path = primaryMenuUrlBuilder.getPath(state);
						navigation.navigate(path);
					} else {
						self.applySelectionState(state);
					}
				}
			}, self);

			self.groupBy.subscribe(function (value) {
				var state = self.selectionState();
				if (state && state.params['groupBy'] != value.groupBy) {
					state.params['groupBy'] = value.groupBy;
					if (self.enableNavigation) {
						var path = primaryMenuUrlBuilder.getPath(state);
						navigation.navigate(path);
					} else {
						self.applySelectionState(state);
					}
				}
			}, self);

			self.searchText.subscribe(function (value) {
				if (value != undefined) {
					self.timedSubmit();
				}
			}, self);

			self.filter.subscribe(function (value) {
				var state = self.selectionState();
				if (state && state.params['filterBy'] != value.filterBy) {
					state.params['filterBy'] = value.filterBy;
					if (self.enableNavigation) {
						var path = primaryMenuUrlBuilder.getPath(state);
						navigation.navigate(path);
					} else {
						self.applySelectionState(state);
					}
				}
			}, self);

			self.submitSearch = function() {
				var state = self.selectionState();
				if (state) {
					state.params['searchText'] = self.searchText();
					if (self.enableNavigation) {
						var path = primaryMenuUrlBuilder.getPath(state);
						navigation.navigate(path);
					} else {
						self.applySelectionState(state);
					}
				}
			};			

			self.makeBeforeDate.subscribe(function (value) {
				var state = self.selectionState();
				if (state) {
					var txtDate = '';
					if (value != null) {
						txtDate = value.toUTCString();
					}
					state.params['makeBeforeDate'] = txtDate;
					if (self.enableNavigation) {
						var path = primaryMenuUrlBuilder.getPath(state);
						navigation.navigate(path);
					} else {
						self.applySelectionState(state);
					}
				}
			}, self);

			self.chosenUsers.subscribe(function (value) {
				var state = self.selectionState();
				if (state) {
					state.params['usersForOrg'] = (value || "").toString();
					if (self.enableNavigation) {
						var path = primaryMenuUrlBuilder.getPath(state);
						navigation.navigate(path);
					} else {
						self.applySelectionState(state);
					}
				}
			}, self);

			self.childOrgs.subscribe(function (value) {
				var state = self.selectionState();
				if (state) {
					state.params['childOrgs'] = value;
					//state.params['childOrgs'] = (value || "").toString();
					if (self.enableNavigation) {
						var path = primaryMenuUrlBuilder.getPath(state);
						navigation.navigate(path);
					} else {
						self.applySelectionState(state);
					}
				}
			}, self);

			self.timeoutDefaultValue = 300;
			var timerId = 'groupSearchTextFilterTimer';
			self.timedSubmit = function (timeout) {
				var timeoutValue = self.timeoutDefaultValue;
				if (timeout) {
					timeoutValue = timeout;
				}
				var timer = $(this).data(timerId);
				if (timer) {
					clearTimeout($(this).data(timerId));
					$(this).data(timerId, setTimeout(function () {
						self.submitSearch();
					}, timeoutValue));
				} else {
					self.submitSearch();
					$(this).data(timerId, 'fake');
				}
			};

			self.onlyOnline.subscribe(function (value) {

				if (window.sessionStorage) {
					window.sessionStorage['nvxOnlyOnline'] = value;
				}

				var state = self.selectionState();
				if (state) {
					state.params['onlyOnline'] = value;
					if (self.enableNavigation) {
						var path = primaryMenuUrlBuilder.getPath(state);
						navigation.navigate(path);
					} else {
						self.applySelectionState(state);
					}
				}
			}, self);

			//указывает что происходит обработка установленых условий(true пока производятся модификации внутренней selectionState и url, запрос к серверу и применение ответа сервера)
			self.inLoadProgress = ko.observable(false);

			//элемент интерфейса со списком
			self.listElement = ko.observable(null);

			//
			self.initialized = ko.observable(false);

			/** Варианты форматов файлов отчетов */
			self.exportFormats = [
				{ title: 'PDF', value: 'pdf' },
				{ title: 'XLS', value: 'xls' },
				{ title: 'RTF', value: 'rtf' }
			];
			self.exportFormat = ko.observable(self.exportFormats[0]);
		};

		inherit(groupPagedViewModel, indexBasePagedViewModel);

		groupPagedViewModel.prototype.applyResponse = function (response, clearExistsResult) {
			var self = this;
			var selectionState = JSON.parse(JSON.stringify(self.selectionState()));

			function formatItem(item, templateId) {
				var newItem = new self.groupPageFactory(item, selectionState);
				newItem.listTemplateId(self.listTemplateId());
				newItem.childsTemplateId = ko.observable(self.childsTemplateId());
				newItem.childs = ko.utils.arrayMap(item.childs, function (child) {
					var newChild = formatItem(child);
					return newChild;
				});
				return newItem;
			};

			var newItems = ko.utils.arrayMap(response.list, function (item) {
				var newItem = formatItem(item);
//				var newItem = new self.groupPageFactory(item, selectionState);
				//				newItem.listTemplateId(self.listTemplateId());
				return newItem;
			});
			if (clearExistsResult === true) {
				self.items([]);
			}
			self.items.push.apply(self.items, newItems);
			if (typeof self.afterApplyResponse === 'function') {
				self.afterApplyResponse(response, clearExistsResult);
			}
			self.initialized(true);
			self.inLoadProgress(false);
		};

		groupPagedViewModel.prototype.applySelectionState = function (selectionState) {
			var self = this;

			self.inLoadProgress(true);
			if (typeof self.beforeApplySelectionState === 'function') {
				self.beforeApplySelectionState(selectionState, true);
			}

			if (selectionState.params.groupBy) {
				var group = ko.utils.arrayFirst(self.groups(), function (item) {
					return item.groupBy === selectionState.params.groupBy;
				});
				if (group) {
					self.groupBy(group);
				}
			}
			if (selectionState.params.sortBy) {
				var sort = ko.utils.arrayFirst(self.sorts(), function (item) {
					return item.sortBy === selectionState.params.sortBy && item.sortOrder === selectionState.params.sortOrder;
				});
				if (sort) {
					self.sort(sort);
				}		
			}
			if (selectionState.params.filterBy) {
				var filter = ko.utils.arrayFirst(self.filters(), function (item) {
					return item.filterBy === selectionState.params.filterBy;
				});
				if (filter) {
					self.filter(filter);
				}
			}

			self.selectionState(selectionState);

			return self.update(selectionState, true);
		};

		groupPagedViewModel.prototype.update = function (selectionState, clearExistsResult) {
			var self = this;

			selectionState.params.depslocationstorecurrentlocation = window.getCurrentLocationFromCookie();

			var promise = $.ajax({
				async: true,
				type: "POST",
				url: selectionState.url,
				contentType: "application/json",
				//data: requestData,
				data: JSON.stringify(selectionState.params),
				dataType: "json",
				error: function (jqXHR, textStatus, errorThrown) {
					switch (jqXHR.status) {
						case 403:
							//Перенаправляем на страницу аутентификации.
							var returnUrl = window.location.pathname + window.location.hash;
							returnUrl = encodeURIComponent(returnUrl);
							var redirectUrl = '/WebInterfaceModule/Authentication/Login?returnUrl=' + returnUrl;
							window.location.href = redirectUrl;
							break;
						default:
							//Выводим модальное окно с ошибкой.
							alert('Не удалось получить с сервера данные. Подробности: ' + errorThrown);
					}
				},
				success: function (response) {
					if (response.hasError) {
						//Выводим модальное окно с ошибкой.
						alert(response.errorMessage);
					} else {
						//Записываем список шаблонов дел во вью-модель.
						self.applyResponse(response, clearExistsResult);
					}
				}
			});

			return promise;
		};

		return groupPagedViewModel;
	});
define('Nvx/LocationSelectViewModel',
	['knockout'],
	function (ko) {
		var LocationSelectViewModel = function() {
			var self = this;

			self.locationBaseText = ko.observable('Выберите район');
			self.isLocationSet = ko.observable(false);
			self.locations = ko.observableArray([]);

			self.selectedLocation = ko.observable();
			
			self.clickLocation = function (item) {
				console.log('self.clickLocation');
				self.selectedLocation(item);
				$('#sr' + item.id).selected(true);
			};
		};

		LocationSelectViewModel.prototype.save = function () {
			var self = this;
			console.log('save');
			if (self.selectedLocation() != null) {
				var locaitonId = self.selectedLocation().id;
				document.cookie = "depslocationstorecurrentlocation=" + locaitonId + ";path=/;domain=" + window.location.hostname;
				if (window.sessionStorage) {
					window.sessionStorage.setItem('nvxCurrentLocation', self.selectedLocation().location);
				}
				window.location.reload();
			}
		};

		LocationSelectViewModel.prototype.start = function() {
			var self = this;
			self.initLocations();
			if (window.sessionStorage && window.sessionStorage.getItem('nvxCurrentLocation') != null) {
				self.locationBaseText(window.sessionStorage.getItem('nvxCurrentLocation'));
				self.isLocationSet(true);
			}
		};

		LocationSelectViewModel.prototype.initLocations = function () {
			var self = this;
			$.ajax({ url: '/portal/locations', method: 'GET' })
				.done(function(response) {
					if (response.hasError) {
						console.error(response.errorMessage);
					} else {
						var currentLocationId = window.getCurrentLocationFromCookie();
						var currentLocationText = null;
						self.locations.removeAll();
						for (var i = 0; i < response.length; i++) {
							self.locations.push(response[i]);
							if (currentLocationId === response.id) {
								currentLocationText = response.location;
							}
						}
						if (self.isLocationSet() === false && currentLocationText != null) {
							console.log('В сессии нет данных, нашли из куки ' + currentLocationText);
							self.locationBaseText(currentLocationText);
							window.sessionStorage.setItem('nvxCurrentLocation', currentLocationText);
							self.isLocationSet(true);
						}
					}
				})
				.fail(function(jqXHR, textStatus, errorThrown) {
					if (jqXHR.status !== 0)
						console.error('Не удалось получить с сервера список локаций. Подробности: ' + errorThrown);
				});
		};

		return LocationSelectViewModel;
	});
define('Nvx.ReDoc.StateStructureServiceModule/StateStructure/Script/MfcListViewModel', ['jquery',
	'knockout',
	'require',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
	'Nvx.ReDoc.Rpgu.Core/Script/Tab',
	'Nvx.ReDoc.Rpgu.PortalModule/FilePage/Script/filePageModel',
	'Nvx.ReDoc.StateStructureServiceModule/StateStructure/Script/mfcUtils',
	'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/knockout/customBindingHandlers'],
function($, ko, require, modal, Tab, FilePageModel, mfcUtils) {
	var MfcListViewModel = function(redocPluginObject) {
		var self = this;

		//плагины, включенные в Редоке
		self.redocPluginObject = redocPluginObject;

		//показыать ли рейтинг МФЦ
		self.visibleMfcRating = false;//self.portalGeneralSettings.visibleMfcRating();

		//модель для записи в очередь
		self.registrationViewModel = ko.observable(null);

		self.stateStructureList = [];

		// Данные об МФЦ для карты
		self.mfcMapInfo = ko.observableArray([]);

		//Элемент интерфейса с картой
		self.map = ko.observable(null);

		//сдвигать карту по скролу окна браузера
		self.map.subscribe(function(value) {
			if (value) {
				var offset = $(value).offset();
				var topPadding = 15;
				$(window).scroll(function() {
					if ($(window).scrollTop() > offset.top) {
						//максимальная высота, за которую нельзя выходить
						var maxHeight = -1;
						$(value).parent().siblings().each(function() {
							if ($(this).height() > maxHeight)
								maxHeight = $(this).height();
						});

						//высота блока карты
						var blockHeight = $(value).height();
						//вычислить сдвиг
						var marginTop = $(window).scrollTop() - offset.top + topPadding;

						//если блок карты ваходит за пределы родителя, то уменьшить сдвиг
						// 5 - это margin-bottom у элементов списка МФЦ
						var diff = (marginTop + blockHeight) - maxHeight + 5;
						if (diff > 0) {
							marginTop = marginTop - diff;
						}

						$(value).stop().animate({ marginTop: marginTop }, 'slow');
					} else {
						$(value).stop().animate({ marginTop: 0 }, 'slow');
					}
					;
				});
			}
		});

		//рейтинг МФЦ
		self.ratingModel = ko.observable(null);

		//показвать ли дополнительные офисы
		self.visibleTosp = ko.observable(false);

		self.visibleTosp.subscribe(function(value) {
			self.createMapsPlacemarks();
		});

		//создать вкладки
		self.createTabs();
	};

	/**
	* Создать вкладки
	* @returns {} 
	*/
	MfcListViewModel.prototype.createTabs = function() {
		var self = this;
		self.tabs = {};
		self.tabs.unactiveTabs = function() {
			//Убираем активность у всех вкладок.
			for (var index in self.tabs) {
				if (typeof(self.tabs[index]) === 'object') {
					self.tabs[index].active(false);
				}
			}

		};

		//var basePath = "/portal/mfc/";
		var basePath = window.location.pathname;

		self.tabs.info = new Tab('Контактная информация');
		self.tabs.info.onclick = function () {
			self.setActiveTab(null);
		};
		self.tabs.info.activate = function() {
			//Убираем активность у всех вкладок.
			self.tabs.unactiveTabs();
			//Выставляем активность вкладке по которой кликнули.
			self.tabs.info.active(true);
			return self.showInfo();
		};

		if (self.visibleMfcRating) {
			self.tabs.rating = new Tab('Рейтинг');
			self.tabs.rating.onclick = function () {
				self.setActiveTab('rating');
			};
			self.tabs.rating.activate = function() {
				//Убираем активность у всех вкладок.
				self.tabs.unactiveTabs();
				//Выставляем активность вкладке по которой кликнули.
				self.tabs.rating.active(true);
				return self.showRating();
			};
		}
	};

	MfcListViewModel.prototype.getLink = function(model) {
		return (window.nvxCommonPath != null ? window.nvxCommonPath.mfcView : '/mfc/index.php?mfcId=') + model.id;
	};

	MfcListViewModel.prototype.formatMfcMapInfo = function(model) {

		function getText(value) {
			return value ? value : '';
		}

		function isNotEmpty(value) {
			return value && value.length > 0;
		}

		function getTextBlock(val, title) {
			var result = '';

			if (isNotEmpty(val)) {
				result += '<div>';
				if (isNotEmpty(title)) {
					result += title + ': ';
				}
				result += getText(val) + '</div>';
			}

			return result;
		}

		var info = '<div class="mfc-map">' +
			getTextBlock(model.name)
			//+ getTextBlock(model.address, 'Адрес');
			//+ getTextBlock(model.workTime, 'График работы') +
			//+ getTextBlock(model.phone, 'Телефон') +
			//+ getTextBlock(model.email, 'Email') +
			//+ getTextBlock(model.webSite, 'Сайт') +
			//+ getTextBlock(model.headName, 'Руководитель')
			;
		if (isNotEmpty(model.link)) {
			info += '<div><a href="' + model.link + '">Подробнее</a></div>';
		}
		info += '</div>';
		return info;
	};

	MfcListViewModel.prototype.getMfcList = function() {
		var self = this;

		//Показать тробер
		var trobberId = modal.CreateTrobberDiv2();

		var promise = $.ajax({ url: '/Nvx.ReDoc.StateStructureServiceModule/StateStructureController/GetMfcExtendedList', method: 'GET' })
			.done(function(response) {
				if (response.hasError) {
					modal.errorModalWindow(response.errorMessage);
				} else {
					self.applyResponse(response.result);
				}
				;
			})
			.fail(function(jqXHR, textStatus, errorThrown) {
				if (jqXHR.responseJSON) {
					modal.errorModalWindow(jqXHR.responseJSON.errorMessage);
				} else {
					modal.errorModalWindow(jqXHR.responseText);
				}
				;
			})
			.always(function() {
				//Скрываем тробер
				modal.CloseTrobberDiv2(trobberId);
			});

		return promise;
	};

	//добавить элементу функции, нужные для работы с картой
	MfcListViewModel.prototype.setOpenBallonFunction = function(item, mapInfo) {
		//функия открытия описания метки
		item.openBalloon = function(obj, evn) {
			if (mapInfo.placemark != undefined && mapInfo.placemark != null) {
				try {
					mapInfo.placemark.balloon.open();
				} catch(e) {
					console.error(e);
				}
			}
		};

		//функия открытия описания метки
		item.clickBlock = function(obj, evn) {
			if (typeof mapInfo.setSelectedPoint === 'function') {
				try {
					mapInfo.setSelectedPoint();
				} catch(e) {
					console.error(e);
				}
			}
		};
	};

	//добавить элементу функции для скролинга карты
	MfcListViewModel.prototype.setMapScrollingFunction = function(item) {
		//скролинг к элементу списка по клику на метку
		item.scrollTo = function() {
			var topPadding = 15;
			if (item.element()) {
				$(item.element()).siblings().removeClass('current');
				$(item.element()).addClass('current');

				var offset = $(item.element()).offset();
				var scrollTop = $(window).scrollTop();
				var winHeight = $(window).height() - 100;

				//скролить к элементу только, если он выходит за приделы окна браузера
				if (offset.top < scrollTop || offset.top > (scrollTop + winHeight)) {
					$('html,body').animate({ scrollTop: offset.top - topPadding }, 'slow');
				}
			}
		};
	};

	//создать на карте нужные метки (МФЦ и доп.офисы)
	MfcListViewModel.prototype.createMapsPlacemarks = function() {
		var self = this;
		var mfcMapInfo = [];

		self.stateStructureList.forEach(function(item) {
			//если есть координаты, то создать метку и добавить ее на карту
			if (item.locationCoord && item.locationCoord.length === 2) {
				var tospMapInfoList = [];

				if (self.visibleTosp() && Array.isArray(item.tospList)) {
					item.tospList.forEach(function(tospItem) {
						if (tospItem.locationCoord && tospItem.locationCoord.length === 2) {

							self.setMapScrollingFunction(tospItem);
							var mapInfo = {
								coords: tospItem.locationCoord,
								title: '', //item.name,
								hint: tospItem.name,
								text: self.formatMfcMapInfo(tospItem),
								scrollTo: tospItem.scrollTo
							};

							self.setOpenBallonFunction(tospItem, mapInfo);
							tospMapInfoList.push(mapInfo);
						}
					});
				}

				self.setMapScrollingFunction(item);
				var mapInfo = {
					coords: item.locationCoord,
					title: '',//item.name,
					hint: item.name,
					text: self.formatMfcMapInfo(item),
					scrollTo: item.scrollTo,
					childrens: tospMapInfoList
				};
				mfcMapInfo.push(mapInfo);

				self.setOpenBallonFunction(item, mapInfo);
			}
		});

		self.mfcMapInfo(mfcMapInfo);
	};

	//применить ответ сервера. В функцию передается массив с МФЦ
	MfcListViewModel.prototype.applyResponse = function(responseResult) {
		var self = this;

		self.stateStructureList = [];
		responseResult.forEach(function(item, i) {
			if (item.link === undefined) {
				item.link = self.getLink(item);
			}
			item.golink = function () {
				window.location = this.link;
			};

			//ссылка на страницу с доп.офиса
			if (Array.isArray(item.tospList)) {
				item.tospList.forEach(function (tospItem) {
					if (window.nvxCommonPath != null && window.nvxCommonPath.mfcTospView != null) {
						tospItem.link = window.nvxCommonPath.mfcTospView + tospItem.id;
					} else {
						tospItem.link = "/portal/mfc/tosp/" + tospItem.id;
					}
					//элемент интерфейса в списке МФЦ
					tospItem.element = ko.observable();
				});
			} else {
				item.tospList = [];
			}

			//поправить ссылку на сайт МФЦ
			item.webSite = mfcUtils.prototype.getWebLink(item.webSite);

			//элемент интерфейса в списке МФЦ
			item.element = ko.observable();

			self.stateStructureList.push(item);
		});

		self.createMapsPlacemarks();
	};

	/**
	* Показать список МФЦ
	* @returns {} 
*/
	MfcListViewModel.prototype.showInfo = function() {
		var self = this;
		return self.getMfcList();
	};

	/**
* Загрузить рейтинг МФЦ
* @returns {} 
*/
	MfcListViewModel.prototype.getMfcRating = function() {
		var self = this;
		//Создаем вью-модель для контента страницы портала.
		var filePageModel = new FilePageModel();
		return filePageModel.loadPage('/Nvx.ReDoc.Rpgu.PortalModule/FilePageController/MfcRatingReport')
			.done(function() {
				self.ratingModel(filePageModel);
			});
	};

	/**
* Показать рейтинг МФЦ
* @returns {} 
*/
	MfcListViewModel.prototype.showRating = function() {
		var self = this;
		return self.getMfcRating();
	};

	MfcListViewModel.prototype.setActiveTab = function(selectTab) {
		var self = this;

		selectTab = selectTab || '';
		selectTab = selectTab.toLowerCase();

		switch (selectTab) {
		case 'rating':
			if (self.tabs.rating) {
				return self.tabs.rating.activate();
			}
			break;
		case 'queue':
			if (self.tabs.queue) {
				return self.tabs.queue.activate();
			}
			break;
		default:
			return self.tabs.info.activate();
		}

		return null;
	};

	return MfcListViewModel;
});
define('Nvx/PopularServiceViewModel',
	[
		'knockout',
		'Nvx.ReDoc.Rpgu.PortalModule/Portal/Script/MainPage/listBlockViewModel',
		'Nvx.ReDoc.Rpgu.PortalModule/Portal/Script/MainPage/listBlockItemModel',
		'Nvx/Script/serviceUtils'
	],
	function(ko, ListBlockViewModel, ListBlockItemModel, ServiceUtils) {
		var PopularServiceViewModel = function() {
			var self = this;

			self.popularServicesBlock = ko.observable(new ListBlockViewModel('Популярные услуги', 'Все популярные услуги', '/'));

			self.serviceUtils = new ServiceUtils();

			self.itemInBlockMaxCount = 9;

			var filterKey = 'all';
			if (window.sessionStorage && window.sessionStorage.getItem('nvxUserType') != null) {
				filterKey = window.sessionStorage.getItem('nvxUserType');
			}

			self.onlyOnline = ko.observable(window.sessionStorage && window.sessionStorage.getItem('nvxOnlyOnline') === 'true');

			self.popularParam = {
				sortBy: 'FullName',
				sortOrder: 'ASC',
				groupBy: 'Popular',
				filterBy: filterKey,
				onlyOnline: self.onlyOnline()
			};
		};

		//Показать весь контент
		PopularServiceViewModel.prototype.start = function() {
			var self = this;
			self.showPopularServicesBlock();
		};

		//Показать блок с популярными услугами
		PopularServiceViewModel.prototype.showPopularServicesBlock = function() {
			var self = this;

			self.popularServicesBlock().items([]);
			//получить список популярных услуг, ограниченный настройками портала
			self.serviceUtils.loadPopularServices(true, self.onlyOnline()).done(function (list) {
				for (var i = 0; i < list.length && i < self.itemInBlockMaxCount; i++) {
					var item = list[i];
					var urlService = (window.nvxCommonPath != null ? window.nvxCommonPath.serviceView : '/searchservice/index.php') + item.idRef;
					self.popularServicesBlock().items.push(new ListBlockItemModel(item.title, urlService, item.idRef));
				}
			});
		};

		PopularServiceViewModel.prototype.getUrlCategory = function(gotoCategoryId) {
			var self = this;
			return self.getUrl(self.categoryParam, gotoCategoryId);
		};

		PopularServiceViewModel.prototype.getUrl = function(params, gotoGroupId) {
			var filterParam = JSON.stringify(params);
			var url = this.url + '?params=' + encodeURIComponent(filterParam);
			if (gotoGroupId && gotoGroupId != '') {
				url += '&gotoGroupId=' + encodeURIComponent(gotoGroupId);
			}
			return url;
		};

		return PopularServiceViewModel;
	});
define('Nvx/RequestInfoViewModel', [
		'require',
		'jquery',
		'knockout',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'Nvx.ReDoc.Rpgu.Core/Script/Tab',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Api/dateFormater',
		//'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Helpers/signAttachmentHelperBase',
		'jqueryExtention',
		'javascriptExtention'],
	function (require, $, ko, modal, Tab, dateFormater) {
		var RequestInfoViewModel = function (id) {
			var self = this;

			/*Идентификатор дела*/
			self.fileId = id;

			/*Модель для истории изменений*/
			self.requestChangesModel = ko.observable(null);

			/*Модель для вложений*/
			self.requestAttachmentsModel = ko.observable(null);

			/*Номер заявки*/
			self.requestNumber = ko.observable('');

			self.requestNumberTitle = ko.observable('');

			/*Услуга*/
			self.serviceId = '';
			self.serviceName = ko.observable('');
			self.serviceLink = ko.observable('');

			/*Идентификатор паспорта услуги*/
			self.servicePassportId = '';

			/*Идентификатор цели РГУ*/
			self.targetId = '';

			/*Код статуса*/
			self.statusCode = 0;

			/*Дело заархивировано*/
			self.isArchived = false;

			/* Комментарий к результату выполнения задачи*/
			self.resultComment = ko.observable('');

			/*Дата выполнения задачи*/
			self.resultDate = ko.observable('');

			/*Описание статуса*/
			self.statusText = ko.observable('');

			/*Ведомство*/
			self.departmentId = '';
			self.departmentName = ko.observable('');
			self.departmentLink = ko.observable('');

			/*Дата создания*/
			self.createDate = ko.observable('');

			/*Дата последнего обновления*/
			self.lastUpdateDate = ko.observable('');

			/**			 * Заявка имеет спец тип - обращение, жалоба			 */
			self.specType = ko.observable('');

			self.specType.subscribe(function (value) {
				self.updateTitlesBySpecType();
			});
			
			/*Заявка является обращением*/
			self.isAppeal = ko.observable();

			self.isAppeal.subscribe(function (value) {
				if (value) {
					self.requestNumberTitle('Идентификатор обращения:');
				} else {
					self.requestNumberTitle('Идентификатор заявления:');
				}
			});

			/*функционал по оценке обращений*/
			self.canRateAppeal = ko.observable(false);

			self.rateAppeal = function () {
				console.log('todo rate appeal?');
			};

			self.formPreviewTemplateId = ko.observable('');
			self.formPreviewModel = ko.observable(null);

			self.tabs = {};
			self.tabs.result = new Tab('Результаты');
			self.tabs.result.onclick = function () {
				//Убираем активность у всех вкладок.
				for (var index in self.tabs) {
					self.tabs[index].active(false);
				}
				//Выставляем активность вкладке по которой кликнули.
				self.tabs.result.active(true);
				self.showResult();
			};

			self.tabs.changes = new Tab("История");
			self.tabs.changes.template = ko.observable('Nvx.ReDoc.Rpgu.PortalModule/Cabinet/View/request/requestInfoChanges.tmpl.html');
			self.tabs.changes.onclick = function () {
				//Убираем активность у всех вкладок.
				for (var index in self.tabs) {
					self.tabs[index].active(false);
				}
				//Выставляем активность вкладке по которой кликнули.
				self.tabs.changes.active(true);
				var isComplaint = self.isComplaint();
				if (isComplaint)
					self.tabs.changes.template('Nvx.ReDoc.Rpgu.PortalModule/Cabinet/View/complaint/complaintHistoryView.tmpl.html');
				self.showChangeHistory(isComplaint);
			};

			self.tabs.formPreview = new Tab('Заявление');
			self.tabs.formPreview.onclick = function () {
				//Убираем активность у всех вкладок.
				for (var index in self.tabs) {
					self.tabs[index].active(false);
				}
				//Выставляем активность вкладке по которой кликнули.
				self.tabs.formPreview.active(true);
				self.showFormPreview();
			};

			//неявное выполнение действия в конструкторе, не делаем так
			//активная вкладка по-умолчанию
			//self.tabs.formPreview.onclick();

			self.activateFormPreviewTab = function () {
				//активная вкладка по-умолчанию
				self.tabs.formPreview.onclick();
			};

			self.tabs.attachments = new Tab('Файлы');
			self.tabs.attachments.onclick = function () {
				//Убираем активность у всех вкладок.
				for (var index in self.tabs) {
					self.tabs[index].active(false);
				}
				//Выставляем активность вкладке по которой кликнули.
				self.tabs.attachments.active(true);
				self.showAttachments();
			};
		};

		RequestInfoViewModel.prototype.start = function () {
			var self = this;
			self.fileId = window.getUrlVarsFunction()['fileId'];
			self.getRequestInfo()
				.done(function () {
					self.activateFormPreviewTab();
				});
		};

		/**
		 * Применить ответ сервера к моделе
		 * @param {} responseObj объект, который вернул сервер
		 */
		RequestInfoViewModel.prototype.applyResponse = function (responseObj) {
			var self = this;

			self.requestNumber(responseObj.requestNumber);

			self.servicePassportId = responseObj.servicePassportId;
			self.targetId = responseObj.targetId;

			self.serviceId = responseObj.serviceId;
			self.serviceName(responseObj.serviceName);

			//сформировать ссылку для услуги
			if (self.servicePassportId && self.servicePassportId != '') {
				var link = (window.nvxCommonPath != null ? window.nvxCommonPath.serviceView : '/portal/service/') + self.servicePassportId;
				self.serviceLink(link);
			} else {
				self.serviceLink('');
			}

			self.isArchived = responseObj.isArchived;

			self.statusCode = responseObj.statusCode;
			self.statusText(responseObj.statusText);

			self.departmentId = responseObj.departmentId;
			self.departmentName(responseObj.departmentName);
			self.departmentLink((window.nvxCommonPath != null ? window.nvxCommonPath.departmentView : '/portal/stateStructure/') + self.departmentId);

			self.createDate(responseObj.createDate);
			self.lastUpdateDate(responseObj.lastUpdateDate);

			self.resultComment(responseObj.resultComment);
			self.resultDate(responseObj.resultDate);

			self.specType(responseObj.specType);
			
			self.isAppeal(responseObj.isAppeal);

			self.canRateAppeal(false);
		};

		/**		 * Получить информацию о заявке		 */
		RequestInfoViewModel.prototype.getRequestInfo = function () {
			var self = this;

			//Показать тробер
			var trobberId = modal.CreateTrobberDiv2();
			var promise = $.ajax({ url: '/Nvx.ReDoc.Rpgu.PortalModule/RequestController/GetRequestInfo/' + self.fileId, method: 'GET', headers: { proxy: true } })
				.done(function (response) {
					if (response.hasError === true) {
						modal.errorModalWindow(response.errorMessage);
					} else {
						console.log('request info ok');
						self.applyResponse(response.result);
					}
				})
				.fail(function (jqXHR, textStatus, errorThrown) {
					if (jqXHR.responseJSON) {
						modal.errorModalWindow(jqXHR.responseJSON.errorMessage);
					} else {
						modal.errorModalWindow(jqXHR.responseText);
					}
				})
				.always(function () {
					//Скрываем тробер
					modal.CloseTrobberDiv2(trobberId);
				});

			return promise;
		};

		RequestInfoViewModel.prototype.showFormPreview = function () {
			var self = this;
			var frontModuleId = 'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/dynamicFormFormModule';

			var url = '/Nvx.ReDoc.WebInterfaceModule/Controller/FileController/FileFormsJson?fileId=' + self.fileId + '&nocache=' + new Date().getTime();
			//показать тробер
			var trobberId = modal.CreateTrobberDiv2();
			var formInfo = null;
			var promiseFileFoms = $.ajax({ url: url, headers: { proxy: true }, method: 'GET' })
				.done(function (response) {
					var formArray = response.components;
					formInfo = ko.utils.arrayFirst(formArray, function (item) {
						return item.frontModuleId === frontModuleId;
					});
				})
				.fail(function (jqXHR, textStatus, errorThrown) {
					if (jqXHR.responseJSON) {
						modal.errorModalWindow(jqXHR.responseJSON.errorMessage);
					} else {
						modal.errorModalWindow(jqXHR.responseText);
					}
				}).then(
					function () {
						if (formInfo != null) {
							//Добавляем идентификато дела.
							formInfo.fileId = self.fileId;

							//Запуск формы.
							require([frontModuleId], function (module) {
								var dynamicFormViewModel = module.templateViewModel;
								var dynamicFormTemplateId = module.templateId;

								var componentId = formInfo.componentId;

								self.formPreviewTemplateId('placeholderTemplate');
								self.formPreviewModel(dynamicFormViewModel);
								self.formPreviewTemplateId(dynamicFormTemplateId);

								var modelData = {
									fromPortal: true,
									fileId: self.fileId,
									componentId: componentId
								};
								//Запрашиваем модель данных для представления данных динамической формы в правой части дела.
								$.ajax({ url: '/DynamicForm/MainForm', data: modelData, method: 'POST', headers: { proxy: true } })
									.done(function (response) {
										//Заполняем вью-модель данными.
										self.formPreviewModel().applyData(response);

										//убрать "Сведения о задаче", на портале они не нужны
										var relatedItemsViewModel = self.formPreviewModel().relatedItemsViewModel();
										if (relatedItemsViewModel && relatedItemsViewModel.showTasks) {
											relatedItemsViewModel.showTasks(false);
										}

										if (self.formPreviewModel().readOnly() === true) {
											//Если форма не валидна, то выбрасываем сообщение.
											if (self.formPreviewModel().notValid) {
												modal.errorModalWindow("Неверно заполнены поля формы.");
											} else {
												//Запускаем логику формы!!!
												self.formPreviewModel().start(modelData.fileId, modelData.componentId, modelData.fromPortal);
											}
										}
									});

								// Скрываем родные кнопки шага
								$('#transition-buttons').hide();
							});
						}
					}
				)
				.always(function () {
					//Скрываем тробер
					modal.CloseTrobberDiv2(trobberId);
				});

			return promiseFileFoms;
		};

		RequestInfoViewModel.prototype.showResult = function () {
			var self = this;
			//Показать тробер
			var trobberId = modal.CreateTrobberDiv2();

			var cleanRequestResult = function () {
				self.resultComment(null);
				self.resultDate(null);
			};

			var promise = $.ajax({ url: '/Nvx.ReDoc.Rpgu.PortalModule/RequestController/GetRequestStatus/' + self.fileId, headers: { proxy: true }, method: 'GET' })
				.done(function (response) {
					if (response.hasError === true) {
						modal.errorModalWindow(response.errorMessage);
						cleanRequestResult();
					} else {
						self.resultComment(response.result.resultComment);
						self.resultDate(response.result.resultDate);
					}
				})
				.fail(function (jqXHR, textStatus, errorThrown) {
					if (jqXHR.responseJSON) {
						modal.errorModalWindow(jqXHR.responseJSON.errorMessage);
					} else {
						modal.errorModalWindow(jqXHR.responseText);
					}
					cleanRequestResult();
				})
				.always(function () {
					//Скрываем тробер
					modal.CloseTrobberDiv2(trobberId);
				});

			return promise;
		};

		RequestInfoViewModel.prototype.showChangeHistory = function (isComplaintHistory) {
			var self = this;
			self.requestChangesModel(null);
			var url = isComplaintHistory === true ? '/Rpgu/Complaint/History' : '/WebInterfaceModule/File/ChangesJson';

			//Показать тробер
			var trobberId = modal.CreateTrobberDiv2();

			var model = {
				fileId: self.fileId,
				skip: 0,
				take: 50,
				rpguFilter: true
			};
			url += '?' + $.param(model);
			var promise = $.ajax({ url: url, headers: { proxy: true }, method: 'GET' })
				.done(function (response) {
					if (response.hasError === true) {
						modal.errorModalWindow(response.errorMessage);
					} else {
						var changes = [];
						response.components.forEach(function (component, i) {
							component.dateStr = dateFormater.toFullDateString(component.date);
							changes.push(component);
						});
						//модель вложений
						self.requestChangesModel(changes);
					}
				})
				.fail(function (jqXHR, textStatus, errorThrown) {
					if (jqXHR.responseJSON) {
						modal.errorModalWindow(jqXHR.responseJSON.errorMessage);
					} else {
						modal.errorModalWindow(jqXHR.responseText);
					}
				})
				.always(function () {
					//Скрываем тробер
					modal.CloseTrobberDiv2(trobberId);
				});

			return promise;
		};

		RequestInfoViewModel.prototype.showAttachments = function () {
			var self = this;
			self.requestAttachmentsModel(null);

			//Показать тробер
			var trobberId = modal.CreateTrobberDiv2();

			var model = { fileId: self.fileId };
			var promise = $.ajax({ url: '/Nvx.ReDoc.WebInterfaceModule/Controller/FileController/FileAttachmentsJson/', data: model, headers: { proxy: true }, method: 'POST' })
				.done(function (response) {
					if (response.hasError === true) {
						modal.errorModalWindow(response.errorMessage);
					} else {
						//модель вложений
						var components = [];
						var prefixUrl = window.nvxCommonPath.fileProxyPath;
						response.components.forEach(function (item, i) {
							item.downloadLink = prefixUrl + '?fileId={0}&attachmentId={1}&path={2}'.format(self.fileId, item.elementId, window.nvxCommonPath.authPortalPath + '/WebInterfaceModule/DownloadAttachment');
							item.linkTitle = item.elementTitle + ' (' + item.elementId + ')';
							components.push(item);
						});
						self.requestAttachmentsModel(components);
					}
				})
				.fail(function (jqXHR, textStatus, errorThrown) {
					if (jqXHR.responseJSON) {
						modal.errorModalWindow(jqXHR.responseJSON.errorMessage);
					} else {
						modal.errorModalWindow(jqXHR.responseText);
					}
				})
				.always(function () {
					//Скрываем тробер
					modal.CloseTrobberDiv2(trobberId);
				});

			return promise;
		};

		RequestInfoViewModel.prototype.updateTitlesBySpecType = function () {
			var self = this;
			if (self.isAppeal()) {
				self.requestNumberTitle('Идентификатор обращения:');
				
				self.tabs.formPreview.title('Обращение');
				
			} else if (self.isComplaint()) {
				self.requestNumberTitle('Идентификатор заявки:');
				
				self.tabs.formPreview.title('Жалоба');
				
			}
		};
		
		RequestInfoViewModel.prototype.isComplaint = function () {
			var self = this;
			return self.specType() == "complaint";
		};

		return RequestInfoViewModel;
	});
define('Nvx/RequestViewModel', [
		'require',
		'jquery',
		'knockout',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'Nvx/RequestInfoViewModel',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Helpers/signAttachmentHelperBase',
		'jqueryExtention',
		'jquery.form',
		'jquery.cookie'
	], function(require, $, ko, modal, RequestInfoViewModel) {
		var RequestViewModel = function() {
			var self = this;
			/*Идентификатор внутреннего представления.*/
			self.templateId = ko.observable('placeholderTemplate');
			/*Вью-модель для внутреннего представления.*/
			self.templateViewModel = ko.observable(null);
			/*Заголовок (заполнение формы или прикладывание документов).*/
			self.formName = ko.observable('');
			/*Ссылка для перехода к предыдущему шагу.*/
			self.backUrl = ko.observable('#');
			/*Текст ссылки для перехода к предыдущему шагу.*/
			self.backText = ko.observable('');
			/*Ссылка для перехода к следующему шагу.*/
			self.nextUrl = ko.observable('#');
			/*Текст ссылки для перехода к следующему шагу.*/
			self.nextText = ko.observable('');
			/*Действие до перехода к следующему шагу.*/
			self.nextAction = function() {
			};

			/*Массив описателей форм.*/
			self.formArray = [];
			/*Идентификатор дела.*/
			self.fileId = '';

			/**		* Модель с информацией о заявке		*/
			self.requestInfoViewModel = ko.observable(null);

			/*Показывать кнопку "отказаться"*/
			self.visibleRemoveDraftButton = ko.observable(true);

			/*Заголовок кнопки "отказаться"*/
			self.removeDraftTitle = ko.observable('');

			/*Заголовок страницы*/
			self.pageTitle = ko.observable('');

			self.useNextButton = ko.observable(true);

			self.urlAfterRemoveDraft = "/cabinet/";

			self.canShowNext = function() {
				var frontModuleId = 'Nvx.ReDoc.Workflow.UploadDocsForm/Web/Resources/Scripts/UploadDocsFormModule';
				var formInfo = ko.utils.arrayFirst(self.formArray, function(item) {
					return item.frontModuleId === frontModuleId;
				});
				var statusCode = self.requestInfoViewModel().statusCode;
				if (statusCode == 10 && formInfo == null) {
					self.useNextButton(false);
				}
			};

			self.visibleEditButton = ko.observable(false);

			self.editButtonClick = function() {
			};
		};

		RequestViewModel.prototype.start = function(type) {
			var self = this;
			var id = window.getUrlVarsFunction()['fileId'];
			var anonUser = !!$.cookie('visit');

			self.getFormInfo(id)
				.done(function() {
					if (type != null && self.requestInfoViewModel().statusCode > 1) {
						//переходим к информации о заявке, если она уже не черновик
						window.location = (window.nvxCommonPath != null ? window.nvxCommonPath.infoView : '/cabinet/request/index.php?fileId=') + id;
					} else {
						if (type === 'attachment')
							self.getAttachmentData();
						else if (type === 'form')
							self.getFormData(anonUser);
						else {
							if (anonUser) {
								self.anonInformationPage();
							} else {
								self.userInformationPage();
							}

						}
					}
				});
		};

		RequestViewModel.prototype.getFormInfo = function(id) {
			var self = this;
			self.fileId = id;
			var modelj = { fileId: id, nocache: new Date().getTime() };

			var url = '/Nvx.ReDoc.WebInterfaceModule/Controller/FileController/FileFormsJson?' + $.param(modelj);

			//показать тробер
			var trobberId = modal.CreateTrobberDiv2();
			var promiseFileFoms = $.ajax({ url: url, method: 'GET', headers: { proxy: true } })
				.done(function(response) {
					self.formArray = response.components;
				})
				.fail(function(jqXHR, textStatus, errorThrown) {
					if (jqXHR.responseJSON) {
						modal.errorModalWindow(jqXHR.responseJSON.errorMessage);
					} else {
						modal.errorModalWindow(jqXHR.responseText);
					}
				})
				.always(function() {
					//Скрываем тробер
					modal.CloseTrobberDiv2(trobberId);
				});

			//получить инфу о заявке
			self.requestInfoViewModel(new RequestInfoViewModel(id));
			var promiserRequestInfo = self.requestInfoViewModel().getRequestInfo();

			var deferred = $.Deferred();

			$.when(promiseFileFoms, promiserRequestInfo)
				.done(function() {

					if (self.requestInfoViewModel().isAppeal()) {
						self.pageTitle('Обращение');
						self.removeDraftTitle('Отказаться от обращения');
					} else {
						self.pageTitle('Заявление на услугу');
						self.removeDraftTitle('Отказаться от услуги');
					}

					deferred.resolve();
				})
				.fail(function() {
					deferred.reject();
				});

			return deferred.promise();
		};

		RequestViewModel.prototype.userInformationPage = function( ) {
			var self = this;
			self.nextUrl('/cabinet/');
			self.nextText('Перейти в личный кабинет');
			self.formName('Информация о заявлении');
			self.userInformation = getUserInformation(self.requestInfoViewModel().isAppeal(), self.requestInfoViewModel().requestNumber());
			self.templateId('placeholderTemplate');
			self.templateViewModel(self);
			self.visibleRemoveDraftButton(false);
			self.templateId('Nvx.ReDoc.Rpgu.PortalModule/Cabinet/View/request/requestUserInformationPage.tmpl.html');
			self.nextAction = function() {
				window.location = self.nextUrl();
			};
		};

		RequestViewModel.prototype.anonInformationPage = function() {
			var self = this;
			self.useNextButton(false);
			self.userInformation = getUserInformation(true, self.requestInfoViewModel().requestNumber());
			self.templateId('placeholderTemplate');
			self.templateViewModel(self);
			self.visibleRemoveDraftButton(false);
			self.templateId('Nvx.ReDoc.Rpgu.PortalModule/Cabinet/View/request/requestUserInformationPage.tmpl.html');
		};

		function getUserInformation(isAppeal, number) {
			if (isAppeal) {
				if (number) {
					return 'Ваше обращение "{0}" успешно отправлено.'.format(number);
				} else {
					return 'Ваше обращение успешно отправлено.';
				}
			}
			return 'Заявление по услуге успешно заполнено и находится в состоянии отправки. Более подробную информацию о ходе оказания можно получить в личном кабинете.';
		}

		RequestViewModel.prototype.getFormData = function(anonUser) {
			var self = this;

			var fileId = self.fileId;
			self.nextText('Далее');
			self.nextUrl((window.nvxCommonPath != null ? window.nvxCommonPath.attachmentView : '/cabinet/attachment/index.php?fileId=') + fileId);

			if (anonUser === true) {
				self.backText(null);
				self.backUrl(null);
				self.urlAfterRemoveDraft = "/";
			} else {
				self.backText('Список заявок');
				self.backUrl('/cabinet/');
			}

			var frontModuleId = 'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/dynamicFormFormModule';
			var formInfo = ko.utils.arrayFirst(self.formArray, function(item) {
				return item.frontModuleId === frontModuleId;
			});
			self.canShowNext();
			if (formInfo != null) {
				//Добавляем идентификато дела.
				formInfo.fileId = fileId;

				//Запуск формы.
				require([frontModuleId], function(module) {
					var dynamicFormViewModel = module.templateViewModel;
					var dynamicFormTemplateId = module.templateId;

					var componentId = formInfo.componentId;

					self.formName('Форма');
					self.templateId('placeholderTemplate');
					self.templateViewModel(dynamicFormViewModel);
					self.templateId(dynamicFormTemplateId);

					var model = {
						fromPortal: true,
						fileId: fileId,
						componentId: componentId
					};
					//Запрашиваем модель данных для представления данных динамической формы в правой части дела.
					$.ajax({ url: '/DynamicForm/MainForm', data: model, headers: { proxy: true }, method: 'POST' })
						.done(function(response) {
							//Заполняем вью-модель данными.
							self.templateViewModel().applyData(response);
							//убрать "Сведения о задаче", на портале они не нужны
							var relatedItemsViewModel = self.templateViewModel().relatedItemsViewModel();
							if (relatedItemsViewModel && relatedItemsViewModel.showTasks) {
								relatedItemsViewModel.showTasks(false);
							}

							//Если форма не валидна, то выбрасываем сообщение.
							if (self.templateViewModel().notValid) {
								modal.errorModalWindow("Неверно заполнены поля формы.");
							} else {
								//Запускаем логику формы!!!
								self.templateViewModel().start(fileId, componentId, true);
							}

							//если заявка в статусе "Черновик" и доступна только для чтения,
							//то показывать кнопку "Редактировать"
							if (self.requestInfoViewModel()
								&& self.requestInfoViewModel().statusCode === 1
								&& self.templateViewModel().readOnly() === true) {
								self.visibleEditButton(true);
							} else {
								self.visibleEditButton(false);
							}
						});

					// Скрываем родные кнопки шага
					$('#transition-buttons').hide();
				});
				//Кнопка сохранения формы.
				self.nextAction = function() {
					var readonly = self.templateViewModel().readOnly();
					//Если форма только для чтения, то переходим к форме прикладывания документов.
					if (readonly === true) {
						window.location = self.nextUrl();
					}
					//Если форма для редактирования, то сохраняем форму.
					if (readonly === false) {
						var currentHubId = self.templateViewModel().currentHubId;
						require([currentHubId], function(mainForm) {
							//Выбираем ту кнопку, которая сохраняет форму.
							var transitions = self.templateViewModel().transitions();
							var submitTransition = ko.utils.arrayFirst(transitions, function(transition) {
								return transition.actionName === 'Submit';
							});

							var okFunction = function() {
								window.location = self.nextUrl();
							};
							mainForm.goToTransition(submitTransition.actionName, submitTransition.to, formInfo, okFunction);
						});
					}
				};

				//Кнопка редактирования
				self.editButtonClick = function() {
					self.reopenTask(formInfo.componentId);
				};
			}
		};

		RequestViewModel.prototype.getAttachmentData = function() {
			var self = this;

			var fileId = self.fileId;
			self.nextUrl((window.nvxCommonPath != null ? window.nvxCommonPath.infoView : '/cabinet/information/index.php?fileId=') + fileId);
			self.nextText('Отправить заявление');

			self.backText('Назад');
			self.backUrl((window.nvxCommonPath != null ? window.nvxCommonPath.formView : '/cabinet/request/index.php?fileId=') + fileId);

			var statusCode = self.requestInfoViewModel().statusCode;
			if (statusCode == 10) {
				self.useNextButton(false);
			}

			self.visibleEditButton(false);

			/**
		 * Посчитать суммарный размер файлов
		 * @param {} files массив файлов
		 * @returns {} 
*/
			self.calcFilesSize = function(files) {
				var totalSize = 0;

				if (Array.isArray(files)) {
					for (var i = 0; i < files.length; i++) {
						var fileInfos = files[i].infos();
						if (Array.isArray(fileInfos)) {
							fileInfos.forEach(function(info) {
								if (info.file) {
									totalSize += info.file.size;
								}
							});
						}
					}
				}

				return totalSize;
			};

			self.nextAction = function() {
				//Выбираем ту кнопку, которая сохраняет вложения.
				var model = self.templateViewModel();
				var transitions = model.transitions();
				var submitTransition = ko.utils.arrayFirst(transitions, function(transition) {
					return transition.actionName === 'Submit';
				});

				//если установлено ограничение на размер файлов, то проверить его
				var maxSize = 15; //self.portalGeneralSettingsModel.maxSizeUploadFiles();
				if (maxSize > 0) {
					//подсчитать размер выбранных файлов
					var files = model.contentViewModel().items();
					var otherFiles = model.contentViewModel().otherItems();
					var totalSize = self.calcFilesSize(files) + self.calcFilesSize(otherFiles);

					if (totalSize > maxSize * 1024 * 1024) {
						modal.errorModalWindow('Размер загружаемых файлов не должен превышать {0} МБ'.format(maxSize));
						return;
					}
				}

				//сохраняем вложения
				var promise = model.goToTransition(submitTransition.actionName);
				promise.done(function() {
					self.requestToSend().always(function() {
						//Переходим по указанному маршруту.
						window.location = self.nextUrl();
					});
				});
			};

			var frontModuleId = 'Nvx.ReDoc.Workflow.UploadDocsForm/Web/Resources/Scripts/UploadDocsFormModule';
			var formInfo = ko.utils.arrayFirst(self.formArray, function(item) {
				return item.frontModuleId === frontModuleId;
			});

			if (formInfo != null) {
				require([frontModuleId], function(module) {
					var attachmentViewModel = module.templateViewModel;
					var attachmentTemplateId = module.templateId;

					//убрать лишние поля с формы
					attachmentViewModel.rpguPortalEnabled(true);

					self.formName('Вложения');
					self.templateId('placeholderTemplate');
					self.templateViewModel(attachmentViewModel);
					self.templateId(attachmentTemplateId);

					//attachmentViewModel.showTasks = false;
					//attachmentViewModel.fileId = self.fileId;

					//Запрашиваем модель данных для представления общей информации о деле в правой части дела.
					$.ajax({ url: formInfo.link, method: 'GET', headers: { proxy: true }})
						.done(function(response) {
							//Заполняем вью-модель.
							self.templateViewModel().applyData(response);
							//self.templateViewModel().fileId = self.fileId;
							//self.templateViewModel().relatedItemsViewModel().showTasks(false);
						}).fail(function(jqXHR, textStatus, errorThrown) {
							if (jqXHR.responseJSON) {
								modal.errorModalWindow(jqXHR.responseJSON.errorMessage);
							} else {
								modal.errorModalWindow(jqXHR.responseText);
							}
						});

					// Скрываем родные кнопки шага
					$('#transition-buttons').hide();
				});
			} else {
				self.requestToSend().always(function() {
					//Переходим по указанному маршруту.
					window.location = self.nextUrl();
				});
			}
		};

		//Клик по кнопке "Отказаться от услуги" для черновика
		RequestViewModel.prototype.removeDraftClick = function() {
			var self = this;
			var id = "remove-draft-confirm";

			var close = function() {
				modal.CloseModalDialog(id, true);
			};

			modal.CreateQuestionModalWindow(id, 'Вы действительно хотите отказаться от оказании услуги?', "Да", "Нет", 'Отказаться от услуги', function() {
				self.removeDraft(id);
				close();
			}, close);

		};

		//Удалить черновик
		RequestViewModel.prototype.removeDraft = function() {
			var self = this;

			var model = { id: self.fileId };

			//показать тробер
			var trobberId = modal.CreateTrobberDiv2();

			$.ajax({ url: '/Nvx.ReDoc.Rpgu.PortalModule/RequestController/RemoveDraft', data: model, headers: { proxy: true }, method: 'POST' })
				.done(function(response) {
					if (response.hasError) {
						modal.errorModalWindow(response.errorMessage);
					} else {
						//если удалил черновик, то возвращаемся к списку заявок
						window.location = self.urlAfterRemoveDraft;
					}
				})
				.fail(function(jqXHR, textStatus, errorThrown) {
					if (jqXHR.responseJSON) {
						modal.errorModalWindow(jqXHR.responseJSON.errorMessage);
					} else {
						modal.errorModalWindow(jqXHR.responseText);
					}
				})
				.always(function() {
					//Скрываем тробер
					modal.CloseTrobberDiv2(trobberId);
				});
		};

		//Поставить заявке статус "Отправка"
		RequestViewModel.prototype.requestToSend = function() {
			var self = this;

			var model = { id: self.fileId };

			//показать тробер
			var trobberId = modal.CreateTrobberDiv2();

			var promise = $.ajax({ url: '/Nvx.ReDoc.Rpgu.PortalModule/RequestController/RequestToSend', data: model, method: 'POST', headers: { proxy: true } })
				.always(function() {
					//Скрываем тробер
					modal.CloseTrobberDiv2(trobberId);
				});

			return promise;
		};

		//переоткрыть задачу
		RequestViewModel.prototype.reopenTask = function(componentId) {
			var self = this;

			var model = { fileId: self.fileId, componentId: componentId };

			//показать тробер
			var trobberId = modal.CreateTrobberDiv2();

			$.ajax({ url: '/DynamicForm/ReopenTask', data: model, method: 'POST', headers: { proxy: true } })
				.done(function(response) {
					if (response.hasError) {
						modal.errorModalWindow(response.errorMessage);
					} else {
						//если удалось переоткрыть задачу, то перезагрузить страницу
						window.location.reload(true);
					}
				})
				.fail(function(jqXHR, textStatus, errorThrown) {
					if (jqXHR.responseJSON) {
						modal.errorModalWindow(jqXHR.responseJSON.errorMessage);
					} else {
						modal.errorModalWindow(jqXHR.responseText);
					}
				})
				.always(function() {
					//Скрываем тробер
					modal.CloseTrobberDiv2(trobberId);
				});
		};

		return RequestViewModel;
	});
define('Nvx/SearchPanelViewModel', ['knockout'],
	function(ko) {
		var SearchPanelViewModel = function() {
			var self = this;

			self.searchText = ko.observable();

			self.onlyOnline = ko.observable(self.getOnlineFlag());

			self.onlyOnline.subscribe(function(newValue) {
				if (window.sessionStorage) {
					window.sessionStorage['nvxOnlyOnline'] = newValue;
					window.location.reload();
				}
			});

			self.goSearch = function() {
				var params = {
					adminLevel: 1,
					sortBy: 'FullName',
					sortOrder: 'ASC',
					groupBy: '',
					filterBy: 'all',
					onlyOnline: self.onlyOnline(),
					searchText: self.searchText()
				};
				var filterParam = JSON.stringify(params);
				window.location = (window.nvxCommonPath != null ? window.nvxCommonPath.searchView : '/searchservice/index.php') + '?params=' + encodeURIComponent(filterParam);
			};

			self.goPreSearch = function() {
				if (this != null) {
					self.searchText(this.toString());
					self.goSearch();
				}
			};
		};

		SearchPanelViewModel.prototype.start = function() {
		};

		SearchPanelViewModel.prototype.getOnlineFlag = function() {
			return window.sessionStorage && window.sessionStorage.getItem('nvxOnlyOnline') === 'true';
		};

		return SearchPanelViewModel;
	});
define('Nvx/SearchServicesViewModel',
	['knockout', 'jquery',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/DefaultController/serviceMenuItem',
	'Nvx.ReDoc.StateStructureServiceModule/Service/Script/serviceGroupPagedViewModel',
	'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/knockout/customBindingHandlers',
	'jqueryExtention'],
function (ko, $, ServiceMenuItem, ServiceGroupPagedViewModel) {

	//Объект для получения адресов фильтра. Используется главной страницей
	window.urlServiceFilter = {
		url: (window.nvxCommonPath != null ? window.nvxCommonPath.searchView : '/searchservice/index.php'),
		//параметры фильтра для жизненных ситуаций
		lifeSituationParam: {
			sortBy: 'FullName',
			sortOrder: 'ASC',
			groupBy: 'LifeSituation',
			filterBy: 'all',
			onlyOnline: false
		},
		//параметры фильтра для категорий услуг
		categoryParam: {
			sortBy: 'FullName',
			sortOrder: 'ASC',
			groupBy: 'Category',
			filterBy: 'all',
			onlyOnline: false
		},
		//параметры фильтра для популярных услуг
		popularParam: {
			sortBy: 'FullName',
			sortOrder: 'ASC',
			groupBy: 'Popular',
			filterBy: 'all',
			onlyOnline: false
		},
		//получить адрес с параметрами фильтрации
		getUrl: function (params, gotoGroupId) {
			var filterParam = JSON.stringify(params);
			var url = this.url + '?params=' + encodeURIComponent(filterParam);
			if (gotoGroupId && gotoGroupId != '') {
				url += '&gotoGroupId=' + encodeURIComponent(gotoGroupId);
			}
			return url;
		},
		//получить адрес с параметрами фильтрации для жизненных ситуаций
		getUrlLifeSituation: function (gotoLifeSituationId) {
			return this.getUrl(this.lifeSituationParam, gotoLifeSituationId);
		},
		//получить адрес с параметрами фильтрации для категорий
		getUrlCategory: function (gotoCategoryId) {
			return this.getUrl(this.categoryParam, gotoCategoryId);
		},
		//получить адрес с параметрами фильтрации для поулярных услуг
		getUrlPopular: function () {
			return this.getUrl(this.popularParam) + '&gotoGroupId=IsPopular';
		}
	};

	var SearchServicesViewModel = function () {
		var self = this;

		//Список услуг.
		self.list = ko.observableArray();
		//Количество услуг
		self.count = ko.observable(0);

		self.currentService = ko.observable(null);

		self.serviceFilterModel = ko.observable(null);

		//где-то глубоко в коде модель фильтра связана с моделью меню.
		//Если не создать объект меню, то фильтр не работает
		var serviceMenuItem = new ServiceMenuItem(true);
		self.item = serviceMenuItem.items()[0];
		//Заполнить модель фильтрации
		self.fillFilterItem();

		//self.updateFilter();
	};

	//Заполнить модель фильтрации
	SearchServicesViewModel.prototype.fillFilterItem = function() {
		var self = this;

		//шаблон для отображения списка
		self.item.listTemplateId = 'Nvx.ReDoc.StateStructureServiceModule/Service/View/serviceListTemplate.tmpl.html';

		self.item.childsTemplateId = 'Nvx.ReDoc.StateStructureServiceModule/Service/View/groupRowTemplate.tmpl.html';

		self.item.selectionState = {
			//страница, где расположен контрол
			pageUrl: (window.nvxCommonPath != null ? window.nvxCommonPath.searchView : '/searchservice/index.php'),
			//адрес, откуда подгружать список услуг
			url: '/Nvx.ReDoc.StateStructureServiceModule/ServiceController/ServiceGroupsList'
		};

		//параметра фильтрации по-умолчанию
		self.item.selectionState.params = {
			sortBy: 'FullName',
			sortOrder: 'ASC',
			groupBy: '',
			filterBy: 'all',
			onlyOnline: false,
			adminLevel: 1, //региональные ведомства
			openingGroups: [] //открытые группы
		};

		self.item.sorts = [
			{
				title: 'По алфавиту (А-Я)',
				sortBy: 'FullName',
				sortOrder: 'ASC'
			},
			{
				title: 'По алфавиту (Я-А)',
				sortBy: 'FullName',
				sortOrder: 'DESC'
			}
		];

		if (self.item.id === 'services_all') {
			self.item.groups = [
				{
					title: 'Не группировать',
					groupBy: '',
					id: 'empty'
				},
				{
					title: 'По категориям',
					groupBy: 'Category',
					id: 'Category'
				},
				{
					title: 'По жизненным обстоятельствам',
					groupBy: 'LifeSituation',
					id: 'LifeSituation'
				},
				{
					title: 'По ведомствам',
					groupBy: 'Department',
					id: 'Department'
				},
				{
					title: 'По популярности',
					groupBy: 'Popular',
					id: 'Popular'
				}
			];
			self.item.pageTitle = 'Услуги';

			self.item.filters = [
				{
					title: 'Всех',
					filterBy: 'all',
					id: 'all'
				},
				{
					title: 'Физических лиц',
					filterBy: 'physical',
					id: 'physical'
				},
				{
					title: 'Индивидуальных предпринимателей',
					filterBy: 'individual',
					id: 'individual'
				},
				{
					title: 'Юридических лиц',
					filterBy: 'juridical',
					id: 'juridical'
				},
				{
					title: 'Иностранных граждан',
					filterBy: 'foreigner',
					id: 'foreigner'
				}
			];
		} else {
			self.item.groups = [
				{
					title: 'Не группировать',
					groupBy: '',
					id: 'empty'
				}
			];
			self.item.pageTitle = "Услуги";
		}
	};
	SearchServicesViewModel.prototype.start = function () {
		var self = this;
		self.updateFilter();
		if (window.BX)
			self.serviceFilterModel().canSearch(false);
	};

	//обновить фильтр и перезагрузить список
	SearchServicesViewModel.prototype.updateFilter = function () {
		var self = this;

		var pagedViewModel = null;
		var selectionState = null;

		//self.serviceFilterModel(null);

		//создать модель, если ее нет
		if (self.serviceFilterModel() == null) {
			var title = null;
			var pageTemplate = self.item.pageTemplate;
			var listTemplateId = self.item.listTemplateId;
			var childsTemplateId = self.item.childsTemplateId;
			var pagedViewModelFactory = ServiceGroupPagedViewModel;
			var groups = self.item.groups;
			var sorts = self.item.sorts;
			var filters = self.item.filters;


			pagedViewModel = new pagedViewModelFactory();
			self.serviceFilterModel(pagedViewModel);

			//преминить фильтр по-умолчанию
			if (selectionState == null) {
				//clone
				selectionState = JSON.parse(JSON.stringify(self.item.selectionState));
				selectionState.params = selectionState.params;
			}

			if (pagedViewModel.title) {
				pagedViewModel.title(title);
			}
			if (pagedViewModel.filters && filters && !self.filtersEqaul(pagedViewModel.filters(), filters)) {
				pagedViewModel.filters(filters);
			}
			if (pagedViewModel.sorts && sorts && !self.sortsEqaul(pagedViewModel.sorts(), sorts)) {
				pagedViewModel.sorts(sorts);
			}
			if (pagedViewModel.groups && groups && !self.groupsEqaul(pagedViewModel.groups(), groups)) {
				pagedViewModel.groups(groups);
				if (selectionState != null) {
					pagedViewModel.groupId(selectionState.params.groupBy);
				}
			}
			if (pagedViewModel.items) {
				pagedViewModel.items([]);
			}
			if (pagedViewModel.listTemplateId) {
				pagedViewModel.listTemplateId(listTemplateId);
			}
			if (pagedViewModel.childsTemplateId)
				pagedViewModel.childsTemplateId(childsTemplateId);

			self.serviceFilterModel(pagedViewModel);
		} else {
			pagedViewModel = self.serviceFilterModel();
			selectionState = pagedViewModel.selectionState();
		}

		pagedViewModel.selectionState(selectionState);

		//группа, к которой нужно проскролить страницу после загрузки списка услуг
		var groupId = window.getUrlVarsFunction()['gotoGroupId'];

		//получить из строки запроса параметры фильтрации и записать в модель текст поиска
		//иначе текст пропадает при перезагрузке страницы
		var params = window.getUrlVarsFunction()['params'];
		if (params != undefined) {
			try {
				var selectionStateParams = JSON.parse(decodeURIComponent(params));
				selectionState.params = selectionStateParams;
				pagedViewModel.searchText(selectionStateParams.searchText);
				pagedViewModel.onlyOnline(selectionStateParams.onlyOnline);

			} catch (e) {
				console.log(e);
			}
		}

		if (pagedViewModel.applySelectionState && selectionState != null) {
			if (pagedViewModel.isOpeningGroup === true) {
				pagedViewModel.isOpeningGroup = false;
				return;
			}
			var promise = pagedViewModel.applySelectionState(selectionState);
			promise.done(function () {
				//проскролить страницу к нужной группе и эмитируем клик для его разворачивания
				//не придумал как это сделать лучше и куда это горманично воткнуть, каюсь
				if (groupId && groupId != '') {
					var element = self.serviceFilterModel().listElement();

					if (element) {
						var groupElement = $(element).find('*[groupId="' + groupId + '"]:first');

						if (groupElement.length > 0) {
							$('html,body').animate({ scrollTop: groupElement.offset().top }, 'slow');
							$(groupElement).click();
						}
					}
				}
			});
		}
	};

	SearchServicesViewModel.prototype.filtersEqaul = function (a, b) {
		if (a === b) return true;
		if (a == null || b == null) return false;
		if (a.length != b.length) return false;
		for (var i = 0; i < a.length; ++i) {
			if (a[i].filterBy != b[i].filterBy) return false;
		}
		return true;
	};

	SearchServicesViewModel.prototype.groupsEqaul = function (a, b) {
		if (a === b) return true;
		if (a == null || b == null) return false;
		if (a.length != b.length) return false;
		for (var i = 0; i < a.length; ++i) {
			if (a[i].groupBy != b[i].groupBy) return false;
		}
		return true;
	};

	SearchServicesViewModel.prototype.sortsEqaul = function (a, b) {
		if (a === b) return true;
		if (a == null || b == null) return false;
		if (a.length != b.length) return false;
		for (var i = 0; i < a.length; ++i) {
			if (a[i].sortBy != b[i].sortBy || a[i].sortOrder != b[i].sortOrder) {
				return false;
			}
		}
		return true;
	};

	return SearchServicesViewModel;
});
define('Nvx/ServiceListByCatsViewModel', ['knockout', 'jquery', 'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction'],
	function(ko, $, modal) {
		var ServiceListByCatsViewModel = function() {
			var self = this;

			self.cats = ko.observableArray();
			self.onlyOnline = ko.observable(window.sessionStorage && window.sessionStorage.getItem('nvxOnlyOnline') === 'true');
			self.isLoading = ko.observable(true);
			self.trobberId = null;
		};

		ServiceListByCatsViewModel.prototype.start = function() {
			var self = this;

			self.cats.removeAll();
			self.isLoading(true);
			self.trobberId = modal.CreateTrobberDiv2();

			var filterKey = 'all';
			if (window.sessionStorage && window.sessionStorage.getItem('nvxUserType') != null) {
				filterKey = window.sessionStorage.getItem('nvxUserType');
			}

			$.ajax({
				async: true,
				type: "GET",
				url: '/Nvx.ReDoc.StateStructureServiceModule/ServiceController/ServiceGroupsList',
				cache: false,
				data: {
					"sortBy": "FullName",
					"sortOrder": "ASC",
					"groupBy": "Category",
					"filterBy": filterKey,
					"onlyOnline": self.onlyOnline(),
					"adminLevel": 1,
					"openingGroups": [],
					"depslocationstorecurrentlocation": window.getCurrentLocationFromCookie()
				}
			}).done(function(response) {
				modal.CloseTrobberDiv2(self.trobberId);
				if (response.hasError) {
					console.error(response.errorMessage);
				} else {

					for (var num = 0; num < response.list.length; num++) {
						var item = {
							groupId: response.list[num].groupId,
							groupTitle: response.list[num].groupTitle,
							list: []
						};
						item.goCategory = function() {
							window.location = (window.nvxCommonPath != null ? window.nvxCommonPath.categoryView : '/category/index.php?categoryId=') + this.groupId;
						};
						if (response.list[num].list != null) {
							for (var i = 0; i < response.list[num].list.length; i++) {
								if (i > 2)
									break;
								var passport = {
									id: response.list[num].list[i].id,
									name: response.list[num].list[i].name
								};
								passport.goPassport = function() {
									window.location = (window.nvxCommonPath != null ? window.nvxCommonPath.serviceView : '/service/index.php?departmentId=') + this.id;
								};

								item.list.push(passport);
							}
						}
						self.cats.push(item);
					}
				}
			}).fail(function(jqXHR, textStatus, errorThrown) {
				if (jqXHR.responseJSON) {
					console.error(jqXHR.responseJSON.errorMessage + ' Подробности: ' + errorThrown);
				} else {
					console.error(jqXHR.responseText);
				}
			}).always(function() {
				modal.CloseTrobberDiv2(self.trobberId);
				self.isLoading(false);
			});
		};

		return ServiceListByCatsViewModel;
	});
define('Nvx.ReDoc.StateStructureServiceModule/Service/Script/servicePagedViewModel',
[
	'knockout',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Navigation/navigation',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/DefaultController/indexBasePagedViewModel',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit'
], function (ko, navigation, indexBasePagedViewModel, inherit) {
	var ServicePagedViewModel = function () {
		var self = this;
		ServicePagedViewModel.superclass.constructor.apply(self, arguments);

		self.modalDialog = null;

		self.readAboutServiceInfo = function(id) {
			if (id) {
				window.location = (window.nvxCommonPath != null ? window.nvxCommonPath.serviceView : '/service/index.php?departmentId=') + id;
			}
		};

		self.readAboutCustomer = function() {
		};

		self.selectService = function(id) {
			console.log("selectService " + id);
		};
	};

	inherit(ServicePagedViewModel, indexBasePagedViewModel);

	return ServicePagedViewModel;
});
define('Nvx.ReDoc.StateStructureServiceModule/Service/Script/ServicesViewModel',
	['knockout',
		'jquery',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/DefaultController/serviceMenuItem',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Api/selectionState',
		'Nvx.ReDoc.StateStructureServiceModule/Service/Script/serviceGroupPagedViewModel',
		'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/knockout/customBindingHandlers',
		'jqueryExtention'],
	function(ko, $, ServiceMenuItem, selectionState, ServiceGroupPagedViewModel) {

		var serviceGroupListUrl = '/MfcUiModule/MfcUiWebController/ServiceGroupsList';

		//Объект для получения адресов фильтра. Используется главной страницей
		window.urlServiceFilter = {
			url: (window.nvxCommonPath != null ? window.nvxCommonPath.searchView : '/searchservice/index.php'),
			//параметры фильтра для категорий услуг
			categoryParam: {
				sortBy: 'FullName',
				sortOrder: 'ASC',
				groupBy: 'Category',
				filterBy: 'all',
				onlyOnline: window.sessionStorage && window.sessionStorage.getItem('nvxOnlyOnline') === 'true'
			},
			//параметры фильтра для жизненных ситуаций
			lifeSituationParam: {
				sortBy: 'FullName',
				sortOrder: 'ASC',
				groupBy: 'LifeSituation',
				filterBy: 'all',
				onlyOnline: window.sessionStorage && window.sessionStorage.getItem('nvxOnlyOnline') === 'true'
			},
			//параметры фильтра для популярных услуг
			popularParam: {
				sortBy: 'FullName',
				sortOrder: 'ASC',
				groupBy: 'Popular',
				filterBy: 'all',
				onlyOnline: window.sessionStorage && window.sessionStorage.getItem('nvxOnlyOnline') === 'true'
			}/*,
			//получить адрес с параметрами фильтрации
			getUrl: function(params, gotoGroupId) {
				var filterParam = JSON.stringify(params);
				var url = this.url + '?params=' + encodeURIComponent(filterParam);
				if (gotoGroupId && gotoGroupId != '') {
					url += '&gotoGroupId=' + encodeURIComponent(gotoGroupId);
				}
				return url;
			},
			//получить адрес с параметрами фильтрации для жизненных ситуаций
			getUrlLifeSituation: function(gotoLifeSituationId) {
				return this.getUrl(this.lifeSituationParam, gotoLifeSituationId);
			},
			//получить адрес с параметрами фильтрации для категорий
			getUrlCategory: function(gotoCategoryId) {
				return this.getUrl(this.categoryParam, gotoCategoryId);
			}, 
			//получить адрес с параметрами фильтрации для поулярных услуг
			getUrlPopular: function() {
				return this.getUrl(this.popularParam) + '&gotoGroupId=IsPopular';
			}*/
		};

		var ServicesViewModel = function() {
			var self = this;

			//Список услуг.
			self.list = ko.observableArray();
			//Количество услуг
			self.count = ko.observable(0);

			self.currentService = ko.observable(null);

			self.serviceFilterModel = ko.observable(null);

			//где-то глубоко в коде модель фильтра связана с моделью меню.
			//Если не создать объект меню, то фильтр не работает
			//var serviceMenuItem = new ServiceMenuItem(true);
			//self.item = serviceMenuItem.items()[0];
			self.item = new selectionState(
				{ ownerId: 'serviceList', secondaryMenuItemId: 'services_all' },
				serviceGroupListUrl,
				{ type: 5 },
				'Услуги - Все'
			);
			//Заполнить модель фильтрации
			self.fillFilterItem();

			self.updateFilter();
		};

		ServicesViewModel.prototype.start = function () {
			//проверка переменной в
			//query
			var query = window.getUrlVarsFunction['query'];
			
		};

		//Заполнить модель фильтрации
		ServicesViewModel.prototype.fillFilterItem = function() {
			var self = this;
			if (self.item == null)
				return;

			//шаблон для отображения списка
			self.item.listTemplateId = 'Nvx.ReDoc.StateStructureServiceModule/Service/View/serviceListTemplate.tmpl.html';

			self.item.childsTemplateId = 'Nvx.ReDoc.StateStructureServiceModule/Service/View/groupRowTemplate.tmpl.html';

			self.item.selectionState = {
				//страница, где расположен контрол
				pageUrl: window.location.pathname,
				//адрес, откуда подгружать список услуг
				url: '/Nvx.ReDoc.StateStructureServiceModule/ServiceController/ServiceGroupsList'
			};

			//параметра фильтрации по-умолчанию
			self.item.selectionState.params = {
				sortBy: 'FullName',
				sortOrder: 'ASC',
				groupBy: 'Category',
				filterBy: 'all',
				onlyOnline: window.sessionStorage && window.sessionStorage.getItem('nvxOnlyOnline') === 'true',
				adminLevel: 1, //региональные ведомства
				openingGroups: [] //открытые группы
			};

			//параметра фильтрации по-умолчанию
			//self.item.selectionState.params = {
			//	sortBy: 'FullName',
			//	sortOrder: 'ASC',
			//	groupBy: 'LifeSituation',
			//	filterBy: 'all',
			//	onlyOnline: false,
			//	adminLevel: 1, //региональные ведомства
			//	openingGroups: [] //открытые группы
			//};

			self.item.sorts = [
				{
					title: 'По алфавиту (А-Я)',
					sortBy: 'FullName',
					sortOrder: 'ASC'
				},
				{
					title: 'По алфавиту (Я-А)',
					sortBy: 'FullName',
					sortOrder: 'DESC'
				}
			];

			if (self.item.id === 'services_all') {
				self.item.groups = [
					{
						title: 'Не группировать',
						groupBy: '',
						id: 'empty'
					},
					{
						title: 'По категориям',
						groupBy: 'Category',
						id: 'Category'
					},
					{
						title: 'По жизненным обстоятельствам',
						groupBy: 'LifeSituation',
						id: 'LifeSituation'
					},
					{
						title: 'По ведомствам',
						groupBy: 'Department',
						id: 'Department'
					},
					{
						title: 'По популярности',
						groupBy: 'Popular',
						id: 'Popular'
					}
				];
				self.item.pageTitle = 'Услуги';

				self.item.filters = [
					{
						title: 'Всех',
						filterBy: 'all',
						id: 'all'
					},
					{
						title: 'Физических лиц',
						filterBy: 'physical',
						id: 'physical'
					},
					{
						title: 'Индивидуальных предпринимателей',
						filterBy: 'individual',
						id: 'individual'
					},
					{
						title: 'Юридических лиц',
						filterBy: 'juridical',
						id: 'juridical'
					},
					{
						title: 'Иностранных граждан',
						filterBy: 'foreigner',
						id: 'foreigner'
					}
				];
			} else {
				self.item.groups = [
					{
						title: 'Не группировать',
						groupBy: '',
						id: 'empty'
					}
				];
				self.item.pageTitle = "Услуги";
			}
		};

		//обновить фильтр и перезагрузить список
		ServicesViewModel.prototype.updateFilter = function() {
			var self = this;

			var pagedViewModel = null;
			var selectionState = null;

			self.serviceFilterModel(null);

			//создать модель, если ее нет
			if (self.serviceFilterModel() == null) {
				var title = null;
				var pageTemplate = self.item.pageTemplate;
				var listTemplateId = self.item.listTemplateId;
				var childsTemplateId = self.item.childsTemplateId;
				var pagedViewModelFactory = ServiceGroupPagedViewModel;
				var groups = self.item.groups;
				var sorts = self.item.sorts;
				var filters = self.item.filters;


				pagedViewModel = new pagedViewModelFactory();
				self.serviceFilterModel(pagedViewModel);

				//преминить фильтр по-умолчанию
				if (selectionState == null) {
					//clone
					selectionState = JSON.parse(JSON.stringify(self.item.selectionState));
					selectionState.params = selectionState.params;
				}

				if (pagedViewModel.title) {
					pagedViewModel.title(title);
				}
				if (pagedViewModel.filters && filters && !self.filtersEqaul(pagedViewModel.filters(), filters)) {
					pagedViewModel.filters(filters);
				}
				if (pagedViewModel.sorts && sorts && !self.sortsEqaul(pagedViewModel.sorts(), sorts)) {
					pagedViewModel.sorts(sorts);
				}
				if (pagedViewModel.groups && groups && !self.groupsEqaul(pagedViewModel.groups(), groups)) {
					pagedViewModel.groups(groups);
					if (selectionState != null) {
						pagedViewModel.groupId(selectionState.params.groupBy);
					}
				}
				if (pagedViewModel.items) {
					pagedViewModel.items([]);
				}
				if (pagedViewModel.listTemplateId) {
					pagedViewModel.listTemplateId(listTemplateId);
				}
				if (pagedViewModel.childsTemplateId)
					pagedViewModel.childsTemplateId(childsTemplateId);

				self.serviceFilterModel(pagedViewModel);
			} else {
				pagedViewModel = self.serviceFilterModel();
				selectionState = pagedViewModel.selectionState();
			}

			pagedViewModel.selectionState(selectionState);

			//группа, к которой нужно проскролить страницу после загрузки списка услуг
			var groupId = window.getUrlVarsFunction['gotoGroupId'];

			//получить из строки запроса параметры фильтрации и записать в модель текст поиска
			//иначе текст пропадает при перезагрузке страницы
			var params = window.getUrlVarsFunction['params'];
			if (params != undefined) {
				try {
					var selectionStateParams = JSON.parse(decodeURIComponent(params));
					selectionState.params = selectionStateParams;
					pagedViewModel.searchText(selectionStateParams.searchText);
					pagedViewModel.onlyOnline(selectionStateParams.onlyOnline);

				} catch(e) {
					console.log(e);
				}
			}

			if (pagedViewModel.applySelectionState && selectionState != null) {
				if (pagedViewModel.isOpeningGroup === true) {
					pagedViewModel.isOpeningGroup = false;
					return;
				}
				var promise = pagedViewModel.applySelectionState(selectionState);
				promise.done(function() {
					//проскролить страницу к нужной группе и эмитируем клик для его разворачивания
					//не придумал как это сделать лучше и куда это горманично воткнуть, каюсь
					if (groupId && groupId != '') {
						var element = self.serviceFilterModel().listElement();

						if (element) {
							var groupElement = $(element).find('*[groupId="' + groupId + '"]:first');

							if (groupElement.length > 0) {
								$('html,body').animate({ scrollTop: groupElement.offset().top }, 'slow');
								$(groupElement).click();
							}
						}
					}
				});
			}
		};

		ServicesViewModel.prototype.filtersEqaul = function(a, b) {
			if (a === b) return true;
			if (a == null || b == null) return false;
			if (a.length != b.length) return false;
			for (var i = 0; i < a.length; ++i) {
				if (a[i].filterBy != b[i].filterBy) return false;
			}
			return true;
		};

		ServicesViewModel.prototype.groupsEqaul = function(a, b) {
			if (a === b) return true;
			if (a == null || b == null) return false;
			if (a.length != b.length) return false;
			for (var i = 0; i < a.length; ++i) {
				if (a[i].groupBy != b[i].groupBy) return false;
			}
			return true;
		};

		ServicesViewModel.prototype.sortsEqaul = function(a, b) {
			if (a === b) return true;
			if (a == null || b == null) return false;
			if (a.length != b.length) return false;
			for (var i = 0; i < a.length; ++i) {
				if (a[i].sortBy != b[i].sortBy || a[i].sortOrder != b[i].sortOrder) {
					return false;
				}
			}
			return true;
		};

		return ServicesViewModel;
	});
define('Nvx/SituationsViewModel',
	[
		'knockout',
		'Nvx.ReDoc.Rpgu.PortalModule/Portal/Script/MainPage/listBlockViewModel',
		'Nvx.ReDoc.Rpgu.PortalModule/Portal/Script/MainPage/listBlockItemModel',
		'Nvx/Script/serviceUtils'
	],
	function(ko, ListBlockViewModel, ListBlockItemModel, ServiceUtils) {
		var SituationsViewModel = function() {
			var self = this;

			self.serviceCategoriesBlock = ko.observable(new ListBlockViewModel('Услуги по жизненным ситуациям', 'Все жизненные ситуации', '/'));

			self.serviceUtils = new ServiceUtils();

			self.itemInBlockMaxCount = 100;

			var filterKey = 'all';
			if (window.sessionStorage && window.sessionStorage.getItem('nvxUserType') != null) {
				filterKey = window.sessionStorage.getItem('nvxUserType');
			}

			//параметра фильтрации по-умолчанию
			self.lifeSituationParam = {
				sortBy: 'FullName',
				sortOrder: 'ASC',
				groupBy: 'LifeSituation',
				filterBy: filterKey,
				onlyOnline: window.sessionStorage && window.sessionStorage.getItem('nvxOnlyOnline') === 'true'
			};
		};

		//Показать весь контент
		SituationsViewModel.prototype.start = function() {
			var self = this;
			self.showServiceCategoriesBlock();
		};

		//Показать блок с категориями услуг
		SituationsViewModel.prototype.showServiceCategoriesBlock = function() {
			var self = this;

			//не нужен, пока не сделаем работу с категориями
			self.serviceCategoriesBlock().items([]);
			self.serviceUtils.loadLifeSituations().done(function(list) {
				for (var i = 0; i < list.length && i < self.itemInBlockMaxCount; i++) {
					var item = list[i];
					var urlSituation = (window.nvxCommonPath != null ? window.nvxCommonPath.situationView : '/category/index.php?situationId=') + item.recId;
					self.serviceCategoriesBlock().items.push(new ListBlockItemModel(item.title, urlSituation, item.recId));
				}
			});
		};

		return SituationsViewModel;
	});
define('Nvx/StartCreateFileViewModel', [
		'knockout',
		'jquery',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'jqueryExtention'],
	function(ko, $, modal) {
		var StartCreateFileViewModel = function() {
			var self = this;

			// запрос на сервер создание дела
			self.createFileRequest = function(data) {
				var searchTrobberId = modal.CreateTrobberDiv2();
				$.ajax({ url: "/Rpgu/Wizzard/Step5/CreateFile", data: data, headers: { proxy: true }, method: 'POST' })
					.done(function(response) {
						if (response.hasError) {
							//todo разобраться
							//modal.errorModalWindow(response.errorMessage);
						} else {
							if (response.redirectUrl) {
								window.location = response.redirectUrl;
							} else {
								var fileUrl = (window.nvxCommonPath != null ? window.nvxCommonPath.formView : '/cabinet/request/index.php?fileId=') + response.fileId;
								//Переходим к вновь созданному делу
								window.location = fileUrl;
							}
						}
					}).fail(function(jqXHR, textStatus, errorThrown) {
						switch (jqXHR.status) {
						case 403:
							//Перенаправляем на страницу аутентификации.
							window.location.href = window.nvxCommonPath.authRedirectPath;
						default:
								//todo разобраться
							//Выводим модальное окно с ошибкой
							//modal.errorModalWindow('Не удалось получить с сервера данные. Подробности: ' + errorThrown);
						}
					}).always(function() {
						//Скрываем индикатор загрузки.
						modal.CloseTrobberDiv2(searchTrobberId);
					});
			};
		};

		StartCreateFileViewModel.prototype.start = function() {
			var self = this;

			var fileData = $.cookie('create_file_data');
			if (fileData == null || fileData == '') {
				return;
			}
			console.log(fileData);
			$.cookie('create_file_data', '', { path: '/' });
			try {
				var data = JSON.parse(fileData);
				self.createFileRequest(data);
			} catch(e) {
				console.log(e);
			}
		};

		return StartCreateFileViewModel;
	});
define('Nvx/StartServiceViewModel', [
		'knockout',
		'jquery',
		'Nvx.ReDoc.StateStructureServiceModule/Service/Script/ServicePassportInfoViewModel',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'jqueryExtention'],
	function(ko, $, ServicePassportInfoViewModel, modalWindowsFunction) {
		var StartServiceViewModel = function() {
			var self = this;

			/*Заголовок страницы*/
			self.pageTitle = ko.observable('');
			/*Иконка заголовка*/
			self.pageIcon = ko.observable('');
			/*Шаблон*/
			self.templateId = ko.observable('placeholderTemplate');
			/*Модель шаблона*/
			self.templateModel = ko.observable(null);
		};

		StartServiceViewModel.prototype.start = function() {
			var self = this;
			var serviceId = window.getUrlVarsFunction()['serviceId'];
			if (serviceId != null)
				self.getService(serviceId);
		};

		StartServiceViewModel.prototype.getService = function(serviceId) {
			var self = this;
			self.serviceId = serviceId;

			self.templateId('placeholderTemplate');
			self.templateModel(new ServicePassportInfoViewModel(serviceId));
			
			//Ссылка для igtn, issue1157
			if (window.nvxCommonPath && window.nvxCommonPath.igtnServiceList && window.nvxCommonPath.igtnServiceList.indexOf(serviceId) != -1) {
				self.templateModel().canGoIgtn(true);
			}

			var promise = self.templateModel().showServicePassport(serviceId, 'description')
				.done(function() {
					self.templateId('Nvx.ReDoc.StateStructureServiceModule/Service/View/servicePassportInfo.tmpl.html');
					self.templateModel().tabs.description.activate();
					modalWindowsFunction.CloseTrobberDiv3();
				});

			return promise;
		};

		return StartServiceViewModel;
	});
define('Nvx/StateStructuresViewModel', [
		'knockout',
		'jquery',
		'Nvx/DepartmentViewModel',
		'Nvx.ReDoc.StateStructureServiceModule/StateStructure/Script/MfcViewModel',
		'Nvx.ReDoc.StateStructureServiceModule/StateStructure/Script/MfcListViewModel',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'jqueryExtention'],
	function(ko, $, DepartmentViewModel, MfcViewModel, MfcListViewModel, modalWindowsFunction) {
		var StateStructuresViewModel = function() {
			var self = this;

			/*Заголовок страницы*/
			self.pageTitle = ko.observable('');
			/*Иконка заголовка*/
			self.pageIcon = ko.observable('');
			/*Шаблон*/
			self.templateId = ko.observable('placeholderTemplate');
			/*Модель шаблона*/
			self.templateModel = ko.observable(null);
		};

		StateStructuresViewModel.prototype.start = function(trId) {
			var self = this;
			var departmentId = window.getUrlVarsFunction()['departmentId'];
			var mfcId = window.getUrlVarsFunction()['mfcId'];
			if (departmentId != null || mfcId != null) {
				self.getDepartment(departmentId, mfcId)
					.done(function() {
						var param = window.getUrlVarsFunction(null, '#')[''];
						if (param != null) {
							if (param == 'tabDocs')
								self.templateModel().tabs.documents.onclick();
							else if (param == 'services')
								self.templateModel().tabs.services.onclick();
							
						}
					})
					.always(function() {
						modalWindowsFunction.CloseTrobberDiv3(trId);
					});
			} else {
				self.getMfcList("info")
					.done(function() {
						var param = window.getUrlVarsFunction(null, '#')[''];
						if (param != null) {
							if (param == 'tabDocs')
								self.templateModel().tabs.documents.onclick();
							else if (param == 'services')
								self.templateModel().tabs.services.onclick();
						}
					})
					.always(function() {
						modalWindowsFunction.CloseTrobberDiv3(trId);
					});
			}
		};

		StateStructuresViewModel.prototype.getDepartment = function(departmentId, mfcId) {
			var self = this;
			self.departmentId = departmentId || mfcId;

			self.pageTitle(null);
			self.pageIcon(null);
			self.templateId('placeholderTemplate');
			if (departmentId == null) {
				self.templateModel(new MfcViewModel(mfcId));
			} else {
				self.templateModel(new DepartmentViewModel(departmentId));
			}
			var promise = self.templateModel().getDepartment()
				.done(function() {
					if (departmentId == null) {
						self.templateId('Nvx.ReDoc.StateStructureServiceModule/StateStructure/View/mfcView.tmpl.html');
					} else {
						self.templateId('Nvx.ReDoc.StateStructureServiceModule/StateStructure/View/departmentView.tmpl.html');
					}
					self.templateModel().tabs.info.active(true);
				});

			return promise;
		};

		StateStructuresViewModel.prototype.getMfcList = function(selectedTab) {
			var self = this;

			self.pageTitle(null);
			self.templateId('placeholderTemplate');
			self.templateModel(new MfcListViewModel(self.redocPluginObject));
			var promise = self.templateModel().setActiveTab(selectedTab);
			if (promise != null) {
				promise.done(function() {
					self.templateId('Nvx.ReDoc.StateStructureServiceModule/StateStructure/View/mfcList.tmpl.html');
				});
			}
			return promise;
		};

		return StateStructuresViewModel;
	});
define('Nvx/TreatmentStartViewModel', [
		'knockout',
		'jquery',
		'Nvx/wizzardPagerViewModel',
		'jqueryExtention'],
	function(ko, $, WizzardPagerViewModel) {
		var TreatmentStartViewModel = function() {
			var self = this;

			/*Шаблон*/
			self.templateId = ko.observable('placeholderTemplate');
			/*Модель шаблона*/
			self.templateViewModel = ko.observable(null);
		};

		TreatmentStartViewModel.prototype.start = function() {
			var self = this;
			var serviceId = window.getUrlVarsFunction()['serviceId'];

			//Создаем вью-модель для контента страницы портала.
			var wizzardPagerViewModel = new WizzardPagerViewModel('newtreatment', serviceId, 'anonymous', true);
			//Подмена вью-модели.
			self.templateId('placeholderTemplate');
			self.templateViewModel(wizzardPagerViewModel);
			self.templateId('Nvx.ReDoc.MfcUiModule/Web/View/Wizzard/WizzardPager.Template.tmpl.html');
		};

		return TreatmentStartViewModel;
	});
define('Nvx/TripleCatalogViewModel',
	[
		'knockout',
		'Nvx/ServiceListByCatsViewModel',
		'Nvx/DepartmentTreeViewModel',
		'Nvx/SituationsViewModel'
	],
	function(ko, ServiceListByCatsViewModel, DepartmentTreeViewModel, SituationsViewModel) {
		var TripleCatalogViewModel = function() {
			var self = this;

			self.searchText = ko.observable();
			self.onlyOnline = ko.observable(window.sessionStorage && window.sessionStorage.getItem('nvxOnlyOnline') === 'true');

			self.ServiceList = new ServiceListByCatsViewModel();

			self.Departments = new DepartmentTreeViewModel();

			self.LifeSituations = new SituationsViewModel();

			self.ServiceList.start('#tab1');
			self.Departments.start();
			self.LifeSituations.start();

			self.onlyOnline.subscribe(function (newValue) {
				self.ServiceList.onlyOnline(newValue);
				self.ServiceList.start('#tab1');
				if (window.sessionStorage) {
					window.sessionStorage['nvxOnlyOnline'] = newValue;
				}
			});

			self.goSearch = function() {
				var params = {
					adminLevel: 1,
					sortBy: 'FullName',
					sortOrder: 'ASC',
					groupBy: '',
					filterBy: 'all',
					onlyOnline: self.onlyOnline(),
					searchText: self.searchText()
				};
				var filterParam = JSON.stringify(params);
				window.location = (window.nvxCommonPath != null ? window.nvxCommonPath.searchView : '/searchservice/index.php') + '?params=' + encodeURIComponent(filterParam);
			};

			self.goPreSearch = function() {
				if (this != null) {
					self.searchText(this.toString());
					self.goSearch();
				}
			};
		};

		TripleCatalogViewModel.prototype.start = function() {
		};

		return TripleCatalogViewModel;
	});
define('Nvx.ReDoc.Workflow.UploadDocsForm/Web/Resources/Scripts/UploadDocsFormViewModel',
	[
		'require',
		'jquery',
		'knockout',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/nvxRedocCommon',
		'Nvx.ReDoc.Workflow.UploadDocsForm/Web/Resources/Scripts/UploadDocsPartFormViewModel',
		'Nvx.ReDoc.Workflow.UploadDocsForm/Web/Resources/Scripts/PartSingleUploadViewModel',
		'Nvx.ReDoc.Workflow.UploadDocsForm/Web/Resources/Scripts/PartReadonlyViewModel',
		'Nvx.ReDoc.Workflow.UploadDocsForm/Web/Resources/Scripts/DocsSubmitFormViewModel',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Helpers/signAttachmentHelper'
	],
	function (require, $, ko, modal, common, UploadDocsPartFormViewModel, PartSingleUploadViewModel, PartReadonlyViewModel, DocsSubmitFormViewModel, signAttachmentHelper) {
		var UploadDocsFormViewModel = function() {
			var self = this;
			self.fileId = null;
			self.componentId = ko.observable('');

			self.title = ko.observable('');
			self.relatedItemsViewModel = ko.observable(null);
			// текущая модель для отображения контента формы
			self.contentViewModel = ko.observable(null);
			// идентификатор шаблона содержимого формы
			self.contentTemplateId = ko.observable();
			self.showConfirm = ko.observable(false);
			// по умолчанию переход на след шаг заблокирован, пока не приложен файл с распиской
			self.canGoToNext = ko.observable();
			self.transitions = ko.observable([]);
			self.taskOpen = ko.observable(false);
			self.submitSection = ko.observable(false);
			self.host = ko.observable(null);
			/**
			 * форма загружена на портале РПГУ
			 */
			self.rpguPortalEnabled = ko.observable(true);

			self.currentUploadKey = ko.observable(null);

			self.ajaxCall = function (opt) {
				common.ajaxSendJsonRequest(opt.url, function(response) {
					if (response.hasError) {
						console.log(response.errorMessage);
					} else {
						//После удачного вызова.
						if ($.isFunction(opt.successCallback)) {
							opt.successCallback(response);
						}
					}
				}, opt.data);
			};

			//Метод отрабатывает после выбора сертификата для подписи вложений
			self.certificateSelectedCallback = function (deferred, thumbprint) {
				var trobberId = modal.CreateTrobberDiv2();
				signAttachmentHelper.getCertificateBase64(thumbprint)
					.done(function(certificate) {
						self.afterCertificateSelectedCallback(deferred, thumbprint, trobberId, certificate);
					})
					.fail(function (e) {
						console.log(e);
					});
			};

			//Метод отрабатывает после загрузки сертификата из хранилища
			self.afterCertificateSelectedCallback = function (deferred, thumbprint, trobberId, certificate) {
				var formData = new FormData();
				formData.append("fileId", self.fileId);
				formData.append("componentId", self.componentId());
				formData.append("thumbprint", thumbprint);
				formData.append("certificate", certificate);
				formData.append("uploadKey", self.currentUploadKey());
				var docInfos = self.contentViewModel().items();
				var otherDocInfos = self.contentViewModel().otherItems();
				var issueDate = self.contentViewModel().issueDate();
				var commentary = self.contentViewModel().commentary();

				if (issueDate != null) {
					formData.append("issueDate", issueDate.toUTCString());
				}

				formData.append("commentary", commentary);

				var docInfosModel = []; // легкая версия списка обязательных документов для передачи на сервер
				var otherDocInfosModel = [];

				// получаем список документов с формы сбора документов
				for (var i = 0; i < docInfos.length; i++) {
					var docInfosItem = docInfos[i].infos();
					var modelItem = { title: docInfos[i].title, infos: [] };
					for (var j = 0; j < docInfosItem.length; j++) {
						var infosItem = docInfosItem[j];
						if (infosItem.name != null) {
							formData.append('docInfos_' + i + '_' + j, infosItem.file);
						}
						if (self.submitSection() == false) {
							modelItem.infos.push({
								alias: infosItem.alias(),
								countPage: self.checkNumber(infosItem.countPage()),
								isOrigin: infosItem.isOriginal(),
								name: infosItem.name,
								isFileLoad: infosItem.isFileLoad()
							});
						} else {
							modelItem.infos.push({
								alias: infosItem.alias(),
								name: infosItem.name,
								isFileLoad: infosItem.isFileLoad(),
								isSubmitted: infosItem.isSubmitted(),
								submitDocInfo: self.getSubmitData(infosItem)
							});
						}
					}
					docInfosModel.push(modelItem);
				}
				formData.append("docInfosModel", JSON.stringify(docInfosModel));

				for (var x = 0; x < otherDocInfos.length; x++) {
					var otherDocInfosItem = otherDocInfos[x].infos();
					var otherModelItem = { title: otherDocInfos[x].title, infos: [] };
					for (var y = 0; y < otherDocInfosItem.length; y++) {
						var otherInfosItem = otherDocInfosItem[y];
						if (otherInfosItem.name != null) {
							formData.append('otherDocInfos_' + x + '_' + y, otherInfosItem.file);
						}
						if (self.submitSection() == false) {
							otherModelItem.infos.push({
								alias: otherInfosItem.alias(),
								countPage: self.checkNumber(otherInfosItem.countPage()),
								isOrigin: otherInfosItem.isOriginal(),
								name: otherInfosItem.name,
								isFileLoad: otherInfosItem.isFileLoad()
							});
						} else {
							otherModelItem.infos.push({
								alias: otherInfosItem.alias(),
								name: otherInfosItem.name,
								isFileLoad: otherInfosItem.isFileLoad(),
								isSubmitted: otherInfosItem.isSubmitted(),
								submitDocInfo: self.getSubmitData(otherInfosItem)
							});
						}
					}
					otherDocInfosModel.push(otherModelItem);
				}

				formData.append("otherDocInfosModel", JSON.stringify(otherDocInfosModel));
				var xhr = new XMLHttpRequest();

				xhr.addEventListener("load", function (event) {
					var response = null;
					try {
						response = JSON.parse(this.response);
					} catch (e) {
						//Выводим модальное окно с ошибкой.
						modal.errorModalWindow(this.response);
						//Скрываем индикатор загрузки.
						modal.CloseTrobberDiv2(trobberId);
						console.log(e);
						deferred.reject();
					}
					if (response != null) {
						if (response.hasError) {
							//Выводим модальное окно с ошибкой.
							modal.errorModalWindow(response.errorMessage);
							deferred.reject();
						} else {
							//Здесь нам нужно сформировать подпись для всех вложений
							//А подпись асинхронная
							var newData = {
								fileId: self.fileId,
								componentId: self.componentId()
							};
							
							var info = [];
							//Объявляем метод для подписи, который либо вызовет себя для следующего вложения по окончании подписи, либо отправит все данные на сервер для сохранения
							var signNextAttachment = function(index, all, algId, docInfo) {
								if (index < all.length) {
									var dataToSign = {
										thumbprint: thumbprint,
										digest: all[index].hash,
										hashAlgId: algId
									};
									signAttachmentHelper.getSignWithHash(dataToSign).done(function(digest) {
										if (digest !== null) {
											info.push({
												attachmentId: all[index].attachmentId,
												hash: digest
											});
										}
										signNextAttachment(index + 1, all, algId, docInfo);
									});

								} else {
									newData.info = JSON.stringify(info);
									//отправить последний запрос на сохранение всех атачментов
									//всё сохранить на сервер
									$.ajax({ url: '/Nvx.ReDoc.Workflow.UploadDocsForm/SaveNewSignAttachmentList', data: newData, method: 'POST', headers: { proxy: true } })
										.done(function(saveResponse) {
											//Послать ещё запрос, чтобы стартануть следующий шаг
											if (saveResponse === true) {
												var finishData = {
													fileId: self.fileId,
													componentId: self.componentId(),
													commentary: commentary,
													docInfo: docInfo,
													uploadKey: self.currentUploadKey()
												};
												if (issueDate != null) {
													finishData.issueDate = issueDate.toUTCString();
												}

												$.ajax({ url: '/Nvx.ReDoc.Workflow.UploadDocsForm/FinishSaveUploadDocsForm', data: finishData, headers: { proxy: true }, method: 'POST' })
													.done(function(finishResponse) {
														common.FindAndClickLeftPaveTask(finishResponse);
														deferred.resolve();
													}).fail(function(ee) {
														console.log(ee);
														deferred.reject();
													});
											} else {
												deferred.reject();
											}
										});
								}
							};
							//И вызовем этот самый метод
							signNextAttachment(0, response.info, response.hashAlgId, response.docInfo);
						}
					} else {
						deferred.reject();
					}
					//Скрываем индикатор загрузки.
					modal.CloseTrobberDiv2(trobberId);
				}, false);
				xhr.addEventListener("error", function (event) {
					//Выводим модальное окно с ошибкой.
					modal.errorModalWindow('Не удалось получить данные с сервера о результате операции сохранения контакта.');
					//Скрываем индикатор загрузки.
					modal.CloseTrobberDiv2(trobberId);
					deferred.reject();
				}, false);
				xhr.open('POST', self.host() + '/Nvx.ReDoc.Workflow.UploadDocsForm/SaveUploadDocsForm');
				xhr.setRequestHeader('Accept', 'application/json, text/javascript');
				xhr.withCredentials = true;
				xhr.send(formData);
			};

			// функция сбора документов с формы и  отправка на сервер
			self.goToTransition = function(action) {
				var deferred = new $.Deferred();
				var trobberId = modal.CreateTrobberDiv2();
				$.ajax({
					method: 'POST',
					headers: { proxy: true },
					url: '/Nvx.ReDoc.Workflow.UploadDocsForm/CheckNeedSignAttachments',
					data: {
						"fileId": self.fileId,
						"componentId": self.componentId()
					}
				}).done(function(response) {
					if (response.hasError) {
						//Выводим модальное окно с ошибкой.
						console.log(response.errorMessage);
						modal.errorModalWindow(response.errorMessage);
						modal.CloseTrobberDiv2(trobberId);
						deferred.reject();
					} else {
						self.currentUploadKey(response.key);
						if (response.sign === true) {
							var precallback = function (thumbprint) {
								signAttachmentHelper.closeWindow();
								self.certificateSelectedCallback(deferred, thumbprint);
							};
							// Запрос у сервера страницы выбора сертификата
							try {
								signAttachmentHelper.getCertThumbAsync('Выберите сертификат для подписи вложений', precallback);
							} catch (e) {
								console.log(e);
							}
							modal.CloseTrobberDiv2(trobberId);
							//Надо ли делать deffered.resolve или deffered.reject в этом месте?
						} else {
							//подпись не нужна, обычная логика
							var formData = new FormData();
							formData.append("fileId", self.fileId);
							formData.append("componentId", self.componentId());
							formData.append("uploadKey", self.currentUploadKey()); //todo test
							var docInfos = self.contentViewModel().items();
							var otherDocInfos = self.contentViewModel().otherItems();
							var issueDate = self.contentViewModel().issueDate();
							var commentary = self.contentViewModel().commentary();

							if (issueDate != null) {
								formData.append("issueDate", issueDate.toUTCString());
							}

							formData.append("commentary", commentary);

							var docInfosModel = []; // легкая версия списка обязательных документов для передачи на сервер
							var otherDocInfosModel = [];

							// получаем список документов с формы сбора документов
							for (var i = 0; i < docInfos.length; i++) {
								var docInfosItem = docInfos[i].infos();
								var modelItem = { title: docInfos[i].title, infos: [] };
								for (var j = 0; j < docInfosItem.length; j++) {
									var infosItem = docInfosItem[j];
									if (infosItem.name != null) {
										formData.append('docInfos_' + i + '_' + j, infosItem.file);
									}
									if (self.submitSection() == false) {
										modelItem.infos.push({
											alias: infosItem.alias(),
											countPage: self.checkNumber(infosItem.countPage()),
											isOrigin: infosItem.isOriginal(),
											name: infosItem.name,
											isFileLoad: infosItem.isFileLoad()
										});
									} else {
										modelItem.infos.push({
											alias: infosItem.alias(),
											name: infosItem.name,
											isFileLoad: infosItem.isFileLoad(),
											isSubmitted: infosItem.isSubmitted(),
											submitDocInfo: self.getSubmitData(infosItem)
										});
									}
								}
								docInfosModel.push(modelItem);
							}
							formData.append("docInfosModel", JSON.stringify(docInfosModel));

							for (var x = 0; x < otherDocInfos.length; x++) {
								var otherDocInfosItem = otherDocInfos[x].infos();
								var otherModelItem = { title: otherDocInfos[x].title, infos: [] };
								for (var y = 0; y < otherDocInfosItem.length; y++) {
									var otherInfosItem = otherDocInfosItem[y];
									if (otherInfosItem.name != null) {
										formData.append('otherDocInfos_' + x + '_' + y, otherInfosItem.file);
									}
									if (self.submitSection() == false) {
										otherModelItem.infos.push({
											alias: otherInfosItem.alias(),
											countPage: self.checkNumber(otherInfosItem.countPage()),
											isOrigin: otherInfosItem.isOriginal(),
											name: otherInfosItem.name,
											isFileLoad: otherInfosItem.isFileLoad()
										});
									} else {
										otherModelItem.infos.push({
											alias: otherInfosItem.alias(),
											name: otherInfosItem.name,
											isFileLoad: otherInfosItem.isFileLoad(),
											isSubmitted: otherInfosItem.isSubmitted(),
											submitDocInfo: self.getSubmitData(otherInfosItem)
										});
									}
								}
								otherDocInfosModel.push(otherModelItem);
							}

							formData.append("otherDocInfosModel", JSON.stringify(otherDocInfosModel));
							var xhr = new XMLHttpRequest();

							xhr.addEventListener("load", function(event) {
								var response = null;
								try {
									response = JSON.parse(this.response);
								} catch(e) {
									//Выводим модальное окно с ошибкой.
									modal.errorModalWindow(this.response);
									//Скрываем индикатор загрузки.
									modal.CloseTrobberDiv2(trobberId);
									console.log(e);
									deferred.reject();
								}
								if (response != null) {
									if (response.hasError) {
										//Выводим модальное окно с ошибкой.
										modal.errorModalWindow(response.errorMessage);
										deferred.reject();
									} else {
										common.FindAndClickLeftPaveTask(response);
										deferred.resolve();
									}
								} else {
									deferred.reject();
								}
								//Скрываем индикатор загрузки.
								modal.CloseTrobberDiv2(trobberId);
							}, false);
							xhr.addEventListener("error", function(event) {
								//Выводим модальное окно с ошибкой.
								modal.errorModalWindow('Не удалось получить данные с сервера о результате операции сохранения контакта.');
								//Скрываем индикатор загрузки.
								modal.CloseTrobberDiv2(trobberId);
								deferred.reject();
							}, false);
							xhr.open('POST', self.host() + '/Nvx.ReDoc.Workflow.UploadDocsForm/SaveUploadDocsForm');
							xhr.setRequestHeader('Accept', 'application/json, text/javascript');
							xhr.withCredentials = true;
							xhr.send(formData);
						}
					}
				}).fail(function(e) {
					console.log(e);
					deferred.reject();
					modal.CloseTrobberDiv2(trobberId);
				});

				return deferred.promise();
			};

			self.getSubmitData = function(element) {
				var submitData = {
					date: element.date(),
					originalPageCount: self.checkNumber(element.originalPageCount()),
					originalSubjectCount: self.checkNumber(element.originalSubjectCount()),
					copyPageCount: self.checkNumber(element.copyPageCount()),
					copySubjectCount: self.checkNumber(element.copySubjectCount())
				};
				return submitData;
			};

			self.checkNumber = function(number) {
				if (number == null || number.length == 0) {
					return 0;
				}
				return number;
			};

			// прикладываю расписку и перехожу на след шаг
			self.goToNextStep = function() {
				var trobberId = modal.CreateTrobberDiv2();
				var formData = new FormData();
				formData.append("fileId", self.fileId);
				formData.append("componentId", self.componentId());
				var fileInput = document.getElementById('uploadDocsSingleFileUpload');
				var file = fileInput.files[0];
				var fileName = encodeURIComponent(file.name);
				formData.append('uploadDocsSingleFileUpload', file);
				formData.append("fileName", fileName);
				var xhr = new XMLHttpRequest();
				xhr.addEventListener("load", function(event) {
					var response = null;
					try {
						response = JSON.parse(this.response);
					} catch(e) {
						//Выводим модальное окно с ошибкой.
						modal.errorModalWindow(this.response);
						//Скрываем индикатор загрузки.
						modal.CloseTrobberDiv2(trobberId);
						console.log(e);
					}
					if (response != null) {
						if (response.hasError) {
							//Выводим модальное окно с ошибкой.
							modal.errorModalWindow(response.errorMessage);
						} else {
							self.showConfirm(false);
							common.FindAndClickLeftPaveTask(response);
						}
					}
					//Скрываем индикатор загрузки.
					modal.CloseTrobberDiv2(trobberId);
				}, false);
				xhr.addEventListener("error", function(event) {
					//Выводим модальное окно с ошибкой.
					modal.errorModalWindow('Не удалось получить данные с сервера о результате операции сохранения контакта.');
					//Скрываем индикатор загрузки.
					modal.CloseTrobberDiv2(trobberId);
				}, false);
				xhr.open('POST', '/Nvx.ReDoc.Workflow.UploadDocsForm/SaveUploadDocsNote');
				xhr.withCredentials = true;
				xhr.send(formData);
			};
		};
		
		UploadDocsFormViewModel.prototype.addColorToTransitionButton = function (transition, callback) {
			var buttonClass = "btn";
			switch (transition.action) {
				case 3:
					transition.actionName = 'Abort';
					break;
				case 0:
					transition.actionName = 'Cancel';
					break;
				case 1:
					transition.actionName = 'Submit';
					break;
				case 2:
					transition.actionName = 'Error';
					break;
			}

			//Добавляем цвет.
			transition.bclass = buttonClass;

			//Добавляем действие.
			transition.onclick = function(data, event) {
				callback(data.actionName, data.to);
			};

			return transition;
		};

		//Заполняем вью-модель данными.
		UploadDocsFormViewModel.prototype.applyData = function(model) {
			var self = this;
			self.taskOpen(model.taskOpen);
			self.contentTemplateId('placeholderTemplate');
			self.showConfirm(false);

			if (model.taskOpen == true) {
				//Кнопки переходов
				var transitions = [];
				model.transitions.forEach(function(transition) {
					transitions.push(self.addColorToTransitionButton(transition, self.goToTransition));
				});
				//Кнопки переходов
				self.transitions(transitions);
			}

			if (model.formType == 'PartReadonly') {
				self.contentViewModel(new PartReadonlyViewModel(model));
				self.contentTemplateId('Nvx.ReDoc.Workflow.UploadDocsForm/Web/View/PartReadonlyView.tmpl.html');
			}

			if (model.formType == 'PartSingleUpload') {
				self.showConfirm(true);
				self.canGoToNext('disabled');
				self.contentViewModel(new PartSingleUploadViewModel(self));
				self.contentTemplateId('Nvx.ReDoc.Workflow.UploadDocsForm/Web/View/PartSingleUploadView.tmpl.html');
			}

			if (model.formType == 'PartForm') {
				// сохраняем тип формы прикладывания документов
				self.submitSection(model.submitSection);

				// если false открываем обычную форму прикладывания документа
				if (model.submitSection == false) {
					self.contentViewModel(new UploadDocsPartFormViewModel(model));
					//разные вьюхи для портала РПГУ и обычного Веб-Редока
					if (self.rpguPortalEnabled()) {
						self.contentTemplateId('Nvx.ReDoc.Workflow.UploadDocsForm/Web/View/UploadDocsPartRpguFormView.tmpl.html');
					} else {
						self.contentTemplateId('Nvx.ReDoc.Workflow.UploadDocsForm/Web/View/UploadDocsPartFormView.tmpl.html');
					}
				} else {
					// если true открываем форму предоставления документов
					self.contentViewModel(new DocsSubmitFormViewModel(model));
					//разные вьюхи для портала РПГУ и обычного Веб-Редока
					if (self.rpguPortalEnabled()) {
						self.contentTemplateId('Nvx.ReDoc.Workflow.UploadDocsRpguForm/Web/View/DocsSubmitRpguFormView.tmpl.html');
					} else {
						self.contentTemplateId('Nvx.ReDoc.Workflow.UploadDocsForm/Web/View/DocsSubmitFormView.tmpl.html');
					}
				}
			}

			if (model.host != null)
				self.host(model.host);
			
			self.fileId = model.fileId;
			self.componentId(model.componentId);
			self.title(model.title);
			//Если есть необязательные документы в количестве 1 штуки, отображаем их сразу без возможности выбора
			if (self.taskOpen() === true && self.contentViewModel() != null && self.contentViewModel().otherItems() != null && self.contentViewModel().otherItems().length === 1) {
				self.contentViewModel().otherItems()[0].otherDocVisible(true);
				self.contentViewModel().haveOtherDoc(false);
			}
			//self.relatedItemsViewModel(new RelatedItemsViewModel(model));
		};

		return UploadDocsFormViewModel;
	});
define('Nvx/UserTypeViewModel',
	[
		'knockout'
	],
	function(ko) {
		var UserTypeViewModel = function() {
			var self = this;

			self.types = ko.observableArray([
				{ title: 'Для граждан', key: 'physical' },
				{ title: 'Для юридических лиц', key: 'juridical' },
				{ title: 'Для предпринимателей', key: 'individual' },
				{ title: 'Для иностранных граждан', key: 'foreigner' }
			]);

			self.activeType = ko.observable();
			self.activeTypeKey = ko.observable();

			self.changeType = function() {
				if (window.sessionStorage) {
					window.sessionStorage.setItem('nvxUserType', this.key);
					window.location.reload();
				}
			};

			self.availTypes = ko.observableArray();
		};

		//Показать весь контент
		UserTypeViewModel.prototype.start = function() {
			var self = this;

			self.availTypes.removeAll();
			
			var key = 'physical';
			if (window.sessionStorage && window.sessionStorage.getItem('nvxUserType') != null) {
				key = window.sessionStorage.getItem('nvxUserType');
			}

			for (var i = 0; i < self.types().length; i++) {
				if (self.types()[i].key == key) {
					self.activeType(self.types()[i].title);
					self.activeTypeKey(self.types()[i].key);
				} else {
					self.availTypes.push(self.types()[i]);
				}
			}
		};

		return UserTypeViewModel;
	});
define('Esb/EsbProblemRequestsViewModel', [ 'knockout', 'jquery' ],
function (ko, $) {
	var EsbProblemRequestsViewModel = function() {
		var self = this;
		self.baseUrl = window.nvxCommonPath.esbRvUrl || 'http://esbtest.egspace.ru:8080/RequestViewer';

		self.allCount = ko.observable(0);
		self.showAllCount = ko.observable(false);

		self.currentCount = ko.observable(0);
		self.showCurCount = ko.observable(false);
		self.list = ko.observableArray([]);
		self.showLoading = ko.observable(true);

		self.start = function() {
			self.loadList();
			self.loadListCount();
		};

		self.loadList = function() {
			$.ajax({
				method: 'GET',
				url: self.baseUrl + '/problemrequests',
				cache: false,
			}).done(function (response) {
				if (response.hasError) {
					console.error(response.message);
				} else {
					self.currentCount(response.current);
					self.showLoading(false);
					self.showCurCount(true);
					self.list(response.list);
				}
			}).fail(function (jqXHR, textStatus, errorThrown) {
				if (jqXHR.responseJSON) {
					console.error(jqXHR.responseJSON.errorMessage + ' Подробности: ' + errorThrown);
				} else {
					console.error(jqXHR.responseText);
				}
			});
		};

		self.loadListCount = function() {
			$.ajax({
				method: 'GET',
				url: self.baseUrl + '/problemrequestscount',
				cache: false,
			}).done(function (response) {
				if (response.hasError) {
					console.error(response.message);
				} else {
					self.allCount(response.all);
					self.showAllCount(true);
				}
			}).fail(function (jqXHR, textStatus, errorThrown) {
				if (jqXHR.responseJSON) {
					console.error(jqXHR.responseJSON.errorMessage + ' Подробности: ' + errorThrown);
				} else {
					console.error(jqXHR.responseText);
				}
			});
		};
	}

	return EsbProblemRequestsViewModel;
});
define('Nvx.ReDoc.MfcUiModule/Web/Resources/Scripts/MfcUiWebController/Wizzard/Step01CustomersViewModel',
	[
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
		'knockout',
		'jquery',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/DefaultController/indexBasePagedViewModel',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Api/selectionState',
		'Nvx.ReDoc.MfcUiModule/Web/Resources/Scripts/MfcUiWebController/mfcCommonMethods',
		'Nvx/wizzardFilterViewModel'
	], function(inherit, ko, $, modal, IndexBasePagedViewModel, selectionState, mfcCommonMethods, wizzardFilterViewModel) {
		var Step01CustomersViewModel = function(parent) {
			var self = this;
			var params = window.getUrlVarsFunction()['params'];
			var jsonParams = null;
			if (params) {
				jsonParams = JSON.parse(decodeURIComponent(params));
			}

			Step01CustomersViewModel.superclass.constructor.apply(self, arguments);

			self.wizzardFilterViewModel = new wizzardFilterViewModel(jsonParams, 'customer', self);
			self.canCreateTreatment = parent.canCreateTreatment;
			self.notComplexCustomer = !parent.isComplexCustomer;
			self.commonMethods = new mfcCommonMethods();
			self.readAboutCustomer = self.commonMethods.readAboutCustomer;
			self.modalDialog = self.commonMethods.modalDialog;
			self.typeToString = self.commonMethods.typeToString;
			parent.userId([]);
			self.selectedCustomers = ko.observableArray();

			self.selectCustomer = function(id, isNewCustomer) {
				if (parent.isComplexCustomer == true) {
					if (isNewCustomer) {
						self.reload();
					}
					self.setSelectionItemById(id);
				} else {
					if (id != 'anonymous') {
						parent.userId.push(id);
						parent.isAnonymous(false);
					} else {
						parent.isAnonymous(true);
					}
					parent.nextStep();
				}
			};

			self.setSelectionItemById = function(id) {

				var index = parent.userId.indexOf(id);
				if (index > -1) {
					parent.userId.splice(index, 1);
				} else {
					parent.userId.push(id);
				}

				var items = self.items();
				for (var i = 0; i < items.length; i++) {
					var item = items[i];
					if (item.id == id) {
						if (item.isSelected() == 'selection') {
							item.isSelected('');
						} else {
							item.isSelected('selection');
						}
					}
				}

				var ids = parent.userId();
				self.selectedCustomers(ids);
				var moveNext = ids.length > 0 ? '' : 'disabled';
				parent.canMoveNext(moveNext);
			};

			self.newCustomer = function() {
				console.log('new customer is not allowed');
			};

			self.listTemplateId('Nvx.ReDoc.MfcUiModule/Web/View/Wizzard/CustomerItemTemplate.tmpl.html');
			self.selectionState(new selectionState({ ownerId: 'customerList' }, '/Nvx.ReDoc.MfcUiModule/Step02CustomersController/CustomersList', { type: 5 }));

			self.reload();
			self.basePageCaption('Все');
		};

		//Наследуемся.
		inherit(Step01CustomersViewModel, IndexBasePagedViewModel);

		Step01CustomersViewModel.prototype.applyResponse = function(response, clearExistsResult) {
			var self = this;
			self.tempItems = response.list;

			for (var i = 0; i < self.tempItems.length; i++) {
				var item = self.tempItems[i];
				var index = self.selectedCustomers.indexOf(item.id);
				var css = '';
				if (index > -1) {
					css = 'selection';
				}
				item.isSelected = ko.observable(css);
			}

			if (clearExistsResult == true) {
				self.items(self.tempItems);
			} else {
				self.items.push.apply(self.items, self.tempItems);
			}

			//Записываем кол-во в объект фильтра.
			self.count(response.count);
			self.showedCount(self.items().length);
			if (typeof self.afterApplyResponse === 'function') {
				self.afterApplyResponse(response, clearExistsResult);
			}
			self.inLoadProgress(false);
			self.initialized(true);
		};

		return Step01CustomersViewModel;
	});
define('Nvx.ReDoc.MfcUiModule/Web/Resources/Scripts/MfcUiWebController/Wizzard/step02ServicesViewModel',
	[
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
		'knockout',
		'jquery',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/DefaultController/indexBasePagedViewModel',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Api/selectionState',
		'Nvx.ReDoc.MfcUiModule/Web/Resources/Scripts/MfcUiWebController/mfcCommonMethods',
		'Nvx/wizzardFilterViewModel'
	], function(inherit, ko, $, modal, IndexBasePagedViewModel, selectionState, mfcCommonMethods, wizzardFilterViewModel) {
		var Step02ServicesViewModel = function(parent) {
			var self = this;

			var params = window.getUrlVarsFunction()['params'];
			var jsonParams = null;
			if (params) {
				jsonParams = JSON.parse(decodeURIComponent(params));
			}

			Step02ServicesViewModel.superclass.constructor.apply(self, arguments);
			self.wizzardFilterViewModel = new wizzardFilterViewModel(jsonParams, 'service', self);
			self.canCreateTreatment = parent.canCreateTreatment;
			self.commonMethods = new mfcCommonMethods();
			self.readAboutServiceInfo = self.commonMethods.readAboutServiceInfo;
			self.serviceTypeToString = self.commonMethods.serviceTypeToString;
			self.modalDialog = self.commonMethods.modalDialog;

			self.selectService = function(id) {
				parent.serviceId(id);
				parent.nextStep();
			};
			self.listTemplateId('Nvx.ReDoc.MfcUiModule/Web/View/Wizzard/ServiceItemTemplate.tmpl.html');
			self.selectionState(new selectionState({ ownerId: 'serviceList' }, '/MfcUiModule/MfcUiWebController/ServiceList', { type: 5 }));

			self.reload();
			self.basePageCaption('Все');
		};

		//Наследуемся.
		inherit(Step02ServicesViewModel, IndexBasePagedViewModel);

		Step02ServicesViewModel.prototype.applyResponse = function(response, clearExistsResult) {
			var self = this;
			self.tempItems = response.list;

			if (clearExistsResult == true) {
				self.items(self.tempItems);
			} else {
				self.items.push.apply(self.items, self.tempItems);
			}

			//Записываем кол-во в объект фильтра.
			self.count(response.count);
			self.showedCount(self.items().length);
			if (typeof self.afterApplyResponse === 'function') {
				self.afterApplyResponse(response, clearExistsResult);
			}
			self.inLoadProgress(false);
			self.initialized(true);
		};

		return Step02ServicesViewModel;
	});
define('Nvx.ReDoc.MfcUiModule/Web/Resources/Scripts/MfcUiWebController/Wizzard/Step03QuestionsViewModel',
	[
		'knockout',
		'jquery',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction'
	], function(ko, $, modal) {
		var Step03QuestionsViewModel = function(parent) {
			var self = this;
			self.questionItems = ko.observableArray();
			self.id = parent.serviceId();
			self.userIds = parent.userId;
			self.hasReject = ko.observable(false);
			self.rejectMessage = ko.observable('');

			self.answerChanged = function(answer) {
				if (answer) {
					var model = { ServiceRecId: self.id, QuestionList: self.getSelectedQuestions(), SelectedAnswer: JSON.stringify(answer) };
					//var trobberId = modal.CreateTrobberDiv2();
					var url = "/" + parent.requestClass() + "/Wizzard/Step3/OnAnswerChanged";
					$.ajax({ url: url, data: model, method: 'POST', headers: { proxy: true } })
						.done(function(response) {
							if (response.hasError) {
								//Выводим модальное окно с ошибкой.
								modal.errorModalWindow(response.errorMessage);
							} else {
								var errorItems = response.rejectList;
								var count = self.questionItems().length;
								var questionsItems = self.questionItems();

								if (response.hasReject == true) {
									self.hasReject(true);
									parent.hasReject(true);
									parent.rejectMessage(response.rejectMessage);
									self.rejectMessage(response.rejectMessage);

									parent.canMoveNext('');
									parent.canSkip('disabled');
									for (var j = 0; j < count; j++) {
										var rejectItem = questionsItems[j];
										var newRejectItem = errorItems[j];
										if (newRejectItem.isReject == true && rejectItem.isVisible() == true) {
											rejectItem.isVisible(false);
											rejectItem.isReject(true);
										}
										rejectItem.hasWarning(false);
										rejectItem.warningMessage('');
									}
									parent.questionItems(questionsItems);
								} else {
									var tempItems = response.list;
									self.hasReject(false);
									parent.hasReject(false);
									self.rejectMessage('');
									parent.rejectMessage('');
									parent.canSkip('');

									var disableMoveNext = false;
									for (var index = 0; index < count; index++) {
										var item = questionsItems[index];
										if (item.isReject() == true && item.isVisible() == false) {
											item.isVisible(true);
											item.isReject(false);
										}
										for (var i = 0; i < tempItems.length; i++) {
											var newItem = tempItems[i];
											if (item.questionId == newItem.questionId) {
												item.isVisible(newItem.isVisible);
												if (newItem.isVisible == false) {
													if (newItem.isMultiAnswers == false) {
														item.singleAnswer(newItem.singleAnswer);
													} else {
														item.selectedAnswers(newItem.selectedAnswers);
													}
												}
											}
										}
										var errorItem = errorItems[index];
										item.hasWarning(errorItem.hasWarning);
										item.warningMessage(errorItem.warningMessage);

										// проверяем проставление ответов по всем вопросам, и если все ответы проставлены делаем возможным перед на след шаг
										if (item.isVisible() == true) {
											if (item.isMultiAnswers() == true) {
												if (item.selectedAnswers() == null || item.selectedAnswers().length == 0) {
													disableMoveNext = true;
												}
											} else {
												if (item.singleAnswer() == null || item.singleAnswer().length == 0) {
													disableMoveNext = true;
												}
											}
										}
									}
									if (disableMoveNext == false) {
										parent.questionItems(questionsItems);
										parent.canSkip('disabled');
										parent.canMoveNext('');
									} else {
										parent.canMoveNext('disabled');
									}


								}
							}
							//modal.CloseTrobberDiv2(trobberId);
						});
				}
				return true;
			};

			// функция извлекает из списка вопросов идентифкаторы вопроса, и идентифктаоры ответа
			self.getSelectedQuestions = function() {
				var tempItems = [];
				var count = self.questionItems().length;
				var questionsItems = self.questionItems();
				for (var index = 0; index < count; index++) {
					var item = questionsItems[index];
					var isMultiAnswerItem = item.isMultiAnswers();
					var singleAnswerItem = '';
					var multiAnswerItem = [];
					if (isMultiAnswerItem == false) {
						singleAnswerItem = item.singleAnswer();
					} else {
						multiAnswerItem = item.selectedAnswers();
					}
					var newItem = { QuestionId: item.questionId, SingleAnswer: singleAnswerItem, SelectedAnswers: multiAnswerItem, IsMultiAnswers: isMultiAnswerItem, HasWarning: item.hasWarning(), IsReject: item.isReject(), IsVisible: item.isVisible() };
					tempItems.push(newItem);
				}
				return JSON.stringify(tempItems);
			};

			// построение опросника
			self.init = function() {

				var searchTrobberId = modal.CreateTrobberDiv2();
				var url = "/" + parent.requestClass() + "/Wizzard/Step3/GetQuestions";
				$.ajax({ url: url, data: { ServiceRecId: self.id, CustomerRecIds: self.userIds }, method: 'POST', headers: { proxy: true } })
					.done(function(response) {
						if (response.hasError) {
							//Выводим модальное окно с ошибкой.
							parent.initStep3(true);
							modal.errorModalWindow(response.errorMessage);
						} else {

							var tempItems = response.list;
							var count = tempItems.length;
							for (var index = 0; index < count; index++) {

								var item = tempItems[index];
								// варианты ответа
								item.answerItems = item.answerList;
								// определяем множественный вариант ответа (true) или однозначный (false)							
								item.isSingleAnswer = ko.observable(false);
								item.hasWarning = ko.observable(false);
								item.warningMessage = ko.observable();
								item.isReject = ko.observable(false);

								// выбранные ответы пользвателя
								if (item.isMultiAnswers == true) {
									item.selectedAnswers = ko.observableArray(item.selectedAnswers);
								} else {
									item.singleAnswer = ko.observable(item.singleAnswer);
									item.isSingleAnswer(true);
								}
								item.isMultiAnswers = ko.observable(item.isMultiAnswers);
								item.isVisible = ko.observable(item.isVisible);
								item.answerChanged = self.answerChanged;
							}
							self.questionItems(tempItems);
							if (count > 0) {
								var answerItem = tempItems[0];
								if (answerItem.isMultiAnswers() == true) {
									self.answerChanged({ answerId: answerItem.selectedAnswers, questionId: answerItem.questionId });
								} else {
									self.answerChanged({ answerId: answerItem.singleAnswer(), questionId: answerItem.questionId });
								}
								if (parent.questionsAnswer) {
									for (var i = 0; i < parent.questionsAnswer.length; i++) {
										var value = parent.questionsAnswer[i];
										for (var j = 0; j < count; j++) {
											var mainValue = tempItems[j];
											if (value.questionId == mainValue.questionId && value.questionId != answerItem.questionId) {
												if (mainValue.isMultiAnswers() == false) {
													mainValue.singleAnswer(value.singleAnswer);
													self.answerChanged({ answerId: value.singleAnswer, questionId: value.questionId });
												} else {
													mainValue.selectedAnswers.push(value.singleAnswer);
													mainValue.answerChanged({ answerId: value.selectedAnswers, questionId: value.questionId });
												}
											}
										}
									}
								}
							}
							parent.initStep3(false, self); // если никаких ошибок нет, то осуществляем переход на 3-шаг опроса
						}
					}).fail(function(jqXHR, textStatus, errorThrown) {
						switch (jqXHR.status) {
						case 403:
							//Перенаправляем на страницу аутентификации.
							var returnUrl = window.location.pathname + window.location.hash;
							returnUrl = encodeURIComponent(returnUrl);
							var redirectUrl = '/WebInterfaceModule/Authentication/Login?returnUrl=' + returnUrl;
							window.location.href = redirectUrl;
						default:
							//Выводим модальное окно с ошибкой.
							modal.errorModalWindow('Не удалось получить с сервера данные. Подробности: ' + errorThrown);
						}
					}).always(function() {
						//Скрываем индикатор загрузки.
						modal.CloseTrobberDiv2(searchTrobberId);
					});
			};
		};

		return Step03QuestionsViewModel;
	});
define('Nvx.ReDoc.MfcUiModule/Web/Resources/Scripts/MfcUiWebController/Wizzard/Step04DepartmentsViewModel',
	[
		'knockout',
		'jquery',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction'
	], function(ko, $, modal) {
		var Step04DepartmentsViewModel = function(parent) {
			var self = this;
			self.id = parent.serviceId();
			self.questionItems = ko.observableArray();
			self.hasError = ko.observable(false);
			self.errorMessage = ko.observable();

			self.answerChanged = function(answer) {
				if (answer) {
					var count = self.questionItems().length;
					var questionsItems = self.questionItems();
					var disableMoveNext = '';

					for (var index = 0; index < count; index++) {
						var item = questionsItems[index];
						if (item.questionId == answer.questionId) {
							item.singleAnswer(answer.answerId);
						}
						if (item.singleAnswer() == null || item.singleAnswer().length == 0) {
							disableMoveNext = 'disabled';
						}
					}

					parent.canMoveNext(disableMoveNext);
					parent.departmentId(answer.answerId);
					parent.departmentItems(questionsItems);
				}
				return true;
			};
			// построение опросника
			self.init = function() {
				var searchTrobberId = modal.CreateTrobberDiv2();
				var url = "/" + parent.requestClass() + "/Wizzard/Step4/GetDepartments";
				$.ajax({ url: url, data: { ServiceRecId: self.id }, headers: { proxy: true }, method: 'POST' })
					.done(function(response) {
						if (response.hasError) {
							//Выводим модальное окно с ошибкой.
							modal.errorModalWindow(response.errorMessage);
							self.hasError(true);
							self.errorMessage(response.errorMessage);
						} else {

							var tempItems = response.list;
							var count = tempItems.length;
							var departmentId = response.departmentId;

							if (departmentId != null && departmentId.length > 0) {
								parent.departmentId(departmentId);
								parent.skipStep4(true);
								parent.nextStep();
							} else {
								for (var index = 0; index < count; index++) {

									var item = tempItems[index];
									// заголовок вопроса
									item.questionTitle = item.questionTitle;
									// варианты ответа
									item.answerItems = item.answerList;
									item.singleAnswer = ko.observable();
									item.answerChanged = self.answerChanged;
								}
								self.questionItems(tempItems);
							}
						}
					}).fail(function(jqXHR, textStatus, errorThrown) {
						switch (jqXHR.status) {
						case 403:
							//Перенаправляем на страницу аутентификации.
							var returnUrl = window.location.pathname + window.location.hash;
							returnUrl = encodeURIComponent(returnUrl);
							var redirectUrl = '/WebInterfaceModule/Authentication/Login?returnUrl=' + returnUrl;
							window.location.href = redirectUrl;
						default:
							//Выводим модальное окно с ошибкой.
							modal.errorModalWindow('Не удалось получить с сервера данные. Подробности: ' + errorThrown);
						}
					}).always(function() {
						//Скрываем индикатор загрузки.
						modal.CloseTrobberDiv2(searchTrobberId);
					});
			};

			self.update = function() {
				var departmentItems = parent.departmentItems();
				self.questionItems(departmentItems);
			};
		};

		return Step04DepartmentsViewModel;
	});
define('Nvx.ReDoc.MfcUiModule/Web/Resources/Scripts/MfcUiWebController/Wizzard/Step05ViewModel',
	[
		'knockout',
		'jquery',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction'
	], function(ko, $, modal) {
		var Step05ViewModel = function(parent) {
			var self = this;
			self.id = parent.serviceId();
			self.hasReject = parent.hasReject();
			self.departmentId = parent.departmentId();
			self.serviceDescription = ko.observable();
			self.wizzardReject = ko.observable();
			self.wizzardAccept = ko.observable();
			self.wizzardNone = ko.observable();

			if (self.hasReject == true) {
				self.wizzardReject(parent.rejectMessage());
			} else {
				var count = parent.questionItems().length;
				if (count == 0) {
					self.wizzardNone('Анкетирование было пропущено. Возможность оказания услуги не определена.');
					parent.isSkipped(true);
				} else {
					self.wizzardAccept('Услуга может быть оказана заявителю');
				}
			}

			self.printInfo = function() {

				var divToPrint = document.getElementById('printServiceInfo');
				var newWin = window.open("", 'to_print');
				newWin.document.write(divToPrint.outerHTML);
				newWin.document.close();
				newWin.focus();
				newWin.print();
			};

			self.init = function(data) {
				var searchTrobberId = modal.CreateTrobberDiv2();
				var url = "/" + parent.requestClass() + "/Wizzard/Step5/GetServiceInfoFromWizard";
				$.ajax({ url: url, data: data, method: 'POST', headers: { proxy: true } })
					.done(function(response) {
						if (response.hasError) {
							//Выводим модальное окно с ошибкой.
							modal.errorModalWindow(response.errorMessage);
						} else {
							self.serviceDescription(response.serviceDescription);
						}
					}).fail(function(jqXHR, textStatus, errorThrown) {
						switch (jqXHR.status) {
						case 403:
							//Перенаправляем на страницу аутентификации.
							var returnUrl = window.location.pathname + window.location.hash;
							returnUrl = encodeURIComponent(returnUrl);
							var redirectUrl = '/WebInterfaceModule/Authentication/Login?returnUrl=' + returnUrl;
							window.location.href = redirectUrl;
						default:
							//Выводим модальное окно с ошибкой.
							modal.errorModalWindow('Не удалось получить с сервера данные. Подробности: ' + errorThrown);
						}
					}).always(function() {
						//Скрываем индикатор загрузки.
						modal.CloseTrobberDiv2(searchTrobberId);
					});
			};
		};
		return Step05ViewModel;
	});
define('Nvx/wizzardFilterViewModel',
	[
		'knockout',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Api/selectionState',
		'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/knockout/customBindingHandlers'
	], function(ko, selectionState) {

		var timerId = 'wizzardFilterTimer';
		var wizzardFilterViewModel = function(jsonParams, type, parent) {
			var self = this;
			self.templateId = ko.observable(null);

			var title = null;
			if (jsonParams) {
				title = jsonParams.title;
			}

			self.timedSubmit = function(timeout) {
				var timeoutValue = 300;
				if (timeout) {
					timeoutValue = timeout;
				}
				var timer = $(this).data(timerId);
				if (timer) {
					clearTimeout($(this).data(timerId));
					$(this).data(timerId, setTimeout(function() {
						self.filterSubmit();
					}, timeoutValue));
				} else {
					self.filterSubmit();
					$(this).data(timerId, 'fake');
				}
			};

			self.filterSubmit = function() {

				if (type == 'service') {
					parent.selectionState(new selectionState({ ownerId: 'serviceList' }, '/MfcUiModule/MfcUiWebController/ServiceList', { name: self.title(), type: 5 }));
				} else {
					parent.selectionState(new selectionState({ ownerId: 'customerList' }, '/Nvx.ReDoc.MfcUiModule/Step02CustomersController/CustomersList', { name: self.title(), type: 5 }));
				}
				parent.reload();
			};

			if (title) {
				self.title = ko.observable(title);
			} else {
				self.title = ko.observable(null);
			}

			self.title.subscribe(function(newValue) {
				self.timedSubmit();
			});

		};

		return wizzardFilterViewModel;
	});
define('Nvx/wizzardPagerViewModel',
	[
		'knockout',
		'jquery',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'Nvx.ReDoc.MfcUiModule/Web/Resources/Scripts/MfcUiWebController/Wizzard/Step01CustomersViewModel',
		'Nvx.ReDoc.MfcUiModule/Web/Resources/Scripts/MfcUiWebController/Wizzard/step02ServicesViewModel',
		'Nvx.ReDoc.MfcUiModule/Web/Resources/Scripts/MfcUiWebController/Wizzard/Step03QuestionsViewModel',
		'Nvx.ReDoc.MfcUiModule/Web/Resources/Scripts/MfcUiWebController/Wizzard/Step04DepartmentsViewModel',
		'Nvx.ReDoc.MfcUiModule/Web/Resources/Scripts/MfcUiWebController/Wizzard/Step05ViewModel',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Api/selectionState',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Navigation/primaryMenuUrlBuilder',
		'jquery.cookie'
	], function(ko, $, modal, Step01CustomersViewModel, Step02ServicesViewModel, Step03QuestionsViewModel, Step04DepartmentsViewModel, Step05ViewModel, selectionState, primaryMenuUrlBuilder) {
		var WizzardPagerViewModel = function(stepNum, id, key, isRpgu) {

			var self = this;

			self.stepName = ko.observable(); // наименование текущего шага
			self.numStep = ko.observable(1); // номер текущего шага по логике перехода по шагам
			self.outNumStep = isRpgu == true ? ko.observable(0) : ko.observable(1); // номер шага по порядку для отображения
			self.countSteps = isRpgu == true ? ko.observable(2) : ko.observable(4); // общее количество шагов для отображения
			self.listTemplateId = ko.observable('placeholderTemplate'); // идентфикатор шаблона шага
			self.userId = ko.observableArray(); // идентификатор заявителя
			self.serviceId = ko.observable(''); // идентификатор выбранной услуги
			self.viewModel = ko.observable(null); // модель данных отображаемого шаблона
			self.showWizzardNav = ko.observable(true); // отображать блок управления визарда начиная с 1 шага
			self.canMoveNext = ko.observable('disabled'); // блокировка кнопки перехода на след шаг, пока не выбраны все варианты
			self.showMoveNext = ko.observable(false);
			self.canSkip = ko.observable(''); // блокировать кнопку пропустить только на 3 шаге
			self.showSkip = ko.observable(false); // отображать кнопку пропустить только на 3 шаге

			self.showWizzardResult = ko.observable(false);
			self.canCreateFile = ko.observable(true); // управление отображением кнопки создания дела

			self.departmentId = ko.observable(); // идентификатор ведомства		
			self.questionItems = ko.observableArray(); // сохраняем все вопросы и ответы

			self.departmentItems = ko.observableArray(); // выбор органа власти для отправки запроса
			self.rejectMessage = ko.observable(); // сообщение об отказе, если возник
			self.hasReject = ko.observable(false); // true - в оказании отказано
			self.isSkipped = ko.observable(false); // true - опросник был пропущен
			self.skipStep4 = ko.observable(false);
			self.isComplexCustomer = false;
			if (stepNum == 'ccservice') {
				stepNum = 'service';
				self.isComplexCustomer = true;
			}
			self.startStep = stepNum;
			self.requestClass = ko.observable('MfcUiModule');
			self.createFileTitle = ko.observable('Создать дело');
			self.step3ViewModel = ko.observable(null);
			self.step4ViewModel = ko.observable(null);
			self.isAnonymous = ko.observable(false);

			self.isRpgu = isRpgu;

			//Реакция на нажатие кнопки назад
			self.previousStep = function() {
				var curStep = self.numStep();

				if (curStep == 4 && (self.skipStep4() == true || self.hasReject() == true)) {
					curStep = curStep - 1;
				}

				self.numStep(curStep - 1);

				if (isRpgu == true && self.numStep() == 1) {
					self.numStep(0);
				}

				if (self.numStep() == 0) {
					self.cancelTreatment();
				}

				if (self.numStep() == 1) {
					self.listTemplateId('placeholderTemplate');
					self.showSkip(false);

					self.clearObjects();

					if (self.startStep == 'service' || self.startStep == 'treatment' || self.startStep == 'newtreatment') {
						self.stepName('Выберите заявителя');
						self.showMoveNext(self.isComplexCustomer);
						if (self.isComplexCustomer == true) {
							self.canMoveNext('disabled');
						}
						self.viewModel(new Step01CustomersViewModel(self));
					}
					if (self.startStep == 'customer') {
						self.stepName('Выберите услугу');
						self.showMoveNext(false);
						self.viewModel(new Step02ServicesViewModel(self));
					}
					self.listTemplateId('Nvx.ReDoc.MfcUiModule/Web/View/Wizzard/Step01CustomersTemplate.tmpl.html');
				}

				if (self.numStep() == 2) {
					self.stepName('Заполните анкету заявителя');
					self.listTemplateId('placeholderTemplate');
					self.viewModel(self.step3ViewModel());
					self.listTemplateId('Nvx.ReDoc.MfcUiModule/Web/View/Wizzard/Step03QuestionsTemplate.tmpl.html');
					if (self.isSkipped() == false) {
						self.canMoveNext('');
					} else {
						self.viewModel().init();
						self.isSkipped(false);
					}
					self.showWizzardResult(false);
					self.showWizzardNav(true);
					if (isRpgu === true) {
						self.showSkip(false);
					} else {
						self.showSkip(true);
					}
					self.showMoveNext(true);
				}

				if (self.numStep() == 3) {

					self.stepName('Орган государственной власти');
					self.listTemplateId('placeholderTemplate');
					self.viewModel(self.step4ViewModel());
					self.listTemplateId('Nvx.ReDoc.MfcUiModule/Web/View/Wizzard/Step04DepartmentsTemplate.tmpl.html');
					self.showWizzardResult(false);
					self.showWizzardNav(true);
					var tempDepartmentId = self.departmentId();
					if (tempDepartmentId != null && tempDepartmentId.length > 0) {
						self.canMoveNext('');
					} else {
						self.canMoveNext('disabled');
					}
					self.showSkip(false);
				}

				if (self.isRpgu == true) {
					self.outNumStep(self.outNumStep() - 1);
				} else {
					self.outNumStep(self.numStep());
				}
			};

			self.initStep3 = function(hasError, vm) {
				var curStep = self.numStep();
				if (hasError == false) {
					self.listTemplateId('placeholderTemplate');
					self.viewModel(vm);
					self.step3ViewModel(vm);
					self.stepName('Заполните анкету заявителя');
					self.listTemplateId('Nvx.ReDoc.MfcUiModule/Web/View/Wizzard/Step03QuestionsTemplate.tmpl.html');
					self.showWizzardResult(false);
					self.showWizzardNav(true);
					if (isRpgu === true) {
						self.showSkip(false);
					} else {
						self.showSkip(true);
					}
					self.showMoveNext(true);
				} else {
					self.numStep(curStep - 1);

					if (self.isRpgu != true) {
						self.outNumStep(self.numStep());
					}
				}
			};

			//Реакция на нажатие кнопки далее
			self.nextStep = function () {
				var curStep = self.numStep();
				if (curStep == 2 && (self.skipStep4() == true || self.hasReject() == true)) {
					curStep = curStep + 1;
				}
				self.numStep(curStep + 1);

				if (self.numStep() == 2) {
					if (self.step3ViewModel() == null) {
						var vm = new Step03QuestionsViewModel(self);
						vm.init();
					} else {
						self.initStep3(false, self.step3ViewModel());
					}
					// если опросник для РПГУ то сразу отображаем панель с возможностью создания дела
					if (isRpgu == true) {
						self.showSkip(false);
					} else {
						self.showSkip(true);
					}

					if (self.isRpgu == true) {
						self.outNumStep(self.outNumStep() + 1);
					}
				}
				if (self.numStep() == 3) {
					self.stepName('Орган государственной власти');
					self.listTemplateId('placeholderTemplate');
					self.canMoveNext('disabled');

					if (self.step4ViewModel() == null) {
						var vm2 = new Step04DepartmentsViewModel(self);
						self.step4ViewModel(vm2);
						self.viewModel(vm2);
						vm2.init();
					} else {
						var tempVm = self.step4ViewModel();
						self.viewModel(tempVm);
						var tempDepartmentId = self.departmentId();
						if (tempDepartmentId != null && tempDepartmentId.length > 0) {
							self.canMoveNext('');
						}
					}

					self.listTemplateId('Nvx.ReDoc.MfcUiModule/Web/View/Wizzard/Step04DepartmentsTemplate.tmpl.html');
					self.showSkip(false);
				}
				if (self.numStep() == 4) {
					self.stepName('Результат');
					self.listTemplateId('placeholderTemplate');
					self.viewModel(new Step05ViewModel(self));
					self.listTemplateId('Nvx.ReDoc.MfcUiModule/Web/View/Wizzard/Step05Template.tmpl.html');
					var data = { ServiceRecId: self.serviceId(), QuestionList: self.getQuestions(), DepartmentId: self.departmentId(), IsSkipped: self.isSkipped };
					self.viewModel().init(data);
					self.showWizzardResult(true);
					self.showWizzardNav(false);

					if (self.hasReject() == true || (self.isAnonymous() == true && isRpgu != true)) {
						self.canCreateFile(false);
					} else {
						self.canCreateFile(true);
					}

					if (self.isRpgu == true) {
						self.outNumStep(self.outNumStep() + 1);
					}
				}

				if (self.isRpgu != true) {
					self.outNumStep(self.numStep());
				}
			};

			// отмена оформления обращения
			self.cancelTreatment = function() {

				if (isRpgu == true) {
					history.back();
					return;
				}

				if (self.startStep == 'service' || self.startStep == 'treatment' || self.startStep == 'newtreatment') {
					var serviceNav = new selectionState({ ownerId: 'serviceList', secondaryMenuItemId: 'services_all' }, '/MfcUiModule/MfcUiWebController/ServiceGroupsList', { type: 5, sortBy: 'FullName', sortOrder: 'ASC', groupBy: '' });
					var hash1 = primaryMenuUrlBuilder.getPath(serviceNav);
					window.location = hash1; //todo test
					//navigation.navigate(hash1);
				}

				if (self.startStep == 'customer') {
					var customerNav = new selectionState({ ownerId: 'customerList', secondaryMenuItemId: 'customers_all' }, '/MfcUiModule/MfcUiWebController/CustomersGroupsList', { type: 5, sortBy: 'FullName', sortOrder: 'ASC', groupBy: '' });
					var hash2 = primaryMenuUrlBuilder.getPath(customerNav);
					window.location = hash2; //todo test
					//navigation.navigate(hash2);
				}
			};

			// регистрация обращения заявителя
			self.registerTreatment = function() {
				// в случае анонимного заявителя просто завершаем консультацию
				if (self.isAnonymous() == true) {
					self.cancelTreatment();
					return;
				}
				// в случае выбранного заявителя сохраняем результаты анкетирования
				var searchTrobberId = modal.CreateTrobberDiv2();
				$.ajax({
					url: "/MfcUiModule/Wizzard/Step5/RegisterTreatment",
					data: { ServiceRecId: self.serviceId(), CustomerRecIds: self.userId, QuestionList: self.getQuestions(), IsSkipped: self.isSkipped(), RejectReason: self.rejectMessage() },
					method: 'POST',
					headers: { proxy: true }
				})
					.done(function(response) {
						if (response.hasError) {
							//Выводим модальное окно с ошибкой.
							modal.errorModalWindow(response.errorMessage);
						} else {
							self.cancelTreatment();
						}
					}).fail(function(jqXHR, textStatus, errorThrown) {
						switch (jqXHR.status) {
						case 403:
							//Перенаправляем на страницу аутентификации.
							window.location.href = window.nvxCommonPath.authRedirectPath;
						default:
							//Выводим модальное окно с ошибкой.
							modal.errorModalWindow('Не удалось получить с сервера данные. Подробности: ' + errorThrown);
						}
					}).always(function() {
						//Скрываем индикатор загрузки.
						modal.CloseTrobberDiv2(searchTrobberId);
					});
			};

			// построение опросника
			self.createFile = function() {
				// избавляемся от старых данных если они есть
				$.cookie('create_file_data', null, { path: '/' });
				var data = { ServiceRecId: self.serviceId(), CustomerRecIds: self.userId, QuestionList: self.getQuestions(), DepartmentId: self.departmentId(), IsSkipped: self.isSkipped, RejectReason: self.rejectMessage() };
				if (isRpgu == true) {
					var searchTrobberId = modal.CreateTrobberDiv2();
					$.ajax({ url: "/Rpgu/Wizzard/Step5/IsAuth", method: 'GET', headers: { proxy: true } })
						.done(function(response) {
							if (response.isAuth == true) {
								self.createFileRequest(data);
							} else {
								$.cookie('create_file_data', JSON.stringify(data), { path: '/' });
								window.location.href = window.nvxCommonPath.authRedirectPath; //response.redirectUrl;
							}
						}).always(function() {
							//Скрываем индикатор загрузки.
							modal.CloseTrobberDiv2(searchTrobberId);
						});
				} else {
					self.createFileRequest(data);
				}
			};

			// создание дела через РПГУ
			self.createFileRpgu = function() {
				var fileData = $.cookie('create_file_data');
				if (fileData == null) {
					return;
				}
				$.cookie('create_file_data', null, { path: '/' });
				try {
					var data = JSON.parse(fileData);
					self.createFileRequest(data);
				} catch(e) {
					console.log(e);
				}
			};

			// запрос на сервер создание дела
			self.createFileRequest = function(data) {
				var searchTrobberId = modal.CreateTrobberDiv2();
				var url = "/" + self.requestClass() + "/Wizzard/Step5/CreateFile";
				$.ajax({ url: url, data: data, headers: { proxy: true }, method: 'POST' })
					.done(function(response) {
						if (response.hasError) {
							//Выводим модальное окно с ошибкой.
							self.canCreateFile(false);
							self.isAnonymous(true);
							modal.errorModalWindow(response.errorMessage);
						} else {
							if (response.redirectUrl) {
								window.location = response.redirectUrl;
							} else {
								var fileUrl = (window.nvxCommonPath != null ? window.nvxCommonPath.formView : '/cabinet/request/index.php?fileId=') + response.fileId;
								//Переходим к вновь созданному делу
								window.location = fileUrl;
							}
						}
					}).fail(function(jqXHR, textStatus, errorThrown) {
						switch (jqXHR.status) {
						case 403:
							//Перенаправляем на страницу аутентификации.
							window.location.href = window.nvxCommonPath.authRedirectPath;
						default:
							//Выводим модальное окно с ошибкой.
							self.canCreateFile(false);
							self.isAnonymous(true);
							modal.errorModalWindow('Не удалось получить с сервера данные. Подробности: ' + errorThrown);
						}
					}).always(function() {
						//Скрываем индикатор загрузки.
						modal.CloseTrobberDiv2(searchTrobberId);
					});
			};

			// функция извлекает из списка вопросов нужные данные
			self.getQuestions = function() {
				var tempItems = [];
				var count = self.questionItems().length;
				var questionsItems = self.questionItems();
				for (var index = 0; index < count; index++) {
					var item = questionsItems[index];
					if (item.isVisible() == true) {
						var isMultiAnswerItem = item.isMultiAnswers();
						var singleAnswerItem = '';
						var multiAnswerItem = [];
						if (isMultiAnswerItem == false) {
							singleAnswerItem = item.singleAnswer();
						} else {
							multiAnswerItem = item.selectedAnswers();
						}

						var newItem = { QuestionId: item.questionId, SingleAnswer: singleAnswerItem, SelectedAnswers: multiAnswerItem, IsMultiAnswers: isMultiAnswerItem, IsVisible: item.isVisible() };
						tempItems.push(newItem);
					}

				}
				return JSON.stringify(tempItems);
			};

			self.skipConsult = function() {
				self.questionItems([]);
				self.isSkipped(true);
				self.nextStep();
			};

			self.clearObjects = function() {
				self.step3ViewModel(null);
				self.step4ViewModel(null);
				self.departmentId('');
				self.questionItems([]);
				self.departmentItems([]);
				self.rejectMessage('');
				self.hasReject(false);
				self.isSkipped(false);
				self.skipStep4(false);
			};

			if (stepNum == 'rpgu_createFile') {
				self.requestClass('Rpgu');
				self.createFileRpgu();
			}

			if (stepNum == 'treatment') {
				self.serviceId(id);

				var searchTrobberId = modal.CreateTrobberDiv2();
				$.ajax({
					url: "/Nvx.ReDoc.MfcUiModule/Step02CustomersController/GetTreatmentById",
					data: { RecId: key },
					method: 'POST',
					headers: { proxy: true }
				})
					.done(function(response) {
						if (response.hasError) {
							//Выводим модальное окно с ошибкой.
							modal.errorModalWindow(response.errorMessage);
						} else {
							self.userId.push(response.customerId);
							self.questionsAnswer = response.list;
							self.nextStep();
						}
					}).fail(function(jqXHR, textStatus, errorThrown) {
						switch (jqXHR.status) {
						case 403:
							//Перенаправляем на страницу аутентификации.
							window.location.href = window.nvxCommonPath.authRedirectPath;
						default:
							//Выводим модальное окно с ошибкой.
							modal.errorModalWindow('Не удалось получить с сервера данные. Подробности: ' + errorThrown);
						}
					}).always(function() {
						//Скрываем индикатор загрузки.
						modal.CloseTrobberDiv2(searchTrobberId);
					});
			}
			if (stepNum == 'newtreatment') {
				if (isRpgu == true) {
					self.requestClass('Rpgu');
					self.createFileTitle('Оформить заявление');
				}
				self.serviceId(id);
				if (key == 'anonymous') {
					self.userId([]);
					self.isAnonymous(true);
				} else {
					self.userId.push(key);
					self.isAnonymous(false);
				}
				self.nextStep();
			} else {
				self.listTemplateId('Nvx.ReDoc.MfcUiModule/Web/View/Wizzard/Step01CustomersTemplate.tmpl.html');
				self.canCreateTreatment = false; // показываем что пришли к шагу при создании обращения и новое создавать не требуется
				if (stepNum == 'service') {
					self.stepName('Выберите заявителя');
					self.viewModel(new Step01CustomersViewModel(self));
					self.serviceId(id);
					self.showMoveNext(self.isComplexCustomer);
				}
				if (stepNum == 'customer') {
					self.stepName('Выберите услугу');
					self.viewModel(new Step02ServicesViewModel(self));
					self.userId.push(id);
				}
			}
		};

		return WizzardPagerViewModel;
	});
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/DefaultController/GroupViewModel',
	[
		'knockout'
	],
	function (ko) {
		//для создания раличных вью-моделей групп я использую "множественное наследование", пример можно посмотреть в FileGroupViewModel
		var GroupViewModel = function (group, selectionState) {
			var self = this;
			self.groupTitle = '';
			self.groupId = '';

			//показывать группы развернутыми
			self.minimizedGroup = ko.observable(false);

			self.items(group.list);
			self.count(group.count);
			self.showedCount(self.items().length);

			self.groupTitle = group.groupTitle;
			self.groupId = group.groupId;
			self.selectionState(selectionState);
			self.initialized = ko.observable(true);
			self.beforeApplySelectionState = function (selectionState, clearExistsResult) {
				var self = this;
				selectionState.params['groupId'] = self.groupId;
			};
		};

		return GroupViewModel;
	});
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/DefaultController/indexBasePagedViewModel',
	[
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
		'knockout',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Api/pagedViewModel'
	],
	function(inherit, ko, pagedViewModel) {
		var indexBasePagedViewModel = function() {
			var self = this;

			//Заголовок.
			self.title = ko.observable(null);

			self.showPageControls = ko.observable(false);
			//Вызываем конструктор родителя.
			indexBasePagedViewModel.superclass.constructor.apply(self, arguments);
		};
		
		//Наследуемся.
		inherit(indexBasePagedViewModel, pagedViewModel);

		indexBasePagedViewModel.prototype.beforeApplySelectionState = function(selectionState, clearExistsResult) {
			if (clearExistsResult === true) {
				this.showPageControls(false);
			}
		};

		indexBasePagedViewModel.prototype.afterApplyResponse = function(response, clearExistsResult) {
			this.showPageControls(true);
		};

		indexBasePagedViewModel.prototype.beforeApplyResponse = function(response, clearExistsResult) {
		};

		return indexBasePagedViewModel;
	});
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Navigation/navigation',
	['Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Navigation/router'], function (router) {
	//Объект-обертка для библиотеки навигации.
	//Так проще, если-таки вкручивать адекватную систему навигации, а не эту костыльную (https://github.com/jgallen23/routie) оставлять.
	var Navigation = function () {
		var self = this;
		//Зарегестрированные маршруты.
		self.registeredRoutes = [];
		self.beforeNavigationFunctions = [];
		//реализация объекта для хранения функций которые должны вызываться до перехода по пути
		self.beforeNavigationPipeline = {
			addToPipe: function (func) {
				if (typeof func === "function") {
					self.beforeNavigationFunctions.push(func);
				} else {
					throw new Error("параметр метода addToPipe должен быть функция");
				}
			},
			removeFromPipe: function (func) {
				var beforeNavigationFunctions = self.beforeNavigationFunctions;
				for (var i = 0; i < beforeNavigationFunctions.length; i++) {
					if (beforeNavigationFunctions[i] === func) {
						beforeNavigationFunctions.splice(i, 1);
					}
				}
			}
		};

		//вызов функций которые должны вызываться до перехода по пути
		self.beforeNavigation = function () {
			var beforeNavigationFunctions = self.beforeNavigationFunctions;
			for (var i = 0; i < beforeNavigationFunctions.length; i++) {
				beforeNavigationFunctions[i]();
			}
		};

		//Регистрация маршрута.
		self.registerRoute = function (name, callback) {
			//Запоминаем зарегистрированный маршрут в собственном массиве.
			self.registeredRoutes.push({ route: name, action: callback });
			//Регистрируем маршрут в сторонней библиотеке навигации.
			router(name, callback, false);
		};
		//Переход по маршруту.
		self.navigate = function (path, options, pageTitle) {
			//вызов функций которые должны вызываться до перехода по пути
			self.beforeNavigation();
			//переход по пути
			router.navigate(path, options, pageTitle);
		};
		//Начинаем прослушивать изменения хеша адресной строки.
		self.start = function() {
			router.apply();
		};
	};

	//добавить вызов функции func до перехода по пути
	Navigation.prototype.addBeforeNavigation = function (func) {
		var self = this;
		self.beforeNavigationPipeline.addToPipe(func);
	};

	//удалить вызов функции func до перехода по пути
	Navigation.prototype.removeBeforeNavigation = function (func) {
		var self = this;
		self.beforeNavigationPipeline.removeFromPipe(func);
	};

	return new Navigation();
});
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/DefaultController/serviceMenuItem',
	[
		'jquery',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Api/selectionState',
		'Nvx.ReDoc.MfcUiModule/Web/Resources/Scripts/MfcUiWebController/mfcPagedViewModel',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/DefaultController/MfcGroupPagedViewModel',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Navigation/primaryMenuItem',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Navigation/navigation'
	], function($, selectionState, pagedViewModelFactory, MfcGroupPagedViewModel, menuItemFactory, navigation) {

		var serviceListUrl = '/MfcUiModule/MfcUiWebController/ServiceList';
		var serviceGroupListUrl = '/MfcUiModule/MfcUiWebController/ServiceGroupsList';

		var serviceMenuItem = function(menuActionNoRedirect) {

			//Создаем экземпляр элемента "" для первичного меню.
			var menuItem = new menuItemFactory('serviceList', 'Услуги', 'icon icon-new-service-white');

			//Идентификатор шаблона фильтра.
			menuItem.filterTemplateId = 'Nvx.ReDoc.MfcUiModule/Web/View/MfcUiWebController/serviceFilterTemplate.tmpl.html';

			menuItem.filterModuleName = 'Nvx.ReDoc.MfcUiModule/Web/Resources/Scripts/MfcUiWebController/serviceFilter';

			//Выбранный элемент по-умолчанию.
			menuItem.defaultSelectedId = 'services_all';

			menuItem.cssClasses = 'icon icon-new-service-white';
			menuItem.pageTemplate = 'Nvx.ReDoc.WebInterfaceModule/View/DefaultController/basePagerTemplate.tmpl.html';
			menuItem.listTemplateId = 'Nvx.ReDoc.MfcUiModule/Web/View/MfcUiWebController/serviceListTemplate.tmpl.html';
			menuItem.pagedViewModelFactory = pagedViewModelFactory;
			menuItem.priority = 40;

			menuItem.url = serviceListUrl;

			if (menuActionNoRedirect) {

				//Элементы вторичного меню.
				var servicesAll = new menuItemFactory('services_all', 'Все', '');
				servicesAll.selectionState = new selectionState(
					{ ownerId: 'serviceList', secondaryMenuItemId: 'services_all' },
					serviceGroupListUrl,
					{ type: 5 },
					'Услуги - Все'
				);

				var servicePhysical = new menuItemFactory('service_physical', 'Физические лица', '');
				servicePhysical.selectionState = new selectionState(
					{ ownerId: 'serviceList', secondaryMenuItemId: 'service_physical' },
					serviceGroupListUrl,
					{ type: 1 },
					'Услуги - Физические лица'
				);

				var serviceIndividual = new menuItemFactory('service_individual', 'Индивидуальные предприниматели', '');
				serviceIndividual.selectionState = new selectionState(
					{ ownerId: 'serviceList', secondaryMenuItemId: 'service_individual' },
					serviceGroupListUrl,
					{ type: 2 },
					'Услуги - Индивидуальные предприниматели'
				);

				var serviceJuridical = new menuItemFactory('service_juridical', 'Юридические лица', '');
				serviceJuridical.selectionState = new selectionState(
					{ ownerId: 'serviceList', secondaryMenuItemId: 'service_juridical' },
					serviceGroupListUrl,
					{ type: 3 },
					'Услуги - Юридические лица'
				);

				var serviceForeigner = new menuItemFactory('service_foreigner', 'Иностранные граждане', '');
				serviceForeigner.selectionState = new selectionState(
					{ ownerId: 'serviceList', secondaryMenuItemId: 'service_foreigner' },
					serviceGroupListUrl,
					{ type: 4 },
					'Услуги - Иностранные граждане'
				);

				menuItem.items.push(servicesAll);
				menuItem.items.push(servicePhysical);
				menuItem.items.push(serviceIndividual);
				menuItem.items.push(serviceJuridical);
				menuItem.items.push(serviceForeigner);

				var index;
				for (index = 0; index < menuItem.items().length; ++index) {
					var item = menuItem.items()[index];
					item.pageTemplate = 'Nvx.ReDoc.WebInterfaceModule/View/DefaultController/groupedPagerTemplate.tmpl.html';
					item.listTemplateId = 'Nvx.ReDoc.MfcUiModule/Web/View/MfcUiWebController/serviceListTemplate.tmpl.html';
					item.pagedViewModelFactory = MfcGroupPagedViewModel;

					item.selectionState.params.sortBy = 'FullName';
					item.selectionState.params.sortOrder = 'ASC';
					item.selectionState.params.groupBy = '';

					item.sorts = [
						{
							title: 'По алфавиту (А-Я)',
							sortBy: 'FullName',
							sortOrder: 'ASC'
						},
						{
							title: 'По алфавиту (Я-А)',
							sortBy: 'FullName',
							sortOrder: 'DESC'
						}
					];
					if (item.id === 'services_all') {
						item.groups = [
							{
								title: 'Не группировать',
								groupBy: ''
							},
							{
								title: 'По категориям',
								groupBy: 'Category'
							},
							{
								title: 'По жизненным обстоятельствам',
								groupBy: 'LifeSituation'
							},
							{
								title: 'По ведомствам',
								groupBy: 'Department'
							},
							{
								title: 'По популярности',
								groupBy: 'Popular'
							}
						];
						item.pageTitle = 'Услуги';

						item.filters = [
							{
								title: 'Всех',
								filterBy: 'all'
							},
							{
								title: 'Физических лиц',
								filterBy: 'physical'
							},
							{
								title: 'Индивидуальных предпринимателей',
								filterBy: 'individual'
							},
							{
								title: 'Юридических лиц',
								filterBy: 'juridical'
							},
							{
								title: 'Иностранных граждан',
								filterBy: 'foreigner'
							}
						];
					} else {
						item.groups = [
							{
								title: 'Не группировать',
								groupBy: ''
							}
						];
						item.pageTitle = item.title;
					}

					item.action = function() {
						var hash = this.getPath(this.selectionState);
						navigation.navigate(hash, null, this.selectionState.pageTitle);
					};
				}
			} else {
				menuItem.action = function() {
					window.location.href = '/WebInterfaceModule/Default/?ownerId=' + menuItem.id + '&secondaryMenuItemId=' + menuItem.defaultSelectedId;
				};
			}

			return menuItem;
		};
		
		return serviceMenuItem;
	});
//Класс-конструктор для создания экземпляров пунктов первичного меню (Дела, Задачи).
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Api/pagedViewModel',
[
	'knockout',
	'jquery',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction'
], function (ko, $, modal) {
	var pagedViewModel = function () {
		var self = this;
		self.basePageCaption = ko.observable('Все');
		//Кол-во записей всего.
		self.count = ko.observable(0);
		//Количество страниц, которое нужно пропустить перед возвращением результата.
		self.skipPageCount = 0;
		//Отображаем ли кнопку "Еще".
		self.showNextButton = ko.observable(false);
		//Кол-во отображенных записей.
		self.showedCount = ko.observable(0).extend({ notify: 'always' });
		//Отслеживаем изменения.
		self.showedCount.subscribe(function () {
			self.check();
		});

		self.selectionState = ko.observable(null);

		//элементы списка
		//self.listViewModel = new listViewModel();
		self.items = ko.observableArray();
		//шаблон для элементов списка
		self.listTemplateId = ko.observable('placeholderTemplate');

		//указывает что происходит обработка установленых условий(true пока производятся модификации внутренней selectionState и url, запрос к серверу и применение ответа сервера)
		self.inLoadProgress = ko.observable(false);

		//
		self.initialized = ko.observable(false);
	};

	//Реакция на изменение количества записей
	pagedViewModel.prototype.check = function () {
		var self = this;
		if (self.count() > self.showedCount()) {
			self.showNextButton(true);
		} else {
			self.showNextButton(false);
		}
	};

	pagedViewModel.prototype.applyResponse = function (response, clearExistsResult) {
		var self = this;
		//console.log('pagedViewModel.prototype.applyResponse');
		if (clearExistsResult == true) {
			self.items(response.list);
		} else {
			self.items.push.apply(self.items, response.list);
		}
		//Записываем кол-во в объект фильтра.
		self.count(response.count);
		self.showedCount(self.items().length);	
		if (typeof self.afterApplyResponse === 'function') {
			self.afterApplyResponse(response, clearExistsResult);
		}
		self.inLoadProgress(false);
		self.initialized(true);
	};

	//pagedViewModel.prototype.beforeApplySelectionState = function (selectionState, clearExistsResult) { };

	//pagedViewModel.prototype.afterApplyResponse = function (response, clearExistsResult) { };

	//Реакция на изменение условий фильтра или нажатия кнопки "Ещё"
	pagedViewModel.prototype.applySelectionState = function (selectionState, clearExistsResult) {
		var self = this;
		self.basePageCaption('Результат фильтрации');
		//если clearExistsResult не false(например undefined) то чистим выборку
		clearExistsResult = clearExistsResult !== false;

		self.inLoadProgress(true);
		if (typeof self.beforeApplySelectionState === 'function') {
			self.beforeApplySelectionState(selectionState, clearExistsResult);
		}

		//добавляем значения сортировки, группировки и тд
		if (clearExistsResult) {
			self.skipPageCount = 0;
		}
		selectionState.params['page'] = self.skipPageCount;

		self.modifyUrl(selectionState);
		self.selectionState(selectionState);

		return self.update(selectionState, clearExistsResult);
	};

	// в url забиваются параметры фильтрации и тд
	pagedViewModel.prototype.modifyUrl = function (params) {
		var self = this;
		//Меняем адресную строку, метод переопределён в indexPagedViewModel
	};

	//метод запроса к серверу, для установки фильтров используем applySelectionState.
	pagedViewModel.prototype.update = function (selectionState, clearExistsResult) {
		var self = this;

		if (window.getCurrentLocationFromCookie != null)
			selectionState.params.depslocationstorecurrentlocation = window.getCurrentLocationFromCookie();
		
		var troberId = '';
		var promise =
			$.ajax({
				async: true,
				type: "POST",
				url: selectionState.url,
				contentType: "application/json",
				//data: requestData,
				data: JSON.stringify(selectionState.params),
				dataType: "json",
				error: function(jqXHR, textStatus, errorThrown) {
					switch (jqXHR.status) {
					case 403:
						//Перенаправляем на страницу аутентификации.
						var returnUrl = window.location.pathname + window.location.hash;
						returnUrl = encodeURIComponent(returnUrl);
						var redirectUrl = '/WebInterfaceModule/Authentication/Login?returnUrl=' + returnUrl;
						window.location.href = redirectUrl;
						break;
					default:
						//Выводим модальное окно с ошибкой.
						modal.errorModalWindow('Не удалось получить с сервера данные. Подробности: ' + errorThrown);
					}
				},
				beforeSend: function() {
					//индикатор загрузки
					troberId = modal.CreateTrobberDiv2();
				},
				success: function (response) {
					if (response.hasError) {
						//Выводим модальное окно с ошибкой.
						modal.errorModalWindow(response.errorMessage);
					} else {
						//Записываем список шаблонов дел во вью-модель.
						self.applyResponse(response, clearExistsResult);
					}
				},
				complete: function() {
					//Скрываем индикатор загрузки.
					modal.CloseTrobberDiv2(troberId);
				}
			});

		return promise;
	};

	//Обработка нажатия кнопки "Eщё".
	pagedViewModel.prototype.next = function () {
		var self = this;
		self.skipPageCount = self.skipPageCount + 1;
		//Дополняем результат, не трогаем существующие результаты.
		self.applySelectionState(self.selectionState(), false);
	};

	//Обновление списка с теми же условиями. Предыдущие результаты не сохраняются.
	pagedViewModel.prototype.reload = function () {
		var self = this;
		self.skipPageCount = 0;		
		//Обновляем результат, стираем существующие результаты.
		self.applySelectionState(self.selectionState(), true);
	};
	
	return pagedViewModel;
});

define('Nvx.ReDoc.StateStructureServiceModule/StateStructure/Script/mfcUtils', [],
	function() {
		var MfcUtils = function() {
		};

		MfcUtils.prototype.isUrl = function(s) {
			var regexp = /^(https?:\/\/)?([a-zА-Яа-я\d-]+\.)+[a-zА-Яа-я\d]{1,}(:\d+)?\/?/;
			//var regexp = /^[a-]{10,}$/;
			return regexp.test(s);
		};

		//поправить ссылку
		MfcUtils.prototype.getWebLink = function(source) {
			var url = null;
			if (MfcUtils.prototype.isUrl(source)) {
				url = source;

				if (url.indexOf('http') !== 0) {
					url = 'http://' + url;
				}
			} else {
				url = null;
			}

			return url;
		};

		return MfcUtils;
	});
define('Nvx.ReDoc.StateStructureServiceModule/StateStructure/Script/MfcServicesViewModel',
	['knockout',
		'jquery',
		'Nvx.ReDoc.StateStructureServiceModule/Service/Script/ServicesViewModel',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit'],
	function(ko, $, ServicesViewModel, inherit) {
		var MfcServicesViewModel = function() {
			ServicesViewModel.apply(this, arguments);
		};

		inherit(MfcServicesViewModel, ServicesViewModel);

		//Заполнить модель фильтрации
		MfcServicesViewModel.prototype.fillFilterItem = function() {
			ServicesViewModel.prototype.fillFilterItem.apply(this, arguments);
		};

		return MfcServicesViewModel;
	});
define('Nvx.ReDoc.StateStructureServiceModule/Service/Script/serviceGroupPagedViewModel',
	[
		'knockout',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/DefaultController/GroupPagedViewModel',
		'Nvx.ReDoc.StateStructureServiceModule/Service/Script/serviceGroupViewModel',
		'jquery',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
		'Nvx.ReDoc.Rpgu.Core/Script/Tab',
		'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/knockout/customBindingHandlers'
	],
	function (ko, GroupPagedViewModel, ServiceGroupViewModel, $, inherit, Tab) {
		var serviceGroupPagedViewModel = function() {
			var self = this;

			serviceGroupPagedViewModel.superclass.constructor.apply(self, [ServiceGroupViewModel]);
			self.canSearch(true);
			self.canFilter(true);
			self.canSorts(false);
			self.filterTitle('Услуги для');
			self.groupTitle('Отображать по');
			//тайм-аут между вводом имени услги и отправкой запроса
			self.timeoutDefaultValue = 1000;
			//показывать чекбокс "Только электронные"
			self.checkOnline = ko.observable(true);

			self.initFilterId = ko.observable(null);
			self.initSortId = ko.observable(null);
			self.initGroupId = ko.observable(null);

			//показывать ли вкладки с администранивными уровлями ведомств
			self.visibleTabsAdminLevel = ko.observable(false);

			//получить элемент массива по его идентификатору
			self.getValueById = function(array, id) {
				var val = null;

				for (var i = 0; val == null && i < array.length; i++) {
					if (array[i].id === id) {
						val = array[i];
					}
				}

				return val;
			};

			//идентификатор выбранного для фильтра пункта
			self.filterId = ko.observable(null);
			//обновить параметр фильтрации
			self.filterId.subscribe(function(newValue) {
				if (newValue) {
					var val = self.getValueById(self.filters(), newValue);
					self.filter(val);
				}
			});

			//идентификатор выбранного для сортировки пункта
			self.sortId = ko.observable(null);
			//обновить параметр сортировки
			self.sortId.subscribe(function(newValue) {
				if (newValue) {
					var val = self.getValueById(self.sorts(), newValue);
					self.sort(val);
				}
			});

			//идентификатор выбранного для группировки пункта
			self.groupId = ko.observable(null);
			//обновить параметр группировки
			self.groupId.subscribe(function(newValue) {
				if (newValue) {
					var val = self.getValueById(self.groups(), newValue);
					self.groupBy(val);
				}

				//показывать ли вкладку для админ. уровня ведомств
				if (newValue && newValue.toLowerCase() === 'department') {
					self.visibleTabsAdminLevel(true);
				} else {
					self.visibleTabsAdminLevel(false);
				}
			});

			self.selectionState.subscribe(function(newValue) {
				if (newValue) {
					self.initFilterId(newValue.params.filterBy);
					self.initSortId(newValue.params.sortBy);
					self.initGroupId(newValue.params.groupBy);
				}
			});

			/**
			 * Обработка нажатий клавишь на поле фильтра
			 * @param {} data 
			 * @param {} event 
			 * @returns {} 
			 */
			self.filterKeypress = function(data, event) {
				//искать по нажатию Enter
				if (event.keyCode === 13) {
					self.submitSearch();
				}
				return true;
			};

			//получить элемент массива но идентификатору группы
			self.getItemByGroupId = function (groupId) {
				var result = null;
				var items = self.items();

				if (Array.isArray(items)) {
					for (var i = 0; i < items.length && result == null; i++) {
						var item = items[i];
						if (item.groupId === groupId) {
							result = item;
						}
					}
				}

				return result;
			};

			//развернуть группы, идентификаторы которых переданы в массиве
			self.openGroups = function(groups) {
				if (Array.isArray(groups)) {
					groups.forEach(function(item, i) {
						var group = self.getItemByGroupId(item);

						if (group != null) {
							group.minimizedGroup(false);
							group.renderChildren();
						}
					});
				}
			};

			//получить массив идентифиаторов открытых групп
			self.getOpeningGroups = function() {
				var openingGroup = [];
				var items = self.items();
				if (Array.isArray(items)) {
					items.forEach(function (item, i) {
						if (!item.minimizedGroup()) {
							openingGroup.push(item.groupId);
						}
					});
				}

				return openingGroup;
			};

			//истина - пока не вызывался beforeApplySelectionState
			//Нужен, чтобы при перезагрузке страницы не затерлись развернутые блоки
			var firstCall = true;

			//перед применением фильтра запомнить какие блоки развернуты
			self.beforeApplySelectionState = function(selectionState, clearExistsResult) {
				if (firstCall) {
					firstCall = false;
					return;
				}
				selectionState.params.openingGroups = self.getOpeningGroups();
			};

			//после получения ответа от сервера
			self.afterApplyResponse = function (response, clearExistsResult) {
				//прибавить блокам функциональности
				var loadGroups = self.items();
				if (Array.isArray(loadGroups)) {
					//пройтись по всем блокам
					loadGroups.forEach(function (group, i) {
						//перед тем, как обработать клик по функции, запомнить все развернутые блоки
						var beforeServiceClick = group.beforeServiceClick;
						group.beforeServiceClick = function (id) {
							beforeServiceClick(arguments);
							self.selectionState().params.openingGroups = self.getOpeningGroups();
						};
					});

					//если блок один, то развернуть его
					if (loadGroups.length === 1) {
						loadGroups[0].minimizedGroup(false);
						loadGroups[0].renderChildren();
					}
				}

				//развернуть ранее развернутые блоки
				self.openGroups(self.selectionState().params.openingGroups);

				//GroupPagedViewModel.prototype.afterApplyResponse(response, clearExistsResult);
				self.showPageControls(true);
			};

			/**
			* Убираем активность у всех вкладок.
			* @param {} tabs 
			* @returns {} 
			*/
			self._unactiveTabs = function(tabs) {
				for (var index in tabs) {
					if (typeof (tabs[index]) === 'object') {
						tabs[index].active(false);
					}
				}
			};

			self._setAdminLevelType = function (adminLevel) {
				adminLevel = adminLevel || 1;
				var selectionState = self.selectionState();
				if (selectionState) {
					var params = self.selectionState().params;
					if (params) {
						params.adminLevel = adminLevel;
					}
				}
			};

			/**
			* Создать вкладки для уровней администрирования
			* @returns {} 
			*/
			self.createAdminLevelTabs = function () {
				var tabs = {};
				tabs.unactiveTabs = function () {
					self._unactiveTabs(self.tabsAdminLevels);
				};

				tabs.regional = new Tab('Региональные органы исполнительной власти');
				tabs.regional.onclick = function () {
					tabs.regional.activate();
					self.reload();
				};
				tabs.regional.activate = function () {
					//Убираем активность у всех вкладок.
					tabs.unactiveTabs();
					//Выставляем активность вкладке по которой кликнули.
					tabs.regional.active(true);
					self._setAdminLevelType(1);
				};

				tabs.municipal = new Tab('Органы местного самоуправления');
				tabs.municipal.onclick = function () {
					tabs.municipal.activate();
					self.reload();
				};
				tabs.municipal.activate = function () {
					//Убираем активность у всех вкладок.
					tabs.unactiveTabs();
					//Выставляем активность вкладке по которой кликнули.
					tabs.municipal.active(true);
					self._setAdminLevelType(2);
				};

				tabs.federal = new Tab('Территориальные органы Федеральных органов исполнительной власти');
				tabs.federal.onclick = function () {
					tabs.federal.activate();
					self.reload();
				};
				tabs.federal.activate = function () {
					//Убираем активность у всех вкладок.
					tabs.unactiveTabs();
					//Выставляем активность вкладке по которой кликнули.
					tabs.federal.active(true);
					self._setAdminLevelType(3);
				};

				self.tabsAdminLevels = tabs;
				//вкладка по-умолчанию
				tabs.regional.activate();
			};

			/**
			* Создать вкладки
			* @returns {} 
			*/
			self.createTabs = function() {
				self.createAdminLevelTabs();
			};

			//создать вкладки
			self.createTabs();
		};

		inherit(serviceGroupPagedViewModel, GroupPagedViewModel);
		return serviceGroupPagedViewModel;
	});
define('Nvx.ReDoc.StateStructureServiceModule/Service/Script/serviceGroupViewModel',
	[
		'knockout',
		'jquery',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/DefaultController/GroupViewModel',
		'Nvx.ReDoc.StateStructureServiceModule/Service/Script/servicePagedViewModel',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit'
	],
	function (ko, $, groupPageFactory, servicePagedViewModel, inherit) {
		var ServiceGroupViewModel = function() {
			var self = this;
			ServiceGroupViewModel.superclass.constructor.apply(self, arguments);
			groupPageFactory.apply(self, arguments);
			//показывать все группы свернутыми
			self.minimizedGroup(true);


			self.rowTitle = ko.computed(function() {
				return self.groupTitle + " (" + self.count() + ")";
			}, self);

			/**
			 * признок того, что дочерние элементы уже были отрендерены
			 */
			self.childrenIsRendering = false;

			/**
			 * Элемент интерфейса, содержащий группу
			 */
			self.groupElement = ko.observable(null);
			/**
			 * Если группа грузится открытой, то произвести рендер
			 */
			self.groupElement.subscribe(function(element) {
				if (element != null && self.minimizedGroup() === false) {
					self.renderChildren();
				}
			});

			/**
			 * Клик по группе
			 * @param {} sender Модель
			 * @param {} event Событие клика
			 * @returns {} 
			 */
			self.groupClick = function(sender, event) {
				self.renderChildren();
			};

			/**
			 * Рендер дочерних элементов
			 * @returns {} 
			 */
			self.renderChildren = function() {
				//если есть элемент группы и дочерние элементы еще не рендерелись
				if (self.groupElement() != null && !self.childrenIsRendering) {
					//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
					// Сначала я хотел сделать рендер через биндиг element. 
					// Но это тоже работало очень медлено, поэтому сделал прямую вставку html в вёрстку
					//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
					self.childrenIsRendering = true;
					var groupElement = $(self.groupElement());

					var childsElement;
					if (self.childs.length > 0) {
						// добавить список дочерних элементов, если они есть
						childsElement = $('<div></div>');
						if (self.minimizedGroup()) {
							childsElement.hide();
						}

						childsElement.insertAfter(groupElement);
						ko.applyBindingsToNode(childsElement[0], { template: { name: self.childsTemplateId, data: self } });
					} else {
						childsElement = groupElement;
					}

					//добавить список услуг
					var serviceListElement = $('<div></div>');
					if (self.minimizedGroup()) {
						serviceListElement.hide();
					}
					serviceListElement.insertAfter(childsElement);
					ko.applyBindingsToNode(serviceListElement[0], { template: { name: self.listTemplateId, data: self } });

					//добавить кнопку подгрузки
					var moreButtonElement = $('<div></div>');
					if (self.minimizedGroup()) {
						moreButtonElement.hide();
					}
					moreButtonElement.insertAfter(serviceListElement);
					ko.applyBindingsToNode(moreButtonElement[0], { template: { name: 'Nvx.ReDoc.WebInterfaceModule/View/DefaultController/moreButton.tmpl.html', data: self } });
				}
			};
		};

		inherit(ServiceGroupViewModel, servicePagedViewModel);

		return ServiceGroupViewModel;
	});
define('Nvx.ReDoc.Rpgu.PortalModule/FilePage/Script/filePageModel',
	[
		'knockout',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction'
	],
	function(ko, modal) {
		var FilePageModel = function() {
			var self = this;

			self.pageContent = ko.observable(null);

			//загрузить страницу
			self.loadPage = function(url) {
				//Показать тробер
				var trobberId = modal.CreateTrobberDiv2();

				return $.ajax({ url: url, headers: { proxy: true }, method: 'GET' })
					.done(function(response) {
						if (response.hasError) {
							modal.errorModalWindow(response.errorMessage);
						} else {
							self.pageContent(response.result);
						}
					})
					.fail(function(errorMessage) {
						//Выводим модальное окно с ошибкой
						modal.errorModalWindow(errorMessage);
					})
					.always(function() {
						//Скрываем тробер
						modal.CloseTrobberDiv2(trobberId);
					});
			};

		};

		return FilePageModel;
	});
define('Nvx.ReDoc.StateStructureServiceModule/Service/Script/ServicePassportInfoViewModel',
	['knockout',
		'jquery',
		'Nvx.ReDoc.Rpgu.PortalModule/Portal/Script/portalPageController',
		'Nvx.ReDoc.Rpgu.Core/Script/Tab',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'Nvx.ReDoc.StateStructureServiceModule/StateStructure/Script/MfcListViewModel',
		'javascriptExtention',
		'select2lib',
		'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/knockout/customBindingHandlers'
],
		function (ko, $,
			portalPageController,
			Tab,
			modal,
			MfcListViewModel) {
	var ServicePassportInfoViewModel = function (passportId) {
		var self = this;

		//идентификатор папорта услуги
		self.passportId = passportId;
		//Наименование паспорта
		self.passportFullName = ko.observable('');
		//дополнительная инфрмация
		self.additionalInformation = ko.observable(null);

		//услуги из паспорта
		self.services = ko.observableArray();
		//услуги из паспорта
		self.currentService = ko.observable();

		//модель списка мфц, оказывающих услугу
		self.mfcListViewModel = ko.observable(null);

		self.department = ko.observable(null);

		//btx
		self.depLink = '';
		self.goToProfile = function () {
			if (self.department() != null)
				window.location = (window.nvxCommonPath != null ? window.nvxCommonPath.departmentView : '/department/index.php?departmentId=') + self.department().id;
		};

		//показывать методы подачи заявки
		self.visibleRequestMethods = ko.observable(true);
		//показывать методы получения результата
		self.visibleResponseMethods = ko.observable(true);

		//услуга содержит документы
		self.hasDocuments = ko.observable(false);

		//права и обязаности объекта текущей услуги
		self.currentServiceRightsAndDutuesObject = ko.observable(null);

		//права и обязаности субъекта текущей услуги
		self.currentServiceRightsAndDutuesSubject = ko.observable(null);

		// отображать кнопку Подать жалобу
		self.canComplaint = ko.observable(false);
		//Поле для внешних порталов, issues/1157
		self.canGoIgtn = ko.observable(false);

		//проверяет не состоит ли массив из пустых записей и стоит ли его показывать
		self.getVisibleMethods = function (methods) {
			var visible = true;
			if (Array.isArray(methods) && methods.length > 0) {
				for (var i = 0; visible && i < methods.length; i++) {
					if (methods[i].title == null) {
						visible = false;
					}
				}
			} else {
				visible = false;
			}

			return visible;
		};

		//скрыть или показать методы подачи заявки и получения результата.
		//нужно потому что в некоторых услугах список состоит из пустых записей
		self.currentService.subscribe(function (newValue) {
			if (newValue) {
				self.visibleRequestMethods(self.getVisibleMethods(newValue.description.requestMethods));
				self.visibleResponseMethods(self.getVisibleMethods(newValue.description.responseMethods));

				//показывать ли вкладку с документами
				var hasDocs = false;
				if (newValue.documents) {
					hasDocs = (Array.isArray(newValue.documents.inDocuments) && newValue.documents.inDocuments.length > 0)
						|| (Array.isArray(newValue.documents.completions) && newValue.documents.completions.length > 0);
				}
				self.hasDocuments(hasDocs);
				self.canComplaint(newValue.isFgisDoService);

				self.currentServiceRightsAndDutuesObject(newValue.rightsAndDutuesObject);
				self.currentServiceRightsAndDutuesSubject(newValue.rightsAndDutuesSubject);
			} else {
				self.currentServiceRightsAndDutuesObject(null);
				self.currentServiceRightsAndDutuesSubject(null);
			}
		});

		self.currentServiceId = ko.observable();
		self.currentServiceId.subscribe(function (newValue) {
			self.setCurrentServiceByTargetId(newValue);
			//self.setCurrentServiceByTargetId(newValue);
			//var url = '/portal/service/' + self.passportId + '/?targetid=' + newValue;
			//portalPageController.navigate(url);
		});

		//массив с целями РГУ для отображения в выпадающем списке
		self.servicesView = ko.observableArray();

		//фон страницы должен быть во всю высоту
		self.normalizeHeight = function() {
			$('.content').css('min-height', '0');
			$('.tabsCont').css('min-height', '0');
			$('.content').css('min-height', $('body').outerHeight() - $('.header').outerHeight() - $('.usefulLinksCont').outerHeight() - 50);

			$('.tabsCont').css('min-height', '0');
			$('.tabsCont').css('min-height', $('.content').height() - 20 - $('.content h1').outerHeight());
		};

		//создать вкладки
		self.createTabs();
	};

	/**
	 * Создать вкладки
	 * @returns {} 
	 */
	ServicePassportInfoViewModel.prototype.createTabs = function () {
		var self = this;
		self.tabs = {};

		/**
		 * Убираем активность у всех вкладок.
		 */
		self.tabs.unactiveTabs = function () {
			//Убираем активность у всех вкладок.
			for (var index in self.tabs) {
				if (typeof (self.tabs[index]) === 'object') {
					self.tabs[index].active(false);
				}
			}

			self.normalizeHeight();
		};

		//btx - portalPageController.navigate
		self.tabs.description = new Tab('Описание');
		self.tabs.description.onclick = function () {
			if (portalPageController.navigate != null) {
				portalPageController.navigate('/portal/service/{0}'.format(self.passportId));
			} else {
				self.setActiveTab(null);
			}
		};
		self.tabs.description.activate = function () {
			//Убираем активность у всех вкладок.
			self.tabs.unactiveTabs();
			//Выставляем активность вкладке по которой кликнули.
			self.tabs.description.active(true);
		};

		self.tabs.documents = new Tab('Документы');
		self.tabs.documents.onclick = function () {
			if (portalPageController.navigate != null) {
				portalPageController.navigate('/portal/service/{0}/docs'.format(self.passportId));
			} else {
				self.setActiveTab('docs');
			}
		};
		self.tabs.documents.activate = function () {
			//Убираем активность у всех вкладок.
			self.tabs.unactiveTabs();
			//Выставляем активность вкладке по которой кликнули.
			self.tabs.documents.active(true);
		};

		self.tabs.additionalInformation = new Tab('Дополнительная информация');
		self.tabs.additionalInformation.onclick = function () {
			if (portalPageController.navigate != null) {
				portalPageController.navigate('/portal/service/{0}/more'.format(self.passportId));
			} else {
				self.setActiveTab('more');
			}
		};
		self.tabs.additionalInformation.activate = function () {
			//Убираем активность у всех вкладок.
			self.tabs.unactiveTabs();
			//Выставляем активность вкладке по которой кликнули.
			self.tabs.additionalInformation.active(true);
		};

		self.tabs.mfcList = new Tab('МФЦ, оказывающие услугу');
		self.tabs.mfcList.visible = ko.observable(false);
		self.tabs.mfcList.onclick = function () {
			if (portalPageController.navigate != null) {
				portalPageController.navigate('/portal/service/{0}/mfc'.format(self.passportId));
			} else {
				self.setActiveTab('mfc');
			}
		};
		self.tabs.mfcList.activate = function () {
			//Убираем активность у всех вкладок.
			self.tabs.unactiveTabs();
			//Выставляем активность вкладке по которой кликнули.
			self.tabs.mfcList.active(true);
		};

		self.tabs.description.active(true);

		setTimeout(function () { self.normalizeHeight(); },100);
	};

	//получить информацию об услуге от сервера
	ServicePassportInfoViewModel.prototype.getServicePassportInfo = function (selectedTarget) {
		var self = this;
		var url = "/Nvx.ReDoc.StateStructureServiceModule/ServiceController/GetServicePassportInformation/" + self.passportId;

		//Показать тробер
		var trobberId = modal.CreateTrobberDiv2();

		var promise = $.ajax({
			async: true,
			type: "GET",
			url: url,
			cache: false,
			success: function (viewData) {
				if (viewData.hasError) {
					modal.errorModalWindow(viewData.errorMessage);
				} else {
					self.applyResponse(viewData.result, selectedTarget);
				}
			},
			error: function (jqXHR, textStatus, errorThrown) {
				if (jqXHR.responseJSON) {
					modal.errorModalWindow(jqXHR.responseJSON.errorMessage + ' Подробности: ' + errorThrown);
				} else {
					modal.errorModalWindow(jqXHR.responseText);
				}
			},
			complete: function () {
				//Скрываем тробер
				modal.CloseTrobberDiv2(trobberId);
			}
		});

		return promise;
	};

	//применить ответ сервера. 
	//responseReulst - ответ сервера
	//selectedTarget - цель, которую выбрать из пришедшего ответа (не обязательный параметр)
	ServicePassportInfoViewModel.prototype.applyResponse = function (responseReulst, selectedTarget) {
		var self = this;
		self.passportFullName(responseReulst.passportFullName);

		var additionalInfo = extendAdditionalInformation(responseReulst.additionalInformation);
		self.additionalInformation(additionalInfo);

		//список МФЦ
		if (Array.isArray(responseReulst.mfcList) && responseReulst.mfcList.length > 0) {
			var mfcListViewModel = new MfcListViewModel();
			mfcListViewModel.applyResponse(responseReulst.mfcList);
			self.mfcListViewModel(mfcListViewModel);
			self.tabs.mfcList.visible(true);
		} else {
			self.mfcListViewModel(null);
			self.tabs.mfcList.visible(false);
		}

		self.department(responseReulst.department);
		self.services(responseReulst.services);

		self.currentService(null);
		var services = self.services();
		var serviceCount = services.length;

		//создать массив для отображения в выпадающем списке
		var servicesView = [];
		for (var i = 0; i < serviceCount; i++) {
			var s = services[i];
			servicesView.push({ id: s.targetId, text: s.description.serviceFullName });
		}
		self.servicesView(servicesView);

		//выбрать переданную цель, если она есть.
		//иначе выбрать услугу по-умолчанию
		if (serviceCount > 0) {
			if (selectedTarget) {
				self.currentServiceId(selectedTarget);
			} else {
				//выбрать первую электронную услугу
				var selectedService = null;
				for (var i = 0; i < services.length && selectedService == null; i++) {
					var description = services[i].description;
					if (description && description.canCreateTreatment === true) {
						selectedService = services[i];
					}
				}
				//если электронных услуг нет, то выбрать первую услугу из списка
				if (selectedService == null) {
					selectedService = services[0];
				}

				if (selectedService != null)
					self.currentServiceId(selectedService.targetId);
			}
		}
	};

	//показать услугу
	ServicePassportInfoViewModel.prototype.showServicePassport = function (selectedTarget, selectedTab) {
		var self = this;
		if (self.services == null || self.services.length === 0) {
			var promise = self.getServicePassportInfo(selectedTarget);
			promise.always(function() {
				self.setActiveTab(selectedTab);
			});

			return promise;
		}
		return null;
	};

	//оказание услуги
	ServicePassportInfoViewModel.prototype.createTreatment = function () {
		var self = this;
		var epguLink = self.currentService().description.epguLink;

		if (epguLink != null && epguLink != '') {
			window.open(epguLink, '_blank');
		} else {
			if (portalPageController.navigate != null) {
				portalPageController.navigate("/portal/service/{0}/treatment".format(self.currentService().serviceId));
			} else {
				window.location = (window.nvxCommonPath != null ? window.nvxCommonPath.treatmentCreateView : '/treatment/index.php?serviceId=') + self.currentService().serviceId;
			}
		}
	};

	//установить текущую услугу
	ServicePassportInfoViewModel.prototype.setCurrentServiceByTargetId = function (targetId) {
		var self = this;

		var services = self.services();
		var serviceCount = services.length;
		var serviceIsFound = false;

		for (var i = 0; i < serviceCount && !serviceIsFound; i++) {
			var s = services[i];
			if (s.targetId == targetId) {
				self.currentService(s);
				serviceIsFound = true;
			}
		}
		//btx fake targets?
		if (!serviceIsFound && serviceCount == 1) {
			self.currentService(services[0]);
		}
	};

	/**
	 * Сделать активной вкладку
	 * @param {} selectTab 
	 * @returns {} 
	 */
	ServicePassportInfoViewModel.prototype.setActiveTab = function (selectTab) {
		var self = this;

		switch (selectTab) {
			case 'docs':
				self.tabs.documents.activate();
				break;
			case 'more':
				self.tabs.additionalInformation.activate();
				break;
			case 'mfc':
				self.tabs.mfcList.activate();
				break;
			default:
				self.tabs.description.activate();
				break;
		}
	};

	// Создать жалобу
	ServicePassportInfoViewModel.prototype.createComplaint = function () {
		var self = this;
		var trobberId = modal.CreateTrobberDiv2();
		var url = "/Rpgu/Complaint/Create";
		var data = { id: self.currentService().serviceId };
		$.ajax({ url: url, data: data, type: 'POST', headers: { proxy: true } })
			.done(function (response) {
				modal.CloseTrobberDiv2(trobberId);
				if (response.hasError) {
					modal.errorModalWindow(response.errorMessage);
				} else {
					if (response.fileId != null) {
						//Адрес для перехода к вновь созданному делу
						var fileUrl = (window.nvxCommonPath != null ? window.nvxCommonPath.formView + '{0}' : '/cabinet/request/{0}/form').format(response.fileId);
						window.location = fileUrl;
					} else {
						modal.errorModalWindow("Ошибка при оформлении жалобы. Проверьте авторизацию и попробуйте ещё раз.");
					}
				}
			}).fail(function (jqXHR, textStatus, errorThrown) {
				var message = jqXHR.responseJSON && jqXHR.responseJSON.errorMessage ?
								jqXHR.responseJSON.errorMessage :
								'Ошибка при создании услуги. Подробности: ' + errorThrown;
				modal.errorModalWindow(message);
			}).always(function () {
				modal.CloseTrobberDiv2(trobberId);
			});
	};

	var extendAdditionalInformation = function (additionalInfo) {
		additionalInfo = additionalInfo || {};
		additionalInfo.reglamentVisible = ko.observable(false);

		additionalInfo.showReglamentText = function () {
			additionalInfo.reglamentVisible(true);
		};
		additionalInfo.closeReglamentText = function () {
			additionalInfo.reglamentVisible(false);
		};
		return additionalInfo;
	};

	return ServicePassportInfoViewModel;
});
define('Nvx.ReDoc.StateStructureServiceModule/StateStructure/Script/MfcViewModel', ['knockout',
		'jquery',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'Nvx.ReDoc.Rpgu.Core/Script/Tab',
		'Nvx.ReDoc.StateStructureServiceModule/StateStructure/Script/MfcServicesViewModel',
		'Nvx.ReDoc.Rpgu.PortalModule/Portal/Script/portalPageController',
		'Nvx.ReDoc.StateStructureServiceModule/StateStructure/Script/MfcListViewModel',
		'Nvx.ReDoc.StateStructureServiceModule/StateStructure/Script/mfcUtils',
		'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/knockout/customBindingHandlers',
		'javascriptExtention'],
function (ko, $, modal, Tab, MfcServicesViewModel, portalPageController, MfcListViewModel, mfcUtils) {
	var MfcViewModel = function (departmentId) {
		var self = this;

		/*Идентификатор ведомства*/
		self.departmentId = departmentId;

		/*Наименование ведомства*/
		self.name = ko.observable('');

		/*Адрес ведомства*/
		self.address = ko.observable('');

		/*Руководитель ведомства*/
		self.headName = ko.observable('');

		/*График работы ведомства*/
		self.workTime = ko.observable('');

		/*Телефон ведомства*/
		self.phone = ko.observable('');

		/*Веб-сайт ведомства*/
		self.webSite = ko.observable(null);

		/*Email ведомства*/
		self.email = ko.observable('');

		/*Только онлайн услуги*/
		self.onlyOnline = ko.observable(window.sessionStorage && window.sessionStorage.getItem('nvxOnlyOnline') === 'true');
		
		/*Координаты МФЦ*/
		self.locationCoord = ko.observableArray();

		//фон страницы должен быть во всю высоту
		self.normalizeHeight = function() {
			$('.content').css('min-height', '0');
			$('.tabsCont').css('min-height', '0');
			$('.content').css('min-height', $('body').outerHeight() - $('.header').outerHeight() - $('.usefulLinksCont').outerHeight() - 50);

			$('.tabsCont').css('min-height', '0');
			$('.tabsCont').css('min-height', $('.content').height() - 20 - $('.content h1').outerHeight());
		};

		self.onlyOnline.subscribe(function(newValue) {
			if (window.sessionStorage) {
				window.sessionStorage['nvxOnlyOnline'] = newValue;
			}
			self.getServiceList();
		});

		self.createTabs();

		/*Модель отображения услуг*/
		self.mfcServicesViewModel = ko.observable(null);

		/*Модель дополнительных офисов*/
		self.mfcTospListViewModel = ko.observable(null);

		/*Показывать ли вкладку с доп.офисами*/
		self.visibleTospTab = ko.observable(false);
	};

	/**
	 * Создать модель для отображения списка услуг
	 * @returns {} 
	 */
	MfcViewModel.prototype.createServicesModel = function () {
		var self = this;
		if (self.mfcServicesViewModel() == null) {
			var mfcServiceViewModel = new MfcServicesViewModel();
			//добавляем в параметр фильтрации идентификатор ведомства
			mfcServiceViewModel.item.selectionState.params.departmentId = self.departmentId;
			mfcServiceViewModel.item.selectionState.params.isFunction = false;
			//подменяем адрес страницы на текущий
			mfcServiceViewModel.item.selectionState.pageUrl = window.location.pathname;
			self.mfcServicesViewModel(mfcServiceViewModel);
		}
	};

	/**
	 * Применить ответ сервера, в котором пришло ведомство
	 * @param {} responseResult 
	 * @returns {} 
	 */
	MfcViewModel.prototype.applyResponse = function(responseResult) {
		var self = this;
		var department = responseResult;
		self.name(department.name);
		self.address(department.address);
		self.headName(department.headName);
		self.workTime(department.workTime);
		self.phone(department.phone); 
		self.webSite(mfcUtils.prototype.getWebLink(department.webSite));
		self.email(department.email);
		self.locationCoord(department.locationCoord);

		if (Array.isArray(department.tospList) && department.tospList.length > 0) {
			department.tospList.forEach(function (tospItem) {
				if (window.nvxCommonPath != null && window.nvxCommonPath.mfcTospView != null) {
					tospItem.link = window.nvxCommonPath.mfcTospView + tospItem.id;
				} else {
					tospItem.link = "/portal/mfc/tosp/" + tospItem.id;
				}
			});
			//доп.офисы
			var model = new MfcListViewModel();
			model.applyResponse(department.tospList);
			self.mfcTospListViewModel(model);

			self.visibleTospTab(true);
		}
	};

	/**
	 * Создать вкладки
	 * @returns {} 
	 */
	MfcViewModel.prototype.createTabs = function () {
		var self = this;
		self.tabs = {};
		self.tabs.unactiveTabs = function () {
			//Убираем активность у всех вкладок.
			for (var index in self.tabs) {
				if (typeof (self.tabs[index]) === 'object') {
					self.tabs[index].active(false);
				}
			}

			self.normalizeHeight();
		};


		self.tabs.info = new Tab('Информация');
		self.tabs.info.onclick = function () {
			if (portalPageController.navigate != null) {
				portalPageController.navigate('/portal/mfc/{0}/info'.format(self.departmentId));
			} else {
				self.setActiveTab('info');
			}
		};
		self.tabs.info.activate = function () {
			//Убираем активность у всех вкладок.
			self.tabs.unactiveTabs();
			//Выставляем активность вкладке по которой кликнули.
			self.tabs.info.active(true);
			return self.showInfo();
		};

		self.tabs.services = new Tab('Услуги');
		self.tabs.services.onclick = function () {
			if (portalPageController.navigate != null) {
				portalPageController.navigate('/portal/mfc/{0}/services'.format(self.departmentId));
			} else {
				self.setActiveTab('services');
			}
		};
		self.tabs.services.activate = function () {
			//Убираем активность у всех вкладок.
			self.tabs.unactiveTabs();
			//Выставляем активность вкладке по которой кликнули.
			self.tabs.services.active(true);
			return self.showServices();
		};


		self.tabs.tosp = new Tab('Дополнительные офисы');
		self.tabs.tosp.onclick = function () {
			if (portalPageController.navigate != null) {
				portalPageController.navigate('/portal/mfc/{0}/tosp'.format(self.departmentId));
			} else {
				self.setActiveTab('tosp');
			}
		};
		self.tabs.tosp.activate = function () {
			//Убираем активность у всех вкладок.
			self.tabs.unactiveTabs();
			//Выставляем активность вкладке по которой кликнули.
			self.tabs.tosp.active(true);
			return self.showTosp();
		};

		setTimeout(function(){self.normalizeHeight()},100);

		//self.tabs.info.onclick();
	};

	/**
	 * Показать список услуг
	 * @returns {} 
	 */
	MfcViewModel.prototype.showServices = function () {
		var self = this;

		self.createServicesModel();
		//получить информацию о ведомстве, если нет заголовка
		if (!self.name() || self.name() === '') {
			self.getDepartment();
		}

		return self.getServiceList();
	};

	/**
	 * Показать информацию о ведомстве
	 * @returns {} 
	 */
	MfcViewModel.prototype.showInfo = function () {
		var self = this;
		return self.getDepartment();
	};

	MfcViewModel.prototype.getDepartmentUrl = function() {
		return '/Nvx.ReDoc.StateStructureServiceModule/StateStructureController/GetMfc/';
	};

	/**
	 * Получить с сервера информацию о ведомстве
	 * @returns {} 
	 */
	MfcViewModel.prototype.getDepartment = function() {
		var self = this;

		//Показать тробер
		var trobberId = modal.CreateTrobberDiv2();

		var promise = $.ajax({ url: self.getDepartmentUrl() + self.departmentId, method: 'GET' })
			.done(function(response) {
				if (response.hasError) {
					modal.errorModalWindow(response.errorMessage);
				} else {
					self.applyResponse(response.result);
				}
			})
			.fail(function(jqXHR, textStatus, errorThrown) {
				if (jqXHR.responseJSON) {
					modal.errorModalWindow(jqXHR.responseJSON.errorMessage + ' Подробности: ' + errorThrown);
				} else {
					modal.errorModalWindow(jqXHR.responseText);
				}
			})
			.always(function() {
				//Скрываем тробер
				modal.CloseTrobberDiv2(trobberId);
			});

		//self.getServiceList();

		return promise;
	};

	/**
	 * Показать дополнительные офисы
	 * @returns {} 
	 */
	MfcViewModel.prototype.showTosp = function () {
		var self = this;

		if (self.mfcTospListViewModel() == null) {
			return self.getDepartment();
		}

		var deferred = $.Deferred();
		deferred.resolve();
		return deferred.promise();
	};

	/**
	 * Получить с сервера информацию об услугах, оказываемых ведомством
	 * @returns {} 
	 */
	MfcViewModel.prototype.getServiceList = function () {
		var self = this;
		var deferred = $.Deferred();
		self.mfcServicesViewModel().updateFilter();
		deferred.resolve();
		return deferred.promise();
	};

	/**
	 * Сделать активной вкладку
	 * @param {} selectTab 
	 * @returns {} 
	 */
	MfcViewModel.prototype.setActiveTab = function (selectTab) {
		var self = this;
		var promise = null;

		if (!selectTab) {
			selectTab = 'info';
		}

		selectTab = selectTab.toLowerCase();

		switch (selectTab) {
			case 'services':
				promise = self.tabs.services.activate();
				break;
			case 'tosp':
				promise = self.tabs.tosp.activate();
				break;
			default:
				promise = self.tabs.info.activate();
				break;
		}

		return promise;
	};

	return MfcViewModel;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/main',
	['require', 'jquery'],
	function (require, $) {
		var DynamicFormRender = function () {
			var self = this;

			//���������� viewModel � ������� �����.
			self.buildViewModel = function (project, dynamicFormHub, callbackFunction, isClientScripts, fileId, componentId) {
				require(['Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/scripts/render2'],
					function (render) {
						var viewModel = render.buildViewModel(project, dynamicFormHub, fileId, componentId);
						callbackFunction(viewModel, isClientScripts);
					});
			};

			//���������� viewModel � ������� �����.
			self.buildViewModelReadonly = function (project, dynamicFormHub, callbackFunction, isClientScripts) {
				require(['Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/scripts/render2'],
					function (render) {
						var viewModel = render.buildReadonlyViewModel(project, dynamicFormHub);
						callbackFunction(viewModel, isClientScripts);
					});
			};
			
			//���������� �������������� ����� �� ������������ �����
			self.collapsePage = function (element, pageid) {
				if ($(element).find('[data-control-type="page"]').size() === 0)
					return;
				
				var docPages = $(element).find('[data-bind2^="with: Pages["]');
				var selectables = $(element).find('[data-control-fragment-id="TabSelection"]');

				for (var i = 0; i < docPages.size() ; i++) {
					if (i === pageid) {
						$(docPages[i]).show();
						selectables[i].previousSibling.classList.add("nvx-dfjsr-tab-white-selected");
						selectables[i].previousSibling.classList.remove("nvx-dfjsr-tab-white");
					} else {
						$(docPages[i]).hide();
						selectables[i].previousSibling.classList.remove("nvx-dfjsr-tab-white-selected");
						selectables[i].previousSibling.classList.add("nvx-dfjsr-tab-white");
					}
				}
			};
		};

		var dynamicFormRender = new DynamicFormRender();
		//Legacy support.
		window.dynamicFormRender = dynamicFormRender;

		return dynamicFormRender;
	});

define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/scripts/api',
	['jquery','jqueryExtention'], function ($) {
		var Control = function (path, tag) {
			this.tag = tag,
			this.path = path;
			this.Caption = '';
			this.FormElements = [];
		};

		var Template = function (tag, markup) {
			this.tag = tag;
			this.markup = markup;
		};

		//tag - ��� ��������.
		//koViewModelConstructor - �������-����������� ��� �������� view-model knockout.
		var KoViewModel = function (tag, koViewModelConstructor) {
			this.tag = tag;
			this.constructor = koViewModelConstructor;
		};

		//#region Project
		var Project = function (projectInstance) {
			this.project = projectInstance;
			this.forms = [];
			this.types = [];

			var forms = this.forms;
			var types = this.types;

			projectInstance.FormsPackages.forEach(function (formPackage) {
				var xml = $.parseXML(formPackage.XmlDescription);
				forms.push(xml);
			});

			projectInstance.TypesPackages.forEach(function (typePackage) {
				var xml = $.parseXML(typePackage.XmlDescription);
				types.push(xml);
			});

			return this;
		};

		Project.prototype = {
			getName: function () {
				return this.project.ProjectName;
			}
		};
		//#endregion

		return {
			Project: Project,
			Control: Control,
			Template: Template,
			KoViewModel: KoViewModel
		};

	});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/scripts/constructors', [
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/SimpleAttachmentViewModel',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/PlaceholderViewModel',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/FormViewModel',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/PageViewModel',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/PageContainerViewModel',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/TextControlViewModel',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/EnumControlViewModel',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/DictionaryRegistryControlViewModel',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/BoolControlViewModel',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/DateControlViewModel',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/IntegerControlViewModel',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/FloatControlViewModel',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/UuidControlViewModel',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/CurrentUserViewModel',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/TitleControlViewModel',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/FiasRegionSelectControlViewModel',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/UserInfoListViewModel'
], function(SimpleAttachmentViewModel,
	PlaceholderViewModel,
	FormViewModel,
	PageViewModel,
	PageContainerViewModel,
	TextControlViewModel,
	EnumControlViewModel,
	DictionaryRegistryControlViewModel,
	BoolControlViewModel,
	DateControlViewModel,
	IntegerControlViewModel,
	FloatControlViewModel,
	UuidControlViewModel,
	CurrentUserViewModel,
	TitleControlViewModel,
	FiasRegionSelectControlViewModel,
	UserInfoListViewModel) {

	var constructors = {
		'Placeholder': PlaceholderViewModel,
		'FormDescriptor': FormViewModel,
		'TextControlDescriptor': TextControlViewModel,
		'EnumControlDescriptor': EnumControlViewModel,
		'BoolControlDescriptor': BoolControlViewModel,
		'DateControlDescriptor': DateControlViewModel,
		'IntegerControlDescriptor': IntegerControlViewModel,
		'FloatControlDescriptor': FloatControlViewModel,
		'UuidControlDescriptor': UuidControlViewModel,
		'DictionaryRegistryControlDescriptor': DictionaryRegistryControlViewModel,
		'SimpleAttachmentViewModel': SimpleAttachmentViewModel,
		'CurrentUserViewModel': CurrentUserViewModel,
		'TitleControlDescriptor': TitleControlViewModel,
		'PageDescriptor': PageViewModel,
		'PageContainerControlDescriptor': PageContainerViewModel,
		'FiasRegionSelectControlViewModel': FiasRegionSelectControlViewModel,
		'FIAS': FiasRegionSelectControlViewModel,
		'UserInfoList': UserInfoListViewModel
	};

	return constructors;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/scripts/event',
	[], function () {

	var Event = function(target) {

		var self = this;

		self.target = target;

		self.listners = [];

	};

	Event.prototype.subscribe = function (callback) {
		this.listners.push(callback);
	};

	Event.prototype.trigger = function (params) {
		for (var i = 0; i < this.listners.length; i++) {
			this.listners[i](this.target, params);
		}
	};

	return Event;

});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/scripts/koConstructorStore',
	[
		'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/scripts/constructors',
		'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/CollectionViewModel'
	],
	function (
		constructors,
		CollectionViewModel) {

		//Расширяем список конструкторов конструктором клонируемой коллекции.
		constructors['CollectionFormDescriptor'] = CollectionViewModel;

		return constructors;
	});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/scripts/render2',
	[
		'jquery',
		'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/scripts/templateStore2',
		'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/scripts/templateReadonlyStore',
		'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/scripts/koConstructorStore',
		'jsrender',
		'jqueryExtention',
		'javascriptExtention'
	],
	function ($, templateStore, templateStoreReadonly, constructorStore) {
		var buildViewModel = function (formObjectInstance, dynamicFormHub, fileId, componentId) {
			//������ �������� �����.
			var formTemplate = templateStore['FormDescriptor'];
			if (formTemplate === undefined) { formTemplate = templateStore['Placeholder']; }
			//����������� ���-������ �����.
			var FormViewModel = constructorStore['FormDescriptor'];
			if (FormViewModel === undefined) { FormViewModel = constructorStore['Placeholder']; }
			//��� ������ �������� viewModel �����, ����� �� ��� �������� ��������.
			var viewModelPath = '_';
			var params = {
				'viewModelPath': viewModelPath,
				'businessEntityPath': formObjectInstance.Path,
				'dynamicFormHub': dynamicFormHub,
				'elementDescriptor': formObjectInstance
			};
			var formViewModel = new FormViewModel(params);
			//��������� �������� ������� �����.
			formObjectInstance.viewModelPath = viewModelPath;
			formViewModel.markup = $(formTemplate).render(formObjectInstance);
			//��������� ���-������ � �������� - ����� �������� ���� ������.
			recursion(formViewModel, formObjectInstance, dynamicFormHub, templateStore, "FormElements", false, fileId, componentId);

			return formViewModel;
		};

		//viewModel � vm ���������������� �������
		//formObjectInstance � ��������� ������� �������
		var recursion = function (viewModel, formObjectInstance, dynamicFormHub, templatesForUsing, blockToAdd, itsApage, fileId, componentId) {
			if (formObjectInstance.DescriptorKey === "Placeholder")
				return;
			//����� (Form)
			var formObjectChildren = formObjectInstance.FormElements;
			//���� ���� ���� �������, ������ ������ - �����.
			if (formObjectChildren != null) {
				//#region forms
				var length = formObjectChildren.length;
				for (var index = 0; index < length; index++) {
					var childFormObject = formObjectChildren[index];
					//������� ���� �� ��������� ������� viewModel.
					var viewModelPath = '{0}[{1}]'.format(blockToAdd, index);
					//������� ���-�������� �������.
					var ChildViewModel = constructorStore[childFormObject.DescriptorKey];
					if (ChildViewModel == null) {
						ChildViewModel = constructorStore['Placeholder'];
					}
					var params = {
						'viewModelPath': viewModelPath,
						'businessEntityPath': childFormObject.Path,
						'dynamicFormHub': dynamicFormHub,
						'elementDescriptor': childFormObject,
						'Parent': viewModel
					};
					var childViewModel = new ChildViewModel(params);

					childViewModel.Parent = viewModel;
					// ������������� �� ��������� ������ ��� ���� (���� ����)
//					childViewModel.onValueChanged.subscribe(dynamicFormHub.updateValue);

					//��� ������� ������������ ����������� �������������
					if (childFormObject.DescriptorKey === "DictionaryRegistryControlDescriptor") {
						childViewModel.DictionaryId(childFormObject.DictionaryId);
						childViewModel.DictionarySource(childFormObject.DictionarySource);
						childViewModel.DisplayFieldScript(childFormObject.DisplayFieldScript);
					}
					if (childFormObject.DescriptorKey === "DictionaryRegistryControlDescriptor") {
						childViewModel.fileId = fileId;
						childViewModel.componentId = componentId;
					}

					//Ÿ ��������.
					childFormObject.viewModelPath = viewModelPath;
					var markupTemplate = templatesForUsing[childFormObject.DescriptorKey];
					if (markupTemplate === undefined) {
						markupTemplate = templatesForUsing['Placeholder'];
					}
					//��������
					childViewModel.markup = $(markupTemplate).render(childFormObject);
					//��������� � ��������� ��������� �����-��������.
					if (itsApage === true) {
						viewModel.PageElements.push(childViewModel);
						viewModel.FormElements.push(childViewModel);
					} else {
						viewModel.FormElements.push(childViewModel);
					}
					//��������� ��� ���� �������� �������� (����� � � ���� ���� ����).
					recursion(childViewModel, childFormObject, dynamicFormHub, templatesForUsing, "FormElements", false, fileId, componentId);
					//���������� �������� ������� � �������� ��������.
					viewModel.markup = appendFormElementMarkup(viewModel.markup, childViewModel.markup, '[data-control-fragment-id="{0}-{1}"]'.format(blockToAdd, viewModel.Path));
				}
				//#endregion
			} else if (formObjectInstance.CollectionElementDescriptor != null) {
				viewModel.ButtonCaption = formObjectInstance.ButtonCaption;

				//����� ����� ���������������� ���������.
				var formElementsC = formObjectInstance.CollectionElementDescriptor.FormElements;
				if (formElementsC !== null && $.isArray(formElementsC) && formElementsC.length > 0) {
					//#region collections
					//label ������
					

					//� ��������� ���� ����, �� � ����������
					//��� ����������� ������� � ��� �����
					var FormViewModel = constructorStore['FormDescriptor'];
					//itemToAdd � ������� ������������ ��������, ������ ���
					//��� ����� ��� ���� ����� ������� ��� �������������� ���� �� ������ � ������� �����
					dynamicFormHub = $.extend({}, dynamicFormHub);
					dynamicFormHub.ViewModelPathToViewModel = {};
					dynamicFormHub.EntityPathToViewModel = {};
					dynamicFormHub.ScriptMediator = null;

					viewModel.itemToAdd = new FormViewModel({
						'viewModelPath': formObjectInstance.CollectionElementDescriptor.Path,
						'businessEntityPath': formObjectInstance.Path,
						'dynamicFormHub': dynamicFormHub,
						'elementDescriptor': formObjectInstance.CollectionElementDescriptor,
						'Parent': viewModel
					});

					//���������� ��� �������� �� �����
					for (var index = 0; index < formElementsC.length; index++) {
						//� ����� ���� ���������, �������� ��� ����� � �����, � ����� �������� � ������ �������� ���������
						var childFormObject1 = formElementsC[index];
						//������� ���� �� ��������� ������� viewModel.
						var viewModelPath1 = '{0}[{1}]'.format(blockToAdd, index);
						//������� ���-�������� �������.
						var ChildViewModel1 = constructorStore[childFormObject1.DescriptorKey];
						if (ChildViewModel1 == null) {
							ChildViewModel1 = constructorStore['Placeholder'];
						}
						var params2 = {
							'viewModelPath': viewModelPath1,
							'businessEntityPath': childFormObject1.Path,
							'dynamicFormHub': dynamicFormHub,
							'elementDescriptor': childFormObject1,
							'Parent': viewModel.itemToAdd
						};
						var childViewModel1 = new ChildViewModel1(params2);

						// ������������� �� ��������� ������ ��� ���� (���� ����)
						//childViewModel1.onValueChanged.subscribe(dynamicFormHub.updateValue);

						//��� ������� ������������ ����������� �������������
						if (childFormObject1.DescriptorKey === "DictionaryRegistryControlDescriptor") {
							childViewModel1.DictionaryId(childFormObject1.DictionaryId);
							childViewModel1.DictionarySource(childFormObject1.DictionarySource);
							childViewModel1.DisplayFieldScript(childFormObject1.DisplayFieldScript);
						}

						//Ÿ ��������.
						childFormObject1.viewModelPath = viewModelPath1;
						var markupTemplate1 = templatesForUsing[childFormObject1.DescriptorKey];
						if (markupTemplate1 === undefined) {
							markupTemplate1 = templatesForUsing['Placeholder'];
						}
						childViewModel1.markup = $(markupTemplate1).render(childFormObject1);
						//��������� ��� ���� �������� �������� (����� � � ���� ���� ����).
						recursion(childViewModel1, childFormObject1, dynamicFormHub, templatesForUsing, blockToAdd, false, fileId, componentId);
						//������������ �������� �������� ��� ����������
						viewModel.itemToAdd.markup += childViewModel1.markup;
						//��������� � ����������� ������� ������
						viewModel.itemToAdd.FormElements.push(childViewModel1);
					}
					if (viewModel.itemToAdd != null)
						viewModel.markup = appendFormElementMarkup(viewModel.markup, viewModel.itemToAdd.markup, '[data-control-fragment-id="CollectionItemDescriptor"]');
					//#endregion
				}
			} else if (formObjectInstance.Pages != null) {
				//#region pages
				//��������� ���������� ��� �������
				var containerViewModel = new constructorStore[formObjectInstance.DescriptorKey]({
					'viewModelPath': formObjectInstance.Path,
					'businessEntityPath': formObjectInstance.Path,
					'dynamicFormHub': dynamicFormHub,
					'elementDescriptor': formObjectInstance,
					'Parent': viewModel
				});
				containerViewModel.markup = $(templatesForUsing[formObjectInstance.DescriptorKey]).render(formObjectInstance);
				viewModel.markup = appendFormElementMarkup(viewModel.markup, containerViewModel.markup, '[data-control-fragment-id="{0}-{1}"]'.format(blockToAdd, viewModel.parentPath));

				var pagesSize = formObjectInstance.Pages.length;
				for (var pageIndex = 0; pageIndex < pagesSize; pageIndex++) {
					var pageObject = formObjectInstance.Pages[pageIndex];
					var pageViewModelPath = 'Pages[{0}]'.format(pageIndex);
					//������� ���-������ ������� �� �������
					var childInstViewModel = new constructorStore[pageObject.DescriptorKey]({
						'viewModelPath': pageViewModelPath,
						'businessEntityPath': pageObject.Path,
						'dynamicFormHub': dynamicFormHub,
						'elementDescriptor': pageObject,
						'Parent': viewModel
					});
					//���������� ������ ��������� ����������
					pageObject.viewModelPath = pageViewModelPath;
					//������� �������� �������
					childInstViewModel.markup = $(templatesForUsing[pageObject.DescriptorKey]).render(pageObject);
					recursion(childInstViewModel, pageObject, dynamicFormHub, templatesForUsing, "PageElements", true, fileId, componentId);
					viewModel.Pages.push(childInstViewModel);
					//���������� �������� ������� � �������� ��������.
					viewModel.markup = appendFormElementMarkup(viewModel.markup, childInstViewModel.markup, '[data-control-fragment-id="Pages-{0}"]'.format(viewModel.Path));
					//������ ���������� ���������
					var percent = 100 / pagesSize;
					var button = "<td title=\"" + pageObject.Caption + "\" onclick='Nvx.ReDoc.Workflow.DynamicForm.mainForm.collapsePage(" + pageIndex + ");' style='width: " + percent + "%; position: relative;'>"
						+ "<div class='nvx-dfjsr-tab-white'>"
						+ "<p class='nvx-dfjsr-tab-header dinamicWidthOverflow'>" + pageObject.Caption + "</p>"
						+ "</div>"
						+ '<div data-control-fragment-id="TabSelection"></div>'
						+ "</td>";
					viewModel.markup = appendFormElementMarkup(viewModel.markup, button, '[data-control-fragment-id="Pages-buttons-control"]');
				}
				//#endregion
			}
		};

		//���������� �������� �������� � ����� ��������.
		// formMarkup - ����� ��������.
		// elementMarkup - ��������, ������� ����������� � �����.
		// jqSelector - jQuery-�������� ��� ������ �������� � �������� ������� �������� ��������� ��������.
		var appendFormElementMarkup = function (formMarkup, elementMarkup, jqSelector) {
			var dom = document.implementation.createHTMLDocument('title');
			var jq2 = $(dom.body);
			jq2.append(formMarkup);
			jq2.find(jqSelector).append(elementMarkup);
			var resultMarkup = dom.body.innerHTML;
			return resultMarkup;
		};


		//#region READONLY FORM METHODS

		var buildReadonlyViewModel = function (formObjectInstance, dynamicFormHub) {
			//������ �������� �����.
			var formTemplate = templateStoreReadonly['FormDescriptor'];
			if (formTemplate === undefined) {
				formTemplate = templateStoreReadonly['Placeholder'];
			}
			//����������� ���-������ �����.
			var FormViewModel = constructorStore['FormDescriptor'];
			if (FormViewModel === undefined) { FormViewModel = constructorStore['Placeholder']; }
			//��� ������ �������� viewModel �����, ����� �� ��� �������� ��������.
			var viewModelPath = '_';
			var params = {
				'viewModelPath': viewModelPath,
				'businessEntityPath': formObjectInstance.Path,
				'dynamicFormHub': dynamicFormHub,
				'elementDescriptor': formObjectInstance,
				"EntityPathToViewModel": {},
				"ViewModelPathToViewModel": {}
			};
			var formViewModel = new FormViewModel(params);
			//��������� �������� ������� �����.
			formObjectInstance.viewModelPath = viewModelPath;
			formViewModel.markup = $(formTemplate).render(formObjectInstance);
			//��������� ���-������ � �������� - ����� �������� ���� ������.
			recursion(formViewModel, formObjectInstance, dynamicFormHub, templateStoreReadonly, "FormElements");
			return formViewModel;
		};

		var appendRecursionReadonly = function ($mainFormMarkup, parentPath, controlObject) {
			//������� ��� ������� � ����� ��������.
			var $control = $mainFormMarkup.getWrappedByDiv().find('[data-control-path="{0}"]'.format(controlObject.Path));
			//���� �������� ������ �������� �� �������, �� ��������� �.
			if ($control.exists() === false) {

				//�������� ������ ��������.
				var controlMarkup = renderControl(controlObject);
				//������� � �������� ������ ��������.
				var $mainParent = $mainFormMarkup.find('[data-control-path="{0}"]'.format(controlObject.ParentPath));
				//��������� �������� � �������� ��� ����� ������ ��������.
				$mainParent.find('[data-control-fragment-id="FormElements-{0}"]'.format(controlObject.ParentPath)).append(controlMarkup);
			}
			var formElements = controlObject.FormElements;
			//���� ���� �����.
			if (formElements !== null && $.isArray(formElements) && formElements.length > 0) {
				//��� ������� � ��������� DOM.
				$control = $mainFormMarkup.find('[data-control-path="{0}"]'.format(controlObject.Path));
				//��c�� � �������� ��� ����� ������ ��������.
				var $controlFormElementsContent = $control.find('[data-control-fragment-id="FormElements-{0}"]'.format(controlObject.Path));
				//���������� ����� ������ ��������.
				formElements.forEach(function (item) {
					//�������� �������� �������.
					var childMarkup = renderControl(item);
					//���������� � �������� ��������.
					$controlFormElementsContent.append(childMarkup);
					//��������� �������, ����� ���� ����� (����� ����� �������).
					appendRecursionReadonly($mainFormMarkup, controlObject.Path, item);
				});
			}
			/*We have a collection here!*/
			var collectionElements = controlObject.CollectionElementDescriptor;
			if (collectionElements != null) {
				//��� ����������� ����
				var formElementsC = controlObject.CollectionElementDescriptor.FormElements;
				//���� ���� �����.
				if (formElementsC !== null && $.isArray(formElementsC) && formElementsC.length > 0) {
					//��� ������� � ��������� DOM.
					$control = $mainFormMarkup.find('[data-control-path="{0}"]'.format(controlObject.Path));
					//��c�� � �������� ��� ����� ������ ��������.
					var $controlFormElementsContentC = $control.find('[data-control-fragment-id="FormElements-{0}"]'.format(controlObject.Path)).find('[data-control-fragment-id="CollectionItemDescriptor"]');
					//����������� �������� ������ �������� ������������ �����
					//���������� ����� ������ ��������.
					formElementsC.forEach(function (item) {
						//�������� �������� �������.
						var childMarkup = renderControl(item);
						//���������� � �������� ��������.
						$controlFormElementsContentC.append(childMarkup);
						//��������� �������, ����� ���� ����� (����� ����� �������).
						appendRecursionReadonly($mainFormMarkup, controlObject.Path, item);
					});
				}
			}
		};

		var renderControl = function (control) {
			var controlTemplate = templateStoreReadonly[control.DescriptorKey];
			var controlMarkup = $(controlTemplate).render(control);

			return controlMarkup;
		};

		//��������� ����� � ��������������� ���� � �������� �����������
		var renderReadonlyForm = function (formObjectInstance) {
			var formTemplate = templateStoreReadonly['FormDescriptor'];

			var mainFormMarkup = $(formTemplate).render(formObjectInstance);

			var $mainFormMarkup = $(mainFormMarkup).getWrappedByDiv();
			formObjectInstance.FormElements.forEach(function (item) {
				appendRecursionReadonly($mainFormMarkup, '_', item);
			});

			var markup = $mainFormMarkup.html();
			return markup;
		};

		//#endregion

		return {
			buildViewModel: buildViewModel,
			//������ ����� �� ������������, ���� ��������
			renderReadonlyForm: renderReadonlyForm,
			buildReadonlyViewModel: buildReadonlyViewModel
		};
	});
//������ ��������.
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/scripts/templateReadonlyStore',
	['text!Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templatesReadonly/placeholder-template.html',
		'text!Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templatesReadonly/Form-template.html',
		'text!Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templatesReadonly/DateControl.html',
		'text!Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templatesReadonly/EnumControl.html',
		'text!Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templatesReadonly/BoolControl.html',
		'text!Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templatesReadonly/CollectionControl.html',
		'text!Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templatesReadonly/DictionaryRegistryControl.html',
		'text!Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templatesReadonly/PageControl.html',
		'text!Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templatesReadonly/PageContainerControl.html',
		'text!Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templates2/koPlaceholder.html'
	],
	function(placeholderTemplate,
		formTemplate,
		dateControlTemplate,
		enumControlTemplate,
		boolControlTemplate,
		collectionControlTemplate,
		dictionaryRegistryControl,
		pageControl,
		pageContainerControl,
		koPlaceholder) {

		return {
			'Placeholder': placeholderTemplate,
			'FormDescriptor': formTemplate,
			'TextControlDescriptor': placeholderTemplate,
			'DateControlDescriptor': dateControlTemplate,
			'EnumControlDescriptor': enumControlTemplate,
			'BoolControlDescriptor': boolControlTemplate,
			'CollectionFormDescriptor': collectionControlTemplate,
			'SimpleAttachmentViewModel': placeholderTemplate,
			'IntegerControlDescriptor': placeholderTemplate,
			'FloatControlDescriptor': placeholderTemplate,
			'UuidControlDescriptor': placeholderTemplate,
			'DictionaryRegistryControlDescriptor': dictionaryRegistryControl,
			'CurrentUserViewModel': placeholderTemplate,
			'TitleControlViewModel': placeholderTemplate,
			'PageDescriptor': pageControl,
			'PageContainerControlDescriptor': pageContainerControl,
			'FiasRegionSelectControlViewModel': koPlaceholder,
			'FIAS': koPlaceholder,
			'UserInfoList': placeholderTemplate
		};
	});
//������ ��������.
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/scripts/templateStore2',
		['text!Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templates2/BoolControl.html',
		'text!Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templates2/CollectionControl.html',
		'text!Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templates2/DateControl.html',
		'text!Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templates2/EnumControl.html',
		'text!Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templates2/FloatControl.html',
		'text!Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templates2/Form-template.html',
		'text!Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templates2/IntegerControl.html',
		'text!Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templates2/placeholder-template.html',
		'text!Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templates2/SimpleAttachmentControl.html',
		'text!Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templates2/TextControl-template.html',
		'text!Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templates2/UuidControl.html',
		'text!Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templates2/DictionaryRegistryControl.html',
		'text!Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templates2/CurrentUserControl.html',
		'text!Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templates2/TitleControl.html',
		'text!Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templates2/PageControl.html',
		'text!Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templates2/PageContainerControl.html',
		'text!Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templates2/UserInfoListControl.html',
		'text!Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templates2/koPlaceholder.html'],
	function (
		boolControlTemplate,
		collectionControlTemplate,
		dateControlTemplate,
		enumControlTemplate,
		floatControl,
		formTemplate,
		integerControl,
		placeholderTemplate,
		simpleAttachmentControl,
		textControlTemplate,
		uuidControlTemplate,
		dictionaryRegistryControl,
		currentUserControl,
		titleControl,
		pageControl,
		pageContainerControl,
		userInfoListControl,
		koPlaceholder) {

		var templates = {
			'BoolControlDescriptor': boolControlTemplate,
			'CollectionFormDescriptor': collectionControlTemplate,
			'DateControlDescriptor': dateControlTemplate,
			'EnumControlDescriptor': enumControlTemplate,
			'FloatControlDescriptor': floatControl,
			'FormDescriptor': formTemplate,
			'IntegerControlDescriptor': integerControl,
			'Placeholder': placeholderTemplate,
			'SimpleAttachmentViewModel': simpleAttachmentControl,
			'CurrentUserViewModel': currentUserControl,
			'TextControlDescriptor': textControlTemplate,
			'UuidControlDescriptor': uuidControlTemplate,
			'DictionaryRegistryControlDescriptor': dictionaryRegistryControl,
			'TitleControlDescriptor': titleControl,
			'PageDescriptor': pageControl,
			'PageContainerControlDescriptor': pageContainerControl,
			'UserInfoList': userInfoListControl,
			'FIAS': koPlaceholder,
			'FiasRegionSelectControlViewModel': koPlaceholder
		};

		return templates;
	});

define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/BaseViewModel', [
	'knockout',
	'jquery',
	 'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/scripts/event',
	 'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/DynamicFormController/pathUtil'
], function (ko, $, Event, pathUtil) {
	/** Базовый конструктор для вью-моделей элементов формы. */
	var BaseViewModel = function(params) {
		var self = this;


		var ScriptMediator = params.dynamicFormHub.ScriptMediator;
		self.ScriptMediator = ScriptMediator;
		//Разбираем параметры.
		var viewModelPath = params.viewModelPath;
		var businessEntityPath = params.businessEntityPath;

		self.elementDescriptor = params.elementDescriptor;
		self.onValueChanged = new Event(self);
		self.Parent = params.Parent;
		self.dynamicFormHub = params.dynamicFormHub;

		self.FormObject = params.FormObject || (self.Parent != null ? self.Parent.FormObject : undefined);

		//Свои пути.
		self.viewModelPath = viewModelPath;
		self.Path = businessEntityPath;

		//#region пути и словари путей

		//self.ViewModelPath = viewModelPath;

		self.LocalPath = params.elementDescriptor.LocalPath;
		self.FullPath = self.Parent != null ?
			(
				self.Parent.elementDescriptor.DescriptorKey === "CollectionFormDescriptor" ?
					//для коллекции при создании элемента надо сформировать путь с учётом индекса
					(self.Parent.FullPath === "." ? '' : self.Parent.FullPath) + "[{0}]".format(params.collectionIndex || 0) :// "[{0}]"
					(self.Parent.FullPath === "." ? '' : self.Parent.FullPath + ".") + self.LocalPath
			)
			: self.LocalPath;

		if (self.FullPath !== ".") {
			if (params.dynamicFormHub.EntityPathToViewModel[self.FullPath] != null) {
				console.error('not unique entity path OR Second append to collection');
			}
			params.dynamicFormHub.EntityPathToViewModel[self.FullPath] = self;
			params.dynamicFormHub.EntityPathToViewModelRender[self.FullPath] = self;
		} else {
			//TODO?
		}
		params.dynamicFormHub.ViewModelPathToViewModel[self.viewModelPath] = self;

		//ссылки
		self.ViewModelPathToViewModel = params.dynamicFormHub.ViewModelPathToViewModel;
		self.EntityPathToViewModel = params.dynamicFormHub.EntityPathToViewModel;

		//#endregion

		//Родительские пути.
		self.element = ko.observable();
		self.markup = '';
		self.errorMessage = ko.observable('');
		self.ControlEnabling = ko.observable(true);
		self.ControlVisibility = ko.observable(true);
		self.IsMandatory = ko.observable(params.elementDescriptor && (params.elementDescriptor.IsMandatory || false) || false);

		/**
		 * Флаг валидности контрола (получаем с сервера).
		 */
		self.IsValid = ko.observable(true);

		//Флаг отображения валидности контрола (красная звездочка).
		self.notValidClass = ko.observable(false);

		self.showErrors = ko.observable(true);
		self.showErrors.subscribe(function(val) {
			if (val === false)
				self.notValidClass(false);
		});

		//Подписываемся на сообщения об ошибке валидности контрола(в самом начале значение может быть не валидно, но его подсвечивать не надо).
		self.errorMessage.subscribe(function(newValue) {
			if (self.showErrors()) {
				if (newValue != null && newValue !== "")
					self.notValidClass(true);
				else
					self.notValidClass(false);
			}
		});
		
		if (params.dynamicFormHub.isClientScripts && ScriptMediator)
			self.registerScripts(params.elementDescriptor);

		if (params.dynamicFormHub.isClientScripts && ScriptMediator)
			self.onValueChanged.subscribe(ScriptMediator.valueChanged);


		self.requestArgs = {
			fileId: $('#fileId').val(),
			componentId: $('#componentId').val()
		};
	};

	/**
	* Вычисление полного пути элемента с учётом возможных клонов для передачи его на сервер
	*/
	BaseViewModel.prototype.getFullElementPath = function (element, path) {
		//
		var mbClone = $(element).parents('[data-control-type]');
		if (mbClone.length !== 0) {
			//Есть формы/коллекции где-то выше, поэтому нужно изменить путь
			var resPath = "";
			var containsPath = path.startsWith('_.') ? path.substr(2) : path;
			if (containsPath.contains('.'))
				containsPath = containsPath.substr(containsPath.lastIndexOf('.') + 1);
			//Есть формы/коллекции где-то выше, поэтому нужно изменить путь
			for (var ci = 0; ci < mbClone.length; ci++) {
				if (mbClone[ci].attributes['data-control-path'] != null) {
					var mbClonePath = "";
					if (mbClone[ci].attributes['data-control-type'].value == "collection") {
						if (ci === 0) {
							mbClonePath = $(element).parents('[data-control-fragment-id="CollectionItemDescriptor"]')[0].attributes['data-control-path'].value;
						} else {
							mbClonePath = $(mbClone[ci - 1]).parents('[data-control-fragment-id="CollectionItemDescriptor"]')[0].attributes['data-control-path'].value;
						}
					} else {
						mbClonePath = mbClone[ci].attributes['data-control-path'].value;
					}
					if (mbClonePath !== "" && mbClonePath !== "_" && !containsPath.contains(mbClonePath) && !resPath.contains(mbClonePath) && path !== mbClonePath) {
						resPath = mbClonePath + '.' + resPath.replace('_.', '');
					}
				}
			}
			return resPath + containsPath;
		} else {
			return path;
		}
	};

	BaseViewModel.prototype.getViewModelByPath = function (path) {
		var self = this;
		var absolutePath = pathUtil.toAbsolutePath(path, self.FullPath);
		var element = self.EntityPathToViewModel[absolutePath];
		return element;
	}

	BaseViewModel.prototype.getRootElement = function () {
		var element = this;
		while (element.Parent) {
			element = element.Parent;
		}

		return element;
	}

	BaseViewModel.prototype.updateValue = function (hub, newValue) {

		if (hub.isClientScripts) return;

		if (hub.formWasLoaded() === false)
			return;
		if (hub.loading() === false && newValue !== undefined) {
			var self = this;
			self.requestArgs.Path = self.getFullElementPath(self.element(), self.Path);
			self.requestArgs.Value = newValue;
			hub.updateValue(self.requestArgs);
		}
	};

	/**
	 * Регистрируем скрипты элемента
	 */
	BaseViewModel.prototype.registerScripts = function(elementDescriptor) {

		var self = this;

		// Создаём и регистрируем скрипты по дескриптору
		var ScriptMediator = self.ScriptMediator;
		ScriptMediator.getScriptTypes().forEach(function (scriptType) {
			if (elementDescriptor[scriptType]) {
				self[scriptType] = ScriptMediator.createScriptObject(self, elementDescriptor[scriptType], scriptType);
			}
		});


		// Создаём и регистрируем скрипты валидации

		if (elementDescriptor.ValidationScripts) {
			var validationScripts = [];

			for (var index = 0; index < elementDescriptor.ValidationScripts.length; index++) {
				validationScripts.push(ScriptMediator.createScriptObject(self, elementDescriptor.ValidationScripts[index], 'ValidationScript'));
			}
			this.ValidationScripts = validationScripts;
		}
	};

	BaseViewModel.prototype.setValue = function (value) {
		if (typeof (this.Value) !== 'function') {
			console.log('Попытка проставить в элемент "' + this.Path + '" значение ' + value);
			return;
		}
		var oldValue = this.Value();
		this.Value(value);
		if (oldValue !== value)
			this.onValueChanged.trigger(value);
	};

	BaseViewModel.prototype.getValue = function() {
		return this.Value ? this.Value() : null;
	};
	
	// Валидация

	BaseViewModel.prototype.Validate = function () {

		var isVisible = this.IsControlVisible();
		var isValidated = false;
		if (isVisible) {
			var isMandatoryValid = this.ValidateMandatory();
			if (!isMandatoryValid) {
				isValidated = isMandatoryValid;
				this.errorMessage('Поле обязательно для заполнения');			
			} else {
				isValidated = this.runValidation() && this.runValidationScripts();
			}
		}

		var valid = !isVisible || isValidated;

		this.IsValid(valid);
		return valid;
	}

	BaseViewModel.prototype.runValidation = function () {		
		return true;
	}

	BaseViewModel.prototype.ValidateMandatory = function() {
		return !this.IsMandatory() ||  (this.getValue() !== undefined && this.getValue() !== null && this.getValue() !== '');
	}

	BaseViewModel.prototype.runValidationScripts = function() {

		this.errorMessage('');

		if (this.ValidationScripts) {
			for (var i = 0; i < this.ValidationScripts.length; i++) {
				var script = this.ValidationScripts[i];
				if (script.canLaunchScript() && !script.runScript()) {
					this.errorMessage(this.ValidationScripts[i].Message);
					return false;
				}
			}
		}

		return true;
	}

	/**
	 * Виден ли контрол с учётом видимости родителей
	 */
	BaseViewModel.prototype.IsControlVisible = function() {

		if (this.Parent) {
			return this.ControlVisibility() && this.Parent.IsControlVisible();
		} else {
			this.ControlVisibility();
		}

		return true;
	};

	BaseViewModel.prototype.disableShowErrors = function () {
		this.showErrors(false);
	};

	BaseViewModel.prototype.enableShowErrors = function (showOldError) {
		var self = this;
		var show = self.showErrors();
		if (!show) {
			self.showErrors(true);
			if (showOldError) {
				var error = self.errorMessage();
				self.errorMessage('');
				self.errorMessage(error);
			} else {
				self.errorMessage('');
			}
		}
	};

	BaseViewModel.prototype.nullateProperties = function(objectToClean, startNameTerm) {
		for (var x in objectToClean)
			if (objectToClean.hasOwnProperty(x) && x.lastIndexOf(startNameTerm, 0) === 0) {
				objectToClean[x] = null;
			}
	};

	return BaseViewModel;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/BoolControlViewModel', [
	'knockout',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/BaseViewModel'
], function(ko, inherit, BaseViewModel) {
	/** Чекбокс. */
	var BoolControlViewModel = function(params) {
		var self = this;
		//Вызов конструктора родителя.
		BoolControlViewModel.superclass.constructor.apply(self, arguments);

		//Разбор параметров.
		self.Value = ko.observable(false);

		self.Value.subscribe(function (newValue) {
			self.updateValue(params.dynamicFormHub, newValue);
			self.onValueChanged.trigger(newValue);
		});

		self.ValidateMandatory = function () {
			return !this.IsMandatory() || this.getValue() !== false;
		}
	};
	//Наследуемся.
	inherit(BoolControlViewModel, BaseViewModel);

	return BoolControlViewModel;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/CollectionViewModel', [
	'knockout',
	'require',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/BaseViewModel',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/FormViewModel',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/scripts/constructors',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/dynamicFormBindingHandlers',
	'jqueryExtention'
], function (ko, require, inherit, BaseViewModel, FormViewModel, constructors) {
	/** Клонируемая коллекция. */
	var CollectionViewModel = function (params) {
		var self = this;

		var scriptMediator = params.dynamicFormHub.ScriptMediator;

		//Вызов конструктора родителя.
		CollectionViewModel.superclass.constructor.apply(self, arguments);
		
		//Шаблон элемента коллекции — форма
		self.itemToAdd = null;
		self.ButtonCaption = params.elementDescriptor.ButtonCaption;

		//Список клонов.
		self.CollectionItems = ko.observableArray();
		self.itemNumber = ko.computed(function () {
			return self.CollectionItems().length + 0;
		}, this);

		self.ShowAddItemsButton = ko.observable(true);

		self.maxItemsCount = ko.observable(0);
		self.maxItemsCount.subscribe(function (newValue) {
			self.setShowAddItemsButton(newValue);
		});

		self.setShowAddItemsButton = function (maxItemsCount) {
			if (self.ControlEnabling() === false)
				self.ShowAddItemsButton(false);

			if (maxItemsCount > 0 && self.CollectionItems().length >= maxItemsCount) {
				self.ShowAddItemsButton(false);
			} else {
				self.ShowAddItemsButton(true);
			}
		};

		self.CollectionItems.subscribe(function(newValue) {
			//переустановим видимость кнопки
			self.setShowAddItemsButton(self.maxItemsCount());
		});

		self.addItemOnServer = function () {
			var form = self.addItem();
			
			//если руби то надо добавить элемент на стороне сервера
			if (params.dynamicFormHub.isClientScripts !== true) {
				//Отправить на сервер уведомление, что был добавлен элемент коллекции
				self.requestArgs.Path = self.getFullElementPath(self.element(), self.Path);
				self.requestArgs.Value = "add#" + (self.itemNumber());

				form.disableShowErrors();
				params.dynamicFormHub.updateValue(self.requestArgs).done(function () {
					form.enableShowErrors();
				});
			}
		};

		//функция добавления
		self.addItem = function (formObject) {
			var index = self.itemNumber();
			var pars = {
				//businessEntityPath: params.businessEntityPath + '[{0}]'.format(self.itemNumber),
				businessEntityPath: params.businessEntityPath,
				dynamicFormHub: params.dynamicFormHub,
				viewModelPath: params.viewModelPath,
				elementDescriptor: params.elementDescriptor.CollectionElementDescriptor,
				Parent: self,
				FormObject: formObject,
				collectionIndex: index
			};
			
			var newForm = new FormViewModel(pars);

			if (params.elementDescriptor.CollectionElementDescriptor.FormElements != null) {
				params.elementDescriptor.CollectionElementDescriptor.FormElements.forEach(function (descriptor) {
					newForm.FormElements.push(self.addItemCollectionRecursion(descriptor, params.dynamicFormHub, self.itemToAdd, newForm));
				});
			} else {
				console.log('Warn: CollectionElementDescriptor: ' + params.elementDescriptor.CollectionElementDescriptor.DescriptorKey);
			}

			self.CollectionItems.push(newForm);

			//для того чтобы элементы добавились в разметку (сейчас по ним рассчитывается путь)
			if (params.dynamicFormHub.isClientScripts === true)
				setTimeout(function() {
					scriptMediator.onViewModelBuilded(newForm);
				}, 0);
			
			return newForm;
		};

		self.removeItem = function () {
			var index = self.CollectionItems().indexOf(this);
			self.CollectionItems.remove(this);
			self.nullateProperties(self.dynamicFormHub.EntityPathToViewModel, self.FullPath + '[' + index + ']');

			//для "обязательной" коллекции первый элемент "обновляется"
			if (self.IsMandatory() && self.CollectionItems().length === 0) {
				var form = self.addItem();
				if (params.dynamicFormHub.isClientScripts !== true) {
					form.disableShowErrors();
					self.requestArgs.Path = self.getFullElementPath(self.element(), self.Path);
					self.requestArgs.Value = "renewFirstMandatory";
					params.dynamicFormHub.updateValue(self.requestArgs).done(function () {
						form.enableShowErrors();
					});
				}
				return;
			}
			
			//если руби то надо удалить элемент на стороне сервера
			if (params.dynamicFormHub.isClientScripts !== true) {
				self.requestArgs.Path = self.getFullElementPath(self.element(), self.Path);
				self.requestArgs.Value = "delete#" + (index);
				params.dynamicFormHub.updateValue(self.requestArgs);
			}
		};

		self.setValue = function(value) {
			if (value == null) {
				self.nullateProperties(self.dynamicFormHub.EntityPathToViewModel, self.FullPath);
				self.CollectionItems.removeAll();
				return;
			}
			self.CollectionItems.removeAll();
			self.nullateProperties(self.dynamicFormHub.EntityPathToViewModel, self.FullPath);
			for (var i = 0; i < value.length; i++) {
				var childValue = value[i];
				var item = self.addItem(childValue);
				self.setValueForChild(item, childValue);
			}
		};

		self.setItems = function(value) {
			if (value == null) {
				self.nullateProperties(self.dynamicFormHub.EntityPathToViewModel, self.FullPath);
				self.CollectionItems.removeAll();
				return;
			}
			self.CollectionItems.removeAll();
			self.nullateProperties(self.dynamicFormHub.EntityPathToViewModel, self.FullPath);
			for (var i = 0; i < value.length; i++) {
				var childValue = value[i];
				var item = self.addItem();
				self.setValueForChild(item, childValue);
			}
		};

		self.setValueForChild = function (child, value) {
			if (child.FormElements != null) {
				child.FormElements.forEach(function (formElement) {
					if (formElement.FormElements) {
						if (value[formElement.Path]) {
							self.setValueForChild(formElement, value[formElement.Path]);
						}
					} else if (formElement.Path) {
						var path = formElement.Path;
						if (path.startsWith('_.')) {
							path = path.substr(2, path.length - 2);
						}
						var val = value[path];
						if (val != null) {
							formElement.Value(val);
						}
					} else if (formElement.collectionItems) {
						formElement.collectionItems().forEach(function (childItem, index) {
							self.setValueForChild(childItem, value[index]);
						});
					}
				});
			}
		};

		self.clear = function () {
			self.CollectionItems.removeAll();
		};
	};
	//Наследуемся.
	inherit(CollectionViewModel, BaseViewModel);

	//Расширяем список конструкторов конструктором клонируемой коллекции.
	constructors['CollectionFormDescriptor'] = CollectionViewModel;

	CollectionViewModel.prototype.setValueIfItExist = function (tempoElement, field, value, itemToAdd) {
		if (value != null) {
			tempoElement[field](value);
		} else if (itemToAdd != null) {
			//Если в дескрипторе нет данных, поищем их в шаблонном клоне
			for (var num = 0; num < itemToAdd.FormElements.length; num++) {
				if (itemToAdd.FormElements[num].Path === tempoElement.Path) {
					if (typeof itemToAdd.FormElements[num][field] === "function" && itemToAdd.FormElements[num][field]() != null) {
						tempoElement[field](itemToAdd.FormElements[num][field]());
						break;
					}
				}
			}
		}
	};

	CollectionViewModel.prototype.addItemCollectionRecursion = function (descriptor, dynamicFormHub, itemToAdd, parent) {
		var self = this;
		var tempoElement = new constructors[descriptor.DescriptorKey]({
			businessEntityPath: descriptor.Path,
			dynamicFormHub: dynamicFormHub,
			viewModelPath: descriptor.viewModelPath,
			elementDescriptor: descriptor,
			Parent: parent
		});

		if (descriptor.FormElements != undefined) {
			//Это форма
			descriptor.FormElements.forEach(function (element) {
				tempoElement.FormElements.push(self.addItemCollectionRecursion(element, dynamicFormHub, null, tempoElement));
			});
		}

		if (descriptor.CollectionElementDescriptor != undefined) {
			//Это коллекция
			var collection = tempoElement;

			//костыль Для получения itemToAdd
			//var path = collection.FullPath.replace(/\[\d+\]/, '[0]');
			var path = collection.FullPath + '[0]';
			collection.itemToAdd = self.dynamicFormHub.EntityPathToViewModelRender[path];

			if (dynamicFormHub.isClientScripts === true || dynamicFormHub.formWasLoaded() === true) {
				var count = ko.utils.unwrapObservable(collection.itemNumber);
				if (count === 0 && collection.IsMandatory() === true)
					collection.addItem();
			}

			//return collection;

			//Делаем форму
			//var tempoFormElement = new constructors[descriptor.CollectionElementDescriptor.DescriptorKey]({
			//	businessEntityPath: descriptor.CollectionElementDescriptor.Path,
			//	dynamicFormHub: dynamicFormHub,
			//	viewModelPath: descriptor.CollectionElementDescriptor.viewModelPath,
			//	formObject: descriptor.CollectionElementDescriptor,
			//	Parent: collection
			//});

			//if (descriptor.CollectionElementDescriptor.FormElements == null) {
			//	//дескриптор клонируемого элемента != форма. Найти автора динамической формы и поговорить с ним.
			//	console.log('CollectionElementDescriptor is not a Form');
			//} else {
			//	descriptor.CollectionElementDescriptor.FormElements.forEach(function(element) {
			//		tempoFormElement.FormElements.push(self.addItemCollectionRecursion(element, dynamicFormHub, null, tempoFormElement));
			//	});

			//	tempoElement.itemToAdd = tempoFormElement;

			//	//если коллекция обязательна, то добаляем елемент
			//	if (dynamicFormHub.formWasLoaded() === true) {
			//		var count = ko.utils.unwrapObservable(tempoElement.itemNumber);
			//		if (count === 0 && tempoElement.IsMandatory() === true)
			//			tempoElement.addItem();
			//	}
			//}
		}
		if (descriptor.DescriptorKey === "EnumControlDescriptor") {
			self.setValueIfItExist(tempoElement, 'DictionaryId', descriptor.DictionaryId, itemToAdd);
			self.setValueIfItExist(tempoElement, 'ParentId', descriptor.ParentId, itemToAdd);
		} else if (descriptor.DescriptorKey === "DictionaryRegistryControlDescriptor") {
			self.setValueIfItExist(tempoElement, 'DictionaryId', descriptor.DictionaryId, itemToAdd);
			self.setValueIfItExist(tempoElement, 'ParentId', descriptor.ParentId, itemToAdd);
			self.setValueIfItExist(tempoElement, 'DictionarySource', descriptor.DictionarySource, itemToAdd);
			self.setValueIfItExist(tempoElement, 'DisplayFieldScript', descriptor.DisplayFieldScript, itemToAdd);
		}
		//else if (descriptor.DescriptorKey === "FiasRegionSelectControlViewModel" || descriptor.DescriptorKey === "FIAS") {
		//	if (descriptor.ControlKey != null) {
		//		if (descriptor.ControlKey.contains('!')) {
		//			if (descriptor.ControlKey.contains('-') || descriptor.ControlKey.contains('+'))
		//				tempoElement.FiasComponentVisibility = descriptor.ControlKey.split('!')[0];
		//			tempoElement.FiasComponentMandatory = '!' + descriptor.ControlKey.split('!')[1];
		//			if (tempoElement.FiasComponentMandatory.length > 2)
		//				tempoElement.IsMandatory(true);
		//		} else {
		//			tempoElement.FiasComponentVisibility = descriptor.ControlKey;
		//		}
		//	}
		//}

		self.setValueIfItExist(tempoElement, 'MaxValue', descriptor.MaxValue, itemToAdd);
		self.setValueIfItExist(tempoElement, 'MinValue', descriptor.MinValue, itemToAdd);
		
		if (descriptor.DescriptorKey !== "FiasRegionSelectControlViewModel" && descriptor.DescriptorKey !== "FIAS")
			tempoElement.IsMandatory(descriptor.IsMandatory === true);

		return tempoElement;
	};

	CollectionViewModel.prototype.Validate = function () {

		var items = this.CollectionItems();

		var isValid = true;

		items.forEach(function(item) {
			isValid = item.Validate() && isValid;
		});

		return isValid;
	}

	CollectionViewModel.prototype.disableShowErrors = function () {
		var self = this;
		var items = self.CollectionItems();
		for (var i = 0; i < items.length; i++) {
			var element = items[i];
			element.disableShowErrors();
		}
	};

	CollectionViewModel.prototype.enableShowErrors = function () {
		var self = this;
		var items = self.CollectionItems();
		for (var i = 0; i < items.length; i++) {
			var element = items[i];
			element.enableShowErrors();
		}
	};

	CollectionViewModel.prototype.setMaxItemsCount = function(value) {
		var self = this;
		value = parseInt(value, 10);
		if (isNaN(value))
			return;

		self.maxItemsCount(value);
		var length = self.CollectionItems().length;
		if (value > 0 && length > value) {
			self.CollectionItems.splice(value, length);
			for (var i = value; i < length; i++) {
				//self.CollectionItems.remove(items[i]);
				self.nullateProperties(self.dynamicFormHub.EntityPathToViewModel, self.FullPath + '[' + i + ']');
			}
		}
	};

	return CollectionViewModel;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/CurrentUserViewModel', [
	'knockout',
	'require',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/BaseViewModel'
], function (ko, require, inherit, BaseViewModel) {
	/** Юзернейм сертификата. */
	var CurrentUserViewModel = function (params) {
		var self = this;
		//Вызов конструктора родителя.
		CurrentUserViewModel.superclass.constructor.apply(self, arguments);

		self.Value = ko.observable('');

		if (params.dynamicFormHub.isClientScripts) {
			require(["Nvx.ReDoc.WebInterfaceModule/Content/Scripts/_CommonTemplate/redocUser"], function(redocUser) {
				redocUser.userInfo()
					.done(function(user) {
						self.Value(user.userName);
					});
			});
		}
	};
	//Наследуемся.
	inherit(CurrentUserViewModel, BaseViewModel);

	return CurrentUserViewModel;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/DateControlViewModel', [
	'knockout',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/BaseViewModel',
	'knockout-jqueryui/datepicker',
	'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/jquery-ui/datepicker'
], function (ko, inherit, BaseViewModel) {
	/** Поле для ввода даты. */
	var DateControlViewModel = function (params) {
		var self = this;
		//Вызов конструктора родителя.
		DateControlViewModel.superclass.constructor.apply(self, arguments);

		//Разбор параметров.
		self.MinValue = ko.observable('');
		self.MaxValue = ko.observable('');

		self.Value = ko.observable('');
		self.Value.subscribe(function(newValue) {
			self.updateValue(params.dynamicFormHub, newValue === "" ? null : newValue);
			self.onValueChanged.trigger(newValue);
		});

		//Функция установки модифицированного значения даты.
		self.setValue = function (newValue) {

			//Текущая запись.
			var currentValue = self.Value();

			var modifiedNewValue = null;
		
			if (newValue != null) {
				//Обрезаем время (если запись в виде дата/время через пробел).
				if (!(newValue instanceof Date)) {
					modifiedNewValue = newValue.split(' ')[0];
				} else {
					// Преобразуем в строку, если дата - объект
					// (может быть в результате выполнения скрипта)

					var options = {
						year: 'numeric',
						month: 'numeric',
						day: 'numeric'
					};
					modifiedNewValue = newValue.toLocaleString("ru", options);
				}
			}
			//Изменяем значение и отправляем событие на сервер только в том случае,
			//если "обрезанное" серверное значение не соответствует текущему локальному (уже обрезанному).
			if (modifiedNewValue !== currentValue) {

				//когда используется System.Datetime, то мин. значение 01.01.0001 и мы его не будем проставлять
				var isValidDate = '01.01.0001' !== modifiedNewValue;
				if (isValidDate) {
					//Устанавливаем значение.
					self.Value(modifiedNewValue);
					self.onValueChanged.trigger(modifiedNewValue);
				}
			}
		};
	};
	//Наследуемся.
	inherit(DateControlViewModel, BaseViewModel);

	return DateControlViewModel;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/DictionaryRegistryControlViewModel', [
	'knockout',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/BaseViewModel',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/dynamicFormBindingHandlers',
	'select2lib'
], function (ko, inherit, BaseViewModel) {
	/** Внешний справочник. */
	var DictionaryRegistryControlViewModel = function (params) {
		var self = this;
		//Вызов конструктора родителя.
		DictionaryRegistryControlViewModel.superclass.constructor.apply(self, arguments);

		self.multiflag = params.elementDescriptor.ControlKey === "CheckComboBox" ? true : false;
		self.options = ko.observableArray();
		self.metaData = ko.observableArray();
		//идентификатор внешнего справочника
		self.DictionaryId = ko.observable(null);
		//идентификатор справочника-родителя
		self.ParentId = ko.observable(null);
		self.DictionarySource = ko.observable('');
		self.DisplayFieldScript = ko.observable('');
		self.nullTitle = params.elementDescriptor.NullTitle;

		self.selectedValueS2 = ko.observable();

		self.isSave = ko.observable(params.elementDescriptor.IsSave);

		self.selectedValueS2.subscribe(function (newValue) {
			if (newValue === undefined) {
				newValue = null;
				//return;
			}

			if (self.multiflag === true) {
				if (newValue === null) {
					self.requestArgs.Value = [];
				} else {
					if (typeof(newValue) !== 'object')
						return;
					var data = newValue || [];
					self.requestArgs.Value = data.removeByValue('null').removeByValue('');
				}
			} else {
				self.requestArgs.Value = newValue;
			}
			self.updateValue(params.dynamicFormHub, self.requestArgs.Value);
			self.onValueChanged.trigger(newValue);

		});

		self.setValue = function(value) {
			self.selectedValueS2(value);
		};

		self.getValue = function() {
			return self.selectedValueS2();
		};

		self.ValidateMandatory = function () {
			return !this.IsMandatory() || self.selectedValueS2() !== undefined && self.selectedValueS2() !== null && self.selectedValueS2().length > 0;
		}
	};
	//Наследуемся.
	inherit(DictionaryRegistryControlViewModel, BaseViewModel);

	return DictionaryRegistryControlViewModel;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/EnumControlViewModel', [
		'knockout',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
		'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/BaseViewModel',
		'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/dynamicFormBindingHandlers',
		'select2lib'
	], function(ko, inherit, BaseViewModel) {
		//http://jsfiddle.net/C3h4W/
		/** Комбобокс с единственным допустимым элементов для выбора.. */
		var EnumControlViewModel = function(params) {
			var self = this;
			//Вызов конструктора родителя.
			EnumControlViewModel.superclass.constructor.apply(self, arguments);

			//Разбор параметров.
			var elementDescriptor = params.elementDescriptor;

			self.multiflag = params.elementDescriptor.ControlKey === "CheckComboBox" ? true : false;
			
			self.selectedValue = ko.observable();
			self.selectedValueS2 = self.multiflag === true ? ko.observable([]) : ko.observable();

			self.isSave = ko.observable(elementDescriptor.IsSave);
			
			self.options = elementDescriptor.EnumLiterals;
			self.nullTitle = elementDescriptor.NullTitle;

			self.selectedValueS2.subscribe(function (newValue) {
				if (newValue === undefined || newValue === '') {
					newValue = null;
					//return;
				}

				if (newValue === null) {
					self.updateValue(params.dynamicFormHub, null);
					self.onValueChanged.trigger(null);
					return;
				}

				if (self.multiflag === true) {
					if (typeof(newValue) === "string") {
						var data = newValue.split(',');
						data.removeByValue('null');

						var lastVals = $(self.element()).children().last().val();
						if (lastVals != null && lastVals.length > 0) {
							self.requestArgs.Value = (lastVals.indexOf(newValue) === -1) ?
								lastVals.concat(data) :
								self.requestArgs.Value = lastVals;
						} else {
							self.requestArgs.Value = [];
						}
					} else {
						self.requestArgs.Value = newValue;
					}
				} else {
					self.requestArgs.Value = newValue;
				}
				self.updateValue(params.dynamicFormHub, self.requestArgs.Value);
				self.onValueChanged.trigger(newValue);

			});

			self.setValue = function(value) {
				self.selectedValueS2(value);
			};

			self.getValue = function() {
				return self.selectedValueS2();
			};

			self.ValidateMandatory = function() {
				return !this.IsMandatory() || self.selectedValueS2() !== undefined && self.selectedValueS2() !== null && self.selectedValueS2().length > 0;
			};
		};
		//Наследуемся.
		inherit(EnumControlViewModel, BaseViewModel);

		return EnumControlViewModel;
	});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/FiasRegionSelectControlViewModel', [
	'jquery',
	'knockout',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/BaseViewModel',
	'Nvx.ReDoc.DynamicFormsFiasControl/Web/Content/Scripts/FiasViewModels/RegisterFiasViewModel',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/nvxRedocCommon',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/preferences'
], function ($, ko, inherit, BaseViewModel, RegisterFiasViewModel, nvxRedocCommon, preferences) {
	/**
	 * Вью-модель обертка для динамических форма контрола ФИАС.
	 */
	var FiasRegionSelectControlViewModel = function (params) {
		var self = this;

		//Вызов конструктора родителя.
		FiasRegionSelectControlViewModel.superclass.constructor.apply(self, arguments);
		/**
		 * Идентификатор вью-модели.
		 * @type {String}
		 */
		self.typeId = 'FiasRegionSelectControlViewModel';

		//#region Использование э/у Адрес (https://cnf.egspace.ru/pages/viewpage.action?pageId=35915145).
		/**
		 * Какие из полей ФИАС видимы.
		 */
		self.FiasComponentVisibility = '-:';
		/**
		 * Какие из полей ФИАС обязательны.
		 */
		self.FiasComponentMandatory = '!:';
		//#endregion

		/**
		 * Идентификатор шаблона ФИАС-контрола.
		 */
		self.templateId = ko.observable('placeholderTemplate');
		/**
		 * Вью-модель ФИАС-контрола.
		 */
		self.templateViewModel = ko.observable(null);

		/**
		 * Все даные объекта ФИАС целиком в том виде, в котором они пришли с сервера.
		 */
		self.Value = ko.observable(null);
		//После получения данных с сервера, пишем их во внутреннюю вью-модель.
		self.Value.subscribe(function (newValue) {
			//Данные для заполнения (переводим имена свойств в CamelCase).
			var entity = nvxRedocCommon.toCamelCase(newValue);
			//Внутренняя вью-модель.
			var templateViewModel = self.templateViewModel();

			//Если это первое заполнение данных, то фигачим всю плюху целиком.
			//(это вызовет подтягивание данных с БД ФИАСа).
			var data = (typeof templateViewModel.value === 'function') ? templateViewModel.value() : templateViewModel.value;

			if (params.dynamicFormHub.formWasLoaded() === false) {
				templateViewModel.validationEnabled(false);
			}

			if (data == null || $.isEmptyObject(data)) {
				if (params.dynamicFormHub.IsFormReadonly === true)
					templateViewModel.setValue(entity, 'readonly');
				else
					templateViewModel.setValue(entity);
			} else {
				if (entity != null) {					
					templateViewModel.entityId = entity.id;
					if (params.dynamicFormHub.formWasLoaded() === false) {
						templateViewModel.setValue(entity);
					} else {
						//templateViewModel.updateValue(entity, true);
						templateViewModel.setValue(entity);
					}
				}
			}

			if (params.dynamicFormHub.formWasLoaded() === false) {
				templateViewModel.validationEnabled(true);
			} else {
				self.onValueChanged.trigger(self.getValue());
			}
		});
		//обновление подсветки полей при каждой нотификации, а не только когда меняется значение валидности всей модели
		self.IsValid = ko.observable(true).extend({ notify: 'always' });

		self.IsValid.subscribe(function (newValue) {
			//self.notValidClass(!newValue);

			if (newValue === true)
				self.clearErrors();
		});

		self.setValue = function(str) {
			if (str) {
				//боюсь, внутри toCamelCase вас будет ожидать бо-о-о-оль
				if (typeof str == 'string') {
					var value = nvxRedocCommon.toCamelCase(JSON.parse(str));
					self.Value(value);
				}
				else
				{
					var value = nvxRedocCommon.toCamelCase(str);
					self.Value(str);
				}
			}
		};

		self.runValidation = function () {
			if (params.dynamicFormHub.isClientScripts === true)
				return self.templateViewModel().isValid();
			return true;
		};

		self.setError = function(modelName, error) {
			var fm = self.templateViewModel();
			fm.clearValidationErrors();
			var model = fm[modelName];
			if (model && error && self.showErrors()) {
				model.notValid(true);
				model.notValidError(error);
			}
		};

		/**
		 * Возвращает текущее состояние значений контрола ФИАС
		 * @returns {FiasAddressCore} 
		 */
		self.getValue = function () {
			var self = this;
			if (self.templateViewModel() == null)
				return null;

			var value = nvxRedocCommon.toPascalCase(self.templateViewModel().value());
			return value;
		};

		self.isEmpty = function() {

			var data = self.templateViewModel().value();
			var dataEmpty = true;
			for (var property in data) {
				if (data.hasOwnProperty(property) && data[property] !== null) {
					dataEmpty = false;
					break;
				}
			}

			return dataEmpty;
		};

		/**
		 * Отправляет уведомление об изменении состояния вью-модели на клиенте.
		 */
		self.updateValueOnServer = function () {
			if (params.dynamicFormHub.IsFormReadonly === true)
				return;
			if (params.dynamicFormHub.formWasLoaded() === false)
				return;
			if (preferences.log === true) {
				console.log('Fias updateValueOnServer');
			}
			if (self.templateViewModel() == null)
				return;
			if (params.dynamicFormHub.isClientScripts) {
				var val = self.templateViewModel().value();
				val.id = self.templateViewModel().entityId;
				self.Value(val);
				return;
			}

			self.requestArgs.Path = self.getFullElementPath(self.element(), self.Path);
			//Данные для заполнения (переводим имена свойств в PascalCase).
			var entity = nvxRedocCommon.toPascalCase(self.templateViewModel().value());
			self.requestArgs.Value = entity;
			params.dynamicFormHub.updateValue(self.requestArgs);
		};

		/**
		 * ПЕРЕНЁС ВЫЗОВ В СОЗДАНИЕ ВЬЮ_МОДЕЛИ в остальных местах он не нужен
		 * Формируем внутреннюю вью-модель ФИАС-контрола (набор полей)
		 * и отображаем её.
		 */
		self.initTemplate = function (templateId) {
			var self = this;
			if (self.inited)
				return;

			var mandatoryMask = "";
			var mask = params.elementDescriptor.ControlKey || "";
			var index = mask.indexOf("!");
			if (index>=0) {
				mandatoryMask = mask.substring(index, mask.length);
			}
			var visibilityMask = "-";
			if (mask.lastIndexOf("+", 0) === 0 || mask.lastIndexOf("-", 0) === 0) {
				visibilityMask = mask.substring(0, index);
			}
			

			var description = {
				displayName: '',
				field: 'this',
				visibilityMask: visibilityMask,
				requiredMask: mandatoryMask
			};

			//Вью-модель.
			var initValidation = params.dynamicFormHub.isClientScripts !== true;
			var templateViewModel = new RegisterFiasViewModel(description, initValidation);

			//избавляемся от множественных уведомлений об изменениях
			var delayObject = ko.observable().extend({ rateLimit: { timeout: 1, method: "notifyWhenChangesStop" } });
			delayObject.subscribe(function (newValue) {
				self.updateValueOnServer(newValue);
			});

			templateViewModel.value.subscribe(function (newValue) {
				delayObject(newValue);				
			});

			self.templateViewModel(templateViewModel);
			self.templateId(templateId);
		};

		self.inited = false;

		//Запуск!
		self.initTemplate(params.dynamicFormHub.IsFormReadonly === true ? 'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templatesReadonly/fias.tmpl.html' : 'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templates2/fias.tmpl.html');
	};

	//Наследуемся.
	inherit(FiasRegionSelectControlViewModel, BaseViewModel);

	FiasRegionSelectControlViewModel.prototype.clearErrors = function () {
		var self = this;
		var fm = self.templateViewModel();
		if (fm)
			fm.clearValidationErrors();
	};

	FiasRegionSelectControlViewModel.prototype.disableShowErrors = function () {
		var self = this;
		self.showErrors(false);
	};

	FiasRegionSelectControlViewModel.prototype.enableShowErrors = function (showOldError) {
		var self = this;
		var show = self.showErrors();
		if (!show) {
			self.showErrors(true);
			if (showOldError) {
				var error = self.errorMessage();
				self.errorMessage('');
				self.errorMessage(error);
			} else {
				self.errorMessage('');
				self.clearErrors();
			}
		}
	};

	return FiasRegionSelectControlViewModel;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/FloatControlViewModel', [
	'knockout',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/BaseViewModel'
], function (ko, inherit, BaseViewModel) {
	/** Текстовый контрол для ввода чисел с точкой. */
	var FloatControlViewModel = function (params) {
		var self = this;
		//Вызов конструктора родителя.
		FloatControlViewModel.superclass.constructor.apply(self, arguments);

		//Разбор параметров.
		self.Mask = ko.observable('^(0[.,][1-9]|0[.,][1-9]0|0[.,]0[1-9]|0[.,][1-9]{2}|[1-9]\\d*([.,]\\d{1,2})?)$');
		self.MaxValue = ko.observable(params.elementDescriptor.MaxValue);
		self.MinValue = ko.observable(params.elementDescriptor.MinValue);
		self.Value = ko.observable('');
		self.Value.subscribe(function (newValue) {
			self.updateValue(params.dynamicFormHub, newValue);
			self.onValueChanged.trigger(newValue);
		});

		self.runValidation = function () {
			var regExpr = new RegExp(self.Mask(), 'ig');
			return regExpr.test(self.Value());
		}
	};
	//Наследуемся.
	inherit(FloatControlViewModel, BaseViewModel);

	return FloatControlViewModel;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/FormViewModel', [
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/BaseViewModel'
], function (inherit, BaseViewModel) {
	/** Форма. */
	var FormViewModel = function (params) {
		var self = this;
		//Вызов конструктора родителя.
		FormViewModel.superclass.constructor.apply(self, arguments);

		/** Дети формы. */
		self.FormElements = [];

		self.Validate = function() {
			var valid = true;
			for (var i = 0; i < self.FormElements.length; i++) {
				valid = self.FormElements[i].Validate() && valid;
			}
			return valid;
		};
	};

	//Наследуемся.
	inherit(FormViewModel, BaseViewModel);

	FormViewModel.prototype.disableShowErrors = function () {
		var self = this;
		for (var i = 0; i < self.FormElements.length; i++) {
			var element = self.FormElements[i];
			element.disableShowErrors();
		}
	};

	FormViewModel.prototype.enableShowErrors = function () {
		var self = this;
		for (var i = 0; i < self.FormElements.length; i++) {
			var element = self.FormElements[i];
			element.enableShowErrors();
		}
	};

	return FormViewModel;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/IntegerControlViewModel', [
	'knockout',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/BaseViewModel'
], function (ko, inherit, BaseViewModel) {
	/** Текстовый контрол для ввода числовых значений. */
	var IntegerControlViewModel = function (params) {
		var self = this;
		//Вызов конструктора родителя.
		IntegerControlViewModel.superclass.constructor.apply(self, arguments);

		//Разбор параметров.
		self.Mask = ko.observable('^[0-9]+$');

		self.MaxValue = ko.observable(params.elementDescriptor.MaxValue);
		self.MinValue = ko.observable(params.elementDescriptor.MinValue);
		self.Value = ko.observable('');
		self.Value.subscribe(function (newValue) {
			self.updateValue(params.dynamicFormHub, newValue);
			self.onValueChanged.trigger(newValue);
		});


		self.runValidation = function () {
			var regExpr = new RegExp(self.Mask(), 'ig');
			return regExpr.test(self.Value());
		}
	};
	//Наследуемся.
	inherit(IntegerControlViewModel, BaseViewModel);

	return IntegerControlViewModel;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/PageContainerViewModel', [
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/BaseViewModel'
], function (inherit, BaseViewModel) {
	/** Контейнер вкладок. */
	var PageContainerViewModel = function (params) {
		var self = this;
		//Вызов конструктора родителя.
		PageContainerViewModel.superclass.constructor.apply(self, arguments);

		self.Pages = [];
	};
	//Наследуемся.
	inherit(PageContainerViewModel, BaseViewModel);

	return PageContainerViewModel;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/PageViewModel', [
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/BaseViewModel'
], function (inherit, BaseViewModel) {
	/** Вкладка. */
	var PageViewModel = function (params) {
		var self = this;
		//Вызов конструктора родителя.
		PageViewModel.superclass.constructor.apply(self, arguments);

		self.FormElements = [];
		self.PageElements = [];
	};
	//Наследуемся.
	inherit(PageViewModel, BaseViewModel);

	return PageViewModel;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/PlaceholderViewModel', [
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/BaseViewModel'
], function (inherit, BaseViewModel) {
	/** Плейсхолдер. */
	var PlaceholderViewModel = function (params) {
		var self = this;
		//Вызов конструктора родителя.
		PlaceholderViewModel.superclass.constructor.apply(self, arguments);

	};
	//Наследуемся.
	inherit(PlaceholderViewModel, BaseViewModel);

	return PlaceholderViewModel;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/SimpleAttachmentViewModel', [
	'knockout',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/BaseViewModel',
	'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/knockout-file-bindings/knockout-file-bindings'
], function (ko, inherit, BaseViewModel) {
	/** Вложение. */
	var SimpleAttachmentViewModel = function (params) {
		var self = this;
		//Вызов конструктора родителя.
		SimpleAttachmentViewModel.superclass.constructor.apply(self, arguments);

		//Нужно для legacy-реализации форм вместо нормального конструктора.
		//BaseViewModel.apply(self, [params]);

		self.certificateFileTextArray = ['Вложение не выбрано', 'Выбрать файл вложения', 'Выбран файл вложения'];

		self.Value = ko.observable('');

		self.getCleanValue = function() {
			return self.Value().replace("C:\\fakepath\\", "");
		};

		//Выбранный файл сертификата.
		self.certificateFile = ko.observable({
			dataURL: ko.observable()
			// base64String: ko.observable(),
		});
		
		//Есть выбранный ранее файл
		self.previousExist = ko.observable(false);

		//Реагируем на событие выбора файла сертификата.
		self.certificateFile.subscribe(function (fileInput) {
			var file = fileInput.file();
			if (file != null) {
				//Устанавливаем имя выбранного файла сертификата.
				self.certificateFileName(file.name);
				//Отображаем всё это счастье.
				self.certificateFileSelected(true);
				//Устанавливаем соответствующую фразу.
				self.certificateFileText(self.certificateFileTextArray[2]);

				self.updateValue(params.dynamicFormHub, file.name);
			}
		});

		//Если выбран файл, то скрываем окно выбора пользователя (UserInfo).
		self.onClear = function (fileData, options) {
			//Очищаем данные о выбранном файле.
			fileData.clear();
			//Меняем фразу, которая меняется при выборе файла сертификата.
			self.certificateFileText(self.certificateFileTextArray[1]);
			//Скрываем имя выбранного файла сертификата.
			self.certificateFileSelected(false);
			//Сбрасываем имя сертификата.
			self.certificateFileName(self.certificateFileTextArray[0]);

			self.Value('');
			self.updateValue(params.dynamicFormHub, null);
		};

		self.setPrevious = function (name) {
			if (name == null)
				return;
			self.certificateFileText(self.certificateFileTextArray[2]);
			self.certificateFileName(name);
			self.certificateFileSelected(true);
			self.previousExist(true);
		};

		self.clearPrevious = function () {
			self.previousExist(false);
			self.certificateFileText(self.certificateFileTextArray[1]);
			self.certificateFileName(self.certificateFileTextArray[0]);
			self.certificateFileSelected(false);
			self.updateValue(params.dynamicFormHub, null);
		};
		
		//Фраза, которая меняется при выборе файла сертификата.
		self.certificateFileText = ko.observable(self.certificateFileTextArray[1]);
		//Флаг отображения имени выбранного файла сертификата.
		self.certificateFileSelected = ko.observable(false);
		//Имя выбранного файла сертификата.
		self.certificateFileName = ko.observable(self.certificateFileTextArray[0]);

		self.ValidateMandatory = function() {
			return !this.IsMandatory() || this.getValue() || this.previousExist();
		}
	};
	//Наследуемся.
	inherit(SimpleAttachmentViewModel, BaseViewModel);

	//Нужно для legacy-реализации форм вместо нормального наследования.
	//SimpleAttachmentViewModel.prototype = BaseViewModel;

	return SimpleAttachmentViewModel;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/TextControlViewModel', [
	'knockout',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/BaseViewModel'
], function (ko, inherit, BaseViewModel) {

	/** Текстовое поле. */
	var TextControlViewModel = function (params) {
		var self = this;
		//Вызов конструктора родителя.
		TextControlViewModel.superclass.constructor.apply(self, arguments);

		//Разбор параметров.
		self.MaxLength = ko.observable();
		self.Mask = ko.observable(params.elementDescriptor.Mask);
		self.Pinput = ko.observable('');
		if (params.elementDescriptor.Pinput != null) {
			var regul = "[";
			if (params.elementDescriptor.Pinput.contains('Digit'))
				regul += '0-9';
			if (params.elementDescriptor.Pinput.contains('Latin'))
				regul += 'A-Za-z';
			if (params.elementDescriptor.Pinput.contains('Cyrilic'))
				regul += 'А-Яа-яЁё';
			if (params.elementDescriptor.Pinput.contains('Space'))
				regul += ' ';
			if (params.elementDescriptor.Pinput.contains('Special'))
				regul += '~"@$!#,%\\^\'&\\*\\(\\)\\[\\]{}\\+=_;:<>№\\|\\?\\\\\\.\\-';
			regul += ']+';

			//Ограничение ввода, если описатель об этом говорит
			self.regexp = new RegExp(regul, 'g');
			self.Pinput(regul);
		}
		if (params.elementDescriptor.MaxLength != null && params.elementDescriptor.MaxLength !== 0) {
			self.MaxLength(params.elementDescriptor.MaxLength);
		}

		self.Value = ko.observable('');
		self.Value.subscribe(function (newValue) {

			if (newValue !== undefined) {
				if (self.regexp != null && newValue != null) {
					var fArray = newValue.match(self.regexp);
					if (fArray != null) {
						var filtered = fArray.join('');
						if (filtered !== newValue) {
							self.Value(filtered);
							return;
						}
					} else {
						newValue = '';
						self.Value(newValue);
					}
				}
				self.updateValue(params.dynamicFormHub, newValue);

				self.onValueChanged.trigger(newValue);
			}
		});
	};

	//Наследуемся.
	inherit(TextControlViewModel, BaseViewModel);


	TextControlViewModel.prototype.setValue = function (newValue) {
		BaseViewModel.prototype.setValue.call(this, newValue == null ? null : newValue.toString());
	};

	return TextControlViewModel;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/TitleControlViewModel', [
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/BaseViewModel'
], function (inherit, BaseViewModel) {
	/** Плейсхолдер. */
	var TitleControlViewModel = function (params) {
		var self = this;
		//Вызов конструктора родителя.
		TitleControlViewModel.superclass.constructor.apply(self, arguments);


		self.Validate = function() {
			return true;
		}

	};
	//Наследуемся.
	inherit(TitleControlViewModel, BaseViewModel);

	return TitleControlViewModel;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/UserInfoListViewModel', [
	'knockout',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/BaseViewModel'
], function (ko, inherit, BaseViewModel) {
	/** Текстовое поле. */
	var UserInfoList = function (params) {
		var self = this;
		
		self.Value = ko.observable();
		//Вызов конструктора родителя.
		UserInfoList.superclass.constructor.apply(self, arguments);

		self.typeId = "UserInfoList";

		self.Value.subscribe(function (newValue) {
			if (newValue !== undefined && newValue !== null) {
				self.updateValue(params.dynamicFormHub, newValue);
				self.onValueChanged.trigger(newValue);
			}
		});
	};
	//Наследуемся.
	inherit(UserInfoList, BaseViewModel);

	return UserInfoList;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/UuidControlViewModel', [
	'knockout',
	'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/guid/guid',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/viewModel/BaseViewModel'
], function (ko, guid, inherit, BaseViewModel) {
	/** Текстовый невидимый контрол для хранения GUID. */
	var UuidControlViewModel = function (params) {
		var self = this;
		//Вызов конструктора родителя.
		UuidControlViewModel.superclass.constructor.apply(self, arguments);
		
		self.Value = ko.observable(guid.create());

		self.Value.subscribe(function (newValue) {
			if (newValue !== undefined && newValue !== null) {
				self.requestArgs.Path = self.Path;//self.getFullElementPath(self.element(), self.Path);
				self.requestArgs.Value = newValue;
				params.dynamicFormHub.updateValue(self.requestArgs);
			}
		});
	};
	//Наследуемся.
	inherit(UuidControlViewModel, BaseViewModel);

	return UuidControlViewModel;
});
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/DynamicFormController/abstractHostObject',
	['jquery'],
	function ($) {

		// Абстрактный класс HostObject		
		var AbstractHostObject = {

			constructor: function (model) {
				this.model = model;
			},

			GetValue : function (path) {
				throw new TypeError("Method not implemented");
			}
		}
		
		return AbstractHostObject;
	});


/**************************************/
/* Этот документ создан автоматически */
/**************************************/

define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/DynamicFormController/ClientJsonParser',
	[],
	function () {

		//парсер json'а сущности возращаемой с сервера
		var Parser = function () {
			var self = this;
			self.DateRegex = /^\/Date\(((?:-)?\d+)\)\/$/;
			
			self.parse = function (key, value) {
				
				//парсинг даты
				if (typeof value === 'string') {
					var match = self.DateRegex.exec(value);
					if (match) {
						var b = match[1];
						var date = new Date(parseInt(b, 10));
						return date;
					}
				}
				//кастомные методы объекта которые могут вызываться в скриптах
				if(value && value["$redocDfType"] != null)
				{
					value["ToString"] = function(){
									return value["$ToStringStringValue"];
									};
value["toString"] = function(){
									return value["$ToStringStringValue"];
									};
				}
				return value;
			};
		};

		return Parser;
	});
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/DynamicFormController/dynamicFormHub',
	['jquery',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/DynamicFormController/abstractHostObject',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/DynamicFormController/pathUtil'],
	function($m, abstractHostObject, pathUtil) {


		var DynamicFormHub = function() {

			self = this;

			// хаб
			self.dynamicFormHub = null;

			/*
             * Инициализация хаба
             */
			self.init = function() {
				self.dynamicFormHub = $.connection.dynamicFormHub;

				if (self.dynamicFormHub) {
					console.log("InitHub started.");
				} else {
					throw new Error('Hub not started.');
				}
			};


			// серверные методы

			/*
             * Получение формы с сервера
             */
			self.getFormEntityJson = function(requestArgs, done, fail) {
				self.dynamicFormHub.server.getFormEntityJson(requestArgs)
					.done(self.done)
					.fail(fail);
			};
			
			// события

			/*
             * Изменено значение поля
             */
			self.onValueChanged = function(handler) {
				self.dynamicFormHub.client.valueChangedOnServer = handler;
			};

			/*
             * Получена вью-модель?
             */
			self.onGetClientViewModel = function(handler) {
				self.dynamicFormHub.client.getClientViewModel = handler;
			};
		};
	});
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/DynamicFormController/knockoutHostObject',
	['jquery',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/DynamicFormController/abstractHostObject',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/DynamicFormController/pathUtil',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/preferences'
	],
	function ($m, abstractHostObject, pathUtil, preferences) {

		var EnumWrapper = function (viewModel, id) {
			var self = this;
			self.EnumValue = id;
			self.EnumId = id;
			self.EnumTitle = (viewModel.options.filter(function (item) {
				return item.LV === id;
			}) || {})[0].DA;
			self.toString = function () {
				return self.EnumTitle;
			};
			self.ToString = function () {
				return self.EnumTitle;
			};
			self.DataObject = self;
		};

		var WrappersFactory = function () {
			var self = this;
			self.GetValue = function(element) {
				if (element.selectedValueS2 !== undefined) {
					if (element.elementDescriptor.DescriptorKey === "EnumControlDescriptor" && element.elementDescriptor.IsSave) {
						var value = element.selectedValueS2();
						if (value) {
							if (element.multiflag && value.length) {
								return value.map(function (item) {
									return new EnumWrapper(element, item);
								});
							}
							return new EnumWrapper(element, value);
						}
						return null;
					}
					return element.selectedValueS2();
				} else {
					if (element.elementDescriptor.DescriptorKey === "DateControlDescriptor") {
						return self.getWrapedDate(element);
					}
					if (
						element.elementDescriptor.DescriptorKey === "FiasRegionSelectControlViewModel"||
						element.elementDescriptor.DescriptorKey === "FIAS"
						) {
						return self.getWrapedFias(element);
					}
					return element.Value();
				}
			};

			self.getWrapedDate = function (element) {
				var dateStr = element.Value();
				var date = null;
				try {
					if (dateStr != null && dateStr !== "") {
						var parts = dateStr.split('.');
						date = new Date(parts[2], parts[1] - 1, parts[0]);
					}
				} catch (e) {
					console.error("can't parse date correctly");
				}
				return date && isNaN(date.getTime()) ? null : date;
			};

			self.getWrapedFias = function (viewModel) {
				var value = viewModel.getValue();
				if (value) {
					var toStr = function () {
						return value.FullAddress;
					};
					value.toString = toStr;
					value.ToString = toStr;

					if (value.DataObject == null)
						value.DataObject = value;
				}
				return value;
			};
		};

		// Хост-объект для формы
		var HostObject = function (contextElement) {
			var self = this;
			self.wrappersFactory = new WrappersFactory();
			self.contextElement = contextElement;
			self.FormObject = contextElement.FormObject;
			self.getViewModelForPath = function (path) {
				var absolutePath = pathUtil.toAbsolutePath(path, self.contextElement.FullPath);
				var element = self.contextElement.EntityPathToViewModel[absolutePath];
				return element;
			};

			self.logNotFoundByPathError = function (path) {
				if (preferences.log === true) {
					console.warn('can not find element by path', path);
					console.warn('contextElement path', this.contextElement.FullPath);
				}
			};
		};

		// Наследуемся
		HostObject.prototype = abstractHostObject;

        // Получене значения элемента по пути.
		HostObject.prototype.GetValue = function (path) {
			var self = this;
			var element = this.getViewModelForPath(path);
			if (element == null) {
				this.logNotFoundByPathError(path);
				return null;
			}
			return self.wrappersFactory.GetValue(element);
		};

		// Получение переменной контекста формы
		HostObject.prototype.GetContextVariable = function (key) {

			if (!this.formContextData)
				this.formContextData = this.contextElement.getRootElement().formContextData; 

			if (this.formContextData) {
				return this.formContextData[key];
			}
			return null;
		};

		// Установка значения элемента по пути.
		HostObject.prototype.SetValue = function (path, value) {

			var element = this.getViewModelForPath(path);

			if (element == null) {
				this.logNotFoundByPathError(path);
				return;
			}

			//todo testing
			if (element.selectedValueS2 !== undefined) {
				element.selectedValueS2(value);
			} else {
				element.Value(value);
			}
		};

		return HostObject;

	});
///<reference path="~/../../debug/plugins/Nvx.ReDoc.WebInterfaceModule/Content/lib/jquery.signalr/jquery.signalr.js" />
///<reference path="~/../../debug/plugins/Nvx.ReDoc.WebInterfaceModule/Content/lib/knockout/knockout.min.js" />
///<reference path="~/../Nvx.ReDoc.WebInterfaceModule/Content/Scripts/FilePageHub/filePageSignalrConnection.js" />

define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormController/mainForm',
	[
		'jquery',
		'knockout',
		'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/main',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/preferences',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/nvx',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/nvxRedocCommon',
		'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/ScriptMediator',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/DynamicFormController/ClientJsonParser',
		'jqueryExtention',
		'select2lib'
	],
	function ($, ko, dynamicFormRender, preferences, Nvx, modalWindowsFunction, nvxRedocCommon, ScriptMediator, ClientJsonParser) {
		var DynamicFormHub = function () {
			var self = this;

			self.contentDiv = '#dynamic_form_content_right';
			self.formCollapseRight = "▼";
			self.formCollapseDown = "▶";

			// Описатель формы
			// Необходимо хранить и отдавать на сервер для форм в облегченном формате, т.к. у них нет типа (typename and projectNameWithSuffix)
			self.formDescriptor = null;
			//Хаб.
			self.dynamicFormHub = null;
			//Вью-модель.
			self.dynamicFormViewModel = null;
			//Флаг состояния загрузки вьюмодели формы
			self.formWasLoaded = ko.observable(false);

			//будут ли подсвечиваться элементы при валидации
			self.canShowErrorsForElements = ko.observable(false);
			//события, которые пришли слишком рано
			self.valueChanges = [];

			self.dynamicFormAdapter = null;
			self.clientValidation = true;

			self.clientJsonParser = new ClientJsonParser();

			self.DateTimeFormatOptions = {
				year: 'numeric',
				month: 'numeric',
				day: 'numeric'
			};

			/*
             * Функция инициализации хаба.
             */
			self.initHubFunction = function() {

				self.dynamicFormHub = $.connection.dynamicFormHub;
				if (self.dynamicFormHub) {
					if (preferences.log === true) {
						console.log("InitHub started.");
					}
				} else {
					throw new Error('Hub not started.');
				}

				//Обработка вью-модели, пришедшей с сервера.
				self.dynamicFormHub.client.getClientViewModel = self.onGetClientViewModel;

				//Обработчики событий сервера.
				self.dynamicFormHub.client.valueChangedOnServer = self.onValueChanged;
			};

			self.initAdapter = function(isClientScripts) {
				console.log('IsClientScripts: ' + isClientScripts);
				if (isClientScripts) {
					self.dynamicFormAdapter = {
						//onValueChanged: self.onValueChanged,
						//updateValue: dynamicFormEmitter.onFieldChanged,
						loading: function() {
							return self.valueChanges.length > 0;
						},
						formWasLoaded: self.formWasLoaded,
						ScriptMediator : new ScriptMediator(),
						EntityPathToViewModel: {},
						ViewModelPathToViewModel: {},
						// это нужно только для того чтобы запомнить данные от начального рендеринга(в коллекциях используется)
						EntityPathToViewModelRender: {}
					};
				} else {
					self.dynamicFormAdapter = {
						onValueChanged: self.onValueChanged,
						updateValue: self.dynamicFormHub.server.updateValue,
						loading: function() {
							return self.valueChanges.length > 0;
						},
						formWasLoaded: self.formWasLoaded,
						EntityPathToViewModel: {},
						ViewModelPathToViewModel: {},
						EntityPathToViewModelRender: {}
					};
				}

				self.dynamicFormAdapter.isClientScripts = isClientScripts;
				self.dynamicFormAdapter.IsFormReadonly = false;
			};

			self.onGetClientViewModel = function() {
				return self.dynamicFormViewModel;
			};

			/*
             * Поменялось значение поля
             */
			self.onValueChanged = function (path, scriptType, value) {
				if (preferences.log === true) {
					console.log('\r\nvalueChangedOnServer: \r\n\tpath: ' + path + '\r\n\tscriptType: ' + scriptType + '\r\n\tvalue: ' + value);
				}
				//Получаем уведомление об изменении элемента на сервере
				var pathParts = path.split('.');
				if (self.dynamicFormViewModel == undefined || self.formWasLoaded() === false) {
					// если вьюмодели ещё нет, после отрисовки заполнить
					var newOne = true;
					for (var ind2 = 0; ind2 < self.valueChanges.length; ind2++) {
						if (path == self.valueChanges[ind2].p &&
							scriptType == self.valueChanges[ind2].t &&
							value == self.valueChanges[ind2].v) {
							newOne = false;
							break;
						}
					}
					if (newOne === true)
						self.valueChanges.push({ p: path, t: scriptType, v: value });
					return null;
				}

				if (preferences.log === true) {
					console.log('Отрабатывают скрипты.');
				}
				var obj = self.dynamicFormViewModel;
				for (var i = 0; i < pathParts.length; i++) {
					if (obj.FormElements[0].Pages !== undefined) {
						var objPages = obj.FormElements[0].Pages;
						for (var pageid = 0; pageid < objPages.length; pageid++) {
							var pageTarget = self.findElementByPath(pathParts[i], objPages[pageid], "PageElements");
							if (pageTarget != null) {
								obj = pageTarget;
								break;
							}
						}
					} else {
						var target = self.findElementByPath(pathParts[i], obj);
						if (target != null) {
							obj = target;
						}
					}
				}

				if (obj == null || obj.Path === "_") {
					if (self.hidePage(path, value)) {
						return null;
					}
					console.log('fail to find {0} on {1} in valueChangedOnServer'.format(path, value));
					return null;
				}
				//устанавливаем свойства элементов в соответствии с изменениями
				self.processChange(obj, scriptType, value);
			};

			/*
			 * обработка скриптов изменений
			 */
			self.processChange = function(obj, scriptType, value) {
				switch (scriptType) {
				case "displayScript":
					obj.ControlVisibility(value === 'Visible');
					break;
				case "isEnabledScript":
					obj.ControlEnabling(value);
					break;
				case "calculationScript":
					//console.log('set ' + path + ' value = ' + value);
					if (typeof obj.selectedValueS2 == "function") {
						obj.selectedValueS2(value);
						if (obj.multiflag === true) {
							if (typeof (obj.selectedValue) === 'function')
								obj.selectedValue(value);
						}
					} else if (typeof obj.setValue == "function") {
						if (typeof obj.setItems === "function")
							obj.setItems(value);
						else
							obj.setValue(value);
					} else if (typeof obj.Value == "function")
						obj.Value(value);
					break;
				case 'validationScript':
					//value - текст ошибки.
					if (value.length > 0 || value === false)
						obj.IsValid(false);
					else
						obj.IsValid(true);

					// пока не загружена форма не требуется подсвечивать ошибки
					if (self.canShowErrorsForElements() === true) {
						if (typeof (value) !== 'boolean')
							obj.errorMessage(value);
						else
							obj.errorMessage(value ? "Значение некорректно" : "");
					}

					break;
				case "fiasFieldValidationScript":
					if (value && self.canShowErrorsForElements() === true) {
						value = JSON.parse(value);
						obj.setError(value.property, value.error);
					}
					break;
				case "mandatoryScript":
					obj.IsMandatory(value);
					break;
				case "dateMaxLimitScript":
					if (typeof obj.MaxValue === "function")
						obj.MaxValue(value);
					break;
				case "dateMinLimitScript":
					if (typeof obj.MinValue === "function")
						obj.MinValue(value);
					break;
				case "parentValueChangedScript":
					obj.ParentId(value);
					obj.selectedValueS2(null);
					$(self.contentDiv).find("[data-control-path='" + obj.Path + "']").find('.select2-chosen').text("");
					break;
				case "showAddItemsButtonScript":
					obj.ShowAddItemsButton(value == true);
					break;
				case "maxItemsCountScript":
					obj.setMaxItemsCount(value);
					break;
				}
			};

			/*
             * Поиск объекта по пути
             */
			self.findElementByPath = function (path, obj, elements) {
				var iSeekYou = path;
				if (elements == null)
					elements = "FormElements";
				//Если клон
				if (iSeekYou.contains('[')) {
					//Найдём индекс
					var iSeekIndex = iSeekYou.substring(iSeekYou.indexOf('[') + 1, iSeekYou.indexOf(']'));
					//И путь элемента
					iSeekYou = iSeekYou.substring(0, iSeekYou.indexOf('['));
					//Среди элементов найдём нужный
					for (var fe = 0; fe < obj[elements].length; fe++) {
						var localpath = obj[elements][fe].Path;
						if (localpath.contains('.')) {
							localpath = localpath.substr(localpath.lastIndexOf('.') + 1);
						}
						if (localpath === iSeekYou) {
							if (obj[elements][fe].CollectionItems().length > 0) {
								obj = obj[elements][fe].CollectionItems()[iSeekIndex];
							} else {
								obj = obj[elements][fe].itemToAdd;
							}
							return obj;
						}
					}
				} else {
					if (obj != null && obj[elements] != null) {
						for (var i = 0; i < obj[elements].length; i++) {
							var testpath = obj[elements][i].Path;
							if (testpath.contains('.')) {
								testpath = testpath.substr(testpath.lastIndexOf('.') + 1);
							}
							if (testpath === iSeekYou) {
								obj = obj[elements][i];
								return obj;
							}
						}
					}
				}
				return null;
			};

			//Добавляем функцию инициализации хаба в массив.
			//self.initHubFunctionArray = filePageSignalrConnection.initHubFunctionArray;
			//self.initHubFunctionArray.push(self.initHubFunction);

			// Создается подключение к хабу.
			// На стороне сервера создается BaseViewModel.
			// Клиенту приходит описатель разметки динамической формы.
			// Строится разметка динамической формы.
			// У сервера запрашивается модель данных динамической формы.
			// Разметка на клиенте заполняется пришедшими даными.
			self.initHub = function (fileId, componentId, formDescriptorResponse) {
				//В описателе формы присутствуют только js-скрипты.
				var isClientScripts = formDescriptorResponse.isClientScripts === true;
				self.dynamicFormViewModel = null;
				if (preferences.log === true) {
					console.log("Script on page run.");
				}
				var requestArgs = {
					fileId: fileId,
					componentId: componentId
				};

				if (formDescriptorResponse.hasError) {
					console.error(formDescriptorResponse.errorMessage);
					window.ModalWindowsFunction.CloseTrobberDiv2(self.trid);
					window.ModalWindowsFunction.CloseTrobberDiv(self.trid);
					window.ModalWindowsFunction.CreateNewModalDialog("modalWindowDialog", formDescriptorResponse.errorMessage, true, true);
					return;
				} else {
					self.initAdapter(formDescriptorResponse.isClientScripts);
				}

				//Состояние хаба беспокоит нас только в случае не-js скриптов.
				if (isClientScripts === false) {

					if (!$.connection) {
						window.ModalWindowsFunction.CreateNewModalDialog("modalWindowDialog", "Ошибка при составлении формы.", true, true);
						return;
					}

					if ($.connection.hub.state === 4) {
						window.ModalWindowsFunction.CreateNewModalDialog("modalWindowDialog", "Соединение было разорвано. Пожалуйста, обновите страницу.", true, true);
						return;
					}
				} else {
					//стартанём запрос сущности, пусть отрабатывает пока строим разметку и вью-модели
					self.entityRequest = $.ajax({ url: '/Nvx.ReDoc.Workflow.DynamicForm/Web/Controller/FormDataController/BusinessEntity', data: requestArgs, method: 'POST', headers: { proxy: true } });
				}

				//Отправка запроса к серверу.
				self.trid = window.ModalWindowsFunction.CreateTrobberDiv2();

				// получаем форму
				self.requestArgs = requestArgs;

				if (isClientScripts === false) {
					//Через хаб запрашиваем дескриптор формы.
					self.dynamicFormHub.server.getFormEntityJson(requestArgs)
						.done(function(formDescriptorResponseInstance) {
							var jsonResponse = JSON.parse(formDescriptorResponseInstance);
							self.onGetFormEntityJsonSuccess(jsonResponse, isClientScripts, fileId, componentId);
						})
						.fail(self.onError);
				} else {
					//нужно ли инициализировать движок руби
					if (formDescriptorResponse.isClientScripts) {
						self.dynamicFormAdapter.ScriptMediator.initRubyEngine(function () {
							//Для js-форм дескриптор мы уже получили.
							self.onGetFormEntityJsonSuccess(formDescriptorResponse, isClientScripts, fileId, componentId);
						});
					} else {
						//Для js-форм дескриптор мы уже получили.
						self.onGetFormEntityJsonSuccess(formDescriptorResponse, isClientScripts, fileId, componentId);
					}
				}
			};

			/*
             * Получен дескриптор формы
             */
			self.onGetFormEntityJsonSuccess = function (formDescriptorResponseInstance, isClientScripts, fileId, componentId) {
				isClientScripts = isClientScripts === true;
				var formDescriptorResponse = formDescriptorResponseInstance;
				if (isClientScripts === false) {
					//Данные от хаба приходят как строка - нужно парсить в объект вручную.
					//formDescriptorResponse = JSON.parse(formDescriptorResponseInstance);
				} else {
					//Данные от контроллера (для js-форм) уже приходят в виде объекта.
					//formDescriptorResponse = formDescriptorResponseInstance;
					self.checkDynamicFormIsValid = formDescriptorResponseInstance.checkDynamicFormIsValid;
				}
				if (formDescriptorResponse.hasError) {
					window.ModalWindowsFunction.CloseTrobberDiv2(self.trid);
					window.ModalWindowsFunction.CloseTrobberDiv(self.trid);
					window.ModalWindowsFunction.CreateNewModalDialog("modalWindowDialog", formDescriptorResponse.errorMessage, true, true);
				} else {
					$('#dynamic_form_right_typename_to_controller').val(formDescriptorResponse.formTypeName);
					$('#dynamic_form_right_projectNameWithSuffix').val(formDescriptorResponse.projectSuffix);

					//строим модель представления по описателю формы.
					var formDescriptor = formDescriptorResponse.jsonDescriptor;
					self.formDescriptor = formDescriptor;
					dynamicFormRender.buildViewModel(formDescriptor, self.dynamicFormAdapter, self.onViewModelBuilded, isClientScripts, fileId, componentId);
				}
			};

			/*
             * Построена ViewModel
             */
			self.onViewModelBuilded = function (viewModel, isClientScripts) {
				isClientScripts = isClientScripts === true;
				self.requestArgs.fromPortal = isClientScripts;
//				if (isClientScripts) {
//					dynamicFormEmitter.init(self.formDescriptor, new HostObject(viewModel), self.dynamicFormAdapter.onValueChanged);
//				}
				// вклиниваемся вместо отправки на сервер
				//self.dynamicFormHub.server.updateValue = dynamicFormEmitter.onFieldChanged;
				// подписываемся на изменение значения
				//dynamicFormEmitter.valueChangedOnServer = self.onValueChanged;

				var $contentDiv = $(self.contentDiv);

				//Рисуем разметку.
				$contentDiv.html(viewModel.markup);

				//Включаем knockout.
				var dynamicFormContentRight = document.getElementById('dynamic_form_content_right');
				ko.cleanNode(dynamicFormContentRight);
				//Глобально (на уровне подключения) запоминаем вью-модель динамической формы.
				self.dynamicFormViewModel = viewModel;
				viewModel = { '_': viewModel };

				//Получаем viewModelValue
				if (isClientScripts === false) {
					//Через хаб.
					self.dynamicFormHub.server.getConnectionId()
						.done(function (connectionId) {
							self.connectionId = connectionId;
						})
						.fail(self.onError);
					self.dynamicFormHub.server.getViewModelValue(self.requestArgs)
						.done(function(viewModelValueResponseInstance) {
							jsonResponse = JSON.parse(viewModelValueResponseInstance);
							self.onGetViewModelValueSuccess(jsonResponse, isClientScripts, viewModel, dynamicFormContentRight);
						})
						.fail(self.onError);
				} else {
					//Через контроллер.
					var request = self.entityRequest || $.ajax({ url: '/Nvx.ReDoc.Workflow.DynamicForm/Web/Controller/FormDataController/BusinessEntity', data: self.requestArgs, method: 'POST', headers: {proxy: true} });
					request.done(function(r) {
						self.onGetViewModelValueSuccess(r, isClientScripts, viewModel, dynamicFormContentRight);
					})
						.fail(function(jqXHR, textStatus, errorThrown) {
							window.ModalWindowsFunction.CloseTrobberDiv2(self.trid);
							if (jqXHR.responseJSON) {
								modalWindowsFunction.errorModalWindow(jqXHR.responseJSON.errorMessage);
							} else {
								modalWindowsFunction.errorModalWindow(jqXHR.responseText);
							}
						}).always(function() {
							setTimeout(function() {
								self.entityRequest = null;
							}, 0);
						});
				}
			};

			/*
             * Получено значение ViewModel
             */
			self.onGetViewModelValueSuccess = function (viewModelValueResponseInstance, isClientScripts, viewModel, dynamicFormContentRight) {
				var viewModelValueResponse = viewModelValueResponseInstance;
				
//				window.ModalWindowsFunction.CloseTrobberDiv2(self.trid);

				if (viewModelValueResponse.hasError) {
					window.ModalWindowsFunction.CloseTrobberDiv2(self.trid);
					window.ModalWindowsFunction.CreateNewModalDialog("modalWindowDialog", viewModelValueResponse.errorMessage, true, true);
					if (preferences.log === true) {
						console.log(viewModelValueResponse.errorMessage);
					}
				} else {
					//проставляем значения из viewModelView
					var viewModelView = viewModelValueResponse.viewModel;

					if (viewModelValueResponseInstance.formContextData) {
						//для клиентских скриптов парсим даты в объекты
						if (isClientScripts === true) {
							self.dynamicFormViewModel.formContextData = JSON.parse(viewModelValueResponseInstance.formContextData, self.clientJsonParser.parse);
						} else {
							self.dynamicFormViewModel.formContextData = JSON.parse(viewModelValueResponseInstance.formContextData);
						}
					}

					if (preferences.log === true) {
						console.debug(viewModelView);
					}
					var entity = viewModelValueResponse.dataContext;

					if (self.dynamicFormViewModel == null) {
						window.ModalWindowsFunction.CreateNewModalDialog("modalWindowDialog", "DynamicForm viewModel is missing", true, true);
						return;
					}

					if (isClientScripts === true) {
						self.notNullEntity = entity != null && entity !== 'null';
						//Обрабатываем потомков главной формы.
						self.recursionJS(self.dynamicFormViewModel, entity == null ? null : JSON.parse(entity, self.clientJsonParser.parse), viewModelValueResponse.attachments);
					} else {
						//ControlVisibility
						if (viewModelView.ControlVisibility !== undefined) {
							self.dynamicFormViewModel.ControlVisibility(viewModelView.ControlVisibility);
						}
						//ControlEnabling
						if (viewModelView.ControlEnabling !== undefined) {
							self.dynamicFormViewModel.ControlEnabling(viewModelView.ControlEnabling);
						}
						//IsValid
						if (viewModelView.IsValid !== undefined) {
							self.dynamicFormViewModel.IsValid(viewModelView.IsValid);
						}
						//IsValid
						if (viewModelView.IsMandatory !== undefined) {
							self.dynamicFormViewModel.IsMandatory(viewModelView.IsMandatory);
						}
						//Обрабатываем потомков главной формы.
						self.recursion(self.dynamicFormViewModel, viewModelView, JSON.parse(entity), viewModelValueResponse.attachments);
					}
					//Клиентские ли скрипты.
					self.dynamicFormViewModel.isClientScripts = isClientScripts;
				}


				if (isClientScripts === true) {
					self.dynamicFormAdapter.ScriptMediator.onViewModelBuilded(self.dynamicFormViewModel);
				}

				self.formWasLoaded(true);
				modalWindowsFunction.CloseTrobberDiv2(self.trid);
				modalWindowsFunction.CloseTrobberDiv();
				self.canShowErrorsForElements(false);

				//перенёс сюда, т.к. до self.formWasLoaded(true); изменения не отработаются
				if (self.valueChanges.length > 0) {
					for (var ind = 0; ind < self.valueChanges.length; ind++) {
						self.onValueChanged(self.valueChanges[ind].p, self.valueChanges[ind].t, self.valueChanges[ind].v);
					}
					self.valueChanges = [];
				}

				//форма загружена теперь ошибки валидации должны показываться
				self.canShowErrorsForElements(true);

//				window.ModalWindowsFunction.CloseTrobberDiv2(self.trid);
				
				try {
					ko.cleanNode(dynamicFormContentRight);
					ko.applyBindings(viewModel, dynamicFormContentRight);
				} catch (exVar) {
					window.ModalWindowsFunction.CloseTrobberDiv2(self.trid);
//					window.ModalWindowsFunction.CloseTrobberDiv2();
					window.ModalWindowsFunction.CreateNewModalDialog("modalWindowDialog", exVar, true, true);
				}
				//Активна первая вкладка, если она есть
				self.collapsePage(0);
			};

			/*
             * Ошибка получения дескриптора формы
             */
			self.onError = function (err) {
				window.ModalWindowsFunction.CloseTrobberDiv2(self.trid);
				window.ModalWindowsFunction.CreateNewModalDialog("modalWindowDialog", err, true, true);
			};

			//show or hide collapsable form with it's elements but without caption
			self.collapseFormBlock = function (element) {
				var block = $(element.nextElementSibling);
				var blockCaption = $(element);
				if (block.height() !== 0) {
					block[0].style.setProperty('display', 'none', 'important');
					block[0].style.setProperty('overflow', 'hidden', 'important');
					block[0].style.setProperty('height', 0, 'important');

					blockCaption.textNodeContent(self.formCollapseDown + blockCaption.textNodeContent().substr(blockCaption.textNodeContent().indexOf(' ')));
				} else {
					//развернуть
					block[0].style.setProperty('display', 'block');
					block[0].style.setProperty('height', 'auto');
					block[0].style.setProperty('overflow', 'visible');
					blockCaption.textNodeContent(self.formCollapseRight + blockCaption.textNodeContent().substr(blockCaption.textNodeContent().indexOf(' ')));
				}
			};

			self.collapsePage = function (id) {
				dynamicFormRender.collapsePage(document.getElementById('dynamic_form_content_right'), id);
			};

			self.hidePage = function (path, value) {
				if (!path.startsWith("page")) {
					return false;
				}
				var num = path.substring(4);
				var pages = $('#dynamic_form_content_right').find('[data-control-fragment-id="Pages-buttons-control"]').children();
				if (value == "Visible")
					pages.get(num).style.display = "table-cell";
				else
					pages.get(num).style.display = "none";
				return true;
			};

			//Сбор данных с модели формы для отправки на сервер
			self.collectFormDataKoVm = function () {
				var mainFormKoVm = null;

				if (self.dynamicFormViewModel.IsClientScripts === false) {
					//для Ruby-скриптов.
					mainFormKoVm = $.connection.dynamicFormHub.client.getClientViewModel();
				} else {
					//для JavaScript-форм.
					mainFormKoVm = self.dynamicFormViewModel;
				}
				//Рекурсивно обрабатываем элементы, начиная с родительской главной формы
				var finalData = self.collectCurrentElementDataFromKoVm(mainFormKoVm);
				if (mainFormKoVm.FormElements[0].Pages === undefined)
					return finalData;
				return finalData["_"];
			};

			//обработка элемента модели динамической формы с целью получения его значения
			self.collectCurrentElementDataFromKoVm = function (currentElement) {
				if (currentElement == null)
					return null;
				if (currentElement.Pages) {
					//Вкладки
					var pageElementsKoData = {};
					$.each(currentElement.Pages, function (pageid, page) {
						$.each(page.PageElements, function (id, element) {
							var elePath = element.Path;
							var realPath = elePath.substr(elePath.lastIndexOf('.') + 1);
							pageElementsKoData[realPath] = self.collectCurrentElementDataFromKoVm(element);
						});
					});
					return pageElementsKoData;
				} else if (currentElement.FormElements) {
					//Форма!
					var elementsKoData = {};
					if (currentElement.ControlVisibility() === true) {
						$.each(currentElement.FormElements, function(id, element) {
							var elePath = element.Path;
							var realPath = elePath.substr(elePath.lastIndexOf('.') + 1);
							elementsKoData[realPath] = self.collectCurrentElementDataFromKoVm(element);
						});
					}
					return elementsKoData;
				} else if (currentElement.CollectionItems && typeof currentElement.CollectionItems == "function") {
					//коллекция
					var colElementsKoData = [];
					for (var inde = 0; inde < currentElement.CollectionItems().length; inde++) {
						var innerElements = {};
						$.each(currentElement.CollectionItems()[inde].FormElements, function (id, element) {
							var elePath = element.Path;
							var realPath = elePath.substr(elePath.lastIndexOf('.') + 1);
							innerElements[realPath] = self.collectCurrentElementDataFromKoVm(element);
						});
						colElementsKoData.push(innerElements);
					}
					return colElementsKoData;
				}
				//ФИАС.
				if (currentElement.typeId === 'FiasRegionSelectControlViewModel' || currentElement.typeId === 'FIAS')
					return currentElement.getValue();

				//Виджет выбора участника
				if (currentElement.typeId === 'UserInfoList') {
					if (currentElement.Value() == null)
						return null;
					return {
						'CredentialHash': currentElement.Value(),
						'UserName': currentElement.element().children[0].selectedOptions.item(0).text
					};
				}
				
				//SimpleAttachment
				if (currentElement.certificateFile !== undefined) {
					var value = currentElement.previousExist() === true ? 
									currentElement.certificateFileName() :
									currentElement.getCleanValue();

					console.log('Вернём ' + value);
					return value;
				}

				//Остальные элементы.
				if (typeof currentElement.Value == "function" && currentElement.Value() != undefined && currentElement.Value !== "") {
					if (currentElement.Value() === "")
						return null;
					
				    //это специально для float
					if (typeof (currentElement.Value()) === "string") {
						if (currentElement.element() != null && currentElement.element().children != null && currentElement.element().children.length > 1 && currentElement.element().children[1].attributes['step'] != null)
							return currentElement.Value().replace(',', '.');
						else
							return currentElement.Value().replace(/"/g, '&quot;');
					} else {
						return currentElement.Value();
					}
				} else if (typeof currentElement.selectedValueS2 == "function" && currentElement.selectedValueS2() != undefined){
					//Передаём UnderlineValue, так как для значений вида 00033333333333333 в literalValue будет ошибка
					var s2Result = "";
					//for multiselect
					if (currentElement.multiflag === true) {
						var outdata = currentElement.selectedValueS2();
						var preResult = typeof outdata === 'string' ? [outdata] : outdata;
						if (currentElement.DictionaryId != null)
							return preResult;
						var endResult = [];

						for (var i = 0; i < preResult.length; i++) {
							if (preResult[i] == null)
								break;
							for (var j = 0; j < currentElement.options.length; j++) {
								if (currentElement.options[j].LV === preResult[i]) {
									if (currentElement.isSave())
										endResult.push({ enumId: currentElement.options[j].UV, enumValue: currentElement.options[j].UV, enumTitle: currentElement.options[j].DA });
									else
										endResult.push(currentElement.options[j].UV);
									break;
								}
							}
						}
						return endResult;
					}

					$.each(currentElement.options, function (id, data) {
						if (data.LV === currentElement.selectedValueS2()) {
							if (currentElement.isSave())
								s2Result = { enumId: data.UV, enumValue: data.UV, enumTitle: data.DA };
							else
								s2Result = data.UV;
						}
					});
					return s2Result === "" ? currentElement.selectedValueS2() : s2Result;
				} else {
					return null;
				}
			};

			self.goToTransition = function (transitionAction, to, formInfo, portalCallback) {
				modalWindowsFunction.CreateTrobberDiv();
				var defer = $.Deferred();

				//это когда форма в режиме чтения изначально.
				if (self.dynamicFormViewModel == null) {
					self.fastGoToTransition(transitionAction, to, formInfo, portalCallback).then(function () {
						defer.resolve();
					}, function () {
						defer.reject();
					});
				}
				else {
					if (!self.dynamicFormViewModel.isClientScripts) {
						$.connection.dynamicFormHub.server.checkValidViewModel({
							fileId: $('#fileId').val(),
							componentId: $('#componentId').val()
						}).done(function (serverValueResponse) {
							$.when(self.onCheckValidViewModelResponce(serverValueResponse, transitionAction, to, formInfo)).then(function () {
								defer.resolve();
							}, function () {
								defer.reject();
							});
						}).fail(function () {
							defer.reject();
						});
					} else {
						var response = self.checkValidViewModel();
						$.when(self.onCheckValidViewModelResponce(JSON.stringify(response), transitionAction, to, formInfo, portalCallback)).then(function () {
							defer.resolve();
						}, function () {
							defer.reject();
						});
					}
				}

				defer.always(function () {
					modalWindowsFunction.CloseTrobberDiv();
				});

				return null;
			};

			/**
			 * Переход на страницу авторизации, если сервер вернул 403 статус
			 * @param {} jqXHR 
			 * @returns {} 
			 */
			self.goToAuthPage = function (jqXHR) {
				if (jqXHR.status === 403) {
					////Перенаправляем на страницу аутентификации.
					//var returnUrl = window.location.pathname + window.location.hash;
					//returnUrl = encodeURIComponent(returnUrl);
					//var redirectUrl = '/WebInterfaceModule/Authentication/Login?returnUrl=' + returnUrl;
					//window.location.href = redirectUrl;

					//авторизация может портебоваться и на портале Редока и на РПГУ. Адреса авторизации у них разные.
					//Пока сделал просто перезагрузку стрнаицы и тогда веб-сервер сам отправит пользователя на нужную страницу авторизации
					window.location.reload();
				}
			};

			self.fastGoToTransition = function(transitionAction, to, formInfo, portalCallback) {
				var fileId = $("#fileId").val();
				var componentId = $("#componentId").val();
				var taskId = $("#taskId").val();

				var model = {
					"fileId": fileId,
					"componentId": componentId,
					"taskId": taskId,
					"transitionAction": transitionAction,
					"to": to,
				};

				return $.ajax({ url: '/DynamicForm/GoToTransition', data: model, method: 'POST', headers: { proxy: true } })
					.done(function(response) {
						if (response.hasError) {
							//обработка ошибки
							window.NvxRedocFileCommon.processFileError(response, self.sendformdataandgototransition, null, [transitionAction, to]);
						} else {
							//Обновляем левые разделы дела на основе json ответа по необходимости и кликаем по новой задаче
							nvxRedocCommon.FindAndClickLeftPaveTask(response);
						}
					})
					.fail(function(jqXHR, textStatus, errorThrown) {
						var responseText = '';
						if (jqXHR.responseJSON) {
							responseText = jqXHR.responseJSON.errorMessage;
						} else {
							responseText = jqXHR.responseText;
						}

						modalWindowsFunction.CreateCallbackModalWindow(responseText, 'Закрыть', 'Ошибка авторизации', function() { self.goToAuthPage(jqXHR); }, null);
					});
			};
			

			self.checkValidViewModel = function () {
				var response = {
					valid: self.dynamicFormViewModel.Validate(),
					required: true
				};

				return {
					"serializedValue": JSON.stringify(response),
					"result": null,
					"isClientScripts": false,
					"hasError": false,
					"errorMessage": null
				};
			};

			/*
             * Получен результат валидации формы
             */
			self.onCheckValidViewModelResponce = function (serverValueResponse, transitionAction, to, formInfo, portalCallback) {
				var defer = $.Deferred();

				var response = JSON.parse(serverValueResponse);
				if (response.hasError) {
					modalWindowsFunction.CloseTrobberDiv();
					window.ModalWindowsFunction.CreateNewModalDialog("modalWindowDialog", "Предупреждение<br>" + response.errorMessage, true, true);
					if (preferences.log === true)
						console.log(response.errorMessage);
					defer.reject();
				} else {
					var jresponse = JSON.parse(response.serializedValue);
					
					if (self.checkDynamicFormIsValid === undefined)
						self.checkDynamicFormIsValid = jresponse.checkDynamicFormIsValid;

//					modalWindowsFunction.CloseTrobberDiv();
					if (jresponse.valid == false) {
						if (jresponse.required && self.checkDynamicFormIsValid == true) {
							window.ModalWindowsFunction.CreateNewModalDialog("modalWindowDialog", "<h2>Предупреждение</h2>Обязательные поля не заполнены или заполнены некорректно.", true, true);
							defer.reject();
						} else {
							modalWindowsFunction.CloseTrobberDiv();
							var ok = function () { self.GoToTransitionLogic(transitionAction, to, formInfo, portalCallback, defer); };
							window.ModalWindowsFunction.CreateQuestionModalWindow("modalWindowDialog",
								"Обязательные поля не заполнены или заполнены некорректно. Все равно продолжить?", "Да", "Нет", "Предупреждение",
								ok, null);
						}
					} else {
						self.GoToTransitionLogic(transitionAction, to, formInfo, portalCallback, defer);
					}
				}
				
				return defer.promise();
			};

			self.GoToTransitionLogic = function (transitionAction, to, formInfo, portalCallback, defer) {
				modalWindowsFunction.CreateTrobberDiv();
				//посмотреть, есть ли файлы на форме
				var fileInputs = $('#form_dynamic_form_content_right').find('input[type="file"]');
				var flag = false;
				var additionalFileData = [];
				if (fileInputs.size() > 0) {
					
					if (!Array.isArray(fileInputs)) {
						fileInputs = fileInputs.toArray();
					}

					//Посмотрим, что за поля мы нашли
					$.each(fileInputs, function (id, va) {
						//ищем файлы, которые были выбраны
						if (va.value != null && va.value !== "") {
							//Убеждаемся, что эти поля видимы и их нужно загружать
							if ($(va).css('display') != null && $(va).css('display').contains('block')) {
								//Есть файл, который нужно загружать
								flag = true;

								try {
									additionalFileData.push({
										key: va.name,
										title: $(va).parents('[data-control-type="file"]').children().first().textNodeContent().trim()
									});
								} catch(e) {
									console.error(e);
								}
							}
						}
					});
				}
				if (flag) {
					//Есть файлы для прикладывания в дело
					var fileId = $("#fileId").val();
					var componentId = $("#componentId").val();
					if (formInfo != null) {
						fileId = formInfo.fileId;
						componentId = formInfo.componentId;
					}
					var ajaxFormOptions = 
					{
						type: "POST",
						url: "/DynamicForm/SaveNewAttachmentJsonForForms",
						data: { fileId: fileId, componentId: componentId, 'filesInfo': JSON.stringify(additionalFileData) },
						xhrFields: {
							withCredentials: true
						},
						success: function (response) {
							if (response.hasError) {
								//обработка ошибки
								window.NvxRedocFileCommon.processFileError(response, self.goToTransition, null, [transitionAction, to]);
								defer.reject();
							} else {
								//Атачменты приложены
								//Отправляем данные
								$.when(self.sendformdataandgototransition(transitionAction, to, formInfo, response)).then(function () {
									if (typeof portalCallback === 'function')
										portalCallback.call();
									defer.resolve();
								}, function () {
									defer.reject();
								});
							}
						},
						error: function () {
							defer.reject();
						},
						complete: function () {
							modalWindowsFunction.CloseTrobberDiv();
						}
					};

					if (window.nvxCommonPath && window.nvxCommonPath.fileProxyPath) {
						//обращение для получения ключа в случае внешнего портала
						$.ajax({ url: '/DynamicForm/GetExternalKey', data: { fileId: fileId, componentId: componentId }, method: 'POST', headers: { proxy: true } })
							.done(function(response) {
								ajaxFormOptions.data.uploadKey = response.result;
							})
							.fail(function() {
							})
							.always(function () {
								$('#form_dynamic_form_content_right').ajaxForm(ajaxFormOptions);
								$('#form_dynamic_form_content_right').submit();
							});
					} else {
						//Простая отправка в случае нашего РПГУ
						$('#form_dynamic_form_content_right').ajaxForm(ajaxFormOptions);
						$('#form_dynamic_form_content_right').submit();
					}
				} else {
					//Для запоминания данных RDC-8449
					$('#form_dynamic_form_content_right').submit();
					//Отправляем данные
					$.when(self.sendformdataandgototransition(transitionAction, to, formInfo)).then(function() {
						if (typeof portalCallback === 'function')
							portalCallback.call();
						defer.resolve();
					}, function () {
						defer.reject();
					}).always(function() {
						modalWindowsFunction.CloseTrobberDiv();
					});
				}
			};

			//отправка данных формы в контроллер и переход на следующий шаг
			self.sendformdataandgototransition = function (transitionAction, to, formInfo, attachmentData) {
				var fileId = $("#fileId").val();
				var componentId = $("#componentId").val();
				var taskId = $("#taskId").val();

				if (formInfo != null) {
					fileId = formInfo.fileId;
					componentId = formInfo.componentId;
					taskId = formInfo.elementId;
				}

				var model = {
					"fileId": fileId,
					"componentId": componentId,
					"taskId": taskId,
					"transitionAction": transitionAction,
					"to": to,
					"collectFormData": JSON.stringify(self.collectFormDataKoVm()),
					"typename": $("#dynamic_form_right_typename_to_controller").val(),
					"projectNameWithSuffix": $("#dynamic_form_right_projectNameWithSuffix").val(),
					"attachmentsFromForm": attachmentData != null ? attachmentData : []
				};

				return $.ajax({ url: '/DynamicForm/GoToTransition', data: model, method: 'POST', headers: { proxy: true } })
					.done(function(response) {
						if (response.hasError) {
							//обработка ошибки
							window.NvxRedocFileCommon.processFileError(response, self.sendformdataandgototransition, null, [transitionAction, to]);
						} else {
							//Обновляем левые разделы дела на основе json ответа по необходимости и кликаем по новой задаче
							nvxRedocCommon.FindAndClickLeftPaveTask(response);
						}
					})
					.fail(function(jqXHR, textStatus, errorThrown) {
						var responseText = '';
						if (jqXHR.responseJSON) {
							responseText = jqXHR.responseJSON.errorMessage;
						} else {
							responseText = jqXHR.responseText;
						}

						modalWindowsFunction.CreateCallbackModalWindow(responseText, 'Закрыть', 'Ошибка авторизации', function() { self.goToAuthPage(jqXHR); }, null);
					});
			};

			self.recursion = function (dynamicFormViewModelInstance, dynamicFormView2, context, attachmentList) {
				//Если есть этот элемент, значит объект - форма.
				if (dynamicFormView2.FormElements != null) {
					for (var index = 0; index < dynamicFormView2.FormElements.length; index++) {
						//Объект с сервера.
						var childDynamicFormView = dynamicFormView2.FormElements[index];

						if (!childDynamicFormView)
							continue;

						//Объект - вьюмодель.
						var childDynamicFormViewModel =
							dynamicFormViewModelInstance.PageElements !== undefined ?
								dynamicFormViewModelInstance.PageElements[index] :
								dynamicFormViewModelInstance.FormElements[index];
						//ControlVisibility
						if (childDynamicFormView.ControlVisibility !== undefined) {
							childDynamicFormViewModel.ControlVisibility(childDynamicFormView.ControlVisibility);
						}
						//ControlEnabling
						if (childDynamicFormView.ControlEnabling !== undefined) {
							childDynamicFormViewModel.ControlEnabling(childDynamicFormView.ControlEnabling);
						}
						//IsValid
						if (childDynamicFormView.IsValid !== undefined) {
							childDynamicFormViewModel.IsValid(childDynamicFormView.IsValid);
						}
						//IsMandatory
						if (childDynamicFormView.IsMandatory !== undefined) {
							childDynamicFormViewModel.IsMandatory(childDynamicFormView.IsMandatory);
						}
						//Запускаем еще одну итерацию рекурсии (вдруг и у дитя есть дети).
						var parentpath = dynamicFormViewModelInstance.Path;
						if (parentpath !== "_") {
							self.recursion(childDynamicFormViewModel, childDynamicFormView, context[parentpath.substr(parentpath.lastIndexOf('.') + 1)], attachmentList);
						} else {
							self.recursion(childDynamicFormViewModel, childDynamicFormView, context, attachmentList);
						}
					}
				} else if (dynamicFormView2.CollectionItems != null) {
					//Коллекция
					dynamicFormView2.CollectionItems.forEach(function(element, ind) {
						//Имеем клон тут - форму
						if (preferences.log === true) {
							console.log(element);
							console.log('index ' + ind);
						}
						dynamicFormViewModelInstance.addItem();
						if (element.FormElements != null) {
							//обработка примерно как элементы формы обычные, только пути проверить
							for (var index = 0; index < element.FormElements.length; index++) {
								//Объект с сервера.
								var childDynamicFormView = element.FormElements[index];
								//Объект - вьюмодель.
								var childDynamicFormViewModel = dynamicFormViewModelInstance.CollectionItems()[ind].FormElements[index];

								//Изменяем данные.
								//ControlVisibility
								if (childDynamicFormView.ControlVisibility !== undefined) {
									childDynamicFormViewModel.ControlVisibility(childDynamicFormView.ControlVisibility);
								}
								//ControlEnabling
								if (childDynamicFormView.ControlEnabling !== undefined) {
									childDynamicFormViewModel.ControlEnabling(childDynamicFormView.ControlEnabling);
								}
								//IsValid
								if (childDynamicFormView.IsValid !== undefined) {
									childDynamicFormViewModel.IsValid(childDynamicFormView.IsValid);
								}
								//IsMandatory
								if (childDynamicFormView.IsMandatory !== undefined) {
									childDynamicFormViewModel.IsMandatory(childDynamicFormView.IsMandatory);
								}
								//Запускаем еще одну итерацию рекурсии (вдруг и у дитя есть дети).
								var parentpath = dynamicFormViewModelInstance.Path;
								var allclonecontext = context[parentpath.substr(parentpath.lastIndexOf('.') + 1)];
								if (Object.prototype.toString.call(allclonecontext) === "[object String]")
									allclonecontext = JSON.parse(allclonecontext);
								if (Object.prototype.toString.call(allclonecontext) === "[object Array]") {
									//для коллекций берём данные нужного по счёту элемента
									self.recursion(childDynamicFormViewModel, childDynamicFormView, allclonecontext[ind], attachmentList); //Для checkenumviewmodel здесь тоже массив!
								} else {
									self.recursion(childDynamicFormViewModel, childDynamicFormView, allclonecontext, attachmentList);
								}
							}
						}
					});
				} else if (dynamicFormView2.Pages != null) {
					//Контейнер с вкладками
					for (var position = 0; position < dynamicFormView2.Pages.length; position++) {
						self.recursion(dynamicFormViewModelInstance.Pages[position], dynamicFormView2.Pages[position], context, attachmentList);
					}
				} else {
					//Если не форма, заполняем контрол значением из контекста
					if (context != null && dynamicFormViewModelInstance.Path != null) {
						if (preferences.log === true) {
							console.log('mandatory ' + dynamicFormViewModelInstance.Path + ' value ' + dynamicFormView2.IsMandatory);
						}
						var dataPath = dynamicFormViewModelInstance.Path;
						var contextName = dataPath.substr(dataPath.lastIndexOf('.') + 1);

						if (context[contextName] != undefined) {
							var descriptorKey = dynamicFormView2.DescriptorKey;
							switch (descriptorKey) {
								//Date.
								case "DateControlDescriptor":
									if (context[contextName].length > 10) {
										dynamicFormViewModelInstance.Value(context[contextName].substr(0, 10));
									} else {
										dynamicFormViewModelInstance.Value(context[contextName]);
									}
									break;
									//Enum
								case "EnumControlDescriptor":
									//Замена значения selected в э/у Enum.
									if (dynamicFormViewModelInstance.multiflag === true && typeof (context[contextName]) === 'string')
										context[contextName] = JSON.parse(context[contextName]);
									if (dynamicFormViewModelInstance.isSave()) {
										if (context[contextName] != null) {
											var realId = null;
											for (var nd = 0; nd < dynamicFormViewModelInstance.options.length; nd++) {
												if (dynamicFormViewModelInstance.options[nd].UV == context[contextName].EnumId) {
													realId = dynamicFormViewModelInstance.options[nd].LV;
													break;
												}
											}
											dynamicFormViewModelInstance.selectedValueS2(realId || context[contextName].EnumId);
										}
										break;
									} else {
										dynamicFormViewModelInstance.selectedValueS2(context[contextName]);
									}
									break;
								case "BoolControlDescriptor":
									dynamicFormViewModelInstance.Value(context[contextName]);
									break;
								case "CollectionFormDescriptor":
									break;
								case "DictionaryRegistryControlDescriptor":
									dynamicFormViewModelInstance.selectedValueS2(context[contextName]);
									break;
								case "SimpleAttachmentViewModel":
									if (attachmentList != null && attachmentList.indexOf(context[contextName]) !== -1)
										dynamicFormViewModelInstance.setPrevious(context[contextName]);
									break;
								case "Placeholder":
									break;
								case "UserInfoList":
									dynamicFormViewModelInstance.Value(context[contextName].CredentialHash);
									break;
								case 'FiasRegionSelectControlViewModel':
								case 'FIAS':
									//Форма для редактирования.
									//var templateId = 'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templates2/fias.tmpl.html';
									////Данные дескриптора.
									//dynamicFormViewModelInstance.FiasComponentVisibility = dynamicFormView2.FiasComponentVisibility;
									//dynamicFormViewModelInstance.FiasComponentMandatory = dynamicFormView2.FiasComponentMandatory;
									////Формирование внутренней вью-модели.
									//dynamicFormViewModelInstance.initTemplate(templateId);
									//Заполнение вью-модели данными.
									dynamicFormViewModelInstance.Value(context[contextName]);
									break;
								default:
									try {
										if (context[contextName] != null && typeof(context[contextName]) === 'string' && context[contextName].contains('&quot;'))
											dynamicFormViewModelInstance.Value(context[contextName].replace(/&quot;/g, '"'));
										else
											dynamicFormViewModelInstance.Value(context[contextName]);
									} catch (e) {
										if (preferences.log === true) {
											console.log('Was error in .Value({0}) {1} '.format(context[contextName], dynamicFormViewModelInstance.Path));
										}
									}
									break;
							}
						}
					}
				}
			};

			self.notNullEntity = true;
			//Рекурсия для построения JS-форм
			//для клиентских форм мы не строим полное дерево для данных типа бизнес сущности
			self.recursionJS = function (dynamicFormViewModelInstance, context, attachmentList) {
				//для клиентских форм мы не строим полное дерево для данных типа бизнес сущности
				if (context == null) {
					if (self.notNullEntity) {
						console.log('Не переданы данные для детей и пути ', dynamicFormViewModelInstance);
					}
					context = context || {};
				}

				//Если есть этот элемент, значит объект - форма.
				if (dynamicFormViewModelInstance.FormElements != null) {
					for (var index = 0; index < dynamicFormViewModelInstance.FormElements.length; index++) {
						//Объект - вьюмодель.
						var childDynamicFormViewModel =
							dynamicFormViewModelInstance.PageElements !== undefined ?
								dynamicFormViewModelInstance.PageElements[index] :
								dynamicFormViewModelInstance.FormElements[index];

						//Запускаем еще одну итерацию рекурсии (вдруг и у дитя есть дети).
						var parentpath = dynamicFormViewModelInstance.Path;
						if (parentpath !== "_") {
							self.recursionJS(childDynamicFormViewModel, context[parentpath.substr(parentpath.lastIndexOf('.') + 1)], attachmentList);
						} else {
							self.recursionJS(childDynamicFormViewModel, context, attachmentList);
						}
					}
				} else if (dynamicFormViewModelInstance.CollectionItems != null) {
					
					//Коллекция
					var parentpath = dynamicFormViewModelInstance.Path;
					var allclonecontext = ko.utils.unwrapObservable(context[parentpath.substr(parentpath.lastIndexOf('.') + 1)]);
					if (allclonecontext) {
						
						if (Object.prototype.toString.call(allclonecontext) === "[object String]")
							allclonecontext = JSON.parse(allclonecontext);

						var isArray = Object.prototype.toString.call(allclonecontext) === "[object Array]";

						//при создании обязательной коллекции добавляется "лишний" элемент
						if (allclonecontext.length > 0)
							dynamicFormViewModelInstance.clear();

						for (var i = 0; i < allclonecontext.length; i++) {
							dynamicFormViewModelInstance.addItem();
							var itemFormViewModel = dynamicFormViewModelInstance.CollectionItems()[i];


							if (itemFormViewModel.FormElements != null) {

								//TODO ДОЛБАННЫЕ НЕКОРРЕКТНЫЕ ПУТИ!!!
								//self.recursionJS(itemFormViewModel, isArray ? allclonecontext[i] : allclonecontext, attachmentList);

								for (var j = 0; j < itemFormViewModel.FormElements.length; j++) {
									var childDynamicFormViewModel = itemFormViewModel.FormElements[j];

									//для коллекций берём данные нужного по счёту элемента
									self.recursionJS(childDynamicFormViewModel, isArray ? allclonecontext[i] : allclonecontext, attachmentList);
									//Для checkenumviewmodel здесь тоже массив!
								}
							} else {
								console.warn('no FormElements');
							}
							//откуда такой вариант? (при переработке не понял для чего это)
							//self.recursionJS(childDynamicFormViewModel, allclonecontext, attachmentList);
						}
					}

					//добавим для "обязательной" коллекции
					if (dynamicFormViewModelInstance.CollectionItems().length === 0 && dynamicFormViewModelInstance.IsMandatory() === true) {
						dynamicFormViewModelInstance.addItem();
					}
					
				} else if (dynamicFormViewModelInstance.Pages != null) {
					//Контейнер с вкладками
					for (var position = 0; position < dynamicFormViewModelInstance.Pages.length; position++) {
						self.recursionJS(dynamicFormViewModelInstance.Pages[position], context, attachmentList);
					}
				} else {
					//Если не форма, заполняем контрол значением из контекста
					if (context != null && dynamicFormViewModelInstance.Path != null) {
						if (preferences.log === true) {
							console.log('mandatory ' + dynamicFormViewModelInstance.Path + ' value ' + ko.utils.unwrapObservable(dynamicFormViewModelInstance.IsMandatory));
						}
						var dataPath = dynamicFormViewModelInstance.Path;
						var contextName = dataPath.substr(dataPath.lastIndexOf('.') + 1);

						if (context[contextName] != undefined) {
							var descriptorKey = dynamicFormViewModelInstance.elementDescriptor.DescriptorKey;
							switch (descriptorKey) {
								//Date.
								case "DateControlDescriptor":
									if (context[contextName].length > 10) {
										dynamicFormViewModelInstance.Value(context[contextName].substr(0, 10));
									} else {
										//dynamicFormViewModelInstance.Value(context[contextName]);
										var value = context[contextName];
										value = (value instanceof Date) ? value.toLocaleString("ru", self.DateTimeFormatOptions) : value;
										dynamicFormViewModelInstance.Value(value);
									}
									break;
									//Enum
								case "EnumControlDescriptor":
									//Замена значения selected в э/у Enum.
									if (dynamicFormViewModelInstance.isSave()) {
										if (context[contextName] != null)
											dynamicFormViewModelInstance.selectedValueS2(context[contextName].EnumId);
										break;
									}
									if (dynamicFormViewModelInstance.multiflag === true && typeof (context[contextName]) === 'string')
										context[contextName] = JSON.parse(context[contextName]);
									dynamicFormViewModelInstance.selectedValueS2(context[contextName]);
									break;
								case "BoolControlDescriptor":
									dynamicFormViewModelInstance.Value(context[contextName]);
									break;
								case "CollectionFormDescriptor":
									break;
								case "DictionaryRegistryControlDescriptor":
									dynamicFormViewModelInstance.selectedValueS2(context[contextName]);
									break;
								case "SimpleAttachmentViewModel":
									if (attachmentList != null && attachmentList.indexOf(context[contextName]) !== -1)
										dynamicFormViewModelInstance.setPrevious(context[contextName]);
									break;
								case "Placeholder":
									break;
								case "UserInfoList":
									dynamicFormViewModelInstance.Value(context[contextName].CredentialHash);
									break;
								case 'FiasRegionSelectControlViewModel':
								case 'FIAS':
									////Форма для редактирования.
									//var templateId = 'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templates2/fias.tmpl.html';
									////Формирование внутренней вью-модели.
									//dynamicFormViewModelInstance.initTemplate(templateId);
									//Заполнение вью-модели данными.
									dynamicFormViewModelInstance.Value(context[contextName]);
									break;
								case 'CurrentUserViewModel':
									break;
								default:
									try {
										if (context[contextName] != null && typeof (context[contextName]) === 'string' && context[contextName].contains('&quot;'))
											dynamicFormViewModelInstance.Value(context[contextName].replace(/&quot;/g, '"'));
										else
											dynamicFormViewModelInstance.Value(context[contextName]);
									} catch (e) {
										if (preferences.log === true) {
											console.log('Was error in .Value({0}) {1} '.format(context[contextName], dynamicFormViewModelInstance.Path));
										}
									}
									break;
							}
						}
					}
				}
			};
		};

		var dynamicFormHub = new DynamicFormHub();
		//Legacy support.
		Nvx.createNamespace('Nvx.ReDoc.Workflow.DynamicForm');
		Nvx.ReDoc.Workflow.DynamicForm.mainForm = dynamicFormHub;

		return dynamicFormHub;
	});
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/DynamicFormController/pathUtil',
	[],
	function () {

		// Утилита для работы с путями
		var PathUtil = {
			toAbsolutePath: function(path, currentPath) {

				var groups = path.match(this.PathRegex);

				// если путь абсолютный, просто возвращает его
				if (groups == null) {
					return path;
				}

				var backs = groups[1];

				var curParts = currentPath.split('.');
				var relParts = groups[2].split('.');

				if (curParts.length >= backs.length) {
					curParts = curParts.slice(0, curParts.length - backs.length);
				} else {
					throw new Error("Invalid path or currentPath");
				}

				path = curParts.concat(relParts);

				return path.join('.');
			},
			PathRegex: /(~+)([\S\s]+)/,
			/**
             * Является ли путь относительным
			 */
			isPathRelative: function (path) {
				return path.match(this.PathRegex) != null;
			},
			getFullPath: function (model) {

				return model.FullPath;

				var path = this.getFullElementPathInternal(model);
				
				if(!path.startsWith('_.')) {
					path = '_.' + path;
				}
				return path;
			},

			getFullElementPathInternal : function (model) {
				var pathParts = model.Path.split('.');
				var curPath = pathParts[pathParts.length - 1];

				if (model.Parent && model.Parent.elementDescriptor.DescriptorKey === "CollectionFormDescriptor") {
					var items = model.Parent.CollectionItems();
					var index = items.indexOf(model);
					curPath = this.getFullElementPathInternal(model.Parent) + '[' + index + ']';
				} else if (model.Parent) {
					curPath = this.getFullElementPathInternal(model.Parent) + '.' + curPath;
				}

				return curPath;
			}
		}

		return PathUtil;
	});
///<reference path="~/../Nvx.ReDoc.WebInterfaceModule/Content/Scripts/FilePageHub/filePageSignalrConnection.js" />
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormController/readonlyDynamicForm',
	[
		'jquery',
		'knockout',
		'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/main',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/nvx',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/ScriptMediator',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/DynamicFormController/ClientJsonParser',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/preferences',
		'jqueryExtention',
		'select2lib',
		'javascriptExtention'
	],
	function ($, ko, dynamicFormRender, Nvx, modalWindowsFunction, ScriptMediator, ClientJsonParser, preferences) {
		var DynamicFormHubReadonly = function () {
			var self = this;

			self.contentDiv = '#dynamic_form_content_right';
			self.formCollapseRight = "▼";
			self.formCollapseDown = "▶";
			//Флаг состояния загрузки вьюмодели формы
			self.formWasLoaded = ko.observable(false);
			self.clientJsonParser = new ClientJsonParser();

			//show or hide collapsable form with it's elements but without caption
			self.collapseFormBlock = function (controlPath) {
				var block = $(self.contentDiv).find('[data-control-path="' + controlPath + '"]').find('.nvx-dfjsr-verticalLine').first();
				var blockCaption = $(self.contentDiv).find('[data-control-path="' + controlPath + '"]').find('p').first();
				if (block.height() != 0) {
					block[0].style.setProperty('display', 'none', 'important');
					block[0].style.setProperty('overflow', 'hidden', 'important');
					block[0].style.setProperty('height', 0, 'important');
					blockCaption.textNodeContent(self.formCollapseDown + blockCaption.textNodeContent().substr(blockCaption.textNodeContent().indexOf(' ')));
				} else {
					//развернуть
					block[0].style.setProperty('display', 'block');
					block[0].style.setProperty('height', 'auto');
					blockCaption.textNodeContent(self.formCollapseRight + blockCaption.textNodeContent().substr(blockCaption.textNodeContent().indexOf(' ')));
				}
			};

			self.collapsePage = function (id) {
				dynamicFormRender.collapsePage(document.getElementById('dynamic_form_content_right'), id);
			};

			//Хаб.
			self.dynamicFormHub = null;
			//Вью-модель.
			self.dynamicFormViewModel = null;
			self.dynamicFormAdapter = null;

			self.entityRequest = null;

			//Функция инициализации хаба.
			self.initHubFunction = function () {
				self.dynamicFormHub = $.connection.dynamicFormHub;
			};

			self.initAdapter = function (isClientScripts) {
				if (isClientScripts) {
					self.dynamicFormAdapter = {
						onValueChanged: self.onValueChanged,
						updateValue: function () {
							
						},
						ScriptMediator: new ScriptMediator(),
						//он не нужен
						//updateValue: dynamicFormEmitter.onFieldChanged,
						formWasLoaded: self.formWasLoaded,
						EntityPathToViewModel: {},
						ViewModelPathToViewModel: {},
						// это нужно только для того чтобы запомнить данные от начального рендеринга(в коллекциях используется)
						EntityPathToViewModelRender: {}
					};
				} else {
					self.dynamicFormAdapter = {
						onValueChanged: self.onValueChanged,
						updateValue: self.dynamicFormHub.server.updateValue,
						formWasLoaded: self.formWasLoaded,
						EntityPathToViewModel: {},
						ViewModelPathToViewModel: {},
						// это нужно только для того чтобы запомнить данные от начального рендеринга(в коллекциях используется)
						EntityPathToViewModelRender: {}
					};
				}
				self.dynamicFormAdapter.IsFormReadonly = true;
				self.dynamicFormAdapter.isClientScripts = isClientScripts;
			};

			self.onGetViewModelValue = function (viewModelValueResponseInstance, isClientScripts) {
				isClientScripts = isClientScripts === true;
				var viewModelValueResponse = viewModelValueResponseInstance;
				console.log('IsClientScripts ', isClientScripts);
				if (viewModelValueResponse.hasError) {
					console.log(viewModelValueResponse.errorMessage);
				} else {
					//проставляем значения из viewModelView (ДЛЯ КЛИЕНТСКИХ СКРИПТОВ С СЕРВЕРА НЕ ПЕРЕДАЁТСЯ)
					var viewModelView = viewModelValueResponse.viewModel;
					var entity = viewModelValueResponse.dataContext;

					if (viewModelValueResponseInstance.formContextData) {
						//для клиентских скриптов парсим даты в объекты
						if (isClientScripts === true) {
							self.dynamicFormViewModel.formContextData = JSON.parse(viewModelValueResponseInstance.formContextData, self.clientJsonParser.parse);
						} else {
							self.dynamicFormViewModel.formContextData = JSON.parse(viewModelValueResponseInstance.formContextData);
						}
					}

					if (self.dynamicFormViewModel == null) {
						throw new Error('DynamicForm viewModel is missing');
					}
					if (isClientScripts === false) {
						//Обрабатываем главную форму.
						if (viewModelView.ControlVisibility !== undefined) {
							self.dynamicFormViewModel.ControlVisibility(viewModelView.ControlVisibility);
						}
						//Обрабатываем потомков главной формы.
						self.fillrecursion(self.dynamicFormViewModel, viewModelView, JSON.parse(entity), 0, $(self.dynamicFormContentRight));
						//Клиентские ли скрипты.
						self.dynamicFormViewModel.isClientScripts = isClientScripts;
					} else {
						//Обрабатываем потомков главной формы.
						self.fillrecursionJs(self.dynamicFormViewModel, JSON.parse(entity, self.clientJsonParser.parse), 0, $(self.dynamicFormContentRight));
						self.dynamicFormAdapter.ScriptMediator.onViewModelBuilded(self.dynamicFormViewModel);
						//Клиентские ли скрипты.
						self.dynamicFormViewModel.isClientScripts = isClientScripts;
					}
				}
			};

			self.onViewModelBuilded = function(viewModel, isClientScripts) {
				isClientScripts = isClientScripts === true;
				self.requestArgs.fromPortal = isClientScripts;
				$(self.contentDiv).html(viewModel.markup);
				//Включаем knockout.
				var dynamicFormContentRight = document.getElementById('dynamic_form_content_right');
				ko.cleanNode(dynamicFormContentRight);
				//Глобально (на уровне подключения) запоминаем вью-модель динамической формы.
				self.dynamicFormViewModel = viewModel;
				viewModel = { '_': viewModel };
				ko.applyBindings(viewModel, dynamicFormContentRight);
				self.dynamicFormContentRight = dynamicFormContentRight;

				//Активна первая вкладка, если она есть
				self.collapsePage(0);

				//Получаем viewModelValue
				if (isClientScripts === false) {
					//Через хаб.
					self.dynamicFormHub.server.getConnectionId()
						.done(function (connectionId) {
							self.connectionId = connectionId;
						})
						.fail(self.onError);
					self.dynamicFormHub.server.getViewModelValue(self.requestArgs)
						.done(function(formDescriptorResponseInstance) {
							self.onGetViewModelValue(JSON.parse(formDescriptorResponseInstance), isClientScripts);
						})
						.fail(function(err) {
							console.log("Error: " + err);
						});
				} else {
					//Через контроллер.
					var request = self.entityRequest || $.ajax({ url: '/Nvx.ReDoc.Workflow.DynamicForm/Web/Controller/FormDataController/BusinessEntity', data: self.requestArgs, method: 'POST', headers: { proxy: true } });

					request.done(function (response) {
							self.onGetViewModelValue(response, isClientScripts);
						})
						.fail(function(jqXHR, textStatus, errorThrown) {
							if (jqXHR.responseJSON) {
								modalWindowsFunction.errorModalWindow(jqXHR.responseJSON.errorMessage);
							} else {
								modalWindowsFunction.errorModalWindow(jqXHR.responseText);
							}
						}).always(function () {
							setTimeout(function() {
								self.entityRequest = null;
							}, 0);
						});
				}
			};

			self.onGetFormEntityJsonSuccess = function (formDescriptorResponseInstance, isClientScripts) {
				isClientScripts = isClientScripts === true;
				var formDescriptorResponse = formDescriptorResponseInstance;
				if (isClientScripts === false) {
					//Данные от хаба нужно парсить в объект вручную.
				    //formDescriptorResponse = formDescriptorResponseInstance;
				} else {
					//Данные от контроллера (для js-форм) уже приходят в виде объекта.
					//formDescriptorResponse = formDescriptorResponseInstance;
				}
				if (formDescriptorResponse.hasError) {
					console.log(formDescriptorResponse.errorMessage);
				} else {
					//var formDescriptor = JSON.parse(formDescriptorResponse.serializedValue);
					dynamicFormRender.buildViewModelReadonly(formDescriptorResponse.jsonDescriptor, self.dynamicFormAdapter, self.onViewModelBuilded, isClientScripts);
				}
			};

			self.initHub = function (fileId, componentId, formDescriptorResponse) {
				//В описателе формы присутствуют только js-скрипты.
				var isClientScripts = formDescriptorResponse.isClientScripts === true;
				self.dynamicFormViewModel = null;

				//Состояние хаба беспокоит нас только в случае не-js скриптов.
				if (isClientScripts === false) {
					if ($.connection.hub.state === 4) {
						window.ModalWindowsFunction.CreateNewModalDialog("modalWindowDialog", "Соединение было разорвано. Пожалуйста, обновите страницу.", true, true);
						return;
					}
				}

				if (formDescriptorResponse.hasError) {
					console.error(formDescriptorResponse.errorMessage);
				} else {
					self.initAdapter(isClientScripts);
				}

				var requestArgs = {
					fileId: fileId,
					componentId: componentId,
					value: false
				};
				self.requestArgs = requestArgs;

				if (isClientScripts === false) {
					//Через хаб запрашиваем дескриптор формы.
					self.dynamicFormHub.server.getFormEntityJson(self.requestArgs)
						.done(function (response) {
						    var jsonRespose = JSON.parse(response);
						    self.onGetFormEntityJsonSuccess(jsonRespose, isClientScripts);
						})
						.fail(function (err) {
							console.log("Error: " + err);
						});
				} else {
					self.dynamicFormAdapter.ScriptMediator.setReadOnly();
					self.entityRequest = $.ajax({ url: '/Nvx.ReDoc.Workflow.DynamicForm/Web/Controller/FormDataController/BusinessEntity', data: self.requestArgs, method: 'POST', headers: { proxy: true } });

					//нужно ли инициализировать движок руби
					if (formDescriptorResponse.isClientScripts) {
						self.dynamicFormAdapter.ScriptMediator.initRubyEngine(function () {
							//Для js-форм дескриптор мы уже получили.
							self.onGetFormEntityJsonSuccess(formDescriptorResponse, isClientScripts);
						});
					} else {
						//Для js-форм дескриптор мы уже получили.
						self.onGetFormEntityJsonSuccess(formDescriptorResponse, isClientScripts);
					}
				}
			};

			//Рекурсия для заполнения формы в режиме только для чтения по полученным данным
			self.fillrecursion = function (dynamicFormViewModelInstance, dynamicFormView2, context, indexInCollection, divname) {
				if (dynamicFormView2.Pages != null) {
					for (var position = 0; position < dynamicFormView2.Pages.length; position++)
						self.fillrecursion(dynamicFormViewModelInstance.Pages[position], dynamicFormView2.Pages[position], context, indexInCollection, divname.find('[data-control-type="page"]').eq(position).children());
				} else if (dynamicFormView2.FormElements != null) {
					var dynamicFormViewChildren = dynamicFormView2.FormElements;
					if (dynamicFormView2.ControlVisibility === false) {
						//скрыть и дальше не показывать
						dynamicFormViewModelInstance.ControlVisibility(false);
						return;
					}
					var length = dynamicFormViewChildren.length;
					for (var index = 0; index < length; index++) {
						//Объект с сервера.
						var childDynamicFormView = dynamicFormViewChildren[index];
						//Объект - вьюмодель.
						var childDynamicFormViewModel = dynamicFormViewModelInstance.PageElements !== undefined ?
							dynamicFormViewModelInstance.PageElements[index] :
							dynamicFormViewModelInstance.FormElements[index];
						//ControlVisibility
						if (childDynamicFormView.ControlVisibility !== undefined && childDynamicFormView.ControlVisibility == false) {
							var inputs = divname.find('[data-control-path="{0}"]'.format(childDynamicFormView.Path));
							if (inputs.length > 0)
								inputs.hide();
						}
						//Запускаем еще одну итерацию рекурсии (вдруг и у дитя есть дети).
						var parentpath = dynamicFormViewModelInstance.Path;
						var parpath = dynamicFormViewModelInstance.Path;
						if (parpath.split('.').length > 2)
							parpath = parpath.substring(0, parpath.lastIndexOf('.'));

						//целевое расположение дочерних элементов. Из-за некоторых ошибок в формировании путей, поиск может промахнуться. Тогда передаёт целиком родителя
						var target = divname.find('[data-control-path="{0}"]'.format(parpath)).eq(indexInCollection);
						if (target.length == 0)
							target = divname;
						self.fillrecursion(
							childDynamicFormViewModel,
							childDynamicFormView,
							parentpath != "_" ? context[parentpath.substr(parentpath.lastIndexOf('.') + 1)] : context,
							indexInCollection,
							dynamicFormViewModelInstance.PageElements != null ? target : target.children().children());
					}
				} else if (dynamicFormView2.CollectionItems != null) {
					//коллекция
					if (dynamicFormView2.ControlVisibility === false) {
						//скрыть и дальше не показывать
						dynamicFormViewModelInstance.ControlVisibility(false);
						return;
					}
					dynamicFormView2.CollectionItems.forEach(function (element, ind) {
						//Имеем клон тут - форму
						dynamicFormViewModelInstance.addItem();
						if (element.FormElements != null) {
							//обработка примерно как элементы формы обычные, только пути проверить
							var dynamicCollectionViewChildren = element.FormElements;
							var cloneElLength = dynamicCollectionViewChildren.length;
							for (var cloneIndex = 0; cloneIndex < cloneElLength; cloneIndex++) {
								//Объект с сервера.
								var childDynamicFormV = dynamicCollectionViewChildren[cloneIndex];
								//Объект - вьюмодель.
								var childDynamicFormVm = dynamicFormViewModelInstance.CollectionItems()[ind].FormElements[cloneIndex];
								//ControlVisibility
								if (childDynamicFormVm.ControlVisibility !== undefined && childDynamicFormVm.ControlVisibility() == false) {
									var field = divname.find('[data-control-path="{0}"]'.format(childDynamicFormV.Path));
									if (field.length > 0)
										field.hide();
								}
								//Запускаем еще одну итерацию рекурсии (вдруг и у дитя есть дети).
								var partpath = dynamicFormViewModelInstance.Path;
								var allclonecontext = context[partpath.substr(partpath.lastIndexOf('.') + 1)];
								if (Object.prototype.toString.call(allclonecontext) == "[object String]")
									allclonecontext = JSON.parse(allclonecontext);
								//для коллекций берём данные нужного по счёту элемента
								parpath = dynamicFormView2.Path;
								//Если путь составной, будем искать ребёнка по последней части
								if (parpath.split('.').length > 2)
									parpath = parpath.substring(parpath.lastIndexOf('.') + 1);
								var cloneTarget = divname.find('[data-control-fragment-id$="{0}"]'.format(parpath)).children().eq(ind);
								//Если поиск промазал, ищем по полному родителю
								if (cloneTarget.length == 0)
									cloneTarget = divname;
								//Запускаем обход нового добавленного ребёнка
								self.fillrecursion(childDynamicFormVm, childDynamicFormV, allclonecontext[ind], ind, cloneTarget);
							}
						}
					});
				} else {
					if (dynamicFormViewModelInstance.Path === "_")
						return;
					//Если не форма, заполняем контрол значением из контекста
					if (context != null && dynamicFormViewModelInstance.Path != null) {
						if (dynamicFormView2.ControlVisibility !== true) {
							dynamicFormViewModelInstance.ControlVisibility(false);
							var input = divname.find('[data-control-path="{0}"]'.format(dynamicFormViewModelInstance.Path));
							if (input.length > 0)
								input.hide();
						}
						var dataPath = dynamicFormViewModelInstance.Path;
						var contextName = dataPath.substr(dataPath.lastIndexOf('.') + 1);
						if (context[contextName] != undefined) {
							var descriptorKey = dynamicFormView2.DescriptorKey;
							if (indexInCollection == null)
								indexInCollection = 0;
							var ourinput = divname.find('[data-control-path="{0}"]'.format(dynamicFormViewModelInstance.Path));
							if (ourinput.length == 0) {
								console.log('нет элемента: ' + dynamicFormViewModelInstance.Path);
								return;
							} else if (ourinput.length > 1) {
								console.log('несколько элементов: ' + dynamicFormViewModelInstance.Path + ' повторный поиск по детям');
								ourinput = divname.children('[data-control-path="{0}"]'.format(dynamicFormViewModelInstance.Path));
							}
							if (ourinput.length != 1) {
								console.log('нет однозначного элемента: ' + dynamicFormViewModelInstance.Path);
								return;
							}

							switch (descriptorKey) {
							//Enum
								case "DictionaryRegistryControlDescriptor":
									var current = typeof(context[contextName]) === "string" ? context[contextName] : (context[contextName] || []).toString();
									if (current === null || current === "")
										break;
									if (dynamicFormViewModelInstance.DictionarySource() == null)
										break;
									var dictionaryId, parentId, dataUrl;
									if (dynamicFormViewModelInstance.DictionarySource().toLowerCase().startsWith("context")) {
										//context data
										dictionaryId = dynamicFormViewModelInstance.DictionarySource();
										parentId = dynamicFormViewModelInstance.DisplayFieldScript();
										dataUrl = "/DynamicForm/GetDictionaryRegistryContextData";
									} else {
										//dictionary data
										dictionaryId = dynamicFormViewModelInstance.DictionaryId();
										parentId = dynamicFormViewModelInstance.ParentId();
										dataUrl = "/DynamicForm/GetDictionaryRegistryData";
									}
									var requestData = {
										fileId: $('#fileId').val(),
										componentId: $('#componentId').val(),
										DictionaryId: dictionaryId,
										ParentId: parentId,
										Current: current
									};
									$.ajax({url: dataUrl, data: requestData, type: 'POST', headers: {proxy: true} })
											.done(function (response) {
												var obj = response.hasError === false ? JSON.parse(response.serializedValue) : [];
												if (obj == null || obj.lenght == 0)
													return;
												var drValues = "";
												for (var j = 0; j < obj.length; j++)
													drValues += "\n• " + obj[j].text;
												drValues = $.htmlEncode(drValues).replaceNewLinesToBr();
												ourinput.find('span').html(drValues);
											});
									break;
								case "EnumControlDescriptor":
									//Замена значения selected в э/у Enum.
									var opts = dynamicFormViewModelInstance.options;
									if (dynamicFormViewModelInstance.isSave()) {
										if (context[contextName] != null)
											ourinput.find('span').text(context[contextName].EnumTitle);
										break;
									}
									if (typeof (context[contextName]) === "string" && context[contextName].contains(','))
										context[contextName] = current = JSON.parse(context[contextName]);
									if (typeof(context[contextName]) === "string") {
										for (var i = 0; i < opts.length; i++) {
											if (opts[i].LV == context[contextName]) {
												ourinput.find('span').text(opts[i].DA);
												break;
											}
										}
									} else if (typeof (context[contextName]) === "object") {
										if (context[contextName].length == 0)
											break;
										var textValues = "";
										for (var j = 0; j < context[contextName].length; j++) {
											for (var ii = 0; ii < opts.length; ii++) {
												if (opts[ii].LV == context[contextName][j]) {
													textValues += "\n• " +  opts[ii].DA;
													break;
												}
											}
										}
										textValues = $.htmlEncode(textValues).replaceNewLinesToBr();
										ourinput.find('span').html(textValues);
									}
									break;
								case "BoolControlDescriptor":
									//Bool
									var boolresult = context[contextName] != null ? context[contextName] : false;
									if (boolresult == false || boolresult == "False") {
										boolresult = false;
									} else {
										boolresult = true;
									}
									ourinput.find('input').attr('checked', boolresult);
									break;
								case "DateControlDescriptor":
									//date
									var value = context[contextName];
									if (value.length > 10) {
										value = value.substr(0, 10);
									}
									ourinput.find('span').text(value);
									break;
								case 'FiasRegionSelectControlViewModel':
								case 'FIAS':
									////Форма только для чтения.
									//var templateId = 'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templatesReadonly/fias.tmpl.html';
									////Формирование внутренней вью-модели.
									//dynamicFormViewModelInstance.initTemplate(templateId);
									//Заполнение вью-модели данными.
									dynamicFormViewModelInstance.Value(context[contextName]);
									break;
								case 'UserInfoList':
									if (context[contextName] == null)
										break;
									ourinput.find('span').text(context[contextName].UserName);
									break;
								case 'TextControlDescriptor':
									var contextData = context[contextName];
									var textValue = (contextData != null && typeof (contextData) === 'string' && contextData.contains('&quot;')) ?
											contextData.replace(/&quot;/g, '"') :
											contextData;
									ourinput.find('span').text(textValue);
									break;
								default:
									ourinput.find('span').text(context[contextName]);
									break;
							}
						}
					}
				}
			};


			self.DateTimeFormatOptions = {
				year: 'numeric',
				month: 'numeric',
				day: 'numeric'
			};

			//Рекурсия для заполнения формы в режиме только для чтения по полученным данным
			self.fillrecursionJs = function (dynamicFormViewModelInstance, context, indexInCollection, divname) {

				if (context == null) {
					console.log('entitydata is null for path ', dynamicFormViewModelInstance.Path);
					return;
				}

				if (dynamicFormViewModelInstance.FormElements != null) {
					for (var index = 0; index < dynamicFormViewModelInstance.FormElements.length; index++) {
						var childDynamicFormViewModel = dynamicFormViewModelInstance.FormElements[index];
						var parentpath = dynamicFormViewModelInstance.Path;

						var target = divname.find('[data-control-path="{0}"]'.format(parpath)).eq(indexInCollection);
						if (target.length === 0)
							target = divname;

						self.fillrecursionJs(childDynamicFormViewModel, parentpath != "_" ? context[parentpath.substr(parentpath.lastIndexOf('.') + 1)] : context,
							indexInCollection, dynamicFormViewModelInstance.PageElements != null ? target : target.children().children());
					}
				} else if (dynamicFormViewModelInstance.CollectionItems != null) {

					var partpath = dynamicFormViewModelInstance.Path;
					var allclonecontext = context[partpath.substr(partpath.lastIndexOf('.') + 1)];
					if (Object.prototype.toString.call(allclonecontext) == "[object String]")
						allclonecontext = JSON.parse(allclonecontext);

					//для коллекций берём данные нужного по счёту элемента
					var parpath = dynamicFormViewModelInstance.Path;
					//Если путь составной, будем искать ребёнка по последней части
					if (parpath.split('.').length > 2)
						parpath = parpath.substring(parpath.lastIndexOf('.') + 1);

					var isArray = Object.prototype.toString.call(allclonecontext) === "[object Array]";

					if (allclonecontext) {

						//при создании обязательной коллекции добавляется "лишний" элемент
						if (allclonecontext.length > 0)
							dynamicFormViewModelInstance.clear();

						for (var i = 0; i < allclonecontext.length; i++) {
							dynamicFormViewModelInstance.addItem();

							var itemFormViewModel = dynamicFormViewModelInstance.CollectionItems()[i];
							if (itemFormViewModel.FormElements != null) {
								for (var j = 0; j < itemFormViewModel.FormElements.length; j++) {

									var cloneTarget = divname.find('[data-control-fragment-id$="{0}"]'.format(parpath)).children().eq(i);
															//Если поиск промазал, ищем по полному родителю
									if (cloneTarget.length === 0)
										cloneTarget = divname;

									var childDynamicFormViewModel = itemFormViewModel.FormElements[j];
									//для коллекций берём данные нужного по счёту элемента
									self.fillrecursionJs(childDynamicFormViewModel, isArray ? allclonecontext[i]: allclonecontext, i, cloneTarget);
									//Для checkenumviewmodel здесь тоже массив!
								}
							} else {
								console.warn('no FormElements');
							}
						}
					}
				} else if (dynamicFormViewModelInstance.Pages != null) {
					for (var position = 0; position < dynamicFormViewModelInstance.Pages.length; position++)
						self.fillrecursionJs(dynamicFormViewModelInstance.Pages[position], context, indexInCollection, divname.find('[data-control-type="page"]').eq(position).children());
				} else {
					if (dynamicFormViewModelInstance.Path === "_")
						return;
					//Если не форма, заполняем контрол значением из контекста
					if (context != null && dynamicFormViewModelInstance.Path != null) {
						var dataPath = dynamicFormViewModelInstance.Path;
						var contextName = dataPath.substr(dataPath.lastIndexOf('.') + 1);
						if (context[contextName] != undefined) {
							var descriptorKey = dynamicFormViewModelInstance.elementDescriptor.DescriptorKey;
							if (indexInCollection == null)
								indexInCollection = 0;


							//var ourinput = dynamicFormViewModelInstance.element();
							var ourinput = divname.find('[data-control-path="{0}"]'.format(dynamicFormViewModelInstance.Path));
							if (ourinput.length == 0) {
								console.log('нет элемента: ' + dynamicFormViewModelInstance.Path);
								return;
							} else if (ourinput.length > 1) {
								console.log('несколько элементов: ' + dynamicFormViewModelInstance.Path + ' повторный поиск по детям');
								ourinput = divname.children('[data-control-path="{0}"]'.format(dynamicFormViewModelInstance.Path));
							}
							if (ourinput.length != 1) {
								console.log('нет однозначного элемента: ' + dynamicFormViewModelInstance.Path);
								return;
							}

							switch (descriptorKey) {
								//Enum
							case "DictionaryRegistryControlDescriptor":
								var current = typeof (context[contextName]) === "string" ? context[contextName] : (context[contextName] || []).toString();
								if (current === null || current === "")
									break;
								if (dynamicFormViewModelInstance.DictionarySource() == null)
									break;
								var dictionaryId, parentId, dataUrl;
								if (dynamicFormViewModelInstance.DictionarySource().toLowerCase().startsWith("context")) {
									//context data
									dictionaryId = dynamicFormViewModelInstance.DictionarySource();
									parentId = dynamicFormViewModelInstance.DisplayFieldScript();
									dataUrl = "/DynamicForm/GetDictionaryRegistryContextData";
								} else {
									//dictionary data
									dictionaryId = dynamicFormViewModelInstance.DictionaryId();
									parentId = dynamicFormViewModelInstance.ParentId();
									dataUrl = "/DynamicForm/GetDictionaryRegistryData";
								}
								var requestData = {
									fileId: $('#fileId').val(),
									componentId: $('#componentId').val(),
									DictionaryId: dictionaryId,
									ParentId: parentId,
									Current: current
								};
								dynamicFormViewModelInstance.selectedValueS2(context[contextName]);
								$.ajax({ url: dataUrl, data: requestData, headers: {proxy: true}, type: 'POST' })
									.done(function(response) {
										var obj = response.hasError === false ? JSON.parse(response.serializedValue) : [];
										if (obj == null || obj.lenght == 0)
											return;
										var drValues = "";
										for (var j = 0; j < obj.length; j++)
											drValues += "\n• " + obj[j].text;
										drValues = $.htmlEncode(drValues).replaceNewLinesToBr();
										ourinput.find('span').html(drValues);
									});
								break;
							case "EnumControlDescriptor":
								//Замена значения selected в э/у Enum.
								var opts = dynamicFormViewModelInstance.options;
								if (dynamicFormViewModelInstance.isSave()) {
									if (context[contextName] != null) {
										ourinput.find('span').text(context[contextName].EnumTitle);
										dynamicFormViewModelInstance.selectedValueS2(context[contextName].EnumId);
									}
									break;
								}
								if (typeof (context[contextName]) === "string" && context[contextName].contains(','))
									context[contextName] = current = JSON.parse(context[contextName]);
								if (typeof (context[contextName]) === "string") {
									for (var i = 0; i < opts.length; i++) {
										if (opts[i].LV == context[contextName]) {
											ourinput.find('span').text(opts[i].DA);
											dynamicFormViewModelInstance.selectedValueS2(context[contextName]);
											break;
										}
									}
								} else if (typeof (context[contextName]) === "object") {
									if (context[contextName].length == 0)
										break;
									var textValues = "";
									for (var j = 0; j < context[contextName].length; j++) {
										for (var ii = 0; ii < opts.length; ii++) {
											if (opts[ii].LV == context[contextName][j]) {
												textValues += "\n• " + opts[ii].DA;
												break;
											}
										}
									}
									textValues = $.htmlEncode(textValues).replaceNewLinesToBr();
									dynamicFormViewModelInstance.selectedValueS2(context[contextName]);
									ourinput.find('span').html(textValues);
								}
								break;
							case "BoolControlDescriptor":
								//Bool
								var boolresult = context[contextName] != null ? context[contextName] : false;
								if (boolresult == false || boolresult == "False") {
									boolresult = false;
								} else {
									boolresult = true;
								}
								dynamicFormViewModelInstance.Value(boolresult);
								ourinput.find('input').attr('checked', boolresult);
								break;
							case "DateControlDescriptor":
								//date
								var value = context[contextName];
								if (value.length > 10) {
									value = value.substr(0, 10);
								} else {
									value = (value instanceof Date) ? value.toLocaleString("ru", self.DateTimeFormatOptions) : value;
								}
								dynamicFormViewModelInstance.Value(value);
								ourinput.find('span').text(value);
								break;
							case 'FiasRegionSelectControlViewModel':
							case 'FIAS':
								////Форма только для чтения.
								//var templateId = 'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/app/templatesReadonly/fias.tmpl.html';
								////Формирование внутренней вью-модели.
								//dynamicFormViewModelInstance.initTemplate(templateId);
								if (context[contextName]) {
									//Заполнение вью-модели данными.
									dynamicFormViewModelInstance.Value(context[contextName]);
								}
								break;
							case 'UserInfoList':
								if (context[contextName] == null)
									break;
								dynamicFormViewModelInstance.Value(context[contextName].CredentialHash);
								ourinput.find('span').text(context[contextName].UserName);
								break;
							case 'TextControlDescriptor':
								var contextData = context[contextName];
								var textValue = (contextData != null && typeof (contextData) === 'string' && contextData.contains('&quot;')) ?
									contextData.replace(/&quot;/g, '"') :
									contextData;
								dynamicFormViewModelInstance.Value(textValue);
								ourinput.find('span').text(textValue);
								break;
							default:
								ourinput.find('span').text(context[contextName]);
								//viewmodel value
								try {
									if (context[contextName] != null && typeof (context[contextName]) === 'string' && context[contextName].contains('&quot;'))
										dynamicFormViewModelInstance.Value(context[contextName].replace(/&quot;/g, '"'));
									else
										dynamicFormViewModelInstance.Value(context[contextName]);
								} catch (e) {
									if (preferences.log === true) {
										console.log('Was error in .Value({0}) {1} '.format(context[contextName], dynamicFormViewModelInstance.Path));
									}
								}
								break;
							}
						}
					}
				}
			};
		};

		var dynamicFormHubReadonly = new DynamicFormHubReadonly();
		//Legacy support.
		Nvx.createNamespace("Nvx.ReDoc.Workflow.DynamicForm");
		Nvx.ReDoc.Workflow.DynamicForm.readonlyForm = dynamicFormHubReadonly;

		return dynamicFormHubReadonly;
	});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/BaseScript', [
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/DynamicFormController/knockoutHostObject'
], function (HostObject) {
	/** Базовый конструктор для объекта скрипта */
	var BaseScript = function (elementViewModel, script, scriptPurpose) {

		var self = this;

		self.Content = script.Content;
		self.ScriptType = script.ScriptType;
		self.contextElement = elementViewModel;
		self.hostObject = new HostObject(self.contextElement);

		self.Message = '';

		if (script.Message) {
			self.Message = script.Message;
		}

		// удобно сохранить и назначение скрипта
		self.Purpose = scriptPurpose;

		self.getDependentFields = function() {
			return [];
		}

		self.LaunchCondition = null;
		self.canLaunchScript = function () {
			if (self.LaunchCondition != null) {
				var canLaunch = self.LaunchCondition.runScript();
				if (canLaunch != true) {
					return false;
				}
			}
			return true;
		}
	};

	return BaseScript;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/ConstantScript', [
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/BaseScript'
], function (inherit, BaseScript) {
	/** Конструктор для объекта скрипта */
	var ConstantScript = function (element, script, launchCondition) {
		
		var self = this;

		//Вызов конструктора родителя.
		ConstantScript.superclass.constructor.apply(self, arguments);

		/**
		 * Запустить скрипт в контексте hostObject
		 */
		self.runScript = function () {

			if (!this.Content) return null;

			this.Content = this.Content.trim();

			try {

				if (this.Content === "DateTime.Now") {
					return new Date();
				} else if (this.Content === "false" || this.Content === "true") {
					return eval(this.Content);
				} else {
					return this.Content;
				}

			} catch (e) {
				console.log(e.message);
			}

			return null;
		};
	};

	//Наследуемся.
	inherit(ConstantScript, BaseScript);

	return ConstantScript;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/JavaScript', [
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/BaseScript'
], function (inherit, BaseScript) {
	/** Конструктор для объекта скрипта */
	var JavaScript = function (element, script, launchCondition) {
		
		var self = this;

		//Вызов конструктора родителя.
		JavaScript.superclass.constructor.apply(self, arguments);

		self.matchAll = function(str, regexp) {
			var matches = [];
			str.replace(regexp, function () {
				var arr = ([]).slice.call(arguments, 0);
				var extras = arr.splice(-2);
				arr.index = extras[0];
				arr.input = extras[1];
				matches.push(arr);
			});
			return matches.length ? matches : null;
		};

		self.depsRegex = /hostObject.GetValue\("(.[^"]+)"\)/g;
		/**
		 * Парсим скрипт на наличие элементов 
		 */
		self.getDependentFields = function () {
			if (!self.Content) return [];

			var matches = self.matchAll(self.Content, self.depsRegex);

			if (matches) {
				return matches.map(function (item) {
					return item[1];
				});
			}

			return [];
		};

		
		/**
		 * Запустить скрипт в контексте hostObject
		 */
		self.runScript = function () {

			if (!this.Content) return null;

			var result = null;

			try {
				var hostObject = self.hostObject;

				result = eval(this.Content);
			} catch (e) {
				console.log(e.message);
			}
			return result;
		};
	};

	//Наследуемся.
	inherit(JavaScript, BaseScript);

	return JavaScript;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/RegexpScript', [
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/BaseScript'
], function (inherit, BaseScript) {
	/** Конструктор для объекта скрипта */
	var RegexpScript = function (element, script, launchCondition) {
		
		var self = this;
		
		//Вызов конструктора родителя.
		RegexpScript.superclass.constructor.apply(self, arguments);

		/**
		 * Парсим скрипт на наличие элементов 
		 */
		self.getDependentFields = function () {		
			return [];
		};

		self.regex = null;
		/**
		 * Запустить скрипт в контексте hostObject
		 */
		self.runScript = function () {

			if (!this.Content) return null;

			var result = null;

			try {
				self.regex = self.regex || new RegExp(this.Content.trim().replace("\s+", ""), 'i');
				result = self.regex.test(this.contextElement.getValue());
			} catch (e) {
				console.log(e.message);
			}
			return result;
		};
	};

	//Наследуемся.
	inherit(RegexpScript, BaseScript);

	return RegexpScript;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/RubyScript', [
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/BaseScript',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/preferences',
	//opalRunner тянет парочку тяжёлых либ
	'Nvx.ReDoc.WebInterfaceModule/Content/lib/rubytojs/opalRunner'
], function (inherit, BaseScript, preferences, opal) {
	/** Конструктор для объекта скрипта */
	var RubyScript = function (element, script, launchCondition) {
		
		var self = this;

		//Вызов конструктора родителя.
		RubyScript.superclass.constructor.apply(self, arguments);

		self.matchAll = function(str, regexp) {
			var matches = [];
			str.replace(regexp, function () {
				var arr = ([]).slice.call(arguments, 0);
				var extras = arr.splice(-2);
				arr.index = extras[0];
				arr.input = extras[1];
				matches.push(arr);
			});
			return matches.length ? matches : null;
		};

		//может оптимизировать вместе с конвертацией скриптов
		self.depsRegex = /hostObject.GetValue\("(.[^"]+)"\)/g;

		/**
		 * Парсим скрипт на наличие элементов 
		 */
		self.getDependentFields = function () {
			if (!self.Content) return [];

			var matches = self.matchAll(self.Content, self.depsRegex);

			if (matches) {
				return matches.map(function (item) {
					return item[1];
				});
			}

			return [];
		};

		self.OpalScript = null;
		self.OpalCompiledScript = null;
		self.isCompileError = false;
		self.isCompileError = false;

		/**
		 * Запустить скрипт в контексте hostObject
		 */
		self.runScript = function () {
			"use strict";

			if (!this.Content || self.isCompileError) return null;

			var result = null;

			var hostObject = self.hostObject;

			try {

				if (self.OpalCompiledScript == null) {
					try {
						self.OpalScript = self.getOpalScript(this.Content == null ? "" : this.Content);
						self.OpalCompiledScript = opal.compile(self.OpalScript);
					} catch (error) {
						console.error('ошибка компиляции ruby скрипта');
						console.log(this.Content);
						console.log(self.OpalScript);
						console.log(error.message);
						self.isCompileError = true;
						return null;
					}
				}

				//eval vs new function - в данном случае не влияют(значимо не влияют, разница маленькая) на производительность
				result = eval(self.OpalCompiledScript);
				//если получили Null в руби
				if (result == null || result.constructor.name === 'NilClass' || result.$$id === 4)
					return null;

				//Нагло добавил метод $ToJsNative в модуль Opal(класс обёртка) и если он есть то зовём его
				if (result.$ToJsNative != undefined) {
					result = result.$ToJsNative();
				} else if (result.native != undefined)
					result = result.native;
			} catch (e) {
				console.log('ошибка выполнения ruby скрипта');
				console.log(this.Content);
				console.log(self.OpalScript);
				console.log(e.message);
				console.log('\n');
			}
			return result;
		};

		self.convertRegex = /(hostObject.(?:GetValue|GetContextVariable|SetValue)\(".[^"]+"\))/g;
		//так дольше отрабатывает...
		//self.convertRegex = /(hostObject)/g;

		self.replaceToEmptyKeyWords = [
			"System::"
		];

		self.getOpalScript = function (rubyScript) {
			var result = rubyScript;
			for (var i = 0; i < self.replaceToEmptyKeyWords.length; i++) {
				var keyWord = self.replaceToEmptyKeyWords[i];
				result = result.replace(keyWord, '');
			}
			
			result = rubyScript.replace("hostObject.FormObject", "Native(`hostObject.FormObject`)");
			result = result.replace(self.convertRegex, "Native(`$1`)");
			//result = rubyScript.replace(self.convertRegex, "Native(`$1`)");
			result = result.replace("to_clr_string", "to_s");
			result = result.trim();
			return result;
		};
	};

	//Наследуемся.
	inherit(RubyScript, BaseScript);

	return RubyScript;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/ScriptHandler', [
], function(pathUtil) {

	var ScriptHandler = function(target, script) {
		this.target = target;
		this.script = script;
	};

	ScriptHandler.prototype.run = function() {

		var result = "123";//this.script.runScript();

		switch (this.script) {
			case 'CalculationScript':
				this.target.Value(result);
				break;
			default:
				this.target.Value(result);
				break;
		}
	}

	return ScriptHandler;
});

define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/ScriptMediator', [
	'knockout',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/DynamicFormController/pathUtil',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/JavaScript',
	 'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/Special/EnumTitleScript',
	 'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/Special/HashtableScript',
	 'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/Special/SearchAttributeScript',
	 'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/Special/SelectDictDataScript',
	 'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/ValidationScript',
	 'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/RegexpScript',
	 'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/ConstantScript',
	 'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/ScriptHandler',
	 'require'
], function (ko, pathUtil, JavaScript, EnumTitleScript, HashtableScript, SearchAttributeScript, SelectDictDataScript, ValidationScript, RegexpScript, ConstantScript, ScriptHandler, require) {

	var ScriptMediator = function () {

		var self = this;

		self.registeredScripts = {};

		self.viewModel = null;

		self.registerDelayed = [];
		/**
		* словарь ScriptType scriptCtor, сюда добавляются скрипты движки которых подгружаются в зависимости от настроек
		* (они могу весить 1МБ и сразу их загружать для форм в которых нет этих скриптов не надо)
		*/
		self.externalEngines = {
			//пример в self.initRubyEngine добавляется
			//"IronRuby": RubyScript
		};

		self.inited = false;

		/**
		 * Зарегистрировать скрипт
		 */
		self.registerScript = function(scriptModel) {

			var dependentElements = scriptModel.getDependentFields();

			//добавим зависимость для LaunchCondition
			if (scriptModel.LaunchCondition != null)
				dependentElements = dependentElements.concat(scriptModel.LaunchCondition.getDependentFields());

			dependentElements.forEach(function (dependentElementPath) {
				var dependentElement = scriptModel.contextElement.getViewModelByPath(dependentElementPath);
				if (dependentElement != null) {
					var dependentElementFullPath = dependentElement.FullPath;
					//var dependentElementFullPath = pathUtil.getFullPath(dependentElement);
					self.addDependency(scriptModel.contextElement, dependentElementFullPath, scriptModel);
				} else {
					console.error("Can't find dependent element for script");
					console.error(scriptModel.Content);
				}
			});

			return scriptModel;
		};

		/*
		* Добавить зависимость
		*/
		self.addDependency = function (contextElement, dependentItemPath, scriptModel) {

			if (!self.registeredScripts[scriptModel.Purpose])
				self.registeredScripts[scriptModel.Purpose] = {};

			if (self.registeredScripts[scriptModel.Purpose][dependentItemPath] === undefined) {
				self.registeredScripts[scriptModel.Purpose][dependentItemPath] = [];
			}

			self.registeredScripts[scriptModel.Purpose][dependentItemPath].push(contextElement);
		};

		self.initRubyEngine = function (callback) {
			require(['Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/RubyScript'], function (RubyScript) {
				self.externalEngines["IronRuby"] = RubyScript;
				self.externalEngines["DynamicExpresso"] = RubyScript;
				callback({});
			});
		};

		/**
		 * Вся модель построена
		 */
		self.onViewModelBuilded = function (viewModel) {

			if (viewModel.Path === '_')
				self.viewModel = viewModel;

			// регистрируем отложенные скрипты
			self.registerDelayed.forEach(function (item) {
				self.registerScript(item);
			});

			self.registerDelayed = [];
			self.inited = true;

			self.runDefaultScripts(viewModel);			
		};

		self.RunDefaultValueInitializationScript = function (element) {
			var isEmpty = !element.getValue() || (element.isEmpty && element.isEmpty());

			if (isEmpty) {
				var defaultValue = undefined;
				if (element.DefaultValueScript && self.canRunScriptType("DefaultValueScript") && element.DefaultValueScript.canLaunchScript()) {
					defaultValue = element.DefaultValueScript.runScript();
				} else {
					if (element.CalculationScript && self.canRunScriptType("CalculationScript") && element.CalculationScript.canLaunchScript())
						defaultValue = element.CalculationScript.runScript();
				}
				if (defaultValue !== null && defaultValue !== undefined)
					element.setValue(defaultValue);
			}
		};

		self.RunInitializationScripts = function (element) {
			self.RunDefaultValueInitializationScript(element);

			self.getInitNotValueScriptTypes().forEach(function (scriptType) {
				if (element[scriptType])
					self.runScriptOnElement(element, element[scriptType], scriptType);
			});
		};

		self.canRunScriptType = function (scriptType) {
			return self.getScriptTypes().indexOf(scriptType) >= 0;
		};

		self.runDefaultScripts = function (element) {

			if (element.MaxDateScript && self.canRunScriptType("MaxDateScript") ) {
				element.MaxValue(element.MaxDateScript.runScript());
			}

			if (element.MinDateScript && self.canRunScriptType("MinDateScript")) {
				element.MinValue(element.MinDateScript.runScript());
			}

			self.RunInitializationScripts(element);

			//if (element.FormElements) {
			//	element.FormElements.forEach(function(child) {
			//		self.runDefaultScripts(child);
			//	});
			//}

			var elements = element.FormElements || element.Pages || ko.utils.unwrapObservable(element.CollectionItems) || element.PageElements;
			if (elements) {
				elements.forEach(function(child) {
					self.runDefaultScripts(child);
				});
			}			
		};


		/**
		 * Создать объект скрипта по дескриптору 
		 */
		self.createScriptObject = function(elementViewModel, scriptDescriptor, scriptType) {

			var script = self.prepareScript(elementViewModel, scriptDescriptor, scriptType);

			self.registerDelayed.push(script);

			return script;
		};


		self.prepareScript = function(elementViewModel, scriptDescriptor, scriptType) {
			var scriptModel = null;
			switch (scriptDescriptor.ScriptType) {
			case "Special":
				if (scriptDescriptor.Content.startsWith("Validator")) {
					scriptModel = new ValidationScript(elementViewModel, scriptDescriptor, scriptType);
				} else if (scriptDescriptor.Content.indexOf('EnumTitle:') >= 0) {
					scriptModel = new EnumTitleScript(elementViewModel, scriptDescriptor, scriptType);
				} else if (scriptDescriptor.Content.indexOf('HashTable:') >= 0) {
					scriptModel = new HashtableScript(elementViewModel, scriptDescriptor, scriptType);
				} else if (scriptDescriptor.Content.indexOf('SearchAttribute:') >= 0) {
					scriptModel = new SearchAttributeScript(elementViewModel, scriptDescriptor, scriptType);
				} else if (scriptDescriptor.Content.indexOf('SelectDictData:') >= 0) {
					scriptModel = new SelectDictDataScript(elementViewModel, scriptDescriptor, scriptType);
				} else {
					console.warn('Special is not implemented. script.Content is null');
					scriptModel = null;
				}
				break;
			case "Regex":
				scriptModel = new RegexpScript(elementViewModel, scriptDescriptor, scriptType);
				break;
			case "Constant":
				scriptModel = new ConstantScript(elementViewModel, scriptDescriptor, scriptType);
				break;
			default:
				var scriptCtor = self.externalEngines[scriptDescriptor.ScriptType];
				if (scriptCtor != null)
					scriptModel = new scriptCtor(elementViewModel, scriptDescriptor, scriptType);
				else
					scriptModel = new JavaScript(elementViewModel, scriptDescriptor, scriptType);
				break;
			}

			if (scriptModel && scriptDescriptor.LaunchCondition) {
				scriptModel.LaunchCondition = self.prepareScript(elementViewModel, scriptDescriptor.LaunchCondition, 'LaunchCondition');
			}

			return scriptModel;
		};

		/**
		 * Поменялось значение модели
		 */
		self.valueChanged = function(model, value) {

			if (self.inited === false)
				return;

			// запускаем зависимые скрипты

			//var modelPath = pathUtil.getFullPath(model);
			var modelPath = model.FullPath;

			self.getScriptTypes().forEach(function(scriptType) {
				if (self.registeredScripts[scriptType] && self.registeredScripts[scriptType][modelPath]) {

					self.registeredScripts[scriptType][modelPath].forEach(function(element) {
						// выполняем скрипты для элемента
						if (element[scriptType]) {
							self.runScriptOnElement(element, element[scriptType], scriptType);
						}
					});
				}
			});


			// запускаем зависимые скрипты валидации
			if (self.registeredScripts.ValidationScript && self.registeredScripts.ValidationScript[modelPath]) {
				self.registeredScripts.ValidationScript[modelPath].forEach(function (element) {

					// выполняем скрипты для элемента
					if (element.ValidationScripts) {
						element.ValidationScripts.forEach(function(script) {
							self.runScriptOnElement(element, script, 'ValidationScript');
						});
					}
				});
			}

			// запускаем собственные скрипт валидации
			model.IsValid(model.Validate());			
		};

		function isFloat(n) {
			return Number(n) === n && n % 1 !== 0;
		};

		self.precision = 12;
		self.striptFLoat = function (newValue) {
			if (newValue != null) {
				var float = parseFloat(newValue);
				if (!isNaN(float)) {
					var presioned = parseFloat(float.toFixed(self.precision));
					if (!isNaN(presioned) && presioned != float) {
						return presioned;
					}
				}
			}
			return newValue;
		};

		self.runScriptOnElement = function (element, script, scriptType) {

			//LaunchCondition
			var canLaunch = script.canLaunchScript() == true;

			if (canLaunch) {
				var result = script.runScript();

				switch (scriptType) {
				case 'CalculationScript':
					if (result !== "" && isFloat(result)) {
						//may be use https://github.com/dtrebbien/BigDecimal.js
						result = self.striptFLoat(result);
						element.setValue(result);
					} else {
						element.setValue(result);
					}
					break;

				case 'DisplayScript':
					element.ControlVisibility(result);
					break;

				case 'EnabledScript':
					element.ControlEnabling(result);
					break;

				case 'MandatoryScript':
					element.IsMandatory(result);
					break;
				case 'ValidationScript':
					element.IsValid(result);
					element.errorMessage(result !== true ? script.Message : '');
					break;
				case 'MaxItemsCountScript':
					element.setMaxItemsCount(result);
					break;
				default:
					break;
				}
			} else {
				switch (scriptType) {
					case 'DisplayScript':
						element.ControlVisibility(true);
						break;

					case 'EnabledScript':
						element.ControlEnabling(true);
						break;

					case 'MandatoryScript':
						element.IsMandatory(false);
						break;
					case 'ValidationScript':
						element.IsValid(true);
						element.errorMessage('');
						break;
					case 'MaxItemsCountScript':
						element.setMaxItemsCount(0);
						break;
					default:
						break;
				}
			}
		};

		self.InitNotValueScriptTypes = [
			'DisplayScript', 'EnabledScript', 'MandatoryScript'
		];

		self.getInitNotValueScriptTypes = function () {
			return self.InitNotValueScriptTypes;
		};

		self.ScriptTypes = [
				'DefaultValueScript', 'DisplayScript', 'EnabledScript', 'MandatoryScript',
				'CalculationScript', 'MaxDateScript', 'MinDateScript', "MaxItemsCountScript"
		];

		self.getScriptTypes = function () {
			return self.ScriptTypes;
		};

		self.setReadOnly = function () {
			self.ScriptTypes = ['DisplayScript'];
			self.InitNotValueScriptTypes = ['DisplayScript'];
		};
	};

	return ScriptMediator;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/ValidationScript', [
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/BaseScript',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/Validators/EmailValidator',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/Validators/PhysicalInnValidator',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/Validators/JuridicalInnValidator',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/Validators/SnilsValidator',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/Validators/OgrnValidator',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/Validators/OgrnIpValidator'
], function (
	inherit,
	BaseScript,
	EmailValidator,
	PhysicalInnValidator,
	JuridicalInnValidator,
	SnilsValidator,
	OgrnValidator,
	OgrnIpValidator) {

	/** Конструктор для скрипта валидации */
	var ValidationScript = function(element, script, launchCondition) {

		var self = this;

		//Вызов конструктора родителя.
		ValidationScript.superclass.constructor.apply(self, arguments);

		self.path = null;
		self.validatorType = null;
		self.element = element;

		self.validators = {
			Email: new EmailValidator(),
			Snils: new SnilsValidator(),
			PhysicalInn: new PhysicalInnValidator(),
			JuridicalInn: new JuridicalInnValidator(),
			Ogrn: new OgrnValidator(),
			OgrnIp: new OgrnIpValidator()
		};

		

		var matches = self.Content.match(/^(\w+):\s(.+)/);

		if (matches && matches.length === 3) {
			self.type = matches[1];
			self.validatorType = matches[2];
		}

		self.getDependentFields = function() {
			return [];
		};


		/**
		 * Запустить скрипт в контексте hostObject
		 */
		self.runScript = function() {

			if (!this.Content) return null;

			try {

				return self.validators[self.validatorType].validate(self.contextElement.Value());

			} catch (e) {
				console.log(e.message);
			}

			return null;
		};
	};

	//Наследуемся.
	inherit(ValidationScript, BaseScript);

	return ValidationScript;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/Special/EnumTitleScript', [
	'knockout',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/BaseScript'
], function (ko, inherit, BaseScript) {
	/** Конструктор для объекта скрипта */
	var EnumTitle = function (element, script, launchCondition) {

		var self = this;

		self.path = null;
		self.type = null;

		//Вызов конструктора родителя.
		EnumTitle.superclass.constructor.apply(self, arguments);


		var matches = self.Content.match(/^(\w+):\s(.+)/);

		if (matches && matches.length === 3) {
			self.type = matches[1];
			self.path = matches[2];
		}

		self.getDependentFields = function () {			
			return [self.path];
		};


		/**
		 * Запустить скрипт в контексте hostObject
		 */
		self.runScript = function () {

			if (!this.Content) return null;

			try {
				switch (self.type) {
					case "EnumTitle":
						return self.runEnumTitleScript();
					default:
						console.log("Тип специального скрипта '" + self.type + "' не поддерживается");
				}

			} catch (e) {
				console.log(e.message);
			}

			return null;
		};

		self.runEnumTitleScript = function() {
			var viewModel = self.contextElement.getViewModelByPath(self.path);
			var value = viewModel.selectedValueS2();

			if (viewModel.elementDescriptor.DescriptorKey === "EnumControlDescriptor") {
				var options = ko.utils.unwrapObservable(viewModel.options);
				for (var i = 0; i < options.length; i++) {
					var option = options[i];

					if (option.LV === value) {
						return option.DA;
					}
				}
			} else if (viewModel.elementDescriptor.DescriptorKey === "DictionaryRegistryControlDescriptor") {
				var items = viewModel.metaData();
				var item = ko.utils.arrayFirst(items, function(item) {
					return item.id === value;
				});

				return item.text;
			}
			console.warn('enumTitle not found');
			return null;
		};
	};

	//Наследуемся.
	inherit(EnumTitle, BaseScript);

	return EnumTitle;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/Special/HashtableScript', [
	'knockout',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/BaseScript'
], function (ko, inherit, BaseScript) {
	/** Конструктор для объекта скрипта */
	var HashTable = function (element, script, launchCondition) {

		var self = this;

		self.varName = null;
		self.path = null;

		//Вызов конструктора родителя.
		HashTable.superclass.constructor.apply(self, arguments);


		var matches = self.Content.match(/HashTable: ([^<>]*), ([^<>]*)/);

		if (matches && matches.length === 3) {
			self.varName = matches[1];
			self.path = matches[2].trim();
		}

		self.script = null;
		/**
		 * Запустить скрипт в контексте hostObject
		 */
		self.runScript = function() {
			"use strict";

			if (!this.Content) return null;

			try {
				var variable = self.hostObject.GetContextVariable(self.varName);

				self.script = self.script || self.path.charAt(0) === '[' ? 'variable' : 'variable.' + self.path;
				
				return eval(self.script);

			} catch (e) {
				console.log(e.message);
			}

			return null;
		};
	};

	//Наследуемся.
	inherit(HashTable, BaseScript);

	return HashTable;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/Special/SearchAttributeScript', [
	'knockout',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/BaseScript'
], function (ko, inherit, BaseScript) {
	/** Конструктор для объекта скрипта */
	var SearchAttribute = function (element, script, launchCondition) {

		var self = this;

		self.attrName = null;
		self.script = null;

		//Вызов конструктора родителя.
		SearchAttribute.superclass.constructor.apply(self, arguments);

		//var matches = self.Content.match(/SelectDictData: AttrName:([^<>]*) Path:([^<>]*)/);
		//SearchAttribute: AttrName:SnilsColumn Script:hostObject.GetValue("~snils")
		var matches = self.Content.match(/SearchAttribute: AttrName:([^<>]*) Script:([^<>]*)/i);

		if (matches && matches.length === 3) {
			self.attrName = matches[1];
			self.script = matches[2];
		}

		self.matchAll = function (str, regexp) {
			var matches = [];
			str.replace(regexp, function () {
				var arr = ([]).slice.call(arguments, 0);
				var extras = arr.splice(-2);
				arr.index = extras[0];
				arr.input = extras[1];
				matches.push(arr);
			});
			return matches.length ? matches : null;
		};

		//может оптимизировать вместе с конвертацией скриптов
		self.depsRegex = /hostObject.GetValue\("(.[^"]+)"\)/g;

		/**
		 * Парсим скрипт на наличие элементов 
		 */
		self.getDependentFields = function () {
			if (!self.Content) return [];

			var matches = self.matchAll(self.Content, self.depsRegex);

			if (matches) {
				return matches.map(function (item) {
					return item[1];
				});
			}

			return [];
		};



		/**
		 * Запустить скрипт в контексте hostObject
		 */
		self.runScript = function() {

			if (!this.Content) return null;

			try {
				return self.runSearchAttributeScript();

			} catch (e) {
				console.log(e.message);
			}

			return null;
		};

		self.ajaxRequest = null;
		self.runSearchAttributeScript = function () {
			var viewModel = self.contextElement;
			
			if (viewModel.elementDescriptor.DescriptorKey === "DictionaryRegistryControlDescriptor") {
				if (self.ajaxRequest != null) {
					self.ajaxRequest.abort();
					self.ajaxRequest = null;
				}

				//получаем значение
				var hostObject = self.hostObject;
				var scriptValue = eval(self.script);

				var dictId = viewModel.DictionaryId();
				self.ajaxRequest = $.ajax({
					url: '/DynamicForm/GetDictionaryRegistryDataByAttr',
					data: {
						fileId: $('#fileId').val(),
						componentId: $('#componentId').val(),
						DictionaryId: dictId,
						Value: scriptValue,
						AttrName: self.attrName
					},
					type: 'POST',
					headers: { proxy: true }
				})
					.done(function(response) {
						if (response.hasError === false) {
							var itemId = JSON.parse(response.result);

							viewModel.selectedValueS2(itemId);
						} else {
							console.error('error response for SearchAttribute');
						}
						self.ajaxRequest = null;
					}).fail(function(xhr, textStatus, error) {
						if (xhr.statusText !== 'abort')
							console.error('error for SearchAttribute');
					});
			}
			console.warn('element not External Dictionary');
			return null;
		};
	};

	//Наследуемся.
	inherit(SearchAttribute, BaseScript);

	return SearchAttribute;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/Special/SelectDictDataScript', [
	'knockout',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
	'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/BaseScript'
], function (ko, inherit, BaseScript) {
	/** Конструктор для объекта скрипта */
	var SelectDictData = function (element, script, launchCondition) {

		var self = this;

		self.attrName = null;
		self.path = null;

		//Вызов конструктора родителя.
		SelectDictData.superclass.constructor.apply(self, arguments);


		var matches = self.Content.match(/SelectDictData: AttrName:([^<>]*) Path:([^<>]*)/);

		if (matches && matches.length === 3) {
			self.attrName = matches[1];
			self.path = matches[2];
		}

		self.getDependentFields = function () {			
			return [self.path];
		};


		/**
		 * Запустить скрипт в контексте hostObject
		 */
		self.runScript = function() {

			if (!this.Content) return null;

			try {
				return self.runSelectDictDataScript();

			} catch (e) {
				console.log(e.message);
			}

			return null;
		};

		self.runSelectDictDataScript = function () {
			var viewModel = self.contextElement.getViewModelByPath(self.path);
			var value = viewModel.selectedValueS2();

			if (viewModel.elementDescriptor.DescriptorKey === "DictionaryRegistryControlDescriptor") {
				var items = viewModel.metaData();
				var item = ko.utils.arrayFirst(items, function (item) {
					return item.id === value;
				});

				return item.metaData[self.attrName];
			}
			console.warn('enumTitle not found');
			return null;
		};
	};

	//Наследуемся.
	inherit(SelectDictData, BaseScript);

	return SelectDictData;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/Validators/EmailValidator', [
], function() {
	/** Валидатор email */
	var EmailValidator = function () {

		var self = this;

		self.regexp = /^(.+)@(.+)\.(.+)+$/i;

		self.validate = function (value) {
			return self.regexp.test(value);
		}
	}

	return EmailValidator;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/Validators/JuridicalInnValidator', [
], function() {
	/** Валидатор ИНН юр. лица */
	var JuridicalInnValidator = function () {

		var self = this;
		self.regexp = /^([0-9]{10})$/;

		self.validate = function (value) {

			var result = self.regexp.test(value);

			if (!result)
				return result;

			var n10 = 2 * parseInt(value[0]) +
				4 * parseInt(value[1]) +
				10 * parseInt(value[2]) +
				3 * parseInt(value[3]) +
				5 * parseInt(value[4]) +
				9 * parseInt(value[5]) +
				4 * parseInt(value[6]) +
				6 * parseInt(value[7]) +
				8 * parseInt(value[8]);
			n10 = (n10 % 11) % 10;

			result = n10 === parseInt(value[9]);

			return result;
		}
	}

	return JuridicalInnValidator;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/Validators/OgrnIpValidator', [
], function() {
	/** Валидатор ОГРНИП */
	var OgrnIpValidator = function () {

		var self = this;

		self.regexp = /^([0-9]{15})$/;

		self.validate = function(value) {

			if (!self.regexp.test(value))
				return false;

			var val = parseInt(value.substr(0, 14));
			var checksum = parseInt(value[14]);

			return (val % 13 % 10) === checksum;
		};
	}

	return OgrnIpValidator;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/Validators/OgrnValidator', [
], function() {
	/** Валидатор ОГРН */
	var OgrnValidator = function () {

		var self = this;

		self.regexp = /^([0-9]{13})$/;

		self.validate = function(value) {

			if (!self.regexp.test(value))
				return false;

			var val = parseInt(value.substr(0, 12));
			var checksum = parseInt(value[12]);

			return (val % 11 % 10) === checksum;
		};
	}

	return OgrnValidator;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/Validators/PhysicalInnValidator', [
], function() {
	/** Валидатор ИНН физ. лица */
	var PhysicalInnValidator = function() {

		var self = this;

		self.regexp = /^([0-9]{12})$/;

		self.validate = function (value) {

			var result = self.regexp.test(value);

			if (!result)
				return result;

			var inn = value;

			var n11 = 7 * parseInt(inn[0]) +
				2 * parseInt(inn[1]) +
				4 * parseInt(inn[2]) +
				10 * parseInt(inn[3]) +
				3 * parseInt(inn[4]) +
				5 * parseInt(inn[5]) +
				9 * parseInt(inn[6]) +
				4 * parseInt(inn[7]) +
				6 * parseInt(inn[8]) +
				8 * parseInt(inn[9]);
			n11 = (n11 % 11) % 10;

			result = n11 === parseInt(inn[10]);

			if (result) {
				var n12 = 3 * parseInt(inn[0]) +
				7 * parseInt(inn[1]) +
				2 * parseInt(inn[2]) +
				4 * parseInt(inn[3]) +
				10 * parseInt(inn[4]) +
				3 * parseInt(inn[5]) +
				5 * parseInt(inn[6]) +
				9 * parseInt(inn[7]) +
				4 * parseInt(inn[8]) +
				6 * parseInt(inn[9]) +
				8 * n11;

				n12 = (n12 % 11) % 10;

				result = n12 === parseInt(inn[11]);
			}

			return result;
		}
	}

	return PhysicalInnValidator;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormScripts/Validators/SnilsValidator', [
], function() {
	/** Валидатор СНИЛС */
	var SnilsValidator = function () {

		var self = this;

		self.regexp = /^(\d{3}-\d{3}-\d{3} \d{2})$/;

		self.validate = function (value) {

			//если пусто, то считается валидным
			//такая логика в десктопе
			if (value === "" || value == null)
				return true;

			if (!self.regexp.test(value))
				return false;

			value = value.replace(/-/g, '');
			var number = parseInt(value.substr(0, 9));
			var checksum = parseInt(value.substr(10, 12));

			if (number < 1001998)
				return true;
			
			var d = 0;

			for (var i = 0; i < 9; i++) {
				d += (9 - i) * parseInt(value[i]);
			}

			if (d === 101 || d === 100)
				d = 0;
			else
				d = d % 101 % 100;

			return d === checksum;
		}
	}

	return SnilsValidator;
});
define('Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/dynamicFormFormModule',
	[
		'jquery',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/FileController/FileComponentModule',
		'Nvx.ReDoc.Workflow.DynamicForm/Web/Content/Scripts/DynamicFormFormViewModel',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'jqueryExtention'
	],
	function ($, inherit, FileComponentModule, DynamicFormFormViewModel, modalWindowsFunction) {
		var DynamicFormFormModule = function () {
			var self = this;

			//Вызываем конструктор родителя.
			DynamicFormFormModule.superclass.constructor.apply(self, arguments);
			/**
			 * Вью-модель.
			 * @type {DynamicFormFormViewModel}
			 */
			self.templateViewModel = new DynamicFormFormViewModel();
			//Идентификатор вьюхи.
			self.templateId = 'Nvx.ReDoc.Workflow.DynamicForm/Web/View/DynamicFormForm.html';
		};

		//Наследуемся.
		inherit(DynamicFormFormModule, FileComponentModule);

		DynamicFormFormModule.prototype.action = function (data, event) {
			var self = this;
			var deferred = $.Deferred();

			/** Идентификатор дела. */
			var fileId = self.fileViewModel.fileInfoViewModel.fileId;
			/** Идентифкатор компонента.
			 * @type {String}
			 */
			var componentId = data.componentId;

			//Дополняем вью-модель.
			self.templateViewModel.fileId = fileId;
			self.templateViewModel.componentId(componentId);
			/** Идентификатор плашки компонента.
			 * @type {String}
			 */
			self.templateViewModel.paveId = data.id;
			/**
			 * Заголовок плашки в левой части дела.
			 * @type {ko.observable<String>}
			 */
			self.templateViewModel.paveTitle = data.title;

			var model = {
				fileId: fileId,
				componentId: componentId
			};
			//Запрашиваем модель данных для представления данных динамической формы в правой части дела.
			$.ajax({ url: '/DynamicForm/MainForm', data: model, method: 'POST', headers: { proxy: true } })
				.done(function (response) {
					//Заполняем вью-модель данными.
					self.templateViewModel.applyData(response);
					//Если форма не валидна, то выбрасываем сообщение.
					if (self.templateViewModel.notValid) {
						modalWindowsFunction.errorModalWindow("Неверно заполнены поля формы.");
						deferred.reject();
					} else {
						//Запускаем логику формы!!!
						self.templateViewModel.start();

						deferred.resolve();
					}
				}).fail(function () {
					deferred.reject();
				});

			return deferred.promise();
		};

		return new DynamicFormFormModule();
	});
define('Nvx.ReDoc.DynamicFormsFiasControl/Web/Content/Scripts/control/Region',
	[
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
		'Nvx.ReDoc.DynamicFormsFiasControl/Web/Content/Scripts/SelectControlViewModel'
	],
	function (inherit, SelectControlViewModel) {
		var Region = function () {
			var self = this;

			//Вызываем конструктор родителя.
			Region.superclass.constructor.apply(self, arguments);

			self.Caption = 'Регион';
			self.Tooltip = 'Здесь нужно выбрать регион.';
		}
		//Наследуемся.
		inherit(Region, SelectControlViewModel);

		return Region;
	});
define('Nvx.ReDoc.DynamicFormsFiasControl/Web/Content/Scripts/FiasViewModels/FiasAutocompleteFieldViewModel',
	[
		'knockout',
		'jquery',
		'Nvx.ReDoc.DynamicFormsFiasControl/Web/Content/Scripts/FiasViewModels/Validators',		
		'knockout-jqueryui/autocomplete'
	],
	function (ko, $, validatorsFactory) {

		/**
		 * 
		 * options = {searchUrl, initRecordUrl, caption, visible, required};
		 * fiasInitiated - ko.observable, общее для все внутренних элементов
		 */
		var FiasAutocompleteFieldViewModel = function (options, fiasInitiated) {
			var self = this;

			self.caption = options.caption;
			self.visible = options.visible;
			self.required = options.required;
			self.isMandatory = options.required;
			/**
			* Код конкретного поля ФИАС-контрола.
			*/
			self.code = options.code;

			//данные валидации
			self.notValidError = ko.observable(null);
			self.notValid = ko.observable(false);

			//валидатор на обязательность
			if (self.required) {
				self.validator = validatorsFactory.getRequiredValidator();
			} else {
				self.validator = validatorsFactory.getComplexValidator({});
			}


			self.fiasInitiated = fiasInitiated;
			self.diasableAutocomplete = ko.computed(function () {
				return !self.fiasInitiated();
			});

			//url для отправки запроса посика по тексту
			self.url = options.searchUrl;
			//url для отправки запроса выборки записи по aoGuid
			self.initUrl = options.initRecordUrl;
			//guid родительского объекта Фиас
			self.parentAoGuid = ko.observable(null);
			self.parentAoGuid.subscribe(function (value) {
				var selAo = self.selectedAo();
				if ((!selAo || selAo.parentGuid !== value) && self.initRequest == null) {
					self.clear();
					self.stopInit();
				}
			});
			//введённое текстовое значение
			self.text = ko.observable(null);

			self.text.subscribe(function(newValue) {
				if (self.text() !== self.selectedText()) {
					self.selectedAo(null);
					self.selectedText(null);
					self.stopInit();
				}
			});

			//текст который был при выборе значения из списка
			self.selectedText = ko.observable();
			//запись из бд Фиас
			self.selectedAo = ko.observable(null);

			self.selectedAo.subscribe(function(newValue) {
				var selAo = self.selectedAo();

				self.name(selAo ? "{0} ({1})".format(selAo.formalName, selAo.shortName) : null);
				self.shortName(selAo ? selAo.shortName : null);
				self.formalName(selAo ? selAo.formalName : null);
				self.regionCode(selAo ? selAo.regionCode || null : null);
				self.selectedAoGuid(selAo ? selAo.aoGuid : null);

				self.aoid(selAo ? selAo.aoid : null);
				self.okato(selAo ? selAo.okato : null);
				self.oktmo(selAo ? selAo.oktmo : null);
				self.kladrCode(selAo ? selAo.code : null);

				self.areaCode(selAo ? selAo.areaCode : null);
				self.cityCode(selAo ? selAo.cityCode : null);
				self.ctarCode(selAo ? selAo.ctarCode : null);
				self.placeCode(selAo ? selAo.placeCode : null);
				self.streetCode(selAo ? selAo.streetCode : null);
				self.extrCode(selAo ? selAo.extrCode : null);
				self.sextCode(selAo ? selAo.sextCode : null);
				self.autoCode(selAo ? selAo.autoCode : null);
			});

			//Id из бд Фиас
			self.selectedAoGuid = ko.observable(null);
			//ko.computed(function () {
			//	var selAo = self.selectedAo();
			//	return selAo ? selAo.aoGuid : null;
			//});
			/**
			  * название
			 */
			self.name = ko.observable(null);
			//	ko.computed(function () {
			//	var selAo = self.selectedAo();
			//	return selAo ? "{0} ({1})".format(selAo.formalName, selAo.shortName) : null;
			//});
			/**
			 * короткое название
			 */
			self.shortName = ko.observable(null);
			//	= ko.computed(function () {
			//	var selAo = self.selectedAo();
			//	return selAo ? selAo.shortName : null;
			//});
			/**
			* формальное название
			*/
			self.formalName = ko.observable(null);
				//= ko.computed(function () {
			//	var selAo = self.selectedAo();
			//	return selAo ? selAo.formalName : null;
			//});

			//
			self.regionCode = ko.observable(null);

			self.aoid = ko.observable(null);
			self.okato = ko.observable(null);
			self.oktmo = ko.observable(null);
			self.kladrCode = ko.observable(null);

			self.areaCode = ko.observable(null);
			self.cityCode = ko.observable(null);
			self.ctarCode = ko.observable(null);
			self.placeCode = ko.observable(null);
			self.streetCode = ko.observable(null);
			self.extrCode = ko.observable(null);
			self.sextCode = ko.observable(null);
			self.autoCode = ko.observable(null);

			//работает ли контрол выбора
			//self.canSelect = ko.computed(function () {
			//	return self.selectedAoGuid () != null;
			//});

			self.canSelect = ko.observable(false);

			self.autoCompleteOpt = {
				source: function (request, response) {
					var text = request.term;
					$.ajax({
						async: true,
						type: "POST",
						url: self.url,
						dataType: "json",
						data: {
							searchText: text, //search term
							parentAoGuid: self.parentAoGuid(),
						},
						headers: {
							proxy: true
						},
						timeout: 50000,
						success: function (data) {
							//преобразую из рузультата для select2 в результат для autocomplete
							var result = $.map(data, function (item) {
								return {
									label: item.text,
									//если задать value то при выборе из списка в input будет записано имено оно
									//value: item.formalName,
									id: item.id,
									attr: item.attr,
									data: item
								};
							});
							response(result);
						}
					});
				},
				// при выборе значения обновляем selectedAo
				select: function (event, ui) {
					self.selectedAo(ui.item.data);
					self.selectedText(ui.item.label);
					//TODO Надо чтобы само обновлялось
					self.text(ui.item.label);

					self.stopInit();
				},
				//Если текстовое значение изменилось после выбора значение из списка и мы ушли с поля то надо сбросить selectedAo
				change: function (event, ui) {
					if (self.text() !== self.selectedText()) {
						self.selectedAo(null);
						self.selectedText(null);
						self.stopInit();
					}
				},
				//Если модуль фиас выключен то отключаем автозаполнение
				disable: self.diasableAutocomplete
			};

			self.clear = function () {
				self.text(null);
				self.selectedAo(null);
				self.selectedText(null);
			};

			/**
			 * останавливает инициализацию
			 */
			self.stopInit = function () {
				if (self.initRequest) {
					self.initRequest.abort();
					self.initRequest = null;
				}
			};

			//запрос для инциализации данных
			self.initRequest = null;
			//инициализируем контрол по ид записи
			self.loadAoRecord = function (aoGuid) {
				if (!aoGuid) {
					return null;
				}

				self.initRequest = $.ajax({
					url: self.initUrl,
					async: true,
					type: "POST",
					dataType: "json",
					data: { aoGuid: aoGuid },
					timeout: 50000,
					error: function (event, xhr) {
						if (xhr.statusText !== 'abort')
							console.error('не удалось получить запись фиас. url: ' + self.initUrl + '; aoguid: ' + aoGuid);
					},
					success: function (data) {
						if (data.hasError) {
							console.error('не удалось получить запись фиас. url: ' + self.initUrl + '; aoguid: ' + aoGuid + 'ошибка: ' + data.error);
						} else {
							if (data && data.result != null) {
								var selAo = data.result;
								self.selectedAo(data.result);
								self.selectedText(selAo ? "{0} ({1})".format(selAo.formalName, selAo.shortName) : null);
								self.text(selAo ? "{0} ({1})".format(selAo.formalName, selAo.shortName) : null);
								self.parentAoGuid(data.result.parentGuid);
							} else {
								console.error('не удалось получить запись фиас. url: ' + self.initUrl + '; aoguid: ' + aoGuid + 'ответ: ' + data);
							}
						}
						self.initRequest = null;
					}
				});
				return self.initRequest;
			};
		};

		return FiasAutocompleteFieldViewModel;
	});
define('Nvx.ReDoc.DynamicFormsFiasControl/Web/Content/Scripts/FiasViewModels/FiasInitMediator',
	[
		'knockout',
		'jquery',
	],
	function (ko, $) {

		var FiasInitMediator = function() {
			var self = this;
			self.requests = [];
			self.initEndCallback = function () {

			};

			self.add = function (ajaxRequest) {
				if (ajaxRequest)
					self.requests.push(ajaxRequest);
			};

			self.startWait = function () {
				self.pending = true;
				$.when.apply($, self.requests)
					.always(function() {
						self.initEndCallback();
						self.pending = false;
					});
			};
			self.dispose = function() {
				self.initEndCallback = function () {
				};
				self.pending = false;
				$.each(self.requests, function(i, item) {
					item.abort();
				});
			};

			self.pending = false;
			self.isPending = function() {
				return self.pending;
			};
		};

		return FiasInitMediator;
	});
define('Nvx.ReDoc.DynamicFormsFiasControl/Web/Content/Scripts/FiasViewModels/FiasTextFieldViewModel',
	[
		'knockout',
		'jquery',
		'Nvx.ReDoc.DynamicFormsFiasControl/Web/Content/Scripts/FiasViewModels/Validators',		
		'knockout-jqueryui/autocomplete'
	],
	function (ko, $, validators) {

		var FiasTextFieldViewModel = function (options) {
			var self = this;

			self.caption = options.caption;
			self.visible = options.visible;
			self.required = options.required;
			self.isMandatory = options.required;
			/**
			* Код конкретного поля ФИАС-контрола.
			*/
			self.code = options.code;

			//текстовое значение
			self.text = ko.observable();

			//данные валидации
			self.notValidError = ko.observable(null);
			self.notValid = ko.observable(false);

			//валидатор на обязательность, для индекса валидатор будет переопределён
			if (self.required) {
				self.validator = validators.getRequiredValidator();
			} else {
				self.validator = validators.getComplexValidator({});
			}
		};

		return FiasTextFieldViewModel;
	});
define('Nvx.ReDoc.DynamicFormsFiasControl/Web/Content/Scripts/FiasViewModels/RegisterFiasViewModel',
	[
		'knockout',
		'jquery',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/ModalDialog',
		 'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/_CommonTemplate/redocPlugin',
		 'Nvx.ReDoc.DynamicFormsFiasControl/Web/Content/Scripts/FiasViewModels/Validators',
		 'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/utils',
		 'Nvx.ReDoc.DynamicFormsFiasControl/Web/Content/Scripts/FiasViewModels/FiasAutocompleteFieldViewModel',
		 'Nvx.ReDoc.DynamicFormsFiasControl/Web/Content/Scripts/FiasViewModels/FiasTextFieldViewModel',
		 'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/preferences',
		 'Nvx.ReDoc.DynamicFormsFiasControl/Web/Content/Scripts/FiasViewModels/FiasInitMediator',
		'knockout-jqueryui/autocomplete'
	],
	function (ko, $, ModalDialog, redocPlugin, validators, utils, FiasAutocompleteFieldViewModel, FiasTextFieldViewModel, preferences, FiasInitMediator) {

		//#region данные для моделей и функции получения фанных

		var region = '/Nvx.ReDoc.DynamicFormsFiasControl.Web.FiasController/RegionSearch';
		var state = '/Nvx.ReDoc.DynamicFormsFiasControl.Web.FiasController/StateSearch';
		var city = '/Nvx.ReDoc.DynamicFormsFiasControl.Web.FiasController/CitySearch';
		var cityDistrict = '/Nvx.ReDoc.DynamicFormsFiasControl.Web.FiasController/CityDistrictSearch';
		var street = '/Nvx.ReDoc.DynamicFormsFiasControl.Web.FiasController/StreetSearch';
		var additionalTerritory = '/Nvx.ReDoc.DynamicFormsFiasControl.Web.FiasController/AdditionalTerritorySearch';
		var streetOnAdditionalTerritory = '/Nvx.ReDoc.DynamicFormsFiasControl.Web.FiasController/StreetOnAdditionalTerritorySearch';

		var regionByAoguid = '/Nvx.ReDoc.DynamicFormsFiasControl.Web.FiasController/RegionByAoguid';
		var stateByAoguid = '/Nvx.ReDoc.DynamicFormsFiasControl.Web.FiasController/StateByAoguid';
		var cityByAoguid = '/Nvx.ReDoc.DynamicFormsFiasControl.Web.FiasController/CityByAoguid';
		var cityDistrictByAoguid = '/Nvx.ReDoc.DynamicFormsFiasControl.Web.FiasController/CityDistrictByAoguid';
		var streetByAoguid = '/Nvx.ReDoc.DynamicFormsFiasControl.Web.FiasController/StreetByAoguid';
		var additionalTerritoryByAoguid = '/Nvx.ReDoc.DynamicFormsFiasControl.Web.FiasController/AdditionalTerritoryByAoguid';
		var streetOnAdditionalTerritoryByAoguid = '/Nvx.ReDoc.DynamicFormsFiasControl.Web.FiasController/StreetOnAdditionalTerritoryByAoguid';

		var regionCode = 'R';
		var stateCode = 'D';
		var cityCode = 'T';
		var microDistrictCode = 'M';
		var streetCode = 'S';
		var addTerCode = 'A';
		var strAddTerCode = 'Q';
		var houseCode = 'H';
		var corpusCode = 'C';
		var buildingCode = 'B';
		var flatCode = 'F';
		var dwellingCode = 'W';
		var indexCode = 'P';

		var searchUrlsDict = {};

		searchUrlsDict[regionCode] = region;
		searchUrlsDict[stateCode] = state;
		searchUrlsDict[cityCode] = city;
		searchUrlsDict[microDistrictCode] = cityDistrict;
		searchUrlsDict[streetCode] = street;
		searchUrlsDict[addTerCode] = additionalTerritory;
		searchUrlsDict[strAddTerCode] = streetOnAdditionalTerritory;

		var initUrlsDict = {};

		initUrlsDict[regionCode] = regionByAoguid;
		initUrlsDict[stateCode] = stateByAoguid;
		initUrlsDict[cityCode] = cityByAoguid;
		initUrlsDict[microDistrictCode] = cityDistrictByAoguid;
		initUrlsDict[streetCode] = streetByAoguid;
		initUrlsDict[addTerCode] = additionalTerritoryByAoguid;
		initUrlsDict[strAddTerCode] = streetOnAdditionalTerritoryByAoguid;

		var captionsDict = {};

		captionsDict[regionCode] = 'Регион или область';
		captionsDict[stateCode] = 'Район';
		captionsDict[cityCode] = 'Город (Населенный пункт)';
		captionsDict[microDistrictCode] = 'Район города';
		captionsDict[streetCode] = 'Улица';
		captionsDict[addTerCode] = 'Доп. территория';
		captionsDict[strAddTerCode] = 'Улица на доп. территории';
		captionsDict[houseCode] = 'Дом';
		captionsDict[corpusCode] = 'Корпус';
		captionsDict[buildingCode] = 'Строение';
		captionsDict[flatCode] = 'Квартира';
		captionsDict[dwellingCode] = 'Жилое помещение';
		captionsDict[indexCode] = 'Почтовый индекс';

		var getVisibility = function (mask, maskPart) {
			if (mask) {
				if (!maskPart) {
					console.warn('требуется указать параметр maskPart');
					return true;
				}
				return mask.indexOf(maskPart) > -1;
			} else
				return true;
		};

		var getRequired = function (mask, maskPart) {
			if (mask) {
				if (!maskPart) {
					console.warn('требуется указать параметр maskPart');
					return false;
				}
				return mask.indexOf(maskPart) > -1;
			} else
				return false;
		};

		/**
		* по коду составляющего фиас контрола возвращает опции для инициалзации модели 
		* options = {searchUrl, initRecordUrl, caption, visible, required};
		*/
		var getOptions = function (visibilityMask, requiredMask, code) {
			var visible;
			//#region Добавил логики, согласно описанию (https://cnf.egspace.ru/pages/viewpage.action?pageId=35915145).
			if (!visibilityMask) {
				visible = true;
			}
			else {
				//Инвертировать ли логику отображения.
				var invert = null;
				if (visibilityMask.substring(0, 1) === '-') invert = true;
				if (visibilityMask.substring(0, 1) === '+') invert = false;
				if (invert === null) throw new Error('Неверно указана маска видимости ФИАС контрола.');
				//Получаем значение видимости контрола.
				visible = getVisibility(visibilityMask, code);
				//Инвертируем его, если есть необходимость.
				visible = invert === true ? !visible : visible;
			}
			//#endregion

			return {
				searchUrl: searchUrlsDict[code],
				initRecordUrl: initUrlsDict[code],
				caption: captionsDict[code],
				visible: visible,
				required: getRequired(requiredMask, code),
				/**
				 * Код конкретного поля ФИАС-контрола.
				 */
				code: code
			};
		};

		//#endregion 

		var fiasInitiatedUrl = '/Nvx.ReDoc.DynamicFormsFiasControl.Web.FiasController/IsInitiated';

		var RegisterFiasViewModel = function (fieldDef, dontInitValidationOnDefault) {
			//dontInitValidationOnDefault === false для динамических форм
			//var registerFias = function (visibilityMask, requiredMask, entity) {
			var self = this;

			self.dontInitValidationOnDefault = dontInitValidationOnDefault;

			self.fieldDef = fieldDef;
			self.fiasSelectionDate = ko.observable();
			self.visibilityMask = fieldDef.visibilityMask;
			self.requiredMask = fieldDef.requiredMask;
			self.fiasInitiated = ko.observable(false);
			self.fiasInitEnable = ko.observable(false);
			self.validationEnabled = ko.observable(true);

			/**
				* по коду составляющего фиас контрола возвращает опции для инициалзации модели 
				* options = {searchUrl, initRecordUrl, caption, visible, required};
			*/
			var getOptionInternal = function (code) {
				return getOptions(self.visibilityMask, self.requiredMask, code);
			};

			//вью-модели отдельных составляющих
			//модели с выбором (selectFiasModels)
			self.regionViewModel = new FiasAutocompleteFieldViewModel(getOptionInternal(regionCode), self.fiasInitiated);
			self.stateViewModel = new FiasAutocompleteFieldViewModel(getOptionInternal(stateCode), self.fiasInitiated);
			self.cityViewModel = new FiasAutocompleteFieldViewModel(getOptionInternal(cityCode), self.fiasInitiated);
			self.cityDistrictViewModel = new FiasAutocompleteFieldViewModel(getOptionInternal(microDistrictCode), self.fiasInitiated);
			self.streetViewModel = new FiasAutocompleteFieldViewModel(getOptionInternal(streetCode), self.fiasInitiated);
			self.additionalTerritoryViewModel = new FiasAutocompleteFieldViewModel(getOptionInternal(addTerCode), self.fiasInitiated);
			self.streetOnAdditionalTerritoryViewModel = new FiasAutocompleteFieldViewModel(getOptionInternal(strAddTerCode), self.fiasInitiated);

			//модели с текстовым полем (simpleFiasModels)
			self.postalIndexViewModel = new FiasTextFieldViewModel(getOptionInternal(indexCode));
			//валидатор для индекса
			var indexValidators = [];
			if (getRequired(self.requiredMask, indexCode))
				indexValidators.push(validators.getRequiredValidator());
			indexValidators.push(validators.getRegexValidator(/^\d{6}$|^$/, 'Индекс должен быть строкой из 6 цифр'));

			self.postalIndexViewModel.validator = validators.getComplexValidatorForValidators(indexValidators);

			self.houseViewModel = new FiasTextFieldViewModel(getOptionInternal(houseCode));
			self.corpusViewModel = new FiasTextFieldViewModel(getOptionInternal(corpusCode));
			self.buildingViewModel = new FiasTextFieldViewModel(getOptionInternal(buildingCode));
			self.flatViewModel = new FiasTextFieldViewModel(getOptionInternal(flatCode));
			self.dwellingViewModel = new FiasTextFieldViewModel(getOptionInternal(dwellingCode));

			/**
			 * модели которые используют автозаполнение из справочника фиас
			 */
			self.selectFiasModels = [
				self.regionViewModel,
				self.stateViewModel,
				self.cityViewModel,
				self.cityDistrictViewModel,
				self.streetViewModel,
				self.additionalTerritoryViewModel,
				self.streetOnAdditionalTerritoryViewModel
			];

			/**
			* модели которые заполняются текстом
			*/
			self.simpleFiasModels = [
				self.postalIndexViewModel,
				self.houseViewModel,
				self.corpusViewModel,
				self.buildingViewModel,
				self.flatViewModel,
				self.dwellingViewModel
			];

			self.simpleFiasModelsWithoutIndex = [
				//self.postalIndexViewModel,
				self.houseViewModel,
				self.corpusViewModel,
				self.buildingViewModel,
				self.flatViewModel,
				self.dwellingViewModel
			];

			self.models = self.selectFiasModels.concat(self.simpleFiasModels);

			// функция для получения результата (наш результат)
			self.getValue = function () {
				var result = {
					id: self.entityId,
					//регион
					regionAoGuid: self.regionViewModel.selectedAoGuid(),
					regionCode: self.regionViewModel.regionCode(),
					regionName: self.regionViewModel.text(),
					regionShortName: self.regionViewModel.shortName(),
					regionFormalName: self.regionViewModel.formalName(),
					regionAoId: self.regionViewModel.aoid(),
					regionOkato: self.regionViewModel.okato(),
					regionOktmo: self.regionViewModel.oktmo(),
					regionKladrCode: self.regionViewModel.kladrCode(),
					regionAutoCode: self.regionViewModel.autoCode(),

					//Район
					stateAoGuid: self.stateViewModel.selectedAoGuid(),
					stateName: self.stateViewModel.text(),
					stateShortName: self.stateViewModel.shortName(),
					stateFormalName: self.stateViewModel.formalName(),
					stateAoId: self.stateViewModel.aoid(),
					stateOkato: self.stateViewModel.okato(),
					stateOktmo: self.stateViewModel.oktmo(),
					stateKladrCode: self.stateViewModel.kladrCode(),
					stateAreaCode: self.stateViewModel.areaCode(),

					//Город (Населенный пункт)
					cityAoGuid: self.cityViewModel.selectedAoGuid(),
					cityName: self.cityViewModel.text(),
					cityShortName: self.cityViewModel.shortName(),
					cityFormalName: self.cityViewModel.formalName(),
					cityAoId: self.cityViewModel.aoid(),
					cityOkato: self.cityViewModel.okato(),
					cityOktmo: self.cityViewModel.oktmo(),
					cityKladrCode: self.cityViewModel.kladrCode(),
					cityCityCode: self.cityViewModel.cityCode(),
					cityPlaceCode: self.cityViewModel.placeCode(),

					//Район города
					cityDistrictAoGuid: self.cityDistrictViewModel.selectedAoGuid(),
					cityDistrictName: self.cityDistrictViewModel.text(),
					cityDistrictShortName: self.cityDistrictViewModel.shortName(),
					cityDistrictFormalName: self.cityDistrictViewModel.formalName(),
					cityDistrictAoId: self.cityDistrictViewModel.aoid(),
					cityDistrictOkato: self.cityDistrictViewModel.okato(),
					cityDistrictOktmo: self.cityDistrictViewModel.oktmo(),
					cityDistrictKladrCode: self.cityDistrictViewModel.kladrCode(),
					cityDistrictCtarCode: self.cityDistrictViewModel.ctarCode(),

					//Улица
					streetAoGuid: self.streetViewModel.selectedAoGuid(),
					streetName: self.streetViewModel.text(),
					streetShortName: self.streetViewModel.shortName(),
					streetFormalName: self.streetViewModel.formalName(),
					streetKladrCode: self.streetViewModel.kladrCode(),
					streetStreetCode: self.streetViewModel.streetCode(),

					//Доп. территория
					additionalTerritoryAoGuid: self.additionalTerritoryViewModel.selectedAoGuid(),
					additionalTerritoryName: self.additionalTerritoryViewModel.text(),
					additionalTerritoryShortName: self.additionalTerritoryViewModel.shortName(),
					additionalTerritoryFormalName: self.additionalTerritoryViewModel.formalName(),
					additionalTerritoryExtrCode: self.additionalTerritoryViewModel.extrCode(),

					//Улица на доп. территории
					streetOnAdditionalTerritoryAoGuid: self.streetOnAdditionalTerritoryViewModel.selectedAoGuid(),
					streetOnAdditionalTerritoryName: self.streetOnAdditionalTerritoryViewModel.text(),
					streetOnAdditionalTerritoryShortName: self.streetOnAdditionalTerritoryViewModel.shortName(),
					streetOnAdditionalTerritoryFormalName: self.streetOnAdditionalTerritoryViewModel.formalName(),
					streetOnAdditionalTerritorySextCode: self.streetOnAdditionalTerritoryViewModel.sextCode(),

					//Дом
					house: self.houseViewModel.text(),

					//Корпус
					corpuse: self.corpusViewModel.text(),

					//Строение
					building: self.buildingViewModel.text(),

					//Квартира
					flat: self.flatViewModel.text(),

					//Жилое помещение
					dwelling: self.dwellingViewModel.text(),

					//Почтовый индекс
					postalIndex: self.postalIndexViewModel.text(),

					fullAddress: ''
				};
				self.setFullAddress(result);
				return result;
			};

			self.setFullAddress = function (data) {
				var result = '';
				if (!utils.isEmptyVal(data.postalIndex)) {
					result += data.postalIndex; result += ", ";
				}
				if (!utils.isEmptyVal(data.regionName)) {
					result += data.regionName; result += ", ";
				}
				if (!utils.isEmptyVal(data.stateName)) {
					result += data.stateName; result += ", ";
				}
				if (!utils.isEmptyVal(data.cityName)) {
					result += data.cityName;
				}
				if (!utils.isEmptyVal(data.streetName)) {
					result += ", "; result += data.streetName;
				}
				if (!utils.isEmptyVal(data.house)) {
					result += ", дом "; result += data.house;
				}
				if (!utils.isEmptyVal(data.corpuse)) {
					result += ", корпус "; result += data.corpuse;
				}

				if (!utils.isEmptyVal(data.flat)) {
					result += ", кв./офис "; result += data.flat;
				}

				data.fullAddress = result;
			};

			self.initValidation = function () {
				if (dontInitValidationOnDefault !== true || self.fiasInitEnable() === false) {
					var models = self.models;
					self.fiasInitEnable(true);
					for (var i = 0; i < models.length; i++) {
						var model = models[i];
						model.text.subscribe(self.validateField.bind(self, model));
					}
				}
			};

			//инициализация
			self.init = function () {
				//проверяем доступность модуля фиас и инициализацию базы фиас
				self.checkFiasState();
				if (dontInitValidationOnDefault !== true) {
					self.initValidation();
				}
				self.initChildViewModelSubscriptions();
				self.initSubscriptions();
			};

			//проверяем доступность модуля фиас и инициализацию базы фиас
			self.checkFiasState = function () {
				var checkFiasInit = function () {
					$.getJSON(fiasInitiatedUrl).done(function (response) {
						if (!response) {
							console.warn('База данных Фиас не инициализирована');
						}
						self.changeFiasInitiatedInVm(response);
					}).fail(function () {
						self.changeFiasInitiatedInVm(false);
					});
				};

				var pluginFunc = function (plugin) {
					var fiasEnabled = plugin['Nvx.ReDoc.DynamicFormsFiasControl'] === true;
					if (fiasEnabled) {
						if (preferences.log === true) {
							console.log('модуль Фиас включён');
						}
						//если фиас включён то проверим что база инициализирована, если выключен то во вью моделях уже отключено автозаполнении
						checkFiasInit();
					} else {
						if (preferences.log === true) {
							console.log('модуль Фиас отключён');
						}
						self.changeFiasInitiatedInVm(false);
					}
				};

				if (redocPlugin.plugin) {
					pluginFunc(redocPlugin.plugin);
				} else {
					redocPlugin.pluginInfo().done(pluginFunc).fail(function (parameters) {
						self.changeFiasInitiatedInVm(false);
					});
				}
			};

			self.changeFiasInitiatedInVm = function (fiasInitiated) {
				self.fiasInitiated(fiasInitiated);
			};

			self.childViewModelSubscriptions = [];

			self.disposeChildViewModelSubscriptions = function () {
				//unsubscribe
				for (var i = 0; i < self.childViewModelSubscriptions.length; i++) {
					self.childViewModelSubscriptions[i].dispose();
				}
				self.childViewModelSubscriptions = [];
			};

			//инициализация данными из сущности
			self.setValue = function (rootEntity, readonlyKey) {
				self.disposeChildViewModelSubscriptions();
				self.disposeValueUpdateSubscriptions();
				if (!rootEntity) {
					if (self.initMediator && !self.initMediator.isPending()) {
						self.initChildViewModelSubscriptions();
						self.initSubscriptions();
					}
					return;
				}

				var entity = utils.getProperty(rootEntity, fieldDef.field);
				var notEqual = JSON.stringify(entity) !== JSON.stringify(self.value());
				if (entity && notEqual) {
					self.value(entity);
					
					if (self.initMediator)
						self.initMediator.dispose();

					self.initMediator = new FiasInitMediator();

					self.entityId = entity.id;
					//устанавливаем текстовые значения полей
					self.regionViewModel.text(entity.regionName);
					self.stateViewModel.text(entity.stateName);
					self.cityViewModel.text(entity.cityName);
					self.cityDistrictViewModel.text(entity.cityDistrictName);
					self.streetViewModel.text(entity.streetName);
					self.additionalTerritoryViewModel.text(entity.additionalTerritoryName);
					self.streetOnAdditionalTerritoryViewModel.text(entity.streetOnAdditionalTerritoryName);
					self.postalIndexViewModel.text(entity.postalIndex);
					self.houseViewModel.text(entity.house);
					self.corpusViewModel.text(entity.corpuse);
					self.buildingViewModel.text(entity.building);
					self.flatViewModel.text(entity.flat);
					self.dwellingViewModel.text(entity.dwelling);

					if (readonlyKey !== 'readonly') {
						// подгрузка данных записей по aoguid записи
						self.initMediator.add(self.regionViewModel.loadAoRecord(entity.regionAoGuid));
						self.initMediator.add(self.stateViewModel.loadAoRecord(entity.stateAoGuid));
						self.initMediator.add(self.cityViewModel.loadAoRecord(entity.cityAoGuid));
						self.initMediator.add(self.cityDistrictViewModel.loadAoRecord(entity.cityDistrictAoGuid));
						self.initMediator.add(self.streetViewModel.loadAoRecord(entity.streetAoGuid));
						self.initMediator.add(self.additionalTerritoryViewModel.loadAoRecord(entity.additionalTerritoryAoGuid));
						self.initMediator.add(self.streetOnAdditionalTerritoryViewModel.loadAoRecord(entity.streetOnAdditionalTerritoryAoGuid));

						self.initMediator.initEndCallback = function() {
							self.initChildViewModelSubscriptions();
							self.initSubscriptions();
						};

						self.initMediator.startWait();
					}
				} else {
					if (self.initMediator && self.initMediator.isPending()) {
						// ничего не делаем
					} else {
						self.initChildViewModelSubscriptions();
						self.initSubscriptions();
					}
				}
			};

			self.updateValue = function (entity, suppessNotification) {
				var equal = JSON.stringify(entity) === JSON.stringify(self.value());
				if (equal)
					return;

				if (suppessNotification) {
					self.disposeChildViewModelSubscriptions();
					self.disposeValueUpdateSubscriptions();
				}

				//Устанавливаем GUID.
				self.regionViewModel.selectedAoGuid(entity.regionAoGuid);
				self.stateViewModel.selectedAoGuid(entity.stateAoGuid);
				self.cityViewModel.selectedAoGuid(entity.cityAoGuid);
				self.cityDistrictViewModel.selectedAoGuid(entity.cityDistrictAoGuid);
				self.streetViewModel.selectedAoGuid(entity.streetAoGuid);
				self.additionalTerritoryViewModel.selectedAoGuid(entity.additionalTerritoryAoGuid);
				self.streetOnAdditionalTerritoryViewModel.selectedAoGuid(entity.streetOnAdditionalTerritoryAoGuid);
				
				//устанавливаем скрытые значения
				self.regionViewModel.aoid(entity.regionAoId);
				self.regionViewModel.okato(entity.regionOkato);
				self.regionViewModel.oktmo(entity.regionOktmo);
				self.regionViewModel.kladrCode(entity.regionKladrCode);
				self.stateViewModel.aoid(entity.stateAoId);
				self.stateViewModel.okato(entity.stateOkato);
				self.stateViewModel.oktmo(entity.stateOktmo);
				self.stateViewModel.kladrCode(entity.stateKladrCode);
				self.cityViewModel.aoid(entity.cityAoId);
				self.cityViewModel.okato(entity.cityOkato);
				self.cityViewModel.oktmo(entity.cityOktmo);
				self.cityViewModel.kladrCode(entity.cityKladrCode);
				self.cityDistrictViewModel.aoid(entity.cityAoId);
				self.cityDistrictViewModel.okato(entity.cityOkato);
				self.cityDistrictViewModel.oktmo(entity.cityOktmo);
				self.cityDistrictViewModel.kladrCode(entity.cityKladrCode);
				self.streetViewModel.kladrCode(entity.streetKladrCode);

				self.stateViewModel.areaCode(entity.stateAreaCode);
				self.cityViewModel.cityCode(entity.cityCityCode);
				self.cityViewModel.placeCode(entity.cityPlaceCode);
				self.cityDistrictViewModel.ctarCode(entity.cityDistrictCtarCode);
				self.streetViewModel.streetCode(entity.streetStreetCode);
				self.additionalTerritoryViewModel.extrCode(entity.additionalTerritoryExtrCode);
				self.streetOnAdditionalTerritoryViewModel.sextCode(entity.streetOnAdditionalTerritorySextCode);

				//устанавливаем текстовые значения полей
				self.regionViewModel.selectedText(entity.regionName);
				self.regionViewModel.text(entity.regionName);

				self.regionViewModel.regionCode(entity.regionCode);
				self.regionViewModel.name(entity.regionName);
				self.regionViewModel.shortName(entity.regionShortName);
				self.regionViewModel.formalName(entity.regionFormalName);

				self.stateViewModel.selectedText(entity.stateName);
				self.stateViewModel.text(entity.stateName);

				self.stateViewModel.name(entity.stateName);
				self.stateViewModel.shortName(entity.stateShortName);
				self.stateViewModel.formalName(entity.stateFormalName);

				self.cityViewModel.selectedText(entity.cityName);
				self.cityViewModel.text(entity.cityName);

				self.cityViewModel.name(entity.cityName);
				self.cityViewModel.shortName(entity.cityShortName);
				self.cityViewModel.formalName(entity.cityFormalName);

				self.cityDistrictViewModel.selectedText(entity.cityDistrictName);
				self.cityDistrictViewModel.text(entity.cityDistrictName);

				self.cityDistrictViewModel.name(entity.cityDistrictName);
				self.cityDistrictViewModel.shortName(entity.cityDistrictShortName);
				self.cityDistrictViewModel.formalName(entity.cityDistrictFormalName);

				self.streetViewModel.selectedText(entity.streetName);
				self.streetViewModel.text(entity.streetName);

				self.streetViewModel.name(entity.streetName);
				self.streetViewModel.shortName(entity.streetShortName);
				self.streetViewModel.formalName(entity.streetFormalName);

				self.additionalTerritoryViewModel.selectedText(entity.additionalTerritoryName);
				self.additionalTerritoryViewModel.text(entity.additionalTerritoryName);

				self.additionalTerritoryViewModel.name(entity.additionalTerritoryName);
				self.additionalTerritoryViewModel.shortName(entity.additionalTerritoryShortName);
				self.additionalTerritoryViewModel.formalName(entity.additionalTerritoryFormalName);

				self.streetOnAdditionalTerritoryViewModel.selectedText(entity.streetOnAdditionalTerritoryName);
				self.streetOnAdditionalTerritoryViewModel.text(entity.streetOnAdditionalTerritoryName);


				self.streetOnAdditionalTerritoryViewModel.name(entity.streetOnAdditionalTerritoryName);
				self.streetOnAdditionalTerritoryViewModel.shortName(entity.streetOnAdditionalTerritoryShortName);
				self.streetOnAdditionalTerritoryViewModel.formalName(entity.streetOnAdditionalTerritoryFormalName);


				self.postalIndexViewModel.text(entity.postalIndex);
				self.houseViewModel.text(entity.house);
				self.corpusViewModel.text(entity.corpuse);
				self.buildingViewModel.text(entity.building);
				self.flatViewModel.text(entity.flat);
				self.dwellingViewModel.text(entity.dwelling);

				if (suppessNotification) {
					self.initChildViewModelSubscriptions();
					self.initSubscriptions();
				}
			}

			self.clearValidationErrors = function() {
				var models = self.models;
				for (var i = 0; i < models.length; i++) {
					var model = models[i];
					model.notValid(false);
					model.notValidError(null);
				}
			};

			//валидация поля которому соответствует модель(model)
			self.validateField = function (model) {
				if (!self.validationEnabled())
					return true;

				var validator = model.validator;
				var value = model.text();
				var validRes = validator.isValid(value);
				model.notValid(!validRes.isValid);
				model.notValidError(validRes.errorMessage);
				return validRes.isValid;
			};

			self.isValid = function () {
				var models = self.models;
				var isValid = true;
				//валидируем все поля
				for (var i = 0; i < models.length; i++) {
					var model = models[i];
					var isFieldValid = self.validateField(model);
					if (!isFieldValid)
						isValid = false;
				}
				return isValid;
			};

			//Проставление родителей после инициализации непустой моделью
			self.reassignParents = function () {
				//Проставление родителей после инициализации непустой моделью
				for (var i = 0; i < self.selectFiasModels.length; i++) {
					if (self.selectFiasModels[i].selectedAoGuid() != null) {
						for (var inner = i + 1; inner < self.selectFiasModels.length; inner++) {
							if (self.selectFiasModels[inner].parentAoGuid() == null)
								self.selectFiasModels[inner].parentAoGuid(self.selectFiasModels[i].selectedAoGuid());
							if (self.selectFiasModels[inner].selectedAoGuid() != null)
								break;
						}
					}
				}
			};

			self.initChildViewModelSubscriptions = function () {

				if (self.childViewModelSubscriptions.length>0)
					return;

				//#region Подписываем модели более "низкого" уровня на изменения данных в моделях более "высокого" уровня

				//Проставление родителей после инициализации непустой моделью
				self.reassignParents();

				//регион выбран
				self.childViewModelSubscriptions.push(self.regionViewModel.selectedAoGuid.subscribe(function (value) {
					self.stateViewModel.parentAoGuid(value);
					self.cityViewModel.parentAoGuid(value);
					self.streetViewModel.parentAoGuid(value);
				}));

				//выбрали(отчистили) state
				self.childViewModelSubscriptions.push(self.stateViewModel.selectedAoGuid.subscribe(function (value) {
					if (self.stateViewModel.selectedAoGuid() == null) {
						self.cityViewModel.parentAoGuid(self.regionViewModel.selectedAoGuid());
						self.streetViewModel.parentAoGuid(self.regionViewModel.selectedAoGuid());
						self.additionalTerritoryViewModel.parentAoGuid(self.regionViewModel.selectedAoGuid());
					} else {
						self.cityViewModel.parentAoGuid(self.stateViewModel.selectedAoGuid());
						self.streetViewModel.parentAoGuid(self.stateViewModel.selectedAoGuid());
						self.additionalTerritoryViewModel.parentAoGuid(self.stateViewModel.selectedAoGuid());
					}
				}));

				//выбрали(отчистили) city
				self.childViewModelSubscriptions.push(self.cityViewModel.selectedAoGuid.subscribe(function (value) {
					// если null
					if (self.cityViewModel.selectedAoGuid() == null) {
						if (self.stateViewModel.selectedAoGuid() != null)
							self.streetViewModel.parentAoGuid(self.stateViewModel.selectedAoGuid());
						else
							self.streetViewModel.parentAoGuid(self.regionViewModel.selectedAoGuid());
						//мы подразумеваем, возможно и неверно, что районы города зависят только от города.
						self.cityDistrictViewModel.parentAoGuid(null);
					}
					else {
						self.cityDistrictViewModel.parentAoGuid(self.cityViewModel.selectedAoGuid());
						self.streetViewModel.parentAoGuid(self.cityViewModel.selectedAoGuid());
					}
				}));

				//cityDistrictViewModel
				self.childViewModelSubscriptions.push(self.cityDistrictViewModel.selectedAoGuid.subscribe(function (value) {
					if (self.cityDistrictViewModel.selectedAoGuid() == null) {
						self.streetViewModel.parentAoGuid(self.cityViewModel.selectedAoGuid());
					}
					else {
						self.streetViewModel.parentAoGuid(self.cityDistrictViewModel.selectedAoGuid());
					}
				}));

				//
				self.childViewModelSubscriptions.push(self.streetViewModel.selectedAoGuid.subscribe(function (value) {

				}));

				//
				self.childViewModelSubscriptions.push(self.additionalTerritoryViewModel.selectedAoGuid.subscribe(function (value) {

					self.streetOnAdditionalTerritoryViewModel.parentAoGuid(self.additionalTerritoryViewModel.selectedAoGuid());
				}));

				//
				self.childViewModelSubscriptions.push(self.streetOnAdditionalTerritoryViewModel.selectedAoGuid.subscribe(function (value) {

				}));

				//#endregion

			};

			self.value = ko.observable({});

			self.valueUpdateSubscriptions = [];
			self.disposeValueUpdateSubscriptions = function () {
				//unsubscribe
				for (var i = 0; i < self.valueUpdateSubscriptions.length; i++) {
					self.valueUpdateSubscriptions[i].dispose();
				}
				self.valueUpdateSubscriptions = [];
			};

			self.initSubscriptions = function () {
				if (self.valueUpdateSubscriptions.length>0)
					return;

				var valueChangedEventSources = [
					//регион
					self.regionViewModel.selectedAoGuid,
					self.regionViewModel.text,
					//Район
					self.stateViewModel.selectedAoGuid,
					self.stateViewModel.text,
					//Город (Населенный пункт)
					self.cityViewModel.selectedAoGuid,
					self.cityViewModel.text,
					//Район города
					self.cityDistrictViewModel.selectedAoGuid,
					self.cityDistrictViewModel.text,
					//Улица
					self.streetViewModel.selectedAoGuid,
					self.streetViewModel.text,
					//Доп. территория
					self.additionalTerritoryViewModel.selectedAoGuid,
					self.additionalTerritoryViewModel.text,
					//Улица на доп. территории
					self.streetOnAdditionalTerritoryViewModel.selectedAoGuid,
					self.streetOnAdditionalTerritoryViewModel.text,
					//Дом
					self.houseViewModel.text,
					//Корпус
					self.corpusViewModel.text,
					//Строение
					self.buildingViewModel.text,
					//Квартира
					self.flatViewModel.text,
					//Жилое помещение
					self.dwellingViewModel.text,
					//Почтовый индекс
					self.postalIndexViewModel.text
				];

				var valueChangedHandler = function() {
					var value = self.getValue();
					self.value(value);
				};

				for (var i = 0; i < valueChangedEventSources.length; i++) {
					var eventSource = valueChangedEventSources[i];
					self.valueUpdateSubscriptions.push(eventSource.subscribe(valueChangedHandler));
				}
			};

			self.bindToValue = function (valueAdapter) {
				valueAdapter.setField(fieldDef.field, self.value);
			};

			self.init();
		};

		/**
		 * Возвращает имя css-класса по коду поля ФИАС.
		 * @param {String} code - Код поля ФИАС.
		 * @returns {String} - Имя css-класса, соответствующего.
		 */
		RegisterFiasViewModel.prototype.cssClass = function (code) {
			var small = 'input-small';
			var tiny = 'input-tiny';
			var full = null;
			switch (code) {
				case regionCode:
					return full;
				case stateCode:
					return full;
				case cityCode:
					return full;
				case microDistrictCode:
					return full;
				case streetCode:
					return full;
				case addTerCode:
					return full;
				case strAddTerCode:
					return full;
				case houseCode:
					return tiny;
				case corpusCode:
					return tiny;
				case buildingCode:
					return tiny;
				case flatCode:
					return tiny;
				case dwellingCode:
					return small;
				case indexCode:
					return small;
				default:
					return '';
			}
		};

		return RegisterFiasViewModel;
	});
	define('Nvx.ReDoc.DynamicFormsFiasControl/Web/Content/Scripts/FiasViewModels/Validators',			
	[
		'knockout',
		'jquery',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/utils',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit'
	],
	 function (ko, $, utils, inherit) {

	 	//так выглядит результат возвращаемый валидаторами
	 	var validationResult = {
	 		isValid: false, //валидно ли поле
	 		errorMessage: null //сообщение об ошибке которое показывается в title поле
	 	};

	 	var getValidationResult = function (isValid, errorMessage) {
	 		return {
	 			isValid: isValid,
	 			errorMessage: errorMessage || null,
	 		};
	 	};


	 	var baseRule = function (validationType, errorMessage) {
	 		var self = this;
	 		self.validationType = validationType;
	 		self.errorMessage = errorMessage;
	 		//self.isValid = function (val) {
	 		//    var isValid = self.isValidInternal(val);
	 		//    return getValidationResult(isValid, (!isValid) ? self.errorMessage : null);
	 		//};
	 	}


	 	//ДАННАЯ ФУНКЦИЯ ДОЛЖНА ПЕРЕОПРЕДЕЛЯТЬСЯ В НАСЛЕДНИКАХ
	 	baseRule.prototype.isValidInternal = function (val) {
	 		throw new Error('ДАННАЯ ФУНКЦИЯ ДОЛЖНА ПЕРЕОПРЕДЕЛЯТЬСЯ В НАСЛЕДНИКАХ');
	 	}

	 	baseRule.prototype.isValid = function (val) {
	 		var self = this;
	 		var isValid = self.isValidInternal(val);
	 		return getValidationResult(isValid, (!isValid) ? self.errorMessage : null);
	 	};


	 	var requiredRule = function (validationType, errorMessage, validationParameters) {
	 		var self = this;
	 		requiredRule.superclass.constructor.apply(self, arguments);

	 		if (!errorMessage) {
	 			self.errorMessage = 'Поле обязательно для заполнения';
	 		}

	 		var allowEmptyStrings = validationParameters.allowEmptyStrings;
	 		self.required = true;
	 		self.isValidInternal = function (val) {
	 			var testVal;
	 			var required = self.required;
	 			if (val === undefined || val === null) {
	 				return !required;
	 			}

	 			testVal = val;
	 			if (typeof (val) === 'string') {
	 				if (allowEmptyStrings) {
	 					return true;
	 				}
	 				if (String.prototype.trim) {
	 					testVal = val.trim();
	 				} else {
	 					testVal = val.replace(/^\s+|\s+$/g, '');
	 				}
	 			}

	 			if (!required) { // if they passed: { required: false }, then don't require this
	 				return true;
	 			}

	 			return ((testVal + '').length > 0);
	 		};
	 	};

	 	var rangeRule = function (validationType, errorMessage, validationParameters) {
	 		var self = this;
	 		rangeRule.superclass.constructor.apply(self, arguments);

	 		var type = validationParameters.operandType;
	 		var minValue = validationParameters.minimum;
	 		var maxValue = validationParameters.maximum;

	 		self.isValidInternal = function (val) {
	 			if (utils.isEmptyVal(val)) {
	 				return true;
	 			}

	 			switch (type.toLowerCase()) {

	 				case "int":
	 				case "int?":
	 				case "int32":
	 				case "int32?":
	 				case "int64":
	 				case "int64?":
	 				case "float":
	 				case "float?":
	 				case "double":
	 				case "double?":
	 				case "decimal":
	 				case "decimal?":

	 				case "number":
	 				case "range":
	 					var lessThanMax = (!isNaN(val) && parseFloat(val) <= parseFloat(maxValue));
	 					var moreThanMin = (!isNaN(val) && parseFloat(val) >= parseFloat(minValue));
	 					return lessThanMax && moreThanMin;
	 					break;


	 				case "datetime":
	 				case "datetime?":
	 					var dateVal;
	 					if (typeof val == 'string') {
	 						dateVal = new Date(val);
	 					} else {
	 						dateVal = val;
	 					}
	 					var lessThanMax = (dateVal <= new Date(maxValue));
	 					var moreThanMin = (dateVal >= new Date(minValue));
	 					return lessThanMax && moreThanMin;
	 					break;

	 				default:
	 					var lessThanMax = (val <= maxValue);
	 					var moreThanMin = (val >= minValue);
	 					return lessThanMax && moreThanMin;
	 			}
	 		}
	 	};

	 	var regexRule = function (validationType, errorMessage, validationParameters) {
	 		var self = this;
	 		regexRule.superclass.constructor.apply(self, arguments);


	 		var pattern = validationParameters.pattern;

	 		self.isValidInternal = function (val) {
	 			return utils.isEmptyVal(val) || val.toString().match(pattern) !== null;
	 		}
	 	};

	 	var stringLengthRule = function (validationType, errorMessage, validationParameters) {
	 		var self = this;
	 		stringLengthRule.superclass.constructor.apply(self, arguments);


	 		var maxLength = validationParameters.maximumLength;

	 		var minLength = validationParameters.minimumLength;

	 		if (!maxLength) {
	 			throw new Error('Не передан обязательный параметр MaximumLength');
	 		}

	 		self.isValidInternal = function (val) {
	 			if (utils.isEmptyVal(val)) {
	 				return true;
	 			}
	 			var normalizedVal = utils.isNumber(val) ? ('' + val) : val;
	 			if (minLength) {
	 				return (normalizedVal.length >= minLength) && (normalizedVal.length <= maxLength);
	 			} else {
	 				return normalizedVal.length <= maxLength;
	 			}
	 		}
	 	};

	 	var lessThanNowRule= function(validationType, errorMessage, validationParameters) {
	 		var self = this;
	 		lessThanNowRule.superclass.constructor.apply(self, arguments);

	 		self.isValidInternal = function (val) {
	 			if (utils.isEmptyVal(val)) {
	 				return true;
	 			}

	 			var dateVal;
	 			if (typeof val == 'string') {
	 				dateVal = new Date(val);
	 			} else {
	 				dateVal = val;
	 			}

	 			return dateVal < new Date();
	 		}
	 	}

	 	inherit(requiredRule, baseRule);
	 	inherit(rangeRule, baseRule);
	 	inherit(regexRule, baseRule);
	 	inherit(stringLengthRule, baseRule);
	 	inherit(lessThanNowRule, baseRule);




	 	var boolRule = function (validationType) {
	 		var self = this;
	 		boolRule.superclass.constructor.apply(self, arguments);

	 		self.errorMessage = 'Поле типа bool заполнено некорректно';
	 		self.isValidInternal = function (value) {
	 			if (utils.isEmptyVal(value)) {
	 				return true;
	 			}
	 			return (value == true || value == false);
	 		};
	 	};

	 	var intRule = function (validationType) {
	 		var self = this;
	 		intRule.superclass.constructor.apply(self, arguments);

	 		self.errorMessage = 'Требуется ввести целое число';
	 		self.isValidInternal = function (value) {
	 			if (utils.isEmptyVal(value)) {
	 				return true;
	 			}
	 			return value == value.replace(/[^\d]/, '');
	 		};
	 	};

	 	var doubleRule = function (validationType) {
	 		var self = this;
	 		doubleRule.superclass.constructor.apply(self, arguments);

	 		self.errorMessage = 'Требуется ввести целое или дробное число';
	 		self.isNumeric = function (value) {
	 			var validChars = '0123456789.';
	 			for (var i = 0; i < value.length; i++) {
	 				if (validChars.indexOf(value.charAt(i)) == -1)
	 					return false;
	 			}
	 			return true;
	 		};

	 		self.isValidInternal = function (value) {
	 			if (utils.isEmptyVal(value)) {
	 				return true;
	 			}
	 			return self.isNumeric(value) && !isNaN(Number(value));
	 		};
	 	};

	 	//НАДО ПОСМОТРЕТЬ ЧТО ВАЛИДАТОР РАБОТАЕТ
	 	var datetimeRule = function (validationType) {
	 		var self = this;
	 		datetimeRule.superclass.constructor.apply(self, arguments);

	 		self.errorMessage = 'Некорректное значение даты или некорректный формат даты';

	 		self.isValidInternal = function (value) {
	 			if (utils.isEmptyVal(value)) {
	 				return true;
	 			}

	 			//Костыль для заполнения дат в форме utc
	 			if (typeof value === 'string' && value.length > 10) {
	 				var date = new Date(value);
	 				if (!isNaN(date.getTime())) {
	 					return getValidationResult(true);
	 				}
	 			}

	 			if (value instanceof Date) {
	 				return !isNaN(value.getTime());
	 			}

	 			var arrD = value.split(".");
	 			arrD[1] -= 1;
	 			var d = new Date(arrD[2], arrD[1], arrD[0]);
	 			return !isNaN(d.getTime()) && (d.getFullYear() == arrD[2]) && (d.getMonth() == arrD[1]) && (d.getDate() == arrD[0]);
	 		};
	 	};

	 	//валидотор для модели файлов 
	 	var filesRule = function (validationType) {
	 		var self = this;
	 		filesRule.superclass.constructor.apply(self, arguments);
	 		self.errorMessage = 'Некорректное значение даты или некорректный формат даты';

	 		//value является filesViewModel
	 		//var sortComp = function (a, b) {
	 		//	var textA = a.fileName;
	 		//	var textB = b.fileName;
	 		//	return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
	 		//};

	 		self.isValidInternal = function (value) {
	 			if (utils.isNullOrUndefined(value)) {
	 				return true;
	 			}

	 			var addedFileNames = value.addedFileNames;
	 			var newFileNames = value.newFileNames.map(function (item) {
	 				return item.fileName();
	 			});
	 			var sortedFileNames = addedFileNames.concat(newFileNames).sort();
	 			var doubleFiles = [];
	 			for (var i = 0; i < sortedFileNames.length - 1; i++) {
	 				if (sortedFileNames[i + 1] === sortedFileNames[i]) {
	 					doubleFiles.push(sortedFileNames[i]);
	 				}
	 			}
	 			if (doubleFiles.length === 0) {
	 				return true;
	 			} else {
	 				self.errorMessage = 'дублируются файлы:' + doubleFiles.filter(function (val) { return val; }).join(', ');
	 				return false;
	 			}
	 		};
	 	};

	 	//валидатор для сложных моделей(как правило содержащих в себе несколько полей), модель должна иметь функцию isValid возращающую bool
	 	var modelRule = function (validationType) {
	 		var self = this;
	 		datetimeRule.superclass.constructor.apply(self, arguments);
	 		self.errorMessage = 'Не все поля заполнены корректно.';

	 		self.isValid = function (value) {
	 			if (utils.isNullOrUndefined(value)) {
	 				return true;
	 			}

	 			return value.isValid();
	 		};
	 	}

	 	inherit(boolRule, baseRule);
	 	inherit(intRule, baseRule);
	 	inherit(doubleRule, baseRule);
	 	inherit(datetimeRule, baseRule);
	 	inherit(filesRule, baseRule);
	 	inherit(modelRule, baseRule);


	 	var validator = function (rules) {
	 		var self = this;
	 		self.rules = rules;
	 		self.isValid = function (value) {
	 			var rules = self.rules;
	 			for (var i = 0; i < rules.length; i++) {
	 				var validRes = rules[i].isValid(value);
	 				if (validRes.isValid === false) {
	 					return validRes;
	 				}
	 			}
	 			return getValidationResult(true);
	 		};
	 	}

	 	var validatorsFactory = function () {
	 		var self = this;

	 		self.validatorsFunc = {
	 			//правила валидации задаваемые типом поля
	 			'datetime': datetimeRule,
	 			'datetime?': datetimeRule,
	 			'int': intRule,
	 			'int?': intRule,
	 			'int32': intRule,
	 			'int32?': intRule,
	 			'int64': intRule,
	 			'int64?': intRule,
	 			'double': doubleRule,
	 			'double?': doubleRule,
	 			'decimal': doubleRule,
	 			'decimal?': doubleRule,
	 			'bool': boolRule,
	 			'bool?': boolRule,
	 			'boolean': boolRule,
	 			'boolean?': boolRule,

	 			'files': filesRule,
	 			//'fias': modelRule,
	 			'model': modelRule,


	 			//правила валидации задаваемые атрибутами
	 			'required': requiredRule,
	 			'range': rangeRule,
	 			'regularexpression': regexRule,
	 			'stringlength': stringLengthRule,
	 			'lessthannow': lessThanNowRule,
	 		};

	 		self.getValidationRule = function (validationType, errorMessage, validationParameters) {
	 			var func = self.validatorsFunc[validationType];
	 			return func ? (new func(validationType, errorMessage, validationParameters)) : null;
	 		};

	 		self.getValidationRules = function (colDef) {
	 			var rules = [];
	 			var validator = colDef.validator;
	 			if (validator) {
	 				var validationRules;
	 				if (Object.prototype.toString.call(colDef.validator.rules) === '[object Array]') {
	 					validationRules = colDef.validator.rules;
	 				} else {
	 					validationRules = [];
	 				}

	 				for (var i = 0; i < validationRules.length; i++) {
	 					var ruleDesc = validationRules[i];
	 					var rule = self.getValidationRule(ruleDesc.validationType.toLowerCase(), ruleDesc.errorMessage, ruleDesc.validationParameters);
	 					if (rule)
	 						rules.push(rule);
	 					//else
	 					//    console.warn('среди клиентских правил валидации не найдено правило типа ' + ruleDesc.validationType);
	 				}
	 			}
	 			return rules;
	 		};

	 		self.getComplexValidator = function (colDef) {
	 			var rules = self.getValidationRules(colDef);
	 			return new validator(rules);
	 		};

	 		self.getComplexValidatorForValidators = function (validators) {
	 			return new validator(validators);
	 		}

	 		self.getValidatorForRules = function (validationRulesDesc) {
	 			var rules = [];
	 			for (var i = 0; i < validationRulesDesc.length; i++) {
	 				var ruleDesc = validationRulesDesc[i];
	 				var rule = self.getValidationRule(ruleDesc.validationType.toLowerCase(), ruleDesc.errorMessage, ruleDesc.validationParameters);
	 				if (rule)
	 					rules.push(rule);
	 			}
	 			return new validator(rules);
	 		};

	 		self.getRequiredValidator = function (errorMessage) {
	 			var rule = new requiredRule('required', errorMessage,{});
	 			return new validator([rule]);
	 		};

	 		self.getRegexValidator = function (pattern, errorMessage) {
	 			var rule = new regexRule('regex', errorMessage, { pattern: pattern });
	 			return new validator([rule]);
	 		};
	 	};

	 	return new validatorsFactory();
	 });
define('Nvx.ReDoc.DynamicFormsFiasControl/Web/Content/Scripts/SelectControlViewModel',
	[
		'knockout',
		'jquery',
		'text!Nvx.ReDoc.DynamicFormsFiasControl/Web/Content/View/selectControl.tmpl.html'
	],
	function (ko, $, view) {
		//Проверка существования вьюхи.
		if (view == null || view === '') throw new Error('View not found: Nvx.ReDoc.DynamicFormsFiasControl/Web/Content/View/selectControl.tmpl.html.');

		var SelectControlViewModel = function (params) {
			var self = this;

			//Разбираем параметры.
			var viewModelPath = params.viewModelPath;
			var businessEntityPath = params.businessEntityPath;
			//Свои пути.
			self.viewModelPath = viewModelPath;
			self.Path = businessEntityPath;

			//Подписываемся на изменение валидности контрола.
			self.errorMessage.subscribe(function (newValue) {
				if (newValue.length > 0) {
					self.notValidClass(true);
				} else {
					self.notValidClass(false);
				}
			});

			//Подписываемся на изменение выбранного значения.
			self.selectedElement.subscribe(function (newValue) {
				console.log(newValue);
			});

			//Устанавливаем placeholder для select2.
			self.select2options.placeholder = self.Caption;
		};

		//Свои пути.
		SelectControlViewModel.prototype.viewModelPath = '';
		SelectControlViewModel.prototype.Path = '';

		//Родительские пути.
		SelectControlViewModel.prototype.element = ko.observable();
		SelectControlViewModel.prototype.markup = '';
		SelectControlViewModel.prototype.errorMessage = ko.observable('');
		SelectControlViewModel.prototype.ControlEnabling = ko.observable(true);
		SelectControlViewModel.prototype.ControlVisibility = ko.observable(true);
		SelectControlViewModel.prototype.IsMandatory = ko.observable(false);
		//Флаг валидности контрола (получаем с сервера).
		SelectControlViewModel.prototype.IsValid = ko.observable(true);
		//Флаг отображения валидности контрола (красная звездочка).
		SelectControlViewModel.prototype.notValidClass = ko.observable(false);

		//Выбранный идентификатор.
		SelectControlViewModel.prototype.selectedElement = ko.observable();
		//Название элемента ФИАС.
		SelectControlViewModel.prototype.Caption = "SelectControl's caption";
		//Описание элемента ФИАС.
		SelectControlViewModel.prototype.Tooltip = "SelectControl's tooltip.";

		SelectControlViewModel.prototype.select2options = {
			placeholder: 'Выберите профиль',
			allowClear: true,
			ajax: {
				url: "/Nvx.ReDoc.WebAdmin/Web/Controller/ArmServerController/ProfilesSelectJson",
				dataType: "json",
				data: function (term) {
					return {
						term: term.term //search term
					};
				},
				processResults: function (data) {
					return { results: data };
				}
			},
			templateResult: function (item) {
				return '<div class="user-of-table" style="height: 40px; text-overflow: ellipsis; overflow-wrap: break-word;">' +
					//'<div class="avatar-container">' +
					//'</div>' +
					'<div class="name-of-temp">{0}</div>'.format(item.text) +
					//'<div class="email-of-user">{0}</div>'.format(department.departmentCity != null ? department.departmentCity : '') +
					'</div>';
			},
			templateSelection: function (item) {
				var attrs = "";
				//формируем побочные строки для пунктов
				if (item.attrs != null) {
					$.each(item.attrs, function (id, idata) {
						if (idata != null && idata.length > 0) {
							attrs += idata + " ";
						}
					});
				}
				return item.text != null ? item.text : attrs;
			},
			minimumResultsForSearch: 3,
			escapeMarkup: function (m) { return m; }
		};
	});




define('Nvx.ReDoc.DynamicFormsFiasControl/Web/Content/Scripts/SimpleFias',
	[
		'Nvx.ReDoc.DynamicFormsFiasControl/Web/Content/Scripts/control/Region',
		'text!Nvx.ReDoc.DynamicFormsFiasControl/Web/Content/View/simpleFias.tmpl.html'
	],
	function (Region, view) {
		var viewId = 'Nvx.ReDoc.DynamicFormsFiasControl/Web/Content/View/simpleFias.tmpl.html';
		//Проверка существования вьюхи.
		if (view == null || view === '') throw new Error('View not found: "' + viewId + '".');

		var SimpleFias = function() {

		};

		SimpleFias.prototype.viewId = viewId;
		SimpleFias.prototype.region = new Region();

		return SimpleFias;
	});
define('Nvx.ReDoc.WebInterfaceModule/Content/lib/rubytojs/opalRunner', [
		'opal',
		'opal-parser',
		'opal-native',
		'opal-datetime',
		'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/guid/guid',
		'opal-guid'
	],
	function (opal) {
		//парсер ruby
		opal.load('opal-parser');
		//класс native для взаимодействия с js из ruby кода
		opal.load('native');
		//модули для C sharp
		//opal.load('date');
		opal.load('DateTime');
		opal.load('Guid');


		//этот модуль тянет парочку тяжёлых либ
		return opal;
	});
define('Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/maskedInput/maskedInputBinding', [
	'jquery',
	'knockout'
], function($, ko) {
	
	/*
    jQuery Masked Input Plugin
    Copyright (c) 2007 - 2015 Josh Bush (digitalbush.com)
    Licensed under the MIT license (http://digitalbush.com/projects/masked-input-plugin/#license)
    Version: 1.4.1

	REDACTED $.mask.definitions
	*/
		(function($) {
			var caretTimeoutId, ua = navigator.userAgent, iPhone = /iphone/i.test(ua), chrome = /chrome/i.test(ua), android = /android/i.test(ua);
			$.mask = {
				//redacted
				definitions: {
					"#": '[\\s\\d\\+-]',
					"0": "[0-9]",
					"9": "[\\s0-9]",

					//eng and cyr
					'L': "[A-Za-zА-Яа-яЁё]",
					'?': "[\\sA-Za-zА-Яа-яЁё]",

					//'L': "[\u00BF-\u1FFF\u2C00-\uD7FFA-Za-z]",
					//'?': "[\\s\u00BF-\u1FFF\u2C00-\uD7FFA-Za-z]+",

					'C': "[\x00-\x7F]",

					
					'A': "[\\dA-Za-zА-Яа-яЁё]",
					'a': "[\\s\\dA-Za-zА-Яа-яЁё]",
					//'A': "[\u00BF-\u1FFF\u2C00-\uD7FF\w]",
					//'a': "[\s\u00BF-\u1FFF\u2C00-\uD7FF\w]",

					"*": "[\\s\\S]"
				},
				//autoclear: !0,
				autoclear: !1,
				dataName: "rawMaskFn",
				placeholder: "_"
			};

			//replaceDefs: {
			//	//'.':[''],
			//	//',':[''],
			//	//':':[''],
			//	'/': [':'],
			//	//'$': ['.'],
			//	'<': ['.'],
			//	//'>': ['.'],
			//	//'|': ['.'],
			//	//'\\': ['.'],
			//	}
			//escapedPosArray - массив
			//upperPosArray - массив
			//lowerPosArray - массив
			var replaceChars = function (text, escapedPosArray, upperPosArray, lowerPosArray) {
				var s = typeof text === 'string' ? text.split('') : text;
				
				var lowerChars = false;
				var upperChars = false;
				var noneConvertion = true;

				var newStr = '';
				var i, j = 0;
				for (i = 0; i < s.length; i++) {
					switch (s[i]) {
					case '/':
						newStr += ':';
						j++;
						break;
					case '<':
						lowerChars = true;
						upperChars = false;
						noneConvertion = false;
						break;
					case '>':
						upperChars = true;
						lowerChars = false;
						noneConvertion = false;
						break;
					case '|':
						noneConvertion = true;
						break;
					case '\\':
						i++;
						if (escapedPosArray)
							escapedPosArray.push(j);
						newStr += s[i];
						j++;
						break;
					default:
						if (noneConvertion === false) {
							if (lowerChars) {
								newStr += s[i].toLowerCase();
								if (lowerPosArray)
									lowerPosArray.push(j);
							} else if (upperChars) {
								newStr += s[i].toUpperCase();
								if (upperPosArray)
									upperPosArray.push(j);
							}
						} else {
							newStr += s[i];
						}
						j++;
					}
				}
				return typeof text === 'string' ? newStr : newStr.split('');
			};
			
			$.fn.extend({
				caret: function(begin, end) {
					var range;
					if (0 !== this.length && !this.is(":hidden"))
						return "number" == typeof begin ? (end = "number" == typeof end ? end : begin,
							this.each(function() {
								this.setSelectionRange ? this.setSelectionRange(begin, end) : this.createTextRange && (range = this.createTextRange(),
									range.collapse(!0), range.moveEnd("character", end), range.moveStart("character", begin),
									range.select());
							})) : (this[0].setSelectionRange ? (begin = this[0].selectionStart, end = this[0].selectionEnd) : document.selection && document.selection.createRange && (range = document.selection.createRange(),
								begin = 0 - range.duplicate().moveStart("character", -1e5), end = begin + range.text.length),
							{
								begin: begin,
								end: end
							});
				},
				unmask: function() {
					return this.trigger("unmask");
				},
				mask: function(mask, settings) {
					var input, defs, tests, partialPosition, firstNonMaskPos, lastRequiredNonMaskPos, len, oldVal;
					if (!mask && this.length > 0) {
						input = $(this[0]);
						var fn = input.data($.mask.dataName);
						return fn ? fn() : void 0;
					}

					//в изначальной маске могут быть символы трансформации и escaped символы
					var originalmask = mask;
					var escapedPosArray = [];
					var upperPosArray = [];
					var lowerPosArray = [];
					//обработка нажатаго символа(чтобы его в верний/нижний регистр перевести)
					//TODO может лучше использовать ассоциативный массив
					var processChar = function(ch, index) {
						if (upperPosArray.indexOf(index) >= 0) {
							return ch.toUpperCase();
						} else if (lowerPosArray.indexOf(index) >= 0) {
							return ch.toLowerCase();
						}
						return ch;
					};
					mask = replaceChars(mask, escapedPosArray, upperPosArray, lowerPosArray);

					return settings = $.extend({
							autoclear: $.mask.autoclear,
							placeholder: $.mask.placeholder,
							completed: null
						}, settings), defs = $.mask.definitions, tests = [], partialPosition = len = mask.length,
						firstNonMaskPos = null, $.each(mask.split(""), function (i, c) {
							//добавим escaped символы
							//"?" == c ? (len--, partialPosition = i) : defs[c] ? (tests.push(escapedPosArray.indexOf(i) < 0 ? new RegExp(defs[c]) : new RegExp("[" + c + "]")),
							"?" == c ? (len--, partialPosition = i) : defs[c] ? (tests.push(new RegExp(defs[c])),
								null === firstNonMaskPos && (firstNonMaskPos = tests.length - 1), partialPosition > i && (lastRequiredNonMaskPos = tests.length - 1)) : tests.push(null);

						}), this.trigger("unmask").each(function() {
							function tryFireCompleted() {
								if (settings.completed) {
									for (var i = firstNonMaskPos; lastRequiredNonMaskPos >= i; i++) if (tests[i] && buffer[i] === getPlaceholder(i)) return;
									settings.completed.call(input);
								}
							}
							
							function getPlaceholder(i) {
								return settings.placeholder.charAt(i < settings.placeholder.length ? i : 0);
							}

							function seekNext(pos) {
								for (; ++pos < len && !tests[pos];);
								return pos;
							}

							function seekPrev(pos) {
								for (; --pos >= 0 && !tests[pos];);
								return pos;
							}

							function shiftL(begin, end) {
								var i, j;
								if (!(0 > begin)) {
									for (i = begin, j = seekNext(end); len > i; i++)
										if (tests[i]) {
											if (!(len > j && tests[i].test(buffer[j]))) break;
											buffer[i] = buffer[j], buffer[j] = getPlaceholder(j), j = seekNext(j);
										}
									writeBuffer(), input.caret(Math.max(firstNonMaskPos, begin));
								}
							}

							function shiftR(pos) {
								var i, c, j, t;
								for (i = pos, c = getPlaceholder(pos); len > i; i++)
									if (tests[i]) {
										if (j = seekNext(i), t = buffer[i], buffer[i] = c, !(len > j && tests[j].test(t))) break;
										c = t;
									}
							}

							function androidInputEvent() {
								var curVal = input.val(), pos = input.caret();
								if (oldVal && oldVal.length && oldVal.length > curVal.length) {
									for (checkVal(!0); pos.begin > 0 && !tests[pos.begin - 1];) pos.begin--;
									if (0 === pos.begin) for (; pos.begin < firstNonMaskPos && !tests[pos.begin];) pos.begin++;
									input.caret(pos.begin, pos.begin);
								} else {
									for (checkVal(!0); pos.begin < len && !tests[pos.begin];) pos.begin++;
									input.caret(pos.begin, pos.begin);
								}
								tryFireCompleted();
							}

							function blurEvent() {
								checkVal(), input.val() != focusText && input.change();
							}

							function keydownEvent(e) {
								if (!input.prop("readonly")) {
									var pos, begin, end, k = e.which || e.keyCode;
									oldVal = input.val(), 8 === k || 46 === k || iPhone && 127 === k ? (pos = input.caret(),
										begin = pos.begin, end = pos.end, end - begin === 0 && (begin = 46 !== k ? seekPrev(begin) : end = seekNext(begin - 1),
											end = 46 === k ? seekNext(end) : end), clearBuffer(begin, end), shiftL(begin, end - 1),
										e.preventDefault()) : 13 === k ? blurEvent.call(this, e) : 27 === k && (input.val(focusText),
										input.caret(0, checkVal()), e.preventDefault());
								}
							}

							function keypressEvent(e) {
								if (!input.prop("readonly")) {
									var p, c, next, k = e.which || e.keyCode, pos = input.caret();
									if (!(e.ctrlKey || e.altKey || e.metaKey || 32 > k) && k && 13 !== k) {
										if (pos.end - pos.begin !== 0 && (clearBuffer(pos.begin, pos.end), shiftL(pos.begin, pos.end - 1)),
											p = seekNext(pos.begin - 1), len > p && (c = processChar(String.fromCharCode(k), p), tests[p].test(c))) {
											if (shiftR(p), buffer[p] = c, writeBuffer(), next = seekNext(p), android) {
												var proxy = function() {
													$.proxy($.fn.caret, input, next)();
												};
												setTimeout(proxy, 0);
											} else input.caret(next);
											pos.begin <= lastRequiredNonMaskPos && tryFireCompleted();
										}
										e.preventDefault();
									}
								}
							}

							function clearBuffer(start, end) {
								var i;
								for (i = start; end > i && len > i; i++) tests[i] && (buffer[i] = getPlaceholder(i));
							}

							function writeBuffer() {
								input.val(buffer.join(""));
							}

							function checkValOld(allow) {
								var i, c, pos, test = input.val(), lastMatch = -1;
								for (i = 0, pos = 0; len > i; i++)
									if (tests[i]) {
										for (buffer[i] = getPlaceholder(i); pos++ < test.length;)
											if (c = test.charAt(pos - 1),
												tests[i].test(c)) {
												buffer[i] = c, lastMatch = i;
												break;
											}
										if (pos > test.length) {
											clearBuffer(i + 1, len);
											break;
										}
									} else buffer[i] === test.charAt(pos) && pos++, partialPosition > i && (lastMatch = i);
								return allow ? writeBuffer() : partialPosition > lastMatch + 1 ? settings.autoclear || buffer.join("") === defaultBuffer ? (input.val() && input.val(""),
										clearBuffer(0, len)) : writeBuffer() : (writeBuffer(), input.val(input.val().substring(0, lastMatch + 1))),
									partialPosition ? i : firstNonMaskPos;
							}

							function checkVal(allow) {
								var i, c, pos, test = input.val(), lastMatch = -1, firstNotMatch = null;

								for (i = 0, pos = 0; len > i; i++)
									if (tests[i]) {
										//for (buffer[i] = getPlaceholder(i); pos++ < test.length;)
										buffer[i] = getPlaceholder(i);
										if (pos++ < test.length);
										{
											if (c = test.charAt(pos - 1),
												tests[i].test(c)) {
												buffer[i] = c, lastMatch = i;
												//break;
											} else {
												firstNotMatch = firstNotMatch || i;
											}
										}
										if (pos > test.length) {
												clearBuffer(i + 1, len);
												break;
											}
										
									} else
										buffer[i] === test.charAt(pos) && pos++, partialPosition > i && (lastMatch = i);

								return allow ? writeBuffer() : partialPosition > lastMatch + 1 ? settings.autoclear || buffer.join("") === defaultBuffer ? (input.val() && input.val(""),
										clearBuffer(0, len)) : writeBuffer() : (writeBuffer(), input.val(input.val().substring(0, lastMatch + 1))),
									partialPosition ? (firstNotMatch || i) : firstNonMaskPos;
									//partialPosition ? i : firstNonMaskPos;
							}

							var input = $(this),
								buffer = $.map(mask.split(""), function(c, i) {
									return "?" != c ? defs[c] ? getPlaceholder(i) : c : void 0;
								}),
								defaultBuffer = buffer.join(""),
								focusText = input.val();
							input.data($.mask.dataName, function() {
									return $.map(buffer, function(c, i) {
										return tests[i] && c != getPlaceholder(i) ? c : null;
									}).join("");
								}), input.one("unmask", function() {
									input.off(".mask").removeData($.mask.dataName);
								}).on("focus.mask", function() {
									if (!input.prop("readonly")) {
										clearTimeout(caretTimeoutId);
										var pos;
										focusText = input.val(), pos = checkVal(), caretTimeoutId = setTimeout(function() {
											input.get(0) === document.activeElement && (writeBuffer(), pos == mask.replace("?", "").length ? input.caret(0, pos) : input.caret(pos));
										}, 10);
									}
								}).on("blur.mask", blurEvent).on("keydown.mask", keydownEvent).on("keypress.mask", keypressEvent).on("input.mask paste.mask", function() {
									input.prop("readonly") || setTimeout(function() {
										var pos = checkVal(!0);
										input.caret(pos), tryFireCompleted();
									}, 0);
								}), chrome && android && input.off("input.mask").on("input.mask", androidInputEvent),
								checkVal();
						});
				}
			});
		})($);

	ko.bindingHandlers['maskedInput'] = {
		init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			var mask = ko.utils.unwrapObservable(valueAccessor());
			if (mask)
				$(element).mask(mask);
		},
		update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			var mask = ko.utils.unwrapObservable(valueAccessor());
			if (mask)
				$(element).mask(mask);
		}
	};
});
define('Nvx.ReDoc.Rpgu.PortalModule/Cabinet/Script/customer/CustomerViewModel', ['jquery',
		'knockout',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction'],
	function($, ko, modal) {

		var CustomerViewModel = function() {
			var self = this;

			// ФИО
			self.fio = ko.observable('');

			// Пол
			self.gender = ko.observable('');

			// Информация о паспорте
			self.passport = ko.observable(null);

			// СНИЛС
			self.snils = ko.observable('');

			// ИНН
			self.inn = ko.observable('');

			// Дата рождения
			self.birthDate = ko.observable('');

			// Место рождения
			self.birthPlace = ko.observable('');

			// Гражданство
			self.citizenship = ko.observable(null);

			// Домашний телефон
			self.homePhone = ko.observable('');

			// Рабочий телефон
			self.workPhone = ko.observable('');

			// Мобильный телефон
			self.mobilePhone = ko.observable('');

			// email
			self.email = ko.observable('');

			// Адрес регистрации
			self.registrationAddress = ko.observable('');

			// Адрес проживания
			self.facticalAddress = ko.observable('');

			//Сведения о транспортных средствах
			self.vehicles = ko.observableArray();

			// документы
			self.birthCertificate = ko.observable(null);
			self.drivingLicense = ko.observable(null);
			self.internationalPassport = ko.observable(null);
			self.medicalPolicy = ko.observable(null);
			self.militaryIdDoc = ko.observable(null);

			// елк
			self.showElkBlock = ko.observable(false);
			self.allowGetElkData = ko.observable(false);
			self.changeAllowGetElkData = function () {
				var newAccess = self.allowGetElkData();
				self.changeGetElkDataAccess(newAccess);
				return true;
			};
			self.allowSendElkData = ko.observable(false);
			self.changeAllowSendElkData = function () {
				var newAccess = self.allowSendElkData();
				self.changeSendElkDataAccess(newAccess);
				return true;
			};
		};

		//применить ответ сервера
		CustomerViewModel.prototype.applyResponse = function(response) {
			var self = this;

			// ФИО
			self.fio(response.fio);
			// Пол
			self.gender(response.gender);
			// Информация о паспорте
			if (response.passport != null) {
				response.passport.seriesAndNumber = response.passport.series + ' ' + response.passport.number;
			}
			self.passport(response.passport);
			// СНИЛС
			self.snils(response.snils);
			// ИНН
			self.inn(response.inn);
			// Дата рождения
			self.birthDate(response.birthDate);
			// Место рождения
			self.birthPlace(response.birthPlace);
			// Гражданство
			self.citizenship(response.citizenship);
			// Домашний телефон
			self.homePhone(response.homePhone);
			// Рабочий телефон
			self.workPhone(response.workPhone);
			// Мобильный телефон
			self.mobilePhone(response.mobilePhone);
			// email
			self.email(response.email);
			// Адрес регистрации
			self.registrationAddress(response.registrationAddress);
			// Адрес проживания
			self.facticalAddress(response.facticalAddress);

			if (response.vehiclesData != null && response.vehiclesData.vehicles.length > 0) {
				var newArray = [];
				for (var i = 0; i < response.vehiclesData.vehicles.length; i++) {
					newArray.push(response.vehiclesData.vehicles[i]);
				}
				self.vehicles(newArray);
			}

			self.birthCertificate(response.birthCertificate);
			self.drivingLicense(response.drivingLicense);
			self.internationalPassport(response.internationalPassport);
			self.medicalPolicy(response.medicalPolicy);
			self.militaryIdDoc(response.militaryIdDoc);

			if (response.infoModelType === "physical") {
				self.getElkData();
			}
		};

		CustomerViewModel.prototype.applyElkDataResponse = function (response) {
			var self = this;
			self.allowGetElkData(response.allowGet);
			self.allowSendElkData(response.allowSend);
			self.showElkBlock(response.elkOn);
		};

		CustomerViewModel.prototype.getData = function (url) {
			var trId = modal.CreateTrobberDiv2();
			var promise = $.ajax({ url: url, method: 'GET', headers: { proxy: true } })
				.done(function (response) {
					if (response.hasError === true) {
						modal.errorModalWindow(response.errorMessage);
					}
				})
				.fail(function (jqXHR, textStatus, errorThrown) {
					if (jqXHR.responseJSON)
						modal.errorModalWindow(jqXHR.responseJSON.errorMessage);
					else
						modal.errorModalWindow(jqXHR.responseText);
				})
				.always(function () {
					modal.CloseTrobberDiv2(trId);
				});
			return promise;
		};

		CustomerViewModel.prototype.getElkData = function () {
			var self = this;
			var promise = self.getData('/Nvx.ReDoc.Rpgu.PortalModule/Elk/GetElkCustomerInfo')
				.done(function (response) {
					if (response.hasError !== true) {
						self.applyElkDataResponse(response.result);
					}
				});
			return promise;
		};

		CustomerViewModel.prototype.changeGetElkDataAccess = function (newAccess) {
			var self = this;
			return self.changeElkDataAccess('/Nvx.ReDoc.Rpgu.PortalModule/Elk/ChangeGetElkDataAccess', newAccess, self.allowGetElkData);
		};

		CustomerViewModel.prototype.changeSendElkDataAccess = function(newAccess) {
			var self = this;
			return self.changeElkDataAccess('/Nvx.ReDoc.Rpgu.PortalModule/Elk/ChangeSendElkDataAccess', newAccess, self.allowSendElkData);
		};

		CustomerViewModel.prototype.changeElkDataAccess = function (url, newAccess, param) {
			var model = { accessValue: newAccess };
			var trId = modal.CreateTrobberDiv2();

			var promise = $.ajax({
				url: url,
				method: 'POST',
				data: model,
				headers: { proxy: true }
			})
				.done(function (response) {
					if (response.hasError !== true) {
						modal.informationModalWindow("Смена статуса подписки прошла успешно", "");
					} else {
						// revert
						var curAccess = param();
						param(!curAccess);
						modal.errorModalWindow(response.errorMessage);
					}
				})
				.fail(function (jqXHR, textStatus, errorThrown) {
					if (jqXHR.responseJSON)
						modal.errorModalWindow(jqXHR.responseJSON.errorMessage);
					else
						modal.errorModalWindow(jqXHR.responseText);
				})
				.always(function () {
					modal.CloseTrobberDiv2(trId);
				});
			return promise;
		};

		return CustomerViewModel;
	});

define('Nvx.ReDoc.Rpgu.PortalModule/Cabinet/Script/customer/CustomerViewModelService', ['jquery',
	'knockout',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction'],
	function ($, ko, modal) {

		var CustomerViewModelService = function () {
			var self = this;

			self.juridical = null;
			self.physical = null;
			self.individual = null;
		};

		//загрузить информацию о пользователе
		CustomerViewModelService.prototype.loadCustomerInfo = function ()
		{
			var self = this;

			//Показать тробер
			var trobberId = modal.CreateTrobberDiv2();

			var promise = $.ajax({ url: '/Nvx.ReDoc.Rpgu.PortalModule/CustomerController/GetCustomerInfo', method: 'GET', headers: { proxy: true } })
				.done(function(response)
				{
					if (response.hasError !== true)
						self.applyResponse(response.result);
					else
						modal.errorModalWindow(response.errorMessage);
				})
				.fail(function(jqXHR, textStatus, errorThrown)
				{
					if (jqXHR.responseJSON)
						modal.errorModalWindow(jqXHR.responseJSON.errorMessage);
					else
						modal.errorModalWindow(jqXHR.responseText);
				})
				.always(function()
				{
					modal.CloseTrobberDiv2(trobberId);
				});

			return promise;
		};

		//применить ответ сервера
		CustomerViewModelService.prototype.applyResponse = function (response)
		{
			var self = this;
			if (response.infoModelType === "juridical")
				self.juridical = response;
			else if (response.infoModelType === "physical")
				self.physical = response;
			else
				self.individual = response;
		};

		return CustomerViewModelService;
	});

define('Nvx.ReDoc.Rpgu.PortalModule/Cabinet/Script/customer/IndividualViewModel', ['jquery',
	'knockout',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction'],
	function ($, ko) {

		var IndividualViewModel = function () {
			var self = this;

			// ФИО
			self.fio = ko.observable('');

			// Пол
			self.gender = ko.observable('');

			// Информация о паспорте
			self.passport = ko.observable(null);

			// СНИЛС
			self.snils = ko.observable('');

			// ИНН
			self.inn = ko.observable('');

			// Дата рождения
			self.birthDate = ko.observable('');

			// Место рождения
			self.birthPlace = ko.observable('');

			// Гражданство
			self.citizenship = ko.observable(null);

			// Домашний телефон
			self.homePhone = ko.observable('');

			// Рабочий телефон
			self.workPhone = ko.observable('');

			// Мобильный телефон
			self.mobilePhone = ko.observable('');

			// email
			self.email = ko.observable('');

			// Адрес регистрации
			self.registrationAddress = ko.observable('');

			// Адрес проживания
			self.facticalAddress = ko.observable('');
			
			//Сведения о транспортных средствах
			self.vehicles = ko.observableArray();

			// документы
			self.birthCertificate = ko.observable(null);
			self.drivingLicense = ko.observable(null);
			self.internationalPassport = ko.observable(null);
			self.medicalPolicy = ko.observable(null);
			self.militaryIdDoc = ko.observable(null);

			// данные об организации ИП
			self.ipOrg = ko.observable(null);
			self.postalAddress = ko.observable(null);
			self.orgVehicles = ko.observable(null);
		};

		//применить ответ сервера
		IndividualViewModel.prototype.applyResponse = function (response) {
			var self = this;

			// ФИО
			self.fio(response.fio);
			// Пол
			self.gender(response.gender);
			// Информация о паспорте
			if (response.passport != null) {
				response.passport.seriesAndNumber = response.passport.series + ' ' + response.passport.number;
			}
			self.passport(response.passport);
			// СНИЛС
			self.snils(response.snils);
			// ИНН
			self.inn(response.inn);
			// Дата рождения
			self.birthDate(response.birthDate);
			// Место рождения
			self.birthPlace(response.birthPlace);
			// Гражданство
			self.citizenship(response.citizenship);
			// Домашний телефон
			self.homePhone(response.homePhone);
			// Рабочий телефон
			self.workPhone(response.workPhone);
			// Мобильный телефон
			self.mobilePhone(response.mobilePhone);
			// email
			self.email(response.email);
			// Адрес регистрации
			self.registrationAddress(response.registrationAddress);
			// Адрес проживания
			self.facticalAddress(response.facticalAddress);

			var tempArray = [];
			if (response.vehiclesData != null && response.vehiclesData.vehicles.length > 0) {
				tempArray = [];
				for (var i = 0; i < response.vehiclesData.vehicles.length; i++) {
					tempArray.push(response.vehiclesData.vehicles[i]);
				}
				self.vehicles(tempArray);
			}

			self.birthCertificate(response.birthCertificate);
			self.drivingLicense(response.drivingLicense);
			self.internationalPassport(response.internationalPassport);
			self.medicalPolicy(response.medicalPolicy);
			self.militaryIdDoc(response.militaryIdDoc);

			self.ipOrg(response.ipOrg);
			self.postalAddress(response.postalAddress);

			if (response.orgVehiclesData != null && response.orgVehiclesData.vehicles.length > 0) {
				tempArray = [];
				for (var i = 0; i < response.orgVehiclesData.vehicles.length; i++) {
					tempArray.push(response.orgVehiclesData.vehicles[i]);
				}
				self.orgVehicles(tempArray);
			}
		};

		return IndividualViewModel;
});
define('Nvx.ReDoc.Rpgu.PortalModule/Cabinet/Script/customer/JuridicalViewModel', ['jquery',
	'knockout',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction'],
	function ($, ko, modal) {

		var JuridicalViewModel = function () {
			var self = this;
			self.companyFullName = ko.observable('');
			self.companyShortName = ko.observable('');
			self.kpp = ko.observable('');
			self.inn = ko.observable('');
			self.ogrn = ko.observable('');
			self.registrationAddress = ko.observable('');
			self.facticalAddress = ko.observable('');
			self.phone1 = ko.observable('');
			self.phone2 = ko.observable('');
			self.phone3 = ko.observable('');
			self.email = ko.observable('');
		};

		//применить ответ сервера
		JuridicalViewModel.prototype.applyResponse = function (response) {
			var self = this;

			self.companyFullName(response.companyFullName);
			self.companyShortName(response.companyShortName);
			self.kpp(response.kpp);
			self.inn(response.inn);
			self.ogrn(response.ogrn);
			self.registrationAddress(response.registrationAddress);
			self.facticalAddress(response.facticalAddress);
			self.phone1(response.phone1);
			self.phone2(response.phone2);
			self.phone3(response.phone3);
			self.email(response.email);
		};

		return JuridicalViewModel;
	});

define('Nvx.ReDoc.Rpgu.PortalModule/Cabinet/Script/request/RequestListViewModel', ['jquery',
		'knockout',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'jqueryExtention'],
	function($, ko, modal) {
		var RequestListViewModel = function() {
			var self = this;

			/* Список заявок */
			self.requestList = ko.observableArray();
		};

		RequestListViewModel.prototype.getList = function() {
			var self = this;

			//показать тробер
			var trobberId = modal.CreateTrobberDiv2();
			var model = { nocache: new Date().getTime() };

			var promise = $.ajax({ url: '/Nvx.ReDoc.Rpgu.PortalModule/RequestController/RequestList', data: model, headers: { proxy: true }, method: 'GET' })
				.done(function(response) {
					if (response.hasError) {
						modal.errorModalWindow(response.errorMessage);
					} else {
						self.requestList(response.requestList);
					}
					;
				})
				.fail(function(jqXHR, textStatus, errorThrown) {
					if (jqXHR.responseJSON) {
						modal.errorModalWindow(jqXHR.responseJSON.errorMessage);
					} else {
						modal.errorModalWindow(jqXHR.responseText);
					}
				})
				.always(function() {
					//Скрываем тробер
					modal.CloseTrobberDiv2(trobberId);
				});

			return promise;
		};

		//Клик по кнопке "Удалить" для черновика
		RequestListViewModel.prototype.removeDraftClick = function(id) {
			var self = this;

			var close = function() {
				modal.CloseModalDialog(id, true);
			};

			modal.CreateQuestionModalWindow(id, 'Вы действительно хотите удалить черновик?', "Да", "Нет", 'Удаление', function() {
				self.removeDraft(id);
				close();
			}, close);

		};

		//Удалить черновик
		RequestListViewModel.prototype.removeDraft = function(id) {
			var self = this;

			var model = { id: id };

			//показать тробер
			var trobberId = modal.CreateTrobberDiv2();

			$.ajax({ url: '/Nvx.ReDoc.Rpgu.PortalModule/RequestController/RemoveDraft', data: model, headers: { proxy: true }, method: 'POST' })
				.done(function(response) {
					if (response.hasError) {
						modal.errorModalWindow(response.errorMessage);
					} else {
						//найди индекс элемента, который нужно удалить
						var array = self.requestList();
						var index = -1;
						for (var i = 0; i < array.length && index == -1; i++) {
							if (array[i].id == id) {
								index = i;
							}
						}

						if (index > -1) {
							array.splice(index, 1);
							self.requestList(array);
						}
					}
				})
				.fail(function(jqXHR, textStatus, errorThrown) {
					if (jqXHR.responseJSON) {
						modal.errorModalWindow(jqXHR.responseJSON.errorMessage);
					} else {
						modal.errorModalWindow(jqXHR.responseText);
					}
				})
				.always(function() {
					//Скрываем тробер
					modal.CloseTrobberDiv2(trobberId);
				});
		};

		//Закрыть диалог удаления черновика
		RequestListViewModel.prototype.closeRemoveDialog = function() {
			var self = this;
			self.confirmRemoveDialog.closeModalWindow();
		};

		//btx method
		RequestListViewModel.prototype.goFile = function(item) {
			var prefixRequest = window.nvxCommonPath != null ? window.nvxCommonPath.formView : '/cabinet/request/index.php?fileId=';
			var prefixAttachment = window.nvxCommonPath != null ? window.nvxCommonPath.attachmentView : '/cabinet/attachment/index.php?fileId=';
			var prefixInfo = window.nvxCommonPath != null ? window.nvxCommonPath.infoView : '/cabinet/information/index.php?fileId=';

			var guidRegexp = new RegExp("[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}", "i");
			var matches = guidRegexp.exec(item.fileLink);
			if (matches != null && matches.length == 1) {
				if (item.fileLink.contains('/info')) {
					window.location = prefixInfo + matches[0];
				} else if (item.fileLink.contains('/attachment')) {
					window.location = prefixAttachment + matches[0];
				} else {
					window.location = prefixRequest + matches[0];
				}
			}
			console.log('no file link');
		};

		RequestListViewModel.prototype.start = function() {
			var self = this;

			var trobberId = modal.CreateTrobberDiv2();
			var model = { nocache: new Date().getTime() };

			var promise = $.ajax({ url: '/Nvx.ReDoc.Rpgu.PortalModule/RequestController/RequestList', data: model, headers: { proxy: true }, method: 'GET' })
				.done(function(response) {
					if (response.hasError) {
						modal.errorModalWindow(response.errorMessage);
					} else {
						self.requestList(response.requestList);
					}
				})
				.fail(function(jqXHR, textStatus, errorThrown) {
					if (jqXHR.responseJSON) {
						modal.errorModalWindow(jqXHR.responseJSON.errorMessage);
					} else {
						modal.errorModalWindow(jqXHR.responseText);
					}
				})
				.always(function() {
					modal.CloseTrobberDiv2(trobberId);
				});

			return promise;
		};

		return RequestListViewModel;
	});
define('Nvx.ReDoc.Workflow.UploadDocsForm/Web/Resources/Scripts/DocsSubmitFormViewModel',
	[
		'jquery',
		'knockout',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/ModalDialog',
		'Nvx.ReDoc.Workflow.UploadDocsForm/Web/Resources/Scripts/OtherDocsSelectionViewModel',
		'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/knockout-file-bindings/knockout-file-bindings'
	],
	function($, ko, ModalDialog, OtherDocsSelectionViewModel) {
		var DocsSubmitFormViewModel = function(model) {
			var self = this;
			//Модальное окно для выбора необязательных документов
			self.modalDialog = ko.observable(new ModalDialog());
			// список опциональных документов
			self.otherItems = ko.observableArray();
			// список обязательных документов
			self.items = ko.observableArray(model.docInfos);
			// если все опциональные документы уже выбраны, 
			self.haveOtherDoc = ko.observable(true);
			self.showCommentary = model.showCommentary;
			self.showIssueDate = model.showIssueDate;
			self.issueDate = ko.observable();
			if (model.issueDate != null) {
				var start = Date.parse(model.issueDate);
				self.issueDate(new Date(start));
			}

			self.commentary = ko.observable(model.commentary);

			// проверка ввода в текстовое поле только чисел
			self.validateDigits = function(element) {
				var charsAllowed = "0123456789";
				var allowed;
				for (var i = 0; i < element.value.length; i++) {
					allowed = false;
					for (var j = 0; j < charsAllowed.length; j++) {
						if (element.value.charAt(i) == charsAllowed.charAt(j)) {
							allowed = true;
						}
					}
					if (allowed == false) {
						element.value = element.value.replace(element.value.charAt(i), "");
						i--;
					}
				}
				return true;
			};

			// добавление аттачмента
			self.addDoc = function(tempItem, loadedDoc) {
				var newInfo = {
					id: tempItem.index, // индекс документов
					fileData: ko.observable({}), //{ dataURL: ko.observable() }),
					alias: ko.observable(), // псевдоним документа
					fileUrl: ko.observable(), // ссылка на скачивание документа
					fileNotLoaded: ko.observable(true), // файл не приложен, требуется для скрытия кнопки загрузки
					fileIsLoaded: ko.observable(false),
					isFileLoad: ko.observable(false), // файл уже был загружен ранее и присутствует в деле
					isSubmitted: ko.observable(false),
					date: ko.observable(),
					originalPageCount: ko.observable('0'),
					originalSubjectCount: ko.observable('0'),
					copyPageCount: ko.observable('0'),
					copySubjectCount: ko.observable('0'),
					fileName: ko.observable(),
					hasFile: ko.observable(false)
				};

				newInfo.fileData.subscribe(function (fileInput) {
					var tempFile = fileInput.file();
					if (tempFile != null && tempFile.size > 0) {
						newInfo.fileNotLoaded(false);
						newInfo.file = tempFile;
						newInfo.name = encodeURIComponent(tempFile.name);
						newInfo.fileName(tempFile.name);
						newInfo.fileIsLoaded(true);
						newInfo.hasFile(true);
					}
				});
				newInfo.alias(tempItem.title);
				if (loadedDoc) {
					newInfo.alias(loadedDoc.alias);
					newInfo.fileUrl(loadedDoc.fileUrl);
					if (loadedDoc.isFileLoad == true) {
						newInfo.fileNotLoaded(false);
						newInfo.isFileLoad(true);
						newInfo.hasFile(true);
					}
					newInfo.isSubmitted(loadedDoc.isSubmitted);
					newInfo.name = loadedDoc.name;
					if (loadedDoc.submitDocInfo.date != null) {
						var start = Date.parse(loadedDoc.submitDocInfo.date);
						newInfo.date(new Date(start));
					}
					newInfo.originalPageCount(loadedDoc.submitDocInfo.originalPageCount);
					newInfo.originalSubjectCount(loadedDoc.submitDocInfo.originalSubjectCount);
					newInfo.copyPageCount(loadedDoc.submitDocInfo.copyPageCount);
					newInfo.copySubjectCount(loadedDoc.submitDocInfo.copySubjectCount);
				}

				tempItem.index = tempItem.index + 1;
				tempItem.infos.push(newInfo);

			}.bind(self);

			// заполнение документа при переоткрытии задачи
			self.fillUploadedDocs = function(docItem) {

				var infos = docItem.infos;
				docItem.infos = ko.observableArray();
				for (var k = 0; k < infos.length; k++) {
					var tempInfos = infos[k];
					if (tempInfos.isFileLoad == false && tempInfos.isSubmitted == false) {
						continue;
					}

					if (tempInfos.isFileLoad == true && tempInfos.name != null) {
						tempInfos.fileUrl = '/WebInterfaceModule/DownloadAttachment?fileId={0}&attachmentId={1}'.format(model.fileId, tempInfos.name);
					} else {
						tempInfos.fileUrl = '';
					}

					if (docItem.otherDocVisible) {
						docItem.otherDocVisible(true);
					}

					self.addDoc(docItem, tempInfos);
				}
			};

			// заполнение данными списка обязательных документов
			var docInfos = self.items();
			for (var i = 0; i < docInfos.length; i++) {
				var item = docInfos[i];
				item.index = 0;

				item.validateDigits = self.validateDigits; // проверка ввода числа

				if (item.infos.length == 0) {
					item.infos = ko.observableArray();

					if (item.isMultiDoc == false) {
						self.addDoc(item);
					}
				} else {
					self.fillUploadedDocs(item);
				}

				item.removeDoc = function(id) {
					var temp = this;

					$.each(temp.infos(), function(el, k) {
						if (this.id == id) {
							temp.infos.splice(el, 1);
						}
					});

					if (temp.infos().length == 0) {
						self.addDoc(temp);
					}
				};

				item.addDocInfo = function() {
					console.log('item.addDocInfo');
					self.addDoc(this);
				};
			}

			// вызываем окно для выбора опциональных документов
			self.addOtherDocs = function() {
				var modalDialog = self.modalDialog();
				modalDialog.showModalWindow('Nvx.ReDoc.Workflow.UploadDocsForm/Web/View/OtherDocsSelectionView.tmpl.html',
					//Вью-модель для этого окна.
					new OtherDocsSelectionViewModel(modalDialog, self)
				);
			};

			// заполнение данными списка опциональных документов	
			var otherList = model.otherDocInfos;
			var hideAddButton = true;
			for (var j = 0; j < otherList.length; j++) {
				var newItem = otherList[j];
				newItem.index = 0;

				newItem.validateDigits = self.validateDigits; // проверка ввода числа
				newItem.otherDocVisible = ko.observable(false);

				if (model.isOtherDocumentsExpand == true) {
					newItem.otherDocVisible(true);
				}

				if (newItem.infos.length == 0) {
					newItem.infos = ko.observableArray();

					if (newItem.isMultiDoc == false) {
						self.addDoc(newItem);
					}
				} else {
					self.fillUploadedDocs(newItem);
				}

				newItem.removeDoc = function(id) {
					var temp = this;

					$.each(temp.infos(), function(el, k) {
						if (this.id == id) {
							temp.infos.splice(el, 1);
						}
					});

					if (temp.infos().length == 0) {
						self.addDoc(temp);
					}
				};

				newItem.addDocInfo = function() {
					console.log('newItem.addDocInfo');
					self.addDoc(this);
				};

				if (newItem.otherDocVisible() == false) {
					hideAddButton = false;
				}
				self.otherItems.push(newItem);
			}
			// если все элементы видны или список необязательных документов должен быть развернут
			if (hideAddButton == true || model.isOtherDocumentsExpand == true) {
				self.haveOtherDoc(false);
			}
		};

		return DocsSubmitFormViewModel;
	});
define('Nvx.ReDoc.Workflow.UploadDocsForm/Web/Resources/Scripts/OtherDocsSelectionViewModel',
	[
		'jquery',
		'knockout'		
	],
	function ($, ko) {
		var OtherDocsSelectionViewModel = function (modalDialog, parent) {
			var self = this;
			self.allSelected = ko.observable(false);
			self.items = ko.observableArray();
			self.modalDialog = modalDialog;

			var tempItems = parent.otherItems();
			for (var i = 0; i < tempItems.length; i++) {
				var value = tempItems[i];
				if (value.otherDocVisible() == false) {
					var newItem = {
						selected: ko.observable(false),
						name: value.title
					};
					self.items.push(newItem);
				}
			}

			//Если он меняется, то меняем все зависимые чекбоксы.
			self.allSelected.subscribe(function (newValue) {
				//Устанавливаем значение для всех шаблонов дел.
				self.items().forEach(function (item) {
					item.selected(newValue);
				});
			});

			self.cancel = function() {
				self.modalDialog.closeModalWindow();
			};

			self.apply = function () {
				var all = true;
				$.each(self.items(), function (el, k) {
					if (this.selected() != true) {
						all = false;
					} else {
						var tempVal = tempItems[el];
						tempVal.otherDocVisible(true);
					}
				});

				if (all == true) {
					parent.haveOtherDoc(false);
				}
				
				self.modalDialog.closeModalWindow();
			};
		};

		return OtherDocsSelectionViewModel;
	});
define('Nvx.ReDoc.Workflow.UploadDocsForm/Web/Resources/Scripts/PartReadonlyViewModel',
	[
		'jquery',
		'knockout'
	],
	function($, ko) {
		var PartReadonlyViewModel = function(model) {
			var self = this;
			self.items = ko.observableArray(model.docInfos);

			self.showIssueDate = ko.observable(model.showIssueDate);
			self.issueDate = ko.observable();
			if (model.issueDate != null) {
				var start = Date.parse(model.issueDate);
				self.issueDate(new Date(start));
			} else {
				self.showIssueDate = false;
			}
			self.commentary = ko.observable();
			if (model.commentary) {
				//обработка в биндинге
				self.commentary(model.commentary);
				//self.commentary(model.commentary.replace(/\n/g, '<br/>'));
			}
			self.showCommentary = ko.observable(false);
			if (model.showCommentary == true && model.commentary != null && model.commentary.length > 0) {
				self.showCommentary(true);
			}

			var tempItems = self.items();
			for (var i = 0; i < tempItems.length; i++) {
				var item = tempItems[i];

				if (item.infos.length == 0) {
					item.emptyFiles = true;
				} else {
					item.emptyFiles = false;
					for (var k = 0; k < item.infos.length; k++) {
						var tempDoc = item.infos[k];
						tempDoc.fileUrl = ko.observable();
						tempDoc.urlName = ko.observable();
						tempDoc.docName = ko.observable();
						tempDoc.fileNotLoaded = ko.observable(false);
						tempDoc.fileIsLoaded = ko.observable(false);

						if (tempDoc.isSubmitted == true) {
							tempDoc.docName(tempDoc.aliasWithDate);
							tempDoc.fileNotLoaded(true);
						}

						if (tempDoc.isFileLoad == true && tempDoc.name != null) {
							var text = tempDoc.alias;
							if (tempDoc.isSubmitted == true) {
								text = tempDoc.aliasWithDate;
							}
							tempDoc.urlName(text + ' (' + tempDoc.name + ')');
							tempDoc.fileUrl('/WebInterfaceModule/DownloadAttachment?fileId={0}&attachmentId={1}'.format(model.fileId, tempDoc.name));
							tempDoc.fileNotLoaded(false);
							tempDoc.fileIsLoaded(true);
						}

						tempDoc.originalPageCount = ko.observable();
						tempDoc.originalSubjectCount = ko.observable();
						tempDoc.copyPageCount = ko.observable();
						tempDoc.copySubjectCount = ko.observable();
						if (tempDoc.isSubmitted == true) {
							tempDoc.originalPageCount(tempDoc.submitDocInfo.originalPageCount);
							tempDoc.originalSubjectCount(tempDoc.submitDocInfo.originalSubjectCount);
							tempDoc.copyPageCount(tempDoc.submitDocInfo.copyPageCount);
							tempDoc.copySubjectCount(tempDoc.submitDocInfo.copySubjectCount);
						}
					}
				}
			}
			var otherList = model.otherDocInfos;
			for (var j = 0; j < otherList.length; j++) {
				var otherItem = otherList[j];
				if (otherItem.infos.length > 0) {
					otherItem.emptyFiles = false;
					for (var z = 0; z < otherItem.infos.length; z++) {
						var tempOtherDoc = otherItem.infos[z];
						tempOtherDoc.fileUrl = ko.observable();
						tempOtherDoc.urlName = ko.observable();
						tempOtherDoc.docName = ko.observable();
						tempOtherDoc.fileNotLoaded = ko.observable(false);
						tempOtherDoc.fileIsLoaded = ko.observable(false);

						if (tempOtherDoc.isSubmitted == true) {
							tempOtherDoc.docName(tempOtherDoc.aliasWithDate);
							tempOtherDoc.fileNotLoaded(true);
						}

						if (tempOtherDoc.isFileLoad == true && tempOtherDoc.name != null) {
							var textOther = tempOtherDoc.alias;
							if (tempOtherDoc.isSubmitted == true) {
								textOther = tempOtherDoc.aliasWithDate;
							}
							tempOtherDoc.urlName(textOther + ' (' + tempOtherDoc.name + ')');
							tempOtherDoc.fileUrl('/WebInterfaceModule/DownloadAttachment?fileId={0}&attachmentId={1}'.format(model.fileId, tempOtherDoc.name));
							tempOtherDoc.fileNotLoaded(false);
							tempOtherDoc.fileIsLoaded(true);
						}

						tempOtherDoc.originalPageCount = ko.observable();
						tempOtherDoc.originalSubjectCount = ko.observable();
						tempOtherDoc.copyPageCount = ko.observable();
						tempOtherDoc.copySubjectCount = ko.observable();

						if (tempOtherDoc.isSubmitted == true) {
							tempOtherDoc.originalPageCount(tempOtherDoc.submitDocInfo.originalPageCount);
							tempOtherDoc.originalSubjectCount(tempOtherDoc.submitDocInfo.originalSubjectCount);
							tempOtherDoc.copyPageCount(tempOtherDoc.submitDocInfo.copyPageCount);
							tempOtherDoc.copySubjectCount(tempOtherDoc.submitDocInfo.copySubjectCount);
						}
					}

					self.items.push(otherItem);
				}
			}

		};

		return PartReadonlyViewModel;
	});
define('Nvx.ReDoc.Workflow.UploadDocsForm/Web/Resources/Scripts/PartSingleUploadViewModel',
	[
		'jquery',
		'knockout'
	],
	function($, ko) {
		var PartSingleUploadViewModel = function(parent) {
			var self = this;
			self.fileIsLoaded = ko.observable(false);
			self.canLoad = ko.observable(true);
			self.fileName = ko.observable();
			self.fileData = ko.observable({});

			self.removeDoc = function() {
				self.fileData().clear();
			};

			self.changeFile = function(element) {
				var name = element.value.replace(/.+[\\\/]/, '');
				self.fileName(name);
			};

			self.fileData.subscribe(function (fileInput) {
				var tempFile = fileInput.file();
				if (tempFile != null && tempFile.size > 0) {
					parent.canGoToNext('');
					self.fileIsLoaded(true);
					self.canLoad(false);
				} else {
					parent.canGoToNext('disabled');
					self.fileIsLoaded(false);
					self.canLoad(true);
					self.fileName('');
				}
			});
		};

		return PartSingleUploadViewModel;
	});
define('Nvx.ReDoc.Workflow.UploadDocsForm/Web/Resources/Scripts/UploadDocsFormModule',
	[
		'require',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
		'jquery',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/FileController/FileComponentFormModule',
		'Nvx.ReDoc.Workflow.UploadDocsForm/Web/Resources/Scripts/UploadDocsFormViewModel'
	], function (require, inherit, $, FileComponentFormModule, UploadDocsFormViewModel) {
		var UploadDocsFormModule = function () {
			var self = this;
			UploadDocsFormModule.superclass.constructor.apply(self, arguments);
			self.legacy = false;
		};

		//Наследуемся
		inherit(UploadDocsFormModule, FileComponentFormModule);

		UploadDocsFormModule.prototype.templateViewModel = new UploadDocsFormViewModel();

		//Идентификатор вьюхи
		UploadDocsFormModule.prototype.templateId = 'Nvx.ReDoc.Workflow.UploadDocsForm/Web/View/UploadDocsFormView.tmpl.html';

		//Скрипт, который выполняется после отрисовки представления.
		UploadDocsFormModule.prototype.action = function (fileId) {
			var self = this;
			var deferred = $.Deferred();
			self.templateViewModel.fileId = fileId;
			if (fileId == null) {
				self.templateViewModel.fileId = self.fileViewModel.fileInfoViewModel.fileId;
			}
			//Запрашиваем модель данных для представления общей информации о деле в правой части дела.
			$.ajax({ url: this.fileViewModel.selectedPave.link(), method: 'GET', headers: { proxy: true } })
				.done(function (response) {
					//Заполняем вью-модель.
					self.templateViewModel.applyData(response);
					deferred.resolve();
				});
			return deferred.promise();
		};

		return new UploadDocsFormModule();
	});
define('Nvx.ReDoc.Workflow.UploadDocsForm/Web/Resources/Scripts/UploadDocsPartFormViewModel',
	[
		'jquery',
		'knockout',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/ModalDialog',
		'Nvx.ReDoc.Workflow.UploadDocsForm/Web/Resources/Scripts/OtherDocsSelectionViewModel',
		'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/knockout-file-bindings/knockout-file-bindings'		
	],
	function($, ko, ModalDialog, OtherDocsSelectionViewModel) {
		var UploadDocsPartFormViewModel = function(model) {
			var self = this;

			//Модальное окно для выбора необязательных документов
			self.modalDialog = ko.observable(new ModalDialog());
			// список опциональных документов
			self.otherItems = ko.observableArray();
			// список обязательных документов
			self.items = ko.observableArray(model.docInfos);
			// если все опциональные документы уже выбраны, 
			self.haveOtherDoc = ko.observable(true);
			self.showCommentary = model.showCommentary;
			self.showIssueDate = model.showIssueDate;
			self.issueDate = ko.observable();
			if (model.issueDate != null) {
				var start = Date.parse(model.issueDate);
				self.issueDate(new Date(start));
			}

			self.commentary = ko.observable(model.commentary);
			// проверка ввода в текстовое поле только чисел
			self.validateDigits = function(element) {
				var charsAllowed = "0123456789";
				var allowed;
				for (var i = 0; i < element.value.length; i++) {
					allowed = false;
					for (var j = 0; j < charsAllowed.length; j++) {
						if (element.value.charAt(i) == charsAllowed.charAt(j)) {
							allowed = true;
						}
					}

					if (allowed == false) {
						element.value = element.value.replace(element.value.charAt(i), "");
						i--;
					}
				}
				return true;
			};

			// добавление аттачмента
			self.addDoc = function(tempItem, loadedDoc) {
				var newInfo = {
					id: tempItem.index, // индекс документов
					fileData: ko.observable({}), //{ dataURL: ko.observable() }),
					isLoaded: ko.observable(false), // документ загружен на форму
					alias: ko.observable(), // псевдоним документа
					countPage: ko.observable('0'), // количество страниц
					isOriginal: ko.observable(false), // оригинал документа
					fileUrl: ko.observable(), // ссылка на скачивание документа
					fileNotLoaded: ko.observable(true), // файл не приложен, требуется для скрытия кнопки загрузки
					isFileLoad: ko.observable(false), // файл уже был загружен ранее и присутствует в деле
					fileName: ko.observable()
				};

				newInfo.fileData.subscribe(function (fileInput) {
					var tempFile = fileInput.file();
					if (tempFile != null && tempFile.size > 0) {
						newInfo.isLoaded(true);
						newInfo.fileNotLoaded(false);
						newInfo.file = tempFile;
						newInfo.name = encodeURIComponent(tempFile.name);
						newInfo.fileName(tempFile.name);
					}
				});
				if (tempItem.isMultiDoc == false) {
					newInfo.alias(tempItem.title);
				} else {
					//RDC - 9077
					var count = tempItem.index + 1;
					var aliasTitle = tempItem.title.trim() + " [" + count.toString() + "]";
					newInfo.alias(aliasTitle);
				}
				if (loadedDoc) {
					newInfo.alias(loadedDoc.alias);
					newInfo.isLoaded(true);
					newInfo.countPage(loadedDoc.countPage);
					newInfo.isOriginal(loadedDoc.isOrigin);
					newInfo.fileUrl(loadedDoc.fileUrl);
					newInfo.fileNotLoaded(false);
					newInfo.isFileLoad(true);
					newInfo.name = loadedDoc.name;
					newInfo.fileName(loadedDoc.name);
				}
				tempItem.index = tempItem.index + 1;
				tempItem.infos.push(newInfo);

			}.bind(self);

			// заполнение документа при переоткрытии задачи
			self.fillUploadedDocs = function(docItem) {

				var infos = docItem.infos;
				docItem.infos = ko.observableArray();
				for (var k = 0; k < infos.length; k++) {
					var tempInfos = infos[k];
					if (tempInfos.isFileLoad == false) {
						continue;
					}
					tempInfos.fileUrl = '/WebInterfaceModule/DownloadAttachment?fileId={0}&attachmentId={1}'.format(model.fileId, tempInfos.name);
					if (docItem.otherDocVisible) {
						docItem.otherDocVisible(true);
					}
					self.addDoc(docItem, tempInfos);
				}
			};

			// заполнение данными списка обязательных документов
			var docInfos = self.items();
			for (var i = 0; i < docInfos.length; i++) {
				var item = docInfos[i];
				item.index = 0;
				item.validateDigits = self.validateDigits; // проверка ввода числа

				if (item.infos.length == 0) {
					item.infos = ko.observableArray();

					if (item.isMultiDoc == false) {
						self.addDoc(item);
					}
				} else {
					self.fillUploadedDocs(item);
				}

				item.removeDoc = function(id) {
					var temp = this;

					$.each(temp.infos(), function(el, k) {
						if (this.id == id) {
							temp.infos.splice(el, 1);
						}
					});

					if (temp.infos().length == 0) {
						self.addDoc(temp);
					}
				};

				item.addDocInfo = function () {
					console.log('UploadDocsPartFormViewModel item.addDocInfo ');
					self.addDoc(this);
				};
			}

			// вызываем окно для выбора опциональных документов
			self.addOtherDocs = function() {
				var modalDialog = self.modalDialog();
				modalDialog.showModalWindow('Nvx.ReDoc.Workflow.UploadDocsForm/Web/View/OtherDocsSelectionView.tmpl.html',
					//Вью-модель для этого окна.
					new OtherDocsSelectionViewModel(modalDialog, self)
				);
			};

			// заполнение данными списка опциональных документов	
			var otherList = model.otherDocInfos;
			var hideAddButton = true;
			for (var j = 0; j < otherList.length; j++) {
				var newItem = otherList[j];
				newItem.index = 0;
				newItem.validateDigits = self.validateDigits; // проверка ввода числа

				newItem.otherDocVisible = ko.observable(false);
				if (model.isOtherDocumentsExpand == true) {
					newItem.otherDocVisible(true);
				}

				if (newItem.infos.length == 0) {
					newItem.infos = ko.observableArray();

					if (newItem.isMultiDoc == false) {
						self.addDoc(newItem);
					}
				} else {
					self.fillUploadedDocs(newItem);
				}

				newItem.removeDoc = function(id) {
					var temp = this;

					$.each(temp.infos(), function(el, k) {
						if (this.id == id) {
							temp.infos.splice(el, 1);
						}
					});

					if (temp.infos().length == 0) {
						self.addDoc(temp);
					}
				};

				newItem.addDocInfo = function () {
					console.log('UploadDocsPartFormViewModel newItem.addDocInfo ');
					self.addDoc(this);
				};

				if (newItem.otherDocVisible() == false) {
					hideAddButton = false;
				}
				self.otherItems.push(newItem);
			}
			// если все элементы видны или список необязательных документов должен быть развернут
			if (hideAddButton == true || model.isOtherDocumentsExpand == true) {
				self.haveOtherDoc(false);
			}
		};

		return UploadDocsPartFormViewModel;
	});
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Api/Certificates/certificatesWindowVm',
		[
			'knockout',
			'jquery',
		],
	function (ko, $) {
		return function (certificatesPaveArray, title) {
			var self = this;
			//титул окна
			self.title = ko.observable('');
			if (title && title !='') {
				self.title(title);
			} else {
				self.title('Выберите сертификат для подписи');
			}
			//сертификаты для отображения.
				self.certificates = certificatesPaveArray != null ? ko.observableArray(certificatesPaveArray) : null;
		};
	})
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Api/Certificates/certificatePave',
		[
			'knockout',
			'jquery',
			'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Api/dateFormater',
			'jqueryExtention',
			'filesaver',
			],
	function (ko, $, dateFormater) {
		return function (instance) {
			var self = this;
			//thumbprint сертификата (идентификатор плашки).
			self.thumbprint = ko.observable('');
			//Флаг валидности сертификата.
			self.valid = ko.observable(false);
			//Имя владельца сертификата.
			self.subjectName = ko.observable('');
			//Имя владельца сертификата.
			self.subjectTitle = ko.observable('');
			//e-mail владельца сертификат.
			self.subjectEmail = ko.observable('');
			//Наименование органа, выпустившего сертификат.
			self.issuerName = ko.observable('');
			self.issuerTitle = ko.observable('');
			//Дата до которой сертификат действителен.
			self.validToDate = ko.observable('');

			self.issuerStr = ko.computed(function () {
				return 'Издатель: ' + self.issuerName();
			});

			self.validToDateStr = ko.computed(function () {
				return 'Действителен по: ' + dateFormater.toDateString(self.validToDate());
			});

			//Сокращает имя владельца сертификата
			self.getShortField = function (name, maxLength) {
				if (name.length > maxLength) {
					name = name.substring(0, maxLength - 3) + "...";
				}
				return name;
			};

			if (instance != null) {
				//Идентификатор.
				self.thumbprint(instance.thumbprint);
				//Имя владельца сертификата.
				self.subjectName(self.getShortField(instance.subjectName, 40));
				self.subjectTitle(instance.subjectName);
				//e-mail владельца сертификата.
				self.subjectEmail(instance.subjectEmail);
				//Имя издателя.
				self.issuerName(self.getShortField(instance.issuerName, 35));
				self.issuerTitle(instance.issuerName);
				//Дата окончания действия сертификата.
				self.validToDate(new Date(instance.validToDate));
				//Валиден ли сертификат.
				self.valid(instance.valid);
				//Сам сертификат в BASE64.
				self.exportedBase64 = instance.exportedBase64;
			}

			//Действие при клике по сертификату. ВЫНЕС В МОДЕЛЬ-РОДИТЕЛЬ
			//self.action = function() ;

			//Действие при клике по области информации о сертификате.
			self.saveCertificate = function () {
				//var str1 = atob(self.exportedBase64);
				var str1 = '{0}\r\n{1}\r\n{2}'.format('-----BEGIN CERTIFICATE-----', self.exportedBase64, '-----END CERTIFICATE-----');
				var blob = new Blob([str1], { type: 'application/octet-stream' });
				var fileName = self.subjectName() + '.cer';
				saveAs(blob, fileName);

			};

			//Идентификатор представления.
			self.rightSideTemplateId = ko.observable('Nvx.ReDoc.WebInterfaceModule/View/Certificates/rightSideCertificatePave.tmpl.html');
			self.timerId = null;
			//Функция: меняет состояние - наведена ли мышь на плашку.
			self.mouseenter = function (data, event) {
				if (self.rightSideTemplateId() !== 'Nvx.ReDoc.WebInterfaceModule/View/Certificates/detailsRightSideCertificatePave.tmpl.html') {
					var targetEl = event.target;
					if (!$(targetEl).hasClass('more_block')) {
						targetEl = $(event.target).parent()[0];
					}
					var mousemove = function (e) {
						if (e.target !== targetEl &&
							$(e.target).parent()[0] !== targetEl
							//&&
							//$.inArray(targetEl, $(e.target).parents().map(function(item){ return item[0]})) ==-1
							) {
							self.rightSideTemplateId('Nvx.ReDoc.WebInterfaceModule/View/Certificates/rightSideCertificatePave.tmpl.html');
							$(document).unbind('mousemove', mousemove);
						}
					};
					$(document).bind('mousemove', mousemove);
				}
				self.rightSideTemplateId('Nvx.ReDoc.WebInterfaceModule/View/Certificates/detailsRightSideCertificatePave.tmpl.html');
			};
		};
	})
define('Nvx.ReDoc.Rpgu.Reception/Web/Scripts/Level1Model',
	[
		'knockout'
	],
	function(ko) {
		var Level1Model = function (groupName, callFunction) {
			var self = this;

			self.name = ko.observable(groupName);
			self.places = ko.observableArray([]);
			self.placesVisible = ko.observable(false),
			self.changeVisibility = function() {
				this.placesVisible(!this.placesVisible());
			};

			self.goLevel2 = callFunction;
		};

		return Level1Model;
	});
define('Nvx.ReDoc.Rpgu.Reception/Web/Scripts/Reception1PlaceViewModel',
	[
		'jquery',
		'knockout',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'Nvx.ReDoc.Rpgu.Reception/Web/Scripts/Level1Model'
	],
	function($, ko, modal, Level1Model) {
		var Reception1PlaceViewModel = function(goLevel2) {
			var self = this;

			self.level1objects = ko.observableArray([]);

			self.load(goLevel2);
		};

		Reception1PlaceViewModel.prototype.load = function(goLevel2) {
			var self = this;
			//индикатор загрузки
			var url = '/Nvx.ReDoc.Rpgu.Reception/RpguReceptionController/GetPlaces';
			var troberId = modal.CreateTrobberDiv2();

			var model = {};
			if (window.getUrlVarsFunction != null) {
				var type = window.getUrlVarsFunction()['type'];
				if (type != null)
					model.type = type;
			}

			$.ajax({ url: url, method: 'POST', data: model })
				.done(function(response) {
					if (response.hasError) {
						//обработка ошибки
						modal.errorModalWindow(response.errorMessage);
					} else if (response.result != null && response.result.placeList != null && response.result.placeList.length > 0) {
						var group = new Level1Model(response.result.placeList[0].groupName, goLevel2);

						for (var i = 0; i < response.result.placeList.length; i++) {
							if (response.result.placeList[i].groupName != group.name()) {
								self.level1objects.push(group);
								group = new Level1Model(response.result.placeList[i].groupName, goLevel2);
							}
							group.places.push(response.result.placeList[i]);
						}

						self.level1objects.push(group);
					}
				})
				.fail(function(jqXHR, textStatus, errorThrown) {
					var error = errorThrown + '</br>' + jqXHR.responseText;
					modal.errorModalWindow(error);
				}).always(function() {
					//Выключаем троббер
					modal.CloseTrobberDiv2(troberId);
				});
		};

		return Reception1PlaceViewModel;
	});
define('Nvx.ReDoc.Rpgu.Reception/Web/Scripts/Reception2ServiceViewModel',
	[
		'jquery',
		'knockout',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction'
	],
	function($, ko, modal) {
		var Reception2ServiceViewModel = function(item, goLevel3) {
			var self = this;

			self.level2objects = ko.observableArray([]);
			self.goLevel3 = goLevel3;
			self.load(item);
		};

		Reception2ServiceViewModel.prototype.load = function(item) {
			var self = this;

			var url = '/Nvx.ReDoc.Rpgu.Reception/RpguReceptionController/GetServices?placeId=' + item.recId;
			var troberId = modal.CreateTrobberDiv2();
			$.ajax({ url: url, method: 'GET'/*, data: model*/ })
				.done(function(response) {
					if (response.hasError) {
						//обработка ошибки
						modal.errorModalWindow(response.errorMessage);
					} else if (response.result.serviceList != null && response.result.serviceList.length > 0) {

						for (var i = 0; i < response.result.serviceList.length; i++) {
							self.level2objects.push(response.result.serviceList[i]);
						}
					}
				}).fail(function(jqXHR, textStatus, errorThrown) {
					var error = errorThrown + '</br>' + jqXHR.responseText;
					modal.errorModalWindow(error);
				}).always(function() {
					//Выключаем троббер
					modal.CloseTrobberDiv2(troberId);
				});
		};

		return Reception2ServiceViewModel;
	});
define('Nvx.ReDoc.Rpgu.Reception/Web/Scripts/Reception3DateViewModel',
	[
		'jquery',
		'knockout',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/knockout/customBindingHandlers'
	],
	function($, ko, modal, customBindingHandlers) {
		var Reception3DateViewModel = function (place, service, goLevel4) {
			var self = this;

			self.level3objects = ko.observableArray([]);

			self.goLevel4 = goLevel4;

			self.dateFrom = ko.observable();
			self.dateTo = ko.observable();

			self.place = place;
			self.service = service;

			self.date1 = ko.observable();
			self.date2 = ko.observable();
			self.date3 = ko.observable();
			self.date4 = ko.observable();
			self.date5 = ko.observable();

			//Информация различная текстовая
			self.info = ko.observable();
			self.load();

			self.nextWeek = function() {
				self.dateFrom(self.addDays(self.dateFrom(), 7));
				self.dateTo(self.addDays(self.dateTo(), 7));
				self.load();
			};

			self.prevWeek = function() {
				self.dateFrom(self.addDays(self.dateFrom(), -7));
				self.dateTo(self.addDays(self.dateTo(), -7));
				self.load();
			};
		};

		Reception3DateViewModel.prototype.addDays = function(date, days) {
			var result = new Date(date);
			result.setDate(result.getDate() + days);
			return result;
		};

		Reception3DateViewModel.prototype.load = function() {
			var self = this;
			var data1 = JSON.stringify(self.place);
			var data2 = JSON.stringify(self.service);

			self.level3objects.removeAll();
			self.info(null);
			
			var model = { level1: data1, level2: data2 };
			if (self.dateFrom() != null)
				model.dateFrom = self.dateFrom().toLocaleDateString();
			if (self.dateTo() != null)
				model.dateTo = self.dateTo().toLocaleDateString();

			var url = '/Nvx.ReDoc.Rpgu.Reception/RpguReceptionController/GetSpecialists';
			var troberId = modal.CreateTrobberDiv2();
			$.ajax({ url: url, method: 'POST', data: model })
				.done(function(response) {
					if (response.hasError) {
						//обработка ошибки
						modal.errorModalWindow(response.errorMessage);
					} else {
						self.dateFrom(new Date(response.result.dateFrom));
						self.dateTo(new Date(response.result.dateTo));

						self.date1(self.addDays(self.dateFrom(), 1));
						self.date2(self.addDays(self.dateFrom(), 2));
						self.date3(self.addDays(self.dateFrom(), 3));
						self.date4(self.addDays(self.dateFrom(), 4));
						self.date5(self.addDays(self.dateFrom(), 5));

						if (response.result.schedule.length > 0) {
							for (var i = 0; i < response.result.schedule.length; i++) {
								response.result.schedule[i].goLevel4 = function (timeInfo, specInfo) {
									self.goLevel4(timeInfo, specInfo);
								};

								self.level3objects.push(response.result.schedule[i]);
							}
						} else {
							self.info('Не найдено ни одного специалиста для заданного периода');
						}
					}
				})
				.fail(function(jqXHR, textStatus, errorThrown) {
					var error = errorThrown + '</br>' + jqXHR.responseText;
					modal.errorModalWindow(error);
				}).always(function() {
					//Выключаем троббер
					modal.CloseTrobberDiv2(troberId);
				});
		};

		return Reception3DateViewModel;
	});
define('Nvx.ReDoc.Rpgu.Reception/Web/Scripts/Reception4PositionViewModel',
	[
		'jquery',
		'knockout',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/knockout/customBindingHandlers'
	],
	function($, ko, modal, customBindingHandlers) {
		var Reception4PositionViewModel = function (place, service, date, specialistExist, specialist, goLevel5) {
			var self = this;

			self.level4objects = ko.observableArray([]);

			self.currentDay = ko.observable(new Date(date.date));

			self.goLevel5 = goLevel5;

			self.place = place;
			self.service = service;
			self.date = date;
			self.specialist = specialistExist === true ? specialist : null;

			//Информация различная текстовая
			self.info = ko.observable();

			self.load();

			self.nextDay = function() {
				self.currentDay(self.addDays(self.currentDay(), 1));
				self.date.date = self.currentDay();
				self.load();
			};

			self.prevDay = function() {
				self.currentDay(self.addDays(self.currentDay(), -1));
				self.date.date = self.currentDay();
				self.load();
			};
		};

		Reception4PositionViewModel.prototype.addDays = function (date, days) {
			var result = new Date(date);
			result.setDate(result.getDate() + days);
			return result;
		};

		Reception4PositionViewModel.prototype.load = function () {
			var self = this;
			var data1 = JSON.stringify(self.place);
			var data2 = JSON.stringify(self.service);
			var data3 = JSON.stringify(self.date);
			var data3Spec = null;
			if (self.specialist != null)
				data3Spec = JSON.stringify(self.specialist);

			self.level4objects.removeAll();
			self.info(null);

			var model = { level1: data1, level2: data2, level3: data3 };
			if (data3Spec != null)
				model.level31 = data3Spec;

			var url = '/Nvx.ReDoc.Rpgu.Reception/RpguReceptionController/GetTimeSlots';
			var troberId = modal.CreateTrobberDiv2();
			$.ajax({ url: url, method: 'POST', data: model })
				.done(function(response) {
					if (response.hasError) {
						//обработка ошибки
						modal.errorModalWindow(response.errorMessage);
					} else {
						if (response.result.positions == null || response.result.positions.length == 0) {
							self.info('Не найдено интервалов для записи на выбранный день');
						} else {
							for (var i = 0; i < response.result.positions.length; i++) {
								self.level4objects.push(response.result.positions[i]);
							}
						}
						response.result.date = response.result.date.split('T')[0];
						self.currentDay(new Date(response.result.date));
					}
				}).fail(function(jqXHR, textStatus, errorThrown) {
					var error = errorThrown + '</br>' + jqXHR.responseText;
					modal.errorModalWindow(error);
				}).always(function() {
					//Выключаем троббер
					modal.CloseTrobberDiv2(troberId);
				});
		};

		return Reception4PositionViewModel;
	});
define('Nvx.ReDoc.Rpgu.Reception/Web/Scripts/Reception5FieldsViewModel',
	[
		'jquery',
		'knockout',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'knockout-jqueryui/datepicker',
		'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/jquery-ui/datepicker'
	],
	function($, ko, modal) {
		var Reception5FieldsViewModel = function (goLevel6, service, bookingExist, userInfo) {
			var self = this;

			self.fields = ko.observableArray([]);
			self.service = service;
			self.goLevel6 = goLevel6;
			self.userInfo = userInfo;

			self.buttonText = bookingExist === true ? "Забронировать приём" : "Записаться на приём";

			self.goReception = function() {
				self.goLevel6(self.fields);
			};

			self.load();
		};

		Reception5FieldsViewModel.prototype.load = function() {
			var self = this;

			self.fields.removeAll();
			var data2 = JSON.stringify(self.service);

			var model = { level2: data2 };

			var url = '/Nvx.ReDoc.Rpgu.Reception/RpguReceptionController/GetReceptionFields';
			var troberId = modal.CreateTrobberDiv2();
			$.ajax({ url: url, method: 'POST', data: model})
				.done(function(response) {
					if (response.hasError) {
						//обработка ошибки
						modal.errorModalWindow(response.errorMessage);
					} else {
						if (response.result == null || response.result.length == 0) {
							self.goLevel6();
						} else {
							for (var i = 0; i < response.result.length; i++) {
								var userInfo = self.userInfo;
								if (userInfo != null) {
									var lastName = '', firstName = '', middleName = '', medicalPolicy = '', mobilePhone = '', birthDate = '';
									//проставим фио
									if (!self.isEmpty(userInfo.fio)) {
										var fio = userInfo.fio.trim().split(' ');
										if (fio.length == 3) {
											lastName = fio[0];
											firstName = fio[1];
											middleName = fio[2];
										}
									}
									if (!self.isEmpty(userInfo.mobilePhone))
										mobilePhone = userInfo.mobilePhone;
									if (!self.isEmpty(userInfo.birthDate))
										birthDate = userInfo.birthDate;
									if (!self.isEmpty(userInfo.medicalPolicy))
										medicalPolicy = userInfo.medicalPolicy;

									response.result.forEach(function(field) {
										switch (field.name) {
											case 'LastName':
											case 'Family':
												field.value = lastName;
												break;
											case 'FirstName':
											case 'Name':
												field.value = firstName;
												break;
											case 'MiddleName':
											case 'Patronymic':
												field.value = middleName;
												break;
											case 'N_POL':
												field.value = medicalPolicy;
												break;
											case 'Phone':
												field.value = mobilePhone;
												break;
											case 'Birthday':
												field.value = birthDate;
												break;
										}
									});
								}
								self.fields.push(response.result[i]);
							}
						}
					}
				})
				.fail(function(jqXHR, textStatus, errorThrown) {
					var error = errorThrown + '</br>' + jqXHR.responseText;
					modal.errorModalWindow(error);
				}).always(function() {
					//Выключаем троббер
					modal.CloseTrobberDiv2(troberId);
				});
		};

		Reception5FieldsViewModel.prototype.isEmpty = function (str) {
			return (!str || 0 === str.length);
		};

		return Reception5FieldsViewModel;
	});
define('Nvx.ReDoc.Rpgu.Reception/Web/Scripts/Reception6CreateViewModel',
	[],
	function() {
		var Reception6CreateViewModel = function(goLevel7, cancelReserve) {
			var self = this;

			self.goLevel7 = goLevel7;
			self.cancelReserve = cancelReserve;

			self.goReception = function() {
				self.goLevel7();
			};

			self.cancelReceptionReserve = function () {
				//todo cancel reserve method
				console.log('todo cancel reserve');
			};
		};

		return Reception6CreateViewModel;
	});
define('Nvx.ReDoc.Rpgu.Reception/Web/Scripts/ReceptionFormViewModel',
	[
		'require',
		'jquery',
		'knockout',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'Nvx.ReDoc.Rpgu.Reception/Web/Scripts/Reception1PlaceViewModel',
		'Nvx.ReDoc.Rpgu.Reception/Web/Scripts/Reception2ServiceViewModel',
		'Nvx.ReDoc.Rpgu.Reception/Web/Scripts/Reception3DateViewModel',
		'Nvx.ReDoc.Rpgu.Reception/Web/Scripts/Reception4PositionViewModel',
		'Nvx.ReDoc.Rpgu.Reception/Web/Scripts/Reception5FieldsViewModel',
		'Nvx.ReDoc.Rpgu.Reception/Web/Scripts/Reception6CreateViewModel'
	],
	function(require, $, ko, modal, Reception1PlaceViewModel, Reception2ServiceViewModel, Reception3DateViewModel, Reception4PositionViewModel, Reception5FieldsViewModel, Reception6CreateViewModel) {
		var ReceptionFormViewModel = function() {
			var self = this;

			self.opened = ko.observable(false);
			self.status = ko.observable();
			//Данные авторизованного пользователя
			self.userInfo = ko.observable({});

			//Выбранное место записи
			self.place = ko.observable(null);
			//Выбранное направление
			self.service = ko.observable(null);
			//Выбранная дата
			self.date = ko.observable(null);
			//выбранный специалист
			self.specialist = ko.observable(null);
			//Выбранный слот
			self.position = ko.observable(null);
			//Пользовательские поля
			self.fields = ko.observableArray([]);
			//Признак наличия шага выбора специалиста у данной услуги
			self.isSpecialistStepExists = ko.observable(false);
			//Признак наличия шага бронирования данной услуги
			self.isBookingExists = ko.observable(false);
			//Признак наличия шага отмены бронирования данной услуги
			self.isCancelBookingExists = ko.observable(false);
			//Признак наличия шага отказа от данной услуги
			self.isCancelServiceExists = ko.observable(false);

			self.commonInfoString = ko.observable(null);

			self.dateFrom = ko.observable(null);
			self.dateTo = ko.observable(null);

			self.placeholderTemplateId = 'placeholderTemplate';

			self.templateViewModel = ko.observable();
			self.templateId = ko.observable(self.placeholderTemplateId);

			//1) загрузка мест записи
			self.goLevel1 = function() {
				self.place(null);
				self.service(null);
				self.date(null);
				self.specialist(null);
				self.position(null);
				self.isSpecialistStepExists(false);
				self.isBookingExists(false);
				self.isCancelBookingExists(false);
				self.isCancelServiceExists(false);
				self.commonInfoString(null);

				self.templateId(self.placeholderTemplateId);
				self.templateViewModel(null);

				self.templateViewModel(new Reception1PlaceViewModel(self.goLevel2));
				self.templateId('Nvx.ReDoc.Rpgu.Reception/Web/View/Reception1Place.tmpl.html');
			};

			//2) загрузка направлений выбранного места записи
			self.goLevel2 = function(itemLevel1) {
				self.service(null);
				self.date(null);
				self.specialist(null);
				self.position(null);
				self.isSpecialistStepExists(false);
				self.isBookingExists(false);
				self.isCancelBookingExists(false);
				self.isCancelServiceExists(false);
				self.commonInfoString(null);

				if (itemLevel1 != null && itemLevel1.id != null)
					self.place(itemLevel1);
				self.templateId(self.placeholderTemplateId);
				self.templateViewModel(null);

				self.templateViewModel(new Reception2ServiceViewModel(self.place(), self.goLevel3));
				self.templateId('Nvx.ReDoc.Rpgu.Reception/Web/View/Reception2Service.tmpl.html');
			};

			//3) загрузка специалистов выбранного направления выбранного места ...
			self.goLevel3 = function(itemLevel2) {
				self.date(null);
				self.specialist(null);
				self.position(null);
				self.commonInfoString(null);

				if (itemLevel2 != null && (itemLevel2.recId != null || itemLevel2.id != null)) {
					//woodstick for softrust
					if (itemLevel2.isEnabled == null)
						itemLevel2.isEnabled = true;
					if (itemLevel2.recId == null)
						itemLevel2.recId = itemLevel2.id;
					self.service(itemLevel2);
					self.isSpecialistStepExists(itemLevel2.isSpecialistStepExists);
					self.isBookingExists(itemLevel2.isBookingExists);
					self.isCancelBookingExists(itemLevel2.isCancelBookingExists);
					self.isCancelServiceExists(itemLevel2.isCancelServiceExists);
				}
				self.templateId(self.placeholderTemplateId);
				self.templateViewModel(null);

				self.templateViewModel(new Reception3DateViewModel(self.place(), self.service(), self.goLevel4));
				self.templateId('Nvx.ReDoc.Rpgu.Reception/Web/View/Reception3Date.tmpl.html');
			};

			//4) загрузка расписания выбранной даты у выбранного специалиста ...
			self.goLevel4 = function(itemLevel3, itemLevel3Spec) {
				self.position(null);
				self.commonInfoString(null);

				if (itemLevel3 != null && itemLevel3.ticketCount != null)
					self.date(itemLevel3);
				if (self.isSpecialistStepExists() === true && itemLevel3Spec != null && (itemLevel3Spec.id != null || itemLevel3Spec.recId != null)) {
					if (itemLevel3Spec.id == null)
						itemLevel3Spec.id = itemLevel3Spec.recId;
					self.specialist(itemLevel3Spec);
				}

				self.templateId(self.placeholderTemplateId);
				self.templateViewModel(null);

				self.templateViewModel(new Reception4PositionViewModel(self.place(), self.service(), self.date(), self.isSpecialistStepExists(), self.specialist(), self.goLevel5));
				self.templateId('Nvx.ReDoc.Rpgu.Reception/Web/View/Reception4Position.tmpl.html');
			};

			//5) получение полей для заполнения
			self.goLevel5 = function(itemLevel4) {
				self.commonInfoString(null);
				self.fields.removeAll();
				if (itemLevel4 != null && itemLevel4.id != null)
					self.position(itemLevel4);

				self.templateId(self.placeholderTemplateId);
				self.templateViewModel(null);

				self.templateViewModel(new Reception5FieldsViewModel(self.goLevel6, self.service(), self.isBookingExists(), self.userInfo()));
				self.templateId('Nvx.ReDoc.Rpgu.Reception/Web/View/Reception5Fields.tmpl.html');
			};

			//6) бронирование или запись на приём
			self.goLevel6 = function(fields) {
				self.commonInfoString(null);

				if (fields != null && fields().length > 0) {
					self.fields.removeAll();
					for (var i = 0; i < fields().length; i++) {
						if (fields()[i].isRequired === true && (fields()[i].value == null || fields()[i].value == '')) {
							//обязательное поле не заполнено
							modal.errorModalWindow("Заполнены не все обязательные поля.");
							self.fields.removeAll();
							return;
						}

						self.fields.push(fields()[i]);
					}
				}
				self.reserveOrReception();
			};

			self.goLevel7 = function() {
				self.sendReceptionRequest();
			};

			self.reserveOrReception = function() {
				if (self.isBookingExists() === true) {
					//оформляем бронь
					self.sendReserveReceptionRequest();
				} else {
					//оформляем запись
					self.sendReceptionRequest();
				}
			};

			self.cancelReception = function(ticket) {
				var model = {
					ticket: JSON.stringify(ticket),
					level2: ticket.service.recId
				};

				var url = '/Nvx.ReDoc.Rpgu.Reception/RpguReceptionController/CancelReception';
				var troberId = modal.CreateTrobberDiv2();
				$.ajax({ url: url, method: 'POST', headers: { proxy: true }, data: model })
					.done(function(response) {
						if (response.hasError) {
							//обработка ошибки
							modal.errorModalWindow(response.errorMessage);
						} else {
							self.getUserTickets();
						}
					})
					.fail(function(jqXHR, textStatus, errorThrown) {
						var error = errorThrown + '</br>' + jqXHR.responseText;
						modal.errorModalWindow(error);
					})
					.always(function() {
						//Выключаем троббер
						modal.CloseTrobberDiv2(troberId);
					});
			};

			self.getUserInfo();
			self.goLevel1();
		};

		//Бронирование
		ReceptionFormViewModel.prototype.sendReserveReceptionRequest = function () {
			var self = this;
			self.commonInfoString(null);

			var data1 = JSON.stringify(self.place());
			var data2 = JSON.stringify(self.service());
			var data3 = JSON.stringify(self.date());
			var data31 = JSON.stringify(self.specialist());
			var data4 = JSON.stringify(self.position());
			var data5 = JSON.stringify(self.fields());

			var model = {
				level1: data1,
				level2: data2,
				level3: data3,
				level31: data31,
				level4: data4,
				fields: data5
			};

			var url = '/Nvx.ReDoc.Rpgu.Reception/RpguReceptionController/CreateReceptionReserve';
			var troberId = modal.CreateTrobberDiv2();
			$.ajax({ url: url, method: 'POST', headers: { proxy: true }, data: model })
				.done(function(response) {
					if (response.hasError) {
						//обработка ошибки
						modal.errorModalWindow(response.errorMessage);
					} else {
						self.templateId(self.placeholderTemplateId);
						self.templateViewModel(null);

						if (response.result == null) {
							self.commonInfoString('не удалось произвести бронирование. ');
							return;
						}
						if (response.result.result !== true) {
							var text = 'Не удалось произвести бронирование. ';
							if (response.result.message != null) {
								text += response.result.message;
							}
							self.commonInfoString(text);
							return;
						} else {
							self.place(null);
							self.service(null);
							self.date(null);
							self.specialist(null);
							self.position(null);

							var successText = 'Бронирование успешно. ';
							if (response.result.message != null) {
								successText += response.result.message;
							}
							self.commonInfoString(successText);

							self.templateViewModel(new Reception6CreateViewModel(self.goLevel7));
							self.templateId('Nvx.ReDoc.Rpgu.Reception/Web/View/Reception6Create.tmpl.html');
						}
					}
				})
				.fail(function(jqXHR, textStatus, errorThrown) {
					var error = errorThrown + '</br>' + jqXHR.responseText;
					modal.errorModalWindow(error);
				})
				.always(function() {
					//Выключаем троббер
					modal.CloseTrobberDiv2(troberId);
				});
		};

		//Запись на приём
		ReceptionFormViewModel.prototype.sendReceptionRequest = function() {
			var self = this;

			self.commonInfoString(null);

			var data1 = JSON.stringify(self.place());
			var data2 = JSON.stringify(self.service());
			var data3 = JSON.stringify(self.date());
			var data31 = JSON.stringify(self.specialist());
			var data4 = JSON.stringify(self.position());
			var data5 = JSON.stringify(self.fields());

			var model = {
				level1: data1,
				level2: data2,
				level3: data3,
				level31: data31,
				level4: data4,
				fields: data5
			};

			var url = '/Nvx.ReDoc.Rpgu.Reception/RpguReceptionController/CreateReception';
			var troberId = modal.CreateTrobberDiv2();
			$.ajax({ url: url, method: 'POST', headers: { proxy: true }, data: model })
				.done(function(response) {
					if (response.hasError) {
						//обработка ошибки
						modal.errorModalWindow(response.errorMessage);
					} else {
						self.templateId(self.placeholderTemplateId);
						self.templateViewModel(null);

						if (response.result == null) {
							self.commonInfoString('не удалось произвести запись на приём. ');
							return;
						}
						if (response.result.result !== true) {
							var text = 'Не удалось произвести запись на приём. ';
							if (response.result.message != null) {
								text += response.result.message;
							}
							self.commonInfoString(text);
							return;
						} else {
							var successText = 'Запись успешна. Информацию об имеющихся талонах вы можете посмотреть в <a href="{0}">личном кабинете</a>. '.format(window.nvxCommonPath != null && window.nvxCommonPath.cabinetReceptionList != null ? window.nvxCommonPath.cabinetReceptionList : '/cabinet/reception');
							//if (response.result.message != null) {
							//	successText += response.result.message;
							//}
							self.commonInfoString(successText);
							self.place(null);
							self.service(null);
							self.date(null);
							self.specialist(null);
							self.position(null);
						}
					}
				})
				.fail(function(jqXHR, textStatus, errorThrown) {
					var error = errorThrown + '</br>' + jqXHR.responseText;
					modal.errorModalWindow(error);
				})
				.always(function() {
					//Выключаем троббер
					modal.CloseTrobberDiv2(troberId);
				});
		};

		ReceptionFormViewModel.prototype.getUserInfo = function() {
			var self = this;
			$.ajax({ url: '/Nvx.ReDoc.Rpgu.PortalModule/CustomerController/GetCustomerInfo', method: 'GET', headers: { proxy: true } })
				.done(function(response) {
					if (response.hasError !== true)
						self.userInfo(response.result);
					else
						self.userInfo(null);
				})
				.fail(function() {
					self.userInfo(null);
				});
		};

		return ReceptionFormViewModel;
	});
define('Nvx.ReDoc.Rpgu.Reception/Web/Scripts/ReceptionTicketsViewModel',
	[
		'jquery',
		'knockout',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Api/dateFormater',
		'knockout-jqueryui/datepicker',
		'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/jquery-ui/datepicker',
		'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/knockout/customBindingHandlers'
	],
	function ($, ko, modal, dateFormater) {
		var ReceptionTicketsViewModel = function() {
			var self = this;

			self.tickets = ko.observableArray([]);
			self.commonInfoString = ko.observable();

			self.cancelReception = function(ticket) {
				var model = {
					ticket: JSON.stringify(ticket)
				};
				if (ticket.service != null)
					model.level2 = ticket.service.recId;

				var url = '/Nvx.ReDoc.Rpgu.Reception/RpguReceptionController/CancelReception';
				var troberId = modal.CreateTrobberDiv2();
				$.ajax({ url: url, method: 'POST', headers: { proxy: true }, data: model })
					.done(function(response) {
						if (response.hasError) {
							//обработка ошибки
							modal.errorModalWindow(response.errorMessage);
						} else {
							self.tickets.removeAll();
							self.commonInfoString('Запись отменена');
							self.getUserTickets();
						}
					})
					.fail(function(jqXHR, textStatus, errorThrown) {
						var error = errorThrown + '</br>' + jqXHR.responseText;
						modal.errorModalWindow(error);
					})
					.always(function() {
						//Выключаем троббер
						modal.CloseTrobberDiv2(troberId);
					});
			};

			self.printTicket = function(model) {
				var mfcPic = '<img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAA0AKoDAREAAhEBAxEB/8QAHQABAAICAwEBAAAAAAAAAAAAAAcIBQYDBAkBAv/EAD4QAAEDBAEDAgMEBgcJAAAAAAECAwQFBgcRAAgSIRMxFCJBFSMyUQk0YXN0sxYYN3GBkbElM0JSVZWhstL/xAAcAQEAAgMBAQEAAAAAAAAAAAAAAwYCBAUHAQj/xAA/EQABAwIEAwUEBQsFAQAAAAABAAIDBBEFEiExBkFRExRhcbEiMoHBFUJykaEHIzM0NVKSstHh8BYXJDaC4v/aAAwDAQACEQMRAD8A9U+EThE4ROEThE4ROEThE4ROEThE4ROEThE4ROEThE4RU7z31wt27k6Dh7EK4NQqUZ5wV2rPI9ZiKpCFK+FaSCA47sDvVvtRrt8qJ7a5jOMmjjIpyM4+IV84Q4VhxapZ9IAiNwNgDYnTe+th6rVv62+bP+pUX/tg/wDvlW/1TiPVv3f3Xpn+2uAfuv8A4/8A5X1rq0zUp5lCqlRe1x1tCv8AZg9lLAP/AB/kTzKPifEHSNaS2xIHu+Pmoqj8m+BRwSPa192tcR7fMAkfVV5oy1Ox2nVa2tCVH/Ec9Iuvz7oubmS+JwicInCJwicInCJwicInCJwicInCJwicInCJwiob1u9biaAKhhfC9X3WCFRq9XozgIp4PhcaOse8j6KWP937D5/wcDE8TEV4oTrzKtmBYH2lqmqHs8gefifDp18lTjplsqTf2cbZs2nTWYT0/wCL7X30qWlPZHcUdgHZJ1r39zs8rbaN+InsA6xPMq9RYwzAnCvkYXBvIGx10Vycm9NFyYvtF+76jdFMnsMPNMqZYjuIUS4sJBBUSPBPNXEuHpcOgNQ54cARpY81Y+H+PabiCubQxwuaXAm5II0F+QUQtfrMb+IZ/mJ5wof0rftD1CutZ+rS/Yd/KV6iw/1Nj92n/Tnsg2X5EO67PJlgnCJwicInCJwicInCJwicIqi0X9IFayc/1fDF82km3afDrEqhxq+aiHWlSW3exsvIKE+khetd/coJUUhXg9w5UeKNM7oXi1ja6sEvD8go21UTsxIBIty+dl2T16W3V+oumYMse1RXKdLqaaQ/cCagG2hJ+b1PSbCD6iEFPb39wCiFa2ACfv0kx1SKdgv4rE4BJHQmrldYgXy25ePRYTK/6QddDyNUcY4XxNUb+qVHddYnPsuOBJdaOnktNtNrWtKDtKlntTsaGx55HUYpklMUDcxG6mpOHw+Fs9VKGB23+EhbJh7rrtfLVgXtW0Wk/Srqseiya3Kob0oKRKYaQo97T3aDrvSELCkBSCpPg7B5LT4k2oic8CzmjULXrMClpJ44y67XkAH+yxtD6/aJI6cJud7hskU6ca07QaVQm6l6qqhJShCwQ6W09iQlalLPYe0IPuSBzEYm3u3eHDnYBSOwB/f+5sfcWuXW2HkpV6Xs+vdRuOpN9v2sigKj1V+miKmZ8SFBtKD393YnW+8jWvp7+ebVFVd8i7S1lz8UoPo6fsc2bQG+26xPVzW75i2HGtexLrFtSbgddjyaqhhTshmOlIK0s6UnsWru1372kb7fJBHLxzEX0MbWsHvX+Flv8P0cNTM58wuGWNuR81RCy+iVV2XPTrZTk4RBPcUj1hSPUKdIUonRcGydH3P12eVehf36pbCRbNzV0ra/udO6bLfL4/BWgwR+j2VhPLNBygrLKqyKL8TuCaKlj1fVYW0PvA6rt7SsK/Cd619eW+jwltLKJM17Kn4hxAa+ndB2eW9tb9Pgpi6uf7Fqh/HQ/wCaOanFH7Od5t9V2fyb/wDYI/sv/lKoy1+sxv4hn+YnnnMP6Zn2h6r9BVn6tL9h38pXqLD/AFNj92n/AE57GNl+RDuuzyZYJwicInCJwicInCJwicInCLy0ovTPOz11KZ1tmu0mtUQreqlQt+syYD7cRM0TkpRtSkhDra0KIUlJJ7dqT5G+VpmHd5nl7QW3sfir1Jiww+jp3RkO0AcOdrfgu/Tunl7APWJhy07fplaq8aLHgzKxWEQHlx3ZzipCXVhSUlDTaQEBKCflTrZJOz9bQ93rI+zBsNz4rCTEvpDC5nyEAkmwvy0t5rrUOq5S6EeoW+K5VsSVO6aHczklEOdHbcCH2FyFPsqbkJQtKFgr7HGlAHaQRvQ2YZcMmcS3M13MLKVlPj9JGGyBrm7g+Vjp6Fd3AeLsq3SM79Rd12NOoMW5rSr8enwfgltuTJU3TywwyoeoppAaSkKKQVqWe3ejzKmppC2WoeLFwOnmscQq4GGmoo3h2VzbnpbTUqOen/psvXIdiXddt9UG4Ytr2FQKlLo9NlRHmFTayuN3ANtKSFqSnsQpZSPmV6SBsBQ5rUuHyyRudKDZoOUeK3cQxSGnnjjgcMz3NzO092/X/LK4/wCjPpdZpPT3LZrdJqNOkOXHLc9KdEcjrUC2z84S4lJKT+YGtgj6HnXwmN0VNleLG5Va4ke19bdhBFhst76q/wBWtn9/K/8ARHOHxZ7sXmfktnhn3pfJvqVGOGP7U7d/iHP5S+cXA/2hH8fQrtYz+oyfD1CuVz0peequPVzkK0k2O9YLNXZkVyRKjuKisrC1MIbWFKU5rwj20AfJ2PGvPKlxTW0/dTSh13kjQcra69F6d+TXBq04k3EnMIha13tHS5IsA3r8NFUWmRH6hVqdT4rZW/KnRmGkgeVLW6gJH+Z5RaZpfOxrdy5vqvbcQlbDRTSPNg1jyf4SvUGO2plhtolG0ICf8hz2Wy/It1XHL17Zfv7OkXp0w1dzFmNwKEm4rmuVUJEuS0y46W2Y0Zpz5O9RBUVK9h7a1pWpLJJJL2MZtYXJXXpYaempe+VLcxJytbew03JWt1NXUBhrO2IrKrufpV32ld9SqSJKJ9HisTR8PAceLbjraQFt7SlSSAlYUNEqHMPz0UzWl12m6lHdKulllZFle3LsTbU22K/GMHOoXqqoUrMMXN87GtrVKXKZtajUOlRZDpjMuraTImOPoUVqWptR7E9o1rRG+I+1qR2mbKDsF9qe54Y/uzos7hbMSSNegt06rrSM+5gpOE882hd9YhtZLxBT1Fuv06MhDU5h6OXYkwNLCkIcISoLRrtBA0Ppw2d4je1x9pqdwp31UD4x+bl5HcWNiFskDK2Rc11GiYkxPdH2W/RKZTJuQbvDLTjsJbzKXEwYbbiShUl3SipZQW2kE+CshIzErpnBjDtufkP6qA0sVIwzztvmvkb8z4DkOfktshXzd6OsV/F5rzzlsMY6Zq6YK20Hc0z1NF4udveVFAAI7u3663zNsjjUmPllB/FROgjGHNnA9ovIv4WBXy5L8u+F1iWdjiLXnW7bqNmVGpy6cGm+x2S2+lLbhWU94ISSNBQH7OYmVwqhHfS1/VGQMOHOnI9oPAv4WUTYD6qbwpNzXDTuoGrtJtKq3PW6fbF0SEtsMRnoTqw5T5KkJSlG20d7SleVdjidk9o5BT1b2l3b6NubHy5Lfr8Mjc1ppB7Ya3M37Q3Hz6LJ4k6icmX/ANSs92vpeo2N59iyLktykuMNh96E3LbbRUXyU+ohToDqkI7gAhTexvZ5lFUyOmdmFm5bhR1dBBDRM7M5pM+Vx5XtsPLqo5tzqIqOZKVJyHcnWjTsTPT33jRLUgwYjop8dDiktGat9ClvOLAStQSUpAUNfkIG1QmGftA3oFuyYe2jd2LaYyW3cSdfK2yz8zq0vmsdM9sZKfuWDSKtTMkwLWuKrQGUmFOhNyPvpDYcSrsadYKFnQ2n5taHJO+l0LZb29qxUIwmNlZJTgFwyFzRzBtoPMbLb+o3rJxo1imeMJ5voD13rnU5uG3AkNPvrbVLZDwShaVJI9IubJHgb+uuZVNdGI7xvF7j1UOH4POZv+TGclnb+Rt+K4erqP1A4wtG6s2Wd1GVKFTYz8H4O200CEtphLrrLCkh9aVLV8y1L2R9de3FYJ2NMjH220sEwk0lS9lPLCCbG7sx1sCdly5di59wJ09ZBv2odRVSuyrJi000l9+gwohpq/i0JdUkNpKXO9DnbpQ8do15PE5lpYHPLsx05eK+UndcQrI4hEGt1vqTfQ2+5SVj3qmx1fV1U+wJdNuu2bjqsZT8GHcdEep5nBCO5foqUOxZABVoHegSOTxVkcjgzUE9RZaVRhc1PGZbtc0GxLSDbzXa6cbyue86ZfD901hyouUu+KxTIaltIR6URl0JaaAQkbCRvydnz5J4pJHStcXHZxCxxCFkL2BgtdrT8SNV1+p6hyZlp06ux0FSKTLPr6H4W3U9vef2BQQP8ecLiiF0lO2YfUOvkdPVdThuZrKh0R+sNPMa+l1Xmh1qoW3WodepS0IlwHPVb707SfBBSofUEEg/Xz45TaWofSStmj95qttRAyqjdDJs5SrkbqDYuPD9ej09+bbty+kylsMuH7xJeQF+k6nyPk7tg9qgCdb9+Wat4gZU4e8MJZJp6i9j5fFafC/DuXHYBMwSQ3cTfbRptcedvBVHUQFFSiSVq9zsqUo/+VEn+8nlF1J8V+ghZo6ADyAHoArM9NPT5XE1+Jka+6W7T49P++pUCQntedeIID7iD5QlIJKUq0oqIUQABu7cPYFLHIKyqFre6Dv5np4Lx7j3jSnnp3YVhr82b33jaw+q087nc7chfVW55eF42q65gxHlqmZlpvULgSTQZVcNJ+wK9QK0+uPHqsMOeo2pt5CVFt1CvYka0B+0HTkikEvbRb2sQV1qWrp30xo6sEC+ZrhqQeenQqNLyl5pq/U/gJ/LbNqUt56q1lcC2qHIcmOxmBTXA9JkSXEo9TfclIShCUJ/NR9oX9q6ePPYb6Lbi7syhqOwzH3faOl9dAB/dbPZuNuqHpvjVDHuH6PZ182G5NkS7fTWaq7TptFS+6pxcd0pbWl9pK1qKSnSvJ9vAEjGTwexGAW8vBRTVFDiJE1QXNk0zWFwbc99Cv2Ol/IbmD8xMXFcNLrmU8vxXVVCQ33x6ewsM+lGiskgqDTaSQFKGyVHY4FM4Mdc3cd1icSi71E5jS2OPYc/EnxKyN59O2Q6Wq0MtYUrVJouULdosSkViNJK/su44jbaUqjSuwb2kpJbdCe4eB4Hb25Oge0h8Z9rn0KwgroXh9PVAmMkkEbtPh8wvl/446g4eT7R6iMb0y1Jd0/0YFuXXa86ouNRX0FwP90WV2E7Q6VAKUgbSEnR2RzF8crXiZgF7WI/ovsFRSOgfSTlwaHZmuA+GoWq2e/k+o9c9vScqPW6itDH1Se+x6CtbzFGiqmMpbS6+4ErecWrZKuxCR4CQR5ODO0NXd9vd5eanmELcLIhBtnGp5+z05WUhYm6bIbOLrpxrmy3qLXKfW7zqdwtxEuKeaU07L9aOpRKUlKxobA/aCSCRyaKntGWSC+t1p1WIF07ZqYlpDQ37hYrMyMQ3BI6qBlZbFPNpnHq7VW16pDxkKmh7tDYTr0/TBG+738a5l2JMxedrWUfemiiEA94PzfhZRnYeLOprp0p0jGuNbUsTIFkMy33rffrFScps+mMurUssyNMuJfQlSjpSdKI/IaCYWRzQ+wwAt5LenqqLEHdvM5zHn3rC4PiNRZbZljD+W8qYism3rhbtB66KXd9Jr1abgh1imqjx5KlrQ0HAtayGilGlAd5BPyg65nLA+VrQ61wbnotakq4aWaRzL5XNIHXVZjqcwWrKGH6pZ9gW/b8auyZkB9h59pMdKUtS2nHPvEIUpJLaVgaHnevrxU0wmjytABuFhh1d3aoEkpJbZw+8ELIdVeMLpzBgev47swQftepLglj418tM6altOr7lBKiPlbVrx765JUROljyt8FhhtSykqBLJsAfxBHzX76n8ZXPlrAVyY2tD4H7aqjMREf4x5TTPc3IacV3KCVEfK2dePfXMaqJ00JY3fRfcNqY6WrbLLfKL3t4ghaNScWdQeTcoWPemcWrJoNGx6+9UIEC3pMiXInTFtFpKnXXUJDbaQe7tTskgA/mIxDLLI2SWwy9FsvqaOngfFS5nF9gS6wsAb6AKQ8CY8ubHdNvCPdAh+rXLxqtaiGK8XAYsh0KbKtpHavW9p8gfnySmidCxwdzJP3rUrqhlQ9hZsGtHxAUlzYUSpRHoE6O2/GkNqadaWNpWhQ0QR+RHJ3sbI0seLg7rTY90bg5psQq539031SlqeqVivKqEPZUIDytPtD/AJW1nw4B9ArSvYbVylYhw1JFd9Icw6HceR5+qt9DxCySzKoZT1Gx8xyUTU6xavfNZFgxVop9RmKLajMQoBjs+ZZWj8WwEnQ8bOhse/ODTUElbOKX3XHe/K3grZR4zFgkgxF4LmtBsGncnQa9OpVmMW9O1g4xLdTajqrFcSPNTmpSpTZ+vpI/C0P7tq/NR5fMNwOlw2zmjM/947/DoqfxBxniXEF45HZIv3G7f+ju4+enQBSvztKppwi0XLGILNzLb8a37yTU0twZiJ8KTTai9CkxZKApKXW3GlJIUApQ87Hn25FLG2QWcpqerkpHF8dumoB0+K1rFfTLjTFNyyr6pztfr90SovwhrdyVd6pTG4/uWW1uHTaCQCe0An6k8jihZE3ONT4qaoxGasa2N1g3oBYKX+bK004ROEUa5bwNY+ZXaTOuSXcFNqlD9X7NqdDrMinyood7fUCVNKAIV2J2FA+3IJo2vtdbdLWyUlwyxB3BAIXHiHp9xxhZ2qVS1I1SmVuurR9qVusVB2fUJgQT2pW86Se0bOkp0nfnW+IYWRXyrGprpq23aHQbAaAeQUncnWsnCJwicInCJwicInCJwicInCLDy7XoE+txLhk0tlVTgBXoSgntcSFJKSkke40T4OxzXfTxOk7YtGYbHmpWzytiMQccp3HJZjmwok4ROEX/2Q==" >';
				var rdcPic = '<img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAApAHADAREAAhEBAxEB/8QAGwABAAIDAQEAAAAAAAAAAAAAAAYHBAUICQP/xAA4EAABAgUCAwMJBwUAAAAAAAABAgMABAUGBxESCCEiEzEyFBc3UVJXkZXSFUFCcXSztBYkRGSD/8QAHAEBAAIDAQEBAAAAAAAAAAAAAAYHAwQIBQIB/8QAPhEAAQMCAwQECQsFAQAAAAAAAQACAwQRBSExBhJBUQciYXETFTI1NlRygsEWQoGRkpOys8LR0jNSoeHw8f/aAAwDAQACEQMRAD8AvXiMyFftCzJX6ZRb1r1Ok2fJOzl5aovNNI3SzSjtSlQA1JJPLvJMXBsrhdFUYRFJLCxzjvXJa0nyncSFzF0h7QYtRbSVMFNVSMY3cs1r3NAvG0mwBtmc+9Vt528qe8q6fm8x9cSLxJhnq7PsN/ZQn5VY967L94/+SedvKnvKun5vMfXDxJhnq7PsN/ZPlVj3rsv3j/5J528qe8q6fm8x9cPEmGers+w39k+VWPeuy/eP/knnbyp7yrp+bzH1w8SYZ6uz7Df2T5VY967L94/+S7nwZUqjV8TW3U6tPvzk5MSpU7MTDinHHDvUNVKUSSdAO/1RS+0cUcGKTRxNDWg5ACwGQ4LqjYipmq9n6WeocXvc3NziST1jqTmVYEeKpWkESCJBEgiQRIIkEXAXFJ6c7k/KT/iMxd+x/mWH3vxuXJXSd6VVXuflsUJsmh0G5bjlqLcNy/YMrNns0zqpXt0IcPhCxuRtSTy3a8uWvLUj2MQqJ6SmdNTx77m/NvY242yOfYo1glDSYjWMpaufwLXZb+7vAHhfrNsDzvlxyzG+yViep4suxih3JNrVSptQXL1SXl9yXWdRuUlBUOtOvNG71c9CDGjhONxYzSmanHXbqwnQ8M7aHnZettHspPsxiDaWtcTE7yZA2928SG31HFu99NiCs/JmE5yxaFTbwodfauW3Km2lSKjLsFoNLV4UrRuVtB7gSfECkgHv18I2hZiM76SaPwcrfmk3v3Gw/wDM1ubS7FyYHSRYlTSiemePLa21idARc2vzvrcEA61lEkUEXoZw8+he1f0av3VxRG1Hnif2vgF2F0f+jVH7P6irHjwVMUgiQRIIkESCJBEgi4C4pPTncn5Sf8RmLv2P8yw+9+Ny5K6TvSqq9z8tiqmJMoCuprFKrk4d6kM4ANW3IgfYVRXzndQCEdmk+PRWiUHXqBUk9I1itMStSY8zxNnK7y2/N7b8uZ5ZHVXzghOI7Hy/KfKnZ/SefL423Rxscm55i7fJF1qOFR+46nKV+3qxKMzmPjLumoKn1bWmHCnXo15alPNY10ToFag6btrbNtPC6KohJbVXG7u6kdvw56d2j0XSVlSyoo6lodh+6d/fya024d4zcNB5VwbXoq72LalbnqcvaE2/NUVuZWmTdfTtUpvXlr6x3gE6EjQkA8omtA6pfTRuqwBJbrAaXVU4xHRRV8rMPcXQhx3SdSP+0PEZkDRd5cPPoXtX9Gr91cUptR54n9r4BdW9H/o1R+z+ori3I9LwG9nnMdYzLw5ZIv8AVJ1mWWmrW1KTS5SQlxTpcqQ+tqZZQhWuquoHpIOukQuQRGR5kYXZ8O4dqtOB1SKeJsMrW5HI2uesewqysIXi3grD2SMvydn3DQsXOPSE3Y1vV2ppVMjtUJaUQta19gy6+61oFrVtAWokjv2IXeBjc+xDeAJ/6y1KmI1U8cO8HSZ7xAy/2QOxSbFHFJeFUyNQrLyPceHawxd7jzFMNhXGqoTNOfQyp1LU42pStwUlC09q30BYSO5QI/YqgueGvLTfkb/WviooWMiL4w8buu82wOdsv2WHxsSt5z/DRWpHIqaEVzF4STUomjl4INNVPISwHS7zD/Znr29G7w8oVQJiIfzH1XTDnMbVAxX8k68903+i+ih2auDexuHzHdWzbgCu3Fa12Wa0Km279oreZm2ELSXWHUqHUkpBO3XaSAFAg8sctKyBpkiyIWemxGSrlEFSA5rstNO0KeXhxLZuue7qBjbh2xzQqtXZi2ZK561P111aJGRZmWwptpKUOIUVElIB3E9Q6SApScj5pC4Mjbc2ub6LXio6djDLUvIFyABqbLXM8btwSGEa/dF0Y0MpkigXK3ZrtuNulTL1Ud5tlKgVKDZSHDpqrUtkJUQpKoCqPgi4t6wNrdq+jhrTO1jH3YRvX7FYmDr84n6ldc9avEFiei0hnyJM9IVu33yqS3apCpVxK3nFdpzUdwIHSRpoQo5InTFxErR3ha9VFStYH07yeYOvf3Lnnik9OdyflJ/xGYvjY/zLD7343Lj3pO9Kqr3Py2KE2RN2hIXHLT18U+dn6XLntFykoUgvqHhQoqI0R69OZHL79Y9fEGVctO5lE4NeeJvl2i3Hko1gs2HU9aybE2OfG3Mtba7jwBJIy58eHapbljMDmVbhkmppiYplq05SG5WnywSVttgAFe3UIKykaAeFI0A+8ny8FwIYNTuLSHTO1ceJ5c7c+JUh2q2vdtTWRteDHSssGsba4HE2yBdbIcAMhxvn5GzZIVizpDG2OKNM0C2pdseVNuLSXpteuvWpJ5pJ6jz1Urv5ACMGFbPvgq34hiDxJKdLaNHZf6hyC2tottIqvDY8GwWIw0zR1gbbzz2kcOJ/uOuiqOJUq7XoZw8+he1f0av3VxRG1Hnif2vgF2F0f+jVH7P6ivnjXHNas+98mXHVpiRek7zrjFSkm2FqWttlEkywpLoUlICippRASVDaRz15CNxsLXOJ4n4BTiaUSMY0atFv8k/FV2/wu1CYtTIuGTWKe1je5nEVS22ilT0zQZ8upecaDK0dm5Kh9CXEp3jQFaCnRW6MZg6ro/mnTs/0tgVoD2TW64yPaNNdb2y/ytZiPhuyLQshUu575tjBNDp9vlbksuybObZqFScKFISp959rWW26hf8AbkEqJTqE9/xFC5rt5waLchn/AN3LJUVkb4i2NzyT/c7Id1tfpW54iMY5ry7hCsWilq1V3J/UjU7SUyr7zUqaezNBxjtlOjd23ZgbwnoKtdvKMk0ckkZaLXv8VipJoKecPN921jzuRY27L6KA3bjXjh4gKe3jfLkzjq0LKn3m11t+3VTK5yal0OIWWUb1r5qKR96E6a7iodCsLo6iYbklg3ja91sxz0FKfCwhznjS9rX55KS5Nwrney8uMZh4Y5y2HDO0GXt6rUG4C4GC1Lghh1tSCCdqdo03JIKfxBagn7kika/fhI0tYrFBUU74fA1QORuCO3VRN3gxybcGE7jZuW+6aMr3FdbF8CfaSoSMtPspKWmOSddgStwbgghKlDRKgnq+DSvdGbnrE37LrMMRiZO0tafBhu7bjY6q08K07i/nrxduDPdw2fTqBLU/yRig2/LBflc1qD5U664FLRoNRtSvaT+BIGqs0QnLrykW5BalS6jDN2nBJvqeXLJc/cUaVHOdxkJJGkn3D/UZi99jyPEsPvfjcuPuk4E7U1XuflsVU7V+wr4RJ7qB2PJNq/YV8IXSx5JtX7CvhC6WPJNq/YV8IXSx5L0L4egRhe1QR/iK5f8ARcURtR53n7/gF190f+jVJ7P6irHjwVMkgiQRIIkESCJBEgiQRIIkESCJBEgiQRIIkESCJBEgiQRIIv/Z" >';

				var ticketWindow = window.open('', 'printTicketDiv', 'height=500,width=520');
				ticketWindow.document.write('<html><head><meta http-equiv=Content-Type content="text/html; charset=utf-8"><title>Reception ticket</title></head><body style="color:#681F00;background:white; font-size:12.0pt;line-height:115%;font-family:Arial,sans-serif,serif; width: 500px;">');
				var data = '<div style=\'border: solid #CD9660 2px;\'>';
				data += '<table style="padding: 10px;"><tbody><tr><td style="width: 95%; vertical-align: bottom;"><span style="padding: 0 10px; font-size: 20pt; font-weight:400; text-transform: uppercase;">' + model.ticketName + '</span></td>';
				data += '<td style="padding-top:5px; padding-right: 5px">' + mfcPic + '</td></tr></tbody></table>';
				//полоска
				data += '<div style="background-color: #EA5A38; height: 10px;">&nbsp;</div>';
				if (model.place != null) {
					data += '<p style="padding: 0 20px;">Организация: ' + model.place.name + '</p>';
					data += '<p style="padding: 0 20px;">Адрес: ' + model.place.address + '</p>';
				}
				if (model.service != null)
					data += '<p style="padding: 0 20px; margin-bottom: 0;">Услуга: ' + model.service.name + '</p>';
				if (model.ticketDateTime != null)
					data += '<p style="background-color: #CD9660; height: 22px; font-size: 14pt; padding: 10px 20px; margin-top: 5px;margin-bottom:0;">Время приема: ' + dateFormater.toFullDateString(model.ticketDateTime) + '</p>';
				if (model.specialist != null)
					data += '<p style="padding: 0 20px; margin-bottom: 0;">ФИО специалиста: ' + model.specialist.name + '</p>';
				data += '<table style="padding: 0 20px;"><tbody><tr><td style="width: 95%; vertical-align: bottom;"><span style="font-size: 8pt;">Номер в системе: ' + model.recId + '</span><td>';
				data += '<td style="padding-top:5px; padding-right: 5px">' + rdcPic + '</td></tr></tbody></table>';
				data += '<div style="background-color: #EA5A38; height: 10px;">&nbsp;</div>';
				data += '</div>';

				ticketWindow.document.write(data);
				ticketWindow.document.write('</body></html>');
				ticketWindow.document.close(); // necessary for IE >= 10
				ticketWindow.focus(); // necessary for IE >= 10
				ticketWindow.print();
				ticketWindow.close();
			};

			//Получение талонов пользователя
			self.getUserTickets = function() {
				self.tickets.removeAll();

				var url = '/Nvx.ReDoc.Rpgu.Reception/RpguReceptionController/GetUserTickets';
				var troberId = modal.CreateTrobberDiv2();
				$.ajax({ url: url, method: 'POST', headers: { proxy: true } })
					.done(function(response) {
						if (response.hasError) {
							//обработка ошибки
							modal.errorModalWindow(response.errorMessage);
							self.commonInfoString('Не удалось получить информацию о талонах.');
						} else {
							if (response.result != null && response.result.length > 0) {
								var currentDate = new Date();
								for (var i = 0; i < response.result.length; i++) {
									response.result[i].canCancel = (new Date(response.result[i].ticketDateTime) > currentDate);
									self.tickets.push(response.result[i]);
								}
							} else {
								self.commonInfoString('Нет актуальных талонов');
							}
						}
					})
					.fail(function(jqXHR, textStatus, errorThrown) {
						var error = errorThrown + '</br>' + jqXHR.responseText;
						modal.errorModalWindow(error);
					})
					.always(function() {
						//Выключаем троббер
						modal.CloseTrobberDiv2(troberId);
					});
			};

			self.getUserTickets();
		};

		return ReceptionTicketsViewModel;
	});
define('Nvx.ReDoc.Rpgu.Reception/Web/ArmOperator/Scripts/ArmOperatorViewModel',
	[
		'require',
		'jquery',
		'knockout',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'knockout-jqueryui/datepicker',
		'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/jquery-ui/datepicker',
		'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/knockout/customBindingHandlers',
		'fullcalendar.ru'
	],
	function(require, $, ko, modal) {
		var ArmOperatorViewModel = function() {
			var self = this;

			self.tickets = ko.observableArray();
			//Элемент с календарём
			self.calendarElement = ko.observable();
			//выбранная организация
			self.selectedOrg = ko.observable();

			var dtemp = new Date();
			self.selectedDate = ko.observable('{0}.{1}.{2}'.format(dtemp.getDate(), dtemp.getMonth() + 1, dtemp.getFullYear()));
			self.selectedType = ko.observable(null);

			self.selectedTypeOpt = {
				placeholder: 'Выберите тип организации',
				allowClear: false,
				ajax: {
					type: 'GET',
					url: '/Nvx.ReDoc.Rpgu.Reception/ArmOperatorController/GetTypes',
					processResults: function(data) {
						var results = [];
						if (data != null && data.result != null) {
							data.result.forEach(function(item) {
								results.push({ id: item.key, text: item.name });
							});
						} else {
							results.push({ id: null, text: "Результаты отсутствуют" });
						}
						return { results: results };
					}
				}
			};

			self.selectedOrgOpt = {
				placeholder: 'Выберите организацию',
				allowClear: true,
				ajax: {
					type: 'POST',
					url: '/Nvx.ReDoc.Rpgu.Reception/RpguReceptionController/GetPlaces',
					data: function() {
						return {
							type: self.selectedType() || 'all'
						};
					},
					dataType: "json",
					processResults: function(data) {
						var results = [];
						if (data != null && data.result != null && data.result.placeList != null) {
							data.result.placeList.forEach(function(item) {
								results.push({ id: item.recId, text: item.name });
							});
						} else {
							results.push({ id: null, text: "Результаты отсутствуют" });
						}
						return { results: results };
					}
				}
			};

			self.checkIn = function(ticket) {
				self.changeStatus(ticket, true);
			};

			self.checkOut = function(ticket) {
				self.changeStatus(ticket, false);
			};

			self.init = ko.observable(false);

			self.selectedOrg.subscribe(function(v) {
				if (v != null && v != '') {
					if (!self.init())
						self.initCalend();
					else
						$(self.calendarElement()).fullCalendar('refetchEvents');
				}
			});

			self.changeStatus = function(ticket, checkFlag) {
				var model = {
					ticketId: ticket.recId,
					isCheckin: checkFlag
				};

				var url = '/Nvx.ReDoc.Rpgu.Reception/ArmOperatorController/SetTicketStatus';
				var troberId = modal.CreateTrobberDiv2();
				$.ajax({ url: url, method: 'POST', headers: { proxy: true }, data: model })
					.done(function(response) {
						if (response.hasError) {
							//обработка ошибки нашей
							modal.errorModalWindow(response.errorMessage);
						} else if (response.result == null || (response.result.result != true && response.result.message != null)) {
							//обработка ошибки сервера записи
							modal.errorModalWindow(response.result.message);
						} else {
							self.getTickets();
						}
					})
					.fail(function(jqXHR, textStatus, errorThrown) {
						var error = errorThrown + '</br>' + jqXHR.responseText;
						modal.errorModalWindow(error);
					})
					.always(function() {
						//Выключаем троббер
						modal.CloseTrobberDiv2(troberId);
					});
			};
		};

		ArmOperatorViewModel.prototype.initCalend = function() {
			var self = this;
			var tdate = new Date();
			tdate.setDate(tdate.getDate() - 1);
			$(self.calendarElement()).fullCalendar({
				locale: 'ru',
				theme: true,
				themeButtonIcons: {
					prev: 'carat-1-w',
					next: 'carat-1-e',
					prevYear: 'seek-prev',
					nextYear: 'seek-next'
				},
				events: {
					url: '/Nvx.ReDoc.Rpgu.Reception/ArmOperatorController/GetBusyTimeslots/',
					type: 'POST',
					data: function() {
						return {
							placeId: self.selectedOrg()
						};
					}
				},
				allDayDefault: true,
				eventClick: function(calEvent, jsEvent, view) {
					self.selectedDate(calEvent.start.format());
					self.getTickets();
				},
				eventDataTransform: function(data, callb, third) {
					if (tdate < new Date(data.start)) {
						data.color = "#336699";
					} else {
						data.color = "#999999";
					}
					return data;
				}
			});
			self.init(true);
		};

		ArmOperatorViewModel.prototype.getTickets = function() {
			var self = this;

			if (self.selectedOrg() == null || self.selectedOrg() == '' || self.selectedDate() == null || self.selectedDate() == '') {
				modal.errorModalWindow("Необходимо выбрать организацию и дату");
				return;
			}

			self.tickets.removeAll();
			var model = {
				placeId: self.selectedOrg(),
				date: self.selectedDate()
			};

			var url = '/Nvx.ReDoc.Rpgu.Reception/ArmOperatorController/GetTicketsByPlace';
			var troberId = modal.CreateTrobberDiv2();
			$.ajax({ url: url, method: 'POST', data: model })
				.done(function(response) {
					if (response.hasError) {
						//обработка ошибки
						modal.errorModalWindow(response.errorMessage);
					} else {
						self.tickets(response.result);
					}
				})
				.fail(function(jqXHR, textStatus, errorThrown) {
					var error = errorThrown + '</br>' + jqXHR.responseText;
					modal.errorModalWindow(error);
				})
				.always(function() {
					//Выключаем троббер
					modal.CloseTrobberDiv2(troberId);
				});
		};

		ArmOperatorViewModel.prototype.statusToColor = function(status) {
			var result;
			switch (status) {
			case 2:
				//Зарезервировано - синий
				result = '#4395D1';
				break;
			case 4:
				//В работе - зелёный
				result = '#82BE45';
				break;
			case 5:
				//Выполнено - серый
				result = '#999999';
				break;
			default:
				result = '';
				break;
			}
			return result;
		};

		return ArmOperatorViewModel;
	});
define('Nvx.ReDoc.Rpgu.Reception/Web/ArmRegistrator/Scripts/ArmRegistratorViewModel',
	[
		'require',
		'knockout',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'knockout-jqueryui/datepicker',
		'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/jquery-ui/datepicker',
		'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/knockout/customBindingHandlers'
	],
	function(require, ko, modal) {
		var ArmRegistratorViewModel = function() {
			var self = this;

			self.selectedOrg = ko.observable(null);
			self.selectedService = ko.observable(null);
			self.selectedSpec = ko.observable(null);

			var dtemp = new Date();
			self.dateFrom = ko.observable('{0}.{1}.{2}'.format(dtemp.getDate(), dtemp.getMonth() + 1, dtemp.getFullYear()));
			self.timeFrom = ko.observable();
			self.dateTo = ko.observable();
			self.timeTo = ko.observable();
			self.slotLength = ko.observable();
			self.slots = ko.observableArray();

			self.selectedOrgOpt = {
				placeholder: 'Выберите организацию',
				allowClear: false,
				ajax: {
					type: 'POST',
					url: '/Nvx.ReDoc.Rpgu.Reception/RpguReceptionController/GetPlaces',
					dataType: "json",
					processResults: function(data) {
						var results = [];
						if (data != null && data.result != null && data.result.placeList != null) {
							data.result.placeList.forEach(function(item) {
								results.push({ id: item.recId, text: item.name });
							});
						} else {
							results.push({ id: null, text: "Результаты отсутствуют" });
						}
						return { results: results };
					}
				}
			};

			self.selectedServiceOpt = {
				placeholder: 'Выберите услугу',
				allowClear: false,
				ajax: {
					type: 'GET',
					data: function() {
						return { placeId: self.selectedOrg() };
					},
					url: '/Nvx.ReDoc.Rpgu.Reception/RpguReceptionController/GetServices',
					dataType: "json",
					processResults: function(data) {
						var results = [];
						if (data != null && data.result != null && data.result.serviceList != null) {
							data.result.serviceList.forEach(function(item) {
								results.push({ id: item.recId, text: item.name });
							});
						} else {
							results.push({ id: null, text: "Результаты отсутствуют" });
						}
						return { results: results };
					}
				}
			};

			self.selectedSpecOpt = {
				placeholder: 'Выберите специалиста',
				allowClear: false,
				ajax: {
					type: 'POST',
					url: '/Nvx.ReDoc.Rpgu.Reception/ArmRegistratorController/GetSpecialist',
					data: function() {
						return { placeId: self.selectedOrg(), serviceId: self.selectedService() };
					},
					dataType: "json",
					processResults: function(data) {
						var results = [];
						if (data != null && data.result != null && data.result != null) {
							data.result.forEach(function(item) {
								results.push({ id: item.recId, text: item.name });
							});
						} else {
							results.push({ id: null, text: "Результаты отсутствуют" });
						}
						return { results: results };
					}
				}
			};

			self.removeSlot = function(slot) {
				var tmp = self.slots().removeByValue(slot);
				self.slots(tmp);
			};
		};

		ArmRegistratorViewModel.prototype.generate = function() {
			var self = this;

			if (self.isEmpty(self.selectedOrg()) || self.isEmpty(self.selectedService()) || self.isEmpty(self.selectedSpec())) {
				modal.errorModalWindow('Необходимо выбрать организацию, услугу и специалиста');
				return;
			}
			if (self.isEmpty(self.dateFrom()) || self.isEmpty(self.timeFrom()) || self.isEmpty(self.dateTo()) || self.isEmpty(self.timeTo())) {
				modal.errorModalWindow('Необходимо указать даты и время приёма');
				return;
			}
			if (self.dateFromGreaterDateTo()) {
				modal.errorModalWindow('Дата начала приёма должна быть меньше даты конца приёма');
				return;
			}
			if (self.timeFrom() >= self.timeTo()) {
				modal.errorModalWindow('Время начала приёма должно быть меньше времени конца приёма');
				return;
			}
			if (isNaN(self.dateFromDateTime(self.dateFrom(), self.timeFrom()).getDate()) || isNaN(self.dateFromDateTime(self.dateFrom(), self.timeTo()).getDate())) {
				modal.errorModalWindow('Необходимо указать корректные даты и время приёма');
				return;
			}
			if (self.isEmpty(self.slotLength()) || isNaN(self.slotLength())) {
				modal.errorModalWindow('Необходимо указать длительность приёма');
				return;
			}

			self.slots.removeAll();

			var tempSlots = [];

			//генерация на один день, поэтому дата одна и та же, как ограничительная, так и стартовая
			var dateFrom = self.dateFromDateTime(self.dateFrom(), self.timeFrom());
			var dateTo = self.dateFromDateTime(self.dateFrom(), self.timeTo());

			var slotStartTime = dateFrom;
			var slotEndTime = null;

			var canGenerateMore = true;
			do {
				slotEndTime = new Date(slotStartTime.getTime() + self.slotLength() * 60 * 1000);

				//Помещается
				var min = slotStartTime.getMinutes();
				if (min.toString().length == 1)
					min = '0' + min;
				var obj = { date: slotStartTime, name: slotStartTime.getHours() + ':' + min, duration: self.slotLength() * 1 };
				
				slotStartTime = slotEndTime;
				if (slotEndTime > dateTo) {
					//конец рабочего времени превышен
					canGenerateMore = false;
				} else {
					tempSlots.push(obj);
				}
			} while (canGenerateMore)

			self.slots(tempSlots);
		};

		ArmRegistratorViewModel.prototype.save = function() {
			var self = this;
			
			modal.CreateNewModalDialog("newSaveOkDialogDiv", "Данные успешно сохранены", true, true);
		};

		ArmRegistratorViewModel.prototype.isEmpty = function(str) {
			return (!str || 0 === str.length);
		};

		ArmRegistratorViewModel.prototype.dateFromGreaterDateTo = function() {
			var self = this;
			if (self.dateFrom() == self.dateTo())
				return false;
			try {
				var from = self.dateFromDateTime(self.dateFrom());
				var to = self.dateFromDateTime(self.dateTo());
				return from > to;
			} catch(e) {
				console.log(e);
				return false;
			}
		};

		ArmRegistratorViewModel.prototype.dateFromDateTime = function(date, time) {
			var arr = date.split('.');
			if (time == null)
				return new Date('{0}-{1}-{2}'.format(arr[2], arr[1], arr[0]));
			return new Date('{0}-{1}-{2} {3}'.format(arr[2], arr[1], arr[0], time));
		};

		return ArmRegistratorViewModel;
	});
define('Nvx.ReDoc.Rpgu.PortalModule/Portal/Script/Payments/PaymentsCommonViewModel',
	[
		'knockout',
		'jquery',
		'Nvx.ReDoc.Rpgu.HousingUtilities/Script/servicePayViewModel',
		'Nvx.ReDoc.Rpgu.Parking31/Script/ParkingCommonViewModel'
	],
	function(ko, $, ServicePayViewModel, ParkingCommonViewModel) {
		var PaymentsCommonViewModel = function(redocPluginObject, orderId, serviceCode) {
			var self = this;

			self.housingVisible = ko.observable(false);
			self.parkingVisible = ko.observable(false);
			self.housingBlockActive = ko.observable(false);
			self.parking31BlockVisible = ko.observable(false);
			self.parking31CommonViewModelVisible = ko.observable(true);
			self.servicePayViewModelVisible = ko.observable(true);

			self.tab1 = ko.observable(false);
			self.tab2 = ko.observable(false);
			self.tab3 = ko.observable(false);
			self.tab4 = ko.observable(false);

			self.servicePayViewModel = null;
			if (redocPluginObject != null) {
				if (redocPluginObject["Nvx.ReDoc.Rpgu.HousingUtilities"] === true) {
					self.servicePayViewModel = new ServicePayViewModel(orderId, serviceCode);
				} else {
					self.servicePayViewModelVisible(false);
				}
			}

			self.parking31CommonViewModel = null;
			if (redocPluginObject != null) {
				if (redocPluginObject["Nvx.ReDoc.Rpgu.Parking31"] === true) {
					self.parking31CommonViewModel = new ParkingCommonViewModel();
				} else {
					self.parking31CommonViewModelVisible(false);
				}
			}

			self.clicktab1 = function() {
				self.allTabsDisable();
				if (self.servicePayViewModel != null) {
					self.servicePayViewModel.serviceSearchClick();
					self.servicePayViewModel.tabSearch(true);
					self.parking31BlockVisible(false);
					self.housingBlockActive(true);
				}
			};
			self.clicktab2 = function() {
				self.allTabsDisable();
				if (self.servicePayViewModel != null) {
					self.servicePayViewModel.myBillsClick();
					self.servicePayViewModel.tabMy(true);
					self.parking31BlockVisible(false);
					self.housingBlockActive(true);
				}
			};

			self.clicktab3 = function() {
				self.allTabsDisable();
				if (self.parking31CommonViewModel != null) {
					//self.parking31CommonViewModel.abonTabClick();
					self.parking31CommonViewModel.abonTabVisible(true);
					self.housingBlockActive(false);
					self.parking31BlockVisible(true);
				}
			};
			self.clicktab4 = function() {
				self.allTabsDisable();
				if (self.parking31CommonViewModel != null) {
					//self.parking31CommonViewModel.parkingTabClick();
					self.parking31CommonViewModel.parkingTabVisible(true);
					self.housingBlockActive(false);
					self.parking31BlockVisible(true);
				}
			};

			self.allTabsDisable = function() {
				if (self.servicePayViewModel != null) {
					self.servicePayViewModel.tabSearch(false);
					self.servicePayViewModel.tabMy(false);
					self.tab1(false);
					self.tab2(false);

				}
				if (self.parking31CommonViewModel != null) {
					self.parking31CommonViewModel.abonTabVisible(false);
					self.parking31CommonViewModel.parkingTabVisible(false);
					self.tab3(false);
					self.tab4(false);
				}
			};

			if (self.servicePayViewModel != null) {
				self.clicktab1();
			} else if (self.parking31CommonViewModel != null) {
				self.clicktab3();
			}
		};

		PaymentsCommonViewModel.prototype.start = function() {
			var self = this;
			require(['Nvx.ReDoc.WebInterfaceModule/Content/Scripts/_CommonTemplate/redocPlugin'], function(redocPlugin) {
				redocPlugin.pluginInfo().done(function(redocPluginObject) {
					if (redocPluginObject["Nvx.ReDoc.Rpgu.HousingUtilities"] === true) {
						var orderId = window.getUrlVarsFunction()['Order_ID'];
						var serviceCode = window.getUrlVarsFunction()['serviceCode'];
						self.servicePayViewModel = new ServicePayViewModel(orderId, serviceCode);
						self.servicePayViewModelVisible(true);
					} else {
						self.servicePayViewModelVisible(false);
					}

					self.parking31CommonViewModel = null;
					if (redocPluginObject["Nvx.ReDoc.Rpgu.Parking31"] === true) {
						self.parking31CommonViewModel = new ParkingCommonViewModel();
						self.parking31CommonViewModelVisible(true);
					} else {
						self.parking31CommonViewModelVisible(false);
					}
					var wasClicked = false;
					if (window.getUrlVarsFunction != null) {
						var param = window.getUrlVarsFunction(null, '#')[''];
						if (param != null) {
							switch (param) {
							case 'tab1':
								if (self.servicePayViewModel != null) {
									self.clicktab1();
									self.tab1(true);
									wasClicked = true;
								}
								break;
							case 'tab2':
								if (self.servicePayViewModel != null) {
									self.clicktab2();
									self.tab2(true);
									wasClicked = true;
								}
								break;
							case 'tab3':
								if (self.parking31CommonViewModel != null) {
									self.clicktab3();
									self.tab3(true);
									wasClicked = true;
								}
								break;
							case 'tab4':
								if (self.parking31CommonViewModel != null) {
									self.clicktab4();
									self.tab4(true);
									wasClicked = true;
								}
								break;
							}
						}
					}
					if (wasClicked == false) {
						if (self.servicePayViewModel != null) {
							self.clicktab1();
							self.tab1(true);
						} else if (self.parking31CommonViewModel != null) {
							self.clicktab3();
							self.tab3(true);
						}
					}
				});
			});
		};

		return PaymentsCommonViewModel;
	}
);
define('Nvx.ReDoc.Rpgu.Parking31/Script/ParkingCommonViewModel', [
		'knockout',
		'jquery',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Api/dateFormater',
		'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/guid/guid',
		'Nvx.ReDoc.Rpgu.Parking31/Script/ParkingMapViewModel',
		'select2lib',
		'knockout-jqueryui/datepicker',
		'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/knockout/customBindingHandlers',
		'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/jquery-ui/datepicker'
	], function(ko, $, modal, dateFormater, guid, ParkingMapViewModel) {
		var ParkingCommonViewModel = function() {
			var self = this;

			//общее
			//Видимость вкладок
			self.abonTabVisible = ko.observable(false);
			self.parkingTabVisible = ko.observable(false);
			self.parkingTabClick = function() {
			};
			self.abonTabClick = function() {
			};
			self.phone = ko.observable('7');
			self.phoneReadonly = ko.observable(false);
			self.tsNumber = ko.observable();
			self.tsNumber.subscribe(function(value) {
				if (value != null) {
					self.tsNumber(value.toUpperCase());
				}
			});

			//вкладка абонементов//
			self.abonType = ko.observable();
			self.autoType = ko.observable();
			self.abonStartDate = ko.observable(new Date().toLocaleDateString());
			//Номер транзакции
			self.abonTransactionId = ko.observable(null);
			//номер платежа терминальный
			self.abonPaymentId = ko.observable(null);
			//Конечная информация для пользователя по результату оплаты
			self.finalAbonPayInfo = ko.observable(null);
			//номера ТС
			self.numberPlates = ko.observableArray([]);
			//Видимость виджета выбора номера ТС. Если есть номера — показываем его. Если нет — поле для ввода
			self.numberPlatesVisible = ko.observable(false);

			//Недоступность кнопки инициализации оплаты абонементов
			self.abonPayDisabled = ko.computed(function() {
				return !self.isEmpty(self.abonTransactionId())
					|| self.isEmpty(self.abonType())
					|| self.isEmpty(self.tsNumber())
					|| self.isEmpty(self.abonStartDate());
			}, self);

			self.abonTypes = ko.observableArray([]);
			self.abonTypeSelectOpt = {
				placeholder: 'Выберите тип абонемента',
				allowClear: false,
				ajax: {
					type: 'POST',
					url: '/Nvx.ReDoc.Rpgu.Parking31/Abonement31Controller/Abonements',
					dataType: "json",
					processResults: function(data) {
						self.abonTypes.removeAll();
						if (data.result != null) {
							for (var i = 0; i < data.result.length; i++) {
								self.abonTypes.push(data.result[i]);
							}
						}
						return { results: data.result };
					}
				}
			};

			//вкладка парковок//
			self.mapViewModel = ko.observable(null);

			self.autoTypeSelectOpt = {
				placeholder: 'Выберите тип транспортного средства',
				allowClear: false,
				ajax: {
					type: 'POST',
					url: '/Nvx.ReDoc.Rpgu.Parking31/Parking31Controller/VehicleTypes',
					dataType: "json",
					processResults: function(data) {
						return { results: data.result };
					}
				}
			};
			//длительность
			self.parkingTime = ko.observable();
			//Пин плательщика
			/*self.pin = ko.observable();*/
			//Список общих зон, в которых распологаются парковки
			self.commonZoneList = ko.observableArray([]);
			//Массив зон для элемента на форме
			self.zoneSelectArray = ko.observableArray([]);
			//Выбранная для оплаты зона
			self.currentSelectedZone = ko.observable(null);
			//Стоимость оплаты парковки
			self.parkingCostServer = ko.observable(null);
			//Стоимость оплаты парковки, видная пользователю
			self.parkingCost = ko.observable(null);
			//номер транзакции оплаты парковки
			self.parkingTransactionId = ko.observable(null);
			//номер платежа терминальный
			self.parkingPaymentId = ko.observable(null);
			//Сэкономленная сумма
			self.savedSum = ko.observable(null);
			//Текстовый вариант льгот
			self.grantsText = ko.observable(null);
			//окончательные сведения об оплате
			self.finalParkingPayInfo = ko.observable(null);
			self.finalParkingPayInfo2 = ko.observable(null);

			//Недоступность кнопки инициализации оплаты парковки
			self.parkingPayDisabled = ko.computed(function() {
				return !self.isEmpty(self.parkingTransactionId())
					|| self.isEmpty(self.currentSelectedZone())
					|| self.isEmpty(self.tsNumber())
					|| self.isEmpty(self.parkingTime());
			}, self);

			//Видимость кнопки завершения оплаты парковки
			self.parkingFinishVisible = ko.observable(false);

			self.getZoneList();

			self.getUserInfo();
		};

		//инит оплаты абонемента
		ParkingCommonViewModel.prototype.abonPayRequest = function() {
			var self = this;
			if (self.isEmpty(self.abonType())) {
				modal.errorModalWindow('Необходимо выбрать абонемент');
				return;
			}
			if (self.tsNumber() == null || self.tsNumber().length < 8) {
				modal.errorModalWindow('Неверный регистрационный знак ТС (пример для автомобиля: А111АА31)');
				return;
			}
			if (self.isEmpty(self.abonStartDate())) {
				modal.errorModalWindow('Необходимо ввести дату начала действия абонемента');
				return;
			}
			if (self.phone() == null || self.phone().length < 10) {
				modal.errorModalWindow('Необходимо ввести номер телефона, зарегистрированный на портале БПП');
				return;
			}

			var sum = null;
			for (var j = 0; j < self.abonTypes().length; j++) {
				if (self.abonTypes()[j].id === self.abonType()) {
					sum = self.abonTypes()[j].attrs[0];
					break;
				}
			}

			if (sum == null) {
				modal.errorModalWindow('Выбран некорректный абонемент');
			}
			var date;
			if (self.abonStartDate().contains('.')) {
				//дата либо dd.MM.yyyy
				var ar = self.abonStartDate().split('.');
				date = new Date(ar[2], ar[1] - 1, ar[0]);
			} else {
				//либо MM/dd/yyyy
				date = new Date(self.abonStartDate());
			}

			var model = {
				abonementId: self.abonType(),
				vrp: self.tsNumber(),
				start: Date.parse(date),
				sum: sum,
				phone: self.phone()
			};
			$.ajax({
				url: '/Nvx.ReDoc.Rpgu.Parking31/Abonement31Controller/PayRequest',
				method: 'POST',
				data: model,
				success: function(response) {
					if (response.hasError) {
						modal.errorModalWindow(response.errorMessage);
					} else {
						self.abonTransactionId(response.result.transactionId + ". Происходит оплата...");

						var trobberId = modal.CreateTrobberDiv2();
						setTimeout(function() {
							self.abonTransactionId(response.result.transactionId);
							//закрыть троббер
							modal.CloseTrobberDiv2(trobberId);
							//сгенерировать номер платежа
							self.abonPaymentId(guid.create().value);
						}, 5500);
					}
				}
			});
		};

		ParkingCommonViewModel.prototype.abonFinishRequest = function() {
			var self = this;

			if (self.isEmpty(self.abonPaymentId())) {
				modal.errorModalWindow('Необходимо указать номер платежа в системе терминалов');
				return;
			}

			var model = {
				paymentId: self.abonPaymentId(),
				transactionId: self.abonTransactionId()
			};

			$.ajax({
				url: '/Nvx.ReDoc.Rpgu.Parking31/Abonement31Controller/FinishRequest',
				method: 'POST',
				data: model,
				success: function(response) {
					if (response.hasError) {
						modal.errorModalWindow(response.errorMessage);
					} else {
						var info = 'Парковка оплачена с {0} по {1}.'.format(dateFormater.toFullDateString(response.result.start), dateFormater.toFullDateString(response.result.end));
						self.finalAbonPayInfo(info);
					}
				}
			});
		};

		//запрос парковочных мест
		ParkingCommonViewModel.prototype.getZoneList = function() {
			var self = this;
			$.ajax({
				url: '/Nvx.ReDoc.Rpgu.Parking31/Parking31Controller/ParkingZones',
				method: 'POST',
				success: function(response) {
					if (response.hasError) {
						modal.errorModalWindow(response.errorMessage);
					} else {
						if (self.mapViewModel() != null)
							self.mapViewModel(null);
						self.commonZoneList.removeAll();
						self.zoneSelectArray.removeAll();
						var zoneList = [];

						//массив парковочных зон, сгруппированный по зонам ([][])
						var zoneListObject = {};
						response.result.objects.forEach(function(object) {
							if (object.type == 'zones') {
								self.commonZoneList.push(object);
								var title = 'Зона {0} • {1} в час'.format(object.number, object.prices[0].price / 100);
								self.zoneSelectArray.push({ id: object.number, text: title, attr: object.prices });
							} else {
								var zoneKey = object.zone != null ? (object.zone.number != null ? object.zone.number : 'nozone') : 'nozone';
								if (zoneListObject[zoneKey.toString()] == null)
									zoneListObject[zoneKey.toString()] = [];
								zoneListObject[zoneKey.toString()].push(object);
							}
						});

						self.currentSelectedZone(null);

						var keys = Object.keys(zoneListObject);
						for (var i = 0; i < keys.length; i++) {
							zoneList[i] = zoneListObject[keys[i]];
						}

						//Создаём вьюмодель с картой и парковками
						self.mapViewModel(new ParkingMapViewModel(zoneList));
					}
				}
			});
		};

		ParkingCommonViewModel.prototype.parkingPayRequest = function() {
			var self = this;

			if (self.isEmpty(self.currentSelectedZone())) {
				modal.errorModalWindow('Необходимо выбрать зону парковки');
				return;
			}
			if (self.tsNumber() == null || self.tsNumber().length < 8) {
				modal.errorModalWindow('Неверный регистрационный знак ТС (пример для автомобиля: А111АА31)');
				return;
			}
			if (self.parkingTime() == null || self.parkingTime().length < 5) {
				modal.errorModalWindow('Необходимо ввести длительность парковки');
				return;
			}
			var duration = self.parkingTime().split(':')[0] * 60 + self.parkingTime().split(':')[1] * 1;
			var model = {
				zoneNumber: self.currentSelectedZone(),
				vrp: self.tsNumber(),
				/*pin: self.pin(),*/
				duration: duration
			};

			$.ajax({
				url: '/Nvx.ReDoc.Rpgu.Parking31/Parking31Controller/PayRequest',
				method: 'POST',
				data: model,
				success: function(response) {
					if (response.hasError) {
						modal.errorModalWindow(response.errorMessage);
					} else {
						self.parkingTransactionId(response.result.transactionId);
						self.parkingCostServer(response.result.cost);
						self.parkingCost(response.result.cost / 100);
						//Заполнение сэкономленной суммы и льгот
						if (response.result.savedSum != null) {
							self.savedSum(response.result.savedSum / 100);
						} else {
							self.savedSum(null);
						}
						var grantsText = '';
						if (response.result.grants != null) {
							grantsText = '';
							response.result.grants.forEach(function(grant) {
								grantsText += '{0}) {1}. '.format(grant.id, grant.benefitName);
							});
						}
						self.grantsText(grantsText + '<br><center>Происходит оплата...</center>');

						self.parkingFinishVisible(true);

						var trobberId = modal.CreateTrobberDiv2();
						setTimeout(function() {
							self.grantsText(grantsText);
							//закрыть троббер
							modal.CloseTrobberDiv2(trobberId);
							//сгенерировать номер платежа
							self.parkingPaymentId(guid.create().value);
						}, 5500);
					}
				}
			});
		};

		ParkingCommonViewModel.prototype.parkingFinishRequest = function() {
			var self = this;

			if (self.isEmpty(self.parkingPaymentId())) {
				modal.errorModalWindow('Необходимо указать номер платежа в системе терминалов');
				return;
			}

			var model = {
				phone: self.phone(),
				transactionId: self.parkingTransactionId(),
				sum: self.parkingCostServer(),
				paymentId: self.parkingPaymentId()
			};

			$.ajax({
				url: '/Nvx.ReDoc.Rpgu.Parking31/Parking31Controller/FinishRequest',
				method: 'POST',
				data: model,
				success: function(response) {
					if (response.hasError) {
						modal.errorModalWindow(response.errorMessage);
					} else {
						self.parkingFinishVisible(false);
						var tel = self.isEmpty(self.phone()) || self.phone().length < 9 ? '' : 'Введён телефон: ' + self.phone() + '. ';
						var info = 'Парковка оплачена с {0} по {1}.'.format(dateFormater.toFullDateString(response.result.start), dateFormater.toFullDateString(response.result.end));
						var info2 = '{0}Идентификатор транзакции: {1}. Идентификатор платежа: {2}. Спасибо.'.format(tel, self.parkingTransactionId(), self.parkingPaymentId());
						self.finalParkingPayInfo(info);
						self.finalParkingPayInfo2(info2);
						self.parkingTransactionId(null);
					}
				}
			});
		};

		ParkingCommonViewModel.prototype.getUserInfo = function() {
			var self = this;
			$.ajax({ url: '/Nvx.ReDoc.Rpgu.PortalModule/CustomerController/GetCustomerInfo', method: 'GET', headers: { proxy: true } })
				.done(function(response) {
					if (response.hasError !== true) {
						//проставить список номеров ТС, если они есть
						if (response.result.vehiclesData && response.result.vehiclesData && response.result.vehiclesData.vehicles && response.result.vehiclesData.vehicles.length > 0) {
							response.result.vehiclesData.vehicles.forEach(function (plate) {
								self.numberPlates.push({ id: plate.numberPlate, text: plate.numberPlate });
							});
							self.numberPlatesVisible(true);

						}
						//проставить номер телефона, если он есть
						//проставить свойство readonly полю номера телефона, если он есть
						if (!self.isEmpty(response.result.mobilePhone)) {
							var phone = response.result.mobilePhone.replace(/\D/g, '');
							self.phone(phone);
							if (phone.length == 11) {
								self.phoneReadonly(true);
							}
						}
					}
				});
		};

		ParkingCommonViewModel.prototype.isEmpty = function(str) {
			return (!str || 0 === str.length);
		};

		return ParkingCommonViewModel;
	});
define('Nvx.ReDoc.Rpgu.Parking31/Script/ParkingMapViewModel', [
		'knockout',
		'jquery',
		'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/knockout/customBindingHandlers'
	], function(ko, $) {
		var ParkingMapViewModel = function(zoneList) {
			var self = this;

			// Данные о парковках для карты
			self.zonesMapInfo = ko.observableArray([]);
			//Элемент интерфейса с картой
			self.map = ko.observable(null);
			//паркоматы, которые сначала не отображаются
			self.parkomats = ko.observableArray([]);
			//Флаг необходимости отображать паркоматы
			/*self.parkomatsVisible = ko.observable(true);*/

			//добавить элементу функции, нужные для работы с картой
			self.setOpenBallonFunction = function(item, mapInfo) {
				//функия открытия описания метки
				item.openBalloon = function(obj, evn) {
					if (mapInfo.placemark != undefined && mapInfo.placemark != null) {
						try {
							mapInfo.placemark.balloon.open();
						} catch(e) {
							console.error(e);
						}
					}
				};

				//функия открытия описания метки
				item.clickBlock = function(obj, evn) {
					if (typeof mapInfo.setSelectedPoint === 'function') {
						try {
							mapInfo.setSelectedPoint();
						} catch(e) {
							console.error(e);
						}
					}
				};
			};

			self.createMapsPlacemarks(zoneList);
		};

		//создать на карте нужные метки (МФЦ и доп.офисы)
		ParkingMapViewModel.prototype.createMapsPlacemarks = function(zoneList) {
			var self = this;
			var infoList = [];
			self.zonesMapInfo.removeAll();

			zoneList.forEach(function(item1) {
				var localList = [];
				item1.forEach(function(item) {
					var mapInfo = self.formatMapInfo(item);
					localList.push(mapInfo);
					/*if (mapInfo.hint == 'Паркомат') {
						self.parkomats.push(mapInfo);
						if (self.parkomatsVisible() == true) {
							localList.push(mapInfo);
						}
					} else {
						localList.push(mapInfo);
					}*/
				});
				infoList.push(localList);
			});

			self.zonesMapInfo(infoList);
		};

		ParkingMapViewModel.prototype.formatMapInfo = function(item) {
			//Формирование общей информации по метке
			var mapInfo = {
				coords: [item.center.coordinates[1], item.center.coordinates[0]],
				hint: item.number ? 'Зона #' + item.number : item.name,
				location: item.location,
				scrollTo: function() {
					$('#selectedZoneElementId').val(this.zoneNumber || '');
					$('#selectedZoneElementId').trigger('change');
				}
			};
			//платная ли парковка
			mapInfo.location.reverseCoordinates = true;
			//формирование заголовка и атрибутов
			var topLabel;
			if (item.type == 'parkomats') {
				mapInfo.iconColor = '#ABCABC';
				mapInfo.hint = 'Паркомат';
				topLabel = 'Паркомат #' + item.number + '<br><small class="opa">Пункт оплаты</small>';
			} else {
				var number;
				if (item.type == 'parkings' && !item.number && !item.zone) {
					//бесплатная парковка?
				} else {
					if (item.zone)
						number = item.zone.number;
					else
						number = item.number;
				}
				topLabel = number ? 'Зона #' + number : item.name;
				//установка номера зоны для оплаты
				mapInfo.zoneNumber = number;

				if (item.spaces != null && item.spaces.ratio != null) {
					if (item.spaces.ratio === 0) {
						mapInfo.iconColor = '#FF0000';
					} else if (item.spaces.ratio > 50) {
						mapInfo.iconColor = '#58B733';
					} else {
						mapInfo.iconColor = '#FF6900';
					}
				} else {
					mapInfo.iconColor = '#00A1FF';
				}
			}

			var price = '';
			if (item.zone != null) {
				//поле стоимости
				if (Array.isArray(item.zone.prices)) {
					price = '<hr class="opa"/>Платная парковка: ';
					if (item.zone.prices.length == 1) {
						price += '{0} руб/час'.format(item.zone.prices[0].price / 100);
					} else {
						for (var priceId = 0; priceId < item.zone.prices.length; priceId++) {
							var type = item.zone.prices[priceId].vehicleType;
							if (type === 'car') {
								price += 'Легковые';
							} else if (type === 'motorcycle') {
								price += 'Мотоциклы';
							} else if (type === 'truck') {
								price += 'Грузовые';
							}
							price = ': {0} руб/час<br>'.format(item.zone.prices[priceId].price / 100);
						}
					}
				}
			}

			//формирование прочего текста окошка
			var spacesText = '', descriptionInfo = '', addressString = '';
			if (item.spaces != null) {
				if (item.spaces.total != null) {
					spacesText = '<br>';
					if (item.spaces.free != null) {
						spacesText += 'Свободно {0} из {1}'.format(item.spaces.free, item.spaces.total);
					} else {
						spacesText += "Мест всего: " + item.spaces.total;
					}
					if (item.spaces.forDisabled != null) {
						spacesText += '<br>Мест для инвалидов: ' + item.spaces.forDisabled;
					}
				}
			}
			if (item.address != null) {
				addressString = '{0}, {1}<br>'.format(item.address.street, item.address.house);
			}

			if (item.zone != null && item.zone.description != null && item.zone.description != '') {
				descriptionInfo = '<div class="opa">{0}</div>'.format(item.zone.description);
			}
			var anotherDescription = '';
			if (item.description != null && item.description != '')
				anotherDescription += '<br>' + item.description;
			mapInfo.balloonContent = '<b>{0}</b>{3}{1}{4}<hr class="opa"/>{2}{5}'.format(topLabel, spacesText, addressString, descriptionInfo, price, anotherDescription);
			return mapInfo;
		};

		ParkingMapViewModel.prototype.formatZoneInfo = function(zoneObject) {

		};

		return ParkingMapViewModel;
	});
define('Nvx.ReDoc.Rpgu.HousingUtilities/Script/ChargeViewModel',
	[
		'knockout',
		'jquery'
	],
	function(ko, $) {
		var ChargeViewModel = function(model) {
			var self = this;

			if (model != null) {
				self.model = model;
				self.modal = model.modal;
			}

			self.close = function() {
				self.modal.closeModalWindow();
			};

			console.log('ChargeViewModel created');
		};


		return ChargeViewModel;
	});
define('Nvx.ReDoc.Rpgu.HousingUtilities/Script/CounterViewModel',
[
	'knockout',
	'jquery'
],
function(ko) {
	var CounterViewModel = function(model) {
		var self = this;

		console.log('counterViewModel');

		self.id = ko.observable(null);
		self.name = ko.observable(null);
		self.srvCode = ko.observable(null);
		self.format = ko.observable(null);
		self.lastValue = ko.observable(null);
		self.newValue = ko.observable(null);

		if (model != null) {
			self.id(model.counterId);
			self.name(model.counterName);
			self.srvCode(model.srvCode);
			self.format(model.counterFormat);
			self.lastValue(model.counterLastReading);
		}
	};

	return CounterViewModel;
});
define('Nvx.ReDoc.Rpgu.HousingUtilities/Script/customRequestViewModel',
[
	'knockout',
	'jquery',
	'Nvx.ReDoc.Rpgu.HousingUtilities/Script/customRequestViewModel',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction'
],
function (ko, $, RequestViewModel, modal) {
	var RequestViewModel = function (orderId) {
		var self = this;
		
		self.newsModel = ko.observable(null);
		
		/*Данные организации SupplierOrgInfo*/
		self.name = ko.observable(null);
		self.inn = ko.observable(null);
		self.kpp = ko.observable(null);
		self.okato = ko.observable(null);
		self.kbk = ko.observable(null);
		
		/*Данные банковского счёта*/
		self.bankname = ko.observable(null);
		self.bankbik = ko.observable(null);
		self.bankacc = ko.observable(null);

		self.payerIdentifier = ko.observable(null);
		self.amount = ko.observable(null);
		self.narrative = ko.observable(null);
		self.email = ko.observable(null);

		/*Результаты после получения ссылки*/
		self.requestComplete = ko.observable(false);
		self.requestUuid = ko.observable(null);
		/*для отображения комиссии*/
		self.comissionVisible = ko.observable(false);
		self.comissionAmount = ko.observable(null);

		self.orderId = ko.observable(null);
		
		if (orderId != null) {
			self.orderId(orderId);
			console.log(orderId);
			self.getStatus(self.orderId());
		}
	};

	RequestViewModel.prototype.getStatus = function(orderId) {
		var self = this;
		
		$.ajax({ type: 'POST', dataType: 'json', url: "/Nvx.ReDoc.Rpgu.HousingUtilities/AcquirerServiceController/GetStatus", data: { paymentUuid: orderId } })
			.done(function (response) {
				if (response.hasError) {
					//response.errorMessage
				} else {
					//all good
					
					self.name(response.provider);
					self.inn(response.inn);
					self.kpp(response.kpp);
					self.kbk(response.kbk);

					/*self.bankname(response.);
					self.bankbik(response.);
					self.bankacc(response.);*/

					self.payerIdentifier(response.payerIdentifier);
					self.amount(response.amount);
					self.narrative(response.narrative);

					self.requestUuid(null);
				}
			})
			.fail(function () {
				
			})
			.always(function () {
				
			});
	};

	RequestViewModel.prototype.testRequest = function () {
		var self = this;
		var trobberId = modal.CreateTrobberDiv2();

		$.ajax({ type: 'POST', dataType: 'json', url: '/Nvx.ReDoc.Rpgu.HousingUtilities/AcquirerServiceController/RegisterPaymentRequest', data: self.getRequestData() })
			.done(function (response) {
				if (response.hasError) {
					self.requestComplete(false);
					self.requestUuid(null);
					modal.errorModalWindow(response.errorMessage);
				} else {
					self.requestUuid(response.paymentUuid);
					self.requestComplete(true);
					window.open(response.url);
				}
			})
			.fail(function () {
				self.requestComplete(false);
				self.requestUuid(null);
				modal.errorModalWindow("Произошла ошибка на сервере, ответ не получен.");
			})
			.always(function () {
				modal.CloseTrobberDiv2(trobberId);
			});
	};
	
	RequestViewModel.prototype.comissionRequest = function () {
		var self = this;
		var trobberId = modal.CreateTrobberDiv2();

		$.ajax({ type: 'POST', dataType: 'json', url: '/Nvx.ReDoc.Rpgu.HousingUtilities/AcquirerServiceController/ClarifyComissionRequest', data: self.getRequestData() })
			.done(function (response) {
				if (response.hasError) {
					self.comissionAmount(null);
					self.comissionVisible(false);
					modal.errorModalWindow(response.errorMessage);
				} else {
					self.comissionAmount(response.amount);
					self.comissionVisible(true);
				}
			})
			.fail(function () {
				self.comissionAmount(null);
				self.comissionVisible(false);
				modal.errorModalWindow("Произошла ошибка на сервере, ответ не получен.");
			})
			.always(function () {
				modal.CloseTrobberDiv2(trobberId);
			});
	};
	
	RequestViewModel.prototype.authRequest = function () {
		var self = this;
		
		if (self.requestUuid() == null) {
			modal.errorModalWindow("Отсутствует идентификатор заказа.");
			return;
		}

		var trobberId = modal.CreateTrobberDiv2();

		$.ajax({ type: 'POST', dataType: 'json', url: '/Nvx.ReDoc.Rpgu.HousingUtilities/AcquirerServiceController/AuthorizeRequest', data: { paymentUuid: self.requestUuid() } })
			.done(function (response) {
				if (response.hasError) {
					console.log('ответ получен ошибочный');
					//todo
					modal.errorModalWindow(response.errorMessage);
				} else {
					console.log('ответ получен нормальный');
					//todo
				}
			})
			.fail(function () {
				console.log('ответ не получен, в логах что-то должно быть');
				//todo
				modal.errorModalWindow("Произошла ошибка на сервере, ответ не получен.");
			})
			.always(function () {
				modal.CloseTrobberDiv2(trobberId);
			});
	};
	
	RequestViewModel.prototype.getRequestData = function () {
		var self = this;
		return {
			name: self.name(),
			inn: self.inn(),
			kpp: self.kpp(),
			kbk: self.kbk(),
			okato: self.okato(),
			bankname: self.bankname(),
			bankbik: self.bankbik(),
			bancacc: self.bankacc(),
			payerIdentifier: self.payerIdentifier(),
			Amount: self.amount(),
			Narrative: self.narrative(),
			Email: self.email()
		};
	};

	RequestViewModel.prototype.clearData = function () {
		var self = this;
		self.name(null);
		self.inn(null);
		self.kpp(null);
		self.okato(null);
		self.kbk(null);

		self.bankname(null);
		self.bankbik(null);
		self.bankacc(null);

		self.payerIdentifier(null);
		self.amount(0);
		self.narrative(null);
		self.email(null);

		self.requestComplete(false);
		self.requestUuid(null);
		self.comissionAmount(null);
		self.comissionVisible(false);
	};
	
	//todo debug
	RequestViewModel.prototype.fillTest = function () {
		var self = this;
		
		self.name('ОАО "ЕИРКЦ"');
		self.inn('4401095504');
		self.kpp('440101001');
		self.kbk('00000000000000000000');
		self.okato(null);
		self.bankname('Отделение №8640 Сбербанка России г. Кострома');
		self.bankbik('043469623');
		self.bankacc('40702810329000000870');
		self.payerIdentifier('830104722');
		self.amount(31);
		self.narrative('Тестовая оплата ЖКХ в пользу ЕИРКЦ');
		self.email('mail@test.test');
	};

	return RequestViewModel;
});
define('Nvx.ReDoc.Rpgu.HousingUtilities/Script/LkPaymentsListViewModel',
	[
		'jquery',
		'knockout',
		'require',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Api/dateFormater',
		'Nvx.ReDoc.Rpgu.HousingUtilities/Penalty/Script/MvdTaxViewModel',
		'Nvx.ReDoc.Rpgu.HousingUtilities/Script/PaymentViewModel',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/ModalDialog',
		'jqueryExtention'
	], function($, ko, require, modal, dateFormater, MvdTaxViewModel, PaymentViewModel, ModalDialog) {
		var LkPaymentsListViewModel = function() {
			var self = this;
			self.errors = ko.observable(null);
			self.paymentsList = ko.observableArray([]);

			//штрафы
			self.regNumber = ko.observable();
			self.taxes = ko.observableArray([]);
			self.taxNotPayed = ko.observable(true);
			self.taxRequestResultText = ko.observable(null);

			self.taxModalDialog = new ModalDialog();

			self.savedData = ko.observableArray([]);

			//платежи ИПШ
			self.paymentsIpsh = ko.observableArray([]);

			self.loadSavedData();
		};

		LkPaymentsListViewModel.prototype.start = function() {
			var self = this;
			self.paymentsList.removeAll();
			self.taxes.removeAll();
			self.savedData.removeAll();
			self.paymentsIpsh.removeAll();
			self.loadList();
		};

		LkPaymentsListViewModel.prototype.loadList = function() {
			var self = this;

			var trobberId = modal.CreateTrobberDiv2();

			var promise = $.ajax({ url: "/Nvx.ReDoc.Rpgu.HousingUtilities/UntDataController/GetUserPayments", headers: { proxy: true }, method: 'GET' })
				.done(function(response) {
					if (response.hasError) {
						self.paymentsList.removeAll();
						self.errors(response.errorMessage);
					} else {
						if (response.length == 0) {
							self.errors('Нет платежей');
						} else {
							var payUrl = (window.nvxCommonPath != null && window.nvxCommonPath.payView != null ? window.nvxCommonPath.payView : '/portal/payment') + '?Order_ID=';

							for (var i = 0; i < response.length; i++) {
								if (response[i].amount != null)
									response[i].amount = response[i].amount / 100;
								if (response[i].statusCreated == '01.01.0001') {
									response[i].statusCreated = '—';
									response[i].lastStatus = "Отсутствует";
									response[i].statusCss = "fa-question";
								} else if (response[i].lastStatus === "APRP") {
									response[i].lastStatus = "Платеж успешно завершен";
									response[i].statusCss = "fa-check";
								} else if (response[i].lastStatus === "DECL") {
									response[i].lastStatus = "Платеж отклонен";
									response[i].statusCss = "fa-remove";
								}
								response[i].link = payUrl + response[i].orderIdp;
								response[i].goLink = function() {
									window.location = this.link;
								};
								response[i].file1Exist = false;
								response[i].file2Exist = false;
								if (response[i].fileId != null) {
									if (response[i].att != null) {
										response[i].getfile1 = "/WebInterfaceModule/DownloadAttachment?fileId=" + response[i].fileId + "&attachmentId=" + response[i].att;
										response[i].file1Exist = true;
									}
									if (response[i].attPay != null) {
										response[i].file2Exist = true;
										response[i].getfile2 = "/WebInterfaceModule/DownloadAttachment?fileId=" + response[i].fileId + "&attachmentId=" + response[i].attPay;
									}
								}
							}
							self.paymentsList.removeAll();
							self.paymentsList(response);
						}
					}
				})
				.fail(function(jqXHR, textStatus, errorThrown) {
					self.paymentsList.removeAll();
					if (jqXHR.responseJSON)
						self.errors(jqXHR.responseJSON.errorMessage);
					else
						self.errors(jqXHR.responseText);
				})
				.always(function() {
					modal.CloseTrobberDiv2(trobberId);
				});

			return promise;
		};

		LkPaymentsListViewModel.prototype.loadSavedData = function() {
			var self = this;
			self.savedData.removeAll();

			$.ajax({ url: "/Nvx.ReDoc.Rpgu.HousingUtilities/UntDataController/GetUserServices", headers: { proxy: true }, method: 'POST' })
				.done(function(response) {
					if (response != null && response.length > 0) {
						self.savedData(response);
					}
				});
		};

		LkPaymentsListViewModel.prototype.taxRequest = function() {
			var self = this;

			self.taxes.removeAll();
			self.taxRequestResultText(null);

			if (self.regNumber() == null || self.regNumber().length < 7) {
				self.taxRequestResultText('Введите корректный номерной знак');
				return;
			}

			var trobberId = modal.CreateTrobberDiv2();

			$.ajax({ type: 'GET', dataType: 'json', url: "/Nvx.ReDoc.Rpgu.HousingUtilities/PenaltyController/SendMvdRequest", data: { regPointNum: self.regNumber(), flag: self.taxNotPayed() }, headers: { proxy: true } })
				.done(function(response) {
					if (response.hasError) {
						console.log(response.errorMessage);
						modal.errorModalWindow(response.errorMessage);
					} else {
						if (response.item1.length != 0) {
							var newArray = [];
							for (var i = 0; i < response.item1.length; i++) {
								if (response.item1[i].breachDateTime != null)
									response.item1[i].breachDateTime = dateFormater.toFullDateString(response.item1[i].breachDateTime);
								if (response.item1[i].dateSSP != null)
									response.item1[i].dateSSP = dateFormater.toDateString(response.item1[i].dateSSP);
								if (response.item1[i].decisionDate != null)
									response.item1[i].decisionDate = dateFormater.toDateString(response.item1[i].decisionDate);
								response.item1[i].modal = self.taxModalDialog;
								response.item1[i].mvdServiceCode = response.item2;
								newArray.push(response.item1[i]);
							}
							self.taxes(newArray);
						} else {
							self.taxRequestResultText('Не найдена информация по заданным критериям поиска');
						}
					}
				})
				.always(function() {
					modal.CloseTrobberDiv2(trobberId);
				});
		};

		LkPaymentsListViewModel.prototype.taxWindow = function(element) {
			if (element == null)
				return;

			var self = this;
			var model = new MvdTaxViewModel(element, self.modal);
			self.modal.showModalWindow('Nvx.ReDoc.Rpgu.HousingUtilities/Penalty/View/MvdTaxView.tmpl.html', model);
		};

		LkPaymentsListViewModel.prototype.paythis = function(element) {
			if (element == null)
				return;
			var serviceUrl = (window.nvxCommonPath != null && window.nvxCommonPath.payView != null ? window.nvxCommonPath.payView + '?serviceCode=' : '/portal/payment?Service=');
			window.location = serviceUrl + element.mvdServiceCode + '&sum=' + element.decisionSumma;
		};

		/*
		IPSH
		*/

		LkPaymentsListViewModel.prototype.sendPsRequest = function(data) {
			return $.ajax({ url: "/Nvx.ReDoc.Rpgu.HousingUtilities/SmevEpsh/Controller/PsRequest", data: data, headers: { proxy: true }, method: 'POST' });
		};

		LkPaymentsListViewModel.prototype.getPayments = function() {
			var self = this;
			self.paymentsIpsh.removeAll();
			var trobberId = modal.CreateTrobberDiv2();
			self.sendPsRequest({ method: 'getPayments', sdata: "{}" })
				.done(function(response) {
					if (response.hasError) {
						console.log(response.errorMessage);
						self.errors(response.errorMessage);
					} else if (response) {
						for (var i = 0; i < response.length; i++) {
							response[i].paymentHref = '/Nvx.ReDoc.Rpgu.HousingUtilities/SmevEpsh/Controller/GetPdf?method=getPaymentPDF&id=' + response[i].paymentId;
							response[i].errors = self.errors;
							response[i].modal = self.taxModalDialog;
							response[i].sendPsRequest = self.sendPsRequest;
							self.paymentsIpsh.push(response[i]);
						}
					}
				}).always(function() {
					modal.CloseTrobberDiv2(trobberId);
				});
		};

		LkPaymentsListViewModel.prototype.paymentWindow = function(element) {
			if (element == null)
				return;

			var self = this;
			var trobberId = modal.CreateTrobberDiv2();
			self.sendPsRequest({ method: 'getPaymentDetails', sdata: JSON.stringify({ paymentId: self.paymentId }) })
				.done(function(response) {
					if (response.hasError) {
						console.log(response.errorMessage);
						self.errors(response.errorMessage);
					} else if (response) {
						var model = new PaymentViewModel(response, self.modal, element);
						self.modal.showModalWindow('Nvx.ReDoc.Rpgu.HousingUtilities/View/paymentView.tmpl.html', model);
					}
				}).always(function() {
					modal.CloseTrobberDiv2(trobberId);
				});
		};

		return LkPaymentsListViewModel;
	});
define('Nvx.ReDoc.Rpgu.HousingUtilities/Script/orderPayViewModel',
	[
		'knockout',
		'jquery',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'Nvx.ReDoc.Rpgu.HousingUtilities/Script/PayItemModel',
		'Nvx.ReDoc.Rpgu.HousingUtilities/Script/ServiceItemModel',
		'select2lib'
	],
	function(ko, $, modal, PayItemModel, ServiceItemModel) {
		var RequestViewModel = function(orderId) {
			var self = this;

			self.newsModel = ko.observable(null);

			///Видимость блока с данными услуги и реквизитами организации
			self.serviceInfoVisible = ko.observable(false);
			self.payItem = ko.observable();

			self.serviceItem = ko.observable();

			self.payerIdentifier = ko.observable(null);
			self.amount = ko.observable(null);
			self.narrative = ko.observable(null);
			self.textData = ko.observable(null);
			self.commonErrorText = ko.observable(null);
			self.orderId = ko.observable(null);

			if (orderId != null) {
				self.orderId(orderId);
				self.getStatus(orderId);
			}
		};

		//Заполнение информации по услуге
		RequestViewModel.prototype.fillServiceData = function(data) {
			var self = this;

			self.serviceItem(new ServiceItemModel(data));
			self.serviceInfoVisible(true);
		};

		//Получение данных по совершённому платежу
		RequestViewModel.prototype.getStatus = function(orderId) {
			var self = this;
			var trobberId = modal.CreateTrobberDiv2();
			$.ajax({ type: 'POST', dataType: 'json', url: "/Nvx.ReDoc.Rpgu.HousingUtilities/UntDataController/GetStatus", data: { paymentUuid: orderId }, headers: { proxy: true } })
				.done(function(response) {
					if (response.hasError) {
						self.commonErrorText(response.errorMessage);
					} else {
						self.fillServiceData(response.item2);

						self.payerIdentifier(response.item1.payerIdentifier);
						self.amount(response.item1.amount / 100);
						self.narrative(response.item1.narrative);

						var auneed = true;
						var payResult;
						if (response.item1.lastStatus == "APRP")
							payResult = "Платеж успешно завершен";
						else if (response.item1.lastStatus == "DECL")
							payResult = "Платеж отклонен";
						else if (response.item1.lastStatus != null)
							payResult = response.item1.lastStatus;
						else {
							payResult = "Платёж не проводился";
							auneed = false;
						}

						//Если ошибок не было, выполнить запрос авторизации платежа
						if (auneed)
							self.authRequest(self.orderId());

						self.textData("Статус: " + payResult + " (" + response.item1.created + ")");
					}
				})
				.fail(function() {
					self.commonErrorText("Произошла ошибка на сервере, ответ не получен.");
				})
				.always(function() {
					modal.CloseTrobberDiv2(trobberId);
				});
		};

		RequestViewModel.prototype.authRequest = function(orderId) {
			var self = this;

			$.ajax({ url: '/Nvx.ReDoc.Rpgu.HousingUtilities/AcquirerServiceController/AuthorizeRequest', type: "GET", data: { paymentUuid: orderId }, headers: { proxy: true } })
				.done(function(response) {
					if (response.hasError) {
						self.payItem(new PayItemModel({ errorCode: "1", errorComment: response.errorMessage }));
					} else {
						self.payItem(new PayItemModel(response));
					}
				})
				.fail(function() {
					modal.errorModalWindow("Произошла ошибка на сервере, ответ не получен.");
				});
		};

		return RequestViewModel;
	});
define('Nvx.ReDoc.Rpgu.HousingUtilities/Script/PayItemModel',
	[
		'knockout',
		'jquery'
	],
	function(ko) {
		var PayItemModel = function(model) {
			var self = this;

			self.ordernumber = ko.observable(null);
			self.responseCode = ko.observable(null);
			self.recommendation = ko.observable(null);
			self.date = ko.observable(null);
			self.total = ko.observable(null);
			self.currency = ko.observable(null);
			self.cardnumber = ko.observable(null);
			self.approvalcode = ko.observable(null);
			self.cardholder = ko.observable(null);
			self.billnumber = ko.observable(null);
			self.status = ko.observable(null);
			self.errorCode = ko.observable(null);
			self.errorComment = ko.observable(null);

			if (model != null) {
				self.ordernumber(model.ordernumber);
				self.responseCode(model.responseCode);
				self.recommendation(model.recommendation);
				self.date(model.date);
				self.total(model.total);
				self.currency(model.currency);
				self.cardnumber(model.cardnumber);
				self.approvalcode(model.approvalcode);
				self.cardholder(model.cardholder);
				self.billnumber(model.billnumber);
				self.status(model.status);
				self.errorCode(model.errorCode);
				self.errorComment(model.errorComment);
			}
		};

		return PayItemModel;
	});
define('Nvx.ReDoc.Rpgu.HousingUtilities/Script/PaymentViewModel',
[
	'knockout',
	'jquery',
	'Nvx.ReDoc.Rpgu.HousingUtilities/Script/PaymentViewModel',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction'
],
function (ko, $, PaymentViewModel, modalWindowsFunction) {
	var PaymentViewModel = function(model, modal, parentElement) {
		var self = this;

		self.modal = modal;
		
		self.paymentId = model.paymentId;
		self.paymentName = model.paymentName;
		self.billNumber = model.billNumber;
		self.payTime = model.payTime;
		self.payMethod = model.payMethod;
		self.bank = model.bank;
		self.transNumber = model.transNumber;
		self.status = model.status;
		self.amount = model.amount;
		self.cardTransactionInfo = model.cardTransactionInfo;
		self.statusGis = ko.observable('Не определен');

		if (model.paymentItems != null && model.paymentItems.length > 0) {
			self.supplier = model.paymentItems[0].supplier;
			self.billNumber = model.paymentItems[0].billNumber;
			self.billDate = model.paymentItems[0].billDate;
		} else {
			self.supplier = null;
			self.billNumber = null;
			self.billDate = null;
		}

		self.sendPsRequest = parentElement.sendPsRequest;

		self.close = function() {
			self.modal.closeModalWindow();
		};
		
		self.getPaymentStatus = function () {
			var trobberId = modalWindowsFunction.CreateTrobberDiv2();
			self.sendPsRequest({ method: 'getPaymentStatus', sdata: JSON.stringify({ paymentId: self.paymentId }) })
				.done(function (response) {
					if (response.hasError) {
						modalWindowsFunction.errorModalWindow(response.errorMessage);
					} else if (response) {
						self.status(response);
					}
				}).always(function () {
					modalWindowsFunction.CloseTrobberDiv2(trobberId);
				});
		};

		self.refreshPaymentQuittance = function() {
			var trobberId = modalWindowsFunction.CreateTrobberDiv2();
			self.sendPsRequest({ method: 'refreshPaymentQuittance', sdata: JSON.stringify({ paymentId: self.paymentId }) })
				.done(function(response) {
					if (response.hasError) {
						modalWindowsFunction.errorModalWindow(response.errorMessage);
					} else if (response) {
						if (response.name != null)
							self.statusGis(response.name);
						else
							self.statusGis(response);
					}
				}).always(function() {
					modalWindowsFunction.CloseTrobberDiv2(trobberId);
				});
		};
	};

	return PaymentViewModel;
});
define('Nvx.ReDoc.Rpgu.HousingUtilities/Script/requestViewModel',
[
	'knockout',
	'jquery',
	'Nvx.ReDoc.Rpgu.HousingUtilities/Script/requestViewModel',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
	'Nvx.ReDoc.Rpgu.HousingUtilities/Script/CounterViewModel',
	'Nvx.ReDoc.Rpgu.HousingUtilities/Script/ServiceViewModel'
],
function (ko, $, RequestViewModel, modal, CounterViewModel, ServiceViewModel) {
	var RequestViewModel = function () {
		var self = this;

		self.newsModel = ko.observable(null);
		
		self.accountNumber = ko.observable(null);
		self.paymentRecipientId = ko.observable(null);
		self.payType = ko.observable(null);
		self.house = ko.observable(null);
		self.flat = ko.observable(null);

		//response fields
		self.dataVisible = ko.observable(false);

		self.balanse = ko.observable(null);
		self.sign = ko.observable(null);
		self.services = ko.observableArray([]);
		self.counters = ko.observableArray([]);
		
		self.makeRequest = function() {
			if (self.accountNumber() == null || self.accountNumber() == '') {
				console.log('Не все поля заполнены');
				modal.CreateNewModalDialog('request24fq394gh39q4gh934g', 'Для запроса информации необходимо заполнить обязательные поля', true, true, 'Закрыть');
			} else {
				self.sendRequest();
			}
		};
		
		self.clearData = function() {
			self.dataVisible(false);
			self.services.removeAll();
			self.counters.removeAll();
			self.balanse(null);
			self.sign(null);
		};
	};

	RequestViewModel.prototype.sendRequest = function() {
		var self = this;
		//Всё скрыть
		self.clearData();
		
		var data = {
			accountNumber: self.accountNumber(),
			paymentRecipientId: self.paymentRecipientId(),
			house: self.house(),
			flat: self.flat(),
			payType: self.payType()
		};

		//Показать тробер
		var trobberId = modal.CreateTrobberDiv2();

		$.ajax({ type: 'POST', dataType: 'json', url: '/Nvx.ReDoc.Rpgu.HousingUtilities/AccountInfoController/AccountInfoRequest', data: data })
			.done(function (response) {
				if (response.hasError) {
					console.log('ответ получен ошибочный');
					modal.CreateNewModalDialog('request24fq394gh39q4gh934g', response.errorMessage, true, true, 'Закрыть');
				} else {
					console.log('ответ получен нормальный ');

					self.balanse(response.balanceValue);
					self.sign(response.balanceSign);
					if (response.services != null) {
						$.each(response.services, function() {
							self.services.push(new ServiceViewModel(this));
						});
					}
					if (response.counters != null) {
						$.each(response.counters, function () {
							self.counters.push(new CounterViewModel(this));
						});
					}
					
					self.dataVisible(true);
				}
			})
			.fail(function (jqXHR, textStatus, errorThrown) {
				modal.CreateNewModalDialog('request24fq394gh39q4gh934g', "Произошла ошибка на сервере, ответ не получен.", true, true, 'Закрыть');
			})
			.always(function() {
				modal.CloseTrobberDiv2(trobberId);
			});
	};

	return RequestViewModel;
});
define('Nvx.ReDoc.Rpgu.HousingUtilities/Script/ServiceItemModel',
	[
		'knockout',
		'jquery'
	],
	function(ko) {
		var ServiceItemModel = function (model) {
			var self = this;

			self.serviceName = ko.observable(null);

			/*Данные организации SupplierOrgInfo*/
			self.provider = ko.observable(null);
			self.inn = ko.observable(null);
			self.kpp = ko.observable(null);

			/*Данные банковского счёта*/
			self.bankName = ko.observable(null);
			self.bankBik = ko.observable(null);
			self.bankAccount = ko.observable(null);

			self.tax = ko.observable(null);
			self.minTax = ko.observable(null);

			if (model != null) {
				self.provider(model.provider);
				self.serviceName(model.name);
				self.inn(model.inn);
				self.kpp(model.kpp);
				self.bankName(model.bankName);
				self.bankBik(model.bik);
				self.bankAccount(model.bankAccount);
				self.tax(model.taxPercent);
				self.minTax(model.taxMin);
			}
		};

		return ServiceItemModel;
	});
define('Nvx.ReDoc.Rpgu.HousingUtilities/Script/servicePayUntView',
	[
		'knockout',
		'jquery',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction'
	],
	function(ko, $, modal) {
		var RequestViewModel = function(goServiceFunction) {
			var self = this;

			//Строка с фразой для поиска
			self.searchString = ko.observable(null);
			//Номер страницы
			self.searchPage = ko.observable(0);
			self.services = ko.observableArray([]);
			self.goServiceFunction = goServiceFunction;
			self.search();

			//клик по плашке услуги
			self.selectService = function(service) {
				if (service != null) {
					self.goServiceFunction(null, service.code);
				}
			};
		};

		//Получение списка услуг для отображения каталога
		RequestViewModel.prototype.search = function() {
			var self = this;
			data = { text: self.searchString(), page: self.searchPage() };
			$.ajax({ type: 'GET', dataType: 'json', url: "/Nvx.ReDoc.Rpgu.HousingUtilities/UntDataController/GetServiceFullList", data: data, headers: { proxy: true } })
				.done(function(response) {
					if (response.hasError) {
						modal.errorModalWindow(response.errorMessage);
						return;
					}
					self.services.removeAll();
					self.services(response);
				});
		};

		return RequestViewModel;
	});
define('Nvx.ReDoc.Rpgu.HousingUtilities/Script/servicePayViewModel',
	[
		'knockout',
		'jquery',
		'require',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'Nvx.ReDoc.Rpgu.HousingUtilities/Script/servicePayUntView',
		'Nvx.ReDoc.Rpgu.HousingUtilities/Script/servicePayViewModel2',
		'Nvx.ReDoc.Rpgu.HousingUtilities/Script/orderPayViewModel'
	],
	function(ko, $, require, modal, ServicePayUntView, ServicePayViewModel2, OrderPayViewModel) {
		var RequestViewModel = function(orderId, serviceCode) {
			var self = this;

			//первая вкладка
			self.templateId = ko.observable();
			self.templateViewModel = ko.observable(null);

			self.chargesData = ko.observableArray();
			self.chargesError = ko.observable();
			self.chargesInfo = ko.observable();
			self.billsListVisible = ko.observable(false);

			self.payOptions = ko.observableArray();
			self.billDetailsModel = ko.observable();

			self.requestId = ko.observable(null);
			self.billId = ko.observable();
			self.paymentId = ko.observable();

			self.finalAmount = ko.observable(null);
			self.selectedHash = ko.observable(null);

			//отображение списка задолженностей
			self.backToBills = function() {
				self.payOptions.removeAll();
				self.billsListVisible(true);
				self.finalAmount(null);
				self.selectedHash(null);
			};

			//табы
			self.tabSearch = ko.observable(true);
			self.tabMy = ko.observable(false);

			//клик по поиску услуг
			self.serviceSearchClick = function() {
				self.tabMy(false);
				self.tabSearch(true);
			};

			//клик по моим счетам
			self.myBillsClick = function() {
				self.tabSearch(false);
				self.tabMy(true);
				self.getBills();
			};

			self.back = function() {
				self.selectViewModel(null, null);
			};

			//Выбор контента для отображения в первой вкладке
			self.selectViewModel = function (forderId, fserviceCode) {
				self.templateId('placeholderTemplate');
				self.templateViewModel(null);
				if (forderId != null) {
					self.templateViewModel(new OrderPayViewModel(forderId));
					self.templateId('Nvx.ReDoc.Rpgu.HousingUtilities/View/orderPayView.tmpl.html');
				} else if (fserviceCode != null) {
					self.templateViewModel(new ServicePayViewModel2(fserviceCode, self.selectViewModel));
					self.templateId('Nvx.ReDoc.Rpgu.HousingUtilities/View/servicePayView2.tmpl.html');
				} else {
					self.templateViewModel(new ServicePayUntView(self.selectViewModel));
					self.templateId('Nvx.ReDoc.Rpgu.HousingUtilities/View/servicePayUntView.tmpl.html');
				}
			};
			
			//Отрисуем первую вкладку
			self.selectViewModel(orderId, serviceCode);
		};

		RequestViewModel.prototype.prepay = function(element) {
			var self = this;
			self.getPaymentComissions(element);
			self.getBillDetails(element);
		};

		//1. Запрос на обновление начислений
		RequestViewModel.prototype.refreshBills = function() {
			var self = this;
			var trobberId = modal.CreateTrobberDiv2();
			self.sendIsRequest({ method: 'refreshBills', sdata: JSON.stringify({}) })
				.done(function(response) {
					if (response.hasError) {
						console.log(response.errorMessage);
						self.chargesError(response.errorMessage);
						modal.CloseTrobberDiv2(trobberId);
					} else if (response) {
						//Имеем номер заявки и запрашиваем статус этой заявки
						self.requestId(response);
						self.timedGetBillRefreshStatus(trobberId);
					}
				})
				.error(function() {
					modal.CloseTrobberDiv2(trobberId);
				});
		};

		RequestViewModel.prototype.timedGetBillRefreshStatus = function(trobberId) {
			var self = this;
			var timerId = 'timedGetBillRefreshStatusTimer';

			var timeoutValue = 4000;
			var timer = $(this).data(timerId);
			if (timer) {
				clearTimeout($(this).data(timerId));
				$(this).data(timerId, setTimeout(function() {
					self.getBillRefreshStatus(trobberId);
				}, timeoutValue));
			} else {
				self.getBillRefreshStatus(trobberId);
				$(this).data(timerId, 'fake');
			}
		};

		//2. Запрос статуса обновления начислений
		RequestViewModel.prototype.getBillRefreshStatus = function(trobberId) {
			var self = this;
			self.sendIsRequest({ method: 'getBillRefreshStatus', sdata: JSON.stringify({ requestId: self.requestId() }) })
				.done(function(response) {
					if (response.hasError) {
						console.log(response.errorMessage);
						self.chargesError(response.errorMessage);
						modal.CloseTrobberDiv2(trobberId);
					} else if (response) {
						if (response === 'COMPLETED')
							self.getBills(trobberId);
						else
							self.timedGetBillRefreshStatus(trobberId);
					}
				})
				.error(function() {
					modal.CloseTrobberDiv2(trobberId);
				});
		};

		//3. Запрос начислений
		RequestViewModel.prototype.getBills = function(trobberId) {
			var self = this;
			self.payOptions.removeAll();
			self.chargesData.removeAll();
			if (trobberId == null)
				trobberId = modal.CreateTrobberDiv2();

			self.sendIsRequest({ method: 'getBills', sdata: JSON.stringify({ requestId: self.requestId() }) })
				.done(function(response) {
					if (response.hasError) {
						console.log(response.errorMessage);
						self.chargesError(response.errorMessage);
					} else if (response.length > 0) {
						for (var i = 0; i < response.length; i++) {
							if (response[i].IsPaid === true)
								continue;
							response[i].getPaymentComissions = self.getPaymentComissions;
							response[i].getBillDetails = self.getBillDetails;
							response[i].chargesError = self.chargesError;
							response[i].chargesInfo = self.chargesInfo;
							response[i].payOptions = self.payOptions;
							response[i].billsListVisible = self.billsListVisible;
							response[i].sendPsRequest = self.sendPsRequest;
							response[i].sendIsRequest = self.sendIsRequest;
							response[i].billDetailsModel = self.billDetailsModel;
							response[i].finalAmount = self.finalAmount;
							response[i].selectedHash = self.selectedHash;
							self.chargesData.push(response[i]);
						}
						self.billsListVisible(true);
					}
				})
				.always(function() {
					modal.CloseTrobberDiv2(trobberId);
				});
		};

		RequestViewModel.prototype.getBillDetails = function(element) {
			var self = this;
			var trobberId = modal.CreateTrobberDiv2();
			self.sendIsRequest({ method: 'getBillDetails', sdata: JSON.stringify({ billId: element.billId }) })
				.done(function(response) {
					if (response.hasError) {
						console.log(response.errorMessage);
						self.chargesError(response.errorMessage);
					} else if (response) {
						response.href = '/Nvx.ReDoc.Rpgu.HousingUtilities/SmevEpsh/Controller/GetPdf?method=getBillPDF&id=' + element.billId;
						self.billDetailsModel(response);
					}
				}).always(function() {
					modal.CloseTrobberDiv2(trobberId);
				});
		};

/*
		RequestViewModel.prototype.addBillGos = function() {
			var self = this;
			var trobberId = modal.CreateTrobberDiv2();
			self.sendIsRequest({ method: 'addBillGos', sdata: JSON.stringify({ billSourceCode: 'FK', stsSeria: '8989', stsNumber: '619812' }) })
				.done(function(response) {
					if (response.hasError) {
						console.log(response.errorMessage);
						self.chargesError(response.errorMessage);
					} else if (response) {
						self.chargesInfo(response);
						self.requestId(response);
					}
				}).always(function() {
					modal.CloseTrobberDiv2(trobberId);
				});
		};
*/

		RequestViewModel.prototype.sendIsRequest = function(data) {
			var self = this;
			self.chargesInfo(null);
			self.chargesError(null);
			console.log(new Date().toString());
			return $.ajax({ url: "/Nvx.ReDoc.Rpgu.HousingUtilities/SmevEpsh/Controller/IsRequest", data: data, headers: { proxy: true }, method: 'POST' });
		};

		RequestViewModel.prototype.getPaymentComissions = function(element) {
			var self = this;
			self.payOptions.removeAll();
			var trobberId = modal.CreateTrobberDiv2();
			var tdata = {
				billId: element.billId,
				amount: element.Amount
			};

			self.sendPsRequest({ method: 'getPaymentComissions', sdata: JSON.stringify(tdata) })
				.done(function(response) {
					if (response.hasError) {
						console.log(response.errorMessage);
						self.chargesError(response.errorMessage);
					} else if (response) {
						for (var i = 0; i < response.length; i++) {
							response[i].finalAmount = self.finalAmount;
							response[i].selectedHash = self.selectedHash;
							response[i].billId = self.billId;
							response[i].sendPsRequest = self.sendPsRequest;
							response[i].sendIsRequest = self.sendIsRequest;
							response[i].billDetailsModel = self.billDetailsModel;
							response[i].checked = ko.observable(false);
							response[i].checkedsubscribe = function() {
								this.finalAmount("Итоговая сумма (руб.): " + this.amount);
								this.selectedHash(this.hash);
							};
						}
						self.payOptions(response);
						self.billsListVisible(false);
					}
				}).always(function() {
					modal.CloseTrobberDiv2(trobberId);
				});
		};

		RequestViewModel.prototype.createPayment = function() {
			var self = this;
			var trobberId = modal.CreateTrobberDiv2();

			var selectedPayOption = null;
			for (var i = 0; i < self.payOptions().length; i++) {
				if (self.payOptions()[i].hash === self.selectedHash()) {
					selectedPayOption = self.payOptions()[i];
					break;
				}
			}
			if (selectedPayOption == null)
				return;

			self.sendPsRequest({
				method: 'createPayment',
				sdata: JSON.stringify({
					hash: selectedPayOption.hash,
					amount: selectedPayOption.amount,
					expectedFee: selectedPayOption.fee,
					payMethodCode: selectedPayOption.payMethod != null ? selectedPayOption.payMethod.code : null,
					paySystemCode: selectedPayOption.paySystem != null ? selectedPayOption.paySystem.code : null,
					billId: selectedPayOption.billId,
					billSumm: selectedPayOption.billDetailsModel().billSumm
				})
			})
				.done(function(response) {
					if (response.hasError) {
						console.log(response.errorMessage);
						self.chargesError(response.errorMessage);
					} else if (response) {
						//todo
						console.log('response');
					}
				}).always(function() {
					modal.CloseTrobberDiv2(trobberId);
				});
		};

		/*RequestViewModel.prototype.getPayMethods = function() {
			var self = this;
			var trobberId = modal.CreateTrobberDiv2();
			self.sendPsRequest({ method: 'getPayMethods', sdata: JSON.stringify({}) })
				.done(function(response) {
					if (response.hasError) {
						console.log(response.errorMessage);
						self.chargesError(response.errorMessage);
					} else if (response) {
						self.chargesInfo(response);
					}
				}).always(function() {
					modal.CloseTrobberDiv2(trobberId);
				});
		};*/

		/*RequestViewModel.prototype.addInstrument = function() {
			var self = this;
			var trobberId = modal.CreateTrobberDiv2();
			self.sendPsRequest({ method: 'addInstrument', sdata: JSON.stringify({}) })
				.done(function(response) {
					if (response.hasError) {
						console.log(response.errorMessage);
						self.chargesError(response.errorMessage);
					} else if (response) {
						self.chargesInfo(response);
					}
				}).always(function() {
					modal.CloseTrobberDiv2(trobberId);
				});
		};*/

		RequestViewModel.prototype.sendPsRequest = function(data) {
			var self = this;
			if (self.chargesInfo != null)
				self.chargesInfo(null);
			if (self.chargesError != null)
				self.chargesError(null);
			return $.ajax({ method: 'POST', headers: { proxy: true }, url: "/Nvx.ReDoc.Rpgu.HousingUtilities/SmevEpsh/Controller/PsRequest", data: data });
		};

		return RequestViewModel;
	});
define('Nvx.ReDoc.Rpgu.HousingUtilities/Script/servicePayViewModel2',
	[
		'knockout',
		'jquery',
		'require',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'Nvx.ReDoc.Rpgu.HousingUtilities/Script/ServiceItemModel',
		'jqueryExtention'
	],
	function(ko, $, require, modal, ServiceItemModel) {
		var RequestViewModel = function(serviceCode, backFunction) {
			var self = this;
			self.backFunction = backFunction;
			self.back = function() {
				self.backFunction();
			};

			self.serviceCode = serviceCode;
			self.serviceItem = ko.observable();

			self.payerIdentifier = ko.observable(null);
			self.personalAccount = ko.observable(null);
			self.amount = ko.observable(null);

			self.narrative = ko.observable(null);
			self.email = ko.observable(null);

			self.comissionVisible = ko.observable(false);
			self.comissionAmount = ko.observable(null);
			self.serviceExist = ko.observable(false);
			self.infoRequestFieldsVisible = ko.observable(false);
			self.infoFields = ko.observableArray();
			self.infoRequestRightIcon = ko.observable('icon icon-chevron-down-gray rotate90-counter-clockwise');
			self.saveInfoRequestVisible = ko.observable(false);

			self.getInfoFieldsData = function() {
				var params = {};
				for (var i = 0; i < self.infoFields().length; i++) {
					params[self.infoFields()[i].k] = self.infoFields()[i].v();
				}
				var data = {
					serviceCode: self.serviceCode,
					params: JSON.stringify(params)
				};
				return data;
			};

			if (serviceCode == null || serviceCode == '') {
				self.back();
			} else {
				self.loadCustomerEmail();
				self.getService(serviceCode);
				var csum = $.getUrlVar('Sum');
				if (csum != null)
					self.amount(csum);
			}
		};

		//Получение иинформации по услуге
		RequestViewModel.prototype.getService = function(serviceCode) {
			var self = this;
			var trobberId = modal.CreateTrobberDiv2();

			$.ajax({ type: 'POST', dataType: 'json', url: "/Nvx.ReDoc.Rpgu.HousingUtilities/UntDataController/GetService", data: { code: serviceCode } })
				.done(function(response) {
					if (response.hasError) {
						console.log(response.errorMessage);
						modal.errorModalWindow(response.errorMessage);
						self.back();
					} else {
						self.fillServiceData(response);
					}
				})
				.always(function() {
					modal.CloseTrobberDiv2(trobberId);
				});
		};

		RequestViewModel.prototype.sendInfoRequest = function() {
			var self = this;

			var trobberId = modal.CreateTrobberDiv2();
			$.ajax({ type: 'POST', dataType: 'json', url: "/Nvx.ReDoc.Rpgu.HousingUtilities/AccountInfoController/Request", data: self.getInfoFieldsData() })
				.done(function(response) {
					if (response.hasError) {
						console.log(response.errorMessage);
						modal.errorModalWindow(response.errorMessage);
						return;
					}
					var resultText = '<div>';
					$.each(response, function(e, i) { resultText += '<p>' + i[1] + ": " + i[0] + '</p>'; });
					resultText += '</div>';
					modal.CreateNewModalDialog("lkinfo", resultText, false, true, null);
				})
				.always(function() {
					modal.CloseTrobberDiv2(trobberId);
				});
		};

		RequestViewModel.prototype.saveInfoRequest = function() {
			var self = this;
			$.ajax({ type: 'POST', dataType: 'json', url: "/Nvx.ReDoc.Rpgu.HousingUtilities/AccountInfoController/SaveServiceData", data: self.getInfoFieldsData() })
				.done(function(response) {
					if (response.hasError) {
						console.log(response.errorMessage);
						modal.errorModalWindow(response.errorMessage);
						return;
					}
				});
		};

		//загрузить информацию о пользователе
		RequestViewModel.prototype.loadCustomerEmail = function() {
			var self = this;
			$.getJSON('/Nvx.ReDoc.Rpgu.PortalModule/CustomerController/GetCustomerEmail')
				.done(function(response) {
					if (response.hasError !== true) {
						self.saveInfoRequestVisible(true);
						if (response.result != null)
							self.email(response.result);
					} else {
						//todo save invisible
						self.saveInfoRequestVisible(false);
					}
				});
		};

		//Заполнение информации по услуге
		RequestViewModel.prototype.fillServiceData = function(data) {
			var self = this;
			self.serviceItem(new ServiceItemModel(data.model));
			self.serviceExist(data.service);
			if (data.service === true && data.params != null) {
				var fields = JSON.parse(data.params);
				self.infoFields.removeAll();
				for (var i = 0; i < fields.length; i++) {
					var o = {
						k: fields[i].Key,
						n: fields[i].Value[0],
						m: fields[i].Value[1] != "" ? fields[i].Value[1] : null
					};
					o.v = ko.observable(fields[i].Value.length > 2 ? fields[i].Value[2] : null);
					self.infoFields.push(o);
				}
			}
		};

		RequestViewModel.prototype.infoRequest = function() {
			var self = this;
			self.infoRequestFieldsVisible(!self.infoRequestFieldsVisible());
			if (self.infoRequestFieldsVisible())
				self.infoRequestRightIcon('icon icon-chevron-down-gray');
			else
				self.infoRequestRightIcon('icon icon-chevron-down-gray rotate90-counter-clockwise');
		};

		//Запрос на отправку платёжного поручения
		RequestViewModel.prototype.regRequest = function() {
			var self = this;
			if (self.checkFields(true) == false) {
				modal.errorModalWindow("Для совершения оплаты необходимо заполнить реквизиты.");
				return;
			}

			var trobberId = modal.CreateTrobberDiv2();

			$.ajax({ type: 'POST', dataType: 'json', url: '/Nvx.ReDoc.Rpgu.HousingUtilities/AcquirerServiceController/RegisterPaymentRequest', data: self.getRequestData() })
				.done(function(response) {
					if (response.hasError)
						modal.errorModalWindow(response.errorMessage);
					else
						window.location = response.url;
				})
				.fail(function() {
					modal.errorModalWindow("Произошла ошибка на сервере, ответ не получен.");
				})
				.always(function() {
					modal.CloseTrobberDiv2(trobberId);
				});
		};

		//Запрос на уточнение комиссии
		RequestViewModel.prototype.comissionRequest = function() {
			var self = this;
			if (self.checkFields(false) == false) {
				modal.errorModalWindow("Для уточнения комиссии необходимо заполнить сумму платежа и идентификатор плательщика.");
				return;
			}

			var trobberId = modal.CreateTrobberDiv2();
			$.ajax({ type: 'POST', dataType: 'json', url: '/Nvx.ReDoc.Rpgu.HousingUtilities/AcquirerServiceController/ClarifyComissionRequest', data: self.getRequestData() })
				.done(function(response) {
					if (response.hasError) {
						self.comissionAmount(null);
						self.comissionVisible(false);
						modal.errorModalWindow(response.errorMessage);
					} else {
						self.comissionAmount(response.amount);
						self.comissionVisible(true);
					}
				})
				.fail(function() {
					self.comissionAmount(null);
					self.comissionVisible(false);
					modal.errorModalWindow("Произошла ошибка на сервере, ответ не получен.");
				})
				.always(function() {
					modal.CloseTrobberDiv2(trobberId);
				});
		};

		//Формирование данных запроса
		RequestViewModel.prototype.getRequestData = function() {
			var self = this;
			return {
				code: self.serviceCode,
				payerIdentifier: self.payerIdentifier(),
				personalAccount: self.personalAccount(),
				amount: self.amount(),
				narrative: self.narrative(),
				email: self.email()
			};
		};

		//Проверка заполненности полей
		RequestViewModel.prototype.checkFields = function(full) {
			var self = this;
			if (self.serviceCode == null ||
				self.amount() == null || self.amount().trim() == '' || self.amount() == 0 ||
				self.payerIdentifier() == null || self.payerIdentifier().trim() == '') {
				return false;
			}

			if (full === true && (self.narrative() == null || self.narrative().trim() == '')) {
				return false;
			}

			return true;
		};

		return RequestViewModel;
	});
define('Nvx.ReDoc.Rpgu.HousingUtilities/Script/ServiceViewModel',
[
	'knockout',
	'jquery'
],
function(ko) {
	var ServiceViewModel = function(model) {
		var self = this;

		console.log('serviceViewModel');

		self.name = ko.observable(null);
		self.code = ko.observable(null);
		self.sum = ko.observable(null);

		if (model != null) {
			self.name(model.srvName);
			self.code(model.srvCode);
			self.sum(model.sum);
		}
	};

	return ServiceViewModel;
});
define('Nvx.ReDoc.Rpgu.HousingUtilities/Penalty/Script/MvdTaxViewModel',
[
	'knockout',
	'jquery',
	'Nvx.ReDoc.Rpgu.HousingUtilities/Penalty/Script/MvdTaxViewModel'
],
function (ko, $, MvdTaxViewModel) {
	var MvdTaxViewModel = function (model, modal) {
		var self = this;

		self.model = model;
		self.modal = modal;

		self.close = function() {
			self.modal.closeModalWindow();
		};
	};


	return MvdTaxViewModel;
});
define('Nvx.ReDoc.Rpgu.PortalModule/Complaint/Script/ComplaintPageModel', [
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction'
	], function(modal) {
		var ComplaintPageModel = function() {
			var self = this;

			self.createComplaint = function() {
				var trobberId = modal.CreateTrobberDiv2();
				var url = "/Rpgu/Complaint/Service";
				$.ajax({ method: 'GET', url: url, headers: { proxy: true } })
					.done(function(response) {
						if (response.hasError || response.errorMessage != null) {
							modal.errorModalWindow(response.errorMessage);
						} else {
							// Адрес для перехода к опроснику услуги
							var serviceUrl = '/portal/service/{0}/treatment'.format(response.serviceId);

							if (window.nvxCommonPath != null && window.nvxCommonPath.treatmentCreateView != null) {
								serviceUrl = window.nvxCommonPath.treatmentCreateView + response.serviceId;
							}

							window.location = serviceUrl;
						}
					}).fail(function(jqXHR, textStatus, errorThrown) {
						var message = jqXHR.responseJSON && jqXHR.responseJSON.errorMessage ?
							jqXHR.responseJSON.errorMessage :
							'Не удалось получить с сервера данные. Подробности: ' + errorThrown;
						modal.errorModalWindow(message);
					}).always(function() {
						modal.CloseTrobberDiv2(trobberId);
					});
			};
		};

		return ComplaintPageModel;
	});
define('Nvx.ReDoc.Rpgu.PortalModule/Cabinet/Script/complaint/ComplaintFilesViewModel', [],
	function () {
		var ComplaintFilesViewModel = function (components, fileId) {
			var self = this;
			self.fileId = fileId;
			self.applFiles = [];
			self.externalFiles = [];

			components.forEach(function (item, i) {
				item.downloadLink = '/WebInterfaceModule/DownloadAttachment?fileId={0}&attachmentId={1}'.format(self.fileId, item.elementId);
				item.linkTitle = item.elementTitle;

				if (item.type == 0) {
					// тип вложения Default
					self.applFiles.push(item);
				} else if (item.type == 6) {
					// тип вложения External
					self.externalFiles.push(item);
				}
			});

			self.hasApplFiles = self.applFiles.length > 0;
			self.hasExternalFiles = self.externalFiles.length > 0;

			self.noFiles = !self.hasApplFiles && !self.hasExternalFiles;
		};

		return ComplaintFilesViewModel;
});
define('Nvx.ReDoc.Rpgu.PortalModule/Cabinet/Script/complaint/ComplaintListViewModel', ['jquery',
		'knockout',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'jqueryExtention'
	], function($, ko, modal) {
		var ComplaintListViewModel = function() {
			var self = this;

			self.complaintList = ko.observableArray();
		};

		ComplaintListViewModel.prototype.loadList = function() {
			var self = this;

			var trobberId = modal.CreateTrobberDiv2();
			var model = { nocache: new Date().getTime() };

			var promise = $.ajax({ url: '/Nvx.ReDoc.Rpgu.PortalModule/RequestController/ComplaintList', data: model, type: 'GET', headers: { proxy: true } })
				.done(function(response) {
					if (response.hasError) {
						modal.errorModalWindow(response.errorMessage);
					} else {
						if (response.result != null) {
							var needRename = window.nvxCommonPath != null && window.nvxCommonPath.infoView != null;
							if (needRename == true) {
								for (var i = 0; i < response.result.length; i++) {
									if (response.result[i].fileLink.startsWith('/cabinet/request')) {
										var newId = response.result[i].fileLink.replace('/cabinet/request/', '').replace('/info', '');
										response.result[i].fileLink = window.nvxCommonPath.infoView + newId;
									}
								}
							}
						}
						self.complaintList(response.result);
					}
				})
				.fail(function(jqXHR, textStatus, errorThrown) {
					if (jqXHR.responseJSON) {
						modal.errorModalWindow(jqXHR.responseJSON.errorMessage);
					} else {
						modal.errorModalWindow(jqXHR.responseText);
					}
				})
				.always(function() {
					modal.CloseTrobberDiv2(trobberId);
				});

			return promise;
		};

		ComplaintListViewModel.prototype.start = function() {
			var self = this;
			self.loadList();
		};

		return ComplaintListViewModel;
	});
define('Nvx.ReDoc.Rpgu.Gostehnadzor/Web/Script/ChargeViewModel', [
		'knockout',
		'jquery',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'select2lib',
		'Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/knockout/customBindingHandlers'
	], function(ko, $, modal) {
		var ChargeViewModel = function() {
			var self = this;

			//тип заявителя= ko.observable();
			self.ltype = ko.observable('fl');
			self.lastName = ko.observable(null);
			self.firstName = ko.observable(null);
			self.middleName = ko.observable(null);
			//тип заполнения документа ФЛ
			self.fldoctype = ko.observable('document');
			self.flInn = ko.observable(null);
			self.flSnils = ko.observable(null);
			//Вид документа, удостоверяющего личность
			self.flDocumentType = ko.observable('21');
			//Серия удост. Личности
			self.flDocSeria = ko.observable();
			//Номер удост. Личности
			self.flDocNumber = ko.observable();
			self.ulName = ko.observable();
			self.ulKpp = ko.observable();
			self.ulInn = ko.observable();
			self.address = ko.observable();
			//За что оплата
			self.paytype = ko.observable('duty');
			//Назначение платежа
			self.serviceType = ko.observable();
			//Сумма в руб.
			self.amount = ko.observable('0');
			//Код инспекции
			self.inspectorateCode = ko.observable('1');
			//Номер постановления
			self.penaltyNumber = ko.observable(null);
			self.kbk = ko.observable(null);
			//Согласие на обработку данных
			self.isAgree = ko.observable(false);
			//Валидировать ли ввод серии и номера
			self.isSerNoMasked = ko.observable(true);

			self.errorTextElement = ko.observable();

			//Список услуг
			self.serviceList = ko.observableArray();

			self.serviceType.subscribe(function(type) {
				if (self.serviceList != null && self.serviceList().length > 0) {
					var selected = null;
					for (var i = 0; i < self.serviceList().length; i++) {
						if (self.serviceList()[i].id === type) {
							selected = self.serviceList()[i];
							break;
						}
					}
					if (selected != null) {
						self.kbk(selected.metaData['kbk']);
						self.amount(selected.metaData['cost']);
					}
				}
			});

			self.paytype.subscribe(function() {
				self.amount('');
			});

			self.flDocumentType.subscribe(function(v) {
				self.isSerNoMasked(v == '21');
			});

			self.serviceTypeSelectOpt = {
				placeholder: 'Выберите услугу',
				allowClear: false,
				ajax: {
					type: 'GET',
					url: '/Nvx.ReDoc.Rpgu.Gostehnadzor.Web.Controller/IgtnController/GetServices',
					dataType: "json",
					processResults: function(data) {
						if (data.hasError == true || data.errorMessage != null) {
							return { results: { id: '', text: 'Произошла ошибка, нет результатов.' } };
						} else {
							self.serviceList(data);
							return { results: data };
						}
					}
				}
			};

			self.loadUserData();
		};

		ChargeViewModel.prototype.request = function() {
			var self = this;
			if ($(self.errorTextElement()).text != null)
				$(self.errorTextElement()).text('');
			var error = self.validData();
			if (error != null) {
				modal.errorModalWindow(error);
				return;
			}
			var model = self.getModel();

			var lastPath = '?attachmentId={0}&path={1}&{2}'
				.format(
					encodeURI('Квитанция.pdf'),
					window.nvxCommonPath.authPortalPath + '/Nvx.ReDoc.Rpgu.Gostehnadzor.Web.Controller/IgtnController/CreateCharge',
					$.param(model));

			var link = window.nvxCommonPath.fileProxyPath + lastPath;
			var trobberId = modal.CreateTrobberDiv2();
			setTimeout(function () {
				$(self.errorTextElement()).text('Квитанция действительна в течение 14 дней.');
				modal.CloseTrobberDiv2(trobberId);
			}, 2000);
			window.location = link;
		};

		ChargeViewModel.prototype.getModel = function() {
			var self = this;
			var model = {
				address: encodeURI(self.address()),
				cost: self.amount(),
				ltype: self.ltype(),
				paytype: self.paytype()
			};
			if (self.paytype() == 'penalty') {
				//Штраф
				model.inspectorateCode = self.inspectorateCode();
				model.edAdmNumber = encodeURI(self.penaltyNumber());
				model.kbk = encodeURI("ШТРАФ");
				model.service = encodeURI("Оплата штрафа по постановлению №" + self.penaltyNumber());
			} else if (self.paytype() == 'duty') {
				//Госпошлина
				model.service = self.serviceType();
				model.inspectorateCode = '0';
				model.kbk = self.kbk();
			}
			if (self.ltype() == 'fl') {
				model.name = encodeURI(self.firstName());
				model.surname = encodeURI(self.lastName());
				model.middlename = encodeURI(self.middleName());
				model.docCode = self.flDocumentType();
				model.serie = self.flDocSeria();
				model.number = self.flDocNumber();
				if (!self.isEmpty(self.flInn()))
					model.inn = self.flInn();
				if (!self.isEmpty(self.flSnils()))
					model.snils = self.flSnils().replace(/\D/g, '');
				model.fldoctype = self.fldoctype();
			} else if (self.ltype() == 'ul') {
				model.name = encodeURI(self.ulName());
				model.kpp = self.ulKpp();
				model.inn = self.ulInn();
			}
			return model;
		};

		ChargeViewModel.prototype.loadUserData = function() {
			var self = this;
			$.ajax({ url: '/Nvx.ReDoc.Rpgu.PortalModule/CustomerController/GetCustomerInfo', method: 'GET', headers: { proxy: true } })
				.done(function(response) {
					if (response.hasError !== true) {
						if (!self.isEmpty(response.result.snils)) {
							//проставим СНИЛС
							self.fldoctype('snils');
							self.flSnils(response.result.snils);
						}
						if (!self.isEmpty(response.result.inn)) {
							//проставим ИНН
							self.fldoctype('inn');
							self.flInn(response.result.inn);
						}
						if (response.result.passport != null) {
							//проставим поля паспорта ФЛ
							self.fldoctype('document');
							self.flDocNumber(response.result.passport.number);
							self.flDocSeria(response.result.passport.series);
						}
						//проставим адрес
						if (!self.isEmpty(response.result.facticalAddress)) {
							self.address(response.result.facticalAddress);
						} else if (!self.isEmpty(response.result.registrationAddress)) {
							self.address(response.result.registrationAddress);
						}
						//проставим фио
						if (!self.isEmpty(response.result.fio)) {
							var fio = response.result.fio.trim().split(' ');
							if (fio.length == 3) {
								self.lastName(fio[0]);
								self.firstName(fio[1]);
								self.middleName(fio[2]);
							}
						}
					}
				});
		};

		//Проверка заполненности данных формы
		ChargeViewModel.prototype.validData = function() {
			var self = this;
			var errorText = '';
			if (self.ltype() == 'fl') {
				//Блок проверки физического лица
				if (self.isEmpty(self.lastName()))
					errorText += 'Не заполнено поле фамилия. ';
				if (self.isEmpty(self.firstName()))
					errorText += 'Не заполнено поле имя. ';
				if (self.isEmpty(self.middleName()))
					errorText += 'Не заполнено поле отчество. ';
				if (self.isEmpty(self.fldoctype()))
					errorText += 'Не выбран тип удостоверения личности. ';

				if (self.fldoctype() == 'document') {
					if (self.isEmpty(self.flDocumentType()) || (self.isEmpty(self.flDocSeria()) || self.isEmpty(self.flDocNumber())))
						errorText += 'Не заполнены данные документа, удостоверяющего личность. ';
				} else if (self.fldoctype() == 'inn') {
					if (self.isEmpty(self.flInn()) || self.flInn().replace(/\D/g, '').length != 12 || self.flInn().replace(/\d/g, '').length > 0)
						errorText += 'Номер ИНН для физических лиц должен состоять из 12 цифр. ';
				} else if (self.fldoctype() == 'snils') {
					if (self.isEmpty(self.flSnils()) || self.flSnils().replace(/\D/g, '').length != 11)
						errorText += 'Номер СНИЛС должен состоять из 11 цифр. ';
				}
				if (self.isAgree() !== true)
					errorText += 'Необходимо подтвердить согласие на обработку персональных данных. ';
			} else if (self.ltype() == 'ul') {
				//Блок проверки юридического лица
				if (self.isEmpty(self.ulName()))
					errorText += 'Не заполнено поле наименование. ';
				if (self.isEmpty(self.ulInn()) || self.ulInn().replace(/\D/g, '').length != 10 || self.ulInn().replace(/\d/g, '').length > 0)
					errorText += 'Номер ИНН для юридических лиц должен состоять из 10 цифр. ';
				if (self.isEmpty(self.ulKpp()) || self.ulKpp().replace(/\D/g, '').length != 9 || self.ulKpp().replace(/\d/g, '').length > 0)
					errorText += 'Номер КПП для юридических лиц должен состоять из 9 цифр.  ';
			} else {
				errorText += 'Не выбран тип заявителя. ';
			}
			if (self.isEmpty(self.address()))
				errorText += 'Не заполнено поле адрес. ';
			if (self.isEmpty(self.paytype())) {
				errorText += 'Не выбран тип оплаты. ';
			} else {
				if (self.paytype() == 'duty' && self.isEmpty(self.serviceType())) {
					errorText += 'Не выбрана услуга. ';
				}
				if (self.paytype() == 'penalty') {
					if (self.isEmpty(self.inspectorateCode()))
						errorText += 'Не выбрана инспекция. ';
					if (self.isEmpty(self.penaltyNumber()))
						errorText += 'Не заполнено поле Номер постановления. ';
				}
			}
			if (self.isEmpty(self.amount()) || self.amount() == '0')
				errorText += 'Поле стоимость услуги не может быть пустым.';
			if (self.amount() != null && self.amount().replace(/\d/g, '').length > 0)
				errorText += 'Поле стоимость услуги должно содержать только цифры';
			return self.isEmpty(errorText) ? null : errorText;
		};

		ChargeViewModel.prototype.isEmpty = function(str) {
			return (!str || 0 === str.length);
		};

		return ChargeViewModel;
	});
define('Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/knockout/customBindingHandlers',
	[
		'jquery',
		'knockout',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Api/dateFormater',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/utils',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Api/reDocUrlQualifier',
		'require',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'javascriptExtention',
		'jqueryExtention',
		'select2lib',
		'jquery.autosize'
	], function ($, ko, dateFormater, utils, reDocUrlQualifier, require, modal) {
		//Биндинг на DOM-элемент.
		ko.bindingHandlers.element = {
			init: function (element, valueAccessor) {
				valueAccessor()(element);
			}
		};

		ko.bindingHandlers.eachProp = {
			transformObject: function (obj) {
				var properties = [];
				for (var key in obj) {
					if (obj.hasOwnProperty(key)) {
						properties.push({ key: key, value: obj[key] });
					}
				}
				return ko.observableArray(properties);
			},
			init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var value = ko.utils.unwrapObservable(valueAccessor()),
					properties = ko.bindingHandlers.eachProp.transformObject(value);

				ko.bindingHandlers['foreach'].init(element, properties, allBindingsAccessor, viewModel, bindingContext)
				return { controlsDescendantBindings: true };
			},
			update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var value = ko.utils.unwrapObservable(valueAccessor()),
					properties = ko.bindingHandlers.eachProp.transformObject(value);

				ko.bindingHandlers['foreach'].update(element, properties, allBindingsAccessor, viewModel, bindingContext)
				return { controlsDescendantBindings: true };
			}
		};

		//Поддержка indeterminate чекбоксов.
		ko.bindingHandlers.nullableChecked = {
			init: function (element, valueAccessor) {
				ko.bindingHandlers.checked.init(element, valueAccessor);
			},
			update: function (element, valueAccessor) {
				var value = ko.utils.unwrapObservable(valueAccessor());
				if (value == null) {
					element.indeterminate = true;
				}
				else {
					element.indeterminate = false;
				}
			}
		};

		//Для отображения правой иконки плашек компонентов дела.
		//Указанный набор стилей применяется к элементу.
		ko.bindingHandlers.paveRightIcon = {
			init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
				// This will be called when the binding is first applied to an element
				// Set up any initial state, event handlers, etc. here
				var css = valueAccessor();
				$(element).removeClass();
				$(element).addClass(css);
			},
			update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
				// This will be called once when the binding is first applied to an element,
				// and again whenever any observables/computeds that are accessed change
				// Update the DOM element based on the supplied values here.
				var css = valueAccessor();
				$(element).removeClass();
				$(element).addClass(css);
			}
		};

		//Для функционала Андрея Ананьева по сокращению слишком длинных имен плашек компонентов дела.
		ko.bindingHandlers.textElipsisInElement = {
			update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
				viewModel.changeWidth();
			}
		};

		//Для функционала Максима Василенко для перемещения правой части дела к выбранной плашке компонента дела в левой части дела.
		ko.bindingHandlers.resizeRightSideContent = {
			init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
				// This will be called when the binding is first applied to an element
				// Set up any initial state, event handlers, etc. here
				var selected = valueAccessor();
				if (selected === true) {
					window.NvxRedocCommon.resizeRightSideInFileView();
				}
			}
		};

		ko.bindingHandlers.select2participants = {
			init: function (domelement, valueAccessor, allBindings, viewModel, bindingContext) {
				$(domelement).select2({
					placeholder: 'Выберите контакт',
					allowClear: true,
					ajax: {
						url: "/WebInterfaceModule/Search/GetParticipants",
						dataType: "json",
						delay: 10,
						data: function (params) {
							return {
								term: params.term,
								takeCount: 20,
								skipPageCount: ((params.page || 1) - 1)
							};
						},
						processResults: function (data) {
							return {
								results: data,
								pagination: {
									more: data.length == 20
								}
							};
						},
						cache: false
					},
					tags: false,
					language: "ru",
					current: function (element, callback) {
						//var id = $(element).val();
						var id = $(element).getValueForSelect2();
						if (id == null || id.length < 2)
							return;
						$.post('/WebInterfaceModule/Search/GetParticipantById', { term: id }, undefined, 'json')
							.done(function (response) {
								if (!response.hasError) {
									callback(response);
								} else {
									ModalWindowsFunction.CloseModalDialog(self.dialogDivId, true);
									ModalWindowsFunction.errorModalWindow('Требуется авторизация');
								}
							}).fail(function (jqXHR, textStatus, errorThrown) {
								ModalWindowsFunction.CloseModalDialog(self.dialogDivId, true);
								ModalWindowsFunction.errorModalWindow(errorThrown);
							});
					},
					templateResult: function (item) {
						if (item.loading === true)
							return item.text;
						var attrs = "";
						//формируем побочные строки для пунктов
						if (item.attrs != null) {
							$.each(item.attrs, function(id, idata) {
								if (idata != null && idata.length > 0)
									attrs += '<div>' + idata + '</div>';
							});
						}
						return '<b>' + item.text + '</b>' + attrs;
					},
					templateSelection: function (item) {
						var attrs = "";
						//формируем побочные строки для пунктов
						if (item.attrs != null) {
							$.each(item.attrs, function(id, idata) {
								if (idata != null && idata.length > 0)
									attrs += idata + " ";
							});
						}
						return item.text != null ? item.text : attrs;
					},
					minimumInputLength: 0,
					escapeMarkup: function(m) { return m; }
				});
				ko.utils.domNodeDisposal.addDisposeCallback(domelement, function () {
					$(domelement).select2('destroy');
				});
			}
		};


		var multipleSelect = function($element, options, callback) {
			$.fn.select2.amd.require(['select2/defaults'],
				function(defaults) {

					var origMultiple = options.multiple;

					options.multiple = false;
					var defaultApplied = defaults.apply(options);
					options.multiple = origMultiple;

					options.dropdownAdapter = options.dropdownAdapter || defaultApplied.dropdownAdapter;

					if (!options.selectionAdapter) {
						var selectionAdapter = defaultApplied.selectionAdapter;
						//customize selectionAdapter
						//пишет выбрано x и тп
						selectionAdapter.prototype.update = function(data) {
							this.clear();

							if (data.length === 0) {
								return;
							}

							var template = this.options.get('templateSelection');
							var escapeMarkup = this.options.get('escapeMarkup');
							var $rendered = this.$selection.find('.select2-selection__rendered');
							var formatted = escapeMarkup(template(data, $rendered));

							$rendered.empty().append(formatted);
							$rendered.prop('title', formatted);
						};
						options.selectionAdapter = options.selectionAdapter || selectionAdapter;
					}


					if (!options.dataAdapter) {
						var dataadapter = defaultApplied.dataAdapter;

						options.dataAdapter = dataadapter;
					}
					var customSelect = $($element);
					customSelect.select2(options);//.data('select2');

					callback({
						element: customSelect
					});
				});
		};

		var dataTemplateSelectionFact = function (element, options) {
			options = options || {};
			return function(dataInput, $rendered) {
				var customSelect = $(element);

				var allCount = options.countAlways === true ? null : customSelect.data('itemsCount');
				//считаем все элементы
				allCount = allCount || customSelect.find('option').filter(function(i, elm) {
					return elm.value !== "";
				}).length;

				customSelect.data('itemsCount', allCount);

				var hasEmptyOption = customSelect.data('hasEmptyOption');
				if (!hasEmptyOption) {
					hasEmptyOption = dataInput.filter(function (item) {
						return item.id === '';
					}).length > 0;
					customSelect.data('hasEmptyOption', hasEmptyOption);
				}

				var data = customSelect.data('select2') != null ? customSelect.select2('data') : dataInput;
				if (data != null && typeof (data) === 'object' && data.length > 0) {
					if (data.length == 1 && data[0].id === "")
						return 'Выберите элементы';
					return 'Выбрано ' + (data.length - (hasEmptyOption == true ? 1 : 0)) + ' из ' + allCount;
				}
				return 'Выберите элементы';
			};
		};

		var ajaxTemplateSelectionFact = function (element) {
			return function(dataInput, $rendered) {
				var customSelect = $(element);

				var hasEmptyOption = customSelect.data('hasEmptyOption');
				if (!hasEmptyOption) {
					hasEmptyOption = dataInput.filter(function (item) {
						return item.id === '';
					}).length > 0;
					customSelect.data('hasEmptyOption', hasEmptyOption);
				}

				var data = customSelect.data('select2') != null ? customSelect.select2('data') : dataInput;
				if (data != null && typeof (data) === 'object' && data.length > 0) {
					if (data.length == 1 && data[0].id === "")
						return 'Выберите элементы';
					return 'Выбрано ' + (data.length - (hasEmptyOption == true ? 1 : 0));
				}
				return 'Выберите элементы';
			};
		};

		var checkBoxTemplateResultFact = function (element) {
			return function (item) {
				if (item.loading === true)
					return item.text;
				if (item.id == '' && item.text == '')
					return null;
				var classes = ['checkbox'];

				var elvalues = $(element).select2('data');

				if (elvalues.length > 0) {
					for (var ii = 0; ii < elvalues.length; ii++) {
						if (elvalues[ii] && elvalues[ii].id === item.id) {
							classes.push('checked');
							break;
						}
					}
				}
				item.element = $('<div>').html('<span>' + item.text + '</span><input type="hidden" value ="' + item.id + '">').addClass(classes.join(' '));

				item.element.on('click', '*', function (event) {
					event.preventDefault();
					event.stopPropagation();
				});
				setTimeout(function () {
					$(item.element).parent().on('click', function (event) {
						event.preventDefault();
						event.stopPropagation();
					});
				}, 0);
				return item.element;
			};
		};

		var divTemplateResultFact = function () {
			return function(item) {
				if (item.loading === true)
					return item.text;
				if (item.id == '' && item.text == '')
					return null;
				var classes = ['checkbox'];

				return $('<div>').html('<span>' + item.text + '</span>').addClass(classes.join(' '));
			}
		}

		/* https://github.com/ivaynberg/select2/wiki/Knockout.js-Integration */
		/* http://jsfiddle.net/uE8Vk */
		//Select2 для веб-админки.
		ko.bindingHandlers.select2admin = {
			init: function (el, valueAccessor, allBindingsAccessor, viewModel) {
				

				var allBindings = allBindingsAccessor(),
					options = ko.utils.unwrapObservable(allBindings.select2admin),
					isMultiple = function() {
						return (el.attributes['multiple'] != null && (el.attributes['multiple'].value == "multiple" || el.attributes['multiple'].value == "true")) ? true : false;
					};
				options.language = "ru";

				// Установка по-умолчанию: обновляем значение элемента до создания select2
				if ('value' in allBindings) {
					if (isMultiple() && allBindings.value() != null && allBindings.value().constructor != Array) {
						var valueArray = allBindings.value().split(",");
						$(el).val(valueArray);
						//$(el).select2("val", allBindings.value().split(","));
					} else {
						$(el).val(allBindings.value());
					}
				}

				var initValueChangedCallback = function () {

					if ("value" in allBindings) {
						//следим за value
						if (isMultiple()) {
							throw new Error("Multiple Select2 не поддерживается в комбинации с value");
						} else {
							allBindings.value.subscribe(function (newValue) {
								var $element = $(el);
								//TODO определиться что делать при передаче объекта { id: 'xx', text: undefined }
								//$element.trigger('change');
								$element.selectOptionsForS2(newValue);
							});
						}
					} else if ("selectedOptions" in allBindings) {
						//следим за selectedOptions
						var lastValue = null;

						var arraysEqual = function (arr1, arr2) {
							if (arr1.length !== arr2.length)
								return false;
							for (var i = arr1.length; i--;) {
								if (arr1[i] !== arr2[i])
									return false;
							}

							return true;
						}
						allBindings.selectedOptions.subscribe(function (newValue) {
							if (lastValue === newValue || (newValue instanceof Array && lastValue instanceof Array && arraysEqual(lastValue, newValue)))
								return;

							lastValue = newValue;

							var $element = $(el);

							var converted = [];
							var textAccessor = function(value) { return value; };
							if ("optionsText" in allBindings) {
								textAccessor = function(value) {
									var valueAccessor = function(item) { return item; };
									if ("optionsValue" in allBindings) {
										valueAccessor = function(item) { return item[allBindings.optionsValue]; };
									}
									var items = $.grep(allBindings.options(), function(e) { return valueAccessor(e) == value; });
									if (items.length == 0 || items.length > 1) {
										return "UNKNOWN";
									}
									return items[0][allBindings.optionsText];
								};
							}
							$.each(allBindings.selectedOptions(), function(key, value) {
								converted.push({ id: value, text: textAccessor(value) });
							});
							$element.selectOptionsForS2(converted);
						});
					}
				};

				var initEnd = function () {
					//sync css classes
					var sel = $(el).data('select2');
					var orig = sel._sync;

					var syncCssClasses = function ($dest, $source) {
						var applyClasses = '',
							classList = $source.attr('class').split(/\s+/);

						$.each(classList, function (index, item) {
							if (item.indexOf("select2-") !== 0) {
								//все что не содержат select2
								applyClasses += item + ' ';
							}
						});

						classList = $dest.attr('class').split(/\s+/);
						$.each(classList, function (index, item) {
							if (item.indexOf("select2") === 0) {
								//все что содержат select2
								applyClasses += item + ' ';
							}
						});

						$dest.attr("class", applyClasses);
					};

					var syncCssClassesForContainer = function () {
						var $element = $(el),
							$container = $element.data('select2').$container;
						syncCssClasses($container, $element);
					};

					var syncCssClassesOpening = function () {
						var $element = $(el),
							$container = $element.data('select2').$container,
							$dropdownContainer = $element.data('select2').$dropdown;
						syncCssClasses($container, $element);
						syncCssClasses($dropdownContainer, $element);
					};

					sel._sync = function () {
						orig.apply(this, arguments);
						syncCssClassesForContainer();
					};

					$(el).on("select2:open", syncCssClassesOpening);
					$(el).on("select2:close", syncCssClassesOpening);

					ko.utils.domNodeDisposal.addDisposeCallback(el, function () {
						$(el).select2('destroy');
						$(el).off();
					});
				}

				initValueChangedCallback();
				var customSelect = $(el);
				if (isMultiple()) {

					var defaultMultiOptions = {
						closeOnSelect: false,
						templateResult: function (result) {
							return result.text;
						},
						templateSelection: function (selection) {
							return selection.text;
						}
					};

					defaultMultiOptions.templateSelection = options.data != null ? dataTemplateSelectionFact(customSelect) : ajaxTemplateSelectionFact(customSelect);
					defaultMultiOptions.templateResult = divTemplateResultFact();

					options = $.extend(options, defaultMultiOptions);
					multipleSelect(customSelect, options, initEnd);
				} else {
					customSelect.select2(options);
					initEnd();
				}

			}
		};

		/*
		Список для множественного выбора с чекбоксами для динамических форм.
		Переписан для 4 версии, должен работать хорошо.
		Изменения обязательно согласовывать с m.vasilenko и r.guryanov
		*/
		ko.bindingHandlers.select2checklistdf = {
			init: function(element, valueAccessor, allBindings, viewModel) {
				var customSelect = $(element);

				var placeholder = null;
				var msie = document.documentMode;
				if (msie && msie <= 11) {
					console.log("Don't forget to update select on 4.0.1-rc.1 to fix placeholder problem in IE10+.");
				} else {
					placeholder = 'Выберите элементы';
				}

				var options = {
					allowClear: false,
					language: "ru",
					closeOnSelect: false,
					placeholder: placeholder,
					templateResult: divTemplateResultFact(),
					templateSelection: dataTemplateSelectionFact(customSelect, {
						countAlways: valueAccessor().extChange
					}),
					current: function(el, callback) {
						var cbd = [];
						var selopts = viewModel.selectedValueS2();
						if (typeof (selopts) === 'string' && selopts.contains(','))
							selopts = JSON.parse(selopts);
						if (selopts != null && selopts.length > 0) {
							for (var i = 0; i < selopts.length; i++) {
								for (var j = 0; j < element.options.length; j++) {
									if (element.options[j].value === selopts[i]) {
										cbd.push({ id: element.options[j].value, text: element.options[j].text });
										break;
									}
								}
							}
							if (cbd.length > 0)
								callback(cbd);
						}
					}
				};

				multipleSelect(customSelect, options, function(data) {
					
					//пришлось такой костыль, пришлось сделать(т.к. в данном бинденге инициализация обёрнутая в $.fn.select2.amd.require сбрасывает viewModel.selectedValueS2)
					viewModel.selectedValueS2.subscribe(function(parameters) {
						//customSelect.trigger('change');
						if (!customSelect.data('select2'))
							return;

						var values = viewModel.selectedValueS2() || [];
						var $elem = customSelect;
						if ($elem.select2('isOpen'))
							values = $elem.val() || [];
						if (valueAccessor().extChange === true)
							$elem.selectOptionsForS2(values);
					});

					//customSelect.on("change", function(event) {
					//});
					customSelect.on("select2:close", function(event) {
						var selectedOptions = $(this).select2('data');
						var optionValues = [];
						if (selectedOptions != null && selectedOptions.length > 0) {
							for (var i = 0; i < selectedOptions.length; i++) {
								if (selectedOptions[i].id)
									optionValues.push(selectedOptions[i].id);
							}
						}
						viewModel.selectedValueS2(optionValues);
					});
					customSelect.on("select2:open", function(event) {
						//binding with extChange has some strange things
						if (typeof (viewModel.selectedValueS2()) === 'string')
							return;
						//Первичная инициализация значений
						var valuesArray = viewModel.selectedValueS2();
						if (valuesArray == null || valuesArray.length == 0)
							return;
						if (valuesArray !== viewModel.selectedValueS2())
							$(this).val(valuesArray);
					});
					ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
						$(element).select2('destroy');
					});
				});

			}
		};

		/*
		Список для множественного выбора с чекбоксами для внешних данных
		Изменения обязательно согласовывать с m.vasilenko и r.guryanov
		*/
		ko.bindingHandlers.select2checklist = {
			init: function(element, valueAccessor, allBindings) {
				//Это тип выходного значения, либо массив, либо строка. По умолчанию массив
				var valueType = "array";
				if (valueAccessor().type === "string")
					valueType = "string";

				var allowClear = valueAccessor().allowClear || false;

				var placeholder = null;
				var msie = document.documentMode;
				if (msie && msie <= 11) {
					console.log("Don't forget to update select on 4.0.1-rc.1 to fix placeholder problem in IE10+.");
				} else {
					placeholder = 'Выберите элементы';
				}

				//Это элемент select
				var customSelect = $(element);

				//Переменная со значением которое обновляется при каждом выборанном пункте(стандартный биндинг knockout)
				var valueProperty = allBindings.get('selectedOptions');
				var updateOnClose = false;
				if (valueProperty == null) {
					updateOnClose = true;
					//переменная которая обновляется при закрытии списка(просто обозванный мною биндинг)
					valueProperty = allBindings.get('select2Value');
					if (valueProperty == null) {
						console.error("Для multiple select2 используем биндинг selectedOptions, а не value. Текущий биндинг будет использовать Value на страх и риск");
						valueProperty = allBindings.get('value');
					}
				}

				var options = {
					ajax: {
						url: valueAccessor().url,
						dataType: "json",
						data: function(term) {
							return {
								term: term.term,
								page: ((term.page || 1) - 1),
								limit: 40
							};
						},
						processResults: function(data) {
							if (data.hasError) {
								//показываем сообщение об ошибке
								setTimeout(function() {
									var resultAdapter = $(element).data('select2').results;
									var loading = {
										disabled: true,
										loading: true,
										text: data.errorMessage
									};
									var $loading = resultAdapter.option(loading);
									$loading.className += ' error';
									resultAdapter.clear();
									$(element).data('select2').$results.prepend($loading);
								}, 0);
								return { results: [] };
							}
							return {
								results: data,
								pagination: {
									more: data.length == 40
								}
							};
						}
					},
					placeholder: placeholder,
					allowClear: allowClear,
					closeOnSelect: false,
					language: "ru",
					templateResult: checkBoxTemplateResultFact(customSelect),
					templateSelection: ajaxTemplateSelectionFact(customSelect),
					current: function(el, callback) {
						var data = [];
						var value = valueProperty() || [];
						if (typeof value === "string")
							value = value.split(",");

						if (value.length > 0) {
							$.each(value, function(i, item) {
								if (item !== null && item !== undefined)
									data.push({ id: item.id || item, text: item.text || item });
								else
									console.error("элемент для выбора в select2 некорректен");
							});
							callback(data);
						}
					}
				};

				var afterInit = function(data) {

					//обработка выбора и снятия выбора
					customSelect.on("select2:selecting", function(event) {
						var $t = $(event.params.args.data.element[0].parentElement);
						if (!$t.hasClass('checkbox'))
							$t = $('.checkbox', $t);
						var has = $t.hasClass('checked');
						$t.toggleClass('checked');
						if (has) {
							$(element).data('select2').dataAdapter.unselect(event.params.args.data);
						} else {
							//do nothing, select2 make the work
							$(element).data('select2').dataAdapter.select(event.params.args.data);
						}
						event.preventDefault();
					});

					// при закрытии устанавливаем значение переменной
					customSelect.on("select2:closing", function(event) {
						var selectedOptions = $(element).select2('data');
						var optionValues = [];
						if (selectedOptions != null && selectedOptions.length > 0)
							for (var i = 0; i < selectedOptions.length; i++)
								if (selectedOptions[i].id !== "")
									optionValues.push(selectedOptions[i].id);
						//не требуется
						//$(element).val(optionValues);
						if (updateOnClose && typeof(valueProperty) === 'function')
							valueProperty(valueType === "array" ? optionValues : optionValues.join(","));

					});

					ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
						$(element).select2('destroy');
					});
				};
				multipleSelect(customSelect, options, afterInit);
			}
		};

		ko.bindingHandlers.select2customers = {
			init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
				var url = allBindings().attr.url;
				var placeholder = allBindings().attr.placeholder;
				if (placeholder == null || placeholder == '')
					placeholder = "Выберите элемент";
				$(element).select2({
					allowClear: true,
					ajax: {
						url: url,
						dataType: 'json',
						data: function(term, page) {
							return {
								term: term.term,
								page: ((term.page || 1) -1),
								limit: 20
							};
						},
						processResults: function (data) {
							return {
								results: data,
								pagination: {
									more: data.length == 20
								}
							};
						}
					},
					placeholder: placeholder,
					current: function (el, callback) {
						var value = el.getValueForSelect2();
						if (value == null)
							return;
						var lid = $(element).attr['lid'];
						var ltext = $(element).attr['ltext'];
						if (lid == null || ltext == null)
							return;
						var data = { id: lid, text: ltext };
						$(element).attr['lid'] = null;
						$(element).attr['ltext'] = null;
						callback(data);
					},
					templateResult: function (item) {
						if (item.loading === true)
							return item.text;
						var attrs = "";
						if (item.attrs != null) {
							$.each(item.attrs, function (id, idata) {
								if (idata != null && idata.length > 0) {
									attrs += '<p>' + idata + '</p>';
								}
							});
						}
						return (item.text != null ? '<b>' + item.text + '</b><br>' : "") + attrs;
					},
					templateSelection: function (item) {
						var attrs = "";
						if (item.attrs != null) {
							$.each(item.attrs, function (id, idata) {
								if (idata != null && idata.length > 0) {
									attrs += idata + " ";
								}
							});
						}
						return item.text != null ? item.text : attrs;
					},
					escapeMarkup: function (m) { return m; }
				});
				ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
					$(element).select2('destroy');
				});
			},
			update: function(element, valueAccessor) {
				var value = valueAccessor();
				if (typeof(value) === "function") {
					$(element).val(value()).trigger('change');
				} else {
					$(element).val(value).trigger('change');
				}
			}
		};

		ko.bindingHandlers.select2servicepassports = {
			init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {

				var placeholder = null;

				if (allBindings().attr) {
					placeholder = allBindings().attr.placeholder;
				}

				if (placeholder == null || placeholder == '') {
					placeholder = "Выберите паспорт услуги";
				}

				valueAccessor().subscribe(function (newValue) {
					$(element).select2('val', newValue);
				});

				$(element).select2({
					tags: false,
					placeholder: placeholder,
					allowClear: false,
					ajax: {
						url: '/Nvx.ReDoc.StateStructureServiceModule/ServiceController/ServiceGroupsList',
						method: 'POST',
						dataType: 'json',
						delay: 700,
						data: function (term) {
							return {
								filterBy: "all",
								groupBy: "",
								sortBy: "FullName",
								sortOrder: "ASC",
								searchText: term.term
							};
						},
						processResults: function (data) {
							if (data.hasError !== true
								&& data.list != null
								&& data.count > 0) {
								return {
									results: data.list[0].list
								};
							}
							else {
								return {
									results: []
								};
							}
						}
					},
					templateResult: function (item) {
						if (item.loading === true)
							return item.text;
						var markup =
							'<div class="user-of-table" style="height: 35px; white-space: nowrap; text-overflow: ellipsis;">' +
								'<div class="name-of-temp" title="' + item.name + '">' + item.name + '</div>' +
								'</div>';
						return markup;
					},
					templateSelection: function (item) {
						if (item.id === "" || item.id === "-1")
							return item.text;

						return item.name;
					},
					current: function (el, callback) {
						callback();
					},
					escapeMarkup: function (m) { return m; },
					minimumInputLength: 0,
				});

				ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
					$(element).select2('destroy');
				});

			},
			update: function (element, valueAccessor) {
				var value = valueAccessor();
				if (typeof (value) === "function") {
					$(element).val(value()).trigger('change');
				} else {
					$(element).val(value).trigger('change');
				}
			}
		};

		ko.bindingHandlers.select2simple = {
			init: function (element, valueAccessor, allBindings, viewModel) {
				$(element).select2({
					allowClear: true,
					placeholder: "Выберите элемент",
					current: function (el, callback) {
						var value = el.getValueForSelect2();
						if (value != null) {
							callback({ id: value });
						}
					}
				});
				ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
					$(element).select2('destroy');
				});
			},
			update: function (element, valueAccessor) {
				var value = valueAccessor();
				if (typeof (value) === "function") {
					$(element).val(value()).trigger('change');
				} else {
					$(element).val(value).trigger('change');
				}
			}
		};


		ko.bindingHandlers.select2simpleArray = {
			init: function (element, valueAccessor, allBindings, viewModel) {

				var itemCssClass = valueAccessor().itemCssClass || 'item';
				var placeholder = valueAccessor().placeholder || 'Выберите элемент';

				var dataArray = [];

				var initObject = {
					allowClear: false,
					placeholder: placeholder,
					minimumResultsForSearch: Infinity,
					language: {
						"noResults": function () {
							return 'Нет значений';
						}
					},
					tags: false,
					escapeMarkup: function (m) { return m; },
					templateResult: function (item) {
						var text = item.text ? item.text : item.title;
						return text;
						//var markup = '<div class="' + itemCssClass + '" title="' + text + '">' + text + '</div>';
						//return markup;
					},
					templateSelection: function (item) {
						return item.text ? item.text : item.title;
					},
					data: dataArray,
				};

				//если передали массив биндинге
				var data = valueAccessor().data;
				if (data) {
					if (typeof (data) === "function") {
						dataArray = data();
						//проинициализировать селект, когда массив изменился.
						//TODO: придумать как сделать обновление data в селекте по-другому
						data.subscribe(function (newValue) {
							dataArray = newValue;
							initObject.data = dataArray;
							$(element).children('option').remove();
							$(element).select2(initObject);
						});
					} else {
						dataArray = data;
					}
				}

				initObject.data = dataArray;
				$(element).select2(initObject);

				//следить за выбранным значением
				allBindings().value.subscribe(function (newValue) {
					$(element).val(newValue).trigger("change");
				});

				//выставить значение, переданное при инициализации
				if (allBindings().initValue
					&& allBindings().value() == undefined
					&& allBindings().initValue()) {
					$(element).val(allBindings().initValue()).trigger("change");
				}

				ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
					$(element).select2('destroy');
				});
			},
			update: function (element, valueAccessor) {
				
				//var value = valueAccessor();
				//if (typeof (value) === "function") {
				//	$(element).val(value()).trigger('change');
				//} else if (typeof (value.data) === "function") {
				//	if (value.data() && value.data().length > 0) {
				//		$(element).val(value.data()[0].id).trigger('change');
				//	}
				//} else {
				//	$(element).val(value).trigger('change');
				//}
			}
		};

		ko.bindingHandlers.nvxReDocCheckBox = {
			init: function (element, valueAccessor, allBindingsAccessor) {
				var el = $(element);

				if (el == null) return;

				el.addClass('label_check');

				var opt = allBindingsAccessor().reDocOptions;
				var text = opt ? opt.text || '' : '';
				var checkbox = document.createElement('input');
				checkbox.type = "checkbox";
				checkbox.value = ko.utils.unwrapObservable(valueAccessor()) === true;
				//добавил checked
				checkbox.checked = ko.utils.unwrapObservable(valueAccessor()) === true;
				if (el[0].htmlFor) {
					checkbox.id = el[0].htmlFor;
					checkbox.name = el[0].htmlFor;
				}

				el.append(checkbox);
				if (text) {
					var span = document.createElement('span');
					span.textContent = opt.text;
					el.append(span);
				}

				if ($(checkbox).is(':checked')) {
					el.addClass('c_on');
				} else {
					el.removeClass('c_on');
				}

				ko.utils.registerEventHandler(checkbox, "click", function () {
					var observable = valueAccessor();
					if ($(checkbox).is(':checked')) {
						observable(true);
					} else {
						observable(false);
					}
				});

				ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
					$(checkbox).off();
				});
			},
			update: function (element, valueAccessor) {
				var el = $(element);

				if (el == null) return;

				var value = ko.utils.unwrapObservable(valueAccessor());
				if (value === true) {
					el.addClass('c_on');
				} else {
					el.removeClass('c_on');
				}
			}
		};

		//TODO ОПТИМИЗИРОВАТЬ!!!
		ko.bindingHandlers.filterDatepicker = {
			init: function (element, valueAccessor, allBindingsAccessor) {
				//initialize datepicker with some optional options
				var options = allBindingsAccessor().dOptions || {},
					$el = $(element);

				var stopBuble = function (event) {
					event.stopPropagation();
				};

				if (!options.onClose) {
					options.onClose = function () {
						$('.ui-datepicker').unbind('click', stopBuble);
					};
				};
				if (!options.beforeShow) {
					options.beforeShow = function () {
						$('.ui-datepicker').on('click', stopBuble);
					};
				};

				if (!options.onSelect) {
					options.onSelect = function (value, inst) {
						//при кастомном onselect change не вызывается
						inst.input.trigger('change');
					};
				}

				$el.datepicker(options).on("blur", function (e) {
					var dp = $(this);
					setTimeout(function () {
						//var elem = $(document.activeElement);
						var elem = $(':hover');
						if (!elem.hasClass("hasDatepicker") &&
							!elem.hasClass("ui-datepicker") &&
							!elem.hasClass("ui-icon") &&
							!elem.hasClass("ui-datepicker-next") &&
							!elem.hasClass("ui-datepicker-prev") &&
							!$(elem).parents(".ui-datepicker").length) {
							dp.datepicker("hide");
						}
					}, 100);
				});

				var getDate = function (datePicker) {
					var datePicker = $(datePicker);
					var format = datePicker.datepicker("option", "dateFormat"),
						text = datePicker.val(),
						settings = datePicker.datepicker("option", "settings");
					return $.datepicker.parseDate(format, text, settings);
				}

				//handle the field changing by registering datepicker's changeDate event
				ko.utils.registerEventHandler(element, "change", function (jevent) {
					var observable = valueAccessor();
					var dateValue;
					if ($el.val() === '') {
						observable(null);
						return;
					}
					try {
						dateValue = $.datepicker.parseDate('dd.mm.y', $el.val());
						observable(dateValue);
					} catch (error) {
						try {
							dateValue = getDate(element);
							observable(dateValue);
						} catch (error) {

						}
					}
				});
				
				var LastCharIsDot = function (str) {
					if (str && str.length > 0) {
						return str.slice(-1) === '.';
					}
					return false;
				}

				var isNullOrWhiteSpace = function (str) {
					return str === null || str.match(/^ *$/) !== null;
				}

				var SetSmartMask = function (p) {
					var appendDot = false;
					// на случай корректировки выбранной даты.
					var hasText = false;
					var charsRegex = /[\s,./\\-]+/;
					var split = p.split(charsRegex);
					var output = '';

					if (split.length > 0) {
						var day = 0;
						var last = split[split.length - 1];
						if (!isNullOrWhiteSpace(last)) {
							day = parseInt(last, 10);
							if (!isNaN(day)) {
								switch (split.length) {
									case 1:
										if (split[split.length - 1].length == 2) appendDot = true;
										else if (day > 3 && day < 99) appendDot = true;
										break;
									case 2:
										if (day > 1 && day < 99) appendDot = true;
										if (split[split.length - 1].length == 2) appendDot = true;
										break;
									case 3:
										if (split[split.length - 1].length > 4)
											split[split.length - 1] = split[split.length - 1].substring(0, 4);
										break;
								}
							}
						}
					}


					//добавляем разделенные части с соединителем где требуется.
					if (split.length > 1) {
						for (var i = 0; i < split.length; i++) {
							if (!isNullOrWhiteSpace(split[i])) {
								var day = 0;
								day = parseInt(split[i], 10);
								if (isNaN(day)) {
									hasText = true;
								}
								output += split[i];
								if (i < split.length - 1)
									output += '.';
							} else if (!LastCharIsDot(output)) {
								appendDot = true;
								output += '.';
							}
						}
					} else
						output += split[0];

					if (appendDot)
						output += '.';

					if (!hasText) p = output;

					return {
						p: p,
						appendDot: appendDot
					}
				}

				function setSelectionRange(input, selectionStart, selectionEnd) {
					if (input.setSelectionRange) {
						input.focus();
						input.setSelectionRange(selectionStart, selectionEnd);
					}
					else if (input.createTextRange) {
						var range = input.createTextRange();
						range.collapse(true);
						range.moveEnd('character', selectionEnd);
						range.moveStart('character', selectionStart);
						range.select();
					}
				}

				function setCaretToPos(input, pos) {
					setSelectionRange(input, pos, pos);
				}

				function getInputSelection(el) {
					var start = 0, end = 0, normalizedValue, range,
						textInputRange, len, endRange;

					if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
						start = el.selectionStart;
						end = el.selectionEnd;
					} else {
						range = document.selection.createRange();

						if (range && range.parentElement() == el) {
							len = el.value.length;
							normalizedValue = el.value.replace(/\r\n/g, "\n");

							// Create a working TextRange that lives only in the input
							textInputRange = el.createTextRange();
							textInputRange.moveToBookmark(range.getBookmark());

							// Check if the start and end of the selection are at the very end
							// of the input, since moveStart/moveEnd doesn't return what we want
							// in those cases
							endRange = el.createTextRange();
							endRange.collapse(false);

							if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
								start = end = len;
							} else {
								start = -textInputRange.moveStart("character", -len);
								start += normalizedValue.slice(0, start).split("\n").length - 1;

								if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
									end = len;
								} else {
									end = -textInputRange.moveEnd("character", -len);
									end += normalizedValue.slice(0, end).split("\n").length - 1;
								}
							}
						}
					}

					return {
						start: start,
						end: end
					};
				}


				//добавляем маску на датапикер
				ko.utils.registerEventHandler(element, "keypress", function (jevent) {
					var value = $el.val();
					if (!LastCharIsDot(value)) {
						var selection = getInputSelection(element);
						var selectionLast = selection.start;
						var selectionEnd = selection.end;
						var rez = SetSmartMask(value);
						var newText = rez.p;
						var dotAppended = rez.appendDot;
						if (dotAppended) {
							//(value == null || value.length > 0) && 
							if (jevent.keyCode == 8 && selectionLast > 0) {
								//var removed = jevent.keyCode == 8;//||jevent.keyCode == 46

								newText = value.substring(0, selectionLast - 1);
								if (value.Length > selectionLast)
									newText += value.substring(selectionLast + 1, value.Length - selectionLast - 1);
								selectionLast--;
							} else {
								selectionLast++;
							}

						}
						$el.val(newText);
						setSelectionRange(element, selectionLast, selectionEnd + (selectionLast - selection.start));
					}
					//$el.
				});

				//handle disposal (if KO removes by the template binding)
				ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
					$el.unbind("blur");
					$el.datepicker("destroy");
				});

			},
			update: function (element, valueAccessor, allBindingsAccessor) {
				var value = ko.utils.unwrapObservable(valueAccessor()),
					$el = $(element);

				var options = allBindingsAccessor().dOptions || {};

				var dateStr = typeof value === 'string' ? value : null;

				//handle date data coming via json from Microsoft
				if (String(value).indexOf('/Date(') == 0) {
					value = new Date(parseInt(value.replace(/\/Date\((.*?)\)\//gi, "$1")));
				}

				if (typeof value === 'string' && value.length > 10) {
					var date = new Date(value);
					var time = date.getTime();
					if (!isNaN(time)) {
						value = date;
					}
				}
				
				var current = $el.datepicker("getDate");

				if (value instanceof Date && value - current !== 0 && !isNaN(value.getTime())) {
					if (!options.useTimezone)
						value = dateFormater.getDate(dateStr) || value;

					$el.datepicker("setDate", value);
				}
			}
		};

		// Плоский календарь с выбором промежутка дат
		ko.bindingHandlers.rangeSelectorDatepicker = {
			init: function (element, valueAccessor) {
				// определяем параметры виджета
				var cssClass = valueAccessor().cssClass || "";
				var action = valueAccessor().onSelectAction || null;
				var dateFormat = valueAccessor().dateFormat || "yy-mm-dd";

				// скрытые элементы, содержащие выбранный промежуток дат
				var $el = $(element);
				var $begin = $('#begin' + $el.attr('id'));
				var $end = $('#end' + $el.attr('id'));

				// обработка выбора периода
				if (action != null) {
					$begin.trigger("change");
					$end.trigger("change");
					action();
				}

				$el.datepicker({
					minDate: null,
					numberOfMonths: [1, 1],
					dateFormat: dateFormat,
					beforeShowDay: function (date) {
						var date1 = $.datepicker.parseDate(dateFormat, $begin.val());
						var date2 = $.datepicker.parseDate(dateFormat, $end.val());
						return [true, date1 && ((date.getTime() == date1.getTime()) || (date2 && date >= date1 && date <= date2)) ? cssClass : ""];
					},
					onSelect: function (dateText) {
						var date1 = $.datepicker.parseDate(dateFormat, $begin.val());
						var date2 = $.datepicker.parseDate(dateFormat, $end.val());
						var selectedDate = $.datepicker.parseDate(dateFormat, dateText);

						if (!date1 || date2) {
							$begin.val(dateText);
							$end.val("");
							$(this).datepicker();
						} else if (selectedDate < date1) {
							$end.val($begin.val());
							$begin.val(dateText);
							$(this).datepicker();
						} else {
							$end.val(dateText);
							$(this).datepicker();
						}

						// обработка выбора периода
						if (action != null) {
							$begin.trigger("change");
							$end.trigger("change");
							action();
						}
					}
				});
			}
		};

		/** Ввод в поле данных по маске, допустимы только цифры.
			Вид маски - спец. символы и символы '_', на место которых вводятся цифры.
			Например, '__:__' или (___) ___-____  */
		ko.bindingHandlers.digitMask = {
			init: function (element, valueAccessor, allBindings) {
				var mask = valueAccessor().split('');

				// Удаление символов - не цифр
				function stripMask(maskedData) {
					function isDigit(chara) {
						return /\d/.test(chara);
					}

					var unmaskedData = '';
					for (var i = 0; i < maskedData.length; i++) {
						if (maskedData[i] !== mask[i]) {
							unmaskedData += maskedData[i];
						}
					}

					var m = unmaskedData.split('').filter(isDigit);
					return m;
				}

				// Замена '_' на введенный символ
				function applyMask(data) {
					var m = mask.map(function (chara) {
						if (chara !== '_') return chara;
						if (data.length === 0) return chara;
						return data.shift();
					}).join('');

					return m;
				}

				function setMask(){
					var oldStart = element.selectionStart;
					var oldEnd = element.selectionEnd;

					//применяем маску
					element.value = applyMask(stripMask(element.value));

					element.selectionStart = oldStart;
					element.selectionEnd = oldEnd;
				}

				function atKeydown(event) {
					var elementValue = element.value;
					var oldStart = element.selectionStart;
					var oldEnd = element.selectionEnd;
					var key = event.keyCode || event.charCode;

					if(oldStart == oldEnd) {
						if (key == 46) {	//del - если следующий символ не цифра или маска, пытаемся удалить далее
							var realEnd = oldEnd + 1;
							while (realEnd < mask.length && !elementValue.slice(realEnd - 1, realEnd).match(/[\d_]+/)) {realEnd++}
							elementValue = elementValue.slice(0,oldStart) + elementValue.slice(realEnd);
						}

						if (key == 8) {	//backspace - если прыдудущий символ не цифра или маска, делаем шаг левее
							while (oldStart > 0 && !elementValue.slice(oldStart - 1, oldStart).match(/[\d_]+/)) {oldStart--; oldEnd--}
							elementValue = elementValue.slice(0,oldStart - 1) + elementValue.slice(oldEnd);
							oldStart--; oldEnd--;
						}
					} else if (key == 46 || key == 8) {	//если выделен диапазон удаляем только числа в нем. del || backspace
						elementValue = elementValue.slice(0,oldStart) + elementValue.slice(oldEnd);
						oldEnd = oldStart;	//убираем выделение
					}

					//отключаем действие клавиш del и backspace
					if (key == 46 || key == 8) {
						event.stopPropagation();
						event.preventDefault();
					}

					//применяем маску
					element.value = applyMask(stripMask(elementValue));

					element.selectionStart = oldStart;
					element.selectionEnd = oldEnd;
				}

				function changed(event) {
					var key = event.keyCode || event.charCode;
					var isDigit = String.fromCharCode(key).match(/\d+/);

					var oldStart = element.selectionStart;
					var oldEnd = element.selectionEnd;

					if(isDigit){
						element.value = element.value.slice(0,element.selectionStart) + isDigit[0] + element.value.slice(element.selectionStart);
						oldStart++; oldEnd++;
					}

					element.value = applyMask(stripMask(element.value));
					
					if(isDigit){
						while (oldStart < mask.length && mask[oldStart] !== '_') {
							oldStart++; oldEnd++;
						}
					}

					element.selectionStart = oldStart;
					element.selectionEnd = oldEnd;

					event.stopPropagation();
					event.preventDefault();
				}

				function save() {
					if (allBindings.has('textInput')) {
						var value = allBindings.get('textInput');
						value(element.value);
					}
				}
				
				element.addEventListener('click', setMask);
				element.addEventListener('keydown', atKeydown);
				element.addEventListener('keyup', setMask);
				element.addEventListener('keypress', changed);
				element.addEventListener('blur', save);
			},
		};


		var linkSimpleRegex = /(&lt;a href=\"?'?(?:.*?)\"?'?)(&gt;)((?:[\s\S]*)&lt;\/a&gt;)/g;
		var sSimpleRegex = /(&lt;s&gt;)([\s\S]*)(&lt;\/s&gt;)/g;
		var scriptSimpleRegex = /(&lt;script&gt;)([\s\S]*)(&lt;\/script&gt;)/g;
		var brSimpleRegex = /(&lt;br&gt;|&lt;br\/&gt;)/g;
		var spanLinkSimpleRegex = /(&lt;span .*)(&gt;[\s\S]*)(&lt;\/span&gt;)/g;
		var possibleAllowedTags = ["s", "a", 'span'];
		var replaceAt = function(str, index, character) {
			return str.substr(0, index) + character + str.substr(index + character.length);
		};
		var replaceAlgoritms = {
			'span': {
				regex: spanLinkSimpleRegex,
				func: function (str, g1, g2, g3) {
					var begin = g1.replace(/\&lt;/, '<');
					var mid = g2.replace(/\&gt;/, '>');
					var end = g3.replace(/\&gt;/g, '>').replace(/\&lt;/g, '<');
					var result = begin + mid + end;
					return result;
				}
			},
			's': {
				regex: sSimpleRegex,
				func: function(str, g1, g2, g3) {
					return '<s>' + g2 + '</s>';
				}
			},
			'br': {
				regex: brSimpleRegex,
				func: function(str) {
					return '<br>';
				}
			},
			'a': {
				regex: linkSimpleRegex,
				func: function (str, g1, g2, g3) {
					var end = replaceAt(g3, g3.length - 1, '>');
					end = replaceAt(end, end.length - 3, '>');
					var result = replaceAt(g1, 1, '<') + '>' + end;
					return result;
				}
			},
			'script' : {
				regex: scriptSimpleRegex,
				func: function(str, g1, g2, g3) {
					return "";
				}
			}
		};
		ko.bindingHandlers.bodyreformat = {
			init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
				var allowedTags = ko.utils.unwrapObservable(allBindingsAccessor().allowedTags);
				if (allowedTags == null)
					return;

				if (!(allowedTags instanceof Array)) {
					throw new Error("allowedTags must be array");
				}
				for (var i = 0; i < allowedTags.length; i++) {
					var tag = allowedTags[i];
					if (possibleAllowedTags.indexOf(tag)<0) {
						console.error("allowedTags can contain only 's', 'a', 'br', 'span' tags");
					}
				}
			},
			update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var value = ko.utils.unwrapObservable(valueAccessor()),
					allowedTags = ko.utils.unwrapObservable(allBindingsAccessor().allowedTags),
					$el = $(element);
				$el.empty();

				var encodedValue = $.htmlEncode(value).replaceNewLinesToBr();
				var result;
				if (allowedTags != null && allowedTags.length > 0) {
					result = encodedValue;
					$.each(allowedTags, function (i, tag) {
						var alg = replaceAlgoritms[tag];
						if (alg) {
							if (tag == 'span' && (result.match(/span/g) || []).length > 2) {
								// в строке несколько span ссылок
								var parts = result.split('<br>');
								result = '';
								parts.forEach(function (part, ind) {
									if (ind != 0) {
										result += '<br>';
									}
									result += part.replace(alg.regex, alg.func);
								});
							} else {
								result = result.replace(alg.regex, alg.func);
							}
						}
						
					});
				} else {
					var tagIndex = encodedValue.indexOf('&lt;/');
					var right = '';
					if (tagIndex != -1) {
						right = encodedValue.substr(tagIndex);
						encodedValue = encodedValue.substr(0, tagIndex);
					}
					result = reDocUrlQualifier.getReformated(encodedValue) + right;
				}
				$el.append(result);
			}
		};

		ko.bindingHandlers.scriptdel = {
			init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
				var value = ko.utils.unwrapObservable(valueAccessor()),
					$el = $(element);
				$el.empty();
				if (value == null)
					return;
				var result = $.htmlEncode(value).replaceNewLinesToBr();
				var alg = replaceAlgoritms['script'];
				result = result.replace(alg.regex, alg.func);
				$el.append($.htmlDecode(result));
			},
			update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var value = ko.utils.unwrapObservable(valueAccessor()),
					$el = $(element);
				$el.empty();
				if (value == null)
					return;
				var result = $.htmlEncode(value).replaceNewLinesToBr();
				var alg = replaceAlgoritms['script'];
				result = result.replace(alg.regex, alg.func);
				$el.append($.htmlDecode(result));
			}
		};

		//var linkPattern = /(<!\\\\)\\[redoc:)(?<query>.+?)((?<!\\\\)\\|)(?<text>.*?)((?<!\\\\)]/
		var linkPattern = /\[redoc:(.+?)\|(.*?)]/g;
		var fullRecIdPattern = /fullrecid=(.+?)(?:\|)?$/;
		ko.bindingHandlers.commentreformat = {
			init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
				var allowedTags = ko.utils.unwrapObservable(allBindingsAccessor().allowedTags);
				if (allowedTags == null)
					return;

				if (!(allowedTags instanceof Array)) {
					throw new Error("allowedTags must be array");
				}
				for (var i = 0; i < allowedTags.length; i++) {
					var tag = allowedTags[i];
					if (possibleAllowedTags.indexOf(tag)<0) {
						console.error("allowedTags can contain only 's', 'a', 'br', 'span' tags");
					}
				}
			},
			update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var value = ko.utils.unwrapObservable(valueAccessor()),
					allowedTags = ko.utils.unwrapObservable(allBindingsAccessor().allowedTags),
					$el = $(element);
				$el.empty();

				var encodedValue = $.htmlEncode(value).replaceNewLinesToBr();
				var result;
				if (allowedTags != null && allowedTags.length > 0) {
					result = encodedValue;
					$.each(allowedTags, function (i, tag) {
						var alg = replaceAlgoritms[tag];
						if (alg) {
							if (tag == 'span' && (result.match(/span/g) || []).length > 2) {
								// в строке несколько span ссылок
								var parts = result.split('<br>');
								result = '';
								parts.forEach(function (part, ind) {
									if (ind != 0) {
										result += '<br>';
									}
									result += part.replace(alg.regex, alg.func);
								});
							} else {
								result = result.replace(alg.regex, alg.func);
							}
						}
						
					});
				} else {
					result = reDocUrlQualifier.getReformated(encodedValue);
				}
				result = result.replace(linkPattern, function(match, group1, group2) {
					var queryMatch = group1.match(fullRecIdPattern);
					if (queryMatch != null) {
						var fullRecId = queryMatch[1];
						var recId = fullRecId.substring(fullRecId.indexOf("\\") + 1);
						return "<span class='a' data-bind=\"click: $parent.goToComponent.bind($data, '" + recId + "')\">" + group2 + "</span>";
					}
					return "";
				});
				$el.append(result);
			}
		};

		ko.bindingHandlers.enterkey = {
			init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
				var allBindings = allBindingsAccessor();
				$(element).keypress(function (event) {
					var keyCode = (event.which ? event.which : event.keyCode);
					if (keyCode === 13) {
						allBindings.enterkey.call(viewModel);
						return false;
					}
					return true;
				});
			}
		};

		//Для получения старого и нового значений при подписке.
		//Использовать так: MyViewModel.MyObservableProperty.subscribeChanged(function (newValue, oldValue) { });
		ko.subscribable.fn.subscribeChanged = function (callback) {
			var oldValue;
			this.subscribe(function (_oldValue) {
				oldValue = _oldValue;
			}, this, 'beforeChange');

			this.subscribe(function (newValue) {
				callback(newValue, oldValue);
			});
		};

		//для работы биндинга нужно подгрузить css классы icon-chevron-down-gray, rotate90-counter-clockwise
		ko.bindingHandlers.slideArrowBefore = {
			init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
				var opt = allBindingsAccessor();
				//селктор для элемента который надо скрыть\показать, если не указан то скрываются siblings 
				var targetSelector = opt.targetSelector;
				var classes = opt.class || '';
				var arrowElement = document.createElement('span');
				arrowElement.className = 'icon icon-chevron-down-gray';
				arrowElement.className += classes;
				//element.appendChild(arrowElement);
				element.insertBefore(arrowElement, element.firstChild);

				//скрыть/показать слайд
				var toggleSlide = function (changeMinimizedGroup) {
					var slideElement;
					if (targetSelector && targetSelector !== '') {
						slideElement = $(targetSelector);
					} else {
						slideElement = $(element).siblings();
					}

					if (changeMinimizedGroup) {
						var minimizedGroup = valueAccessor().minimizedGroup;
						if (typeof (minimizedGroup) === 'function') {
							var m = $(slideElement).is(':visible');
							if (m !== minimizedGroup()) {
								minimizedGroup(m);
								return;
							}
						}
					}

					$(arrowElement).toggleClass('rotate90-counter-clockwise');
					slideElement.toggle();
					
				};

				$(element).addClass('pointer');
				$(element).click(function () {
					toggleSlide(true);
				});

				//свернуть элемент при инициализации
				var minimized = false;
				var mg = valueAccessor().minimizedGroup;
				if (typeof (mg) === 'function') {
					minimized = mg();
					mg.subscribe(function() {
						toggleSlide();
					});
				}
				else {
					minimized = mg;
				}

				if (minimized === true) {
					$(arrowElement).addClass('rotate90-counter-clockwise');
					$(element).siblings().hide();
				}
			}
		};

		ko.bindingHandlers.slideArrowBefore2 = {
			init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
				var val = valueAccessor();
				var minimized = val.minimized || true;
				var contentClass = val.contentClass || 'slideContent';
				var hideClass = val.hideClass || 'hide';

				var slideContentSelector = $(element).parent().siblings('.' + contentClass);

				//свернуть элемент при инициализации
				if (minimized === true) {
					$(element).addClass(hideClass);
					slideContentSelector.addClass(hideClass);
					slideContentSelector.hide();
				}

				$(element).click(function () {
					slideContentSelector = $(element).parent().siblings('.' + contentClass);
					$(element).toggleClass(hideClass);
					slideContentSelector.toggleClass(hideClass);
					slideContentSelector.toggle();
				});
			}
		};

		ko.bindingHandlers.dateFormat = {
			update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var value = ko.utils.unwrapObservable(valueAccessor());
				var opt = allBindingsAccessor();
				var format = opt.format;
				var placeHolder = opt.placeHolder || '';
				var resultStr;
				if (value && value != '') {
					switch (format) {
						case "FullDate":
							resultStr = dateFormater.toFullDateString(value);
							break;
						case "Date":
							resultStr = dateFormater.toDateString(value);
							break;
						case "Simple":
							resultStr = value.replace('T', ' в ');
							break;
						default:
							resultStr = dateFormater.toDateString(value);
							break;
					}
					ko.utils.setTextContent(element, resultStr);
				} else {
					ko.utils.setTextContent(element, placeHolder);
				}
			}
		};

		//биндинг для добавления своих переменных в контекст биндинга(нужен при обращении к какой-то вышестоящей модели и разных, по вложенности мест)
		//биндинг взял с офф сайта knockout'а
		ko.bindingHandlers.withProperties = {
			init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
				// Make a modified binding context, with a extra properties, and apply it to descendant elements
				var innerBindingContext = bindingContext.extend(valueAccessor);
				ko.applyBindingsToDescendants(innerBindingContext, element);

				// Also tell KO *not* to bind the descendants itself, otherwise they will be bound twice
				return { controlsDescendantBindings: true };
			}
		};

		ko.bindingHandlers.documentScroll = {
			init: function(element, valueAccessor) {
				var valueAccessorInstance = valueAccessor;
				window.onscroll = function() {
					var scrolled = window.pageYOffset || document.documentElement.scrollTop;
					valueAccessorInstance()(scrolled);
				};
			}
			//
		};

		var ymapUtil = {
			// Создание карты
			createMap: function (elementId, state) {
				state.controls = ["zoomControl", "fullscreenControl", "typeSelector", "geolocationControl", "searchControl"];
				state.zoom = 12;
				var map = new ymaps.Map(elementId, state);
				map.controls.get('searchControl').options.set('size', 'small');
				map.controls.get('typeSelector').options.set('size', 'small');
				return map;
			},
			// Создание карты с текущим положением пользователя
			createCurrentLocationMap: function (element, res) {
				var mapContainer = $(element),
				bounds = res.geoObjects.get(0).properties.get('boundedBy'),
				// Рассчитываем видимую область для текущей положения пользователя
				mapState = ymaps.util.bounds.getCenterAndZoom(
					bounds,
					[mapContainer.width(), mapContainer.height()]
				);
				return ymapUtil.createMap(element.id, mapState);
			},
			// Создание метки
			createPlacemark: function (coords, draggable, iconContent, placemarkColor) {
				var text = iconContent ? iconContent : '';

				return new ymaps.Placemark(coords, {
					iconContent: text
				}, {
					//preset: 'islands#darkBlueStretchyIcon',
					preset: 'islands#redDotIcon',
					draggable: draggable,
					iconColor:  placemarkColor || '#FF0000'
				});
			},

			// Определяем адрес по координатам (обратное геокодирование)
			getAddress: function (placemark, coords) {
				placemark.properties.set('iconContent', 'поиск...');
				ymaps.geocode(coords).then(function (res) {
					var firstGeoObject = res.geoObjects.get(0);

					placemark.properties.set({
						iconContent: firstGeoObject.properties.get('name')
						//balloonContent: firstGeoObject.properties.get('text')
					});
				});
			},

			// Задает координаты для метки
			setPlacemark: function (map, placemark, coords) {
				// Если метка уже создана – просто передвигаем ее
				if (placemark) {
					placemark.geometry.setCoordinates(coords);
				}
					// Если нет – создаем
				else {
					placemark = ymapUtil.createPlacemark(coords, true);
					map.geoObjects.add(placemark);
					// Слушаем событие окончания перетаскивания на метке
					placemark.events.add('dragend', function () {
						ymapUtil.getAddress(placemark, placemark.geometry.getCoordinates());
					});
				}
				ymapUtil.getAddress(placemark, coords);

				return placemark;
			},

			//Создать прямую линию по координатам
			createLine: function(startCoords, finishCoords) {
				var line = new ymaps.GeoObject({
					// Описываем геометрию геообъекта.
					geometry: {
						// Тип геометрии - "Ломаная линия".
						type: "LineString",
						// Указываем координаты вершин ломаной.
						coordinates: [
							startCoords,
							finishCoords
						]
					},
					// Описываем свойства геообъекта.
					properties: {
					}
				}, {
					// Задаем опции геообъекта.
					// Выключаем возможность перетаскивания ломаной.
					draggable: false,
					// Цвет линии.
					strokeColor: "#FF0000",
					// Ширина линии.
					strokeWidth: 5,
					// Первой цифрой задаем длину штриха. Второй цифрой задаем длину разрыва.
					strokeStyle: '5 3',
					// Коэффициент прозрачности.
					strokeOpacity: 0.5
				});

				return line;
			},
			createLineString: function (coordinates, reverseCoordinates, borderColor) {
				if (reverseCoordinates === true) {
					coordinates.forEach(function(pair) {
						 pair.reverse();
					});
				}
				var line = new ymaps.GeoObject({
					geometry: {
						type: "LineString",
						coordinates: coordinates
					},
					properties: {}
				}, {
					// Задаем опции геообъекта.
					// Выключаем возможность перетаскивания ломаной.
					draggable: false,
					// Цвет линии.
					strokeColor: borderColor || '#FF0000',
					// Ширина линии.
					strokeWidth: 7,
					// Первой цифрой задаем длину штриха. Второй цифрой задаем длину разрыва.
					strokeStyle: '5 0',
					// Коэффициент прозрачности.
					strokeOpacity: 0.5
				});

				return line;
			},
			createPolygon: function (coordinates, reverseCoordinates, borderColor) {
				if (reverseCoordinates === true) {
					coordinates.forEach(function(polyData) {
						polyData.forEach(function(pair) {
							pair.reverse();
						});
					});
				}
				var polygon = new ymaps.GeoObject({
						geometry: {
							type: "Polygon",
							coordinates: coordinates
						}
					}, {
						// Задаем опции геообъекта.
						// Выключаем возможность перетаскивания ломаной.
						draggable: false,
						// Цвет линии.
						strokeColor: borderColor || '#FF0000',
						// Ширина линии.
						strokeWidth: 5,
						// Первой цифрой задаем длину штриха. Второй цифрой задаем длину разрыва.
						strokeStyle: '5 0',
						// Коэффициент прозрачности.
						strokeOpacity: 0.75
					});
				return polygon;
			},
			//добавить метку на карту по информации о ней
			addPlacemark: function (infoItem, map) {
				var placemark = ymapUtil.createPlacemark(infoItem.coords, false, infoItem.title, infoItem.iconColor);
				placemark.properties.set({ hintContent: infoItem.hint });

				//if (infoItem.text) {
				//	placemark.properties.set({
				//		balloonContent: infoItem.text
				//	});

				//	infoItem.placemark = placemark;
				//}

				//по открытию метки проскролить окно браузера к соответствующему элементу списка
				//placemark.events.add('balloonopen', function(evn) {
				//	infoItem.scrollTo();
				//});

				if (infoItem.balloonContent != null) {
					placemark.properties.set({ balloonContent: infoItem.balloonContent });
				}
				//установить выделенный элемент, соответствующий точке на карте
				infoItem.setSelectedPoint = function() {
					var coordinates = [infoItem.coords[0] * 1, infoItem.coords[1] * 1];
					map.panTo(coordinates, {
						flying: true
					});
					infoItem.scrollTo();
				};
				//по клику по метки проскролить окно браузера к соответствующему элементу списка
				placemark.events.add('click', function(e) {
					infoItem.setSelectedPoint();
					if (infoItem.balloonContent != null) {
						var geoObject = e.get('target');
						var position = e.get('globalPixels');
						geoObject.balloon.open(position);
					}
				});

				//map.geoObjects.add(placemark);
				return placemark;
			},

			//добавить метку с ее дочерними метками
			addPlacemarkWithChildrens: function (infoItem, map) {
				var self = this;
				var mainPlacemark = this.addPlacemark(infoItem, map);
				var placemarkGroup = [mainPlacemark];

				//map.geoObjects.add(placemark);

				if (Array.isArray(infoItem.childrens)) {
					infoItem.childrens.forEach(function(item) {
						var childrenPlacemark = self.addPlacemark(item, map);
						placemarkGroup.push(childrenPlacemark);
						var line = self.createLine(infoItem.coords, item.coords);
						map.geoObjects.add(line);
					});
				}
				
				//Возможность указания полигонов, которые относятся к этой же метке
				if (infoItem.location != null && Array.isArray(infoItem.location.coordinates)) {
					if (infoItem.location.type == 'Polygon') {
						var polygon = self.createPolygon(infoItem.location.coordinates, infoItem.location.reverseCoordinates, infoItem.iconColor);
						map.geoObjects.add(polygon);
					} else if (infoItem.location.type == 'LineString') {
						var lineString = self.createLineString(infoItem.location.coordinates, infoItem.location.reverseCoordinates, infoItem.iconColor);
						map.geoObjects.add(lineString);
					}
				}
				return placemarkGroup;
			}
		};

		/**
		 * Отрисовка яндекс-карты с отображением или добавлением метки
		 */
		ko.bindingHandlers.workWithOneOnYMap = {
			init: function (element, valueAccessor, allBindings) {
				require(['https://api-maps.yandex.ru/2.1/?lang=ru_RU'],
				function () {
					ymaps.ready(function () {
						//очистить элемент
						$(element).empty();

						var map, placemark;
						var mapPromise = $.Deferred();

						var allBindingsValue = allBindings();
						var value = allBindingsValue.value;
						var coords = value ? value() : null;

						//адрес и регион
						var addressParam = valueAccessor().address;
						var regionParam = valueAccessor().region;
						var address = addressParam ? addressParam() : null;
						var region = regionParam ? regionParam() : null;

						var createDefaultMap = function() {
							ymaps.geolocation.get().then(function (res) {
								// Иначе создаем карту с текущим положением пользователя
								map = ymapUtil.createCurrentLocationMap(element, res);
								mapPromise.resolve();
							}, function (e) {
								// Если место положение невозможно получить, то просто создаем карту
								map = ymapUtil.createMap(element.id, { center: [55.751574, 37.573856] });
								mapPromise.resolve();
							});
						};

						// Если координаты известны, то используем их для создания карты и метки
						if (coords && coords.length === 2) {
							map = ymapUtil.createMap(element.id, { center: coords });
							placemark = ymapUtil.createPlacemark(coords, true);
							map.geoObjects.add(placemark);
							ymapUtil.getAddress(placemark, coords);
							mapPromise.resolve();
						}
						else if (address != null && address !== '') {
							//иначе создаем карту по адресу оганизации (если он есть)
							var geoAddress = region ? region + ' ' + address : address;
							// Поиск координат по адресу
							if (geoAddress != null) {
								ymaps.geocode(geoAddress, {
									results: 1
								}).then(function (res) {
									// Выбираем первый результат геокодирования.
									var firstGeoObject = res.geoObjects.get(0);
									if (firstGeoObject != undefined) {
										// Координаты геообъекта.
										coords = firstGeoObject.geometry.getCoordinates();
										map = ymapUtil.createMap(element.id, { center: coords });
										placemark = ymapUtil.createPlacemark(coords, true);
										map.geoObjects.add(placemark);
										ymapUtil.getAddress(placemark, coords);
										mapPromise.resolve();

										if (value) {
											value(coords);
										}
									} else {
										createDefaultMap();
									}
								});
							}
						}
						else {
							createDefaultMap();
						}

						//если нужно редактировать метку
						var editPalcemark = valueAccessor().editPalcemark;
						if (editPalcemark) {
							// После загрузки карты добавляем работу с меткой и добавляем кнопку поиска организации
							mapPromise.then(function () {
								// Слушаем клик на карте
								map.events.add('click', function (e) {
									coords = e.get('coords');
									//задать координаты для метки
									placemark = ymapUtil.setPlacemark(map, placemark, coords);

									if (value) {
										value(coords);
									}
								});

								//добавить на карту кнопку с поиском организации по адресу
								var btnFindOrganisation = new ymaps.control.Button('<b>Найти организацию по адресу</b>');
								btnFindOrganisation.options.set('selectOnClick', false);
								btnFindOrganisation.options.set('maxWidth', 300);
								btnFindOrganisation.events.add('press', function () {
									//адрес и регион
									address = addressParam ? addressParam() : null;
									region = regionParam ? regionParam() : null;
									var geoAddress = region ? region + ' ' + address : address;
									// Поиск координат по адресу
									if (geoAddress != null) {
										ymaps.geocode(geoAddress, {
											results: 1
										}).then(function (res) {
											// Выбираем первый результат геокодирования.
											var firstGeoObject = res.geoObjects.get(0);
											if (firstGeoObject != undefined) {
												// Координаты геообъекта.
												coords = firstGeoObject.geometry.getCoordinates();
												//задать координаты для метки
												placemark = ymapUtil.setPlacemark(map, placemark, coords);
												//переместить центр карты
												map.setCenter(coords);
												//записать координаты в модель объекта
												if (value) {
													value(coords);
												}
											}
										});
									}
								});
								map.controls.add(btnFindOrganisation, {
									float: 'right'
								});

							}, function (e) {
								//alert(e);
							});
						}
					});
				});
			}
		};

		/**
		 * Отрисовка яндекс-карты с отображением меток
		 */
		ko.bindingHandlers.showManyOnYMap = {
			init: function (element, valueAccessor, allBindings) {
				var map;
				var allBindingsValue = allBindings();
				var info = allBindingsValue.value;

				var updateMarks = function(infoMarks) {
					//удалить все объекты с карты
					map.geoObjects.removeAll();
					//добавить метки

					if (Array.isArray(infoMarks) && infoMarks.length > 0 && Array.isArray(infoMarks[0])) {
						//обновление с группировкой
						infoMarks.forEach(function(infoArray, i) {
							var myClusterer = new ymaps.Clusterer();
							infoArray.forEach(function(infoItem, i) {
								var markGroup = ymapUtil.addPlacemarkWithChildrens(infoItem, map);
								myClusterer.add(markGroup);
							});
							map.geoObjects.add(myClusterer);
							myClusterer = new ymaps.Clusterer();
						});
					} else {
						//обычное обновление
						infoMarks.forEach(function (infoItem, i) {
							var marks = ymapUtil.addPlacemarkWithChildrens(infoItem, map);
							marks.forEach(function (mark) {
								map.geoObjects.add(mark);
							});
						});
					}
				};

				if (typeof info === "function") {
					var infoObservable = info;
					info = info();

					infoObservable.subscribe(function (value) {
						updateMarks(value);
					});
				}

				require(['https://api-maps.yandex.ru/2.1/?lang=ru_RU'],
				function () {
					ymaps.ready(function () {
						//очистить элемент
						$(element).empty();
						// Если координаты известны, то используем их для создания карты и меток
						if (info && info.length > 0) {
							if (Array.isArray(info[0])) {
								//Если пришёл двумерный массив — группируем
								map = ymapUtil.createMap(element.id, { center: info[0][0].coords });
								info.forEach(function (infoArray, i) {
									var myClusterer = new ymaps.Clusterer();
									infoArray.forEach(function (infoItem, i) {
										var markGroup = ymapUtil.addPlacemarkWithChildrens(infoItem, map);
										myClusterer.add(markGroup);
									});
									map.geoObjects.add(myClusterer);
									myClusterer = new ymaps.Clusterer();
								});
							} else {
								//случай для плоского списка точек
								map = ymapUtil.createMap(element.id, { center: info[0].coords });
								info.forEach(function (infoItem, i) {
									var marks = ymapUtil.addPlacemarkWithChildrens(infoItem, map);
									marks.forEach(function (mark) {
										map.geoObjects.add(mark);
									});
								});
							}
						} else {
							ymaps.geolocation.get().then(function (res) {
								// Иначе создаем карту с текущим положением пользователя
								map = ymapUtil.createCurrentLocationMap(element, res);
							}, function (e) {
								// Если место положение невозможно получить, то просто создаем карту
								map = ymapUtil.createMap(element.id, { center: [55.751574, 37.573856] });
							});
						}
					});
				});
			}
		};

		/**
		 * Увеличивает высоту textarea при переходах строк.
		 */
		ko.bindingHandlers.textareaAutoHeight = {
			init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
				var options = ko.utils.unwrapObservable(valueAccessor()) || {};
				$(element).autosize(options);
			}
		};
});

//Список плагинов Редока.
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/_CommonTemplate/redocPlugin', ['jquery'], function ($) {
	var RedocPlugin = function () {

	};

	//Объект, описывающий включенные плагины.
	RedocPlugin.prototype.plugin = null;

	//Получение данных о включенных плагинах.
	RedocPlugin.prototype.pluginInfo = function () {
		var self = this;
		var deferred = $.Deferred();

		if (self.plugin != null) {
			deferred.resolve(self.plugin);
		} else {
			$.getJSON('/Nvx.ReDoc.WebInterfaceModule/Controller/MainPageController/GetRegisteredPlugins')
				.done(function (response) {
					self.plugin = response;
					deferred.resolve(self.plugin);
				}).fail(function () {
					deferred.reject('Не удалось получить список плагинов Re:Doc.');
				});
		};

		return deferred.promise();
	};

	return new RedocPlugin();
});
//Конструктор вью-модели меню контекстного меню.
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Api/dateFormater',
	[
		//'jquery',
		//'knockout-jqueryui/datepicker',
	], function () {
	
	var dateFormater = function() {
		var self = this;
		self.ruMonthNames = ["Января", "Февраля", "Марта", "Апреля", "Мая", "Июня", "Июля", "Августа", "Сентября", "Октября", "Ноября", "Декабря"];

		self.parseOformatZoneOffset = function (hours, minutes, sign) {
			return ((sign === '-') ? -1 : 1) * ((~~hours * 60) + (~~minutes));
		};

		self.getDateWithoutTimeZoneConvertion = function (inputDateStr) {
			var date = new Date(inputDateStr);
			if (!isNaN(date)) {
				//user timezone offset
				var userOffset;
				//input timezone offset
				var offset;
				if (inputDateStr instanceof Date) {
					//userOffset = date.getTimezoneOffset(); // user's offset time
					//offset = inputDateStr.getTimezoneOffset();
					//date = new Date(date.getTime() + (userOffset - offset) * 60 * 1000);
					return date;
				}
				if (typeof inputDateStr === 'string') {
					var match = (/[.](?:[0-9]+)([+]|[-])([\d]{2}):([\d]{2})$/).exec(inputDateStr);
					if (match) {
						userOffset = date.getTimezoneOffset(); // user's offset time
						offset = -1 *(match[1] === '' || match[1] === 'z' || match[1] === 'Z' ? 0 : self.parseOformatZoneOffset(match[2], match[3], match[1]));
						date = new Date(date.getTime() + (userOffset - offset) * 60 * 1000);
					}
				}
			}
			return date;
		};

		self.getDate = function (inputDateStr, options) {
			return (!options || !options.useTimezone) ? self.getDateWithoutTimeZoneConvertion(inputDateStr) : new Date(inputDateStr);
		};

		//Идентификатор текущего экземпляра меню.
		self.toFullDateString = function(inputDateStr, options) {
			if (inputDateStr !== '') {
				var date = self.getDate(inputDateStr, options);
				var dateToShow = '';
				if (!isNaN(date.getTime()))
					dateToShow = (date.getDate() >= 10 ? date.getDate() : ('0' + date.getDate())) + ' ' + self.ruMonthNames[(date.getMonth())] + ' ' + date.getFullYear() + ' в ' + date.getHours() + ":" + (date.getMinutes() >= 10 ? date.getMinutes() : ('0' + date.getMinutes()));

				return dateToShow;
			}
			return '';
		};
		self.toDateString = function (inputDateStr, options) {
			if (inputDateStr !== '') {
				var date = self.getDate(inputDateStr, options);
				return (date.getDate() >= 10 ? date.getDate() : ('0' + date.getDate())) + " " + self.ruMonthNames[(date.getMonth())] + " " + date.getFullYear();
			}
			return '';
		};
	};

	return new dateFormater();
});
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Api/selectionState', function () {
	var selectionState = function (menuState, url, params, pageTitle) {
		var self = this;
		// menuState в виде {ownerId:'fileList',secondaryMenuItemId:'files_all'}
		self.menuState = menuState;
		// url для запроса данных
		self.url = url;
		//в params задаём параметры фильтрации. Параметры сортировки, группировки, номер страницы задаются в pagedViewModel
		self.params = params;

		/**
		 * Адрес страницы со списком. Используется для портала РПГУ, т.к. там нет напигации по self.menuState
		 */
		self.pageUrl = null;

		/**
		 * Заголовок страницы браузера
		 */
		self.pageTitle = pageTitle;
	};

	return selectionState;
});
define('Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/knockout-file-bindings/knockout-file-bindings',
[
    'knockout',
    'knockout-file-bindings'
], function (ko) {
	ko.fileBindings.customFileInputSystemOptions = {
		wrapperClass: 'custom-file-input-wrapper',
		fileNameClass: 'custom-file-input-file-name',
		buttonGroupClass: 'custom-file-input-button-group',
		buttonClass: 'custom-file-input-button',
		clearButtonClass: 'custom-file-input-clear-button',
		buttonTextClass: 'custom-file-input-button-text'
	};

	ko.fileBindings.defaultOptions = {
		wrapperClass: 'input-group group',
		fileNameClass: 'disabled form-control',
		buttonGroupClass: 'input-group-btn',
		buttonClass: 'button b-solid l m-top',
		clearButtonClass: 'button l m-top',

		noFileText: 'Файл не выбран',
		buttonText: 'Выбрать',
		changeButtonText: 'Изменить',
		clearButtonText: 'Отменить',

		fileName: true, // show the selected file name?
		clearButton: true, // show clear button?

		onClear: function (fileData, options) {
			if (typeof fileData.clear === 'function') {
				fileData.clear();
			}
		}
	};
});
define('Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/guid/guid', [], function () {
	/*https://github.com/dandean/guid*/
	(function () {
		var window = this || (0, eval)('this');

		var validator = new RegExp("^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$", "i");

		function gen(count) {
			var out = "";
			for (var i = 0; i < count; i++) {
				out += (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
			}
			return out;
		}

		function Guid(guid) {
			if (!guid) throw new TypeError("Invalid argument; `value` has no value.");

			this.value = Guid.EMPTY;

			if (guid && guid instanceof Guid) {
				this.value = guid.toString();

			} else if (guid && Object.prototype.toString.call(guid) === "[object String]" && Guid.isGuid(guid)) {
				this.value = guid;
			}

			this.equals = function (other) {
				///<summary>Comparing string `value` against provided `guid` will auto-call
				/// toString on `guid` for comparison</summary>
				return Guid.isGuid(other) && this.value == other;
			};

			this.isEmpty = function () {
				return this.value === Guid.EMPTY;
			};

			this.toString = function () {
				return this.value;
			};

			this.toJSON = function () {
				return this.value;
			};
		};

		Guid.EMPTY = "00000000-0000-0000-0000-000000000000";

		Guid.isGuid = function (value) {
			return value && (value instanceof Guid || validator.test(value.toString()));
		};

		Guid.create = function () {
			return new Guid([gen(2), gen(1), gen(1), gen(1), gen(3)].join("-"));
		};

		Guid.raw = function () {
			return [gen(2), gen(1), gen(1), gen(1), gen(3)].join("-");
		};

		if (typeof module != 'undefined' && module.exports) {
			module.exports = Guid;
		}
		else if (typeof window != 'undefined') {
			window.Guid = Guid;
		}
	})();

	return window.Guid;
});
define('Nvx.ReDoc.WebInterfaceModule/Content/lib.fix/jquery-ui/datepicker', ['jquery','knockout-jqueryui/datepicker'], function ($) {

	$.datepicker._defaults.dateFormat = 'dd.mm.yy';
	$.datepicker._defaults.yearRange = 'c-100:c+100';
	$.datepicker._defaults.changeMonth = true;
	$.datepicker._defaults.changeYear = true;

	$.datepicker.regional['ru-RU'] = {
		// Default regional settings
		closeText: 'Да', // Display text for close link
		prevText: 'Пред', // Display text for previous month link
		nextText: 'След', // Display text for next month link
		currentText: 'Сегодня', // Display text for current month link
		monthNames: [
			'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
			'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
		], // Names of months for drop-down and formatting
		monthNamesShort: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'], // For formatting
		dayNames: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'], // For formatting
		dayNamesShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'], // For formatting
		dayNamesMin: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
		weekHeader: 'Нед', // Column header for week of the year
		dateFormat: 'dd.mm.yy', // See format options on parseDate
		firstDay: 1, // The first day of the week, Sun = 0, Mon = 1, ...
		isRTL: false, // True if right-to-left language, false if left-to-right
		showMonthAfterYear: false, // True if the year select precedes month, false for month then year
		yearSuffix: '' // Additional text to append to the year in the month headers
	};

	$.datepicker.setDefaults($.datepicker.regional['ru-RU']);
});
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit', [], function() {
	//Наследование.
	var inherit = (function () {
		//Пустая функция-конструктор, которая станет носителем информации о прототипе.
		var Ctor = function () { };
		//inheritorConstructor - функция для создания объектов наследника.
		//parentConstructor - функция для создания объектов родителя.
		return function (Inheritor, Parent) {
			//Сохраняем в ней прототип родителя, чтобы не повлиять в дальнейшем на родителя.
			Ctor.prototype = Parent.prototype;
			//Непосредственно наследование.
			//Устанавливаем наследнику экземпляр родителя в качестве прототипа.
			Inheritor.prototype = new Ctor();
			//Создаем ссылку на объект прототипа родителя
			//с целью вызова конструктора родителя внутри наследника.
			Inheritor.superclass = Parent.prototype;
			//Восстанавливаем связи.
			//Прямая: экземпляр->конструктор->прототип.
			//И обратная: прототип-> конструктор.
			Inheritor.prototype.constructor = Inheritor;

		};
	}());

	return inherit;
});
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/DefaultController/MfcGroupPagedViewModel',
	[
		'knockout',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/DefaultController/GroupPagedViewModel',
		'Nvx.ReDoc.MfcUiModule/Web/Resources/Scripts/MfcUiWebController/MfcGroupViewModel',
		'jquery',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit'
	],
	function (ko, GroupPagedViewModel, MfcGroupViewModel, $, inherit) {
		var fileGroupPagedViewModel = function () {
			var self = this;
			fileGroupPagedViewModel.superclass.constructor.apply(self, [MfcGroupViewModel]);
			self.canSearch(true);
		};
		inherit(fileGroupPagedViewModel, GroupPagedViewModel);
		return fileGroupPagedViewModel;
	});
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/nvx', ['Nvx.ReDoc.WebInterfaceModule/Content/Scripts/nvxRedocCommon'], function () {
	var Nvx = window.Nvx || {};

	Nvx.createNamespace = function (namespace) {
		var nsparts = namespace.split(".");
		var parent = Nvx;

		// we want to be able to include or exclude the root namespace so we strip
		// it if it's in the namespace
		if (nsparts[0] === "Nvx") {
			nsparts = nsparts.slice(1);
		}

		// loop through the parts and create a nested namespace if necessary
		for (var i = 0; i < nsparts.length; i++) {
			var partname = nsparts[i];
			// check if the current parent already has the namespace declared
			// if it isn't, then create it
			if (typeof parent[partname] === "undefined") {
				parent[partname] = {};
			}
			// get a reference to the deepest element in the hierarchy so far
			parent = parent[partname];
		}
		// the parent is now constructed with empty namespaces and can be used.
		// we return the outermost namespace
		return parent;
	};

	window.Nvx = Nvx;

	return Nvx;
});
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Navigation/primaryMenuItem',
[
	'jquery',
	'knockout',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Navigation/primaryMenuUrlBuilder'
], function ($, ko, primaryMenuUrlBuilder) {
	var primaryMenuItem = function (id, title, cssClasses, primeryCssClasses) {
		var self = this;
		//Собственный идентификатор.
		self.id = id;
		//Название в первичном меню.
		self.title = title;
		//заголовок отображаемый на странице
		self.pageTitle = title;
		/** DOM-объект элемента меню */
		self.element = ko.observable();

		//Идентификатор шаблона фильтра.
		self.filterTemplateId = null;

		self.filterModuleName = null;
		self.pageTemplate = 'basePagerTemplate';
		self.listTemplateId = '';
		self.pagedViewModelFactory = null;
		self.url = '';
		self.primeryCssClasses = ko.observable('');
		//Пункты (кнопки) вторичного меню, тоже являются primaryMenuItem
		self.items = ko.observableArray();

		self.selected = ko.observable(false);

		self.selectedItem = ko.computed(function () {
			return ko.utils.arrayFirst(self.items(), function (item) {
				return item.selected() === true;
			});
		}, self);


		//вызывается при клике на элемент меню
		self.selectSelf = function () {
			//наш элемент выбран
			self.selected(true);
			// снять выделение с подменю
			self.unselectItems();
			//коректировать длину вторичного меню
			self.correctSecondaryMenuWidth();

			var selectId = '';
			if (self.defaultSelectedId !== null) {
				selectId = self.defaultSelectedId;
			} else {
				if (self.items().length > 0) {
					selectId = self.items()[0].id;
				}
			}
			var secondSelected = ko.utils.arrayFirst(self.items(), function (item) {
				return selectId === item.id;
			});
			if (secondSelected) {
				secondSelected.selectSelf();
			}

			if (typeof (self.action) == "function") {
				self.action();
			}
		};

		self.selectItem = function (item, e) {
			// снимаем выделение со всех
			self.unselectItems();
			// выбор элемента
			item.selectSelf();
			if (e) {
				e.preventDefault();
			}
		};

		self.unselectItems = function () {
			self.items().forEach(function (tab) {
				tab.selected(false);
			});
		};

		self.correctSecondaryMenuWidth = function () {
			if (self.items().length > 0) {
				var ui = $(self.element());
				if (ui.length > 0) {
					//получить позицию правой границы пункта меню
					var position = ui.position();
					var width = ui.outerWidth();  
					var rigthBorderPosition = (position.left + width);

					//посчитать ширину всех пунктов подменю
					var totalItemsWidth = 0;
					ko.utils.arrayForEach(self.items(), function (item) {
						var itemUI = $(item.element());
						var itemWidth = itemUI.outerWidth(true);
						totalItemsWidth += itemWidth;
					});

					//если подменю не доходит до правой граница родителя,
					//то обрезать панель подменю до правой границы родителя
					if (totalItemsWidth < rigthBorderPosition) {
						$("#menu-secondary").width(rigthBorderPosition);
					}
					else {
						$("#menu-secondary").width('');
					}
				}
			}
		};

		//действие выполняемое при клике на меню, эту функцию задаём мы.
		self.action = null;
		
		//Выбранный элемент вторичного меню по-умолчанию.
		self.defaultSelectedId = null;

		//css классы для пункта, используется для задания картинки
		self.cssClasses = cssClasses;
		if (primeryCssClasses) {
			self.primeryCssClasses(primeryCssClasses);
		}
		self.getPath = primaryMenuUrlBuilder.getPath;

	};

	return primaryMenuItem;
});
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Navigation/primaryMenuUrlBuilder',
	[], function () {
	var hasher = function() {
		var self = this;
		self.stripNull = function(obj) {
			for (var i in obj) {
				if (obj[i] === null) delete obj[i];
			}
			return obj;
		};
		self.getPath = function (selectionState) {
			var pageUrl = selectionState.pageUrl || '/';
			var menuParams = '';
			if (selectionState.menuState) {
				menuParams = $.param(selectionState.menuState);
			}
			var filterParam = JSON.stringify(self.stripNull(selectionState.params));
			var path = (menuParams.length > 0 ? (menuParams) : '')
				+
				(!$.isEmptyObject(selectionState.params)
					? ('&params=' + encodeURIComponent(filterParam))
					: '');
			return pageUrl + '?' + path;
		};
	};

	return new hasher();
});
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Navigation/router', [], function () {
	var w = window;

	var routes = [];
	var map = {};
	var reference = "router";
	var oldReference = w[reference];
	var started = false;

	var Route = function (path, name) {
		this.name = name;
		this.path = path;
		this.keys = [];
		this.fns = [];
		this.params = {};
		this.regex = pathToRegexp(this.path, this.keys, false, false);
	};

	Route.prototype.addHandler = function (fn) {
		this.fns.push(fn);
	};

	Route.prototype.removeHandler = function (fn) {
		for (var i = 0, c = this.fns.length; i < c; i++) {
			var f = this.fns[i];
			if (fn == f) {
				this.fns.splice(i, 1);
				return;
			}
		}
	};

	Route.prototype.run = function (params) {
		for (var i = 0, c = this.fns.length; i < c; i++) {
			this.fns[i].apply(this, params);
		}
	};

	Route.prototype.match = function (path, params) {
		var m = this.regex.exec(path);

		if (!m) return false;


		for (var i = 1, len = m.length; i < len; ++i) {
			var key = this.keys[i - 1];

			var val = ('string' == typeof m[i]) ? decodeURIComponent(m[i]) : m[i];

			if (key) {
				this.params[key.name] = val;
			}
			params.push(val);
		}

		return true;
	};

	var pathToRegexp = function (path, keys, sensitive, strict) {
		if (path instanceof RegExp) return path;
		if (path instanceof Array) path = '(' + path.join('|') + ')';
		path = path
		  .concat(strict ? '' : '/?')
		  .replace(/\/\(/g, '(?:/')
		  .replace(/\+/g, '__plus__')
		  .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function (_, slash, format, key, capture, optional) {
		  	keys.push({ name: key, optional: !!optional });
		  	slash = slash || '';
		  	return '' + (optional ? '' : slash) + '(?:' + (optional ? slash : '') + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')' + (optional || '');
		  	//return '' + (optional ? '' : slash) + '(?:' + (optional ? slash : '') + (format || '') + (capture || (format && '([^/.]+)' || '([^/]+)')) + ')' + (optional || '');
		  })
		  .replace(/([\/.])/g, '\\$1')
		  .replace(/__plus__/g, '(.+)')
		  .replace(/\*/g, '(.*)');
		//return new RegExp(path, sensitive ? '' : 'i');
		return new RegExp(path + '$', sensitive ? '' : 'i');
	};

	var addHandler = function (path, fn) {
		var s;
		if (path instanceof RegExp) {
			s = path.toString().split(' ');
			var name = (s.length == 2) ? s[0] : null;
		} else {
			s = path.split(' ');
			var name = (s.length == 2) ? s[0] : null;
			path = (s.length == 2) ? s[1] : s[0];
		}
		if (!map[path]) {
			map[path] = new Route(path, name);
			routes.push(map[path]);
		}
		map[path].addHandler(fn);
	};

	var routie = function (path, fn, forceCheck) {
		if (typeof forceCheck === 'undefined') {
			forceCheck = true;
		}
		if (typeof fn == 'function') {
			addHandler(path, fn);
			if (forceCheck) {
				routie.reload();
			}
		} else if (typeof path == 'object') {
			for (var p in path) {
				addHandler(p, path[p]);
			}
			if (forceCheck) {
				routie.reload();
			}

		} else if (typeof fn === 'undefined') {
			routie.navigate(path);
		}
	};

	routie.apply = function () {
		if (!started) {
			routie.reload();
			started = true;
		}
	};

	routie.remove = function (path, fn) {
		var route = map[path];
		if (!route)
			return;
		route.removeHandler(fn);
	};

	routie.removeAll = function () {
		map = {};
		routes = [];
	};

	routie.navigate = function (path, options, pageTitle) {
		options = options || {};
		var silent = options.silent === true ? true : false;
		var force = options.force === true ? true : false;
		var pushState = options.pushState !== false;

		removeListener();
		setTimeout(function () {
			var addressRightPart = (path.indexOf('?') === -1 && path.indexOf('/') ===-1)
				? (window.location.pathname + '?' + path)
				: path;

			if (addressRightPart.charAt(0) !== '/') {
				//addressRightPart = '/' + addressRightPart;
				addressRightPart = window.location.pathname + addressRightPart;
			}
			if (routie.current !== addressRightPart || force) {
				if (pushState) {
					history.pushState('', '', window.location.origin + addressRightPart);
				} else {
					history.replaceState('', '', window.location.origin + addressRightPart);
				}
			}

			window.NvxRedocCommon.setPageTitle(pageTitle);

			if (!silent) {
				if (!force) {
					checkFragment();
				} else {
					routie.reload();
				}
			}
			setTimeout(function () {
				addListener();
			}, 0);
		}, 0);
	};

	routie.noConflict = function () {
		w[reference] = oldReference;
		return routie;
	};

	var getFragment = function () {
		var fragment = location.pathname + location.search;
		return fragment;
	};

	var checkRoute = function (fragment, route) {
		var params = [];
		if (route.match(fragment, params)) {
			route.run(params);
			return true;
		}
		return false;
	};

	var removeURLParameter = function (url, parameter) {
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

			url = urlparts[0] + (pars.length > 0 ? '?' : '') + pars.join('&');
			return url;
		} else {
			return url;
		}
	}

	var fragmentChanged = routie.reload = function (f) {
		var fragment = f || getFragment();

		//параметр nocache не учитывается в пути
		fragment = removeURLParameter(fragment, 'nocache');

		for (var i = 0, c = routes.length; i < c; i++) {
			var route = routes[i];
			if (checkRoute(fragment, route)) {
				return;
			}
		}
	};

	var addListener = function () {
		addTimerListener();
	};

	var removeListener = function () {
		removeTimerListener();
	};

	var checkFragment = function () {
		if (routie.current !== getFragment()) {
			routie.current = getFragment();
			fragmentChanged(routie.current);
		}
	};

	var addTimerListener = function () {
		routie.current = getFragment();
		routie.interval = setInterval(checkFragment, 100);
	};

	var removeTimerListener = function () {
		clearInterval(routie.interval);
	};

	addListener();

	w[reference] = routie;

	if (typeof define === "function" && define.amd) {
		define(reference, [], function () {
			return routie;
		});
	}

	return routie;
});
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/preferences', [], function () {
	/**
	 * Предпочтения
	 */
	var preferences = {
		/* Включить логи для Signalr и динамических форм. */
		log: false
	};

	return preferences;
});
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/utils',
	[
		'knockout',
		'jquery'
	],
	function(ko, $) {
		var delimiter = '.';
		var utils = {
			isNullOrUndefined: function(obj) {
				if (obj === undefined || obj === null) {
					return true;
				}
				return false;
			},
			isEmptyVal: function(val) {
				if (val === undefined) {
					return true;
				}
				if (val === null) {
					return true;
				}
				if (val === "") {
					return true;
				}
			},
			isNumber: function(o) {
				return !isNaN(o);
			},
			toCamelCase: function(str) {
				return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
					if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
					return (index == 0) ? match.toLowerCase() : match.toUpperCase();
				});
			},

			toPascalCase: function(str) {
				return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
					if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
					return match.toUpperCase();
				});
			},
			/**
			* получает своство объекта, поддерживает вложенность(производит unwrapObservable)
			* @param entity - объект
			* @param path - путь свойства
			*/
			evalProperty: function(entity, path) {
				var e = ko.utils.unwrapObservable(entity);
				var propPath = path.split(delimiter), i = 0;
				var tempProp = ko.utils.unwrapObservable(e[propPath[i]]), links = propPath.length;
				i++;
				while (tempProp && i < links) {
					tempProp = ko.utils.unwrapObservable(tempProp[propPath[i]]);
					i++;
				}
				return tempProp;
			},
			/**
		   * устанавливает значение свойства у объекта, поддерживает вложенность
			* @param data - объект
			* @param path - путь свойства
		   * @param value - значение свойства
		   */
			setObservableOrValueInObject: function(data, path, value) {
				var nameParts = path.split(delimiter);
				if (nameParts.length > 1) {
					var currResult = data;
					for (var i = 0; i < nameParts.length; i++) {
						var namePart = nameParts[i];
						if (i < nameParts.length - 1) /* Not the last part of name - means object */ {
							if (!currResult[namePart]) currResult[namePart] = {};

							currResult = currResult[namePart];
						} else {
							if (ko.isObservable(data[path])) {
								currResult[namePart](value);
							} else {
								currResult[namePart] = value;
							}
						}
					}
				} else {
					if (ko.isObservable(data[path])) {
						data[path](value);
					} else {
						data[path] = value;
					}
				}
			},

			/**
			* получает своство объекта, поддерживает вложенность()
			* @param entity - объект
			* @param path - путь свойства
			*/
			getProperty: function(entity, path) {
				var data = ko.utils.unwrapObservable(entity);
				if (path === 'this') {
					return data;
				}
				var nameParts = path.split(delimiter);
				if (nameParts.length > 1) {
					var currResult = data;
					for (var i = 0; i < nameParts.length; i++) {
						var namePart = nameParts[i];
						if (currResult === undefined || currResult == null) {
							console.log('Не удалось получить свойство, вышестоящий объект не определён, путь до свойства:' + path);
							return currResult;
						}
						if (i < nameParts.length - 1) /* Not the last part of name - means object */ {
							currResult = ko.utils.unwrapObservable(currResult[namePart]);
						} else {
							currResult = currResult[namePart];
						}
					}
					return currResult;
				} else {
					return data[path];
				}
			},
			/**
			* устанавливает значение свойства у объекта, поддерживает вложенность
			* @param data - объект
			* @param path - путь свойства
			* @param value - значение свойства
			*/
			setToObject: function(data, path, value, skipEmpty) {
				var nameParts = path.split(delimiter);
				skipEmpty = skipEmpty == undefined ? true : skipEmpty;
				if (nameParts.length > 1) {
					var currResult = data;
					for (var i = 0; i < nameParts.length; i++) {
						var namePart = nameParts[i];
						if (i < nameParts.length - 1) /* Not the last part of name - means object */ {
							if (!currResult[namePart]) currResult[namePart] = {};
							currResult = currResult[namePart];
						} else {
							if (skipEmpty && (value === undefined || value === null || value === ''))
								continue;
							currResult[namePart] = value;
						}
					}
				} else {
					data[path] = value;
				}
			},

			extendIfNotExist: function(target, source) {
				target = target || {};
				for (var prop in source) {
					if (typeof source[prop] === 'object') {
						target[prop] = target[prop] || this.extendIfNotExist(target[prop], source[prop]);
					} else if ($.isArray(source[prop])) {
						target[prop] = target[prop].concat(source[prop] || []);
					} else {
						target[prop] = target[prop] || source[prop];
					}
				}
				return target;
			},
			removeFromArray: function(array, deleteValue) {
				for (var i = 0; i < array.length; i++) {
					if (array[i] == deleteValue) {
						array.splice(i, 1);
						i--;
					}
				}
				return array;
			},
			//example array.sort(sort_by('property1', true, parseInt, sort_by('property1', false, function(a){return a.toUpperCase()}));
			sort_by: function(path, reverse, primer, then) {
				var get = function(obj, path) {
					if (path) {
						path = path.split('.');
						var len;
						for (var i = 0, len = path.length - 1; i < len; i++) {
							obj = obj[path[i]];
						}
						return obj[path[len]];
					}
					return obj;
				},
					prime = function(obj) {
						return primer ? primer(get(obj, path)) : get(obj, path);
					};

				return function(a, b) {
					var A = prime(a),
						B = prime(b);

					return (
						(A < B) ? -1 :
							(A > B) ? 1 :
								(typeof then === 'function') ? then(a, b) : 0
					) * [1, -1][+!!reverse];
				};
			},

			getTemplateOrName: function(name) {
				//вначале ишем в шаблонах knockout'а
				var elem = document.getElementById(name);
				if (elem) {
					return elem.innerHTML;
				}
				return null;
			},
			concatObj: function() {
				var ret = {};
				var len = arguments.length;
				for (var i = 0; i < len; i++) {
					for (var p in arguments[i]) {
						if (arguments[i].hasOwnProperty(p)) {
							ret[p] = arguments[i][p];
						}
					}
				}
				return ret;
			},
			//Returns true if it is a DOM node
			isNode: function(o) {
				return (
					typeof Node === "object" ? o instanceof Node :
						o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName === "string"
				);
			},
			//Returns true if it is a DOM element    
			isElement: function(o) {
				return (
					typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
						o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName === "string"
				);
			}
		};
		return utils;
	});
define('Nvx.ReDoc.Rpgu.PortalModule/Portal/Script/MainPage/listBlockItemModel', [],
	function() {
		var ListBlockItemModel = function(title, link, recId) {
			var self = this;

			self.title = title;
			self.link = link;
			self.recId = recId;
		};

		return ListBlockItemModel;
	});
define('Nvx.ReDoc.Rpgu.PortalModule/Portal/Script/MainPage/listBlockViewModel',
	[
		'knockout'
	],
	function(ko) {
		var ListBlockViewModel = function(title, actionTitle, actionLink) {
			var self = this;

			//заголовок
			self.title = ko.observable(title);
			//текст для ссылки
			self.actionTitle = ko.observable(actionTitle);
			//адрес ссылки
			self.actionLink = ko.observable(actionLink);
			// пункты списка
			self.items = ko.observableArray();
		};

		return ListBlockViewModel;
	});
define('Nvx.ReDoc.Rpgu.Core/Script/Tab', ['knockout'], function (ko) {
	var Tab = function (title) {
		var self = this;

		//Заголовок вкладки.
		self.title = ko.observable(title);
		//Активна ли вкладка.
		self.active = ko.observable(false);
	};

	return Tab;
});
define('Nvx.ReDoc.MfcUiModule/Web/Resources/Scripts/MfcUiWebController/MfcGroupViewModel',
	[
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/DefaultController/GroupViewModel',
		'Nvx.ReDoc.MfcUiModule/Web/Resources/Scripts/MfcUiWebController/mfcPagedViewModel',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit'
	],
	function (groupPageFactory, mfcPagedViewModel, inherit) {
		var FileGroupViewModel = function() {
			var self = this;
			FileGroupViewModel.superclass.constructor.apply(self, arguments);
			groupPageFactory.apply(self, arguments);
		};

		inherit(FileGroupViewModel, mfcPagedViewModel);

		return FileGroupViewModel;
	});
define('Nvx.ReDoc.MfcUiModule/Web/Resources/Scripts/MfcUiWebController/mfcPagedViewModel',
[
	'knockout',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Navigation/navigation',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/DefaultController/indexBasePagedViewModel',
	'Nvx.ReDoc.MfcUiModule/Web/Resources/Scripts/MfcUiWebController/mfcCommonMethods',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction'
], function (ko, navigation, indexBasePagedViewModel, mfcCommonMethods, inherit, modal) {
	var MfcPagedViewModel = function () {
		var self = this;
		MfcPagedViewModel.superclass.constructor.apply(self, arguments);

		self.commonMethods = new mfcCommonMethods();
		self.modalDialog = self.commonMethods.modalDialog;
		self.readAboutServiceInfo = self.commonMethods.readAboutServiceInfo;
		self.readAboutCustomer = self.commonMethods.readAboutCustomer;

		self.serviceTypeToString = self.commonMethods.serviceTypeToString;
		self.typeToString = self.commonMethods.typeToString;

		self.selectService = function(id) {

			self.modalDialog.closeModalWindow();

			var urlServiceInfo = "/MfcUiModule/MfcUiWebController/Service/CheckComplexCustomer?ElementId=" + id;
			var trobberId = modal.CreateTrobberDiv2();
			$.ajax({
				async: true,
				type: "GET",
				url: urlServiceInfo,
				cache: false,
				success: function(viewData) {
					if (viewData.hasError) {
						//ошибка
						modal.errorModalWindow(viewData.errorMessage);
					} else {
						modal.CloseTrobberDiv2(trobberId);
						var stepName = 'service';
						if (viewData.isComplexCustomer == true) {
							stepName = 'ccservice';
						}
						var url = 'wizzard=true&step=' + stepName + '&id=' + id + '&key=0';
						navigation.navigate(url);
					}
				}
			});
		};
	};

	inherit(MfcPagedViewModel, indexBasePagedViewModel);

	return MfcPagedViewModel;
});
/// <summary>Объект для хранения наиболее востребованных функций.</summary>
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/FileController/file-common-methods',
	[
		'jquery',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/nvxRedocCommon',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction'
	], function($, common, modal) {
		var NvxRedocFileCommon = function() {
			var self = this;

			self.processFileError = function(response, positiveCallback, negativeCallback, positiveCallParams) {
				if (response.hasError) {
					if (response.needConfirm) {
						//Выводим модальное окно для подтверждения.
						var id = 'confirmationDialog';
						var positive = function() {
							modal.CloseModalDialog(id, true);
							common.ajaxSendJsonRequest('/WebInterfaceModule/File/UnarchiveFile',
								function(response) {
									if (response.hasError) {
										//Выводим модальное окно с ошибкой.
										modal.CreateNewModalDialog("modalWindowDialog", response.errorMessage, true, true);
									} else {
										$('file-right-side-content').find('h2').first().text('Информация о деле');
										if (positiveCallback) {
											if (positiveCallParams) {
												positiveCallback(positiveCallParams);
											} else {
												positiveCallback();
											}
										}
									}
								},
								{ fileId: $('#fileId').val() }
							);
						};
						var negative = function() {
							modal.CloseModalDialog(id, true);
							if (negativeCallback) {
								negativeCallback();
							}
						};
						modal.CreateQuestionModalWindow(id, response.message, response.positiveText, response.negativeText, response.caption, positive, negative);
					} else {
						//Выводим модальное окно с ошибкой.
						modal.errorModalWindow(response.errorMessage);
					}
				}
			};

			self.isFileArchived = function(fileId, callback) {
				var url = '/Nvx.ReDoc.WebInterfaceModule/Controller/FileController/IsFileArchived';
				common.ajaxSendJsonRequest(url,
					function(response) {
						if (response.hasError) {
							callback(false);
						} else {
							callback(true);
						}
					},
					{ 'fileId': fileId }
				);
			};

			self.Init = function() {
				
				//Кнопка "редактировать"
				$("#file-right-side-content").on("click", "#editTaskData", function(e) {
					var guid = modal.CreateTrobberDiv2();
					var queryParams = "?fileId=" + $("#fileId").val() +
						"&componentId=" + $("#componentId").val() +
						"&taskId=" + $("#taskId").val();
					var editTaskUrl = "/WebInterfaceModule/File/EditTaskData" + queryParams;
					var div = document.createElement("div");
					div.id = "edittaskmodaldialog";
					$("body").append(div);
					$.when(common.FillContent(editTaskUrl, "#" + div.id)).fail(function(jqXHR, textStatus, errorThrown) {
						modal.RemoveSelectedDiv(div.id);
						modal.errorModalWindow(errorThrown);
					}).always(function() {
						modal.CloseTrobberDiv2(guid);
					});
				});

				//Кнопка "Оставить примечание"
				$("#file-right-side-content").on("click", "#editTaskCommentData", function(e) {
					var guid = modal.CreateTrobberDiv2();
					var queryParams = "?fileId=" + $("#fileId").val() +
						"&componentId=" + $("#componentId").val() +
						"&taskId=" + $("#taskId").val();
					var editTaskUrl = "/WebInterfaceModule/File/EditTaskCommentMarkup" + queryParams;
					var div = document.createElement("div");
					div.id = "edittaskmodaldialog";
					$("body").append(div);
					$.when(common.FillContent(editTaskUrl, "#edittaskmodaldialog")).fail(function(jqXHR, textStatus, errorThrown) {
						modal.RemoveSelectedDiv(div.id);
						modal.errorModalWindow(errorThrown);
					}).always(function() {
						modal.CloseTrobberDiv2(guid);
					});
				});

				$("#file-comments-content").on("click", "#addCommentIntoFileButton", function(e) {
					var queryParams = "?fileId=" + $("#fileId").val() +
						"&comment=" + encodeURIComponent($("#newCommentTextarea").val());
					var addComment = "/WebInterfaceModule/File/AddNewComment" + queryParams;
					var guid = modal.CreateTrobberDiv2();
					$.when(common.FillContent(addComment, "#file-comments-content")).then(function() {
						common.FillContent("/WebInterfaceModule/File/Comments?fileId=" + $("#fileId").val(), "#file-comments-content");
						modal.CloseTrobberDiv2(guid);
					});
				});
			};
		};

		var nvxRedocFileCommon = new NvxRedocFileCommon();

		//Legacy support
		window.NvxRedocFileCommon = nvxRedocFileCommon;

		return nvxRedocFileCommon;
	});
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/nvxRedocAddTaskDialog',
['jquery',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/nvxRedocCommon',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction'
], function ($, NvxRedocCommon, ModalWindowsFunction) {
	var NvxRedocAddTaskDialog = function() {
		var self = this;
		//отображение диалога создания новой задачи
		self._createCenteredWindow = function () {
			self._createNewModalDialog('newtaskmodaldialog');
		};

		//создание диалогового окна с содержимым по центру экрана 
		self._createNewModalDialog = function(id) {
		};

		// удаление указанного элемента по id
		self._removeSelectedDiv = function(divName) {
			if (document.getElementById(divName) != null && document.getElementById(divName) != undefined) {
				$('#' + divName).remove();
			}
		};

		self._closenewtaskmodaldialog = function() {
			self._removeSelectedDiv('newtaskmodaldialog');
		};

		self.GetExtendedTaskTemplate = function() {
			var fill = NvxRedocCommon.FillContent("/WebInterfaceModule/File/GetTemplateDataView",
				"#addTaskExtendedData",
				{"fileId": $("#fileId").val(), "componentId": $("#componentId").val(), "taskId": $("#taskId").val(), "taskSelector": $("#taskSelector").val() }, null, null, true);
		};

		self.Init = function(func) {
			self._createCenteredWindow();
			$(document).ready(function() { func.call(); });
		};
	};

	var nvxRedocAddTaskDialog = new NvxRedocAddTaskDialog();
	//Legacy support.
	window.NvxRedocAddTaskDialog = nvxRedocAddTaskDialog;

	return nvxRedocAddTaskDialog;
});
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Helpers/nvxReDocPlugin',
	[],
	function() {
		var NvxReDocPlugin = function() {
			var self = this;

			var createPluginObject = function() {
				var pluginObject = document.getElementById("nvxredocplugin");
				if (!pluginObject) {
					var elem = document.createElement('object');
					elem.setAttribute("id", "nvxredocplugin");
					elem.setAttribute("type", "application/x-redocplugin");
					elem.setAttribute("style", "display: none");
					elem.setAttribute("class", "hiddenObject");
					document.getElementsByTagName("body")[0].appendChild(elem);
				}

			};
			createPluginObject();

			/**
		 * Возвращает true, если плагин установлен
		 */
			self.isPluginInstalled = function() {
				//TODO: пока проблемы с плагином для мака. Нужно разобраться
				//return false;
				try {
					nvxredocplugin.getVersion();
					return true;
				} catch(err) {
					//console.log(err);
				}

				return false;
			};

			/**
		 * Возвращает true, если есть установленные сертификаты
		 */
			self.isInstalledCertificateExists = function() {
				var countCertificates = nvxredocplugin.getCertificatesCount();

				if (countCertificates > 0) {
					return true;
				}

				return false;
			};

			/**
		 * Возвращает массив установленных сертификатов
		 */
			self.getCertificateInfos = function() {
				var certificateInfoArray = [];
				//TODO: с плагином для мака какая-то ерунда. Зависает на получении сертификтов.
				//пока не раздобрался, пусть этот кусок не вызывается
				return [];
				try {
					var certificates = nvxredocplugin.getCertificates();
					for (var i = 0; i < certificates.length; i++) {
						var cert = certificates[i];
						var certificateInfo = {
							//Идентификатор.
							thumbprint: String(cert.thumbprint),
							//Имя владельца сертификата.
							subjectName: String(cert.subjectName),
							//e-mail владельца сертификата.
							subjectEmail: String(cert.email),
							//Имя издателя.
							issuerName: String(cert.issuerName),
							//Дата окончания действия сертификата.
							validToDate: new Date(cert.validToDateUnixTime * 1000),
							//Валиден ли сертификат.
							valid: Boolean(cert.isValid),
							//Сам сертификат.
							exportedBase64: String(cert.exportedBase64)
						};

						//Добавляем получившияся объект в массив.
						certificateInfoArray.push(certificateInfo);
					}
				} catch(err) {
					console.error(err);
				}

				return certificateInfoArray;
			};

			/**
		 * Возвращает сертификат в base64.
		 * @param {} thumbprint отпечаток сертификата
		 */
			self.getCertificateBase64 = function(thumbprint) {
				var certBase64 = nvxredocplugin.getCertificateBase64(thumbprint);
				//чтобы это точно была строка
				var str = String(certBase64);

				if (str === "") {
					return null;
				}

				return str;
			};

			/**
		 * Подписывает данные, переданные в виде строки
		 * @param {} originData данные для подписи (строка)
		 * @param {} thumbprint  отпечаток сертификата
		 * @returns {} Подпись в Base64
		 */
			self.signData = function(originData, thumbprint) {
				var signBase64 = nvxredocplugin.signData(thumbprint, originData);
				//чтобы это точно была строка
				var str = String(signBase64);

				if (str === "") {
					return null;
				}

				return str;
			};

			/**
		 * Подписывает данные, переданные в виде строки base64
		 * @param {} originData данные для подписи (строка base64)
		 * @param {} thumbprint  отпечаток сертификата
		 * @returns {} Подпись в Base64
		 */
			self.signDataBase64 = function(base64Data, thumbprint) {
				var signBase64 = nvxredocplugin.signDataBase64(thumbprint, base64Data);
				//чтобы это точно была строка
				var str = String(signBase64);

				if (str === "") {
					return null;
				}

				return str;
			};
		};


		return NvxReDocPlugin;
	});
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Helpers/nvxReDocPluginProxy', [
		'jquery',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Helpers/nvxReDocPlugin',
		'jqueryExtention'
	], function($, modal, NvxReDocPlugin) {

		var NvxReDocPluginProxy = function() {
			var self = this;

			self.redocPlugin = new NvxReDocPlugin();

			self.isPluginInstalled = function() {
				return self.redocPlugin.isPluginInstalled();
			};

			//Проверка - установлен ли сертификат из процесса Редока
			self.isInstalledCertificateExists = function() {
				var deferred = $.Deferred();

				var isInstalled = self.redocPlugin.isInstalledCertificateExists();
				deferred.resolve(isInstalled);

				return deferred;
			};

			//Получить информацию об установленных сертификатах
			self.getCertificateInfos = function() {
				var deferred = $.Deferred();

				var certificatesInfos = self.redocPlugin.getCertificateInfos();
				deferred.resolve(certificatesInfos);

				return deferred;
			};


			//Подписать вложение по его содержимому
			//data = {fileId, attachmentId, componentId, thumbprint}
			self.getSignAttachmentData = function(data) {
				//Показать тробер
				var trobberId = modal.CreateTrobberDiv2();

				var deferred = $.Deferred();
				var deferredFile = self.getAttachmentData(data);
				deferredFile.done(function(attachmentData) {
					if (attachmentData != null) {
						var defferredSign = self.signDataBase64(attachmentData, data.thumbprint);
						defferredSign.done(function(signResult) {
							if (signResult != null) {
								deferred.resolve(signResult.digest);
							} else {
								deferred.resolve(null);
							}
						}).fail(function(error) {
							deferred.reject(error);
						});
					} else {
						deferred.reject("Нет данных для подписи");
					}
				});

				deferred.always(function() {
					//скрыть троббер
					modal.CloseTrobberDiv2(trobberId);
				});

				return deferred;
			};

			//Получить данные файла для подписи. Данные возвращаются в Base64
			//data = {fileId, attachmentId, componentId}
			self.getAttachmentData = function(data) {
				data.ignoreWorkingFolder = true;
				var deferred = $.Deferred();

				//Показать тробер
				//var trobberId = modal.CreateTrobberDiv2();

				$.ajax({
					async: true,
					type: "GET",
					url: "/WebInterfaceModule/DownloadAttachment",
					contentType: 'application/x-www-form-urlencoded',
					dataType: 'binary',
					data: data,
					//timeout: window.NvxRedocCommon._ajaxTimeout,
					timeout: 100000,
					error: function(jqXHR, textStatus, errorThrown) {
						modal.errorModalWindow(jqXHR.responseText);
						deferred.resolve(null);
					},
					success: function(responseData, textStatus, request) {
						var header = request.getResponseHeader("Content-Type");
						if (header == "application/octet-stream") {
							var reader = new window.FileReader();
							reader.readAsDataURL(responseData);
							reader.onloadend = function() {
								var encodingTag = "base64,";
								var base64Data = reader.result.toString();
								var startIndex = base64Data.indexOf(encodingTag) + encodingTag.length;
								var base64Text = base64Data.substring(startIndex);
								deferred.resolve(base64Text);
							};
						} else {
							modal.errorModalWindow("Неудалось получить файл для подписи");
							deferred.resolve(null);
						}
					},
					complete: function(xhr) {
						//Скрываем тробер
						//modal.CloseTrobberDiv2(trobberId);
					}
				});

				return deferred;
			};

			//Подписать строку выбранным сертификатом
			self.signData = function(data, thumbprint) {
				var deferred = $.Deferred();

				var signAsync = function() {
					try {
						var sign = self.redocPlugin.signData(data, thumbprint);
						deferred.resolve({ digest: sign });
					} catch(ex) {
						deferred.reject(ex);
					}
				};

				setTimeout(signAsync, 0);

				return deferred;
			};

			//Подписать строку, которая закодирована Base64, выбранным сертификатом
			self.signDataBase64 = function(data, thumbprint) {
				var deferred = $.Deferred();

				var signAsync = function() {
					try {
						var sign = self.redocPlugin.signDataBase64(data, thumbprint);
						deferred.resolve({ digest: sign });
					} catch(ex) {
						deferred.reject(ex);
					}
				};

				setTimeout(signAsync, 0);

				return deferred;
			};

			//Возвращает сертификат по его отпечатку
			self.getCertificate = function(thumbprint) {
				return self.redocPlugin.getCertificateBase64(thumbprint);
			};
		};

		return new NvxReDocPluginProxy;
	});
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Helpers/asyncSignLib', [
	'jquery',
	'cadespluginApi',
], function ($, cadesplugin2) {

	var AsyncSignLib = function () {
		var self = this;
		
		self.CADESCOM_BASE64_TO_BINARY = 1;
		self.CADESCOM_CADES_BES = 1;
		self.CAPICOM_CURRENT_USER_STORE = 2;
		self.CAPICOM_MY_STORE = "My";
		self.CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED = 2;
		self.CAPICOM_CERTIFICATE_FIND_SUBJECT_NAME = 1;
		self.CAPICOM_CERTIFICATE_FIND_SHA1_HASH = 0;
		self.CAPICOM_CERT_INFO_SUBJECT_SIMPLE_NAME = 0;
		self.CAPICOM_CERT_INFO_ISSUER_SIMPLE_NAME = 1;
		self.CAPICOM_CERT_INFO_SUBJECT_EMAIL_NAME = 2;
		self.CAPICOM_ENCODE_BASE64 = 0;
		self.CAPICOM_ENCODE_BINARY = 1;

		self.CADESCOM_XML_SIGNATURE_TYPE_ENVELOPING = 1;
		self.XmlDsigGost3410Url = "urn:ietf:params:xml:ns:cpxmlsec:algorithms:gostr34102001-gostr3411";
		self.XmlDsigGost3411Url = "urn:ietf:params:xml:ns:cpxmlsec:algorithms:gostr3411";
		self.CADESCOM_XML_SIGNATURE_TYPE_ENVELOPED = 0;
		self.CADESCOM_XML_SIGNATURE_TYPE_TEMPLATE = 2;


		/**
			* Загрузка плагина
			*/
		self.cadespluginLoad = function() {
			var deferred = $.Deferred();
	
			var canPromise = !!window.Promise;
			if(canPromise) {
				//для асинхронной работы
				cadesplugin.then(function () {

					var canAsync = !!cadesplugin.CreateObjectAsync;
						if (canAsync) {
							require(['Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Helpers/asyncSignLibDynamicLoad'], function(asyncSignLibDynamicLoad) {
								self.checkForPlugIn_Async = asyncSignLibDynamicLoad.checkForPlugIn_Async;
								self.isInstalledCertificateExists = asyncSignLibDynamicLoad.isInstalledCertificateExists;
								self.getCertificateInfos = asyncSignLibDynamicLoad.getCertificateInfos;
								self.getCertificate = asyncSignLibDynamicLoad.getCertificate;
								self.getCertificateBase64 = asyncSignLibDynamicLoad.getCertificateBase64;
								self.signHash = asyncSignLibDynamicLoad.signHash;
								self.signXml = asyncSignLibDynamicLoad.signXml;
								self.signXmlOv = asyncSignLibDynamicLoad.signXmlOv;
								self.sign2XmlOv = asyncSignLibDynamicLoad.sign2XmlOv;

								deferred.resolve();
							});
						} else {
							deferred.resolve();
						}
					},
					function(error) {
						deferred.reject(error);
					}
				);
			} 
			else {
				//для работы с NPAPI
				window.addEventListener("message", function (event){
					if (event.data == "cadesplugin_loaded") {
						deferred.resolve();
					} else if(event.data == "cadesplugin_load_error") {
						deferred.reject('cadesplugin_load_error');
					}
				},
				false);
				window.postMessage("cadesplugin_echo_request", "*");
			}
		
			return deferred.promise();
		};


		/**
			* Проверить установлен ли плагин
			*/
		self.isPluginInstalled = function(){

			var self = this;
			var deferred = $.Deferred();
	
			var checkPromise;
			var canAsync = !!cadesplugin.CreateObjectAsync;
			if(canAsync) {
				checkPromise = self.checkForPlugIn_Async();
			}else {
				checkPromise = self.checkForPlugIn_NPAPI();
			}
		
			checkPromise.done(function(result){ 
				deferred.resolve(result); 
			})
			.fail(function(){ 
				deferred.reject() 
			});
	
			return deferred.promise();
		};


		/**
			* Проверка загрузки плагина для браузеров с поддержкой NPAPI
			*/
		self.checkForPlugIn_NPAPI = function(){
			var deferred = $.Deferred();
			try {
				var oAbout = cadesplugin.CreateObject("CAdESCOM.About");
				deferred.resolve(true);
			}
			catch(err){
				deferred.reject(false);
			}
	
			return deferred.promise();
		};



	};//AsyncSignLib


	return new AsyncSignLib;
});

define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Helpers/baseSignLib', [
	'require',
	'knockout',
	'jquery',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/nvx',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/nvxRedocCommon',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/nvxRedocAddTaskDialog',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Helpers/proxyService',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Helpers/nvxReDocPluginProxy',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Helpers/asyncSignLib'
], function (require, ko, $, Nvx, modal, common, nvxRedocAddTaskDialog, inherit, proxyService, nvxReDocPluginProxy, asyncSignLib) {
	var baseSignLib = function () {
		var self = this;
		//#region Константы.

		var CADESCOM_CADES_BES = 0x01;
		var CAPICOM_CURRENT_USER_STORE = 2;
		var CAPICOM_MY_STORE = "My";
		var CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED = 2;
		var CAPICOM_CERTIFICATE_FIND_SUBJECT_NAME = 1;
		var CAPICOM_CERTIFICATE_FIND_SHA1_HASH = 0;
		var CAPICOM_CERT_INFO_SUBJECT_SIMPLE_NAME = 0;
		var CAPICOM_CERT_INFO_ISSUER_SIMPLE_NAME = 1;
		var CAPICOM_CERT_INFO_SUBJECT_EMAIL_NAME = 2;
		var CAPICOM_CERTIFICATE_FIND_SHA1_HASH = 0;
		var CAPICOM_ENCODE_BASE64 = 0;
		var CAPICOM_ENCODE_BINARY = 1;

		//#endregion

		var getErrorMessage = function (e) {
			var err = e.message;
			if (!err) {
				err = e;
			} else if (e.number) {
				err += " (" + e.number + ")";
			}
			return err;
		};


		//Проверка - установлен ли плагин.
		self.isPluginInstalled = function () {

			var deferred = $.Deferred();

			if (proxyService.isChromium()) {
				deferred.resolve();
			}

			//if (nvxReDocPluginProxy.isPluginInstalled()) {
			//	return true;
			//}

			asyncSignLib.cadespluginLoad().done(function () {
				if (deferred.state() == "pending") {
					//если загружен асинхронный плагин
					var canAsync = !!cadesplugin.CreateObjectAsync;
					if (canAsync) {
						asyncSignLib.isPluginInstalled().done(function () {
							deferred.resolve();
						}).fail(function () {
							deferred.reject();
						});

						return;
					}
				}

				if (deferred.state() == "pending") {
					try {
						var oAbout = cadesplugin.CreateObject("CAdESCOM.About");
						// После получения объекта CAdESCOM.About можно дополнительно проверить версию
						// установленного КриптоПро ЭЦП Browser plug-in
						deferred.resolve();
					}
					catch (err) {
						console.log(err);
						deferred.reject();
					}
				}
			})
			.fail(function () {
				deferred.reject();
			});

			return deferred.promise();
		}


		self.isInstalledCertificateExists = function () {

			//если работаем из встроенного Хромиума
			if (proxyService.isChromium()) {
				return proxyService.isInstalledCertificateExistsFromRedoc();
			}

			if (nvxReDocPluginProxy.isPluginInstalled()) {
				return nvxReDocPluginProxy.isInstalledCertificateExists();
			}

			var deferred = $.Deferred();

			//Если плагин не установлен, то должен вернутся false
			var oStore = cadesplugin.CreateObject("CAPICOM.Store");
			if (oStore == null) return false;

			//Открываем хранилище сертификатов.
			oStore.Open(CAPICOM_CURRENT_USER_STORE, CAPICOM_MY_STORE,
				CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED);

			var result;
			try {
				if (oStore.Certificates === undefined || oStore.Certificates === null) {
					result = false;
				} else {
					result = true;
				}
			} catch (e) {
				result = false;
			}

			//Закрываем хранилище сертификатов
			oStore.Close();
			deferred.resolve(result);

			return deferred;
		};

		self.getCertificateInfos = function () {

			if (proxyService.isChromium()) {
				return proxyService.getCertificateInfosFromRedoc();
			}

			if (nvxReDocPluginProxy.isPluginInstalled()) {
				return nvxReDocPluginProxy.getCertificateInfos();
			}

			var deferred = $.Deferred();

			self.isPluginInstalled().fail(function () {
				deferred.resolve(null);
			})
			.done(function () {

				//если загружен асинхронный плагин
				var canAsync = !!cadesplugin.CreateObjectAsync;
				if (canAsync) {
					asyncSignLib.getCertificateInfos()
						.done(function (certsInfo) {
							deferred.resolve(certsInfo);
						})
						.fail(function (error) {
							deferred.reject(error);
						});
				}

				//Если плагин не установлен, то должен вернутся null
				var oStore = cadesplugin.CreateObject("CAPICOM.Store");
				if (oStore == null) return null;

				//Открываем хранилище сертификатов.
				oStore.Open(CAPICOM_CURRENT_USER_STORE, CAPICOM_MY_STORE,
					CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED);
				//Получаем личные сертификаты, установленные на машине.
				var oCertificates = oStore.Certificates;
				//Преобразуем их во вью-модели.
				//Из них формируем массив объектов, содержащий только нужную информацию о сертификатах.
				var certificateInfoArray = [];
				for (var index = 1; index <= oCertificates.Count; index++) {
					//Создаем объект хранящий нужную информацию о сертификате.
					try {
						var certificateInfo = {
							//повторяет thumbprint для совместимости
							id: oCertificates.Item(index).Thumbprint,
							//Идентификатор. повторяет id для совместимости
							thumbprint: oCertificates.Item(index).Thumbprint,
							//Имя владельца сертификата.
							subjectName: oCertificates.Item(index).GetInfo(CAPICOM_CERT_INFO_SUBJECT_SIMPLE_NAME),
							//Имя издателя.
							issuerName: oCertificates.Item(index).GetInfo(CAPICOM_CERT_INFO_ISSUER_SIMPLE_NAME),
							//Дата окончания действия сертификата.
							validToDate: oCertificates.Item(index).ValidToDate,
							//Валиден ли сертификат.
							valid: oCertificates.Item(index).IsValid().Result,
							//Сам сертификат.
							exportedBase64: oCertificates.Item(index).Export(CAPICOM_ENCODE_BASE64)
							//exportedBase64: oCertificates.Item(index).Export(CAPICOM_ENCODE_BINARY)
						};

						//e-mail владельца сертификата.
						//не работает в Unix-системах
						try {
							certificateInfo.subjectEmail = oCertificates.Item(index).GetInfo(CAPICOM_CERT_INFO_SUBJECT_EMAIL_NAME);
						}
						catch (e) {
							console.log("Не получил email из сертификата");
							certificateInfo.subjectEmail = "";
						}

						//Добавляем получившияся объект в массив.
						certificateInfoArray.push(certificateInfo);
					} catch (e) {
						// Если не можем получить информацию о сертификате, то не сможем его использовать. Не добавляем его в список.
					}
				}
				//Закрываем хранилище сертификатов
				oStore.Close();

				deferred.resolve(certificateInfoArray);
			});

			
			return deferred;
		};

		self.getCertificateBase64 = function (thumbprint) {
			//если загружен асинхронный плагин
			var canAsync = !!cadesplugin.CreateObjectAsync;
			if (canAsync) {
				return asyncSignLib.getCertificateBase64(thumbprint);
			}

			var deferred = $.Deferred();

			var cert = self.getCertificate(thumbprint);
			if (cert == null) {
				deferred.reject("Не получил сертификат");
			}
			else {
				var base64 = cert.Export(CAPICOM_ENCODE_BASE64);
				deferred.resolve(base64);
			}

			return deferred.promise();
		};

		self.getCertificate = function (thumbprint) {
			//Открываем хранилище и получаем сертификат.
			var oStore = cadesplugin.CreateObject("CAPICOM.Store");
			oStore.Open(CAPICOM_CURRENT_USER_STORE, CAPICOM_MY_STORE,
				CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED);

			var oCertificates = oStore.Certificates.Find(
				CAPICOM_CERTIFICATE_FIND_SHA1_HASH, thumbprint);
			if (oCertificates.Count == 0) {
				//Закрываем хранилище сертификатов
				oStore.Close();
				alert("Certificate not found! Thumbprint: " + thumbprint);
				return null;
			}

			//Получили наш сертификат.
			var oCertificate = oCertificates.Item(1);
			//Закрываем хранилище сертификатов
			oStore.Close();

			return oCertificate;
		};

		self.convertHashAlgId = function (hashAlg) {
			var hashAlgId = 0;
			//hashAlg сейчас часто передаётся как int, поэтому нужно его конвертнуть в string
			hashAlg = '' + hashAlg;
			if (hashAlg === "0") {
				hashAlgId = 0;
			}
			if (hashAlg === "1") {
				hashAlgId = 1;
			}
			if (hashAlg === "2") {
				hashAlgId = 2;
			}
			if (hashAlg === "3") {
				hashAlgId = 3;
			}
			if (hashAlg === "4") {
				hashAlgId = 4;
			}
			if (hashAlg === "5") {
				hashAlgId = 5;
			}
			if (hashAlg === "6") {
				hashAlgId = 6;
			}
			if (hashAlg === "100") {
				hashAlgId = 100;
			}

			return hashAlgId;
		};

		self.initializeHashedData = function (hashAlg, sHashValue) {

			// Создаем объект CAdESCOM.HashedData
			var oHashedData = cadesplugin.CreateObject("CAdESCOM.HashedData");

			// Инициализируем объект заранее вычисленным хэш-значением
			// Алгоритм хэширования нужно указать до того, как будет передано хэш-значение
			oHashedData.Algorithm = self.convertHashAlgId(hashAlg);
			oHashedData.SetHashValue(sHashValue);

			return oHashedData;
		};

		self.createSignHash = function (oCertificate, oHashedData) {
			var CADESCOM_CADES_BES = 1;
			// Создаем объект CAdESCOM.RawSignature
			var oSignedData = cadesplugin.CreateObject("CAdESCOM.CadesSignedData");

			// Создаем объект CAdESCOM.CPSigner
			var oSigner = cadesplugin.CreateObject("CAdESCOM.CPSigner");
			oSigner.Certificate = oCertificate;

			// Вычисляем значение подписи
			try {
				return oSignedData.SignHash(oHashedData, oSigner, CADESCOM_CADES_BES);
			} catch (err) {
				//Сообщение об ошибке построения доверенной цепочки сертификатов.
				if (err.number === -2146762486 || 	//IE
					err.message.indexOf('0x800B010A') > -1 ||	//Chrome
					err.message.indexOf('Error calling method on NPObject!') > -1) {
					var template = document.getElementById('Nvx.ReDoc.WebInterfaceModule/View/cadesplugin/error0x800B010A.tmpl.html');
					modal.errorModalWindow(template.innerHTML);
				} else {
					alert("Failed to create signature. Error: " + err);
				}
				//в случае ошибки подписи выходим
				return null;
			}
		};

		self.spWindowId = 'signingHelper_browseCertificate';
		//открывает окно с заголовком title, после выбора сертификата вызывается Deferred.resolve(thumbprint), 
		//!!! окно закрывается при нажатии кнопки закрыть и esc, при выборе сертификата окно НЕ закрывается, в наследниках надо реализовывать закрытие - modal.CloseModalDialog(self.spWindowId, true);
		self.getCertThumbAsync = function (title, certCallback, closeCallback) {
			require([
				'knockout',
				'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Api/Certificates/certificatePave',
				'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Api/Certificates/certificatesWindowVm'
			], function (ko, certPave, certificatesWindowVm) {
				//создаём окно, здесь указывается шаблон окошка - browseCertificateBase и пришлось добавить объекты плагина(чтобы можно было выбрать данные сертификатов),
				var content = '</object><object class="hiddenObject" id="certEnrollClassFactory" classid="clsid:884e2049-217d-11da-b2a4-000e7bbb2b09"></object><!-- ko template: { name: \'Nvx.ReDoc.WebInterfaceModule/View/AttachmentController/browseCertificateBase.tmpl.html\' }--><!--/ko-->';
				modal.CreateNewModalDialog(self.spWindowId, content, false, false, '');
				$('#' + self.spWindowId).keyup(function (event) {				//закрытие по esc	- не работает
					if (event.which === 27) {
						closeWindow();
					}
				});

				var closeWindow = function () {
					ko.cleanNode(document.getElementById(self.spWindowId));
					modal.CloseModalDialog(self.spWindowId, true);
					if (typeof closeCallback === 'function') {
						closeCallback();
					}
				};
				var clickCert = function () {
					var self = this;
					var thumbprint = self.thumbprint();
					certCallback(thumbprint);
				};
				var deferred = self.getCertificateInfos();
				deferred.done(function(certs) {
					//RDC-7591 Выводить добавленные в доверенные сертификаты вверху списка сертификатов в веб редоке
					//Сортируем их (валидные - сверху, потом невалидные).
					var certPaves = null;
					if (certs != null) {
						certs.sort(function(a, b) {
							return b.valid - a.valid;
						});
						certPaves = ko.utils.arrayMap(certs, function(item) {
							var newItem = new certPave(item);
							newItem.action = clickCert;
							return newItem;
						});
					}

					var viewModel = new certificatesWindowVm(certPaves, title);
					viewModel.closeWindow = closeWindow;
					viewModel.keyUp = function(e) {
						var code = e.which; // recommended to use e.which, it's normalized across browsers
						if (code === 27) // esc
						{
							closeWindow();
						}
					};
					//bind KO Model
					var element = document.getElementById(self.spWindowId);
					ko.cleanNode(element);
					ko.applyBindings(viewModel, element);
				});

				//ресайз окошка
				//modal.ResizeSelectedModalDialog(self.spWindowId);
				//$(window).resize(function () {
				//	modal.ResizeSelectedModalDialog(self.spWindowId);
				//});
			});
		};

		self.closeWindow = function () {
			ko.cleanNode(document.getElementById(self.spWindowId));
			modal.CloseModalDialog(self.spWindowId, true);
		};

		//Подписать вложение
		self.signAttachment = function (data) {

			//подпись плагином КриптоПро
			var signCades = function(data) {
				try {
					self.GetHashFromServerAjax(data);
				} catch (ex) {
					console.log(ex);
				}
			};

			//если работаем из встроенного Хромиума
			if (proxyService.isChromium()) {
				var deferred = proxyService.getSignAttachmentData(data);
				deferred.done(function (digest) {
					if (digest != null) {
						data.value = $("").val();
						data.digest = digest;
						self.SaveSignatureAjax(data);
					}
					else {
						self.closeWindow();
					}
				});
				return;
			}

			//подпись нашим плагином в Сафари на Маке
			if (nvxReDocPluginProxy.isPluginInstalled()) {
				var deferred = nvxReDocPluginProxy.getSignAttachmentData(data);
				deferred.done(function (digest) {
					if (digest != null) {
						data.value = $("").val();
						data.digest = digest;
						self.SaveSignatureAjax(data);
					}
					else {
						signCades(data);
						self.closeWindow();
					}
				});

				return;
			}

			signCades(data);
		};

	};


	return baseSignLib;
});
//объект для подписывания обычных аттачментов
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Helpers/signAttachmentHelper', [
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Helpers/signAttachmentHelperBase',
	'require',
	'knockout',
	'jquery',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/nvx',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/nvxRedocCommon',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/nvxRedocAddTaskDialog',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
], function (signAttachmentHelperBase, require, ko, $, Nvx, modal, common, NvxRedocAddTaskDialog, inherit) {
	//объект для подписывания обычных аттачментов
	var attachSaveCallback = function(response) {
		require(['Nvx.ReDoc.WebInterfaceModule/Content/Scripts/FileController/fileComponents'], function(components) {
			//Перерисовываем нужное нам вложение в левой части дела.
			var deferred = $.Deferred();
			components.redrawAttachment(deferred, response.recid);
			deferred.done(function() {
				//Удлиняем плашку.
				components.connectPaveById(response.recid, 'a');
				//Обновляем список подписей в представлении вложения.
				var signatures = window.Nvx.ReDoc.WebInterfaceModule.Content.Scripts.AttachmentController.signatures.getKoViewModel();
				signatures.updateSignatures();
				signatures.updateRequestedSignatures();
			}).fail(function() {
				modal.errorModalWindow('Не удалось обновить список подписей вложения.');
			});
		});
	};


	var signAttachmentHelper = function () {
		var self = this;
		signAttachmentHelper.superclass.constructor.apply(self, ['/WebInterfaceModule/File/Attachment/DownloadAttachmentAndSign',
		'/WebInterfaceModule/File/Attachment/SaveNewSignAttachment',
		attachSaveCallback]);

		self.startSign = function (fileId, attachmentId, componentId) {
			console.log('startSign ' + fileId);
			if (!fileId) {
				fileId = $('#fileId').val();
			}
			if (!attachmentId) {
				attachmentId = $('#attachmentId').val();
			}
			if (!componentId) {
				componentId = $('#componentId').val();
			}
			var success = function (thumbprint) {
				var data = {
					fileId: fileId,
					attachmentId: attachmentId,
					componentId: componentId,
					thumbprint: thumbprint
				};

				self.signAttachment(data);
			};
			self.getCertThumbAsync('Выберите сертификат для подписи вложения', success);
		};
	};


	inherit(signAttachmentHelper, signAttachmentHelperBase);

	var signAttachHelper = new signAttachmentHelper();
	if (Nvx.ReDoc != null)
		Nvx.ReDoc.WebInterfaceModule.Content.Scripts.signAttachmentHelper = signAttachHelper;

	return signAttachHelper;
});
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Helpers/signAttachmentHelperBase', [
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Helpers/baseSignLib',
		'require',
		'knockout',
		'jquery',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/nvx',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/nvxRedocCommon',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/nvxRedocAddTaskDialog',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/FileController/file-common-methods',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Helpers/asyncSignLib'
	], function(baseSignLib, require, ko, $, Nvx, modal, common, nvxRedocAddTaskDialog, inherit, nvxRedocFileCommon, asyncSignLib) {
		var signAttachmentHelperBase = function(hashFromServerUrl, saveSignatureurl, saveCallback) {
			var self = this;
			signAttachmentHelperBase.superclass.constructor.apply(self, arguments);

			self.hashFromServerUrl = hashFromServerUrl;
			self.saveSignatureurl = saveSignatureurl;
			self.saveCallback = saveCallback;

			// Запрос значения хэш-функции для выбранного сертификата.
			//параметр передаётся в виде var arg = { fileId: fileId, attachmentId: attachmentId, componentId: componentId, thumbprint: thumbprint,  }
			self.GetHashFromServerAjax = function(data) {
				var trobberId = '';
				var certificatePromise = self.getCertificateBase64(data.thumbprint);

				certificatePromise.done(function(certificate) {
					data.certificate = certificate;

					$.ajax({
						async: true,
						type: "POST",
						url: hashFromServerUrl,
						contentType: 'application/json',
						dataType: 'text',
						data: JSON.stringify(data),
						timeout: window.NvxRedocCommon._ajaxTimeout,
						error: function(jqXHR, textStatus, errorThrown) {
							//Выключаем троббер.
							modal.CloseTrobberDiv2(trobberId);
							//Подготавливаем текст ошибки.
							var content = "";
							if (textStatus !== null) {
								content = content + "<div><h3>" + textStatus + "</h3></div>";
							}
							content = content + "<div><h4>" + errorThrown + "</h4></div>";
							//Выводим модальное окно с ошибкой.
							modal.CreateNewModalDialog("modalWindowDialog", content, true, true);
						},
						beforeSend: function() {
							//индикатор загрузки
							trobberId = modal.CreateTrobberDiv2();

						},
						success: function(responseData) {
							if (responseData.hasError) {
								modal.CreateNewModalDialog("modalWindowDialog", responseData.errorMessage, true, true);
							} else {
								modal.CloseTrobberDiv2(trobberId);
								var respone = JSON.parse(responseData);

								data.digest = respone.digest;
								data.hashAlgId = respone.hashAlgId;

								//self.SignWithHash(arg);
								self.getSignWithHash(data).done(function(digest) {
									if (digest !== null) {
										data.digest = digest;

										self.SaveSignatureAjax(data);
									}
								});

							}
						},
						complete: function(xhr) {
							//Выключаем троббер.
							modal.CloseTrobberDiv2(trobberId);
							nvxRedocAddTaskDialog._closenewtaskmodaldialog();
						}
					});
				})
					.fail(function(error) {
						modal.CreateNewModalDialog("modalWindowDialog", error, true, true);
					}); //certificatePromise

			};


			//параметр передаётся в виде var arg = {thumbprint: thumbprint,digest: digest,hashAlgId: hashAlgId,}
			self.getSignWithHash = function(arg) {
				var deferred = $.Deferred();

				//Получаем подписанные данные.
				self.Sign({
					thumbprint: arg.thumbprint,
					digest: arg.digest,
					hashAlgId: arg.hashAlgId
				}).done(function(result) {
					deferred.resolve(result.digest);
				})
					.fail(function(error) {
						deferred.reject(error);
					});

				return deferred.promise();
			};

			//параметр передаётся в виде var arg = {fileId: fileId, attachmentId: attachmentId,componentId: componentId,thumbprint: thumbprint,digest: digest,hashAlgId: hashAlgId,}
			//Obsolete Legacy code
			self.SignWithHash = function(arg) {
				//Получаем подписанные данные.
				var digest = self.Sign({
					thumbprint: arg.thumbprint,
					digest: arg.digest,
					hashAlgId: arg.hashAlgId,
				});
				if (digest !== null) {

					var data = {
						value: $("").val(),
						fileId: arg.fileId,
						componentId: arg.componentId,
						attachmentId: arg.attachmentId,
						digest: digest,
						thumbprint: arg.thumbprint,
					};

					self.SaveSignatureAjax(data);
				}
			};

			// параметр arg = {value: $("").val(),fileId: fileId,componentId: componentId,attachmentId: attachmentId,digest: digest,thumbprint: thumbprint,};
			self.SaveSignatureAjax = function(arg) {
				var trobberId = '';

				$.ajax({
					async: true,
					type: "POST",
					url: saveSignatureurl,
					contentType: 'application/json',
					//dataType: 'html',
					dataType: 'json',
					data: JSON.stringify(arg),
					timeout: common._ajaxTimeout,
					beforeSend: function() {
						//Запускаем троббер.
						trobberId = modal.CreateTrobberDiv2();
					},
					success: function(response) {
						//Разбираемся с ответом.
						if (response.hasError) {
							self.closeWindow();
							//обработка ошибки
							nvxRedocFileCommon.processFileError(response, self.SaveSignatureAjax, null, arg);
						} else {
							self.closeWindow();
							if (typeof saveCallback === 'function') {
								saveCallback(response);
							}
						}
					},
					complete: function(xhr) {
						//Выключаем троббер.
						modal.CloseTrobberDiv2(trobberId);
						nvxRedocAddTaskDialog._closenewtaskmodaldialog();
					}
				});
			};

			//параметр передаётся в виде var arg = {thumbprint: thumbprint,digest: digest,hashAlgId: hashAlgId, ...}
			self.Sign = function(arg) {

				//если загружен асинхронный плагин
				var canAsync = !!cadesplugin.CreateObjectAsync;
				if (canAsync) {
					return asyncSignLib.signHash(arg.digest, self.convertHashAlgId(arg.hashAlgId), arg.thumbprint);
				}

				var deferred = $.Deferred();

				//Исходный xml
				var sHashValue = arg.digest;

				//Получили наш сертификат.
				var oCertificate = self.getCertificate(arg.thumbprint);

				var hashAlg = arg.hashAlgId;

				// Создаем объект CAdESCOM.HashedData
				var oHashedData = self.initializeHashedData(hashAlg, sHashValue);

				// Вычисляем подпись
				var sRawSignature = self.createSignHash(oCertificate, oHashedData);

				//в случае ошибки подписи выходим, возвращаем null

				//Возвращаем подпись в base64.
				deferred.resolve({ digest: sRawSignature });

				return deferred.promise();
			};
		};

		inherit(signAttachmentHelperBase, baseSignLib);

		return signAttachmentHelperBase;
	});
define('Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Helpers/signingHelper', [
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Helpers/baseSignLib',
		'require',
		'knockout',
		'jquery',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/nvx',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/modalWindowsFunction',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/nvxRedocCommon',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/inherit',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Helpers/proxyService',
		'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Helpers/asyncSignLib'
	], function(baseSignLib, require, ko, $, Nvx, modal, common, inherit, proxyService, asyncSignLib) {
		var signingHelper = function() {
			var self = this;
			signingHelper.superclass.constructor.apply(self, arguments);

			//#region Константы.

			var CADESCOM_CADES_BES = 0x01;
			var CAPICOM_CURRENT_USER_STORE = 2;
			var CAPICOM_MY_STORE = "My";
			var CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED = 2;
			var CAPICOM_CERTIFICATE_FIND_SUBJECT_NAME = 1;
			var CAPICOM_CERTIFICATE_FIND_SHA1_HASH = 0;
			var CAPICOM_CERT_INFO_SUBJECT_SIMPLE_NAME = 0;
			var CAPICOM_CERT_INFO_ISSUER_SIMPLE_NAME = 1;
			var CAPICOM_CERT_INFO_SUBJECT_EMAIL_NAME = 2;
			var CAPICOM_CERTIFICATE_FIND_SHA1_HASH = 0;
			var CAPICOM_ENCODE_BASE64 = 0;
			var CAPICOM_ENCODE_BINARY = 1;

			//#endregion

			var getErrorMessage = function(e) {
				var err = e.message;
				if (!err) {
					err = e;
				} else if (e.number) {
					err += " (" + e.number + ")";
				}
				return err;
			};

			//var createObject = self.createObject;

			//clickCertificateRedirectUrl — адрес контроллера, в который пойдут данные после выбора сертификата и подписи сообщения
			//isOv — тип подписи: True — подпись ЭП-ОВ, иначе ЭП-СП
			//two — в случае true — подпись двух запросов одной выбранной подписью. Доступно только для подписи ЭП-ОВ
			self.browseCertificate = function(clickCertificateRedirectUrl, isOv, two, title) {

				var getDigest = function(thumbprint) {
					var deferred;
					//self.sign2XmlOv(thumbprint);
					if (isOv === "true" || isOv === "True") {
						//Подпись ЭП-ОВ
						if (two === true) {
							//Подпишем два атачмента
							deferred = self.sign2XmlOv(thumbprint);
						} else {
							//Подпишем один
							deferred = self.signXmlOv(thumbprint);
						}
					} else {
						//Подпись ЭП-СП
						deferred = self.signXml(thumbprint);
					}
					return deferred;
				};

				var certChoosen = function(thumbprint) {
					//Получаем подписанные данные.
					var deferred = getDigest(thumbprint);
					deferred.done(function(digest) {
						if (digest !== null) {
							//Заносим их на форму.
							$("#digest").val(digest);

							//Нажимаем кнопку отправки формы.
							window.NvxRedocCommon.SendFormData($("#submitForm"), clickCertificateRedirectUrl, "#file-right-side-content");
							self.closeWindow();
						}
					});
				};

				var closeWindowCallback = function() {
					//диалог окна был закрыт, отрисуем правую часть
					require(['Nvx.ReDoc.WebInterfaceModule/Content/Scripts/FileController/fileComponents'], function(fileComponents) {
						//правой части нет, нужно отрисовать
						var koVm = fileComponents.getKoViewModel();
						if (koVm != null && koVm.selectedPave != null) {
							koVm.activate(koVm.selectedPave);
						}
					});
				};

				self.getCertThumbAsync(title, certChoosen, closeWindowCallback);
			};

			//Функция, которая подписывает данные выбранным сертификатом.
			self.signCreate = function(oCertificate, dataToSign) {
				//ReSharper Disable InconsistentNaming 
				var CADESCOM_BASE64_TO_BINARY = 1;
				var CADESCOM_XML_SIGNATURE_TYPE_ENVELOPED = 0;

				var CADESCOM_XML_SIGNATURE_TYPE_TEMPLATE = 2;
				var signatureMethod = "http://www.w3.org/2001/04/xmldsig-more#gostr34102001-gostr3411";
				var digestMethod = "http://www.w3.org/2001/04/xmldsig-more#gostr3411";
				//ReSharper Restore InconsistentNaming 

				// Создаем объект CAdESCOM.CPSigner
				var oSigner = cadesplugin.CreateObject("CAdESCOM.CPSigner");
				oSigner.Certificate = oCertificate;

				// Создаем объект CAdESCOM.SignedXML
				var oSignedXml = cadesplugin.CreateObject("CAdESCOM.SignedXML");

				//Выставляем кодировку Base64.
				if (oSignedXml.ContentEncoding === undefined) {
					//Значит это IE.
				} else {
					oSignedXml.ContentEncoding = CADESCOM_BASE64_TO_BINARY;
				}

				//Задаем контент.
				oSignedXml.Content = dataToSign;

				// Указываем тип подписи - в данном случае вложенная
				oSignedXml.SignatureType = CADESCOM_XML_SIGNATURE_TYPE_TEMPLATE;

				// Указываем алгоритм подписи
				oSignedXml.SignatureMethod = signatureMethod;

				// Указываем алгоритм хэширования
				oSignedXml.DigestMethod = digestMethod;

				try {
					return oSignedXml.Sign(oSigner);
				} catch(err) {
					//Сообщение об ошибке построения доверенной цепочки сертификатов.
					if (err.number === -2146762486 || //IE
						err.message.indexOf('0x800B010A') > -1 || //Chrome
						err.message.indexOf('Error calling method on NPObject!') > -1) {
						var template = document.getElementById('Nvx.ReDoc.WebInterfaceModule/View/cadesplugin/error0x800B010A.tmpl.html');
						modal.errorModalWindow(template.innerHTML);
					} else {
						alert("Failed to create signature. Error: " + getErrorMessage(err));
					}
					//в случае ошибки подписи выходим
					return null;
				}
			};

			//Подпись Xml.
			self.signXml = function(thumbprint, digestXml) {
				var xmlSourceString = digestXml || $("#digest").val();
				if (proxyService.isChromium()) {
					//Исходный xml
					var data = "withId=" + $("#WithId").val() +
						"&fillInTheEnd=" + $("#FillInTheEnd").val() +
						"&signingTag=" + $("#SigningTag").val() +
						"&mr=" + $("#MR").val() +
						"&digest=" + xmlSourceString +
						"&thumbprint=" + thumbprint;
					return proxyService.signSoapSP(data);
				}

				var deferred = $.Deferred();

				self.signXmlPlugin(thumbprint, digestXml).done(function(result) {
					//В поле передаём сертификат в base64
					$("#ControllerCallbackMethodName").val(result.cert);
					//вернуть подпись
					deferred.resolve(result.sign);
				})
					.fail(function(err) {
						deferred.reject(err);
					});

				return deferred;
			};

			//Подпись Xml плагином.
			self.signXmlPlugin = function(thumbprint, digestXml) {

				//если загружен асинхронный плагин
				var canAsync = !!cadesplugin.CreateObjectAsync;
				if (canAsync) {
					return asyncSignLib.signXml(thumbprint, digestXml);
				}

				var deferred = $.Deferred();

				//ReSharper Disable InconsistentNaming 
				var CADESCOM_CADES_BES = 0x01;
				var CAPICOM_CURRENT_USER_STORE = 2;
				var CAPICOM_MY_STORE = "My";
				var CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED = 2;
				var CAPICOM_CERTIFICATE_FIND_SUBJECT_NAME = 1;
				var CAPICOM_CERT_INFO_SUBJECT_SIMPLE_NAME = 0;
				var CAPICOM_CERT_INFO_ISSUER_SIMPLE_NAME = 1;
				var CAPICOM_CERT_INFO_SUBJECT_EMAIL_NAME = 2;
				var CAPICOM_CERTIFICATE_FIND_SHA1_HASH = 0;
				var CADESCOM_XML_SIGNATURE_TYPE_ENVELOPING = 1;
				var XmlDsigGost3410UrlObsolete = "http://www.w3.org/2001/04/xmldsig-more#gostr34102001-gostr3411";
				var XmlDsigGost3411UrlObsolete = "http://www.w3.org/2001/04/xmldsig-more#gostr3411";
				var XmlDsigGost3410Url = "urn:ietf:params:xml:ns:cpxmlsec:algorithms:gostr34102001-gostr3411";
				var XmlDsigGost3411Url = "urn:ietf:params:xml:ns:cpxmlsec:algorithms:gostr3411";
				var CADESCOM_XML_SIGNATURE_TYPE_TEMPLATE = 2;
				//ReSharper Restore InconsistentNaming 

				//Исходный xml
				var xmlSourceString = digestXml || $("#digest").val();

				//Открываем хранилище и получаем сертификат.
				var oStore = cadesplugin.CreateObject("CAPICOM.Store");
				oStore.Open(CAPICOM_CURRENT_USER_STORE, CAPICOM_MY_STORE,
					CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED);

				var oCertificates = oStore.Certificates.Find(
					CAPICOM_CERTIFICATE_FIND_SHA1_HASH, thumbprint);
				if (oCertificates.Count == 0) {
					alert("Certificate not found! Thumbprint: " + thumbprint);
					return null;
				}

				//Получили наш сертификат.
				var oCertificate = oCertificates.Item(1);

				//Получаем подписанный xml.
				var signedChargeNodeXml = self.signCreate(oCertificate, xmlSourceString);

				//Получить сертификат в Base64
				var certBase64 = oCertificate.Export(0);

				deferred.resolve({ sign: signedChargeNodeXml, cert: certBase64 });

				//Возвращаем подписанную ноду Charge в виде xml.
				return deferred.promise();
			};

			//Подпись Xml ЭП-ОВ
			self.signXmlOv = function(thumbprint) {
				if (proxyService.isChromium()) {
					var certificate = proxyService.getCertificate(thumbprint);
					//В поле передаём сертификат в base64
					$("#ControllerCallbackMethodName").val(certificate);

					var data = "mr=" + $("#MR").val() +
						"&digest=" + $("#digest").val() +
						"&thumbprint=" + thumbprint;
					return proxyService.signSoapOV(data);
				}

				var deferred = $.Deferred();

				asyncSignLib.isPluginInstalled().done(function() {

					var xmlSourceString = $("#digest").val();

					self.signXmlOvPlugin(thumbprint, xmlSourceString).done(function(result) {
						//В поле передаём сертификат в base64
						$("#ControllerCallbackMethodName").val(result.cert);
						//вернуть подпись
						deferred.resolve(result.sign);
					})
						.fail(function(err) {
							//Сообщение об ошибке построения доверенной цепочки сертификатов.
							if (err.number === -2146762486 || //IE
								err.message.indexOf('0x800B010A') > -1 || //Chrome
								err.message.indexOf('Error calling method on NPObject!') > -1) {
								var template = document.getElementById('Nvx.ReDoc.WebInterfaceModule/View/cadesplugin/error0x800B010A.tmpl.html');
								modal.errorModalWindow(template.innerHTML);
							} else {
								alert("Failed to create signature. Error: " + err);
							}

							deferred.reject(err);
						});
				})
					.fail(function() {
						deferred.reject();
					});

				return deferred;
			};

			//Подпись Xml ЭП-ОВ плагином
			self.signXmlOvPlugin = function(thumbprint, xmlSourceString) {

				//если загружен асинхронный плагин
				var canAsync = !!cadesplugin.CreateObjectAsync;
				if (canAsync) {
					return asyncSignLib.signXmlOv(thumbprint, xmlSourceString);
				}

				var deferred = $.Deferred();

				asyncSignLib.isPluginInstalled().done(function() {
					//Открываем хранилище и получаем сертификат.
					var oStore = cadesplugin.CreateObject("CAPICOM.Store");
					oStore.Open(2, "My", 2);

					var oCertificates = oStore.Certificates.Find(0, thumbprint);
					if (oCertificates.Count == 0) {
						alert("Certificate not found! Thumbprint: " + thumbprint);
						return null;
					}

					//Получили наш сертификат.
					var oCertificate = oCertificates.Item(1);

					//В поле передаём сертификат в base64
					var cerBase64 = oCertificate.Export(0);

					var signedAll = self.signOvCreate(oCertificate, xmlSourceString);

					signedAll.done(function(oSigned) {
						deferred.resolve({ sign: oSigned, cert: cerBase64 });
					})
						.fail(function() {
							deferred.reject();
						});
				})
					.fail(function() {
						deferred.reject();
					});
			

				return deferred.promise();
			};

			//Создание подпись ЭП-ОВ
			self.signOvCreate = function(oCertificate, dataToSign) {
				//если загружен асинхронный плагин
				var canAsync = !!cadesplugin.CreateObjectAsync;

				if (canAsync) {
					return asyncSignLib.signOvCreate(oCertificate, dataToSign);
				}

				var deferred = $.Deferred();

				asyncSignLib.isPluginInstalled().done(function() {
					//ReSharper Disable InconsistentNaming 
					var CADESCOM_XML_SIGNATURE_TYPE_TEMPLATE = 2;
					//ReSharper Restore InconsistentNaming 

					// Создаем объект CAdESCOM.CPSigner
					var oSigner = cadesplugin.CreateObject("CAdESCOM.CPSigner");
					oSigner.Certificate = oCertificate;

					// Создаем объект CAdESCOM.SignedXML
					var oSignedXml = cadesplugin.CreateObject("CAdESCOM.SignedXML");
					oSignedXml.Content = dataToSign;

					// Указываем тип подписи - в данном случае по шаблону
					oSignedXml.SignatureType = CADESCOM_XML_SIGNATURE_TYPE_TEMPLATE;

					try {
						//return oSignedXml.Sign(oSigner);
						deferred.resolve(oSignedXml.Sign(oSigner));
					} catch(err) {
						//Сообщение об ошибке построения доверенной цепочки сертификатов.
						if (err.number === -2146762486 || //IE
							err.message.indexOf('0x800B010A') > -1 || //Chrome
							err.message.indexOf('Error calling method on NPObject!') > -1) {
							var template = document.getElementById('Nvx.ReDoc.WebInterfaceModule/View/cadesplugin/error0x800B010A.tmpl.html');
							modal.errorModalWindow(template.innerHTML);
						} else {
							alert("Failed to create signature. Error: " + err);
						}
						//в случае ошибки подписи выходим
						//return null;
						deferred.reject();
					}
				})
					.fail(function() {
						deferred.reject();
					});
			

				return deferred.promise();
			};

			//Подпись двух Xml ЭП-ОВ
			self.sign2XmlOv = function(thumbprint) {
				if (proxyService.isChromium()) {
					var certificate = proxyService.getCertificate(thumbprint);
					//В поле передаём сертификат в base64
					$("#ControllerCallbackMethodName").val(certificate);

					//общие данные для подписи
					var dataBase = "mr=" + $("#MR").val() +
						"&thumbprint=" + thumbprint;

					//подписать вторую xml
					var data2 = dataBase + "&digest=" + $("#digest2").val();
					deferred2 = proxyService.signSoapOV(data2);

					var deferred = $.Deferred();

					deferred2.done(function(sign) {
						//Подписанный запрос на статус пишем во второе поле
						$("#digest2").val(sign);
						//подписать первую xml
						var data1 = dataBase + "&digest=" + $("#digest").val();
						var deferred1 = proxyService.signSoapOV(data1);
						deferred1.done(function(sign) {
							deferred.resolve(sign);
						});
					});

					return deferred;
				}

				var xmlSourceString = $("#digest").val();
				var xmlSourceString2 = $("#digest2").val();

				var deferredPlugin = $.Deferred();

				self.sign2XmlOvPlugin(thumbprint, xmlSourceString, xmlSourceString2).done(function(result) {
					$("#ControllerCallbackMethodName").val(result.cert);
					//Подписанный запрос на статус пишем во второе поле
					$("#digest2").val(result.sign2);
					deferredPlugin.resolve(result.sign1);
				})
					.fail(function(error) {
						deferredPlugin.reject(error);
					});

				return deferredPlugin;
			};

			//Подпись двух Xml ЭП-ОВ в плагине
			self.sign2XmlOvPlugin = function(thumbprint, xmlSourceString, xmlSourceString2) {

				//если загружен асинхронный плагин
				var canAsync = !!cadesplugin.CreateObjectAsync;
				if (canAsync) {
					return asyncSignLib.sign2XmlOv(thumbprint, xmlSourceString, xmlSourceString2);
				}

				var deferred = $.Deferred();

				//Открываем хранилище и получаем сертификат.
				var oStore = cadesplugin.CreateObject("CAPICOM.Store");
				oStore.Open(2, "My", 2);

				var oCertificates = oStore.Certificates.Find(0, thumbprint);
				if (oCertificates.Count == 0) {
					alert("Certificate not found! Thumbprint: " + thumbprint);
					return null;
				}

				//Получили наш сертификат.
				var oCertificate = oCertificates.Item(1);
				//В поле передаём сертификат в base64
				var certBase64 = oCertificate.Export(0);
				//Подписываем второй, затем первый запрос
				var signedAll2 = signOvCreate(oCertificate, xmlSourceString2);
				var signedAll = signOvCreate(oCertificate, xmlSourceString);

				$.when(signedAll, signedAll2)
					.done(function(oSigned, oSigned2) {
						deferred.resolve({ sign1: oSigned, sign2: oSigned2, cert: certBase64 });
					})
					.fail(function() {
						deferred.reject();
					});

				return deferred.promise();
			};

		};

		inherit(signingHelper, baseSignLib);

		return signingHelper;
	});
/// <reference path="../../debug/Nvx.ReDoc.WebInterfaceModule/Content/lib/jQuery/jquery.min.js" />
require([
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/Helpers/signingHelper',
	'require',
	'knockout',
	'jquery',
	'Nvx.ReDoc.WebInterfaceModule/Content/Scripts/nvx'
], function (signingHelper, require, ko, $, Nvx) {
	Nvx.createNamespace("Nvx.ReDoc.WebInterfaceModule.Content.Scripts.Helpers");
	//Совпадает ли расширение переданного имени файла с расширением .sig
	Nvx.ReDoc.WebInterfaceModule.Content.Scripts.Helpers.isSigFileExtention = function (filename) {
		var extention = filename.split('.').pop();
		if (extention) {
			extention = extention.toLowerCase();
			if (extention === 'sig') return true;
		}

		return false;
	};

	var signingHelperInstance = new signingHelper();
	//legacy
	Nvx.ReDoc.WebInterfaceModule.Content.Scripts.signingHelper = signingHelperInstance;
});
require(['knockout',
		'domReady',
		'Nvx/AuthViewModel',
		'Nvx/CustomerCabinetViewModel',
		'Nvx.ReDoc.Rpgu.PortalModule/Cabinet/Script/request/RequestListViewModel',
		'Nvx/DepartmentTreeViewModel',
		'Nvx/CategoryViewModel',
		'Nvx/CategoryServiceList',
		'Nvx/PopularServiceViewModel',
		'Nvx/RequestViewModel',
		'Nvx/RequestInfoViewModel',
		'Nvx/StartServiceViewModel',
		'Nvx/ServiceListByCatsViewModel',
		'Nvx/SituationsViewModel',
		'Nvx/TreatmentStartViewModel',
		'Nvx/UserTypeViewModel',
		'Nvx/StateStructuresViewModel',
		'Nvx/SearchPanelViewModel',
		'Nvx/SearchServicesViewModel',
		'Nvx/CurrentLocationViewModel',
		'Nvx/LocationSelectViewModel',
		'Nvx/TripleCatalogViewModel',
		'Nvx/StartCreateFileViewModel',
		'Nvx.ReDoc.Rpgu.Reception/Web/Scripts/ReceptionFormViewModel',
		'Nvx.ReDoc.Rpgu.Reception/Web/ArmOperator/Scripts/ArmOperatorViewModel',
		'Nvx.ReDoc.Rpgu.Reception/Web/Scripts/ReceptionTicketsViewModel',
		'Nvx.ReDoc.Rpgu.PortalModule/Portal/Script/Payments/PaymentsCommonViewModel',
		'Nvx.ReDoc.Rpgu.HousingUtilities/Script/LkPaymentsListViewModel',
		'Nvx.ReDoc.Rpgu.PortalModule/Complaint/Script/ComplaintPageModel',
		'Nvx.ReDoc.Rpgu.PortalModule/Cabinet/Script/complaint/ComplaintListViewModel',
		'Nvx.ReDoc.Rpgu.Gostehnadzor/Web/Script/ChargeViewModel',
		'Esb/EsbProblemRequestsViewModel'
	],
	function(ko,
		domReady,
		AuthViewModel,
		CustomerCabinetViewModel,
		RequestListViewModel,
		DepartmentTreeViewModel,
		CategoryViewModel,
		CategoryServiceList,
		PopularServiceViewModel,
		RequestViewModel,
		RequestInfoViewModel,
		StartServiceViewModel,
		ServiceListByCatsViewModel,
		SituationsViewModel,
		TreatmentStartViewModel,
		UserTypeViewModel,
		StateStructuresViewModel,
		SearchPanelViewModel,
		SearchServicesViewModel,
		CurrentLocationViewModel,
		LocationSelectViewModel,
		TripleCatalogViewModel,
		StartCreateFileViewModel,
		ReceptionFormViewModel,
		ArmOperatorViewModel,
		ReceptionTicketsViewModel,
		PaymentsCommonViewModel,
		LkPaymentsListViewModel,
		ComplaintPageModel,
		ComplaintListViewModel,
		ChargeViewModel,
		EsbProblemRequestsViewModel
	) {
		domReady(function() {
			if (document.getElementById('nvxTopmenuComplaint') != null) {
				var complaintPageModel = new ComplaintPageModel();
				ko.applyBindings(complaintPageModel, document.getElementById('nvxTopmenuComplaint'));
			}
			if (document.getElementById('nvxStartCreateFile') != null) {
				var startCreateFileViewModel = new StartCreateFileViewModel();
				ko.applyBindings(startCreateFileViewModel, document.getElementById('nvxStartCreateFile'));
				startCreateFileViewModel.start();
			}
			if (document.getElementById('nvxAuth') != null) {
				var authViewModel = new AuthViewModel();
				ko.applyBindings(authViewModel, document.getElementById('nvxAuth'));
				authViewModel.start();
			}
			if (document.getElementById('nvxCustomerInfo') != null) {
				var customerViewModel = new CustomerCabinetViewModel();
				ko.applyBindings(customerViewModel, document.getElementById('nvxCustomerInfo'));
				customerViewModel.start();
			}
			if (document.getElementById('nvxRequestList') != null) {
				var requestListViewModel = new RequestListViewModel();
				ko.applyBindings(requestListViewModel, document.getElementById('nvxRequestList'));
				requestListViewModel.start();
			}
			if (document.getElementById('nvxDepartments') != null) {
				var departmentTreeViewModel = new DepartmentTreeViewModel();
				ko.applyBindings(departmentTreeViewModel, document.getElementById('nvxDepartments'));
				departmentTreeViewModel.start();
			}
			if (document.getElementById('nvxCategory') != null) {
				var categoryViewModel = new CategoryViewModel();
				ko.applyBindings(categoryViewModel, document.getElementById('nvxCategory'));
				categoryViewModel.start();
			}
			if (document.getElementById('nvxCategoryServiceList') != null) {
				var categoryServiceList = new CategoryServiceList();
				ko.applyBindings(categoryServiceList, document.getElementById('nvxCategoryServiceList'));
				categoryServiceList.start();
			}
			if (document.getElementById('nvxPopularService') != null) {
				var popularServiceViewModel = new PopularServiceViewModel();
				ko.applyBindings(popularServiceViewModel, document.getElementById('nvxPopularService'));
				popularServiceViewModel.start();
			}
			if (document.getElementById('nvxRequestAttachment') != null) {
				var requestViewModel = new RequestViewModel();
				ko.applyBindings(requestViewModel, document.getElementById('nvxRequestAttachment'));
				requestViewModel.start('attachment');
			}
			if (document.getElementById('nvxRequestForm') != null) {
				var requestViewModel2 = new RequestViewModel();
				ko.applyBindings(requestViewModel2, document.getElementById('nvxRequestForm'));
				requestViewModel2.start('form');
			}
			if (document.getElementById('nvxRequestInfo') != null) {
				var requestInfoViewModel = new RequestInfoViewModel();
				requestInfoViewModel.start();
				ko.applyBindings(requestInfoViewModel, document.getElementById('nvxRequestInfo'));
			}
			if (document.getElementById('nvxServiceInfo') != null) {
				var startServiceViewModel = new StartServiceViewModel();
				ko.applyBindings(startServiceViewModel, document.getElementById('nvxServiceInfo'));
				startServiceViewModel.start();
			}
			if (document.getElementById('nvxServiceList') != null) {
				var serviceListByCatsViewModel = new ServiceListByCatsViewModel();
				ko.applyBindings(serviceListByCatsViewModel, document.getElementById('nvxServiceList'));
				serviceListByCatsViewModel.start();
			}
			if (document.getElementById('nvxLifeSituations') != null) {
				var viewModel = new SituationsViewModel();
				ko.applyBindings(viewModel, document.getElementById('nvxLifeSituations'));
				viewModel.start();
			}
			if (document.getElementById('nvxTreatment') != null) {
				var treatmentStartViewModel = new TreatmentStartViewModel();
				ko.applyBindings(treatmentStartViewModel, document.getElementById('nvxTreatment'));
				treatmentStartViewModel.start();
			}
			if (document.getElementById('nvxUserSelect') != null) {
				var userTypeViewModel = new UserTypeViewModel();
				ko.applyBindings(userTypeViewModel, document.getElementById('nvxUserSelect'));
				userTypeViewModel.start();
			}
			if (document.getElementById('nvxDepartmentInfo') != null) {
				var stateStructuresViewModel = new StateStructuresViewModel();
				stateStructuresViewModel.start();
				ko.applyBindings(stateStructuresViewModel, document.getElementById('nvxDepartmentInfo'));
			}
			if (document.getElementById('nvxMfcInfo') != null) {
				var stateStructuresViewModel2 = new StateStructuresViewModel();
				stateStructuresViewModel2.start();
				ko.applyBindings(stateStructuresViewModel2, document.getElementById('nvxMfcInfo'));
			}
			if (document.getElementById('nvxSearchPanel') != null) {
				var searchPanelViewModel = new SearchPanelViewModel();
				searchPanelViewModel.start();
				ko.applyBindings(searchPanelViewModel, document.getElementById('nvxSearchPanel'));
			}
			if (document.getElementById('nvxSearchService') != null) {
				var searchServicesViewModel = new SearchServicesViewModel();
				searchServicesViewModel.start();
				ko.applyBindings(searchServicesViewModel, document.getElementById('nvxSearchService'));
			}
			if (document.getElementById('nvxCurrentLocation') != null) {
				var currentLocationViewModel = new CurrentLocationViewModel();
				currentLocationViewModel.start();
				ko.applyBindings(currentLocationViewModel, document.getElementById('nvxCurrentLocation'));
			}
			if (document.getElementById('nvxSelectLocation') != null) {
				var locationSelectViewModel = new LocationSelectViewModel();
				locationSelectViewModel.start();
				ko.applyBindings(locationSelectViewModel, document.getElementById('nvxSelectLocation'));
			}
			if (document.getElementById('nvxTripleCatalog') != null) {
				var tripleCatalogViewModel = new TripleCatalogViewModel();
				tripleCatalogViewModel.start();
				ko.applyBindings(tripleCatalogViewModel, document.getElementById('nvxTripleCatalog'));
			}
			if (document.getElementById('nvxReception') != null) {
				var receptionFormViewModel = new ReceptionFormViewModel();
				ko.applyBindings(receptionFormViewModel, document.getElementById('nvxReception'));
			}
			if (document.getElementById('nvxReceptionArmOperator') != null) {
				var armOperatorViewModel = new ArmOperatorViewModel();
				ko.applyBindings(armOperatorViewModel, document.getElementById('nvxReceptionArmOperator'));
			}
			if (document.getElementById('nvxLkReception') != null) {
				var receptionTicketsViewModel = new ReceptionTicketsViewModel();
				ko.applyBindings(receptionTicketsViewModel, document.getElementById('nvxLkReception'));
			}
			if (document.getElementById('nvxPaymentsCommon') != null) {
				var paymentsCommonViewModel = new PaymentsCommonViewModel();
				paymentsCommonViewModel.start();
				ko.applyBindings(paymentsCommonViewModel, document.getElementById('nvxPaymentsCommon'));
			}
			if (document.getElementById('nvxLkPayments') != null) {
				var lkPaymentsListViewModel = new LkPaymentsListViewModel();
				lkPaymentsListViewModel.start();
				ko.applyBindings(lkPaymentsListViewModel, document.getElementById('nvxLkPayments'));
			}
			
			if (document.getElementById('nvxLkComplaint') != null) {
				var complaintListViewModel = new ComplaintListViewModel();
				complaintListViewModel.start();
				ko.applyBindings(complaintListViewModel, document.getElementById('nvxLkComplaint'));
			}
			if (document.getElementById('nvxIgtnCharge') != null) {
				var chargeViewModel = new ChargeViewModel();
				ko.applyBindings(chargeViewModel, document.getElementById('nvxIgtnCharge'));
			}

			if (document.getElementById('esbProblemRequests') != null) {
				var eprViewModel = new EsbProblemRequestsViewModel();
				eprViewModel.start();
				ko.applyBindings(eprViewModel, document.getElementById('esbProblemRequests'));
			}
		});
	});