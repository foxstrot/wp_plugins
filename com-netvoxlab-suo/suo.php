<?php
/*
Plugin Name: com.netvoxlab.suo
Description: Модуль записи в ЭО для WP
Version: 1.0
Author: Ltd. Netvox Lab
Author URI: http://www.netvoxlab.ru/
*/
define('NVX_EOWP_DIR', plugin_dir_path(__FILE__));
define('NVX_EOWP_URL', plugin_dir_url(__FILE__));

function registering_eowpscript(){
	wp_register_script('eowp-script', NVX_EOWP_URL . 'assets/js/script.js?ver=2017.02.03');
	wp_enqueue_script('eowp-script', NVX_EOWP_URL . 'assets/js/script.js?ver=2017.02.03');
	wp_register_script('eowp-jquery', NVX_EOWP_URL . 'assets/js/jquery-3.1.1.min.js');
	wp_enqueue_script('eowp-jquery', NVX_EOWP_URL . 'assets/js/jquery-3.1.1.min.js');
	wp_register_script('eowp-jqueryiu', NVX_EOWP_URL . 'assets/js/jquery-ui.min.js');
	wp_enqueue_script('eowp-jqueryui', NVX_EOWP_URL . 'assets/js/jquery-ui.min.js');
}

add_action('template_redirect', 'eowp_page');

function registering_eowpstyle() {
	wp_register_style('eowp-style', NVX_EOWP_URL . 'assets/css/style.css?ver=2017.02.03');
	wp_enqueue_style('eowp-style', NVX_EOWP_URL . 'assets/css/style.css?ver=2017.02.03');
	wp_register_style('eowp-styleui', NVX_EOWP_URL . 'assets/css/jquery-ui.min.css');
	wp_enqueue_style('eowp-styleui', NVX_EOWP_URL . 'assets/css/jquery-ui.min.css');
}
 
function eowp_page() {
  //  if (is_page('eowp')) {
        add_action( 'wp_enqueue_scripts', 'registering_eowpscript' );
		add_action( 'wp_enqueue_scripts', 'registering_eowpstyle' );
  //  }
}

function eowp_shortcode ($atts, $content = null) {
	$wfm_sign = '
		<div class="suo-header">
			<h1>Предварительная запись через Интернет</h1>
			<h2>Пожалуйста, заполните поля</h2>
		</div>
		
		<div class="suo-form">
			<label>Выберите МФЦ</label>
			<select>
				<option value="0" selected="selected">МФЦ Гусь-Хрустальный</option>
				<option value="1">МФЦ Юрьев-Польский</option>
				<option value="2">МФЦ Камешково</option>
			</select>
			<label>Выберите дату приема</label>
			<div id="datepicker" class="suo-calendar"></div>
			<label>Выберите время приема:</label>
			<table>
				<tr>
					<td><div class="suo-disabled">09.00 - 09.15</div></td>
					<td><div>09.15 - 09.30</div></td>
					<td><div>09.30 - 09.45</div></td>
					<td><div>09.45 - 10.00</div></td>
				</tr>
				<tr>
					<td><div>10.00 - 10.15</div></td>
					<td><div class="suo-active">10.15 - 10.30</div></td>
					<td><div class="suo-disabled">10.30 - 10.45</div></td>
					<td><div>10.45 - 11.00</div></td>
				</tr>
				<tr>
					<td><div>11.00 - 11.15</div></td>
					<td><div>11.15 - 11.30</div></td>
					<td><div>11.30 - 11.45</div></td>
					<td><div>11.45 - 12.00</div></td>
				</tr>
				<tr>
					<td><div>12.00 - 12.15</div></td>
					<td><div>12.15 - 12.30</div></td>
					<td><div>12.30 - 12.45</div></td>
					<td><div>12.45 - 13.00</div></td>
				</tr>
			</table>
			
			<label>Введите ФИО*:</label>
			<input type="text" name="name" required>
			
			<label>Ваш Email*:</label>
			<input type="email" name="name" required>
			
			<label>Введите Ваш телефон*:</label>
			<input type="text" name="name" required>
			
			<div class="suo-footer">
				<a class="suo-button">Записаться</a><a class="suo-button suo-clear">Очистить</a>
			</div>
		</div>
	
		<!--
		<div id="suo">
		<form>
			<fieldset class="suo-info">
				<label>Выберите организацию:
					<select id="eowpOrg">
						<option value="0" selected="selected">МФЦ Гусь-Хрустальный</option>
						<option value="1">МФЦ Юрьев-Польский</option>
						<option value="2">МФЦ Камешково</option>
					</select>
				</label>
			  
				<label>Выберите дату:
					<input id="datepicker" type="text" required/>
				</label>
				
				<label>Выберите время:
					<select id="eowpTime">
						<option value="0" selected="selected">9:00</option>
						<option value="1">9:15</option>
						<option value="2">9:30</option>
						<option value="3">9:45</option>
						<option value="4">10:00</option>
						<option value="5">10:15</option>
						<option value="6">10:30</option>
						<option value="7">10:45</option>
						<option value="8">11:00</option>
						<option value="5">11:15</option>
						<option value="6">11:30</option>
						<option value="7">11:45</option>
					</select>
				</label>
				
				<label>ФИО*:
					<input type="text" id="eowpName" name="name" required>
				</label>
				
				<label>Email:
					<input type="email" name="email" required>
				</label>
				
				<label>Телефон*:
					<input type="text" name="telephone" required/>
				</label>
				
				<p>Пожалуйста, укажите ваш телефон, чтобы специалист мог связаться с вами в случае необходимости
				</p><br/>
			</fieldset>
			<fieldset class="suo-action">
				<input type="button" class="btn" id="eowpSend" onclick="return submitform()" value="Отправить"/>
			</fieldset>
		</form>
	</div>-->
	<br/><br/><p>Предварительная запись работает на платформе Re:Doc v2017.02.03</p>
	';
	
	return $content . $wfm_sign ;
}
add_shortcode('netvoxlab_suo', 'eowp_shortcode');
?>