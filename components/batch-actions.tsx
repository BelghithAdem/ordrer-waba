import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { OrderLine } from '@/types/sales-order'

interface BatchActionsProps {
  selectedLines: OrderLine[]
  onApplyDiscount: (discount: number) => void
  onApplyTax: (tax: number) => void
}

export function BatchActions({ selectedLines, onApplyDiscount, onApplyTax }: BatchActionsProps) {
  const [discount, setDiscount] = useState('')
  const [tax, setTax] = useState('')

  const handleApplyDiscount = () => {
    const discountValue = parseFloat(discount)
    if (!isNaN(discountValue) && discountValue >= 0 && discountValue <= 100) {
      onApplyDiscount(discountValue)
      setDiscount('')
    }
  }

  const handleApplyTax = () => {
    const taxValue = parseFloat(tax)
    if (!isNaN(taxValue) && taxValue >= 0) {
      onApplyTax(taxValue)
      setTax('')
    }
  }

  return (
    <div className="flex space-x-2 mb-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" disabled={selectedLines.length === 0}>
            Apply Discount
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Discount</h4>
              <p className="text-sm text-muted-foreground">
                Set the discount percentage for {selectedLines.length} selected items.
              </p>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="discount">Discount %</Label>
                <Input
                  id="discount"
                  type="number"
                  className="col-span-2 h-8"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  min="0"
                  max="100"
                />
              </div>
              <Button onClick={handleApplyDiscount}>Apply Discount</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" disabled={selectedLines.length === 0}>
            Apply Tax
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Tax</h4>
              <p className="text-sm text-muted-foreground">
                Set the tax rate for {selectedLines.length} selected items.
              </p>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="tax">Tax %</Label>
                <Input
                  id="tax"
                  type="number"
                  className="col-span-2 h-8"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  min="0"
                />
              </div>
              <Button onClick={handleApplyTax}>Apply Tax</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

