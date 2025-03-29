import {
	useRef,
	useEffect,
	useImperativeHandle,
	useCallback,
	type Ref,
	useMemo,
} from "react";
import { WebGLService, type DitherOptions } from "@/lib/webgl-service";

// Export interface to allow parent components to access canvas operations
export interface DitherCanvasRef {
	getImageDataURL: () => string | null;
	renderFrame: (
		directOptions?: DitherOptions,
		directImage?: HTMLImageElement,
	) => Promise<void>;
}

export const DitherCanvas = ({
	image,
	options,
	onProcessComplete,
	ref,
}: {
	image: HTMLImageElement | null;
	options: DitherOptions;
	onProcessComplete?: (success: boolean) => void;
	ref: Ref<DitherCanvasRef>;
}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const webglServiceRef = useRef<WebGLService | null>(null);
	const offscreenCanvasRef = useRef<OffscreenCanvas | null>(null);
	const offscreenSupported = useMemo(() => {
		return typeof OffscreenCanvas !== "undefined" && !!window.OffscreenCanvas;
	}, []);

	// Process image with selected dithering options
	// Uses requestAnimationFrame to avoid multiple quick renders
	const renderFrame = useCallback(
		async (directOptions?: DitherOptions, directImage?: HTMLImageElement) => {
			if (!webglServiceRef.current) return;
			const localImage = directImage || image;
			if (!localImage) return;

			let success = false;

			// Use OffscreenCanvas for rendering if supported
			if (
				offscreenSupported &&
				offscreenCanvasRef.current &&
				canvasRef.current
			) {
				success = await webglServiceRef.current.ditherImage(
					localImage,
					directOptions || options,
				);

				// Copy the result from offscreen canvas to visible canvas
				if (success) {
					const visibleContext = canvasRef.current.getContext("2d");
					if (visibleContext) {
						// ImageBitmap is more efficient for copying between canvases
						offscreenCanvasRef.current
							.convertToBlob()
							.then((blob) => createImageBitmap(blob))
							.then((imageBitmap) => {
								// biome-ignore lint/style/noNonNullAssertion: <explanation>
								canvasRef.current!.width = localImage.width;
								// biome-ignore lint/style/noNonNullAssertion: <explanation>
								canvasRef.current!.height = localImage.height;

								visibleContext.clearRect(
									0,
									0,
									canvasRef.current?.width as number,
									canvasRef.current?.height as number,
								);
								visibleContext.drawImage(
									imageBitmap,
									0,
									0,
									imageBitmap.width,
									imageBitmap.height,
									0,
									0,
									localImage.width,
									localImage.height,
								);
								imageBitmap.close(); // Release resources
							});
					}
				}
			} else if (canvasRef.current) {
				success = await webglServiceRef.current.ditherImage(
					localImage,
					directOptions || options,
				);
				if (success) {
					const currentCanvas = webglServiceRef.current.getCanvas();
					if (currentCanvas && canvasRef.current) {
						const tempCanvas = document.createElement("canvas");
						tempCanvas.width = currentCanvas.width;
						tempCanvas.height = currentCanvas.height;
						const tempCtx = tempCanvas.getContext("2d");

						if (tempCtx) {
							tempCtx.drawImage(canvasRef.current, 0, 0);
							canvasRef.current.width = localImage.width;
							canvasRef.current.height = localImage.height;
							const ctx = canvasRef.current.getContext("2d");
							if (ctx) {
								ctx.clearRect(0, 0, localImage.width, localImage.height);
								ctx.drawImage(
									tempCanvas,
									0,
									0,
									tempCanvas.width,
									tempCanvas.height,
									0,
									0,
									localImage.width,
									localImage.height,
								);
							}
						}
					}
				}
			}

			// Scale canvas to fit container while maintaining aspect ratio
			if (containerRef.current && canvasRef.current && success) {
				const containerWidth = containerRef.current.clientWidth;
				const containerHeight = containerRef.current.clientHeight;
				const originalWidth = localImage.width;
				const originalHeight = localImage.height;
				const scaleX = containerWidth / originalWidth;
				const scaleY = containerHeight / originalHeight;
				const scale = Math.min(scaleX, scaleY);
				canvasRef.current.style.width = `${originalWidth * scale}px`;
				canvasRef.current.style.height = `${originalHeight * scale}px`;
				canvasRef.current.style.display = "block";
				canvasRef.current.style.margin = "auto";
			}

			// Notify parent of processing completion
			if (onProcessComplete) {
				onProcessComplete(success);
			}
		},
		[image, options, onProcessComplete, offscreenSupported],
	);

	// Expose canvas data URL method to parent via ref
	useImperativeHandle(
		ref,
		() => ({
			getImageDataURL: () => {
				if (!canvasRef.current) return null;
				return canvasRef.current.toDataURL("image/png");
			},
			renderFrame: renderFrame,
		}),
		[renderFrame],
	);

	// Initialize WebGL service once on mount
	useEffect(() => {
		const webglService = new WebGLService();
		webglServiceRef.current = webglService;

		if (offscreenSupported) {
			// Create an offscreen canvas for better performance
			offscreenCanvasRef.current = new OffscreenCanvas(1, 1); // Initial size, will be resized
			const success = webglService.setupWebGL(offscreenCanvasRef.current);
			console.log(
				"WebGL setup on OffscreenCanvas:",
				success ? "success" : "failed",
			);
		} else if (canvasRef.current) {
			// Fall back to visible canvas
			const success = webglService.setupWebGL(canvasRef.current);
			console.log("WebGL setup on Canvas:", success ? "success" : "failed");
		}

		return () => {
			webglServiceRef.current = null;
			offscreenCanvasRef.current = null;
		};
	}, [offscreenSupported]);

	// Update canvas size when image changes
	useEffect(() => {
		if (!image) return;

		// Set size of both canvases to match image
		if (canvasRef.current) {
			canvasRef.current.width = image.width;
			canvasRef.current.height = image.height;
		}

		if (offscreenSupported && offscreenCanvasRef.current) {
			offscreenCanvasRef.current.width = image.width;
			offscreenCanvasRef.current.height = image.height;
		}
	}, [image, offscreenSupported]);
	return (
		<div
			ref={containerRef}
			className="relative w-full h-full bg-muted rounded-md overflow-hidden flex items-center justify-center"
		>
			<canvas
				ref={canvasRef}
				className="border border-border object-contain"
				style={{ maxWidth: "100%", maxHeight: "100%" }}
			/>
			{!image && (
				<div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
					Select an image to apply dithering effects
				</div>
			)}
		</div>
	);
};
