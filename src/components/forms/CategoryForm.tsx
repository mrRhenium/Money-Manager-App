"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "antd";
import { createCategory, updateCategory } from "@/actions/category";
import { Plus, FolderPlus, Type, List, Palette, PenLine, Loader2 } from "lucide-react";
import { IconPicker, ColorPicker } from "@/components/ui/IconColorPicker";
import { useToast } from "@/hooks/useToast";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(["expense", "income"]),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color"),
  icon: z.string().default("Circle"),
});

export function CategoryForm({ category, triggerClassName }: { category?: any, triggerClassName?: string }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: category?.name || "",
      type: category?.type || "expense",
      color: category?.color || "#8884d8",
      icon: category?.icon || "Circle",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: category?.name || "",
        type: category?.type || "expense",
        color: category?.color || "#8884d8",
        icon: category?.icon || "Circle",
      });
    }
  }, [category, open, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      if (category?._id) {
        const res = await updateCategory(category._id, values);
        if (res && !res.success) {
          toast.error(res.error || "Failed to update category");
          return;
        }
        toast.success("Category updated successfully!");
      } else {
        const res = await createCategory(values);
        if (res && !res.success) {
          toast.error(res.error || "Failed to create category");
          return;
        }
        toast.success("Category created successfully!");
      }
      setOpen(false);
    } catch (error: any) {
      console.error("Failed to save category", error);
      toast.error(error.message || "Failed to save category");
    } finally {
      setIsLoading(false);
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={
        category ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors">
            <PenLine className="w-4 h-4" />
          </Button>
        ) : (
          <Button className={triggerClassName || "gap-2"}>
            <Plus className="w-4 h-4" />
            New Category
          </Button>
        )
      } />
      <DialogContent initialFocus={false} className="sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <FolderPlus className="w-5 h-5" />
            <span className="text-foreground">{category ? "Edit Category" : "Create New Category"}</span>
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Type className="w-4 h-4 text-muted-foreground" /> Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Groceries" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><List className="w-4 h-4 text-muted-foreground" /> Type</FormLabel>
                  <FormControl>
                    <Select
                      showSearch
                      placeholder="Select type"
                      className="w-full h-10"
                      optionFilterProp="label"
                      options={[
                        { label: 'Expense', value: 'expense' },
                        { label: 'Income', value: 'income' },
                      ]}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <ColorPicker value={field.value} onChange={field.onChange} id={`categoryColorInput-${category?._id || 'new'}`} />
              )}
            />
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <IconPicker value={field.value} onChange={field.onChange} color={form.watch("color")} />
              )}
            />
            <Button type="submit" className="w-full h-11 text-base font-semibold shadow-md" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isLoading ? "Saving..." : (category ? "Save Changes" : "Create Category")}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
