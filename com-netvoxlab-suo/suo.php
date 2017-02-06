<?php
/*
Plugin Name: com.netvoxlab.suo
Description: Модуль записи в ЭО для WP
Version: 2017.02.06
Author: Ltd. Netvox Lab
Author URI: http://www.netvoxlab.ru/
*/
define('NVX_SUO_PLUGIN_VERSION', '2017.02.06');
define('NVX_EOWP_DIR', plugin_dir_path(__FILE__));
define('NVX_EOWP_URL', plugin_dir_url(__FILE__));

class netvoxlab_suo_shortcode {
	
	static $add_script;
				
	static function init () {
		add_shortcode('netvoxlab_suo', array(__CLASS__, 'netvoxlab_suo_func'));
		add_action('init', array(__CLASS__, 'register_myscript'));
		add_action('admin_menu', array(__CLASS__, 'netvoxlab_suo_add_admin_pages'));
		add_action('wp_footer', array(__CLASS__, 'enqueue_myscripts'));
		
		
		register_activation_hook( __FILE__, array(__CLASS__, 'netvoxlab_suo_install'));
		register_deactivation_hook( __FILE__, array(__CLASS__, 'netvoxlab_suo_uninstall'));
	}
	
	static function netvoxlab_suo_func ($atts, $content = null) {
		self::$add_script = true;
		
		$portal_id = get_option('netvoxlab_suo_portal_id');
		
		$wfm_sign = '
		<script language="javascript">
			var suo_portal_id = "'.$portal_id.'";
		</script>
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
		wp_register_style('eowp-style', NVX_EOWP_URL . 'assets/css/style.css?v=2017.02.06');
		wp_register_style('eowp-datepicker', NVX_EOWP_URL . 'assets/css/datepicker.css?v=2017.02.06');
		wp_register_script('eowp-script', NVX_EOWP_URL . 'assets/js/script.js?v=2017.02.06');
		wp_register_script('eowp-jquery', NVX_EOWP_URL . 'assets/js/jquery-3.1.1.min.js');
		wp_register_script('eowp-jqueryiu', NVX_EOWP_URL . 'assets/js/jquery-ui.min.js');
	}
	
	static function enqueue_myscripts() {
		if ( !self::$add_script ) return;
		wp_enqueue_style('eowp-style', NVX_EOWP_URL . 'assets/css/style.css?v=2017.02.06');
		wp_enqueue_style('eowp-datepicker', NVX_EOWP_URL . 'assets/css/datepicker.css?v=2017.02.06');
		wp_enqueue_script('eowp-script', NVX_EOWP_URL . 'assets/js/script.js?v=2017.02.06');
		wp_enqueue_script('eowp-jquery', NVX_EOWP_URL . 'assets/js/jquery-3.1.1.min.js');
		wp_enqueue_script('eowp-jqueryui', NVX_EOWP_URL . 'assets/js/jquery-ui.min.js');
	}

	static function netvoxlab_suo_install() {
		add_option('netvoxlab_suo_portal_id', '9b1bae07-3852-412f-b26f-c4b8b3bad5f1');
	}
	
	static function netvoxlab_suo_uninstall() {
		delete_option('netvoxlab_suo_portal_id');
	}
	
	static function netvoxlab_suo_add_admin_pages() {
		add_options_page('Электронная очередь', 'Электронная очередь', 8, 'netvoxlabsuoname', array(__CLASS__, 'netvoxlab_suo_options_page'));
	}

	static function netvoxlab_suo_options_page() {
		echo "<h3>Настройки плагина com.netvoxlab.suo</h3>";
		netvoxlab_suo_shortcode::netvoxlab_suo_change_id();
	}
	
	static function netvoxlab_suo_change_id() {
		if (isset($_POST['netvoxlab_suo_btn'])) {
			if ( function_exists('current_user_can') && 
				!current_user_can('manage_options') )
					die ( _e('Hacker?', 'suo') );

			if (function_exists ('check_admin_referer')) {
				check_admin_referer('netvoxlab_suo_setup_form');
			}

			$netvoxlab_suo_portal_id = $_POST['netvoxlab_suo_portal_id'];

			update_option('netvoxlab_suo_portal_id', $netvoxlab_suo_portal_id);
		}
		
		echo 
		"
			<form name='netvoxlab_suo_base_setup' method='post' action='".$_SERVER['PHP_SELF']."?page=netvoxlabsuoname&amp;updated=true'>
		";
		
		if (function_exists ('wp_nonce_field')) {
			wp_nonce_field('netvoxlab_suo_setup_form'); 
		}
		echo
		"
			<table>
				<tr>
					<td style='text-align:right;'>Идентификатор портала:</td>
					<td><input type='text' style='width:300px;' name='netvoxlab_suo_portal_id' value='".get_option('netvoxlab_suo_portal_id')."'/></td>
					<td style='color:#666666;'><i>* Some Information</i></td>
				</tr>
				<tr>
					<td style='text-align:left'>
						<input type='submit' name='netvoxlab_suo_btn' value='Сохранить' style='width:140px; height:25px'/>
					</td>
					<td>&nbsp;</td>
					<td>&nbsp;</td>
				</tr>
			</table>
		</form>
		";
	}
}

netvoxlab_suo_shortcode::init();
?>