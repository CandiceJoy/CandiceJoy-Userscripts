"use strict";
/* globals GM_config */
/// <reference types="../types/GM_config"/>
const allowedProperties = {
    all: ["title", "labelPos"], text: ["size"], int: ["size", "min", "max"], float: ["size"], select: ["options"], radio: ["options"], hidden: ["value"], button: ["size", "click"]
};
function checkProperty(type, key) {
    const entries = Object.entries(allowedProperties);
    const entry = entries.find(([propertyName]) => propertyName === type);
    if (!entry) {
        throw "Internal error; invalid type after assertion to the contrary";
    }
    const [, propertyValue] = entry;
    if (!propertyValue.includes(key)) {
        throw "Invalid property '" + key + "'; allowed properties are: " + allowedProperties;
    }
}
class Config {
    constructor(id, title) {
        this.id = id;
        this.title = title;
        this.fields = [];
        this.events = [];
    }
    add(name, label, typeIn, defaultValue, properties = null) {
        this.addField(name, label, typeIn, defaultValue, properties);
    }
    addField(name, label, typeIn, defaultValue, properties = null) {
        if (name instanceof ConfigField) {
            this.fields.push(name);
        }
        else if (properties) {
            const field = new ConfigField(name, label, typeIn, defaultValue, properties);
            this.fields.push(field);
        }
        else {
            const field = new ConfigField(name, label, typeIn, defaultValue);
            this.fields.push(field);
        }
    }
    setProperty(fieldIn, key, value) {
        if (!this.fields) {
            throw "No fields exist";
        }
        const field = this.fields.find(({ name }) => name === fieldIn);
        if (!field) {
            throw "Field '" + fieldIn + "' not found; current fields are " + this.fields.map((x) => x.name);
        }
        field.setProperty(key, value);
    }
    event(name, callback) {
        this.addEvent(name, callback);
    }
    addEvent(name, callback) {
        if (!name) {
            throw "Name required";
        }
        if (!callback) {
            throw "Callback required";
        }
        const event = new ConfigEvent(name, callback);
        this.events.push(event);
    }
    generateFields() {
        const fieldsObject = {};
        for (const i in this.fields) {
            const field = this.fields[i];
            const fieldObject = {
                "label": field.label, "type": field.type, "default": field.defaultValue
            };
            const props = field.getProperties();
            for (const i in props) {
                const propTuple = props[i];
                const key = propTuple[0];
                fieldObject[key] = propTuple[1];
            }
            fieldsObject[field.name] = fieldObject;
        }
        return fieldsObject;
    }
    generateEvents() {
        if (this.events.length <= 0) {
            return null;
        }
        const eventsObject = {};
        for (const i in this.events) {
            const event = this.events[i];
            eventsObject[event.event] = event.callback;
        }
        return eventsObject;
    }
    init() {
        const fields = this.generateFields();
        if (!fields) {
            throw "Must have at least 1 field";
        }
        const configObject = {
            "id": this.id, "title": this.title, "fields": fields
        };
        const events = this.generateEvents();
        if (events) {
            Object.defineProperty(configObject, "events", events);
        }
        GM_config.init(configObject);
    }
    show() {
        GM_config.open();
        const element = GM_config.frame;
        if (element && element instanceof HTMLIFrameElement) {
            this.frame = element;
        }
        return new Promise((resolve) => {
            this.frame.onload = (() => {
                const doc = this.frame.contentDocument;
                const win = this.frame.contentWindow;
                if (doc) {
                    this.document = doc;
                }
                if (win) {
                    this.window = win;
                }
            }).bind(this);
            resolve();
        });
    }
    get(name) {
        return GM_config.get(name).toString();
    }
}
class ConfigEvent {
    constructor(event, callback) {
        this.allowedEvents = ["init", "open", "save", "close", "reset"];
        if (!this.allowedEvents.includes(event)) {
            throw "Invalid event '" + event + "'; allowed events are " + this.allowedEvents;
        }
        if (!callback) {
            throw "Callback must be a valid function";
        }
        this.event = event;
        this.callback = callback;
    }
}
class ConfigField {
    constructor(name, label, type, defaultValue, properties = null) {
        this.types = ["number", "int", "integer", "float", "text", "textarea", "select", "button", "checkbox", "radio", "hidden"];
        this.name = name;
        this.label = label;
        this.type = type;
        this.defaultValue = defaultValue;
        if (!name) {
            throw "Name required for " + name;
        }
        if (!label) {
            throw "Label required for " + name;
        }
        if (!type) {
            throw "Type required for " + name;
        }
        if (!this.types.includes(type)) {
            throw "Invalid type '" + type + "'.  Valid types are: " + this.types;
        }
        if (properties) {
            this.properties = {};
            const props = properties;
            for (const propertyName in props) {
                checkProperty(this.type, propertyName);
                this.properties[propertyName] = props[propertyName];
            }
        }
    }
    setProperty(key, value) {
        if (!this.properties) {
            this.properties = {};
        }
        checkProperty(this.type, key);
        this.properties[key] = value;
    }
    getProperties() {
        const props = [];
        for (const key in this.properties) {
            const value = this.properties[key];
            props.push([key, value]);
        }
        return props;
    }
}
/* Example

 const itemConditions = ["A", "A-", "B+", "B", "C", "J"];
 const boxConditions = ["A", "B", "C", "N"];
 let configDoc;

 let config = new Config("amiami-search-filter","AmiAmi Search Filter Config");
 config.add("currency","Currency (3 Letters): ","text","usd",{size:3});
 config.add("allowedItemConditions","Lowest Allowed Item Condition: ","select","B",{options:itemConditions});
 config.add("allowedBoxConditions","Lowest Allowed Box Condition: ","select","B",{options:boxConditions});
 config.add("priceThreshold", "Hide items above this price (JPY): ", "int", "10000" );
 config.add("highlightPrice", "Highlight items below or equal to this price (JPY): ", "int", "10000" );
 config.add("exclude", "List of search terms to hide (one per line): ", "textarea", "" );
 config.add("dontExclude", "List of search terms to exclude from price and condition filters (one per line): ", "textarea", "" );
 config.init();
 await config.show(); //If you don't await, config.frame, config.document, and config.window will not be properly populated; if you're not going to use those variables, await is not needed
 $(config.document).find("div").css("color", "green"); //Example of changing the frame's document using jQuery
 */ 
