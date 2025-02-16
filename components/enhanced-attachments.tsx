'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Image, Paperclip, X, Eye, Download, UploadCloud } from 'lucide-react'
import { cn } from "@/lib/utils"

interface Attachment {
  id: string
  name: string
  type: string
  size: number
  uploadDate: Date
  url: string
}

interface EnhancedAttachmentsProps {
  attachments: File[]
  onAddAttachments: (files: File[]) => void
  onRemoveAttachment: (index: number) => void
}

export function EnhancedAttachments({
  attachments,
  onAddAttachments,
  onRemoveAttachment,
}: EnhancedAttachmentsProps) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onAddAttachments(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onAddAttachments(Array.from(e.target.files))
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      
       
        <CardContent>
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center space-y-4",
              dragActive && "border-primary bg-primary/5",
              "transition-colors duration-200"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <UploadCloud className="h-8 w-8 mx-auto text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Drag and drop your files here</p>
              <p className="text-sm text-muted-foreground">or click to browse</p>
            </div>
            <Input
              id="file-upload"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <Button asChild variant="outline">
              <label htmlFor="file-upload" className="cursor-pointer">
                Choose Files
              </label>
            </Button>
          </div>

          {attachments.length > 0 && (
            <ScrollArea className="h-[300px] border rounded-lg mt-6">
              <div className="p-4 space-y-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 hover:bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(file.type)}
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {file.type.startsWith('image/') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPreviewUrl(URL.createObjectURL(file))
                            setPreviewOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveAttachment(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
     

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          <div className="aspect-video relative rounded-lg overflow-hidden">
            <img
              src={previewUrl}
              alt="Preview"
              className="absolute inset-0 w-full h-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

