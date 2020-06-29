import { EEntType, TTri, TEdge, TWire, TFace, IGeomArrays, Txyz, TColl, TVert, TEntTypeIdx } from './common';
import { GIGeom } from './GIGeom';

/**
 * Class for geometry.
 */
export class GIGeomTimeStamp {
    private _geom: GIGeom;
    private _geom_maps: IGeomArrays;
    /**
     * Constructor
     */
    constructor(geom: GIGeom, geom_arrays: IGeomArrays) {
        this._geom = geom;
        this._geom_maps = geom_arrays;
    }
    /**
     * Update time stamp of an object.
     * If the input entity is not an object, then objects will be retrieved.
     * @param point_i
     */
    public updateObjsTs(ent_type: EEntType, ent_i: number): void {
        const ts: number = this._geom.modeldata.model.metadata.nextTimeStamp();
        switch (ent_type) {
            case EEntType.POSI:
                this._geom_maps.posis_ts.set(ent_i, ts);
                return;
            case EEntType.POINT:
                this._geom_maps.points_ts.set(ent_i, ts);
                return;
            case EEntType.PLINE:
                this._geom_maps.plines_ts.set(ent_i, ts);
                return;
            case EEntType.PGON:
                this._geom_maps.pgons_ts.set(ent_i, ts);
                return;
            case EEntType.COLL:
                this._geom.nav.navCollToPgon(ent_i).forEach( pgon_i => this._geom_maps.pgons_ts.set(pgon_i, ts) );
                this._geom.nav.navCollToPline(ent_i).forEach( pline_i => this._geom_maps.plines_ts.set(pline_i, ts) );
                this._geom.nav.navCollToPoint(ent_i).forEach( point_i => this._geom_maps.points_ts.set(point_i, ts) );
                return;
            case EEntType.FACE:
            case EEntType.WIRE:
            case EEntType.EDGE:
            case EEntType.VERT:
                // get the topo object
                const [ent2_type, ent2_i]: TEntTypeIdx = this._geom.query.getTopoObj(ent_type, ent_i);
                switch (ent2_type) {
                    case EEntType.POSI:
                        this._geom_maps.posis_ts.set(ent2_i, ts);
                        return;
                    case EEntType.POINT:
                        this._geom_maps.points_ts.set(ent2_i, ts);
                        return;
                    case EEntType.PLINE:
                        this._geom_maps.plines_ts.set(ent2_i, ts);
                        return;
                    case EEntType.PGON:
                        this._geom_maps.pgons_ts.set(ent2_i, ts);
                        return;
                }
        }
    }
    /**
     * Update time stamp of an object.
     * If the input entity is not an object, then objects will be retrieved.
     * @param point_i
     */
    public updateEntTs(ent_type: EEntType, ent_i: number): void {
        const ts: number = this._geom.modeldata.model.metadata.nextTimeStamp();
        switch (ent_type) {
            case EEntType.POSI:
                this._geom_maps.posis_ts.set(ent_i, ts);
                return;
            case EEntType.POINT:
                this._geom_maps.points_ts.set(ent_i, ts);
                return;
            case EEntType.PLINE:
                this._geom_maps.plines_ts.set(ent_i, ts);
                return;
            case EEntType.PGON:
                this._geom_maps.pgons_ts.set(ent_i, ts);
                return;
            case EEntType.COLL:
                this._geom_maps.colls_ts.set(ent_i, ts);
                return;
        }
    }
    /**
     * Update time stamp for multiple arrays or sets of entities.
     * @param map
     */
    public updateEntsTs(ent_type: EEntType, ents_i: number[]|Set<number>): void {
        const ts: number = this._geom.modeldata.model.metadata.nextTimeStamp();
        switch (ent_type) {
            case EEntType.POSI:
                ents_i.forEach( ent_i => this._geom_maps.posis_ts.set(ent_i, ts) );
                return;
            case EEntType.POINT:
                ents_i.forEach( ent_i => this._geom_maps.points_ts.set(ent_i, ts) );
                return;
            case EEntType.PLINE:
                ents_i.forEach( ent_i => this._geom_maps.plines_ts.set(ent_i, ts) );
                return;
            case EEntType.PGON:
                ents_i.forEach( ent_i => this._geom_maps.pgons_ts.set(ent_i, ts) );
                return;
            case EEntType.COLL:
                ents_i.forEach( ent_i => this._geom_maps.colls_ts.set(ent_i, ts) );
                return;
        }
    }
    /**
     * Get the timestamp of a posi
     * @param posi_i
     */
    public getEntTs(ent_type: EEntType, ent_i: number): number {
        switch (ent_type) {
            case EEntType.POSI:
                return this._geom_maps.posis_ts.get(ent_i);
            case EEntType.POINT:
                return this._geom_maps.points_ts.get(ent_i);
            case EEntType.PLINE:
                return this._geom_maps.plines_ts.get(ent_i);
            case EEntType.PGON:
                return this._geom_maps.pgons_ts.get(ent_i);
            case EEntType.COLL:
                return this._geom_maps.colls_ts.get(ent_i);
            default:
                throw new Error('Get time stamp: Entity type not recognised.');
        }
    }
    /**
     * Set the timestamp for an ent.
     * This is used by merge.
     * @param ent_type
     * @param posi_i
     * @param ts
     */
    public setEntTs(ent_type: EEntType, ent_i: number, ts: number): void {
        switch (ent_type) {
            case EEntType.POSI:
                this._geom_maps.posis_ts.set(ent_i, ts);
                return;
            case EEntType.POINT:
                this._geom_maps.points_ts.set(ent_i, ts);
                return;
            case EEntType.PLINE:
                this._geom_maps.plines_ts.set(ent_i, ts);
                return;
            case EEntType.PGON:
                this._geom_maps.pgons_ts.set(ent_i, ts);
                return;
            case EEntType.COLL:
                this._geom_maps.colls_ts.set(ent_i, ts);
                return;
            default:
                throw new Error('Get time stamp: Entity type not recognised.');
        }
    }
    /**
     * Delete the timestamp for an ent.
     * @param ent_type
     * @param ent_i
     */
    public delEntTs(ent_type: EEntType, ent_i: number): void {
        switch (ent_type) {
            case EEntType.POSI:
                this._geom_maps.posis_ts.delete(ent_i);
                return;
            case EEntType.POINT:
                this._geom_maps.points_ts.delete(ent_i);
                return;
            case EEntType.PLINE:
                this._geom_maps.plines_ts.delete(ent_i);
                return;
            case EEntType.PGON:
                this._geom_maps.pgons_ts.delete(ent_i);
                return;
            case EEntType.COLL:
                this._geom_maps.colls_ts.delete(ent_i);
                return;
            default:
                throw new Error('Get time stamp: Entity type not recognised.');
        }
    }
}
