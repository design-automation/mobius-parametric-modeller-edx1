import {  IGeomArrays } from '../../common';
import { Geom } from '../Geom';
import { GeomNav } from './GeomNav';

/**
 * Working with verts.
 *
 */
export class GeomVert extends GeomNav {
    /**
     * Constructor
     */
    constructor(geom: Geom, geom_arrays: IGeomArrays) {
        super(geom, geom_arrays);
    }
    // ============================================================================
    // IS / HAS ??? methods, return true/false
    // ============================================================================

    public vertIsPline(vert_i: number): boolean {
        const edges_a_i: [number[], number[]] = this._geom_arrays.up_verts_edges[vert_i];
        const edge_i: number = edges_a_i[0][0] !== undefined ? edges_a_i[0][0] : edges_a_i[1][0];
        if (edge_i === undefined) { return false; }
        return this._geom_arrays.up_wires_plines[this._geom_arrays.up_edges_wires[edge_i]] !== undefined;
    }
    public vertIsPgon(vert_i: number): boolean {
        const edges_a_i: [number[], number[]] = this._geom_arrays.up_verts_edges[vert_i];
        const edge_i: number = edges_a_i[0][0] !== undefined ? edges_a_i[0][0] : edges_a_i[1][0];
        if (edge_i === undefined) { return false; }
        return this._geom_arrays.up_wires_faces[this._geom_arrays.up_edges_wires[edge_i]] !== undefined;
    }
    public vertIsEdge(vert_i: number): boolean {
        return this._geom_arrays.up_verts_edges[vert_i] !== undefined;
    }
    public vertIsPoint(vert_i: number): boolean {
        return this._geom_arrays.up_verts_points[vert_i] !== undefined;
    }
    public pgonHasHoles(pgon_i: number): boolean {
        return this._geom_arrays.dn_faces_wirestris[
            this._geom_arrays.dn_pgons_faces[pgon_i]
        ][0].length > 1;
    }
}
