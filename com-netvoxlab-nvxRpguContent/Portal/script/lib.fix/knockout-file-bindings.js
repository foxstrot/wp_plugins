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