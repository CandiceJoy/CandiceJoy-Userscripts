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
(function () {
    "use strict";
    var itemConditions = ["A", "A-", "B+", "B", "C", "J"];
    var boxConditions = ["A", "B", "C", "N"];
    var configDoc;
    GM_config.init({
        "id": "amiami-search-filter",
        "title": "AmiAmi Search Filter Config", "fields": // Fields object
        {
            "currency": // This is the id of the field
            {
                "label": "Currency (3 letters): ",
                "type": "text",
                "size": "3", "default": "usd" // Default value if user doesn't change it
            }, "allowedItemConditions": // This is the id of the field
            {
                "label": "Lowest Allowed Item Condition: ",
                "type": "select",
                "options": itemConditions,
                "default": "B" // Default value if user doesn't change it
            }, "allowedBoxConditions": // This is the id of the field
            {
                "label": "Lowest Allowed Box Condition: ",
                "type": "select",
                "options": boxConditions,
                "default": "B" // Default value if user doesn't change it
            }, "priceThreshold": // This is the id of the field
            {
                "label": "Hide items above this price (JPY): ",
                "type": "int",
                "default": "10000" // Default value if user doesn't change it
            }, "highlightPrice": // This is the id of the field
            {
                "label": "Highlight items below or equal to this price (JPY): ",
                "type": "int",
                "default": "5000" // Default value if user doesn't change it
            }, "exclude": // This is the id of the field
            {
                "label": "List of search terms to hide (one per line): ",
                "type": "textarea",
                "default": "" // Default value if user doesn't change it
            }, "dontExclude": // This is the id of the field
            {
                "label": "List of search terms to exclude from price and condition filters (one per line): ",
                "type": "textarea",
                "default": "" // Default value if user doesn't change it
            }
        },
        "events": {
            "open": function (doc) {
                configDoc = doc;
                $(configDoc).find("#amiami-search-filter_field_currency").attr("maxlength", "3");
                $(configDoc).find("#amiami-search-filter_field_exclude").attr("cols", "20");
                $(configDoc).find("#amiami-search-filter_field_dontExclude").attr("cols", "20");
                $(configDoc).find("textarea").each(function () {
                    $(this)
                        .height($(this)[0].scrollHeight +
                        20);
                });
            }, "save": function () {
                $(configDoc).find("textarea").each(function () {
                    $(this)
                        .height($(this)[0].scrollHeight +
                        20);
                });
                if ($(configDoc)
                    .find("#amiami-search-filter_field_currency")
                    .val()
                    .toString().length !== 3) {
                    alert("Currency must be 3 letters");
                }
                if (parseInt($(configDoc)
                    .find("#amiami-search-filter_field_priceThreshold")
                    .val()
                    .toString()) >=
                    50000) {
                    alert("Price threshold too high");
                }
                if (parseInt($(configDoc)
                    .find("#amiami-search-filter_field_highlightPrice")
                    .val()
                    .toString()) <=
                    500) {
                    alert("Highlight price too low");
                }
            }
        }
    });
    var allowedItemConditions = GM_config.get("allowedItemConditions").toString(); //letters only
    var allowedBoxConditions = GM_config.get("allowedBoxConditions").toString(); //letters only
    var currency = GM_config.get("currency").toString().toLowerCase(); //lowercase, 3 letter
    var priceThreshold = parseInt(GM_config.get("priceThreshold").toString()); //exclude prices > this (yen)
    var highlightPrice = parseInt(GM_config.get("highlightPrice").toString()); //highlight prices <= this (yen)
    var alwaysExclude = (GM_config.get("exclude")) ? GM_config.get("exclude").toString().split("\n") : [];
    var dontExclude = (GM_config.get("dontExclude")) ?
        GM_config.get("dontExclude").toString().split("\n") :
        [];
    var itemSelector = ".newly-added-items__item";
    var pagerSelector = ".pager_mb,.pager-list";
    var pagerNumSelector = "li.pager-list__item_num";
    var gcodeSelector = "a";
    var gcodeID = "gcode";
    var itemConditionRegex = new RegExp("ITEM:(.*?)\\/", "id");
    var boxConditionRegex = new RegExp("BOX:(.*?)\\)", "id");
    var orderClosed = "order closed";
    var observerConfig = {
        childList: true, subtree: true, attributes: true
    };
    function observerFunc(mutations) {
        mutations.forEach(function (mutation) {
            var found = $(mutation.addedNodes).find(itemSelector).length;
            if (found > 0) {
                $(itemSelector).hide();
                processButtons();
                update(mutation.addedNodes);
                $(".header-head__menu")
                    .prepend("<button style='font-size: 15px;'>Filter Config</button>")
                    .on("click", function () {
                    GM_config.open();
                });
            }
        });
    }
    var observer = new MutationObserver(observerFunc);
    var basePath = "".concat(window.location.protocol, "//").concat(window.location.host);
    var AmiAmiItem = /** @class */ (function () {
        function AmiAmiItem(gcode, link, element) {
            this.url = basePath + link;
            this.gcode = gcode;
            this.element = element;
        }
        AmiAmiItem.prototype.init = function () {
            $.ajax("https://api.amiami.com/api/v1.0/item?gcode=".concat(this.gcode), { dataType: "json", headers: { "x-user-key": "amiami_dev" } })
                .always(this.setup.bind(this));
        };
        AmiAmiItem.prototype.setup = function (data, textStatus, xhr) {
            var _this = this;
            var root = JSON.parse(data);
            var item = root.item;
            //Object.assign(this,root.item);
            //const item = this.item;
            if (xhr.status !== 200) {
                console.log("API Call Failed [".concat(this.gcode, "]"));
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
            this.mfc = "https://myfigurecollection.net/browse.v4.php?keywords=".concat(this.jancode);
            this.sname = item.sname;
            this.itemCondition = new RegExp(itemConditionRegex).exec(item.sname)[1];
            this.boxCondition = new RegExp(boxConditionRegex).exec(item.sname)[1];
            var ele = this.element;
            var tags = $(ele).find(".newly-added-items__item__tag-list__item:not([style]), .newly-added-items__item__tag-list__item[style='']");
            $.ajax("https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/jpy/".concat(currency, ".json"))
                .always(function (data) {
                var conversionFactor = $(data).attr(currency);
                var newPrice = parseFloat(conversionFactor) * this.price;
                var formatter = new Intl.NumberFormat("en-US", {
                    style: "currency", currency: currency.toUpperCase()
                });
                this.convertedPrice = formatter.format(newPrice);
                if (this.convertedPrice !== undefined) {
                    $(this.element).find(".newly-added-items__item__price").text(this.convertedPrice);
                    $(this.element).find(".newly-added-items__item__price_state_currency").hide();
                }
            }.bind(this));
            tags.each(function (key, val) {
                var text = val.innerText.toLowerCase();
                if (text.includes(orderClosed.toLowerCase())) {
                    _this.closed = true;
                    console.log("".concat(name, ": Order Closed[tag]"));
                }
            });
            var aTags = ele.getElementsByTagName("span");
            var searchText = " ";
            for (var i = 0; i < aTags.length; i++) {
                if (aTags[i].textContent === searchText) {
                    $(aTags[i]).hide();
                    break;
                }
            }
            this.processItem();
        };
        AmiAmiItem.prototype.processItem = function () {
            //Process Always Exclude List
            for (var y in alwaysExclude) {
                var exclude2 = alwaysExclude[y].toLowerCase();
                if (this.name.toLowerCase().indexOf(exclude2) > -1) {
                    console.log("".concat(this.name, ": Always exclude [").concat(exclude2, "]"));
                    return;
                }
            }
            //Process Buy Flag
            if (!this.buy) {
                console.log("".concat(this.name, ": Buy Flag Off [").concat(this.instock, "]"));
                return;
            }
            //Process Order Closed Flag
            if (this.closed) {
                console.log("".concat(this.name, ": Order Closed [flag]"));
                return;
            }
            //Process Price Missing
            if (this.price === undefined || this.price.toString() === "") {
                console.log("".concat(this.name, ": Can't find price [").concat(this.price, "]"));
                return;
            }
            //Process Don't Exclude List
            for (var x in dontExclude) {
                var exclude1 = dontExclude[x].toLowerCase();
                if (this.name.toLowerCase().indexOf(exclude1) > -1) {
                    console.log("".concat(this.name, ": Don't exclude [").concat(exclude1, "]"));
                    this.show();
                    this.finish();
                    return;
                }
            }
            //Process Too Expensive
            if (this.price > priceThreshold) {
                console.log("".concat(this.name, ": High Price [").concat(this.price, "]"));
                return;
            }
            //Process Item Condition
            if (itemConditions.indexOf(this.itemCondition) > itemConditions.indexOf(allowedItemConditions)) {
                console.log("".concat(this.name, ": Item Condition [").concat(this.itemCondition, "]"));
                return;
            }
            //Process Box Condition
            if (boxConditions.indexOf(this.boxCondition) > itemConditions.indexOf(allowedBoxConditions)) {
                console.log("".concat(this.name, ": Box Condition [").concat(this.boxCondition, "]"));
                return;
            }
            this.show();
            this.finish();
        };
        AmiAmiItem.prototype.finish = function () {
            this.addTag("Item: ".concat(this.itemCondition));
            this.addTag("Box: ".concat(this.boxCondition));
            var mfcTag = this.addTag("<a href=\"".concat(this.mfc, "\">MFC</a>"));
            $(mfcTag).click(function (e) {
                e.stopImmediatePropagation();
            });
            if (this.price <= highlightPrice) {
                $(this.element).find(".newly-added-items__item__price").css("color", "green");
            }
        };
        AmiAmiItem.prototype.addTag = function (text) {
            var ele = this.element;
            var tag = document.createElement("li");
            $(tag).addClass("newly-added-items__item__tag-list__item");
            $(tag).html(text);
            $(tag).attr("style", "display: inline;");
            $(ele).find(".newly-added-items__item__tag-list").append($(tag));
            return tag;
        };
        AmiAmiItem.prototype.show = function () {
            $(this.element).show();
        };
        return AmiAmiItem;
    }());
    (function () {
        observer.observe(document.querySelector("body"), observerConfig);
    })();
    function processButtons() {
        var url = new URL(location.href);
        var urlParams = url.searchParams;
        var page = parseInt(urlParams.get("pagecnt"));
        var maxPage = parseInt($(pagerNumSelector).last().text());
        $(pagerSelector).children().each(function () {
            $(this).hide();
        });
        if (page !== 1) {
            $(pagerSelector).each(function () {
                var firstButton = document.createElement("button");
                firstButton.innerText = "First";
                firstButton.type = "button";
                firstButton.classList.add("candibutton");
                firstButton.addEventListener("click", function () {
                    urlParams.set("pagecnt", "1");
                    location.href = url.toString();
                });
                $(this).append(firstButton);
            });
        }
        $(pagerSelector).each(function () {
            var refreshButton = document.createElement("button");
            refreshButton.innerText = "Reload";
            refreshButton.type = "button";
            refreshButton.classList.add("candibutton");
            refreshButton.addEventListener("click", function () {
                location.reload();
            });
            $(this).append(refreshButton);
        });
        if (page >= 2) {
            $(pagerSelector).each(function () {
                var prevButton = document.createElement("button");
                prevButton.innerText = "Prev Page";
                prevButton.type = "button";
                prevButton.classList.add("candibutton");
                prevButton.addEventListener("click", function () {
                    urlParams.set("pagecnt", (page - 1).toString());
                    location.href = url.toString();
                });
                $(this).append(prevButton);
            });
        }
        if (page < maxPage) {
            $(pagerSelector).each(function () {
                var nextButton = document.createElement("button");
                nextButton.innerText = "Next Page";
                nextButton.type = "button";
                nextButton.classList.add("candibutton");
                nextButton.addEventListener("click", function () {
                    urlParams.set("pagecnt", (page + 1).toString());
                    location.href = url.toString();
                });
                $(this).append(nextButton);
            });
        }
        var candibutton = $(".candibutton");
        candibutton.css("margin-right", "10px");
        candibutton.css("margin-left", "10px");
        $(pagerSelector).prepend("</p>".concat(page, "/").concat(maxPage, "</p>"));
    }
    function update(node) {
        $(node).find(itemSelector).each(function () {
            var href = $(this).find(gcodeSelector);
            var link = href.attr("href");
            var urlParams = new URL(basePath + link).searchParams;
            var gcode = urlParams.get(gcodeID);
            var item = new AmiAmiItem(gcode, link, this);
            item.init();
        });
    }
})();
// @endif
