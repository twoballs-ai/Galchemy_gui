import { mat4 } from 'gl-matrix';
import { loadTexture } from '../../utils/TextureLoader.js';

export class GameObject2D {
  constructor(gl, {
    imageSrc,
    x, y,
    width, height,
    layer = 0,
    physics = false,
    collision = false,
    speed   = 200
  }) {
    this.gl      = gl;
    this.x       = x;
    this.y       = y;
    this.width   = width;
    this.height  = height;
    this.layer   = layer;
    this.speed   = speed;

    this.physics   = physics;
    this.collision = collision;
    this.physicsBody = physics ? {
      x, y, width, height,
      velocity: { x: 0, y: 0 },
      isStatic: false
    } : null;

    this._texture = null;
    this._texturePromise = loadTexture(gl, imageSrc)
      .then(tex => { this._texture = tex; });
  }

  /* ────────────────────────────── API для движка ───────────────────────── */

  update(dt) {
    if (this.physicsBody) {
      this.x = this.physicsBody.x;
      this.y = this.physicsBody.y;
    }
  }
  onCollision(other) {}

  /** вызывается WebGLRenderer для спрайтов */
  renderWebGL2D(spriteRenderer) {
    if (!this._texture) return;           // ещё не загрузилась
    spriteRenderer.add(this);
  }

  /** матрица модели для спрайта */
  get modelMatrix() {
    const m = mat4.create();
    mat4.translate(m, m, [
      this.x + this.width * 0.5,
      this.y + this.height * 0.5,
      0
    ]);
    mat4.scale(m, m, [this.width, this.height, 1]);
    return m;
  }

  get texture() { return this._texture; }
}
