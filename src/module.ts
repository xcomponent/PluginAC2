import { PanelConfig } from './panel-config';
import { PanelCtrl } from 'grafana/app/plugins/sdk';
import * as _ from 'lodash';
import * as axios from 'axios/dist/axios';
import './css/template.css';
import { AC2Map } from './ac2-map';

class Ctrl extends PanelCtrl {
  static templateUrl = "partials/template.html";

  private panelDefaults = {
    host: "localhost",
    port: "7890",
    application: "Servers,1.0.0",
    user: "admin",
    password: "admin"
  };

  private setupDiagramTimer?: number = undefined;
  private _panelConfig: PanelConfig;
  private map: AC2Map;

  constructor($scope: any, $injector) {
    super($scope, $injector);
    this._panelConfig = new PanelConfig(this.panel);
    _.defaultsDeep(this.panel, this.panelDefaults);
    this.events.on('init-edit-mode', this._onInitEditMode.bind(this));
    this.map = new AC2Map();
  }

  restCall() {
    const urlBase = `http://${this.panel.host}:${this.panel.port}`;
    return axios({
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
      });
  }

  setupDiagram() {
    this.restCall()
      .then(response => this.map.update(response))
      .catch(error => {
        console.error(error);
        const container = document.getElementById("container");
        if (container) {
          container.innerHTML = "Map display error";
        }
      });
  }

  onClickLoadButton() {
    this.map.init();
    clearInterval(this.setupDiagramTimer);
    this.setupDiagramTimer = setInterval((() => {
      this.setupDiagram();
    }).bind(this), 5000);
    this.setupDiagram();
  }

  _onInitEditMode() {
    var thisPartialPath = this._panelConfig.pluginDirName + 'partials/';
    this.addEditorTab('Settings', thisPartialPath + 'settings.html', 2);
  }

}

export { Ctrl as PanelCtrl }
