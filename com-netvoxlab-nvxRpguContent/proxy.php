<?php
if (!function_exists('http_response_code')) {
		function http_response_code($code = NULL) {
			if ($code !== NULL) {
				switch ($code) {
					case 100: $text = 'Continue'; break;
					case 101: $text = 'Switching Protocols'; break;
					case 200: $text = 'OK'; break;
					case 201: $text = 'Created'; break;
					case 202: $text = 'Accepted'; break;
					case 203: $text = 'Non-Authoritative Information'; break;
					case 204: $text = 'No Content'; break;
					case 205: $text = 'Reset Content'; break;
					case 206: $text = 'Partial Content'; break;
					case 300: $text = 'Multiple Choices'; break;
					case 301: $text = 'Moved Permanently'; break;
					case 302: $text = 'Moved Temporarily'; break;
					case 303: $text = 'See Other'; break;
					case 304: $text = 'Not Modified'; break;
					case 305: $text = 'Use Proxy'; break;
					case 400: $text = 'Bad Request'; break;
					case 401: $text = 'Unauthorized'; break;
					case 402: $text = 'Payment Required'; break;
					case 403: $text = 'Forbidden'; break;
					case 404: $text = 'Not Found'; break;
					case 405: $text = 'Method Not Allowed'; break;
					case 406: $text = 'Not Acceptable'; break;
					case 407: $text = 'Proxy Authentication Required'; break;
					case 408: $text = 'Request Time-out'; break;
					case 409: $text = 'Conflict'; break;
					case 410: $text = 'Gone'; break;
					case 411: $text = 'Length Required'; break;
					case 412: $text = 'Precondition Failed'; break;
					case 413: $text = 'Request Entity Too Large'; break;
					case 414: $text = 'Request-URI Too Large'; break;
					case 415: $text = 'Unsupported Media Type'; break;
					case 500: $text = 'Internal Server Error'; break;
					case 501: $text = 'Not Implemented'; break;
					case 502: $text = 'Bad Gateway'; break;
					case 503: $text = 'Service Unavailable'; break;
					case 504: $text = 'Gateway Time-out'; break;
					case 505: $text = 'HTTP Version not supported'; break;
					default:
						exit('Unknown http status code "' . htmlentities($code) . '"');
					break;
				}

				$protocol = (isset($_SERVER['SERVER_PROTOCOL']) ? $_SERVER['SERVER_PROTOCOL'] : 'HTTP/1.0');
				header($protocol . ' ' . $code . ' ' . $text);
				$GLOBALS['http_response_code'] = $code;
			} else {
				$code = (isset($GLOBALS['http_response_code']) ? $GLOBALS['http_response_code'] : 200);
			}
			return $code;
		}
	}
	
if (!function_exists('getallheaders')) 
{
	function getallheaders() 
	{
		$headers = ''; 
		foreach ($_SERVER as $name => $value) 
		{
			if (substr($name, 0, 5) == 'HTTP_') 
			{
				$headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value; 
			}
		}
		return $headers; 
	}
}

//work	
$whitelist = array(array('regex' => '%^http://tester22:29929/%'));

if(!isset($curl_maxredirs))
	$curl_maxredirs = 10;

if(!isset($curl_timeout))
	$curl_timeout = 180;

$headers = getallheaders();
$method = __('REQUEST_METHOD', $_SERVER);
$url = __('X-Proxy-Url', $headers);
$cookie = __('X-Proxy-Cookie', $headers);

// Check that we have a URL
if(!$url)
	http_response_code(400) and exit("X-Proxy-Url header missing");

// Check that the URL looks like an absolute URL
if(!parse_url($url, PHP_URL_SCHEME))
	http_response_code(403) and exit("Not an absolute URL: $url");

// Check referer hostname
if(!parse_url(__('Referer', $headers), PHP_URL_HOST) == $_SERVER['HTTP_HOST'])
	http_response_code(403) and exit("Invalid referer");

// Check whitelist, if not empty
if(!empty($whitelist) and !array_reduce($whitelist, 'whitelist', array($url, false)))
	http_response_code(403) and exit("Not whitelisted: $url");

// Remove ignored headers and prepare the rest for resending
$ignore = array('Cookie', 'Host', 'X-Proxy-URL', 'Accept', 'Content-Type');
$headers = array_diff_key($headers, array_flip($ignore));
if($cookie)
	$headers['Cookie'] = $cookie;
foreach($headers as $key => &$value)
	$value = "$key: $value";

// Init curl
$curl = curl_init();
curl_setopt_array($curl, array(
		CURLOPT_URL => $url,
		CURLOPT_HTTPHEADER => $headers,
		//CURLOPT_HEADER => TRUE,
		CURLOPT_TIMEOUT => $curl_timeout,
		CURLOPT_FOLLOWLOCATION => false,
		CURLOPT_MAXREDIRS => $curl_maxredirs
	));

switch($method)
{
	case 'HEAD':
		curl_setopt($curl, CURLOPT_NOBODY, TRUE);
		break;
	case 'GET':
		break;
	case 'PUT':
	case 'POST':
	case 'DELETE':
	default:
		curl_setopt($curl, CURLOPT_CUSTOMREQUEST, $method);
		curl_setopt($curl, CURLOPT_POSTFIELDS, file_get_contents('php://input'));			
		break;
}

try {
	$response = curl_exec($curl);
	header_remove();
	curl_close($curl);

	header('Content-Type: json');
	if ($response == null) {		
		$obj = new stdClass();
		$obj->hasError= true;
		$obj->errorMessage = 'Server is not responding';
		$output = json_encode($obj);
	} else {
		$output = substr((string)$response, 0, strlen((string)$response) - 1);
	}
} catch( Exception $e) {
	http_response_code(403) and exit('Exception: '.$e->getMessage());
}
	
http_response_code(200) and exit($output);

function __($key, array $array, $default = null)
{
	return array_key_exists($key, $array) ? $array[$key] : $default;
}

function whitelist($carry, $item)
{
	static $url;
	if(is_array($carry))
	{
		$url = parse_url($carry[0]);
		$url['raw'] = $carry[0];
		$carry = $carry[1];
	}
	if(isset($item[0]))
		return $carry or $url['raw'] == $item[0];	
	if(isset($item['regex']))
		return $carry or preg_match($item['regex'], $url['raw']);
	return $carry or $item == array_intersect_key($url, $item);
}
