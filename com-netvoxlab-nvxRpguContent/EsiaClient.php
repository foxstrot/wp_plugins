<?php
namespace esia;

use esia\exceptions\SignFailException;

class EsiaClient
{
	public $clientId;
	public $redirectUrl;

	public $portalUrl = 'https://esia-portal1.test.gosuslugi.ru/';
	public $rdcUrl = 'http://tester22:29929/esia/oauth/authexternalcallback';
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
		setcookie ("_ncfa", $cookies['_ncfa'], time()+3600);
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
}

