# Face Detection API

## 프로젝트 개요
- 얼굴 정면 감지를 수행하는 AI 기반 API
- FastAPI와 Dlib을 사용하여 얼굴 정면 여부를 판별
- JavaScript(Typescript) 기반 프론트엔드와 연동

## 기술 스택
- **Frontend**: TypeScript, Vanilla JS
- **Backend**: FastAPI, Python, Dlib, OpenCV
- **CI/CD(예정)**: GitHub Actions, AWS

## 프로젝트 구조
```
git_graduation_project
│── public               # 프로젝트에 필요한 이미지 및 스타일 파일 저장
│   ├── images           # 이미지 파일 폴더
│   ├── ai_models        # AI 모델 폴더
│
│── src                  # 주요 코드 폴더
│   ├── Algorithm        # AI 모델과 백엔드 관련 파일
│   │   ├── dlib-models-master  # Dlib 관련 모델 파일 저장 폴더
│   │   ├── __init__.py         # Python 패키지 인식용 파일
│   │   ├── face_detection.py   # FastAPI 기반 얼굴 감지 API 코드
│   │   ├── face_detection_test.py  # 얼굴 감지 기능 테스트 코드
│   │   ├── shape_predictor_68_face_landmarks.dat  # Dlib 랜드마크 모델 파일
│   │
│   ├── scripts          # 프론트엔드 scripts 관련 저장 폴더
│   │   ├── api.ts       # API 연동 관련 TypeScript 코드
│   │   ├── camera.ts    # 카메라 기능 처리 TypeScript 코드
│   │   ├── camera_test.ts  # 카메라 기능 테스트 코드
│   │   ├── script.ts    # 주요 기능을 포함한 TypeScript 코드
│   │   ├── script_test.ts  # 기능 테스트용 TypeScript 코드
│   │
│   ├── styles           # 스타일 파일 폴더
│   
│── venv                 # 가상환경 폴더 (Git 업로드 제외)
│
├── .gitignore           # Git에서 제외할 파일 목록
├── camera.html          # 카메라 기능이 포함된 HTML 파일
├── index.html           # 프로젝트 메인 페이지
├── package-lock.json    # 프로젝트 종속성 정보
├── package.json         # 프로젝트 패키지 정보
├── README.md            # 프로젝트 개요 및 설명
└── tsconfig.json        # TypeScript 설정 파일
```

##  환경 (Environment)

### 📌 필수 설치 항목
- Node.js: `v18.x.x`
- Python: `3.11.x`
- 패키지 매니저: `npm` 또는 `pnpm`

### Backend (FastAPI)
1. 가상환경 진입
2. 실행: uvicorn src.algorithm.face_detection:app --reload
3. POST /detect-face 로 이미지 업로드

### 📌 프로젝트 환경 변수 설정
1. `.env` 파일을 생성하고 다음 형식으로 환경 변수를 추가하세요.
NODE_ENV=development API_BASE_URL=http://localhost:8000 FRONTEND_BASE_URL=http://localhost:3000
2. `.env` 파일은 **Git에 업로드되지 않도록 `.gitignore`에 포함**되어야 합니다.

## 프로젝트 명령어 (Commands)

### 📌 의존성 설치
```bash
# npm 사용 시
npm install

# pnpm 사용 시
pnpm install

# 프론트엔드 실행 (포트: 3000)
npm run dev

# 백엔드 실행 (포트: 8000)
uvicorn src.algorithm.face_detection:app --reload

```

## 🏗 아키텍처 다이어그램

### 시스템 구조
아래 다이어그램은 프론트엔드(SPA)와 백엔드(FastAPI)가 상호작용하는 방식을 나타냅니다.
```mermaid
graph TD;
    User[👤 사용자] -->|요청| Frontend[🌐 SPA (Vanilla JS)]
    Frontend -->|API 요청| Backend[⚙️ FastAPI 백엔드]
    Backend -->|응답| Frontend
    Frontend -->|화면 업데이트| User
```