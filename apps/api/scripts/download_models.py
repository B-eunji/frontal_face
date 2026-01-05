"""
이 스크립트의 목적
- dlib 랜드마크 모델(.dat.bz2)을 다운로드하고 압축 해제해서 프로젝트가 읽을 수 있는 .dat 파일로 준비한다.

왜 필요한가
- 모델 파일은 용량이 크고(바이너리) git에 올리기 부적합해서 .gitignore로 제외한다.
- 대신 스크립트로 “어떤 환경에서도 동일한 방식으로” 모델을 세팅할 수 있게 한다.

실행 방법
- python scripts/download_models.py
- python scripts/download_models.py --force  # 다시 받기
"""


from __future__ import annotations

import argparse # CLI 옵션 처리
import bz2 # 압축 해제
import os 
from pathlib import Path # 경로 안전하게 처리
from urllib.request import urlopen, Request #외부 파일 다운로드


DLIB_68_BZ2_URL = "https://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2"


def download_file(url: str, out_path: Path) -> None:
    """
    저장할 폴더가 없을 경우 자동 생성
    """
    out_path.parent.mkdir(parents=True, exist_ok=True)

    req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(req) as resp, open(out_path, "wb") as f:
        total = resp.headers.get("Content-Length")
        total_bytes = int(total) if total else None

        downloaded = 0
        chunk_size = 1024 * 1024  # 1MB

        while True:
            chunk = resp.read(chunk_size)
            if not chunk:
                break
            f.write(chunk)
            downloaded += len(chunk)

            # progress (best-effort)
            if total_bytes:
                pct = downloaded / total_bytes * 100
                print(f"\rDownloading... {pct:5.1f}% ({downloaded}/{total_bytes} bytes)", end="")
            else:
                print(f"\rDownloading... ({downloaded} bytes)", end="")

    print("\nDownload complete:", out_path)


def decompress_bz2(bz2_path: Path, out_path: Path) -> None:
    """
    Decompress .bz2 -> .dat
    """
    out_path.parent.mkdir(parents=True, exist_ok=True)

    with bz2.open(bz2_path, "rb") as src, open(out_path, "wb") as dst:
        while True:
            chunk = src.read(1024 * 1024)
            if not chunk:
                break
            dst.write(chunk)

    print("Decompress complete:", out_path)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force re-download even if the .dat already exists.",
    )
    args = parser.parse_args()

    # scripts/ -> apps/api/
    api_root = Path(__file__).resolve().parents[1]
    model_dir = api_root / "app" / "assets" / "models"

    dat_path = model_dir / "shape_predictor_68_face_landmarks.dat"
    bz2_path = model_dir / "shape_predictor_68_face_landmarks.dat.bz2"

    if dat_path.exists() and not args.force:
        print("Model already exists. Skipping:", dat_path)
        print("If you want to re-download, run with --force")
        return 0

    print("Target model path:", dat_path)

    # Download .bz2
    download_file(DLIB_68_BZ2_URL, bz2_path)

    # Decompress to .dat
    decompress_bz2(bz2_path, dat_path)

    # Optional: remove bz2 to save space
    try:
        bz2_path.unlink()
        print("Removed archive:", bz2_path)
    except OSError:
        print("Could not remove archive (ok):", bz2_path)

    print("All done ✅")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())