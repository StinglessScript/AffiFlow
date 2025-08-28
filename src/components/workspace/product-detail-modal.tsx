"use client";

import { Product } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ExternalLink, 
  Edit, 
  Calendar,
  DollarSign,
  FileText,
  Link as LinkIcon,
  BarChart3
} from "lucide-react";
import { formatPrice } from "@/lib/video-utils";

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

interface ProductDetailModalProps {
  product: ProductWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (product: ProductWithRelations) => void;
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

export function ProductDetailModal({ 
  product, 
  isOpen, 
  onClose, 
  onEdit 
}: ProductDetailModalProps) {
  if (!product) return null;

  const openAffiliateLink = () => {
    window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Product Details</span>
            <Button variant="outline" size="sm" onClick={() => onEdit(product)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Header */}
          <div className="flex items-start space-x-4">
            {product.image && (
              <img
                src={product.image}
                alt={product.name}
                className="w-20 h-20 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{product.name}</h3>
              <div className="flex items-center space-x-2 mt-2">
                <Badge 
                  variant="secondary"
                  className={PLATFORM_COLORS[product.platform || 'other']}
                >
                  {PLATFORM_LABELS[product.platform || 'other']}
                </Badge>
                {product.price && (
                  <span className="text-lg font-medium text-green-600">
                    {formatPrice(product.price, product.currency)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Description</span>
              </div>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>
          )}

          <Separator />

          {/* Product Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Affiliate Link */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <LinkIcon className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Affiliate Link</span>
              </div>
              <div className="flex items-center space-x-2">
                <code className="flex-1 p-2 bg-gray-100 rounded text-sm truncate">
                  {product.affiliateUrl}
                </code>
                <Button variant="outline" size="sm" onClick={openAffiliateLink}>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Price Info */}
            {product.price && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Price Information</span>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-green-600">
                    {formatPrice(product.price, product.currency)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Currency: {product.currency}
                  </div>
                </div>
              </div>
            )}

            {/* Usage Stats */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Usage Statistics</span>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-blue-600">
                  {product._count.posts}
                </div>
                <div className="text-sm text-gray-600">
                  Used in {product._count.posts} post{product._count.posts !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Created Date */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Created</span>
              </div>
              <div className="space-y-1">
                <div className="font-medium">
                  {new Date(product.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="text-sm text-gray-600">
                  {new Date(product.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Posts Using This Product */}
          {product.posts.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-3">Posts Using This Product</h4>
                <div className="space-y-2">
                  {product.posts.map(({ post }) => (
                    <div key={post.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      {post.thumbnail && (
                        <img
                          src={post.thumbnail}
                          alt={post.title}
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{post.title}</div>
                        <div className="text-sm text-gray-600">
                          {post.isPublished ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Published
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Draft
                            </Badge>
                          )}
                          <span className="ml-2">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={openAffiliateLink}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Affiliate Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
