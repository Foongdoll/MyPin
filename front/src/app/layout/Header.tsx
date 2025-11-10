import { Menu, Bell, User as UserIcon, LogOut } from "lucide-react";
import { useUiStore } from "../../state/ui.store";
import { useSessionStore } from "../../state/session.store";

const Header = () => {
  const { toggleSidebar } = useUiStore();
  const { user, logout } = useSessionStore();

  const handleLogout = async () => {
    await logout({ reason: "manual" });
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white shadow-md border-b border-gray-100 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-gray-100 transition-colors md:hidden">
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-extrabold text-xl tracking-tight text-blue-600 select-none">MYPIN</span>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="알림">
          <Bell className="w-5 h-5 text-blue-600 bell-shake" />
        </button>
        <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700">
          <UserIcon className="w-4 h-4" />
          <span>{user?.name ?? "게스트"}</span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>로그아웃</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
