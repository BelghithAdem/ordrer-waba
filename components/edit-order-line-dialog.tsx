"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { OrderLine, Product } from "@/types/sales-order"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Package, ExternalLink, AlertTriangle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ProductDetailsDialog } from "./product-details-dialog"
import { fetchProducts } from "@/lib/api"

interface EditOrderLineDialogProps {
  orderLine: OrderLine
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (updatedLine: OrderLine) => void
  onDelete: (id: string) => void
  currencies: { code: string; symbol: string }[]
  exchangeRates: { [key: string]: number }
}

export function EditOrderLineDialog({
  orderLine,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  currencies,
  exchangeRates,
}: EditOrderLineDialogProps) {
  const [formData, setFormData] = useState<OrderLine>(orderLine)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [calculatedTotal, setCalculatedTotal] = useState<number>(0)
  const [stockWarning, setStockWarning] = useState(false)
  const [productDetailsOpen, setProductDetailsOpen] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0].code)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setFormData(orderLine)
    setSelectedProductId(orderLine.product_id)
    setSelectedCurrency(currencies.find((c) => c.symbol === orderLine.currency)?.code || currencies[0].code)
  }, [orderLine, currencies])

  useEffect(() => {
    async function loadProducts() {
      setLoading(true)
      setError(null)
      try {
        const fetchedProducts = await fetchProducts()
        setProducts(fetchedProducts)
      } catch (err) {
        setError("Failed to fetch products. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  useEffect(() => {
    const quantity = formData.qty || 0
    const unitPrice = formData.product_price || 0
    const taxRate = formData.tax_rate || 0
    const discount = formData.discount || 0

    const subtotal = quantity * unitPrice
    const taxAmount = subtotal * (taxRate / 100)
    const discountAmount = subtotal * (discount / 100)
    const total = subtotal + taxAmount - discountAmount

    setCalculatedTotal(total)

    if (selectedProductId) {
      const product = products.find((p) => p.id === selectedProductId)
      if (product && product.inventory && product.inventory.length > 0) {
        const totalStock = product.inventory.reduce((sum, inv) => sum + (inv.qty || 0), 0)
        setStockWarning(quantity > totalStock)
      } else {
        setStockWarning(false)
      }
    }
  }, [formData, selectedProductId, products])

  const handleSubmit = () => {
    const updatedOrderLine: OrderLine = {
      ...orderLine,
      ...formData,
      product_id: selectedProductId || orderLine.product_id,
      currency: currencies.find((c) => c.code === selectedCurrency)?.symbol || "$",
      total: calculatedTotal,
    }
    onUpdate(updatedOrderLine)
    onOpenChange(false)
  }

  const handleProductSelect = (productId: string) => {
    const selectedProduct = products.find((p) => p.id === Number.parseInt(productId))
    if (selectedProduct) {
      setSelectedProductId(selectedProduct.id)

      const publishedPrice = selectedProduct.product_price?.find((price) => price.status === "published")
      const discountRate = publishedPrice?.discount_rate || 0

      setFormData({
        ...formData,
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        product_name_en_US: selectedProduct.name_en_US || null,
        product_name_zh_HANT: selectedProduct.name_zh_HANT || selectedProduct.name,
        product_code: selectedProduct.code,
        product_price: selectedProduct.price,
        product_type: selectedProduct.type,
        product_unit: selectedProduct.unit?.toString() || "",
        tax_rate: 0,
        discount: discountRate,
        qty: 1,
        status: "published",
        orq: selectedProduct.orq,
        recurring: selectedProduct.recurring ? 1 : 0,
        x_days_before_eligibility_end_date: selectedProduct.x_days_before_eligibility_end_date,
        duration: selectedProduct.duration || 0,
        membership_start_day: selectedProduct.membership_start_day || 0,
      })
    }
  }

  const selectedProduct = products.find((p) => p.id === selectedProductId)

  const convertPrice = (price: number | undefined, fromCurrency: string, toCurrency: string) => {
    if (price === undefined || isNaN(price)) return 0
    if (price === 0) return 0
    if (fromCurrency === toCurrency) return price
    return price * ((exchangeRates[toCurrency] || 1) / (exchangeRates[fromCurrency] || 1))
  }

  const getStockLevelBadge = (product: Product | undefined) => {
    if (!product || !product.inventory || product.inventory.length === 0)
      return <Badge className="bg-gray-500">Unknown</Badge>
    const totalStock = product.inventory.reduce((sum, inv) => sum + (inv.qty || 0), 0)
    if (totalStock > 20) return <Badge className="bg-green-500">In Stock</Badge>
    if (totalStock > 0) return <Badge className="bg-yellow-500">Low Stock</Badge>
    return <Badge className="bg-red-500">Out of Stock</Badge>
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Edit Order Line
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-full pr-4">
            <form onSubmit={handleSubmit} className="grid gap-6 py-4">
              <div className="grid gap-4">
                <Label htmlFor="product">Product</Label>
                <Select value={selectedProductId?.toString() || ""} onValueChange={handleProductSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{product.name}</span>
                          {getStockLevelBadge(product)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedProduct && (
                  <Card className="p-4">
                    <div className="grid gap-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{selectedProduct.name || "N/A"}</h4>
                          <p className="text-sm text-muted-foreground">{selectedProduct.code || "N/A"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {currencies.find((c) => c.code === selectedCurrency)?.symbol}
                            {(() => {
                              try {
                                return selectedProduct.price !== undefined
                                  ? convertPrice(selectedProduct.price, "USD", selectedCurrency).toFixed(2)
                                  : "N/A"
                              } catch (error) {
                                console.error("Error in price conversion:", error)
                                return "Error"
                              }
                            })()}
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => setProductDetailsOpen(true)}
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Details
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm">{selectedProduct.description || "No description available"}</p>
                      {selectedProduct.inventory && selectedProduct.inventory.length > 0 && (
                        <Alert variant={selectedProduct.inventory[0].qty <= 10 ? "warning" : "info"}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            {selectedProduct.inventory[0].qty <= 10
                              ? `Only ${selectedProduct.inventory[0].qty} units left in stock`
                              : `${selectedProduct.inventory[0].qty} units in stock`}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </Card>
                )}
              </div>

              <div className="grid gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="qty">Quantity</Label>
                    <Input
                      id="qty"
                      type="number"
                      min="1"
                      value={formData.qty || ""}
                      onChange={(e) => setFormData({ ...formData, qty: Number(e.target.value) })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="product_price">Unit Price</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="product_price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.product_price || ""}
                        onChange={(e) => setFormData({ ...formData, product_price: Number(e.target.value) })}
                      />
                      <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                    <Input
                      id="tax_rate"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.tax_rate || ""}
                      onChange={(e) => setFormData({ ...formData, tax_rate: Number(e.target.value) })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="discount">Discount (%)</Label>
                    <Input
                      id="discount"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.discount || ""}
                      onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              {stockWarning && selectedProduct && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Warning: Quantity exceeds available stock (
                    {selectedProduct.inventory?.reduce((sum, inv) => sum + (inv.qty || 0), 0) || 0} available)
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any special instructions or notes about this item"
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <Card className="p-4">
                <div className="grid gap-2">
                  {["Subtotal", "Tax", "Discount", "Total"].map((item, index) => {
                    let value
                    try {
                      switch (index) {
                        case 0:
                          value = convertPrice(
                            (formData.qty || 0) * (formData.product_price || 0),
                            "USD",
                            selectedCurrency,
                          )
                          break
                        case 1:
                          value = convertPrice(
                            (formData.qty || 0) * (formData.product_price || 0) * ((formData.tax_rate || 0) / 100),
                            "USD",
                            selectedCurrency,
                          )
                          break
                        case 2:
                          value = convertPrice(
                            (formData.qty || 0) * (formData.product_price || 0) * ((formData.discount || 0) / 100),
                            "USD",
                            selectedCurrency,
                          )
                          break
                        case 3:
                          value = convertPrice(calculatedTotal, "USD", selectedCurrency)
                          break
                      }
                    } catch (error) {
                      console.error(`Error calculating ${item}:`, error)
                      value = "Error"
                    }

                    return (
                      <div
                        key={item}
                        className={`flex justify-between ${index === 3 ? "font-semibold pt-2 border-t" : "text-sm"}`}
                      >
                        <span>
                          {item}
                          {index === 1
                            ? ` (${formData.tax_rate || 0}%)`
                            : index === 2
                              ? ` (${formData.discount || 0}%)`
                              : ""}
                          :
                        </span>
                        <span>
                          {index === 2 ? "-" : ""}
                          {currencies.find((c) => c.code === selectedCurrency)?.symbol}
                          {typeof value === "number" ? value.toFixed(2) : value}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </form>
          </ScrollArea>
          <DialogFooter className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(formData.product_id.toString())
                onOpenChange(false)
              }}
            >
              Delete
            </Button>
            <Button onClick={handleSubmit} disabled={!selectedProductId || stockWarning}>
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedProduct && (
        <ProductDetailsDialog
          product={selectedProduct}
          open={productDetailsOpen}
          onOpenChange={setProductDetailsOpen}
        />
      )}
    </>
  )
}

