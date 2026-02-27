export function createSphereGeometry(radius = 1, segments = 16) {
  const positions = [], normals = [], indices = [], texCoords = [];

  for (let y = 0; y <= segments; y++) {
    const v = y / segments;
    const theta = v * Math.PI;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let x = 0; x <= segments; x++) {
      const u = x / segments;
      const phi = u * 2 * Math.PI;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      const px = radius * cosPhi * sinTheta;
      const py = radius * cosTheta;
      const pz = radius * sinPhi * sinTheta;
      positions.push(px, py, pz);

      // Нормаль = нормализованная позиция
      const len = Math.hypot(px, py, pz);
      normals.push(px/len, py/len, pz/len);

      texCoords.push(u, 1 - v);
    }
  }

  for (let y = 0; y < segments; y++) {
    for (let x = 0; x < segments; x++) {
      const first = y * (segments + 1) + x;
      const second = first + segments + 1;
      indices.push(first, second, first + 1);
      indices.push(second, second + 1, first + 1);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
    texCoords: new Float32Array(texCoords),
  };
}
