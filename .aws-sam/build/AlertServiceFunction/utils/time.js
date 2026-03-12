const IST_OFFSET_MINUTES = 330;

const pad = (value, length = 2) => String(value).padStart(length, '0');

export const toISTISOString = (date = new Date()) => {
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const ist = new Date(utc + IST_OFFSET_MINUTES * 60000);

    const yyyy = ist.getFullYear();
    const mm = pad(ist.getMonth() + 1);
    const dd = pad(ist.getDate());
    const hh = pad(ist.getHours());
    const min = pad(ist.getMinutes());
    const ss = pad(ist.getSeconds());
    const ms = pad(ist.getMilliseconds(), 3);

    return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}.${ms}+05:30`;
};
