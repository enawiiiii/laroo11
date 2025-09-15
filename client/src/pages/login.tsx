import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/hooks/use-store";
import { useI18n } from "@/lib/i18n";
import { EMPLOYEES, STORES } from "@/lib/constants";

export default function Login() {
  const [, setLocation] = useLocation();
  const { setEmployee, setStore, isLoggedIn } = useStore();
  const { t } = useI18n();
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedStore, setSelectedStore] = useState<"boutique" | "online" | "">("");
  const [showStoreSelection, setShowStoreSelection] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      setLocation("/dashboard");
    }
  }, [isLoggedIn, setLocation]);

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    setShowStoreSelection(true);
  };

  const handleStoreSelect = (storeId: "boutique" | "online") => {
    setSelectedStore(storeId);
  };

  const handleLogin = () => {
    if (selectedEmployee && selectedStore) {
      setEmployee(selectedEmployee);
      setStore(selectedStore);
      setLocation("/dashboard");
    }
  };

  const canLogin = selectedEmployee && selectedStore;

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg p-4 login-theme">
      <Card className="w-full max-w-md card-gold-border bg-card/95 backdrop-blur-sm shadow-2xl">
        <CardContent className="p-8">
          {/* LaRosa Branding */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold gold-gradient mb-4">LaRosa</h1>
            <p className="text-card-foreground text-base font-medium">نظام إدارة متجر الأزياء</p>
          </div>

          <div className="space-y-6">
            {/* Employee Selection */}
            <div>
              <label className="block text-sm font-medium mb-3 text-right text-card-foreground">{t("select_employee")}</label>
              <div className="space-y-2">
                {EMPLOYEES.map((employee) => (
                  <Button
                    key={employee.id}
                    variant={selectedEmployee === employee.id ? "default" : "outline"}
                    className={`w-full justify-between h-auto p-4 ${selectedEmployee === employee.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50'} transition-all duration-200`}
                    onClick={() => handleEmployeeSelect(employee.id)}
                    data-testid={`button-employee-${employee.id}`}
                  >
                    <span className="text-right font-medium">{employee.name}</span>
                    <i className={`${employee.icon} ${selectedEmployee === employee.id ? 'text-primary-foreground' : 'text-primary'}`} />
                  </Button>
                ))}
              </div>
            </div>

            {/* Store Selection */}
            {showStoreSelection && (
              <div>
                <label className="block text-sm font-medium mb-3 text-right text-card-foreground">{t("select_store")}</label>
                <div className="grid grid-cols-2 gap-3">
                  {STORES.map((store) => (
                    <Button
                      key={store.id}
                      variant={selectedStore === store.id ? "default" : "outline"}
                      className={`p-6 h-auto flex-col ${selectedStore === store.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50'} transition-all duration-200`}
                      onClick={() => handleStoreSelect(store.id as "boutique" | "online")}
                      data-testid={`button-store-${store.id}`}
                    >
                      <i className={`${store.icon} text-3xl ${selectedStore === store.id ? 'text-primary-foreground' : 'text-primary'} mb-3`} />
                      <span className="text-base font-medium">{store.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Button
              className="w-full mt-8 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-4 text-lg border-2 border-primary hover:border-primary/90 transition-all duration-200 shadow-lg"
              disabled={!canLogin}
              onClick={handleLogin}
              data-testid="button-login"
            >
              {t("login")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
