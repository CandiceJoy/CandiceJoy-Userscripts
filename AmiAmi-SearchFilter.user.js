// ==UserScript==
// @name         AmiAmi Search Filter
// @namespace    http://candicejoy.com/
// @version      1.1
// @description  Search assistant for AmiAmi
// @author       CandiceJoy
// @match        https://www.amiami.com/eng/search/list/*
// @icon         https://www.google.com/s2/favicons?domain=amiami.com
// @grant              GM_getValue
// @grant              GM_setValue
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @require https://openuserjs.org/src/libs/sizzle/GM_config.js
// @downloadURL https://cdn.jsdelivr.net/gh/CandiceJoy/CandiceJoy-Userscripts/AmiAmi-SearchFilter.user.js
// @supportURL https://github.com/CandiceJoy/CandiceJoy-Userscripts/issues
// @run-at document-idle
// ==/UserScript==
/* globals GM_config */
"use strict";
/*
 Condition Rank of the products.

 A: Item is sealed and is unopened or appears to be unopened.
 A-: Item is not sealed but appears to be unopened.
 B+: Item has been opened but no damage is visible. All bundled items are included.
 B: Item has been opened and minor dirt or damage is visible. All bundled items are included.
 C: Opened item with conspicuous damage. Sub parts may be missing.
 J: Main item or main parts are missing, severely damaged, and/or having problem with operation.

 -Condition Ranking for Package

 A: No damage to the box is visible.
 B: Some damage to the box is visible.
 C: Box is clearly damaged.
 N: No box/packaging is included. (item is loose)
 */
// !!!!!!!include ../libraries/config.js
(function()
{
	const itemConditions = ["A", "A-", "B+", "B", "C", "J"];
	const boxConditions = ["A", "B", "C", "N"];
	let configDoc;
	GM_config.init({
		               'id': 'amiami-search-filter', 'title': "AmiAmi Search Filter Config", 'fields': // Fields object
			{
				'currency'                    : // This is the id of the field
					{
						'label': 'Currency (3 letters): ', 'type': 'text', 'size': '3', 'default': 'usd' // Default value if user doesn't change it
					}, 'allowedItemConditions': // This is the id of the field
					{
						'label'  : 'Lowest Allowed Item Condition: ', 'type': 'select', 'options': itemConditions,
						'default': 'B' // Default value if user doesn't change it
					}, 'allowedBoxConditions' : // This is the id of the field
					{
						'label'  : 'Lowest Allowed Box Condition: ', 'type': 'select', 'options': boxConditions,
						'default': 'B' // Default value if user doesn't change it
					}, 'priceThreshold'       : // This is the id of the field
					{
						'label': 'Hide items above this price (JPY): ', 'type': 'int', 'default': '10000' // Default value if user doesn't change it
					}, 'highlightPrice'       : // This is the id of the field
					{
						'label'  : 'Highlight items below or equal to this price (JPY): ', 'type': 'int',
						'default': '5000' // Default value if user doesn't change it
					}, 'exclude'              : // This is the id of the field
					{
						'label': 'List of search terms to hide (one per line): ', 'type': 'textarea', 'default': '' // Default value if user doesn't change it
					}, 'dontExclude'          : // This is the id of the field
					{
						'label': 'List of search terms to exclude from price and condition filters (one per line): ',
						'type' : 'textarea', 'default': '' // Default value if user doesn't change it
					}
			}, 'events'    : {
			'init'   : function()
			{
			}, 'open': function(doc)
			{
				configDoc = doc;
				$(configDoc).find("#amiami-search-filter_field_currency").attr("maxlength", "3");
				$(configDoc).find("#amiami-search-filter_field_exclude").attr("cols", "20");
				$(configDoc).find("#amiami-search-filter_field_dontExclude").attr("cols", "20");
				$(configDoc).find("textarea").each(function()
				                                   {
					                                   $(this).height($(this)[0].scrollHeight + 20);
				                                   });
			}, 'save': function()
			{
				$(configDoc).find("textarea").each(function()
				                                   {
					                                   $(this).height($(this)[0].scrollHeight + 20);
				                                   });
				if($(configDoc).find("#amiami-search-filter_field_currency").val().length != 3)
				{
					alert("Currency must be 3 letters");
				}
				if(parseInt($(configDoc).find("#amiami-search-filter_field_priceThreshold").val()) >= 50000)
				{
					alert("Price threshold too high");
				}
				if(parseInt($(configDoc).find("#amiami-search-filter_field_highlightPrice").val()) <= 500)
				{
					alert("Highlight price too low");
				}
			}
		}
	               });
	const allowedItemConditions = GM_config.get("allowedItemConditions"); //letters only
	const allowedBoxConditions = GM_config.get("allowedBoxConditions"); //letters only
	const currency = GM_config.get("currency").toLowerCase(); //lowercase, 3 letter
	const priceThreshold = GM_config.get("priceThreshold"); //exclude prices > this (yen)
	const highlightPrice = GM_config.get("highlightPrice"); //highlight prices <= this (yen)
	//Never shows no matter what
	const alwaysExclude = /*["nendoroid", "gundam", "figma"]*/ (GM_config.get("exclude")) ?
		GM_config.get("exclude").split("\n") : [];
	//Shows only if all conditions are met but the price is too high
	const dontExclude = /*["astolfo", "tohsaka", "saber", "altria", "sakurajima", "tamamo", "fate", "mizuhara", "akeno",
	 "kurumi", "gremory", "chizuru", "ikaros", "velvet", "milla", "pyra", "mythra", "claudius",
	 "b-style", "quintessential"]*/ (GM_config.get("dontExclude")) ? GM_config.get("dontExclude").split("\n") : [];
	const itemSelector = ".newly-added-items__item";
	const pagerSelector = ".pager_mb,.pager-list";
	const pagerNumSelector = "li.pager-list__item_num";
	const gcodeSelector = "a";
	const gcodeID = "gcode";
	const itemConditionRegex = new RegExp("ITEM:(.*?)\\/", "id");
	const boxConditionRegex = new RegExp("BOX:(.*?)\\)", "id");
	const orderClosed = "order closed";
	const observerConfig = {
		childList: true, subtree: true, attributes: true
	};
	const observer = new MutationObserver(observerFunc);
	const basePath = window.location.protocol + '//' + window.location.host;

	//const itemNameSelector = ".item-detail__section-title";
	class Item
	{
		constructor(gcode, link)
		{
			this.url = basePath + link;
			this.gcode = gcode;
			$.ajax("https://api.amiami.com/api/v1.0/item?gcode=" + gcode,
			       {dataType: "json", headers: {"x-user-key": "amiami_dev"}})
			 .always(this.setup.bind(this));
		}

		setup(data, textStatus, xhr)
		{
			if(xhr.status != 200)
			{
				console.log("API Call Failed [" + this.gcode + "]");
				return;
			}
			//console.log(data);
			this.item = data.item;
			let item = this.item;
			this.name = item.gname;
			this.jancode = item.jancode;
			this.instock = item.instock_flg > 0;
			this.price = item.price;
			this.buy = item.buy_flg > 0;
			this.preowned = item.condition_flg == 1;
			this.closed = item.order_closed_flg;
			this.resale = item.resale_flg;
			this.scode = item.scode;
			this.mfc = "https://myfigurecollection.net/browse.v4.php?keywords=" + this.jancode;
			this.sname = item.sname;
			this.itemCondition = new RegExp(itemConditionRegex).exec(item.sname)[1];
			this.boxCondition = new RegExp(boxConditionRegex).exec(item.sname)[1];
			let ele = this.element;
			let tags = $(ele).find(
				".newly-added-items__item__tag-list__item:not([style]), .newly-added-items__item__tag-list__item[style='']");
			$.ajax("https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/jpy/" + currency + ".json")
			 .always(function(data)
			         {
				         let conversionFactor = $(data).attr(currency);
				         let newPrice = parseFloat(conversionFactor) * this.price;
				         let formatter = new Intl.NumberFormat('en-US', {
					         style: 'currency', currency: currency.toUpperCase()
				         });
				         this.convertedPrice = formatter.format(newPrice);
				         if(this.convertedPrice != undefined)
				         {
					         $(this.element).find(".newly-added-items__item__price").text(this.convertedPrice);
					         $(this.element).find(".newly-added-items__item__price_state_currency").hide();
				         }
			         }.bind(this));
			tags.each((key, val) =>
			          {
				          let text = val.innerText.toLowerCase();
				          if(text.includes(orderClosed.toLowerCase()))
				          {
					          this.closed = true;
					          console.log(name + ": Order Closed[tag]");
				          }
			          });
			let aTags = ele.getElementsByTagName("span");
			let searchText = " ";
			for(let i = 0; i < aTags.length; i++)
			{
				if(aTags[i].textContent === searchText)
				{
					$(aTags[i]).hide();
					break;
				}
			}
			this.processItem();
		}

		processItem()
		{
			//Process Always Exclude List
			for(let y in alwaysExclude)
			{
				let exclude2 = alwaysExclude[y].toLowerCase();
				if(this.name.toLowerCase().indexOf(exclude2) > -1)
				{
					console.log(this.name + ": Always exclude [" + exclude2 + "]");
					return;
				}
			}
			//Process Buy Flag
			if(!this.buy)
			{
				console.log(this.name + ": Buy Flag Off [" + this.instock + "]");
				return;
			}
			//Process Order Closed Flag
			if(this.closed)
			{
				console.log(this.name + ": Order Closed [flag]");
				return;
			}
			//Process Price Missing
			if(this.price == undefined || this.price == "")
			{
				console.log(this.name + ": Can't find price [" + this.price + "]");
				return;
			}
			//Process Don't Exclude List
			for(let x in dontExclude)
			{
				let exclude1 = dontExclude[x].toLowerCase();
				if(this.name.toLowerCase().indexOf(exclude1) > -1)
				{
					console.log(this.name + ": Don't exclude [" + exclude1 + "]");
					this.show();
					this.finish();
					return;
				}
			}
			//Process Too Expensive
			if(this.price > priceThreshold)
			{
				console.log(this.name + ": High Price [" + this.price + "]");
				return;
			}
			//Process Item Condition
			if(itemConditions.indexOf(this.itemCondition) > allowedItemConditions)
			{
				console.log(this.name + ": Item Condition [" + this.itemCondition + "]");
				return;
			}
			//Process Box Condition
			if(boxConditions.indexOf(this.boxCondition) > allowedBoxConditions)
			{
				console.log(this.name + ": Box Condition [" + this.boxCondition + "]");
				return;
			}
			this.show();
			this.finish();
		}

		finish()
		{
			/*let itemTag = */
			this.addTag("Item: " + this.itemCondition);
			/*let boxTag = */
			this.addTag("Box: " + this.boxCondition);
			let mfcTag = this.addTag(`<a href="${this.mfc}">MFC</a>`);
			$(mfcTag).click(function(e)
			                {
				                e.stopImmediatePropagation();
			                });
			if(this.price <= highlightPrice)
			{
				$(this.element).find(".newly-added-items__item__price").css("color", "green");
			}
		}

		addTag(text)
		{
			let ele = this.element;
			let tag = document.createElement("li");
			$(tag).addClass("newly-added-items__item__tag-list__item");
			$(tag).html(text);
			$(tag).attr("style", "display: inline;");
			$(ele).find(".newly-added-items__item__tag-list").append($(tag));
			return tag;
		}

		show()
		{
			$(this.element).show();
		}
	}

	(function()
	{
		observer.observe(document.querySelector("body"), observerConfig);
	})();

	function observerFunc(mutations)
	{
		mutations.forEach((mutation) =>
		                  {
			                  let found = $(mutation.addedNodes).find(itemSelector).length;
			                  if(found > 0)
			                  {
				                  $(itemSelector).hide();
				                  processButtons();
				                  update(mutation.addedNodes);
				                  $(".header-head__menu")
					                  .prepend("<button style='font-size: 15px;'>Filter Config</button>")
					                  .click(function()
					                         {
						                         GM_config.open();
					                         });
			                  }
		                  });
	}

	function processButtons()
	{
		let url = new URL(location.href);
		let urlParams = url.searchParams;
		let page = parseInt(urlParams.get("pagecnt"));
		let maxPage = parseInt($(pagerNumSelector).last().text());
		$(pagerSelector).children().each(function()
		                                 {
			                                 $(this).hide();
		                                 });
		if(page != 1)
		{
			$(pagerSelector).each(function()
			                      {
				                      let firstButton = document.createElement("button");
				                      firstButton.innerText = "First";
				                      firstButton.type = "button";
				                      firstButton.classList.add("candibutton");
				                      firstButton.addEventListener("click", function()
				                      {
					                      urlParams.set("pagecnt", "1");
					                      location.href = url;
				                      });
				                      $(this).append(firstButton);
			                      });
		}
		$(pagerSelector).each(function()
		                      {
			                      let refreshButton = document.createElement("button");
			                      refreshButton.innerText = "Reload";
			                      refreshButton.type = "button";
			                      refreshButton.classList.add("candibutton");
			                      refreshButton.addEventListener("click", function()
			                      {
				                      location.reload();
			                      });
			                      $(this).append(refreshButton);
		                      });
		if(page >= 2)
		{
			$(pagerSelector).each(function()
			                      {
				                      let prevButton = document.createElement("button");
				                      prevButton.innerText = "Prev Page";
				                      prevButton.type = "button";
				                      prevButton.classList.add("candibutton");
				                      prevButton.addEventListener("click", function()
				                      {
					                      urlParams.set("pagecnt", page - 1);
					                      location.href = url;
				                      });
				                      $(this).append(prevButton);
			                      });
		}
		if(page < maxPage)
		{
			$(pagerSelector).each(function()
			                      {
				                      let nextButton = document.createElement("button");
				                      nextButton.innerText = "Next Page";
				                      nextButton.type = "button";
				                      nextButton.classList.add("candibutton");
				                      nextButton.addEventListener("click", function()
				                      {
					                      urlParams.set("pagecnt", page + 1);
					                      location.href = url;
				                      });
				                      $(this).append(nextButton);
			                      });
		}
		$(".candibutton").css("margin-right", "10px");
		$(".candibutton").css("margin-left", "10px");
		$(pagerSelector).prepend("</p>" + page + "/" + maxPage + "</p>");
	}

	function update(node)
	{
		$(node).find(itemSelector).each(function()
		                                {
			                                let href = $(this).find(gcodeSelector);
			                                let link = href.attr("href");
			                                let urlParams = new URL(basePath + link).searchParams;
			                                let gcode = urlParams.get(gcodeID);
			                                let item = new Item(gcode, link);
			                                item.element = this;
		                                });
	}
})();

//# sourceMappingURL=maps/AmiAmi-SearchFilter.js.map
