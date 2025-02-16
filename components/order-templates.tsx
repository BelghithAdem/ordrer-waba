"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SalesOrder, Template, OrderLine } from "@/types/sales-order"
import { SaveAll, FileText, Calendar, MoreVertical, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"
import { CustomPagination } from "@/components/ui/custom-pagination"

export function OrderTemplates({
  onLoadTemplate,
  onPreviewTemplate,
  currentOrder,
  templates,
  setTemplates,
  isLoading,
  onPageChange,
  currentPage,
  totalCount,
}: OrderTemplatesProps) {
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")

  console.log("OrderTemplates rendering, templates:", templates ? JSON.stringify(templates) : "undefined")

  const handleSaveTemplate = () => {
    const newTemplate: Template = {
      id: Math.random().toString(),
      name: templateName,
      description: templateDescription,
      createdAt: new Date(),
      tags: [],
      orderNumber: `TEMPLATE-${Math.floor(Math.random() * 1000)}`,
      customerId: currentOrder.customerId?.toString() || "",
      status: "draft",
      orderDate: new Date(),
      deliveryDate: currentOrder.deliveryDate,
      dueDate: currentOrder.dueDate,
      paymentTerms: currentOrder.paymentTerms || "",
      currency: currentOrder.currency || "USD",
      subtotal: currentOrder.subtotal || 0,
      taxTotal: currentOrder.taxTotal || 0,
      discountTotal: currentOrder.discountTotal || 0,
      shippingCost: currentOrder.shippingCost || 0,
      total: currentOrder.total || 0,
      orderLines: currentOrder.orderLines || [],
      shippingMethod: currentOrder.shippingMethod,
      trackingNumber: currentOrder.trackingNumber,
      paymentMethod: currentOrder.paymentMethod || "",
      isPaid: currentOrder.isPaid || false,
    }
    setTemplates([...templates, newTemplate])
    setSaveTemplateOpen(false)
    setTemplateName("")
    setTemplateDescription("")
  }

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter((t) => t.id !== templateId))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Order Templates</h2>
        <Button onClick={() => setSaveTemplateOpen(true)}>
          <SaveAll className="h-4 w-4 mr-2" />
          Save as Template
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-4">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-4">No templates found.</div>
      ) : (
        <div className="grid gap-4">
          {templates?.map((template, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{template.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                    {template.tags && (
                      <div className="flex gap-2 mt-2">
                        {template.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onLoadTemplate(template)}>Load Template</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onPreviewTemplate(template)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteTemplate(template.id)}>
                        Delete Template
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {format(template.createdAt, "yyyy-MM-dd")}
                  </div>
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    {template.orderLines.length} items
                  </div>
                  <div>Total: ${template.total.toFixed(2)}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={saveTemplateOpen} onOpenChange={setSaveTemplateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Enter template name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Enter template description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveTemplateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={!templateName}>
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {!isLoading && totalCount > templates.length && (
        <CustomPagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalCount / 5)}
          onPageChange={onPageChange}
        />
      )}
    </div>
  )
}

interface OrderTemplatesProps {
  onLoadTemplate: (template: Template) => void
  onPreviewTemplate: (template: Template) => void
  currentOrder: Partial<SalesOrder>
  templates: Template[]
  setTemplates: (templates: Template[]) => void
  isLoading: boolean
  onPageChange: (page: number) => void
  currentPage: number
  totalCount: number
}

