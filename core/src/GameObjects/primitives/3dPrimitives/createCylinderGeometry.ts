export function createCylinderGeometry(r = 1, h = 2, n = 32) {
  const positions = [];
  const texCoords = [];
  const indices   = [];

  // бок
  for (let i = 0; i <= n; ++i) {
    const t = i / n * Math.PI * 2;
    const x = Math.cos(t)*r, z = Math.sin(t)*r;
    const u = i / n; // координата вдоль окружности
    positions.push(x,  h/2, z,  x, -h/2, z);
    texCoords.push(u, 0, u, 1);
    if (i < n) {
      const o = i*2;
      indices.push(o, o+1, o+3,  o, o+3, o+2);
    }
  }

  // крышки
  const topCenter    = positions.length/3;
  positions.push(0,  h/2, 0);
  texCoords.push(0.5, 0.5); // центр верхней крышки
  const bottomCenter = positions.length/3;
  positions.push(0, -h/2, 0);
  texCoords.push(0.5, 0.5); // центр нижней крышки

  for (let i = 0; i < n; ++i) {
    const t0 = i*2, t1 = ((i+1)%n)*2;
    // верх
    indices.push(topCenter, t1, t0);
    // низ
    indices.push(bottomCenter, t0+1, t1+1);
  }

  return {
    positions: new Float32Array(positions),
    indices: new Uint16Array(indices),
    texCoords: new Float32Array(texCoords),
  };
}
