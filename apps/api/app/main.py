"""
FastAPI 서버 엔트리 파일
- FastAPI 앱 생성
- CORS 설정
- 라우터 등록
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from  app.routers.face_detection import router as face_router
 
app = FastAPI()

# CORS 설정 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://frontal-face.vercel.app", 
        "https://frontalface.ai.kr" , 
        "http://localhost:5173",
        "https://frontal-face-backend-docker-image.onrender.com/detect-face",
        "https://frontalface.vercel.app"
        ], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(face_router)