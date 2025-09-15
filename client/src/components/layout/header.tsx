import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/use-store";
import { useLocation } from "wouter";

export default function Header() {
  const { currentEmployee, currentStore, logout } = useStore();
  const [, setLocation] = useLocation();

  const handleChangeEmployee = () => {
    logout();
    setLocation("/");
  };

  const handleChangeStore = () => {
    logout();
    setLocation("/");
  };

  const handleExportData = () => {
    // TODO: Implement export functionality
    console.log("Export data clicked");
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-primary">LaRosa</h1>
          <div className="h-6 w-px bg-border"></div>
          <div className="text-sm text-muted-foreground">
            <span className="capitalize" data-testid="text-current-employee">{currentEmployee}</span> • 
            <span className="capitalize ml-1" data-testid="text-current-store">{currentStore}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleChangeEmployee}
            data-testid="button-change-employee"
          >
            <i className="fas fa-user-cog mr-2"></i>
            Change Employee
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleChangeStore}
            data-testid="button-change-store"
          >
            <i className="fas fa-store mr-2"></i>
            Change Store
          </Button>
          <Button
            className="bg-primary text-primary-foreground hover:opacity-90"
            size="sm"
            onClick={handleExportData}
            data-testid="button-export-data"
          >
            <i className="fas fa-download mr-2"></i>
            Export Data
          </Button>
        </div>
      </div>
    </header>
  );
}
