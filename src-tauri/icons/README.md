# App Icons

This folder should contain the application icons for different platforms.

## Required files

- `32x32.png` - 32x32 pixels
- `128x128.png` - 128x128 pixels
- `128x128@2x.png` - 256x256 pixels (for Retina displays)
- `icon.icns` - macOS icon bundle
- `icon.ico` - Windows icon

## How to generate icons

### Option 1: Use Tauri Icon Generator (Recommended)

1. Create a high-resolution source image (1024x1024 PNG recommended)
2. Install the Tauri CLI if not already installed:
   ```bash
   npm install -g @tauri-apps/cli
   ```
3. Generate icons:
   ```bash
   npm run tauri icon /path/to/your/source-image.png
   ```

### Option 2: Use online tools

- [IconKitchen](https://icon.kitchen/) - Free icon generator
- [RealFaviconGenerator](https://realfavicongenerator.net/) - Generates all formats

### Option 3: Manual creation

Create each icon size manually using image editing software like:
- Figma (free)
- GIMP (free)
- Photoshop
- Sketch

## Temporary Development

For development, you can use placeholder icons. The app will still run, but you may see warnings in the build output.
