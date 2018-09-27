'use strict';

System.register(['app/plugins/sdk', 'moment', './external/axios.min.js', './external/go.js', 'lodash', './css/panel.css!'], function (_export, _context) {
  "use strict";

  var PanelCtrl, moment, axios, go, _, _createClass, panelDefaults, myFullDiagram, setupDiagramTimer, AC2Ctrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  return {
    setters: [function (_appPluginsSdk) {
      PanelCtrl = _appPluginsSdk.PanelCtrl;
    }, function (_moment) {
      moment = _moment.default;
    }, function (_externalAxiosMinJs) {
      axios = _externalAxiosMinJs.default;
    }, function (_externalGoJs) {
      go = _externalGoJs.default;
    }, function (_lodash) {
      _ = _lodash.default;
    }, function (_cssPanelCss) {}],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      panelDefaults = {
        host: "localhost",
        port: "7890",
        application: "Servers,1.0.0",
        user: "admin",
        password: "admin"
      };
      myFullDiagram = {};
      setupDiagramTimer = null;

      _export('AC2Ctrl', AC2Ctrl = function (_PanelCtrl) {
        _inherits(AC2Ctrl, _PanelCtrl);

        function AC2Ctrl($scope, $injector) {
          _classCallCheck(this, AC2Ctrl);

          var _this = _possibleConstructorReturn(this, (AC2Ctrl.__proto__ || Object.getPrototypeOf(AC2Ctrl)).call(this, $scope, $injector));

          _.defaultsDeep(_this.panel, panelDefaults);
          _this.events.on('init-edit-mode', _this.onInitEditMode.bind(_this));
          return _this;
        }

        _createClass(AC2Ctrl, [{
          key: 'initDiagram',
          value: function initDiagram() {
            var _this2 = this;

            if (window.goSamples) goSamples();
            var $ = go.GraphObject.make;
            myFullDiagram.div = null;
            myFullDiagram = $(go.Diagram, "full", {
              initialAutoScale: go.Diagram.UniformToFill,
              maxScale: 1,
              contentAlignment: go.Spot.Center,
              "animationManager.isEnabled": false,
              layout: $(go.TreeLayout, { angle: 90, sorting: go.TreeLayout.SortingAscending }),
              maxSelectionCount: 1
            });

            var myNodeTemplate = $(go.Node, "Vertical", { locationSpot: go.Spot.Center, locationObjectName: "SHAPE" }, new go.Binding("text", "key", go.Binding.toString), $(go.Shape, "Rectangle", { desiredSize: new go.Size(30, 30), name: "SHAPE", portId: "" }, new go.Binding("fill", "color"), { stroke: null }), $(go.TextBlock, { margin: 5, stroke: "rgb(220,220,220)" }, new go.Binding("text", "key")));
            myFullDiagram.nodeTemplate = myNodeTemplate;

            var groupTemplate = $(go.Group, "Auto", $(go.Shape, "Rectangle", { fill: "gray" }), $(go.Panel, "Vertical", {
              margin: 5,
              defaultAlignment: go.Spot.Center
            }, $(go.TextBlock, { alignment: go.Spot.Center, font: "Bold 12pt Sans-Serif" }), $(go.Placeholder), { padding: 5 }));
            myFullDiagram.groupTemplate = groupTemplate;

            myFullDiagram.linkTemplate = $(go.Link, { toShortLength: 1 }, $(go.Shape, { strokeWidth: 1, "stroke": "gray" }), $(go.Shape, { toArrow: "Standard", stroke: null, fill: "gray" }), {
              toolTip: $(go.Adornment, "Auto", $(go.Shape, { fill: "#FFFFCC" }), $(go.TextBlock, { margin: 1 }))
            });

            clearInterval(setupDiagramTimer);
            setupDiagramTimer = setInterval(function () {
              _this2.setupDiagram();
            }.bind(this), 5000);
            this.setupDiagram();
          }
        }, {
          key: 'setupDiagram',
          value: function setupDiagram() {
            var _this3 = this;

            var urlBase = 'http://' + this.panel.host + ':' + this.panel.port;
            axios({
              method: 'POST',
              url: urlBase + '/api/Token',
              data: {
                "User": this.panel.user,
                "Password": this.panel.password
              },
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            }).then(function (response) {
              return axios.get(urlBase + '/api/Application?application=' + _this3.panel.application + '&api_key=' + response.data);
            }).then(function (response) {
              console.log(response.data);
              var nodeDataArray = [];
              var groups = [];
              response.data.forEach(function (component) {
                if (groups.indexOf(component.GroupName) === -1) {
                  groups.push(component.GroupName);
                }
                var node = {};
                node.key = component.Name;
                var stateColor = {
                  "Stopped": "red",
                  "Started": "green",
                  "InError": "gray",
                  "Starting": "Orange"
                };
                node.color = stateColor[component.State];
                if (component.Parents.length > 0) {
                  node.parent = component.Parents[0];
                }
                nodeDataArray.push(node);
              });
              myFullDiagram.model = new go.TreeModel(nodeDataArray);
            }).catch(function (error) {
              console.log(error);
            });
          }
        }, {
          key: 'onInitEditMode',
          value: function onInitEditMode() {
            this.addEditorTab('Settings', 'public/plugins/grafana-ac2-panel/settings.html', 2);
          }
        }, {
          key: 'onClick',
          value: function onClick() {
            this.initDiagram();
          }
        }]);

        return AC2Ctrl;
      }(PanelCtrl));

      _export('AC2Ctrl', AC2Ctrl);

      AC2Ctrl.templateUrl = 'module.html';
    }
  };
});
//# sourceMappingURL=main.js.map
