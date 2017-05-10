<?php
/*
Plugin Name: com.netvoxlab.ownradio
Description: Broadcast radio ownRadio. Listen to your favorite music only.
Version: 2017.02.18
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

define('NETVOXLAB_OWNRADIO_PLUGIN_VERSION', '2017.02.18');
define('NETVOXLAB_OWNRADIO_PLAYER_URL', plugin_dir_url( __FILE__ ));

	class netvoxlab_ownradio_player_shortcode {
		static $netvoxlab_ownradio_add_script;
					
		static function init () {
			add_shortcode('ownradio_player', array(__CLASS__, 'netvoxlab_ownradio_player_func'));
			add_action('init', array(__CLASS__, 'netvoxlab_ownradio_register_myscript'));
			add_action( 'wp_footer', array(__CLASS__, 'netvoxlab_ownradio_enqueue_myscript' ));
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
			wp_register_style('netvoxlab-ownradio-style', NETVOXLAB_OWNRADIO_PLAYER_URL . 'assets/css/ownRadio.min.css', [], NETVOXLAB_OWNRADIO_PLUGIN_VERSION);
		}
		
		static function netvoxlab_ownradio_enqueue_myscript() {
			if ( !self::$netvoxlab_ownradio_add_script ) return;
			wp_enqueue_style('netvoxlab-ownradio-style', NETVOXLAB_OWNRADIO_PLAYER_URL . 'assets/css/ownRadio.min.css');
			wp_enqueue_script( 'netvoxlab-ownradio-script', NETVOXLAB_OWNRADIO_PLAYER_URL . 'assets/js/scripts.js' );
			
		}
	
	}
	netvoxlab_ownradio_player_shortcode::init();

?>