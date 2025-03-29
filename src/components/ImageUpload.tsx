import { type ChangeEvent, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ImageUploadProps {
	onImageLoaded: (image: HTMLImageElement) => void;
}

export function ImageUpload({ onImageLoaded }: ImageUploadProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Create URL for the selected file
		const imageUrl = URL.createObjectURL(file);

		// Create an image element to load the file
		const image = new Image();
		image.crossOrigin = "anonymous"; // Handle CORS issues if needed
		image.onload = () => {
			onImageLoaded(image);
			// Clean up the object URL
			URL.revokeObjectURL(imageUrl);
		};
		image.src = imageUrl;
	};

	const handleButtonClick = () => {
		fileInputRef.current?.click();
	};

	return (
		<div className="flex flex-col gap-2">
			<Input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				onChange={handleFileChange}
				className="hidden"
			/>
			<Button onClick={handleButtonClick} className="w-full">
				Select Image
			</Button>
		</div>
	);
}
