<?php
namespace esia;

use esia\exceptions\SignFailException;

class EsiaClient
{
	public $clientId;
	public $redirectUrl;

	public $portalUrl;
	public $rdcUrl;
	public $tokenUrl = 'aas/oauth2/te';
	public $codeUrl = 'aas/oauth2/ac';
	public $personUrl = 'rs/prns';
	public $orgInfoUrl = '/roles';
	public $privateKeyPath;
	public $privateKeyPassword;
	public $certPath;
	public $oid = null;//Идентификатор субъекта, который обращается к ЕСИА
	private $orgOid = null;//Идентификатор организации (ЮЛ/ИП), от лица которой хочет авторизоваться субъект
	private $esiaAuthResult = null;

	protected $scope = 'openid fullname birthdate birthplace gender snils inn id_doc medical_doc military_doc foreign_passport_doc drivers_licence_doc birth_cert_doc residence_doc vehicles email mobile contacts usr_org';
	protected $scopeOrg = '%2$sorg_shortname%1$s %2$sorg_fullname%1$s %2$sorg_type%1$s %2$sorg_ogrn%1$s %2$sorg_inn%1$s %2$sorg_kpp%1$s %2$sorg_agencytype%1$s %2$sorg_oktmo%1$s %2$sorg_ctts%1$s %2$sorg_addrs%1$s %2$sorg_emps%1$s %2$sorg_leg%1$s %2$sorg_agencyterrange%1$s %2$sorg_vhls%1$s %2$sorg_brhs%1$s %2$sorg_brhs_ctts%1$s %2$sorg_brhs_addrs%1$s';

	protected $clientSecret = null;	
	protected $state = null;
	protected $timestamp = null;
	protected $tmpPath;

	private $url = null;
	public $token = null;

	public function __construct(array $config = array())
	{
		foreach ($config as $k => $v) {
			if (property_exists($this, $k)) {
				$this->$k = $v;
			}
		}
	}

	//Get url - string|false
	public function getUrl($oid)
	{	
		$currentScope = $this->scope;
		if (isset($oid) && $oid) {
			//Получаем код для доступа к организации
			$currentScope = $currentScope.' '.sprintf($this->scopeOrg, "?org_oid=".$oid, "http://esia.gosuslugi.ru/");
		}
		$this->timestamp = $this->getTimeStamp();
		$this->state = $this->getState();
		$this->clientSecret = $currentScope.$this->timestamp.$this->clientId.$this->state;
		$this->clientSecret = $this->signPKCS7($this->clientSecret);

		if ($this->clientSecret === false) {
			return false;
		}

		$url = $this->portalUrl.$this->codeUrl.'?%s';

		$params = array(
			'client_id' => $this->clientId,
			'client_secret' => $this->clientSecret,
			'redirect_uri' => $this->redirectUrl,
			'scope' => $currentScope,
			'response_type' => 'code',
			'state' => $this->state,
			'access_type' => 'online',
			'timestamp' => $this->timestamp
		);

		$request = http_build_query($params);

		$this->url = sprintf($url, $request);
		return $this->url;
	}

	//get auth data from esia and set token
	public function getToken($code, $oid)
	{
		$currentScope = $this->scope;
		if (isset($oid) && $oid) {
			//Запрос маркера для авторизации ЮЛ/ИП
			$currentScope = $currentScope.' '.sprintf($this->scopeOrg, "?org_oid=".$oid, "http://esia.gosuslugi.ru/");
		}
		$this->timestamp = $this->getTimeStamp();
		$this->state = $this->getState();

		$clientSecret = $this->signPKCS7($currentScope.$this->timestamp.$this->clientId.$this->state);
		if ($clientSecret === false) {
			throw new SignFailException(SignFailException::CODE_SIGN_FAIL);
		}

		$request = array(
			'client_id' => $this->clientId,
			'code' => $code,
			'grant_type' => 'authorization_code',
			'client_secret' => $clientSecret,
			'state' => $this->state,
			'redirect_uri' => $this->redirectUrl,
			'scope' => $currentScope,
			'timestamp' => $this->timestamp,
			'token_type' => 'Bearer',
			'refresh_token' => $this->state
		);

		$curl = curl_init();
		if ($curl === false) {
			return false;
		}

		$options = array(
			CURLOPT_URL => $this->portalUrl . $this->tokenUrl,
			CURLOPT_POSTFIELDS => http_build_query($request),
			CURLOPT_POST => true,
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_SSL_VERIFYPEER => false,
			CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,			
		);

		curl_setopt_array($curl, $options);

		if(!$result = curl_exec($curl)) {
			echo(curl_error($curl));
		} 

		$result = json_decode($result);
		$this->esiaAuthResult = $result;
		$this->token = $result->access_token;
		
		//get object id from token
		$chunks = explode('.', $this->token);
		$payload = json_decode($this->base64UrlSafeDecode($chunks[1]));
		$this->oid = $payload->{'urn:esia:sbj_id'};

		//Запросить информацию ФЛ и ЮЛ в json
		$userInfo = $this->getEsiaUserInfo();
		$orgsInfo = $this->getEsiaOrgInfo();
		
		//Проверяем, не второй ли раз мы здесь
		if(isset($_SESSION['esialoginswitch']) && $_SESSION['esialoginswitch']) {
			//Мы здесь второй раз, авторизуем в WP
			$this->getAuthRdc($oid);
			return;
		}
		
		//Если есть варианты входа, покажем их на отдельной странице
		if (isset($orgsInfo) && isset($orgsInfo->elements) && count($orgsInfo->elements) > 0) {
			//Сохраняем данные ФЛ и ЮЛ в сессии, чтобы зря потом не лезть в ЕСИА
			$_SESSION['esiaAuthResult'] = $this->esiaAuthResult;

			//уходим на страницу отображения вариантов входа
			echo '<!DOCTYPE html>
				<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
				<head>
					<meta charset="utf-8"/>
					<meta http-equiv="X-UA-Compatible" content="IE=Edge" />
					<title>Re:Doc</title>
					<style type="text/css">body,html{width:100%;height:100%;padding:0;margin:0;background:#f7f9f9;color:#434343;font:400 15px/20px \'Helvetica Neue\',helvetica,arial,sans-serif}.slogan{max-width:210px;margin:0 0 48px;font-size:14px;line-height:18px;text-align:center}.brand{width:196px;height:31px;background:url(data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMjIwIDM0LjciPjxzdHlsZT4uc3Qwe2ZpbGw6I0VFM0Y1ODt9IC5zdDF7ZmlsbDojMDA2NUIxO308L3N0eWxlPjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0xNDMuNi44aC0xOGMtLjIgMC0uMy4xLS4zLjMtLjUgOC4xLTIgMTYuOS00LjIgMjR2LjNjLjEuMS4yLjEuMy4xaDYuMmMuMSAwIC4zLS4xLjMtLjIgMS43LTUuNSAzLjEtMTIuNyAzLjYtMTguOGg1Ljl2MTguN2MwIC4yLjEuMy4zLjNoNS45Yy4yIDAgLjMtLjEuMy0uM3YtMjRjMC0uMi0uMS0uNC0uMy0uNE0yMTkuNy44aC01LjljLS4yIDAtLjMuMS0uMy4zdjE4LjZjLTEuMy40LTIuNi41LTQgLjUtMy45IDAtNC44LTEuMi00LjgtNi40VjEuMmMwLS4yLS4xLS4zLS4zLS4zaC01LjljLS4yIDAtLjMuMS0uMy4zdjEzLjRjMCA4LjQgMi44IDExLjcgMTAuMSAxMS43IDQuMSAwIDguOC0xLjEgMTEuNS0yLjEuMSAwIC4yLS4yLjItLjNWMS4yYzAtLjItLjEtLjQtLjMtLjRNOTUuMi45aC02Yy0uMiAwLS4zLjEtLjMuMi0uOSAzLjctMi44IDkuOS01LjQgMTYuNEw3Ny41IDFjMC0uMS0uMi0uMi0uMy0uMmgtNmMtLjEgMC0uMi4xLS4zLjEtLjEuMS0uMS4yIDAgLjNsOSAyNC42Yy0uOSAxLjktMS44IDMuNS0yLjYgNS0uNiAxLjEtMS4yIDIuMi0xLjggMy40LS4xLjEgMCAuMiAwIC4zLjEuMS4yLjIuMy4yaDYuNWMuMSAwIC4yLS4xLjMtLjIgMS4xLTIuMSAyLjUtNS4xIDMuOC04LjEgMy44LTkgNi45LTE3LjQgOS4yLTI1LjEgMC0uMSAwLS4yLS4xLS4zLS4xLS4xLS4yLS4xLS4zLS4xTTExNi42IDE5LjhjMC0uMS0uMS0uMi0uMi0uMmgtLjNjLTEuNC41LTQuMSAxLTYgMS00LjEgMC02LTEuMS02LTcuNCAwLTUgLjYtNy40IDYtNy40IDEuNSAwIDMgLjIgNC44LjguMiAwIC4zIDAgLjQtLjIuNy0xLjMgMS41LTIuOCAyLjQtNC44di0uM2MwLS4xLS4xLS4yLS4yLS4yLTIuNC0uOC01LjMtMS4yLTcuOC0xLjItOC42IDAtMTIuNCA0LTEyLjQgMTMuMSAwIDkuMiAzLjggMTMuMyAxMi40IDEzLjMgMi4xIDAgNi40LS41IDguNC0xLjMuMi0uMS4yLS4yLjItLjRsLTEuNy00Ljh6TTE3Mi41LjloLTZjLS4xIDAtLjMuMS0uMy4yLS45IDMuNy0yLjggOS45LTUuNCAxNi40bC02LTE2LjVjMC0uMS0uMi0uMi0uMy0uMmgtNmMtLjEgMC0uMi4xLS4zLjEtLjEuMS0uMS4yIDAgLjNsOSAyNC42Yy0uOSAxLjktMS44IDMuNC0yLjYgNS0uNiAxLjEtMS4yIDIuMi0xLjggMy40LS4xLjEgMCAuMiAwIC4zLjEuMS4yLjIuMy4yaDYuNWMuMSAwIC4yLS4xLjMtLjIgMS4xLTIuMSAyLjUtNS4xIDMuOC04LjEgMy44LTkgNi45LTE3LjQgOS4xLTI1LjEgMC0uMSAwLS4yLS4xLS4zIDAtLjEtLjEtLjEtLjItLjFNMTk0LjUuOGgtMTcuNGMtLjIgMC0uMy4xLS4zLjN2MjQuMWMwIC4yLjEuMy4zLjNoNS45Yy4yIDAgLjMtLjEuMy0uM1Y2LjZoOS4xYy4xIDAgLjMtLjEuMy0uMi43LTEuNiAxLjQtMy40IDIuMS01LjFWMWMtLjEtLjEtLjItLjItLjMtLjIiLz48cGF0aCBjbGFzcz0ic3QxIiBkPSJNMzEuMyAyMC44Yy0zLjkgMC01LjEtMS4xLTUuMS03LjYgMC03IDEuMy03LjYgNS4xLTcuNnM1LjIuNiA1LjIgNy42YzAgNi42LTEuMyA3LjYtNS4yIDcuNm0wLTIwLjdjLTguNSAwLTExLjggMy42LTExLjggMTMgMCA5LjUgMy4zIDEzLjIgMTEuOCAxMy4yczExLjktMy43IDExLjktMTMuMmMwLTkuMy0zLjQtMTMtMTEuOS0xM002Ni42IDE5LjhjMC0uMS0uMS0uMi0uMi0uMmgtLjNjLTEuNC41LTQuMSAxLTYgMS00LjEgMC02LTEuMS02LTcuNCAwLTUgLjYtNy40IDYtNy40IDEuNSAwIDMgLjIgNC44LjguMSAwIC4zIDAgLjQtLjIuNy0xLjMgMS41LTIuOCAyLjQtNC44di0uM2MwLS4xLS4xLS4yLS4yLS4yQzY1LjIuNCA2Mi4zIDAgNTkuOCAwYy04LjYgMC0xMi40IDQtMTIuNCAxMy4xIDAgOS4yIDMuOCAxMy4zIDEyLjQgMTMuMyAyLjEgMCA2LjQtLjUgOC40LTEuMy4yLS4xLjItLjIuMi0uNGwtMS44LTQuOXpNMTcuNy44SC4zQy4xLjggMCAxIDAgMS4ydjI0LjFjMCAuMi4xLjMuMy4zaDUuOWMuMiAwIC4zLS4xLjMtLjNWNi42aDkuMWMuMSAwIC4yLS4xLjMtLjIuNy0xLjYgMS40LTMuNCAyLjEtNS4xVjFjLS4xLS4xLS4yLS4yLS4zLS4yIi8+PC9zdmc+) 50% 50% no-repeat;background-size:contain;margin:16px auto;text-indent:-999px;text-align:left;overflow:hidden;position:relative}.container{width:100%;min-height:100%;padding:30px;box-sizing:border-box;display:-ms-flexbox;display:flex;-ms-flex-flow:column;flex-flow:column;-ms-flex-align:center;align-items:center;-ms-flex-pack:center;justify-content:center}.loginDesc{display:block;margin:0 0 36px;font-size:42px;line-height:50px;font-weight:300;text-align:center}.optionPanel{position:relative;background:#fff}.optionPanel:before{display:block;content:"";width:69px;height:69px;margin:-35px 0 0;background:url(data:image/png;base64,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) no-repeat;position:absolute;top:50%;left:20px}.optionPanel:hover{background:#f6f6f6}.optionPanel:hover:before{background-position:-69px 0}.optionPanel:active{background:#ececec}.optionPanel:active:before{background-position:-138px 0}.optionPanel.organization:before{background-position:0 -69px}.optionPanel.organization:hover:before{background-position:-69px -69px}.optionPanel.organization:active:before{background-position:-138px -69px}.optionPanel a{display:-ms-flexbox;display:flex;-ms-flex-align:center;align-items:center;min-height:60px;padding:20px 65px 20px 110px;color:#3b3b3b;font-size:1.2rem;line-height:1.2em;text-decoration:none;position:relative}.optionPanel a:after,.optionPanel a:before{display:block;content:"";width:15px;height:3px;background:#c2c2c2;position:absolute;top:50%;right:25px;transform:rotate(45deg) translate(0,1px);transform-origin:100% 50%}.optionPanel a:after{transform:rotate(-45deg) translate(0,-1px)}.optionPanel+.optionPanel a{border-top:1px solid #e1e1e1}#placeholder{margin-bottom:30px}</style>
				</head>
				<body>
					<div class="container">
						<div class="brand">ГосУслуги</div>
						<div class="slogan">Доступ к сервисам электронного правительства</div>
						<div id="placeholder">
							<p class="loginDesc">Войти как</p>
							<div class="optionPanel">
								<a href="'.$GLOBALS['nvxRpguEsiaUriPluginUri'].'esialoginswitch.php">'.$userInfo->lastName.' '.$userInfo->firstName.' '.$userInfo->middleName.'</a>
							</div>';
			for ($orgindex = 0; $orgindex < count($orgsInfo->elements); $orgindex++) {
				echo '<div class="optionPanel organization"><a href="'.$GLOBALS['nvxRpguEsiaUriPluginUri'].'esialoginswitch.php?oid='.$orgsInfo->elements[$orgindex]->oid.'">'.$orgsInfo->elements[$orgindex]->fullName;
				if (isset($orgsInfo->elements[$orgindex]->branchName) && $orgsInfo->elements[$orgindex]->branchName)
					echo ' ('.$orgsInfo->elements[$orgindex]->branchName.')';				
				echo '</a></div>';
			}
			echo '</div></div></body></html>';
			exit();
		}
		
		//Если вариантов входа не было, просто авторизуем ФЛ
		//Авторизация на стороне Re:Doc
		$this->getAuthRdc(null);
	}
	
	public function setExternalEuthResult($result) {
		$this->esiaAuthResult = $result;
		$this->token = $result->access_token;		
		$chunks = explode('.', $this->token);
		$payload = json_decode($this->base64UrlSafeDecode($chunks[1]));
		$this->oid = $payload->{'urn:esia:sbj_id'};
	}
	
	//get auth data from rdc
	public function getAuthRdc($oid) {
		//Авторизация на стороне WP
		try {
			$this->add_user($oid);
		} catch( Exception $e) {
			error_log($e->getMessage());
		}		
		$curl = curl_init();
		if ($curl === false) {
			return false;
		}		

		$authData = array(
			'AccessToken' => $this->esiaAuthResult->access_token,
			'ExpiresIn' => $this->esiaAuthResult->expires_in
		);
		$currentUrl = $this->rdcUrl;
		if (isset($oid) && $oid) {
			$currentUrl = $currentUrl.'/'.$oid;
		}
		$options = array(
			CURLOPT_URL => $currentUrl,
			CURLOPT_POSTFIELDS => http_build_query($authData),
			CURLOPT_POST => true,
			CURLOPT_HEADER => true,
			CURLOPT_FOLLOWLOCATION => true,
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
			CURLOPT_SSL_VERIFYPEER => false
		);

		curl_setopt_array($curl, $options);
		$result = curl_exec($curl);
		preg_match_all('/^Set-Cookie:\s*([^;]*)/mi', $result, $matches);
		$cookies = array();
		foreach($matches[1] as $item) {
			parse_str($item, $cookie);			
			$cookies = array_merge($cookies, $cookie);
		}
		setcookie ("_ncfa", $cookies['_ncfa'], time()+3600, '/', $_SERVER['HTTP_HOST']);
		unset($_SESSION['esiaAuthResult']);
		header('Location: /');
	}

	public function signPKCS7($message)
	{
		$this->checkFilesExists();

		$certContent = file_get_contents($this->certPath);
		$keyContent = file_get_contents($this->privateKeyPath);

		$cert = openssl_x509_read($certContent);

		if ($cert === false) {
			throw new SignFailException(SignFailException::CODE_CANT_READ_CERT);
		}

		$privateKey = openssl_pkey_get_private($keyContent, $this->privateKeyPassword);

		if ($privateKey === false) {
			throw new SignFailException(SignFailException::CODE_CANT_READ_PRIVATE_KEY);
		}

		$messageFile = $this->tmpPath . DIRECTORY_SEPARATOR . uniqid();
		$signFile = $this->tmpPath . DIRECTORY_SEPARATOR . uniqid();
		file_put_contents($messageFile, $message);

		$signResult = openssl_pkcs7_sign(
			$messageFile,
			$signFile,
			$cert,
			$privateKey,
			array()
		);

		if (!$signResult) {			
			//echo('Sign fail. SSH error: ' . openssl_error_string());
			throw new SignFailException(SignFailException::CODE_SIGN_FAIL);
		}

		$signed = file_get_contents($signFile);

		//split by section
		$signed = explode("\n\n", $signed);

		//get third section which contains sign and join into one line
		$sign = str_replace("\n", "", $this->urlSafe($signed[3]));

		unlink($signFile);
		unlink($messageFile);

		return $sign;
	}

	protected function checkFilesExists()
	{
		if (! file_exists($this->certPath)) {
			throw new SignFailException(SignFailException::CODE_NO_SUCH_CERT_FILE);
		}
		if (! file_exists($this->privateKeyPath)) {
			throw new SignFailException(SignFailException::CODE_NO_SUCH_KEY_FILE);
		}
		if (! file_exists($this->tmpPath)) {
			throw new SignFailException(SignFailException::CODE_NO_TEMP_DIRECTORY);
		}
	}

	private function getTimeStamp()
	{
		return date("Y.m.d H:i:s O");
	}

	private function getState()
	{
		return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
			mt_rand(0, 0xffff), mt_rand(0, 0xffff),
			mt_rand(0, 0xffff),
			mt_rand(0, 0x0fff) | 0x4000,
			mt_rand(0, 0x3fff) | 0x8000,
			mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
		);
	}

	/**
	 * Url safe for base64
	 *
	 * @param string $string
	 * @return string
	 */
	private function urlSafe($string)
	{
		return rtrim(strtr(trim($string), '+/', '-_'), '=');
	}

	/**
	 * Url safe for base64
	 *
	 * @param string $string
	 * @return string
	 */
	private function base64UrlSafeDecode($string)
	{
		$base64 = strtr($string, '-_', '+/');
		return base64_decode($base64);
	}	
	
	/*
	* Новые методы работы с БД пользователей WP
	*/
	//Создание пользователя по идентификатору ЕСИА
	function add_user($oid) {
		if (!$this->oid && !$oid)
			return;		
				
		require_once('../../../wp-load.php');
		global $wpdb;
		
		
		//Идентификатор пользователя ЕСИА для авторизации = идентификатору ФЛ в ЕСИА
		$currentOid = $this->oid;
		if (isset($oid) && $oid) {
			//Но если мы авторизуемся как организация, то идентификатор = идентификатору ЮЛ/ИП в ЕСИА
			$currentOid = $oid;
			$this->orgOid = $oid;
		}
		//Проверим, нет ли уже такого пользователя
		$user_id = $wpdb->get_results('SELECT wpid FROM ' . $wpdb->prefix . 'nvx_wp_esia_users WHERE esiaid = "'.$currentOid.'" LIMIT 1;');
		if (!$user_id) {
			$password = wp_generate_password();
			//Создадим пользователя сразу с полями из ЕСИА
			$newWpId = $this->getEsiaUserInfoWithUserCreate(null, $password);
			if ($newWpId == null) {
				//Не удалось, создадим простого пользователя
				$newWpId = wp_create_user('esia'.$currentOid, $password);
			}
			//Если не было ошибок
			if (!is_wp_error($newWpId)) {
				//Пользователь создан, добавить связь в таблицу
				$res = $wpdb->insert($wpdb->prefix.'nvx_wp_esia_users', array('wpid' => $newWpId, 'esiaid' => $currentOid), array('%d','%d'));			
				if (!is_wp_error($res)) {
					//и авторизовать 
					$this->set_current_user_by_wpid($newWpId, $currentOid);
				} else {
					//todo какая-то ошибка при добавлении связи. Что делать?
					error_log($res->get_error_message());
				}
			} else {
				//todo какая-то ошибка при создании пользователя. Что делать?
				error_log($newWpId->get_error_message());
				//return $newWpId->get_error_message();
			}
		} else {
			//Пользователь существует, можно сразу авторизовать
			$this->set_current_user($currentOid);
		}
		return null;
	}

	//Авторизация пользователя по id ESIA
	function set_current_user($currentOid) {
		global $wpdb;
		//Получаем id пользователя wp по его esiaUserId
		$user_id = $wpdb->get_var($wpdb->prepare('SELECT wpid FROM ' . $wpdb->prefix . 'nvx_wp_esia_users WHERE esiaid = "%d"', $currentOid));
		if ($user_id) {	
			//Проставляем текущего пользователя и авторизуем его в wp
			$user = get_user_by('id', $user_id);
			//TODO TEST!
			if ($user->display_name == 'esia'.$currentOid) {
				//Пользователю запросим ФИО из ЕСИА
				$jsonresult = $this->getEsiaUserInfoWithUserCreate($user_id);
			} else {
				//Обновляем токен пользователя при каждой авторизации
				update_user_meta($user_id, 'esia_user_token', $this->token );
			}
			$this->authorizeWpUser($user_id, $user);
		}
	}

	//Авторизация пользователя по id wp
	function set_current_user_by_wpid($user_id, $currentOid) {
		if ($user_id) {			
			$user = get_user_by('id', $user_id);
			//Учесть, что или ФЛ или ЮЛ
			if ($user->display_name == 'esia'.$currentOid) {
				//Пользователю запросим ФИО из ЕСИА
				$this->getEsiaUserInfoWithUserCreate($user_id);
			}
			$this->authorizeWpUser($user_id, $user);
		}
	}

	//Авторизация пользователя wp
	function authorizeWpUser($user_id, $user) {
		if($user) {
			//Проставляем текущего пользователя и авторизуем его в wp
			wp_set_current_user($user_id, $user->user_login);
			wp_set_auth_cookie($user_id);
			do_action( 'wp_login', $user->user_login);
		}
	}
	
	//Запрос личной информации по субъекту из ЕСИА
	private function getEsiaUserInfo()
    {
		$curl = curl_init();
		$options = array(
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_URL => $this->portalUrl.$this->personUrl.'/'.$this->oid,
			CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $this->token]
		);
		curl_setopt_array($curl, $options);
        return json_decode(curl_exec($curl));
    }
	
	private function getEsiaOrgInfo() {
		//Если предыдущие авторизационные запросы отработали, то тут не должно быть проблем
		$curl = curl_init();
		$options = array(
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_URL => $this->portalUrl.$this->personUrl.'/'.$this->oid.$this->orgInfoUrl,	//формируем урл для запроса данных по организации
			CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $this->token]
		);
		curl_setopt_array($curl, $options);
        return json_decode(curl_exec($curl));
	}

	//Запрос личной информации по субъекту из ЕСИА
	function getEsiaUserInfoWithUserCreate($wpUserId, $password)
    {
		$userdata = array();
		//Идентификатор пользователя ЕСИА для запроса данных = идентификатору ФЛ в ЕСИА
		$currentOid = $this->oid;
		if ($this->orgOid) {
			//Но если мы авторизуемся как организация, то идентификатор = идентификатору ЮЛ/ИП в ЕСИА
			$currentOid = $this->orgOid;
			$orgsInfo = $this->getEsiaOrgInfo();
			$shortName = 'esia'.$currentOid;
			for ($orgindex = 0; $orgindex < count($orgsInfo->elements); $orgindex++) {
				if ($orgsInfo->elements[$orgindex]->oid == $currentOid) {
					$shortName = $orgsInfo->elements[$orgindex]->fullName;
					break;
				}
			}			
			$userdata = array(
				'display_name' => $shortName
				,'rich_editing' => false
			);
		} else {
			$userInfo = $this->getEsiaUserInfo();
			$userdata = array(
				'display_name' => $userInfo->lastName.' '.$userInfo->firstName
				,'first_name' => $userInfo->firstName
				,'last_name' => $userInfo->lastName
				,'rich_editing' => false  // false - выключить визуальный редактор для пользователя.
			);
		}
		
        
		//example: array(firstName,lastName,middleName,birthDate,birthPlace,gender,citizenship,snils,inn)
		if ($wpUserId != null) {
			//Обновление информации по существующему пользователю
			$userdata['ID'] = $wpUserId;
		} else {
			//Создание нового пользователя
			$userdata['user_pass'] = $password;
			$userdata['user_login'] = 'esia'.$currentOid;
		}
		$wpUserId = wp_insert_user($userdata);
		if (!is_wp_error($wpUserId)) {
			//Обновляем токен пользователя после его создания
			update_user_meta($wpUserId, 'esia_user_token', $this->token);
			return $wpUserId;
		} else {
			error_log($wpUserId->get_error_message());
			return null;
		}
    }
}
?>