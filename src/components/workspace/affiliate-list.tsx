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
import { AffiliateLink } from "@prisma/client";
import {
    Copy,
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

interface AffiliateLinkWithStats extends AffiliateLink {
  product: {
    id: string;
    name: string;
    image?: string;
    activeAffiliateLinkId?: string;
  };
  isActive: boolean;
  _count?: {
    clicks: number;
    conversions: number;
  };
}

interface AffiliateListProps {
  affiliateLinks?: AffiliateLinkWithStats[];
  isLoading: boolean;
  error: string | null;
  onEdit: (link: AffiliateLink) => void;
  onDelete: (linkId: string) => void;
  onSetActive: (linkId: string) => void;
  onCreateNew: () => void;
}

const platformColors: Record<string, string> = {
  shopee: "bg-orange-100 text-orange-800",
  lazada: "bg-blue-100 text-blue-800",
  tiki: "bg-indigo-100 text-indigo-800",
  amazon: "bg-yellow-100 text-yellow-800",
  sendo: "bg-red-100 text-red-800",
  accesstrade: "bg-green-100 text-green-800",
  other: "bg-gray-100 text-gray-800",
};

export function AffiliateList({
  affiliateLinks = [],
  isLoading,
  error,
  onEdit,
  onDelete,
  onSetActive,
  onCreateNew,
}: AffiliateListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");

  const filteredLinks = affiliateLinks.filter((link) => {
    const matchesSearch = 
      link.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.tags?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPlatform = platformFilter === "all" || link.platform === platformFilter;
    
    return matchesSearch && matchesPlatform;
  });

  const platforms = Array.from(new Set(affiliateLinks.map(link => link.platform)));

  const handleDelete = (link: AffiliateLink) => {
    if (confirm(`Are you sure you want to delete "${link.name}"?`)) {
      onDelete(link.id);
    }
  };

  const handleSetActive = (link: AffiliateLinkWithStats) => {
    if (confirm(`Set "${link.name}" as the active affiliate link for "${link.product.name}"?`)) {
      onSetActive(link.id);
    }
  };

  const handleCopyLink = async (url: string, type: "original" | "affiliate") => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(`${type === "original" ? "Original" : "Affiliate"} URL copied to clipboard!`);
    } catch (error) {
      toast.error("Failed to copy URL");
    }
  };

  const handleOpenLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold text-red-600">Error Loading Affiliate Links</h3>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-2">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search affiliate links..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All platforms</SelectItem>
              {platforms.map((platform) => (
                <SelectItem key={platform} value={platform}>
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Affiliate Link
        </Button>
      </div>

      {/* Affiliate Links Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : filteredLinks.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <ExternalLink className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold">No affiliate links yet</h3>
          <p className="text-muted-foreground mb-4">
            Start tracking your affiliate partnerships by adding links
          </p>
          <Button onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Affiliate Link
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Link Name</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLinks.map((link) => (
                <TableRow key={link.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{link.name}</div>
                      {link.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {link.description}
                        </div>
                      )}
                      {link.tags && (
                        <div className="flex flex-wrap gap-1">
                          {link.tags.split(",").map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {link.product.image && (
                        <img
                          src={link.product.image}
                          alt={link.product.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium text-sm">{link.product.name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={platformColors[link.platform] || platformColors.other}
                    >
                      {link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {link.commission ? (
                      <div className="text-sm">
                        {link.commission}
                        {link.commissionType === "percentage" ? "%" : " VND"}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Clicks:</span>{" "}
                        {link._count?.clicks || 0}
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Conversions:</span>{" "}
                        {link._count?.conversions || 0}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {link.isActive ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-muted-foreground">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(link.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenLink(link.originalUrl)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Original
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenLink(link.affiliateUrl)}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open Affiliate Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopyLink(link.affiliateUrl, "affiliate")}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Affiliate URL
                        </DropdownMenuItem>
                        {!link.isActive && (
                          <DropdownMenuItem onClick={() => handleSetActive(link)}>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Set as Active
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onEdit(link)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(link)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
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
