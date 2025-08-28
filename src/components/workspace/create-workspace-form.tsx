"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { generateSlug } from "@/lib/video-utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const CreateWorkspaceSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  description: z.string().max(200, "Description too long").optional(),
  slug: z.string().min(3, "Slug must be at least 3 characters").max(50, "Slug too long").optional()
});

type CreateWorkspaceFormData = z.infer<typeof CreateWorkspaceSchema>;

interface CreateWorkspaceFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export function CreateWorkspaceForm({
  onSuccess,
  onCancel,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false
}: CreateWorkspaceFormProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [isLoading, setIsLoading] = useState(false);
  const { createWorkspace } = useWorkspaces();

  const form = useForm<CreateWorkspaceFormData>({
    resolver: zodResolver(CreateWorkspaceSchema),
    defaultValues: {
      name: "",
      description: "",
      slug: "",
    },
  });

  const watchedName = form.watch("name");

  // Auto-generate slug when name changes
  const handleNameChange = (name: string) => {
    if (name && !form.getValues("slug")) {
      const generatedSlug = generateSlug(name);
      form.setValue("slug", generatedSlug);
    }
  };

  const onSubmit = async (data: CreateWorkspaceFormData) => {
    setIsLoading(true);
    try {
      const workspace = await createWorkspace(data);
      form.reset();
      setOpen(false);

      // Save as last workspace and redirect
      if (typeof window !== "undefined") {
        localStorage.setItem("affiflow_last_workspace", data.slug || "");
      }

      // Redirect to new workspace
      router.push(`/${data.slug}/dashboard`);

      onSuccess?.();
    } catch (error) {
      // Error is handled by the hook
      console.error("Create workspace error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Workspace
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
          <DialogDescription>
            Create a new content channel to start sharing your videos and products.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workspace Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="My Decor Channel"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleNameChange(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    This will be the display name for your content channel.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Slug</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-1">affiflow.com/</span>
                      <Input placeholder="my-decor-channel" {...field} />
                    </div>
                  </FormControl>
                  <FormDescription>
                    This will be your workspace URL. Only lowercase letters, numbers, and hyphens.
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share beautiful home decor ideas and product recommendations..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A brief description of your content channel.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  onCancel?.();
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Workspace"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
