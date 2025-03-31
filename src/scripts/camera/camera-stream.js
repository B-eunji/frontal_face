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
    }
};


console.log("faceapi 객체 확인: ", faceapi);  // face-api.js 객체가 제대로 로드됐는지 확인

