<?
require("EsiaClient.php");
require("exceptions/BaseException.php");
require("exceptions/SignFailException.php");

$config = array(
	'clientId' => '218902441',
	'redirectUrl' => 'response.php',
	'portalUrl' => 'https://esia-portal1.test.gosuslugi.ru/',
	'privateKeyPath' => 'pavl.pem',
	'privateKeyPassword' => '1',
	'certPath' => 'pvl.cer',
	'tmpPath' => 'tmp',
);

$esia = new \esia\EsiaClient($config);

$esia->getToken($_GET['code']);
?>