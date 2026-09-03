// Utility to get YYYY-MM-DD in local time zone (prevents UTC offset date shifts to tomorrow)
export const getLocalDateString = (d = new Date()) => {
  const dateObj = typeof d === "string" ? new Date(d.includes("T") ? d : d + "T00:00:00") : (d || new Date());
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
