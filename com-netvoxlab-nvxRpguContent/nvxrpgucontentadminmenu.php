<?php
	$true_page = 'nvxrpgucontentadminmenu.php';
	 
	//Предзаполнение дефолтными значениями, если их нет
	$options = get_option('nvxrpgucontentoptions');
	if (is_array($options)){
		//Всё норм
	} else {
		update_option('nvxrpgucontentoptions', 
		array(
            'rdcurl' => null,
			'esbRvUrl' => 'http://esbtest.egspace.ru:8080/RequestViewer',
			'departmentView' => '/department/?departmentId=',
			'mfcCommonView' => '/mfc/',
			'mfcView' => '/mfc/?mfcId=',
			'mfcTospView' => '/mfc/?tosp=true&mfcId=',
			'serviceView' => '/service/?serviceId=',
			'categoryView' => '/category/?categoryId=',
			'situationView' => '/category/?situationId=',
			'catalogView' => '/services/',
			'formView' => '/cabinet/request/?fileId=',
			'infoView' => '/cabinet/information/?fileId=',
			'attachmentView' => '/cabinet/attachment/?fileId=',
			'cabinetReceptionList' => '/cabinet/#tab5',
			'treatmentCreateView' => '/treatment/?serviceId=',
			'searchView' => '/searchservice/',
			'payView' => '/pay/'
        ));
	}
	 
	//Функция, добавляющая страницу в пункт меню Настройки
	function nvxrpgucontentoptions() {
		global $true_page;
		add_options_page( 'NVX RPGU content', 'NVX RPGU content', 'manage_options', $true_page, 'renderOptionsPage');  
		add_plugins_page('NVX RPGU content', 'NVX RPGU content', 'manage_options', $true_page, 'renderOptionsPage');
	}
	add_action('admin_menu', 'nvxrpgucontentoptions');
	 
	//Рендер страницы настроек
	function renderOptionsPage(){
		global $true_page;		
		?><div class="wrap">			
			<h2 style="cursor: pointer;" onclick="{ document.getElementById('nvxrpgucontentoptionsshortcodes').hidden = !document.getElementById('nvxrpgucontentoptionsshortcodes').hidden; }"><u>Список шорткодов</u></h2>
			<div id="nvxrpgucontentoptionsshortcodes" hidden="" style="position: absolute; background-color: white; padding: 10px; border: 2px solid black;">
			[com.netvoxlab.nvxRpguContent.nvxSearchService] — Поиск услуг/просмотр услуг<br/>
			[com.netvoxlab.nvxRpguContent.nvxServiceInfo] — Информация по услуге<br/>
			[com.netvoxlab.nvxRpguContent.nvxDepartmentInfo] — Информация по ведомству<br/>
			[com.netvoxlab.nvxRpguContent.nvxAuth] — Блок авторизации ЕСИА<br/>
			[com.netvoxlab.nvxRpguContent.nvxPopularService] — Популярные услуги<br/>
			[com.netvoxlab.nvxRpguContent.nvxServiceList] — Список категорий с услугами<br/>
			[com.netvoxlab.nvxRpguContent.nvxCategory] — Категории услуг<br/>
			[com.netvoxlab.nvxRpguContent.nvxLifeSituations] — Жизненные ситуации<br/>
			[com.netvoxlab.nvxRpguContent.nvxDepartments] — Иерархический список ведомств<br/>
			[com.netvoxlab.nvxRpguContent.nvxCategoryServiceList] — Услуги для выбранной категории<br/>
			[com.netvoxlab.nvxRpguContent.nvxMfcInfo] — Информация по МФЦ<br/>
			[com.netvoxlab.nvxRpguContent.nvxReception] — Запись на приём<br/>
			[com.netvoxlab.nvxRpguContent.nvxPaymentsCommon] — Страница с функционалом оплаты (Юнителлер, парковки)<br/>
			[com.netvoxlab.nvxRpguContent.nvxRequestForm] — Динамическая форма заявления<br/>
			[com.netvoxlab.nvxRpguContent.nvxRequestAttachment] — Форма вложений заявления<br/>
			[com.netvoxlab.nvxRpguContent.nvxRequestInfo] — Просмотр информации по заявлению<br/>
			[com.netvoxlab.nvxRpguContent.nvxLkFullPage] — Страница личного кабинета со встроенными разделами<br/>
			[com.netvoxlab.nvxRpguContent.nvxTreatment] — Обращение<br/>
			[com.netvoxlab.nvxRpguContent.nvxTripleCatalog] — Каталог с разделами Категории/Ведомства/Жизненные ситуации<br/>
			[com.netvoxlab.nvxRpguContent.esbProblemRequests] — Отчёты шины по необработанным заявкам
			</div>
			<form method="post" enctype="multipart/form-data" action="options.php">
				<?php 
				settings_fields('nvxrpgucontentoptions');//Это название нашего конфига
				do_settings_sections($true_page);
				?>
				<p class="submit">  
					<input type="submit" class="button-primary" value="<?php _e('Save Changes') ?>" />  
				</p>
			</form>
		</div><?php
	}
	 
	//Регистрируем настройки в базе под названием nvxrpgucontentoptions
	function registerNvxOptions() {
		global $true_page;
		// Присваиваем функцию валидации ( true_validate_settings() ). Вы найдете её ниже
		register_setting( 'nvxrpgucontentoptions', 'nvxrpgucontentoptions', 'true_validate_settings' );
	 
		// Добавляем секцию
		add_settings_section( 'nvxOptionsSection1', 'Основные настройки', '', $true_page );
		add_settings_section( 'nvxOptionsSection2', 'Ссылки внутри портала', '', $true_page );
	 
		// Создадим текстовое поле в первой секции
		$true_field_params = array('type' => 'text', 'id' => 'rdcurl', 'desc' => 'Адрес удалённого портала РПГУ, с которого будут тянуться данные. Например: http://testrpgu.egspace.ru');
		add_settings_field( 'rdcurl', 'Адрес удалённого Re:Doc', 'option_display_settings', $true_page, 'nvxOptionsSection1', $true_field_params );
		
		$true_field_params = array('type' => 'text', 'id' => 'esbRvUrl', 'desc' => 'Адрес приложения RequestViewer на шине. Например тестовый: http://esbtest.egspace.ru:8080/RequestViewer');
		add_settings_field( 'esbRvUrl', 'Адрес RV на шине', 'option_display_settings', $true_page, 'nvxOptionsSection1', $true_field_params );		
		
		$true_field_params = array('type' => 'text', 'id' => 'searchView', 'desc' => 'Страница поиска услуг. Например: /searchservice/');
		add_settings_field( 'searchView', 'Поиск услуг', 'option_display_settings', $true_page, 'nvxOptionsSection2', $true_field_params );
		
		$true_field_params = array('type' => 'text', 'id' => 'serviceView', 'desc' => 'Страница с карточкой услуги. Например: /service/?serviceId=');
		add_settings_field( 'serviceView', 'Информация об услуге', 'option_display_settings', $true_page, 'nvxOptionsSection2', $true_field_params );
		
		$true_field_params = array('type' => 'text', 'id' => 'departmentView', 'desc' => 'Страница с карточкой ведомства. Например: /department/?departmentId=');
		add_settings_field( 'departmentView', 'Информация о ведомстве', 'option_display_settings', $true_page, 'nvxOptionsSection2', $true_field_params );
		
		$true_field_params = array('type' => 'text', 'id' => 'mfcCommonView', 'desc' => 'Страница с перечнем МФЦ. Например: /mfc/');
		add_settings_field( 'mfcCommonView', 'Список МФЦ', 'option_display_settings', $true_page, 'nvxOptionsSection2', $true_field_params );
		
		$true_field_params = array('type' => 'text', 'id' => 'mfcView', 'desc' => 'Страница с карточкой МФЦ. Например: /mfc/?mfcId=');
		add_settings_field( 'mfcView', 'Информация о МФЦ', 'option_display_settings', $true_page, 'nvxOptionsSection2', $true_field_params );
		
		$true_field_params = array('type' => 'text', 'id' => 'mfcTospView', 'desc' => 'Страница с карточкой ТОСП. Например: /mfc/?tosp=true&mfcId=');
		add_settings_field( 'mfcTospView', 'Информация о ТОСП', 'option_display_settings', $true_page, 'nvxOptionsSection2', $true_field_params );
		
		$true_field_params = array('type' => 'text', 'id' => 'categoryView', 'desc' => 'Страница категории. Например: /category/?categoryId=');
		add_settings_field( 'categoryView', 'Услуги категории', 'option_display_settings', $true_page, 'nvxOptionsSection2', $true_field_params );
		
		$true_field_params = array('type' => 'text', 'id' => 'situationView', 'desc' => 'Страница жизненной ситуации. Например: /category/?categoryId=');
		add_settings_field( 'situationView', 'Услуги жизненной ситуации', 'option_display_settings', $true_page, 'nvxOptionsSection2', $true_field_params );
		
		$true_field_params = array('type' => 'text', 'id' => 'catalogView', 'desc' => 'Страница каталога услуг, ведомств и жизненных ситуаций. Например: /services/');
		add_settings_field( 'catalogView', 'Каталог услуги/ведомства/ЖС', 'option_display_settings', $true_page, 'nvxOptionsSection2', $true_field_params );
		
		$true_field_params = array('type' => 'text', 'id' => 'formView', 'desc' => 'Страница с динамической формой заявления. Например: /cabinet/request/?fileId=');
		add_settings_field( 'formView', 'Форма заявления', 'option_display_settings', $true_page, 'nvxOptionsSection2', $true_field_params );
		
		$true_field_params = array('type' => 'text', 'id' => 'attachmentView', 'desc' => 'Страница с формой прикрепления документов заявления. Например: /cabinet/attachment/?fileId=');
		add_settings_field( 'attachmentView', 'Форма прикладывания  документов', 'option_display_settings', $true_page, 'nvxOptionsSection2', $true_field_params );
		
		$true_field_params = array('type' => 'text', 'id' => 'infoView', 'desc' => 'Страница с динамической формой заявления. Например: /cabinet/information/?fileId=');
		add_settings_field( 'infoView', 'Форма заявления', 'option_display_settings', $true_page, 'nvxOptionsSection2', $true_field_params );
		
		$true_field_params = array('type' => 'text', 'id' => 'cabinetReceptionList', 'desc' => 'Страница просмотра талонов записи на приём в личном кабинете. Например: /cabinet/#tab5');
		add_settings_field( 'cabinetReceptionList', 'Талоны записи на приём', 'option_display_settings', $true_page, 'nvxOptionsSection2', $true_field_params );
		
		$true_field_params = array('type' => 'text', 'id' => 'treatmentCreateView', 'desc' => 'Страница оформления обращения. Например: /treatment/?serviceId=');
		add_settings_field( 'treatmentCreateView', 'Оформление обращения', 'option_display_settings', $true_page, 'nvxOptionsSection2', $true_field_params );
		
		$true_field_params = array('type' => 'text', 'id' => 'payView', 'desc' => 'Страница с платёжными инструментами. Например: /pay/');
		add_settings_field( 'payView', 'Оплата', 'option_display_settings', $true_page, 'nvxOptionsSection2', $true_field_params );
	}
	add_action( 'admin_init', 'registerNvxOptions' );
	 
	//Функция отображения полей ввода. Здесь задаётся HTML и PHP, выводящий поля
	function option_display_settings($args) {
		extract( $args );
	 
		$option_name = 'nvxrpgucontentoptions';
	 
		$o = get_option( $option_name );
	 
		switch ( $type ) {  
			case 'text':  
				$o[$id] = esc_attr( stripslashes($o[$id]) );
				echo "<input class='regular-text' type='text' id='$id' name='" . $option_name . "[$id]' value='$o[$id]' />";  
				echo ($desc != '') ? "<br /><span class='description'>$desc</span>" : "";  
			break;
			case 'textarea':  
				$o[$id] = esc_attr( stripslashes($o[$id]) );
				echo "<textarea class='code large-text' cols='50' rows='10' type='text' id='$id' name='" . $option_name . "[$id]'>$o[$id]</textarea>";  
				echo ($desc != '') ? "<br /><span class='description'>$desc</span>" : "";  
			break;
			case 'checkbox':
				$checked = ($o[$id] == 'on') ? " checked='checked'" :  '';  
				echo "<label><input type='checkbox' id='$id' name='" . $option_name . "[$id]' $checked /> ";  
				echo ($desc != '') ? $desc : "";
				echo "</label>";  
			break;
			case 'select':
				echo "<select id='$id' name='" . $option_name . "[$id]'>";
				foreach($vals as $v=>$l){
					$selected = ($o[$id] == $v) ? "selected='selected'" : '';  
					echo "<option value='$v' $selected>$l</option>";
				}
				echo ($desc != '') ? $desc : "";
				echo "</select>";  
			break;
			case 'radio':
				echo "<fieldset>";
				foreach($vals as $v=>$l){
					$checked = ($o[$id] == $v) ? "checked='checked'" : '';  
					echo "<label><input type='radio' name='" . $option_name . "[$id]' value='$v' $checked />$l</label><br />";
				}
				echo "</fieldset>";  
			break; 
		}
	}
	 
	//Функция проверки правильности вводимых полей
	function true_validate_settings($input) {
		foreach($input as $k => $v) {
			$valid_input[$k] = trim($v);
	 
			/* Вы можете включить в эту функцию различные проверки значений, например
			if(! задаем условие ) { // если не выполняется
				$valid_input[$k] = ''; // тогда присваиваем значению пустую строку
			}
			*/
		}
		return $valid_input;
	}	
	
?>