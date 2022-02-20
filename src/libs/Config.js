(()=>{"use strict";var __webpack_modules__={473:(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{eval('/* unused harmony export Config */\n/// <reference types="../types/GM_config"/>\r\nconst allowedProperties = {\r\n    all: ["title", "labelPos"], text: ["size"], int: ["size", "min", "max"], float: ["size"], select: ["options"], radio: ["options"], hidden: ["value"], button: ["size", "click"]\r\n};\r\nfunction checkProperty(type, key) {\r\n    const entries = Object.entries(allowedProperties);\r\n    const entry = entries.find(([propertyName]) => propertyName === type);\r\n    if (!entry) {\r\n        throw "Internal error; invalid type after assertion to the contrary";\r\n    }\r\n    const [, propertyValue] = entry;\r\n    if (!propertyValue.includes(key)) {\r\n        throw "Invalid property \'" + key + "\'; allowed properties are: " + allowedProperties;\r\n    }\r\n}\r\nclass Config {\r\n    constructor(id, title) {\r\n        this.id = id;\r\n        this.title = title;\r\n        this.fields = [];\r\n        this.events = [];\r\n    }\r\n    add(name, label, typeIn, defaultValue, properties = null) {\r\n        this.addField(name, label, typeIn, defaultValue, properties);\r\n    }\r\n    addField(name, label, typeIn, defaultValue, properties = null) {\r\n        if (name instanceof ConfigField) {\r\n            this.fields.push(name);\r\n        }\r\n        else if (properties) {\r\n            const field = new ConfigField(name, label, typeIn, defaultValue, properties);\r\n            this.fields.push(field);\r\n        }\r\n        else {\r\n            const field = new ConfigField(name, label, typeIn, defaultValue);\r\n            this.fields.push(field);\r\n        }\r\n    }\r\n    setProperty(fieldIn, key, value) {\r\n        if (!this.fields) {\r\n            throw "No fields exist";\r\n        }\r\n        const field = this.fields.find(({ name }) => name === fieldIn);\r\n        if (!field) {\r\n            throw "Field \'" + fieldIn + "\' not found; current fields are " + this.fields.map((x) => x.name);\r\n        }\r\n        field.setProperty(key, value);\r\n    }\r\n    event(name, callback) {\r\n        this.addEvent(name, callback);\r\n    }\r\n    addEvent(name, callback) {\r\n        if (!name) {\r\n            throw "Name required";\r\n        }\r\n        if (!callback) {\r\n            throw "Callback required";\r\n        }\r\n        const event = new ConfigEvent(name, callback);\r\n        this.events.push(event);\r\n    }\r\n    generateFields() {\r\n        const fieldsObject = {};\r\n        for (const i in this.fields) {\r\n            const field = this.fields[i];\r\n            const fieldObject = {\r\n                "label": field.label, "type": field.type, "default": field.defaultValue\r\n            };\r\n            const props = field.getProperties();\r\n            for (const i in props) {\r\n                const propTuple = props[i];\r\n                const key = propTuple[0];\r\n                fieldObject[key] = propTuple[1];\r\n            }\r\n            fieldsObject[field.name] = fieldObject;\r\n        }\r\n        return fieldsObject;\r\n    }\r\n    generateEvents() {\r\n        if (this.events.length <= 0) {\r\n            return null;\r\n        }\r\n        const eventsObject = {};\r\n        for (const i in this.events) {\r\n            const event = this.events[i];\r\n            eventsObject[event.event] = event.callback;\r\n        }\r\n        return eventsObject;\r\n    }\r\n    init() {\r\n        const fields = this.generateFields();\r\n        if (!fields) {\r\n            throw "Must have at least 1 field";\r\n        }\r\n        const configObject = {\r\n            "id": this.id, "title": this.title, "fields": fields\r\n        };\r\n        const events = this.generateEvents();\r\n        if (events) {\r\n            Object.defineProperty(configObject, "events", events);\r\n        }\r\n        GM_config.init(configObject);\r\n    }\r\n    show() {\r\n        GM_config.open();\r\n        const element = GM_config.frame;\r\n        if (element && element instanceof HTMLIFrameElement) {\r\n            this.frame = element;\r\n        }\r\n        return new Promise((resolve) => {\r\n            this.frame.onload = (() => {\r\n                const doc = this.frame.contentDocument;\r\n                const win = this.frame.contentWindow;\r\n                if (doc) {\r\n                    this.document = doc;\r\n                }\r\n                if (win) {\r\n                    this.window = win;\r\n                }\r\n            }).bind(this);\r\n            resolve();\r\n        });\r\n    }\r\n    get(name) {\r\n        return GM_config.get(name).toString();\r\n    }\r\n}\r\nclass ConfigEvent {\r\n    constructor(event, callback) {\r\n        this.allowedEvents = ["init", "open", "save", "close", "reset"];\r\n        if (!this.allowedEvents.includes(event)) {\r\n            throw "Invalid event \'" + event + "\'; allowed events are " + this.allowedEvents;\r\n        }\r\n        if (!callback) {\r\n            throw "Callback must be a valid function";\r\n        }\r\n        this.event = event;\r\n        this.callback = callback;\r\n    }\r\n}\r\nclass ConfigField {\r\n    constructor(name, label, type, defaultValue, properties = null) {\r\n        this.types = ["number", "int", "integer", "float", "text", "textarea", "select", "button", "checkbox", "radio", "hidden"];\r\n        this.name = name;\r\n        this.label = label;\r\n        this.type = type;\r\n        this.defaultValue = defaultValue;\r\n        if (!name) {\r\n            throw "Name required for " + name;\r\n        }\r\n        if (!label) {\r\n            throw "Label required for " + name;\r\n        }\r\n        if (!type) {\r\n            throw "Type required for " + name;\r\n        }\r\n        if (!this.types.includes(type)) {\r\n            throw "Invalid type \'" + type + "\'.  Valid types are: " + this.types;\r\n        }\r\n        if (properties) {\r\n            this.properties = {};\r\n            const props = properties;\r\n            for (const propertyName in props) {\r\n                checkProperty(this.type, propertyName);\r\n                this.properties[propertyName] = props[propertyName];\r\n            }\r\n        }\r\n    }\r\n    setProperty(key, value) {\r\n        if (!this.properties) {\r\n            this.properties = {};\r\n        }\r\n        checkProperty(this.type, key);\r\n        this.properties[key] = value;\r\n    }\r\n    getProperties() {\r\n        const props = [];\r\n        for (const key in this.properties) {\r\n            const value = this.properties[key];\r\n            props.push([key, value]);\r\n        }\r\n        return props;\r\n    }\r\n}\r\n/* Example\r\n\r\n const itemConditions = ["A", "A-", "B+", "B", "C", "J"];\r\n const boxConditions = ["A", "B", "C", "N"];\r\n let configDoc;\r\n\r\n let config = new Config("amiami-search-filter","AmiAmi Search Filter Config");\r\n config.add("currency","Currency (3 Letters): ","text","usd",{size:3});\r\n config.add("allowedItemConditions","Lowest Allowed Item Condition: ","select","B",{options:itemConditions});\r\n config.add("allowedBoxConditions","Lowest Allowed Box Condition: ","select","B",{options:boxConditions});\r\n config.add("priceThreshold", "Hide items above this price (JPY): ", "int", "10000" );\r\n config.add("highlightPrice", "Highlight items below or equal to this price (JPY): ", "int", "10000" );\r\n config.add("exclude", "List of search terms to hide (one per line): ", "textarea", "" );\r\n config.add("dontExclude", "List of search terms to exclude from price and condition filters (one per line): ", "textarea", "" );\r\n config.init();\r\n await config.show(); //If you don\'t await, config.frame, config.document, and config.window will not be properly populated; if you\'re not going to use those variables, await is not needed\r\n $(config.document).find("div").css("color", "green"); //Example of changing the frame\'s document using jQuery\r\n */ \r\n\n\n//# sourceURL=webpack://candicejoy-userscripts/./src/libs/Config.ts?')}},__webpack_require__={d:(e,n)=>{for(var r in n)__webpack_require__.o(n,r)&&!__webpack_require__.o(e,r)&&Object.defineProperty(e,r,{enumerable:!0,get:n[r]})},o:(e,n)=>Object.prototype.hasOwnProperty.call(e,n)},__webpack_exports__={};__webpack_modules__[473](0,__webpack_exports__,__webpack_require__)})();