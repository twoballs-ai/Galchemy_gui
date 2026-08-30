// Загружает Image → создаёт WebGL-текстуру.
// Текстура <- Image.onload, поэтому можно создавать заранее.
export async function loadTexture(gl: WebGL2RenderingContext, url: string): Promise<WebGLTexture> {
    const tex = gl.createTexture();
    if (!tex) {
        throw new Error("Failed to create texture");
    }

    gl.bindTexture(gl.TEXTURE_2D, tex);
    // 1×1 белый пиксель — заглушка до загрузки картинки
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
                  1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                  new Uint8Array([255, 255, 255, 255]));

    const img = new Image();
    img.src = url;
    await img.decode(); // Ждём загрузку
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
                  gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    return tex;
}
