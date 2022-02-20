import {Config} from "./libs/Config";

(function(): void
{
	"use strict";
	import("jQuery");
	const itemConditions: string[] = ["A", "A-", "B+", "B", "C", "J"];
	const boxConditions: string[] = ["A", "B", "C", "N"];
	const config: Config = new Config("amiami-search-filter", "AmiAmi Search Filter Config");
	config.add("currency", "Currency (3 letters): ", "text", "usd");
	config.add("allowedItemConditions", "Lowest Allowed Item Condition: ", "select", "B", {"options": itemConditions});
	config.add("allowedBoxConditions", "Lowest Allowed Box Condition: ", "select", "B", {"options": boxConditions});
	config.add("priceThreshold", "Hide items above this price (JPY): ", "int", "10000");
	config.add("highlightPrice", "Highlight items below or equal to this price (JPY): ", "int", "5000");
	config.add("exclude", "List of search terms to hide (one per line): ", "textarea", "");
	config.add("dontExclude", "List of search terms to exclude from price and condition filters (one per line): ", "textarea", "");
	config.addEvent("save", (): void =>
	{
		const configDoc: Document = config.document;
		$(configDoc).find("textarea").each(function(): void
		                                   {
			                                   const scroll: HTMLTextAreaElement | undefined = $(this)[0];
			                                   if(scroll)
			                                   {
				                                   $(this)
					                                   .height(scroll.scrollHeight + 20);
			                                   }
		                                   });

		const currencyValue: string | number | string[] | undefined = $(configDoc)
			.find("#amiami-search-filter_field_currency")
			.val();

		if(currencyValue && currencyValue.toString().length !== 3)
		{
			alert("Currency must be 3 letters");
		}

		const priceThresholdValue: string | number | string[] | undefined = $(configDoc)
			.find("#amiami-search-filter_field_priceThreshold")
			.val();

		if(priceThresholdValue && parseInt(priceThresholdValue.toString()
		                                                      .toString()) >= 50000)
		{
			alert("Price threshold too high");
		}

		const highlightPriceValue: string | number | string[] | undefined = $(configDoc)
			.find("#amiami-search-filter_field_highlightPrice")
			.val();

		if(highlightPriceValue && parseInt(highlightPriceValue.toString()
		                                                      .toString()) <= 500)
		{
			alert("Highlight price too low");
		}
	});
	config.init();

	const allowedItemConditions: string = config.get("allowedItemConditions").toString(); //letters only
	const allowedBoxConditions: string = config.get("allowedBoxConditions").toString(); //letters only
	const currency: string = config.get("currency").toString().toLowerCase(); //lowercase, 3 letter
	const priceThreshold: number = parseInt(config.get("priceThreshold").toString()); //exclude prices > this (yen)
	const highlightPrice: number = parseInt(config.get("highlightPrice").toString()); //highlight prices <= this (yen)

	const alwaysExclude: string[] = (config.get("exclude")) ? config.get("exclude").toString().split("\n") : [];

	const dontExclude: string[] = (config.get("dontExclude")) ? config.get("dontExclude").toString().split("\n") : [];

	const itemSelector: string = ".newly-added-items__item";
	const pagerSelector: string = ".pager_mb,.pager-list";
	const pagerNumSelector: string = "li.pager-list__item_num";
	const gcodeSelector: string = "a";
	const gcodeID: string = "gcode";
	const itemConditionRegex: RegExp = new RegExp("ITEM:(.*?)\\/", "id");
	const boxConditionRegex: RegExp = new RegExp("BOX:(.*?)\\)", "id");
	const orderClosed: string = "order closed";

	const observerConfig: object = {
		childList: true, subtree: true, attributes: true
	};

	function observerFunc(mutations: MutationRecord[]): void
	{
		mutations.forEach((mutation: MutationRecord): void =>
		                  {
			                  const found: number = $(mutation.addedNodes).find(itemSelector).length;

			                  if(found > 0)
			                  {
				                  $(itemSelector).hide();
				                  processButtons();
				                  update(mutation.addedNodes);
				                  $(".header-head__menu")
					                  .prepend("<button style='font-size: 15px;'>Filter Config</button>")
					                  .on("click", async function(): Promise<void>
					                  {
						                  await config.show();
						                  const configDoc: Document = config.document;

						                  $(configDoc).find("#amiami-search-filter_field_currency").attr("maxlength", "3");
						                  $(configDoc).find("#amiami-search-filter_field_exclude").attr("cols", "20");
						                  $(configDoc).find("#amiami-search-filter_field_dontExclude").attr("cols", "20");
						                  $(configDoc).find("textarea").each(function(): void
						                                                     {
							                                                     const scroll: HTMLTextAreaElement | undefined = $(this)[0];
							                                                     if(scroll)
							                                                     {
								                                                     $(this)
									                                                     .height(scroll.scrollHeight + 20);
							                                                     }
						                                                     });
					                  });
			                  }
		                  });
	}

	const observer: MutationObserver = new MutationObserver(observerFunc);
	const basePath: string = `${window.location.protocol}//${window.location.host}`;

	const body: HTMLBodyElement | null = document.querySelector("body");

	if(body)
	{
		observer.observe(body, observerConfig);
	}

	class AmiAmiItem
	{
		//private url: string;
		private mfc: string = "";
		private itemCondition: string = "";
		private boxCondition: string = "";
		private readonly element: HTMLElement;
		private readonly gcode: string;
		//private item: Item | undefined;
		private name: string = "";
		private jancode: string = "";
		private instock: boolean = true;
		private price: number = 0;
		private buy: boolean = true;
		//private preowned: boolean| undefined;
		private closed: boolean = false;
		//private resale: number| undefined;
		//private scode: string| undefined;
		//private sname: string| undefined;

		constructor(gcode: string, element: HTMLElement)
		{
			//this.url = basePath + link;
			this.gcode = gcode;
			this.element = element;
		}

		init(): void
		{
			$.ajax(`https://api.amiami.com/api/v1.0/item?gcode=${this.gcode}`, {dataType: "json", headers: {"x-user-key": "amiami_dev"}})
			 .always(this.setup.bind(this));
		}

		setup(data: object, _textStatus: any, xhr: string | JQueryXHR): void
		{
			const root: Readonly<RootObject> = data as RootObject;
			const item: Readonly<Item> = root.item;

			//Object.assign(this,root.item);
			//const item = this.item;


			if(typeof xhr !== "string" && xhr.status !== 200)
			{
				console.log(`API Call Failed [${this.gcode}]`);
				return;
			}

			//this.item = item;
			this.name = item.gname;
			this.jancode = item.jancode;
			this.instock = item.instock_flg > 0;
			this.price = item.price;
			this.buy = item.buy_flg > 0;
			//this.preowned = item.condition_flg === 1;
			this.closed = item.order_closed_flg === 1;
			//this.resale = item.resale_flg;
			//this.scode = item.scode;
			this.mfc = `https://myfigurecollection.net/browse.v4.php?keywords=${this.jancode}`;
			//this.sname = item.sname;

			const itemConditionParseResults: RegExpExecArray | null = itemConditionRegex.exec(item.sname);

			if(itemConditionParseResults)
			{
				const condition: string | undefined = itemConditionParseResults[1];

				if(condition)
				{
					this.itemCondition = condition;
				}
			}

			const boxConditionParseResults: RegExpExecArray | null = boxConditionRegex.exec(item.sname);

			if(boxConditionParseResults)
			{
				const condition: string | undefined = boxConditionParseResults[1];

				if(condition)
				{
					this.boxCondition = condition;
				}
			}

			const ele: HTMLElement = this.element;
			const tags: JQuery = $(ele).find(".newly-added-items__item__tag-list__item:not([style]), .newly-added-items__item__tag-list__item[style='']");

			$.ajax(`https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/jpy/${currency}.json`)
			 .always((data: any): void =>
			         {
				         const conversionFactor: string | undefined = $(data).attr(currency);
				         let newPrice: number = -1;

				         if(conversionFactor)
				         {
					         newPrice = parseFloat(conversionFactor) * this.price;
				         }

				         const formatter: Intl.NumberFormat = new Intl.NumberFormat("en-US", {
					         style: "currency", currency: currency.toUpperCase()
				         });

				         const convertedPrice: string = formatter.format(newPrice);

				         if(convertedPrice !== undefined)
				         {
					         $(this.element).find(".newly-added-items__item__price").text(convertedPrice);
					         $(this.element).find(".newly-added-items__item__price_state_currency").hide();
				         }
			         });

			tags.each((_key: number, val: HTMLElement): void =>
			          {
				          const text: string = val.innerText.toLowerCase();

				          if(text.includes(orderClosed.toLowerCase()))
				          {
					          this.closed = true;
					          console.log(`${this.name}: Order Closed[tag]`);
				          }
			          });
			const aTags: HTMLCollectionOf<HTMLSpanElement> = ele.getElementsByTagName("span");
			const searchText: string = " ";

			for(let i = 0; i < aTags.length; i++)
			{
				const tag: HTMLSpanElement | undefined = aTags[i];

				if(tag && tag.textContent === searchText)
				{
					$(tag).hide();
					break;
				}
			}

			this.processItem();
		}

		processItem(): void
		{
			//Process Always Exclude List
			for(const y in alwaysExclude)
			{
				const currentExclude: string | undefined = alwaysExclude[y];
				let exclude2: string = "";

				if(currentExclude)
				{
					exclude2 = currentExclude.toLowerCase();
				}

				if(this.name.toLowerCase().indexOf(exclude2) > -1)
				{
					console.log(`${this.name}: Always exclude [${exclude2}]`);
					return;
				}
			}

			//Process Buy Flag
			if(!this.buy)
			{
				console.log(`${this.name}: Buy Flag Off [${this.instock}]`);
				return;
			}

			//Process Order Closed Flag
			if(this.closed)
			{
				console.log(`${this.name}: Order Closed [flag]`);
				return;
			}

			//Process Price Missing
			if(this.price === undefined || this.price.toString() === "")
			{
				console.log(`${this.name}: Can't find price [${this.price}]`);
				return;
			}

			//Process Don't Exclude List
			for(const x in dontExclude)
			{
				const currentExclude: string | undefined = dontExclude[x];
				let exclude1: string = "";

				if(currentExclude)
				{
					exclude1 = currentExclude.toLowerCase();
				}

				if(this.name.toLowerCase().indexOf(exclude1) > -1)
				{
					console.log(`${this.name}: Don't exclude [${exclude1}]`);
					this.show();
					this.finish();
					return;
				}
			}

			//Process Too Expensive
			if(this.price > priceThreshold)
			{
				console.log(`${this.name}: High Price [${this.price}]`);
				return;
			}

			//Process Item Condition
			if(itemConditions.indexOf(this.itemCondition) > itemConditions.indexOf(allowedItemConditions))
			{
				console.log(`${this.name}: Item Condition [${this.itemCondition}]`);
				return;
			}

			//Process Box Condition
			if(boxConditions.indexOf(this.boxCondition) > itemConditions.indexOf(allowedBoxConditions))
			{
				console.log(`${this.name}: Box Condition [${this.boxCondition}]`);
				return;
			}

			this.show();
			this.finish();
		}

		finish(): void
		{
			this.addTag(`Item: ${this.itemCondition}`);
			this.addTag(`Box: ${this.boxCondition}`);
			const mfcTag: HTMLElement = this.addTag(`<a href="${this.mfc}">MFC</a>`);


			$(mfcTag).on("click", function(e: JQuery.ClickEvent<HTMLElement, undefined, HTMLElement, HTMLElement>): void
			{
				e.stopImmediatePropagation();
			});

			if(this.price <= highlightPrice)
			{
				$(this.element).find(".newly-added-items__item__price").css("color", "green");
			}
		}

		addTag(text: string): HTMLElement
		{
			const ele: HTMLElement = this.element;
			const tag: HTMLElement = document.createElement("li");
			$(tag).addClass("newly-added-items__item__tag-list__item");
			$(tag).html(text);
			$(tag).attr("style", "display: inline;");
			$(ele).find(".newly-added-items__item__tag-list").append($(tag));
			return tag;
		}

		show(): void
		{
			$(this.element).show();
		}
	}

	function processButtons(): void
	{
		const url: URL = new URL(location.href);
		const urlParams: URLSearchParams = url.searchParams;
		const pageParam: string | null = urlParams.get("pagecnt");

		if(!pageParam)
		{
			return;
		}

		const page: number = parseInt(pageParam);
		const maxPage: number = parseInt($(pagerNumSelector).last().text());

		$(pagerSelector).children().each(function(): void
		                                 {
			                                 $(this).hide();
		                                 });

		if(page !== 1)
		{
			$(pagerSelector).each(function(): void
			                      {
				                      const firstButton: HTMLButtonElement = document.createElement("button");
				                      firstButton.innerText = "First";
				                      firstButton.type = "button";
				                      firstButton.classList.add("candibutton");
				                      firstButton.addEventListener("click", function(): void
				                      {
					                      urlParams.set("pagecnt", "1");
					                      location.href = url.toString();
				                      });

				                      $(this).append(firstButton);
			                      });
		}

		$(pagerSelector).each(function(): void
		                      {
			                      const refreshButton: HTMLButtonElement = document.createElement("button");
			                      refreshButton.innerText = "Reload";
			                      refreshButton.type = "button";
			                      refreshButton.classList.add("candibutton");
			                      refreshButton.addEventListener("click", function(): void
			                      {
				                      location.reload();
			                      });
			                      $(this).append(refreshButton);
		                      });

		if(page >= 2)
		{
			$(pagerSelector).each(function(): void
			                      {
				                      const prevButton: HTMLButtonElement = document.createElement("button");
				                      prevButton.innerText = "Prev Page";
				                      prevButton.type = "button";
				                      prevButton.classList.add("candibutton");
				                      prevButton.addEventListener("click", function(): void
				                      {
					                      urlParams.set("pagecnt", (page - 1).toString());
					                      location.href = url.toString();
				                      });
				                      $(this).append(prevButton);
			                      });
		}

		if(page < maxPage)
		{
			$(pagerSelector).each(function(): void
			                      {
				                      const nextButton: HTMLButtonElement = document.createElement("button");
				                      nextButton.innerText = "Next Page";
				                      nextButton.type = "button";
				                      nextButton.classList.add("candibutton");
				                      nextButton.addEventListener("click", function(): void
				                      {
					                      urlParams.set("pagecnt", (page + 1).toString());
					                      location.href = url.toString();
				                      });
				                      $(this).append(nextButton);
			                      });
		}

		const candibutton: JQuery = $(".candibutton");
		candibutton.css("margin-right", "10px");
		candibutton.css("margin-left", "10px");
		$(pagerSelector).prepend(`</p>${page}/${maxPage}</p>`);
	}

	function update(node: NodeList): void
	{
		$(node).find(itemSelector).each(function(): void
		                                {
			                                const href: JQuery = $(this).find(gcodeSelector);
			                                const link: string | undefined = href.attr("href");
			                                const urlParams: URLSearchParams = new URL(basePath + link).searchParams;
			                                const gcode: string | null = urlParams.get(gcodeID);

			                                if(gcode && link)
			                                {
				                                const item: AmiAmiItem = new AmiAmiItem(gcode, this);
				                                item.init();
			                                }
		                                });
	}

	interface Item
	{
		gcode: string;
		scode: string;
		gname: string;
		sname: string;
		gname_sub: string;
		sname_simple: string;
		sname_simple_j: string;
		main_image_url: string;
		main_image_alt: string;
		main_image_title: string;
		image_comment: string;
		youtube?: any;
		list_price: number;
		c_price_taxed: number;
		price: number;
		point: number;
		salestatus: string;
		releasedate: string;
		period_from?: any;
		period_to?: any;
		cart_type: number;
		max_cartin_count: number;
		include_instock_only_flg: number;
		remarks: string;
		size_info?: any;
		watch_list_available: number;
		jancode: string;
		maker_name: string;
		modeler: string;
		modelergroup: string;
		spec: string;
		memo: string;
		copyright: string;
		saleitem: number;
		condition_flg: number;
		preorderitem: number;
		backorderitem: number;
		store_bonus: number;
		amiami_limited: number;
		instock_flg: number;
		order_closed_flg: number;
		preown_attention: number;
		producttypeattention: number;
		agelimit: number;
		customs_warning_flg: number;
		preorderattention: string;
		preorder_bonus_flg: number;
		domesticitem: number;
		metadescription: string;
		metawords: string;
		releasechange_text: string;
		cate1: number[];
		cate2: number[];
		cate3: number[];
		cate4?: any;
		cate5?: any;
		cate6?: any;
		cate7?: any;
		salestalk: string;
		buy_flg: number;
		buy_price: number;
		buy_remarks?: any;
		end_flg: number;
		disp_flg: number;
		onsale_flg: number;
		handling_store?: any;
		salestatus_detail: string;
		stock: number;
		newitem: number;
		saletopitem: number;
		resale_flg: number;
		preowned_sale_flg: number;
		big_title_flg: number;
		soldout_flg: number;
		inc_txt1: number;
		inc_txt2: number;
		inc_txt3: number;
		inc_txt4: number;
		inc_txt5: number;
		inc_txt6: number;
		inc_txt7: number;
		inc_txt8: number;
		inc_txt9: number;
		inc_txt10: number;
		image_on: number;
		image_category: string;
		image_name: string;
		metaalt: string;
		image_reviewnumber: number;
		image_reviewcategory: string;
		price1: number;
		price2: number;
		price3: number;
		price4: number;
		price5: number;
		discountrate1: number;
		discountrate2: number;
		discountrate3: number;
		discountrate4: number;
		discountrate5: number;
		sizew: string;
		colorw: string;
		thumb_url: string;
		thumb_alt: string;
		thumb_title: string;
		thumb_agelimit: number;
	}

	interface ReviewImage
	{
		image_url: string;
		thumb_url: string;
		alt: string;
		title: string;
	}

	interface Maker
	{
		id: number;
		name: string;
	}

	interface OriginalTitle
	{
		id: number;
		name: string;
	}

	interface CharacterName
	{
		id: number;
		name: string;
	}

	interface Embedded
	{
		review_images: ReviewImage[];
		bonus_images: any[];
		related_items: any[];
		other_items: any[];
		makers: Maker[];
		series_titles?: any;
		original_titles: OriginalTitle[];
		character_names: CharacterName[];
	}

	interface RootObject
	{
		RSuccess: boolean;
		RValue?: any;
		RMessage: string;
		item: Item;
		_embedded: Embedded;
	}
})();