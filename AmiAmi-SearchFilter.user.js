"use strict";
(function () {
    "use strict";
    const itemConditions = ["A", "A-", "B+", "B", "C", "J"];
    const boxConditions = ["A", "B", "C", "N"];
    let configDoc;
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
                    const scroll = $(this)[0];
                    if (scroll) {
                        $(this)
                            .height(scroll.scrollHeight + 20);
                    }
                });
            }, "save": function () {
                $(configDoc).find("textarea").each(function () {
                    const scroll = $(this)[0];
                    if (scroll) {
                        $(this)
                            .height(scroll.scrollHeight + 20);
                    }
                });
                const currencyValue = $(configDoc)
                    .find("#amiami-search-filter_field_currency")
                    .val();
                if (currencyValue && currencyValue.toString().length !== 3) {
                    alert("Currency must be 3 letters");
                }
                const priceThresholdValue = $(configDoc)
                    .find("#amiami-search-filter_field_priceThreshold")
                    .val();
                if (priceThresholdValue && parseInt(priceThresholdValue.toString()
                    .toString()) >= 50000) {
                    alert("Price threshold too high");
                }
                const highlightPriceValue = $(configDoc)
                    .find("#amiami-search-filter_field_highlightPrice")
                    .val();
                if (highlightPriceValue && parseInt(highlightPriceValue.toString()
                    .toString()) <= 500) {
                    alert("Highlight price too low");
                }
            }
        }
    });
    const allowedItemConditions = GM_config.get("allowedItemConditions").toString(); //letters only
    const allowedBoxConditions = GM_config.get("allowedBoxConditions").toString(); //letters only
    const currency = GM_config.get("currency").toString().toLowerCase(); //lowercase, 3 letter
    const priceThreshold = parseInt(GM_config.get("priceThreshold").toString()); //exclude prices > this (yen)
    const highlightPrice = parseInt(GM_config.get("highlightPrice").toString()); //highlight prices <= this (yen)
    const alwaysExclude = (GM_config.get("exclude")) ? GM_config.get("exclude").toString().split("\n") : [];
    const dontExclude = (GM_config.get("dontExclude")) ? GM_config.get("dontExclude").toString().split("\n") : [];
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
    function observerFunc(mutations) {
        mutations.forEach((mutation) => {
            const found = $(mutation.addedNodes).find(itemSelector).length;
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
    const observer = new MutationObserver(observerFunc);
    const basePath = `${window.location.protocol}//${window.location.host}`;
    class AmiAmiItem {
        //private resale: number| undefined;
        //private scode: string| undefined;
        //private sname: string| undefined;
        constructor(gcode, element) {
            //private url: string;
            this.mfc = "";
            this.itemCondition = "";
            this.boxCondition = "";
            //private item: Item | undefined;
            this.name = "";
            this.jancode = "";
            this.instock = true;
            this.price = 0;
            this.buy = true;
            //private preowned: boolean| undefined;
            this.closed = false;
            //this.url = basePath + link;
            this.gcode = gcode;
            this.element = element;
        }
        init() {
            $.ajax(`https://api.amiami.com/api/v1.0/item?gcode=${this.gcode}`, { dataType: "json", headers: { "x-user-key": "amiami_dev" } })
                .always(this.setup.bind(this));
        }
        setup(data, _textStatus, xhr) {
            const root = JSON.parse(data);
            const item = root.item;
            //Object.assign(this,root.item);
            //const item = this.item;
            if (typeof xhr !== "string" && xhr.status !== 200) {
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
            const itemConditionParseResults = itemConditionRegex.exec(item.sname);
            if (itemConditionParseResults) {
                const condition = itemConditionParseResults[1];
                if (condition) {
                    this.itemCondition = condition;
                }
            }
            const boxConditionParseResults = boxConditionRegex.exec(item.sname);
            if (boxConditionParseResults) {
                const condition = boxConditionParseResults[1];
                if (condition) {
                    this.boxCondition = condition;
                }
            }
            const ele = this.element;
            const tags = $(ele).find(".newly-added-items__item__tag-list__item:not([style]), .newly-added-items__item__tag-list__item[style='']");
            $.ajax(`https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/jpy/${currency}.json`)
                .always((data) => {
                const conversionFactor = $(data).attr(currency);
                let newPrice = -1;
                if (conversionFactor) {
                    newPrice = parseFloat(conversionFactor) * this.price;
                }
                const formatter = new Intl.NumberFormat("en-US", {
                    style: "currency", currency: currency.toUpperCase()
                });
                const convertedPrice = formatter.format(newPrice);
                if (convertedPrice !== undefined) {
                    $(this.element).find(".newly-added-items__item__price").text(convertedPrice);
                    $(this.element).find(".newly-added-items__item__price_state_currency").hide();
                }
            });
            tags.each((_key, val) => {
                const text = val.innerText.toLowerCase();
                if (text.includes(orderClosed.toLowerCase())) {
                    this.closed = true;
                    console.log(`${this.name}: Order Closed[tag]`);
                }
            });
            const aTags = ele.getElementsByTagName("span");
            const searchText = " ";
            for (let i = 0; i < aTags.length; i++) {
                const tag = aTags[i];
                if (tag && tag.textContent === searchText) {
                    $(tag).hide();
                    break;
                }
            }
            this.processItem();
        }
        processItem() {
            //Process Always Exclude List
            for (const y in alwaysExclude) {
                const currentExclude = alwaysExclude[y];
                let exclude2 = "";
                if (currentExclude) {
                    exclude2 = currentExclude.toLowerCase();
                }
                if (this.name.toLowerCase().indexOf(exclude2) > -1) {
                    console.log(`${this.name}: Always exclude [${exclude2}]`);
                    return;
                }
            }
            //Process Buy Flag
            if (!this.buy) {
                console.log(`${this.name}: Buy Flag Off [${this.instock}]`);
                return;
            }
            //Process Order Closed Flag
            if (this.closed) {
                console.log(`${this.name}: Order Closed [flag]`);
                return;
            }
            //Process Price Missing
            if (this.price === undefined || this.price.toString() === "") {
                console.log(`${this.name}: Can't find price [${this.price}]`);
                return;
            }
            //Process Don't Exclude List
            for (const x in dontExclude) {
                const currentExclude = dontExclude[x];
                let exclude1 = "";
                if (currentExclude) {
                    exclude1 = currentExclude.toLowerCase();
                }
                if (this.name.toLowerCase().indexOf(exclude1) > -1) {
                    console.log(`${this.name}: Don't exclude [${exclude1}]`);
                    this.show();
                    this.finish();
                    return;
                }
            }
            //Process Too Expensive
            if (this.price > priceThreshold) {
                console.log(`${this.name}: High Price [${this.price}]`);
                return;
            }
            //Process Item Condition
            if (itemConditions.indexOf(this.itemCondition) > itemConditions.indexOf(allowedItemConditions)) {
                console.log(`${this.name}: Item Condition [${this.itemCondition}]`);
                return;
            }
            //Process Box Condition
            if (boxConditions.indexOf(this.boxCondition) > itemConditions.indexOf(allowedBoxConditions)) {
                console.log(`${this.name}: Box Condition [${this.boxCondition}]`);
                return;
            }
            this.show();
            this.finish();
        }
        finish() {
            this.addTag(`Item: ${this.itemCondition}`);
            this.addTag(`Box: ${this.boxCondition}`);
            const mfcTag = this.addTag(`<a href="${this.mfc}">MFC</a>`);
            $(mfcTag).on("click", function (e) {
                e.stopImmediatePropagation();
            });
            if (this.price <= highlightPrice) {
                $(this.element).find(".newly-added-items__item__price").css("color", "green");
            }
        }
        addTag(text) {
            const ele = this.element;
            const tag = document.createElement("li");
            $(tag).addClass("newly-added-items__item__tag-list__item");
            $(tag).html(text);
            $(tag).attr("style", "display: inline;");
            $(ele).find(".newly-added-items__item__tag-list").append($(tag));
            return tag;
        }
        show() {
            $(this.element).show();
        }
    }
    (function () {
        const body = document.querySelector("body");
        if (body) {
            observer.observe(body, observerConfig);
        }
    })();
    function processButtons() {
        const url = new URL(location.href);
        const urlParams = url.searchParams;
        const pageParam = urlParams.get("pagecnt");
        if (!pageParam) {
            return;
        }
        const page = parseInt(pageParam);
        const maxPage = parseInt($(pagerNumSelector).last().text());
        $(pagerSelector).children().each(function () {
            $(this).hide();
        });
        if (page !== 1) {
            $(pagerSelector).each(function () {
                const firstButton = document.createElement("button");
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
            const refreshButton = document.createElement("button");
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
                const prevButton = document.createElement("button");
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
                const nextButton = document.createElement("button");
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
        const candibutton = $(".candibutton");
        candibutton.css("margin-right", "10px");
        candibutton.css("margin-left", "10px");
        $(pagerSelector).prepend(`</p>${page}/${maxPage}</p>`);
    }
    function update(node) {
        $(node).find(itemSelector).each(function () {
            const href = $(this).find(gcodeSelector);
            const link = href.attr("href");
            const urlParams = new URL(basePath + link).searchParams;
            const gcode = urlParams.get(gcodeID);
            if (gcode && link) {
                const item = new AmiAmiItem(gcode, this);
                item.init();
            }
        });
    }
})();

//# sourceMappingURL=maps/AmiAmi-SearchFilter.user.js.map
