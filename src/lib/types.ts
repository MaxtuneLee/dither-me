// Types for the dithering application
export interface DitherOptions {
	ditherAmount: number; // 0.0 to 1.0
	ditherType: number; // 0=Bayer, 1=Floyd-Steinberg, 2=Ordered
	bayerSize?: number; // 0=2x2, 1=4x4, 2=8x8 (new), defaults to 4x4 if not specified
	downSampling?: number; // Downsampling factor, enable when greater than 1, default is 1 (no downsampling)
	
	// Image preprocessing options
	contrast?: number; // Contrast adjustment, -1.0 to 1.0, default is 0 (no adjustment)
	highlights?: number; // Highlights adjustment, -1.0 to 1.0, default is 0 (no adjustment)
	midtones?: number; // Midtones adjustment, -1.0 to 1.0, default is 0 (no adjustment)
	brightness?: number; // Brightness threshold, 0.0 to 1.0, default is 0.5
	
	// Color palette options
	usePalette?: boolean; // Whether to use color palette, default false
	paletteType?: number; // Palette type: 0=BW, 1=CGA, 2=Gameboy, 3=Custom, default 0
	paletteColors?: number; // Number of colors in palette, 2-16, default 2
	customPalette?: string[]; // Custom color palette, array of hex color strings
	
	// New palette options
	userPalettes?: UserPaletteDefinition[]; // User-defined palette list
	selectedUserPalette?: number; // Index of currently selected user palette
}

export interface PaletteDefinition {
	name: string;
	colors: string[];
}

// User-defined palette definition
export interface UserPaletteDefinition {
	id: number;
	name: string;
	colors: string[];
}

// Predefined palette types
export enum PaletteType {
	BW = 0,
	CGA = 1,
	GAMEBOY = 2,
	GAMEBOY_CLASSIC = 5,
	GAMEBOY_POCKET = 6,
	GRAYSCALE = 7,
	SEPIA = 8,
	CUSTOM = 3,
	USER = 4 // User-defined palette type
}