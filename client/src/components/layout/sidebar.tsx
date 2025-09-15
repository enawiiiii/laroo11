import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useStore } from "@/hooks/use-store";

const NAVIGATION_ITEMS = [
  { id: "dashboard", path: "/dashboard", icon: "fas fa-tachometer-alt", label: "Dashboard" },
  { id: "inventory", path: "/inventory", icon: "fas fa-boxes", label: "Inventory Management" },
  { id: "sales", path: "/sales", icon: "fas fa-cash-register", label: "Sales" },
  { id: "orders", path: "/orders", icon: "fas fa-truck", label: "Orders" },
  { id: "returns", path: "/returns", icon: "fas fa-undo", label: "Returns & Exchanges" },
  { id: "reports", path: "/reports", icon: "fas fa-chart-bar", label: "Reports" },
];

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { currentStore } = useStore();

  const handleNavigation = (path: string) => {
    setLocation(path);
  };

  // Filter orders section for boutique store
  const visibleItems = NAVIGATION_ITEMS.filter(item => {
    if (item.id === "orders" && currentStore === "boutique") {
      return false;
    }
    return true;
  });

  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen">
      <nav className="p-4 space-y-2">
        {visibleItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={`w-full justify-start h-auto p-3 ${
                isActive ? "sidebar-active" : ""
              }`}
              onClick={() => handleNavigation(item.path)}
              data-testid={`nav-${item.id}`}
            >
              <i className={`${item.icon} mr-3`} />
              {item.label}
            </Button>
          );
        })}
      </nav>
    </aside>
  );
}
