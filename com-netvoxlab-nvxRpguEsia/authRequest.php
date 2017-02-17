<?php
if (!isset($_SERVER['HTTP_REFERER']))
	header("location: /".$_SERVER['SERVER_PROTOCOL'].$_SERVER['SERVER_NAME']);
else
	//проверка домена
	if(strpos($_SERVER['HTTP_REFERER'], $_SERVER['HTTP_HOST'])===false) // проверка домена
		header("location: /".$_SERVER['SERVER_PROTOCOL'].$_SERVER['SERVER_NAME']);

require_once("EsiaClient.php");
require_once("exceptions/BaseException.php");
require_once("exceptions/SignFailException.php");

require_once('../../../wp-load.php');
try {
	$options = get_option('nvxesiapluginoptions');

	$config = array(
		'rdcUrl' => $options['rdcurl'].'esia/oauth/authexternalcallback',
		'clientId' => $options['esiaClientId'],
		'redirectUrl' => plugin_dir_url( __FILE__ ).'response.php',
		'portalUrl' => $options['esiaEndpoint'],
		'privateKeyPath' => 'key.pem',
		'privateKeyPassword' => $options['privateKeyPassword'],
		'certPath' => 'key.cer',
		'tmpPath' => 'tmp',
	);

	$esia = new \esia\EsiaClient($config);
	$url = $esia->getUrl();
	header('Location: '.$url);
} catch( Exception $e) {
	http_response_code(403) and exit('Ошибка: '.$e->getMessage());
}	
?>