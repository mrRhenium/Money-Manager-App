// Curated Catalog of 65+ Lucide Icons
export interface SeedIconItem {
  name: string;
  label: string;
  category: string;
  tags: string[];
  sortOrder: number;
}

export const SEED_ICONS: SeedIconItem[] = [
  // --- 1. Finance & Money (14) ---
  { name: "Wallet", label: "Wallet", category: "Finance", tags: ["wallet", "cash", "money", "pocket"], sortOrder: 1 },
  { name: "Landmark", label: "Bank", category: "Finance", tags: ["bank", "institution", "depository", "branch"], sortOrder: 2 },
  { name: "DollarSign", label: "Salary", category: "Finance", tags: ["salary", "wage", "income", "usd", "cash"], sortOrder: 3 },
  { name: "PiggyBank", label: "Savings", category: "Finance", tags: ["savings", "deposit", "piggy", "reserve"], sortOrder: 4 },
  { name: "CircleDollarSign", label: "Money", category: "Finance", tags: ["currency", "coin", "money", "funds"], sortOrder: 5 },
  { name: "Coins", label: "Coins & Change", category: "Finance", tags: ["coins", "cash", "change", "cents"], sortOrder: 6 },
  { name: "CreditCard", label: "Card", category: "Finance", tags: ["credit", "debit", "card", "payment"], sortOrder: 7 },
  { name: "Receipt", label: "Receipt & Bills", category: "Finance", tags: ["receipt", "bill", "invoice", "slip"], sortOrder: 8 },
  { name: "Banknote", label: "Cash Flow", category: "Finance", tags: ["note", "paper", "cash", "rupee", "dollar"], sortOrder: 9 },
  { name: "Vault", label: "Locker & Safe", category: "Finance", tags: ["safe", "vault", "locker", "security"], sortOrder: 10 },
  { name: "HandCoins", label: "Lend & Borrow", category: "Finance", tags: ["lend", "borrow", "debt", "loan"], sortOrder: 11 },
  { name: "BadgePercent", label: "Discount & Tax", category: "Finance", tags: ["percent", "discount", "tax", "offer"], sortOrder: 12 },
  { name: "Percent", label: "Interest Rate", category: "Finance", tags: ["interest", "roi", "percent", "rate"], sortOrder: 13 },
  { name: "Calculator", label: "Accounting", category: "Finance", tags: ["calculate", "audit", "math", "account"], sortOrder: 14 },

  // --- 2. Shopping & Retail (8) ---
  { name: "ShoppingBag", label: "Shopping", category: "Shopping", tags: ["shopping", "bag", "retail", "store"], sortOrder: 20 },
  { name: "ShoppingCart", label: "Groceries", category: "Shopping", tags: ["cart", "market", "grocery", "supermarket"], sortOrder: 21 },
  { name: "Store", label: "Department Store", category: "Shopping", tags: ["shop", "outlet", "mall", "market"], sortOrder: 22 },
  { name: "Package", label: "Courier & Delivery", category: "Shopping", tags: ["parcel", "package", "amazon", "delivery"], sortOrder: 23 },
  { name: "Tag", label: "Clothing & Apparel", category: "Shopping", tags: ["price", "label", "clothes", "fashion"], sortOrder: 24 },
  { name: "Shirt", label: "Fashion & Clothes", category: "Shopping", tags: ["shirt", "dress", "fashion", "wardrobe"], sortOrder: 25 },
  { name: "Glasses", label: "Eyewear & Style", category: "Shopping", tags: ["specs", "glasses", "luxury", "optics"], sortOrder: 26 },
  { name: "Watch", label: "Watches & Jewelry", category: "Shopping", tags: ["time", "watch", "jewelry", "accessory"], sortOrder: 27 },

  // --- 3. Food & Dining (8) ---
  { name: "Utensils", label: "Dining & Food", category: "Food & Dining", tags: ["restaurant", "food", "dining", "meal", "dinner"], sortOrder: 30 },
  { name: "Coffee", label: "Café & Coffee", category: "Food & Dining", tags: ["coffee", "tea", "starbucks", "cafe", "snack"], sortOrder: 31 },
  { name: "Pizza", label: "Fast Food", category: "Food & Dining", tags: ["pizza", "burger", "junk", "zomato", "swiggy"], sortOrder: 32 },
  { name: "Beer", label: "Drinks & Pub", category: "Food & Dining", tags: ["beer", "alcohol", "drinks", "party", "bar"], sortOrder: 33 },
  { name: "Wine", label: "Fine Dining & Wine", category: "Food & Dining", tags: ["wine", "liquor", "cocktail", "luxury"], sortOrder: 34 },
  { name: "Apple", label: "Fruits & Healthy", category: "Food & Dining", tags: ["apple", "diet", "healthy", "fruit", "organic"], sortOrder: 35 },
  { name: "Cake", label: "Bakery & Desserts", category: "Food & Dining", tags: ["cake", "sweet", "dessert", "party", "bakery"], sortOrder: 36 },
  { name: "Soup", label: "Lunch & Dinner", category: "Food & Dining", tags: ["soup", "bowl", "lunch", "kitchen"], sortOrder: 37 },

  // --- 4. Transport & Travel (8) ---
  { name: "Car", label: "Car & Commute", category: "Transport", tags: ["car", "transport", "cab", "uber", "commute"], sortOrder: 40 },
  { name: "Bus", label: "Public Transit", category: "Transport", tags: ["bus", "public", "transit", "metro"], sortOrder: 41 },
  { name: "Train", label: "Train & Rail", category: "Transport", tags: ["railway", "train", "metro", "irctc"], sortOrder: 42 },
  { name: "Plane", label: "Flight & Travel", category: "Transport", tags: ["flight", "travel", "plane", "trip", "holiday"], sortOrder: 43 },
  { name: "Fuel", label: "Fuel & Gas", category: "Transport", tags: ["petrol", "diesel", "cng", "fuel", "pump"], sortOrder: 44 },
  { name: "Bike", label: "Bike & Bicycle", category: "Transport", tags: ["bicycle", "motorbike", "cycle", "ride"], sortOrder: 45 },
  { name: "Ship", label: "Cruises & Ships", category: "Transport", tags: ["cruise", "ship", "boat", "ferry"], sortOrder: 46 },
  { name: "MapPin", label: "Vacation & Trips", category: "Transport", tags: ["location", "trip", "hotel", "destination"], sortOrder: 47 },

  // --- 5. Housing & Utilities (8) ---
  { name: "Home", label: "Housing & Rent", category: "Housing", tags: ["house", "rent", "flat", "home", "residence"], sortOrder: 50 },
  { name: "Building", label: "Apartment", category: "Housing", tags: ["building", "apartment", "society", "maintenance"], sortOrder: 51 },
  { name: "Building2", label: "Commercial Property", category: "Housing", tags: ["office", "building", "real estate", "property"], sortOrder: 52 },
  { name: "Zap", label: "Electricity & Power", category: "Housing", tags: ["electricity", "power", "utility", "ebill"], sortOrder: 53 },
  { name: "Droplets", label: "Water & Sanitation", category: "Housing", tags: ["water", "utilities", "pipeline", "tanker"], sortOrder: 54 },
  { name: "Wifi", label: "Internet & Broadband", category: "Housing", tags: ["wifi", "broadband", "fiber", "network"], sortOrder: 55 },
  { name: "Flame", label: "Gas & Heating", category: "Housing", tags: ["gas", "cylinder", "lpg", "cooking"], sortOrder: 56 },
  { name: "Key", label: "Security & Keys", category: "Housing", tags: ["key", "lock", "access", "rent"], sortOrder: 57 },

  // --- 6. Health & Wellness (6) ---
  { name: "HeartPulse", label: "Medical & Health", category: "Health", tags: ["doctor", "clinic", "hospital", "health"], sortOrder: 60 },
  { name: "Stethoscope", label: "Doctor Consultations", category: "Health", tags: ["doctor", "consultation", "medical", "checkup"], sortOrder: 61 },
  { name: "Pill", label: "Medicines & Pharmacy", category: "Health", tags: ["medicine", "pharmacy", "drugs", "pills"], sortOrder: 62 },
  { name: "Dumbbell", label: "Gym & Fitness", category: "Health", tags: ["gym", "workout", "fitness", "trainer"], sortOrder: 63 },
  { name: "Activity", label: "Wellness & Tracking", category: "Health", tags: ["wellness", "heart", "vital", "fit"], sortOrder: 64 },
  { name: "ShieldPlus", label: "Health Insurance", category: "Health", tags: ["mediclaim", "insurance", "cover", "health"], sortOrder: 65 },

  // --- 7. Work & Education (6) ---
  { name: "GraduationCap", label: "Education & Tuition", category: "Education", tags: ["college", "school", "tuition", "course", "degree"], sortOrder: 70 },
  { name: "BookOpen", label: "Books & Study", category: "Education", tags: ["books", "reading", "study", "exam"], sortOrder: 71 },
  { name: "Briefcase", label: "Business & Office", category: "Work", tags: ["business", "office", "freelance", "corporate"], sortOrder: 72 },
  { name: "Laptop", label: "Software & IT", category: "Work", tags: ["computer", "software", "tech", "hardware"], sortOrder: 73 },
  { name: "Monitor", label: "Electronics & Workstation", category: "Work", tags: ["screen", "monitor", "pc", "gadget"], sortOrder: 74 },
  { name: "FileText", label: "Documents & Legal", category: "Work", tags: ["contract", "legal", "stamp", "tax", "paperwork"], sortOrder: 75 },

  // --- 8. Entertainment & Leisure (6) ---
  { name: "Tv", label: "Entertainment & OTT", category: "Entertainment", tags: ["movies", "netflix", "ott", "tv", "shows"], sortOrder: 80 },
  { name: "Film", label: "Cinema & Movies", category: "Entertainment", tags: ["cinema", "movie", "theatre", "tickets"], sortOrder: 81 },
  { name: "Gamepad2", label: "Gaming & Apps", category: "Entertainment", tags: ["games", "ps5", "xbox", "steam", "play"], sortOrder: 82 },
  { name: "Music", label: "Music & Audio", category: "Entertainment", tags: ["spotify", "music", "concert", "songs"], sortOrder: 83 },
  { name: "Ticket", label: "Events & Concerts", category: "Entertainment", tags: ["ticket", "concert", "event", "show"], sortOrder: 84 },
  { name: "Camera", label: "Photography", category: "Entertainment", tags: ["camera", "photos", "hobby", "video"], sortOrder: 85 },

  // --- 9. Family & Life (6) ---
  { name: "Users", label: "People & Family", category: "Family", tags: ["family", "friends", "people", "group"], sortOrder: 90 },
  { name: "User", label: "Personal Expense", category: "Family", tags: ["personal", "self", "individual"], sortOrder: 91 },
  { name: "Heart", label: "Charity & Care", category: "Family", tags: ["donation", "charity", "love", "support"], sortOrder: 92 },
  { name: "Baby", label: "Baby & Kids", category: "Family", tags: ["baby", "kids", "child", "infant"], sortOrder: 93 },
  { name: "Dog", label: "Pets & Vet", category: "Family", tags: ["pet", "dog", "cat", "veterinary", "animal"], sortOrder: 94 },
  { name: "Gift", label: "Gifts & Celebrations", category: "Family", tags: ["gift", "present", "birthday", "festival"], sortOrder: 95 },

  // --- 10. Assets & Investments (7) ---
  { name: "TrendingUp", label: "Stocks & Mutual Funds", category: "Investments", tags: ["stocks", "mf", "sip", "grow", "bull"], sortOrder: 100 },
  { name: "LineChart", label: "Trading & Equities", category: "Investments", tags: ["chart", "trading", "equity", "indices"], sortOrder: 101 },
  { name: "Bitcoin", label: "Cryptocurrency", category: "Investments", tags: ["crypto", "btc", "eth", "blockchain"], sortOrder: 102 },
  { name: "Gem", label: "Gold & Precious Metals", category: "Investments", tags: ["gold", "diamond", "silver", "jewelry", "gem"], sortOrder: 103 },
  { name: "Shield", label: "General Insurance", category: "Investments", tags: ["policy", "insurance", "protection", "cover"], sortOrder: 104 },
  { name: "Scale", label: "Bonds & Debentures", category: "Investments", tags: ["bonds", "sovereign", "debt", "balanced"], sortOrder: 105 },
  { name: "Repeat", label: "Subscriptions & Recurring", category: "General", tags: ["recurring", "monthly", "subscription", "autopay"], sortOrder: 106 },
  { name: "Smartphone", label: "Mobile & Recharge", category: "General", tags: ["mobile", "recharge", "phone", "upi"], sortOrder: 107 },
  { name: "Circle", label: "Other / Fallback", category: "General", tags: ["other", "misc", "general", "dot"], sortOrder: 108 },
];
