import { EEntType, TTri, TEdge, TWire, TFace, IGeomArrays, Txyz, TColl, TVert } from './common';
import { GIGeom } from './GIGeom';
import { arrRem, arrIdxAdd } from '../util/arrs';
import { vecDot } from '../geom/vectors';

/**
 * Class for geometry.
 */
export class GIGeomModifyColl {
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
     * Set the parent if a collection
     * @param coll_i The index of teh collection that is the parent
     * @param parent_coll_i
     */
    public setCollParent(coll_i: number, parent_coll_i: number): void {
        this._geom_maps.dn_colls_objs.get(coll_i)[0] = parent_coll_i;
        // update time stamp
        this._geom.time_stamp.updateEntTs(EEntType.COLL, coll_i);
    }
    /**
     * Add entities to a collection.
     * Time stamp is not updated.
     * @param coll_i
     * @param points_i
     * @param plines_i
     * @param pgons_i
     */
    public collAddEnts(coll_i: number, points_i: number[], plines_i: number[], pgons_i: number[]): void {
        const coll: TColl = this._geom_maps.dn_colls_objs.get(coll_i);
        const coll_points: number[] = coll[1];
        if (points_i.length) {
            for (const point_i of points_i) {
                if (coll_points.indexOf(point_i) === -1) {
                    // update down arrays
                    coll_points.push(point_i);
                    // update up arrays
                    if (this._geom_maps.up_points_colls.has(point_i)) {
                        this._geom_maps.up_points_colls.get(point_i).push(coll_i);
                    } else {
                        this._geom_maps.up_points_colls.set(point_i, [coll_i]);
                    }
                }
            }
        }
        const coll_plines: number[] = coll[2];
        if (plines_i.length) {
            for (const pline_i of plines_i) {
                if (coll_plines.indexOf(pline_i) === -1) {
                    // update down arrays
                    coll_plines.push(pline_i);
                    // update up arrays
                    if (this._geom_maps.up_plines_colls.has(pline_i)) {
                        this._geom_maps.up_plines_colls.get(pline_i).push(coll_i);
                    } else {
                        this._geom_maps.up_plines_colls.set(pline_i, [coll_i]);
                    }
                }
            }
        }
        const coll_pgons: number[] = coll[3];
        if (pgons_i.length) {
            for (const pgon_i of pgons_i) {
                if (coll_pgons.indexOf(pgon_i) === -1) {
                    // update down arrays
                    coll_pgons.push(pgon_i);
                    // update up arrays
                    if (this._geom_maps.up_pgons_colls.has(pgon_i)) {
                        this._geom_maps.up_pgons_colls.get(pgon_i).push(coll_i);
                    } else {
                        this._geom_maps.up_pgons_colls.set(pgon_i, [coll_i]);
                    }
                }
            }
        }
    }
    /**
     * Remove entities from a collection.
     * Time stamp is not updated.
     * @param coll_i
     * @param points_i
     * @param plines_i
     * @param pgons_i
     */
    public collRemoveEnts(coll_i: number, points_i: number[], plines_i: number[], pgons_i: number[]): void {
        const coll: TColl = this._geom_maps.dn_colls_objs.get(coll_i);
        const coll_points: number[] = coll[1];
        if (points_i && points_i.length) {
            for (const point_i of points_i) {
                // update down arrays
                arrRem(coll_points, point_i);
                // update up arrays
                arrRem(this._geom_maps.up_points_colls.get(point_i), coll_i);
            }
        }
        const coll_plines: number[] = coll[2];
        if (plines_i && plines_i.length) {
            for (const pline_i of plines_i) {
                // update down arrays
                arrRem(coll_plines, pline_i);
                // update up arrays
                arrRem(this._geom_maps.up_plines_colls.get(pline_i), coll_i);
            }
        }
        const coll_pgons: number[] = coll[3];
        if (pgons_i && pgons_i.length) {
            for (const pgon_i of pgons_i) {
                // update down arrays
                arrRem(coll_pgons, pgon_i);
                // update up arrays
                arrRem(this._geom_maps.up_pgons_colls.get(pgon_i), coll_i);
            }
        }
    }
}
