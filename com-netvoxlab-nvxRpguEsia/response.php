<?php
require_once("EsiaClient.php");
require_once("exceptions/BaseException.php");
require_once("exceptions/SignFailException.php");
require_once('../../../wp-load.php');
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
		'tmpPath' => 'tmp',
	);

	$esia = new \esia\EsiaClient($config);
	$esia->getToken($_GET['code']);
} catch( Exception $e) {
	error_log($e->getMessage());
	http_response_code(403) and exit('Ошибка: '.$e->getMessage());
}	
?>