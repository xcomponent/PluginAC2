import { PanelConfig } from './panel-config';
import { PanelCtrl, loadPluginCss } from 'grafana/app/plugins/sdk';
import * as _ from 'lodash';
import * as go from '../node_modules/gojs/release/go';
import * as axios from '../node_modules/axios/dist/axios';

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
      $(go.Diagram, "full",
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
        $(go.TextBlock, { margin: 5, stroke: "rgb(220,220,220)" }, new go.Binding("text", "key"))
      );
    this.myFullDiagram.nodeTemplate = myNodeTemplate;

    const groupTemplate =
      $(go.Group, "Auto",
        $(go.Shape, "Rectangle",
          { fill: "gray" }),
        $(go.Panel, "Vertical",
          {
            margin: 5,
            defaultAlignment: go.Spot.Center
          },
          $(go.TextBlock, { alignment: go.Spot.Center, font: "Bold 12pt Sans-Serif" }),
          $(go.Placeholder), { padding: 5 }
        )
      );
    this.myFullDiagram.groupTemplate = groupTemplate;

    this.myFullDiagram.linkTemplate =
      $(go.Link,
        { toShortLength: 1 },
        $(go.Shape,
          { strokeWidth: 1, "stroke": "gray" }),
        $(go.Shape,
          { toArrow: "Standard", stroke: null, fill: "gray" }),
        {
          toolTip:
            $(go.Adornment, "Auto",
              $(go.Shape, { fill: "#FFFFCC" }),
              $(go.TextBlock, { margin: 1 })
            )
        }
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
        console.log(response.data);
        const nodeDataArray: Array<any> = [];
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
          if (component.Parents.length > 0) {
            node.parent = component.Parents[0];
          }
          nodeDataArray.push(node);
        });
        this.myFullDiagram.model = new go.TreeModel(nodeDataArray);
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
