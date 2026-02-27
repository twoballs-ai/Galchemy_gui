export class Renderer {
  constructor(ctx, backgroundColor) {
    this.ctx = ctx;
    this.bgColor = backgroundColor;
    this.canvas = ctx.canvas;
  }

  clear() {
    throw new Error('clear() must be implemented by subclass');
  }

  render(scene) {
    throw new Error('render() must be implemented by subclass');
  }
}