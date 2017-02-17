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
	public $privateKeyPath;
	public $privateKeyPassword;
	public $certPath;
	public $oid = null;
	private $esiaAuthResult = null;

	protected $scope = 'http://esia.gosuslugi.ru/usr_inf';

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
	public function getUrl()
	{	
		$this->timestamp = $this->getTimeStamp();
		$this->state = $this->getState();
		$this->clientSecret = $this->scope.$this->timestamp.$this->clientId.$this->state;
		$this->clientSecret = $this->signPKCS7($this->clientSecret);

		if ($this->clientSecret === false) {
			return false;
		}

		$url = $this->portalUrl.$this->codeUrl.'?%s';

		$params = array(
			'client_id' => $this->clientId,
			'client_secret' => $this->clientSecret,
			'redirect_uri' => $this->redirectUrl,
			'scope' => $this->scope,
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
	public function getToken($code)
	{
		$this->timestamp = $this->getTimeStamp();
		$this->state = $this->getState();

		$clientSecret = $this->signPKCS7($this->scope.$this->timestamp.$this->clientId.$this->state);
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
			'scope' => $this->scope,
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

		//Авторизация на стороне WP
		try {
			$this->add_user();
		} catch( Exception $e) {
			error_log($e->getMessage());
		}
		//Авторизация на стороне Re:Doc
		$this->getAuthRdc();
	}
	
	//get auth data from rdc
	public function getAuthRdc() {
		$curl = curl_init();
		if ($curl === false) {
			return false;
		}		

		$authData = array(
			'AccessToken' => $this->esiaAuthResult->access_token,
			'ExpiresIn' => $this->esiaAuthResult->expires_in
		);
				
		$options = array(
			CURLOPT_URL => $this->rdcUrl,
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
	function add_user() {
		if (!$this->oid)
			return;		
		require_once('../../../wp-load.php');
		global $wpdb;
		//Проверим, нет ли уже такого пользователя
		$user_id = $wpdb->get_results('SELECT wpid FROM ' . $wpdb->prefix . 'nvx_wp_esia_users WHERE esiaid = "'.$this->oid.'" LIMIT 1;');
		if (!$user_id) {
			$password = wp_generate_password();
			//Создадим пользователя сразу с полями из ЕСИА
			$newWpId = $this->getEsiaUserInfo(null, $password);
			if ($newWpId == null) {
				//Не удалось, создадим простого пользователя
				$newWpId = wp_create_user('esia'.$this->oid, $password);
			}
			//Если не было ошибок
			if (!is_wp_error($newWpId)) {
				//Пользователь создан, добавить связь в таблицу
				$res = $wpdb->insert($wpdb->prefix.'nvx_wp_esia_users', array('wpid' => $newWpId, 'esiaid' => $this->oid), array('%d','%d'));			
				if (!is_wp_error($res)) {
					//и авторизовать 
					$this->set_current_user_by_wpid($newWpId);
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
			$this->set_current_user();
		}
		return null;
	}

	//Авторизация пользователя по id ESIA
	function set_current_user() {
		global $wpdb;
		//Получаем id пользователя wp по его esiaUserId
		$user_id = $wpdb->get_var($wpdb->prepare('SELECT wpid FROM ' . $wpdb->prefix . 'nvx_wp_esia_users WHERE esiaid = "%d"', $this->oid));
		if ($user_id) {	
			//Проставляем текущего пользователя и авторизуем его в wp
			$user = get_user_by('id', $user_id);
			//TODO TEST!
			if ($user->display_name == 'esia'.$this->oid) {
				//Пользователю запросим ФИО из ЕСИА
				$jsonresult = $this->getEsiaUserInfo($user_id);
			}
			$this->authorizeWpUser($user_id, $user);
		}
	}

	//Авторизация пользователя по id wp
	function set_current_user_by_wpid($user_id) {
		if ($user_id) {			
			$user = get_user_by('id', $user_id);
			//TODO TEST!
			if ($user->display_name == 'esia'.$this->oid) {
				//Пользователю запросим ФИО из ЕСИА
				$this->getEsiaUserInfo($user_id);
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
	function getEsiaUserInfo($wpUserId, $password)
    {
		//Если предыдущие авторизационные запросы отработали, то тут не должно быть проблем
		$curl = curl_init();
		$options = array(
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_URL => $this->portalUrl.$this->personUrl.'/'.$this->oid,
			CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $this->token]
		);
		curl_setopt_array($curl, $options);
        $userInfo = json_decode(curl_exec($curl));
		//example: array(firstName,lastName,middleName,birthDate,birthPlace,gender,citizenship,snils,inn)
		$userdata = array(
			'display_name' => $userInfo->lastName.' '.$userInfo->firstName
			,'first_name' => $userInfo->firstName
			,'last_name' => $userInfo->lastName
			,'rich_editing' => false  // false - выключить визуальный редактор для пользователя.
		);
		if ($wpUserId != null) {
			//Обновление информации по существующему пользователю
			$userdata['ID'] = $wpUserId;
		} else {
			//Создание нового пользователя
			$userdata['user_pass'] = $password;
			$userdata['user_login'] = 'esia'.$this->oid;
		}
		$wpUserId = wp_insert_user($userdata);
		if (!is_wp_error($wpUserId)) {
			return $wpUserId;
		} else {
			error_log($wpUserId->get_error_message());
			return null;
		}
    }
}
?>