"use client";

import { List, Popconfirm, Modal } from "antd";
import { User as UserIcon, Trash, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "antd";
import { PersonForm } from "../forms/PersonForm";
import { deletePerson } from "@/actions/person";
import { useState, useMemo } from "react";

export function PersonList({ people }: { people: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [relationFilter, setRelationFilter] = useState("All");

  const filteredPeople = useMemo(() => {
    return people.filter((person) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        person.name?.toLowerCase().includes(q) ||
        person.phones?.some((p: string) => p.includes(q)) ||
        person.vpas?.some((v: string) => v.toLowerCase().includes(q));
      
      const matchesRelation = relationFilter === "All" || person.relation === relationFilter;
      return matchesSearch && matchesRelation;
    });
  }, [people, searchQuery, relationFilter]);
  if (people.length === 0) {
    return (
      <div className="col-span-full p-8 text-center border rounded-xl border-dashed w-full">
        <p className="text-muted-foreground mb-4">No people added yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-card p-3 rounded-xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or VPA..."
            className="pl-9 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 sm:w-[200px]">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
          <Select
            className="w-full h-10"
            value={relationFilter}
            onChange={setRelationFilter}
            options={[
              { label: "All Relations", value: "All" },
              { label: "Friend", value: "Friend" },
              { label: "Family", value: "Family" },
              { label: "Colleague", value: "Colleague" },
              { label: "Merchant", value: "Merchant" },
              { label: "Shopkeeper", value: "Shopkeeper" },
              { label: "Other", value: "Other" },
            ]}
          />
        </div>
      </div>

      {filteredPeople.length === 0 && (
        <div className="p-8 text-center border rounded-xl border-dashed">
          <p className="text-muted-foreground">No people match your filters.</p>
        </div>
      )}

      {filteredPeople.length > 0 && (
        <List
          grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
          dataSource={filteredPeople}
          pagination={{ pageSize: 12, position: "bottom", align: "end" }}
        renderItem={(person: any, index: number) => (
          <List.Item>
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between h-full group">
              <div className="flex items-start justify-between mb-4 gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold text-muted-foreground w-4 shrink-0 text-right">{index + 1}.</span>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors" style={{ backgroundColor: `${person.color || '#0ea5e9'}20`, color: person.color || '#0ea5e9' }}>
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate" title={person.name}>{person.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{person.relation}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
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
      )}
    </div>
  );
}
