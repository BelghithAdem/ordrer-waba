"use client"

import { ChevronsUpDown, Star, HelpCircle } from "lucide-react"
import { useState, useMemo } from "react"
import debounce from "lodash/debounce"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Customer } from "@/types/sales-order"
import { Badge } from "@/components/ui/badge"
import { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import cn from "classnames"

interface CustomerSearchProps {
  onSelect: (customer: Customer) => void
  selectedCustomer?: Customer
  error?: boolean
  customers: Customer[]
  isLoading?: boolean
}

export function CustomerSearch({ onSelect, selectedCustomer, error, customers, isLoading }: CustomerSearchProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Memoize filtered customers
  const filteredCustomers = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(query) ||
      customer.raw?.email?.toLowerCase().includes(query) ||
      customer.id.toString().includes(query)
    )
  }, [customers, searchQuery])

  // Debounced search handler
  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        setSearchQuery(query)
      }, 300),
    []
  )

  if (isLoading) {
    return <div>Loading customers...</div>
  }

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", error && "border-red-500 ring-red-500")}
          >
            {selectedCustomer ? (
              <div className="flex items-center gap-2">
                <span>{selectedCustomer.name}</span>
                {selectedCustomer.raw?.insights?.isPreferredCustomer && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Preferred
                  </Badge>
                )}
              </div>
            ) : (
              "Select customer..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput 
              placeholder="Search customers..." 
              onValueChange={(value) => {
                debouncedSearch(value)
              }}
            />
            <CommandEmpty>No customers found.</CommandEmpty>
            <CommandGroup>
              {filteredCustomers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  onSelect={() => {
                    onSelect(customer)
                    setOpen(false)
                  }}
                  className="flex flex-col items-start py-3"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{customer.name}</span>
                    {customer.raw?.insights?.isPreferredCustomer && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        Preferred
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{customer.raw?.email}</span>
                    <span>{customer.raw?.insights?.totalOrders ?? 0} orders</span>
                    <span>${(customer.raw?.insights?.averageOrderValue ?? 0).toLocaleString()} avg</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      <TooltipProvider>
        <TooltipRoot>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="absolute right-12 top-0">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Search and select a customer from your existing customer database. You can search by name, email, or
              customer ID.
            </p>
          </TooltipContent>
        </TooltipRoot>
      </TooltipProvider>
    </div>
  )
}

