declare class Watcher {
    private readonly options;
    private observer;
    private callback;
    private node;
    private filter;
    constructor(callback: (arg0: Node) => void, node?: HTMLBodyElement | null);
    createObserver(): void;
    setCallback(callback: (arg0: Node) => void): void;
    setNode(node: Node | null): void;
    setOption(option: string, value: string): void;
    setFilter(filter: () => boolean): void;
    observed(mutations: MutationRecord[]): void;
    on(): void;
    off(): void;
}
