<?php
	/*
	Plugin Name: com.netvoxlab.nvxRpguContent
	Plugin URI: 
	Description: nvx RPGU content for you pages
	Version: v2017.04.19
	Author: Ltd. NetVox Lab
	Author URI: http://www.netvoxlab.ru/
	*/
	
	define('nvxRpguContentVer', 'v2017.04.19');
	define('nvxRpguContentUri', plugin_dir_url( __FILE__ ));	
	$GLOBALS['nvxRpguContentUriPluginDir'] = plugin_dir_path( __FILE__ );

	//Импортируем библиотеки и бандл скриптов функционала
	function regBundleAndLibs(){		
		$options = get_option('nvxrpgucontentoptions');		
		if (is_array($options)){
		//Всё норм
			if (!array_key_exists("esbRvUrl",$options)) {
				$options["esbRvUrl"] = null;				
				update_option('nvxrpgucontentoptions', $options);
			}
		} else {
			update_option('nvxrpgucontentoptions', 
			array(
				'rdcurl' => null,
				'esbRvUrl' => 'http://esbtest.egspace.ru:8080/RequestViewer',
				'departmentView' => '/department/?departmentId=',
				'mfcCommonView' => '/mfc/',
				'mfcView' => '/mfc/?mfcId=',
				'mfcTospView' => '/mfc/?tosp=true&mfcId=',
				'serviceView' => '/service/?serviceId=',
				'categoryView' => '/category/?categoryId=',
				'situationView' => '/category/?situationId=',
				'catalogView' => '/services/',
				'formView' => '/cabinet/request/?fileId=',
				'infoView' => '/cabinet/information/?fileId=',
				'attachmentView' => '/cabinet/attachment/?fileId=',
				'cabinetReceptionList' => '/cabinet/#tab5',
				'treatmentCreateView' => '/treatment/?serviceId=',
				'searchView' => '/searchservice/',
				'payView' => '/pay/'
			));
		}

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
				esbRvUrl: '".$options['esbRvUrl']."',
				authPortalPath: '".$options['rdcurl']."',
				authRedirectPath: '".nvxRpguContentUri."authRequest.php',
				fileProxyPath: '".nvxRpguContentUri."proxy4file.php',
				proxyPath: '".nvxRpguContentUri."proxy.php',
				pluginScriptPath: '".nvxRpguContentUri."Portal/'				
				};</script>";
		}				
	}

	
	
	function templateRedirectFunction() {
		add_action( 'wp_enqueue_scripts', 'regBundleAndLibs' );
	}

	if (is_admin()){
		//Добавляем меню в админку
		include_once('nvxrpgucontentadminmenu.php');
	} else {
		//Импорт бандла с вьхами происходит на каждой странице с постом		
		add_action('template_redirect', 'templateRedirectFunction');
		//Регистрируем шорткоды
		include_once('nvxShortcodes.php');
		
		nvxRpguContentShortcodes::init();
	}	
?>