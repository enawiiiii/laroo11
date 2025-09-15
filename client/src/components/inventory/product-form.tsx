import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/hooks/use-store";
import { apiRequest } from "@/lib/queryClient";
import { insertProductSchema } from "@shared/schema";
import { BRANDS, PRODUCT_TYPES, COLORS, SIZES } from "@/lib/constants";
import { z } from "zod";

const productFormSchema = insertProductSchema.extend({
  colors: z.array(z.object({
    colorName: z.string().min(1, "Color name is required"),
    inventory: z.array(z.object({
      size: z.string().min(1, "Size is required"),
      quantity: z.number().min(0, "Quantity must be positive"),
    })),
  })).min(1, "At least one color is required"),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  onSuccess: () => void;
}

export default function ProductForm({ onSuccess }: ProductFormProps) {
  const { toast } = useToast();
  const { currentStore } = useStore();
  const [newColorName, setNewColorName] = useState("");
  const [newSize, setNewSize] = useState("");
  const [newQuantity, setNewQuantity] = useState(0);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      productCode: "",
      modelNumber: "",
      brand: "",
      productType: "",
      storePriceAED: "0",
      onlinePriceAED: "0",
      specifications: "",
      imageUrl: "",
      colors: [],
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      // Create product
      const product = await apiRequest("POST", "/api/products", {
        productCode: data.productCode,
        modelNumber: data.modelNumber,
        brand: data.brand,
        productType: data.productType,
        storePriceAED: data.storePriceAED,
        onlinePriceAED: data.onlinePriceAED,
        specifications: data.specifications,
        imageUrl: data.imageUrl,
      });

      const productData = await product.json();

      // Create colors and inventory
      for (const color of data.colors) {
        const colorResponse = await apiRequest("POST", `/api/products/${productData.id}/colors`, {
          colorName: color.colorName,
        });
        const colorData = await colorResponse.json();

        // Create inventory entries
        for (const inv of color.inventory) {
          await apiRequest("PUT", "/api/inventory", {
            productColorId: colorData.id,
            store: currentStore,
            size: inv.size,
            quantity: inv.quantity,
          });
        }
      }

      return productData;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    createProductMutation.mutate(data);
  };

  const addColor = () => {
    if (!newColorName) return;
    
    const colors = form.getValues("colors");
    const existingColor = colors.find(c => c.colorName === newColorName);
    
    if (existingColor) {
      toast({
        title: "Warning",
        description: "Color already exists",
        variant: "destructive",
      });
      return;
    }

    form.setValue("colors", [
      ...colors,
      { colorName: newColorName, inventory: [] },
    ]);
    setNewColorName("");
  };

  const removeColor = (colorIndex: number) => {
    const colors = form.getValues("colors");
    form.setValue("colors", colors.filter((_, i) => i !== colorIndex));
  };

  const addInventoryToColor = (colorIndex: number) => {
    if (!newSize || newQuantity < 0) return;

    const colors = form.getValues("colors");
    const color = colors[colorIndex];
    
    const existingSize = color.inventory.find(inv => inv.size === newSize);
    if (existingSize) {
      toast({
        title: "Warning",
        description: "Size already exists for this color",
        variant: "destructive",
      });
      return;
    }

    color.inventory.push({ size: newSize, quantity: newQuantity });
    form.setValue("colors", colors);
    setNewSize("");
    setNewQuantity(0);
  };

  const removeInventoryFromColor = (colorIndex: number, inventoryIndex: number) => {
    const colors = form.getValues("colors");
    colors[colorIndex].inventory = colors[colorIndex].inventory.filter((_, i) => i !== inventoryIndex);
    form.setValue("colors", colors);
  };

  const watchedColors = form.watch("colors");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Product Information */}
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="productCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Code</FormLabel>
                    <FormControl>
                      <Input placeholder="PRD001" {...field} data-testid="input-product-code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modelNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model Number</FormLabel>
                    <FormControl>
                      <Input placeholder="RD001" {...field} data-testid="input-model-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-brand">
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BRANDS.map((brand) => (
                          <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-product-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRODUCT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storePriceAED"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Price (AED)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="299.00" {...field} data-testid="input-store-price" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="onlinePriceAED"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Online Price (AED)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="329.00" {...field} data-testid="input-online-price" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="specifications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specifications</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Product specifications..."
                      {...field}
                      data-testid="textarea-specifications"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} data-testid="input-image-url" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Colors and Inventory */}
        <Card>
          <CardHeader>
            <CardTitle>Colors & Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add New Color */}
            <div className="flex gap-2">
              <Select value={newColorName} onValueChange={setNewColorName}>
                <SelectTrigger className="flex-1" data-testid="select-new-color">
                  <SelectValue placeholder="Select color to add" />
                </SelectTrigger>
                <SelectContent>
                  {COLORS.filter(color => !watchedColors.some(c => c.colorName === color)).map((color) => (
                    <SelectItem key={color} value={color}>{color}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={addColor} data-testid="button-add-color">
                Add Color
              </Button>
            </div>

            {/* Display Colors */}
            <div className="space-y-4">
              {watchedColors.map((color, colorIndex) => (
                <Card key={colorIndex} className="border-muted">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{color.colorName}</CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeColor(colorIndex)}
                        data-testid={`button-remove-color-${colorIndex}`}
                      >
                        <i className="fas fa-trash text-destructive"></i>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Add Inventory */}
                    <div className="flex gap-2 mb-3">
                      <Select value={newSize} onValueChange={setNewSize}>
                        <SelectTrigger className="flex-1" data-testid={`select-size-${colorIndex}`}>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {SIZES.filter(size => !color.inventory.some(inv => inv.size === size)).map((size) => (
                            <SelectItem key={size} value={size}>{size}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Quantity"
                        value={newQuantity}
                        onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                        className="w-24"
                        data-testid={`input-quantity-${colorIndex}`}
                      />
                      <Button
                        type="button"
                        onClick={() => addInventoryToColor(colorIndex)}
                        data-testid={`button-add-inventory-${colorIndex}`}
                      >
                        Add
                      </Button>
                    </div>

                    {/* Display Inventory */}
                    <div className="flex flex-wrap gap-2">
                      {color.inventory.map((inv, invIndex) => (
                        <Badge key={invIndex} variant="secondary" className="flex items-center gap-2">
                          Size {inv.size}: {inv.quantity} qty
                          <button
                            type="button"
                            onClick={() => removeInventoryFromColor(colorIndex, invIndex)}
                            className="ml-1 text-destructive hover:text-destructive/80"
                            data-testid={`button-remove-inventory-${colorIndex}-${invIndex}`}
                          >
                            <i className="fas fa-times text-xs"></i>
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createProductMutation.isPending}
            data-testid="button-submit-product"
          >
            {createProductMutation.isPending ? "Creating..." : "Create Product"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
