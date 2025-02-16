"use client"

import { useState } from "react"
import type { Customer } from "@/types/sales-order"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CustomerSearch } from "@/components/customer-search"
import { CustomerInsights } from "@/components/customer-insights"
import { Checkbox } from "@/components/ui/checkbox"
import { HelpCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"
import { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

interface CustomerManagementProps {
  customers: Customer[]
  selectedCustomer: Customer | undefined
  onSelectCustomer: (customer: Customer) => void
  onCreateCustomer: (customer: Customer) => void
  error?: boolean
  isLoading?: boolean
}

export function CustomerManagement({
  customers,
  selectedCustomer,
  onSelectCustomer,
  onCreateCustomer,
  error,
  isLoading
}: CustomerManagementProps) {
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({ 
    raw: { 
      email: "",
      phone: "",
      billingAddress: { street: "", city: "", state: "", country: "", postalCode: "" },
      shippingAddress: { street: "", city: "", state: "", country: "", postalCode: "" },
      taxId: "",
      paymentTerms: "",
      isGuest: false,
      creditLimit: 0
    } 
  })
  const [isNewCustomerDialogOpen, setIsNewCustomerDialogOpen] = useState(false)
  const [convertGuestDialogOpen, setConvertGuestDialogOpen] = useState(false)
  const [applyPreferences, setApplyPreferences] = useState(true)

  const handleCreateCustomer = () => {
    if (newCustomer.name && newCustomer.raw?.email) {
      onCreateCustomer({
        ...newCustomer,
        id: Math.floor(Math.random() * 1000),
        status: "active",
        sort: null,
        user_created: "system",
        date_created: new Date().toISOString(),
        user_updated: null,
        date_updated: null,
        name_zh_HANT: null,
        id_other_1: `CUST${Math.floor(Math.random() * 10000)}`,
        orq: 63,
        code: `CUST${Math.floor(Math.random() * 10000)}`,
        group: "New",
        raw: {
          ...newCustomer.raw,
          billingAddress: { street: "", city: "", state: "", country: "", postalCode: "" },
          shippingAddress: { street: "", city: "", state: "", country: "", postalCode: "" },
        },
      } as Customer)
      setIsNewCustomerDialogOpen(false)
      setNewCustomer({} as Partial<Customer>)
    }
  }

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer)
    if (customer.preferences && applyPreferences) {
      console.log("Applying customer preferences:", customer.preferences)
    }
  }

  const handleGuestCheckout = () => {
    const guestCustomer: Customer = {
      id: Math.floor(Math.random() * 1000),
      status: "active",
      sort: null,
      user_created: "system",
      date_created: new Date().toISOString(),
      user_updated: null,
      date_updated: null,
      name: "Guest Customer",
      name_zh_HANT: null,
      id_other_1: `GUEST${Math.floor(Math.random() * 10000)}`,
      orq: 63,
      code: `GUEST${Math.floor(Math.random() * 10000)}`,
      group: "Guest",
      raw: {
        email: "",
        phone: "",
        billingAddress: { street: "", city: "", state: "", country: "", postalCode: "" },
        shippingAddress: { street: "", city: "", state: "", country: "", postalCode: "" },
        isGuest: true,
      },
    }
    onSelectCustomer(guestCustomer)
  }

  const handleConvertGuest = () => {
    if (selectedCustomer?.raw?.isGuest && newCustomer.name && newCustomer.raw?.email) {
      const convertedCustomer: Customer = {
        ...selectedCustomer,
        ...newCustomer,
        id: Math.floor(Math.random() * 1000),
        raw: {
          ...selectedCustomer.raw,
          ...newCustomer.raw,
          isGuest: false,
        },
      }
      onCreateCustomer(convertedCustomer)
      setConvertGuestDialogOpen(false)
      setNewCustomer({} as Partial<Customer>)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <CustomerSearch
            customers={customers}
            selectedCustomer={selectedCustomer}
            onSelect={handleSelectCustomer}
            error={error}
            isLoading={isLoading}
          />
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isNewCustomerDialogOpen} onOpenChange={setIsNewCustomerDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Create New Customer</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>Create New Customer</DialogTitle>
                  <TooltipProvider>
                    <TooltipRoot>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <HelpCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Create a new customer profile with basic information. Additional details can be added later.
                        </p>
                      </TooltipContent>
                    </TooltipRoot>
                  </TooltipProvider>
                </div>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newCustomer.name || ""}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={newCustomer.raw?.email || ""}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, raw: { ...newCustomer.raw, email: e.target.value } })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={newCustomer.raw?.phone || ""}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, raw: { ...newCustomer.raw, phone: e.target.value } })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="taxId" className="text-right">
                    Tax ID
                  </Label>
                  <Input
                    id="taxId"
                    value={newCustomer.raw?.taxId || ""}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, raw: { ...newCustomer.raw, taxId: e.target.value } })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="paymentTerms" className="text-right">
                    Payment Terms
                  </Label>
                  <Select
                    value={newCustomer.paymentTerms}
                    onValueChange={(value) => setNewCustomer({ ...newCustomer, paymentTerms: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select payment terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="net30">Net 30</SelectItem>
                      <SelectItem value="net60">Net 60</SelectItem>
                      <SelectItem value="cod">Cash on Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateCustomer}>Create Customer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <TooltipProvider>
            <TooltipRoot>
              <TooltipTrigger asChild>
                <Button variant="secondary" onClick={handleGuestCheckout}>
                  Guest Checkout
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Proceed with checkout without creating a customer account. Guest orders can be converted to customer
                  accounts later.
                </p>
              </TooltipContent>
            </TooltipRoot>
          </TooltipProvider>
        </div>
      </div>

      {selectedCustomer?.raw?.isGuest && (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Currently in guest checkout mode.</span>
            <TooltipProvider>
              <TooltipRoot>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => setConvertGuestDialogOpen(true)}>
                    Convert to Customer
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Convert this guest checkout to a full customer account to enable features like order history and
                    saved preferences.
                  </p>
                </TooltipContent>
              </TooltipRoot>
            </TooltipProvider>
          </AlertDescription>
        </Alert>
      )}

      {selectedCustomer && !selectedCustomer.raw?.isGuest && (
        <>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="preferences"
              checked={applyPreferences}
              onCheckedChange={(checked) => setApplyPreferences(checked as boolean)}
            />
            <label htmlFor="preferences" className="text-sm text-muted-foreground">
              Apply customer preferences automatically
            </label>
            <TooltipProvider>
              <TooltipRoot>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Automatically apply saved customer preferences like shipping address, payment terms, and default
                    shipping method.
                  </p>
                </TooltipContent>
              </TooltipRoot>
            </TooltipProvider>
          </div>
          <CustomerInsights customer={selectedCustomer} />
        </>
      )}

      <Dialog open={convertGuestDialogOpen} onOpenChange={setConvertGuestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Convert Guest to Customer</DialogTitle>
              <TooltipProvider>
                <TooltipRoot>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Convert this guest order into a full customer account. This will preserve all order details and
                      enable customer features.
                    </p>
                  </TooltipContent>
                </TooltipRoot>
              </TooltipProvider>
            </div>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="convert-name" className="text-right">
                Name
              </Label>
              <Input
                id="convert-name"
                value={newCustomer.name || ""}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="convert-email" className="text-right">
                Email
              </Label>
              <Input
                id="convert-email"
                value={newCustomer.email || ""}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleConvertGuest}>Convert to Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

