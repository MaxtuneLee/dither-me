/**
 * Palette service - Manages and creates color palettes
 */
import { hexToRgb } from "./color-utils";
import {
	type DitherOptions,
	type PaletteDefinition,
	type UserPaletteDefinition,
	PaletteType,
} from "./types";

// Predefined palette collection
export const PALETTES: Record<string, PaletteDefinition> = {
	BW: {
		name: "Black & White",
		colors: ["#000000", "#FFFFFF"],
	},
	CGA: {
		name: "CGA",
		colors: ["#000000", "#55FFFF", "#FF55FF", "#FFFFFF"],
	},
	GAMEBOY: {
		name: "Gameboy",
		colors: ["#0F380F", "#306230", "#8BAC0F", "#9BBC0F"],
	},
	GAMEBOY_CLASSIC: {
		name: "Classic Gameboy",
		colors: ["#0f1b0f", "#306850", "#86c06c", "#e0f8d0"],
	},
	GAMEBOY_POCKET: {
		name: "Gameboy Pocket",
		colors: ["#000000", "#565656", "#aaaaaa", "#ffffff"],
	},
	GRAYSCALE: {
		name: "Grayscale",
		colors: ["#000000", "#444444", "#888888", "#CCCCCC", "#FFFFFF"],
	},
	SEPIA: {
		name: "Sepia Tone",
		colors: ["#402417", "#865C37", "#C49D5A", "#E6D1A7"],
	},
};

// Default user palettes for initial state
export const DEFAULT_USER_PALETTES: UserPaletteDefinition[] = [
	{
		id: 1,
		name: "Ocean Blue",
		colors: ["#001F3F", "#0074D9", "#7FDBFF", "#FFFFFF"],
	},
	{
		id: 2,
		name: "Forest Green",
		colors: ["#1D3520", "#4A7E3A", "#A3D65C", "#CBEDA8"],
	},
	{
		id: 3,
		name: "Vintage Red",
		colors: ["#4A0000", "#900000", "#CE3B3B", "#FF9999"],
	},
];

/**
 * Retrieves colors for the selected palette based on options
 * Handles custom, user, and predefined palettes with color count limiting
 */
export function getPaletteColors(options: DitherOptions): string[] {
	if (!options.usePalette) {
		return [];
	}

	// Custom palette
	if (options.paletteType === PaletteType.CUSTOM && options.customPalette) {
		return options.customPalette;
	}

	// User palette
	if (
		options.paletteType === PaletteType.USER &&
		options.userPalettes &&
		options.selectedUserPalette !== undefined
	) {
		const selectedPalette = options.userPalettes.find(
			(p) => p.id === options.selectedUserPalette,
		);
		if (selectedPalette) {
			return selectedPalette.colors;
		}
	}

	// Predefined palette
	let key = "";
	switch (options.paletteType) {
		case PaletteType.BW:
			key = "BW";
			break;
		case PaletteType.CGA:
			key = "CGA";
			break;
		case PaletteType.GAMEBOY:
			key = "GAMEBOY";
			break;
		case PaletteType.GAMEBOY_CLASSIC:
			key = "GAMEBOY_CLASSIC";
			break;
		case PaletteType.GAMEBOY_POCKET:
			key = "GAMEBOY_POCKET";
			break;
		case PaletteType.GRAYSCALE:
			key = "GRAYSCALE";
			break;
		case PaletteType.SEPIA:
			key = "SEPIA";
			break;
		default:
			key = "BW"; // Default to black & white
	}

	// If color count specified, subset the palette evenly
	const paletteColors = PALETTES[key].colors;
	const numColors = options.paletteColors || 2;

	if (numColors >= paletteColors.length) {
		return paletteColors;
	}
	// Pick colors evenly across the palette
	const result: string[] = [];
	const step = paletteColors.length / numColors;

	for (let i = 0; i < numColors; i++) {
		const index = Math.min(Math.floor(i * step), paletteColors.length - 1);
		result.push(paletteColors[index]);
	}

	return result;
}

/**
 * Creates a 1D palette texture for shaders
 * Maps colors across a 256-pixel spectrum for precise luminance mapping
 */
export function createPaletteTexture(
	gl: WebGLRenderingContext,
	colors: string[],
): WebGLTexture | null {
	if (!colors.length) {
		return null;
	}

	const texture = gl.createTexture();
	if (!texture) {
		return null;
	}

	gl.bindTexture(gl.TEXTURE_2D, texture);

	// Create a 1D texture (implemented as 2D with height=1)
	// 256px width allows precise mapping of luminance values
	const width = 256;
	const height = 1;
	const data = new Uint8Array(width * 4); // RGBA format, 4 bytes per color

	// Map each palette color across luminance range
	for (let i = 0; i < width; i++) {
		const normalizedPos = i / (width - 1); // 0 to 1 position

		// Find corresponding palette color
		let colorIndex = Math.floor(normalizedPos * colors.length);
		colorIndex = Math.min(colorIndex, colors.length - 1);

		// Convert to RGB values
		const rgb = hexToRgb(colors[colorIndex]);

		// Fill texture data
		const offset = i * 4;
		data[offset] = rgb[0]; // R
		data[offset + 1] = rgb[1]; // G
		data[offset + 2] = rgb[2]; // B
		data[offset + 3] = 255; // A (fully opaque)
	}

	// Upload to GPU
	gl.texImage2D(
		gl.TEXTURE_2D,
		0,
		gl.RGBA,
		width,
		height,
		0,
		gl.RGBA,
		gl.UNSIGNED_BYTE,
		data,
	);

	// Set texture parameters
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

	return texture;
}

/**
 * Updates an existing palette texture with new colors
 * Reuses the texture object to avoid creating new WebGL resources
 */
export function updatePaletteTexture(
	gl: WebGLRenderingContext,
	texture: WebGLTexture,
	colors: string[],
): void {
	gl.bindTexture(gl.TEXTURE_2D, texture);

	// Create 1D texture data
	const width = 256;
	const height = 1;
	const data = new Uint8Array(width * 4);

	for (let i = 0; i < width; i++) {
		const normalizedPos = i / (width - 1);
		let colorIndex = Math.floor(normalizedPos * colors.length);
		colorIndex = Math.min(colorIndex, colors.length - 1);

		const rgb = hexToRgb(colors[colorIndex]);

		const offset = i * 4;
		data[offset] = rgb[0];
		data[offset + 1] = rgb[1];
		data[offset + 2] = rgb[2];
		data[offset + 3] = 255;
	}

	// Update texture data
	gl.texImage2D(
		gl.TEXTURE_2D,
		0,
		gl.RGBA,
		width,
		height,
		0,
		gl.RGBA,
		gl.UNSIGNED_BYTE,
		data,
	);
}
