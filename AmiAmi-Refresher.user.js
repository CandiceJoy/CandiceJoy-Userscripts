"use strict";
// ==UserScript==
// @name         AmiAmi Refresher
// @namespace    http://candicejoy.com/
// @version      1.3
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
    const currency = "usd";
    const refreshSeconds = 1500; //seconds
    //--== End User Editable ==--
    const buttonSelector = "button.btn-cart:not([style]), button.btn-cart[style='']";
    const priceSelector = ".item-detail__price_selling-price";
    const priceThreshold = 10000;
    const refreshTimer = refreshSeconds * 1000;
    const timeout = setTimeout(function () {
        location.reload();
    }, refreshTimer);
    const observer = new MutationObserver(observerFunc);
    const body = document.querySelector("body");
    const observerConfig = {
        childList: true,
        subtree: true,
        attributes: true
    };
    if (body !== null) {
        observer.observe(body, observerConfig);
    }
    function jancodeLink() {
        const ele = $(document)
            .find(".item-about__data :contains('JAN code')")
            .next(".item-about__data-text");
        if (ele.length > 0) {
            const jancode = ele.text();
            if (jancode && jancode.trim() !== "") {
                const url = `https://myfigurecollection.net/browse.v4.php?keywords=${jancode}`;
                ele.empty();
                ele.append(`<a href="javascript: window.open('${url}', '_blank').focus();">${jancode}</a>`);
                return true;
            }
            else {
                return false;
            }
        }
        return false;
    }
    function getPrice() {
        return parseInt($(priceSelector).text().replace("JPY", "").replace(",", ""));
    }
    function cartButton() {
        const cartButton = $(document).find(buttonSelector);
        let clicked = false;
        cartButton.each(function () {
            const text = $(this).text();
            if (text.toLowerCase().includes("cart")) {
                if (getPrice() > priceThreshold) {
                    clearTimeout(timeout);
                    console.log("Price too high, not auto-clicking");
                }
                else {
                    console.log("CLICK");
                    $(cartButton).trigger("click");
                }
                clicked = true;
            }
        });
        return clicked;
    }
    function currencyConversion() {
        $.ajax(`https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/jpy/${currency}.json`)
            .always(function (data) {
            const result = $(data).attr(currency);
            let conversionFactor;
            if (result) {
                conversionFactor = result;
            }
            else {
                return;
            }
            const newPrice = parseFloat(conversionFactor) * getPrice();
            const formatter = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: currency.toUpperCase()
            });
            const finalPrice = formatter.format(newPrice);
            if (finalPrice !== undefined) {
                $(document).find(".item-detail__price_selling-price").text(finalPrice);
            }
        });
    }
    let done1 = false;
    let done2 = false;
    function observerFunc(mutations) {
        mutations.forEach(() => {
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
})();
