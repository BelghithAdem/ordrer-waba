import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Product, OrderLine } from "@/types/sales-order"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Package } from 'lucide-react'

interface QuickAddFavoritesProps {
  favoriteProducts: Product[]
  productBundles: { id: string; name: string; products: Product[] }[]
  onAddToOrder: (products: OrderLine[]) => void
}

export function QuickAddFavorites({ favoriteProducts, productBundles, onAddToOrder }: QuickAddFavoritesProps) {
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({})

  const handleQuantityChange = (id: string, value: number) => {
    setQuantities(prev => ({ ...prev, [id]: value }))
  }

  const handleAddFavorite = (product: Product) => {
    const quantity = quantities[product.id] || 1
    onAddToOrder([{
      id: Math.random().toString(),
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      quantity,
      unitPrice: product.unitPrice,
      taxRate: product.taxRate,
      discount: 0,
      subTotal: product.unitPrice * quantity,
      total: product.unitPrice * quantity * (1 + product.taxRate / 100),
      unit: "piece",
      isCustom: false
    }])
    setQuantities(prev => ({ ...prev, [product.id]: 1 }))
  }

  const handleAddBundle = (bundle: { id: string; name: string; products: Product[] }) => {
    const orderLines = bundle.products.map(product => ({
      id: Math.random().toString(),
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      quantity: 1,
      unitPrice: product.unitPrice,
      taxRate: product.taxRate,
      discount: 0,
      subTotal: product.unitPrice,
      total: product.unitPrice * (1 + product.taxRate / 100),
      unit: "piece",
      isCustom: false
    }))
    onAddToOrder(orderLines)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Favorite Products
          </CardTitle>
          <CardDescription>Quickly add frequently purchased items</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {favoriteProducts.map(product => (
              <div key={product.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">${product.unitPrice.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`quantity-${product.id}`} className="sr-only">Quantity</Label>
                  <Input
                    id={`quantity-${product.id}`}
                    type="number"
                    min="1"
                    value={quantities[product.id] || 1}
                    onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value))}
                    className="w-20"
                  />
                  <Button onClick={() => handleAddFavorite(product)}>Add</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Bundles
          </CardTitle>
          <CardDescription>Pre-defined product combinations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {productBundles.map(bundle => (
              <div key={bundle.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{bundle.name}</p>
                  <div className="flex gap-2 mt-1">
                    {bundle.products.map(product => (
                      <Badge key={product.id} variant="secondary">{product.name}</Badge>
                    ))}
                  </div>
                </div>
                <Button onClick={() => handleAddBundle(bundle)}>Add Bundle</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

