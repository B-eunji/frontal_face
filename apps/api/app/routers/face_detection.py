"""
얼굴 정면 판단 API 라우터
- 요청/응답만 담당
- 실제 로직은 services로 위임
"""

from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse
from app.services.face_detection.detector import detect_face_from_bytes

router = APIRouter(tags=["face"])

@router.post("/detect-face")
async def detect_face(file: UploadFile = File(...)):
    image_bytes = await file.read()
    print(f"[ROUTER] /detect-face file={file.filename} content_type={file.content_type}")
    
    result, status = detect_face_from_bytes(image_bytes)
    return JSONResponse(content=result, status_code=status)