import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { createPortal } from "react-dom";
import { Container, Marker, NaverMap, useNavermaps } from "react-naver-maps";

type Props = {
  setVisible: Dispatch<SetStateAction<boolean>>;
  addr: string | null; 
};

const ScheduleMaps = ({ setVisible, addr }: Props) => {
  const navermaps = useNavermaps();
  const backdropRef = useRef<HTMLDivElement | null>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // ✅ ESC & 스크롤 잠금
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setVisible(false);
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [setVisible]);

  // ✅ 주소가 변경될 때마다 지오코딩 수행 (주소 → 좌표)
  useEffect(() => {
    if (!addr || !navermaps?.Service) return;

    navermaps.Service.geocode(
      { query: addr },
      (status: any, response: any) => {
        if (status !== navermaps.Service.Status.OK) {
          console.warn("지오코딩 실패:", status);
          setCoords(null);
          return;
        }

        const result = response.v2?.addresses?.[0];
        if (result) {
          const lat = parseFloat(result.y);
          const lng = parseFloat(result.x);          
          setCoords({ lat, lng });
        } else {
          setCoords(null);
        }
      }
    );
  }, [addr, navermaps]);

  // ✅ 바깥 클릭 시 닫기
  const onBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) setVisible(false);
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={backdropRef}
      onClick={onBackdropClick}
      className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-[960px] rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b bg-white/70 backdrop-blur">
          <h2 className="text-sm sm:text-base font-semibold text-slate-800">
            지도 {addr ? `- ${addr}` : ""}
          </h2>
          <button
            onClick={() => setVisible(false)}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            aria-label="닫기"
          >
            닫기
          </button>
        </div>

        {/* 지도 */}
        <div className="p-3 sm:p-4">
          <div className="relative w-full h-[70vh] sm:h-[60vh] min-h-[320px]">
            <Container
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
              }}
            >
              <NaverMap                
                center={
                  coords
                    ? new navermaps.LatLng(coords.lat, coords.lng)
                    : new navermaps.LatLng(37.5665, 126.9780)
                }                
                zoom={coords ? 16 : 14} // 좌표 있을 경우 좀 더 확대
              >
                {coords && (
                  <Marker
                    position={new navermaps.LatLng(coords.lat, coords.lng)}
                    title={addr || ''}
                  />
                )}
              </NaverMap>
            </Container>

            {!coords && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm text-slate-600">
                {addr
                  ? "주소를 불러오고 있습니다..."
                  : "주소 정보가 없습니다."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ScheduleMaps;
