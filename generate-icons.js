const svg2png = require('svg2png');
const fs = require('fs');
const path = require('path');

// Source SVG file
const svgPath = path.join(__dirname, 'perplexity2slack', 'assets', 'icons', 'icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

// Icon sizes needed for Chrome extension
const sizes = [16, 48, 128];

// Generate each icon size
async function generateIcons() {
  try {
    for (const size of sizes) {
      const pngBuffer = await svg2png(svgBuffer, { width: size, height: size });
      const outputPath = path.join(__dirname, 'perplexity2slack', 'assets', 'icons', `icon${size}.png`);
      
      fs.writeFileSync(outputPath, pngBuffer);
      console.log(`Generated: ${outputPath}`);
    }
    
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

// Run the icon generation
generateIcons();