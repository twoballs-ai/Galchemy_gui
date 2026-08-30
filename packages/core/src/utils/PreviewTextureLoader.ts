// src/utils/PreviewTextureLoader.ts
import { MaterialMeta } from "../Renderer/MaterialPreviewRenderer";

// Возвращает объект, умеющий привязывать нужные текстуры в шейдере
export interface MaterialTextures {
  bind: (gl: WebGL2RenderingContext, program: WebGLProgram) => void;
}

async function loadTexture(
  gl: WebGL2RenderingContext,
  url?: string,
  fallbackColor: [number, number, number, number] = [255, 255, 255, 255]
) {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);

  // 1×1 fallback
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array(fallbackColor)
  );

  if (url) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    await img.decode();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
  }

  return tex;
}

export async function loadMaterialTextures(
  gl: WebGL2RenderingContext,
  meta: MaterialMeta
): Promise<MaterialTextures> {
  // Если meta нет или у meta нет colorMap – возвращаем «пустой» материал
  if (!meta || !meta.colorMap) {
    console.warn("loadMaterialTextures: пропущен материал без colorMap:", meta);
    const dummyTex = await loadTexture(gl, undefined);
    return {
      bind(gl: WebGL2RenderingContext, program: WebGLProgram) {
        // Просто бандим одну и ту же dummy-текстуру на все слоты
        for (let i = 0; i < 4; i++) {
          gl.activeTexture(gl.TEXTURE0 + i);
          gl.bindTexture(gl.TEXTURE_2D, dummyTex);
        }
      }
    };
  }

  // Если colorMap есть – грузим «настоящие» карты
  const colorMap     = await loadTexture(gl, meta.colorMap,     [200,200,200,255]);
  const normalMap    = await loadTexture(gl, meta.normalMap,    [127,127,255,255]);
  const roughnessMap = await loadTexture(gl, meta.roughnessMap, [200,200,200,255]);
  const metalnessMap = await loadTexture(gl, meta.metalnessMap, [0,0,0,255]);

  return {
    bind(gl: WebGL2RenderingContext, program: WebGLProgram) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, colorMap);
      gl.uniform1i(gl.getUniformLocation(program, "uColorMap"), 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, normalMap);
      gl.uniform1i(gl.getUniformLocation(program, "uNormalMap"), 1);

      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, roughnessMap);
      gl.uniform1i(gl.getUniformLocation(program, "uRoughnessMap"), 2);

      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, metalnessMap);
      gl.uniform1i(gl.getUniformLocation(program, "uMetalnessMap"), 3);
    }
  };
}
