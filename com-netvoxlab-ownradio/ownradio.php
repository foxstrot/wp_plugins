<?php
/*
Plugin Name: com.netvoxlab.ownradio
Description: Broadcast radio ownRadio. Listen to your favorite music only.
Version: 2017.04.25.4
Author: Ltd. NetVox Lab
Author URI: http://www.netvoxlab.ru/
License: GPLv3

com.netvoxlab.ownradio is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
any later version.
 
com.netvoxlab.ownradio is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.
 
You should have received a copy of the GNU General Public License
along with com.netvoxlab.ownradio. If not, see <http://www.gnu.org/licenses/>.
*/

define('NETVOXLAB_OWNRADIO_PLUGIN_VERSION', '2017.04.25.4');
define('NETVOXLAB_OWNRADIO_PLAYER_URL', plugin_dir_url( __FILE__ ));

	class netvoxlab_ownradio_player_shortcode {
		static $netvoxlab_ownradio_add_script;
					
		static function init () {
			add_shortcode('ownradio_player', array(__CLASS__, 'netvoxlab_ownradio_player_func'));
			add_shortcode('ownradio_GetUserDevices', array(__CLASS__, 'nvxOwnRadioGetUserDevices_shortcode'));
			add_shortcode('ownradio_GetUsersRating', array(__CLASS__, 'nvxOwnRadioGetUsersRating_shortcode'));
			add_shortcode('ownradio_GetLastTracks', array(__CLASS__, 'nvxOwnRadioGetLastTracks_shortcode'));
			add_shortcode('ownradio_GetTracksHistory', array(__CLASS__, 'nvxOwnRadioGetTracksHistoryByDevice_shortcode'));
			add_shortcode('ownradio_GetLastDevices', array(__CLASS__, 'nvxOwnRadioGetLastDevices_shortcode'));
			add_action('init', array(__CLASS__, 'netvoxlab_ownradio_register_myscript'));
			add_action( 'wp_footer', array(__CLASS__, 'netvoxlab_ownradio_enqueue_myscript' ));
			add_action('init', array(__CLASS__, 'adminmenu_settings_update'));				
		}
		
		static function adminmenu_settings_update(){
			$options = get_option('netvoxlab_ownradio_player_options');	
				if (is_array($options)){
					if (!array_key_exists("nvxownradiourl",$options) or $options["nvxownradiourl"] == "") {
						$options["nvxownradiourl"] = 'https://api.ownradio.ru/v4';				
						update_option('netvoxlab_ownradio_player_options', $options);
					}
				} else {
					update_option('netvoxlab_ownradio_player_options', 
					array(
						'nvxownradiourl' => 'https://api.ownradio.ru/v4',
						));
				}

			$netvoxlab_ownradio_player_server_url = 'https://api.ownradio.ru/v4'; //$options["nvxownradiourl"];
			
			$scriptWithVar = "
				<script type=\"text/javascript\">
					var nvxOwnRadioServerUrl = '".$netvoxlab_ownradio_player_server_url."';
					var browserInfo = '".getInfoBrowser()."';
				</script>";
				
				echo $scriptWithVar;
		}

	   static function netvoxlab_ownradio_player_func ($atts, $content = null)
		{
			self::$netvoxlab_ownradio_add_script = true; 
			$netvoxlab_ownradio_wfm_sign = '		
							<div class="ownRadioPlayer-min">
							<div class="ownRadioPlayer-play" id="radioPlay"></div>
							<div class="ownRadioPlayer-track">
								<div class="ownRadioPlayer-group" id="radioName"></div>
								<div class="ownProgress-bar" id="radioProgress"></div>
								<div class="ownRadioPlayer-name" id="radioGroup"></div>
								<div class="ownTrak-time" id="radioTime">
									<div class="ownTrak-time__progress">
										<span class="strin-time"></span>
									</div>
									<div class="ownTrak-time__all">
										<span class="strin-time"></span>
									</div>
								</div>
							</div>
							<div class="ownRadioPlayer-nextButton" id="radioNext"><div class="ownRadioPlayer-next"></div></div>
						</div>
					';

			return $content . $netvoxlab_ownradio_wfm_sign ;
		}
	
		static function netvoxlab_ownradio_register_myscript(){
			wp_register_script('netvoxlab-ownradio-script', NETVOXLAB_OWNRADIO_PLAYER_URL . 'assets/js/scripts.js', [], NETVOXLAB_OWNRADIO_PLUGIN_VERSION);
			wp_register_script('netvoxlab-ownradio-script', NETVOXLAB_OWNRADIO_PLAYER_URL . 'assets/js/statisticsScripts.js', [], NETVOXLAB_OWNRADIO_PLUGIN_VERSION);
			wp_register_style('netvoxlab-ownradio-style', NETVOXLAB_OWNRADIO_PLAYER_URL . 'assets/css/ownRadio.min.css', [], NETVOXLAB_OWNRADIO_PLUGIN_VERSION);
		}
		
		static function netvoxlab_ownradio_enqueue_myscript() {
			if ( !self::$netvoxlab_ownradio_add_script ) return;
			wp_enqueue_style('netvoxlab-ownradio-style', NETVOXLAB_OWNRADIO_PLAYER_URL . 'assets/css/ownRadio.min.css');
			wp_enqueue_script( 'netvoxlab-ownradio-script', NETVOXLAB_OWNRADIO_PLAYER_URL . 'assets/js/scripts.js' );
			wp_enqueue_script( 'netvoxlab-ownradio-script', NETVOXLAB_OWNRADIO_PLAYER_URL . 'assets/js/statisticsScripts.js' );
			
		}
	
	//функция возвращает все устройства пользователя
		static function nvxOwnRadioGetUserDevices_shortcode ($atts, $content = null) {
		self::$netvoxlab_ownradio_add_script = true;
		return $content . '<div id="nvxUserDevices" class="">
						<form name="nvxFormaGetUserDevices">
							<input type="button" onclick="return nvxGetUserDevices(nvxFormaGetUserDevices.userID.value);" value="Получить список всех устройств пользователя">
							<input type="text" title="Введите userID" name="userID" id="nvxTxtUserID" placeholder="Введите userID" required style="min-width: 280px;">

						</form>
						<div id="nvxOwnradioSQLGetRequests">
						</div>
					</div>';
		}
		
		//функция просмотра рейтинга пользователей по количеству своих треков и количеству полученных за последние сутки треков
		static function nvxOwnRadioGetUsersRating_shortcode ($atts, $content = null) {
		self::$netvoxlab_ownradio_add_script = true;
		return $content . '<div id="nvxUsersRating" class="">
						<input type="button" onclick="return nvxBtnUsersRating()" value="Получить рейтинг активности пользователей">
						<!--<input type="text" title="Введите количество выводимых записей (-1 для вывода всех)" name="countRows" id="nvxTxtCountRows" placeholder="Введите количество выводимых записей(-1 для вывода всех записей)" value = "-1" required>
						-->

						<div id="nvxOwnradioSQLGetRequests">
						</div>
					</div>';
		}
		
		//функция просмотра последних выданных устройству треков
		static function nvxOwnRadioGetLastTracks_shortcode ($atts, $content = null) {
		self::$netvoxlab_ownradio_add_script = true;
		return $content . '<div id="nvxLastDeviceTracks" class="">
						<form name="nvxFormaLastDeviceTracks">
						<input type="button" onclick="return nvxGetLastTracks(nvxFormaLastDeviceTracks.deviceId.value, nvxFormaLastDeviceTracks.countRows.value)" value="Получить последние выданные треки">
						<input type="text" title="Введите deviceId" name="deviceId" id="nvxTxtDeviceId" placeholder="Введите deviceId" required style="min-width: 280px;">
						<input type="text" title="Введите количество выводимых записей (-1 для вывода всех)" name="countRows" id="nvxTxtCountRows" placeholder="Введите количество выводимых записей(-1 для вывода всех записей)" value = "-1" required>

						</form>
						<div id="nvxOwnradioSQLGetRequests">
						</div>
					</div>';
		}
		
		
		//функция просмотра последних выданных устройству треков и истории их прослушивания
		static function nvxOwnRadioGetTracksHistoryByDevice_shortcode ($atts, $content = null) {
		self::$netvoxlab_ownradio_add_script = true;
		return $content . '<div id="nvxLastDeviceTracks" class="">
						<form name="nvxFormaTracksHistory">
						<input type="button" onclick="return nvxGetTracksHistory(nvxFormaTracksHistory.deviceId.value, nvxFormaTracksHistory.countRows.value)" value="Получить последние выданные треки">
						<input type="text" title="Введите deviceId" name="deviceId" id="nvxTxtDeviceId" placeholder="Введите deviceId" required style="min-width: 280px;">
						<input type="text" title="Введите количество выводимых записей (-1 для вывода всех)" name="countRows" id="nvxTxtCountRows" placeholder="Введите количество выводимых записей(-1 для вывода всех записей)" value = "-1" required>
						</form>
						<div id="nvxOwnradioSQLGetRequests">
						</div>
					</div>';
		}
		
		
		//функция возвращает последние активные устройства
		static function nvxOwnRadioGetLastDevices_shortcode ($atts, $content = null) {
		self::$netvoxlab_ownradio_add_script = true;
		return $content . '<div id="nvxGetLastDevices" class="">
						<form name="nvxFormaLastDevices">
						<input type="button" onclick="return nvxBtnLastDevice()" value="Просмотреть последние активные устройства">
						</form>
						<div id="nvxOwnradioSQLGetRequests">
						</div>
					</div>';
		}
    }
	
	function getInfoBrowser(){
		$agent = $_SERVER['HTTP_USER_AGENT'];
		preg_match("/(Edge|Opera|Firefox|Chrome|Version)(?:\/| )([0-9.]+)/", $agent, $bInfo);
		$browserInfo = array();
		if(strpos($agent, 'Edge')) {
			$browserInfo['name'] = 'MS Edge';
			$browserInfo['version'] = substr($agent, strpos($agent, 'Edge')+5, 7);
		}
		else {
			$browserInfo['name'] = ($bInfo[1]=="Version") ? "Safari" : $bInfo[1];
			$browserInfo['version'] = $bInfo[2];
		}
		return $browserInfo['name']. " v." . $browserInfo['version'];
	}
	
	// netvoxlab_ownradio_player_shortcode::init();
	
		if (is_admin()){
			//Добавляем меню в админку
			// include_once('nvxownradioadminmenu.php');
		} else {
			// include_once('nvxOwnradioShotcodes.php');
			netvoxlab_ownradio_player_shortcode::init();
			// nvxOwnradioShotcodes::init();
		}
		
		
?>