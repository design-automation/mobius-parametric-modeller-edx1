// classes to extend
import { GIGeomNav } from './GIGeomNav';
// classes to inherit from via mixins
import { GIGeomAdd } from './GIGeomAdd';
import { GIGeomColl } from './GIGeomColl';
import { GIGeomEnt } from './GIGeomEnt';
import { GIGeomFace } from './GIGeomFace';
import { GIGeomIns } from './GIGeomIns';
import { GIGeomLink } from './GIGeomLink';
import { GIGeomPack } from './GIGeomPack';
import { GIGeomPosi } from './GIGeomPosi';
import { GIGeomRem } from './GIGeomRem';
import { GIGeomRev } from './GIGeomRev';
import { GIGeomTree } from './GIGeomTree';
import { GIGeomVert } from './GIGeomVert';
import { GIGeomWire } from './GIGeomWire';
// others
import { IGeomArrays, TFace, Txyz, TTri } from '../../common';
import { GIGeom } from '../GIGeom';
import { triangulate } from '@assets/libs/triangulate/triangulate';

/**
 * Class that inherits all the other classes using mixins
 *
 */
export class GIGeomData extends GIGeomNav {
    /**
     * Constructor
     */
    constructor(geom: GIGeom, geom_arrays: IGeomArrays) {
        super(geom, geom_arrays);
    }

    // ============================================================================
    // Cut holes in faces and triangulate faces
    // TODO Move this out of the data section
    // ============================================================================
    /**
     * Triangulate a polygon.
     *
     * The input polygon may not have any triangles.
     */
    public faceTri(face_i: number): void {
        const wirestris: TFace = this._geom_arrays.dn_faces_wirestris[face_i];
        const outer_i: number = wirestris[0][0];
        const holes_i: number[] = wirestris[0].slice(1);
        // create the triangles
        const new_face_tris_i: number[] = this._createTris(outer_i, holes_i);
        // delete the old trianges
        const old_face_tris_i: number[] = wirestris[1]; // if this is a new pgon, this is empty
        for (const old_face_tri_i of old_face_tris_i) {
            this.remTriEnt(old_face_tri_i);
            this.unlinkFaceTri(face_i, old_face_tri_i);
        }
        for (const new_face_tri_i of new_face_tris_i) {
            this.linkFaceTri(face_i, new_face_tri_i);
        }
    }
    /**
     * Adds a hole to a face and updates the arrays.
     * Wires are assumed to be closed!
     * This also calls addTris()
     * TODO  - remove this method
     */
    public faceCutHoles(face_i: number, hole_wires_i: number[]): number {
        // get the wires and triangles arrays
        const [face_wires_i, old_face_tris_i]: [number[], number[]] = this._geom_arrays.dn_faces_wirestris[face_i];
        // get the outer wire
        const outer_wire_i: number = face_wires_i[0];
        // get the hole wires
        const all_hole_wires_i: number[] = [];
        if (face_wires_i.length > 1) {
            face_wires_i.slice(1).forEach(wire_i => all_hole_wires_i.push(wire_i));
        }
        hole_wires_i.forEach(wire_i => all_hole_wires_i.push(wire_i));
        // create the triangles
        const new_tris_i: number[] = this._createTris(outer_wire_i, all_hole_wires_i);
        // create the face
        const new_wires_i: number[] = face_wires_i.concat(hole_wires_i);
        const new_face: TFace = [new_wires_i, new_tris_i];
        // update down arrays
        this._geom_arrays.dn_faces_wirestris[face_i] = new_face;
        // update up arrays
        hole_wires_i.forEach(hole_wire_i => this._geom_arrays.up_wires_faces[hole_wire_i] = face_i);
        new_tris_i.forEach( tri_i => this._geom_arrays.up_tris_faces[tri_i] = face_i );
        // delete the old trianges
        for (const old_face_tri_i of old_face_tris_i) {
            // remove these deleted tris from the verts
            for (const vertex_i of this._geom_arrays.dn_tris_verts[old_face_tri_i]) {
                this._remFromSet( this._geom_arrays.up_verts_tris, vertex_i, old_face_tri_i, true);
            }
            // tris to verts
            this._clear(this._geom_arrays.dn_tris_verts, old_face_tri_i, false);
            // tris to faces
            this._clear( this._geom_arrays.up_tris_faces, old_face_tri_i, false );
        }
        // return the numeric index of the face
        return face_i;
    }
    /**
     * Adds trangles and updates the arrays.
     * Wires are assumed to be closed!
     * This updates the trie->verts and the verts->tris
     * This does not update the face to which this wire belongs!
     * @param wire_i
     */
    private _createTris(wire_i: number, hole_wires_i?: number[]): number[] {
        // save all verts
        const all_verts_i: number[] = [];
        // get the coords of the outer perimeter edge
        const wire_verts_i: number[] = this.wireGetVerts(wire_i);
        const wire_xyzs: Txyz[] = [];
        for (const vert_i of wire_verts_i) {
            all_verts_i.push(vert_i);
            wire_xyzs.push( this.geom.model.attribs.query.getVertCoords(vert_i) );
        }
        // get the coords of the holes
        const all_hole_coords: Txyz[][] = [];
        if (hole_wires_i !== undefined) {
            for (const hole_wire_i of hole_wires_i) {
                const hole_verts_i: number[] = this.wireGetVerts(hole_wire_i);
                const hole_xyzs: Txyz[] = [];
                for (const vert_i of hole_verts_i) {
                    all_verts_i.push(vert_i);
                    hole_xyzs.push( this.geom.model.attribs.query.getVertCoords(vert_i) );
                }
                all_hole_coords.push(hole_xyzs);
            }
        }
        // create the triangles using earcut
        const tris_corners: number[][] = triangulate(wire_xyzs, all_hole_coords);
        const tris: TTri[] = tris_corners.map(tri_corners => tri_corners.map( corner => all_verts_i[corner] ) as TTri );
        // create the tris
        const tris_i: number[] = [];
        for (const tri of tris) {
            tris_i.push( this.addTriEnt(tri) );
        }
        // return an array of numeric indices of the triangles
        return tris_i;
    }
}

export interface GIGeomData extends
    GIGeomAdd, GIGeomColl, GIGeomEnt, GIGeomFace,
    GIGeomIns, GIGeomLink, GIGeomPack, GIGeomPosi,
    GIGeomRem, GIGeomRev, GIGeomTree, GIGeomVert,
    GIGeomWire {}

applyMixins(GIGeomData, [
    GIGeomAdd, GIGeomColl, GIGeomEnt, GIGeomFace,
    GIGeomIns, GIGeomLink, GIGeomPack, GIGeomPosi,
    GIGeomRem, GIGeomRev, GIGeomTree, GIGeomVert,
    GIGeomWire
]);

export function applyMixins(derivedCtor: any, baseCtors: any[]) {
    baseCtors.forEach(baseCtor => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
            const attribs = Object.getOwnPropertyDescriptor(
                baseCtor.prototype, name) as PropertyDescriptor;
            Object.defineProperty(
                derivedCtor.prototype,
                name,
                attribs
            );
        });
    });
}