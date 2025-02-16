"use client"

import { useState, useMemo } from "react"
import type { SalesOrder, OrderLine } from "@/types/sales-order"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"

interface CompactOrderPreviewProps {
  order: Partial<SalesOrder>
}

export function CompactOrderPreview({ order }: CompactOrderPreviewProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    if (value.trim()) {
      const results = (order.order_lines || order.orderLines || []).filter(
        (line: OrderLine) =>
          line.product_name.toLowerCase().includes(value.toLowerCase()) ||
          line.product_code.toLowerCase().includes(value.toLowerCase()),
      )
      toast({
        description: `Found ${results?.length || 0} matching items`,
      })
    }
  }

  const filteredOrderLines = useMemo(() => {
    if (!searchTerm.trim()) return order.order_lines || order.orderLines || []

    return (order.order_lines || order.orderLines || []).filter(
      (line: OrderLine) =>
        line.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        line.product_code.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [order.order_lines, order.orderLines, searchTerm])

  const calculateFilteredTotal = () => {
    return filteredOrderLines.reduce((sum, line: OrderLine) => sum + (line.total ?? 0), 0)
  }

  const calculateFilteredSubtotal = () => {
    return filteredOrderLines.reduce((sum, line: OrderLine) => sum + line.product_price * line.qty, 0)
  }

  const calculateFilteredDiscount = () => {
    return filteredOrderLines.reduce(
      (sum, line: OrderLine) => sum + (line.product_price * line.qty * line.discount) / 100,
      0,
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 pb-4 border-b">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Order Number</div>
            <div className="font-medium">{order.orderNumber}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Date</div>
            <div className="font-medium">{new Date(order.orderDate).toLocaleDateString()}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Status</div>
            <div className={cn(
              "inline-flex px-2 py-1 rounded-full text-xs font-medium",
              {
                "bg-green-100 text-green-700": order.status === "paid",
                "bg-yellow-100 text-yellow-700": order.status === "pending",
                "bg-gray-100 text-gray-700": order.status !== "paid" && order.status !== "pending"
              }
            )}>
              {order.status}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="font-medium">${order.total?.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <ScrollArea className="h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead className="text-right">Line Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrderLines.map((line: OrderLine) => (
              <TableRow key={line.product_id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{line.product_name}</div>
                    <div className="text-sm text-muted-foreground">{line.product_code}</div>
                  </div>
                </TableCell>
                <TableCell>{line.qty}</TableCell>
                <TableCell>${line.product_price.toFixed(2)}</TableCell>
                <TableCell>
                  {line.discount > 0 ? <span className="text-red-500">-{line.discount}%</span> : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="space-y-1">
                    {line.discount > 0 && (
                      <div className="text-sm text-muted-foreground line-through">
                        ${(line.qty * line.product_price).toFixed(2)}
                      </div>
                    )}
                    <div>${line.total.toFixed(2)}</div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>

      <div className="space-y-2 pt-4 border-t">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>${calculateFilteredSubtotal().toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-red-500">
          <span>Total Discount</span>
          <span>-${calculateFilteredDiscount().toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-base font-semibold">
          <span>Total</span>
          <span>${calculateFilteredTotal().toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}

