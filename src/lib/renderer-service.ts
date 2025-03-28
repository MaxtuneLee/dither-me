/**
 * Service for handling different dithering rendering methods
 */
import type { DitherOptions } from "./types";

/**
 * Processes Floyd-Steinberg dithering on GPU in two passes
 * - First pass: Calculate quantized colors and errors
 * - Second pass: Apply error diffusion
 */
export function renderFloydSteinberg(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  texture: WebGLTexture,
  errorTexture: WebGLTexture,
  width: number,
  height: number
): boolean {
  try {
    // Initialize error texture to store quantization errors
    gl.bindTexture(gl.TEXTURE_2D, errorTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.FLOAT,
      null
    );

    // Get shader uniform locations
    const passIndexLocation = gl.getUniformLocation(program, "u_passIndex");
    const imageLocation = gl.getUniformLocation(program, "u_image");
    const errorTextureLocation = gl.getUniformLocation(program, "u_errorTexture");

    // First pass - Calculate colors and errors without diffusion
    gl.uniform1i(passIndexLocation, 0);

    // Bind main image texture to texture unit 0
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(imageLocation, 0);

    // Bind error texture to texture unit 1
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, errorTexture);
    gl.uniform1i(errorTextureLocation, 1);

    // Render to main canvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Second pass - Apply accumulated error diffusion
    gl.uniform1i(passIndexLocation, 1);

    // Rebind textures to ensure correct state
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, errorTexture);

    // Render final result to canvas
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    return true;
  } catch (error) {
    console.error("Error applying Floyd-Steinberg on GPU:", error);
    return false;
  }
}

/**
 * Renders simpler dithering types (Bayer or Ordered)
 * These algorithms can be processed in a single pass
 */
export function renderStandardDither(
  gl: WebGLRenderingContext
): boolean {
  try {
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return true;
  } catch (error) {
    console.error("Error applying standard dither:", error);
    return false;
  }
}

/**
 * Sets up all shader uniforms required for dithering effects
 * Manages image textures, palette textures and all dither parameters
 */
export function setupShaderUniforms(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  image: HTMLImageElement,
  options: DitherOptions,
  paletteTexture: WebGLTexture | null
): void {
  // Set main image texture (always uses texture unit 0)
  gl.activeTexture(gl.TEXTURE0);
  const imageLocation = gl.getUniformLocation(program, "u_image");
  gl.uniform1i(imageLocation, 0);
  
  // Set image resolution for proper pixel calculations
  const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  gl.uniform2f(resolutionLocation, image.width, image.height);
  
  // Configure dithering parameters
  const ditherAmountLocation = gl.getUniformLocation(program, "u_ditherAmount");
  gl.uniform1f(ditherAmountLocation, options.ditherAmount);
  
  const ditherTypeLocation = gl.getUniformLocation(program, "u_ditherType");
  gl.uniform1i(ditherTypeLocation, options.ditherType);
  
  // Set Bayer matrix size (2x2, 4x4, or 8x8)
  const bayerSizeLocation = gl.getUniformLocation(program, "u_bayerSize");
  gl.uniform1i(bayerSizeLocation, options.bayerSize ?? 1);
  
  // Set image preprocessing options for tone adjustment
  const contrastLocation = gl.getUniformLocation(program, "u_contrast");
  gl.uniform1f(contrastLocation, options.contrast ?? 0.0);
  
  const highlightsLocation = gl.getUniformLocation(program, "u_highlights");
  gl.uniform1f(highlightsLocation, options.highlights ?? 0.0);
  
  const midtonesLocation = gl.getUniformLocation(program, "u_midtones");
  gl.uniform1f(midtonesLocation, options.midtones ?? 0.0);
  
  const brightnessLocation = gl.getUniformLocation(program, "u_brightness");
  gl.uniform1f(brightnessLocation, options.brightness ?? 0.5);
  
  // Set pixel step for proper sampling
  const pixelStepLocation = gl.getUniformLocation(program, "u_pixelStep");
  gl.uniform2f(pixelStepLocation, 1.0 / image.width, 1.0 / image.height);
  
  // Configure palette options
  const usePaletteLocation = gl.getUniformLocation(program, "u_usePalette");
  gl.uniform1i(usePaletteLocation, options.usePalette ? 1 : 0);
  
  if (paletteTexture) {
    // Set palette texture on texture unit 2 (units 0 and 1 are used by main and error textures)
    const paletteLocation = gl.getUniformLocation(program, "u_palette");
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
    gl.uniform1i(paletteLocation, 2);
    
    // Reset to texture unit 0 as other operations expect this to be active
    gl.activeTexture(gl.TEXTURE0);
  }
}