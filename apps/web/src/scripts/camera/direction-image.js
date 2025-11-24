export function updateFeedbackImage(feedbackType) {
  const feedbackImage = document.getElementById("feedbackImage");

  if (!feedbackImage) return;

  switch (feedbackType) {
    case "area":
      feedbackImage.src = "/images/area.png";
      feedbackImage.style.display = 'block';
      break;
    case "slope":
      feedbackImage.src = "/images/slope.png";
      feedbackImage.style.display = 'block';
      break;
    default:
      feedbackImage.style.display = 'none';  // 정면 일 때 감추기
  }
}