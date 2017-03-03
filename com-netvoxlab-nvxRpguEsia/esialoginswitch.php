<?php
	require_once("EsiaClient.php");
	require_once("exceptions/BaseException.php");
	require_once("exceptions/SignFailException.php");
	require_once('../../../wp-load.php');
	$options = get_option('nvxesiapluginoptions');
	$config = array(
		'rdcUrl' => $options['rdcurl'].'esia/oauth/authexternalcallback',
		'clientId' => $options['esiaClientId'],
		'redirectUrl' => $GLOBALS['nvxRpguEsiaUriPluginUri'].'response.php',
		'portalUrl' => $options['esiaEndpoint'],
		'privateKeyPath' => 'key.pem',
		'privateKeyPassword' => $options['privateKeyPassword'],
		'certPath' => 'key.cer',
		'tmpPath' => 'tmp',
	);
	if (session_status() == PHP_SESSION_NONE) {
		session_start();
	}
	$esia = new \esia\EsiaClient($config);
	$_SESSION['esialoginswitch'] = true;	//Флаг повторного запроса
	if (isset($_GET['oid']) && $_GET['oid']) {
		$_SESSION['oid'] = $_GET['oid'];
		$codeUrl = $esia->getUrl($_GET['oid']);
		
		header('Location: '.$codeUrl);
	} else {
		//Если выбран вход в роли ФЛ, авторизуемся с полученным ранее маркером доступа
		$esia->setExternalEuthResult($_SESSION['esiaAuthResult']);
		$esia->getAuthRdc(null);
	}
?>