import { useState, useRef, useTransition } from "react";
import "./App.css";
import { DitherCanvas, type DitherCanvasRef } from "@/components/DitherCanvas";
import { ImageUpload } from "@/components/ImageUpload";
import { DitherControls } from "@/components/DitherControls";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import type { DitherOptions } from "@/lib/types";
import { DEFAULT_USER_PALETTES } from "@/lib/palette-service";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./components/ui/card";
import logo from "@/assets/logo.png";
import { SiGithub } from "@icons-pack/react-simple-icons";

function App() {
	const [image, setImage] = useState<HTMLImageElement | null>(null);
	const [processSuccess, setProcessSuccess] = useState<boolean>(false);
	const [options, setOptions] = useState<DitherOptions>({
		ditherAmount: 0.7,
		ditherType: 0, // Default to Bayer dithering
		bayerSize: 1, // Default to 4x4 Bayer matrix
		downSampling: 1, // Default to no downsampling
		contrast: 0,
		highlights: 0,
		midtones: 0,
		brightness: 0.5,
		// palette options
		usePalette: false,
		paletteType: 0,
		paletteColors: 2,
		customPalette: ["#000000", "#FFFFFF"],
		userPalettes: DEFAULT_USER_PALETTES,
		selectedUserPalette: DEFAULT_USER_PALETTES[0].id,
	});
	const [isCanvasPending, setCanvasRenderingTransition] = useTransition();

	// Reference to the DitherCanvas component for downloading
	const canvasRef = useRef<DitherCanvasRef>(null);

	// Handle image selection
	const handleImageLoaded = (newImage: HTMLImageElement) => {
		setImage(newImage);
		setProcessSuccess(false);

		// Set downsampling based on image size
		if (newImage.width > 2000 || newImage.height > 2000) {
			setOptions((prev) => ({
				...prev,
				downSampling: 2, // Set to 1/2 downsampling for large images
			}));
		}
		setCanvasRenderingTransition(async () => {
			if (canvasRef.current) {
				await canvasRef.current.renderFrame(undefined, newImage);
			}
		});
	};

	// Handle dithering option changes
	const handleOptionsChange = (newOptions: DitherOptions) => {
		setCanvasRenderingTransition(async () => {
			if (canvasRef.current) {
				await canvasRef.current.renderFrame(newOptions);
			}
			setCanvasRenderingTransition(() => {
				setOptions((prev) => ({
					...prev,
					...newOptions,
				}));
			});
		});
	};

	// Handle WebGL service reference
	const handleProcessComplete = (success: boolean) => {
		setProcessSuccess(success);
	};

	// Handle downloading the processed image
	const handleDownload = () => {
		if (!canvasRef.current) return;

		// Get the data URL from the canvas ref
		const dataUrl = canvasRef.current.getImageDataURL();
		if (dataUrl) {
			// Create temporary link and trigger download
			const link = document.createElement("a");
			link.download = "dithered-image.png";
			link.href = dataUrl;
			link.click();
		} else {
			console.error("Failed to get image data for download");
		}
	};

	return (
		<div className="min-h-screen text-foreground flex flex-col p-4 md:p-8 relative z-10">
			<header className="mb-8">
				<img src={logo} alt="Dither Me Logo" className="h-16 mx-auto" />
				<p className="text-center text-muted-foreground mt-2">
					Apply retro dithering effects to your images using WebGL
				</p>
			</header>

			<main className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="col-span-1 flex flex-col gap-6">
					<Card>
						<CardHeader>
							<CardTitle>Upload Image</CardTitle>
							<CardDescription>
								Supported formats: JPEG, PNG, WebP, GIF
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ImageUpload onImageLoaded={handleImageLoaded} />
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Dither Settings</CardTitle>
						</CardHeader>
						<CardContent>
							<DitherControls
								options={options}
								onOptionsChange={handleOptionsChange}
								onDownload={handleDownload}
								canDownload={processSuccess && !!image}
							/>
						</CardContent>
					</Card>
				</div>

				<div className="col-span-1 md:col-span-2">
					<Card className="md:sticky top-4">
						<CardHeader>
							<CardTitle>Preview</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex-grow">
								{image ? (
									<AspectRatio
										ratio={image ? image.width / image.height : 16 / 9}
									>
										{isCanvasPending && (
											<div className="absolute inset-0 flex flex-col gap-2 items-center justify-center bg-black/20 z-10">
												<div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
												Rendering
											</div>
										)}
										<DitherCanvas
											ref={canvasRef}
											image={image}
											options={options}
											onProcessComplete={handleProcessComplete}
										/>
									</AspectRatio>
								) : (
									<div className="relative aspect-video rounded bg-muted">
										<div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
											Select an image to apply dithering effects
										</div>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			</main>
			<footer className="mt-8 flex flex-col items-center opacity-50 gap-2">
				<p className="text-center text-sm text-muted-foreground">
					Made with ❤️ by{" "}
					<a href="https://mxte.cc" className="font-bold">
						Maxtune
					</a>
				</p>
				<a href="https://github.com/maxtunelee/dither-me">
					<SiGithub />
				</a>
			</footer>
		</div>
	);
}

export default App;
