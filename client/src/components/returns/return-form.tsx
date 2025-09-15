import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/hooks/use-store";
import { apiRequest } from "@/lib/queryClient";
import { insertReturnSchema } from "@shared/schema";
import { RETURN_TYPES } from "@/lib/constants";
import { z } from "zod";

const returnFormSchema = insertReturnSchema.extend({
  originalProductId: z.number().optional(),
  originalColorId: z.number().optional(),
  newProductId: z.number().optional(),
  newColorId: z.number().optional(),
});

type ReturnFormData = z.infer<typeof returnFormSchema>;

interface ReturnFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ReturnForm({ onSuccess, onCancel }: ReturnFormProps) {
  const { toast } = useToast();
  const { currentStore } = useStore();
  const [isExchange, setIsExchange] = useState(false);
  const [originalProduct, setOriginalProduct] = useState<any>(null);
  const [originalColor, setOriginalColor] = useState<any>(null);
  const [newProduct, setNewProduct] = useState<any>(null);
  const [newColor, setNewColor] = useState<any>(null);
  const [originalSizes, setOriginalSizes] = useState<any[]>([]);
  const [newSizes, setNewSizes] = useState<any[]>([]);

  const form = useForm<ReturnFormData>({
    resolver: zodResolver(returnFormSchema),
    defaultValues: {
      returnId: `RET${Date.now()}`,
      employeeId: 1, // TODO: Get from actual employee selection
      store: currentStore as any,
      originalSaleId: "",
      originalOrderId: "",
      returnType: "refund" as any,
      originalProductColorId: 0,
      originalSize: "0",
      originalQuantity: 1,
      newProductColorId: undefined,
      newSize: undefined,
      newQuantity: undefined,
      refundAmount: "0",
      priceDifference: "0",
      reason: "",
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: [`/api/${currentStore}/products`],
    enabled: !!currentStore,
  });

  const { data: sales = [] } = useQuery({
    queryKey: [`/api/${currentStore}/sales`],
    enabled: !!currentStore,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/orders"],
    enabled: currentStore === "online",
  });

  const createReturnMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/${currentStore}/returns`, data);
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to process return",
        variant: "destructive",
      });
    },
  });

  const handleReturnTypeChange = (type: string) => {
    form.setValue("returnType", type as any);
    setIsExchange(type.startsWith("exchange"));
    
    if (type === "refund") {
      form.setValue("newProductColorId", undefined);
      form.setValue("newSize", undefined);
      form.setValue("newQuantity", undefined);
      form.setValue("priceDifference", "0");
    }
  };

  const handleOriginalSaleChange = (saleId: string) => {
    form.setValue("originalSaleId", saleId);
    form.setValue("originalOrderId", "");
    
    // Find the sale and pre-populate product info
    const sale = [...sales, ...orders].find((s: any) => s.saleId === saleId || s.orderId === saleId);
    if (sale) {
      const product = products.find((p: any) => 
        p.colors.some((c: any) => c.id === sale.productColorId)
      );
      if (product) {
        setOriginalProduct(product);
        const color = product.colors.find((c: any) => c.id === sale.productColorId);
        setOriginalColor(color);
        form.setValue("originalProductColorId", sale.productColorId);
        form.setValue("originalSize", sale.size.toString());
        form.setValue("originalQuantity", sale.quantity);
        
        // Set refund amount for refund type
        if (form.watch("returnType") === "refund") {
          form.setValue("refundAmount", sale.totalAmount.toString());
        }
      }
    }
  };

  const handleOriginalProductChange = (productId: string) => {
    const product = products.find((p: any) => p.id === parseInt(productId));
    setOriginalProduct(product);
    setOriginalColor(null);
    setOriginalSizes([]);
  };

  const handleOriginalColorChange = (colorId: string) => {
    if (!originalProduct) return;
    
    const color = originalProduct.colors.find((c: any) => c.id === parseInt(colorId));
    setOriginalColor(color);
    
    if (color) {
      const inventory = color.inventory.filter((inv: any) => inv.store === currentStore);
      setOriginalSizes(inventory);
      form.setValue("originalProductColorId", color.id);
    }
  };

  const handleNewProductChange = (productId: string) => {
    const product = products.find((p: any) => p.id === parseInt(productId));
    setNewProduct(product);
    setNewColor(null);
    setNewSizes([]);
  };

  const handleNewColorChange = (colorId: string) => {
    if (!newProduct) return;
    
    const color = newProduct.colors.find((c: any) => c.id === parseInt(colorId));
    setNewColor(color);
    
    if (color) {
      const inventory = color.inventory.filter((inv: any) => inv.store === currentStore);
      setNewSizes(inventory);
      form.setValue("newProductColorId", color.id);
      
      // Calculate price difference
      if (originalProduct && newProduct) {
        const originalPrice = parseFloat(currentStore === "boutique" ? originalProduct.storePriceAED : originalProduct.onlinePriceAED);
        const newPrice = parseFloat(currentStore === "boutique" ? newProduct.storePriceAED : newProduct.onlinePriceAED);
        const difference = newPrice - originalPrice;
        form.setValue("priceDifference", difference.toFixed(2));
      }
    }
  };

  const onSubmit = (data: ReturnFormData) => {
    createReturnMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Return Type and Original Sale */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="returnType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Return Type</FormLabel>
                <Select onValueChange={handleReturnTypeChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-return-type">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {RETURN_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <label className="block text-sm font-medium mb-2">Original Sale/Order ID</label>
            <Select onValueChange={handleOriginalSaleChange}>
              <SelectTrigger data-testid="select-original-sale">
                <SelectValue placeholder="Select from recent sales/orders..." />
              </SelectTrigger>
              <SelectContent>
                {sales.map((sale: any) => (
                  <SelectItem key={sale.saleId} value={sale.saleId}>
                    Sale #{sale.saleId} - {sale.productColor?.product?.brand} {sale.productColor?.product?.modelNumber}
                  </SelectItem>
                ))}
                {currentStore === "online" && orders.map((order: any) => (
                  <SelectItem key={order.orderId} value={order.orderId}>
                    Order #{order.orderId} - {order.productColor?.product?.brand} {order.productColor?.product?.modelNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Original Product Information */}
        <Card className="border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Original Product Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Product</label>
                <Select onValueChange={handleOriginalProductChange} value={originalProduct?.id?.toString() || ""}>
                  <SelectTrigger data-testid="select-original-product">
                    <SelectValue placeholder="Select product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product: any) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.brand} {product.modelNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <Select onValueChange={handleOriginalColorChange} value={originalColor?.id?.toString() || ""}>
                  <SelectTrigger data-testid="select-original-color">
                    <SelectValue placeholder="Select color..." />
                  </SelectTrigger>
                  <SelectContent>
                    {originalProduct?.colors?.map((color: any) => (
                      <SelectItem key={color.id} value={color.id.toString()}>
                        {color.colorName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <FormField
                control={form.control}
                name="originalSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-original-size">
                          <SelectValue placeholder="Size..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {originalSizes.map((inv: any) => (
                          <SelectItem key={inv.size} value={inv.size.toString()}>
                            {inv.size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="originalQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        data-testid="input-original-quantity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Exchange Product Information */}
        {isExchange && (
          <Card className="border-accent/20 bg-accent/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">New Product Information (Exchange)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">New Product</label>
                  <Select onValueChange={handleNewProductChange}>
                    <SelectTrigger data-testid="select-new-product">
                      <SelectValue placeholder="Choose new product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product: any) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.brand} {product.modelNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">New Color</label>
                  <Select onValueChange={handleNewColorChange} disabled={!newProduct}>
                    <SelectTrigger data-testid="select-new-color">
                      <SelectValue placeholder="Select color..." />
                    </SelectTrigger>
                    <SelectContent>
                      {newProduct?.colors?.map((color: any) => (
                        <SelectItem key={color.id} value={color.id.toString()}>
                          {color.colorName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <FormField
                  control={form.control}
                  name="newSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Size</FormLabel>
                      <Select onValueChange={field.onChange} disabled={!newColor}>
                        <FormControl>
                          <SelectTrigger data-testid="select-new-size">
                            <SelectValue placeholder="Size..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {newSizes.map((inv: any) => (
                            <SelectItem key={inv.size} value={inv.size.toString()}>
                              {inv.size} (Available: {inv.quantity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <label className="block text-sm font-medium mb-2">Price Difference</label>
                  <div className="text-lg font-medium text-accent" data-testid="price-difference">
                    {form.watch("priceDifference") && parseFloat(form.watch("priceDifference") || "0") !== 0 ? (
                      `${parseFloat(form.watch("priceDifference") || "0") > 0 ? "+" : ""}AED ${form.watch("priceDifference")}`
                    ) : (
                      "AED 0"
                    )}
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="newQuantity"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>New Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        value={field.value || 1}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        data-testid="input-new-quantity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Reason */}
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Reason for return/exchange..."
                  {...field}
                  data-testid="textarea-return-reason"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex space-x-3">
          <Button
            type="submit"
            disabled={createReturnMutation.isPending}
            data-testid="button-process-return"
          >
            <i className="fas fa-check mr-2"></i>
            {createReturnMutation.isPending ? "Processing..." : "Process Return/Exchange"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-return">
            <i className="fas fa-times mr-2"></i>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
