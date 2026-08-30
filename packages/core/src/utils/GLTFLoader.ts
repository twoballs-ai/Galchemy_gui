import { buildGameObjectFromGLB } from "./buildGameObjectFromGLB";

export async function loadGLB(url: string): Promise<{ json: any; binary: ArrayBuffer | null }> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const data = parseGLB(arrayBuffer);
  return data;
}

/** ✨ Единая точка: построить сразу GameObject(-ы) */
export async function importGLB(
  gl: WebGL2RenderingContext,
  url: string,
  opts: { position?: [number, number, number]; name?: string; assetId?: string } = {}
) {
  const { json, binary } = await loadGLB(url);
  return buildGameObjectFromGLB(gl, json as GLTF, binary!, opts);
}

function parseGLB(buffer: ArrayBuffer): { json: any; binary: ArrayBuffer | null } {
  const dataView = new DataView(buffer);

  // GLB Header (12 bytes)
  const magic = dataView.getUint32(0, true);
  const version = dataView.getUint32(4, true);
  const length = dataView.getUint32(8, true);

  if (magic !== 0x46546C67) throw new Error("Invalid glTF binary format");

  let offset = 12;
  const chunks: { type: "JSON" | "BIN"; data: ArrayBuffer }[] = [];

  while (offset < length) {
    const chunkLength = dataView.getUint32(offset, true);
    const chunkType = dataView.getUint32(offset + 4, true);
    const chunkData = buffer.slice(offset + 8, offset + 8 + chunkLength);

    chunks.push({
      type: chunkType === 0x4E4F534A ? "JSON" : "BIN",
      data: chunkData
    });

    offset += 8 + chunkLength;
  }

  const jsonChunkEntry = chunks.find(c => c.type === "JSON");
  if (!jsonChunkEntry) {
    throw new Error("Missing JSON chunk in GLB file");
  }
  const jsonChunk = JSON.parse(new TextDecoder().decode(jsonChunkEntry.data));

  const binChunkEntry = chunks.find(c => c.type === "BIN");
  const binChunk = binChunkEntry ? binChunkEntry.data : null;

  return {
    json: jsonChunk,
    binary: binChunk
  };
}
