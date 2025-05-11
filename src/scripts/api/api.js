/*
프론트엔드에서 API 호출
*/


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    }); 
};


export function detectFace(imageFile) {
    return __awaiter(this, void 0, void 0, function* () {
        const formData = new FormData();
        formData.append("file", imageFile);
        console.log("🔍 imageFile ▶️", imageFile);
        console.log("📦 formData entries ▶️", [...formData.entries()]);
        try {
            //const formData = new FormData();
            // 테스트용 더미 파일 추가
            //formData.append("file", new Blob(["hello"], { type: "text/plain" }), "test.txt");
            console.log("📦 formData keys:", [...formData.keys()]);
            const API_URL = "https://frontalface.ai.kr";
            console.log("✅ API 요청 주소:", `${API_URL}/detect-face`);
            const response = yield fetch("https://frontalface.ai.kr/detect-face", {
                method: "POST",
                body: formData,
                mode: "cors",
            });
            if (!response.ok)
                throw new Error("Failed to detect face");
            return yield response.json();
        }
        catch (error) {
            console.error("Error detecting face:", error);
            return null;
        }
    });
}
import { captureImage } from '../camera/camera-capture.js';
// 서버에 얼굴 이미지를 전송하고 정면 여부를 받아오는 함수
export async function sendFaceToAPI(videoElement) {
    const imageBlob = await captureImage(videoElement); // 비디오에서 이미지를 캡처
    const formData = new FormData();
    formData.append("file", imageBlob);
    console.log("🔍 imageFile ▶️", imageFile);
    console.log("📦 formData entries ▶️", [...formData.entries()]);
    
    try {
        //const formData = new FormData();
            // 테스트용 더미 파일 추가
            //formData.append("file", new Blob(["hello"], { type: "text/plain" }), "test.txt");
            console.log("📦 formData keys:", [...formData.keys()]);
        const API_URL = "https://frontalface.ai.kr";
        console.log("✅ API 요청 주소:", `${API_URL}/detect-face`);
        const response = await fetch('https://frontalface.ai.kr/detect-face', {
            method: 'POST',
            body: formData,
            //mode: "cors",
        });
        
        const data = await response.json();
        return data;  // { is_frontal: true/false, tilt_direction: "left" / "right", area_ratio_diff: number, explanation: "..." }
    } catch (error) {
        console.error('Error during face detection API request:', error);
        return { is_frontal: false, tilt_direction: "center", explanation: "Error occurred." };  // 기본값 처리
    }
}