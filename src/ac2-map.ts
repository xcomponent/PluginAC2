import * as go from 'gojs';

export enum stateColor {
    Stopped = "red",
    Started = "green",
    InError = "gray",
    Starting = "Orange"

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

export interface AC2Data {
    GroupName: string;
    Name: string;
    State: string;
    Parents: string[];
}

export class AC2Map {

    private diagram: go.Diagram;
    private containerId: string = "container";
    private $ = go.GraphObject.make;


    public init() {
        this.diagram = this.getDiagramTemplate();
        this.diagram.nodeTemplate = this.getNodeTemplate();
        this.diagram.groupTemplate = this.getGroupTemplate()
        this.diagram.linkTemplate = this.getLinkTemplate();
    }

    public clear() {
        if (this.diagram) {
            this.diagram.div = null as any;
        }
    }

    private getDiagramTemplate() {
        return this.$(go.Diagram, this.containerId,
            {
                initialAutoScale: go.Diagram.UniformToFill,
                maxScale: 1,
                contentAlignment: go.Spot.Center,
                "animationManager.isEnabled": false,
                layout: this.$(go.TreeLayout, { angle: 90, sorting: go.TreeLayout.SortingAscending }),
                maxSelectionCount: 1
            });
    }

    private getNodeTemplate() {
        return this.$(go.Node, "Vertical",
            { locationSpot: go.Spot.Center, locationObjectName: "SHAPE" },
            new go.Binding("text", "key", go.Binding.toString),
            this.$(go.Shape, "Rectangle", { desiredSize: new go.Size(30, 30), name: "SHAPE", portId: "" },
                new go.Binding("fill", "color"),
                { stroke: null }),
            this.$(go.TextBlock, { margin: 5, stroke: "rgb(220,220,220)", font: "Bold 12px Sans-Serif" }, new go.Binding("text", "key"))
        );
    }

    private getLinkTemplate() {
        return this.$(go.Link,
            { corner: 10 },
            this.$(go.Shape, { strokeWidth: 1, stroke: "white" }),
            this.$(go.Shape, { toArrow: "OpenTriangle", fill: "white", stroke: "white" })
        );
    }

    private getGroupTemplate() {
        return this.$(go.Group, "Auto",
            {
                layout: this.$(go.TreeLayout,
                    { angle: 90, arrangement: go.TreeLayout.ArrangementHorizontal, isRealtime: false, }),
                isSubGraphExpanded: true,
            },
            this.$(go.Shape, "Rectangle",
                { fill: null, stroke: "gray", strokeWidth: 2 }),
            this.$(go.Panel, "Vertical",
                { defaultAlignment: go.Spot.Center, margin: 4 },
                this.$(go.Panel, "Horizontal",
                    { defaultAlignment: go.Spot.Top },
                    this.$(go.TextBlock,
                        { font: "Bold 12px Sans-Serif", alignment: go.Spot.Center, margin: 4, stroke: "white" },
                        new go.Binding("text", "text"))
                ),
                this.$(go.Placeholder,
                    { padding: new go.Margin(0, 10) })
            )
        );
    }

    private getGoJsData(data: Array<AC2Data>) {
        const nodeDataArray: Array<NodeDataArrayItem> = [];
        const linkDataArray: Array<LinkDataArrayItem> = [];
        const groups: Array<string> = [];
        data.forEach(component => {
            if (groups.indexOf(component.GroupName) === -1) {
                groups.push(component.GroupName);
            }
            const node: NodeDataArrayItem = {
                key: component.Name,
                color: stateColor[component.State],
                group: component.GroupName + "_group"
            };
            if (component.Parents.length > 0) {
                linkDataArray.push({ from: component.Parents[0], to: node.key });
            }
            nodeDataArray.push(node);
        });
        groups.forEach(group => {
            nodeDataArray.push({ key: group + "_group", text: group, isGroup: true });
        });
        return {
            nodeDataArray,
            linkDataArray
        }
    }

    public draw(data: Array<AC2Data>) {
        const goJsData = this.getGoJsData(data);
        this.diagram.model = new go.GraphLinksModel(goJsData.nodeDataArray, goJsData.linkDataArray);
    }

    private applyAddRemoveNodesFromModel(nodeDataArray) {
        const nodesToAdd = nodeDataArray
            .filter(e => this.diagram.model.nodeDataArray.findIndex((el: NodeDataArrayItem) => el.key === e.key) === -1)
            .map(node => Object.assign({}, node));
        this.diagram.model.addNodeDataCollection(nodesToAdd);
        const nodesToRemove = this.diagram.model.nodeDataArray.filter(
            (e: NodeDataArrayItem) => nodeDataArray.findIndex(el => el.key === e.key) === -1
        );
        this.diagram.model.removeNodeDataCollection(nodesToRemove);
    }

    private applyAddRemoveLinksFromModel(linkDataArray) {
        const linksToAdd = linkDataArray
            .filter(
                e =>
                    (this.diagram.model as any).linkDataArray.findIndex(
                        (el: LinkDataArrayItem) => el.from === e.from && el.to === e.to
                    ) === -1
            )
            .map(link => Object.assign({}, link));
        (this.diagram.model as any).addLinkDataCollection(linksToAdd);
        const linksToRemove = (this.diagram.model as any).linkDataArray.filter(
            (e: LinkDataArrayItem) =>
                linkDataArray.findIndex(el => el.from === e.from && el.to === e.to) === -1
        );
        (this.diagram.model as any).removeLinkDataCollection(linksToRemove);
    }

    public update(data: Array<AC2Data>) {
        const goJsData = this.getGoJsData(data);
        this.applyAddRemoveNodesFromModel(goJsData.nodeDataArray);
        this.applyAddRemoveLinksFromModel(goJsData.linkDataArray);
        this.diagram.model.applyIncrementalJson({
            class: 'go.GraphLinksModel',
            incremental: 1,
            nodeKeyProperty: 'key',
            linkKeyProperty: 'key',
            linkFromPortIdProperty: '',
            linkToPortIdProperty: '',
            modifiedNodeData: goJsData.nodeDataArray,
            modifiedLinkData: goJsData.linkDataArray
        });
    }

}