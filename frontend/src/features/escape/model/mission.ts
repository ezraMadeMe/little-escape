const MISSIONS = [
    "도착하면 주변 50m 안에서 가장 예쁜 하늘 사진 찍기",
    "근처 카페(또는 편의점)에서 음료 하나 사서 5분 앉아있기",
    "도착 지점에서 반경 200m 산책 10분",
    "도착하면 오늘 기분을 한 문장으로 메모하기",
    "도착하면 주변 소리(사람/바람/차) 30초 집중하기",
  ];
  
  export function pickMission(seed: number) {
    // seed(acceptedAt)를 기반으로 1회 결정
    const idx = Math.abs(seed) % MISSIONS.length;
    return MISSIONS[idx];
  }
  