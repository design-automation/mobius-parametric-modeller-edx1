import { DataThreejs } from '../data/data.threejs';
export class ThreeJSViewerService {
    DataThreejs: DataThreejs;
    initRaycaster(event) {
        const scene = this.DataThreejs;
        const rect = scene.renderer.domElement.getBoundingClientRect();
        scene.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        scene.mouse.y = - ((event.clientY - rect.top) / rect.height) * 2 + 1;
        scene.raycaster.setFromCamera(scene.mouse, scene.camera);
        return scene.raycaster.intersectObjects(scene.scene_objs);
    }
}
