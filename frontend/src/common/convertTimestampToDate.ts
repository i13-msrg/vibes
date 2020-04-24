const fillInSingleDigit = (value: number): string => {
  if (value < 10) {
    return `0${value}`;
  }

  return `${value}`;
};

export default function convertTimestampToDate(value: number): string {
  const date = new Date(value);
  return (
    `${date.getFullYear()}-${fillInSingleDigit((date.getMonth() + 1))}-${fillInSingleDigit(date.getDate())}T${fillInSingleDigit(date.getHours())}:${fillInSingleDigit(date.getMinutes())}`
  );
}
