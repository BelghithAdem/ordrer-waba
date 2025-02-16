"use client"

import { useState, useEffect } from "react"
import type { OrderLine } from "@/types/sales-order"
import { TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash2, GripVertical, Edit } from "lucide-react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { OrderLineDialog } from "./order-line-dialog"

interface DraggableOrderLineItemProps {
  line: OrderLine
  onUpdate: (updatedLine: OrderLine) => void
  onDelete: (id: string) => void
  currencies: { code: string; symbol: string }[]
  exchangeRates: { [key: string]: number }
}

export function DraggableOrderLineItem({
  line,
  onUpdate,
  onDelete,
  currencies,
  exchangeRates,
}: DraggableOrderLineItemProps) {
  const [isEditing, setIsEditing] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: line.product_id.toString(),
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <>
      <TableRow ref={setNodeRef} style={style} {...attributes}>
        <TableCell>
          <Button variant="ghost" className="cursor-move" {...listeners}>
            <GripVertical className="h-4 w-4" />
          </Button>
        </TableCell>
        <TableCell>
          <div
            className="cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
            onClick={() => setIsEditing(true)}
          >
            <div className="font-medium">{line.product_name || "N/A"}</div>
            <div className="text-sm text-muted-foreground">{line.product_code || "N/A"}</div>
          </div>
        </TableCell>
        <TableCell>{line.qty || 0}</TableCell>
        <TableCell>
          {line.currency || "$"}
          {(line.product_price || 0).toFixed(2)}
        </TableCell>
        <TableCell>{line.tax_rate || 0}%</TableCell>
        <TableCell>{line.discount || 0}%</TableCell>
        <TableCell>
          {line.currency || "$"}
          {(line.total || 0).toFixed(2)}
        </TableCell>
        <TableCell>{line.recurring === 1 ? "Yes" : "No"}</TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(line.product_id.toString())}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
      <OrderLineDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        orderLine={line}
        onSave={(updatedLine) => {
          onUpdate(updatedLine as OrderLine)
          setIsEditing(false)
        }}
        onAddExistingProduct={() => {}}
        currencies={currencies}
        exchangeRates={exchangeRates}
      />
    </>
  )
}

