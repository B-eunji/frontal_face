# 1) 베이스: Python slim
FROM python:3.11-slim

# 2) 시스템 패키지 (dlib 빌드)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 3) 작업 디렉토리
WORKDIR /app

# 4) 파이썬 의존성 먼저 설치 (캐시 효율)
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# 5) 소스 복사
COPY . /app

# 6) 모델 다운로드 (컨테이너 빌드 시점에 확보)
RUN python scripts/download_models.py

# 7) 실행
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]