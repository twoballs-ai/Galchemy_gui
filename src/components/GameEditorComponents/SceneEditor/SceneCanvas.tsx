import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { mat4, vec3 } from "../../../../core/src/vendor/gl-matrix";
import { RootState, AppDispatch } from "../../../store/store";
import { setCurrentObjectId, updateSceneObject } from "../../../store/slices/sceneObjectsSlice";
import { finishBoot } from "../../../store/slices/bootSlice";

import GameObjectListener from "./sceneCanvas/GameObjectListener";
import { GameAlchemy } from "../../../utils/gameAlchemy";
import { findAssetById } from "../../../utils/assetStorage";
import TouchControlsOverlay from "./sceneCanvas/TouchControlsOverlay";
import { defaultSceneSettings } from "../../../store/slices/projectSlice";

const DEFAULT_TEXTURE =
  "/assets/materials/basic/Concrete034_2K-PNG/Concrete034_2K-PNG_Color.png";

type ShapeBuilder = (options?: Record<string, unknown>) => unknown | Promise<unknown>;

interface SceneCanvasProps {
  isPreviewing: boolean;
  orientation: 'landscape' | 'portrait';
}

const qualityScaleMap: Record<string, number> = {
  low: 0.6,
  medium: 0.8,
  high: 1,
  ultra: 1.25,
};

const SceneCanvas: React.FC<SceneCanvasProps> = ({ isPreviewing, orientation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, setGameObjectsMap] = useState<Map<string, unknown>>(new Map());

  const activeScene = useSelector((s: RootState) => s.project.activeScene);
  const sceneObjects = useSelector((s: RootState) => s.sceneObjects.objects);
  const currentObjectId = useSelector((s: RootState) => s.sceneObjects.currentObjectId);
  const pendingPatchRef = useRef<Record<string, Record<string, unknown>>>({});
  const patchTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const interactionRef = useRef<{
    mode: "move" | "resize";
    pointerId: number;
    objectId: string;
    basePosition: [number, number, number];
    baseScale: [number, number, number];
    baseY: number;
    startClientX: number;
    startClientY: number;
    startDistance: number;
  } | null>(null);
  const [selectionRect, setSelectionRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const sceneObjectsRef = useRef(sceneObjects);

  useEffect(() => {
    sceneObjectsRef.current = sceneObjects;
  }, [sceneObjects]);
  const activeSceneData = useSelector((s: RootState) =>
    s.project.scenes.find((scene) => scene.id === activeScene)
  );

  const graphicsPreset =
    String(activeSceneData?.settings?.graphicsPreset ?? defaultSceneSettings.graphicsPreset);
  const devicePreset =
    String(activeSceneData?.settings?.devicePreset ?? defaultSceneSettings.devicePreset);
  const backgroundColor =
    String(activeSceneData?.settings?.backgroundColor ?? defaultSceneSettings.backgroundColor);


  const resolveTexture = async (opts: Record<string, unknown>) => {
    if (typeof opts.texture === 'string' && opts.texture) return opts.texture;
    if (typeof opts.textureSrc === 'string' && opts.textureSrc) return opts.textureSrc;
    if (!opts.textureAssetId) return DEFAULT_TEXTURE;

    const asset = await findAssetById(String(opts.textureAssetId));
    if (!asset) return DEFAULT_TEXTURE;
    if (typeof asset.url === 'string' && asset.url) return asset.url;
    if (typeof asset.fileData === 'string' && asset.fileData) return asset.fileData;
    if (asset.fileData) {
      return URL.createObjectURL(new Blob([asset.fileData]));
    }
    return DEFAULT_TEXTURE;
  };

  const createShapeFactory = useCallback((): Record<string, ShapeBuilder> | null => {
    const core = GameAlchemy.core;
    if (!core) return null;

    const gl = core.ctx;
    const withMat = (type: string) => async (opts: Record<string, unknown> = {}) =>
      GameAlchemy.primitiveFactory.create(type, gl, {
        ...opts,
        texture: await resolveTexture(opts),
      });

    return {
      sphere: withMat("sphere"),
      cube: withMat("cube"),
      cylinder: withMat("cylinder"),
      terrain: withMat("terrain"),
      plane: withMat("plane"),
      water: withMat("plane"),
      character: withMat("character"),
      spawnPoint: (opts: Record<string, unknown> = {}) =>
        GameAlchemy.primitiveFactory.create("spawnPoint", gl, opts),
      sprite: async (opts: Record<string, unknown> = {}) =>
        GameAlchemy.primitiveFactory.create("sprite", gl, {
          ...opts,
          imageSrc: await resolveTexture(opts),
          x: Number(opts.x ?? 0),
          y: Number(opts.y ?? 0),
          width: Number(opts.width ?? 128),
          height: Number(opts.height ?? 128),
        }),
      camera: (opts: Record<string, unknown> = {}) =>
        GameAlchemy.primitiveFactory.create("camera", gl, opts),
      light: (opts: Record<string, unknown> = {}) =>
        GameAlchemy.primitiveFactory.create("light", gl, opts),
      model: async (opts: Record<string, unknown> = {}) => {
        const asset = await findAssetById(String(opts.modelAssetId || ""));
        if (!asset?.fileData) throw new Error("Model asset not found");
        const blobUrl = URL.createObjectURL(new Blob([asset.fileData]));
        return GameAlchemy.spawn3DModel(
          blobUrl,
          [Number(opts.x ?? 0), Number(opts.y ?? 0), Number(opts.z ?? 0)],
          asset.name,
          asset.id
        );
      },
    };
  }, []);

  const queuePatch = useCallback((objectId: string, patch: Record<string, unknown>) => {
    pendingPatchRef.current[objectId] = {
      ...(pendingPatchRef.current[objectId] || {}),
      ...patch,
    };
  }, []);

  useEffect(() => {
    if (!activeScene) {
      dispatch(finishBoot());
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      dispatch(finishBoot());
      return;
    }

    let coreCleanup: () => void = () => {};

    (async () => {
      try {
        const { width, height } = canvas.getBoundingClientRect();

        const scale = qualityScaleMap[graphicsPreset] ?? 1;
        GameAlchemy.init({
          canvasId: canvas.id,
          w: Math.max(1, Math.round((width || canvas.clientWidth || 640) * scale)),
          h: Math.max(1, Math.round((height || canvas.clientHeight || 480) * scale)),
          bg: backgroundColor,
        });

        GameAlchemy.setEditorMode();
        const core = GameAlchemy.core;
        if (!core) {
          throw new Error("GameAlchemy core was not initialized");
        }

        const onObjectSelected = (payload: { id: string } | null) => {
          dispatch(setCurrentObjectId(payload?.id || null));
        };

        const flushObjectPatches = () => {
          const queued = pendingPatchRef.current;
          pendingPatchRef.current = {};
          patchTimerRef.current = null;

          Object.entries(queued).forEach(([objectId, patch]) => {
            const current = sceneObjectsRef.current.find((obj) => obj.id === objectId);
            if (!current) return;

            const merged: Record<string, unknown> = { ...current, ...patch };

            if (Array.isArray(merged.position)) {
              const [x = 0, y = 0, z = 0] = merged.position as number[];
              merged.x = x;
              merged.y = y;
              merged.z = z;
            }
            if (Array.isArray(merged.rotation)) {
              const [rx = 0, ry = 0, rz = 0] = merged.rotation as number[];
              merged.rotX = (Number(rx) * 180) / Math.PI;
              merged.rotY = (Number(ry) * 180) / Math.PI;
              merged.rotZ = (Number(rz) * 180) / Math.PI;
            }
            if (Array.isArray(merged.scale)) {
              const [sx = 1, sy = 1, sz = 1] = merged.scale as number[];
              merged.scaleX = sx;
              merged.scaleY = sy;
              merged.scaleZ = sz;
            }

            dispatch(updateSceneObject({ activeScene, object: merged as any }));
          });
        };

        const onObjectUpdated = (payload: { object?: Record<string, unknown> } | null) => {
          if (isPreviewing) return;
          if (!payload?.object?.id || !activeScene) return;

          const objectId = String(payload.object.id);
          queuePatch(objectId, payload.object);

          if (patchTimerRef.current !== null) return;
          patchTimerRef.current = window.setTimeout(flushObjectPatches, 50);
        };

        core.attachResizeObserver?.(canvas);
        core.emitter.on("objectSelected", onObjectSelected);
        core.emitter.on("objectUpdated", onObjectUpdated as (payload: unknown) => void);

        const activeCoreScene = core.sceneManager.scenes?.get?.(activeScene);
        if (!activeCoreScene) {
          core.sceneManager.createScene(activeScene);
        }
        core.sceneManager.switchScene(activeScene);

        GameAlchemy.start();

        coreCleanup = () => {
          if (patchTimerRef.current !== null) {
            window.clearTimeout(patchTimerRef.current);
            patchTimerRef.current = null;
          }
          core.emitter.off("objectSelected", onObjectSelected);
          core.emitter.off("objectUpdated", onObjectUpdated as (payload: unknown) => void);
          core.stop();
        };
      } catch (err) {
        console.error("Ошибка инициализации GameAlchemy:", err);
      } finally {
        dispatch(finishBoot());
      }
    })();

    return () => {
      coreCleanup();
    };
  }, [activeScene, dispatch, graphicsPreset, backgroundColor, isPreviewing, queuePatch]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isPreviewing) {
      setSelectionRect(null);
      return;
    }

    const projectToScreen = (point: [number, number, number]) => {
      const core = GameAlchemy.core;
      if (!core?.camera) return null;

      const transform = (m: ArrayLike<number>, x: number, y: number, z: number, w: number) => ([
        m[0] * x + m[4] * y + m[8] * z + m[12] * w,
        m[1] * x + m[5] * y + m[9] * z + m[13] * w,
        m[2] * x + m[6] * y + m[10] * z + m[14] * w,
        m[3] * x + m[7] * y + m[11] * z + m[15] * w,
      ]);

      const view = core.camera.getView();
      const proj = core.camera.getProjection();
      const viewPos = transform(view, point[0], point[1], point[2], 1);
      const clip = transform(proj, viewPos[0], viewPos[1], viewPos[2], viewPos[3]);
      if (Math.abs(clip[3]) < 1e-5) return null;

      const ndcX = clip[0] / clip[3];
      const ndcY = clip[1] / clip[3];
      const rect = canvas.getBoundingClientRect();

      return {
        x: ((ndcX + 1) * 0.5) * rect.width,
        y: ((1 - ndcY) * 0.5) * rect.height,
      };
    };

    const updateRect = () => {
      const core = GameAlchemy.core;
      const selected = core?.scene?.selectedObject;
      if (!selected?.id || !selected.worldPosition || !selected.boundingRadius) {
        setSelectionRect(null);
        rafRef.current = window.requestAnimationFrame(updateRect);
        return;
      }

      const center = projectToScreen(selected.worldPosition as [number, number, number]);
      if (!center) {
        setSelectionRect(null);
        rafRef.current = window.requestAnimationFrame(updateRect);
        return;
      }

      const edgeWorld: [number, number, number] = [
        selected.worldPosition[0] + Number(selected.boundingRadius),
        selected.worldPosition[1],
        selected.worldPosition[2],
      ];
      const edge = projectToScreen(edgeWorld);
      if (!edge) {
        setSelectionRect(null);
        rafRef.current = window.requestAnimationFrame(updateRect);
        return;
      }

      const radius = Math.max(24, Math.hypot(edge.x - center.x, edge.y - center.y));
      setSelectionRect({
        left: center.x - radius,
        top: center.y - radius,
        width: radius * 2,
        height: radius * 2,
      });

      rafRef.current = window.requestAnimationFrame(updateRect);
    };

    rafRef.current = window.requestAnimationFrame(updateRect);

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [currentObjectId, isPreviewing]);

  const getRayToHorizontalPlane = useCallback((clientX: number, clientY: number, yPlane: number) => {
    const canvas = canvasRef.current;
    const core = GameAlchemy.core;
    if (!canvas || !core?.camera) return null;

    const rect = canvas.getBoundingClientRect();
    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -(((clientY - rect.top) / rect.height) * 2 - 1);

    const viewProj = mat4.multiply(mat4.create(), core.camera.getProjection(), core.camera.getView());
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
    near[0] /= near[3]; near[1] /= near[3]; near[2] /= near[3];
    far[0] /= far[3]; far[1] /= far[3]; far[2] /= far[3];

    const dir = vec3.normalize(vec3.create(), vec3.fromValues(far[0] - near[0], far[1] - near[1], far[2] - near[2]));
    const origin = vec3.fromValues(near[0], near[1], near[2]);
    if (Math.abs(dir[1]) < 1e-6) return null;
    const t = (yPlane - origin[1]) / dir[1];
    if (t < 0) return null;

    const p = vec3.scaleAndAdd(vec3.create(), origin, dir, t);
    return [p[0], p[1], p[2]];
  }, []);

  const onSelectionPointerDown = useCallback((mode: "move" | "resize", e: React.PointerEvent<HTMLDivElement>) => {
    if (isPreviewing) return;
    const selected = sceneObjects.find((obj) => obj.id === currentObjectId);
    if (!selected) return;

    const basePosition: [number, number, number] = Array.isArray(selected.position)
      ? [Number(selected.position[0] ?? selected.x ?? 0), Number(selected.position[1] ?? selected.y ?? 0), Number(selected.position[2] ?? selected.z ?? 0)]
      : [Number(selected.x ?? 0), Number(selected.y ?? 0), Number(selected.z ?? 0)];

    const baseScale: [number, number, number] = Array.isArray(selected.scale)
      ? [Number(selected.scale[0] ?? selected.scaleX ?? 1), Number(selected.scale[1] ?? selected.scaleY ?? 1), Number(selected.scale[2] ?? selected.scaleZ ?? 1)]
      : [Number(selected.scaleX ?? 1), Number(selected.scaleY ?? 1), Number(selected.scaleZ ?? 1)];

    interactionRef.current = {
      mode,
      pointerId: e.pointerId,
      objectId: selected.id,
      basePosition,
      baseScale,
      baseY: basePosition[1],
      startClientX: e.clientX,
      startClientY: e.clientY,
      startDistance: Math.max(1, Math.hypot(selectionRect?.width ?? 1, selectionRect?.height ?? 1)),
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  }, [currentObjectId, isPreviewing, sceneObjects, selectionRect]);

  const onSelectionPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const interaction = interactionRef.current;
    if (!interaction || interaction.pointerId !== e.pointerId) return;

    if (interaction.mode === "move") {
      const hit = getRayToHorizontalPlane(e.clientX, e.clientY, interaction.baseY);
      if (!hit) return;
      const patch = {
        position: [hit[0], interaction.baseY, hit[2]],
      };
      GameAlchemy.patchObject(interaction.objectId, patch);
      queuePatch(interaction.objectId, patch);
      return;
    }

    const delta = Math.hypot(e.clientX - interaction.startClientX, e.clientY - interaction.startClientY);
    const direction = (e.clientX - interaction.startClientX) + (interaction.startClientY - e.clientY);
    const signed = direction >= 0 ? delta : -delta;
    const factor = Math.max(0.1, 1 + signed / interaction.startDistance);
    const scale: [number, number, number] = [
      interaction.baseScale[0] * factor,
      interaction.baseScale[1] * factor,
      interaction.baseScale[2] * factor,
    ];
    const patch = { scale };
    GameAlchemy.patchObject(interaction.objectId, patch);
    queuePatch(interaction.objectId, patch);
  }, [getRayToHorizontalPlane, queuePatch]);

  const onSelectionPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const interaction = interactionRef.current;
    if (!interaction || interaction.pointerId !== e.pointerId) return;
    interactionRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  useEffect(() => {
    const core = GameAlchemy.core;
    const canvas = canvasRef.current;
    if (!core || !canvas) return;

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const scale = qualityScaleMap[graphicsPreset] ?? 1;
      core.resize?.(
        Math.max(1, Math.round((width || canvas.clientWidth || 640) * scale)),
        Math.max(1, Math.round((height || canvas.clientHeight || 480) * scale))
      );
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [graphicsPreset]);

  useEffect(() => {
    if (!activeScene) return;
    const shapeFactory = createShapeFactory();
    if (!GameAlchemy.core || !shapeFactory) return;

    let cancelled = false;
    (async () => {
      await GameAlchemy.core.addSceneObjects(activeScene, sceneObjects, shapeFactory);
      if (!cancelled && currentObjectId) {
        GameAlchemy.core?.scene.setSelectedById?.(currentObjectId);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeScene, sceneObjects, currentObjectId, createShapeFactory]);

  useEffect(() => {
    if (!GameAlchemy.core) return;
    GameAlchemy.core.scene.setSelectedById?.(currentObjectId ?? null);
  }, [currentObjectId]);

  return (
    <div className={`scene-canvas scene-canvas--${devicePreset} scene-canvas--${orientation}`}>
      <canvas ref={canvasRef} id="canvas" className="scene-canvas__viewport" />
      {!isPreviewing && selectionRect && currentObjectId && (
        <div
          className="scene-canvas__selection"
          style={{
            left: `${selectionRect.left}px`,
            top: `${selectionRect.top}px`,
            width: `${selectionRect.width}px`,
            height: `${selectionRect.height}px`,
          }}
          onPointerDown={(e) => onSelectionPointerDown("move", e)}
          onPointerMove={onSelectionPointerMove}
          onPointerUp={onSelectionPointerUp}
        >
          <div
            className="scene-canvas__selection-handle scene-canvas__selection-handle--br"
            onPointerDown={(e) => onSelectionPointerDown("resize", e)}
          />
        </div>
      )}
      <TouchControlsOverlay enabled={isPreviewing && devicePreset !== 'desktop'} />
      <GameObjectListener
        coreInstance={GameAlchemy.core}
        onGameObjectsMapUpdate={setGameObjectsMap}
      />
    </div>
  );
};

export default SceneCanvas;
