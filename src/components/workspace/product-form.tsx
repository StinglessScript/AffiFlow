"use client";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
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
import { formatPrice } from "@/lib/video-utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Product } from "@prisma/client";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AffiliateLinkSelector } from "./affiliate-link-selector";
import { CategorySelector } from "./category-selector";

const ProductFormSchema = z.object({
  name: z.string().min(1, "Product name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  image: z.string().url("Invalid image URL").optional().or(z.literal("")),
  price: z.number().min(0, "Price must be positive").optional(),
  currency: z.string().length(3, "Currency must be 3 characters").default("VND"),
  categoryId: z.string().optional().refine((val) => !val || z.string().cuid().safeParse(val).success, {
    message: "Invalid category ID",
  }),
  activeAffiliateLinkId: z.string().optional().refine((val) => !val || z.string().cuid().safeParse(val).success, {
    message: "Invalid affiliate link ID",
  }),
});

type ProductFormData = z.infer<typeof ProductFormSchema>;

interface ProductFormProps {
  product?: Product;
  workspaceId: string;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const CURRENCIES = [
  { value: "VND", label: "VND (₫)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
];

export function ProductForm({ product, workspaceId, onSubmit, onCancel, isLoading }: ProductFormProps) {

  const form = useForm<ProductFormData>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      image: product?.image || "",
      price: product?.price || undefined,
      currency: product?.currency || "VND",
      categoryId: product?.categoryId || "",
      activeAffiliateLinkId: product?.activeAffiliateLinkId || "",
    },
  });



  const handleSubmit = async (data: ProductFormData) => {
    console.log("Form submitted with data:", data);
    try {
      await onSubmit(data);
      toast.success(product ? "Product updated successfully!" : "Product created successfully!");
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to save product", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit, (errors) => {
        console.log("Form validation errors:", errors);
      })} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter product name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter product description" 
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category */}
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <CategorySelector
                  workspaceId={workspaceId}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select or create category..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Affiliate Link */}
        <FormField
          control={form.control}
          name="activeAffiliateLinkId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Affiliate Link</FormLabel>
              <FormControl>
                <AffiliateLinkSelector
                  workspaceId={workspaceId}
                  productId={product?.id}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select or create affiliate link..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Price */}
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Currency */}
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Image URL */}
          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com/image.jpg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Preview */}
        {form.watch("price") && form.watch("currency") && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Price Preview:</p>
            <p className="text-lg font-semibold">
              {formatPrice(form.watch("price")!, form.watch("currency"))}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : product ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
