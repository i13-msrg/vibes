export default function convertToDisplayTime(seconds: number | null): string {
  if (seconds === null) {
    return '';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Number(seconds.toString().split('.')[1]) || 0;


  if (hours) {
    return `${hours}h ${minutes}m ${secs}.${millis}s `;
  }

  if (minutes) {
    return `${minutes}m ${secs}.${millis}s `;
  }

  return `${secs}.${millis}s `;
}
