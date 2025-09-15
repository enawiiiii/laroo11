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
import { insertProductSchema, type ProductWithColors } from "@shared/schema";
import { PRODUCT_TYPES, SIZES } from "@/lib/constants";
import { z } from "zod";

const productFormSchema = insertProductSchema.extend({
  colors: z.array(z.object({
    id: z.number().optional(), // For existing colors
    colorName: z.string().min(1, "Color name is required"),
    inventory: z.array(z.object({
      id: z.number().optional(), // For existing inventory
      size: z.string().refine(
        (size) => ["38", "40", "42", "44", "46", "48", "50", "52"].includes(size),
        { message: "المقاس يجب أن يكون من المقاسات المتاحة" }
      ),
      quantity: z.number().min(0, "Quantity must be positive"),
    })),
  })).min(1, "At least one color is required"),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  product?: ProductWithColors;
  onSuccess: () => void;
}

export default function ProductForm({ product, onSuccess }: ProductFormProps) {
  const { toast } = useToast();
  const { currentStore } = useStore();
  const [newColorName, setNewColorName] = useState("");
  const [colorInputs, setColorInputs] = useState<{[key: number]: {size: string, quantity: string}}>({});
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product ? {
      modelNumber: product.modelNumber,
      brand: product.brand,
      productType: product.productType,
      storePriceAED: product.storePriceAED,
      onlinePriceAED: product.onlinePriceAED,
      specifications: product.specifications || "",
      imageUrl: product.imageUrl || "",
      colors: product.colors || [],
    } : {
      modelNumber: "",
      brand: "",
      productType: "",
      storePriceAED: "",
      onlinePriceAED: "",
      specifications: "",
      imageUrl: "",
      colors: [],
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      // Convert image to base64 if selected
      let imageUrl = data.imageUrl;
      if (selectedImage) {
        const reader = new FileReader();
        imageUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(selectedImage);
        });
      }
      
      let productData;
      if (product) {
        // Update existing product basic info
        const response = await apiRequest("PUT", `/api/products/${product.id}`, {
          modelNumber: data.modelNumber,
          brand: data.brand,
          productType: data.productType,
          storePriceAED: data.storePriceAED,
          onlinePriceAED: data.onlinePriceAED,
          specifications: data.specifications,
          imageUrl: imageUrl,
        });
        productData = await response.json();

        // Handle colors and inventory with diff-based updates
        const existingColors = product.colors || [];
        const formColors = data.colors;

        // Find colors to delete (exist in product but not in form)
        const colorsToDelete = existingColors.filter(
          existingColor => !formColors.some(formColor => formColor.colorName === existingColor.colorName)
        );

        // Delete removed colors
        for (const colorToDelete of colorsToDelete) {
          await apiRequest("DELETE", `/api/colors/${colorToDelete.id}`, {});
        }

        // Process each color in the form
        for (const formColor of formColors) {
          // Get or create color (API now handles idempotency)
          const colorResponse = await apiRequest("POST", `/api/products/${productData.id}/colors`, {
            colorName: formColor.colorName,
          });
          const colorData = await colorResponse.json();

          // Update inventory for each size
          for (const inv of formColor.inventory) {
            await apiRequest("PUT", "/api/inventory", {
              productColorId: colorData.id,
              store: currentStore,
              size: inv.size.toString(),
              quantity: parseInt(inv.quantity.toString()) || 0,
            });
          }
        }
      } else {
        // Create new product
        const response = await apiRequest("POST", "/api/products", {
          modelNumber: data.modelNumber,
          brand: data.brand,
          productType: data.productType,
          storePriceAED: data.storePriceAED,
          onlinePriceAED: data.onlinePriceAED,
          specifications: data.specifications,
          imageUrl: imageUrl,
        });
        productData = await response.json();

        // Create colors and inventory for new product
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
              size: inv.size.toString(),
              quantity: parseInt(inv.quantity.toString()) || 0,
            });
          }
        }
      }

      return productData;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: product ? "Product updated successfully" : "Product created successfully",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: product ? "Failed to update product" : "Failed to create product",
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
    const colorInput = colorInputs[colorIndex] || { size: "", quantity: "" };
    const quantity = parseInt(colorInput.quantity) || 0;
    if (!colorInput.size || quantity < 0) return;

    const colors = form.getValues("colors");
    const color = colors[colorIndex];
    
    const existingSize = color.inventory.find(inv => inv.size.toString() === colorInput.size);
    if (existingSize) {
      toast({
        title: "تحذير",
        description: "المقاس موجود بالفعل لهذا اللون",
        variant: "destructive",
      });
      return;
    }

    color.inventory.push({ size: colorInput.size, quantity: quantity });
    form.setValue("colors", colors);
    
    // Clear input for this specific color
    const newInputs = { ...colorInputs };
    newInputs[colorIndex] = { size: "", quantity: "" };
    setColorInputs(newInputs);
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
                    <FormLabel className="text-right">اسم الشركة التركية</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: LC Waikiki, Defacto" {...field} data-testid="input-brand" className="text-right" />
                    </FormControl>
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
                    <FormLabel className="text-right">سعر البوتيك (درهم)</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="299" {...field} data-testid="input-store-price" className="text-right" />
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
                    <FormLabel className="text-right">السعر الأونلاين (درهم)</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="329" {...field} data-testid="input-online-price" className="text-right" />
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
                      placeholder="مواصفات المنتج..."
                      {...field}
                      value={field.value || ""}
                      data-testid="textarea-specifications"
                      className="text-right"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-right">صورة المنتج</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedImage(file);
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        setImagePreview(e.target?.result as string);
                        form.setValue('imageUrl', e.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  data-testid="input-image-file"
                />
              </div>
              {imagePreview && (
                <div className="flex justify-center">
                  <img
                    src={imagePreview}
                    alt="معاينة الصورة"
                    className="max-w-xs max-h-48 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>
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
              <Input 
                placeholder="اكتب اسم اللون" 
                value={newColorName} 
                onChange={(e) => setNewColorName(e.target.value)}
                className="flex-1 text-right" 
                data-testid="input-new-color"
              />
              <Button type="button" onClick={addColor} data-testid="button-add-color" className="text-right">
                إضافة لون
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
                      <Select 
                        value={colorInputs[colorIndex]?.size || ""} 
                        onValueChange={(value) => {
                          const newInputs = { ...colorInputs };
                          newInputs[colorIndex] = { 
                            ...newInputs[colorIndex], 
                            size: value, 
                            quantity: newInputs[colorIndex]?.quantity || "" 
                          };
                          setColorInputs(newInputs);
                        }}
                      >
                        <SelectTrigger className="flex-1" data-testid={`select-size-${colorIndex}`}>
                          <SelectValue placeholder="اختر المقاس" />
                        </SelectTrigger>
                        <SelectContent>
                          {SIZES.filter(size => !color.inventory.some(inv => inv.size.toString() === size)).map((size) => (
                            <SelectItem key={size} value={size}>{size}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="text"
                        placeholder="الكمية"
                        value={colorInputs[colorIndex]?.quantity || ""}
                        onChange={(e) => {
                          const newInputs = { ...colorInputs };
                          newInputs[colorIndex] = { 
                            ...newInputs[colorIndex], 
                            size: newInputs[colorIndex]?.size || "", 
                            quantity: e.target.value 
                          };
                          setColorInputs(newInputs);
                        }}
                        className="w-24 text-right"
                        data-testid={`input-quantity-${colorIndex}`}
                      />
                      <Button
                        type="button"
                        onClick={() => addInventoryToColor(colorIndex)}
                        data-testid={`button-add-inventory-${colorIndex}`}
                        className="text-right"
                      >
                        إضافة
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
            {createProductMutation.isPending 
              ? (product ? "Updating..." : "Creating...") 
              : (product ? "Update Product" : "Create Product")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
