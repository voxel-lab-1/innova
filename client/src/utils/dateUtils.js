// Utility to get YYYY-MM-DD in local time zone (prevents UTC offset date shifts to tomorrow)
export const getLocalDateString = (d = new Date()) => {
  const dateObj = typeof d === "string" ? new Date(d.includes("T") ? d : d + "T00:00:00") : (d || new Date());
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Utility to calculate exact age in years from birthdate string YYYY-MM-DD
export const calculateAgeFromBirthdate = (birthdateStr) => {
  if (!birthdateStr) return "";
  const birth = new Date(birthdateStr.includes("T") ? birthdateStr : birthdateStr + "T00:00:00");
  if (isNaN(birth.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : "";
};
