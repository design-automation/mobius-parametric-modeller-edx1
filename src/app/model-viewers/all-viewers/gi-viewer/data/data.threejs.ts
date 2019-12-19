import * as THREE from 'three';
import { SIModel } from '@assets/libs/sim/SIModel';
import { ETjsMaterialType, ITjsMaterial, ITjsData, ITjsGeomData, ITjsAttribData } from '@libs/sim/common';
import { EEntType } from '@libs/sim/common';
import { DataService } from '@services';
import { ISettings } from './data.threejsSettings';
import { DataThreejsLookAt } from './data.threejsLookAt';

/**
 * ThreejsScene Add
 */
export class DataThreejs extends DataThreejsLookAt {
    /**
     * Constructs a new data subscriber.
     */
    constructor(settings: ISettings, dataService: DataService) {
        super(settings, dataService);
        // background
        if (this.settings.background.show) {
            this._loadBackground(this.settings.background.background_set);
        } else {
            this.scene.background = new THREE.Color(this.settings.colors.viewer_bg);
        }
        // add grid and lights
        this.addGrid();
        this.addAxes();
        if (this.settings.ambient_light.show) {
            this._addAmbientLight();
        }
        if (this.settings.hemisphere_light.show) {
            this._addHemisphereLight();
        }
        if (this.settings.directional_light.show) {
            this._addDirectionalLight();
        }
    }

    /**
     *
     * @param object
     * @param property
     */
    public static disposeObjectProperty(object: THREE.Object3D, property: string): void {
        if (object.hasOwnProperty(property)) {
            if (object[property].constructor === [].constructor) {
                object[property].forEach(prop => prop.dispose());
            } else {
                object[property].dispose();
            }
        }
    }
    /**
     *
     * @param model
     * @param container
     */
    public addGeometry(model: SIModel, container): void {
        if (this.settings.background.show) {
            this._loadBackground(this.settings.background.background_set);
        } else {
            this.scene.background = new THREE.Color(this.settings.colors.viewer_bg);
        }
        while (this.scene.children.length > 0) {
            DataThreejs.disposeObjectProperty(this.scene.children[0], 'geometry');
            // DataThreejs.disposeObjectProperty(this.scene.children[0], 'material');
            DataThreejs.disposeObjectProperty(this.scene.children[0], 'texture');
            this.scene.remove(this.scene.children[0]);
        }
        this.selected_geoms.clear();
        this.selected_positions.clear();
        this.selected_vertex.clear();
        this.selected_face_edges.clear();
        this.selected_face_wires.clear();
        this.scene_objs_selected.clear();
        this.scene_objs = [];

        document.querySelectorAll('[id^=textLabel_]').forEach(value => {
            container.removeChild(value);
        });
        this.ObjLabelMap.clear();
        this.textLabels.clear();

        this.addGrid();
        this.addAxes();

        // Add geometry
        // const threejs_data: ITjsData = model.threejs.getTjsData();
        const [geom_data, attrib_data]: [ITjsGeomData, ITjsAttribData] = model.threejs.getTjsData();

        // ---------------------
        // create attribute buffers that will be shared by all geometry buffers
        const coords_buff_attrib = new THREE.BufferAttribute( new Float32Array(attrib_data.coords_flat), 3 );
        const colors_buff_attrib = new THREE.BufferAttribute( new Float32Array(attrib_data.colors_flat), 3 );
        const normals_buff_attrib = attrib_data.normals_flat === null ?
            null : new THREE.BufferAttribute( new Float32Array(attrib_data.normals_flat), 3 );

        // make the geometry buffers from the attribute buffers
        // triangles
        const tris_geom_buff: THREE.BufferGeometry = this._createTrisBuffGeom(
            geom_data.tris_verts_idx_flat, coords_buff_attrib, colors_buff_attrib, normals_buff_attrib, geom_data.material_groups);
        // lines
        const lines_geom_buff: THREE.BufferGeometry = this._createLinesBuffGeom(
            geom_data.edges_verts_idx_flat, coords_buff_attrib, colors_buff_attrib);
        // points
        const points_geom_buff: THREE.BufferGeometry = this._createPointsBuffGeom(
            geom_data.points_verts_idx_flat, coords_buff_attrib, colors_buff_attrib);
        // positions
        const posis_geom_buff: THREE.BufferGeometry = this._createPosisBuffGeom(
            attrib_data.posis_idx_to_i, coords_buff_attrib);

        // return an object containing all the data
        const threejs_data: ITjsData = {
            num_posis: attrib_data.posis_idx_to_i.length,
            num_points: geom_data.points_verts_idx_flat.length,
            num_lines: geom_data.edges_verts_idx_flat.length / 2,
            num_tris: geom_data.tris_verts_idx_flat.length / 3,

            tris_geom_buff: tris_geom_buff,
            lines_geom_buff: lines_geom_buff,
            points_geom_buff: points_geom_buff,
            posis_geom_buff: posis_geom_buff,

            posis_idx_to_i: attrib_data.posis_idx_to_i,
            verts_idx_to_i: attrib_data.verts_idx_to_i,
            points_select_idx_to_i: geom_data.points_select_idx_to_i,
            edges_select_idx_to_i: geom_data.edges_select_idx_to_i,
            tris_select_idx_to_i: geom_data.tris_select_idx_to_i,

            materials: geom_data.materials
        };
        // ---------------------

        this.tris_select_idx_to_i = threejs_data.tris_select_idx_to_i;
        this.edges_select_idx_to_i = threejs_data.edges_select_idx_to_i;
        this.points_select_idx_to_i = threejs_data.points_select_idx_to_i;
        this.posis_idx_to_i = threejs_data.posis_idx_to_i;
        this.verts_idx_to_i = threejs_data.verts_idx_to_i;

        // const material_groups = threejs_data.material_groups;
        const materials = threejs_data.materials;

        // update threejs numbers
        this.threejs_nums[0] = threejs_data.num_points;
        this.threejs_nums[1] = threejs_data.num_lines;
        this.threejs_nums[2] = threejs_data.num_tris;
        // triangles
        const tris_mat_arr: THREE.Material[] = this._createTrisMatArr(materials);
        this._addTris(threejs_data.tris_geom_buff, tris_mat_arr);
        // lines
        this._addLines(threejs_data.lines_geom_buff);
        // points
        this._addPoints(threejs_data.points_geom_buff, [255, 255, 255], this.settings.positions.size + 1);
        // positions
        this._addPosis(threejs_data.posis_geom_buff, this.settings.colors.position, this.settings.positions.size);
        const position_size = this.settings.positions.size;
        this.raycaster.params.Points.threshold = position_size > 1 ? position_size / 3 : position_size / 4;
        // ground
        const ground = this.settings.ground;
        if (ground.show) {
            const planeGeometry = new THREE.PlaneBufferGeometry(ground.width, ground.length, 32, 32);
            const planeMaterial = new THREE.MeshPhongMaterial({
                color: new THREE.Color(parseInt(ground.color.replace('#', '0x'), 16)),
                shininess: ground.shininess,
                side: THREE.DoubleSide
            });
            this.groundObj = new THREE.Mesh(planeGeometry, planeMaterial);
            this.groundObj.position.setZ(ground.height);
            this.groundObj.receiveShadow = true;
            this.scene.add(this.groundObj);
        }

        this._all_objs_sphere = this._getAllObjsSphere();

        if (this.settings.ambient_light.show) {
            this._addAmbientLight();
        }
        if (this.settings.hemisphere_light.show) {
            this._addHemisphereLight();
        }
        if (this.settings.directional_light.show) {
            this._addDirectionalLight();
        }


        const center = new THREE.Vector3(0, 0, 0); // allObjs.center;
        this.axes_pos.x = center.x;
        this.axes_pos.y = center.y;
        let grid_pos = this.settings.grid.pos;
        if (!grid_pos) {
            grid_pos = new THREE.Vector3(0, 0, 0);
        }
        this.grid.position.set(grid_pos.x, grid_pos.y, 0);

        if (threejs_data.num_posis !== 0) {
            if (this.dataService.newFlowchart) {
                this.dataService.newFlowchart = false;
                this.origin = new THREE.Vector3(center.x, center.y, 0);
                this.settings.camera.target = this.origin ;
                localStorage.setItem('mpm_settings', JSON.stringify(this.settings));
                this.axesHelper.position.set(center.x, center.y, 0);
            } else {
                this.axesHelper.position.set(this.origin.x, this.origin.y, 0);
            }
        }
        setTimeout(() => {
            let old = document.getElementById('hud');
            if (old) {
                container.removeChild(old);
            }
            if (!this.model.attribs.query.hasAttrib(EEntType.MOD, 'hud')) { return; }
            const hud = this.model.attribs.query.getModelAttribVal('hud') as string;
            const element = this._createHud(hud).element;
            container.appendChild(element);
            old = null;
        }, 0);
    }
    /**
     *
     * @param scale
     * @param azimuth
     * @param altitude
     */
    public getDLPosition(scale = null, azimuth = null, altitude = null): void {
        if (!scale && scale !== 0) {
            scale = this.directional_light_settings.distance;
        }
        if (!azimuth && azimuth !== 0) {
            azimuth = this.directional_light_settings.azimuth;
        }
        if (!altitude && altitude !== 0) {
            altitude = this.directional_light_settings.altitude;
        }
        if (this.model && this.model.attribs && this.model.attribs.query
            && this.model.attribs.query.hasModelAttrib('directional_light')) {
                const model_light_settings: any = this.model.attribs.query.getModelAttribVal('directional_light');
                if (model_light_settings.constructor === {}.constructor) {
                    if (model_light_settings.hasOwnProperty('altitude')) {
                        altitude = model_light_settings.altitude;
                    }
                    if (model_light_settings.hasOwnProperty('azimuth')) {
                        azimuth = model_light_settings.azimuth;
                    }
                }
            }

        let posX = Math.cos(altitude * Math.PI * 2 / 360) * Math.cos(azimuth * Math.PI * 2 / 360) * scale,
            posY = Math.cos(altitude * Math.PI * 2 / 360) * Math.sin(azimuth * Math.PI * 2 / 360) * scale,
            posZ = Math.sin(altitude * Math.PI * 2 / 360) * scale;

        if (this._all_objs_sphere) {
            posX += this._all_objs_sphere.center.x;
            posY += this._all_objs_sphere.center.y;
            posZ += this._all_objs_sphere.center.z;
        }
        this.directional_light.position.set(posX, posY, posZ);
    }

    /**
     * Add axes
     * @param size
     */
    public addAxes(size: number = this.settings.axes.size) {
        let i = 0;
        const length = this.scene.children.length;
        if (length !== 0) {
            for (; i < length; i++) {
                if (this.scene.children[i]) {
                    if (this.scene.children[i].name === 'AxesHelper') {
                        this.scene.children[i]['dispose']();
                        this.scene.remove(this.scene.children[i]);
                    }
                }
            }
        }
        this.axesHelper = new THREE.AxesHelper(size);
        this.axesHelper.visible = this.settings.axes.show;
        if (this.axesHelper.visible) {
            this.axesHelper.name = 'AxesHelper';
            this.axesHelper.position.set(this.axes_pos.x, this.axes_pos.y, 0);
            this.scene.add(this.axesHelper);
        }
        // this.axesHelper.position.set(0, 0, 0);
    }
    /**
     * Draws a grid on the XY plane.
     * @param size
     */
    public addGrid(size: number = this.settings.grid.size) {
        let i = 0;
        const length = this.scene.children.length;
        for (; i < length; i++) {
            if (this.scene.children[i]) {
                if (this.scene.children[i].name === 'GridHelper') {
                    this.scene.children[i]['dispose']();
                    this.scene.remove(this.scene.children[i]);
                }
            }
        }
        this.grid = new THREE.GridHelper(size, size / 10);
        this.grid.visible = this.settings.grid.show;
        // todo: change grid -> grid_value
        if (this.grid.visible) {
            this.grid.name = 'GridHelper';
            const vector = new THREE.Vector3(0, 1, 0);
            this.grid.lookAt(vector);
            let pos = this.settings.grid.pos;
            if (!pos) {
                pos = new THREE.Vector3();
            }
            this.grid.position.set(pos.x, pos.y, 0);
            this.scene.add(this.grid);
        }
    }
    /**
     *
     */
    public getGridPos() {
        if (this._all_objs_sphere) {
            const grd_pos = new THREE.Vector3(this._all_objs_sphere.center.x, this._all_objs_sphere.center.y, 0);
            this.grid.position.set(grd_pos.x, grd_pos.y, 0);
            return grd_pos;
        }
        const grid_pos = new THREE.Vector3(0, 0, 0);
        this.grid.position.set(0, 0, 0);
        return grid_pos;
    }

    // ============================================================================
    // ============================================================================
    // Private methods
    // ============================================================================
    // ============================================================================
    /**
     * Create the buffer for threejs triangles
     */
    private _createTrisBuffGeom(
            tris_i: number[],
            coords_buff_attrib: THREE.BufferAttribute,
            colors_buff_attrib: THREE.BufferAttribute,
            normals_buff_attrib: THREE.BufferAttribute,
            material_groups): THREE.BufferGeometry {
        const tris_geom_buff = new THREE.BufferGeometry();
        tris_geom_buff.setIndex( tris_i );
        tris_geom_buff.setAttribute('position', coords_buff_attrib );
        tris_geom_buff.setAttribute('color', colors_buff_attrib );
        if (normals_buff_attrib !== null) { tris_geom_buff.setAttribute('normal', normals_buff_attrib ); }
        tris_geom_buff.clearGroups();
        material_groups.forEach(element => {
            tris_geom_buff.addGroup(element[0], element[1], element[2]);
        });
        return tris_geom_buff;
    }
    /**
     * Create the buff geom for threejs lines
     */
    private _createLinesBuffGeom(
            lines_i: number[],
            coords_buff_attrib: THREE.BufferAttribute,
            colors_buff_attrib: THREE.BufferAttribute): THREE.BufferGeometry {
        const lines_buff_geom = new THREE.BufferGeometry();
        lines_buff_geom.setIndex( lines_i );
        lines_buff_geom.setAttribute('position', coords_buff_attrib );
        lines_buff_geom.setAttribute('color', colors_buff_attrib );
        return lines_buff_geom;
    }
    /**
     * Create the points buffer geom for threejs points
     */
    private _createPointsBuffGeom(
            points_i: number[],
            coords_buff_attrib: THREE.BufferAttribute,
            colors_buff_attrib: THREE.BufferAttribute): THREE.BufferGeometry {
        const points_buff_geom = new THREE.BufferGeometry();
        points_buff_geom.setIndex( points_i );
        points_buff_geom.setAttribute('position', coords_buff_attrib );
        points_buff_geom.setAttribute('color', colors_buff_attrib );
        return points_buff_geom;
    }
    /**
     * Create the geom buffer for threejs positions
     */
    private _createPosisBuffGeom(
            points_i: number[],
            coords_buff_attrib: THREE.BufferAttribute): THREE.BufferGeometry {
        const posis_geom_buff = new THREE.BufferGeometry();
        posis_geom_buff.setIndex( points_i );
        posis_geom_buff.setAttribute('position', coords_buff_attrib );
        return posis_geom_buff;
    }
    /**
     *
     * @param text
     */
    private _createHud(text: string) {
        const div = document.createElement('div');
        div.id = `hud`;
        div.style.position = 'absolute';
        div.style.background = 'rgba(255, 255, 255, 0.3)';
        div.style.padding = '5px';
        div.innerHTML = text;
        div.style.top = '40px';
        div.style.left = '5px';
        div.style.maxWidth = '200px';
        div.style.whiteSpace = 'pre-wrap';
        div.style.fontSize = '14px';
        return {
            element: div
        };
    }/**
     *
     * @param background_set
     */
    private _loadBackground(background_set: number) {
        const path = 'assets/img/background/bg' + background_set + '/';
        const format = '.jpg';
        const urls = [
            path + 'px' + format, path + 'nx' + format,
            path + 'py' + format, path + 'ny' + format,
            path + 'pz' + format, path + 'nz' + format
        ];
        const background = new THREE.CubeTextureLoader().load( urls );

        background.format = THREE.RGBFormat;
        this.scene.background = background;
        // this._renderer.render(this._scene, this._camera);
    }

    /**
     * Create ambient light
     */
    private _addAmbientLight() {
        const color = new THREE.Color(parseInt(this.settings.ambient_light.color.replace('#', '0x'), 16));
        const intensity = this.settings.ambient_light.intensity;
        this.ambient_light = new THREE.AmbientLight(color, intensity); // soft white light
        this.ambient_light.castShadow = false;
        this.scene.add(this.ambient_light);
    }

    /**
     * Create hemisphere light
     */
    private _addHemisphereLight() {
        const skyColor = new THREE.Color(parseInt(this.settings.hemisphere_light.skyColor.replace('#', '0x'), 16));
        const groundColor = new THREE.Color(parseInt(this.settings.hemisphere_light.groundColor.replace('#', '0x'), 16));
        const intensity = this.settings.hemisphere_light.intensity;
        this.hemisphere_light = new THREE.HemisphereLight(
            skyColor, // skyColor
            groundColor, // groundColor
            intensity // intensity
        );
        this.scene.add(this.hemisphere_light);
        const helper = new THREE.HemisphereLightHelper(this.hemisphere_light, 10);
        helper.visible = this.settings.hemisphere_light.helper;
        this.scene.add(helper);
    }

    // Create Directional Light
    private _addDirectionalLight(): void {
        this.directional_light_settings = JSON.parse(JSON.stringify(this.settings.directional_light));
        if (this.model
        && this.model.attribs
        && this.model.attribs.query
        && this.model.attribs.query.hasModelAttrib('directional_light')) {
            const model_light_settings: any = this.model.attribs.query.getModelAttribVal('directional_light');
            if (model_light_settings.constructor === {}.constructor) {
                for (const i in model_light_settings) {
                    if (model_light_settings[i]) {
                        this.directional_light_settings[i] = model_light_settings[i];
                    }
                }
            }
        }
        if (this.directional_light_settings.type === 'directional') {
            this.directional_light = new THREE.DirectionalLight(this.directional_light_settings.color,
                this.directional_light_settings.intensity);
        } else {
            this.directional_light = new THREE.PointLight(this.directional_light_settings.color,
                this.directional_light_settings.intensity);
        }
        let distance = 0;
        if (this._all_objs_sphere) {
            distance = Math.round(this._all_objs_sphere.radius * 3);
            // this.directional_light.target = this.sceneObjs[0];
            // this.sceneObjs[0].receiveShadow = true;
        }
        this.directional_light_settings.distance = distance;
        // this.getDLPosition(distance);
        // this.directional_light.shadow.radius = 2
        this.directional_light.castShadow = this.directional_light_settings.shadow;
        this.directional_light.visible = this.directional_light_settings.show;
        // this.directional_light_settings.shadowSize = 2;
        // const shadowMapSize = this.directional_light_settings.shadowSize;
        // this.directional_light.shadow.bias = -0.00001;  // default
        this.directional_light.shadow.mapSize.width = 2048;  // default
        this.directional_light.shadow.mapSize.height = 2048; // default
        // this.directional_light.shadow.camera.visible = true;

        this._setDLDistance(distance);
        this.scene.add(this.directional_light);
    }

    /**
     * Create the material array for threejs triangles
     */
    private _createTrisMatArr(materials: ITjsMaterial[]): THREE.Material[] {
        const tris_mat_arr: THREE.Material[] = [];
        // const colorf = new THREE.Color(parseInt(this.settings.colors.face_f.replace('#', '0x'), 16));
        // const colorb = new THREE.Color(parseInt(this.settings.colors.face_b.replace('#', '0x'), 16));
        const colorf = new THREE.Color(parseInt('0xFFFFFF', 16));
        const colorb = new THREE.Color(parseInt('0xDDDDDD', 16));
        for (let index = 0; index < materials.length; index++) {
            const element = materials[index];
            // if (this.settings.background.show) {
            //     element.envMap = this._scene.background;
            //     element.refractionRatio = 1;
            //     element.envMap.mapping = THREE.CubeRefractionMapping;
            // }
            let mat;
            if (index === 0) {
                delete element.type; element.color = colorf;
                mat = new THREE.MeshPhongMaterial(element);
            } else if (index === 1) {
                delete element.type;
                element.color = colorb;
                mat = new THREE.MeshPhongMaterial(element);
            } else {
                if (element.type === ETjsMaterialType.MeshBasicMaterial) {
                    delete element.type;
                    mat = new THREE.MeshBasicMaterial(element);
                } else if (element.type === ETjsMaterialType.MeshPhongMaterial) {
                    delete element.type;
                    mat = new THREE.MeshPhongMaterial(element);
                } else if (element.type === ETjsMaterialType.MeshPhysicalMaterial) {
                    delete element.type;
                    // if (this.settings.background.show) {
                    //     element.envMap = this._scene.background;
                    //     // element.refractionRatio = 1;
                    //     // element.envMap.mapping = THREE.CubeRefractionMapping;
                    // }
                    mat = new THREE.MeshPhysicalMaterial(element);
                } else if (element.type === ETjsMaterialType.MeshLambertMaterial) {
                    delete element.type;
                    mat = new THREE.MeshLambertMaterial(element);
                } else if (element.type === ETjsMaterialType.MeshStandardMaterial) {
                    delete element.type;
                    mat = new THREE.MeshStandardMaterial(element);
                }
            }
            tris_mat_arr.push(mat);
        }
        return tris_mat_arr;
    }
    /**
     * Add threejs triangles to the scene
     */
    private _addTris(tris_geom_buff: THREE.BufferGeometry, tris_mat_arr: THREE.Material[]): void {
        const mesh = new THREE.Mesh(tris_geom_buff, tris_mat_arr);
        mesh.geometry.computeBoundingSphere();
        mesh.geometry.computeVertexNormals();
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        // show vertex normals
        this.vnh = new THREE.VertexNormalsHelper(mesh, this.settings.normals.size, 0x0000ff);
        this.vnh.visible = this.settings.normals.show;
        this.scene.add(this.vnh);
        this.scene_objs.push(mesh);
        // add mesh to scene
        this.scene.add(mesh);
    }
    /**
     * Add threejs lines to the scene
     */
    private _addLines(lines_buff_geom: THREE.BufferGeometry, size: number = 1): void {
        // // geom.addAttribute( 'color', new THREE.Float32BufferAttribute( colors_flat, 3 ) );
        const mat = new THREE.LineBasicMaterial({
            color: 0x000000,
            linewidth: size,
            linecap: 'round', // ignored by WebGLRenderer
            linejoin: 'round' // ignored by WebGLRenderer
        });
        const line = new THREE.LineSegments(lines_buff_geom, mat);
        this.scene_objs.push(line);
        this.scene.add(line);
    }
    /**
     * Add threejs points to the scene
     */
    private _addPoints(points_buff_geom: THREE.BufferGeometry,
            color: [number, number, number],
            size: number = 1) {
        // geom.computeBoundingSphere();
        const rgb = `rgb(${color.toString()})`;
        const mat = new THREE.PointsMaterial({
            color: new THREE.Color(rgb),
            size: size,
            vertexColors: THREE.VertexColors,
            sizeAttenuation: false
        });
        const point = new THREE.Points(points_buff_geom, mat);
        this.scene_objs.push(point);
        this.scene.add(point);
    }
    /**
     * Add threejs positions to the scene
     */
    private _addPosis(posis_geom_buff: THREE.BufferGeometry, color: string, size: number = 1): void {
        // geom.computeBoundingSphere();
        const mat = new THREE.PointsMaterial({
            color: new THREE.Color(parseInt(color.replace('#', '0x'), 16)),
            size: size,
            sizeAttenuation: false
            // vertexColors: THREE.VertexColors
        });
        const point = new THREE.Points(posis_geom_buff, mat);
        this.scene_objs.push(point);
        this.scene.add(point);
        this.positions.push(point);
        this.positions.map(p => p.visible = this.settings.positions.show);
    }
    /**
     * Get the bounding sphere of all objects
     */
    private _getAllObjsSphere() {
        if (this.scene_objs.length !== 0) {
            const objs = new THREE.Object3D();
            this.scene_objs.map(obj => objs.children.push(obj));
            const boxHelper = new THREE.BoxHelper(objs);
            boxHelper.geometry.computeBoundingSphere();
            const boundingSphere = boxHelper.geometry.boundingSphere;
            return boundingSphere;
        } else {
            return null;
        }
    }
    /**
     *
     * @param size
     */
    private _setDLDistance(size = null): void {
        let scale;
        if (size) {
            scale = size;
        } else {
            scale = 10000;
        }
        if (this.directional_light) {
            let i = 0;
            const length = this.scene.children.length;
            if (length !== 0) {
                for (; i < length; i++) {
                    if (this.scene.children[i]) {
                        if (this.scene.children[i].name === 'DLHelper' || this.scene.children[i].name === 'lightTarget') {
                            this.scene.children[i]['dispose']();
                            this.scene.remove(this.scene.children[i]);
                        }
                    }
                }
            }
            this.directional_light.shadow.camera.near = 0.5;
            this.directional_light.shadow.camera.far = scale * 3;

            this.directional_light.shadow.bias = -0.001;

            let helper;
            if (this.directional_light_settings.type === 'directional') {
                const cam = <THREE.OrthographicCamera> this.directional_light.shadow.camera;
                cam.left = -scale;
                cam.right = scale;
                cam.top = scale;
                cam.bottom = -scale;
                if (this._all_objs_sphere) {
                    const lightTarget = new THREE.Object3D();
                    lightTarget.position.set(
                        this._all_objs_sphere.center.x, this._all_objs_sphere.center.y, this._all_objs_sphere.center.z);
                    lightTarget.name = 'lightTarget';
                    this.scene.add(lightTarget);
                    (<THREE.DirectionalLight>this.directional_light).target = lightTarget;
                }
                helper = new THREE.CameraHelper(this.directional_light.shadow.camera);
            } else {
                helper = new THREE.PointLightHelper( <THREE.PointLight>this.directional_light );
            }
            helper.visible = this.directional_light_settings.helper;
            helper.name = 'DLHelper';
            this.scene.add(helper);
            this.getDLPosition(scale);
            // this._renderer.render(this._scene, this._camera);
        }
    }


    // ============================================================================
    // ============================================================================
    // Some old stuff
    // ============================================================================
    // ============================================================================

    // public disposeWebGL() {
    //     console.log('this._renderer.info', this._renderer.info.memory.geometries);
    //     this.sceneObjs.forEach(obj => {
    //         if (obj['dispose']) { obj['dispose'](); }
    //         this._scene.remove(obj);
    //     });
    //     const BufferGeoms = this.BufferGeoms;
    //     BufferGeoms.forEach(geom => {
    //         geom.dispose();
    //     });
    //     this.BufferGeoms = [];
    //     console.log('this._renderer.info', this._renderer.info.memory.geometries);
    // }

    // private cameraLookat(center, radius = 100) {
    //     const fov = this._camera.fov * (Math.PI / 180);
    //     const vec_centre_to_pos: THREE.Vector3 = new THREE.Vector3();
    //     vec_centre_to_pos.subVectors(this._camera.position, vec_centre_to_pos);
    //     const tmp_vec = new THREE.Vector3(Math.abs(radius / Math.sin(fov / 2)),
    //         Math.abs(radius / Math.sin(fov / 2)),
    //         Math.abs(radius / Math.sin(fov / 2)));
    //     vec_centre_to_pos.setLength(tmp_vec.length());
    //     const perspectiveNewPos: THREE.Vector3 = new THREE.Vector3();
    //     perspectiveNewPos.addVectors(center, vec_centre_to_pos);
    //     const newLookAt = this._camera.getWorldDirection(center);
    //     // this._camera.position.copy(perspectiveNewPos);
    //     this._camera.lookAt(newLookAt);
    //     this._camera.updateProjectionMatrix();
    //     this._controls.target.set(center.x, center.y, center.z);
    //     this._controls.update();
    //     const textLabels = this._textLabels;
    //     if (textLabels.size !== 0) {
    //         textLabels.forEach((label) => {
    //             label.updatePosition();
    //         });
    //     }
    // }

    // public DLMapSize(size = null): void {
    //     let _size;
    //     if (size) {
    //         _size = 1024 * size;
    //     } else {
    //         _size = 8192;
    //     }
    //     if (this.directional_light) {
    //         this.directional_light.shadow.mapSize.width = _size;
    //         this.directional_light.shadow.mapSize.width = _size;
    //     }
    //     // this._renderer.render(this._scene, this._camera);
    // }

    // public onWindowKeyPress(event: KeyboardEvent): boolean {
    //     const nodeName = (<Element>event.target).nodeName;
    //     if (nodeName === 'TEXTAREA' || nodeName === 'INPUT') { return false; }
    //     const segment_str = window.location.pathname;
    //     const segment_array = segment_str.split('/');
    //     const last_segment = segment_array[segment_array.length - 1];
    //     if (last_segment === 'editor') {
    //         return false;
    //     }
    //     if (event.ctrlKey || event.metaKey) {
    //         return false;
    //     }
    //     const keyCode = event.which;
    //     // console.log(keyCode);
    //     const positionDelta = 10;
    //     const rotationDelta = 0.02;
    //     const xp = this._camera.position.x;
    //     const yp = this._camera.position.y;
    //     switch (keyCode) {
    //         case 65: // A: move left
    //             this._camera.position.x -= positionDelta;
    //             break;
    //         case 68: // D: move right
    //             this._camera.position.x += positionDelta;
    //             break;
    //         case 87: // W: move forward
    //             this._camera.position.y += positionDelta;
    //             break;
    //         case 83: // S: move backward
    //             this._camera.position.y -= positionDelta;
    //             break;
    //         case 90: // Z: move up
    //             this._camera.position.z += positionDelta;
    //             break;
    //         case 88: // X: move down
    //             this._camera.position.z -= positionDelta;
    //             break;
    //         case 81: // Q: rotate clockwise
    //             this._camera.position.x = xp * Math.cos(rotationDelta) + yp * Math.sin(rotationDelta);
    //             this._camera.position.y = yp * Math.cos(rotationDelta) - xp * Math.sin(rotationDelta);
    //             this._camera.lookAt(this._scene.position);
    //             break;
    //         case 69: // E: rotate anticlockwise
    //             this._camera.position.x = xp * Math.cos(rotationDelta) - yp * Math.sin(rotationDelta);
    //             this._camera.position.y = yp * Math.cos(rotationDelta) + xp * Math.sin(rotationDelta);
    //             this._camera.lookAt(this._scene.position);
    //             break;
    //         case 84: // T
    //             this._camera.rotation.x += rotationDelta;
    //             break;
    //         case 71: // G
    //             this._camera.rotation.x -= rotationDelta;
    //             break;
    //         case 70: // F
    //             this._camera.rotation.y += rotationDelta;
    //             break;
    //         case 72: // H
    //             this._camera.rotation.y -= rotationDelta;
    //             break;
    //         default:
    //             break;
    //     }
    //     return true;
    // }
}

