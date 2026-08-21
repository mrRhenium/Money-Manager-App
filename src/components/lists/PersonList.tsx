"use client";

import { List, Popconfirm, Modal } from "antd";
import { User as UserIcon, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonForm } from "../forms/PersonForm";
import { deletePerson } from "@/actions/person";

export function PersonList({ people }: { people: any[] }) {
  if (people.length === 0) {
    return (
      <div className="col-span-full p-8 text-center border rounded-xl border-dashed w-full">
        <p className="text-muted-foreground mb-4">No people added yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <List
        grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }}
        dataSource={people}
        pagination={{ pageSize: 12, position: "bottom", align: "end" }}
        renderItem={(person: any) => (
          <List.Item>
            <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col justify-between h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{person.name}</h3>
                    <p className="text-xs text-muted-foreground">{person.relation}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <PersonForm person={person} />
                  <Popconfirm
                    title="Delete Contact"
                    description="Are you sure you want to delete this contact?"
                    onConfirm={async () => {
                      try {
                        const res = await deletePerson(person._id);
                        if (res && !res.success) {
                          Modal.error({
                            title: "Cannot Delete Contact",
                            content: res.error || "This contact is in use elsewhere.",
                            okText: "Close",
                          });
                        }
                      } catch (err: any) {
                        Modal.error({
                          title: "Cannot Delete Contact",
                          content: err.message || "This contact is in use elsewhere.",
                          okText: "Close",
                        });
                      }
                    }}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors">
                      <Trash className="w-4 h-4" />
                    </Button>
                  </Popconfirm>
                </div>
              </div>
              <div className="pt-2 border-t flex items-center justify-between mt-auto">
                <span className="text-sm text-muted-foreground">Net Balance</span>
                <span className={`font-bold ${person.netBalance > 0 ? "text-emerald-500" : person.netBalance < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                  {person.netBalance > 0 ? `+₹${person.netBalance.toLocaleString("en-IN")}` : 
                   person.netBalance < 0 ? `-₹${Math.abs(person.netBalance).toLocaleString("en-IN")}` : 
                   "Settled"}
                </span>
              </div>
            </div>
          </List.Item>
        )}
      />
    </div>
  );
}
