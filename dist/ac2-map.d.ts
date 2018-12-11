export declare enum stateColor {
    Stopped = "red",
    Started = "green",
    InError = "gray",
    Starting = "Orange"
}
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
export interface AC2Data {
    GroupName: string;
    Name: string;
    State: string;
    Parents: string[];
}
export declare class AC2Map {
    private diagram;
    private containerId;
    private $;
    init(): void;
    clear(): void;
    private getDiagramTemplate;
    private getNodeTemplate;
    private getLinkTemplate;
    private getGroupTemplate;
    private getGoJsData;
    draw(data: Array<AC2Data>): void;
    private applyAddRemoveNodesFromModel;
    private applyAddRemoveLinksFromModel;
    update(data: Array<AC2Data>): void;
}
