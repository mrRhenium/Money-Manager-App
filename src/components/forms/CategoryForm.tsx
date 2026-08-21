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
import { createCategory } from "@/actions/category";
import { Plus, FolderPlus, Type, List, Palette } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(["expense", "income"]),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color"),
});

export function CategoryForm() {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      type: "expense",
      color: "#8884d8",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await createCategory(values);
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Failed to create category", error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      } />
      <DialogContent className="sm:max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <FolderPlus className="w-5 h-5" />
            <span className="text-foreground">Create New Category</span>
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
                      <Input type="color" id="categoryColorInput" className="w-12 h-10 p-1" {...field} />
                      <Input placeholder="#RRGGBB" {...field} onClick={() => document.getElementById("categoryColorInput")?.click()} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full h-11 text-base font-semibold shadow-md">Create Category</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
