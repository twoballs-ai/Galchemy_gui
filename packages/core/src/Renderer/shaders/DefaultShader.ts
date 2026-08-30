export const vertexShaderSrc = `#version 300 es
precision highp float;

in vec3 aVertexPosition;
in vec3 aVertexNormal;
in vec2 aTexCoord;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
uniform mat4 uLightVP;
uniform mat3 uNormalMatrix;

out vec4 vShadowPos;
out vec3 vNormal;
out vec3 vFragPos;
out vec2 vTexCoord;

void main() {
  vec4 worldPos = uModel * vec4(aVertexPosition, 1.0);
  vFragPos      = worldPos.xyz;
  vNormal       = normalize(uNormalMatrix * aVertexNormal);
  vTexCoord     = aTexCoord;
  vShadowPos    = uLightVP * worldPos;
  gl_Position   = uProjection * uView * worldPos;
}
`;

export const fragmentShaderSrc = `#version 300 es
precision highp float;

#define MAX_LIGHTS 16

in vec3 vNormal;
in vec3 vFragPos;
in vec2 vTexCoord;
in vec4 vShadowPos;

uniform sampler2D uTexture;
uniform bool uUseTexture;
uniform sampler2D uShadowTex;

uniform vec3  uViewPos;
uniform vec3  uSpecularColor;
uniform float uShininess;

uniform int uLightCount;
uniform vec3 uLightPositions[MAX_LIGHTS];
uniform vec3 uLightColors[MAX_LIGHTS];

out vec4 fragColor;

void main() {
  vec3 norm = normalize(vNormal);
  vec3 viewDir = normalize(uViewPos - vFragPos);

  vec4 texColor = uUseTexture
                  ? texture(uTexture, vTexCoord)
                  : vec4(1.0);

  // --------- SHADOW ---------
  float visibility = 1.0;
  vec3 projCoords = vShadowPos.xyz / vShadowPos.w;
  projCoords = projCoords * 0.5 + 0.5;

  float closestDepth = texture(uShadowTex, projCoords.xy).r;
  float currentDepth = projCoords.z;

  float bias = 0.005;  // упрощенный bias
  if (currentDepth - bias > closestDepth) {
    visibility = 0.4;
  }

  // --------- LIGHTING ---------
  vec3 ambient = vec3(0.1);
  vec3 diffuse = vec3(0.0);
  vec3 specular = vec3(0.0);

  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= uLightCount) break;

    vec3 lightDir = normalize(uLightPositions[i] - vFragPos);
    float diff = max(dot(norm, lightDir), 0.0);

    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), uShininess);

    diffuse  += diff * uLightColors[i];
    specular += spec * uSpecularColor * uLightColors[i];
  }

  vec3 finalColor = (ambient + visibility * diffuse) * texColor.rgb
                  + visibility * specular;

  fragColor = vec4(finalColor, texColor.a);
}
`;
