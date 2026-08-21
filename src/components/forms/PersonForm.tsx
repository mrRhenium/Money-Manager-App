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
import { createPerson, updatePerson } from "@/actions/person";
import { Plus, UserPlus, User, Users, Phone, Smartphone, BookUser, PenLine, QrCode } from "lucide-react";
import { useToast } from "@/hooks/useToast";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  relation: z.enum(["Friend", "Family", "Colleague", "Other"]),
  phone: z.string().optional(),
  vpa: z.string().optional(),
});

export function PersonForm({ person }: { person?: any }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: person?.name || "",
      relation: person?.relation || "Friend",
      phone: person?.phone || "",
      vpa: person?.vpa || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (person?._id) {
        await updatePerson(person._id, values);
      } else {
        await createPerson(values);
      }
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Failed to save person", error);
    }
  }

  const handleImportContact = async () => {
    if (typeof navigator === 'undefined' || !('contacts' in navigator) || !('ContactsManager' in window)) {
      toast.warning("The Contact Picker is only supported on mobile devices (like Chrome on Android or Safari on iOS).");
      return;
    }

    try {
      const props = ['name', 'tel'];
      const opts = { multiple: false };
      // @ts-ignore
      const contacts = await navigator.contacts.select(props, opts);
      if (contacts && contacts.length > 0) {
        const c = contacts[0];
        if (c.name && c.name.length > 0) {
          form.setValue("name", c.name[0]);
        }
        if (c.tel && c.tel.length > 0) {
          form.setValue("phone", c.tel[0]);
        }
      }
    } catch (err) {
      console.error("Failed to pick contact", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        person ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors">
            <PenLine className="w-4 h-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Person
          </Button>
        )
      } />
      <DialogContent className="sm:max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <UserPlus className="w-5 h-5" />
            <span className="text-foreground">{person ? "Edit Contact" : "Add New Contact"}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 mb-2">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <BookUser className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">Import from Phone</h4>
              <p className="text-xs text-muted-foreground">Select a contact to auto-fill details</p>
            </div>
          </div>
          <Button type="button" variant="secondary" className="w-full sm:w-auto shadow-sm" onClick={handleImportContact}>
            <Smartphone className="w-4 h-4 mr-2" />
            Import
          </Button>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /> Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Enter Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="relation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Users className="w-4 h-4 text-muted-foreground" /> Relation</FormLabel>
                  <FormControl>
                    <Select
                      showSearch
                      placeholder="Select relation"
                      className="w-full h-10"
                      optionFilterProp="label"
                      options={[
                        { label: 'Friend', value: 'Friend' },
                        { label: 'Family', value: 'Family' },
                        { label: 'Colleague', value: 'Colleague' },
                        { label: 'Other', value: 'Other' },
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
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /> Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="+91 9876543210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vpa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><QrCode className="w-4 h-4 text-muted-foreground" /> UPI VPA (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. name@bank" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full h-11 text-base font-semibold shadow-md">{person ? "Save Changes" : "Add Contact"}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
