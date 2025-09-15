import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/hooks/use-store";
import { apiRequest } from "@/lib/queryClient";
import { insertSaleSchema } from "@shared/schema";
import { PAYMENT_METHODS } from "@/lib/constants";
import { z } from "zod";

const salesFormSchema = insertSaleSchema.extend({
  productId: z.number().min(1, "Product is required"),
  colorId: z.number().min(1, "Color is required"),
});

type SalesFormData = z.infer<typeof salesFormSchema>;

interface SalesFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function SalesForm({ onSuccess, onCancel }: SalesFormProps) {
  const { toast } = useToast();
  const { currentStore } = useStore();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [availableSizes, setAvailableSizes] = useState<any[]>([]);

  const form = useForm<SalesFormData>({
    resolver: zodResolver(salesFormSchema),
    defaultValues: {
      saleId: `S${Date.now()}`,
      employeeId: 1, // TODO: Get from actual employee selection
      store: currentStore as any,
      productColorId: 0,
      size: "0",
      quantity: 1,
      unitPrice: "0",
      paymentMethod: "cash" as any,
      taxAmount: "0",
      totalAmount: "0",
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: [`/api/${currentStore}/products`],
    enabled: !!currentStore,
  });

  const createSaleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/${currentStore}/sales`, data);
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create sale",
        variant: "destructive",
      });
    },
  });

  const calculateTotal = () => {
    const quantity = form.watch("quantity");
    const unitPrice = parseFloat(form.watch("unitPrice") || "0");
    const paymentMethod = form.watch("paymentMethod");
    
    const subtotal = quantity * unitPrice;
    const taxRate = paymentMethod === "card" ? 0.05 : 0;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    form.setValue("taxAmount", taxAmount.toFixed(2));
    form.setValue("totalAmount", total.toFixed(2));
  };

  useEffect(() => {
    calculateTotal();
  }, [form.watch("quantity"), form.watch("unitPrice"), form.watch("paymentMethod")]);

  const handleProductChange = (productId: string) => {
    const product = products.find((p: any) => p.id === parseInt(productId));
    setSelectedProduct(product);
    setSelectedColor(null);
    setAvailableSizes([]);
    
    if (product) {
      const price = currentStore === "boutique" ? product.storePriceAED : product.onlinePriceAED;
      form.setValue("unitPrice", price);
    }
  };

  const handleColorChange = (colorId: string) => {
    if (!selectedProduct) return;
    
    const color = selectedProduct.colors.find((c: any) => c.id === parseInt(colorId));
    setSelectedColor(color);
    
    if (color) {
      const inventory = color.inventory.filter((inv: any) => inv.store === currentStore && inv.quantity > 0);
      setAvailableSizes(inventory);
      form.setValue("productColorId", color.id);
    }
  };

  const handleSizeChange = (size: string) => {
    form.setValue("size", size);
  };

  const onSubmit = (data: SalesFormData) => {
    createSaleMutation.mutate(data);
  };

  const paymentMethods = PAYMENT_METHODS[currentStore as keyof typeof PAYMENT_METHODS] || [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Product Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Select Product</label>
            <Select onValueChange={handleProductChange}>
              <SelectTrigger data-testid="select-product">
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
              <SelectTrigger data-testid="select-color">
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
              <SelectTrigger data-testid="select-size">
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
                    data-testid="input-quantity"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Payment Information */}
        <div className="border-t border-border pt-6">
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
                      <SelectTrigger data-testid="select-payment-method">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paymentMethods.map((method) => (
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
              <div className="text-2xl font-bold text-primary" data-testid="total-amount">
                AED {form.watch("totalAmount")}
              </div>
              {form.watch("taxAmount") !== "0" && (
                <div className="text-sm text-muted-foreground">
                  (Includes AED {form.watch("taxAmount")} tax)
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button
            type="submit"
            disabled={createSaleMutation.isPending}
            data-testid="button-complete-sale"
          >
            <i className="fas fa-shopping-cart mr-2"></i>
            {createSaleMutation.isPending ? "Processing..." : "Complete Sale"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-sale">
            <i className="fas fa-times mr-2"></i>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
