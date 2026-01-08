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