Converting NEF files to JPG for web use

This project includes several NEF (Nikon RAW) files in the `Images/` folder.
If you want web-friendly JPG versions, run the provided conversion script.

Install required tools (Ubuntu):

```bash
# Use sudo if necessary
apt-get update && apt-get install -y imagemagick dcraw
```

Run the conversion script from the repository root:

```bash
# Make script executable first (only need to do once)
chmod +x scripts/convert_nef_to_jpg.sh

# Run conversion
./scripts/convert_nef_to_jpg.sh
```

What the script does:
- Finds `Images/*.NEF` (case-insensitive for extension)
- Converts each NEF to a JPG with the same basename (e.g. `DSC_0240.NEF` -> `DSC_0240.jpg`)
- Resizes images to a maximum of 2000px (preserving aspect ratio)
- Sets JPEG quality to 85

After running the script, you can ask me to update `data2bImages.js` to point NEF entries to the new JPG files.
