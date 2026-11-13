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

// 오류/안내 문구를 표시하고 피드백 판정 상태를 초기화
function showStatusMessage(message) {
  frontalCount = 0;
  candidateFeedback = '';
  candidateCount = 0;
  prevFeedback = '';   // 복구 후 같은 문구가 다시 나와도 갱신되도록

  displayFaceStatus(message);
  showGuidingArrow(null);
  showDirectionArrow(null);
  updateFeedbackImage(null);
}

// 서버에 요청하고 결과를 종류별 객체로 반환 (loop 흐름에는 영향 없음)
async function requestDetection(url, formData) {
  // 1) 응답을 받았는가
  let response;
  try {
    response = await fetch(url, { method: 'POST', body: formData, mode: 'cors' });
  } catch (err) {
    return { type: 'network-error', error: err };
  }

  // 2) 본문을 읽을 수 있는가
  let body = null;
  let bodyError = null;
  try {
    body = await response.json();
  } catch (err) {
    bodyError = err;
  }

  // 3) HTTP 상태 분류
  if (response.ok) {
    return bodyError
      ? { type: 'body-error', error: bodyError }
      : { type: 'ok', result: body };
  }

  const serverError = body?.error;
  if (response.status === 400 && serverError === 'No face detected') {
    return { type: 'no-face' };
  }
  if (response.status === 400 && serverError === 'Invalid image') {
    return { type: 'invalid-image' };
  }
  return { type: 'http-error', status: response.status, serverError };
}

//실패 처리시 안내 메세지 함수
function handleDetectionFailure(outcome) {
  switch (outcome.type) {
    case 'no-face':
      // 서버가 이 프레임에서 얼굴을 찾지 못함 (원인은 단정하지 않음)
      showStatusMessage('정면 얼굴을 확인하지 못했어요. 카메라를 바라보고, 얼굴이 가려지지 않게 해 주세요.');
      break;
    case 'invalid-image':
      console.warn('서버가 프레임 이미지를 읽지 못했습니다.');
      showStatusMessage('얼굴 판별을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.');
      break;
    case 'network-error':
      console.error('서버 연결 실패:', outcome.error);
      showStatusMessage('서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.');
      break;
    case 'http-error':
      console.error('서버 오류 응답:', outcome.status, outcome.serverError);
      showStatusMessage('서버에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.');
      break;
    case 'body-error':
      console.error('서버 응답 본문 읽기 실패:', outcome.error);
      showStatusMessage('서버 응답을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.');
      break;
  }
}


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

          const API_BASE = import.meta.env.VITE_API_BASE_URL ||
            (window.location.hostname === "localhost"
              ? "http://localhost:8000"
              : "https://frontal-face-backend-docker-image.onrender.com");
          const API_URL = `${API_BASE}/detect-face`;
          console.log("API 요청 주소:", API_URL);

          const outcome = await requestDetection(API_URL, formData);

          if (outcome.type === 'ok') {
            const result = outcome.result;

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
        } else {
          handleDetectionFailure(outcome);
        }
      } catch(err){
          console.error('프레임 처리 오류:', err);
        } finally{
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