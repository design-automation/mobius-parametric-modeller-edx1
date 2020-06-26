import { IAttribsData, IAttribData, TAttribDataTypes, EEntType,
    IAttribsMaps, EEntTypeStr, TModelAttribValuesArr, IGeomPack, IGeomSets } from './common';
import { GIAttribMap } from './GIAttribMap';
import { GIModelData } from './GIModelData';
import * as lodash from 'lodash';


/**
 * Class for attributes.
 */
export class GIAttribsIO {
    private _modeldata: GIModelData;
    private _attribs_maps: IAttribsMaps;
   /**
     * Creates an object to store the attribute data.
     * @param modeldata The JSON data
     */
    constructor(modeldata: GIModelData, attribs_maps: IAttribsMaps) {
        this._modeldata = modeldata;
        this._attribs_maps = attribs_maps;
    }
    /**
     * Adds data to this model from another model.
     * The existing data in the model is not deleted.
     * @param model_data Attribute data from the other model.
     */
    public merge(attribs_maps: IAttribsMaps): void {
        if (attribs_maps.ps !== undefined) { this._mergeAttribs(attribs_maps, EEntType.POSI); }
        if (attribs_maps._v !== undefined) { this._mergeAttribs(attribs_maps, EEntType.VERT); }
        if (attribs_maps._e !== undefined) { this._mergeAttribs(attribs_maps, EEntType.EDGE); }
        if (attribs_maps._w !== undefined) { this._mergeAttribs(attribs_maps, EEntType.WIRE); }
        if (attribs_maps._f !== undefined) { this._mergeAttribs(attribs_maps, EEntType.FACE); }
        if (attribs_maps.pt !== undefined) { this._mergeAttribs(attribs_maps, EEntType.POINT); }
        if (attribs_maps.pl !== undefined) { this._mergeAttribs(attribs_maps, EEntType.PLINE); }
        if (attribs_maps.pg !== undefined) { this._mergeAttribs(attribs_maps, EEntType.PGON); }
        if (attribs_maps.co !== undefined) { this._mergeAttribs(attribs_maps, EEntType.COLL); }
        if (attribs_maps.mo !== undefined) { this._mergeModelAttribs(attribs_maps); }
    }
    /**
     * Adds data to this model from another model.
     * Assumes this model is empty.
     * @param model_data Attribute data from the other model.
     */
    public dump(attribs_maps: IAttribsMaps): void {
        if (attribs_maps.ps !== undefined) { this._dumpAttribs(attribs_maps, EEntType.POSI); }
        if (attribs_maps._v !== undefined) { this._dumpAttribs(attribs_maps, EEntType.VERT); }
        if (attribs_maps._e !== undefined) { this._dumpAttribs(attribs_maps, EEntType.EDGE); }
        if (attribs_maps._w !== undefined) { this._dumpAttribs(attribs_maps, EEntType.WIRE); }
        if (attribs_maps._f !== undefined) { this._dumpAttribs(attribs_maps, EEntType.FACE); }
        if (attribs_maps.pt !== undefined) { this._dumpAttribs(attribs_maps, EEntType.POINT); }
        if (attribs_maps.pl !== undefined) { this._dumpAttribs(attribs_maps, EEntType.PLINE); }
        if (attribs_maps.pg !== undefined) { this._dumpAttribs(attribs_maps, EEntType.PGON); }
        if (attribs_maps.co !== undefined) { this._dumpAttribs(attribs_maps, EEntType.COLL); }
        if (attribs_maps.mo !== undefined) { this._dumpModelAttribs(attribs_maps); }
    }
    /**
     * Adds selected data to this model from another model.
     * Assumes this model is empty.
     * @param model_data Attribute data from the other model.
     */
    public dumpSelect(attribs_maps: IAttribsMaps, ent_sets: IGeomSets): void {
        if (attribs_maps.ps !== undefined) {
            this._dumpAttribsSelect(attribs_maps, EEntType.POSI, ent_sets.posis_i);
        }
        if (attribs_maps._v !== undefined) {
            this._dumpAttribsSelect(attribs_maps, EEntType.VERT, ent_sets.verts_i);
        }
        if (attribs_maps._e !== undefined) {
            this._dumpAttribsSelect(attribs_maps, EEntType.EDGE, ent_sets.edges_i);
        }
        if (attribs_maps._w !== undefined) {
            this._dumpAttribsSelect(attribs_maps, EEntType.WIRE, ent_sets.wires_i);
        }
        if (attribs_maps._f !== undefined) {
            this._dumpAttribsSelect(attribs_maps, EEntType.FACE, ent_sets.faces_i);
        }
        if (attribs_maps.pt !== undefined) {
            this._dumpAttribsSelect(attribs_maps, EEntType.POINT, ent_sets.points_i);
        }
        if (attribs_maps.pl !== undefined) {
            this._dumpAttribsSelect(attribs_maps, EEntType.PLINE, ent_sets.plines_i);
        }
        if (attribs_maps.pg !== undefined) {
            this._dumpAttribsSelect(attribs_maps, EEntType.PGON, ent_sets.pgons_i);
        }
        if (attribs_maps.co !== undefined) {
            this._dumpAttribsSelect(attribs_maps, EEntType.COLL, ent_sets.colls_i);
        }
        if (attribs_maps.mo !== undefined) { this._dumpModelAttribs(attribs_maps); }
    }
    /**
     * Adds data to this model from another model.
     * The existing data in the model is not deleted.
     * @param model_data Attribute data from the other model.
     */
    public mergeAndPurge(attribs_maps: IAttribsMaps, geom_maps: Map<number, number>[]): void {
        // get the maps
        const [
            posis_map,
            verts_map, edges_map, wires_map, faces_map,
            points_map, plines_map, pgons_map, colls_map
        ]: Map<number, number>[] = geom_maps;
        // add the attribute data
        if (attribs_maps.ps !== undefined) { this._mergeAndPurgeAttribs(attribs_maps, EEntType.POSI, posis_map); }
        if (attribs_maps._v !== undefined) { this._mergeAndPurgeAttribs(attribs_maps, EEntType.VERT, verts_map); }
        if (attribs_maps._e !== undefined) { this._mergeAndPurgeAttribs(attribs_maps, EEntType.EDGE, edges_map); }
        if (attribs_maps._w !== undefined) { this._mergeAndPurgeAttribs(attribs_maps, EEntType.WIRE, wires_map); }
        if (attribs_maps._f !== undefined) { this._mergeAndPurgeAttribs(attribs_maps, EEntType.FACE, faces_map); }
        if (attribs_maps.pt !== undefined) { this._mergeAndPurgeAttribs(attribs_maps, EEntType.POINT, points_map); }
        if (attribs_maps.pl !== undefined) { this._mergeAndPurgeAttribs(attribs_maps, EEntType.PLINE, plines_map); }
        if (attribs_maps.pg !== undefined) { this._mergeAndPurgeAttribs(attribs_maps, EEntType.PGON, pgons_map); }
        if (attribs_maps.co !== undefined) { this._mergeAndPurgeAttribs(attribs_maps, EEntType.COLL, colls_map); }
        if (attribs_maps.mo !== undefined) { this._mergeModelAttribs(attribs_maps); }
    }
    /**
     * Adds data to this model from JSON data.
     * The existing data in the model is deleted.
     * @param model_data The JSON data for the model.
     */
    public setData(attribs_data: IAttribsData): void {
        // add the attribute data
        if (attribs_data.posis !== undefined) {
            this._setAttribs(attribs_data.posis, EEntType.POSI);
        }
        if (attribs_data.verts !== undefined) {
            this._setAttribs(attribs_data.verts, EEntType.VERT);
        }
        if (attribs_data.edges !== undefined) {
            this._setAttribs(attribs_data.edges, EEntType.EDGE);
        }
        if (attribs_data.wires !== undefined) {
            this._setAttribs(attribs_data.wires, EEntType.WIRE);
        }
        if (attribs_data.faces !== undefined) {
            this._setAttribs(attribs_data.faces, EEntType.FACE);
        }
        if (attribs_data.points !== undefined) {
            this._setAttribs(attribs_data.points, EEntType.POINT);
        }
        if (attribs_data.plines !== undefined) {
            this._setAttribs(attribs_data.plines, EEntType.PLINE);
        }
        if (attribs_data.pgons !== undefined) {
            this._setAttribs(attribs_data.pgons, EEntType.PGON);
        }
        if (attribs_data.colls !== undefined) {
            this._setAttribs(attribs_data.colls, EEntType.COLL);
        }
        if (attribs_data.model !== undefined) {
            this._setModelAttribs(attribs_data.model);
        }
    }
    /**
     * Returns the JSON data for this model.
     */
    public getData(): IAttribsData {
        const data: IAttribsData = {
            posis: Array.from(this._attribs_maps.ps.values()).map(attrib => attrib.getData()),
            verts: Array.from(this._attribs_maps._v.values()).map(attrib => attrib.getData()),
            edges: Array.from(this._attribs_maps._e.values()).map(attrib => attrib.getData()),
            wires: Array.from(this._attribs_maps._w.values()).map(attrib => attrib.getData()),
            faces: Array.from(this._attribs_maps._f.values()).map(attrib => attrib.getData()),
            points: Array.from(this._attribs_maps.pt.values()).map(attrib => attrib.getData()),
            plines: Array.from(this._attribs_maps.pl.values()).map(attrib => attrib.getData()),
            pgons: Array.from(this._attribs_maps.pg.values()).map(attrib => attrib.getData()),
            colls: Array.from(this._attribs_maps.co.values()).map(attrib => attrib.getData()),
            model: Array.from(this._attribs_maps.mo)
        };
        return data;
    }
    // ============================================================================
    // Private methods
    // ============================================================================
    /**
     * From another model
     * The existing attributes are not deleted
     * Deep copy of attrib values
     * @param attribs_maps
     */
    private _mergeModelAttribs(attribs_maps: IAttribsMaps): void {
        const other_attribs: Map<string, TAttribDataTypes> = attribs_maps[EEntTypeStr[ EEntType.MOD ]];
        const this_attribs: Map<string, TAttribDataTypes> = this._attribs_maps[EEntTypeStr[ EEntType.MOD ]];
        // TODO this is a hack to fix an error
        if (!(other_attribs instanceof Map)) { return; }
        other_attribs.forEach( (val, key) => {
            this_attribs.set(key, lodash.cloneDeep(val));
        });
    }
    /**
     * From another model
     * The existing attributes are not deleted
     * Deep copy of attrib values
     * @param attribs_maps
     */
    private _dumpModelAttribs(attribs_maps: IAttribsMaps) {
        this._attribs_maps[EEntTypeStr[ EEntType.MOD ]] = lodash.cloneDeep(attribs_maps[EEntTypeStr[ EEntType.MOD ]]);
    }
    /**
     * From JSON data
     * Existing attributes are deleted
     * @param new_attribs_data
     */
    private _setModelAttribs(new_attribs_data: TModelAttribValuesArr) {
        this._attribs_maps[EEntTypeStr[ EEntType.MOD ]] = new Map(new_attribs_data);
    }
    /**
     * merge attributes from another model into this model.
     * The existing attributes are not deleted
     * @param attribs_maps
     */
    private _mergeAttribs(attribs_maps: IAttribsMaps, ent_type: EEntType) {
        const other_attribs: Map<string, GIAttribMap> = attribs_maps[EEntTypeStr[ ent_type ]];
        const this_attribs: Map<string, GIAttribMap> = this._attribs_maps[EEntTypeStr[ ent_type ]];
        // const num_ents: number = this._model.modeldata.geom.query.numEnts(ent_type, true); // incude deleted ents
        other_attribs.forEach( other_attrib => {
            if (other_attrib.numEnts() > 0) {
                // get the name
                const name: string = other_attrib.getName();
                // get or create the attrib
                let this_attrib: GIAttribMap;
                if (!this_attribs.has(name)) {
                    this_attrib = new GIAttribMap(this._modeldata, name, ent_type, other_attrib.getDataType());
                    this_attribs.set(name, this_attrib );
                } else {
                    this_attrib = this_attribs.get(name);
                    if (this_attrib.getDataType() !== other_attrib.getDataType()) {
                        throw new Error('Merge Error: Cannot merge attributes with different data types.');
                    }
                }
                // merge
                this_attrib.merge(other_attrib);
            }
        });
    }
    /**
     * merge attributes from another model into this model.
     * Assumes that the existing model is empty
     * @param attribs_maps
     */
    private _dumpAttribs(attribs_maps: IAttribsMaps, ent_type: EEntType) {
        const other_attribs: Map<string, GIAttribMap> = attribs_maps[EEntTypeStr[ ent_type ]];
        const this_attribs: Map<string, GIAttribMap> = this._attribs_maps[EEntTypeStr[ ent_type ]];
        other_attribs.forEach( other_attrib => {
            if (other_attrib.numEnts() > 0) {
                const name: string = other_attrib.getName();
                const this_attrib = new GIAttribMap(this._modeldata, name, ent_type, other_attrib.getDataType());
                this_attribs.set(name, this_attrib );
                this_attrib.dump(other_attrib);
            }
        });
    }
    /**
     * Dumps selected attributes from another model into this model.
     * Assumes that the existing model is empty
     * @param attribs_maps
     */
    private _dumpAttribsSelect(attribs_maps: IAttribsMaps, ent_type: EEntType, selected: Set<number>) {
        const other_attribs: Map<string, GIAttribMap> = attribs_maps[EEntTypeStr[ ent_type ]];
        const this_attribs: Map<string, GIAttribMap> = this._attribs_maps[EEntTypeStr[ ent_type ]];
        other_attribs.forEach( other_attrib => {
            if (other_attrib.numEnts() > 0) {
                const name: string = other_attrib.getName();
                const this_attrib = new GIAttribMap(this._modeldata, name, ent_type, other_attrib.getDataType());
                this_attribs.set(name, this_attrib );
                this_attrib.dumpSelect(other_attrib, selected);
            }
        });
    }
    /**
     * merge attributes from another model into this model.
     * The existing attributes are not deleted
     * @param attribs_maps
     */
    private _mergeAndPurgeAttribs(attribs_maps: IAttribsMaps, ent_type: EEntType, geom_map: Map<number, number>) {
        const other_attribs: Map<string, GIAttribMap> = attribs_maps[EEntTypeStr[ ent_type ]];
        const this_attribs: Map<string, GIAttribMap> = this._attribs_maps[EEntTypeStr[ ent_type ]];
        // const num_ents: number = this._model.modeldata.geom.query.numEnts(ent_type, true); // incude deleted ents
        other_attribs.forEach( other_attrib => {
            // get the data
            const ents_i_values: [number[], TAttribDataTypes][] = other_attrib.getEntsVals();
            let attrib_has_ents = false;
            for (const ents_i_value of ents_i_values) {
                // for merge and purge, IDs need to be shifted
                ents_i_value[0] = ents_i_value[0].map( ent_i => geom_map.get(ent_i) ); // shift
                attrib_has_ents = ents_i_value[0].length > 0;
            }
            if (attrib_has_ents) {
                // get the name
                const name: string = other_attrib.getName();
                // get or create the attrib
                if (!this_attribs.has(name)) {
                    this_attribs.set(name, new GIAttribMap(this._modeldata, name, ent_type, other_attrib.getDataType()) );
                }
                const to_attrib: GIAttribMap = this_attribs.get(name);
                // set the data
                to_attrib.mergeEntsVals(ents_i_values);
            }
        });
    }
    /**
     * From JSON data
     * Existing attributes are deleted
     * @param new_attribs_data
     */
    private _setAttribs(new_attribs_data: IAttribData[], ent_type: EEntType) {
        const this_attribs: Map<string, GIAttribMap> = new Map();
        new_attribs_data.forEach( new_attrib_data => {
            const this_attrib: GIAttribMap = new GIAttribMap(this._modeldata, new_attrib_data.name, ent_type, new_attrib_data.data_type );
            this_attrib.setData(new_attrib_data);
            this_attribs.set(new_attrib_data.name, this_attrib);
        });
        this._attribs_maps[EEntTypeStr[ ent_type ]] = this_attribs;
    }
}
