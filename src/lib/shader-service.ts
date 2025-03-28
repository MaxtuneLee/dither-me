/**
 * WebGL Shader utilities for creating and managing shaders
 */

/**
 * Create a WebGL shader from source code
 * 
 * @param gl The WebGL rendering context
 * @param type The type of shader (VERTEX_SHADER or FRAGMENT_SHADER)
 * @param source The shader source code
 * @returns The compiled shader or null if compilation failed
 */
export function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) {
    console.error("Failed to create shader");
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(
      "Failed to compile shader:",
      gl.getShaderInfoLog(shader)
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

/**
 * Create a WebGL program from vertex and fragment shaders
 * 
 * @param gl The WebGL rendering context
 * @param vertexShader The compiled vertex shader
 * @param fragmentShader The compiled fragment shader
 * @returns The linked WebGL program or null if linking failed
 */
export function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) {
    console.error("Failed to create WebGL program");
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(
      "Failed to link WebGL program:",
      gl.getProgramInfoLog(program)
    );
    return null;
  }

  return program;
}

/**
 * Get the default vertex shader source for a fullscreen quad
 * @returns The vertex shader source code
 */
export function getDefaultVertexShaderSource(): string {
  return `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;
}