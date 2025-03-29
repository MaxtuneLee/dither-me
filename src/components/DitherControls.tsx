import { Button } from "@/components/ui/button";
import type { DitherOptions } from "@/lib/types";
import { DitherTypeControl } from "./controls/DitherTypeControl";
import { ColorPaletteControl } from "./controls/ColorPaletteControl";
import { ImagePreprocessingControl } from "./controls/ImagePreprocessingControl";
import { DownsamplingControl } from "./controls/DownsamplingControl";

interface DitherControlsProps {
	options: DitherOptions;
	onOptionsChange: (options: DitherOptions) => void;
	onDownload: () => void;
	canDownload: boolean;
}

/**
 * DitherControls component
 * @description Controls for dithering options, including dither type, color palette, image preprocessing, and downsampling.
 * @param
 * @returns
 */
export function DitherControls({
	options,
	onOptionsChange,
	onDownload,
	canDownload,
}: DitherControlsProps) {
	return (
		<div className="flex flex-col gap-6">
			<DitherTypeControl options={options} onOptionsChange={onOptionsChange} />
			<ColorPaletteControl
				options={options}
				onOptionsChange={onOptionsChange}
			/>
			<ImagePreprocessingControl
				options={options}
				onOptionsChange={onOptionsChange}
			/>
			<DownsamplingControl
				options={options}
				onOptionsChange={onOptionsChange}
			/>
			<Button onClick={onDownload} disabled={!canDownload} className="w-full">
				Download Result
			</Button>
		</div>
	);
}
