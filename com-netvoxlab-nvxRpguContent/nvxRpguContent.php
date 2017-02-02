<?php
	/*
	Plugin Name: com.netvoxlab.nvxRpguContent
	Plugin URI: 
	Description: nvx RPGU content for you pages
	Version: 0.1.34
	Author: Ltd. NetVox Lab
	Author URI: http://www.netvoxlab.ru/
	*/
	
	define('nvxRpguContentUri', plugin_dir_url( __FILE__ ));

	//Импортируем библиотеки и бандл скриптов функционала
	function regBundleAndLibs(){
		
		$options = get_option('nvxrpgucontentoptions');		
		if (is_array($options)){
			echo "<script type='text/javascript'>
				window.nvxCommonPath = {
					departmentView: '".$options['departmentView']."',
					mfcCommonView: '".$options['mfcCommonView']."',
					mfcView: '".$options['mfcView']."',
					mfcTospView: '".$options['mfcTospView']."',
					serviceView: '".$options['serviceView']."',
					categoryView: '".$options['categoryView']."',
					situationView: '".$options['situationView']."',
					catalogView: '".$options['catalogView']."',
					formView: '".$options['formView']."',
					infoView: '".$options['infoView']."',
					attachmentView: '".$options['attachmentView']."',
					cabinetReceptionList: '".$options['cabinetReceptionList']."',
					treatmentCreateView: '".$options['treatmentCreateView']."',
					searchView: '".$options['searchView']."',
					payView: '".$options['payView']."',
					rdcurl: '".$options['rdcurl']."',
					authPortalPath: '".$options['rdcurl']."',
					authRedirectPath: '".nvxRpguContentUri."authRequest.php',
					fileProxyPath: '".nvxRpguContentUri."proxy4file.php',
					proxyPath: '".nvxRpguContentUri."proxy.php',
					pluginScriptPath: '".nvxRpguContentUri."Portal/'
					};</script>";
		}
		
		wp_register_script('requireJs', nvxRpguContentUri . 'Portal/script/requirejs/require.min.js', [], false, true);
		wp_enqueue_script('requireJs', nvxRpguContentUri . 'Portal/script/requirejs/require.min.js' );
		
		wp_register_script('requireJsConfig', nvxRpguContentUri . 'Portal/script/requirejs-config.js', [], false, true);
		wp_enqueue_script('requireJsConfig', nvxRpguContentUri . 'Portal/script/requirejs-config.js' );
		
		wp_register_script('partsBundle', nvxRpguContentUri . 'Parts/Script/parts.bundle.js', [], false, true);
		wp_enqueue_script('partsBundle', nvxRpguContentUri . 'Parts/Script/parts.bundle.js' );
	}

	//Импортируем бандл с вьхами
	function nvxRpguContentAdminFooterText($content) {
		include_once('wp-content/plugins/nvxRpguContent/Parts/View/commonHtml.html');
		return $content;
	}
	
	function templateRedirectFunction() {
		add_action( 'wp_enqueue_scripts', 'regBundleAndLibs' );
	}

	if (is_admin()){
		//Добавляем меню в админку
		include_once('nvxrpgucontentadminmenu.php');
	} else {
		//Импорт бандла с вьхами происходит на каждой странице с постом
		add_filter('the_content', 'nvxRpguContentAdminFooterText');	
		add_action('template_redirect', 'templateRedirectFunction');
		//Регистрируем шорткоды
		include_once('nvxShortcodes.php');
	}	
?>