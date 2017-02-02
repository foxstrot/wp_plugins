define(['jquery', 'knockout', 'select2vendor'], function ($, ko) {

	var jQuery = $;
	var S2 = jQuery.fn.select2.amd;

	var selectMultiOptionForS2 = function ($element, data) {
		var options = $element.find('option');

		//drop all selected
		for (var j = 0; j < options.length; j++) {
			options[j].selected = false;
		}

		//set selected or add new selected option
		for (var i = 0; i < data.length; i++) {
			var curData = data[i];

			var $option = ko.utils.arrayFirst(options, function(item) {
				return function(item, data) {
					return item.value == data.id;
				}(item, curData);
			});

			if ($option == null) {
				$option = $('<option/>').text(curData.text).val(curData.id).prop('selected', true);
				$element.append($option);
			} else {
				if (!$option.text && curData.id !== "" && curData.id != null) {
					$($option).removeData();// remove any caching data that might be associated
					$option.text = curData.text;
				}
				$option.selected = true;
			}
		}

		$element.trigger('change');
	};

	var getIdObj = function (item) {
		if ($.isPlainObject(item)) {
			return item;
		} else {
			return { id: item };
		}
	}

	$.fn.selectOptionsForS2 = function (data) {
		var $element = $(this);
		if (data !== undefined && data !== null) {
			if (data instanceof Array) {
				var first = data[0];
				if (first != null) {
					if ($.isPlainObject(first)) {
						selectMultiOptionForS2($element, data);
					} else {
						var idObjArray = data.map(function(item) {
							return { id: item };
						});
						selectMultiOptionForS2($element, idObjArray);
					}
				} else {
					selectMultiOptionForS2($element, []);
				}
			} else {
				selectMultiOptionForS2($element, [getIdObj(data)]);
			}
		} else {
			selectMultiOptionForS2($element, []);
		}
	}

	var addInitSelection = function($) {
		var orginalS2 = $.fn.select2;
		$.fn.select2 = function () {
			var $element = $(this);
			var options = arguments[0];

			if (typeof options === 'string')
				return orginalS2.apply($element, arguments);

			var initializeCurrent = false;
			var multipleSelectCallBack = function (data) {
				$element.selectOptionsForS2(data);
			};

			var singleSelectCallBack = function (data) {
				return multipleSelectCallBack([data]);
			};

			//{ id: data.id, text: data.text } or [{ id: data.id, text: data.text }, ]
			var currentCallback = function (data) {
				initializeCurrent = true;
				if (data !== undefined && data !== null) {
					if (data instanceof Array) {
						multipleSelectCallBack(data);
					} else {
						singleSelectCallBack(data);
					}
				} else {
					console.warn('Select2 при вызове current в Callback передан null');
				}
				initializeCurrent = false;
			};


			var regChangeSelectSynchronization = function ($element) {
				var onSelect = false;
				$element.on("select2:selecting select2:unselecting", function () {
					onSelect = true;
				});

				$element.on("select2:select", function () {
					onSelect = false;
				});

				$element.on("select2:unselect", function () {
					onSelect = false;
				});

				var placeholderId = null;
				var setplaceholder = false;
				$element.on('change', function () {
					if (setplaceholder) {
						var sel = element.data('select2').selection;
						var placeholder = sel ? sel.placeholder : null;
						placeholderId = placeholder ? placeholder.id : null;
						setplaceholder = true;
					}

					if (!initializeCurrent && !onSelect && $element.val() !== placeholderId) {
						options.current($element, currentCallback);
					}
				});
			};

			if (options != null && options.syncElementValue === true) {
				if (typeof options.current !== 'function')
					console.error("при указании syncElementValue === true требуется указывать current");

				regChangeSelectSynchronization($element);
			}

			var result = orginalS2.apply($element, arguments);
			if (options != null && typeof options.current === 'function') {
				//
				setTimeout(function () {
					options.current($element, currentCallback);
				}, 0);
			}

			return result;
		}
	};

	var addGetValueBindingValueToJquery = function (jQuery) {
		var getValue = function () {
			var element = this[0];
			var value = element.value;
			if (value != null && value !== "")
				return value;

			value = element.getAttribute('value');
			if (value != null && value !== "")
				return value;

			var context = ko.contextFor(element);
			if (context != null) {
				var bindings = ko.bindingProvider.instance['getBindings'](element, context);
				if (bindings != null) {
					var multiple = element.attributes['multiple'] != null;
					if (multiple && bindings.selectedOptions != null) {
						value = typeof bindings.selectedOptions === "function" ? bindings.selectedOptions() : (bindings.selectedOptions || null);
					} else {
						value = typeof bindings.value === "function" ? bindings.value() : (bindings.value || null);
					}
					return value;
				}
			}
			return null;
		};
		jQuery.fn.getValueForSelect2 = getValue;
	};

	addInitSelection($);
	addGetValueBindingValueToJquery($);

	// Autoload the jQuery bindings
	// We know that all of the modules exist above this, so we're safe
	var select2 = S2.require('jquery.select2');

	// Hold the AMD module references on the jQuery function that was just loaded
	// This allows Select2 to use the internal loader outside of this file, such
	// as in the language files.
	jQuery.fn.select2.amd = S2;

	// Return the Select2 instance for anyone who is importing it.
	return select2;
});