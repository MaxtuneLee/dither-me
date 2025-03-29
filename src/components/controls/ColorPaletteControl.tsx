import { useState, useCallback } from "react";
import { CardDescription } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DEFAULT_USER_PALETTES } from "@/lib/palette-service";
import { PaletteType } from "@/lib/types";
import type { DitherOptions } from "@/lib/types";
import { ChromePicker, type ColorResult } from "react-color";
import { Separator } from "../ui/separator";

interface ColorPaletteControlProps {
	options: DitherOptions;
	onOptionsChange: (options: DitherOptions) => void;
}

export function ColorPaletteControl({
	options,
	onOptionsChange,
}: ColorPaletteControlProps) {
	// Track custom colors locally to avoid unnecessary re-renders
	const [customColors, setCustomColors] = useState<string[]>(
		options.customPalette || ["#000000", "#FFFFFF"],
	);
	const userPalettes = options.userPalettes || DEFAULT_USER_PALETTES;

	// Consolidated color picker state with position data
	const [colorPickerState, setColorPickerState] = useState<{
		activeIndex: number | null;
		position: { top: number; left: number };
	}>({
		activeIndex: null,
		position: { top: 0, left: 0 },
	});

	const handlePaletteToggle = useCallback(
		(enabled: boolean) => {
			onOptionsChange({
				...options,
				usePalette: enabled,
			});
		},
		[options, onOptionsChange],
	);

	const handlePaletteTypeChange = useCallback(
		(value: string) => {
			const paletteType = Number.parseInt(value);
			onOptionsChange({
				...options,
				paletteType,
				// Reset user palette selection when switching types
				selectedUserPalette:
					paletteType === PaletteType.USER ? userPalettes[0]?.id : undefined,
			});
		},
		[options, onOptionsChange, userPalettes],
	);

	const handlePaletteColorsChange = useCallback(
		(value: string) => {
			const paletteColors = Number.parseInt(value);
			onOptionsChange({
				...options,
				paletteColors,
			});
		},
		[options, onOptionsChange],
	);

	const handleCustomColorChange = useCallback(
		(index: number, color: string) => {
			const newColors = [...customColors];
			newColors[index] = color;
			setCustomColors(newColors);

			// Only update main options if custom palette is active
			if (options.paletteType === PaletteType.CUSTOM) {
				onOptionsChange({
					...options,
					customPalette: newColors,
				});
			}
		},
		[customColors, options, onOptionsChange],
	);

	const handleColorBlockClick = useCallback(
		(index: number, event: React.MouseEvent) => {
			const rect = (event.target as Element).getBoundingClientRect();
			setColorPickerState({
				activeIndex: index,
				position: {
					top: rect.bottom + window.scrollY + 5,
					left: rect.left + window.scrollX,
				},
			});
		},
		[],
	);

	const handleColorPickerChange = useCallback(
		(color: ColorResult) => {
			if (colorPickerState.activeIndex !== null) {
				handleCustomColorChange(colorPickerState.activeIndex, color.hex);
			}
		},
		[colorPickerState.activeIndex, handleCustomColorChange],
	);

	const handleColorPickerClose = useCallback(() => {
		setColorPickerState((prev) => ({ ...prev, activeIndex: null }));
	}, []);

	const handleAddCustomColor = useCallback(() => {
		if (customColors.length < 16) {
			const newColors = [...customColors, "#777777"];
			setCustomColors(newColors);

			if (options.paletteType === PaletteType.CUSTOM) {
				onOptionsChange({
					...options,
					customPalette: newColors,
				});
			}
		}
	}, [customColors, options, onOptionsChange]);

	const handleRemoveCustomColor = useCallback(
		(index: number) => {
			if (customColors.length > 2) {
				const newColors = customColors.filter((_, i) => i !== index);
				setCustomColors(newColors);

				if (options.paletteType === PaletteType.CUSTOM) {
					onOptionsChange({
						...options,
						customPalette: newColors,
					});
				}
			}
		},
		[customColors, options, onOptionsChange],
	);

	const handleUserPaletteChange = useCallback(
		(value: string) => {
			const paletteId = Number.parseInt(value);
			onOptionsChange({
				...options,
				selectedUserPalette: paletteId,
			});
		},
		[options, onOptionsChange],
	);

	const handleClickOutside = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			const target = e.target as HTMLElement;
			// Don't close if clicking on color block or picker itself
			if (
				!target.closest(".color-picker-container") &&
				!target.closest(".color-block")
			) {
				handleColorPickerClose();
			}
		},
		[handleColorPickerClose],
	);

	return (
		<div>
			<Separator className="my-4" />
			<div className=" mb-4">
				<div className="flex items-center justify-between mb-2">
					<h3 className="font-medium">Color Palette</h3>
					<div className="flex items-center space-x-2">
						<span className="text-sm">Enable</span>
						<Switch
							checked={options.usePalette || false}
							onCheckedChange={handlePaletteToggle}
						/>
					</div>
				</div>
				<CardDescription>
					Color palettes can create retro computing or artistic effects.
				</CardDescription>
			</div>

			{options.usePalette && (
				<div onClick={handleClickOutside}>
					<div className="mb-4">
						<h4 className="text-sm mb-2">Palette Type</h4>
						<Select
							value={String(options.paletteType ?? 0)}
							onValueChange={handlePaletteTypeChange}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select palette type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="0">Black & White</SelectItem>
								<SelectItem value="1">CGA</SelectItem>
								<SelectItem value="2">Gameboy (Original)</SelectItem>
								<SelectItem value="5">Gameboy Classic</SelectItem>
								<SelectItem value="6">Gameboy Pocket</SelectItem>
								<SelectItem value="7">Grayscale</SelectItem>
								<SelectItem value="8">Sepia</SelectItem>
								<SelectItem value="4">User Palettes</SelectItem>
								<SelectItem value="3">Custom Colors</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* User-defined preset palettes */}
					{options.paletteType === PaletteType.USER && (
						<div className="mb-4">
							<h4 className="text-sm mb-2">Preset Palette</h4>
							<Select
								value={String(
									options.selectedUserPalette ?? userPalettes[0]?.id,
								)}
								onValueChange={handleUserPaletteChange}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select preset palette" />
								</SelectTrigger>
								<SelectContent>
									{userPalettes.map((palette) => (
										<SelectItem key={palette.id} value={String(palette.id)}>
											{palette.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{/* Color preview swatches */}
							<div className="mt-2 flex gap-1">
								{userPalettes
									.find((p) => p.id === options.selectedUserPalette)
									?.colors.map((color) => (
										<div
											key={color}
											className="w-6 h-6 rounded border border-border"
											style={{ backgroundColor: color }}
											title={color}
										/>
									))}
							</div>
						</div>
					)}

					{/* Color count selector for built-in palettes */}
					{options.paletteType !== PaletteType.CUSTOM &&
						options.paletteType !== PaletteType.USER && (
							<div className="mb-4">
								<h4 className="text-sm mb-2">Colors</h4>
								<Select
									value={String(options.paletteColors ?? 2)}
									onValueChange={handlePaletteColorsChange}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select number of colors" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="2">2 Colors</SelectItem>
										<SelectItem value="4">4 Colors</SelectItem>
										<SelectItem value="8">8 Colors</SelectItem>
										<SelectItem value="16">16 Colors</SelectItem>
									</SelectContent>
								</Select>
							</div>
						)}

					{/* Custom color palette editor */}
					{options.paletteType === PaletteType.CUSTOM && (
						<div className="mb-2 relative">
							<h4 className="text-sm mb-2">Custom Colors</h4>
							<div className="flex flex-col gap-2">
								{customColors.map((color, index) => (
									<div
										key={`${color}-${index}`}
										className="flex items-center gap-2"
									>
										<div
											className="w-6 h-6 rounded border border-border color-block cursor-pointer"
											style={{ backgroundColor: color }}
											onClick={(e) => handleColorBlockClick(index, e)}
											tabIndex={0}
											role="button"
											aria-label={`Select color for palette item ${index + 1}`}
										/>
										<Input
											type="text"
											value={color}
											onChange={(e) =>
												handleCustomColorChange(index, e.target.value)
											}
											className="flex-grow"
											placeholder="#RRGGBB"
										/>
										<Button
											type="button"
											variant="outline"
											size="icon"
											onClick={() => handleRemoveCustomColor(index)}
											disabled={customColors.length <= 2}
											className="h-8 w-8"
										>
											✕
										</Button>
									</div>
								))}
								{/* Allow adding more colors up to limit of 16 */}
								{customColors.length < 16 && (
									<Button
										type="button"
										variant="outline"
										onClick={handleAddCustomColor}
										className="mt-2"
									>
										Add Color
									</Button>
								)}
							</div>

							{/* Color picker popup (only shown when a color block is clicked) */}
							{colorPickerState.activeIndex !== null && (
								<div
									className="color-picker-container"
									style={{
										position: "absolute",
										top: colorPickerState.position.top,
										left: colorPickerState.position.left,
										zIndex: 1000,
									}}
									onClick={(e) => e.stopPropagation()}
								>
									<ChromePicker
										color={customColors[colorPickerState.activeIndex]}
										onChange={handleColorPickerChange}
										disableAlpha={true}
									/>
								</div>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
