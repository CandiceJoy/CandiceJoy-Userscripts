declare const allowedProperties: object;
declare function checkProperty(type: string, key: string): void;
declare class Config {
    document: Document;
    window: Window;
    frame: HTMLIFrameElement;
    private readonly id;
    private readonly title;
    private readonly fields;
    private readonly events;
    constructor(id: string, title: string);
    add(name: string, label: string, typeIn: string, defaultValue: string, properties?: object | null): void;
    private addField;
    setProperty(fieldIn: string, key: string, value: string): void;
    event(name: string, callback: () => void): void;
    addEvent(name: string, callback: () => void): void;
    private generateFields;
    private generateEvents;
    init(): void;
    show(): Promise<unknown>;
    get(name: string): string;
}
declare class ConfigEvent {
    private readonly allowedEvents;
    readonly event: string;
    readonly callback: () => void;
    constructor(event: string, callback: () => void);
}
declare type Properties = {
    [key: string]: string | string[];
};
declare class ConfigField {
    private readonly types;
    readonly name: string;
    readonly label: string;
    readonly type: string;
    readonly defaultValue: string;
    private properties;
    constructor(name: string, label: string, type: string, defaultValue: string, properties?: object | null);
    setProperty(key: string, value: string): void;
    getProperties(): [string, string | string[]][];
}
