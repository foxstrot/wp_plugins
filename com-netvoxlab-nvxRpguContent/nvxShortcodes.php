<?php
	function nvxSearchService_shortcode ($atts, $content = null)
    {
		$nvxSearchService = '<div id="nvxSearchService">
						<div data-bind="if: serviceFilterModel">
							<div data-bind="template: { name: \'Nvx.ReDoc.StateStructureServiceModule/Service/View/groupedPagerTemplate.tmpl.html\', data: serviceFilterModel }"></div>
						</div>
					</div>';
		return $content . $nvxSearchService ;
    }
	
   function nvxAuth_shortcode ($atts, $content = null)
    {
		$nvxAuth = '<div id="nvxAuth">
						<div data-bind="ifnot: userLoggedStatus">
							<a data-bind="click: click" class="btn-link pull-right"><i class="icon-key_new"></i><span data-bind="text: loginButtonTitle"></span></a>
						</div>
						<div data-bind="if: userLoggedStatus">
							<a href="/cabinet/" data-bind="text: currentUserName" class="btn-link pull-right"></a>		
						</div>							
						<input id="userLoggedStatus" type="hidden" data-bind="value: userLoggedStatus">
					</div>';
		return $content . $nvxAuth ;
    }
	
   function nvxReception_shortcode ($atts, $content = null)
    {
		$nvxReception = '<div id="nvxReception">	
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
		return $content . $nvxReception ;
    }
	
	function nvxServiceInfo_shortcode ($atts, $content = null) {
		return $content.
			'<div id="nvxServiceInfo">
				<!--ko if: pageTitle-->
				<h1 data-bind="text: pageTitle, css: pageIcon()"></h1>
				<!--/ko-->
				<!--ko template: { name: templateId, data: templateModel }--><!--/ko-->
			</div>';
	}

	function nvxDepartmentInfo_shortcode ($atts, $content = null) {
		return $content.
			'<div id="nvxDepartmentInfo">
				<!--ko if: pageTitle-->
				<h1 data-bind="text: pageTitle, css: pageIcon()"></h1>
				<!--/ko-->
				<!--ko template: { name: templateId, data: templateModel }--><!--/ko-->
			</div>';
	}
	
	add_shortcode('com.netvoxlab.nvxRpguContent.nvxSearchService', 'nvxSearchService_shortcode');
	add_shortcode('com.netvoxlab.nvxRpguContent.nvxAuth', 'nvxAuth_shortcode');
	add_shortcode('com.netvoxlab.nvxRpguContent.nvxReception', 'nvxReception_shortcode');
	add_shortcode('com.netvoxlab.nvxRpguContent.nvxServiceInfo', 'nvxServiceInfo_shortcode');
	add_shortcode('com.netvoxlab.nvxRpguContent.nvxDepartmentInfo', 'nvxDepartmentInfo_shortcode');
?>