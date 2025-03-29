import { useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import type { DitherOptions } from "@/lib/types";
import { Separator } from "../ui/separator";

interface ImagePreprocessingControlProps {
	options: DitherOptions;
	onOptionsChange: (options: DitherOptions) => void;
}

export function ImagePreprocessingControl({
	options,
	onOptionsChange,
}: ImagePreprocessingControlProps) {
	const handlePreprocessingChange = useCallback(
		(key: keyof DitherOptions, value: number) => {
			onOptionsChange({
				...options,
				[key]: value,
			});
		},
		[options, onOptionsChange],
	);

	return (
		<div>
			<Separator className="my-4" />
			<h3 className="font-medium mb-4">Image Preprocessing</h3>
			<div className="mb-4">
				<div className="flex justify-between mb-2">
					<h4 className="text-sm">Contrast</h4>
					<span className="text-sm text-muted-foreground">
						{options.contrast !== undefined
							? Math.round(options.contrast * 100)
							: 0}
						%
					</span>
				</div>
				<Slider
					min={-1}
					max={1}
					step={0.01}
					defaultValue={[options.contrast ?? 0]}
					onValueChange={(value) =>
						handlePreprocessingChange("contrast", value[0])
					}
				/>
			</div>
			<div className="mb-4">
				<div className="flex justify-between mb-2">
					<h4 className="text-sm">Highlights</h4>
					<span className="text-sm text-muted-foreground">
						{options.highlights !== undefined
							? Math.round(options.highlights * 100)
							: 0}
						%
					</span>
				</div>
				<Slider
					min={-1}
					max={1}
					step={0.01}
					defaultValue={[options.highlights ?? 0]}
					onValueChange={(value) =>
						handlePreprocessingChange("highlights", value[0])
					}
				/>
			</div>
			<div className="mb-4">
				<div className="flex justify-between mb-2">
					<h4 className="text-sm">Midtones</h4>
					<span className="text-sm text-muted-foreground">
						{options.midtones !== undefined
							? Math.round(options.midtones * 100)
							: 0}
						%
					</span>
				</div>
				<Slider
					min={-1}
					max={1}
					step={0.01}
					defaultValue={[options.midtones ?? 0]}
					onValueChange={(value) =>
						handlePreprocessingChange("midtones", value[0])
					}
				/>
			</div>
			<div>
				<div className="flex justify-between mb-2">
					<h4 className="text-sm">Brightness Threshold</h4>
					<span className="text-sm text-muted-foreground">
						{options.brightness !== undefined
							? Math.round(options.brightness * 100)
							: 50}
						%
					</span>
				</div>
				<Slider
					min={0}
					max={1}
					step={0.01}
					defaultValue={[options.brightness ?? 0.5]}
					onValueChange={(value) =>
						handlePreprocessingChange("brightness", value[0])
					}
				/>
			</div>
		</div>
	);
}
