import { PanelCtrl } from 'app/plugins/sdk';
import moment from 'moment';
import axios from './external/axios.min.js';
import go from './external/go.js';
import _ from 'lodash';
import './css/panel.css!';

const panelDefaults = {
  host: "localhost",
  port: "7890",
  application: "Servers,1.0.0",
  user: "admin",
  password: "admin"
};

let myFullDiagram = {}, setupDiagramTimer = null;

export class AC2Ctrl extends PanelCtrl {
  constructor($scope, $injector) {
    super($scope, $injector);
    _.defaultsDeep(this.panel, panelDefaults);
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
  }

  initDiagram() {
    if (window.goSamples) goSamples();
    const $ = go.GraphObject.make;
    myFullDiagram.div = null;
    myFullDiagram =
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
    myFullDiagram.nodeTemplate = myNodeTemplate;

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
    myFullDiagram.groupTemplate = groupTemplate;

    myFullDiagram.linkTemplate =
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

    clearInterval(setupDiagramTimer);
    setupDiagramTimer = setInterval((() => {
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
        const nodeDataArray = [];
        const groups = [];
        response.data.forEach(component => {
          if (groups.indexOf(component.GroupName) === -1) {
            groups.push(component.GroupName);
          }
          const node = {};
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
        myFullDiagram.model = new go.TreeModel(nodeDataArray);
      }).catch(error => {
        console.log(error);
      });
  }

  onInitEditMode() {
    this.addEditorTab('Settings', 'public/plugins/grafana-ac2-panel/settings.html', 2);
  }

  onClick() {
    this.initDiagram();
  }

}

AC2Ctrl.templateUrl = 'module.html';