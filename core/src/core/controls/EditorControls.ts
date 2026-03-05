import type { Core } from "../core/Core";
import type { IGameObject } from "../../types/CoreTypes";
import { vec3, mat4 } from "gl-matrix";

type DragObjectInfo = {
  obj: IGameObject;
  offset: [number, number, number];
} | null;

type DragState = { mode: "orbit" | "pan"; x: number; y: number };

export class EditorControls {
  private core: Core;
  private dragObjectInfo: DragObjectInfo = null;
  private dragCameraInfo: DragState | null = null;
  public selectedObject: IGameObject | null = null;

  constructor(core: Core) {
    this.core = core;
    this.attach();
  }

  attach() {
    const canvas = this.core.canvas;
    canvas.addEventListener("contextmenu", e => e.preventDefault());
    canvas.addEventListener("mousedown", this._onMouseDown);
    window.addEventListener("mousemove", this._onMouseMove);
    window.addEventListener("mouseup", this._onMouseUp);
    canvas.addEventListener("wheel", this._onWheel, { passive: false });
    window.addEventListener("keydown", this._onKeyDown);
  }

  dispose() {
    const canvas = this.core.canvas;
    canvas.removeEventListener("contextmenu", e => e.preventDefault());
    canvas.removeEventListener("mousedown", this._onMouseDown);
    window.removeEventListener("mousemove", this._onMouseMove);
    window.removeEventListener("mouseup", this._onMouseUp);
    canvas.removeEventListener("wheel", this._onWheel);
    window.removeEventListener("keydown", this._onKeyDown);
  }

  private _onMouseDown = (e: MouseEvent) => {
    const { scene } = this.core;

    if (e.button === 0 && !e.shiftKey) {
      const pick = this._pickObject(e);
      if (pick) {
        this.selectedObject = pick.obj;
        scene.selectedObject = pick.obj;
        this.core.setSelectedObject?.(pick.obj);
        const objPos = this._readPosition(pick.obj);
        const off: [number, number, number] = [
          pick.pickPoint[0] - objPos[0],
          pick.pickPoint[1] - objPos[1],
          pick.pickPoint[2] - objPos[2]
        ];
        this.dragObjectInfo = { obj: pick.obj, offset: off };

        this.core.emitter.emit("objectSelected", {
          id: pick.obj.id,
          name: pick.obj.name ?? '',
          type: pick.obj.type,
          position: objPos,
        });

        return;
      }

      this.selectedObject = null;
      scene.selectedObject = null;
      this.core.setSelectedObject?.(null);
      this.core.emitter.emit("objectSelected", null);
      this.dragCameraInfo = { mode: "orbit", x: e.clientX, y: e.clientY };
      return;
    }

    if ((e.button === 0 && e.shiftKey) || e.button === 2) {
      this.dragCameraInfo = { mode: "pan", x: e.clientX, y: e.clientY };
    }
  };

  private _onMouseMove = (e: MouseEvent) => {
    const camera = this.core.camera as any;

    if (this.dragObjectInfo) {
      const { obj, offset } = this.dragObjectInfo;
      const objPos = this._readPosition(obj);
      const pickPoint = this._pickOnHorizontalPlane(e, objPos[1]);
      if (!pickPoint) return;

      const nextPos: [number, number, number] = [
        pickPoint[0] - offset[0],
        objPos[1],
        pickPoint[2] - offset[2]
      ];

      (obj as any).position = nextPos;
      this.core.emitter.emit("objectUpdated", {
        scene: this.core.scene.name,
        object: { id: obj.id, position: nextPos }
      });
      return;
    }

    if (this.dragCameraInfo) {
      const dx = e.clientX - this.dragCameraInfo.x;
      const dy = e.clientY - this.dragCameraInfo.y;

      if (this.dragCameraInfo.mode === "orbit") {
        camera.yaw -= dx * 0.005;
        camera.pitch += dy * 0.005;
        camera.pitch = Math.max(-1.55, Math.min(1.55, camera.pitch));
      } else if (this.dragCameraInfo.mode === "pan") {
        const panSpeed = 0.01 * camera.distance;
        camera.target[0] -= dx * panSpeed;
        camera.target[2] += dy * panSpeed;
      }

      this.dragCameraInfo.x = e.clientX;
      this.dragCameraInfo.y = e.clientY;
    }
  };

  private _onMouseUp = () => {
    this.dragObjectInfo = null;
    this.dragCameraInfo = null;
  };

  private _onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const camera = this.core.camera as any;
    camera.distance *= e.deltaY > 0 ? 1.1 : 0.9;
    camera.distance = Math.min(Math.max(camera.distance, 1), 100);
  };

  private _onKeyDown = (e: KeyboardEvent) => {
    const camera = this.core.camera as any;
    const speed = 0.1 * camera.distance;
    switch (e.key.toLowerCase()) {
      case "w": case "arrowup":    camera.target[2] -= speed; break;
      case "s": case "arrowdown":  camera.target[2] += speed; break;
      case "a": case "arrowleft":  camera.target[0] -= speed; break;
      case "d": case "arrowright": camera.target[0] += speed; break;
      case "q": camera.target[1] += speed; break;
      case "e": camera.target[1] -= speed; break;
    }
  };

  private _readPosition(obj: IGameObject): [number, number, number] {
    const p = (obj as any).position;
    return [Number(p?.[0] ?? 0), Number(p?.[1] ?? 0), Number(p?.[2] ?? 0)];
  }

  private _screenRay(e: MouseEvent): { origin: vec3; dir: vec3 } | null {
    const { canvas, camera } = this.core;
    const rect = canvas.getBoundingClientRect();
    const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

    const viewProj = mat4.multiply(mat4.create(), camera.getProjection(), camera.getView());
    const inv = mat4.invert(mat4.create(), viewProj);
    if (!inv) return null;

    const transform = (m: ArrayLike<number>, x: number, y: number, z: number, w: number) => ([
      m[0] * x + m[4] * y + m[8] * z + m[12] * w,
      m[1] * x + m[5] * y + m[9] * z + m[13] * w,
      m[2] * x + m[6] * y + m[10] * z + m[14] * w,
      m[3] * x + m[7] * y + m[11] * z + m[15] * w,
    ]);

    const near = transform(inv, ndcX, ndcY, -1, 1);
    const far = transform(inv, ndcX, ndcY, 1, 1);

    if (Math.abs(near[3]) < 1e-6 || Math.abs(far[3]) < 1e-6) return null;

    near[0] /= near[3]; near[1] /= near[3]; near[2] /= near[3];
    far[0] /= far[3]; far[1] /= far[3]; far[2] /= far[3];

    const origin = vec3.fromValues(near[0], near[1], near[2]);
    const dir = vec3.normalize(vec3.create(), vec3.fromValues(far[0] - near[0], far[1] - near[1], far[2] - near[2]));
    return { origin, dir };
  }

  private _pickOnHorizontalPlane(e: MouseEvent, yPlane: number): [number, number, number] | null {
    const ray = this._screenRay(e);
    if (!ray) return null;
    if (Math.abs(ray.dir[1]) < 1e-6) return null;

    const t = (yPlane - ray.origin[1]) / ray.dir[1];
    if (t < 0) return null;
    return vec3.scaleAndAdd(vec3.create(), ray.origin, ray.dir, t) as [number, number, number];
  }

  private _pickObject(e: MouseEvent): { obj: IGameObject, pickPoint: [number, number, number] } | null {
    const ray = this._screenRay(e);
    if (!ray) return null;

    let closest: { obj: IGameObject; t: number } | null = null;

    for (const obj of this.core.scene.objects) {
      const center = (obj as any).worldPosition ?? (obj as any).position;
      if (!center) continue;

      const radiusRaw = Number((obj as any).boundingRadius ?? 0.75);
      const radius = radiusRaw > 0 ? radiusRaw : 0.75;

      const oc = vec3.sub(vec3.create(), ray.origin, vec3.fromValues(center[0], center[1], center[2]));
      const a = vec3.dot(ray.dir, ray.dir);
      const b = 2 * vec3.dot(oc, ray.dir);
      const c = vec3.dot(oc, oc) - radius * radius;
      const d = b * b - 4 * a * c;
      if (d < 0) continue;

      const t = (-b - Math.sqrt(d)) / (2 * a);
      if (t <= 0) continue;
      if (!closest || t < closest.t) {
        closest = { obj, t };
      }
    }

    if (!closest) return null;
    const pickPoint = vec3.scaleAndAdd(vec3.create(), ray.origin, ray.dir, closest.t) as [number, number, number];
    return { obj: closest.obj, pickPoint };
  }
}
