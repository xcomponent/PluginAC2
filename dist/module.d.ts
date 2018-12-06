import { PanelCtrl } from 'grafana/app/plugins/sdk';
import './css/template.css';
declare class Ctrl extends PanelCtrl {
    static templateUrl: string;
    private panelDefaults;
    private myFullDiagram;
    private setupDiagramTimer;
    private _panelConfig;
    constructor($scope: any, $injector: any);
    initDiagram(): void;
    setupDiagram(): void;
    onClick(): void;
    _onInitEditMode(): void;
}
export { Ctrl as PanelCtrl };
