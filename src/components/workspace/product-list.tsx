"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/video-utils";
import { Product } from "@prisma/client";
import {
    Edit,
    ExternalLink,
    Eye,
    MoreHorizontal,
    Plus,
    Search,
    Trash2
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ProductWithRelations extends Product {
  posts: Array<{
    id: string;
    post: {
      id: string;
      title: string;
      slug: string;
      thumbnail?: string;
      isPublished: boolean;
      createdAt: Date;
    };
  }>;
  _count: {
    posts: number;
  };
}

interface ProductListProps {
  products: ProductWithRelations[];
  isLoading: boolean;
  onEdit: (product: ProductWithRelations) => void;
  onDelete: (productId: string) => Promise<void>;
  onView: (product: ProductWithRelations) => void;
  onCreate: () => void;
  // Search and filter props
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedPlatform: string;
  onPlatformChange: (platform: string) => void;
}

const PLATFORM_LABELS: Record<string, string> = {
  shopee: "Shopee",
  lazada: "Lazada", 
  tiki: "Tiki",
  amazon: "Amazon",
  sendo: "Sendo",
  fptshop: "FPT Shop",
  thegioididong: "Thế Giới Di Động",
  cellphones: "CellphoneS",
  other: "Other",
};

const PLATFORM_COLORS: Record<string, string> = {
  shopee: "bg-orange-100 text-orange-800",
  lazada: "bg-blue-100 text-blue-800",
  tiki: "bg-purple-100 text-purple-800",
  amazon: "bg-yellow-100 text-yellow-800",
  sendo: "bg-red-100 text-red-800",
  fptshop: "bg-green-100 text-green-800",
  thegioididong: "bg-indigo-100 text-indigo-800",
  cellphones: "bg-pink-100 text-pink-800",
  other: "bg-gray-100 text-gray-800",
};

export function ProductList({
  products,
  isLoading,
  onEdit,
  onDelete,
  onView,
  onCreate,
  searchQuery,
  onSearchChange,
  selectedPlatform,
  onPlatformChange,
}: ProductListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) {
      return;
    }

    setDeletingId(productId);
    try {
      await onDelete(productId);
      toast.success("Product deleted successfully");
    } catch (error) {
      toast.error("Failed to delete product", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const openAffiliateLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Products</h2>
          <p className="text-gray-600">
            Manage your affiliate products and links
          </p>
        </div>
        <Button onClick={onCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedPlatform} onValueChange={onPlatformChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All platforms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All platforms</SelectItem>
            {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
          <p className="text-gray-600 mb-4">
            Start by adding your first affiliate product
          </p>
          <Button onClick={onCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Product
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Posts</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium">{product.name}</div>
                        {product.description && (
                          <div className="text-sm text-gray-600 truncate max-w-xs">
                            {product.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary"
                      className={PLATFORM_COLORS[product.platform || 'other']}
                    >
                      {PLATFORM_LABELS[product.platform || 'other']}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {product.price ? (
                      <span className="font-medium">
                        {formatPrice(product.price, product.currency)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {product._count.posts} post{product._count.posts !== 1 ? 's' : ''}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(product)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(product)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openAffiliateLink(product.affiliateUrl)}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Link
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(product.id, product.name)}
                          disabled={deletingId === product.id}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {deletingId === product.id ? "Deleting..." : "Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
