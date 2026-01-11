export const getDurationInDays = (
  startDate: string,
  endDate: string
): number => {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return Math.ceil((end - start) / MS_PER_DAY);
};
