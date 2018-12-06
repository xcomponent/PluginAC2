import { PanelConfig } from './panel-config';
import { PanelCtrl } from 'grafana/app/plugins/sdk';
import * as _ from 'lodash';
import * as go from 'gojs';
import * as axios from 'axios/dist/axios';

import './css/template.css';

class Ctrl extends PanelCtrl {
  static templateUrl = "partials/template.html";

  private panelDefaults = {
    host: "localhost",
    port: "7890",
    application: "Servers,1.0.0",
    user: "admin",
    password: "admin"
  };
  private myFullDiagram: any = {
    div: undefined,
    nodeTemplate: undefined,
    groupTemplate: undefined,
    linkTemplate: undefined,
    model: undefined
  };
  private setupDiagramTimer: number | undefined = undefined;
  private _panelConfig: PanelConfig;

  constructor($scope: any, $injector) {
    super($scope, $injector);
    this._panelConfig = new PanelConfig(this.panel);
    _.defaultsDeep(this.panel, this.panelDefaults);

    this.events.on('init-edit-mode', this._onInitEditMode.bind(this));
  }

  initDiagram() {
    if ((<any>window).goSamples) (<any>window).goSamples();
    const $ = go.GraphObject.make;
    this.myFullDiagram.div = undefined;
    this.myFullDiagram =
      $(go.Diagram, "container",
        {
          initialAutoScale: go.Diagram.UniformToFill,
          maxScale: 1,
          contentAlignment: go.Spot.Center,
          "animationManager.isEnabled": false,
          layout: $(go.TreeLayout,
            { angle: 90, sorting: go.TreeLayout.SortingAscending }),
          maxSelectionCount: 1
        });

    const myNodeTemplate =
      $(go.Node, "Vertical",
        { locationSpot: go.Spot.Center, locationObjectName: "SHAPE" },
        new go.Binding("text", "key", go.Binding.toString),
        $(go.Shape, "Rectangle", { desiredSize: new go.Size(30, 30), name: "SHAPE", portId: "" },
          new go.Binding("fill", "color"),
          { stroke: null }),
        $(go.TextBlock, { margin: 5, stroke: "rgb(220,220,220)", font: "Bold 12px Sans-Serif" }, new go.Binding("text", "key"))
      );
    this.myFullDiagram.nodeTemplate = myNodeTemplate;

    this.myFullDiagram.groupTemplate =
      $(go.Group, "Auto",
        { // define the group's internal layout
          layout: $(go.TreeLayout,
            { angle: 90, arrangement: go.TreeLayout.ArrangementHorizontal, isRealtime: false,  }),
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
          // create a placeholder to represent the area where the contents of the group are
          $(go.Placeholder,
            { padding: new go.Margin(0, 10) })
        )  // end Vertical Panel
      );  // end Group

    this.myFullDiagram.linkTemplate =
      $(go.Link,
        { corner: 10 },
        $(go.Shape, { strokeWidth: 1, stroke: "white" }),
        $(go.Shape, { toArrow: "OpenTriangle", fill: "white", stroke: "white" })
      );

    clearInterval(this.setupDiagramTimer);
    this.setupDiagramTimer = setInterval((() => {
      this.setupDiagram();
    }).bind(this), 5000);
    this.setupDiagram();
  }

  setupDiagram() {
    const urlBase = `http://${this.panel.host}:${this.panel.port}`;
    axios({
      method: 'POST',
      url: `${urlBase}/api/Token`,
      data: {
        "User": this.panel.user,
        "Password": this.panel.password
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    })
      .then(response => {
        return axios.get(`${urlBase}/api/Application?application=${this.panel.application}&api_key=${response.data}`);
      })
      .then((response) => {
        const nodeDataArray: Array<any> = [];
        const linkDataArray: Array<any> = [];
        const groups = [];
        response.data.forEach(component => {
          if (groups.indexOf(component.GroupName as never) === -1) {
            groups.push(component.GroupName as never);
          }
          const node: any = {};
          node.key = component.Name;
          const stateColor = {
            "Stopped": "red",
            "Started": "green",
            "InError": "gray",
            "Starting": "Orange",
          };
          node.color = stateColor[component.State];
          node.group = component.GroupName + "_group";
          if (component.Parents.length > 0) {
            linkDataArray.push({ from: component.Parents[0], to: node.key });
          }
          nodeDataArray.push(node);
        });
        groups.forEach(group => {
          nodeDataArray.push({ key: group + "_group", text: group, isGroup: true });
        });
        this.myFullDiagram.model.nodeDataArray = nodeDataArray;
        this.myFullDiagram.model.linkDataArray = linkDataArray;

      }).catch(error => {
        console.log(error);
      });
  }

  onClick() {
    this.initDiagram();
  }

  _onInitEditMode() {
    var thisPartialPath = this._panelConfig.pluginDirName + 'partials/';
    this.addEditorTab('Settings', thisPartialPath + 'settings.html', 2);
  }

}

export { Ctrl as PanelCtrl }
