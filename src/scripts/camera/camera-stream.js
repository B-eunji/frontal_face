import { startFaceDetection } from './face-detection.js';
import { loadModels, modelLoaded } from '../face-api/model-load.js';
import * as faceapi from 'face-api.js';

//웹 캠 스트리밍
export async function setupCamera(videoElement) {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { exact: 413 },
                height: { exact: 531 },
                facingMode: "user"
            }
        });        
        videoElement.srcObject = stream;
            
        //모델 로드 후 얼굴 감지 시작
        videoElement.onloadedmetadata = async () => {
            await loadModels();
            if (modelLoaded){
                startFaceDetection(videoElement);
            }else{
                console.error("Model failed to load.");
            }
        };
    } catch (error) {
        console.error("Error accessing camera:", error);
        // 카메라가 없거나 접근 실패 시 안내 문구 출력
        const container = document.querySelector('.camera-view');
        container.innerHTML = `
            <div class="no-camera">
                <p>현재 환경에서는 카메라 접근이 불가능합니다.<br>
                지원되는 브라우저/디바이스에서 확인해주세요.</p>
            </div>
        `;
    }
};


console.log("faceapi 객체 확인: ", faceapi);  // face-api.js 객체가 제대로 로드됐는지 확인

