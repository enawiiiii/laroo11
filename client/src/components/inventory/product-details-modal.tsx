import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/hooks/use-store";
import type { ProductWithColors } from "@shared/schema";

interface ProductDetailsModalProps {
  product: ProductWithColors;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProductDetailsModal({
  product,
  open,
  onOpenChange,
}: ProductDetailsModalProps) {
  const { currentStore } = useStore();

  const getColorInventory = (color: any) => {
    return color.inventory.filter((inv: any) => inv.store === currentStore);
  };

  const getTotalStock = (color: any) => {
    return getColorInventory(color).reduce((total: number, inv: any) => total + inv.quantity, 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Product Details</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Image */}
          <div>
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={`${product.brand} ${product.modelNumber}`}
                className="w-full h-96 object-cover rounded-lg"
                data-testid="product-detail-image"
              />
            ) : (
              <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
                <i className="fas fa-box text-4xl text-muted-foreground"></i>
              </div>
            )}
          </div>
          
          {/* Product Information */}
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-lg" data-testid="product-detail-name">
                {product.brand} {product.modelNumber}
              </h4>
              <p className="text-muted-foreground" data-testid="product-detail-codes">
                Model: {product.modelNumber}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Brand</label>
                <p className="text-muted-foreground" data-testid="product-detail-brand">{product.brand}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <p className="text-muted-foreground" data-testid="product-detail-type">{product.productType}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Store Price</label>
                <p className="font-bold text-primary" data-testid="product-detail-store-price">AED {product.storePriceAED}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Online Price</label>
                <p className="font-bold text-primary" data-testid="product-detail-online-price">AED {product.onlinePriceAED}</p>
              </div>
            </div>
            
            {/* Colors and Sizes */}
            <div>
              <h5 className="font-medium mb-3">Available Colors & Sizes ({currentStore} store)</h5>
              <div className="space-y-3" data-testid="product-colors-list">
                {product.colors.map((color, index) => {
                  const inventory = getColorInventory(color);
                  const totalStock = getTotalStock(color);
                  
                  if (inventory.length === 0) return null;
                  
                  return (
                    <Card key={index} className="border-border">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium" data-testid={`color-name-${index}`}>{color.colorName}</span>
                          <span className="text-sm text-muted-foreground" data-testid={`color-total-${index}`}>
                            {totalStock} items total
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2" data-testid={`color-sizes-${index}`}>
                          {inventory.map((inv: any, invIndex: number) => (
                            <Badge key={invIndex} variant="secondary" data-testid={`size-badge-${index}-${invIndex}`}>
                              {inv.size} ({inv.quantity})
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {product.colors.every(color => getColorInventory(color).length === 0) && (
                  <p className="text-muted-foreground text-center py-4">
                    No inventory available for {currentStore} store
                  </p>
                )}
              </div>
            </div>
            
            {/* Specifications */}
            {product.specifications && (
              <div>
                <h5 className="font-medium mb-2">Specifications</h5>
                <p className="text-sm text-muted-foreground" data-testid="product-detail-specifications">
                  {product.specifications}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
