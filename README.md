# wp_plugins


##Рекомендации:

#### Обновление скриптов и стилей
Для того, чтобы пользователь мог видеть изменения стилей или скриптов без обновления кеша, необходимо к их названиям добавлять вопросительный знак и версию (версию называть по дате обновления). Например, ?v2016.02.02.
```html
<script type="text/javascript" src="http://test.ownradio.ru/wp-includes/js/admin-bar.min.js?ver=2016.02.02"></script>
```
И при каждом обновлении скрипта обновлять это значение.

### Написание плагина

**ВАЖНО** Кодировка должна быть UTF-8, иначе будут проблемы с кириллицей.

**Имя плагина** должно отражать его функциональность. Имя является идентификатором плагина, поэтому лучше чтобы оно было уникально.

Плагин может содержать **минимум один файл PHP**; он также может содержать файлы JavaScript, CSS, изображения, языковые файлы и т.п. Если ваш плагин состоит из нескольких файлов, задайте уникальное имя для директории, в которой они лежат, и для главного файла PHP, например ownradio и ownradio.php.

**Файл Readme**. Если вы хотите разместить ваш плагин на http://wordpress.org/extend/plugins/, вам необходимо создать файл readme.txt в стандартном формате и включить его в свой плагин. Смотрите http://wordpress.org/extend/plugins/about/readme.txt для получения разъяснений по формату.

**Домашняя страница**. При необходимости можно создать веб-страницу, играющую роль «домашней страницы» вашего плагина. Эта страница должна объяснять, как установить плагин, что он делает, с какими версиями WordPress совместим, что менялось от версии к версии вашего плагина, и как его использовать.

#### Заголовки файла
Начало главного файла плагина (у нас ownradio.php) должно содержать стандартный информационный заголовок. Этот заголовок позволяет WordPress понять, что ваш плагин существует, добавить его в панель управления плагинами, где он может быть активирован, загрузить его и запустить его функции; без заголовка ваш плагин никогда не будет активирован и запущен. Вот формат заголовка:

```php
<?php 
/*
Plugin Name: com.netvoxlab.ownradio
Description: Broadcast radio ownRadio. Listen to your favorite music only.
Version: 2017.02.02
Author: Ltd. NetVox Lab
Author URI: http://www.netvoxlab.ru/
*/
 ?>
```
Минимальная информация, которая нужна WordPress, чтобы обнаружить ваш плагин — его название (Plugin Name). Остальная информация (если она есть) используется для создания таблицы плагинов на странице управления плагинами. Порядок строк неважен.

**Лицензия**
За стандартным заголовком обычно следует информация о лицензии на плагин. Большинство плагинов используют лицензию GPL или лицензию, совместимую с GPL. Для указания лицензии GPL добавьте следующие строки в файл вашего плагина:
```php
<?php
/*  Copyright ГОД  ИМЯ_АВТОРА_ПЛАГИНА  (email: E-MAIL_АВТОРА)

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/
?>
```
####Программирование плагина
Для удобства зададим константы с версией плагина и относительным путем до папки с ним.

```php
define('OWNRADIO_PLUGIN_VERSION', '2017.01.30');
define('OWNRADIO_PLAYER_URL', plugin_dir_url( __FILE__ ));
```

#####Подключение стилей и скриптов
Для начала необходимо зарегистрировать нужные файлы стилей и скриптов. Для этого используем следующие функции

```php
wp_register_style( $handle, $src, $deps, $ver, $media );
```
Регистрация скриптов нужна, чтобы взять под контроль внедряемые скрипты: учесть зависимость одних от других (например, выводить jQuery UI скрипты после того как будет добавлен основной скрипт jQuery) и не выводить одни и те же скрипты по нескольку раз.
```php
wp_register_script( $handle, $src, $deps, $ver, $in_footer );
```
Нужно использовать эту функцию, чтобы правильно подключить CSS файлы в WordPress.
Для вызова этой функции используйте события: wp_enqueue_scripts и/или admin_enqueue_scripts.

общие параметры

$handle(строка) (обязательный) - Название скрипта. Должно быть уникальным, так как оно будет использоваться для вызова в дальнейшем в функции wp_enqueue_script(). По умолчанию: нет

$src(строка) (обязательный) -URL, путь до скрипта или стилей, например, http://example.com/wp-content/themes/my-theme/my-theme-script.js. Никогда не пишите URL напрямую, если он лежит в файлах движка или плагине, используйте специальные функции путей: plugins_url() для плагинов и get_template_directory_uri() для тем. Удаленные скрипты указывайте без протокола, так: //otherdomain.com/js/their-script.js. По умолчанию: нет

$deps(массив) -Массив названий всех зарегистрированных скриптов, от которых зависит этот. Указанные тут скрипты будут загружены перед текущем. Укажите false, если нет зависимых скриптов. По умолчанию: array()

$ver(строка) - Версия скрипта, которая будет добавлена в конец пути к файлу в виде аргумента (?ver=1.1). Если версии нет укажите false, тогда WordPress добавит в конец текущую версию WP. Если указать null, никакая версия не будет добавлена.Этот параметр нужен, чтобы корректная версия скрипта была загружена пользователями, в обход кэша. По умолчанию: false
только для скрипта

$in_footer(логический) - Где выводить скрипт: в head или footer. Обычно скрипты располагаются в head части. Если этот параметр будет равен true скрипт будет добавлен в конец body тега, для этого тема должна содержать функцию wp_footer() перед закрывающим тегом </body>. По умолчанию: false
только для стиля

$media(строка) - Устанавливается значение атрибута media. media указывает тип устройства для которого будет работать текущий стиль. Список стилей можно найти здесь https://www.w3.org/TR/CSS2/media.html#media-types.

После регистрации стилей и скриптов подключаем их функцией wp_enqueue_script(). Функцию нужно подключать через хуки, потому что вызов функции за пределами хуков, может создать проблемы:
wp_enqueue_scripts, если нужно вызвать функцию в лицевой части сайта (фронт-энде).
admin_enqueue_scripts, чтобы вызвать в административной части.
login_enqueue_scripts - для страницы авторизации.

Пример.
```php
// регистрируем файл стилей и добавляем его в очередь
function true_register_style_frontend() {
    wp_register_style('ownradio-style', OWNRADIO_PLAYER_URL . 'assets/css/ownRadio.css');
    wp_enqueue_style('ownradio-style', OWNRADIO_PLAYER_URL . 'assets/css/ownRadio.css');
}
// регистрируем стили
add_action( 'wp_enqueue_scripts', 'true_register_style_frontend' );
```
**Замечание**.

Необходимо следить, чтобы стили и скрипты не конфликтовали с уже имеющимися. Кроме того, где можно - лучше их подключать только для тех страниц, где они используются. Для этого можно, например, проверять на соответствие типу страницы/записи или проверять есть ли шоткод плагина на странице.
```php
 if (is_single()) {
    add_action( 'wp_enqueue_scripts', 'true_register_style_frontend' );
 }
```
Для того чтобы подключить скрипты только для страниц, на которых указан шоткод, надо определить шоткод как отдельный класс и добавить флаг, определяющий есть ли этот шоткод на странице. Пример:
```php
class foobar_shortcode {
  static $add_script;
  static function init () {
      add_shortcode('foobar', array(__CLASS__, 'foobar_func'));
      add_action('init', array(__CLASS__, 'register_script'));
      add_action('wp_footer', array(__CLASS__, 'print_script'));
  }
  static function foobar_func( $atts ) {
      self::$add_script = true; 
      return "foo and bar";
  }
  static function register_script() {
      wp_register_script( 'foo-js', get_template_directory_uri() . '/includes/js/foo.js');
  }

  static function print_script () {
      if ( !self::$add_script ) return;
      wp_print_scripts('foo-js');
  }
}
foobar_shortcode::init();
```
####Зацепки (Hook) плагина
Для взаимодействия плагина с ядром Wordpress существует система "зацепок" или "хуков". Принцип ее действия состоит в том, что каждая более или менее важная элементарная функция в ядре Wordpress перед тем как вернуть какой-то результат своей работы или совершить какое-то важное действие (например вывести содержимое записи на странице, или произвести запрос к базе данных) «пытается» исполнить дополнительные инструкции (строки кода), предназначенные именно для нее в файлах плагина. Такую попытку она делает с помощью зацепок, которые прописаны в теле этой функции. Если в плагине существует код, предназначенный изменить поведение одной из стандартных функций ядра, то он будет исполнен той функцией, для которой назначался. Если нет — функция ядра сработает как обычно.
Следующий пример цепляет к хуку the_content собственную функцию, которая выводит подпись к статье, если просматривается полный текст статьи:
```php
add_filter( 'the_content', 'wfm_sign_content' );

function wfm_sign_content($content){
    if( !is_single() ) return $content;
    $wfm_sign = '<div class="alignright"><em>Подпись к статье, добавленная плагином...</em></div>';
    return $content . $wfm_sign;
}
```
####Вызов функций плагина на сайте
Для вызова функций плагина можно использовать шоткоды. Один плагин может содержать несколько шоткодов для разных функций.
```php
add_shortcode( $tag , $func );
```
$tag(строка) (обязательный) - название шоткода, который будет использоваться в тексте. Пр. 'ownradio_player'. По умолчанию: нет

$func(строка) (обязательный) - название функции, которая должна сработать, если найден шоткод.

Функция указанная в параметре $func, получает 3 параметра, каждый из них может быть передан, а может нет:

$atts(массив) - Ассоциативный массив атрибутов указанных в шоткоде. По умолчанию пустая строка - атрибуты не переданы. По умолчанию: ''

$content(строка) - Текст шоткода, когда используется закрывающая конструкция шотркода: [foo]текст шорткода[/foo]. По умолчанию: ''

$tag(строка) -Тег шорткода. Может пригодится для передачи в доп. функции. Пр: если шорткод - [foo], то тег будет - foo. По умолчанию: текущий тег

#### Полезные сайты
<https://codex.wordpress.org/Написание_плагина>

<https://wp-kama.ru/> - полезный сайт по wordpress, содержит статьи по веб-разработке преимущественно по WordPress, готовые функции и классы для WordPress, большая коллекция встроенных функции WordPress на русском, с примерами, список со всеми функциями и хуками WordPress.

<https://habrahabr.ru/company/dataart/blog/265245/> - cоздание шорткодов в WordPress

<http://easy-code.ru/lesson/custom-wordpress-widgets> - создание виджета. (ВАЖНО: В передаче идентификатора виджета в родительский конструктор не должно быть точек! Это значение пишется в БД и конфиг потом не прочитается)


### Публикация плагина

Подробное описание подготовки плагина к публикации и добавления плагина в репозиторий находится на сайте:
<http://www.wordpressplugins.ru/rasnoe/adding-plugin-to-wordpress-org.html>

Важные моменты:

При отправлении плагина на ревью: указываемое название плагина будет использовано как имя директории плагина и отображаться в ссылке на него, поэтому не следует использовать точки - они будут удалены. Это название нельзя будет поменять в дальнейшем.

При добавлении плагина в SVN репозиторий следует добавить в папку assets скриншоты, иконки и баннер для плагина.

По адресу https://wordpress.org/plugins/com-netvoxlab-ownradio/admin/ доступна админка плагина, где можно добавить пользователей, которым позволено изменять плагин через SVN.
Доступ к SVN репозиторию осуществляется под учетной записью сайта wordpress.org

Ниже приведены ссылки на ресурсы, которые помогут при написании и публикации плагина.

WordPress Plugin Directory Guidelines:
<https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/>

Using Subversion with the WordPress Plugin Directory:
<https://developer.wordpress.org/plugins/wordpress-org/how-to-use-subversion/>

FAQ about the WordPress Plugin Directory:
<https://developer.wordpress.org/plugins/wordpress-org/plugin-developer-faq/>

WordPress Plugin Directory readme.txt standard:
<https://wordpress.org/plugins/about/readme.txt>

A readme.txt validator:
<https://wordpress.org/plugins/about/validator/>

Plugin Assets (header images etc):
<https://developer.wordpress.org/plugins/wordpress-org/plugin-assets/>