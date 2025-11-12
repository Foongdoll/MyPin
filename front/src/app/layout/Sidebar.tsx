import { Home, Calendar, Book, Wallet, Settings, X } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useUiStore } from "../../state/ui.store";

const navItems = [
  { icon: Home, label: "홈", path: "/home" },
  { icon: Calendar, label: "일정", path: "/schedule" },
  { icon: Book, label: "노트", path: "/notes" },
  { icon: Wallet, label: "가계부", path: "/ledger" },
  { icon: Settings, label: "설정", path: "/settings" },
];

const Sidebar = () => {
  const { sidebarOpen, toggleSidebar } = useUiStore();
  const { pathname } = useLocation();    
  
  return (
    <>
      {/* 데스크탑: 항상 보임 (md 이상) */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-100 shadow-sm">
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ icon: Icon, label, path }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:-translate-1  ${isActive || (pathname.indexOf("note") !== -1 && path.indexOf("note") !== -1)
                  ? "bg-blue-100 text-blue-700 font-semibold"
                  : "hover:bg-gray-100 text-gray-700 "
                }`
              }
            >              
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100 text-sm text-gray-500">
          © {new Date().getFullYear()} MYPIN
        </div>
      </aside>

      
      <div className={`fixed inset-0 z-40 md:hidden ${sidebarOpen ? "" : "pointer-events-none"}`}>
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${sidebarOpen ? "opacity-100" : "opacity-0"}`}
          onClick={toggleSidebar}
        />      
        <div
          className={`absolute left-0 top-0 h-full w-72 bg-white shadow-xl transition-transform duration-200
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between px-4 h-14 border-b">
            <span className="font-semibold">메뉴</span>
            <button onClick={toggleSidebar} className="p-2 rounded-md hover:bg-gray-100" aria-label="닫기">
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="p-3 space-y-1">
            {navItems.map(({ icon: Icon, label, path }) => (
              <NavLink
                key={path}
                to={path}
                onClick={toggleSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive || (pathname.indexOf("note") !== -1 && path.indexOf("note") !== -1)
                    ? "bg-blue-100 text-blue-700 font-semibold"
                    : "hover:bg-gray-50 text-gray-700"
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
