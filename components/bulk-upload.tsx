"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Upload } from "lucide-react"

interface BulkUploadProps {
  onUpload: (file: File) => void
}

export function BulkUpload({ onUpload }: BulkUploadProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = () => {
    if (file) {
      onUpload(file)
      setOpen(false)
      setFile(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <TooltipProvider>
          <TooltipRoot>
            <TooltipTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Bulk Upload
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Upload multiple items at once using a CSV or Excel file. Perfect for large orders with many line items.
              </p>
            </TooltipContent>
          </TooltipRoot>
        </TooltipProvider>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload Products</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file containing multiple products to add to your order.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="bulk-upload">Upload CSV/Excel File</Label>
            <Input id="bulk-upload" type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setOpen(false)} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file}>
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

