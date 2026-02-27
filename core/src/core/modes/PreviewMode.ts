import { BaseMode } from './BaseMode';
import { Core } from '../Core'; // обязательно импорт Core
import { GameCamera } from '../cameras/GameCamera'; // обязательно импорт GameCamera
import type { ICamera, IGameObject } from '../../types/CoreTypes';

export class PreviewMode extends BaseMode {
  enter(core: Core): void {
    super.enter(core);
    core.setShowHelpers(false);
    core.setDebugLogging(false);

    // --- выбираем камеру из объектов сцены ---
    const cameras = core.scene.objects.filter(
      (o): o is IGameObject & { isCamera: true, camera?: ICamera } => !!o.isCamera
    );
    const cameraObject = cameras[0];

    if (cameraObject?.camera) {
      core.setActiveCamera(cameraObject.camera);
    } else {
      // Если ни одной камеры нет — создать дефолтную
      const defaultCam = new GameCamera(core.canvas.width, core.canvas.height) as ICamera;
      core.setActiveCamera(defaultCam);
    }

    core.scene.objects.forEach((o: IGameObject) => {
      o.isEditorMode = false;
    });
  }

  override update(): void {
    this.core.scene.update(1 / 60); // фиксированное значение dt
  }
}
