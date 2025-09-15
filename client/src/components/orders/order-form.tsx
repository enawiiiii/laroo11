import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/hooks/use-store";
import { apiRequest } from "@/lib/queryClient";
import { insertOrderSchema } from "@shared/schema";
import { EMIRATES, PAYMENT_METHODS } from "@/lib/constants";
import { z } from "zod";

const orderFormSchema = insertOrderSchema.extend({
  productId: z.number().min(1, "Product is required"),
  colorId: z.number().min(1, "Color is required"),
});

type OrderFormData = z.infer<typeof orderFormSchema>;

interface OrderFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function OrderForm({ onSuccess, onCancel }: OrderFormProps) {
  const { toast } = useToast();
  const { currentStore } = useStore();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [availableSizes, setAvailableSizes] = useState<any[]>([]);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      orderId: `ORD${Date.now()}`,
      employeeId: 1, // TODO: Get from actual employee selection
      customerName: "",
      customerPhone: "",
      customerEmirate: "",
      customerAddress: "",
      trackingNumber: "",
      notes: "",
      productColorId: 0,
      size: "0",
      quantity: 1,
      unitPrice: "0",
      paymentMethod: "cash_on_delivery" as any,
      totalAmount: "0",
      status: "pending" as any,
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: [`/api/online/products`],
    enabled: currentStore === "online",
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/orders", data);
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive",
      });
    },
  });

  const calculateTotal = () => {
    const quantity = form.watch("quantity");
    const unitPrice = parseFloat(form.watch("unitPrice") || "0");
    const total = quantity * unitPrice;
    form.setValue("totalAmount", total.toFixed(2));
  };

  useEffect(() => {
    calculateTotal();
  }, [form.watch("quantity"), form.watch("unitPrice")]);

  const handleProductChange = (productId: string) => {
    const product = products.find((p: any) => p.id === parseInt(productId));
    setSelectedProduct(product);
    setSelectedColor(null);
    setAvailableSizes([]);
    
    if (product) {
      form.setValue("unitPrice", product.onlinePriceAED);
    }
  };

  const handleColorChange = (colorId: string) => {
    if (!selectedProduct) return;
    
    const color = selectedProduct.colors.find((c: any) => c.id === parseInt(colorId));
    setSelectedColor(color);
    
    if (color) {
      const inventory = color.inventory.filter((inv: any) => inv.store === "online" && inv.quantity > 0);
      setAvailableSizes(inventory);
      form.setValue("productColorId", color.id);
    }
  };

  const handleSizeChange = (size: string) => {
    form.setValue("size", size);
  };

  const onSubmit = (data: OrderFormData) => {
    createOrderMutation.mutate(data);
  };

  if (currentStore !== "online") return null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer Information */}
        <div className="border border-border rounded-lg p-4">
          <h4 className="font-medium mb-4">Customer Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter customer name" {...field} data-testid="input-customer-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+971 50 123 4567" {...field} data-testid="input-customer-phone" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerEmirate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emirate</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-customer-emirate">
                        <SelectValue placeholder="Select emirate" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EMIRATES.map((emirate) => (
                        <SelectItem key={emirate} value={emirate}>{emirate}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trackingNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tracking Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="TRK123456" {...field} data-testid="input-tracking-number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="customerAddress"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Full delivery address..."
                    {...field}
                    data-testid="textarea-customer-address"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Additional notes..."
                    {...field}
                    data-testid="textarea-notes"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Product Selection */}
        <div className="border border-border rounded-lg p-4">
          <h4 className="font-medium mb-4">Product Information</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Product</label>
              <Select onValueChange={handleProductChange}>
                <SelectTrigger data-testid="select-order-product">
                  <SelectValue placeholder="Choose a product..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product: any) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.brand} {product.modelNumber} ({product.productCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Select Color</label>
              <Select onValueChange={handleColorChange} disabled={!selectedProduct}>
                <SelectTrigger data-testid="select-order-color">
                  <SelectValue placeholder={selectedProduct ? "Choose a color..." : "Select product first..."} />
                </SelectTrigger>
                <SelectContent>
                  {selectedProduct?.colors?.map((color: any) => (
                    <SelectItem key={color.id} value={color.id.toString()}>
                      {color.colorName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Select Size</label>
              <Select onValueChange={handleSizeChange} disabled={!selectedColor}>
                <SelectTrigger data-testid="select-order-size">
                  <SelectValue placeholder={selectedColor ? "Choose a size..." : "Select color first..."} />
                </SelectTrigger>
                <SelectContent>
                  {availableSizes.map((inv: any) => (
                    <SelectItem key={`${inv.size}`} value={inv.size.toString()}>
                      {inv.size} (Available: {inv.quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      data-testid="input-order-quantity"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Payment Information */}
        <div className="border border-border rounded-lg p-4">
          <h4 className="font-medium mb-4">Payment Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-order-payment-method">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_METHODS.online.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="block text-sm font-medium mb-2">Total Amount</label>
              <div className="text-2xl font-bold text-primary" data-testid="order-total-amount">
                AED {form.watch("totalAmount")}
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button
            type="submit"
            disabled={createOrderMutation.isPending}
            data-testid="button-create-order"
          >
            <i className="fas fa-truck mr-2"></i>
            {createOrderMutation.isPending ? "Creating..." : "Create Order"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-order">
            <i className="fas fa-times mr-2"></i>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
