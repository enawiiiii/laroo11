import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ORDER_STATUSES } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";
import type { OrderWithDetails } from "@shared/schema";

interface OrderDetailsModalProps {
  order: OrderWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OrderDetailsModal({
  order,
  open,
  onOpenChange,
}: OrderDetailsModalProps) {
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

  const statusDisplay = getStatusDisplay(order.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Details - #{order.orderId}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="font-medium" data-testid="order-detail-customer-name">{order.customerName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phone</label>
                <p data-testid="order-detail-customer-phone">{order.customerPhone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Emirate</label>
                <p data-testid="order-detail-customer-emirate">{order.customerEmirate}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Address</label>
                <p className="text-sm" data-testid="order-detail-customer-address">{order.customerAddress}</p>
              </div>
              {order.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <p className="text-sm" data-testid="order-detail-notes">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div>
                  <Badge variant={statusDisplay.variant} data-testid="order-detail-status">
                    {statusDisplay.label}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tracking Number</label>
                <p className="font-mono" data-testid="order-detail-tracking">
                  {order.trackingNumber || "Not assigned"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                <p data-testid="order-detail-payment">
                  {order.paymentMethod === "cash_on_delivery" ? "Cash on Delivery" : "Bank Transfer"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Order Date</label>
                <p data-testid="order-detail-date">
                  {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Information */}
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                <i className="fas fa-box text-2xl text-muted-foreground"></i>
              </div>
              <div className="flex-1">
                <h4 className="font-medium" data-testid="order-detail-product-name">
                  {order.productColor?.product?.brand} {order.productColor?.product?.modelNumber}
                </h4>
                <p className="text-sm text-muted-foreground" data-testid="order-detail-product-code">
                  Code: {order.productColor?.product?.productCode}
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm">
                    <strong>Color:</strong> <span data-testid="order-detail-product-color">{order.productColor?.colorName}</span>
                  </span>
                  <span className="text-sm">
                    <strong>Size:</strong> <span data-testid="order-detail-product-size">{order.size}</span>
                  </span>
                  <span className="text-sm">
                    <strong>Quantity:</strong> <span data-testid="order-detail-product-quantity">{order.quantity}</span>
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary" data-testid="order-detail-total">
                  AED {order.totalAmount}
                </p>
                <p className="text-sm text-muted-foreground">
                  AED {order.unitPrice} each
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
