<?php
	$netvoxlab_check_status_netvoxlab_check_status_true_page = 'nvxstatusadminmenu.php';
	 
	//Функция, добавляющая страницу в пункт меню Настройки
	function netvoxlab_check_status_options() {
		global $netvoxlab_check_status_true_page;
		add_options_page( 'NVX check status', 'NVX check status', 'manage_options', $netvoxlab_check_status_true_page, 'netvoxlab_check_status_renderOptionsPage');  
		add_plugins_page('NVX check status', 'NVX check status', 'manage_options', $netvoxlab_check_status_true_page, 'rnetvoxlab_check_status_enderOptionsPage');
	}
	add_action('admin_menu', 'netvoxlab_check_status_options');
	 
	//Рендер страницы настроек
	function netvoxlab_check_status_renderOptionsPage(){
		global $netvoxlab_check_status_true_page;
		?><div class="wrap">
			<div><h1>Настройки плагина NVX Check status</h1></div>
			<div style="float: right;">Версия плагина: <?php echo NETVOXLAB_CHECK_STATUS_PLUGIN_VERSION; ?></div>
			<h2 style="cursor: pointer;" onclick="{ document.getElementById('nvxstatusshortcodes').hidden = !document.getElementById('nvxstatusshortcodes').hidden; }"><u>Список шорткодов</u></h2>
			<div id="nvxstatusshortcodes" hidden="" style="position: absolute; background-color: white; padding: 10px; border: 2px solid black;">
			[netvoxlab_check_status] — Проверка статуса заявления<br/>
			</div>
			<form method="post" enctype="multipart/form-data" action="options.php">
				<?php 
				settings_fields('netvoxlab_check_status_options');//Это название нашего конфига
				do_settings_sections($netvoxlab_check_status_true_page);
				?>
				<p class="submit">  
					<input type="submit" class="button-primary" value="<?php _e('Save Changes') ?>" />  
				</p>
			</form>
		</div><?php
	}
	 
	//Регистрируем настройки в базе под названием netvoxlab_check_status_options
	function netvoxlab_check_status_registerNvxOptions() {
		global $netvoxlab_check_status_true_page;
		register_setting( 'netvoxlab_check_status_options', 'netvoxlab_check_status_options', 'netvoxlab_check_status_true_validate_settings' );
	 
		// Добавляем секцию
		add_settings_section( 'netvoxlab_check_status_optionsSection1', 'Основные настройки', '', $netvoxlab_check_status_true_page );
	 
		// Создадим текстовое поле в первой секции
		$true_field_params = array('type' => 'text', 'id' => 'nvxstatusurl', 'desc' => 'Адрес портала, на который будет отправляться запрос. Например: http://sq.mfc.ru/v1');
		add_settings_field( 'nvxstatusurl', 'Адрес сервера', 'netvoxlab_check_status_option_display_settings', $netvoxlab_check_status_true_page, 'netvoxlab_check_status_optionsSection1', $true_field_params );
		
	}
	add_action( 'admin_init', 'netvoxlab_check_status_registerNvxOptions' );
	 
	//Функция отображения полей ввода. Здесь задаётся HTML и PHP, выводящий поля
	function netvoxlab_check_status_option_display_settings($args) {
		extract( $args );
	 
		$netvoxlab_check_status_option_name = 'netvoxlab_check_status_options';
	 
		$netvoxlab_check_status_option = get_option( $netvoxlab_check_status_option_name );
	 
		switch ( $type ) {  
			case 'text':  
				$netvoxlab_check_status_option[$id] = esc_attr( stripslashes($netvoxlab_check_status_option[$id]) );
				echo "<input class='regular-text' type='text' id='$id' name='" . $netvoxlab_check_status_option_name . "[$id]' value='$netvoxlab_check_status_option[$id]' />";  
				echo ($desc != '') ? "<br /><span class='description'>$desc</span>" : "";  
			break;
			case 'textarea':  
				$netvoxlab_check_status_option[$id] = esc_attr( stripslashes($netvoxlab_check_status_option[$id]) );
				echo "<textarea class='code large-text' cols='50' rows='10' type='text' id='$id' name='" . $netvoxlab_check_status_option_name . "[$id]'>$netvoxlab_check_status_option[$id]</textarea>";  
				echo ($desc != '') ? "<br /><span class='description'>$desc</span>" : "";  
			break;
			case 'checkbox':
				$checked = ($netvoxlab_check_status_option[$id] == 'on') ? " checked='checked'" :  '';  
				echo "<label><input type='checkbox' id='$id' name='" . $netvoxlab_check_status_option_name . "[$id]' $checked /> ";  
				echo ($desc != '') ? $desc : "";
				echo "</label>";  
			break;
			case 'select':
				echo "<select id='$id' name='" . $netvoxlab_check_status_option_name . "[$id]'>";
				foreach($vals as $v=>$l){
					$selected = ($netvoxlab_check_status_option[$id] == $v) ? "selected='selected'" : '';  
					echo "<option value='$v' $selected>$l</option>";
				}
				echo ($desc != '') ? $desc : "";
				echo "</select>";  
			break;
			case 'radio':
				echo "<fieldset>";
				foreach($vals as $v=>$l){
					$checked = ($netvoxlab_check_status_option[$id] == $v) ? "checked='checked'" : '';  
					echo "<label><input type='radio' name='" . $netvoxlab_check_status_option_name . "[$id]' value='$v' $checked />$l</label><br />";
				}
				echo "</fieldset>";  
			break; 
		}
	}
	 
	//Функция проверки правильности вводимых полей
	function netvoxlab_check_status_true_validate_settings($input) {
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