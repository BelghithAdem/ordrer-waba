import { useState } from 'react'
import { Product, OrderLine } from "@/types/sales-order"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from 'lucide-react'

interface ProductRecommendationsProps {
  recommendations: Product[]
  onAddToOrder: (product: Product) => void
}

export function ProductRecommendations({ recommendations, onAddToOrder }: ProductRecommendationsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Recommended Products
        </CardTitle>
        <CardDescription>Products you might be interested in</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {recommendations.map(product => (
            <div key={product.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-muted-foreground">${product.unitPrice.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={product.inStock > 0 ? "secondary" : "destructive"}>
                  {product.inStock > 0 ? `${product.inStock} in stock` : "Out of stock"}
                </Badge>
                <Button onClick={() => onAddToOrder(product)} disabled={product.inStock === 0}>Add</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

