import { Menu, Bell, User } from "lucide-react";
import { useUiStore } from "../../state/ui.store";


const Header = () => {
  const { toggleSidebar } = useUiStore();


  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white shadow-md border-b border-gray-100 sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-gray-100 transition-colors md:hidden">
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-extrabold text-xl tracking-tight text-blue-600 select-none">
          MYPIN
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <User className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;
