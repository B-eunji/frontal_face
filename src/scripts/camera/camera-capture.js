//웹 캠 캡쳐 및 FastAPI에 전송

export async function captureImage(videoElement) {
    await new Promise(resolve => {
      if (videoElement.readyState >= 2) {
        resolve();
      } else {
        videoElement.addEventListener('loadeddata', resolve, { once: true });
      }
    });

    const blob = await new Promise((resolve,reject) => {
        const canvas = document.createElement("canvas");
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const context = canvas.getContext("2d");
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error("Failed to capture image: Blob is null"));
            }
        }, "image/jpeg");
    });
    return blob
}

//캡쳐 API에 전송
/* export async function sendImageToAPI(videoElement){
    const blob = await captureImage(videoElement);
    const formData = new FormData();
    formData.append('file', blob, 'image.jpg');

    //API 서버에 POST 수락 요청
    const response = await fetch('http://localhost:8000/detect-face',{
        method: 'POST',
        body: formData
    });

    if (response.ok){
        const data = await response.json();
        console.log('Face Detection Result:', data);
        return data;
    } else{
        console.error('Error with face detection API:'. response.statusText);
    }
} */