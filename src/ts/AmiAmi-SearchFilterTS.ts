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
// @if BUILD_TYPE="Dev"
// @require /* @echo PATH*/AmiAmi-SearchFilter.user.js
// @endif
// @if BUILD_TYPE="Prod"
// @downloadURL https://cdn.jsdelivr.net/gh/CandiceJoy/CandiceJoy-Userscripts/AmiAmi-SearchFilter.user.js
// @supportURL https://github.com/CandiceJoy/CandiceJoy-Userscripts/issues
// @endif
// @run-at document-idle
// ==/UserScript==
// @if BUILD_TYPE="Prod"
// !!!!!!!include ../libraries/config.js
/// <reference types="../types/GM_config"/>
( function ()
{
	"use strict";
	const itemConditions: string[] = ["A", "A-", "B+", "B", "C", "J"];
	const boxConditions: string[] = ["A", "B", "C", "N"];
	let configDoc: Document;

	GM_config.init( {
		                "id"   : "amiami-search-filter", // The id used for this instance of GM_config
		                "title": "AmiAmi Search Filter Config", "fields": // Fields object
			{
				"currency"                    : // This is the id of the field
					{
						"label": "Currency (3 letters): ", // Appears next to field
						"type" : "text", // Makes this setting a text field
						"size" : "3", "default": "usd" // Default value if user doesn't change it
					}, "allowedItemConditions": // This is the id of the field
					{
						"label"  : "Lowest Allowed Item Condition: ", // Appears next to field
						"type"   : "select", // Makes this setting a text field
						"options": itemConditions, // Possible choices
						"default": "B" // Default value if user doesn't change it
					}, "allowedBoxConditions" : // This is the id of the field
					{
						"label"  : "Lowest Allowed Box Condition: ", // Appears next to field
						"type"   : "select", // Makes this setting a text field
						"options": boxConditions, // Possible choices
						"default": "B" // Default value if user doesn't change it
					}, "priceThreshold"       : // This is the id of the field
					{
						"label"  : "Hide items above this price (JPY): ", // Appears next to field
						"type"   : "int", // Makes this setting a text field
						"default": "10000" // Default value if user doesn't change it
					}, "highlightPrice"       : // This is the id of the field
					{
						"label"  : "Highlight items below or equal to this price (JPY): ", // Appears next to field
						"type"   : "int", // Makes this setting a text field
						"default": "5000" // Default value if user doesn't change it
					}, "exclude"              : // This is the id of the field
					{
						"label"  : "List of search terms to hide (one per line): ", // Appears next to field
						"type"   : "textarea", // Makes this setting a text field
						"default": "" // Default value if user doesn't change it
					}, "dontExclude"          : // This is the id of the field
					{
						"label"  : "List of search terms to exclude from price and condition filters (one per line): ", // Appears next to field
						"type"   : "textarea", // Makes this setting a text field
						"default": "" // Default value if user doesn't change it
					}
			},

		                "events": {
			                "open"   : function ( doc: Document ): void
			                {
				                configDoc = doc;

				                $( configDoc ).find( "#amiami-search-filter_field_currency" ).attr( "maxlength", "3" );
				                $( configDoc ).find( "#amiami-search-filter_field_exclude" ).attr( "cols", "20" );
				                $( configDoc ).find( "#amiami-search-filter_field_dontExclude" ).attr( "cols", "20" );
				                $( configDoc ).find( "textarea" ).each( function ()
				                                                        {
					                                                        $( this )
						                                                        .height( $( this )[0].scrollHeight +
						                                                                 20 );
				                                                        } );
			                }, "save": function (): void
			                {

				                $( configDoc ).find( "textarea" ).each( function ()
				                                                        {
					                                                        $( this )
						                                                        .height( $( this )[0].scrollHeight +
						                                                                 20 );
				                                                        } );

				                if ( $( configDoc )
					                     .find( "#amiami-search-filter_field_currency" )
					                     .val()
					                     .toString().length !== 3 )
				                {
					                alert( "Currency must be 3 letters" );
				                }

				                if ( parseInt( $( configDoc )
					                               .find( "#amiami-search-filter_field_priceThreshold" )
					                               .val()
					                               .toString() ) >=
				                     50000 )
				                {
					                alert( "Price threshold too high" );
				                }

				                if ( parseInt( $( configDoc )
					                               .find( "#amiami-search-filter_field_highlightPrice" )
					                               .val()
					                               .toString() ) <=
				                     500 )
				                {
					                alert( "Highlight price too low" );
				                }
			                }
		                }
	                } );

	const allowedItemConditions: string = GM_config.get( "allowedItemConditions" ).toString(); //letters only
	const allowedBoxConditions: string = GM_config.get( "allowedBoxConditions" ).toString(); //letters only
	const currency: string = GM_config.get( "currency" ).toString().toLowerCase(); //lowercase, 3 letter
	const priceThreshold: number = parseInt( GM_config.get( "priceThreshold" ).toString() ); //exclude prices > this (yen)
	const highlightPrice: number = parseInt( GM_config.get( "highlightPrice" ).toString() ); //highlight prices <= this (yen)

	const alwaysExclude:string[] = ( GM_config.get( "exclude" ) ) ? GM_config.get( "exclude" ).toString().split( "\n" ) : [];

	const dontExclude:string[] = ( GM_config.get( "dontExclude" ) ) ?
	                    GM_config.get( "dontExclude" ).toString().split( "\n" ) :
	                    [];

	const itemSelector = ".newly-added-items__item";
	const pagerSelector = ".pager_mb,.pager-list";
	const pagerNumSelector = "li.pager-list__item_num";
	const gcodeSelector = "a";
	const gcodeID = "gcode";
	const itemConditionRegex = new RegExp( "ITEM:(.*?)\\/", "id" );
	const boxConditionRegex = new RegExp( "BOX:(.*?)\\)", "id" );
	const orderClosed = "order closed";

	const observerConfig:object = {
		childList: true, subtree: true, attributes: true
	};

	function observerFunc( mutations:MutationRecord[] ):void
	{
		mutations.forEach( ( mutation:MutationRecord ):void =>
		                   {
			                   const found = $( mutation.addedNodes ).find( itemSelector ).length;

			                   if ( found > 0 )
			                   {
				                   $( itemSelector ).hide();
				                   processButtons();
				                   update( mutation.addedNodes );
				                   $( ".header-head__menu" )
					                   .prepend( "<button style='font-size: 15px;'>Filter Config</button>" )
					                   .on("click", function ():void
					                           {
						                           GM_config.open();
					                           } );
			                   }
		                   } );
	}

	const observer:MutationObserver = new MutationObserver( observerFunc );
	const basePath = `${window.location.protocol}//${window.location.host}`;

	class AmiAmiItem
	{
		private url: string;
		private mfc: string;
		private itemCondition: string;
		private boxCondition: string;
		private readonly element: HTMLElement;
		private readonly gcode: string;
		private item: Item;
		private name: string;
		private jancode: string;
		private instock: boolean;
		private price: number;
		private buy: boolean;
		private preowned: boolean;
		private closed: boolean;
		private resale: number;
		private scode: string;
		private sname: string;

		constructor( gcode: string, link: string, element: HTMLElement )
		{
			this.url = basePath + link;
			this.gcode = gcode;
			this.element = element;
		}

		init():void
		{
			$.ajax( `https://api.amiami.com/api/v1.0/item?gcode=${this.gcode}`,
			        { dataType: "json", headers: { "x-user-key": "amiami_dev" } } )
			 .always( this.setup.bind( this ) );
		}
		
		setup( data: string, textStatus: string, xhr: JQueryXHR ): void
		{
			const root: Readonly<RootObject> = JSON.parse( data );
			const item: Readonly<Item> = root.item;

			//Object.assign(this,root.item);
			//const item = this.item;


			if ( xhr.status !== 200 )
			{
				console.log( `API Call Failed [${this.gcode}]` );
				return;
			}

			this.item = item;
			this.name = item.gname;
			this.jancode = item.jancode;
			this.instock = item.instock_flg > 0;
			this.price = item.price;
			this.buy = item.buy_flg > 0;
			this.preowned = item.condition_flg === 1;
			this.closed = item.order_closed_flg === 1;
			this.resale = item.resale_flg;
			this.scode = item.scode;
			this.mfc = `https://myfigurecollection.net/browse.v4.php?keywords=${this.jancode}`;
			this.sname = item.sname;
			this.itemCondition = new RegExp( itemConditionRegex ).exec( item.sname )[1];
			this.boxCondition = new RegExp( boxConditionRegex ).exec( item.sname )[1];

			const ele: HTMLElement = this.element;
			const tags: JQuery = $( ele ).find(
				".newly-added-items__item__tag-list__item:not([style]), .newly-added-items__item__tag-list__item[style='']" );

			$.ajax( `https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/jpy/${currency}.json` )
			 .always( function ( data )
			          {
				          const conversionFactor: string = $( data ).attr( currency );

				          const newPrice: number = parseFloat( conversionFactor ) * this.price;
				          const formatter: Intl.NumberFormat = new Intl.NumberFormat( "en-US", {
					          style: "currency", currency: currency.toUpperCase()
				          } );

				          this.convertedPrice = formatter.format( newPrice );

				          if ( this.convertedPrice !== undefined )
				          {
					          $( this.element ).find( ".newly-added-items__item__price" ).text( this.convertedPrice );
					          $( this.element ).find( ".newly-added-items__item__price_state_currency" ).hide();
				          }
			          }.bind( this ) );

			tags.each( ( key, val ) =>
			           {
				           const text = val.innerText.toLowerCase();

				           if ( text.includes( orderClosed.toLowerCase() ) )
				           {
					           this.closed = true;
					           console.log( `${name}: Order Closed[tag]` );
				           }
			           } );
			const aTags = ele.getElementsByTagName( "span" );
			const searchText = " ";

			for ( let i = 0; i < aTags.length; i++ )
			{
				if ( aTags[i].textContent === searchText )
				{
					$( aTags[i] ).hide();
					break;
				}
			}

			this.processItem();
		}

		processItem(): void
		{
			//Process Always Exclude List
			for ( const y in alwaysExclude )
			{
				const exclude2 = alwaysExclude[y].toLowerCase();

				if ( this.name.toLowerCase().indexOf( exclude2 ) > -1 )
				{
					console.log( `${this.name}: Always exclude [${exclude2}]` );
					return;
				}
			}

			//Process Buy Flag
			if ( !this.buy )
			{
				console.log( `${this.name}: Buy Flag Off [${this.instock}]` );
				return;
			}

			//Process Order Closed Flag
			if ( this.closed )
			{
				console.log( `${this.name}: Order Closed [flag]` );
				return;
			}

			//Process Price Missing
			if ( this.price === undefined || this.price.toString() === "" )
			{
				console.log( `${this.name}: Can't find price [${this.price}]` );
				return;
			}

			//Process Don't Exclude List
			for ( const x in dontExclude )
			{
				const exclude1 = dontExclude[x].toLowerCase();

				if ( this.name.toLowerCase().indexOf( exclude1 ) > -1 )
				{
					console.log( `${this.name}: Don't exclude [${exclude1}]` );
					this.show();
					this.finish();
					return;
				}
			}

			//Process Too Expensive
			if ( this.price > priceThreshold )
			{
				console.log( `${this.name}: High Price [${this.price}]` );
				return;
			}

			//Process Item Condition
			if ( itemConditions.indexOf( this.itemCondition ) > itemConditions.indexOf( allowedItemConditions ) )
			{
				console.log( `${this.name}: Item Condition [${this.itemCondition}]` );
				return;
			}

			//Process Box Condition
			if ( boxConditions.indexOf( this.boxCondition ) > itemConditions.indexOf( allowedBoxConditions ) )
			{
				console.log( `${this.name}: Box Condition [${this.boxCondition}]` );
				return;
			}

			this.show();
			this.finish();
		}

		finish(): void
		{
			this.addTag( `Item: ${this.itemCondition}` );
			this.addTag( `Box: ${this.boxCondition}` );
			const mfcTag = this.addTag( `<a href="${this.mfc}">MFC</a>` );


			$( mfcTag ).click( function ( e )
			                   {
				                   e.stopImmediatePropagation();
			                   } );

			if ( this.price <= highlightPrice )
			{
				$( this.element ).find( ".newly-added-items__item__price" ).css( "color", "green" );
			}
		}

		addTag( text: string ): HTMLElement
		{
			const ele: HTMLElement = this.element;
			const tag: HTMLElement = document.createElement( "li" );
			$( tag ).addClass( "newly-added-items__item__tag-list__item" );
			$( tag ).html( text );
			$( tag ).attr( "style", "display: inline;" );
			$( ele ).find( ".newly-added-items__item__tag-list" ).append( $( tag ) );
			return tag;
		}

		show(): void
		{
			$( this.element ).show();
		}
	}

	( function (): void
	{
		observer.observe( document.querySelector( "body" ), observerConfig );
	} )();

	function processButtons(): void
	{
		const url: URL = new URL( location.href );
		const urlParams: URLSearchParams = url.searchParams;
		const page: number = parseInt( urlParams.get( "pagecnt" ) );
		const maxPage: number = parseInt( $( pagerNumSelector ).last().text() );

		$( pagerSelector ).children().each( function ()
		                                    {
			                                    $( this ).hide();
		                                    } );

		if ( page !== 1 )
		{
			$( pagerSelector ).each( function ()
			                         {
				                         const firstButton = document.createElement( "button" );
				                         firstButton.innerText = "First";
				                         firstButton.type = "button";
				                         firstButton.classList.add( "candibutton" );
				                         firstButton.addEventListener( "click", function ()
				                         {
					                         urlParams.set( "pagecnt", "1" );
					                         location.href = url.toString();
				                         } );

				                         $( this ).append( firstButton );
			                         } );
		}

		$( pagerSelector ).each( function ()
		                         {
			                         const refreshButton = document.createElement( "button" );
			                         refreshButton.innerText = "Reload";
			                         refreshButton.type = "button";
			                         refreshButton.classList.add( "candibutton" );
			                         refreshButton.addEventListener( "click", function ()
			                         {
				                         location.reload();
			                         } );
			                         $( this ).append( refreshButton );
		                         } );

		if ( page >= 2 )
		{
			$( pagerSelector ).each( function ()
			                         {
				                         const prevButton = document.createElement( "button" );
				                         prevButton.innerText = "Prev Page";
				                         prevButton.type = "button";
				                         prevButton.classList.add( "candibutton" );
				                         prevButton.addEventListener( "click", function ()
				                         {
					                         urlParams.set( "pagecnt", ( page - 1 ).toString() );
					                         location.href = url.toString();
				                         } );
				                         $( this ).append( prevButton );
			                         } );
		}

		if ( page < maxPage )
		{
			$( pagerSelector ).each( function ()
			                         {
				                         const nextButton = document.createElement( "button" );
				                         nextButton.innerText = "Next Page";
				                         nextButton.type = "button";
				                         nextButton.classList.add( "candibutton" );
				                         nextButton.addEventListener( "click", function ()
				                         {
					                         urlParams.set( "pagecnt", ( page + 1 ).toString() );
					                         location.href = url.toString();
				                         } );
				                         $( this ).append( nextButton );
			                         } );
		}

		const candibutton:JQuery<HTMLElement> = $(".candibutton");
		candibutton.css( "margin-right", "10px" );
		candibutton.css( "margin-left", "10px" );
		$( pagerSelector ).prepend( `</p>${page}/${maxPage}</p>` );
	}

	function update( node: NodeList ): void
	{
		$( node ).find( itemSelector ).each( function ()
		                                     {
			                                     const href = $( this ).find( gcodeSelector );
			                                     const link = href.attr( "href" );
			                                     const urlParams = new URL( basePath + link ).searchParams;
			                                     const gcode = urlParams.get( gcodeID );
			                                     const item = new AmiAmiItem( gcode, link, this );
												 item.init();
		                                     } );
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
} )();
// @endif