// WGSL шейдеры для WebGPU рендеринга

export const defaultShaderWGSL = `
struct Uniforms {
  modelMatrix : mat4x4<f32>,
  viewMatrix : mat4x4<f32>,
  projectionMatrix : mat4x4<f32>,
  normalMatrix : mat3x3<f32>,
  lightVP : mat4x4<f32>,
  viewPos : vec3<f32>,
  specularColor : vec3<f32>,
  shininess : f32,
  lightCount : u32,
  padding : vec3<f32>,
};

struct LightData {
  positions : array<vec3<f32>, 16>,
  colors : array<vec3<f32>, 16>,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var<uniform> lights : LightData;
@group(0) @binding(2) var uTexture : texture_2d<f32>;
@group(0) @binding(3) var uSampler : sampler;
@group(0) @binding(4) var uShadowTex : texture_depth_2d;

struct VertexInput {
  @location(0) position : vec3<f32>,
  @location(1) normal : vec3<f32>,
  @location(2) texCoord : vec2<f32>,
};

struct VertexOutput {
  @builtin(position) gl_Position : vec4<f32>,
  @location(0) vNormal : vec3<f32>,
  @location(1) vFragPos : vec3<f32>,
  @location(2) vTexCoord : vec2<f32>,
  @location(3) vShadowPos : vec4<f32>,
};

@vertex
fn vs_main(input : VertexInput) -> VertexOutput {
  var output : VertexOutput;
  
  let worldPos = uniforms.modelMatrix * vec4<f32>(input.position, 1.0);
  output.vFragPos = worldPos.xyz;
  output.vNormal = normalize(uniforms.normalMatrix * input.normal);
  output.vTexCoord = input.texCoord;
  output.vShadowPos = uniforms.lightVP * worldPos;
  output.gl_Position = uniforms.projectionMatrix * uniforms.viewMatrix * worldPos;
  
  return output;
}

@fragment
fn fs_main(input : VertexOutput) -> @location(0) vec4<f32> {
  let norm = normalize(input.vNormal);
  let viewDir = normalize(uniforms.viewPos - input.vFragPos);
  
  // Texture sampling
  var texColor = textureSample(uTexture, uSampler, input.vTexCoord);
  
  // Shadow calculation
  var visibility : f32 = 1.0;
  let projCoords = input.vShadowPos.xyz / input.vShadowPos.w;
  let coords = projCoords * 0.5 + 0.5;
  
  if (coords.x >= 0.0 && coords.x <= 1.0 && coords.y >= 0.0 && coords.y <= 1.0) {
    let closestDepth = textureSampleCompare(uShadowTex, uSampler, coords.xy, coords.z);
    let currentDepth = coords.z;
    let bias = 0.005;
    
    if (currentDepth - bias > closestDepth) {
      visibility = 0.4;
    }
  }
  
  // Lighting calculation
  let ambient : vec3<f32> = vec3<f32>(0.1);
  var diffuse : vec3<f32> = vec3<f32>(0.0);
  var specular : vec3<f32> = vec3<f32>(0.0);
  
  for (var i : u32 = 0; i < uniforms.lightCount && i < 16u; i = i + 1u) {
    let lightDir = normalize(lights.positions[i] - input.vFragPos);
    let diff = max(dot(norm, lightDir), 0.0);
    
    let reflectDir = reflect(-lightDir, norm);
    let spec = pow(max(dot(viewDir, reflectDir), 0.0), uniforms.shininess);
    
    diffuse = diffuse + diff * lights.colors[i];
    specular = specular + spec * uniforms.specularColor * lights.colors[i];
  }
  
  let finalColor = (ambient + visibility * diffuse) * texColor.rgb + visibility * specular;
  
  return vec4<f32>(finalColor, texColor.a);
}
`;

export const plainShaderWGSL = `
struct Uniforms {
  modelMatrix : mat4x4<f32>,
  viewMatrix : mat4x4<f32>,
  projectionMatrix : mat4x4<f32>,
  color : vec4<f32>,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VertexInput {
  @location(0) position : vec3<f32>,
};

struct VertexOutput {
  @builtin(position) gl_Position : vec4<f32>,
};

@vertex
fn vs_main(input : VertexInput) -> VertexOutput {
  var output : VertexOutput;
  output.gl_Position = uniforms.projectionMatrix * uniforms.viewMatrix * uniforms.modelMatrix * vec4<f32>(input.position, 1.0);
  return output;
}

@fragment
fn fs_main() -> @location(0) vec4<f32> {
  return uniforms.color;
}
`;

export const skyboxShaderWGSL = `
struct Uniforms {
  projectionMatrix : mat4x4<f32>,
  viewNoTrans : mat4x4<f32>,
};

@group(0) @binding(0) var uSkyCube : texture_cube<f32>;
@group(0) @binding(1) var uSampler : sampler;
@group(0) @binding(2) var<uniform> uniforms : Uniforms;

struct VertexInput {
  @location(0) position : vec3<f32>,
};

struct VertexOutput {
  @builtin(position) gl_Position : vec4<f32>,
  @location(0) vDir : vec3<f32>,
};

@vertex
fn vs_main(input : VertexInput) -> VertexOutput {
  var output : VertexOutput;
  let rotatedDir = (uniforms.viewNoTrans * vec4<f32>(input.position, 0.0)).xyz;
  output.vDir = rotatedDir;
  output.gl_Position = uniforms.projectionMatrix * vec4<f32>(input.position * 1000.0, 1.0);
  return output;
}

@fragment
fn fs_main(input : VertexOutput) -> @location(0) vec4<f32> {
  return textureSample(uSkyCube, uSampler, normalize(input.vDir));
}
`;

export const spriteShaderWGSL = `
struct Uniforms {
  modelMatrix : mat4x4<f32>,
  projectionMatrix : mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var uTexture : texture_2d<f32>;
@group(0) @binding(2) var uSampler : sampler;

struct VertexInput {
  @location(0) position : vec2<f32>,
  @location(1) uv : vec2<f32>,
};

struct VertexOutput {
  @builtin(position) gl_Position : vec4<f32>,
  @location(0) vUV : vec2<f32>,
};

@vertex
fn vs_main(input : VertexInput) -> VertexOutput {
  var output : VertexOutput;
  output.vUV = input.uv;
  output.gl_Position = uniforms.projectionMatrix * uniforms.modelMatrix * vec4<f32>(input.position, 0.0, 1.0);
  return output;
}

@fragment
fn fs_main(input : VertexOutput) -> @location(0) vec4<f32> {
  return textureSample(uTexture, uSampler, input.vUV);
}
`;
