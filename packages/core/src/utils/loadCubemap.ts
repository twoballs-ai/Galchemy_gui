export async function loadCubemap(
  gl: WebGL2RenderingContext,
  faces: Record<number, string>
): Promise<WebGLTexture> {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);

  // Заглушка 1×1
  const stub = new Uint8Array([0, 0, 0, 255]);
  for (const face of Object.keys(faces)) {
    gl.texImage2D(+face, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, stub);
  }

  // Загружаем каждую сторону
  await Promise.all(Object.entries(faces).map(async ([faceStr, url]) => {
    const face = +faceStr as GLenum;
    const img = new Image();
    img.src = url;
    await img.decode();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);
    gl.texImage2D(face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  }));
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex); // 🔁 обязательно перед параметрами
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

  gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
  return tex;
}
