import { IGeomArrays } from '../../common';
import { Geom } from '../Geom';
import { GeomNav } from './GeomNav';

/**
 * Linking and unlinking entities.
 *
 */
export class GeomLink extends GeomNav {
    /**
     * Constructor
     */
    constructor(geom: Geom) {
        super(geom);
    }
    // ============================================================================
    // Link entities
    // Bidirectional
    // ============================================================================
    public linkVertPosi(vert_i: number, posi_i: number): void {
        // down
        this._geom_arrays.dn_verts_posis[vert_i] = posi_i;
        // up
        this._addValToSetInArr(this._geom_arrays.up_posis_verts, posi_i, vert_i);
    }
    public linkEdgeStartVert(edge_i: number, vert_i: number): void {
        // down
        this._geom_arrays.dn_edges_verts[edge_i][0] = vert_i;
        // up
        const edges_i: [number, number] = this._geom_arrays.up_verts_edges[vert_i];
        if (edges_i === undefined) {
            this._geom_arrays.up_verts_edges[vert_i] = [null, edge_i]; // Empty array
        } else {
            this._geom_arrays.up_verts_edges[vert_i][1] = edge_i;
        }
    }
    public linkEdgeEndVert(edge_i: number, vert_i: number): void {
        // down
        this._geom_arrays.dn_edges_verts[edge_i][1] = vert_i;
        // up
        const edges_i:  [number, number] = this._geom_arrays.up_verts_edges[vert_i];
        if (edges_i === undefined) {
            this._geom_arrays.up_verts_edges[vert_i] = [edge_i, null]; // Empty array
        } else {
            this._geom_arrays.up_verts_edges[vert_i][0] = edge_i;
        }
    }
    public linkWireEdge(wire_i: number, idx: number,  edge_i: number): void {
        // down
        this._geom_arrays.dn_wires_edges[wire_i][idx] = edge_i;
        // up
        this._geom_arrays.up_edges_wires[edge_i] = wire_i;
    }
    public linkFaceTri(face_i: number, tri_i: number): void {
        // down
        this._geom_arrays.dn_faces_tris[face_i].push(tri_i); // TODO should be a set
        // up
        this._geom_arrays.up_tris_faces[tri_i] = face_i;
    }
    public linkFaceWire(face_i: number, idx: number, wire_i: number): void {
        // down
        this._geom_arrays.dn_faces_wires[face_i][idx] = wire_i;
        // up
        this._geom_arrays.up_wires_faces[wire_i] = face_i;
    }
    public linkPointVert(point_i: number, vert_i: number): void {
        // down
        this._geom_arrays.dn_points_verts[point_i] = vert_i;
        // up
        this._geom_arrays.up_verts_points[vert_i] = point_i;
    }
    public linkPlineWire(pline_i: number, wire_i: number): void {
        // down
        this._geom_arrays.dn_plines_wires[pline_i] = wire_i;
        // up
        this._geom_arrays.up_wires_plines[wire_i] = pline_i;
    }
    public linkPgonFace(pgon_i: number, face_i: number): void {
        // down
        this._geom_arrays.dn_pgons_faces[pgon_i] = face_i;
        // up
        this._geom_arrays.up_faces_pgons[face_i] = pgon_i;
    }
    public linkCollPoint(coll_i: number, point_i: number): void {
        // down
        this._addValToSetInArr(this._geom_arrays.dn_colls_points, coll_i, point_i);
        // up
        this._addValToSetInArr(this._geom_arrays.up_points_colls, point_i, coll_i);
    }
    public linkCollPline(coll_i: number, pline_i: number): void {
        // down
        this._addValToSetInArr(this._geom_arrays.dn_colls_plines, coll_i, pline_i);
        // up
        this._addValToSetInArr(this._geom_arrays.up_plines_colls, pline_i, coll_i);
    }
    public linkCollPgon(coll_i: number, pgon_i: number): void {
        // down
        this._addValToSetInArr(this._geom_arrays.dn_colls_pgons, coll_i, pgon_i);
        // up
        this._addValToSetInArr(this._geom_arrays.up_pgons_colls, pgon_i, coll_i);
    }
    // ============================================================================
    // Unlink entities
    // Bidirectional unlinkAB A <-> B
    // Non-didirectional unlinkAToB A -> B
    // ============================================================================
    public unlinkVertPosi(vert_i: number, posi_i: number): void {
        // down
        this._clearValsInArr(this._geom_arrays.dn_verts_posis, vert_i, true);
        // up
        this._remValFromSetInArr(this._geom_arrays.up_posis_verts, posi_i, vert_i, false); //  should be set to null
    }
    public unlinkPosiToVert(posi_i: number, vert_i: number): void {
        // up
        this._remValFromSetInArr(this._geom_arrays.up_posis_verts, posi_i, vert_i, true);
    }
    public unlinkEdgeStartVert(edge_i: number, vert_i: number): void {
        // down
        this._clearValsInArr(this._geom_arrays.dn_edges_verts[edge_i], 0, true);
        // up
        // if (this._geom_arrays.up_verts_edges[vert_i][0] === null) { return; } // TODO is this needed
        this._clearValsInArrIf(this._geom_arrays.up_verts_edges[vert_i], 1, edge_i, true);
    }
    public unlinkEdgeEndVert(edge_i: number, vert_i: number): void {
        // down
        this._clearValsInArr(this._geom_arrays.dn_edges_verts[edge_i], 1, true);
        // up
        // if (this._geom_arrays.up_verts_edges[vert_i][1] === null) { return; } // TODO is this needed
        this._clearValsInArrIf( this._geom_arrays.up_verts_edges[vert_i], 0, edge_i, true);
    }
    public unlinkVertToEdge(vert_i: number, edge_i: number): void {
        // up
        // if (this._geom_arrays.up_verts_edges[vert_i][0] === null) { return; } // TODO is this needed
        this._clearValsInArrIf(this._geom_arrays.up_verts_edges[vert_i], 0, edge_i, true);
        this._clearValsInArrIf(this._geom_arrays.up_verts_edges[vert_i], 1, edge_i, true);
    }
    public unlinkWireEdge(wire_i: number, edge_i: number): void {
        // down
        this._remValFromSetInArr(this._geom_arrays.dn_wires_edges, wire_i, edge_i, true);
        // up
        this._clearValsInArrIf( this._geom_arrays.up_edges_wires, edge_i, wire_i, true);
    }
    public unlinkEdgeToWire(edge_i: number, wire_i: number): void {
        // up
        this._clearValsInArrIf( this._geom_arrays.up_edges_wires, edge_i, wire_i, true);
    }
    public unlinkFaceTri(face_i: number, tri_i: number): void {
        // down
        this._remValFromSetInArr(this._geom_arrays.dn_faces_tris, face_i, tri_i, true);
        // up
        this._clearValsInArrIf( this._geom_arrays.up_tris_faces, tri_i, face_i, true);
    }
    public unlinkTriToFace(tri_i: number, face_i: number): void {
        // up
        this._clearValsInArrIf( this._geom_arrays.up_tris_faces, tri_i, face_i, true);
    }
    public unlinkFaceWire(face_i: number, wire_i: number): void {
        // down
        this._remValFromSetInArr(this._geom_arrays.dn_faces_wires, face_i, wire_i, true);
        // up
        this._clearValsInArrIf( this._geom_arrays.up_wires_faces, wire_i, face_i, true);
    }
    public unlinkWireToFace(wire_i: number, face_i: number): void {
        // up
        this._clearValsInArrIf( this._geom_arrays.up_wires_faces, wire_i, face_i, true);
    }
    public unlinkPointVert(point_i: number, vert_i: number): void {
        // down
        this._clearValsInArr(this._geom_arrays.dn_points_verts, point_i, true);
        // up
        this._clearValsInArrIf( this._geom_arrays.up_verts_points, vert_i, point_i, true);
    }
    public unlinkVertToPoint(vert_i: number, point_i: number): void {
        // up
        this._clearValsInArrIf( this._geom_arrays.up_verts_points, vert_i, point_i, true);
    }
    public unlinkPlineWire(pline_i: number, wire_i: number): void {
        // down
        this._clearValsInArr(this._geom_arrays.dn_plines_wires, pline_i, true);
        // up
        this._clearValsInArrIf( this._geom_arrays.up_wires_plines, wire_i, pline_i, true);
    }
    public unlinkWireToPline(wire_i: number, pline_i: number): void {
        // up
        this._clearValsInArrIf( this._geom_arrays.up_wires_plines, wire_i, pline_i, true);
    }
    public unlinkPgonFace(pgon_i: number, face_i: number): void {
        // down
        this._clearValsInArr(this._geom_arrays.dn_pgons_faces, pgon_i, true);
        // up
        this._clearValsInArrIf( this._geom_arrays.up_faces_pgons, face_i, pgon_i, true);
    }
    public unlinkFaceToPgon(face_i: number, pgon_i: number): void {
        // up
        this._clearValsInArrIf( this._geom_arrays.up_faces_pgons, face_i, pgon_i, true);
    }
    public unlinkCollPoint(coll_i: number, point_i: number): void {
        // down
        this._remValFromSetInArr(this._geom_arrays.dn_colls_points, coll_i, point_i, true);
        // up
        this._remValFromSetInArr(this._geom_arrays.up_points_colls, point_i, coll_i, true);
    }
    public unlinkPointToColl(point_i: number, coll_i: number): void {
        // up
        this._remValFromSetInArr(this._geom_arrays.up_points_colls, point_i, coll_i, true);
    }
    public unlinkCollPline(coll_i: number, pline_i: number): void {
        // down
        this._remValFromSetInArr(this._geom_arrays.dn_colls_plines, coll_i, pline_i, true);
        // up
        this._remValFromSetInArr(this._geom_arrays.up_plines_colls, pline_i, coll_i, true);
    }
    public unlinkPlineToColl(pline_i: number, coll_i: number): void {
        // up
        this._remValFromSetInArr(this._geom_arrays.up_plines_colls, pline_i, coll_i, true);
    }
    public unlinkCollPgon(coll_i: number, pgon_i: number): void {
        // down
        this._remValFromSetInArr(this._geom_arrays.dn_colls_pgons, coll_i, pgon_i, true);
        // up
        this._remValFromSetInArr(this._geom_arrays.up_pgons_colls, pgon_i, coll_i, true);
    }
    public unlinkPgonToColl(pgon_i: number, coll_i: number): void {
        // up
        this._remValFromSetInArr(this._geom_arrays.up_pgons_colls, pgon_i, coll_i, true);
    }
}