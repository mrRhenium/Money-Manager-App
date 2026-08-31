"use client";

import { List } from "antd";
import { User as UserIcon, Star, ArrowDownLeft, ArrowUpRight, CheckCircle2, Trash } from "lucide-react";
import { PersonForm } from "../forms/PersonForm";
import { PersonDeleteModal } from "../forms/PersonDeleteModal";
import { toggleFavoritePerson, deletePerson } from "@/actions/person";
import { useState, useMemo, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useCurrency } from "@/hooks/useCurrency";
import { PersonDetailDrawer } from "@/components/people/PersonDetailDrawer";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { TYPOGRAPHY } from "@/lib/designTokens";
import { cn } from "@/lib/utils";

export function PersonList({
  people,
  hideToolbar = false,
  externalSearch = "",
  externalFilter = "All",
  externalTab = "all",
  accounts = [],
  categories = [],
  creditCards = []
}: {
  people: any[];
  hideToolbar?: boolean;
  externalSearch?: string;
  externalFilter?: string;
  externalTab?: string;
  accounts?: any[];
  categories?: any[];
  creditCards?: any[];
}) {
  const { format } = useCurrency();
  const { toast } = useToast();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [localPeople, setLocalPeople] = useState(people);

  // Sync if prop changes
  useEffect(() => {
    setLocalPeople(people);
  }, [people]);

  // Open / Close drawer based on personId query param or URL change
  useEffect(() => {
    const personId = searchParams.get("personId");
    if (personId && localPeople.length > 0) {
      const found = localPeople.find(p => p._id === personId);
      if (found) {
        setSelectedPerson(found);
        setDrawerOpen(true);
      }
    } else if (!personId) {
      setDrawerOpen(false);
      setSelectedPerson(null);
    }
  }, [searchParams, localPeople]);

  // Synchronize browser/hardware back button with drawer visibility
  useEffect(() => {
    const handlePopState = () => {
      const current = new URLSearchParams(window.location.search);
      const personId = current.get("personId");
      if (!personId) {
        setDrawerOpen(false);
        setSelectedPerson(null);
      } else {
        const found = localPeople.find(p => p._id === personId);
        if (found) {
          setSelectedPerson(found);
          setDrawerOpen(true);
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [localPeople]);

  const searchQuery = externalSearch;
  const relationFilter = externalFilter;
  const activeTab = externalTab;

  const handleToggleFavorite = async (e: React.MouseEvent, person: any) => {
    e.stopPropagation();
    try {
      // Optimistic update
      setLocalPeople(prev => prev.map(p => p._id === person._id ? { ...p, isFavorite: !p.isFavorite } : p));
      const res = await toggleFavoritePerson(person._id);
      toast.success(res.isFavorite ? `${person.name} added to Favorites ⭐` : `${person.name} removed from Favorites`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update favorite");
    }
  };

  const handleCardClick = (person: any) => {
    setSelectedPerson(person);
    setDrawerOpen(true);
    const current = new URLSearchParams(window.location.search);
    current.set("personId", person._id);
    const query = current.toString() ? `?${current.toString()}` : "";
    window.history.pushState({ personDetail: true }, '', `${pathname}${query}`);
  };

  const filteredPeople = useMemo(() => {
    return localPeople.filter((person) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        person.name?.toLowerCase().includes(q) ||
        person.phones?.some((p: string) => p.includes(q)) ||
        person.vpas?.some((v: string) => v.toLowerCase().includes(q));

      const matchesRelation = relationFilter === "All" || person.relation === relationFilter;
      return matchesSearch && matchesRelation;
    });
  }, [localPeople, searchQuery, relationFilter]);

  const filteredFavorites = useMemo(() => {
    return filteredPeople.filter(p => p.isFavorite);
  }, [filteredPeople]);

  const filteredMerchants = useMemo(() => {
    return filteredPeople.filter(p => p.relation === "Merchant" || p.relation === "Shopkeeper");
  }, [filteredPeople]);

  const filteredPersonal = useMemo(() => {
    return filteredPeople.filter(p => p.relation !== "Merchant" && p.relation !== "Shopkeeper");
  }, [filteredPeople]);

  if (people.length === 0) {
    return (
      <div className="col-span-full p-8 text-center border rounded-xl border-dashed w-full">
        <p className="text-muted-foreground mb-4">No contacts added yet.</p>
      </div>
    );
  }

  const renderPersonItem = (person: any, index: number) => {
    const isFav = person.isFavorite;
    const isPositive = person.netBalance > 0;
    const isNegative = person.netBalance < 0;

    return (
      <List.Item>
        <div
          onClick={() => handleCardClick(person)}
          className="rounded-2xl border bg-card text-card-foreground shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between h-full group relative overflow-hidden cursor-pointer hover:border-primary/40"
        >
          {/* Decorative background circle */}
          <div
            className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-5 pointer-events-none transition-transform group-hover:scale-110"
            style={{ backgroundColor: person.color || '#0ea5e9' }}
          />

          <div className="flex items-start justify-between mb-4 gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs font-bold text-muted-foreground w-4 shrink-0 text-right">{index + 1}.</span>
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs border transition-transform group-hover:scale-105"
                style={{
                  backgroundColor: `${person.color || '#0ea5e9'}20`,
                  borderColor: `${person.color || '#0ea5e9'}40`,
                  color: person.color || '#0ea5e9'
                }}
              >
                {person.avatarUrl ? (
                  <img src={person.avatarUrl} alt={person.name} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <UserIcon className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className={cn(TYPOGRAPHY.cardTitle, "font-bold group-hover:text-primary transition-colors")} title={person.name}>
                    {person.name}
                  </h3>
                </div>
                <span className={cn(TYPOGRAPHY.cardSubtitle, "block")}>{person.relation || "Contact"}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={(e) => handleToggleFavorite(e, person)}
                className={`p-1.5 rounded-lg transition-colors ${isFav
                    ? "text-amber-500 hover:bg-amber-500/10"
                    : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted"
                  }`}
                title={isFav ? "Remove Favorite" : "Mark Favorite"}
              >
                <Star className={`w-4 h-4 ${isFav ? "fill-amber-500" : ""}`} />
              </button>
              <PersonForm person={person} />
              <PersonDeleteModal person={person} />
            </div>
          </div>

          {/* Unambiguous Net Balance status badge */}
          <div className="pt-3 border-t border-border/50 flex items-center justify-between mt-auto">
            <div className={cn(TYPOGRAPHY.cardLabel, "flex items-center gap-1.5 normal-case font-normal")}>
              {isPositive ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <ArrowDownLeft className="w-3.5 h-3.5" /> To Receive
                </span>
              ) : isNegative ? (
                <span className="flex items-center gap-1 text-red-500 font-medium">
                  <ArrowUpRight className="w-3.5 h-3.5" /> You Owe
                </span>
              ) : (
                <span className="flex items-center gap-1 text-slate-500 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Balance
                </span>
              )}
            </div>

            <span className={cn(TYPOGRAPHY.badge, "border font-extrabold px-2.5 py-0.5 rounded-full", isPositive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : isNegative
                  ? "bg-red-500/10 text-red-500 border-red-500/20"
                  : "bg-secondary/60 text-muted-foreground border-border/40"
              )}>
              {isPositive ? `+${format(person.netBalance)}` :
                isNegative ? `-${format(Math.abs(person.netBalance))}` :
                  "All Settled (₹0)"}
            </span>
          </div>
        </div>
      </List.Item>
    );
  };

  const activePeople = activeTab === "favorites"
    ? filteredFavorites
    : activeTab === "merchants"
      ? filteredMerchants
      : activeTab === "personal"
        ? filteredPersonal
        : filteredPeople;

  return (
    <div className="w-full space-y-4">
      <div className="pt-2">
        {activePeople.length === 0 ? (
          <div className="p-12 text-center border rounded-2xl border-dashed bg-card/40">
            <UserIcon className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm font-semibold text-foreground">
              {activeTab === "favorites" ? "No favorite contacts yet." : "No contacts match your filters."}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {activeTab === "favorites" ? "Click the star icon on any contact to add them to your Favorites." : "Try adjusting your search query or relation filter."}
            </p>
          </div>
        ) : (
          <List
            grid={{ gutter: [16, 16], xs: 1, sm: 2, md: 2, lg: 2, xl: 3, xxl: 3 }}
            dataSource={activePeople}
            pagination={{ pageSize: 12, position: "bottom", align: "end" }}
            renderItem={renderPersonItem}
          />
        )}
      </div>

      {/* Person Full Statement & Ledger Drawer */}
      <PersonDetailDrawer
        person={selectedPerson}
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedPerson(null);
          const current = new URLSearchParams(window.location.search);
          if (current.has("personId")) {
            window.history.back();
          }
        }}
        accounts={accounts}
        categories={categories}
        creditCards={creditCards}
      />
    </div>
  );
}
