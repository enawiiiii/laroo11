import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/hooks/use-store";
import { EMPLOYEES, STORES } from "@/lib/constants";

export default function Login() {
  const [, setLocation] = useLocation();
  const { setEmployee, setStore, isLoggedIn } = useStore();
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
    <div className="login-container min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardContent className="p-8">
          {/* LaRosa Branding */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">LaRosa</h1>
            <p className="text-muted-foreground text-sm">Fashion Store Management</p>
          </div>

          <div className="space-y-6">
            {/* Employee Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">Hello, who are you?</label>
              <div className="space-y-2">
                {EMPLOYEES.map((employee) => (
                  <Button
                    key={employee.id}
                    variant={selectedEmployee === employee.id ? "default" : "outline"}
                    className="w-full justify-start h-auto p-3"
                    onClick={() => handleEmployeeSelect(employee.id)}
                    data-testid={`button-employee-${employee.id}`}
                  >
                    <i className={`${employee.icon} mr-3 text-muted-foreground`} />
                    {employee.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Store Selection */}
            {showStoreSelection && (
              <div>
                <label className="block text-sm font-medium mb-3">Select Store</label>
                <div className="grid grid-cols-2 gap-3">
                  {STORES.map((store) => (
                    <Button
                      key={store.id}
                      variant={selectedStore === store.id ? "default" : "outline"}
                      className="p-4 h-auto flex-col"
                      onClick={() => handleStoreSelect(store.id as "boutique" | "online")}
                      data-testid={`button-store-${store.id}`}
                    >
                      <i className={`${store.icon} text-2xl text-primary mb-2`} />
                      <span className="text-sm font-medium">{store.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Button
              className="w-full"
              disabled={!canLogin}
              onClick={handleLogin}
              data-testid="button-login"
            >
              Continue to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
