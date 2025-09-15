import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import ProductForm from "@/components/inventory/product-form";
import ProductDetailsModal from "@/components/inventory/product-details-modal";
import { useStore } from "@/hooks/use-store";
import { apiRequest } from "@/lib/queryClient";
import { BRANDS, PRODUCT_TYPES } from "@/lib/constants";
import type { ProductWithColors } from "@shared/schema";

export default function Inventory() {
  const { isLoggedIn, currentStore } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithColors | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      setLocation("/");
    }
  }, [isLoggedIn, setLocation]);

  const { data: products = [], isLoading } = useQuery({
    queryKey: [`/api/${currentStore}/products`, searchTerm],
    enabled: !!currentStore,
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      await apiRequest("DELETE", `/api/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${currentStore}/products`] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const handleDeleteProduct = (productId: number) => {
    if (confirm(t("confirm_delete"))) {
      deleteProductMutation.mutate(productId);
    }
  };

  const getStockStatus = (product: ProductWithColors) => {
    const totalStock = product.colors.reduce((total, color) => {
      return total + color.inventory
        .filter(inv => inv.store === currentStore)
        .reduce((colorTotal, inv) => colorTotal + inv.quantity, 0);
    }, 0);

    if (totalStock === 0) return { status: "Out of stock", variant: "destructive" as const };
    if (totalStock < 5) return { status: `${totalStock} items`, variant: "secondary" as const };
    return { status: `${totalStock} items`, variant: "default" as const };
  };

  const filteredProducts = (products as ProductWithColors[]).filter((product: ProductWithColors) => {
    const matchesSearch = !searchTerm || 
      product.modelNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBrand = brandFilter === "all" || product.brand === brandFilter;
    const matchesType = typeFilter === "all" || product.productType === typeFilter;
    
    let matchesStock = true;
    if (stockFilter !== "all") {
      const stockStatus = getStockStatus(product);
      if (stockFilter === "in_stock" && stockStatus.status === "Out of stock") matchesStock = false;
      if (stockFilter === "low_stock" && stockStatus.variant !== "secondary") matchesStock = false;
      if (stockFilter === "out_of_stock" && stockStatus.status !== "Out of stock") matchesStock = false;
    }

    return matchesSearch && matchesBrand && matchesType && matchesStock;
  });

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2 text-right">{t("inventory")}</h2>
              <p className="text-muted-foreground text-right">إدارة المنتجات والألوان والمقاسات وكميات المخزون</p>
            </div>
            <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground" data-testid="button-add-product">
                  <i className="fas fa-plus ml-2"></i>
                  {t("add_product")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t("add_product")}</DialogTitle>
                </DialogHeader>
                <ProductForm
                  onSuccess={() => {
                    setShowProductForm(false);
                    queryClient.invalidateQueries({ queryKey: [`/api/${currentStore}/products`] });
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Search Products</label>
                  <Input
                    placeholder="Product code, model, brand..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid="input-search-products"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Brand</label>
                  <Select value={brandFilter} onValueChange={setBrandFilter}>
                    <SelectTrigger data-testid="select-brand-filter">
                      <SelectValue placeholder="All Brands" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      {BRANDS.map((brand) => (
                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Product Type</label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger data-testid="select-type-filter">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {PRODUCT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Stock Status</label>
                  <Select value={stockFilter} onValueChange={setStockFilter}>
                    <SelectTrigger data-testid="select-stock-filter">
                      <SelectValue placeholder="All Stock" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stock</SelectItem>
                      <SelectItem value="in_stock">In Stock</SelectItem>
                      <SelectItem value="low_stock">Low Stock</SelectItem>
                      <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Products Grid */}
          <div className="products-grid">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="product-card">
                  <CardContent className="p-0">
                    <Skeleton className="product-card-image" />
                    <div className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-2" />
                      <Skeleton className="h-4 w-2/3 mb-2" />
                      <Skeleton className="h-8 w-20 mb-4" />
                      <div className="flex gap-2">
                        <Skeleton className="h-10 w-20" />
                        <Skeleton className="h-10 w-20" />
                        <Skeleton className="h-10 w-20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <i className="fas fa-box-open text-4xl text-muted-foreground mb-4"></i>
                <p className="text-muted-foreground text-lg">{t("no_data")}</p>
              </div>
            ) : (
              filteredProducts.map((product: ProductWithColors) => {
                const stockStatus = getStockStatus(product);
                const currentPrice = currentStore === 'boutique' ? product.storePriceAED : product.onlinePriceAED;
                return (
                  <Card key={product.id} className="product-card group hover:shadow-xl transition-shadow duration-300" data-testid={`product-card-${product.id}`}>
                    <CardContent className="p-0">
                      {/* Product Image */}
                      <div className="relative overflow-hidden rounded-t-lg">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={`${product.brand} ${product.modelNumber}`}
                            className="product-card-image transition-transform duration-300 group-hover:scale-105"
                            data-testid={`product-image-${product.id}`}
                          />
                        ) : (
                          <div className="product-card-image bg-muted flex items-center justify-center">
                            <i className="fas fa-image text-4xl text-muted-foreground"></i>
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <Badge variant={stockStatus.variant} data-testid={`product-stock-${product.id}`}>
                            {stockStatus.status}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Product Info */}
                      <div className="p-6">
                        <h3 className="product-card-title" data-testid={`product-name-${product.id}`}>
                          {product.brand} - {product.modelNumber}
                        </h3>
                        <p className="product-card-info">
                          <span className="font-medium">{t("brand")}:</span> {product.brand}
                        </p>
                        <p className="product-card-info">
                          <span className="font-medium">{t("product_type")}:</span> {product.productType}
                        </p>
                        <p className="product-card-info">
                          <span className="font-medium">{t("model_number")}:</span> {product.modelNumber}
                        </p>
                        
                        <div className="product-card-price number-ltr">
                          {currentPrice} AED
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="product-card-actions">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowProductDetails(true);
                            }}
                            data-testid={`button-stock-${product.id}`}
                          >
                            <i className="fas fa-box mr-2"></i>
                            {t("view_stock")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowEditProduct(true);
                            }}
                            data-testid={`button-edit-${product.id}`}
                          >
                            <i className="fas fa-edit mr-2"></i>
                            {t("edit_product")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => handleDeleteProduct(product.id)}
                            data-testid={`button-delete-${product.id}`}
                          >
                            <i className="fas fa-trash mr-2"></i>
                            {t("delete_product")}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Product Details Modal */}
          {selectedProduct && (
            <ProductDetailsModal
              product={selectedProduct}
              open={showProductDetails}
              onOpenChange={setShowProductDetails}
            />
          )}

          {/* Edit Product Modal */}
          {selectedProduct && (
            <Dialog open={showEditProduct} onOpenChange={setShowEditProduct}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t("edit_product")}</DialogTitle>
                </DialogHeader>
                <ProductForm
                  product={selectedProduct}
                  onSuccess={() => {
                    setShowEditProduct(false);
                    setSelectedProduct(null);
                    queryClient.invalidateQueries({ queryKey: [`/api/${currentStore}/products`] });
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
        </main>
      </div>
    </div>
  );
}
