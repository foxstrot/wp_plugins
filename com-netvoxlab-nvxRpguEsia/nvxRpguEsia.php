<?php
	/*
	Plugin Name: com.netvoxlab.nvxRpguEsia
	Plugin URI: 
	Description: nvx ESIA widget for you pages
	Version: 0.1.34
	Author: Ltd. NetVox Lab
	Author URI: http://www.netvoxlab.ru/
	*/
	if (!defined('ABSPATH')) {
		exit;
	}
	
	define('nvxRpguEsiaUri', plugin_dir_url( __FILE__ ));
	$GLOBALS['nvxRpguEsiaUriPluginDir'] = plugin_dir_path( __FILE__ );
	$GLOBALS['nvxRpguEsiaUriPluginUri'] = plugin_dir_url( __FILE__ );
	$GLOBALS['nvxRpguEsiaUriSite'] = get_current_site();
	
	require_once $GLOBALS['nvxRpguEsiaUriPluginDir'].'nvxesiaadminmenu.php';
	
	class NvxRpguEsiaPlugin extends WP_Widget {

		public function __construct() {
			//Вызов родительского конструктора с: идентификатор виджета, название виджета (это имя будет показано на странице виджетов) и массив с другими деталями виджета (нужно только «description»)
			parent::__construct("com_netvoxlab_nvxRpguEsia", "Авторизация через ЕСИА", array("description" => "Виджет для авторизации через ЕСИА"));
			
			if ( is_active_widget( false, false, $this->id_base ) || is_customize_preview() ) {
				//todo сделать опционально из конфигов
				//add_action('login_form_login', array($this, 'redirect_to_custom_login'));
				add_action('template_redirect', array($this, 'addWindowScript'));
				$this->createUsersTable();
			}
		}

		static function registerWidget(){
			if (doing_Action('widgets_init'))
				register_Widget(__CLASS__);
			else
				add_Action('widgets_init', Array(__CLASS__, __FUNCTION__));
		}

		//Дефолтные конфиги
		function getDefaultOptions(){    
			return Array(
				'nvxEsiaTitle' => 'Вход через ЕСИА',
				'nvxCabinetLinkEnabled' => false,
				'nvxCabinetPage' => '/cabinet'
			);
		}

		function loadOptions(&$options){
			setType($options, 'ARRAY');
			$options = Array_Filter($options);
			$options = Array_Merge($this->getDefaultOptions(), $options);
			setType($options, 'OBJECT');
		}

		//выводит форму для настройки виджета
		function Form($options){
			$this->loadOptions($options);
			$linkEnabled = $options->nvxCabinetLinkEnabled ? 'checked="checked"' : '';
			?>
			<p>
				<label for="<?php echo $this->get_Field_Id('nvxEsiaTitle') ?>">Наименование раздела авторизации на сайте</label>
				<input type="text" id="<?php echo $this->get_Field_Id('nvxEsiaTitle') ?>" name="<?php echo $this->get_Field_Name('nvxEsiaTitle')?>" value="<?php echo esc_Attr($options->nvxEsiaTitle) ?>" class="widefat">
			</p>
			<p>
				<input type="checkbox" id="<?php echo $this->get_Field_Id('nvxCabinetLinkEnabled') ?>" name="<?php echo $this->get_Field_Name('nvxCabinetLinkEnabled')?>" <?php echo $linkEnabled; ?>" class="widefat"
				onclick=" {
					if (document.getElementById('<?php echo $this->get_Field_Id('nvxCabinetLinkEnabled') ?>').checked != false)
						document.getElementById('field-<?php echo $this->get_Field_Id('nvxCabinetPage') ?>').style.display = 'block';
					else
						document.getElementById('field-<?php echo $this->get_Field_Id('nvxCabinetPage') ?>').style.display = 'none'; }">
				<label for="<?php echo $this->get_Field_Id('nvxCabinetLinkEnabled') ?>">Отображать ссылку на личный кабинет</label>
			</p>
			<p id="field-<?php echo $this->get_Field_Id('nvxCabinetPage') ?>"
			<?php if ($options->nvxCabinetLinkEnabled) {}
				else { 
					echo " style='display: none;' ";
				} ?>>
				<label for="<?php echo $this->get_Field_Id('nvxCabinetPage') ?>">Адрес страницы кабинета для перенаправления</label>
				<input type="text" id="<?php echo $this->get_Field_Id('nvxCabinetPage') ?>" name="<?php echo $this->get_Field_Name('nvxCabinetPage')?>" value="<?php echo esc_Attr($options->nvxCabinetPage) ?>" class="widefat">
			</p>
			<script type="text/javascript">
			</script>
			<?php
		}

		//отображение виджета на сайте
		function Widget($widget, $options){
			setType($widget, 'OBJECT');
			$this->loadOptions($options);
			$title = $options->nvxEsiaTitle;
			if (!isset($title))
				$title = 'Вход через ЕСИА';
			echo "<li class='widget'><p class='wtitle'>".$title."</p>";
			if (is_user_logged_in()){
				//Пользователь уже авторизован
				$current_user = wp_get_current_user();
				$username = $current_user->display_name;
				$http = 'http://';
				if(isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] == 'on')
					$http = 'https://';
				$server_redirect = $http.$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'];
				$url_redirect = esc_url(wp_logout_url($server_redirect));
				echo "<p>Вы вошли как <b>";
				if ($options->nvxCabinetLinkEnabled) {
					echo "<a href='".$options->nvxCabinetPage."'>".$username."</a>";					
				} else {
					echo $username;
				}				
				echo "</b><br><a href='".$url_redirect."'>Выйти</a></p>";
			} else {
				//Кнопка для авторизации
				echo "<a href='".nvxRpguEsiaUri."authRequest.php'>Войти</a>";
			}
			echo "</li>";
		}
	
		//Создание таблицы со связью пользователей, если ещё не было
		function createUsersTable() {
			require_once( ABSPATH . 'wp-load.php' );
			global $wpdb;
			$createEsiaUsersSql = "CREATE TABLE IF NOT EXISTS ".$wpdb->prefix."nvx_wp_esia_users (
				wpid bigint(20) UNSIGNED NOT NULL,
				esiaid bigint(20) UNSIGNED NOT NULL,        
				PRIMARY KEY (wpid));
			  ";
			require_once ABSPATH . 'wp-admin/includes/upgrade.php';
			dbDelta($createEsiaUsersSql);
		}
		
		//Направление пользователя на собственную страницу аутентификации вместо wp-login.php
		function redirect_to_custom_login() {
			//todo здесь должно быть формирование url для перехода со стороны ЕСИА			
			if ( is_user_logged_in() ) {
				//Переадресовать в личный кабинет
				wp_redirect('/cabinet/');
				//$this->redirect_logged_in_user( $redirect_to );
				exit;
			}

			require_once("EsiaClient.php");
			require_once("exceptions/BaseException.php");
			require_once("exceptions/SignFailException.php");
			try {
				$options = get_option('nvxesiapluginoptions');
				$config = array(
					'rdcUrl' => $options['rdcurl'].'esia/oauth/authexternalcallback',
					'clientId' => $options['esiaClientId'],
					'redirectUrl' => $GLOBALS['nvxRpguEsiaUriPluginUri'].'response.php',
					'portalUrl' => $options['esiaEndpoint'],
					'privateKeyPath' => 'key.pem',
					'privateKeyPassword' => $options['privateKeyPassword'],
					'certPath' => 'key.cer',
					'tmpPath' => 'tmp'
				);
				$esia = new \esia\EsiaClient($config);
				$url = $esia->getUrl();
				header('Location: '.$url);
				//wp_redirect($url);
			} catch( Exception $e) {
				http_response_code(403) and exit('Ошибка: '.$e->getMessage());
			}
		}
		
		//Добавление объекта в window для использования при редиректе запросов на прокси
		function addWindowScript() {
			$options = get_option('nvxesiapluginoptions');
			echo "<script type='text/javascript'>
				window.nvxRpguEsia = {
					fileProxyPath: '".nvxRpguEsiaUri."proxy4file.php',
					proxyPath: '".nvxRpguEsiaUri."proxy.php',
					rdcurl: '".$options['rdcurl']."',
				};</script>";
		}
	}

	NvxRpguEsiaPlugin::registerWidget();
	require_once 'nvxesiaadminmenu.php';
	
	function nvx_esia_additional_mime_types( $mimes ) {
		$mimes['pem'] = 'application/octet-stream';
		$mimes['cer'] = 'application/octet-stream';
		return $mimes;
	}
	add_filter( 'upload_mimes', 'nvx_esia_additional_mime_types' );
?>