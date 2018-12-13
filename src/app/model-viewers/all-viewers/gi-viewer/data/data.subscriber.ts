import { DataService } from './data.service';
import { Subscription } from 'rxjs/Subscription';
// import @angular stuff
import { Injector } from '@angular/core';

/**
 * DataSubscriber
 */
export class DataSubscriber {
    protected dataService: DataService;
    private _subscription: Subscription;
    private _message: any;
    /**
     * Constructs a new data subscriber.
     * @param injector
     */
    constructor(injector: Injector) {
        this.dataService = injector.get(DataService);
        this.dataService.getMessage().subscribe(message => {
            this._message = message;
            // this.notify(message.text);
        });
    }
    /**
     * TODO
     * @param message
     */
    // notify(message: string) {
    //     console.warn('Notify function not Implemented');
    // }
}
