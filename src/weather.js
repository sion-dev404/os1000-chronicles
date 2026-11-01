// 실제 날씨 가져오기: 브라우저 위치(허용 시) → Open-Meteo(키 불필요). 실패하면 서울, 그것도 실패하면 null.
const SEOUL = { lat: 37.5665, lon: 126.978, place: '서울' };

function locate() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(SEOUL);
    const done = (v) => { clearTimeout(timer); resolve(v); };
    const timer = setTimeout(() => done(SEOUL), 6000);
    navigator.geolocation.getCurrentPosition(
      (p) => done({ lat: p.coords.latitude, lon: p.coords.longitude, place: '내 위치' }),
      () => done(SEOUL),
      { timeout: 5000, maximumAge: 30 * 60 * 1000 },
    );
  });
}

// WMO 날씨 코드 → 하늘 종류
function kindOf(code) {
  if (code === 0) return ['clear', '맑음'];
  if (code <= 2) return ['partly', '구름 조금'];
  if (code === 3) return ['cloudy', '흐림'];
  if (code === 45 || code === 48) return ['fog', '안개'];
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return ['snow', '눈'];
  if (code >= 95) return ['storm', '뇌우'];
  if (code >= 51) return ['rain', '비'];
  return ['cloudy', '흐림'];
}

export async function getWeather() {
  const loc = await locate();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat.toFixed(3)}&longitude=${loc.lon.toFixed(3)}`
      + '&current=temperature_2m,weather_code,is_day&timezone=auto';
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`날씨 요청 실패 ${res.status}`);
    const cur = (await res.json()).current;
    const [kind, label] = kindOf(cur.weather_code);
    return { kind, label, isDay: cur.is_day === 1, temp: Math.round(cur.temperature_2m), place: loc.place };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
