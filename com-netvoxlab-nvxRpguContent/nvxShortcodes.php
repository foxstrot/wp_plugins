<?php	
class nvxRpguContentShortcodes {
	//Флаг присутствия шорткода на странице
	static $add_script;
	
	static function init () {		
		add_shortcode('com.netvoxlab.nvxRpguContent.nvxSearchService', array(__CLASS__, 'nvxSearchService_shortcode'));
		add_shortcode('com.netvoxlab.nvxRpguContent.nvxAuth', array(__CLASS__, 'nvxAuth_shortcode'));
		add_shortcode('com.netvoxlab.nvxRpguContent.nvxReception', array(__CLASS__, 'nvxReception_shortcode'));
		add_shortcode('com.netvoxlab.nvxRpguContent.nvxServiceInfo', array(__CLASS__, 'nvxServiceInfo_shortcode'));
		add_shortcode('com.netvoxlab.nvxRpguContent.nvxDepartmentInfo', array(__CLASS__, 'nvxDepartmentInfo_shortcode'));
		add_shortcode('com.netvoxlab.nvxRpguContent.nvxCategory', array(__CLASS__, 'nvxCategory_shortcode'));
		add_shortcode('com.netvoxlab.nvxRpguContent.nvxCategoryServiceList', array(__CLASS__, 'nvxCategoryServiceList_shortcode'));
		add_shortcode('com.netvoxlab.nvxRpguContent.nvxDepartments', array(__CLASS__, 'nvxDepartments_shortcode'));
		add_shortcode('com.netvoxlab.nvxRpguContent.nvxLifeSituations', array(__CLASS__, 'nvxLifeSituations_shortcode'));
		add_shortcode('com.netvoxlab.nvxRpguContent.nvxMfcInfo', array(__CLASS__, 'nvxMfcInfo_shortcode'));
		add_shortcode('com.netvoxlab.nvxRpguContent.nvxPaymentsCommon', array(__CLASS__, 'nvxPaymentsCommon_shortcode'));
		add_shortcode('com.netvoxlab.nvxRpguContent.nvxPopularService', array(__CLASS__, 'nvxPopularService_shortcode'));
		add_shortcode('com.netvoxlab.nvxRpguContent.nvxRequestAttachment', array(__CLASS__, 'nvxRequestAttachment_shortcode'));
		add_shortcode('com.netvoxlab.nvxRpguContent.nvxRequestForm', array(__CLASS__, 'nvxRequestForm_shortcode'));
		add_shortcode('com.netvoxlab.nvxRpguContent.nvxRequestInfo', array(__CLASS__, 'nvxRequestInfo_shortcode'));
		add_shortcode('com.netvoxlab.nvxRpguContent.nvxServiceList', array(__CLASS__, 'nvxServiceList_shortcode'));
		add_shortcode('com.netvoxlab.nvxRpguContent.nvxLkFullPage', array(__CLASS__, 'nvxLkFullPage_shortcode'));
		add_shortcode('com.netvoxlab.nvxRpguContent.nvxTreatment', array(__CLASS__, 'nvxTreatment_shortcode'));
		add_shortcode('com.netvoxlab.nvxRpguContent.nvxTripleCatalog', array(__CLASS__, 'nvxTripleCatalog_shortcode'));	
		add_shortcode('com.netvoxlab.nvxRpguContent.esbProblemRequests', array(__CLASS__, 'esbProblemRequests_shortcode'));
	
		add_action('init', array(__CLASS__, 'register_script'));
		add_action('wp_footer', array(__CLASS__, 'print_script'));
		//add_filter('the_content', array(__CLASS__,'nvxRpguContentAdminFooterText'));
	}
	
	//Импортируем бандл с вьхами
	static function nvxRpguContentAdminFooterText($content) {
		if (!self::$add_script) 
			$content;
		include_once($GLOBALS['nvxRpguContentUriPluginDir'].'Parts/View/commonHtml.0.1.35.html');
		return $content;
	}

	static function register_script() {
		wp_register_script('requireJs', nvxRpguContentUri . 'Portal/script/requirejs/require.min.js', [], false, true);
		wp_register_script('requireJsConfig', nvxRpguContentUri . 'Portal/script/requirejs-config.js', [], false, true);
		wp_register_script('partsBundle', nvxRpguContentUri . 'Parts/Script/parts.bundle.0.1.35.1.js', [], false, true);
		wp_register_style('nvxrpgucontentwpcss', nvxRpguContentUri . 'Parts/Style/wp.css', [], false, 'all');
		wp_register_style('nvxrpgucontentwpselectcss', nvxRpguContentUri . 'Parts/Style/wpselect.css', [], false, 'all');
	}

	static function print_script() {
		if (!self::$add_script) 
			return;
		include_once($GLOBALS['nvxRpguContentUriPluginDir'].'Parts/View/commonHtml.0.1.35.html');
		
		wp_enqueue_script('requireJs', nvxRpguContentUri . 'Portal/script/requirejs/require.min.js' );
		wp_enqueue_script('requireJsConfig', nvxRpguContentUri . 'Portal/script/requirejs-config.js' );
		wp_enqueue_script('partsBundle', nvxRpguContentUri . 'Parts/Script/parts.bundle.0.1.35.1.js' );
		wp_enqueue_style('nvxrpgucontentwpcss', nvxRpguContentUri . 'Parts/Style/wp.css');
		wp_enqueue_style('nvxrpgucontentwpselectcss', nvxRpguContentUri . 'Parts/Style/wpselect.css');
	}

	//Страница с поиском услуг
	static function nvxSearchService_shortcode ($atts, $content = null) {
		self::$add_script = true;
		return $content . '<div id="nvxSearchService" class="nvxRpguContentStyleBlock">
						<div data-bind="if: serviceFilterModel">
							<div data-bind="template: { name: \'Nvx.ReDoc.StateStructureServiceModule/Service/View/groupedPagerTemplate.tmpl.html\', data: serviceFilterModel }"></div>
						</div>
					</div>';
    }
	
	//Авторизация
	static function nvxAuth_shortcode ($atts, $content = null) {
		self::$add_script = true;
		return $content .'<div id="nvxAuth" class="nvxRpguContentStyleBlock">
						<div data-bind="ifnot: userLoggedStatus">
							<a data-bind="click: click" class="btn-link pull-right"><i class="icon-key_new"></i><span data-bind="text: loginButtonTitle"></span></a>
						</div>
						<div data-bind="if: userLoggedStatus">
							<a href="/cabinet/" data-bind="text: currentUserName" class="btn-link pull-right"></a>		
						</div>							
						<input id="userLoggedStatus" type="hidden" data-bind="value: userLoggedStatus">
					</div>';
    }
	
	//запись на приём
	static function nvxReception_shortcode ($atts, $content = null) {
		self::$add_script = true;
		return $content . '<div id="nvxReception" class="nvxRpguContentStyleBlock">	
						<div class="paddings reception-redoc-form">
							<h2 class="declinePlate m-top" data-bind="visible: userInfo() == null">Для записи на приём вы должны быть авторизованы</h2>							
							<div class="reception-selected-pave" data-bind="click: goLevel1, if: place">
								<span>Организация: <span data-bind="text: place().name"></span></span>
							</div>
							<div class="reception-selected-pave" data-bind="click: goLevel2, if: service">
								<span>Направление: <span data-bind="text: service().name"></span></span>
							</div>						
							<div class="reception-selected-pave" data-bind="click: goLevel3, if: specialist">
								<span>Специалист: <span data-bind="text: specialist().name"></span></span>
							</div>
							<div class="reception-selected-pave" data-bind="click: goLevel3, if: date">
								<span>Дата приёма: <span data-bind="text: date().name"></span></span>
							</div>
							<div class="reception-selected-pave" data-bind="click: goLevel4, if: position">
								<span>Время приёма: <span data-bind="text: position().name"></span></span>
							</div>
							<p class="m-top-dbl" data-bind="html: commonInfoString, visible: commonInfoString() != null"></p>
							<div data-bind="template: { name: templateId, data: templateViewModel }"></div>
						</div>
					</div>';
    }
	
	//Информация по услуге
	static function nvxServiceInfo_shortcode ($atts, $content = null) {
		self::$add_script = true;
		return $content.
			'<div id="nvxServiceInfo" class="nvxRpguContentStyleBlock">
				<!--ko if: pageTitle-->
				<h1 data-bind="text: pageTitle, css: pageIcon()"></h1>
				<!--/ko-->
				<!--ko template: { name: templateId, data: templateModel }--><!--/ko-->
			</div>';
	}

	//Информация по ведомству
	static function nvxDepartmentInfo_shortcode ($atts, $content = null) {
		self::$add_script = true;
		return $content.
			'<div id="nvxDepartmentInfo" class="nvxRpguContentStyleBlock">
				<!--ko if: pageTitle-->
				<h1 data-bind="text: pageTitle, css: pageIcon()"></h1>
				<!--/ko-->
				<!--ko template: { name: templateId, data: templateModel }--><!--/ko-->
			</div>';
	}
	
	//Отчёты шины
	static function esbProblemRequests_shortcode ($atts, $content = null) {
		self::$add_script = true;
		return $content.
			'<div id="esbProblemRequests" class="nvxRpguContentStyleBlock">
				<div class="textRow" data-bind="visible: showAllCount">
					<p>Всего необработанных запросов<span data-bind="text: allCount"></span></p>
				</div>
				<div class="textRow" data-bind="visible: showCurCount">
					<p>Отображены данные по первым <span data-bind="text: currentCount"></span> неотвеченным заявкам</p>
				</div>
				<div class="textRow" data-bind="visible: showLoading">
					<p>Идет загрузка данных</p>
				</div>
				<!-- ko if: list -->
				<div data-bind="visible: list().length > 0">
					<table>
						<thead>
							<tr>
								<th>ID</th>
								<th>Дата</th>
								<th>Кто запросил</th>
								<th>У кого запросили</th>
								<th>Номер заявки</th>
							</tr>
						</thead>
						<tbody data-bind="foreach: list">
							<tr>
								<td data-bind="text: requestId"></td>
								<td data-bind="text: receiveDate"></td>
								<td data-bind="text: sender"></td>
								<td data-bind="text: recipient"></td>
								<td data-bind="text: number"></td>
							</tr>
						</tbody>
					</table>
				</div>
				<!-- /ko -->
			</div>';
	}
	
	//Категории услуг
	static function nvxCategory_shortcode ($atts, $content = null) {
		self::$add_script = true;
		return $content.'<div id="nvxCategory" class="nvxRpguContentStyleBlock">
				<ul class="itemsList" data-bind="foreach: cats">
					<li>
						<a data-bind="text: title, attr: { \'href\': link }"></a>
					</li>
				</ul>
			</div>';
    }
	
	//Услуги для выбранной категории
	static function nvxCategoryServiceList_shortcode ($atts, $content = null) {
		self::$add_script = true;
		return $content.'<div id="nvxCategoryServiceList" class="nvxRpguContentStyleBlock">
				<h2 data-bind="text: title"></h2>				
				<a data-bind="click: goCatalog" class="btn primary larr"><span></span>Вернуться в каталог</a>
				<div class="brdr"></div>				
				<ul class="list">
					<!-- ko foreach: services -->
					<li class="category-service-item">
						<img src="<?=SITE_TEMPLATE_PATH?>/../rpgu-main/Parts/Img/service-link-list-item.png" data-bind="click: $parent.goPassport"/>
						<a href="#" data-bind="click: $parent.goPassport">
							<span data-bind="text: name"></span>
							<span class=\'icon-arrow-right\'></span>
						</a>
					</li>
					<!-- /ko -->
				</ul>
				<div class="btn primary" data-bind="visible: loadMoreVisible, click: loadList">Показать ещё</div>
			</div>';
    }
	
	//Перечень ведомств
	static function nvxDepartments_shortcode ($atts, $content = null) {
		self::$add_script = true;
		return $content.'<div id="nvxDepartments" class="nvxRpguContentStyleBlock">
				<div class="departments">
					<div data-bind="with: territorialDepartments">
						<!--ko if: subDepartments.length > 0-->
						<a class="itm spoiler" data-bind="css: { hasSubs: subDepartments.length > 0 }, slideArrowBefore2: { \'contentClass\': \'spoilerContent\', \'hideClass\': \'hide\' }">
							Территориальный орган Федеральных органов исполнительной власти
							<span class="spoiler" data-bind="slideArrowBefore2: { \'contentClass\': \'spoilerContent\', \'hideClass\': \'hide\' }"></span>
						</a>
						<ul class="spoilerContent" data-bind="foreach: subDepartments, visible: renderChildren">
							<li data-bind="template: { name: \'Nvx/departmentsTreeItemView.tmpl.html\', data: $data }"></li>
						</ul>
						<!--/ko-->
					</div>
					<div data-bind="with: regionalDepartments">
						<!--ko if: subDepartments.length > 0-->
						<a class="itm" data-bind="css: { hasSubs: subDepartments.length > 0 }">
							Региональные органы исполнительной власти
							<span class="spoiler" data-bind="slideArrowBefore2: { \'contentClass\': \'spoilerContent\', \'hideClass\': \'hide\' }"></span>
						</a>
						<ul class="spoilerContent" data-bind="foreach: subDepartments, visible: renderChildren">
							<li data-bind="template: { name: \'Nvx/departmentsTreeItemView.tmpl.html\', data: $data }"></li>
						</ul>
						<!--/ko-->
					</div>
					<div data-bind="with: municipalDepartments">
						<!--ko if: subDepartments.length > 0-->
						<a class="itm" data-bind="css: { hasSubs: subDepartments.length > 0 }">
							Органы местного самоуправления
							<span class="spoiler" data-bind="slideArrowBefore2: { \'contentClass\': \'spoilerContent\', \'hideClass\': \'hide\' }"></span>
						</a>
						<ul class="spoilerContent" data-bind="foreach: subDepartments, visible: renderChildren">
							<li data-bind="template: { name: \'Nvx/departmentsTreeItemView.tmpl.html\', data: $data }"></li>
						</ul>
						<!--/ko-->
					</div>
				</div>
			</div>';
    }
	
	//Жизненные ситуации
	static function nvxLifeSituations_shortcode ($atts, $content = null) {
		self::$add_script = true;
		return $content.'<div id="nvxLifeSituations" class="nvxRpguContentStyleBlock">
				<div>
					<div class="block categoriesServices" data-bind="template: { name: \'nvx/listBlockView.tmpl.html\', data: serviceCategoriesBlock }"></div>
				</div>
			</div>';
    }
	
	//Информация по МФЦ
	static function nvxMfcInfo_shortcode ($atts, $content = null) {
		self::$add_script = true;
		return $content.'<div id="nvxMfcInfo" class="nvxRpguContentStyleBlock">
				<!--ko if: pageTitle-->
				<h1 data-bind="text: pageTitle, css: pageIcon()"></h1>
				<!--/ko-->
				<!--ko template: { name: templateId, data: templateModel }--><!--/ko-->
			</div>';		
    }

	//Страница с функционалом оплаты
	static function nvxPaymentsCommon_shortcode ($atts, $content = null) {
		self::$add_script = true;
		return $content.'<div id="nvxPaymentsCommon" class="nvxRpguContentStyleBlock">
				<nav class="nav-tabset tabset">
					<ul>
						<!-- ko if: servicePayViewModelVisible -->
						<li class="active" data-bind="click: clicktab1, css: { \'active\': tab1 }"><a href="#tab1">Поиск услуг</a></li>
						<li data-bind="click: clicktab2, css: { \'active\': tab2 }"><a href="#tab2">Мои счета</a></li>
						<!-- /ko -->
						<!-- ko if: parking31CommonViewModelVisible -->
						<li data-bind="click: clicktab3, css: { \'active\': tab3 }"><a href="#tab3">Оплата абонемента</a></li>
						<li data-bind="click: clicktab4, css: { \'active\': tab4 }"><a href="#tab4">Оплата парковки</a></li>
						<!-- /ko -->
					</ul>
				</nav>

				<!-- ko if: housingBlockActive -->
				<div class="tab" data-bind="template: { name: \'Nvx.ReDoc.Rpgu.HousingUtilities/View/servicePayView.tmpl.html\', data: servicePayViewModel, if: servicePayViewModel }"></div>
				<!-- /ko -->
				<!-- ko if: parking31BlockVisible -->
				<div class="tab" data-bind="template: { name: \'Nvx.ReDoc.Rpgu.Parking31/View/parkingCommonView.tmpl.html\', data: parking31CommonViewModel, if: parking31CommonViewModel }"></div>
				<!-- /ko -->
			</div>';		
    }
	
	//Популярные услуги
	static function nvxPopularService_shortcode ($atts, $content = null) {
		self::$add_script = true;		
		return $content.'<div id="nvxPopularService" class="nvxRpguContentStyleBlock">
				<div>
					<div class="block" data-bind="template: { name: \'nvx/listBlockView.tmpl.html\', data: popularServicesBlock }"></div>
				</div>
			</div>';
	}

	//Форма прикладывания вложений заявления
	static function nvxRequestAttachment_shortcode ($atts, $content = null) {
		self::$add_script = true;
		return $content.'<div id="nvxRequestAttachment" class="nvxRpguContentStyleBlock">
				<h1 data-bind="text: pageTitle"></h1>
				<!-- ko if: backText -->
				<a class="btn primary button b-back" data-bind="attr: {href: backUrl }, text: backText" rel="back"></a>
				<!-- /ko -->
				<div class="paddings" data-bind="css: { \'hasBack\': backText }">
					<!-- ko with: requestInfoViewModel -->
					<!-- ko template: { name: \'Nvx.ReDoc.Rpgu.PortalModule/Cabinet/View/request/requestGeneralInfo.tmpl.html\' } -->
					<!-- /ko -->
					<!-- /ko -->
					<div>
						<!-- ko if: visibleEditButton -->
						<div class="btn button b-solid" data-bind="click: editButtonClick">Редактировать</div>
						<!-- /ko -->
						<!-- ko if: visibleRemoveDraftButton -->
						<div class="btn button b-solid" data-bind="click: removeDraftClick, text: removeDraftTitle"></div>
						<!-- /ko -->
					</div>
					<div class="m-top-dbl" data-bind="template: { name: templateId, data: templateViewModel, if: templateViewModel }"></div>
					<!-- ko if: useNextButton -->
					<div class="btn button b-solid withIcon icon-arrow-right-white b-modal" data-bind="click: nextAction, text: nextText"></div>
					<!-- /ko -->
				</div>
			</div>';
	}
	
	//Динамическая форма заявления
	static function nvxRequestForm_shortcode ($atts, $content = null) {
		self::$add_script = true;
		return $content.'<div id="nvxRequestForm" class="nvxRpguContentStyleBlock">
				<h1 data-bind="text: pageTitle"></h1>
				<!-- ko if: backText -->
				<a class="btn primary button b-back" data-bind="attr: {href: backUrl }, text: backText" rel="back"></a>
				<!-- /ko -->
				<div class="paddings" data-bind="css: { \'hasBack\': backText }">
					<!-- ko with: requestInfoViewModel -->
					<!-- ko template: { name: \'Nvx.ReDoc.Rpgu.PortalModule/Cabinet/View/request/requestGeneralInfo.tmpl.html\' } -->
					<!-- /ko -->
					<!-- /ko -->
					<div>
						<!-- ko if: visibleEditButton -->
						<div class="btn button b-solid" data-bind="click: editButtonClick">Редактировать</div>
						<!-- /ko -->
						<!-- ko if: visibleRemoveDraftButton -->
						<div class="btn button b-solid" data-bind="click: removeDraftClick, text: removeDraftTitle"></div>
						<!-- /ko -->
					</div>
					<div class="m-top-dbl" data-bind="template: { name: templateId, data: templateViewModel, if: templateViewModel }"></div>
					<!-- ko if: useNextButton -->
					<div class="btn primary b-solid b-modal" data-bind="click: nextAction, text: nextText"></div>
					<!-- /ko -->
				</div>
			</div>';
	}

	//Информация о заявлении
	static function nvxRequestInfo_shortcode ($atts, $content = null) {
		self::$add_script = true;
		return $content.'<div id="nvxRequestInfo" class="nvxRpguContentStyleBlock">
				<h1>Информация о заявлении</h1>
				<div class="paddings">
				<!-- ko template: { name: \'Nvx.ReDoc.Rpgu.PortalModule/Cabinet/View/request/requestGeneralInfo.tmpl.html\' } --><!-- /ko -->
				</div>
				<div class="container tabs-area">
				
					<nav class="nav-tabset tabset">
						<ul> 
							<li class="active" data-bind="event: { click: tabs.formPreview.onclick }, css: { \'active\': tabs.formPreview.active }">
								<a href="#tab1" data-bind="text: tabs.formPreview.title">Заявление</a>
							</li>
							<li data-bind="event: { click: tabs.result.onclick }, css: { \'active\': tabs.result.active }">
								<a href="#tab2" data-bind="text: tabs.result.title">Результаты</a>
							</li>
							
							<li data-bind="event: { click: tabs.changes.onclick }, css: { \'active\': tabs.changes.active }">
								<a href="#tab3" data-bind="text: tabs.changes.title">История</a>
							</li>
							<li data-bind="event: { click: tabs.attachments.onclick }, css: { \'active\': tabs.attachments.active }">
								<a href="#tab4" data-bind="text: tabs.attachments.title">Файлы</a>
							</li>				
						</ul>
					</nav>	
					
					<!-- Заявление. -->
					<div class="tab paddings" data-bind="visible: tabs.formPreview.active, template: { name: formPreviewTemplateId, data: formPreviewModel, if: formPreviewModel }"></div>
					<!-- Результат. -->
					<div class="tab tab2tr" data-bind="visible: tabs.result.active , template: { name: \'Nvx.ReDoc.Rpgu.PortalModule/Cabinet/View/request/requestInfoResult.tmpl.html\', data: $data }"></div>
					<!-- История изменений. -->
					<div class="tab tab3tr" data-bind="visible: tabs.changes.active, template: { name: tabs.changes.template, data: requestChangesModel, if: requestChangesModel }"></div>	
					<!-- Файлы. -->
					<div class="tab tab4tr" data-bind="visible: tabs.attachments.active, template: { name: \'Nvx.ReDoc.Rpgu.PortalModule/Cabinet/View/request/requestInfoAttachments.tmpl.html\', data: requestAttachmentsModel, if: requestAttachmentsModel }"></div>
				</div>
			</div>';
	}
	
	//Список категорий с услугами
	static function nvxServiceList_shortcode ($atts, $content = null) {
		self::$add_script = true;
		return $content.'<div id="nvxServiceList" class="nvxRpguContentStyleBlock">
				<!-- ko foreach: cats -->
				<article class="post-tab col-4">
					<header data-bind="click: goCategory">
						<img width="73" height="79" class="ico" alt="icon description" src="<?=SITE_TEMPLATE_PATH?>/../rpgu-main/Parts/Img/nut_arrow.svg">
						<h2><a href="#" data-bind="text: groupTitle"></a></h2>
					</header>
					<ul class="list">
						<!-- ko foreach: list -->
						<li><a href="#" data-bind="html: name + \'<span class=\'icon-arrow-right\'></span>\', click: goPassport"></a></li>
						<!-- /ko -->
					</ul>
					<a class="btn primary" href="#">Все услуги</a>
				</article>
				<!-- /ko -->
				<!-- ko if: cats().length == 0 -->
				<h2>Для заданных критериев услуги отсутствуют</h2>
				<!-- /ko -->
			</div>';
	}

	//Личный кабинет
	static function nvxLkFullPage_shortcode ($atts, $content = null) {
		self::$add_script = true;
		return $content.'<div class="container tabs-area" class="nvxRpguContentStyleBlock">	
			<div id="nvxStartCreateFile"></div>
			<nav class="nav-tabset tabset">
				<ul> 
					<li class="active"><a href="#tab1">Персональная информация</a></li>
					<li><a href="#tab2">Заявления</a></li>
					<li><a href="#tab3">Платежи</a></li>
					<li><a href="#tab4">Жалобы</a></li>
					<li><a href="#tab5">Запись на приём</a></li>
				</ul>
			</nav>
					
			<div>
				<div id="tab1" class="row">
					<div id="nvxCustomerInfo">
						<!-- Информация о заявителе. -->
						<!-- ko if: (isPhysical() && !isIndividual()) -->
						<div data-bind="template: { name: \'Nvx.ReDoc.Rpgu.PortalModule/Cabinet/View/customer/customer.tmpl.html\', data: customerViewModel, if: customerViewModel }"></div>
						<!-- /ko -->
						<!-- ko if: (!isPhysical()) -->
						<div data-bind="template: { name: \'Nvx.ReDoc.Rpgu.PortalModule/Cabinet/View/customer/juridical.tmpl.html\', data: customerViewModel, if: customerViewModel }"></div>
						<!-- /ko -->

						<!-- ko if: (isPhysical() && isIndividual()) -->
						<div data-bind="template: { name: \'Nvx.ReDoc.Rpgu.PortalModule/Cabinet/View/customer/individual.tmpl.html\', data: customerViewModel, if: customerViewModel }"></div>
						<!-- /ko -->
					</div>
					</div>
				</div>
				<div id="tab2" class="row">
					<div id="nvxRequestList">
						<!--ko if: requestList().length > 0-->
						<table class="table-new">
							<tr class="table-new-header">
								<th>Заявление</th>
								<th class="col-150">Дата подачи</th>
								<th class="col-150">Статус</th>
							</tr>
							<!--ko foreach: requestList-->
							<tr class="table-new-row" data-bind="click: $parent.goFile">
								<td>
									<span data-bind="text: identificator" style="font-weight: bold;"></span>
									<span data-bind="text: title"></span>
								</td>

								<td class="col-150" data-bind="text: createdStr"></td>
								<td class="col-150" data-bind="text: rpguFileStatus">
									<span data-bind="text: rpguFileStatus"></span>
									<!-- ko if: isArchived && status <= 1 -->
									<span>(Архивировано)</span>
									<!-- /ko -->
								</td>
							</tr>
							<!--/ko-->
						</table>
						<!--/ko-->
						<!--ko if: requestList().length == 0-->
						<h2>Заявлений нет</h2>
						<!--/ko-->
					</div>
				</div>
				<div id="tab3" class="row">
					<div id="nvxLkPayments">
						<!--штрафы мвд отсутствуют-->

						<!-- ko if: taxes().length > 0 -->
						<div class="table-new table-admin a paymentBlockLk m-top-dbl">
							<div class="th">
								<span class="col-180">Дата и время</span>
								<span class="col-100">Сумма&nbsp;(р.)</span>
								<span class="col-100">Тип</span>
								<span style="width: 100%; text-align: left;">Статус</span>
							</div>
							<!--ko foreach: taxes -->
							<div>
								<span class="col-180" data-bind="text: breachDateTime, click: $parent.taxWindow"></span>
								<span class="col-100" data-bind="text: decisionSumma, click: $parent.taxWindow"></span>
								<span class="col-100" data-bind="text: penalty, click: $parent.taxWindow"></span>
								<span style="word-break: break-all; width: 100%; text-align: left;" data-bind="text: executionState, click: $parent.taxWindow"></span>
								<!-- ko if: mvdServiceCode != null && roskaznaIn != \'1\'-->
								<div>
									<div class="btn b-solid" data-bind="event: { click: $parent.paythis }">
										Оплатить
									</div>
								</div>
								<!-- /ko -->
							</div>
							<!-- /ko -->
						</div>
						<!-- /ko -->

						<!-- ko if: savedData().length > 0 -->
						<h1>Список сохранённых услуг</h1>
						<div class="table-new table-admin a paymentBlockLk">
							<div class="th">
								<span>Поставщик и наименование услуги</span>
								<span>Данные</span>
							</div>
							<!-- ko foreach: savedData -->
							<div>
								<span data-bind="text: $data[0]"></span>
								<span data-bind="text: $data[1]"></span>
							</div>
							<!-- /ko -->
						</div>
						<!-- /ko -->

						<!-- ko if: paymentsList().length > 0-->
						<h1>Список платежей</h1>
						<div class="table-new table-admin a paymentBlockLk">
							<div class="th">
								<span class="col-100">Статус</span>
								<span class="col-100">Дата</span>
								<span class="col-100">Сумма&nbsp;(р.)</span>
								<span>Идентификатор плательщика</span>
								<span>Назначение платежа</span>
								<span class="col-100">Файлы</span>
							</div>
							<!--ko foreach: paymentsList-->
							<div>
								<span class="col-100" data-bind="click: goLink">
									<span data-bind="css: statusCss"></span>
								</span>
								<span class="col-100" data-bind="text: created, click: goLink"></span>
								<span class="col-100" data-bind="text: amount, click: goLink"></span>
								<span style="word-break: break-all;" data-bind="text: payerIdentifier, click: goLink"></span>
								<span style="word-break: break-all;" data-bind="text: narrative, click: goLink"></span>
								<span class="col-100">
									<!-- ko if: file1Exist-->
									<a data-bind="attr: { href: getfile1 }">Квитанция</a>
									<!-- /ko-->
									<!-- ko if: file2Exist-->
									<br/>
									<a data-bind="attr: { href: getfile2 }">Чек</a>
									<!-- /ko-->
								</span>
							</div>
							<!-- /ko -->
						</div>
						<!-- /ko -->

						<div class="btn b-solid m-lft m-top m-btm" data-bind="click: getPayments">
							Запросить платежи ИПШ
						</div>

						<!-- ko if: paymentsIpsh().length > 0 -->
						<div class="table-new table-admin a paymentBlockLk">
							<div class="th">
								<span class="col-100">Статус</span>
								<span class="col-100">Дата</span>
								<span class="col-100">Сумма&nbsp;(р.)</span>
								<span>Наименование платежа</span>
								<span class="col-100">Файлы</span>
							</div>
							<!--ko foreach: paymentsIpsh-->
							<div>
								<span class="col-100" data-bind="click: $parent.paymentWindow">
									<span data-bind="text: status.name"></span>
								</span>
								<span class="col-100" data-bind="text: createTime, click: $parent.paymentWindow"></span>
								<span class="col-100" data-bind="text: amount, click: $parent.paymentWindow"></span>
								<span style="word-break: break-all;" data-bind="text: paymentName, click: $parent.paymentWindow"></span>
								<span class="col-100">
									<!-- ko if: paymentHref-->
									<a data-bind="attr: { href: paymentHref }" target="blank">Чек</a>
									<!-- /ko-->
								</span>
							</div>
							<!-- /ko -->
						</div>
						<!-- /ko -->

						<!-- ko if: errors-->
						<h2 class="declinePlate withIcon m-top-hlf" data-bind="text: errors"></h2>
						<!-- /ko -->

						<div data-bind="template: { name: \'Nvx.ReDoc.WebInterfaceModule/View/modalDialog.tmpl.html\', data: taxModalDialog }"></div>
					</div>
				</div>
				<div id="tab4" class="row">
					<div id="nvxLkComplaint">
						<!--ko if: complaintList().length > 0-->
						<div class="table-new table-admin a">
							<div class="th noa">
								<span class="col-140">Дата подачи</span>
								<span class="col-200">Номер</span>
								<span>Ведомство</span>
								<span class="col-245">Статус</span>
							</div>
							<!--ko foreach: complaintList-->
							<a data-bind="attr: { href: fileLink }">
								<span class="col-140" data-bind="text: date"></span>
								<span class="col-200" data-bind="text: number"></span>
								<span data-bind="text: oiv"></span>
								<span class="col-245" data-bind="text: status"></span>
							</a>
							<!--/ko-->
						</div>
						<!--/ko-->
						<!--ko if: complaintList().length == 0-->
						<h2 class="declinePlate withIcon m-top-hlf">Жалоб нет</h2>
						<!--/ko-->
					</div>
				</div>
				<div id="tab5" class="row">
					<div id="nvxLkReception">
						<div class="reception-redoc-form paddings">
							<p class="m-top-dbl" data-bind="text: commonInfoString, visible: commonInfoString() != null"></p>
							<!-- ko if: tickets().length > 0 -->
							<div class="reception-ticket-container">
								<!-- ko foreach: tickets -->
								<div class="reception-ticket-hrz m-btm">
									<div class="reception-ticket-hrz-1">
										<span data-bind="dateFormat: ticketDateTime, format: \'Simple\'"></span>
										<br/>
										<!-- ko if: status -->
										<span class="opa">Статус: </span><span data-bind="text: status.recName"></span>
										<!-- /ko -->
									</div>
									<div class="reception-ticket-hrz-2">
										<!-- ko if: service -->
										<span class="opa">Услуга: </span><span data-bind="text: service.name"></span>
										<br/>
										<!-- /ko -->
										<!-- ko if: specialist -->
										<span class="opa">Специалист: </span><span data-bind="text: specialist.name"></span>
										<!-- /ko -->
									</div>
									<div class="reception-ticket-hrz-4 button btn primary" data-bind="click: $parent.printTicket">Печать</div>
									<div class="reception-ticket-hrz-3 button btn b-delete" data-bind="click: $parent.cancelReception, visible: canCancel">Отменить запись</div>
								</div>
								<!-- /ko -->
							</div>
							<!-- /ko -->
						</div>
					</div>
				</div>
			</div>
		</div>';
	}
	
	//Обращение
	static function nvxTreatment_shortcode ($atts, $content = null) {
		self::$add_script = true;
		return $content.'<div id="nvxTreatment" class="nvxRpguContentStyleBlock">
				<div data-bind="template: { name: templateId, data: templateViewModel, if: templateViewModel }"/>
			</div>';		
    }

	//Каталог тройной
	static function nvxTripleCatalog_shortcode ($atts, $content = null) {
		self::$add_script = true;
		return $content.'<div id="nvxTripleCatalog" class="nvxRpguContentStyleBlock">
				<!--div id="nvxSearchPanel"-->
					<form class="search-area static" data-bind="submit: goSearch ">
						<div class="container">
							<div class="field-holder">
								<input type="search" class="form-control" placeholder="Введите название услуги" data-bind="value: searchText">
								<button class="btn" type="submit" data-bind="click: goSearch"><i class="icon-zoom_white_desk"></i></button>
							</div>
						</div>
						<span class="filter-itm">
							<label class="filter-label"><input type="checkbox" data-bind="checked: onlyOnline"><span> Только электронные услуги</span></label>
						</span>
					</form>
				<!--/div-->

				<main id="main">
					<div class="container tabs-area">
						
						<!-- nav-tabs -->
						<nav class="nav-tabset tabset">
							<ul> 
								<li class="active"><a href="#tab1">Категории услуг</a></li>
								<li><a href="#tab2">Органы власти</a></li>
								<li><a href="#tab3">Жизненные ситуации <span class="tag-new">Новинка</span></a></li>
							</ul>
						</nav>
						
						<!-- tabs-holder -->
						<div class="tabs-holder">
							<div id="tab1" class="row" data-bind="template: { name: \'nvxServiceList.tmpl.html\', data: ServiceList }"></div>
							<div id="tab2" class="row" data-bind="template: { name: \'nvxDepartments.tmpl.html\', data: Departments }"></div>
							<div id="tab3" class="row" data-bind="template: { name: \'nvxLifeSituations.tmpl.html\', data: LifeSituations }"></div>
						</div>
					</div>
				</main>
			</div>';		
    }
}
?>