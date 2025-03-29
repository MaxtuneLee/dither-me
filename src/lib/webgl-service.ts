/**
 * WebGL Service for dithering operations
 */
import ditherFragmentShaderRaw from "../shaders/dither.glsl?raw";
import type { DitherOptions } from "./types";
import {
	createShader,
	createProgram,
	getDefaultVertexShaderSource,
} from "./shader-service";
import {
	createMainTexture,
	createErrorTexture,
	loadImageTexture,
} from "./texture-service";
import { downSampleImage } from "./image-utils";
import {
	renderFloydSteinberg,
	renderStandardDither,
	setupShaderUniforms,
} from "./renderer-service";
import {
	createPaletteTexture,
	getPaletteColors,
	updatePaletteTexture,
} from "./palette-service";

export * from "./types";

// Type definition that accepts both HTMLCanvasElement and OffscreenCanvas
type SupportedCanvas = HTMLCanvasElement | OffscreenCanvas;

/**
 * Main WebGL service responsible for coordinating dithering operations
 */
export class WebGLService {
	private gl: WebGL2RenderingContext | WebGLRenderingContext | null = null;
	private program: WebGLProgram | null = null;
	private texture: WebGLTexture | null = null;
	private errorTexture: WebGLTexture | null = null;
	private paletteTexture: WebGLTexture | null = null;
	private canvas: SupportedCanvas | null = null;
	private lastPaletteOptions = ""; // Used to track palette changes
	private isOffscreenCanvas = false;

	/**
	 * Initialize WebGL context and resources
	 * Creates shader program, textures and buffers needed for dithering
	 */
	setupWebGL(canvas: SupportedCanvas): boolean {
		try {
			this.canvas = canvas;
			this.isOffscreenCanvas = !(canvas instanceof HTMLCanvasElement);

			// Get WebGL context with preserved drawing buffer (needed for image downloads)
			// Note: typecasting is necessary because TypeScript doesn't recognize common methods
			this.gl =
				(canvas.getContext("webgl2", {
					preserveDrawingBuffer: true,
				}) as WebGL2RenderingContext) ||
				(canvas.getContext("webgl", {
					preserveDrawingBuffer: true,
				}) as WebGLRenderingContext);

			if (!this.gl) {
				console.error("WebGL not supported");
				return false;
			}

			// Create shaders
			const vertexShader = createShader(
				this.gl,
				this.gl.VERTEX_SHADER,
				getDefaultVertexShaderSource(),
			);
			const fragmentShader = createShader(
				this.gl,
				this.gl.FRAGMENT_SHADER,
				ditherFragmentShaderRaw,
			);

			if (!vertexShader || !fragmentShader) {
				return false;
			}

			// Create and link program
			this.program = createProgram(this.gl, vertexShader, fragmentShader);
			if (!this.program) {
				return false;
			}

			this.gl.useProgram(this.program);

			// Setup vertex position buffer
			this.setupPositionBuffer();

			// Create textures
			this.texture = createMainTexture(this.gl);
			this.errorTexture = createErrorTexture(this.gl);

			// Create palette texture (initially empty)
			this.paletteTexture = createPaletteTexture(this.gl, [
				"#000000",
				"#FFFFFF",
			]);

			return true;
		} catch (error) {
			console.error("Error setting up WebGL:", error);
			return false;
		}
	}

	/**
	 * Apply dither effect to an image
	 * Handles downsampling, texture loading, and different dithering algorithms
	 * @returns Promise that resolves to success status of the operation
	 */
	async ditherImage(
		image: HTMLImageElement,
		options: DitherOptions,
	): Promise<boolean> {
		if (!this.gl || !this.program || !this.canvas) return false;

		console.log("Processing image with dither type:", options.ditherType);

		// Apply downsampling if requested (improves performance for large images)
		let processedImage = image;
		const downSamplingFactor = options.downSampling || 1;
		if (downSamplingFactor > 1) {
			try {
				processedImage = await downSampleImage(image, downSamplingFactor);
				console.log(
					`Image downsampled by factor: ${downSamplingFactor}, new dimensions: ${processedImage.width}x${processedImage.height}`,
				);
			} catch (error) {
				console.error("Error during image downsampling:", error);
				// Fall back to original image if downsampling fails
				processedImage = image;
			}
		}

		try {
			// Use requestAnimationFrame to yield to browser UI thread
			await new Promise((resolve) => requestAnimationFrame(resolve));

			// Set canvas dimensions to match processed image
			// Works for both regular and offscreen canvas
			this.canvas.width = processedImage.width;
			this.canvas.height = processedImage.height;
			this.gl.viewport(0, 0, processedImage.width, processedImage.height);

			// Clear canvas
			this.gl.clearColor(0, 0, 0, 0);
			this.gl.clear(this.gl.COLOR_BUFFER_BIT);

			// Load image to texture
			if (this.texture) {
				this.gl.activeTexture(this.gl.TEXTURE0);
				loadImageTexture(this.gl, this.texture, processedImage);
			}

			// Ensure active texture unit is set correctly
			this.gl.activeTexture(this.gl.TEXTURE0);

			// Update palette texture if needed
			this.updatePaletteIfNeeded(options);

			// Set shader uniforms
			setupShaderUniforms(
				this.gl,
				this.program,
				processedImage,
				options,
				this.paletteTexture,
			);

			// Apply dither effect based on selected algorithm
			if (options.ditherType === 1) {
				// Floyd-Steinberg dithering
				return this.errorTexture
					? renderFloydSteinberg(
							this.gl,
							this.program,
							this.texture!,
							this.errorTexture,
							processedImage.width,
							processedImage.height,
						)
					: false;
			}
			// Ensure texture unit 0 is active and main texture is bound
			this.gl.activeTexture(this.gl.TEXTURE0);
			this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);

			// Other dithering methods (Bayer, Ordered)
			return renderStandardDither(this.gl);
		} catch (error) {
			console.error("Error applying dither effect:", error);
			return false;
		}
	}

	/**
	 * Update palette texture if options have changed
	 * Caches palette options to avoid unnecessary texture updates
	 */
	private updatePaletteIfNeeded(options: DitherOptions): void {
		if (!this.gl || !this.paletteTexture) return;

		// Create an identifier to check if palette options have changed
		const paletteOptionsKey = JSON.stringify({
			usePalette: options.usePalette,
			type: options.paletteType,
			colors: options.paletteColors,
			custom: options.customPalette,
			user: options.selectedUserPalette,
		});

		// Skip update if palette options haven't changed
		if (this.lastPaletteOptions === paletteOptionsKey) {
			return;
		}

		// Get selected palette colors
		const colors = getPaletteColors(options);

		// Update texture with palette colors or default to black/white if none
		if (colors.length) {
			updatePaletteTexture(this.gl, this.paletteTexture, colors);
		} else {
			updatePaletteTexture(this.gl, this.paletteTexture, [
				"#000000",
				"#FFFFFF",
			]);
		}

		// Update last palette options
		this.lastPaletteOptions = paletteOptionsKey;
	}

	/**
	 * Setup vertex position buffer for rendering a fullscreen quad
	 * Used as the geometry to render our dithered image
	 */
	private setupPositionBuffer(): void {
		if (!this.gl || !this.program) return;

		// Create vertex buffer
		const positionBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);

		// Set vertices for a full-screen quad
		// prettier-ignore
		const positions = [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0];
		this.gl.bufferData(
			this.gl.ARRAY_BUFFER,
			new Float32Array(positions),
			this.gl.STATIC_DRAW,
		);

		// Setup vertex attribute pointer
		const positionAttributeLocation = this.gl.getAttribLocation(
			this.program,
			"a_position",
		);
		this.gl.enableVertexAttribArray(positionAttributeLocation);
		this.gl.vertexAttribPointer(
			positionAttributeLocation,
			2,
			this.gl.FLOAT,
			false,
			0,
			0,
		);
	}

	/**
	 * Returns whether this service is using an OffscreenCanvas
	 */
	isUsingOffscreenCanvas(): boolean {
		return this.isOffscreenCanvas;
	}

	/**
	 * Gets the current canvas
	 */
	getCanvas(): SupportedCanvas | null {
		return this.canvas;
	}
}
