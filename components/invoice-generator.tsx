'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { SalesOrder, Customer } from "@/types/sales-order"
import { Mail, Link, Copy, Check, Eye, Download, FileText, FileSpreadsheet, FileJson } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"
import { InvoicePreview } from "./invoice-preview"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

interface InvoiceGeneratorProps {
  order: Partial<SalesOrder>
  customer?: Customer
}

export function InvoiceGenerator({ order, customer }: InvoiceGeneratorProps) {
  const [sendInvoiceOpen, setSendInvoiceOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [emailTo, setEmailTo] = useState(customer?.email ?? '')
  const [emailSubject, setEmailSubject] = useState(`Invoice for Order ${order.orderNumber ?? 'N/A'}`)
  const [emailBody, setEmailBody] = useState(`Dear ${customer?.name ?? 'Valued Customer'},

Please find attached the invoice for your recent order ${order.orderNumber ?? 'N/A'}. Thank you for your business.

Best regards,
[Your Company Name]`)
  const [shareLink, setShareLink] = useState('')
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleSendInvoice = () => {
    // In a real application, this would send the email with the invoice
    console.log('Sending invoice to:', emailTo)
    console.log('Subject:', emailSubject)
    console.log('Body:', emailBody)
    toast({
      title: "Invoice Sent",
      description: `The invoice has been sent to ${emailTo}`,
    })
    setSendInvoiceOpen(false)
  }

  const handleGenerateShareLink = () => {
    // In a real application, this would generate a unique, secure link to the invoice
    const link = `https://yourdomain.com/invoices/${order.id ?? 'draft'}`
    setShareLink(link)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = (format: 'pdf' | 'excel' | 'csv') => {
    // In a real application, this would generate and download the file
    // For demonstration, we'll show a toast notification
    toast({
      title: "Download Started",
      description: `Downloading invoice as ${format.toUpperCase()}`,
    })
    
    // Simulate download delay
    setTimeout(() => {
      toast({
        title: "Download Complete",
        description: `Invoice has been downloaded as ${format.toUpperCase()}`,
      })
    }, 1500)
  }

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Button onClick={() => setSendInvoiceOpen(true)}>
          <Mail className="mr-2 h-4 w-4" />
          Send Invoice
        </Button>
        <Button variant="outline" onClick={handleGenerateShareLink}>
          <Link className="mr-2 h-4 w-4" />
          Generate Share Link
        </Button>
        <Button variant="outline" onClick={() => setPreviewOpen(true)}>
          <Eye className="mr-2 h-4 w-4" />
          Preview Invoice
        </Button>
        <TooltipProvider>
          <TooltipRoot>
            <TooltipTrigger asChild>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Choose Format</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleDownload('pdf')}>
                    <FileText className="mr-2 h-4 w-4" />
                    PDF Document
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload('excel')}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Excel Spreadsheet
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload('csv')}>
                    <FileJson className="mr-2 h-4 w-4" />
                    CSV File
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download the invoice in different formats for your records or processing</p>
            </TooltipContent>
          </TooltipRoot>
        </TooltipProvider>
      </div>

      {shareLink && (
        <div className="flex items-center space-x-2">
          <Input value={shareLink} readOnly />
          <Button size="sm" onClick={handleCopyLink}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      )}

      <Dialog open={sendInvoiceOpen} onOpenChange={setSendInvoiceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Invoice</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="emailTo">Send To</Label>
              <Input
                id="emailTo"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="customer@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="emailSubject">Subject</Label>
              <Input
                id="emailSubject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="emailBody">Message</Label>
              <Textarea
                id="emailBody"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendInvoiceOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendInvoice}>Send Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[80vh]">
            <InvoicePreview order={order} customer={customer} />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}

