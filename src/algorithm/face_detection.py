"""
    FastAPI 기반의 얼굴 감지 API
"""

from fastapi import FastAPI, File, UploadFile,WebSocket
from fastapi import Request
import os
import cv2
import dlib
import numpy as np
import uvicorn
from io import BytesIO
from fastapi.middleware.cors import CORSMiddleware
 
app = FastAPI()

# CORS 설정 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://frontal-face.vercel.app", "https://frontalface.ai.kr"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


MODEL_PATH = "src/algorithm/shape_predictor_68_face_landmarks.dat"

# Dlib의 얼굴 감지기와 랜드마크 예측기 초기화
detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor(MODEL_PATH)

# 모델 파일 경로 확인
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"❌ 모델 파일을 찾을 수 없습니다: {MODEL_PATH}")

print(f"✅ 모델 파일 경로 확인 완료: {MODEL_PATH}")

#두 눈의 중점 반환
def get_midpoint(p1, p2):
    return ((p1.x + p2.x) // 2, (p1.y + p2.y) // 2)

#신발끈 공식을 이용한 얼굴 좌우 면적 계산 
def calculate_area(landmarks):
    def polygon_area(points):
        area = 0
        for i in range(len(points)):
            x1, y1 = points[i].x, points[i].y
            x2, y2 = points[(i + 1) % len(points)].x, points[(i + 1) % len(points)].y
            area += (x1 * y2) - (x2 * y1)
        return 0.5 * abs(area)
    # 얼굴 왼쪽 & 오른쪽 영역 포인트 추출
    left_points = [landmarks.part(i) for i in range(0, 8)]
    right_points = [landmarks.part(i) for i in range(9, 17)]

    left_area = polygon_area(left_points)
    right_area = polygon_area(right_points)

    return left_area, right_area

# 두 점 연결하는 선의 기울기 계산
def calculate_slope(a, b):
    return (b[1] - a[1]) / (b[0] - a[0] + 1e-10)

# @app.post("/debug-detect-face")
# async def debug_detect_face(request: Request):
#     form = await request.form()
#     for key in form.keys():
#         print("📦 실제 들어온 필드 이름:", key)

#     file = form.get("file")
#     if file is None:
#         return {"error": "❌ 'file' 필드가 없습니다."}, 400
#     else:
#         contents = await file.read()
#         print("📝 파일 이름:", file.filename)
#         print("🗂️ 파일 타입:", file.content_type)
#         print("📏 파일 크기:", len(contents))
#         return {"message": "✅ 'file' 필드 수신 성공"}

@app.post("/detect-face")
#얼굴 정면 여부 및 기울기 판별 API
async def detect_face(file: UploadFile = File(...)):
    try:
        #이미지 로드 & 그레이스케일 변환
        img_np = np.frombuffer(file.file.read(), np.uint8)
        img = cv2.imdecode(img_np, cv2.IMREAD_COLOR)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        faces = detector(gray)
        if not faces:
            print("❌ 얼굴이 감지되지 않았습니다.")
            return {"error": "No face detected"}, 400
        for face in faces:
            #얼굴 랜드마크 검출
            landmarks = predictor(gray, face)
            
            #신발끈 공식 적용하여 좌우 면적 계산
            left_area, right_area = calculate_area(landmarks)
            area_ratio_diff = abs(left_area - right_area) / (left_area + right_area + 1e-10)
            
            #기울기 계산(눈 중심 기준)
            left_eye_center = get_midpoint(landmarks.part(36), landmarks.part(39))
            right_eye_center = get_midpoint(landmarks.part(42), landmarks.part(45))
            slope_horizontal = calculate_slope(left_eye_center, right_eye_center)
            
            print(f"slope_horizontal: {slope_horizontal:.4f}")
            print(f"area_ratio_diff: {area_ratio_diff:.4f}")
            
            #정면 판별
            is_frontal = abs(slope_horizontal) <= 0.05 and area_ratio_diff <= 0.05
            
            #비정면 기준 얼굴 기울기 판별
            tilt_direction = "Frontal"
            if slope_horizontal > 0.05:
                tilt_direction = "Left"
            elif slope_horizontal < -0.05:
                tilt_direction = "Right"
            elif area_ratio_diff > 0.05:
                tilt_direction = "area_Left" if left_area > right_area else "area_Right"
            #else: tilt_direction = "Frontal"

                    
            return {
                "is_Frontal": is_frontal,
                "slope_horizontal": slope_horizontal,
                "area_ratio_diff": area_ratio_diff,
                "tilt_direction": tilt_direction,
                #"log": f"slope: {slope_horizontal:.3f}, area_diff: {area_ratio_diff:.3f}"

                }
        
    except Exception as e:
        return{"error": str(e)}, 500

#FASTAPI 서버 실행 (로컬 테스트용)
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
    


    
