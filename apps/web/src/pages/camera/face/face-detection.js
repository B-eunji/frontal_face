import { drawLandmarks } from './face_landmark-draw.js';
import { displayFaceStatus, showGuidingArrow } from '../ui/utils.js';
import { showDirectionArrow } from '../ui/direction-arrow.js';
import {updateFeedbackImage} from '../ui/direction-image.js';

let isProcessing = false;

//정면 판정 깜빡임 방지
let frontalCount = 0;
const frontalThreshold = 3;

// 이전 화면에 반영된 피드백이면 업데이트 안 함
let prevFeedback = '';

// 서버 요청 간격
let lastSentAt = 0;
const SEND_INTERVAL_MS = 250;

// 피드백 결과 흔들림 방지
let candidateFeedback = '';
let candidateCount = 0;
const FEEDBACK_STABLE_COUNT = 3;


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

    // 비디오에 맞춰 캔버스도 반전
    context.setTransform(-1, 0, 0, 1, canvas.width, 0);

    // 얼굴이 보이면 랜드마크는 항상 그려주기
    if (resizedDetections.length > 0) {
      const face = resizedDetections[0];
      drawLandmarks(context, face.landmarks.positions);
    }

    if (resizedDetections.length > 0 && !isProcessing) {
      const now = Date.now();

      if (now - lastSentAt >= SEND_INTERVAL_MS) {
        lastSentAt = now;
        isProcessing = true;

        try {
          // 현재 비디오 프레임을 캔버스로 떠서 blob 생성
          const canvasFull = document.createElement('canvas');
          canvasFull.width = videoElement.videoWidth;
          canvasFull.height = videoElement.videoHeight;

          const ctxFull = canvasFull.getContext('2d');
          ctxFull.drawImage(videoElement, 0, 0, canvasFull.width, canvasFull.height);

          const blob = await new Promise((resolve) =>
            canvasFull.toBlob(resolve, 'image/jpeg')
          );

          const formData = new FormData();
          formData.append('file', blob, 'face.jpg');

          const API_URL =
            window.location.hostname === 'localhost'
              ? 'http://localhost:8000/detect-face'
              : 'https://frontalface.ai.kr/detect-face';

          const response = await fetch(API_URL, {
            method: 'POST',
            body: formData,
            mode: 'cors',
          });

          const result = await response.json();

          // 기준 적용
          const isStableSlope =
            result.slope_horizontal > -0.03 && result.slope_horizontal < 0.12;
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
          let feedback = '인식 중입니다';
          let direction = null;
          let feedbackImage = null;

          if (trulyFrontal) {
            feedback = '정면 인식 완료';
          } else {
            if (result.tilt_direction === 'Left') {
              feedback = '고개를 오른쪽으로 기울여주세요';
              direction = 'down_right';
              feedbackImage = 'slope';
            } else if (result.tilt_direction === 'Right') {
              feedback = '고개를 왼쪽으로 기울여주세요';
              direction = 'down_left';
              feedbackImage = 'slope';
            } else if (result.tilt_direction === 'area_Left') {
              feedback = '고개를 오른쪽으로 돌려주세요';
              direction = 'right';
              feedbackImage = 'area';
            } else if (result.tilt_direction === 'area_Right') {
              feedback = '고개를 왼쪽으로 돌려주세요';
              direction = 'left';
              feedbackImage = 'area';
            } else if (result.tilt_direction === 'Frontal') {
              feedback = '그대로 유지해주세요! 인식 중입니다.';
              direction = null;
            }
          }

          // 피드백 흔들림 방지
          if (feedback === candidateFeedback) {
            candidateCount++;
          } else {
            candidateFeedback = feedback;
            candidateCount = 1;
          }

          if (candidateCount >= FEEDBACK_STABLE_COUNT && feedback !== prevFeedback) {
            displayFaceStatus(feedback);

            const isDone = feedback === '정면 인식 완료';
            showGuidingArrow(isDone ? null : result.tilt_direction);

            showDirectionArrow(direction);
            updateFeedbackImage(feedbackImage);

            prevFeedback = feedback;
          }

          console.log('🧭 정면 판별 로그:', result);
        } catch (err) {
          console.error('서버 통신 오류:', err);
        } finally {
          isProcessing = false;
        }
      }
    }

    // transform 원상복구
    context.setTransform(1, 0, 0, 1, 0, 0);
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