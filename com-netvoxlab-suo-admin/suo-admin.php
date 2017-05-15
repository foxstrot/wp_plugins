<?php
/*
Plugin Name: com.netvoxlab.suo.admin
Description: Модуль администрирования записи в ЭО для WP
Version: 2017.05.15
Author: Ltd. Netvox Lab
Author URI: http://www.netvoxlab.ru/
*/
define('NVX_EOWP_DIR', plugin_dir_path(__FILE__));
define('NVX_EOWP_URL', plugin_dir_url(__FILE__));
define('NVX_SUO_ADMIN_DIR', plugin_dir_path(__FILE__));
define('NVX_SUO_ADMIN_URL', plugin_dir_url(__FILE__));

class netvoxlab_suo_admin_shortcode {
	
	static $add_script;
				
	static function init () {
		add_shortcode('netvoxlab_suo_admin', array(__CLASS__, 'netvoxlab_suo_admin_func'));
		add_action('init', array(__CLASS__, 'register_myscript'));
		add_action('wp_footer', array(__CLASS__, 'enqueue_myscripts'));
		
		register_activation_hook( __FILE__, array(__CLASS__, 'netvoxlab_suo_admin_install'));
		register_deactivation_hook( __FILE__, array(__CLASS__, 'netvoxlab_suo_admin_uninstall'));
	}
	
	static function netvoxlab_suo_admin_func ($atts, $content = null) {
		self::$add_script = true;
		
		$wfm_sign = '';
		$user_id = get_current_user_id();
		$app_id = get_option('netvoxlab_suo_app_id');
		$region_id = get_option('netvoxlab_suo_region_id');
		$suo_host = get_option('netvoxlab_suo_host');

		if($user_id <= 0) {
			$wfm_sign = '<p>Страница доступна только авторизованным пользователям!</p>';
		} else {
			$key = "esia_user_token";
			$single = true;
			$meta = get_user_meta($user_id, $key, $single);

			$args = array(
			    'httpversion' => '1.0',
			    'blocking'    => true,
			    'headers'     => array(
			    	'user_token' => 'esia@'.$meta,
			    	'app_id' => '9b1bae07-3852-412f-b26f-c4b8b3bad5f1'
			    )
			);

			$url = "http://sqtest.egspace.ru/v1/authorization/userinfo";

			$response = wp_remote_get($url, $args); 
			$body = "";

			if(is_array($response)) {
				$header = $response['headers'];
				$body = $response['body'];
			};

			$wfm_sign = '
				<script language="javascript">
					SuoSettings = {};
					
					SuoSettings.app_id = "'.$app_id.'";
					SuoSettings.region_id = "'.$region_id.'";
					SuoSettings.host = "'.$suo_host.'";

					var suo_user_token =  "'.$meta.'";
					console.log(suo_user_token);
					var suo_user_token_response = '.$body.';
					console.log(suo_user_token_response);
					console.log(suo_user_token_response.recId);
					SuoSettings.user_token = suo_user_token_response;
				</script>

				<div class="nvx-suo-admin"></div>
			';
		}

		return $content . $wfm_sign ;
	}
	
	static function register_myscript() {
		wp_register_style('suo-admin-style', NVX_SUO_ADMIN_URL . 'assets/css/admin.css?v=2017.03.24');
		wp_register_style('suo-admin-datepicker', NVX_SUO_ADMIN_URL . 'assets/css/datepicker.css?v=2017.03.24');
		wp_register_style('suo-admin-suggestions-style', 'https://cdn.jsdelivr.net/jquery.suggestions/16.10/css/suggestions.css');
		wp_register_script('suo-admin-jquery', 'https://cdnjs.cloudflare.com/ajax/libs/jquery/1.10.2/jquery.min.js');
		wp_register_script('suo-admin-suggestions', 'https://cdn.jsdelivr.net/jquery.suggestions/16.10/js/jquery.suggestions.min.js');
		wp_register_script('suo-admin-icons', 'https://use.fontawesome.com/ad94e67e3b.js');
		wp_register_script('suo-admin-script', NVX_SUO_ADMIN_URL . 'assets/js/admin.js?v=2017.03.24');
		wp_register_script('suo-admin-jqueryui', NVX_SUO_ADMIN_URL . 'assets/js/jquery-ui.min.js?v=2017.03.24');
	}
	
	static function enqueue_myscripts() {
		if ( !self::$add_script ) return;
		wp_enqueue_style('suo-admin-style', NVX_SUO_ADMIN_URL . 'assets/css/admin.css?v=2017.03.24');
		wp_enqueue_style('suo-admin-datepicker', NVX_SUO_ADMIN_URL . 'assets/css/datepicker.css?v=2017.03.24');
		wp_enqueue_style('suo-admin-suggestions-style', 'https://cdn.jsdelivr.net/jquery.suggestions/16.10/css/suggestions.css');
		wp_enqueue_script('suo-admin-jquery', 'https://cdnjs.cloudflare.com/ajax/libs/jquery/1.10.2/jquery.min.js');
		wp_enqueue_script('suo-admin-suggestions', 'https://cdn.jsdelivr.net/jquery.suggestions/16.10/js/jquery.suggestions.min.js');
		wp_enqueue_script('suo-admin-icons', 'https://use.fontawesome.com/ad94e67e3b.js');
		wp_enqueue_script('suo-admin-script', NVX_SUO_ADMIN_URL . 'assets/js/admin.js?v=2017.03.24');
		wp_enqueue_script('suo-admin-jqueryui', NVX_SUO_ADMIN_URL . 'assets/js/jquery-ui.min.js?v=2017.03.24');
	}

	static function netvoxlab_suo_admin_install() {
	}
	
	static function netvoxlab_suo_admin_uninstall() {
	}
}

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
		
		$app_id = get_option('netvoxlab_suo_app_id');
		$region_id = get_option('netvoxlab_suo_region_id');
		$suo_host = get_option('netvoxlab_suo_host');
		
		$wfm_sign = '
		<script language="javascript">
			var suo_app_id = "'.$app_id.'";
			var suo_region_id = "'.$region_id.'";

			SuoSettings = {};
			SuoSettings.app_id = "'.$app_id.'";
			SuoSettings.region_id = "'.$region_id.'";
			SuoSettings.host = "'.$suo_host.'";
		</script>
		<div id="suo">
			<div class="suo-header">
				<h2>Предварительная запись через Интернет</h2>
			</div>
			<div class="suo-form">
				<label>Выберите МФЦ*:</label>
				<select id="suoOrg">
				</select>
				<label>Выберите дату приема*:</label>
				<div id="datepicker"></div>
				<label>Выберите время приема*:</label>
				<table id="suoTimepicker">
				</table>
				<label>Введите ФИО*: (Необходимо для приема у оператора)</label>
				<input type="text" id="suoName" placeholder="Фамилия Имя Отчество" required>
				<label>Номер телефона: (Необходимо для уведомлений о изменениях в графике работы)</label>
				<input type="text" id="suoTel" placeholder="8-987-654-32-10">
				<label>Введите Email: (Мы вышлем вам талон предварительной записи на почту)</label>
				<input type="email" id="suoEmail" placeholder="example@mail.com">
				<label>Сохраните ваш талон на мобильном устройстве либо распечатайте его</label>
				<div class="suo-footer">
					<input type="button" id="suoSend" value="Записаться" disabled/>
				</div>
			</div>
		</div>
		';
		return $content . $wfm_sign ;
	}
	
	static function register_myscript() {
		wp_register_style('eowp-style', NVX_EOWP_URL . 'assets/css/suo.css?v=2017.04.10');
		wp_register_script('eowp-jquery', 'https://cdnjs.cloudflare.com/ajax/libs/jquery/1.10.2/jquery.min.js');
		wp_register_script('eowp-jqueryiu', NVX_EOWP_URL . 'assets/js/jquery-ui.min.js');
		wp_register_script('eowp-admin', NVX_EOWP_URL . 'assets/js/suo.js?v=2017.04.10');
	}
	
	static function enqueue_myscripts() {
		if ( !self::$add_script ) return;
		wp_enqueue_style('eowp-style', NVX_EOWP_URL . 'assets/css/suo.css?v=2017.04.10');
		wp_enqueue_script('eowp-jquery', 'https://cdnjs.cloudflare.com/ajax/libs/jquery/1.10.2/jquery.min.js');
		wp_enqueue_script('eowp-jqueryui', NVX_EOWP_URL . 'assets/js/jquery-ui.min.js');
		wp_enqueue_script('eowp-admin', NVX_EOWP_URL . 'assets/js/suo.js?v=2017.04.10');
	}

	static function netvoxlab_suo_install() {
		add_option('netvoxlab_suo_app_id', '9b1bae07-3852-412f-b26f-c4b8b3bad5f1');
		add_option('netvoxlab_suo_region_id', '55e8da0b-afbf-4110-a1a8-bf06e7dde2d4');
		add_option('netvoxlab_suo_host', 'http://sqtest.egspace.ru/');
	}
	
	static function netvoxlab_suo_uninstall() {
		delete_option('netvoxlab_suo_app_id');
		delete_option('netvoxlab_suo_region_id');
		delete_option('netvoxlab_suo_host');
	}
	
	static function netvoxlab_suo_add_admin_pages() {
		add_options_page('Электронная очередь', 'Электронная очередь', 'edit_pages', 'netvoxlabsuoname', array(__CLASS__, 'netvoxlab_suo_options_page'));
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

			$netvoxlab_suo_app_id = $_POST['netvoxlab_suo_app_id'];
			$netvoxlab_suo_region_id = $_POST['netvoxlab_suo_region_id'];
			$netvoxlab_suo_host = $_POST['netvoxlab_suo_host'];

			update_option('netvoxlab_suo_app_id', $netvoxlab_suo_app_id);
			update_option('netvoxlab_suo_region_id', $netvoxlab_suo_region_id);
			update_option('netvoxlab_suo_host', $netvoxlab_suo_host);
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
					<td style='text-align:right;'>Хост:</td>
					<td><input type='text' style='width:300px;' name='netvoxlab_suo_host' value='".get_option('netvoxlab_suo_host')."'/></td>
					<td style='color:#666666;'><i>* service api</i></td>
				</tr>
				<tr>
					<td style='text-align:right;'>Идентификатор портала:</td>
					<td><input type='text' style='width:300px;' name='netvoxlab_suo_app_id' value='".get_option('netvoxlab_suo_app_id')."'/></td>
					<td style='color:#666666;'><i>* app_id</i></td>
				</tr>
				<tr>
					<td style='text-align:right;'>Идентификатор региона:</td>
					<td><input type='text' style='width:300px;' name='netvoxlab_suo_region_id' value='".get_option('netvoxlab_suo_region_id')."'/></td>
					<td style='color:#666666;'><i>* region_id</i></td>
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

class netvoxlab_suo_operator_shortcode {
	
	static $add_script;
				
	static function init () {
		add_shortcode('netvoxlab_suo_operator', array(__CLASS__, 'netvoxlab_suo_operator_func'));
		add_action('init', array(__CLASS__, 'register_myscript'));
		add_action('wp_footer', array(__CLASS__, 'enqueue_myscripts'));
		
		register_activation_hook( __FILE__, array(__CLASS__, 'netvoxlab_suo_install'));
		register_deactivation_hook( __FILE__, array(__CLASS__, 'netvoxlab_suo_uninstall'));
	}
	
	static function netvoxlab_suo_operator_func ($atts, $content = null) {
		self::$add_script = true;
		
		$app_id = get_option('netvoxlab_suo_app_id');
		$region_id = get_option('netvoxlab_suo_region_id');
		$suo_host = get_option('netvoxlab_suo_host');
		
		$wfm_sign = '
		<script language="javascript">
			var suo_app_id = "'.$app_id.'";
			var suo_region_id = "'.$region_id.'";

			SuoSettings = {};
			SuoSettings.app_id = "'.$app_id.'";
			SuoSettings.region_id = "'.$region_id.'";
			SuoSettings.host = "'.$suo_host.'";
		</script>
		<div id="suo">
			<div class="suo-header">
				<h2>Оператор</h2>
			</div>
			<div class="suo-form">
				<label>Выберите МФЦ*:</label>
				<select id="suoOrg">
				</select>
				<label>Выберите дату*:</label>
				<div id="datepicker"></div>
				<label>Выберите время приема*:</label>
				<table id="suoTimepicker">
				</table>
				<label>Информация о записи:</label>
				<div class="suo-operator-info"></div>
			</div>
		</div>
		';
		return $content . $wfm_sign ;
	}
	
	static function register_myscript() {
		wp_register_style('eowp-style', NVX_EOWP_URL . 'assets/css/suo.css?v=2017.03.24');
		wp_register_script('eowp-jquery', 'https://cdnjs.cloudflare.com/ajax/libs/jquery/1.10.2/jquery.min.js');
		wp_register_script('eowp-jqueryiu', NVX_EOWP_URL . 'assets/js/jquery-ui.min.js');
		wp_register_script('suo-oper', NVX_EOWP_URL . 'assets/js/operator.js?v=2017.03.24');
	}
	
	static function enqueue_myscripts() {
		if ( !self::$add_script ) return;
		wp_enqueue_style('eowp-style', NVX_EOWP_URL . 'assets/css/suo.css?v=2017.03.24');
		wp_enqueue_script('eowp-jquery', 'https://cdnjs.cloudflare.com/ajax/libs/jquery/1.10.2/jquery.min.js');
		wp_enqueue_script('eowp-jqueryui', NVX_EOWP_URL . 'assets/js/jquery-ui.min.js');
		wp_enqueue_script('suo-oper', NVX_EOWP_URL . 'assets/js/operator.js?v=2017.03.24');
	}

	static function netvoxlab_suo_install() {
	}
	
	static function netvoxlab_suo_uninstall() {
	}
}

netvoxlab_suo_shortcode::init();
netvoxlab_suo_admin_shortcode::init();
netvoxlab_suo_operator_shortcode::init();
?>