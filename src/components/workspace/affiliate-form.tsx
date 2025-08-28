"use client";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { AffiliateLink } from "@prisma/client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const AffiliateLinkSchema = z.object({
  name: z.string().min(1, "Link name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  originalUrl: z.string().url("Invalid URL"),
  affiliateUrl: z.string().url("Invalid affiliate URL"),
  platform: z.string().min(1, "Platform is required"),
  commission: z.number().min(0, "Commission must be positive").max(100, "Commission cannot exceed 100%").optional(),
  commissionType: z.enum(["percentage", "fixed"]).default("percentage"),
  tags: z.string().optional(),
  productId: z.string().min(1, "Product is required"),
});

type AffiliateLinkFormData = z.infer<typeof AffiliateLinkSchema>;

interface Product {
  id: string;
  name: string;
  image?: string;
}

interface AffiliateFormProps {
  affiliateLink?: AffiliateLink | null;
  products: Product[];
  onSubmit: (data: AffiliateLinkFormData) => Promise<void>;
  onCancel: () => void;
}

const platforms = [
  { value: "shopee", label: "Shopee" },
  { value: "lazada", label: "Lazada" },
  { value: "tiki", label: "Tiki" },
  { value: "amazon", label: "Amazon" },
  { value: "sendo", label: "Sendo" },
  { value: "accesstrade", label: "AccessTrade" },
  { value: "other", label: "Other" },
];

export function AffiliateForm({ affiliateLink, products, onSubmit, onCancel }: AffiliateFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AffiliateLinkFormData>({
    resolver: zodResolver(AffiliateLinkSchema),
    defaultValues: {
      name: affiliateLink?.name || "",
      description: affiliateLink?.description || "",
      originalUrl: affiliateLink?.originalUrl || "",
      affiliateUrl: affiliateLink?.affiliateUrl || "",
      platform: affiliateLink?.platform || "",
      commission: affiliateLink?.commission || undefined,
      commissionType: (affiliateLink?.commissionType as "percentage" | "fixed") || "percentage",
      tags: affiliateLink?.tags || "",
      productId: affiliateLink?.productId || "",
    },
  });

  useEffect(() => {
    if (affiliateLink) {
      form.reset({
        name: affiliateLink.name,
        description: affiliateLink.description || "",
        originalUrl: affiliateLink.originalUrl,
        affiliateUrl: affiliateLink.affiliateUrl,
        platform: affiliateLink.platform,
        commission: affiliateLink.commission || undefined,
        commissionType: (affiliateLink.commissionType as "percentage" | "fixed") || "percentage",
        tags: affiliateLink.tags || "",
        productId: affiliateLink.productId,
      });
    }
  }, [affiliateLink, form]);

  const handleSubmit = async (data: AffiliateLinkFormData) => {
    setIsLoading(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-detect platform from URL
  const detectPlatform = (url: string) => {
    if (url.includes("shopee.")) return "shopee";
    if (url.includes("lazada.")) return "lazada";
    if (url.includes("tiki.")) return "tiki";
    if (url.includes("amazon.")) return "amazon";
    if (url.includes("sendo.")) return "sendo";
    if (url.includes("accesstrade.")) return "accesstrade";
    return "other";
  };

  const handleUrlChange = (url: string, field: any) => {
    field.onChange(url);
    if (url && !form.getValues("platform")) {
      const detectedPlatform = detectPlatform(url);
      form.setValue("platform", detectedPlatform);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter link name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="platform"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Platform *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {platforms.map((platform) => (
                      <SelectItem key={platform.value} value={platform.value}>
                        {platform.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="productId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center gap-2">
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-6 h-6 rounded object-cover"
                          />
                        )}
                        <span>{product.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Select the product this affiliate link belongs to
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Enter link description"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="originalUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Original URL *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="https://example.com/product"
                  onChange={(e) => handleUrlChange(e.target.value, field)}
                />
              </FormControl>
              <FormDescription>
                The original product URL before affiliate conversion
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="affiliateUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Affiliate URL *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="https://affiliate.example.com/product?ref=your_id"
                />
              </FormControl>
              <FormDescription>
                Your affiliate tracking URL
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="commission"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Commission</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="5.00"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="commissionType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Commission Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="electronics, gadgets"
                  />
                </FormControl>
                <FormDescription>
                  Comma-separated tags
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : affiliateLink ? "Update Link" : "Create Link"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
