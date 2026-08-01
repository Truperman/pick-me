export const CATEGORIES = [
  "General Contractor",
  "Manufacturer",
  "Wholesale Supplier",
  "Consulting",
  "Marketing Agency",
  "Software / IT Services",
  "Real Estate",
  "Investor",
  "Landscaping",
  "Cleaning Services",
  "Plumbing / Electrical",
  "Distributor",
  "Recruiting / Staffing",
  "Other",
] as const;

export const ROLE_LABELS: Record<string, string> = {
  buyer: "Buyer / Client",
  seller: "Business / Seller",
  both: "Buyer & Seller",
};
