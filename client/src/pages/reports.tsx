import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { useStore } from "@/hooks/use-store";
import { generateExport } from "@/lib/utils/export";

export default function Reports() {
  const { isLoggedIn, currentStore } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [exportStore, setExportStore] = useState(currentStore);
  const [dateRange, setDateRange] = useState("month");
  const [exportFormat, setExportFormat] = useState("csv");

  useEffect(() => {
    if (!isLoggedIn) {
      setLocation("/");
    }
  }, [isLoggedIn, setLocation]);

  const { data: dashboardData } = useQuery({
    queryKey: [`/api/${currentStore}/dashboard`],
    enabled: !!currentStore,
  });

  const handleGenerateExport = async () => {
    try {
      const success = await generateExport(exportStore, dateRange, exportFormat);
      if (success) {
        toast({
          title: "Success",
          description: "Export generated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to generate export",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate export",
        variant: "destructive",
      });
    }
  };

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Reports & Analytics</h2>
              <p className="text-muted-foreground">Generate comprehensive reports and export data</p>
            </div>
            <Button
              className="bg-primary text-primary-foreground"
              onClick={handleGenerateExport}
              data-testid="button-generate-export"
            >
              <i className="fas fa-download mr-2"></i>
              Generate Export
            </Button>
          </div>
          
          {/* Export Configuration */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Export Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Store</label>
                  <Select value={exportStore} onValueChange={setExportStore}>
                    <SelectTrigger data-testid="select-export-store">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boutique">Boutique</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date Range</label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger data-testid="select-date-range">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Export Format</label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger data-testid="select-export-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV Files</SelectItem>
                      <SelectItem value="json">JSON Files</SelectItem>
                      <SelectItem value="excel">Excel Workbook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Export Structure Preview */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Export Structure Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 font-mono text-sm" data-testid="export-structure-preview">
                <div className="text-primary font-bold">LaRosa_Export_{exportStore}_{new Date().toISOString().split('T')[0]}/</div>
                <div className="ml-4">├─ product_catalog_{exportStore}.csv</div>
                <div className="ml-4">├─ sizes_colors_{exportStore}.csv</div>
                <div className="ml-4">├─ inventory_report_{exportStore}.csv</div>
                <div className="ml-4">├─ sales_report_{exportStore}.csv</div>
                <div className="ml-4">├─ returns_report_{exportStore}.csv</div>
                {exportStore === "online" && (
                  <div className="ml-4">├─ orders_report_{exportStore}.csv</div>
                )}
                <div className="ml-4">├─ images/</div>
                <div className="ml-8">│   ├─ product_images...</div>
                <div className="ml-4">└─ readme_{exportStore}.txt</div>
              </div>
            </CardContent>
          </Card>
          
          {/* Analytics Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Today's Revenue</span>
                    <span className="font-bold text-lg" data-testid="today-revenue">
                      AED {dashboardData?.metrics?.todaySales || "0"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Products</span>
                    <span className="font-bold text-lg" data-testid="total-products-analytics">
                      {dashboardData?.metrics?.totalProducts || 0}
                    </span>
                  </div>
                  {currentStore === "online" && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Pending Orders</span>
                      <span className="font-bold text-lg" data-testid="pending-orders-analytics">
                        {dashboardData?.metrics?.pendingOrders || 0}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Low Stock Items</span>
                    <span className="font-bold text-lg text-destructive" data-testid="low-stock-analytics">
                      {dashboardData?.metrics?.lowStockItems || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3" data-testid="analytics-top-products">
                  {dashboardData?.topProducts?.length > 0 ? (
                    dashboardData.topProducts.map((product: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <i className="fas fa-box text-muted-foreground"></i>
                          </div>
                          <div>
                            <p className="font-medium text-sm" data-testid={`analytics-product-name-${index}`}>
                              {product.productName}
                            </p>
                            <p className="text-xs text-muted-foreground" data-testid={`analytics-product-sold-${index}`}>
                              {product.totalSold} sold
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-medium" data-testid={`analytics-product-revenue-${index}`}>
                          AED {product.totalRevenue}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No sales data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
