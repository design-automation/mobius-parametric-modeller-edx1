/*
 *  This module is to be imported ONLY by the AppModule
 *  Contains all global services
 * 
 */

import { NgModule, SkipSelf, Optional } from "@angular/core";
import { CommonModule } from '@angular/common';

import { MbFileReaderDirective } from "./directives/filesys";
import { TextViewerComponent } from "./components/viewers/viewer-text.component";
import { ExecuteComponent } from "./components/execute/execute.component";

@NgModule({
    providers: [/* GLOBAL SERVICES */],
    declarations: [ MbFileReaderDirective, TextViewerComponent, ExecuteComponent ],
    imports: [ CommonModule ],
    exports: [ MbFileReaderDirective, TextViewerComponent, ExecuteComponent ]
})
export class SharedModule{
    constructor(@Optional() @SkipSelf() shared: SharedModule){

        /// Prevents any module apart from AppModule from re-importing
        if(shared){
            throw new Error("Core Module has already been imported");
        }
    }
}