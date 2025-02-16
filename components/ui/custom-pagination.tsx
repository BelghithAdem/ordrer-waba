"use client"

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface CustomPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  maxPages?: number
  showFirstLast?: boolean
}

export function CustomPagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  maxPages = 5,
  showFirstLast = false 
}: CustomPaginationProps) {
  const getVisiblePages = () => {
    if (totalPages <= maxPages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    let start = Math.max(1, currentPage - Math.floor(maxPages / 2))
    let end = Math.min(totalPages, start + maxPages - 1)

    if (end - start + 1 < maxPages) {
      start = Math.max(1, end - maxPages + 1)
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const visiblePages = getVisiblePages()

  return (
    <Pagination>
      <PaginationContent>
        {showFirstLast && currentPage > 1 && (
          <PaginationItem>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault()
                onPageChange(1)
              }}
            >
              First
            </PaginationLink>
          </PaginationItem>
        )}
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (currentPage > 1) onPageChange(currentPage - 1)
            }}
          />
        </PaginationItem>
        {visiblePages[0] > 1 && (
          <>
            <PaginationItem>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  onPageChange(1)
                }}
              >
                1
              </PaginationLink>
            </PaginationItem>
            {visiblePages[0] > 2 && (
              <PaginationItem>
                <span className="px-4">...</span>
              </PaginationItem>
            )}
          </>
        )}
        {visiblePages.map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault()
                onPageChange(page)
              }}
              isActive={currentPage === page}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}
        {visiblePages[visiblePages.length - 1] < totalPages && (
          <>
            {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
              <PaginationItem>
                <span className="px-4">...</span>
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  onPageChange(totalPages)
                }}
              >
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          </>
        )}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (currentPage < totalPages) onPageChange(currentPage + 1)
            }}
            className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
        {showFirstLast && currentPage < totalPages && (
          <PaginationItem>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault()
                onPageChange(totalPages)
              }}
            >
              Last
            </PaginationLink>
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  )
}

