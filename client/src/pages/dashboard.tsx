import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { useStore } from "@/hooks/use-store";

export default function Dashboard() {
  const { isLoggedIn, currentStore } = useStore();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoggedIn) {
      setLocation("/");
    }
  }, [isLoggedIn, setLocation]);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: [`/api/${currentStore}/dashboard`],
    enabled: !!currentStore,
  });

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Dashboard</h2>
            <p className="text-muted-foreground">Overview of store performance and key metrics</p>
          </div>
          
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Products</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-16 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-foreground" data-testid="metric-total-products">
                        {dashboardData?.metrics?.totalProducts || 0}
                      </p>
                    )}
                  </div>
                  <i className="fas fa-box text-primary text-xl"></i>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Today's Sales</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-20 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-foreground" data-testid="metric-today-sales">
                        AED {dashboardData?.metrics?.todaySales || "0"}
                      </p>
                    )}
                  </div>
                  <i className="fas fa-chart-line text-accent text-xl"></i>
                </div>
              </CardContent>
            </Card>
            
            {currentStore === "online" && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Orders</p>
                      {isLoading ? (
                        <Skeleton className="h-8 w-12 mt-1" />
                      ) : (
                        <p className="text-2xl font-bold text-foreground" data-testid="metric-pending-orders">
                          {dashboardData?.metrics?.pendingOrders || 0}
                        </p>
                      )}
                    </div>
                    <i className="fas fa-clock text-yellow-500 text-xl"></i>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Low Stock Items</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-12 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-foreground" data-testid="metric-low-stock">
                        {dashboardData?.metrics?.lowStockItems || 0}
                      </p>
                    )}
                  </div>
                  <i className="fas fa-exclamation-triangle text-destructive text-xl"></i>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Top Products */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <div>
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-16 mt-1" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3" data-testid="top-products-list">
                  {dashboardData?.topProducts?.length > 0 ? (
                    dashboardData.topProducts.map((product: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <i className="fas fa-box text-muted-foreground"></i>
                          </div>
                          <div>
                            <p className="font-medium text-sm" data-testid={`product-name-${index}`}>
                              {product.productName}
                            </p>
                            <p className="text-xs text-muted-foreground" data-testid={`product-sold-${index}`}>
                              {product.totalSold} sold
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-medium" data-testid={`product-revenue-${index}`}>
                          AED {product.totalRevenue}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No sales data available</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
