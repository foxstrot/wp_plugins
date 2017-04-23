<?php
	$netvoxlab_ownradio_player_true_page = 'nvxownradioadminmenu.php';
	 
	//Функция, добавляющая страницу в пункт меню Настройки
	function netvoxlab_ownradio_player_options() {
		global $netvoxlab_ownradio_player_true_page;
		add_options_page( 'NVX ownRadio', 'NVX ownRadio', 'manage_options', $netvoxlab_ownradio_player_true_page, 'netvoxlab_ownradio_player_renderOptionsPage');  
		add_plugins_page('NVX ownRadio', 'NVX ownRadio', 'manage_options', $netvoxlab_ownradio_player_true_page, 'netvoxlab_ownradio_player_renderOptionsPage');
	}
	add_action('admin_menu', 'netvoxlab_ownradio_player_options');
	 
	//Рендер страницы настроек
	function netvoxlab_ownradio_player_renderOptionsPage(){
		global $netvoxlab_ownradio_player_true_page;
		?><div class="wrap">
			<div><h1>Настройки плагина NVX ownRadio</h1></div>
			<div style="float: right;">Версия плагина: <?php echo NETVOXLAB_OWNRADIO_PLUGIN_VERSION; ?></div>
			<h2 style="cursor: pointer;" onclick="{ document.getElementById('nvxownradioshortcodes').hidden = !document.getElementById('nvxownradioshortcodes').hidden; }"><u>Список шорткодов</u></h2>
			<div id="nvxownradioshortcodes" hidden="" style="position: absolute; background-color: white; padding: 10px; border: 2px solid black;">
			[ownradio_player] — Вставка проигрывателя на страницу<br/>
			[ownradio_GetTracksHistory] — Выводит последние активные устройства<br/>
			[ownradio_GetLastDevices] — Выводит последние выданные устройству треки и историю их прослушивания<!--<br/>
			<br/>
			[ownradio_GetUserDevices] — Выводит все устройства пользователя<br/>
			[ownradio_GetUsersRating] — Выводит рейтинг пользователей по количеству своих треков и количеству полученных за последние сутки треков<br/>
			[ownradio_GetLastTracks] — Выводит последние выданные устройству треки <br/>-->
			</div>
			<form method="post" enctype="multipart/form-data" action="options.php">
				<?php 
				settings_fields('netvoxlab_ownradio_player_options');//Это название нашего конфига
				do_settings_sections($netvoxlab_ownradio_player_true_page);
				?>
				<p class="submit">  
					<input type="submit" class="button-primary" value="<?php _e('Save Changes') ?>" />  
				</p>
			</form>
		</div><?php
	}
	 
	//Регистрируем настройки в базе под названием netvoxlab_ownradio_player_options
	function netvoxlab_ownradio_player_registerNvxOptions() {
		global $netvoxlab_ownradio_player_true_page;
		register_setting( 'netvoxlab_ownradio_player_options', 'netvoxlab_ownradio_player_options', 'netvoxlab_ownradio_player_true_validate_settings' );
	 
		// Добавляем секцию
		add_settings_section( 'netvoxlab_ownradio_player_optionsSection1', 'Основные настройки', '', $netvoxlab_ownradio_player_true_page );
	 
		// Создадим текстовое поле в секции
		$true_field_params = array('type' => 'text', 'id' => 'nvxownradiourl', 'desc' => 'Адрес сервера ownRadio, на который будут отправляться запросы. Например: https://api.ownradio.ru/v4');
		add_settings_field( 'nvxownradiourl', 'Адрес сервера', 'netvoxlab_ownradio_player_option_display_settings', $netvoxlab_ownradio_player_true_page, 'netvoxlab_ownradio_player_optionsSection1', $true_field_params );
		
	}
	add_action( 'admin_init', 'netvoxlab_ownradio_player_registerNvxOptions' );
	 
	//Функция отображения полей ввода. Здесь задаётся HTML и PHP, выводящий поля
	function netvoxlab_ownradio_player_option_display_settings($args) {
		extract( $args );
	 
		$netvoxlab_ownradio_player_option_name = 'netvoxlab_ownradio_player_options';
	 
		$netvoxlab_ownradio_player_option = get_option( $netvoxlab_ownradio_player_option_name );
	 
		switch ( $type ) {  
			case 'text':  
				$netvoxlab_ownradio_player_option[$id] = esc_attr( stripslashes($netvoxlab_ownradio_player_option[$id]) );
				echo "<input class='regular-text' type='text' id='$id' name='" . $netvoxlab_ownradio_player_option_name . "[$id]' value='$netvoxlab_ownradio_player_option[$id]' />";  
				echo ($desc != '') ? "<br /><span class='description'>$desc</span>" : "";  
			break;
			case 'textarea':  
				$netvoxlab_ownradio_player_option[$id] = esc_attr( stripslashes($netvoxlab_ownradio_player_option[$id]) );
				echo "<textarea class='code large-text' cols='50' rows='10' type='text' id='$id' name='" . $netvoxlab_ownradio_player_option_name . "[$id]'>$netvoxlab_ownradio_player_option[$id]</textarea>";  
				echo ($desc != '') ? "<br /><span class='description'>$desc</span>" : "";  
			break;
			case 'checkbox':
				$checked = ($netvoxlab_ownradio_player_option[$id] == 'on') ? " checked='checked'" :  '';  
				echo "<label><input type='checkbox' id='$id' name='" . $netvoxlab_ownradio_player_option_name . "[$id]' $checked /> ";  
				echo ($desc != '') ? $desc : "";
				echo "</label>";  
			break;
			case 'select':
				echo "<select id='$id' name='" . $netvoxlab_ownradio_player_option_name . "[$id]'>";
				foreach($vals as $v=>$l){
					$selected = ($netvoxlab_ownradio_player_option[$id] == $v) ? "selected='selected'" : '';  
					echo "<option value='$v' $selected>$l</option>";
				}
				echo ($desc != '') ? $desc : "";
				echo "</select>";  
			break;
			case 'radio':
				echo "<fieldset>";
				foreach($vals as $v=>$l){
					$checked = ($netvoxlab_ownradio_player_option[$id] == $v) ? "checked='checked'" : '';  
					echo "<label><input type='radio' name='" . $netvoxlab_ownradio_player_option_name . "[$id]' value='$v' $checked />$l</label><br />";
				}
				echo "</fieldset>";  
			break; 
		}
	}
	 
	//Функция проверки правильности вводимых полей
	function netvoxlab_ownradio_player_true_validate_settings($input) {
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