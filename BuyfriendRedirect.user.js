"use strict";
// ==UserScript==
// @name         BuyFriend Redirect
// @namespace    http://candicejoy.com/
// @version      1.1
// @description  Auto-clicker for Buyfriend.Moe notifications
// @author       CandiceJoy
// @match        https://buyfriend.moe/search?search=https://www.amiami.com/eng/detail/?*
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=amiami.com
// @downloadURL https://cdn.jsdelivr.net/gh/CandiceJoy/CandiceJoy-Userscripts/BuyfriendRedirect.user.js
// @supportURL https://github.com/CandiceJoy/CandiceJoy-Userscripts/issues
// @grant        none
// ==/UserScript==
(function () {
    "use strict";
    const logo = "amiamilogo.png";
    $("a img").each(function () {
        const attr = $(this).attr("src");
        if (attr && attr.includes(logo)) {
            $(this).trigger("click");
        }
    });
    $("h3 a").each(function () {
        const attr = $(this).attr("href");
        if (attr) {
            location.href = attr;
        }
    });
})();

//# sourceMappingURL=maps/BuyfriendRedirect.user.js.map
