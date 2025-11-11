import axios from "axios";

const VITE_NAVER_MAPS_KEY = import.meta.env.VITE_NAVER_MAPS_KEY;
const VITE_NAVER_MAPS_API_KEY = import.meta.env.VITE_NAVER_MAPS_API_KEY;
const NAVER_GEOCODE_URL = "https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode";

export async function geocodeAddress(query: string): Promise<{ latitude: number; longitude: number; }> {
  const response = await axios.get(NAVER_GEOCODE_URL, {
    headers: {
      "Accept": "application/json",
      "X-NCP-APIGW-API-KEY-ID": VITE_NAVER_MAPS_KEY,
      "X-NCP-APIGW-API-KEY": VITE_NAVER_MAPS_API_KEY,
    },
    params: {
      query,
    },
  });

  const addresses = response.data.addresses;
  if (!addresses || addresses.length === 0) {
    throw new Error("주소를 변환할 수 없습니다.");
  }

  const first = addresses[0];
  return {
    latitude: parseFloat(first.y),
    longitude: parseFloat(first.x),
  };
}
