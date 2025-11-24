let prevMessage = "";

export function displayFaceStatus(status) {
    const statusElement = document.getElementById('face-status');
    if (prevMessage !== status) {
        console.log("🔄 피드백 업데이트됨:", status);
        statusElement.textContent = status;
        prevMessage = status;
    } else {
        console.log("⏸️ 피드백 유지됨:", status);
    }
}

export function showGuidingArrow(direction) {
    const arrow = document.getElementById('arrow');
    if (!arrow) return;

    if (direction === "left") {
        arrow.style.transform = 'rotate(-45deg)';
    } else if (direction === "right") {
        arrow.style.transform = 'rotate(45deg)';
    } else {
        arrow.style.transform = 'rotate(0deg)';
        arrow.style.opacity = "0";
    }
}

let lastStatus = '';

export function updateFaceStatus(newStatus) {
  const statusElement = document.getElementById('face-status');
  if (lastStatus !== newStatus) {
    statusElement.textContent = newStatus;
    lastStatus = newStatus;
  }
}