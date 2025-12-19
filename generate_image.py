from PIL import Image, ImageDraw

# Create a new image with white background
img = Image.new('RGB', (200, 200), color='white')

# Initialize ImageDraw
d = ImageDraw.Draw(img)

# Draw a red rectangle
d.rectangle([50, 50, 150, 150], fill='red', outline='black')

# Save the image
img.save('generated_image.png')
print("Image generated: generated_image.png")
