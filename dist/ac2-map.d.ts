export declare const stateColor: {
    "Stopped": string;
    "Started": string;
    "InError": string;
    "Starting": string;
};
export interface NodeDataArrayItem {
    key: string;
    text?: string;
    group?: string;
    color?: string;
    isGroup?: boolean;
}
export interface LinkDataArrayItem {
    from: string;
    to: string;
}
export declare class AC2Map {
    private diagram;
    init(): void;
    private getDiagramTemplate;
    private getNodeTemplate;
    private getLinkTemplate;
    private getGroupTemplate;
    update(response: any): void;
}
