precision mediump float;

// Input uniforms from JavaScript
uniform sampler2D u_image;          // Main image to process
uniform sampler2D u_errorTexture;   // Stores error values for Floyd-Steinberg algorithm
uniform sampler2D u_palette;        // Color palette as 1D texture
uniform vec2 u_resolution;          // Canvas dimensions
uniform float u_ditherAmount;       // Dither effect intensity (0-1)
uniform int u_ditherType;           // 0=Bayer, 1=Floyd-Steinberg, 2=Ordered
uniform int u_passIndex;            // Render pass for Floyd-Steinberg algorithm
uniform vec2 u_pixelStep;           // Size of one pixel in texture coordinates
uniform int u_bayerSize;            // Bayer matrix size: 0=2x2, 1=4x4, 2=8x8
uniform bool u_usePalette;          // Whether to use the color palette

// Image preprocessing options
uniform float u_contrast;           // Contrast adjustment (-1 to 1)
uniform float u_highlights;         // Highlight adjustment (-1 to 1)
uniform float u_midtones;           // Midtone adjustment (-1 to 1)
uniform float u_brightness;         // Brightness threshold (0 to 1, default 0.5)

// 4x4 Bayer matrix - provides 16 levels of dithering thresholds
const mat4 bayerMatrix4x4=mat4(
  0.,8.,2.,10.,
  12.,4.,14.,6.,
  3.,11.,1.,9.,
  15.,7.,13.,5.
)/16.;

// 2x2 Bayer matrix - provides 4 levels of dithering thresholds
const mat2 bayerMatrix2x2=mat2(
  0.,2.,
  3.,1.
)/4.;

// Convert RGB to grayscale using perceptual luminance weights
float toGrayscale(vec3 color) {
  return dot(color, vec3(.299, .587, .114));
}

// Get threshold value from 8x8 Bayer matrix using conditional logic
// This approach works better on older WebGL implementations
float getBayer8x8Value(int x, int y) {
  if (x == 0) {
    if (y == 0) return 0.0;
    if (y == 1) return 48.0;
    if (y == 2) return 12.0;
    if (y == 3) return 60.0;
    if (y == 4) return 3.0;
    if (y == 5) return 51.0;
    if (y == 6) return 15.0;
    if (y == 7) return 63.0;
  } else if (x == 1) {
    if (y == 0) return 32.0;
    if (y == 1) return 16.0;
    if (y == 2) return 44.0;
    if (y == 3) return 28.0;
    if (y == 4) return 35.0;
    if (y == 5) return 19.0;
    if (y == 6) return 47.0;
    if (y == 7) return 31.0;
  } else if (x == 2) {
    if (y == 0) return 8.0;
    if (y == 1) return 56.0;
    if (y == 2) return 4.0;
    if (y == 3) return 52.0;
    if (y == 4) return 11.0;
    if (y == 5) return 59.0;
    if (y == 6) return 7.0;
    if (y == 7) return 55.0;
  } else if (x == 3) {
    if (y == 0) return 40.0;
    if (y == 1) return 24.0;
    if (y == 2) return 36.0;
    if (y == 3) return 20.0;
    if (y == 4) return 43.0;
    if (y == 5) return 27.0;
    if (y == 6) return 39.0;
    if (y == 7) return 23.0;
  } else if (x == 4) {
    if (y == 0) return 2.0;
    if (y == 1) return 50.0;
    if (y == 2) return 14.0;
    if (y == 3) return 62.0;
    if (y == 4) return 1.0;
    if (y == 5) return 49.0;
    if (y == 6) return 13.0;
    if (y == 7) return 61.0;
  } else if (x == 5) {
    if (y == 0) return 34.0;
    if (y == 1) return 18.0;
    if (y == 2) return 46.0;
    if (y == 3) return 30.0;
    if (y == 4) return 33.0;
    if (y == 5) return 17.0;
    if (y == 6) return 45.0;
    if (y == 7) return 29.0;
  } else if (x == 6) {
    if (y == 0) return 10.0;
    if (y == 1) return 58.0;
    if (y == 2) return 6.0;
    if (y == 3) return 54.0;
    if (y == 4) return 9.0;
    if (y == 5) return 57.0;
    if (y == 6) return 5.0;
    if (y == 7) return 53.0;
  } else if (x == 7) {
    if (y == 0) return 42.0;
    if (y == 1) return 26.0;
    if (y == 2) return 38.0;
    if (y == 3) return 22.0;
    if (y == 4) return 41.0;
    if (y == 5) return 25.0;
    if (y == 6) return 37.0;
    if (y == 7) return 21.0;
  }
  return 0.0;
}

// Reduce color depth to simulate limited color palettes
vec3 reduceColor(vec3 color, float levels){
  return floor(color * levels) / levels;
}

// Get threshold value from 2x2 Bayer matrix
float getBayerThreshold2x2(int x, int y) {
  x = int(mod(float(x), 2.0));
  y = int(mod(float(y), 2.0));
  
  if (x == 0) {
    if (y == 0) return bayerMatrix2x2[0][0];
    else return bayerMatrix2x2[0][1];
  } else {
    if (y == 0) return bayerMatrix2x2[1][0];
    else return bayerMatrix2x2[1][1];
  }
}

// Get threshold value from 4x4 Bayer matrix using conditional indexing
// Dynamic indexing isn't supported in all WebGL implementations
float getBayerThreshold4x4(int x, int y) {
  x = int(mod(float(x), 4.0));
  y = int(mod(float(y), 4.0));
  
  if(x==0){
    if(y==0)return bayerMatrix4x4[0][0];
    else if(y==1)return bayerMatrix4x4[0][1];
    else if(y==2)return bayerMatrix4x4[0][2];
    else return bayerMatrix4x4[0][3];
  }else if(x==1){
    if(y==0)return bayerMatrix4x4[1][0];
    else if(y==1)return bayerMatrix4x4[1][1];
    else if(y==2)return bayerMatrix4x4[1][2];
    else return bayerMatrix4x4[1][3];
  }else if(x==2){
    if(y==0)return bayerMatrix4x4[2][0];
    else if(y==1)return bayerMatrix4x4[2][1];
    else if(y==2)return bayerMatrix4x4[2][2];
    else return bayerMatrix4x4[2][3];
  }else{
    if(y==0)return bayerMatrix4x4[3][0];
    else if(y==1)return bayerMatrix4x4[3][1];
    else if(y==2)return bayerMatrix4x4[3][2];
    else return bayerMatrix4x4[3][3];
  }
}

// Get threshold from 8x8 Bayer matrix
float getBayerThreshold8x8(int x, int y) {
  x = int(mod(float(x), 8.0));
  y = int(mod(float(y), 8.0));
  return getBayer8x8Value(x, y) / 64.0;
}

// Get threshold value based on selected Bayer matrix size
float getBayerThreshold(int x, int y) {
  if (u_bayerSize == 0) {
    return getBayerThreshold2x2(x, y);
  } else if (u_bayerSize == 1) {
    return getBayerThreshold4x4(x, y);
  } else {
    return getBayerThreshold8x8(x, y);
  }
}

// Apply contrast adjustment to image
// Positive values increase contrast, negative values reduce it
vec3 adjustContrast(vec3 color, float contrast) {
  float factor = contrast > 0.0 ? 
                 1.0 + contrast : // Enhance contrast
                 1.0 / (1.0 - contrast); // Reduce contrast
  
  // Apply contrast around midpoint (0.5)
  vec3 adjusted = (color - 0.5) * factor + 0.5;
  
  return clamp(adjusted, 0.0, 1.0);
}

// Adjust highlight areas separately from other tones
vec3 adjustHighlights(vec3 color, float highlights) {
  // Identify highlight areas (bright regions)
  float luminance = toGrayscale(color);
  float highlightMask = smoothstep(0.5, 1.0, luminance);
  
  // Calculate adjustment factor based on highlights value
  float factor = highlights > 0.0 ? 
                 mix(1.0, 0.5, highlights) : // Positive values reduce highlights
                 mix(1.0, 2.0, -highlights); // Negative values enhance highlights
  
  // Apply selective adjustment to highlights
  vec3 adjusted = mix(color, color * factor, highlightMask);
  
  return clamp(adjusted, 0.0, 1.0);
}

// Adjust midtone areas separately from other tones
vec3 adjustMidtones(vec3 color, float midtones) {
  // Identify midtone areas (medium brightness)
  float luminance = toGrayscale(color);
  float midtoneMask = 1.0 - abs(luminance - 0.5) * 2.0;
  midtoneMask = smoothstep(0.0, 0.5, midtoneMask);
  
  // Calculate adjustment factor based on midtones value
  float factor = midtones > 0.0 ? 
                mix(1.0, 1.5, midtones) : // Positive values enhance midtones
                mix(1.0, 0.5, -midtones); // Negative values reduce midtones
  
  // Apply gamma-like adjustment selectively to midtones
  vec3 adjusted = mix(color, pow(color, vec3(factor)), midtoneMask);
  
  return clamp(adjusted, 0.0, 1.0);
}

// Apply all preprocessing adjustments to image
vec3 preprocessImage(vec3 color) {
  // Apply adjustments in sequence
  color = adjustContrast(color, u_contrast);
  color = adjustHighlights(color, u_highlights);
  color = adjustMidtones(color, u_midtones);
  
  // Apply brightness threshold if not at default value
  float luminance = toGrayscale(color);
  if (u_brightness != 0.5) { // 0.5 is default value (no adjustment)
    color = mix(vec3(step(u_brightness, luminance)), color, 0.5);
  }
  
  return color;
}

// Find closest palette color by using luminance for lookup
vec3 findClosestPaletteColor(vec3 color) {
  if (u_usePalette) {
    // Use luminance to look up color in palette texture
    float lum = toGrayscale(color);
    vec3 paletteColor = texture2D(u_palette, vec2(lum, 0.5)).rgb;
    return paletteColor;
  } else {
    // If palette not enabled, return original color
    return color;
  }
}

// Implement Floyd-Steinberg dithering
vec3 applyFloydSteinberg(vec2 uv, vec3 color, float levels) {
  // Original color before quantization
  vec3 oldColor = color;
  
  // Quantize color (reduce color depth)
  vec3 newColor = reduceColor(oldColor, levels);

  // Apply palette if enabled
  if (u_usePalette) {
    newColor = findClosestPaletteColor(oldColor);
  }
  
  // Calculate quantization error
  vec3 error = oldColor - newColor;
  
  // Handle multi-pass Floyd-Steinberg algorithm
  if (u_passIndex == 0) {
    // First pass: just calculate quantized colors and errors
    return newColor;
  } else {
    // Second pass: apply accumulated error from error texture
    vec2 errCoord = gl_FragCoord.xy / u_resolution;
    vec3 accumulatedError = texture2D(u_errorTexture, errCoord).rgb;
    
    // Apply cumulative error to current color
    vec3 adjustedColor = oldColor + accumulatedError;
    
    // Re-quantize with error applied
    newColor = reduceColor(adjustedColor, levels);
    
    // Apply palette if enabled
    if (u_usePalette) {
      newColor = findClosestPaletteColor(adjustedColor);
    }
    
    return newColor;
  }
}

void main(){
  // Get normalized texture coordinates
  vec2 uv=vec2(
    gl_FragCoord.x/u_resolution.x,
    gl_FragCoord.y/u_resolution.y
  );
  
  // Sample original pixel color
  vec3 color=texture2D(u_image,uv).rgb;
  
  // Apply preprocessing adjustments
  color = preprocessImage(color);
  
  // Apply dithering based on selected algorithm
  if(u_ditherType==0){// Bayer dithering
    // Get matrix size based on selected Bayer type
    int matrixSize = u_bayerSize == 0 ? 2 : (u_bayerSize == 1 ? 4 : 8);
    int x = int(mod(gl_FragCoord.x, float(matrixSize)));
    int y = int(mod(gl_FragCoord.y, float(matrixSize)));
    float threshold = getBayerThreshold(x, y);
    
    // Convert to grayscale for threshold comparison
    float gray=toGrayscale(color);
    
    // Apply dithering with user-controlled intensity
    float levels=mix(16.,2.,u_ditherAmount);
    vec3 reduced=reduceColor(color,levels);
    
    // Apply threshold to create dithered pattern
    vec3 thresholdColor = (gray>threshold)?vec3(1.):vec3(0.);
    
    // Mix between reduced color and threshold color based on dither amount
    color=mix(reduced, thresholdColor, u_ditherAmount);
    
    // Apply palette mapping if enabled
    if (u_usePalette) {
      color = findClosestPaletteColor(color);
    }
  }
  else if(u_ditherType==2){// Ordered dithering
    // Generate pseudo-random threshold using pixel position
    float rand=fract(sin(dot(uv,vec2(12.9898,78.233)))*43758.5453);
    
    // Apply random threshold for noise-based dithering
    vec3 thresholdColor = (toGrayscale(color)>rand)?vec3(1.):vec3(0.);
    color=mix(color, thresholdColor, u_ditherAmount);
    
    // Apply palette mapping if enabled
    if (u_usePalette) {
      color = findClosestPaletteColor(color);
    }
  }
  else{// Floyd-Steinberg dithering
    float levels=mix(16.,2.,u_ditherAmount);
    
    // Use GPU-based implementation of Floyd-Steinberg algorithm
    color = applyFloydSteinberg(uv, color, levels);
  }
  
  gl_FragColor=vec4(color,1.);
}
