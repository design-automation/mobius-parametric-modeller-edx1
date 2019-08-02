import { Component, Input, Output,  EventEmitter, OnDestroy} from '@angular/core';

import { IProcedure, ProcedureTypes } from '@models/procedure';
import { ModuleDocList } from '@shared/decorators';

import { _parameterTypes} from '@modules';

import { inline_func } from '@assets/core/inline/inline';
import * as Modules from '@modules';
import { DataService } from '@services';
import { IArgument } from '@models/code';

import { parseArgument, parseVariable, checkValidVar, modifyVar, modifyArgument, checkNodeValidity} from '@shared/parser';

@Component({
    selector: 'procedure-item',
    templateUrl: './procedure-item.component.html',
    styleUrls: ['procedure-item.component.scss']
})
export class ProcedureItemComponent implements OnDestroy {
    @Input() data: IProcedure;
    @Input() disableInput: boolean;
    @Output() eventAction = new EventEmitter();

    ProcedureTypes = ProcedureTypes;

    private keys = Object.keys(ProcedureTypes);
    private ctx = document.createElement('canvas').getContext('2d');

    ProcedureTypesArr = this.keys.slice(this.keys.length / 2);
    ModuleDoc = ModuleDocList;

    constructor(private dataService: DataService) {
        this.ctx.font = '12px Arial';
    }

    ngOnDestroy() {
        this.ctx = null;
    }


    onenter(e) {
        e.target.classList.add('onhover');
        const highlighted = this.dataService.getHighlightedProd();
        if (highlighted) {
            highlighted.classList.remove('onhover');
        }
        this.dataService.addHighlightedProd(e.target);
        e.stopPropagation();
    }

    onleave(e) {
        let highlighted = this.dataService.removeHighlightedProd();
        if (highlighted) {
            highlighted.classList.remove('onhover');
        }
        highlighted = this.dataService.getHighlightedProd();
        if (highlighted) {
            highlighted.classList.add('onhover');
        }
        e.stopPropagation();
    }

    performAction(event, idx) {
        switch (event.type) {
            case 'select':
                this.selectChild(event.content);
                break;
            case 'delete':
                this.emitDelete(true);
                break;
            case 'deleteC':
                this.deleteChild(idx);
                break;
            case 'notifyError':
                this.emitNotifyError(event.content);
                break;
            case 'helpText':
                this.emitHelpText(event.content);
                break;
        }
    }

    // select this procedure
    emitSelect(event: MouseEvent, procedure: IProcedure) {
        event.stopPropagation();
        this.eventAction.emit({
            'type': 'select',
            'content': {'ctrl': event.ctrlKey || event.metaKey, 'shift': event.shiftKey, 'prod': procedure}
        });
    }

    // select child procedure (after receiving emitSelect from child procedure)
    selectChild(event) {
        this.eventAction.emit({
            'type': 'select',
            'content': event
        });
    }

    // delete this procedure
    emitDelete(check?: boolean): void {
        if (check) {
            this.eventAction.emit({
                'type': 'delete',
            });
        } else if (! this.data.selected) {
            this.eventAction.emit({
                'type': 'deleteC',
            });
        } else {
            this.eventAction.emit({
                'type': 'delete',
            });
        }
    }

    emitHelpText($event) {
        if ($event) {
            this.eventAction.emit({
                'type': 'helpText',
                'content': $event
            });
            return;
        }
        try {
            if (this.data.type === ProcedureTypes.Imported) {
                this.eventAction.emit({
                    'type': 'helpText',
                    'content': this.data.meta.name
                });
                // this.helpText.emit(this.ModuleDoc[this.data.meta.module][this.data.meta.name]);

            } else {
                this.eventAction.emit({
                    'type': 'helpText',
                    'content': this.ModuleDoc[this.data.meta.module][this.data.meta.name]
                });
            }
        } catch (ex) {
            this.eventAction.emit({
                'type': 'helpText',
                'content': 'error'
            });
        }
    }

    emitNotifyError(message) {
        this.eventAction.emit({
            'type': 'notifyError',
            'content': message
        });
    }

    disableShift(event: MouseEvent) {
        if ((<Element>event.target).tagName === 'INPUT') { return; }
        if (event.shiftKey) {
            event.preventDefault();
        }
    }

    markSelectGeom(event: MouseEvent) {
        event.stopPropagation();
        if (!this.data.selectGeom) {
            this.unselectGeomRecursive(this.dataService.node.procedure);
        }
        this.data.selectGeom = !this.data.selectGeom;
    }

    unselectGeomRecursive(prodList: IProcedure[]): boolean {
        for (const prod of prodList) {
            if (prod.selectGeom) {
                prod.selectGeom = false;
                return true;
            }
            if (prod.children) {
                if (this.unselectGeomRecursive(prod.children)) {
                    return true;
                }
            }
        }
        return false;
    }



    markPrint(event: MouseEvent) {
        event.stopPropagation();
        if (!this.data.selected) {
            this.data.print = !this.data.print;
            return;
        }
        const prodList = this.dataService.node.state.procedure;
        let newPrint;
        let i = prodList.length - 1;
        while (i >= 0 && !(prodList[i].argCount > 0 && prodList[i].args[0].name === 'var_name')) {
            i--;
        }
        if (i === -1) { return; }
        newPrint = ! prodList[i].print;
        for (const prod of prodList) {
            if (prod.argCount > 0 && prod.args[0].name === 'var_name') {
                prod.print = newPrint;
            }
        }
        // this.data.print = !this.data.print;
    }

    markDisabled(event: MouseEvent) {
        event.stopPropagation();
        if (!this.data.selected) {
            this.data.enabled = !this.data.enabled;
            return;
        }
        const prodList = this.dataService.node.state.procedure;
        const newEnabled = ! prodList[prodList.length - 1].enabled;
        for (const prod of prodList) {
            if (prod.type === ProcedureTypes.Blank || prod.type === ProcedureTypes.Comment) { continue; }
            prod.enabled = newEnabled;
        }
        // this.data.enabled = !this.data.enabled;
    }

    // delete child procedure (after receiving emitDelete from child procedure)
    deleteChild(index: number): void {
        this.dataService.registerEdtAction([{'type': 'del', 'parent': this.data, 'index': index, 'prod': this.data.children[index]}]);
        this.data.children.splice(index, 1);
    }


    canBePrinted() {
        return this.data.argCount > 0 && this.data.args[0].name === 'var_name';
    }

    canSelectGeom() {
        const check = this.data.argCount > 0 && this.data.args[0].name === 'var_name';
        if (!check) { return false; }
        if (this.data.type !== ProcedureTypes.Function) { return true; }
        const returns = this.ModuleDoc[this.data.meta.module][this.data.meta.name].returns;
        if (returns.length < 5) { return false; }
        if (returns.slice(0, 5).toLowerCase() === 'entit') {return true; }
        return false;
    }

    haveHelpText() {
        return (this.data.type === 8 || this.data.type ===  9);
    }


    // modify variable input: replace space " " with underscore "_"
    varMod() {
        // modifyVar(this.data, this.dataService.node.procedure);
        checkNodeValidity(this.dataService.node);
        if (this.data.args[0].invalidVar) {
            this.dataService.notifyMessage(this.data.args[0].invalidVar);
        }
    }


    // modify argument input: check if input is valid
    argMod(event: Event, argIndex: number) {
        // this.dataService.focusedInput = [event.target, (<HTMLInputElement>event.target).selectionStart];
        this.dataService.focusedInput = event.target;
        if (!this.data.args[argIndex].value) { return; }
        modifyArgument(this.data, argIndex, this.dataService.node.procedure);
        this.clearLinkedArgs(this.dataService.node.procedure);
        if (this.data.args[argIndex].invalidVar) {
            this.dataService.notifyMessage(this.data.args[argIndex].invalidVar);
        }
    }

    clearLinkedArgs(prodList: IProcedure[]) {
        for (const prod of prodList) {
            if (prod.children) {
                this.clearLinkedArgs(prod.children);
            }
            if (prod.argCount === 0) {
                continue;
            }
            for (const arg of prod.args) {
                arg.linked = false;
            }
        }
    }

    // argHighlight(value: any) {
    //     return value.replace(
    //         inline_fn_regEx, '<span class = "inline-function">' + value.match(inline_fn_regEx) + '</span>'
    //     );
    // }

    inputSize(val) {
        return this.ctx.measureText(val).width + 7;
    }


    onInputFocus(index: number, isVar?: boolean) {
        for (const prod of this.dataService.node.state.procedure) {
            prod.selected = false;
        }
        this.dataService.node.state.procedure = [];
        if (this.data.args[index].invalidVar && typeof this.data.args[index].invalidVar === 'string') {
            this.emitNotifyError(this.data.args[index].invalidVar);
        } else if (isVar) {
            if (this.data.variable) {
                this.markLinkedArguments(this.data.variable, this.dataService.node.procedure);
            } else if (this.data.args[index].usedVars && this.data.args[index].usedVars[0]) {
                this.markLinkedArguments(this.data.args[index].usedVars[0], this.dataService.node.procedure);
            }
        } else if (this.data.args[index].usedVars) {
            for (const varName of this.data.args[index].usedVars) {
                this.markLinkedArguments(varName, this.dataService.node.procedure);
            }
        }
    }

    markLinkedArguments(varName: string, nodeList: IProcedure[]) {
        for (const prod of nodeList) {
            if (prod.children) {
                this.markLinkedArguments(varName, prod.children);
            }
            if (prod === this.data || prod.argCount === 0) {continue; }
            for (const arg of prod.args) {
                if (arg.name === '__none__' || !arg.usedVars || arg.usedVars.length === 0) {continue; }
                if (arg.usedVars.indexOf(varName) !== -1) {
                    arg.linked = true;
                }
            }
            if (prod.variable === varName) {
                prod.args[0].linked = true;
            }
        }
    }

    checkEnum(param, index: number): boolean {
        try {
            if (param.name[0] === '_') {
                return false;
            }
            // @ts-ignore
            const arg = this.ModuleDoc[this.data.meta.module][this.data.meta.name].parameters[index];
            if (arg.description.toLowerCase().indexOf('enum') === -1 || !Modules[this.data.meta.module][arg.type]) {
                return false;
            }
            return true;
        } catch (ex) {
            return false;
        }
    }

    getEnum(index: number) {
        // @ts-ignore
        const enm = Modules[this.data.meta.module][this.ModuleDoc[this.data.meta.module][this.data.meta.name].parameters[index].type];
        const enumList = [];
        for (const i in enm) {
            if (! enm.hasOwnProperty(i)) {
                continue;
            }
            enumList.push(enm[i]);
        }
        return enumList;
    }

    updateJsVal(p: IArgument) {
        p.jsValue = p.value;
    }
}