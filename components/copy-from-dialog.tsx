"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CompactOrderPreview } from "@/components/compact-order-preview"
import { CustomPagination } from "@/components/ui/custom-pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { CalendarIcon, Loader2, X, Check } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { SalesOrder } from "@/types/sales-order"
import { fetchOrders } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

const orderTypes = [
  { value: "all", label: "All Types" },
  { value: "template", label: "Template" },
  { value: "sales", label: "Sales" },
  { value: "invoice", label: "Invoice" },
  { value: "delivery", label: "Delivery" },
  { value: "purchase", label: "Purchase" },
  { value: "stock", label: "Stock" },
]

const orderStatuses = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
]

interface CopyFromDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCopyFrom: (sourceOrder: SalesOrder) => void
  orders: SalesOrder[]
  totalCount: number
  isLoading: boolean
  currentFilters: {
    page: number
    limit: number
    status: string
    type: string
    dateFrom: Date | undefined
  }
  onFiltersChange: (filters: {
    page: number
    limit: number
    status: string
    type: string
    dateFrom: Date | undefined
  }) => void
}

export function CopyFromDialog({
  open,
  onOpenChange,
  onCopyFrom,
  orders,
  totalCount,
  isLoading,
  currentFilters,
  onFiltersChange
}: CopyFromDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null)
  const [previewOrder, setPreviewOrder] = useState<SalesOrder | null>(null)
  const [statusOpen, setStatusOpen] = useState(false)
  const [statusSearch, setStatusSearch] = useState("")
  const { toast } = useToast()

  const handlePageChange = (page: number) => {
    onFiltersChange({ ...currentFilters, page })
    setSelectedOrder(null)
    setPreviewOrder(null)
  }

  const handleResetFilters = () => {
    onFiltersChange({
      ...currentFilters,
      page: 1,
      status: "all",
      type: "all",
      dateFrom: undefined,
    })
    setStatusSearch("")
  }

  // Memoize filtered orders for better performance
  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders

    const searchLower = searchTerm.toLowerCase()
    return orders.filter((order) => {
      try {
        return (
          order.orderNumber.toLowerCase().includes(searchLower) ||
          order.customerId.toString().toLowerCase().includes(searchLower) ||
          order.status.toLowerCase().includes(searchLower) ||
          (order.total && order.total.toString().includes(searchLower))
        )
      } catch (error) {
        console.error("Error filtering order:", error)
        return false
      }
    })
  }, [orders, searchTerm])

  const handleRowClick = (order: SalesOrder) => {
    setSelectedOrder(order)
    setPreviewOrder(order)
  }

  const handleRowHover = (order: SalesOrder | null) => {
    if (!selectedOrder) {
      setPreviewOrder(order)
    }
  }

  const filteredStatuses = useMemo(() => 
    orderStatuses.filter((status) =>
      status.label.toLowerCase().includes(statusSearch.toLowerCase())
    ),
    [statusSearch]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle>Copy From Previous Order</DialogTitle>
          <Button onClick={() => selectedOrder && onCopyFrom(selectedOrder)} disabled={!selectedOrder}>
            Copy Selected Order
          </Button>
        </DialogHeader>
        <div className="space-y-4">
          {/* Basic Search */}
          <div className="flex items-center gap-4">
            <Label htmlFor="search" className="w-20">
              Search
            </Label>
            <Input
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by order number or customer"
              className="flex-1"
            />
            <Button variant="outline" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          </div>

          {/* Advanced Search */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Order Status</Label>
              <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={statusOpen}
                    className="w-full justify-between"
                  >
                    {currentFilters.status
                      ? orderStatuses.find((status) => status.value === currentFilters.status)?.label
                      : "Select status..."}
                    <X
                      className={cn("ml-2 h-4 w-4 shrink-0 opacity-50", currentFilters.status && "hover:opacity-100")}
                      onClick={(e) => {
                        e.stopPropagation()
                        onFiltersChange({ ...currentFilters, status: "" })
                        setStatusSearch("")
                      }}
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search status..." value={statusSearch} onValueChange={setStatusSearch} />
                    <CommandList>
                      <CommandEmpty>No status found.</CommandEmpty>
                      <CommandGroup>
                        {filteredStatuses.map((status) => (
                          <CommandItem
                            key={status.value}
                            value={status.value}
                            onSelect={(value) => {
                              onFiltersChange({ ...currentFilters, status: value })
                              setStatusOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                currentFilters.status === status.value ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {status.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Order Type</Label>
              <Select value={currentFilters.type} onValueChange={(value) => onFiltersChange({ ...currentFilters, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {orderTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !currentFilters.dateFrom && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {currentFilters.dateFrom ? format(currentFilters.dateFrom, "PPP") : "Select date"}
                    {currentFilters.dateFrom && (
                      <X
                        className="ml-auto h-4 w-4 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          onFiltersChange({ ...currentFilters, dateFrom: undefined })
                        }}
                      />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={currentFilters.dateFrom}
                    onSelect={(date) => onFiltersChange({ ...currentFilters, dateFrom: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {isLoading ? (
            <div className="flex h-[400px] items-center justify-center">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-sm text-muted-foreground">Loading orders...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              <div className="border rounded-lg">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead className="w-[120px]">Order Number</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="w-[100px]">Date</TableHead>
                        <TableHead className="text-right w-[100px]">Total</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                            No orders found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOrders.map((order) => (
                          <TableRow
                            key={order.id}
                            className={`${
                              selectedOrder?.id === order.id ? "bg-muted" : ""
                            } cursor-pointer hover:bg-muted/50`}
                            onClick={() => handleRowClick(order)}
                            onMouseEnter={() => handleRowHover(order)}
                            onMouseLeave={() => !selectedOrder && handleRowHover(null)}
                          >
                            <TableCell className="font-medium">{order.orderNumber}</TableCell>
                            <TableCell>{order.customerId}</TableCell>
                            <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">${order.total.toFixed(2)}</TableCell>
                            <TableCell>
                              <div
                                className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                  order.status === "paid"
                                    ? "bg-green-100 text-green-700"
                                    : order.status === "pending"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {order.status}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
                <div className="border-t p-2 flex justify-center">
                  <CustomPagination
                    currentPage={currentFilters.page}
                    totalPages={Math.ceil(totalCount / currentFilters.limit)}
                    onPageChange={handlePageChange}
                  />
                </div>
              </div>
              <div className="border rounded-lg p-4">
                {previewOrder ? (
                  <CompactOrderPreview order={previewOrder} />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    Select an order to preview
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

