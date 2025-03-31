import { drawLandmarks } from '/scripts/face-api/face_landmark-draw.js';
import { displayFaceStatus, showGuidingArrow } from '../utils/utils.js';
import { showDirectionArrow } from './direction-arrow.js';
import {updateFeedbackImage} from './direction-image.js';

let isProcessing = false;
let frontalCount = 0;
const frontalThreshold = 3;

let prevFeedback = '';

export async function startFaceDetection(videoElement) {
  const canvas = document.getElementById('overlay');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  async function loop() {
    const detections = await faceapi
      .detectAllFaces(videoElement)
      .withFaceLandmarks()
      .withFaceDescriptors();

    const resizedDetections = faceapi.resizeResults(detections, {
      width: canvas.width,
      height: canvas.height,
    });

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.setTransform(-1, 0, 0, 1, canvas.width, 0); // 좌우 반전

    if (resizedDetections.length > 0 && !isProcessing) {
      isProcessing = true;

      const face = resizedDetections[0];
      drawLandmarks(context, face.landmarks.positions); // 항상 마젠타

/*    const faceImage = cropFace(videoElement, face.detection.box);
      const blob = await new Promise(resolve =>
        faceImage.toBlob(resolve, 'image/jpeg')
      ); */
      const canvasFull = document.createElement('canvas');
      canvasFull.width = videoElement.videoWidth;
      canvasFull.height = videoElement.videoHeight;
      const ctxFull = canvasFull.getContext('2d');
      ctxFull.drawImage(videoElement, 0, 0, canvasFull.width, canvasFull.height);
      const blob = await new Promise(resolve =>
        canvasFull.toBlob(resolve, 'image/jpeg')
      );


      const formData = new FormData();
      formData.append('file', blob, 'face.jpg');

      try {
        const response = await fetch('http://127.0.0.1:8000/detect-face', {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();

        // 기준 적용
        const isStableSlope = result.slope_horizontal > -0.015 && result.slope_horizontal < 0.015;
        const isStableArea = result.area_ratio_diff <= 0.08;

        let trulyFrontal = false;
        if (isStableSlope && isStableArea) {
          frontalCount++;
          if (frontalCount >= frontalThreshold) {
            trulyFrontal = true;
          }
        } else {
          frontalCount = 0;
        }

        // 피드백 판단
        let feedback = "인식 중입니다";
        let direction = null;
        let feedbackImage = null;
        if (!trulyFrontal) {
          if (result.tilt_direction === 'Left') {
            feedback = '고개를 오른쪽으로 기울여주세요';
            direction = 'down_right'
            feedbackImage = 'slope';
          } else if (result.tilt_direction === 'Right') {
            feedback = '고개를 왼쪽으로 기울여주세요';
            direction = 'down_left'
            feedbackImage = 'slope';
          } else if (result.tilt_direction === 'area_Left'){
            feedback = `고개를 오른쪽으로 돌려주세요`;
            direction = 'right'
            feedbackImage = 'area';
          } else if (result.tilt_direction === 'area_Right'){
            feedback = `고개를 왼쪽으로 돌려주세요`;
            direction = 'left'
            feedbackImage = 'area';
          }
          else if (result.tilt_direction === 'Frontal'){
            feedback = "정면 인식 완료"
            direction = null;
          }
        }

        // 피드백이 바뀌었을 때만 업데이트
        if (feedback !== prevFeedback) {
          displayFaceStatus(feedback);
          showGuidingArrow(feedback === '정면 인식됨' ? null : result.tilt_direction);
          showDirectionArrow(direction);
          updateFeedbackImage(feedbackImage);
          prevFeedback = feedback;
        }

        console.log("🧭 정면 판별 로그:", result);
      } catch (err) {
        console.error('서버 통신 오류:', err);
      }

      isProcessing = false;
    }

    context.setTransform(1, 0, 0, 1, 0, 0); // 원상복구
    requestAnimationFrame(loop);
  }

  loop();
}

function cropFace(video, box) {
  const canvas = document.createElement('canvas');
  canvas.width = box.width;
  canvas.height = box.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, box.x, box.y, box.width, box.height, 0, 0, box.width, box.height);
  return canvas;
}