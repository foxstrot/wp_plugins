<?php
	function nvx_esia_prefix_init() {
		$option_name = 'nvxesiapluginoptions';
		$options = get_option($option_name);		
		if (!is_array($options)) {
			$options = nvx_esia_prefix_getDefaultOptions();
			update_option($option_name, $options);
		}
	} 
	
	add_action('admin_menu', 'nvx_esia_prefix_nvxesiapluginoptions');
	add_action('admin_init', 'nvx_esia_prefix_registerNvxOptions');
	
	//Функция, добавляющая страницу в пункт меню Настройки
	function nvx_esia_prefix_nvxesiapluginoptions() {
		add_options_page( 'NVX ESIA', 'NVX ESIA', 'manage_options', 'nvxesiaadminmenu.php', 'nvx_esia_prefix_renderOptionsPage');
		//add_plugins_page('NVX ESIA', 'NVX ESIA', 'manage_options', $this->true_page;, 'nvx_esia_prefix_renderOptionsPage');
	}

	//Рендер страницы настроек
	function nvx_esia_prefix_renderOptionsPage(){
		?><div class="wrap">
			<div style="float: right;">Версия плагина: <?php echo nvxRpguContentVer; ?></div>
			<form method="post" enctype="multipart/form-data" action="options.php">
				<?php 
				settings_fields('nvxesiapluginoptions');//Это название нашего конфига
				do_settings_sections('nvxesiaadminmenu.php');
				?>
				<p class="submit">  
					<input type="submit" class="button-primary" value="<?php _e('Save Changes') ?>" />  
				</p>
			</form>
		</div><?php
	}

	//Регистрируем настройки в базе под названием nvxesiapluginoptions
	function nvx_esia_prefix_registerNvxOptions() {
		$true_page = 'nvxesiaadminmenu.php';
		// Присваиваем функцию валидации ( nvx_esia_validate_setting() ). Вы найдете её ниже
		register_setting( 'nvxesiapluginoptions', 'nvxesiapluginoptions', 'nvx_esia_validate_setting' );

		add_settings_section( 'nvxOptionsSection1', 'Основные настройки', '', $true_page );

		$true_field_params = array('type' => 'text', 'id' => 'rdcurl', 'desc' => 'Адрес удалённого портала РПГУ, с которого будут тянуться данные. Например: http://testrpgu.egspace.ru/');
		add_settings_field( 'rdcurl', 'Адрес удалённого Re:Doc', 'nvx_esia_prefix_option_display_settings', $true_page, 'nvxOptionsSection1', $true_field_params );
		
		$true_field_params = array(
			'type'=> 'select',
			'id'  => 'esiaEndpoint',
			'desc'=> 'Адрес ЕСИА',
			'vals'=> array( 'https://esia-portal1.test.gosuslugi.ru/' => 'Тестовая среда (https://esia-portal1.test.gosuslugi.ru/)', 'https://esia.gosuslugi.ru/' => 'Продуктивная среда (https://esia.gosuslugi.ru/)'));
		add_settings_field( 'esiaEndpoint', 'Адрес ЕСИА', 'nvx_esia_prefix_option_display_settings', $true_page, 'nvxOptionsSection1', $true_field_params );

		$true_field_params = array('type' => 'text', 'id' => 'esiaClientId', 'desc' => 'Идентификатор клиента ЕСИА. Например: 123456789');
		add_settings_field( 'esiaClientId', 'Идентификатор клиента ЕСИА', 'nvx_esia_prefix_option_display_settings', $true_page, 'nvxOptionsSection1', $true_field_params );

		$true_field_params = array('type' => 'password', 'id' => 'privateKeyPassword', 'desc' => '');
		add_settings_field( 'privateKeyPassword', 'Пароль от закрытого ключа', 'nvx_esia_prefix_option_display_settings', $true_page, 'nvxOptionsSection1', $true_field_params );

		$true_field_params = array('type' => 'file', 'id' => 'privateKeyFile', 'desc' => 'Файл закрытого ключа (*.pem).');
		add_settings_field( 'privateKeyFile', 'Файл закрытого ключа', 'nvx_esia_prefix_option_display_settings', $true_page, 'nvxOptionsSection1', $true_field_params );

		$true_field_params = array('type' => 'file', 'id' => 'openKeyFile', 'desc' => 'Открытая часть сертификата (*.cer).');
		add_settings_field( 'openKeyFile', 'Открытая часть сертификата', 'nvx_esia_prefix_option_display_settings', $true_page, 'nvxOptionsSection1', $true_field_params );
	}
	 
	//Функция отображения полей ввода. Здесь задаётся HTML и PHP, выводящий поля
	function nvx_esia_prefix_option_display_settings($args) {
		extract( $args );
		$option_name = 'nvxesiapluginoptions';
		$o = get_option( $option_name );
		nvx_esia_prefix_loadOptions($o);
		switch ( $type ) {
			case 'password':
			case 'text':
				$tmp = esc_attr( stripslashes($o->$id));
				echo "<input class='regular-text' type='$type' id='$id' name='" . $option_name . "[$id]' value='".$tmp."' />";
				echo ($desc != '') ? "<br /><span class='description'>$desc</span>" : "";
				break;
			case 'select':
				echo "<select id='$id' name='" . $option_name . "[$id]'>";
				foreach($vals as $v=>$l){
					$selected = ($o->$id == $v) ? "selected='selected'" : '';
					echo "<option value='$v' $selected>$l</option>";
				}
				echo ($desc != '') ? $desc : "";
				echo "</select>";
				break;
			case 'file':
				echo '<input type="file" name="'.$option_name.'['.$id.']" id="'.$id.'"/>';
				echo ($desc != '') ? "<br /><span class='description'>$desc</span>" : "";
				if ($o->$id != null && file_exists($o->$id))
					echo '<span class="description"> Загружено.</span>';
				break;
		}
	}

	//Функция проверки правильности вводимых полей
	function nvx_esia_validate_setting($plugin_options)
	{
		$option_name = 'nvxesiapluginoptions';
		$oldOptions = get_option( $option_name );
		//Закрытая часть
		$currentKey = 'privateKeyFile';
		$data = $_FILES[$option_name];
		$fileWasUploaded = false;
		if ($data['size'][$currentKey]) {
			if (preg_match('/(pem)$/', $data['name'][$currentKey]) ) {
				//перемещаем файл в папку плагина под именем key.pem
				$target = $GLOBALS['nvxRpguEsiaUriPluginDir'].'key.pem';
				if (move_uploaded_file($data['tmp_name'][$currentKey], $target)) {
					$fileWasUploaded = true;
				}
			}
		}
		if ($fileWasUploaded)
			$plugin_options[$currentKey] = $GLOBALS['nvxRpguEsiaUriPluginDir'].'key.pem';
		else
			$plugin_options[$currentKey] = $oldOptions[$currentKey];

		//Открытая часть
		$fileWasUploaded = false;
		$currentKey = 'openKeyFile';
		$data = $_FILES['nvxesiapluginoptions'];
		if ($data['size'][$currentKey]) {
			if (preg_match('/(cer)$/', $data['name'][$currentKey]) ) {
				//перемещаем файл в папку плагина под именем key.cer
				if (move_uploaded_file($data['tmp_name'][$currentKey], $GLOBALS['nvxRpguEsiaUriPluginDir'].'key.cer')) {
					$fileWasUploaded = true;
				}
			}
		}
		if ($fileWasUploaded)
			$plugin_options[$currentKey] = $GLOBALS['nvxRpguEsiaUriPluginDir'].'key.cer';
		else
			$plugin_options[$currentKey] = $oldOptions[$currentKey];
		
		if (isset($plugin_options['rdcurl']) && substr($plugin_options['rdcurl'], -1) != '/')
			$plugin_options['rdcurl'] = $plugin_options['rdcurl'].'/';
		
		return $plugin_options;
	}

	function nvx_esia_prefix_loadOptions(&$options){
		setType($options, 'ARRAY');
		$options = Array_Filter($options);
		$options = Array_Merge(nvx_esia_prefix_getDefaultOptions(), $options);
		setType($options, 'OBJECT');
	}
	
	//Дефолтные конфиги
	function nvx_esia_prefix_getDefaultOptions() {
		return array(
			'esiaEndpoint' => 'https://esia-portal1.test.gosuslugi.ru/',
			'esiaClientId' => '',
			'privateKeyPassword' => '',
			'privateKeyFile' => null,
			'openKeyFile' => null,
			'rdcurl' =>''
		);
	}
	
	nvx_esia_prefix_init();
?>