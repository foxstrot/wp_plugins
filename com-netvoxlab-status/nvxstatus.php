<?php
/*
Plugin Name: com.netvoxlab.status
Description: Модуль фейкового просмотра статуса заявки. Shortcode [netvoxlab_check_status]
Version: 2017.02.22
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

define('NETVOXLAB_CHECK_STATUS_PLUGIN_VERSION', '2017.02.22');
$GLOBALS['NETVOXLAB_CHECK_STATUS_URL'] = plugin_dir_url( __FILE__ );

	class netvoxlab_check_status_shortcode {
		static $netvoxlab_check_status_add_script;
					
		static function init () {
			add_shortcode('netvoxlab_check_status', array(__CLASS__, 'netvoxlab_check_status_func'));
			add_action('init', array(__CLASS__, 'netvoxlab_check_status_register_myscript'));
			add_action( 'wp_footer', array(__CLASS__, 'netvoxlab_check_status_enqueue_myscript' ));
		}
	
	   static function netvoxlab_check_status_func ($atts, $content = null)
		{
			self::$netvoxlab_check_status_add_script = true; 
			
			$scriptWithVar = "
				<script type=\"text/javascript\">
					var NETVOXLAB_URL = '". $GLOBALS['NETVOXLAB_CHECK_STATUS_URL']."';
				</script>";

			$netvoxlab_check_status_wfm_sign = '
				<div id="nvxStatus" class="">
					<div  class="nvxCheckStatus">
						<input type="text" value="" placeholder="Введите номер заявления" name="s" class="nvxCheckStatusForm" keyup="return fieldIsFilled()" id="nvxNumber"/>
						<input type="button" id="checkStatusBtn"  onclick="return nvxCheckStatus()" class="nvxCheckStatusBtn" value="Узнать статус" disabled>
							
						
					</div>
					<img class="nvxStatusImg center" src=" ' . $GLOBALS['NETVOXLAB_CHECK_STATUS_URL'] . 'assets/img/img1.jpg" />	
				</div>
				
					';

			return $content . $scriptWithVar . $netvoxlab_check_status_wfm_sign ;
		}
	
		static function netvoxlab_check_status_register_myscript(){
			wp_register_script('netvoxlab-check-status-script', $GLOBALS['NETVOXLAB_CHECK_STATUS_URL'] . 'assets/js/scripts.js', [], NETVOXLAB_CHECK_STATUS_PLUGIN_VERSION);
			wp_register_style('netvoxlab-check-status-style', $GLOBALS['NETVOXLAB_CHECK_STATUS_URL'] . 'assets/css/styles.css', [], NETVOXLAB_CHECK_STATUS_PLUGIN_VERSION);
		}
		
		static function netvoxlab_check_status_enqueue_myscript() {
			if ( !self::$netvoxlab_check_status_add_script ) return;
			wp_enqueue_style('netvoxlab-check-status-style', $GLOBALS['NETVOXLAB_CHECK_STATUS_URL'] . 'assets/css/styles.css');
			wp_enqueue_script( 'netvoxlab-check-status-script', $GLOBALS['NETVOXLAB_CHECK_STATUS_URL'] . 'assets/js/scripts.js' );
			
		}
	
	}
	netvoxlab_check_status_shortcode::init();
?>