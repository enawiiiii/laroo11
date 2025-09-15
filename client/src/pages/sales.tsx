import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import SalesForm from "@/components/sales/sales-form";
import { useStore } from "@/hooks/use-store";
import { formatDistanceToNow } from "date-fns";
import type { SaleWithDetails } from "@shared/schema";

export default function Sales() {
  const { isLoggedIn, currentStore } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSalesForm, setShowSalesForm] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      setLocation("/");
    }
  }, [isLoggedIn, setLocation]);

  const { data: sales = [], isLoading } = useQuery({
    queryKey: [`/api/${currentStore}/sales`],
    enabled: !!currentStore,
  });

  const handleSaleSuccess = () => {
    setShowSalesForm(false);
    queryClient.invalidateQueries({ queryKey: [`/api/${currentStore}/sales`] });
    queryClient.invalidateQueries({ queryKey: [`/api/${currentStore}/dashboard`] });
    toast({
      title: "Success",
      description: "Sale completed successfully",
    });
  };

  const getPaymentMethodDisplay = (method: string) => {
    switch (method) {
      case "cash":
        return { label: "Cash", variant: "default" as const };
      case "card":
        return { label: "Card", variant: "secondary" as const };
      default:
        return { label: method, variant: "outline" as const };
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
              <h2 className="text-2xl font-bold text-foreground mb-2">Sales Management</h2>
              <p className="text-muted-foreground">
                Process <span className="capitalize">{currentStore}</span> sales with automatic inventory updates
              </p>
            </div>
            <Button
              className="bg-primary text-primary-foreground"
              onClick={() => setShowSalesForm(!showSalesForm)}
              data-testid="button-new-sale"
            >
              <i className="fas fa-plus mr-2"></i>
              New Sale
            </Button>
          </div>
          
          {/* Sales Form */}
          {showSalesForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Create New Sale</CardTitle>
              </CardHeader>
              <CardContent>
                <SalesForm
                  onSuccess={handleSaleSuccess}
                  onCancel={() => setShowSalesForm(false)}
                />
              </CardContent>
            </Card>
          )}
          
          {/* Recent Sales */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      </TableRow>
                    ))
                  ) : sales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No sales found
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales.map((sale: any) => {
                      const paymentDisplay = getPaymentMethodDisplay(sale.paymentMethod);
                      return (
                        <TableRow key={sale.id}>
                          <TableCell className="font-mono text-sm" data-testid={`sale-id-${sale.id}`}>
                            #{sale.saleId}
                          </TableCell>
                          <TableCell className="text-sm" data-testid={`sale-product-${sale.id}`}>
                            {sale.productColor?.product?.brand} {sale.productColor?.product?.modelNumber}
                          </TableCell>
                          <TableCell className="text-sm" data-testid={`sale-color-${sale.id}`}>
                            {sale.productColor?.colorName}
                          </TableCell>
                          <TableCell className="text-sm" data-testid={`sale-size-${sale.id}`}>
                            {sale.size}
                          </TableCell>
                          <TableCell className="text-sm" data-testid={`sale-quantity-${sale.id}`}>
                            {sale.quantity}
                          </TableCell>
                          <TableCell>
                            <Badge variant={paymentDisplay.variant} data-testid={`sale-payment-${sale.id}`}>
                              {paymentDisplay.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-medium" data-testid={`sale-total-${sale.id}`}>
                            AED {sale.totalAmount}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground" data-testid={`sale-time-${sale.id}`}>
                            {formatDistanceToNow(new Date(sale.createdAt), { addSuffix: true })}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
