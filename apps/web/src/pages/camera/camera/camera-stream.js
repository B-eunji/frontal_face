import { startFaceDetection } from '../face/face-detection.js';
import { loadModels, modelLoaded } from '../face/model-load.js';
import * as faceapi from 'face-api.js';
import { displayFaceStatus } from '../ui/utils.js';


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
                displayFaceStatus('얼굴 인식 모델을 불러오지 못했어요. 페이지를 새로고침해 주세요.');
            }
        };
    } catch (error) {
        // 에러 안내
        console.error("Error accessing camera:", error);

        //카메라 접근 상태 문구 출력
        const message = error.name === 'NotAllowedError'
            ? '카메라 접근이 차단됐어요.<br>브라우저나 시스템 설정에서 카메라 권한을 확인해 주세요.'
            : '현재 환경에서는 카메라 접근이 불가능합니다.<br>지원되는 브라우저/디바이스에서 확인해주세요.';

        const container = document.querySelector('.camera-view');
        container.innerHTML = `
            <div class="no-camera">
                <p>${message}</p>
            </div>
        `;
    }
};


console.log("faceapi 객체 확인: ", faceapi);  // face-api.js 객체가 제대로 로드됐는지 확인

