//방향 제시
export function showDirectionArrow(direction) {
    const arrow = document.getElementById('directionArrow');
    if (!direction) {
      arrow.style.display = 'none';
      return;
    }
  
    const directionMap = {
      'down_left': '/images/arrow-down-left.png',
      'down_right': '/images/arrow-down-right.png',
      'left': '/images/arrow-left.png',
      'right': '/images/arrow-right.png',
    };
  
    arrow.src = directionMap[direction];
    arrow.style.display = 'block';
  }