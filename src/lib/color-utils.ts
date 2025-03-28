/**
 * Color utility functions for dithering operations
 */

/**
 * Convert a hexadecimal color string to RGB values
 * Supports both #RGB and #RRGGBB formats
 *
 * @param hex Hexadecimal color string (with or without # prefix)
 * @returns Tuple containing [r, g, b] values (0-255)
 */
export function hexToRgb(hex: string): [number, number, number] {
	// Remove # prefix if present
	const cleanHex = hex.startsWith("#") ? hex.slice(1) : hex;

	// Parse the hex value to integer
	const bigint = Number.parseInt(cleanHex, 16);
	let r: number;
	let g: number;
	let b: number;

	// Handle shorthand (#RGB) format
	if (cleanHex.length <= 3) {
		// Each digit is repeated to convert shorthand to full form (F -> FF)
		r = ((bigint >> 8) & 15) * 17;
		g = ((bigint >> 4) & 15) * 17;
		b = (bigint & 15) * 17;
	} else {
		// Standard #RRGGBB format
		r = (bigint >> 16) & 255;
		g = (bigint >> 8) & 255;
		b = bigint & 255;
	}

	return [r, g, b];
}
