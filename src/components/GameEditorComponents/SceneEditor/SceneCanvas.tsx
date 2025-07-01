// SceneCanvas.tsx
import React, { useRef, useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../store/store";
import { setCurrentObjectId } from "../../../store/slices/sceneObjectsSlice";
import { finishBoot } from "../../../store/slices/bootSlice";

import GameObjectListener from "./sceneCanvas/GameObjectListener";
import { GameAlchemy } from "game-alchemy-core";
import { DaylightBoxPaths } from "../../../../public/assets/skyBoxes/DaylightBox";
import { findAssetById } from "../../../utils/assetStorage";

interface GameObjectLive {
  id: string;
  type: string;
  x: number;
  y: number;
  [k: string]: any;
}

const DEFAULT_TEXTURE =
  "/assets/materials/basic/Concrete034_2K-PNG/Concrete034_2K-PNG_Color.png";

const SceneCanvas: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameObjectsMap, setGameObjectsMap] = useState<
    Map<string, GameObjectLive>
  >(new Map());

  const activeScene = useSelector((s: RootState) => s.project.activeScene);
  const sceneObjects = useSelector((s: RootState) => s.sceneObjects.objects);
  const currentObjectId = useSelector(
    (s: RootState) => s.sceneObjects.currentObjectId
  );

  /* ---------- shape-factory ---------- */
  const shapeFactory = useMemo(() => {
    const core = GameAlchemy.core;
    if (!core) return null;

    const gl = core.ctx;
    const withMat = (type: string) => (opts = {}) =>
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
      camera: (opts = {}) =>
        GameAlchemy.primitiveFactory.create("camera", gl, opts),
      light: (opts = {}) =>
        GameAlchemy.primitiveFactory.create("light", gl, opts),
      model: async (opts = {}) => {
        const asset = await findAssetById(opts.modelAssetId);
        if (!asset?.fileData) throw new Error("Model asset not found");
        const blobUrl = URL.createObjectURL(new Blob([asset.fileData]));
        return GameAlchemy.spawn3DModel(
          blobUrl,
          [opts.x ?? 0, opts.y ?? 0, opts.z ?? 0],
          asset.name,
          asset.id
        );
      },
    };
  }, []);

  /* ---------- init / dispose ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      dispatch(finishBoot());
      return;
    }

    let coreCleanup: () => void = () => {};
    (async () => {
      try {
        GameAlchemy.init({
          canvasId: canvas.id,
          w: canvas.clientWidth,
          h: canvas.clientHeight,
          bg: "#5d8aa8",
        });

        GameAlchemy.setEditorMode();
        GameAlchemy.setSkybox(DaylightBoxPaths);

        const core = GameAlchemy.core!;
        const onObjectSelected = (p: { id: string } | null) =>
          dispatch(setCurrentObjectId(p?.id || null));

        core.attachResizeObserver(canvas);
        core.emitter.on("objectSelected", onObjectSelected);

        // создать/переключить сцену
        if (
          !core.sceneManager.getCurrentScene() ||
          core.sceneManager.getCurrentScene().name !== activeScene
        ) {
          core.sceneManager.createScene(activeScene);
          core.sceneManager.switchScene(activeScene);
        }

        GameAlchemy.start();

        coreCleanup = () => {
          core.emitter.off("objectSelected", onObjectSelected);
          core.stop();
        };
      } catch (err) {
        console.error("Ошибка инициализации GameAlchemy:", err);
      } finally {
        // ✅ снимаем сплэш ВСЕГДА
        dispatch(finishBoot());
      }
    })();

    return () => {
      coreCleanup();
    };
  }, [activeScene, dispatch]);

  /* ---------- ререндер объектов ---------- */
  useEffect(() => {
    if (!GameAlchemy.core || !shapeFactory) return;
    GameAlchemy.core.addSceneObjects(
      activeScene,
      sceneObjects,
      shapeFactory as any
    );
  }, [activeScene, sceneObjects, shapeFactory]);

  /* ---------- выделение объекта ---------- */
  useEffect(() => {
    if (!GameAlchemy.core) return;
    GameAlchemy.core.scene.setSelectedById?.(currentObjectId ?? null);
  }, [currentObjectId]);

  /* ---------- render ---------- */
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas
        ref={canvasRef}
        id="canvas"
        style={{ border: "1px solid #ccc", width: "100%", height: "100%" }}
      />
      <GameObjectListener
        coreInstance={GameAlchemy.core}
        onGameObjectsMapUpdate={setGameObjectsMap}
      />
    </div>
  );
};

export default SceneCanvas;
