/**
 * Создаёт WebGL-текстуру из строки текста.
 *  – OffscreenCanvas используется только как генератор bitmap'а.
 *  – Если текст повторно совпал по содержимому и шрифту, отдаётся
 *    кэшированная текстура.
 */
export class TextTexture {
    /** static cache = Map<key, {tex,w,h}> */
    static _cache = new Map();
  
    /**
     * @param {WebGLRenderingContext} gl
     * @param {string} text
     * @param {string} font  – CSS-font, напр. '18px Arial'
     * @param {string} color – '#fff' | 'rgb(255,255,255)'
     * @returns {{ texture: WebGLTexture, width:number, height:number }}
     */
    static create(gl, text, font = '18px Arial', color = '#fff') {
      const key = `${font}|${color}|${text}`;
      if (this._cache.has(key)) return this._cache.get(key);
  
      /* 1) рисуем строку во временный OffscreenCanvas */
      const can  = new OffscreenCanvas(1, 1);
      const ctx2 = can.getContext('2d');
      ctx2.font = font;
      const w = ctx2.measureText(text).width;
      const h = parseInt(font, 10) * 1.25;
      can.width  = w;           // пере-создаём с нужным размером
      can.height = h;
      ctx2.font      = font;
      ctx2.fillStyle = color;
      ctx2.textBaseline = 'top';
      ctx2.fillText(text, 0, 0);
  
      /* 2) заливаем bitmap в WebGL-текстуру */
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
                    gl.RGBA, gl.UNSIGNED_BYTE, can);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                       gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  
      const entry = { texture: tex, width: w, height: h };
      this._cache.set(key, entry);
      return entry;
    }
  }
  