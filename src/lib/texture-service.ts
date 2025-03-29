/**
 * WebGL Texture utilities for creating and managing textures
 */

/**
 * Create and configure a WebGL texture for the main image
 *
 * @param gl The WebGL rendering context
 * @returns The created texture object or null if creation failed
 */
export function createMainTexture(
	gl: WebGLRenderingContext,
): WebGLTexture | null {
	const texture = gl.createTexture();
	if (!texture) return null;

	gl.bindTexture(gl.TEXTURE_2D, texture);

	// Set texture parameters
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

	return texture;
}

/**
 * Create and configure an error texture for Floyd-Steinberg dithering
 *
 * @param gl The WebGL rendering context
 * @returns The created texture object or null if creation failed
 */
export function createErrorTexture(
	gl: WebGLRenderingContext,
): WebGLTexture | null {
	const texture = gl.createTexture();
	if (!texture) return null;

	gl.bindTexture(gl.TEXTURE_2D, texture);

	// Set texture parameters
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

	return texture;
}

/**
 * Load an image into a WebGL texture
 *
 * @param gl The WebGL rendering context
 * @param texture The texture to load the image into
 * @param image The HTMLImageElement to load
 */
export function loadImageTexture(
	gl: WebGLRenderingContext,
	texture: WebGLTexture,
	image: HTMLImageElement,
): void {
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // Ensure correct orientation
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
}

/**
 * Set up texture data for Floyd-Steinberg error diffusion
 *
 * @param gl The WebGL rendering context
 * @param texture The error texture
 * @param width The width of the texture
 * @param height The height of the texture
 */
export function setupErrorTexture(
	gl: WebGLRenderingContext,
	texture: WebGLTexture,
	width: number,
	height: number,
): void {
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(
		gl.TEXTURE_2D,
		0,
		gl.RGBA,
		width,
		height,
		0,
		gl.RGBA,
		gl.FLOAT,
		null,
	);
}
