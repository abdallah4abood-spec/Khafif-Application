"""Generates the small illustrative sample-product images (480x480 JPEG, ~10-20 KB each).
Original flat illustrations, no real product photography. Run: python3 generate_images.py"""
from PIL import Image, ImageDraw
import os, sys

OUT = os.path.dirname(os.path.abspath(__file__)) + "/images"
os.makedirs(OUT, exist_ok=True)
S = 480

# slug: (background, main color, accent, shape)
ITEMS = {
    "olive-oil":        ("#F3EBD3", "#6B7A2A", "#E9A23B", "bottle"),
    "tahini":           ("#F7EEDD", "#C9A26B", "#14625A", "jar"),
    "pomegranate-molasses": ("#F8E8E3", "#7A1F2B", "#E9A23B", "bottle"),
    "carob-molasses":   ("#EFE5DA", "#4A2C1B", "#E9A23B", "bottle"),
    "zaatar":           ("#E9F0E4", "#5B7F3A", "#E9A23B", "pouch"),
    "thyme":            ("#E4EEE9", "#2F6B4F", "#E9A23B", "pouch"),
    "sumac":            ("#F6E3E1", "#8E2A2A", "#E9A23B", "pouch"),
    "sage":             ("#E8EEE6", "#7C9A7E", "#E9A23B", "pouch"),
    "maqluba-spice":    ("#F5E7D3", "#A8672A", "#14625A", "pouch"),
    "wildflower-honey": ("#FBF0D0", "#E9A23B", "#14625A", "jar"),
    "dates":            ("#F1E6DA", "#5A3A22", "#E9A23B", "bowl"),
    "halawa":           ("#F7EFE0", "#D9B77E", "#14625A", "bowl"),
    "fig-jam":          ("#EDE3EC", "#6B3A5B", "#E9A23B", "jar"),
    "olive-soap":       ("#EEF0DF", "#8A9A4B", "#14625A", "soap"),
    "lavender-soap":    ("#ECE6F3", "#8E7CB8", "#14625A", "soap"),
    "laurel-soap":      ("#E3EDE3", "#3E6B45", "#E9A23B", "soap"),
}

def draw(slug, bg, main, acc, shape):
    im = Image.new("RGB", (S, S), bg)
    d = ImageDraw.Draw(im)
    d.ellipse((90, 380, 390, 420), fill="#00000014" if False else "#D9D2C2")  # ground shadow
    if shape == "bottle":
        d.rounded_rectangle((185, 80, 295, 400), 28, fill=main)
        d.rectangle((222, 40, 258, 100), fill=main)
        d.rounded_rectangle((214, 28, 266, 56), 8, fill=acc)
        d.rounded_rectangle((200, 190, 280, 320), 14, fill="#FFFFFF")
        d.ellipse((228, 232, 252, 276), fill=acc)
    elif shape == "jar":
        d.rounded_rectangle((140, 140, 340, 400), 36, fill=main)
        d.rounded_rectangle((155, 95, 325, 150), 14, fill=acc)
        d.rounded_rectangle((165, 220, 315, 340), 16, fill="#FFFFFF")
        d.ellipse((222, 252, 258, 288), fill=acc)
    elif shape == "pouch":
        d.polygon([(150, 120), (330, 120), (355, 400), (125, 400)], fill=main)
        d.rectangle((150, 120, 330, 150), fill=acc)
        d.rounded_rectangle((170, 210, 310, 330), 16, fill="#FFFFFF")
        d.ellipse((222, 240, 258, 276), fill=main)
        d.polygon([(240, 276), (252, 310), (228, 310)], fill=main)
    elif shape == "bowl":
        d.pieslice((100, 170, 380, 450), 0, 180, fill=main)
        for i in range(5):
            x = 150 + i * 45
            d.ellipse((x, 150 + (i % 2) * 16, x + 56, 206 + (i % 2) * 16), fill=acc)
    elif shape == "soap":
        d.rounded_rectangle((110, 190, 370, 360), 30, fill=main)
        d.rounded_rectangle((135, 215, 345, 335), 20, outline="#FFFFFF", width=6)
        d.ellipse((222, 252, 258, 296), fill=acc)
        for cx, cy, r in ((150, 150, 22), (205, 118, 14), (330, 140, 18)):
            d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=acc, width=4)
    im.save(f"{OUT}/{slug}.jpg", "JPEG", quality=72, optimize=True)

for slug, (bg, main, acc, shape) in ITEMS.items():
    draw(slug, bg, main, acc, shape)
sizes = [os.path.getsize(f"{OUT}/{f}") for f in os.listdir(OUT)]
print(len(sizes), "images, max", max(sizes), "bytes, total", sum(sizes))
