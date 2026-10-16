"""Records each system voice saying "love" in its own language into .media/audio/chorus/.

macOS speech synthesis is unavailable inside the agent sandbox, so this runs on its own;
make_audio.py only reads the files it leaves behind.
"""

import os
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), ".media", "audio", "chorus")

VOICES = [
    ("Tingting", "爱"), ("Samantha", "love"), ("Thomas", "amour"), ("Yuna", "사랑"), ("Kyoko", "愛"), ("Mónica", "amor"), ("Anna", "Liebe"),
    ("Alice", "amore"), ("Milena", "любовь"), ("Majed", "حب"), ("Lekha", "प्रेम"), ("Meijia", "愛"), ("Luciana", "amor"), ("Melina", "αγάπη"),
    ("Yelda", "aşk"), ("Carmit", "אהבה"), ("Kanya", "ความรัก"), ("Linh", "tình yêu"), ("Damayanti", "cinta"), ("Xander", "liefde"),
    ("Alva", "kärlek"), ("Nora", "kjærlighet"), ("Sara", "kærlighed"), ("Satu", "rakkaus"), ("Tünde", "szerelem"), ("Zosia", "miłość"),
    ("Zuzana", "láska"), ("Lana", "ljubav"), ("Tina", "ljubezen"), ("Ioana", "dragoste"), ("Daria", "любов"), ("Lesya", "любов"),
    ("Piya", "ভালোবাসা"), ("Vani", "காதல்"), ("Geeta", "ప్రేమ"), ("Soumya", "ಪ್ರೀತಿ"), ("Amira", "kasih"), ("Sinji", "愛"), ("Daniel", "love"),
    ("Paulina", "amor"), ("Amélie", "amour"), ("Joana", "amor"), ("Montse", "amor"), ("Ona", "meilė"), ("Laura", "láska"), ("Karen", "love"),
    ("Moira", "love"), ("Tessa", "love"),
]

os.makedirs(OUT, exist_ok=True)
for i, (voice, word) in enumerate(VOICES):
    path = os.path.join(OUT, f"v{i:02d}.aiff")
    r = subprocess.run(["say", "-v", voice, "-r", "150", "-o", path, word], capture_output=True, text=True)
    size = os.path.getsize(path) if os.path.exists(path) else 0
    print(f"{i:02d} {voice:10s} {word:12s} {'ok' if r.returncode == 0 and size > 8192 else 'FAILED ' + r.stderr.strip()} {size}")
