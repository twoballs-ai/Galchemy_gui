import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../store/store";
import { setCurrentObjectId } from "../../../store/slices/sceneObjectsSlice";
import { finishBoot } from "../../../store/slices/bootSlice";

import GameObjectListener from "./sceneCanvas/GameObjectListener";
import { GameAlchemy } from "../../../utils/gameAlchemy";
import { DaylightBoxPaths } from "../../../../public/assets/skyBoxes/DaylightBox";
import { findAssetById } from "../../../utils/assetStorage";

const DEFAULT_TEXTURE =
  "/assets/materials/basic/Concrete034_2K-PNG/Concrete034_2K-PNG_Color.png";

type ShapeBuilder = (options?: Record<string, unknown>) => unknown;

const SceneCanvas: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, setGameObjectsMap] = useState<Map<string, unknown>>(new Map());

  const activeScene = useSelector((s: RootState) => s.project.activeScene);
  const sceneObjects = useSelector((s: RootState) => s.sceneObjects.objects);
  const currentObjectId = useSelector((s: RootState) => s.sceneObjects.currentObjectId);

  const createShapeFactory = (): Record<string, ShapeBuilder> | null => {
    const core = GameAlchemy.core;
    if (!core) return null;

    const gl = core.ctx;
    const withMat = (type: string) => (opts: Record<string, unknown> = {}) =>
      GameAlchemy.primitiveFactory.create(type, gl, {
        ...opts,
        texture: opts.texture || DEFAULT_TEXTURE,
      });

    return {
      sphere: withMat("sphere"),
      cube: withMat("cube"),
      cylinder: withMat("cylinder"),
      terrain: withMat("terrain"),
      character: withMat("character"),
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
  };

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

        GameAlchemy.init({
          canvasId: canvas.id,
          w: Math.max(1, Math.round(width || canvas.clientWidth || 640)),
          h: Math.max(1, Math.round(height || canvas.clientHeight || 480)),
          bg: "#1e293b",
        });

        GameAlchemy.setEditorMode();
        GameAlchemy.setSkybox(DaylightBoxPaths);

        const core = GameAlchemy.core;
        if (!core) {
          throw new Error("GameAlchemy core was not initialized");
        }

        const onObjectSelected = (payload: { id: string } | null) => {
          dispatch(setCurrentObjectId(payload?.id || null));
        };

        core.attachResizeObserver?.(canvas);
        core.emitter.on("objectSelected", onObjectSelected);

        const activeCoreScene = core.sceneManager.scenes?.get?.(activeScene);
        if (!activeCoreScene) {
          core.sceneManager.createScene(activeScene);
        }
        core.sceneManager.switchScene(activeScene);

        GameAlchemy.start();

        coreCleanup = () => {
          core.emitter.off("objectSelected", onObjectSelected);
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
  }, [activeScene, dispatch]);

  useEffect(() => {
    if (!activeScene) return;
    const shapeFactory = createShapeFactory();
    if (!GameAlchemy.core || !shapeFactory) return;
    GameAlchemy.core.addSceneObjects(activeScene, sceneObjects, shapeFactory);
  }, [activeScene, sceneObjects]);

  useEffect(() => {
    if (!GameAlchemy.core) return;
    GameAlchemy.core.scene.setSelectedById?.(currentObjectId ?? null);
  }, [currentObjectId]);

  return (
    <div className="scene-canvas">
      <canvas ref={canvasRef} id="canvas" className="scene-canvas__viewport" />
      <GameObjectListener
        coreInstance={GameAlchemy.core}
        onGameObjectsMapUpdate={setGameObjectsMap}
      />
    </div>
  );
};

export default SceneCanvas;
