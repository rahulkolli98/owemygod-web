export const EXPENSE_CATEGORIES = [
  "Food & Drinks",
  "Travel",
  "Accommodation",
  "Utilities",
  "Entertainment",
  "Shopping",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface ExpenseSplitDetail {
  userId: string;
  userName: string;
  amountOwed: number;
  settledAmount: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  date: string;
  participants: string[];
  category: ExpenseCategory;
  splitDetails?: ExpenseSplitDetail[];
}

export interface GroupMemberDirectoryItem {
  id: string;
  name: string;
}

export interface Group {
  id: string;
  name: string;
  currency?: string;
  members: string[];
  memberDirectory?: GroupMemberDirectoryItem[];
  expenses: Expense[];
}

export const MOCK_GROUPS: Group[] = [
  {
    id: "1",
    name: "Goa Trip",
    members: ["You", "Priya", "Arjun"],
    expenses: [
      { id: "e1",  description: "Hotel stay",      amount: 4500, paidBy: "You",   date: "2026-04-15", participants: ["You", "Priya", "Arjun"], category: "Accommodation" },
      { id: "e2",  description: "Cab from airport", amount: 800,  paidBy: "Priya", date: "2026-04-15", participants: ["You", "Priya"],          category: "Travel" },
      { id: "e3",  description: "Beach dinner",     amount: 2200, paidBy: "Arjun", date: "2026-04-16", participants: ["You", "Priya", "Arjun"], category: "Food & Drinks" },
      { id: "e7",  description: "Scuba diving",     amount: 3600, paidBy: "You",   date: "2026-03-12", participants: ["You", "Priya", "Arjun"], category: "Entertainment" },
      { id: "e8",  description: "Train tickets",    amount: 1800, paidBy: "Priya", date: "2026-03-10", participants: ["You", "Priya", "Arjun"], category: "Travel" },
      { id: "e9",  description: "Shack lunch",      amount: 950,  paidBy: "You",   date: "2026-02-20", participants: ["You", "Arjun"],          category: "Food & Drinks" },
      { id: "e10", description: "Night cruise",     amount: 2800, paidBy: "Arjun", date: "2026-02-21", participants: ["You", "Priya", "Arjun"], category: "Entertainment" },
      { id: "e11", description: "Bike rental",      amount: 1200, paidBy: "You",   date: "2026-01-18", participants: ["You", "Priya"],          category: "Travel" },
    ],
  },
  {
    id: "2",
    name: "Flat 4B",
    members: ["You", "Rahul", "Sneha", "Dev"],
    expenses: [
      { id: "e4",  description: "Electricity bill", amount: 1800, paidBy: "Rahul", date: "2026-04-01", participants: ["You", "Rahul", "Sneha", "Dev"], category: "Utilities" },
      { id: "e5",  description: "Groceries",        amount: 960,  paidBy: "You",   date: "2026-04-10", participants: ["You", "Rahul"],                 category: "Food & Drinks" },
      { id: "e12", description: "WiFi bill",        amount: 1200, paidBy: "You",   date: "2026-03-05", participants: ["You", "Rahul", "Sneha", "Dev"], category: "Utilities" },
      { id: "e13", description: "House cleaning",   amount: 600,  paidBy: "Sneha", date: "2026-03-15", participants: ["You", "Rahul", "Sneha", "Dev"], category: "Other" },
      { id: "e14", description: "Grocery run",      amount: 1100, paidBy: "Dev",   date: "2026-02-12", participants: ["You", "Rahul", "Sneha", "Dev"], category: "Food & Drinks" },
      { id: "e15", description: "Water cans",       amount: 300,  paidBy: "Rahul", date: "2026-01-20", participants: ["You", "Rahul", "Sneha", "Dev"], category: "Utilities" },
    ],
  },
  {
    id: "3",
    name: "Office Lunch",
    members: ["You", "Neha", "Karan"],
    expenses: [
      { id: "e6",  description: "Pizza Friday",       amount: 1200, paidBy: "Neha",  date: "2026-04-18", participants: ["You", "Neha", "Karan"], category: "Food & Drinks" },
      { id: "e16", description: "Biryani order",      amount: 870,  paidBy: "You",   date: "2026-04-04", participants: ["You", "Neha", "Karan"], category: "Food & Drinks" },
      { id: "e17", description: "Coffee run",         amount: 540,  paidBy: "Karan", date: "2026-03-28", participants: ["You", "Karan"],         category: "Food & Drinks" },
      { id: "e18", description: "Team dinner",        amount: 2400, paidBy: "You",   date: "2026-03-14", participants: ["You", "Neha", "Karan"], category: "Food & Drinks" },
      { id: "e19", description: "Lunch at Barbeque",  amount: 1800, paidBy: "Neha",  date: "2026-02-07", participants: ["You", "Neha", "Karan"], category: "Food & Drinks" },
      { id: "e20", description: "Snacks & chai",      amount: 360,  paidBy: "You",   date: "2026-01-25", participants: ["You", "Neha", "Karan"], category: "Food & Drinks" },
    ],
  },
];

