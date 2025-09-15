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
import OrderForm from "@/components/orders/order-form";
import OrderDetailsModal from "@/components/orders/order-details-modal";
import { useStore } from "@/hooks/use-store";
import { apiRequest } from "@/lib/queryClient";
import { ORDER_STATUSES } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";
import type { OrderWithDetails } from "@shared/schema";

export default function Orders() {
  const { isLoggedIn, currentStore } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (!isLoggedIn) {
      setLocation("/");
    }
    // Redirect boutique users away from orders page
    if (currentStore === "boutique") {
      setLocation("/sales");
    }
  }, [isLoggedIn, currentStore, setLocation]);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/orders", statusFilter],
    enabled: currentStore === "online",
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      await apiRequest("PUT", `/api/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: [`/api/${currentStore}/dashboard`] });
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  const handleOrderSuccess = () => {
    setShowOrderForm(false);
    queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    queryClient.invalidateQueries({ queryKey: [`/api/${currentStore}/dashboard`] });
    toast({
      title: "Success",
      description: "Order created successfully",
    });
  };

  const getStatusDisplay = (status: string) => {
    const statusConfig = ORDER_STATUSES.find(s => s.value === status);
    if (!statusConfig) return { label: status, variant: "outline" as const };

    const variantMap = {
      yellow: "secondary" as const,
      blue: "default" as const,
      green: "default" as const,
      red: "destructive" as const,
    };

    return {
      label: statusConfig.label,
      variant: variantMap[statusConfig.color as keyof typeof variantMap] || "outline" as const,
    };
  };

  const getPaymentMethodDisplay = (method: string) => {
    switch (method) {
      case "cash_on_delivery":
        return { label: "Cash on Delivery", variant: "default" as const };
      case "bank_transfer":
        return { label: "Bank Transfer", variant: "secondary" as const };
      default:
        return { label: method, variant: "outline" as const };
    }
  };

  if (!isLoggedIn || currentStore !== "online") return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Online Orders</h2>
              <p className="text-muted-foreground">Manage online orders with customer information and delivery tracking</p>
            </div>
            <Button
              className="bg-primary text-primary-foreground"
              onClick={() => setShowOrderForm(!showOrderForm)}
              data-testid="button-new-order"
            >
              <i className="fas fa-plus mr-2"></i>
              New Order
            </Button>
          </div>

          {/* Order Form */}
          {showOrderForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Create New Order</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderForm
                  onSuccess={handleOrderSuccess}
                  onCancel={() => setShowOrderForm(false)}
                />
              </CardContent>
            </Card>
          )}
          
          {/* Order Status Filters */}
          <div className="flex space-x-4 mb-6">
            <Button
              variant={statusFilter === "" ? "default" : "outline"}
              onClick={() => setStatusFilter("")}
              data-testid="filter-all-orders"
            >
              All Orders
            </Button>
            {ORDER_STATUSES.map((status) => (
              <Button
                key={status.value}
                variant={statusFilter === status.value ? "default" : "outline"}
                onClick={() => setStatusFilter(status.value)}
                data-testid={`filter-${status.value}`}
              >
                {status.label}
              </Button>
            ))}
          </div>
          
          {/* Orders Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Tracking</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-12 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                      </TableRow>
                    ))
                  ) : orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order: any) => {
                      const statusDisplay = getStatusDisplay(order.status);
                      const paymentDisplay = getPaymentMethodDisplay(order.paymentMethod);
                      
                      return (
                        <TableRow key={order.id} className="hover:bg-muted">
                          <TableCell className="font-mono text-sm" data-testid={`order-id-${order.id}`}>
                            #{order.orderId}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm" data-testid={`customer-name-${order.id}`}>
                                {order.customerName}
                              </p>
                              <p className="text-xs text-muted-foreground" data-testid={`customer-phone-${order.id}`}>
                                {order.customerPhone}
                              </p>
                              <p className="text-xs text-muted-foreground" data-testid={`customer-emirate-${order.id}`}>
                                {order.customerEmirate}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm" data-testid={`order-product-${order.id}`}>
                            {order.productColor?.product?.brand} {order.productColor?.product?.modelNumber} (Size {order.size})
                          </TableCell>
                          <TableCell className="font-mono text-sm" data-testid={`tracking-number-${order.id}`}>
                            {order.trackingNumber || "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={paymentDisplay.variant} data-testid={`payment-method-${order.id}`}>
                              {paymentDisplay.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusDisplay.variant} data-testid={`order-status-${order.id}`}>
                              {statusDisplay.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-medium" data-testid={`order-total-${order.id}`}>
                            AED {order.totalAmount}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowOrderDetails(true);
                                }}
                                data-testid={`button-view-order-${order.id}`}
                              >
                                <i className="fas fa-eye"></i>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newStatus = prompt("Enter new status (pending, in_delivery, delivered, cancelled):");
                                  if (newStatus && ORDER_STATUSES.some(s => s.value === newStatus)) {
                                    updateOrderStatusMutation.mutate({
                                      orderId: order.orderId,
                                      status: newStatus,
                                    });
                                  }
                                }}
                                data-testid={`button-edit-status-${order.id}`}
                              >
                                <i className="fas fa-edit"></i>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Order Details Modal */}
          {selectedOrder && (
            <OrderDetailsModal
              order={selectedOrder}
              open={showOrderDetails}
              onOpenChange={setShowOrderDetails}
            />
          )}
        </main>
      </div>
    </div>
  );
}
