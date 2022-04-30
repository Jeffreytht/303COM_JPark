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

export function formatYyyyMMdd(date) {
  return date.toISOString().split("T")[0];
}

export function isObjEmpty(obj) {
  return Object.keys(obj).length === 0;
}

export function radianToDegree(rad) {
  return (rad * 180) / Math.PI;
}

export function degreeToRadian(degree) {
  return (degree * Math.PI) / 180;
}

export function getBearing(startPoint, destPoint) {
  let startLat = degreeToRadian(startPoint.latitude);
  let startLng = degreeToRadian(startPoint.longitude);
  let destLat = degreeToRadian(destPoint.latitude);
  let destLng = degreeToRadian(destPoint.longitude);

  y = Math.sin(destLng - startLng) * Math.cos(destLat);
  x =
    Math.cos(startLat) * Math.sin(destLat) -
    Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
  let bearing = Math.atan2(y, x);
  bearing = radianToDegree(bearing);
  return (bearing + 360) % 360;
}
