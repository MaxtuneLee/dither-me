/**
 * Image processing utilities for dithering operations
 */

/**
 * Check if OffscreenCanvas is supported in the current browser
 */
const isOffscreenCanvasSupported = (): boolean => {
	return typeof OffscreenCanvas !== "undefined";
};

/**
 * Downsample an image by a specific factor
 * Uses OffscreenCanvas when available for better performance
 *
 * @param image The source image to downsample
 * @param factor The downsampling factor (e.g. 2 for half size)
 * @returns A Promise resolving to a downsampled image
 */
export async function downSampleImage(
	image: HTMLImageElement,
	factor: number,
): Promise<HTMLImageElement> {
	const newWidth = Math.floor(image.width / factor);
	const newHeight = Math.floor(image.height / factor);

	// Use OffscreenCanvas if supported for better performance
	if (isOffscreenCanvasSupported()) {
		// Create an offscreen canvas for rendering outside the main thread
		const offscreenCanvas = new OffscreenCanvas(newWidth, newHeight);
		const offCtx = offscreenCanvas.getContext("2d");

		if (offCtx) {
			// Configure image smoothing for better quality
			offCtx.imageSmoothingEnabled = true;
			offCtx.imageSmoothingQuality = "high";

			// Draw the downsampled image
			offCtx.drawImage(image, 0, 0, newWidth, newHeight);

			try {
				// Convert to blob and create new image asynchronously
				const blob = await offscreenCanvas.convertToBlob({
					type: "image/png",
					quality: 1,
				});

				// Create and fully load a new image from the blob
				return await new Promise((resolve, reject) => {
					const newImage = new Image();
					newImage.onload = () => resolve(newImage);
					newImage.onerror = (e) =>
						reject(new Error(`Failed to load downsampled image: ${e}`));
					newImage.src = URL.createObjectURL(blob);
				});
			} catch (err) {
				console.error("Error creating blob from OffscreenCanvas:", err);
				// Fall back to synchronous method if async fails
			}
		}
	}

	// Fallback to standard Canvas API if OffscreenCanvas is not supported
	const canvas = document.createElement("canvas");
	canvas.width = newWidth;
	canvas.height = newHeight;

	const ctx = canvas.getContext("2d");
	if (!ctx) {
		console.error("Failed to get 2D context for downsampling");
		return image; // Return the original image if downsampling failed
	}

	// Configure image smoothing for better quality
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = "high";

	// Draw the downsampled image
	ctx.drawImage(image, 0, 0, newWidth, newHeight);

	// Create and fully load a new image from the canvas
	return await new Promise((resolve, reject) => {
		const newImage = new Image();
		newImage.onload = () => resolve(newImage);
		newImage.onerror = (e) =>
			reject(new Error(`Failed to load downsampled image: ${e}`));
		newImage.src = canvas.toDataURL("image/png");
	});
}
