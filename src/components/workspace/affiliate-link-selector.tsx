"use client";

import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAffiliateLinks } from "@/hooks/use-affiliate-links";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, ExternalLink, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const PLATFORMS = [
  { value: "shopee", label: "Shopee" },
  { value: "lazada", label: "Lazada" },
  { value: "tiki", label: "Tiki" },
  { value: "amazon", label: "Amazon" },
  { value: "sendo", label: "Sendo" },
  { value: "fptshop", label: "FPT Shop" },
  { value: "thegioididong", label: "Thế Giới Di Động" },
  { value: "cellphones", label: "CellphoneS" },
  { value: "other", label: "Other" },
];

interface AffiliateLinkSelectorProps {
  workspaceId: string;
  productId?: string;
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function AffiliateLinkSelector({
  workspaceId,
  productId,
  value,
  onValueChange,
  placeholder = "Select affiliate link...",
  className,
}: AffiliateLinkSelectorProps) {
  const [open, setOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkDescription, setNewLinkDescription] = useState("");
  const [newLinkOriginalUrl, setNewLinkOriginalUrl] = useState("");
  const [newLinkAffiliateUrl, setNewLinkAffiliateUrl] = useState("");
  const [newLinkPlatform, setNewLinkPlatform] = useState("");
  const [newLinkCommission, setNewLinkCommission] = useState("");

  const { affiliateLinks, isLoading, createAffiliateLink } = useAffiliateLinks({ 
    workspaceId,
    productId 
  });

  const selectedLink = affiliateLinks.find((link) => link.id === value);

  const handleCreateLink = async () => {
    if (!newLinkName.trim() || !newLinkAffiliateUrl.trim()) {
      toast.error("Name and affiliate URL are required");
      return;
    }

    if (!productId) {
      toast.error("Product ID is required to create affiliate link");
      return;
    }

    try {
      setIsCreating(true);
      const link = await createAffiliateLink({
        name: newLinkName.trim(),
        description: newLinkDescription.trim() || undefined,
        originalUrl: newLinkOriginalUrl.trim() || newLinkAffiliateUrl.trim(),
        affiliateUrl: newLinkAffiliateUrl.trim(),
        platform: newLinkPlatform || "other",
        commission: newLinkCommission ? parseFloat(newLinkCommission) : undefined,
        productId,
      });

      // Select the newly created link
      onValueChange(link.id);
      
      // Reset form and close dialog
      resetForm();
      setShowCreateDialog(false);
      setOpen(false);
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setNewLinkName("");
    setNewLinkDescription("");
    setNewLinkOriginalUrl("");
    setNewLinkAffiliateUrl("");
    setNewLinkPlatform("");
    setNewLinkCommission("");
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", className)}
          >
            {selectedLink ? (
              <div className="flex items-center gap-2">
                <ExternalLink className="w-3 h-3" />
                <span className="truncate">{selectedLink.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({selectedLink.platform})
                </span>
              </div>
            ) : (
              placeholder
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search affiliate links..." />
            <CommandList>
              <CommandEmpty>
                <div className="text-center py-4">
                  {productId ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-2">No affiliate links found</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCreateDialog(true)}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Create Affiliate Link
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Create the product first to add affiliate links
                    </p>
                  )}
                </div>
              </CommandEmpty>
              <CommandGroup>
                {productId && (
                  <CommandItem
                    onSelect={() => {
                      setShowCreateDialog(true);
                    }}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create new affiliate link
                  </CommandItem>
                )}
                {affiliateLinks.map((link) => (
                  <CommandItem
                    key={link.id}
                    value={link.name}
                    onSelect={() => {
                      onValueChange(link.id === value ? "" : link.id);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <ExternalLink className="w-3 h-3" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{link.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {link.platform} • {link.affiliateUrl}
                        </div>
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4",
                        value === link.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Create Affiliate Link Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Affiliate Link</DialogTitle>
            <DialogDescription>
              Add a new affiliate link for this product.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="link-name">Name *</Label>
                <Input
                  id="link-name"
                  value={newLinkName}
                  onChange={(e) => setNewLinkName(e.target.value)}
                  placeholder="Enter link name"
                  maxLength={100}
                />
              </div>
              <div>
                <Label htmlFor="link-platform">Platform</Label>
                <Select value={newLinkPlatform} onValueChange={setNewLinkPlatform}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((platform) => (
                      <SelectItem key={platform.value} value={platform.value}>
                        {platform.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="link-affiliate-url">Affiliate URL *</Label>
              <Input
                id="link-affiliate-url"
                type="url"
                value={newLinkAffiliateUrl}
                onChange={(e) => setNewLinkAffiliateUrl(e.target.value)}
                placeholder="https://shopee.vn/product-name-i.123.456?aff_id=your_id"
              />
            </div>

            <div>
              <Label htmlFor="link-original-url">Original URL</Label>
              <Input
                id="link-original-url"
                type="url"
                value={newLinkOriginalUrl}
                onChange={(e) => setNewLinkOriginalUrl(e.target.value)}
                placeholder="https://shopee.vn/product-name-i.123.456"
              />
            </div>

            <div>
              <Label htmlFor="link-description">Description</Label>
              <Textarea
                id="link-description"
                value={newLinkDescription}
                onChange={(e) => setNewLinkDescription(e.target.value)}
                placeholder="Enter link description (optional)"
                maxLength={500}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="link-commission">Commission (%)</Label>
              <Input
                id="link-commission"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={newLinkCommission}
                onChange={(e) => setNewLinkCommission(e.target.value)}
                placeholder="5.5"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  resetForm();
                }}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateLink} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Affiliate Link"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
