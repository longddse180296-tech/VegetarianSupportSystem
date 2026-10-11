"""Create local, disposable BE3 upload fixtures under the ignored .local directory."""

from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[3]
LOCAL = ROOT / ".local" / "be3-fixtures"
ASSETS = LOCAL / "assets"
ASSETS.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(LOCAL / "python"))

try:
    from PIL import Image, ImageDraw, ImageFilter, ImageFont
except ImportError as exc:
    raise SystemExit("Install Pillow locally: python -m pip install pillow") from exc

try:
    import imageio_ffmpeg

    FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
except ImportError:
    FFMPEG = shutil.which("ffmpeg")
if not FFMPEG:
    raise SystemExit(
        "Install imageio-ffmpeg into .local/be3-fixtures/python or put ffmpeg on PATH."
    )


def font(size: int):
    path = Path("C:/Windows/Fonts/arial.ttf")
    return ImageFont.truetype(str(path), size) if path.exists() else ImageFont.load_default()


def video(name: str, codec: str):
    target = ASSETS / name
    if target.exists():
        return
    subprocess.run(
        [
            FFMPEG,
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-f",
            "lavfi",
            "-i",
            "color=c=0x2e8b57:s=320x180:r=24:d=2",
            "-c:v",
            codec,
            "-pix_fmt",
            "yuv420p",
            *( ["-movflags", "+faststart"] if name.endswith(".mp4") else [] ),
            str(target),
        ],
        check=True,
    )


def image_assets():
    cover = Image.new("RGB", (320, 180), "#2e8b57")
    draw = ImageDraw.Draw(cover)
    draw.ellipse((95, 15, 225, 145), fill="#e8e1c5", outline="#ffffff", width=5)
    draw.rectangle((125, 50, 160, 90), fill="#f7f0db")
    draw.ellipse((165, 70, 185, 90), fill="#f68d4f")
    draw.text((96, 150), "BE3 TEST VIDEO", font=font(18), fill="white")
    cover.save(ASSETS / "thumbnail.png")

    dish = Image.new("RGB", (640, 480), "#f1e8d7")
    draw = ImageDraw.Draw(dish)
    draw.ellipse((95, 20, 545, 470), fill="white", outline="#aaaaaa", width=7)
    draw.ellipse((135, 60, 505, 430), fill="#64a85b")
    for box in ((185, 110, 260, 180), (310, 125, 385, 195), (255, 260, 330, 330)):
        draw.rounded_rectangle(box, radius=9, fill="#f2e6c3", outline="#c9ac70", width=3)
    for box in ((190, 220, 225, 255), (350, 245, 385, 280), (365, 90, 400, 125)):
        draw.ellipse(box, fill="#dd583b")
    dish.save(ASSETS / "dish-illustration.png")

    label = Image.new("RGB", (960, 420), "white")
    draw = ImageDraw.Draw(label)
    draw.rectangle((25, 25, 935, 395), outline="black", width=5)
    draw.text((55, 60), "INGREDIENTS", font=font(54), fill="black")
    draw.text((55, 160), "Tofu, rice, egg, salt", font=font(37), fill="black")
    draw.text((55, 230), "Contains: soy, egg", font=font(33), fill="black")
    label.save(ASSETS / "label-clear.png")
    label.filter(ImageFilter.GaussianBlur(radius=9)).crop((0, 0, 620, 420)).save(
        ASSETS / "label-blurry-cropped.png"
    )


def oversized(name: str, signature: bytes, size: int):
    path = ASSETS / name
    if path.exists() and path.stat().st_size == size:
        return
    with path.open("wb") as stream:
        stream.write(signature)
        stream.seek(size - 1)
        stream.write(b"\0")


video("video.mp4", "libx264")
video("video.webm", "libvpx-vp9")
image_assets()
(ASSETS / "invalid.mp4").write_text("Not a video", encoding="utf-8")
(ASSETS / "invalid.jpg").write_text("Not an image", encoding="utf-8")
oversized("oversize-image.png", b"\x89PNG\r\n\x1a\n", 10 * 1024 * 1024 + 1)
oversized("oversize-video.mp4", b"\0\0\0\x18ftypisom", 200 * 1024 * 1024 + 1)
print(f"Created test media in {ASSETS}")
