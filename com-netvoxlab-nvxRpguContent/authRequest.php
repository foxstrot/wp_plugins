<?php
require("EsiaClient.php");
require("exceptions/BaseException.php");
require("exceptions/SignFailException.php");

$config = array(
	'clientId' => '218902441',
	'redirectUrl' => 'http://tester22:6448/response.php',
	'portalUrl' => 'https://esia-portal1.test.gosuslugi.ru/',
	'privateKeyPath' => 'pavl.pem',
	'privateKeyPassword' => '1',
	'certPath' => 'pvl.cer',
	'tmpPath' => 'tmp',
);

$esia = new \esia\EsiaClient($config);
$url = $esia->getUrl();
header('Location: '.$url);
?>