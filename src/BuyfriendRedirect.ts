// ==UserScript==
// @name         BuyFriend Redirect
// @namespace    http://candicejoy.com/
// @version      1.2
// @description  Auto-clicker for Buyfriend.Moe notifications
// @author       CandiceJoy
// @match        https://buyfriend.moe/search?search=https://www.amiami.com/eng/detail/?*
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=amiami.com
// @if BUILD_TYPE="Dev"
// @require file:///* @echo PATH*/MFC-MarkAllRead.user.js
// @endif
// @if BUILD_TYPE="Prod"
// @downloadURL https://cdn.jsdelivr.net/gh/CandiceJoy/CandiceJoy-Userscripts/BuyfriendRedirect.user.js
// @supportURL https://github.com/CandiceJoy/CandiceJoy-Userscripts/issues
// @endif
// @grant        none
// ==/UserScript==
// @if BUILD_TYPE="Prod"
( function (): void
{
	"use strict";
	const logo: string = "amiamilogo.png";

	$( "a img" ).each( function (): void
	                   {
		                   const attr: string | undefined = $( this ).attr( "src" );

		                   if ( attr && attr.includes( logo ) )
		                   {
			                   $( this ).trigger( "click" );
		                   }
	                   } );

	$( "h3 a" ).each( function (): void
	                  {
		                  const attr: string | undefined = $( this ).attr( "href" );

		                  if ( attr )
		                  {
			                  location.href = attr;
		                  }
	                  } );
} )();
// @endif