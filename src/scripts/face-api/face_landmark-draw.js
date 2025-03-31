//캔버스 랜드마크 그리기 함수
export function drawLandmarks(context, landmarks) {
    context.fillStyle = "magenta";
    landmarks.forEach(pt => {
    context.beginPath();
    context.arc(pt.x, pt.y, 2, 0, 2 * Math.PI);
    context.fill();
    //console.log("landmark x:", pt.x, "flipped:", canvas.width - pt.x);
    });
}