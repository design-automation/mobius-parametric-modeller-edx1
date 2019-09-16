import { GIGeom } from './GIGeom';
import { GIAttribs } from './GIAttribs';
import { IModelData, IGeomPack, EEntType, Txyz, TEntAttribValuesArr, TAttribDataTypes, TEntity, TEntTypeIdx } from './common';
import { GIModelThreejs } from './GIModelThreejs';

/**
 * Geo-info model class.
 */
export class GIModel {
    [x: string]: any; // TODO: What is this???
    public geom: GIGeom;
    public attribs: GIAttribs;
    public threejs: GIModelThreejs;
    /**
     * Creates a model.
     * @param model_data The JSON data
     */
    constructor(model_data?: IModelData) {
        this.geom = new GIGeom(this);
        this.attribs = new GIAttribs(this);
        this.threejs = new GIModelThreejs(this);
        if (model_data) {
            this.setData(model_data);
        }
    }
    /**
     * Copys the data from a second model into this model.
     * The existing data in this model is not deleted.
     * @param model_data The GI model.
     */
    public merge(model: GIModel): void {
        this.attribs.io.merge(model.attribs._attribs_maps); // warning: must be before this.geom.io.merge()
        this.geom.io.merge(model.geom._geom_arrays);
    }
    /**
     * Sets the data in this model from JSON data.
     * Any existing data in the model is deleted.
     * @param model_data The JSON data.
     */
    public setData (model_data: IModelData): IGeomPack {
        this.attribs.io.setData(model_data.attributes); // warning: must be before this.geom.io.setData()
        const new_ents_i: IGeomPack = this.geom.io.setData(model_data.geometry);
        return new_ents_i;
    }
    /**
     * Returns the JSON data for this model.
     */
    public getData(): IModelData {
        return {
            geometry: this.geom.io.getData(),
            attributes: this.attribs.io.getData()
        };
    }
    /**
     * Check model for internal consistency
     */
    public check(): string[] {
        return this.geom.check();
    }
    /**
     * Compares this model and another model.
     * ~
     * This is the answer model.
     * The other model is the submitted model.
     * ~
     * Both models will be modified in the process.
     * ~
     * @param model The model to compare with.
     */
    public compare(model: GIModel, normalize: boolean, check_geom_equality: boolean, check_attrib_equality: boolean):
            {percent: number, score: number, total: number, comment: string} {
        // create the result object
        const result: {percent: number, score: number, total: number, comment: any} = {percent: 0, score: 0, total: 0, comment: []};
        // if check_geom_equality, then check we have exact same number of positions, objects, and colletions
        if (check_geom_equality) {
            this.geom.compare(model, result);
        }
        // check that the attributes in this model all exist in the other model
        // at the same time get a map of all attribute names in this model
        if (check_attrib_equality) {
            this.attribs.compare(model, result);
        }
        // normalize the two models
        if (normalize) {
            this.norm();
            model.norm();
        }
        // compare objects
        let idx_maps: [Map<EEntType, Map<number, number>>, Map<EEntType, Map<number, number>>] = null;
        idx_maps = this.compareObjs(model, result);
        // if the score is sero, maybe one model is translated
        this.checkForErrors(model, result, idx_maps);
        // compare colls and mode attribs
        this.compareColls(model, result, idx_maps);
        this.compareModelAttribs(model, result);
        // Add a final msg
        if (result.score === result.total) {
            result.comment = ['RESULT: The two models match.'];
        } else {
            result.comment.push('RESULT: The two models no not match.');
        }
        // calculate percentage score
        result.percent = Math.round( result.score / result.total * 100);
        if (result.percent < 0) { result.percent = 0; }
        // html formatting
        let formatted_str = '';
        formatted_str += '<p><b>Percentage: ' + result.percent + '%</b></p>';
        formatted_str += '<p>Score: ' + result.score + '/' + result.total + '</p>';
        formatted_str += '<ul>';
        for (const comment of result.comment) {
            if (Array.isArray(comment)) {
                formatted_str += '<ul>';
                    for (const sub_comment of comment) {
                        formatted_str += '<li>' + sub_comment + '</li>';
                    }
                formatted_str += '</ul>';
            } else {
                formatted_str += '<li>' + comment + '</li>';
            }
        }
        formatted_str += '</ul>';
        result.comment = formatted_str;
        // return the result
        return result;
    }
    // ============================================================================
    // Private methods for normalizing
    // ============================================================================
    /**
     * Normalises the direction of open wires
     */
    private norm(): void {
        const trans_padding: [Txyz, number[]] = this.getTransPadding();
        this.normOpenWires(trans_padding);
        this.normClosedWires(trans_padding);
        this.normHoles(trans_padding);
    }
    /**
     * Get the min max posis
     */
    private getTransPadding(): [Txyz, number[]] {
        const precision = 1e4;
        const min: Txyz = [Infinity, Infinity, Infinity];
        const max: Txyz = [-Infinity, -Infinity, -Infinity];
        for (const posi_i of this.geom.query.getEnts(EEntType.POSI, false)) {
            const xyz: Txyz = this.attribs.query.getPosiCoords(posi_i);
            if (xyz[0] < min[0]) { min[0] = xyz[0]; }
            if (xyz[1] < min[1]) { min[1] = xyz[1]; }
            if (xyz[2] < min[2]) { min[2] = xyz[2]; }
            if (xyz[0] > max[0]) { max[0] = xyz[0]; }
            if (xyz[1] > max[1]) { max[1] = xyz[1]; }
            if (xyz[2] > max[2]) { max[2] = xyz[2]; }
        }
        const trans_vec: Txyz = [min[0] * -1, min[1] * -1, min[2] * -1];
        const trans_max: Txyz = [max[0] + trans_vec[0], max[1] + trans_vec[1], max[2] + trans_vec[2]];
        const padding: number[] = [
            String(Math.round(trans_max[0] * precision)).length,
            String(Math.round(trans_max[1] * precision)).length,
            String(Math.round(trans_max[2] * precision)).length
        ];
        return [trans_vec, padding];
    }
    /**
     * Normalises the direction of open wires
     */
    private normOpenWires(trans_padding: [Txyz, number[]]): void {
        for (const wire_i of this.geom.query.getEnts(EEntType.WIRE, false)) {
            if (!this.geom.query.istWireClosed(wire_i)) {
                // an open wire can only start at the first or last vertex, but the order can be reversed
                const verts_i: number[] = this.geom.query.navAnyToVert(EEntType.WIRE, wire_i);
                const fprint_start: string = this.normXyzFprint(EEntType.VERT, verts_i[0], trans_padding);
                const fprint_end: string = this.normXyzFprint(EEntType.VERT, verts_i[verts_i.length - 1], trans_padding);
                if (fprint_start > fprint_end) {
                    this.geom.modify.reverse(wire_i);
                }
            }
        }
    }
    /**
     * Normalises the edge order of closed wires
     */
    private normClosedWires(trans_padding: [Txyz, number[]]): void {
        for (const wire_i of this.geom.query.getEnts(EEntType.WIRE, false)) {
            if (this.geom.query.istWireClosed(wire_i)) {
                // a closed wire can start at any edge, but the order cannot be reversed
                const edges_i: number[] = this.geom.query.navAnyToEdge(EEntType.WIRE, wire_i);
                const fprints: Array<[string, number]> = [];
                for (let i = 0; i < edges_i.length; i++) {
                    const edge_i: number = edges_i[i];
                    fprints.push([this.normXyzFprint(EEntType.EDGE, edge_i, trans_padding), i]);
                }
                fprints.sort();
                this.geom.modify.shift(wire_i, fprints[0][1]);
            }
        }
    }
    /**
     * Normalises the order of holes in faces
     */
    private normHoles(trans_padding: [Txyz, number[]]): void {
        for (const face_i of this.geom.query.getEnts(EEntType.FACE, false)) {
            const holes_i: number[] = this.geom.query.getFaceHoles(face_i);
            if (holes_i.length > 0) {
                const fprints: Array<[string, number]> = [];
                for (const hole_i of holes_i) {
                    fprints.push([this.normXyzFprint(EEntType.WIRE, hole_i, trans_padding), hole_i]);
                }
                fprints.sort();
                const reordered_holes_i: number[] = fprints.map( fprint => fprint[1] );
                this.geom.modify.setFaceHoles(face_i, reordered_holes_i);
            }
        }
    }
    /**
     * Round the xyz values, rounded to the precision level
     * ~
     * @param posi_i
     */
    private normXyzFprint(ent_type: EEntType, ent_i: number,  trans_padding: [Txyz, number[]]): string {
        const precision = 1e4;
        // get the xyzs
        const fprints: string[] = [];
        const posis_i: number[] = this.geom.query.navAnyToPosi(ent_type, ent_i);
        for (const posi_i of posis_i) {
            const xyz: Txyz = this.attribs.query.getPosiCoords(posi_i);
            const fprint: string[] = [];
            for (let i = 0; i < 3; i++) {
                const xyz_round: number = Math.round((xyz[i] + trans_padding[0][i]) * precision);
                fprint.push(String(xyz_round).padStart(trans_padding[1][i], '0'));
            }
            fprints.push(fprint.join(','));
        }
        return fprints.join('|');
    }
    // ============================================================================
    // Private methods for comparing objs, colls
    // ============================================================================
    /**
     * For any entity, greate a string that concatenates all the xyz values of its positions.
     * ~
     * These strings will be used for sorting entities into a predictable order,
     * independent of the order in which the geometry was actually created.
     * ~
     * If there are multiple entities in exactly the same position, then the ordering may be unpredictable.
     * ~
     * @param ent_type
     * @param ent_i
     */
    private xyzFprint(ent_type: EEntType, ent_i: number, trans_vec = [0, 0, 0]): string {
        const posis_i: number[] = this.geom.query.navAnyToPosi(ent_type, ent_i);
        const xyzs: Txyz[] = posis_i.map(posi_i => this.attribs.query.getPosiCoords(posi_i));
        const fprints: string[] = xyzs.map(xyz => this.getAttribValFprint([
            xyz[0] + trans_vec[0],
            xyz[1] + trans_vec[1],
            xyz[2] + trans_vec[2]
        ]));
        return fprints.join('|');
    }
    /**
     * Compare the objects
     */
    private compareObjs(other_model: GIModel, result: {score: number, total: number, comment: any[]}):
            [Map<EEntType, Map<number, number>>, Map<EEntType, Map<number, number>>] {
        result.comment.push('Comparing objects in the two models.');
        const data_comments: string [] = [];
        // set attrib names to check when comparing objects and collections
        const attrib_names: Map<EEntType, string[]> = new Map();
        attrib_names.set(EEntType.POSI, ['xyz']);
        if (this.attribs.query.hasAttrib(EEntType.VERT, 'rgb')) {
            attrib_names.set(EEntType.VERT, ['rgb']);
        }
        if (this.attribs.query.hasAttrib(EEntType.PGON, 'material')) {
            attrib_names.set(EEntType.PGON, ['material']);
        }
        // points, polylines, polygons
        const obj_ent_types: EEntType[] = [EEntType.POINT, EEntType.PLINE, EEntType.PGON];
        const obj_ent_type_strs: Map<EEntType, string> = new Map([
            [EEntType.POINT, 'points'],
            [EEntType.PLINE, 'polylines'],
            [EEntType.PGON, 'polygons']
        ]);
        // compare points, plines, pgons
        const this_to_com_idx_maps: Map<EEntType, Map<number, number>> = new Map();
        const other_to_com_idx_maps: Map<EEntType, Map<number, number>> = new Map();
        for (const obj_ent_type of obj_ent_types) {
            // create the two maps, and store them in the map of maps
            const this_to_com_idx_map: Map<number, number> = new Map();
            this_to_com_idx_maps.set(obj_ent_type, this_to_com_idx_map);
            const other_to_com_idx_map: Map<number, number> = new Map();
            other_to_com_idx_maps.set(obj_ent_type, other_to_com_idx_map);
            // get the fprints
            const [this_fprints, this_ents_i]: [string[], number[]] = this.getEntsFprint(obj_ent_type, attrib_names);
            // console.log('this_fprints:', this_fprints, 'this_ents_i:', this_ents_i);
            const [other_fprints, other_ents_i]: [string[], number[]] = other_model.getEntsFprint(obj_ent_type, attrib_names);
            // console.log('other_fprints:', other_fprints, 'other_ents_i:', other_ents_i);
            // check that every entity in this model also exists in the other model
            let num_objs_not_found = 0;
            for (let com_idx = 0; com_idx < this_fprints.length; com_idx++) {
                // increment the total by 1
                result.total += 1;
                // get this fprint, i.e. the one we are looking for in the other model
                const this_fprint: string = this_fprints[com_idx];
                // get this index and set the map
                const this_ent_i: number = this_ents_i[com_idx];
                this_to_com_idx_map.set(this_ent_i, com_idx);
                // for other...
                // get the index of this_fprint in the list of other_fprints
                const found_other_idx: number = other_fprints.indexOf(this_fprint);
                // add mismatch comment or update score
                if (found_other_idx === -1) {
                    num_objs_not_found++;
                } else {
                    // we other index and set the map
                    const other_ent_i: number = other_ents_i[found_other_idx];
                    other_to_com_idx_map.set(other_ent_i, com_idx);
                    // update the score
                    result.score += 1;
                }
            }
            // only write a msg for the case when there are actually some objs to be found
            if (this_fprints.length > 0) {
                if (num_objs_not_found > 0) {
                    data_comments.push('Mismatch: ' + num_objs_not_found + ' ' +
                        obj_ent_type_strs.get(obj_ent_type) + ' entities could not be found.');
                } else {
                    data_comments.push('All ' +
                    obj_ent_type_strs.get(obj_ent_type) + ' entities have been found.');
                }
            }
        }
        // return result
        result.comment.push(data_comments);
        // return the maps, needed for comparing collections
        return [this_to_com_idx_maps, other_to_com_idx_maps];
    }
    /**
     * Compare the collections
     */
    private compareColls(other_model: GIModel, result: {score: number, total: number, comment: any[]},
            idx_maps: [Map<EEntType, Map<number, number>>, Map<EEntType, Map<number, number>>]): void {
        result.comment.push('Comparing collections in the two models.');
        const data_comments: string [] = [];
        // set attrib names to check when comparing objects and collections
        const attrib_names: string[] = []; // no attribs to check
        // get the maps
        const this_to_com_idx_maps: Map<EEntType, Map<number, number>> = idx_maps[0];
        const other_to_com_idx_maps: Map<EEntType, Map<number, number>> = idx_maps[1];
        // compare collections
        const this_colls_fprints: string[] = this.getCollFprints(this_to_com_idx_maps, attrib_names);
        // console.log('this_colls_fprints:', this_colls_fprints);
        const other_colls_fprints: string[] = other_model.getCollFprints(other_to_com_idx_maps, attrib_names);
        // console.log('other_colls_fprints:', other_colls_fprints);
        // check that every collection in this model also exists in the other model
        let num_colls_not_found = 0;
        for (const this_colls_fprint of this_colls_fprints) {
            // increment the total score by 1
            result.total += 1;
            // look for this in other
            const found_other_idx: number = other_colls_fprints.indexOf(this_colls_fprint);
            // add mismatch comment or update score
            if (found_other_idx === -1) {
                num_colls_not_found++;
            } else {
                result.score += 1;
            }
        }
        if (num_colls_not_found > 0) {
            data_comments.push('Mismatch: ' + num_colls_not_found + ' collections could not be found.');
        }
        // add a comment if everything matches
        if (result.score === result.total) {
            data_comments.push('Match: The model contains all required entities and collections.');
        }
        // return result
        result.comment.push(data_comments);
    }
    /**
     * Compare the model attribs
     */
    private compareModelAttribs(other_model: GIModel, result: {score: number, total: number, comment: any[]}): void {
        result.comment.push('Comparing model attributes in the two models.');
        const data_comments: string [] = [];
        // set attrib names to check when comparing objects and collections
        const attrib_names: string[] = [];
        if (this.attribs.query.hasAttrib(EEntType.PGON, 'material')) {
            const pgons_i: number[] = this.geom.query.getEnts(EEntType.PGON, false);
            const mat_names: Set<string> = new Set(this.attribs.query.getAttribVal(EEntType.PGON, 'material', pgons_i) as string[]);
            for (const mat_name of Array.from(mat_names)) {
                if (mat_name !== undefined) {
                    attrib_names.push(mat_name);
                }
            }
        }
        // compare model attributes
        for (const this_mod_attrib_name of attrib_names) {
            // increment the total by 1
            result.total += 1;
            // check if there is a match
            if (other_model.attribs.query.hasModelAttrib(this_mod_attrib_name)) {
                const this_value: TAttribDataTypes = this.attribs.query.getModelAttribVal(this_mod_attrib_name);
                const other_value: TAttribDataTypes = other_model.attribs.query.getModelAttribVal(this_mod_attrib_name);
                const this_value_fp: string = this.getAttribValFprint(this_value);
                const other_value_fp: string = this.getAttribValFprint(other_value);
                if (this_value_fp === other_value_fp) {
                    // correct, so increment the score by 1
                    result.score += 1;
                } else {
                    data_comments.push('Mismatch: the value for model attribute "' + this_mod_attrib_name + '" is incorrect.');
                }
            } else {
                data_comments.push('Mismatch: model attribute "' + this_mod_attrib_name + '" not be found.');
            }
        }
        // add a comment if everything matches
        if (result.score === result.total) {
            data_comments.push('Match: The model conatins all required model attributes.');
        }
        // return result
        result.comment.push(data_comments);
    }
    /**
     * Check to see if there are any common errors.
     */
    private checkForErrors(other_model: GIModel, result: {score: number, total: number, comment: any[]},
            idx_maps: [Map<EEntType, Map<number, number>>, Map<EEntType, Map<number, number>>]): void {
        // set precision of comparing vectors
        // this precision should be a little higher than the precision used in 
        // getAttribValFprint()
        const precision = 1e6;
        // get the maps
        const this_to_com_idx_maps: Map<EEntType, Map<number, number>> = idx_maps[0];
        const other_to_com_idx_maps: Map<EEntType, Map<number, number>> = idx_maps[1];
        // points, polylines, polygons
        const obj_ent_types: EEntType[] = [EEntType.POINT, EEntType.PLINE, EEntType.PGON];
        const obj_ent_type_strs: Map<EEntType, string> = new Map([
            [EEntType.POINT, 'points'],
            [EEntType.PLINE, 'polylines'],
            [EEntType.PGON, 'polygons']
        ]);
        // compare points, plines, pgons
        const trans_comments: string[] = [];
        for (const obj_ent_type of obj_ent_types) {
            // get all the ents in the other model against which nothing has been matched
            // note that this map will be undefined for each ent for which no match was found
            // at the same time, flip the map
            const com_idx_to_other_map: Map<number, number> = new Map();
            const other_ents_i: number[] = other_model.geom.query.getEnts(obj_ent_type, false);
            const other_mia_ents_i: number[] = [];
            for (const ent_i of other_ents_i) {
                const com_idx: number = other_to_com_idx_maps.get(obj_ent_type).get(ent_i);
                if (com_idx === undefined) {
                    other_mia_ents_i.push(ent_i);
                } else {
                    com_idx_to_other_map.set(com_idx, ent_i);
                }
            }
            // get all the ents in this model for which no match has been found in the other model
            // note that this map is never empty, it always contains a mapping for each ent, even when no match was found
            const this_ents_i: number[] = this.geom.query.getEnts(obj_ent_type, false);
            const this_mia_ents_i: number[] = [];
            for (const ent_i of this_ents_i) {
                const com_idx: number = this_to_com_idx_maps.get(obj_ent_type).get(ent_i);
                const other_ent_i: number = com_idx_to_other_map.get(com_idx);
                if (other_ent_i === undefined) {
                    this_mia_ents_i.push(ent_i);
                }
            }
            // check that we have enough ents in the otehr model, if nit, exit
            if (other_mia_ents_i.length < this_mia_ents_i.length) {
                return;
            }
            // for each this_mia_ents_i, we need to find the closest other_mia_ents_i, and save the unique trans vec
            const trans_vecs_counts: Map<string, number> = new Map();
            const flipped_trans_vecs_counts: Map<string, number> = new Map();
            for (const this_mia_ent_i of this_mia_ents_i) {
                let min_dist = Infinity;
                let min_trans_vec: Txyz = null;
                const this_posis_i: number[] = this.geom.query.navAnyToPosi(obj_ent_type, this_mia_ent_i);
                let flipped = false;
                for (const other_mia_ent_i of other_mia_ents_i) {
                    const other_posis_i: number[] = other_model.geom.query.navAnyToPosi(obj_ent_type, other_mia_ent_i);
                    if (this_posis_i.length === other_posis_i.length) {
                        const this_xyz: Txyz = this.attribs.query.getPosiCoords(this_posis_i[0]);
                        const other_xyz: Txyz = other_model.attribs.query.getPosiCoords(other_posis_i[0]);
                        const trans_vec: Txyz = [
                            other_xyz[0] - this_xyz[0],
                            other_xyz[1] - this_xyz[1],
                            other_xyz[2] - this_xyz[2]
                        ];
                        const this_fp: string = this.xyzFprint(obj_ent_type, this_mia_ent_i, trans_vec);
                        const other_fp: string = other_model.xyzFprint(obj_ent_type, other_mia_ent_i);
                        if (this_fp === other_fp) {
                            const dist: number = Math.abs(trans_vec[0]) + Math.abs(trans_vec[1]) + Math.abs(trans_vec[2]);
                            if (dist < min_dist) {
                                min_dist = dist;
                                min_trans_vec = trans_vec;
                                flipped = false;
                            }
                        } else if (obj_ent_type === EEntType.PGON) {
                            // flip the polygon
                            const this_flip_fps: string[] = this_fp.split('|');
                            this_flip_fps.push(this_flip_fps.shift());
                            this_flip_fps.reverse();
                            const this_flip_fp: string = this_flip_fps.join('|');
                            if (this_flip_fp === other_fp) {
                                const dist: number = Math.abs(trans_vec[0]) + Math.abs(trans_vec[1]) + Math.abs(trans_vec[2]);
                                if (dist < min_dist) {
                                    min_dist = dist;
                                    min_trans_vec = trans_vec;
                                    flipped = true;
                                }
                            }
                        }
                    }
                }
                // if we have found a match, save it
                if (min_trans_vec !== null) {
                    // round the coords
                    min_trans_vec = min_trans_vec.map(coord =>  Math.round(coord * precision) / precision) as Txyz;
                    // make a string as key
                    const min_trans_vec_str: string = JSON.stringify(min_trans_vec);
                    // save the count for this vec
                    if (flipped) {
                        if (!flipped_trans_vecs_counts.has(min_trans_vec_str)) {
                            flipped_trans_vecs_counts.set(min_trans_vec_str, 1);
                        } else {
                            const count: number = flipped_trans_vecs_counts.get(min_trans_vec_str);
                            flipped_trans_vecs_counts.set(min_trans_vec_str, count + 1);
                        }
                    } else {
                        if (!trans_vecs_counts.has(min_trans_vec_str)) {
                            trans_vecs_counts.set(min_trans_vec_str, 1);
                        } else {
                            const count: number = trans_vecs_counts.get(min_trans_vec_str);
                            trans_vecs_counts.set(min_trans_vec_str, count + 1);
                        }
                    }
                }
            }
            flipped_trans_vecs_counts.forEach((count: number, min_trans_vec_str: string) => {
                if (count > 1) {
                    const comments: string[] = [
                        'It looks like there are certain polygon objects that have the correct shape but that are reversed.',
                        count + ' polygons have been found that seem like they should be reversed.'
                    ];
                    if (min_trans_vec_str !== '[0,0,0]') {
                        comments.concat([
                            'They also seem to be in the wrong location.',
                            'It seesm like they should be reversed and translated by the following vector:',
                            min_trans_vec_str + '.'
                        ]);
                    }
                    trans_comments.push(comments.join(' '));
                } else if (count === 1) {
                    const comments: string[] = [
                        'It looks like there is a polygon object that has the correct shape but that is reversed.'
                    ];
                    if (min_trans_vec_str !== '[0,0,0]') {
                        comments.concat([
                            'It also seems to be in the wrong location.',
                            'It seesm like it should be reversed and translated by the following vector:',
                            min_trans_vec_str + '.'
                        ]);
                    }
                    trans_comments.push(comments.join(' '));
                }
            });
            trans_vecs_counts.forEach((count: number, min_trans_vec_str: string) => {
                if (count > 1) {
                    trans_comments.push([
                        'It looks like there are certain',
                        obj_ent_type_strs.get(obj_ent_type),
                        'objects that have the correct shape but that are in the wrong location.',
                        count, obj_ent_type_strs.get(obj_ent_type),
                        'objects have been found that seem like they should be translated by the following vector:',
                        min_trans_vec_str + '.'
                    ].join(' '));
                } else if (count === 1) {
                    trans_comments.push([
                        'It looks like there is an',
                        obj_ent_type_strs.get(obj_ent_type),
                        'object that has the correct shape but that is in the wrong location.',
                        'It seems like the object should be translated by the following vector:',
                        min_trans_vec_str + '.'
                    ].join(' '));
                }
            });
        }
        // add some feedback
        if (trans_comments.length > 0) {
            result.comment.push('An analysis of the geometry suggests there might be some objects that are translated.');
            result.comment.push(trans_comments);
        }
    }
    // ============================================================================
    // Private methods for fprinting
    // ============================================================================
    /**
     * Get a fprint of all geometric entities of a certain type in the model.
     * This returns a fprint string, and the entity indexes
     * The two arrays are in the same order
     */
    private getEntsFprint(ent_type: EEntType, attrib_names: Map<EEntType, string[]>): [string[], number[]] {
        const fprints: string[]  = [];
        const ents_i: number[] = this.geom.query.getEnts(ent_type, false);
        for (const ent_i of ents_i) {
            fprints.push(this.getEntFprint(ent_type, ent_i, attrib_names));
        }
        // return the result, do not sort
        return [fprints, ents_i];
    }
    /**
     * Get a fprint of one geometric entity: point, polyline, polygon
     * Returns a string, something like '#a@b@c#x@y@z'
     */
    private getEntFprint(from_ent_type: EEntType, index: number, attrib_names_map: Map<EEntType, string[]>): string {
        const fprints = [];
        // define topo entities for each obj (starts with posis and ends with objs)
        const topo_ent_types_map: Map<EEntType, EEntType[]> = new Map();
        topo_ent_types_map.set(EEntType.POINT, [EEntType.POSI, EEntType.VERT, EEntType.POINT]);
        topo_ent_types_map.set(EEntType.PLINE, [EEntType.POSI, EEntType.VERT, EEntType.EDGE, EEntType.WIRE, EEntType.PLINE]);
        topo_ent_types_map.set(EEntType.PGON, [EEntType.POSI, EEntType.VERT, EEntType.EDGE, EEntType.WIRE, EEntType.FACE, EEntType.PGON]);
        // create fprints of topological entities
        for (const topo_ent_type of topo_ent_types_map.get(from_ent_type)) {
            const topo_fprints: string[] = [];
            // get the attribute names array that will be used for matching
            const attrib_names: string[] = attrib_names_map.get(topo_ent_type);
            if (attrib_names !== undefined) {
                // sort the attrib names
                attrib_names.sort();
                const sub_ents_i: number[] = this.geom.query.navAnyToAny(from_ent_type, topo_ent_type, index);
                // for each attrib, make a finderprint
                for (const attrib_name of attrib_names) {
                    for (const sub_ent_i of sub_ents_i) {
                        const attrib_value: TAttribDataTypes = this.attribs.query.getAttribVal(topo_ent_type, attrib_name, sub_ent_i);
                        if (attrib_value !== null && attrib_value !== undefined) {
                            topo_fprints.push(this.getAttribValFprint(attrib_value));
                        }
                    }
                }
                // the order is significant, so we do not sort
                // any differences in order (e.g. holes) will already be dealt with by normalization
                fprints.push(topo_fprints.join('@'));
            }
        }
        // return the final fprint string for the object
        // no need to sort, the order is predefined
        return fprints.join('#');
    }
    /**
     * Get one fprint for all collections
     */
    private getCollFprints(idx_maps: Map<EEntType, Map<number, number>>, attrib_names: string[]): string[] {
        const fprints: string[]  = [];
        // create the fprints for each collection
        const colls_i: number[] = this.geom.query.getEnts(EEntType.COLL, false);
        for (const coll_i of colls_i) {
            fprints.push(this.getCollFprint(coll_i, idx_maps, attrib_names));
        }
        // if there are no values for a certain entity type, e.g. no coll, then return []
        if (fprints.length === 0) { return []; }
        // before we sort, we need to save the original order, which will be required for the parent collection index
        const fprint_to_old_i_map: Map<string, number> = new Map();
        for (let i = 0; i < fprints.length; i++) {
            fprint_to_old_i_map.set(fprints[i], i);
        }
        // the fprints of the collections are sorted
        fprints.sort();
        // now we need to create a map from old index to new index
        const old_i_to_new_i_map: Map<number, number> = new Map();
        for (let i = 0; i < fprints.length; i++) {
            const old_i: number = fprint_to_old_i_map.get(fprints[i]);
            old_i_to_new_i_map.set(old_i, i);
        }
        // for each collection, we now add the parent id, using the new index
        for (let i = 0; i < fprints.length; i++) {
            const coll_old_i: number = fprint_to_old_i_map.get(fprints[i]);
            const coll_parent_old_i: number = this.geom.query.getCollParent(coll_old_i);
            let parent_str = '';
            if (coll_parent_old_i === -1) {
                parent_str = '.^';
            } else {
                const coll_parent_new_i: number = old_i_to_new_i_map.get(coll_parent_old_i);
                parent_str = coll_parent_new_i + '^';
            }
            fprints[i] = parent_str + fprints[i];
        }
        // return the result, an array of fprints
        return fprints;
    }
    /**
     * Get a fprint of one collection
     * Returns a string, something like 'a@b@c#[1,2,3]#[3,5,7]#[2,5,8]'
     */
    private getCollFprint(coll_i: number, com_idx_maps: Map<EEntType, Map<number, number>>, attrib_names: string[]): string {
        const to_ent_types: EEntType[] = [EEntType.POINT, EEntType.PLINE, EEntType.PGON];
        const fprints: string[] = [];
        const attribs_vals: string[] = [];
        // for each attrib, make a finderprint of the attrib value
        if (attrib_names !== undefined) {
            for (const attrib_name of attrib_names) {
                const attrib_value: TAttribDataTypes = this.attribs.query.getAttribVal(EEntType.COLL, attrib_name, coll_i);
                if (attrib_value !== null && attrib_value !== undefined) {
                    attribs_vals.push(this.getAttribValFprint(attrib_value));
                }
            }
            fprints.push(attribs_vals.join('@'));
        }
        // get all the entities in this collection
        // mapping entity numbers means that we map to the equivalent entity numbers in the other model
        // we do this to ensure that, when comparing models, the entity numbers will match
        for (const to_ent_type of to_ent_types) {
            // get the map from ent_i to com_idx
            const com_idx_map: Map<number, number> = com_idx_maps.get(to_ent_type);
            // the the common indexes of the entities
            const ents_i: number[] = this.geom.query.navAnyToAny(EEntType.COLL, to_ent_type, coll_i);
            const com_idxs: number[] = [];
            for (const ent_i of ents_i) {
                const com_idx: number = com_idx_map.get(ent_i);
                com_idxs.push(com_idx);
            }
            // sort so that they are in standard order
            com_idxs.sort();
            // create a string
            fprints.push(JSON.stringify(com_idxs));
        }
        // return the final fprint string for the collection
        // no need to sort, the order is predefined
        return fprints.join('#');
    }
    /**
     * Get a fprint of an attribute value
     */
    private getAttribValFprint(value: any): string {
        const precision = 1e2;
        if (value === null) { return '.'; }
        if (value === undefined) { return '.'; }
        if (typeof value === 'number') { return String(Math.round(value * precision) / precision); }
        if (typeof value === 'string') { return value; }
        if (typeof value === 'boolean') { return String(value); }
        if (Array.isArray(value)) {
            const fprints = [];
            for (const item of value) {
                const attrib_value: string = this.getAttribValFprint(item);
                fprints.push(attrib_value);
            }
            return fprints.join(',');
        }
        if (typeof value === 'object') {
            let fprint = '';
            const prop_names: string[] = Object.getOwnPropertyNames(value);
            prop_names.sort();
            for (const prop_name of prop_names) {
                const attrib_value: string = this.getAttribValFprint(value[prop_name]);
                fprint += prop_name + '=' + attrib_value;
            }
            return fprint;
        }
        throw new Error('Attribute value not recognised.');
    }
}
