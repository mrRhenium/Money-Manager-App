"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "antd";
import { createCategory, updateCategory } from "@/actions/category";
import { Plus, FolderPlus, Type, List, Palette, PenLine, Sparkles } from "lucide-react";
import { IconPicker } from "@/components/ui/IconColorPicker";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(["expense", "income"]),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color"),
  icon: z.string().default("Circle"),
});

export function CategoryForm({ category }: { category?: any }) {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: category?.name || "",
      type: category?.type || "expense",
      color: category?.color || "#8884d8",
      icon: category?.icon || "Circle",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (category?._id) {
        await updateCategory(category._id, values);
      } else {
        await createCategory(values);
      }
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Failed to save category", error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        category ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors">
            <PenLine className="w-4 h-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Category
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
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Palette className="w-4 h-4 text-muted-foreground" /> Color (Hex)</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input type="color" id={`categoryColorInput-${category?._id || 'new'}`} className="w-12 h-10 p-1" {...field} />
                      <Input placeholder="#RRGGBB" {...field} onClick={() => document.getElementById(`categoryColorInput-${category?._id || 'new'}`)?.click()} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <IconPicker value={field.value} onChange={field.onChange} color={form.watch("color")} />
              )}
            />
            <Button type="submit" className="w-full h-11 text-base font-semibold shadow-md">{category ? "Save Changes" : "Create Category"}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
