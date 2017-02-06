<?php
/*
Plugin Name: com.netvoxlab.suo
Description: Модуль записи в ЭО для WP
Version: 2017.02.05
Author: Ltd. Netvox Lab
Author URI: http://www.netvoxlab.ru/
*/
define('NVX_EOWP_DIR', plugin_dir_path(__FILE__));
define('NVX_EOWP_URL', plugin_dir_url(__FILE__));

class netvoxlab_suo_shortcode {
	
	static $add_script;
				
	static function init () {
		add_shortcode('netvoxlab_suo', array(__CLASS__, 'netvoxlab_suo_func'));
		add_action('init', array(__CLASS__, 'register_myscript'));
		add_action('wp_footer', array(__CLASS__, 'enqueue_myscripts'));
	}
	
	static function netvoxlab_suo_func ($atts, $content = null) {
		self::$add_script = true; 
		$wfm_sign = '
		<div id="suo">
			<div class="suo-header">
				<h1>Предварительная запись через Интернет</h1>
			</div>
			
			<div class="suo-form">
				<label>Выберите МФЦ</label>
				<select id="suoOrg">
					<option value="0" selected="selected">МФЦ Гусь-Хрустальный</option>
					<option value="1">МФЦ Юрьев-Польский</option>
					<option value="2">МФЦ Камешково</option>
				</select>
				<label>Выберите дату приема</label>
				<div id="datepicker"></div>
				<label>Выберите время приема:</label>
				<table>
					<tr>
						<td><div class="suo-time suo-disabled">09.00 - 09.15</div></td>
						<td><div class="suo-time">09.15 - 09.30</div></td>
						<td><div class="suo-time">09.30 - 09.45</div></td>
						<td><div class="suo-time">09.45 - 10.00</div></td>
					</tr>
					<tr>
						<td><div class="suo-time">10.00 - 10.15</div></td>
						<td><div class="suo-time suo-active">10.15 - 10.30</div></td>
						<td><div class="suo-time suo-disabled">10.30 - 10.45</div></td>
						<td><div class="suo-time">10.45 - 11.00</div></td>
					</tr>
					<tr>
						<td><div class="suo-time">11.00 - 11.15</div></td>
						<td><div class="suo-time">11.15 - 11.30</div></td>
						<td><div class="suo-time">11.30 - 11.45</div></td>
						<td><div class="suo-time">11.45 - 12.00</div></td>
					</tr>
					<tr>
						<td><div class="suo-time">12.00 - 12.15</div></td>
						<td><div class="suo-time">12.15 - 12.30</div></td>
						<td><div class="suo-time">12.30 - 12.45</div></td>
						<td><div class="suo-time">12.45 - 13.00</div></td>
					</tr>
				</table>
				
				<label>Введите ФИО*: (Необходимо для приема у оператора)</label>
				<input type="text" name="name" id="suoName" placeholder="Фамилия Имя Отчество" required>
				
				<label>Номер телефона: (Необходимо для уведомлений о изменениях в графике работы)</label>
				<input type="text" name="tel" id="suoTel" placeholder="+7-(___)-___-__-__">
				
				<label>Введите Email: (Мы вышлем вам талон предварительной записи на почту)</label>
				<input type="email" name="email" id="suoEmail" placeholder="example@mail.com">
				<label>Сохраните ваш талон на мобильном устройстве либо распечатайте его</label>
				<div class="suo-footer">
					<input type="button" id="suoSend" onclick="return submitform()" value="Записаться"/>
				</div>
			</div>
		</div>
		';
		return $content . $wfm_sign ;
	}
	
	static function register_myscript() {
		wp_register_style('eowp-style', NVX_EOWP_URL . 'assets/css/style.css?ver=2017.02.05');
		wp_register_style('eowp-datepicker', NVX_EOWP_URL . 'assets/css/datepicker.css?ver=2017.02.05');
		wp_register_script('eowp-script', NVX_EOWP_URL . 'assets/js/script.js?ver=2017.02.05');
		wp_register_script('eowp-jquery', NVX_EOWP_URL . 'assets/js/jquery-3.1.1.min.js');
		wp_register_script('eowp-jqueryiu', NVX_EOWP_URL . 'assets/js/jquery-ui.min.js');
	}
	
	static function enqueue_myscripts() {
		if ( !self::$add_script ) return;
		wp_enqueue_style('eowp-style', NVX_EOWP_URL . 'assets/css/style.css?ver=2017.02.05');
		wp_enqueue_style('eowp-datepicker', NVX_EOWP_URL . 'assets/css/datepicker.css?ver=2017.02.05');
		wp_enqueue_script('eowp-script', NVX_EOWP_URL . 'assets/js/script.js?ver=2017.02.05');
		wp_enqueue_script('eowp-jquery', NVX_EOWP_URL . 'assets/js/jquery-3.1.1.min.js');
		wp_enqueue_script('eowp-jqueryui', NVX_EOWP_URL . 'assets/js/jquery-ui.min.js');
	}
}

netvoxlab_suo_shortcode::init();
?>