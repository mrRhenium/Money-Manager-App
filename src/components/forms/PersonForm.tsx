"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "antd";
import { createPerson, updatePerson } from "@/actions/person";
import { useFieldArray } from "react-hook-form";
import { Plus, UserPlus, User, Users, Phone, Smartphone, BookUser, PenLine, QrCode, Trash, Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { ColorPicker } from "@/components/ui/IconColorPicker";

const formSchema = z.object({
  relation: z.enum(["Friend", "Family", "Colleague", "Merchant", "Shopkeeper", "Other"]),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phones: z.array(z.object({ value: z.string() })).optional(),
  vpas: z.array(z.object({ value: z.string() })).optional(),
});

export function PersonForm({ person }: { person?: any }) {
  const [open, setOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>(person?.avatarUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const [color, setColor] = useState(person?.color || "#0ea5e9");
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      relation: person?.relation || "Friend",
      name: person?.name || "",
      phones: person?.phones?.length ? person.phones.map((p: string) => ({ value: p })) : [],
      vpas: person?.vpas?.length ? person.vpas.map((v: string) => ({ value: v })) : [],
    },
  });

  const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({
    name: "phones",
    control: form.control,
  });

  const { fields: vpaFields, append: appendVpa, remove: removeVpa } = useFieldArray({
    name: "vpas",
    control: form.control,
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const transformedValues: any = {
        name: values.name,
        relation: values.relation,
        phones: values.phones?.map(p => p.value).filter(Boolean) || [],
        vpas: values.vpas?.map(v => v.value).filter(Boolean) || [],
        avatarUrl,
        color,
      };

      if (person?._id) {
        await updatePerson(person._id, transformedValues);
      } else {
        await createPerson(transformedValues);
      }
      setOpen(false);
      form.reset();
      toast.success(person ? "Contact updated" : "Contact added");
    } catch (error: any) {
      toast.error(error.message || "Failed to save contact");
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
      // @ts-expect-error navigator.contacts is a non-standard API supported only on mobile browsers
      const contacts = await navigator.contacts.select(props, opts);
      if (contacts && contacts.length > 0) {
        const c = contacts[0];
        if (c.name && c.name.length > 0) {
          form.setValue("name", c.name[0]);
        }
        if (c.tel && c.tel.length > 0) {
          const currentPhones = form.getValues("phones") || [];
          form.setValue("phones", [...currentPhones, { value: c.tel[0] }]);
        }
      }
    } catch (err) {
      console.error("Failed to pick contact", err);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset({
        relation: person?.relation || "Friend",
        name: person?.name || "",
        phones: person?.phones?.length ? person.phones.map((p: string) => ({ value: p })) : [],
        vpas: person?.vpas?.length ? person.vpas.map((v: string) => ({ value: v })) : [],
      });
      setAvatarUrl(person?.avatarUrl || "");
      setColor(person?.color || "#0ea5e9");
    }
    setOpen(newOpen);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    try {
      setIsUploading(true);
      const url = await uploadImageToCloudinary(file, "money-manager/avatars");
      setAvatarUrl(url);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload photo");
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
      <DialogContent initialFocus={false} className="sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto">
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
            
            <div className="flex items-center gap-4 py-2">
              <div className="relative w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center bg-muted/20 text-muted-foreground overflow-hidden group">
                {avatarUrl ? (
                  <>
                    <img src={avatarUrl} alt="Contact" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-white hover:text-red-400" onClick={() => setAvatarUrl("")}>
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <Camera className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <Label htmlFor="photo-upload" className="cursor-pointer inline-flex items-center text-sm font-medium text-primary hover:underline">
                  {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {isUploading ? "Uploading..." : avatarUrl ? "Change Photo" : "Upload Photo (Optional)"}
                </Label>
                <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={isUploading} />
              </div>
            </div>
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
                        { label: 'Merchant', value: 'Merchant' },
                        { label: 'Shopkeeper', value: 'Shopkeeper' },
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
            
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <FormLabel className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /> Phone Numbers</FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={() => appendPhone({ value: "" })} className="h-7 text-xs">
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
              {phoneFields.map((field, index) => (
                <FormField
                  key={field.id}
                  control={form.control}
                  name={`phones.${index}.value`}
                  render={({ field: inputField }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input placeholder="+91 9876543210" {...inputField} />
                          <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removePhone(index)}>
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              {phoneFields.length === 0 && <p className="text-xs text-muted-foreground italic">No phone numbers added.</p>}
            </div>

            <div className="space-y-3 pt-2 pb-2">
              <div className="flex items-center justify-between">
                <FormLabel className="flex items-center gap-2"><QrCode className="w-4 h-4 text-muted-foreground" /> UPI VPAs</FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={() => appendVpa({ value: "" })} className="h-7 text-xs">
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
              {vpaFields.map((field, index) => (
                <FormField
                  key={field.id}
                  control={form.control}
                  name={`vpas.${index}.value`}
                  render={({ field: inputField }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input placeholder="e.g. name@bank" {...inputField} />
                          <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeVpa(index)}>
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              {vpaFields.length === 0 && <p className="text-xs text-muted-foreground italic">No UPI VPAs added.</p>}
            </div>
            <div className="pt-2 pb-2 border-t">
              <ColorPicker value={color} onChange={setColor} id={`personColor-${person?._id || 'new'}`} />
            </div>
            <Button type="submit" className="w-full h-11 text-base font-semibold shadow-md">{person ? "Save Changes" : "Add Contact"}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
