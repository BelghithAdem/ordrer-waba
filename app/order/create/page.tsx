export const dynamic = "force-dynamic"; 
"use client"

import { useState, useEffect, useCallback } from "react"
import { format, isValid } from "date-fns"
import {
  CalendarIcon,
  Plus,
  FileText,
  Truck,
  Receipt,
  Paperclip,
  AlertCircle,
  Trash2,
  HelpCircle,
  Eye,
  Loader2,
} from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Suspense } from "react"
import axios from "axios"
import { toast } from "@/components/ui/use-toast"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { CustomerManagement } from "@/components/customer-management"
import { OrderLineDialog } from "@/components/order-line-dialog"
import { QuickAddFavorites } from "@/components/quick-add-favorites"
import { ProductRecommendations } from "@/components/product-recommendations"
import { DraggableOrderLineItem } from "@/components/draggable-order-line-item"
import { BatchActions } from "@/components/batch-actions"
import {
  type Customer,
  type SalesOrder,
  type Product,
  type Template,
  ShippingMethod,
  PaymentMethod,
  type DocumentTemplate,
} from "@/types/sales-order"
import type { OrderLine } from "@/types/sales-order"
import {
  products,
  warehouses,
  shippingMethods,
  paymentMethods,
  sampleSalesOrders,
  currencies,
  exchangeRates,
} from "@/data/dummy-data"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { CopyFromDialog } from "@/components/copy-from-dialog"
import { CopyToDialog } from "@/components/copy-to-dialog"
import { OrderTemplates } from "@/components/order-templates"
import { OrderPreview } from "@/components/order-preview"
import { EnhancedAttachments } from "@/components/enhanced-attachments"
import { InvoiceGenerator } from "@/components/invoice-generator"
import { KeyboardShortcutsInfo } from "@/components/keyboard-shortcuts-info"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { CompactOrderPreview } from "@/components/compact-order-preview"
import { BulkUpload } from "@/components/bulk-upload"
import { fetchCustomers, fetchOrders, fetchTemplates, fetchDocumentTemplate } from "@/lib/api"
import { customers as mockedCustomers } from "@/data/dummy-data"
import { setAccessToken, getAccessToken } from "@/lib/auth"
import { TransactionList } from "@/components/transaction-list"

type Transaction = {
  id: string
  date: string
  amount: number
  type: string
  status: string
}
async function createOrder(orderData: {
  company: number
  orq: number
  customer_id: number
  product: Array<{ id: number; qty: number }>
}) {
  try {
    const response = await axios.post("https://orq-dev.synque.ca/orders/create", orderData, {
      headers: { "Content-Type": "application/json" },
    })
    return response.data
  } catch (error) {
    console.error("....Error creating order:", error)
    throw error
  }
}

export default function CreateOrderPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const dt_id = searchParams.dt_id as string
  console.log("dt_id:", dt_id)
  console.log(".250126:.")

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateSalesOrder dt_id={dt_id} />
    </Suspense>
  )
}

function CreateSalesOrder({ dt_id }: { dt_id: string | string[] | undefined }) {
  console.log("....CreateSalesOrder rendered with dt_id:", dt_id)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tokenFromUrl = urlParams.get("access_token")

    if (tokenFromUrl) {
      setAccessToken(tokenFromUrl)
      console.log("Access token set from URL parameter")
    } else {
      const existingToken = getAccessToken()
      if (existingToken) {
        console.log("Using existing access token from localStorage")
      } else {
        console.log("No access token found")
        // Redirect to login page or handle unauthorized access
        // For now, we'll just log a message
        console.log("User is not authenticated. Redirecting to login page...")
        // Uncomment the next line to enable redirection
        // router.push('/login')
      }
    }
  }, [])
  const [documentTemplate, setDocumentTemplate] = useState<DocumentTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>()
  const [selectedDates, setSelectedDates] = useState<{
    orderDate: Date
    deliveryDate: Date | null
    dueDate: Date | null
  }>({
    orderDate: new Date(),
    deliveryDate: null,
    dueDate: null
  })
  const [originalOrderLines, setOriginalOrderLines] = useState<OrderLine[]>(initialOrderLines)
  const [orderLines, setOrderLines] = useState<OrderLine[]>(initialOrderLines)
  const [orderLineDialogOpen, setOrderLineDialogOpen] = useState(false)
  const [editingOrderLine, setEditingOrderLine] = useState<OrderLine>()
  const [status, setStatus] = useState<SalesOrder["status"]>("draft")
  const [orderType, setOrderType] = useState("standard")
  const [shippingMethod, setShippingMethod] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [notes, setNotes] = useState("")
  const [customerNotes, setCustomerNotes] = useState("")
  const [internalNotes, setInternalNotes] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [creditLimitWarning, setCreditLimitWarning] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("")
  const [isPaid, setIsPaid] = useState(false)
  const [copyFromDialogOpen, setCopyFromDialogOpen] = useState(false)
  const [copyToDialogOpen, setCopyToDialogOpen] = useState(false)
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([])
  const [selectedOrderLines, setSelectedOrderLines] = useState<string[]>([])
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true)
  const [activeTab, setActiveTab] = useState("content")
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoadingOrders, setIsLoadingOrders] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalTemplateCount, setTotalTemplateCount] = useState(0)
  const [orderNumber, setOrderNumber] = useState(`SO-${Math.floor(Math.random() * 10000)}`)
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [customerError, setCustomerError] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [orderFilters, setOrderFilters] = useState({
    page: 1,
    limit: 10,
    status: "all",
    type: "all",
    dateFrom: undefined as Date | undefined,
  })
  const [totalOrderCount, setTotalOrderCount] = useState(0)

  const favoriteProducts = products.slice(0, 3)
  const productBundles = [
    {
      id: "bundle1",
      name: "Office Starter Kit",
      products: [products[0], products[1]],
    },
    {
      id: "bundle2",
      name: "Premium Workstation",
      products: [products[0], products[1], products[2]],
    },
  ]

  const recommendedProducts = products.slice(0, 3)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true)

  useEffect(() => {
    async function loadCustomers() {
      console.log("🔍 [CreateSalesOrder] Starting to load customers")
      setIsLoadingCustomers(true)
      try {
        const fetchedCustomers = await fetchCustomers()
        console.log(`🔍 [CreateSalesOrder] Successfully loaded ${fetchedCustomers.length} customers`)
        setCustomers(fetchedCustomers)
      } catch (error) {
        console.error("Failed to fetch customers:", error)
        console.log("🔍 [CreateSalesOrder] Falling back to mocked customers data")
        // Fallback to mocked data
        setCustomers(mockedCustomers)
      } finally {
        setIsLoadingCustomers(false)
      }
    }

    loadCustomers()
  }, [])

  useEffect(() => {
    async function loadDocumentTemplate() {
      console.log("Fetching document template...")
      setIsLoading(true)
      setError(null)
      try {
        const template = await fetchDocumentTemplate(dt_id)
        const processedTemplate = processDocumentTemplate(template)
        setDocumentTemplate(processedTemplate)
      } catch (err) {
        console.error("Error fetching document template:", err)
        setError("Failed to fetch document template. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    loadDocumentTemplate()
  }, [dt_id])

  const fetchTemplatesAsync = useCallback(async (page: number) => {
    if (activeTab === "templates") {
      setIsLoadingTemplates(true)
      try {
        const { templates: fetchedTemplates, totalCount } = await fetchTemplates(page)
        setTemplates(fetchedTemplates)
        setTotalTemplateCount(totalCount)
      } catch (error) {
        console.error("Failed to load templates:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load templates. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingTemplates(false)
      }
    }
  }, [activeTab, toast])

  useEffect(() => {
    let mounted = true

    const loadTemplates = async () => {
      if (mounted && activeTab === "templates") {
        await fetchTemplatesAsync(currentPage)
      }
    }

    loadTemplates()

    return () => {
      mounted = false
    }
  }, [activeTab, currentPage, fetchTemplatesAsync])

  const handleCopyFrom = (sourceOrder: SalesOrder) => {
    console.log("handleCopyFrom called with sourceOrder:", JSON.stringify(sourceOrder, null, 2))
    console.log("sourceOrder keys:", Object.keys(sourceOrder))

    const orderLines = sourceOrder.orderLines
    console.log("Order lines:", orderLines)

    if (orderLines) {
      setOrderLines(orderLines)
      setOriginalOrderLines(orderLines)
      console.log("Order lines set:", orderLines)
    } else {
      console.error("No order lines found in sourceOrder")
    }

    // Set dates
    const orderDate = sourceOrder.orderDate ? new Date(sourceOrder.orderDate) : new Date()
    const deliveryDate = sourceOrder.deliveryDate ? new Date(sourceOrder.deliveryDate) : null
    const dueDate = sourceOrder.dueDate ? new Date(sourceOrder.dueDate) : null

    setSelectedDates({
      orderDate: isValid(orderDate) ? orderDate : new Date(),
      deliveryDate: deliveryDate && isValid(deliveryDate) ? deliveryDate : null,
      dueDate: dueDate && isValid(dueDate) ? dueDate : null,
    })

    // Set status and orderType
    setStatus(sourceOrder.status as SalesOrder["status"])
    setOrderType("standard")

    // Set other fields
    setShippingMethod("")
    setPaymentTerms(sourceOrder.paymentTerms || "")
    setCurrency(sourceOrder.currency || "USD")
    setNotes(sourceOrder.notes || "")
    setCustomerNotes(sourceOrder.customerNotes || "")
    setInternalNotes(sourceOrder.internalNotes || "")

    setCopyFromDialogOpen(false)
    console.log("..Template loaded, state updated")
  }

  const handleCopyTo = (targetType: string) => {
    console.log(`..Copying current order to ${targetType}`)
    setCopyToDialogOpen(false)
  }

  useEffect(() => {
    console.log("Selected customer:", selectedCustomer)
    //console.log("--Current total:", calculateTotal())
    if (selectedCustomer && calculateTotal() > (selectedCustomer.raw?.creditLimit || 0)) {
      console.log("Credit limit warning triggered")
      setCreditLimitWarning(true)
    } else {
      console.log("No credit limit warning")
      setCreditLimitWarning(false)
    }
  }, [selectedCustomer, orderLines])

  const handleAddOrderLine = (orderLine: Partial<OrderLine>) => {
    console.log("Adding new order line:", orderLine)

    // Check if product already exists in order lines
    const existingProductLine = orderLines.find((line) => line.product_id === orderLine.product_id)
    if (existingProductLine) {
      toast({
        title: "Product already exists",
        description: "This product is already in your order. You can update its quantity instead.",
        variant: "destructive",
      })
      return
    }

    const newOrderLine: OrderLine = {
      ...orderLine,
      product_id: orderLine.product_id || 0,
      product_price: orderLine.product_price || 0,
      discount: orderLine.discount || 0,
      total: orderLine.total || 0,
      product_type: orderLine.product_type || "",
      product_name: orderLine.product_name || "",
      product_name_en_US: orderLine.product_name_en_US || null,
      product_name_zh_HANT: orderLine.product_name_zh_HANT || "",
      product_code: orderLine.product_code || "",
      product_unit: orderLine.product_unit || "",
      recurring: orderLine.recurring || 0,
      status: orderLine.status || "published",
      orq: orderLine.orq || 0,
      tax_rate: orderLine.tax_rate || 0,
      qty: orderLine.qty || 1,
      x_days_before_eligibility_end_date: orderLine.x_days_before_eligibility_end_date || 0,
      duration: orderLine.duration || 0,
      membership_start_day: orderLine.membership_start_day || 0,
    }

    setOrderLines((prevLines) => {
      console.log("..Updated order lines:", [...prevLines, newOrderLine])
      return [...prevLines, newOrderLine]
    })
    setOriginalOrderLines((prevLines) => [...prevLines, newOrderLine])
  }

  const handleUpdateOrderLine = (updatedLine: OrderLine, index: number) => {
    console.log("Updating order line:", updatedLine, "at index:", index)
    setOrderLines((prevLines) => {
      const newLines = [...prevLines]
      newLines[index] = updatedLine
      return newLines
    })
    setOriginalOrderLines((prevLines) => {
      const newLines = [...prevLines]
      newLines[index] = updatedLine
      return newLines
    })
  }

  const handleDeleteOrderLine = (id: string) => {
    console.log("Deleting order line with id:", id)
    setOrderLines((prevLines) => {
      const newLines = prevLines.filter((ol) => ol.product_id.toString() !== id)
      console.log("Updated order lines:", newLines)
      return newLines
    })
    setOriginalOrderLines((prevLines) => prevLines.filter((ol) => ol.product_id.toString() !== id))
    setSelectedOrderLines((prevSelected) => {
      const newSelected = prevSelected.filter((lineId) => lineId !== id)
      console.log("Updated selected order lines:", newSelected)
      return newSelected
    })
  }

  const handleToggleRecurring = (id: string) => {
    setOrderLines(
      orderLines.map((line) =>
        line.product_id.toString() === id ? { ...line, recurring: line.recurring === 1 ? 0 : 1 } : line,
      ),
    )
    setOriginalOrderLines(
      originalOrderLines.map((line) =>
        line.product_id.toString() === id ? { ...line, recurring: line.recurring === 1 ? 0 : 1 } : line,
      ),
    )
  }

  const calculateTotal = () => {
    const total = orderLines.reduce((sum, line) => sum + (line.total ?? 0), 0)
    console.log("Calculated total:", total)
    return total
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)])
    }
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const handleCreateCustomer = (customer: Customer) => {
    customers.push(customer)
    setSelectedCustomer(customer)
  }

  const handleBulkUpload = (file: File) => {
    console.log(`Bulk upload file: ${file.name}`)
    // Add your bulk upload logic here
    toast({
      title: "Bulk Upload",
      description: `File "${file.name}" has been uploaded successfully.`,
    })
  }

  const handleClearOrderLines = () => {
    setOrderLines([])
    setOriginalOrderLines([])
    setSelectedOrderLines([])
    toast({
      title: "Order Lines Cleared",
      description: "All order lines have been removed from the order.",
    })
  }

  const handleAddExistingProduct = (product: Product) => {
    const newOrderLine: OrderLine = {
      product_id: product.id,
      product_price: product.price,
      discount: 0,
      total: product.price,
      product_type: product.type,
      product_name: product.name,
      product_name_en_US: product.name_en_US || null,
      product_name_zh_HANT: product.name_zh_HANT || product.name,
      product_code: product.code,
      product_unit: product.unit?.toString() || "",
      recurring: product.recurring ? 1 : 0,
      status: "published",
      orq: product.orq,
      tax_rate: 0,
      qty: 1,
      x_days_before_eligibility_end_date: product.x_days_before_eligibility_end_date,
      duration: product.duration || 0,
      membership_start_day: product.membership_start_day || 0,
    }
    setOrderLines([...orderLines, newOrderLine])
    setOriginalOrderLines([...originalOrderLines, newOrderLine])
  }

  const handleAddFavoriteProducts = (newOrderLines: OrderLine[]) => {
    setOrderLines([...orderLines, ...newOrderLines])
    setOriginalOrderLines([...originalOrderLines, ...newOrderLines])
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setOrderLines((items) => {
        const oldIndex = items.findIndex((item) => item.product_id.toString() === active.id)
        const newIndex = items.findIndex((item) => item.product_id.toString() === over?.id)

        if (oldIndex !== -1 && newIndex !== -1) {
          return arrayMove(items, oldIndex, newIndex)
        }
        return items
      })
      setOriginalOrderLines((items) => {
        const oldIndex = items.findIndex((item) => item.product_id.toString() === active.id)
        const newIndex = items.findIndex((item) => item.product_id.toString() === over?.id)

        if (oldIndex !== -1 && newIndex !== -1) {
          return arrayMove(items, oldIndex, newIndex)
        }
        return items
      })
    }
  }

  const handleApplyDiscount = (discount: number) => {
    setOrderLines(
      orderLines.map((line) =>
        selectedOrderLines.includes(line.product_id.toString())
          ? {
              ...line,
              discount,
              total: line.product_price * (1 + line.tax_rate / 100) * (1 - discount / 100),
            }
          : line,
      ),
    )
    setOriginalOrderLines(
      originalOrderLines.map((line) =>
        selectedOrderLines.includes(line.product_id.toString())
          ? {
              ...line,
              discount,
              total: line.product_price * (1 + line.tax_rate / 100) * (1 - discount / 100),
            }
          : line,
      ),
    )
  }

  const handleApplyTax = (tax: number) => {
    setOrderLines(
      orderLines.map((line) =>
        selectedOrderLines.includes(line.product_id.toString())
          ? {
              ...line,
              tax_rate: tax,
              total: line.product_price * (1 + tax / 100) * (1 - line.discount / 100),
            }
          : line,
      ),
    )
    setOriginalOrderLines(
      originalOrderLines.map((line) =>
        selectedOrderLines.includes(line.product_id.toString())
          ? {
              ...line,
              tax_rate: tax,
              total: line.product_price * (1 + tax / 100) * (1 - line.discount / 100),
            }
          : line,
      ),
    )
  }

  const handleSearch = (searchTerm: string) => {
    setSearchTerm(searchTerm)
    if (!searchTerm) {
      setOrderLines(originalOrderLines)
    } else {
      setOrderLines(
        originalOrderLines.filter(
          (line) =>
            line.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            line.product_code.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      )
    }
  }

  useEffect(() => {
    if (dt_id === undefined) {
      console.log("dt_id is undefined, using mocked data")
    } else {
      console.log("dt_id:", dt_id)
    }
    console.log("Document Template:", JSON.stringify(documentTemplate, null, 2))
  }, [dt_id, documentTemplate])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case "s":
            e.preventDefault()
            setStatus("draft")
            break
          case "Enter":
            e.preventDefault()
            setStatus("pending")
            break
          case "b":
            e.preventDefault()
            setOrderLineDialogOpen(true)
            break
          case "/":
            e.preventDefault()
            setShortcutsOpen(true)
            break
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handlePreviewTemplate = (template: SalesOrder) => {
    setPreviewOpen(true)
    const previewOrder = {
      ...template,
      orderNumber: `PREVIEW-${template.orderNumber}`,
      orderDate: new Date(),
    }
    setSelectedCustomer(undefined)
    setOrderLines(template.orderLines)
    setOriginalOrderLines(template.orderLines)
    setPaymentTerms(template.paymentTerms)
    setCurrency(template.currency)
  }

  // Function to process the document template and create components
  const processDocumentTemplate = (template: DocumentTemplate): DocumentTemplate => {
    const orderPreviewComponent = template?.components?.find(
      (component) => component.raw?.uiType === "OrderPreview",
    ) || {
      raw: {
        uiType: "OrderPreview",
        config: {
          showCustomerInfo: true,
          showOrderLines: true,
          showTotals: true,
          showNotes: true,
        },
      },
    }

    // Add other component creation logic here if needed

    return { ...template, components: [orderPreviewComponent] } // Return the processed template
  }

  // Find the OrderPreview component (using the processed template)
  const orderPreviewComponent = documentTemplate?.components?.find(
    (component) => component.raw?.uiType === "OrderPreview",
  ) || {
    raw: {
      uiType: "OrderPreview",
      config: {
        showCustomerInfo: true,
        showOrderLines: true,
        showTotals: true,
        showNotes: true,
      },
    },
  }

  // Memoize the loadOrders function
  const loadOrders = useCallback(async (filters: typeof orderFilters) => {
    setIsLoadingOrders(true)
    setOrdersError(null)
    try {
      const { orders: fetchedOrders, totalCount } = await fetchOrders(
        filters.page,
        filters.limit,
        {
          status: filters.status,
          type: filters.type,
          dateFrom: filters.dateFrom,
        }
      )
      setSalesOrders(fetchedOrders)
      setTotalOrderCount(totalCount)
    } catch (error) {
      console.error("Failed to fetch orders:", error)
      setOrdersError("Failed to load orders. Using sample data instead.")
      // Fallback to sample data
      setSalesOrders(sampleSalesOrders)
      setTotalOrderCount(sampleSalesOrders.length)
    } finally {
      setIsLoadingOrders(false)
    }
  }, [])

  // Only fetch orders when filters change and dialog is open
  useEffect(() => {
    if (copyFromDialogOpen) {
      loadOrders(orderFilters)
    }
  }, [loadOrders, orderFilters, copyFromDialogOpen])

  // Load orders when dialog opens if we don't have any
  useEffect(() => {
    if (copyFromDialogOpen && salesOrders.length === 0) {
      loadOrders(orderFilters)
    }
  }, [copyFromDialogOpen, salesOrders.length, loadOrders, orderFilters])

  const handleOrderFiltersChange = (newFilters: typeof orderFilters) => {
    setOrderFilters(newFilters)
  }

  const handleCreateOrder = async () => {
    try {
      if (!selectedCustomer) {
        setCustomerError(true)
        toast({
          title: "Error",
          description: "Please select a customer before creating an order.",
          variant: "destructive",
        })
        return
      }
      setCustomerError(false)
      setIsCreatingOrder(true)
      const orderData = {
        orq: 63,
        company: selectedCustomer.id,
        customer_id: selectedCustomer.id,
        product: orderLines.map((line) => ({
          id: line.product_id,
          qty: line.qty,
        })),
      }

      const response = await createOrder(orderData)

      if (response.status === 200) {
        toast({
          title: "Success",
          description: "Order created successfully!",
        })
        setStatus("pending")
      } else {
        throw new Error("Failed to create order")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingOrder(false)
    }
  }

  // Initialize exchangeRates with proper type
  const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number }>({
    USD: 1,
    EUR: 0.85,
    GBP: 0.73,
    JPY: 110.0
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if (!documentTemplate) {
    return <div>No document template found.</div>
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Create Sales Order</h1>
          <Button variant="ghost" size="icon" onClick={() => setShortcutsOpen(true)} className="ml-2">
            <HelpCircle className="h-4 w-4" />
          </Button>
          <TooltipProvider>
            <TooltipRoot>
              <TooltipTrigger asChild>
                <span />
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Create and manage sales orders with a comprehensive form. Configure customer details, order lines,
                  shipping, and payment information all in one place.
                </p>
              </TooltipContent>
            </TooltipRoot>
          </TooltipProvider>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <TooltipRoot>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={() => setPreviewOpen(true)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Preview the complete order before finalizing. Review all details including customer information, order
                  lines, and totals.
                </p>
              </TooltipContent>
            </TooltipRoot>
          </TooltipProvider>
          <TooltipProvider>
            <TooltipRoot>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={() => setCopyFromDialogOpen(true)}>
                  Copy From
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Create a new order by copying details from an existing order or template. Useful for recurring orders.
                </p>
              </TooltipContent>
            </TooltipRoot>
          </TooltipProvider>
          <TooltipProvider>
            <TooltipRoot>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={() => setCopyToDialogOpen(true)}>
                  Copy To
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy this order to create a new document type (e.g., quotation, invoice, or purchase order).</p>
              </TooltipContent>
            </TooltipRoot>
          </TooltipProvider>
          <TooltipProvider>
            <TooltipRoot>
              <TooltipTrigger asChild>
                <Button onClick={() => setStatus("draft")}>Save as Draft</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save the current order as a draft to continue editing later. All information will be preserved.</p>
              </TooltipContent>
            </TooltipRoot>
          </TooltipProvider>
          <TooltipProvider>
            <TooltipRoot>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleCreateOrder}
                  disabled={isCreatingOrder}
                >
                  {isCreatingOrder ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Order"
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Finalize and create the sales order. This will move the order to pending status and notify relevant
                  parties.
                </p>
              </TooltipContent>
            </TooltipRoot>
          </TooltipProvider>
        </div>
      </div>

      {creditLimitWarning && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Credit Limit Warning</AlertTitle>
          <AlertDescription>
            The total order amount exceeds the customer&apos;s credit limit. Please review before proceeding.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingCustomers ? (
              <div>Loading customers...</div>
            ) : (
              <CustomerManagement
                customers={customers || []}
                selectedCustomer={selectedCustomer}
                onSelectCustomer={(customer) => {
                  setSelectedCustomer(customer)
                  setCustomerError(false)
                }}
                onCreateCustomer={handleCreateCustomer}
                error={customerError}
              />
            )}
            <TooltipProvider>
              <TooltipRoot>
                <TooltipTrigger asChild>
                  <span />
                </TooltipTrigger>
                <TooltipContent>
                  <p>info box text</p>
                </TooltipContent>
              </TooltipRoot>
            </TooltipProvider>
            {selectedCustomer && !selectedCustomer.isGuest && (
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Billing Address</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedCustomer.raw?.billingAddress?.street}
                    <br />
                    {selectedCustomer.raw?.billingAddress?.city}, {selectedCustomer.raw?.billingAddress?.state}{" "}
                    {selectedCustomer.raw?.billingAddress?.postalCode}
                    <br />
                    {selectedCustomer.raw?.billingAddress?.country}
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Shipping Address</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedCustomer.raw?.shippingAddress?.street}
                    <br />
                    {selectedCustomer.raw?.shippingAddress?.city}, {selectedCustomer.raw?.shippingAddress?.state}{" "}
                    {selectedCustomer.raw?.shippingAddress?.postalCode}
                    <br />
                    {selectedCustomer.raw?.shippingAddress?.country}
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Contact Information</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedCustomer.raw?.phone}
                    <br />
                    {selectedCustomer.raw?.email}
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Financial Information</h3>
                  <p className="text-sm text-muted-foreground">
                    Tax ID: {selectedCustomer.raw?.taxId}
                    <br />
                    Credit Limit: ${selectedCustomer.raw?.creditLimit?.toLocaleString()}
                    <br />
                    Payment Terms: {selectedCustomer.raw?.paymentTerms}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Order Number</label>
                <TooltipProvider>
                  <TooltipRoot>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        A unique identifier for this order. This number will be used for tracking and reference
                        purposes.
                      </p>
                    </TooltipContent>
                  </TooltipRoot>
                </TooltipProvider>
              </div>
              <Input placeholder="Enter order number" value={orderNumber} disabled />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Status</label>
                <TooltipProvider>
                  <TooltipRoot>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Set the current status of the order.</p>
                    </TooltipContent>
                  </TooltipRoot>
                </TooltipProvider>
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="outstanding_payment">Outstanding Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Order Type</label>
                <TooltipProvider>
                  <TooltipRoot>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Specify the type of order.</p>
                    </TooltipContent>
                  </TooltipRoot>
                </TooltipProvider>
              </div>
              <Select value={orderType} onValueChange={setOrderType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select order type" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="template">template</SelectItem>
                <SelectItem value="sales">sales</SelectItem>
                <SelectItem value="invoice">invoice</SelectItem>
                  <SelectItem value="delivery">delivery</SelectItem>
                  <SelectItem value="special">stock</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="rush">Rush</SelectItem>
                  <SelectItem value="backorder">Backorder</SelectItem>
                  <SelectItem value="special">Special</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Order Date</label>
                <TooltipProvider>
                  <TooltipRoot>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>The date when the order was placed.</p>
                    </TooltipContent>
                  </TooltipRoot>
                </TooltipProvider>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDates.orderDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDates.orderDate ? format(selectedDates.orderDate, "PPP") : "Select order date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDates.orderDate}
                    onSelect={(date) =>
                      setSelectedDates((prev) => ({
                        ...prev,
                        orderDate: date,
                      }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Delivery Date</label>
                <TooltipProvider>
                  <TooltipRoot>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Expected date of delivery to the customer.</p>
                    </TooltipContent>
                  </TooltipRoot>
                </TooltipProvider>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDates.deliveryDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDates.deliveryDate ? format(selectedDates.deliveryDate, "PPP") : "Select delivery date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDates.deliveryDate}
                    onSelect={(date) =>
                      setSelectedDates((prev) => ({
                        ...prev,
                        deliveryDate: date,
                      }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Due Date</label>
                <TooltipProvider>
                  <TooltipRoot>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Payment due date for this order.</p>
                    </TooltipContent>
                  </TooltipRoot>
                </TooltipProvider>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDates.dueDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDates.dueDate ? format(selectedDates.dueDate, "PPP") : "Select due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDates.dueDate}
                    onSelect={(date) =>
                      setSelectedDates((prev) => ({
                        ...prev,
                        dueDate: date,
                      }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="col-span-2 space-y-2 border-t pt-4 mt-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Order Total</label>
                <span className="text-2xl font-bold">${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="content" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          {[
            {
              value: "content",
              icon: FileText,
              label: "Content",
              tooltip: "Manage order lines, products, and item details. Add, edit, or remove items from your order.",
            },
            {
              value: "templates",
              icon: FileText,
              label: "Templates",
              tooltip:
                "Access and manage order templates. Save current order as a template or load existing templates.",
            },
            {
              value: "logistics",
              icon: Truck,
              label: "Logistics",
              tooltip: "Configure shipping details, delivery methods, and warehouse information for this order.",
            },
            {
              value: "accounting",
              icon: Receipt,
              label: "Accounting",
              tooltip: "Manage financial aspects including payment terms, currency, and tax information.",
            },
            {
              value: "attachments",
              icon: Paperclip,
              label: "Attachments",
              tooltip: "Upload and manage documents related to this order such as specifications or supporting files.",
            },
            {
              value: "invoice",
              icon: Receipt,
              label: "Invoice",
              tooltip:
                "Generate and manage invoices for this order. Send invoices to customers and track payment status.",
            },
          ].map(({ value, icon: Icon, label, tooltip }) => (
            <TooltipProvider key={value}>
              <TooltipRoot>
                <TooltipTrigger asChild>
                  <TabsTrigger value={value} className="flex items-center">
                    <Icon className="w-4 h-4 mr-2" />
                    {label}
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tooltip}</p>
                </TooltipContent>
              </TooltipRoot>
            </TooltipProvider>
          ))}
        </TabsList>

        <TabsContent value="content" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Order Lines</CardTitle>
                <div className="flex space-x-2">
                  <TooltipProvider>
                    <TooltipRoot>
                      <TooltipTrigger asChild>
                        <Button onClick={() => setOrderLineDialogOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Add a new product or service to this order. You can select from your product catalog or create
                          a custom item.
                        </p>
                      </TooltipContent>
                    </TooltipRoot>
                  </TooltipProvider>
                  <TooltipProvider>
                    <TooltipRoot>
                      <TooltipTrigger asChild>
                        <Button variant="outline" onClick={handleClearOrderLines}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear Order Lines
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Remove all items from the current order.</p>
                      </TooltipContent>
                    </TooltipRoot>
                  </TooltipProvider>
                  {(() => {
                    const bulkUploadComponent = documentTemplate?.components?.find(
                      (component) => component.raw?.uiType === "BulkUpload",
                    ) || {
                      raw: {
                        uiType: "BulkUpload",
                        config: {
                          show: true,
                        },
                      },
                    }

                    return bulkUploadComponent.raw.config.show ? <BulkUpload onUpload={handleBulkUpload} /> : null
                  })()}
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Input
                    placeholder="Search products in order..."
                    onChange={(e) => handleSearch(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <BatchActions
                  selectedLines={
                    orderLines?.filter((line) => selectedOrderLines.includes(line?.product_id?.toString())) ?? []
                  }
                  onApplyDiscount={handleApplyDiscount}
                  onApplyTax={handleApplyTax}
                />
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={selectedOrderLines?.length === orderLines?.length}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedOrderLines(orderLines.map((line) => line.product_id.toString()))
                              } else {
                                setSelectedOrderLines([])
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Tax Rate</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Recurring</TableHead>
                        <TableHead className="text-right">Actions</TableHead>{" "}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <SortableContext
                        items={orderLines.map((line) => line.product_id.toString())}
                        strategy={verticalListSortingStrategy}
                      >
                        {orderLines?.map((line, index) => (
                          <DraggableOrderLineItem
                            key={line.product_id}
                            line={line}
                            onUpdate={(updatedLine) => handleUpdateOrderLine(updatedLine, index)}
                            onDelete={handleDeleteOrderLine}
                            onToggleRecurring={handleToggleRecurring}
                            currencies={currencies}
                            exchangeRates={exchangeRates}
                          />
                        ))}
                      </SortableContext>
                    </TableBody>
                  </Table>
                </DndContext>
                <div className="mt-4 flex justify-end">
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between gap-8">
                      <span className="text-sm font-medium">Subtotal:</span>
                      <span className="text-sm">
                        ${orderLines.reduce((sum, line) => sum + (line.product_price ?? 0), 0)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="text-sm font-medium">Discounts:</span>
                      <span className="text-sm">
                        -$
                        {orderLines.reduce(
                          (sum, line) => sum + ((line.product_price ?? 0) * (line.discount ?? 0)) / 100,
                          0,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="text-sm font-medium">Tax Total:</span>
                      <span className="text-sm">
                        ${orderLines.reduce((sum, line) => sum + ((line.total ?? 0) - (line.product_price ?? 0)), 0)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-8 pt-2 border-t">
                      <span className="font-semibold">Total:</span>
                      <span className="font-semibold">${calculateTotal()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>{" "}
            </Card>

            <div className="space-y-6">
              {" "}
              <QuickAddFavorites
                favoriteProducts={favoriteProducts}
                productBundles={productBundles}
                onAddToOrder={handleAddFavoriteProducts}
              />
              <ProductRecommendations recommendations={recommendedProducts} onAddToOrder={handleAddExistingProduct} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <div className="grid gap-6">
            <Card>
              <CardContent className="pt-6">
                <OrderTemplates
                  onLoadTemplate={handleCopyFrom}
                  onPreviewTemplate={handlePreviewTemplate}
                  currentOrder={{
                    orderNumber: "SO-" + Math.floor(Math.random() * 10000),
                    orderDate: selectedDates.orderDate,
                    orderLines,
                    subtotal: calculateTotal(),
                    taxTotal: orderLines.reduce(
                      (sum, line) => sum + ((line.total ?? 0) - (line.product_price ?? 0)),
                      0,
                    ),
                    discountTotal: orderLines.reduce(
                      (sum, line) => sum + ((line.product_price ?? 0) * (line.discount ?? 0)) / 100,
                      0,
                    ),
                    shippingCost: shippingMethod
                      ? (shippingMethods.find((m) => m.id === shippingMethod)?.cost ?? 0)
                      : 0,
                    total: calculateTotal(),
                    notes: notes,
                    paymentTerms: paymentTerms,
                    currency: currency,
                    customerId: selectedCustomer?.id,
                    paymentMethod: paymentMethod,
                    isPaid: isPaid,
                  }}
                  templates={templates}
                  setTemplates={setTemplates}
                  isLoading={isLoadingTemplates}
                  onPageChange={handlePageChange}
                  currentPage={currentPage}
                  totalCount={totalTemplateCount}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {console.log(`OrderPreview props:`, {
                  order: {
                    orderNumber: "SO-" + Math.floor(Math.random() * 10000),
                    orderDate: selectedDates.orderDate instanceof Date ? selectedDates.orderDate : new Date(),
                    orderLines,
                    subtotal: calculateTotal(),
                    taxTotal: orderLines.reduce(
                      (sum, line) => sum + ((line.total ?? 0) - (line.product_price ?? 0)),
                      0,
                    ),
                    discountTotal: orderLines.reduce(
                      (sum, line) => sum + ((line.product_price ?? 0) * (line.discount ?? 0)) / 100,
                      0,
                    ),
                    shippingCost: shippingMethod
                      ? (shippingMethods.find((m) => m.id === shippingMethod)?.cost ?? 0)
                      : 0,
                    total: calculateTotal(),
                    notes: notes,
                    paymentTerms: paymentTerms,
                    currency: currency,
                    deliveryDate: selectedDates.deliveryDate instanceof Date ? selectedDates.deliveryDate : undefined,
                    dueDate: selectedDates.dueDate instanceof Date ? selectedDates.dueDate : undefined,
                  },
                  customer: selectedCustomer,
                  config: orderPreviewComponent?.raw.config,
                })}
                <OrderPreview
                  order={{
                    orderNumber: "SO-" + Math.floor(Math.random() * 10000),
                    orderDate: isValid(selectedDates.orderDate) ? selectedDates.orderDate : new Date(),
                    orderLines,
                    subtotal: calculateTotal(),
                    taxTotal: orderLines.reduce(
                      (sum, line) => sum + ((line.total ?? 0) - (line.product_price ?? 0)),
                      0,
                    ),
                    discountTotal: orderLines.reduce(
                      (sum, line) => sum + ((line.product_price ?? 0) * (line.discount ?? 0)) / 100,
                      0,
                    ),
                    shippingCost: shippingMethod
                      ? (shippingMethods.find((m) => m.id === shippingMethod)?.cost ?? 0)
                      : 0,
                    total: calculateTotal(),
                    notes: notes,
                    paymentTerms: paymentTerms,
                    currency: currency,
                    deliveryDate:
                      selectedDates.deliveryDate && isValid(selectedDates.deliveryDate)
                        ? selectedDates.deliveryDate
                        : undefined,
                    dueDate:
                      selectedDates.dueDate && isValid(selectedDates.dueDate) ? selectedDates.dueDate : undefined,
                  }}
                  customer={selectedCustomer}
                  config={orderPreviewComponent?.raw?.config}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logistics" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Shipping Method</label>
                    <Select value={shippingMethod} onValueChange={setShippingMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select shipping method" />
                      </SelectTrigger>
                      <SelectContent>
                        {shippingMethods.map((method) => (
                          <SelectItem key={method.id} value={method.id}>
                            {method.name} (${method.cost.toFixed(2)}) - Est. {method.estimatedDeliveryDays} days
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tracking Number</label>
                    <Input
                      placeholder="Enter tracking number"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Warehouse</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Shipping Notes</label>
                    <Textarea
                      placeholder="Add any special shipping instructions"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounting" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Payment Terms</label>
                    <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment terms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="net30">Net 30</SelectItem>
                        <SelectItem value="net60">Net 60</SelectItem>
                        <SelectItem value="cod">Cash on Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Currency</label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.code} ({c.symbol})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Payment Method</label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.id} value={method.id}>
                            {method.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="paid" checked={isPaid} onCheckedChange={(checked) => setIsPaid(checked as boolean)} />
                    <label
                      htmlFor="paid"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Mark as Paid
                    </label>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tax ID</label>
                    <Input placeholder="Enter tax ID" value={selectedCustomer?.raw?.taxId || ""} disabled />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Reference Number</label>
                    <Input placeholder="Enter reference number" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Internal Notes</label>
                    <Textarea
                      placeholder="Add internal notes (not visible to customers)"
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              {status === "paid" && (
                <div className="mt-6">
                  <TransactionList
                    transactions={[
                      {
                        id: "1",
                        date: "2025-01-26",
                        amount: calculateTotal(),
                        type: "Payment",
                        status: "Completed",
                      },
                    ]}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attachments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
              <CardDescription>Upload and manage documents related to this order</CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedAttachments
                attachments={attachments}
                onAddAttachments={(files) => setAttachments([...attachments, ...files])}
                onRemoveAttachment={handleRemoveAttachment}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoice" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Generation and Sharing</CardTitle>
            </CardHeader>
            <CardContent>
              <InvoiceGenerator
                order={{
                  id: Math.random().toString(),
                  orderNumber: "SO-" + Math.floor(Math.random() * 10000),
                  orderDate: selectedDates.orderDate instanceof Date ? selectedDates.orderDate : new Date(),
                  orderLines,
                  subtotal: calculateTotal(),
                  taxTotal: orderLines.reduce((sum, line) => sum + ((line.total ?? 0) - (line.product_price ?? 0)), 0),
                  discountTotal: orderLines.reduce(
                    (sum, line) => sum + ((line.product_price ?? 0) * (line.discount ?? 0)) / 100,
                    0,
                  ),
                  shippingCost: shippingMethod ? (shippingMethods.find((m) => m.id === shippingMethod)?.cost ?? 0) : 0,
                  total: calculateTotal(),
                  notes: notes,
                  paymentTerms: paymentTerms,
                  currency: currency,
                }}
                customer={selectedCustomer}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <OrderLineDialog
        open={orderLineDialogOpen}
        onOpenChange={setOrderLineDialogOpen}
        orderLine={editingOrderLine}
        onSave={(updatedLine: OrderLine) => {
          if (editingOrderLine) {
            const index = orderLines.findIndex(line => line.product_id === editingOrderLine.product_id)
            if (index !== -1) {
              handleUpdateOrderLine(updatedLine as OrderLine, index)
            }
          } else {
            handleAddOrderLine(updatedLine)
          }
        }}
        products={products}
        onAddExistingProduct={handleAddExistingProduct}
        currencies={currencies}
        exchangeRates={exchangeRates}
      />

      <CopyFromDialog
        open={copyFromDialogOpen}
        onOpenChange={setCopyFromDialogOpen}
        onCopyFrom={handleCopyFrom}
        orders={salesOrders}
        totalCount={totalOrderCount}
        isLoading={isLoadingOrders}
        currentFilters={orderFilters}
        onFiltersChange={handleOrderFiltersChange}
      />

      <CopyToDialog open={copyToDialogOpen} onOpenChange={setCopyToDialogOpen} onCopyTo={handleCopyTo} />

      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <KeyboardShortcutsInfo />
        </DialogContent>
      </Dialog>
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Order Preview</DialogTitle>
          </DialogHeader>
          <CompactOrderPreview
            order={{
              orderNumber: "SO-" + Math.floor(Math.random() * 10000),
              orderDate: selectedDates.orderDate instanceof Date ? selectedDates.orderDate : new Date(),
              order_lines: orderLines,
              subtotal: calculateTotal(),
              taxTotal: orderLines.reduce((sum, line) => sum + ((line.total ?? 0) - (line.product_price ?? 0)), 0),
              discountTotal: orderLines.reduce(
                (sum, line) => sum + ((line.product_price ?? 0) * (line.discount ?? 0)) / 100,
                0,
              ),
              total: calculateTotal(),
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

const initialOrderLines: OrderLine[] = [
  {
    product_id: 4623,
    product_price: 200,
    discount: 0,
    total: 200,
    product_type: "member",
    product_name: "1008 day Pass",
    product_name_en_US: null,
    product_name_zh_HANT: "1008 day Pass",
    product_code: "",
    product_unit: "tday",
    recurring: 0,
    status: "published",
    orq: 12,
    tax_rate: 0,
    qty: 1,
    x_days_before_eligibility_end_date: 1,
    duration: 1,
    membership_start_day: 1,
  },
  {
    product_id: 4624,
    product_price: 150,
    discount: 10,
    total: 135,
    product_type: "retail",
    product_name: "Premium T-Shirt",
    product_name_en_US: "Premium T-Shirt",
    product_name_zh_HANT: "優質T恤",
    product_code: "TS001",
    product_unit: "piece",
    recurring: 0,
    status: "published",
    orq: 13,
    tax_rate: 5,
    qty: 1,
    x_days_before_eligibility_end_date: 0,
    duration: 0,
    membership_start_day: 0,
  },
]

