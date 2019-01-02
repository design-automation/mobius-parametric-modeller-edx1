import { Component, Input, EventEmitter, Output} from '@angular/core';
import { IFlowchart } from '@models/flowchart';
import { NodeUtils, INode } from '@models/node';
import { ProcedureTypes, IFunction, IProcedure } from '@models/procedure';
import { DataService } from '@services';
import { Router } from '@angular/router';
import * as circularJSON from 'circular-json';

@Component({
  selector: 'view-editor',
  templateUrl: './view-editor.component.html',
  styleUrls: ['./view-editor.component.scss']
})
export class ViewEditorComponent {
    /*
    @Input() flowchart: IFlowchart;
    @Input() node: INode;
    */

    @Output() imported = new EventEmitter();
    @Output() delete_Function = new EventEmitter();
    helpView: any;
    notificationMessage = '';
    notificationTrigger = true;

    private copyCheck = false;

    constructor(private dataService: DataService, private router: Router) {
    }

    // add a procedure
    add(data: {type: ProcedureTypes, data: IFunction}): void {
        NodeUtils.add_procedure(this.dataService.node, data.type, data.data);
    }

    // delete a procedure
    deleteChild(index: number): void {
        this.dataService.node.procedure.splice(index, 1);
        NodeUtils.deselect_procedure(this.dataService.node);
    }

    // select a procedure
    selectProcedure(event, line): void {
        if (!event.ctrl && document.activeElement.tagName === 'INPUT') {
            return;
        }
        NodeUtils.select_procedure(this.dataService.node, event.prod, event.ctrl || false);
    }

    // copy selected procedures
    copyProd() {
        const node = this.dataService.node;
        let i = 0;
        while (i < node.state.procedure.length) {
            if (node.state.procedure[i].type === ProcedureTypes.Blank) {
                node.state.procedure[i].selected = false;
                node.state.procedure.splice(i, 1);
            } else {
                i += 1;
            }
        }
        if (!this.copyCheck || document.activeElement.nodeName === 'INPUT' || node.state.procedure.length === 0) { return; }
        // console.log('copying', node.state.procedure);
        this.dataService.copiedType = node.type;
        this.dataService.copiedProd = node.state.procedure;

        this.notificationMessage = `Copied ${this.dataService.copiedProd.length} Procedures`;
        this.notificationTrigger = !this.notificationTrigger;
    }

    // cut selected procedures
    cutProd() {
        const node = this.dataService.node;
        let i = 0;
        while (i < node.state.procedure.length) {
            if (node.state.procedure[i].type === ProcedureTypes.Blank) {
                node.state.procedure[i].selected = false;
                node.state.procedure.splice(i, 1);
            } else {
                i += 1;
            }
        }
        if (!this.copyCheck || document.activeElement.nodeName === 'INPUT' || node.state.procedure.length === 0) { return; }
        // console.log('cutting', node.state.procedure);
        this.dataService.copiedType = node.type;
        this.dataService.copiedProd = node.state.procedure;
        let parentArray: IProcedure[];
        for (const prod of this.dataService.copiedProd) {
            if (prod.type === ProcedureTypes.Blank) { continue; }
            if (prod.parent) {
                parentArray = prod.parent.children;
            } else { parentArray = node.procedure; }

            for (let j = 0; j < parentArray.length; j++ ) {
                if (parentArray[j] === prod) {
                    parentArray.splice(j, 1);
                    break;
                }
            }
        }
        NodeUtils.deselect_procedure(node);

        this.notificationMessage = `Cut ${this.dataService.copiedProd.length} Procedures`;
        this.notificationTrigger = !this.notificationTrigger;
    }

    removeReturns(pastingProds) {
        let i = 0;
        while (i < pastingProds.length) {
            if (pastingProds[i].type === 11 || (pastingProds[i].type === 8 && pastingProds[i].meta.module.toLowerCase() === 'output')) {
                pastingProds.splice(i, 1);
            } else {
                if (pastingProds[i].children) {
                    this.removeReturns(pastingProds[i].children);
                }
                i += 1;
            }
        }
    }

    // paste copied procedures
    pasteProd() {
        const node = this.dataService.node;
        if (this.copyCheck
        && this.dataService.copiedProd
        && node.type !== 'start'
        && document.activeElement.nodeName !== 'INPUT'
        && document.activeElement.nodeName !== 'TEXTAREA') {
            const pastingPlace = node.state.procedure[0];
            let toBePasted = this.dataService.copiedProd;
            if (this.dataService.copiedType === 'end' && node.type === '') {
                toBePasted = circularJSON.parse(circularJSON.stringify(this.dataService.copiedProd));
                this.removeReturns(toBePasted);
            }
            if (pastingPlace === undefined) {
                for (let i = 0; i < toBePasted.length; i++) {
                    if (toBePasted[i].type === ProcedureTypes.Blank) { continue; }
                    // console.log('pasting', toBePasted[i].ID);
                    NodeUtils.paste_procedure(node, toBePasted[i]);
                    node.state.procedure[0].selected = false;
                    node.state.procedure = [];
                }
            } else {
                for (let i = toBePasted.length - 1; i >= 0; i --) {
                    if (toBePasted[i].type === ProcedureTypes.Blank) { continue; }
                    // console.log('pasting', toBePasted[i].ID);
                    NodeUtils.paste_procedure(node, toBePasted[i]);
                    node.state.procedure[0].selected = false;
                    pastingPlace.selected = true;
                    node.state.procedure = [pastingPlace];
                }
            }
            // toBePasted = undefined;
            this.notificationMessage = `Pasted ${toBePasted.length} Procedures`;
            this.notificationTrigger = !this.notificationTrigger;
        }
    }

    // activate copying/cutting/pasting when the mouse hovers over the procedure list
    activateCopyPaste(): void {
        this.copyCheck = true;
    }

    // deactivate copying/cutting/pasting when the mouse exit the procedure list
    deactivateCopyPaste(): void {
        this.copyCheck = false;
    }

    // import a flowchart as function
    importFunction(event) {
        for (const func of event) {
            this.dataService.flowchart.functions.push(func);
        }
    }

    // delete an imported function
    deleteFunction(event) {
        for (let i = 0; i < this.dataService.flowchart.functions.length; i++) {
            if (this.dataService.flowchart.functions[i] === event) {
                this.dataService.flowchart.functions.splice(i, 1);
                break;
            }
        }
    }

    updateHelpView(event) {
        if (typeof(event) === 'string') {
            for (const func of this.dataService.flowchart.functions) {
                if (func.name === event) {
                    this.helpView = func.doc;
                }
            }
        } else {
            this.helpView = event;
        }
    }

    viewerData(): any {
        const node = this.dataService.flowchart.nodes[this.dataService.flowchart.meta.selected_nodes[0]];
        if (!node) { return ''; }
        // if (node.type === 'output') { return node.input.value; }
        return node.model;
    }
    setSplit(event) { this.dataService.splitVal = event.sizes[1]; }

    unselectAll(event) {
        if (event.ctrlKey) { return; }
        NodeUtils.deselect_procedure(this.dataService.node);
    }
}
