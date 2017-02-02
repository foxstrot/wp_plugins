<?php
/*
Plugin Name: com.netvoxlab.ownradio
Description: Broadcast radio ownRadio. Listen to your favorite music only.
Version: 2017.02.02
Author: Ltd. NetVox Lab
Author URI: http://www.netvoxlab.ru/
*/

define('OWNRADIO_PLUGIN_VERSION', '2017.02.02');
define('OWNRADIO_PLAYER_URL', plugin_dir_url( __FILE__ ));

	class ownradio_player_shortcode {
		static $add_script;
					
		static function init () {
			add_shortcode('ownradio_player', array(__CLASS__, 'ownradio_player_func'));
			add_action('init', array(__CLASS__, 'register_myscript'));
			add_action( 'wp_footer', array(__CLASS__, 'enqueue_myscripts' ));
		}
	
	   static function ownradio_player_func ($atts, $content = null)
		{
			self::$add_script = true; 
			$wfm_sign = '
				<div class="ownRadio">
					<div class="ownRadioPlayer">
						<div class="ownRadioPlayer-wrap"><div class="ownRadioPlayer-phone">
							<div class="ownRadioPlayer-track">
								<div class="ownRadioPlayer-name" id="radioGroup"></div>
								<div class="ownRadioPlayer-group" id="radioName"></div>
							</div>
							<div class="ownRadioPlayer-play" id="radioPlay"></div>
							<div class="ownRadioPlayer-nextButton" id="radioNext"><div class="ownRadioPlayer-next"></div></div>
						</div></div>
						</div>
					</div>
					 
					';

			return $content . $wfm_sign ;
		}
	
		static function register_myscript(){
			wp_register_script('ownradio-script', OWNRADIO_PLAYER_URL . 'assets/js/scripts.js', [], OWNRADIO_PLUGIN_VERSION);
			wp_register_style('ownradio-style', OWNRADIO_PLAYER_URL . 'assets/css/ownRadio.css', [], OWNRADIO_PLUGIN_VERSION);
		}
		
		static function enqueue_myscripts() {
			if ( !self::$add_script ) return;
			wp_enqueue_style('ownradio-style', OWNRADIO_PLAYER_URL . 'assets/css/ownRadio.css');
			wp_enqueue_script( 'ownradio-script', OWNRADIO_PLAYER_URL . 'assets/js/scripts.js' );
			
		}
	
	}
	ownradio_player_shortcode::init();
?>