export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function formatAmPm(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var amPm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  var strTime = hours + ":" + minutes + " " + amPm;
  return strTime;
}

export function formatDdMMyyyy(date) {
  return new Date(date).toISOString().split("T")[0];
}

export function formatDdMM(date) {
  return date.getDate() + "/" + (date.getMonth() + 1);
}
