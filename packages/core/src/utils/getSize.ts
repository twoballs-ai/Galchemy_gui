interface SizeOptions {
  size?: number | [number, number] | { w: number, h: number };
  w?: number;
  h?: number;
  width?: number;
  height?: number;
  minSize?: number | [number, number];
  maxSize?: number | [number, number];
}
export function getSize(opts: SizeOptions = {}, isRandom = false) {
    // 1) FIXED через size
    if (opts.size != null) {
      if (Array.isArray(opts.size))         return opts.size;
      if (typeof opts.size === 'number')    return [opts.size, opts.size];
      if (typeof opts.size === 'object')    return [opts.size.w, opts.size.h];
    }
  
    // 2) FIXED через w/h или width/height
    const W = opts.w ?? opts.width;
    const H = opts.h ?? opts.height;
    if (W != null || H != null) {
      // если один из них задан, другой тоже должен быть
      const w = W != null ? W : H;
      const h = H != null ? H : W;
      return [w, h];
    }
  
    // 3) RANDOM через minSize / maxSize
    if (opts.minSize != null || opts.maxSize != null) {
      const [minW, minH] = Array.isArray(opts.minSize)
        ? opts.minSize
        : typeof opts.minSize === 'number'
          ? [opts.minSize, opts.minSize]
          : [32, 32];
      const [maxW, maxH] = Array.isArray(opts.maxSize)
        ? opts.maxSize
        : typeof opts.maxSize === 'number'
          ? [opts.maxSize, opts.maxSize]
          : [minW, minH];
      const w = minW + Math.random() * (maxW - minW);
      const h = minH + Math.random() * (maxH - minH);
      return [w, h];
    }
  
    console.warn('⚠️ getSize: size, w+h or minSize/maxSize не указаны — fallback 32×32');
    return [32, 32];
  }
  