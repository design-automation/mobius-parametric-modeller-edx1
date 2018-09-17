import { Component, Input} from '@angular/core';

import { INode, NodeUtils } from '@models/node';
import { IProcedure, ProcedureUtils } from '@models/procedure';

/*
 *	Displays the drag-drop procedure for a node
 *
 * 	Updates on:
 * 	- selected_node is changed
 * 	- selected_node is updated
 */

@Component({
  selector: 'procedure-editor',
  templateUrl: './procedure-editor.component.html',
  styleUrls: ['./procedure-editor.component.scss']
})
export class ProcedureEditorComponent{

	@Input() node: INode[];
	copiedProd: IProcedure;

	constructor(){ }

}
