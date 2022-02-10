// ==UserScript==
// @name         MFC Mark All As Read
// @namespace    http://candicejoy.com/
// @version      1.1
// @description  Adds a Mark All Read button to MFC Notifications Page
// @author       CandiceJoy
// @match        https://myfigurecollection.net/notifications/*
// @icon         https://static.myfigurecollection.net/ressources/assets/webicon.png
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @if BUILD_TYPE="Mac"
// @require file:///Users/candice/WebstormProjects/CandiceJoy-Userscripts/MFC-MarkAllRead.user.js
// @endif
// @if BUILD_TYPE="PC"
// @require file://c:/Users/candice/WebstormProjects/CandiceJoy-Userscripts/MFC-MarkAllRead.user.js
// @endif
// @if BUILD_TYPE="Prod"
// @downloadURL https://cdn.jsdelivr.net/gh/CandiceJoy/CandiceJoy-Userscripts/MFC-MarkAllRead.user.js
// @supportURL https://github.com/CandiceJoy/CandiceJoy-Userscripts/issues
// @endif
// @grant        none
// ==/UserScript==
// @if BUILD_TYPE="Prod"
/*jshint esversion: 8 */

const headerSelector = "#main";
const activitySelector = ".activity-wrapper";
const iconSelector = ".icon-bell-slash";

(function()
{
	'use strict';
	var button = document.createElement("button");
	button.innerText = "Mark All As Read";
	button.type = "button";
	button.addEventListener("click", buttonClicked);
	$(headerSelector).prepend(button);
})();

function buttonClicked(event)
{
	$(document).find(activitySelector).find(iconSelector).each(function()
	                                                           {
		                                                           $(this).click();
	                                                           });
}

// @endif