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
import { createPerson } from "@/actions/person";
import { Plus, UserPlus, User, Users, Phone, Smartphone } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  relation: z.enum(["Friend", "Family", "Colleague", "Other"]),
  phone: z.string().optional(),
});

export function PersonForm() {
  const [open, setOpen] = useState(false);
  const [isContactSupported, setIsContactSupported] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window) {
      setIsContactSupported(true);
    }
  }, []);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      relation: "Friend",
      phone: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await createPerson(values);
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Failed to add person", error);
    }
  }

  const handleImportContact = async () => {
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
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Person
        </Button>
      } />
      <DialogContent className="sm:max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-primary">
              <UserPlus className="w-5 h-5" />
              <span className="text-foreground">Add New Contact</span>
            </DialogTitle>
            {isContactSupported && (
              <Button type="button" variant="outline" size="sm" onClick={handleImportContact} className="gap-2">
                <Smartphone className="w-4 h-4" />
                Import
              </Button>
            )}
          </div>
        </DialogHeader>
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
            <Button type="submit" className="w-full">Add Contact</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
