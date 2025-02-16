'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Product } from "@/types/sales-order"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Package, BarChart2, DollarSign, Box, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ProductDetailsDialogProps {
  product: Product
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductDetailsDialog({ product, open, onOpenChange }: ProductDetailsDialogProps) {
  const getTotalStock = () => {
    return product.inventory?.reduce((sum, inv) => sum + (inv.qty || 0), 0) || 0
  }

  const getStockStatus = () => {
    const totalStock = getTotalStock()
    if (totalStock > 20) return "success"
    if (totalStock > 0) return "warning"
    return "destructive"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{product.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{product.code}</p>
            </div>
            <Badge variant={getStockStatus()}>
              {getTotalStock()} in stock
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground">{product.description || 'No description available'}</p>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Pricing</h3>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Unit Price:</span>
                  <span>${product.price !== undefined ? product.price.toFixed(2) : 'N/A'}</span>
                </div>
                {product.product_price && product.product_price.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Cost:</span>
                    <span>${product.product_price[0].cost.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Box className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Inventory</h3>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>In Stock:</span>
                  <span>{getTotalStock()} units</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Category:</span>
                  <span>{product.category?.join(', ') || 'N/A'}</span>
                </div>
              </div>
            </Card>
          </div>

          {getTotalStock() < 10 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Low stock warning: Only {getTotalStock()} units remaining
              </AlertDescription>
            </Alert>
          )}

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Additional Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Brand</p>
                <p className="text-lg font-semibold">{product.brand || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Weight</p>
                <p className="text-lg font-semibold">{product.weight || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Country</p>
                <p className="text-lg font-semibold">{product.country || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="text-lg font-semibold">{product.type || 'N/A'}</p>
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

