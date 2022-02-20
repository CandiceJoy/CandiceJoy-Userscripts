export declare class Config {
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
