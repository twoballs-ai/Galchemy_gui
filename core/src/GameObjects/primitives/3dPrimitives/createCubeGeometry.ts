export function createCubeGeometry(width = 1, height = 1, depth = 1) {
  const hw = width / 2;
  const hh = height / 2;
  const hd = depth / 2;

  const positions = [
    // front
    -hw, -hh,  hd,  hw, -hh,  hd,  hw,  hh,  hd, -hw,  hh,  hd,
    // back
    -hw, -hh, -hd, -hw,  hh, -hd,  hw,  hh, -hd,  hw, -hh, -hd,
    // top
    -hw,  hh, -hd, -hw,  hh,  hd,  hw,  hh,  hd,  hw,  hh, -hd,
    // bottom
    -hw, -hh, -hd,  hw, -hh, -hd,  hw, -hh,  hd, -hw, -hh,  hd,
    // right
     hw, -hh, -hd,  hw,  hh, -hd,  hw,  hh,  hd,  hw, -hh,  hd,
    // left
    -hw, -hh, -hd, -hw, -hh,  hd, -hw,  hh,  hd, -hw,  hh, -hd,
  ];

  const normals = [
    // front
     0,  0,  1,  0,  0,  1,  0,  0,  1,  0,  0,  1,
    // back
     0,  0, -1,  0,  0, -1,  0,  0, -1,  0,  0, -1,
    // top
     0,  1,  0,  0,  1,  0,  0,  1,  0,  0,  1,  0,
    // bottom
     0, -1,  0,  0, -1,  0,  0, -1,  0,  0, -1,  0,
    // right
     1,  0,  0,  1,  0,  0,  1,  0,  0,  1,  0,  0,
    // left
    -1,  0,  0, -1,  0,  0, -1,  0,  0, -1,  0,  0,
  ];

  const texCoords = [
    // front
    0,0, 1,0, 1,1, 0,1,
    // back
    0,0, 0,1, 1,1, 1,0,
    // top
    0,0, 0,1, 1,1, 1,0,
    // bottom
    0,0, 1,0, 1,1, 0,1,
    // right
    0,0, 0,1, 1,1, 1,0,
    // left
    0,0, 1,0, 1,1, 0,1,
  ];

  const indices = [];
  for (let f = 0; f < 6; ++f) {
    const o = f * 4;
    indices.push(o, o + 1, o + 2, o, o + 2, o + 3);
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
    texCoords: new Float32Array(texCoords),
  };
}
