import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import api from "../axios";

type Props = {
  onSelect: (data: { address: string; lat?: string; lng?: string }) => void;
  onClose: () => void;
};

async function fetchGeocode(address: string) {
  const res = await api.get("/geocode", { params: { query: address } });
  return res.data as { address: string; latitude?: string; longitude?: string };
}

const DaumPostcodeModal = ({ onSelect, onClose }: Props) => {
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const embedRef = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    let removed = false;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleKey);

    const ensureScript = () =>
      new Promise<void>((resolve, reject) => {
        if (window.daum?.Postcode) return resolve();
        const script = document.createElement("script");
        script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Daum Postcode script load failed"));
        document.body.appendChild(script);
      });

    ensureScript().then(() => {
      if (removed || !embedRef.current) return;
      const pc = new window.daum.Postcode({
        oncomplete: async (data: any) => {
          let fullAddress = data.address;
          let extra = "";
          if (data.addressType === "R") {
            if (data.bname) extra += data.bname;
            if (data.buildingName)
              extra += (extra ? `, ${data.buildingName}` : data.buildingName);
            if (extra) fullAddress += ` (${extra})`;
          }

          try {
            // ✅ Spring Boot 서버에 주소로 위도/경도 요청
            const res = await fetchGeocode(fullAddress);
            onSelect({
              address: res.address || fullAddress,
              lat: res.latitude,
              lng: res.longitude,
            });
          } catch {
            onSelect({ address: fullAddress });
          }
        },
        onclose: () => onClose(),
        width: "100%",
        height: "100%",
      });

      pc.embed(embedRef.current, { autoClose: false });
    });

    return () => {
      removed = true;
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [onSelect, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={backdropRef}
      onClick={(e) => e.target === backdropRef.current && onClose()}
      className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-4"
    >
      <div className="relative w-full max-w-[720px] rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b bg-white/70 backdrop-blur">
          <h2 className="text-sm sm:text-base font-semibold text-slate-800">주소 검색</h2>
          <button
            onClick={onClose}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            닫기
          </button>
        </div>
        <div className="p-3 sm:p-4">
          <div className="relative w-full h-[70vh] sm:h-[60vh] min-h-[360px]">
            <div ref={embedRef} className="absolute inset-0" />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DaumPostcodeModal;
