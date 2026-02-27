import { GameObject3D } from './primitives/GameObject3D';

export class GameObjectModel extends GameObject3D {
  assetId: string;
  name: string;
  type: string;
  children: Set<GameObject3D> = new Set();

  constructor(gl: WebGL2RenderingContext, mesh: any, {
    position = [0, 0, 0],
    name = "Model",
    assetId = ""
  } = {}) {
    super(gl, { mesh, position, color: "#cccccc" });
    this.name = name;
    this.assetId = assetId;
    this.type = "model";
  }

  addChild(child: GameObject3D) {
    this.children.add(child);
    child.parent = this;
    return this;
  }

  renderWebGL3D(gl, shader, ...args) {
    // Рендер самого объекта (если у него есть mesh)
    super.renderWebGL3D(gl, shader, ...args);
    // Рендер всех детей
    for (const child of this.children) {
      child.renderWebGL3D(gl, shader, ...args);
    }
  }
}
