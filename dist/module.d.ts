import { PanelCtrl } from 'grafana/app/plugins/sdk';
import './css/template.css';
declare class Ctrl extends PanelCtrl {
    static templateUrl: string;
    private panelDefaults;
    private setupDiagramTimer?;
    private _panelConfig;
    private map;
    constructor($scope: any, $injector: any);
    restCall(): any;
    setupDiagram(): void;
    onClickLoadButton(): void;
    _onInitEditMode(): void;
}
export { Ctrl as PanelCtrl };
