import CryptoJS from "crypto-js";

// 절대 하드코딩 금지 — 반드시 환경 변수 사용
const SECRET_KEY = import.meta.env.VITE_STORAGE_KEY || "fallback-key";

export const secureStorage = {
  getItem: (name: string): string | null => {
    const encrypted = localStorage.getItem(name);
    if (!encrypted) return null;
    try {
      const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (e) {
      console.error("복호화 실패", e);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    const encrypted = CryptoJS.AES.encrypt(value, SECRET_KEY).toString();
    localStorage.setItem(name, encrypted);
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
  },
};
