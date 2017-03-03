<?php
/* 
Plugin Name: com.netvoxlab.hideAdminBar
Description: hide/show admin bar for different roles of users
Version: 2017.02.17
Author: Ltd. NetVox Lab
Author URI: http://www.netvoxlab.ru/
License: GPLv3
*/

/* ==========================================================================
 * hide/show admin bar for different roles of users
 * ========================================================================== */
add_action('init', 'nvx_hide_admin_bar');
if ( ! function_exists( 'nvx_hide_admin_bar' ) ) :
	function nvx_hide_admin_bar() {
		if (current_user_can('editor') || current_user_can('author') || current_user_can('administrator') || is_admin()) {
			add_filter('show_admin_bar', '__return_true'); // включить
		} else {
			add_filter('show_admin_bar', '__return_false'); // отключить
		}
	}
endif;
/* ========================================================================== */
?>