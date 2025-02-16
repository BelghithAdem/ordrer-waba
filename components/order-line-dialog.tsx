"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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
import { AlertCircle, Package, ExternalLink, AlertTriangle, Loader2, RefreshCcw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ProductDetailsDialog } from "./product-details-dialog"
import { fetchProducts } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import debounce from "lodash/debounce"

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

// Helper function to get cached products
const getCachedProducts = () => {
  const cached = localStorage.getItem('products')
  if (!cached) return null

  const { data, timestamp } = JSON.parse(cached)
  if (Date.now() - timestamp > CACHE_DURATION) {
    localStorage.removeItem('products')
    return null
  }
  return data
}

// Helper function to set cached products
const setCachedProducts = (products: Product[]) => {
  localStorage.setItem('products', JSON.stringify({
    data: products,
    timestamp: Date.now()
  }))
}

interface OrderLineDialogProps {
  orderLine?: OrderLine
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (orderLine: Partial<OrderLine>) => void
  onAddExistingProduct: (product: Product) => void
  currencies: { code: string; symbol: string }[]
  exchangeRates: { [key: string]: number }
}

export function OrderLineDialog({
  orderLine,
  open,
  onOpenChange,
  onSave,
  onAddExistingProduct,
  currencies,
  exchangeRates,
}: OrderLineDialogProps) {
  const [formData, setFormData] = useState<Partial<OrderLine>>({
    product_id: 0,
    product_price: 0,
    discount: 0,
    total: 0,
    product_type: "",
    product_name: "",
    product_name_en_US: null,
    product_name_zh_HANT: "",
    product_code: "",
    product_unit: "",
    recurring: 0,
    status: "published",
    orq: 0,
    tax_rate: 0,
    qty: 1,
    x_days_before_eligibility_end_date: 0,
    duration: 0,
    membership_start_day: 0,
  })
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [calculatedTotal, setCalculatedTotal] = useState<number>(0)
  const [stockWarning, setStockWarning] = useState(false)
  const [productDetailsOpen, setProductDetailsOpen] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0].code)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (orderLine) {
      setFormData(orderLine)
      setSelectedProductId(orderLine.product_id)
      setSelectedCurrency(currencies.find((c) => c.symbol === orderLine.currency)?.code || currencies[0].code)
    } else {
      setFormData({
        product_id: 0,
        product_price: 0,
        discount: 0,
        total: 0,
        product_type: "",
        product_name: "",
        product_name_en_US: null,
        product_name_zh_HANT: "",
        product_code: "",
        product_unit: "",
        recurring: 0,
        status: "published",
        orq: 0,
        tax_rate: 0,
        qty: 1,
        x_days_before_eligibility_end_date: 0,
        duration: 0,
        membership_start_day: 0,
      })
      setSelectedProductId(null)
      setSelectedCurrency(currencies[0].code)
    }
  }, [orderLine, currencies])

  const fetchProductsAsync = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Try to get cached data first
      const cachedData = getCachedProducts()
      if (cachedData) {
        setProducts(cachedData)
        setLoading(false)
        return
      }

      const fetchedProducts = await fetchProducts() // API CALL #2
      setProducts(fetchedProducts)
      // Cache the fetched data
      setCachedProducts(fetchedProducts)
    } catch (err) {
      setError("Failed to fetch products. Please try again later.")
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const refreshProducts = useCallback(async () => {
    setLoading(true)
    try {
      const fetchedProducts = await fetchProducts()
      setProducts(fetchedProducts)
      setCachedProducts(fetchedProducts)
      toast({
        title: "Success",
        description: "Product list refreshed successfully",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to refresh products",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    let mounted = true

    const loadProducts = async () => {
      if (mounted && open) {
        await fetchProductsAsync()
      }
    }

    loadProducts()

    return () => {
      mounted = false
    }
  }, [open, fetchProductsAsync])

  // Memoize filtered products
  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return products.filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.code.toLowerCase().includes(query)
    )
  }, [products, searchQuery])

  // Memoize stock warning calculation
  const stockWarningInfo = useMemo(() => {
    if (!selectedProductId || !formData.qty) return { warning: false, available: 0 }
    
    const product = products.find(p => p.id === selectedProductId)
    if (!product?.inventory?.length) return { warning: false, available: 0 }

    const usableStock = product.inventory
      .filter(inv => inv.status === "published")
      .reduce((sum, inv) => sum + (inv.qty || 0), 0)

    return {
      warning: formData.qty > usableStock,
      available: usableStock
    }
  }, [selectedProductId, formData.qty, products])

  // Memoize total calculations
  const calculatedTotals = useMemo(() => {
    const quantity = formData.qty || 0
    const unitPrice = formData.product_price || 0
    const taxRate = formData.tax_rate || 0
    const discount = formData.discount || 0

    const subtotal = quantity * unitPrice
    const taxAmount = subtotal * (taxRate / 100)
    const discountAmount = subtotal * (discount / 100)
    const total = subtotal + taxAmount - discountAmount

    return {
      subtotal,
      taxAmount,
      discountAmount,
      total
    }
  }, [formData.qty, formData.product_price, formData.tax_rate, formData.discount])

  // Debounced search handler
  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        setSearchQuery(query)
      }, 300),
    []
  )

  useEffect(() => {
    setFormData(prev => ({ ...prev, total: calculatedTotals.total }))
  }, [calculatedTotals.total])

  const handleProductSelect = useCallback(
    (productId: string) => {
      const selectedProduct = products.find((p) => p.id === Number.parseInt(productId))
      console.log("selectedProduct", selectedProduct)
      if (selectedProduct) {
        console.log("selectedProduct", selectedProduct)
        setSelectedProductId(selectedProduct.id)

        const publishedPrice = selectedProduct.product_price?.find((price) => price.status === "published")
        const discountRate = publishedPrice?.discount_rate || 0
        const productPrice = publishedPrice?.price ?? (selectedProduct.price || 0)

        setFormData({
          ...formData,
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          product_name_en_US: selectedProduct.name_en_US || null,
          product_name_zh_HANT: selectedProduct.name_zh_HANT || selectedProduct.name,
          product_code: selectedProduct.code,
          product_price: productPrice,
          product_type: selectedProduct.type || "",
          product_unit: selectedProduct.unit?.toString() || "",
          tax_rate: 0,
          discount: discountRate,
          qty: 1,
          status: "published",
          orq: selectedProduct.orq || 0,
          recurring: selectedProduct.recurring ? 1 : 0,
          x_days_before_eligibility_end_date: selectedProduct.x_days_before_eligibility_end_date || 0,
          duration: selectedProduct.duration || 0,
          membership_start_day: selectedProduct.membership_start_day || 0,
        })
      }
    },
    [products],
  )

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
    const totalStock = product.inventory?.reduce((sum, inv) => sum + (inv.qty || 0), 0) || 0
    if (totalStock > 20) return <Badge className="bg-green-500">{totalStock} units in stock</Badge>
    if (totalStock > 0) return <Badge className="bg-yellow-500">{totalStock} units in stock</Badge>
    return <Badge className="bg-red-500">Out of Stock</Badge>
  }

  const handleSubmit = () => {
    if (orderLine) {
      console.log(orderLine)
      // This is an update operation
      onSave({
        ...orderLine,
        ...formData,
        product_id: selectedProductId || orderLine.product_id,
      })
    } else {
      // This is an add operation
      onSave(formData)
    }
    onOpenChange(false)
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
              {orderLine ? "Edit Order Line" : "Add Order Line"}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-full pr-4">
            <form className="grid gap-6 py-4">
              <div className="grid gap-4">
                <Label htmlFor="product">Product</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => debouncedSearch(e.target.value)}
                    className="mb-2"
                  />
                  <Button variant="outline" size="icon" onClick={refreshProducts} disabled={loading}>
                    <RefreshCcw className="h-4 w-4" />
                  </Button>
                </div>
                <Select value={selectedProductId?.toString() || ""} onValueChange={handleProductSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{product.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              ${(() => {
                                const publishedPrice = product.product_price?.find(
                                  (price) => price.status === "published",
                                )
                                return (publishedPrice?.price ?? product.price ?? 0).toFixed(2)
                              })()}
                            </span>
                            {getStockLevelBadge(product)}
                          </div>
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
                        <div className="space-y-2">
                          <Alert variant={selectedProduct.inventory[0].qty <= 10 ? "warning" : "info"}>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              {(() => {
                                const totalStock = selectedProduct.inventory.reduce(
                                  (sum, inv) => sum + (inv.qty || 0),
                                  0,
                                )
                                const usableStock = selectedProduct.inventory
                                  .filter((inv) => inv.status === "published")
                                  .reduce((sum, inv) => sum + (inv.qty || 0), 0)
                                return `Total: ${totalStock} units in stock (${usableStock} usable)`
                              })()}
                            </AlertDescription>
                          </Alert>
                          <div className="text-sm space-y-1">
                            {selectedProduct.inventory.map((inv, index) => (
                              <div key={index} className="flex justify-between">
                                <span
                                  className={inv.status === "published" ? "text-green-500" : "text-muted-foreground"}
                                >
                                  {inv.name || "Default Location"}{" "}
                                  {inv.status === "published" ? "(usable)" : "(unusable)"}
                                </span>
                                <span
                                  className={inv.status === "published" ? "text-green-500" : "text-muted-foreground"}
                                >
                                  {inv.qty} units
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
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
                    Warning: Quantity exceeds available usable stock (
                    {selectedProduct.inventory
                      ?.filter((inv) => inv.status === "published")
                      .reduce((sum, inv) => sum + (inv.qty || 0), 0) || 0}{" "}
                    available)
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
                          value = convertPrice(formData.total, "USD", selectedCurrency)
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
              onClick={handleSubmit}
              disabled={
                !selectedProductId ||
                stockWarning ||
                (orderLine && JSON.stringify(formData) === JSON.stringify(orderLine))
              }
            >
              {orderLine ? "Update" : "Add to Order"}
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

