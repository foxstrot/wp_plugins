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
			'departmentView' => '/department/index.php?departmentId=',
			'mfcCommonView' => '/mfc/',
			'mfcView' => '/mfc/index.php?mfcId=',
			'mfcTospView' => '/mfc/index.php?tosp=true&mfcId=',
			'serviceView' => '/service/index.php?serviceId=',
			'categoryView' => '/category/index.php?categoryId=',
			'situationView' => '/category/index.php?situationId=',
			'catalogView' => '/services/',
			'formView' => '/cabinet/request/index.php?fileId=',
			'infoView' => '/cabinet/information/index.php?fileId=',
			'attachmentView' => '/cabinet/attachment/index.php?fileId=',
			'cabinetReceptionList' => '/cabinet/#tab5',
			'treatmentCreateView' => '/treatment/index.php?serviceId=',
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