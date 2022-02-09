// ==UserScript==
// @name         BuyFriend Redirect
// @namespace    http://candicejoy.com/
// @version      1.1
// @description  Auto-clicker for Buyfriend.Moe notifications
// @author       CandiceJoy
// @match        https://buyfriend.moe/search?search=https://www.amiami.com/eng/detail/?*
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=amiami.com
// @ifdef DEV
// @if DEV_TYPE="Mac"
// @require file:///Users/candice/WebstormProjects/CandiceJoy-Userscripts/BuyfriendRedirect.user.js
// @endif
// @if DEV_TYPE="PC"
// bnanana@require file://c:/Users/candice/WebstormProjects/CandiceJoy-Userscripts/BuyfriendRedirect.user.js
// @endif
// @endif
// @ifdef PROD
// @downloadURL https://cdn.jsdelivr.net/gh/CandiceJoy/CandiceJoy-Userscripts/BuyfriendRedirect.user.js
// @supportURL https://github.com/CandiceJoy/CandiceJoy-Userscripts/issues
// @endif
// @grant        none
// ==/UserScript==

const logo = "amiamilogo.png";

(function()
{
	'use strict';
	$("a img").each(function()
	                {
		                if($(this).attr("src").includes(logo))
		                {
			                $(this).click();
		                }
	                });

	$("h3 a").each(function()
	               {
		               location.href = $(this).attr("href");
	               });
})();
