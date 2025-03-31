export let modelLoaded = false;

// 모델 로드를 위한 함수 추가
export async function loadModels() {
    console.log("모델 로드 시작");
    try{
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        console.log("모델 로드 성공");

        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        console.log("얼굴 68개의 랜드마크 로드 성공");

        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        console.log("얼굴 인식 모델 로드 성공");

        modelLoaded = true;
    } catch(err){
        console.log("모델 로드 실패: ", err);
        modelLoaded = false;
    }
    console.log("모델 로딩 상태:", modelLoaded);
}