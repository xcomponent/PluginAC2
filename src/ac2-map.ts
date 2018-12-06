import * as go from 'gojs';

export const stateColor = {
    "Stopped": "red",
    "Started": "green",
    "InError": "gray",
    "Starting": "Orange",
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

export class AC2Map {

    private diagram: go.Diagram;

    public init() {
        this.diagram = this.getDiagramTemplate();
        this.diagram.nodeTemplate = this.getNodeTemplate();
        this.diagram.groupTemplate = this.getGroupTemplate()
        this.diagram.linkTemplate = this.getLinkTemplate();
    }

    private getDiagramTemplate() {
        const $ = go.GraphObject.make;
        return $(go.Diagram, "container",
            {
                initialAutoScale: go.Diagram.UniformToFill,
                maxScale: 1,
                contentAlignment: go.Spot.Center,
                "animationManager.isEnabled": false,
                layout: $(go.TreeLayout, { angle: 90, sorting: go.TreeLayout.SortingAscending }),
                maxSelectionCount: 1
            });
    }

    private getNodeTemplate() {
        const $ = go.GraphObject.make;
        return $(go.Node, "Vertical",
            { locationSpot: go.Spot.Center, locationObjectName: "SHAPE" },
            new go.Binding("text", "key", go.Binding.toString),
            $(go.Shape, "Rectangle", { desiredSize: new go.Size(30, 30), name: "SHAPE", portId: "" },
                new go.Binding("fill", "color"),
                { stroke: null }),
            $(go.TextBlock, { margin: 5, stroke: "rgb(220,220,220)", font: "Bold 12px Sans-Serif" }, new go.Binding("text", "key"))
        );
    }

    private getLinkTemplate() {
        const $ = go.GraphObject.make;
        return $(go.Link,
            { corner: 10 },
            $(go.Shape, { strokeWidth: 1, stroke: "white" }),
            $(go.Shape, { toArrow: "OpenTriangle", fill: "white", stroke: "white" })
        );
    }

    private getGroupTemplate() {
        const $ = go.GraphObject.make;
        return $(go.Group, "Auto",
            {
                layout: $(go.TreeLayout,
                    { angle: 90, arrangement: go.TreeLayout.ArrangementHorizontal, isRealtime: false, }),
                isSubGraphExpanded: true,
            },
            $(go.Shape, "Rectangle",
                { fill: null, stroke: "gray", strokeWidth: 2 }),
            $(go.Panel, "Vertical",
                { defaultAlignment: go.Spot.Center, margin: 4 },
                $(go.Panel, "Horizontal",
                    { defaultAlignment: go.Spot.Top },
                    $(go.TextBlock,
                        { font: "Bold 12px Sans-Serif", alignment: go.Spot.Center, margin: 4, stroke: "white" },
                        new go.Binding("text", "text"))
                ),
                $(go.Placeholder,
                    { padding: new go.Margin(0, 10) })
            )
        );
    }

    public update(response) {
        const nodeDataArray: Array<NodeDataArrayItem> = [];
        const linkDataArray: Array<LinkDataArrayItem> = [];
        const groups: Array<string> = [];
        response.data.forEach(component => {
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
        this.diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
    }
}