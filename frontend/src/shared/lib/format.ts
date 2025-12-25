export function pad2(n: number) {
    return n < 10 ? `0${n}` : `${n}`;
  }
  
  export function formatClock(ms: number) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const mm = Math.floor(totalSec / 60);
    const ss = totalSec % 60;
    return `${pad2(mm)}:${pad2(ss)}`;
  }
  
  export function formatDuration(ms: number) {
    const totalMin = Math.max(0, Math.round(ms / 60000));
    if (totalMin < 60) return `${totalMin}분`;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return m ? `${h}시간 ${m}분` : `${h}시간`;
  }
  