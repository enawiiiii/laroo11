import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import ReturnForm from "@/components/returns/return-form";
import { useStore } from "@/hooks/use-store";
import { formatDistanceToNow } from "date-fns";
import type { ReturnWithDetails } from "@shared/schema";

export default function Returns() {
  const { isLoggedIn, currentStore } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showReturnForm, setShowReturnForm] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      setLocation("/");
    }
  }, [isLoggedIn, setLocation]);

  const { data: returns = [], isLoading } = useQuery({
    queryKey: [`/api/${currentStore}/returns`],
    enabled: !!currentStore,
  });

  const handleReturnSuccess = () => {
    setShowReturnForm(false);
    queryClient.invalidateQueries({ queryKey: [`/api/${currentStore}/returns`] });
    queryClient.invalidateQueries({ queryKey: [`/api/${currentStore}/dashboard`] });
    toast({
      title: "Success",
      description: "Return/Exchange processed successfully",
    });
  };

  const getReturnTypeDisplay = (type: string) => {
    switch (type) {
      case "refund":
        return { label: "Refund", variant: "destructive" as const };
      case "exchange_color":
        return { label: "Color Exchange", variant: "default" as const };
      case "exchange_size":
        return { label: "Size Exchange", variant: "default" as const };
      case "exchange_model":
        return { label: "Model Exchange", variant: "secondary" as const };
      default:
        return { label: type, variant: "outline" as const };
    }
  };

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Returns & Exchanges</h2>
              <p className="text-muted-foreground">Process refunds and exchanges with automatic inventory updates</p>
            </div>
            <Button
              className="bg-primary text-primary-foreground"
              onClick={() => setShowReturnForm(!showReturnForm)}
              data-testid="button-new-return"
            >
              <i className="fas fa-plus mr-2"></i>
              Process Return
            </Button>
          </div>

          {/* Return Form */}
          {showReturnForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Process Return or Exchange</CardTitle>
              </CardHeader>
              <CardContent>
                <ReturnForm
                  onSuccess={handleReturnSuccess}
                  onCancel={() => setShowReturnForm(false)}
                />
              </CardContent>
            </Card>
          )}
          
          {/* Returns History */}
          <Card>
            <CardHeader>
              <CardTitle>Returns & Exchanges History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Return ID</TableHead>
                    <TableHead>Original Sale</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      </TableRow>
                    ))
                  ) : returns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No returns found
                      </TableCell>
                    </TableRow>
                  ) : (
                    returns.map((returnItem: any) => {
                      const typeDisplay = getReturnTypeDisplay(returnItem.returnType);
                      return (
                        <TableRow key={returnItem.id}>
                          <TableCell className="font-mono text-sm" data-testid={`return-id-${returnItem.id}`}>
                            #{returnItem.returnId}
                          </TableCell>
                          <TableCell className="font-mono text-sm" data-testid={`original-sale-${returnItem.id}`}>
                            #{returnItem.originalSaleId || returnItem.originalOrderId || "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={typeDisplay.variant} data-testid={`return-type-${returnItem.id}`}>
                              {typeDisplay.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm" data-testid={`return-product-${returnItem.id}`}>
                            {returnItem.originalProductColor?.product?.brand} {returnItem.originalProductColor?.product?.modelNumber}
                          </TableCell>
                          <TableCell className="text-sm" data-testid={`return-details-${returnItem.id}`}>
                            {returnItem.returnType === "refund" ? (
                              `${returnItem.originalProductColor?.colorName}, Size ${returnItem.originalSize}`
                            ) : (
                              `${returnItem.originalProductColor?.colorName} Size ${returnItem.originalSize} → ${returnItem.newProductColor?.colorName || "N/A"} Size ${returnItem.newSize || "N/A"}`
                            )}
                          </TableCell>
                          <TableCell className="text-sm font-medium" data-testid={`return-amount-${returnItem.id}`}>
                            {returnItem.returnType === "refund" ? (
                              `AED ${returnItem.refundAmount || "0"}`
                            ) : (
                              returnItem.priceDifference && parseFloat(returnItem.priceDifference) !== 0 ? (
                                `${parseFloat(returnItem.priceDifference) > 0 ? "+" : ""}AED ${returnItem.priceDifference}`
                              ) : (
                                "AED 0"
                              )
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground" data-testid={`return-date-${returnItem.id}`}>
                            {formatDistanceToNow(new Date(returnItem.createdAt), { addSuffix: true })}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
