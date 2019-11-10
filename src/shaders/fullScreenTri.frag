precision highp float;
uniform sampler2D uScene;
uniform vec2 uResolution;
uniform float uTime;

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    vec4 color = texture2D(uScene, uv);

    // wavy line
    // float x = uv.x;
    // float m = sin(x * 8.0 + uTime) * 0.3;
    // uv.y -= m;
    // float line = smoothstep(0.4, 0.5, uv.y) * smoothstep(0.6, 0.5, uv.y);
    // color = mix(color, vec4(1.0), line);
    
    gl_FragColor = vec4(color);
}