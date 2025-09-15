import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
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
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithColors | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);

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
    if (confirm("Are you sure you want to delete this product?")) {
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

  const filteredProducts = products.filter((product: ProductWithColors) => {
    const matchesSearch = !searchTerm || 
      product.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
              <h2 className="text-2xl font-bold text-foreground mb-2">Inventory Management</h2>
              <p className="text-muted-foreground">Manage products, colors, sizes, and stock quantities</p>
            </div>
            <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground" data-testid="button-add-product">
                  <i className="fas fa-plus mr-2"></i>
                  Add New Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
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
          
          {/* Products Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Store Price</TableHead>
                    <TableHead>Online Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-12 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product: ProductWithColors) => {
                      const stockStatus = getStockStatus(product);
                      return (
                        <TableRow key={product.id} className="hover:bg-muted">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                <i className="fas fa-box text-muted-foreground"></i>
                              </div>
                              <div>
                                <p className="font-medium" data-testid={`product-name-${product.id}`}>
                                  {product.brand} {product.modelNumber}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Model: {product.modelNumber}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm" data-testid={`product-code-${product.id}`}>
                            {product.productCode}
                          </TableCell>
                          <TableCell className="text-sm">{product.brand}</TableCell>
                          <TableCell className="text-sm">{product.productType}</TableCell>
                          <TableCell className="text-sm font-medium">AED {product.storePriceAED}</TableCell>
                          <TableCell className="text-sm font-medium">AED {product.onlinePriceAED}</TableCell>
                          <TableCell>
                            <Badge variant={stockStatus.variant} data-testid={`product-stock-${product.id}`}>
                              {stockStatus.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setShowProductDetails(true);
                                }}
                                data-testid={`button-view-${product.id}`}
                              >
                                <i className="fas fa-eye"></i>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`button-edit-${product.id}`}
                              >
                                <i className="fas fa-edit"></i>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-destructive hover:text-destructive"
                                data-testid={`button-delete-${product.id}`}
                              >
                                <i className="fas fa-trash"></i>
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

          {/* Product Details Modal */}
          {selectedProduct && (
            <ProductDetailsModal
              product={selectedProduct}
              open={showProductDetails}
              onOpenChange={setShowProductDetails}
            />
          )}
        </main>
      </div>
    </div>
  );
}
