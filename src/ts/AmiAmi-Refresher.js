// ==UserScript==
// @name         AmiAmi Refresher
// @namespace    http://candicejoy.com/
// @version      1.1
// @description  AmiAmi Refresher / Auto-Add-To-Cart
// @author       CandiceJoy
// @match        https://www.amiami.com/eng/detail/*
// @icon         https://www.google.com/s2/favicons?domain=amiami.com
// @grant        none
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @downloadURL https://cdn.jsdelivr.net/gh/CandiceJoy/CandiceJoy-Userscripts/AmiAmi-Refresher.user.js
// @supportURL https://github.com/CandiceJoy/CandiceJoy-Userscripts/issues
// @run-at document-idle
// ==/UserScript==
(function () {
    "use strict";
    //--== User Editable ==--
    var currency = "usd";
    var refreshSeconds = 15; //seconds
    //--== End User Editable ==--
    var buttonSelector = "button.btn-cart[style=\"\"]";
    var priceSelector = ".item-detail__price_selling-price";
    var priceThreshold = 10000;
    var refreshTimer = refreshSeconds * 1000;
    var timeout = setTimeout(function () {
        location.reload();
    }, refreshTimer);
    function jancodeLink() {
        //console.log(nodes);
        var ele = $(document)
            .find(".item-about__data :contains('JAN code')")
            .next(".item-about__data-text");
        if (ele.length > 0) {
            var jancode = ele.text();
            if (jancode !== undefined && jancode !== null && jancode.trim() !== "") {
                var url = "https://myfigurecollection.net/browse.v4.php?keywords=".concat(jancode);
                $(ele).html("<a href=\"javascript: window.open('".concat(url, "', '_blank').focus();\">").concat(jancode, "</a>"));
                return true;
            }
        }
        return false;
    }
    function getPrice() {
        return parseInt($(priceSelector).text().replace("JPY", "").replace(",", ""));
    }
    function cartButton() {
        var cartButton = $(document).find(buttonSelector);
        if (cartButton !== undefined && cartButton !== null) {
            if (getPrice() > priceThreshold) {
                clearTimeout(timeout);
                console.log("Price too high, not auto-clicking");
            }
            else {
                console.log("CLICK");
                $(cartButton).click();
            }
            return true;
        }
        return false;
    }
    function currencyConversion() {
        $.ajax("https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/jpy/".concat(currency, ".json"))
            .always(function (data) {
            var result = $(data).attr(currency);
            var conversionFactor;
            if (result) {
                conversionFactor = result;
            }
            else {
                return;
            }
            var newPrice = parseFloat(conversionFactor) * getPrice();
            var formatter = new Intl.NumberFormat("en-US", {
                style: "currency", currency: currency.toUpperCase()
            });
            var finalPrice = formatter.format(newPrice);
            if (finalPrice !== undefined) {
                $(document).find(".item-detail__price_selling-price").text(finalPrice);
            }
        });
    }
    var observerConfig = {
        childList: true, subtree: true, attributes: true
    };
    function observerFunc(mutations) {
        var done1 = false;
        var done2 = false;
        mutations.forEach(function () {
            if (done1 && done2) {
                return;
            }
            if (!done1) {
                done1 = jancodeLink();
            }
            if (!done2) {
                done2 = cartButton();
            }
            if (done1 && done2) {
                currencyConversion();
                observer.disconnect();
            }
        });
    }
    var observer = new MutationObserver(observerFunc);
    (function () {
        var body = document.querySelector("body");
        if (body !== null) {
            observer.observe(body, observerConfig);
        }
    })();
})();
