import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"

interface CopyToDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCopyTo: (targetType: string) => void
}

export function CopyToDialog({ open, onOpenChange, onCopyTo }: CopyToDialogProps) {
  const targetTypes = [
    { id: 'duplicate', name: 'Duplicate Sales Order', description: 'Create an exact copy of this order' },
    { id: 'quotation', name: 'Quotation', description: 'Generate a quotation based on this order' },
    { id: 'invoice', name: 'Invoice', description: 'Create an invoice from this order' },
    { id: 'purchaseOrder', name: 'Purchase Order', description: 'Generate a purchase order for the items in this sales order' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Copy To New Document</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="grid gap-4 py-4">
            {targetTypes.map((type) => (
              <Card key={type.id} className="p-4 cursor-pointer hover:bg-muted" onClick={() => onCopyTo(type.id)}>
                <h3 className="font-semibold mb-2">{type.name}</h3>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </Card>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

