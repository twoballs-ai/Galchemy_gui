import { BaseMode }       from './BaseMode';
import { EditorCamera }   from '../cameras/EditorCamera';
import { EditorControls } from '../controls/EditorControls';
import { GameObjectCharacter }      from '../../GameObjects/GameObjectCharacter';
import { EditorCharacterView }       from '../../GameObjects/views/EditorCharacterView';
import type { Core, IGameObject }   from '../../types/CoreTypes';

export class EditorMode extends BaseMode {
  private camera!: EditorCamera;
  private controls!: EditorControls;
  private onObjectAddedHandler!: (payload: { scene: string; object: IGameObject }) => void;

  enter(core: Core) {
    super.enter(core);

    /* helpers / отладка */
    core.setShowHelpers(true);
    core.setDebugLogging(true);

    /* ───────────── ❶ создаём и регистрируем EditorCamera ───────────── */
    this.camera = new EditorCamera(core.canvas.width, core.canvas.height);

    // говорим Core, что это «неприкосновенная» камера редактора
    core._registerEditorCamera(this.camera);

    // устанавливаем её активной (force = true)
    core.setActiveCamera(this.camera, /* force */ true);
    /* ---------------------------------------------------------------- */

    /* пометки для уже существующих объектов сцены */
    core.scene.objects.forEach(o => { o.isEditorMode = true; });

    /* ───────────── подписываемся на добавление новых объектов ───────────── */
    this.onObjectAddedHandler = ({ object }) => {
      // Если движок добавил GameObjectCharacter, создаём для него капсулу
      if (object instanceof GameObjectCharacter) {
        const helper = new EditorCharacterView(
          core.ctx as WebGL2RenderingContext,
          object
        );
        helper.isEditorOnly = true;
        
        core.scene.add(helper);
      }
    };
    core.emitter.on('objectAdded', this.onObjectAddedHandler);
    /* ─────────────────────────────────────────────────────────────────── */

    /* Controls */
    this.controls = new EditorControls(core);
  }

  exit() {
    this.controls.dispose();
    this.core.emitter.off('objectAdded', this.onObjectAddedHandler);
  }

  update(dt: number) {
    this.core.renderer.selectedObject = this.controls.selectedObject;
  }

  resize(w: number, h: number) {
    this.camera.resize(w, h);
  }
}
