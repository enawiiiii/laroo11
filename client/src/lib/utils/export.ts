import { apiRequest } from "@/lib/queryClient";

export async function generateExport(
  store: string,
  dateRange: string,
  format: string
): Promise<boolean> {
  try {
    const response = await apiRequest("GET", `/api/${store}/export`);
    const data = await response.json();
    
    const timestamp = new Date().toISOString().split('T')[0];
    const folderName = `LaRosa_Export_${store}_${timestamp}`;
    
    // Create CSV content for each data type
    const csvFiles = {
      [`product_catalog_${store}.csv`]: generateProductCatalogCSV(data.products),
      [`sizes_colors_${store}.csv`]: generateSizesColorsCSV(data.products),
      [`inventory_report_${store}.csv`]: generateInventoryCSV(data.inventory),
      [`sales_report_${store}.csv`]: generateSalesCSV(data.sales),
      [`returns_report_${store}.csv`]: generateReturnsCSV(data.returns),
    };

    // Add orders CSV for online store
    if (store === "online" && data.orders) {
      csvFiles[`orders_report_${store}.csv`] = generateOrdersCSV(data.orders);
    }

    // Generate README
    const readme = generateReadme(store, data);
    
    // Create and download zip file (simplified for demo)
    // In a real implementation, you'd use a library like JSZip
    for (const [filename, content] of Object.entries(csvFiles)) {
      downloadFile(content, filename, "text/csv");
    }
    
    downloadFile(readme, `readme_${store}.txt`, "text/plain");
    
    return true;
  } catch (error) {
    console.error("Export failed:", error);
    return false;
  }
}

function generateProductCatalogCSV(products: any[]): string {
  const headers = [
    "Product Code",
    "Model Number", 
    "Brand",
    "Product Type",
    "Store Price AED",
    "Online Price AED",
    "Specifications",
    "Image URL"
  ];
  
  const rows = products.map(product => [
    product.productCode,
    product.modelNumber,
    product.brand,
    product.productType,
    product.storePriceAED,
    product.onlinePriceAED,
    `"${product.specifications || ""}"`,
    product.imageUrl || ""
  ]);
  
  return [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
}

function generateSizesColorsCSV(products: any[]): string {
  const headers = [
    "Product Code",
    "Color Name",
    "Size",
    "Store",
    "Quantity"
  ];
  
  const rows: string[][] = [];
  
  products.forEach(product => {
    product.colors?.forEach((color: any) => {
      color.inventory?.forEach((inv: any) => {
        rows.push([
          product.productCode,
          color.colorName,
          inv.size.toString(),
          inv.store,
          inv.quantity.toString()
        ]);
      });
    });
  });
  
  return [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
}

function generateInventoryCSV(inventory: any[]): string {
  const headers = [
    "Product Color ID",
    "Store",
    "Size", 
    "Quantity",
    "Last Updated"
  ];
  
  const rows = inventory.map(inv => [
    inv.productColorId.toString(),
    inv.store,
    inv.size.toString(),
    inv.quantity.toString(),
    inv.updatedAt || inv.createdAt
  ]);
  
  return [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
}

function generateSalesCSV(sales: any[]): string {
  const headers = [
    "Sale ID",
    "Employee ID",
    "Store",
    "Product",
    "Color",
    "Size",
    "Quantity",
    "Unit Price",
    "Payment Method",
    "Tax Amount",
    "Total Amount",
    "Date"
  ];
  
  const rows = sales.map(sale => [
    sale.saleId,
    sale.employeeId?.toString() || "",
    sale.store,
    `"${sale.productColor?.product?.brand || ""} ${sale.productColor?.product?.modelNumber || ""}"`,
    sale.productColor?.colorName || "",
    sale.size.toString(),
    sale.quantity.toString(),
    sale.unitPrice,
    sale.paymentMethod,
    sale.taxAmount,
    sale.totalAmount,
    sale.createdAt
  ]);
  
  return [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
}

function generateOrdersCSV(orders: any[]): string {
  const headers = [
    "Order ID",
    "Customer Name",
    "Customer Phone",
    "Customer Emirate",
    "Customer Address",
    "Product",
    "Color",
    "Size",
    "Quantity",
    "Payment Method",
    "Status",
    "Tracking Number",
    "Total Amount",
    "Date"
  ];
  
  const rows = orders.map(order => [
    order.orderId,
    `"${order.customerName}"`,
    order.customerPhone,
    order.customerEmirate,
    `"${order.customerAddress}"`,
    `"${order.productColor?.product?.brand || ""} ${order.productColor?.product?.modelNumber || ""}"`,
    order.productColor?.colorName || "",
    order.size.toString(),
    order.quantity.toString(),
    order.paymentMethod,
    order.status,
    order.trackingNumber || "",
    order.totalAmount,
    order.createdAt
  ]);
  
  return [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
}

function generateReturnsCSV(returns: any[]): string {
  const headers = [
    "Return ID",
    "Original Sale ID",
    "Original Order ID",
    "Return Type",
    "Original Product",
    "Original Color",
    "Original Size",
    "Original Quantity",
    "New Product",
    "New Color", 
    "New Size",
    "New Quantity",
    "Refund Amount",
    "Price Difference",
    "Reason",
    "Date"
  ];
  
  const rows = returns.map(returnItem => [
    returnItem.returnId,
    returnItem.originalSaleId || "",
    returnItem.originalOrderId || "",
    returnItem.returnType,
    `"${returnItem.originalProductColor?.product?.brand || ""} ${returnItem.originalProductColor?.product?.modelNumber || ""}"`,
    returnItem.originalProductColor?.colorName || "",
    returnItem.originalSize.toString(),
    returnItem.originalQuantity.toString(),
    `"${returnItem.newProductColor?.product?.brand || ""} ${returnItem.newProductColor?.product?.modelNumber || ""}"`,
    returnItem.newProductColor?.colorName || "",
    returnItem.newSize?.toString() || "",
    returnItem.newQuantity?.toString() || "",
    returnItem.refundAmount || "",
    returnItem.priceDifference || "",
    `"${returnItem.reason || ""}"`,
    returnItem.createdAt
  ]);
  
  return [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
}

function generateReadme(store: string, data: any): string {
  return `LaRosa Fashion Store Export - ${store.toUpperCase()} Store
Generated on: ${new Date().toISOString()}

This export contains the following files:

1. product_catalog_${store}.csv - Complete product catalog with pricing and specifications
2. sizes_colors_${store}.csv - Product colors and size availability
3. inventory_report_${store}.csv - Current inventory levels by size and color
4. sales_report_${store}.csv - Sales transactions history
5. returns_report_${store}.csv - Returns and exchanges history
${store === "online" ? `6. orders_report_${store}.csv - Online orders with customer information\n` : ""}

Summary:
- Total Products: ${data.products?.length || 0}
- Total Sales: ${data.sales?.length || 0}
- Total Returns: ${data.returns?.length || 0}
${store === "online" ? `- Total Orders: ${data.orders?.length || 0}\n` : ""}
Export Date: ${data.exportDate}
Store: ${store}

All sizes are exported as numeric values as specified.
Data is filtered for ${store} store only.

For manufacturing integration, please refer to the CSV files which contain
all necessary product specifications, color combinations, and size data.
`;
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
