const IST_OFFSET_MINUTES = 330;

const pad = (value: number, length = 2) => String(value).padStart(length, '0');

export const getISTDate = (date = new Date()) => {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc + IST_OFFSET_MINUTES * 60000);
};

export const getISTDateString = (date = new Date()) => {
  const ist = getISTDate(date);
  const yyyy = ist.getFullYear();
  const mm = pad(ist.getMonth() + 1);
  const dd = pad(ist.getDate());
  return `${yyyy}-${mm}-${dd}`;
};
