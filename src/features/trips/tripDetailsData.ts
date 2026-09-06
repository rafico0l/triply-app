import type { Member, Expense } from "../../domain/types";
import type { TourStatus } from "./components/TripCard";

export interface TripDetailData {
  id: string;
  name: string;
  destination: string;
  dates: string;
  startDate?: string;
  endDate?: string;
  status: TourStatus;
  travelerCount: number;
  durationDays: number;
  budget?: number; // if undefined or null, Pay-as-you-go
  coverImage?: string;
  members: Member[];
  expenses: Expense[];
}

export const TRIP_DETAILS_DATA: Record<string, TripDetailData> = {
  // 1. Active: Sajek Valley Expedition
  "1": {
    id: "1",
    name: "Sajek Valley Expedition",
    destination: "Sajek Valley",
    dates: "Oct 18–22, 2026",
    startDate: "2026-10-18",
    endDate: "2026-10-22",
    status: "active",
    travelerCount: 5,
    durationDays: 4,
    budget: 50000,
    coverImage: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    members: [
      { id: "m1", name: "Rafi (You)", initials: "R", color: "#0A86A0", paid: 2450, balance: 0, isMe: true, role: "owner" },
      { id: "m2", name: "Shanto",     initials: "S", color: "#10B981", paid: 0,    balance: 0, role: "member" },
      { id: "m3", name: "Jamil",      initials: "J", color: "#EC4899", paid: 6200, balance: 0, role: "member" },
      { id: "m4", name: "Shad",       initials: "S", color: "#F59E0B", paid: 0,    balance: 0, role: "member" },
      { id: "m5", name: "Rabbi",      initials: "R", color: "#8B5CF6", paid: 8500, balance: 0, role: "member" },
    ],
    expenses: [
      {
        id: "exp-1",
        title: "Sajek Resort Booking",
        amount: 6200,
        category: "lodging",
        paidBy: "m3",
        splitIds: ["m1", "m2", "m3", "m4", "m5"],
        date: "Oct 20",
        dateIso: "2026-10-20",
        addedBy: "m3",
        addedAt: "Oct 20, 2:00 PM",
      },
      {
        id: "exp-2",
        title: "Dinner at Stone Cafe",
        amount: 2450,
        category: "food",
        paidBy: "m1",
        splitIds: ["m1", "m2", "m3", "m4", "m5"],
        date: "Oct 19",
        dateIso: "2026-10-19",
        addedBy: "m1",
        addedAt: "Oct 19, 8:30 PM",
      },
      {
        id: "exp-3",
        title: "Jeep (Chander Gari) Rent",
        amount: 8500,
        category: "transport",
        paidBy: "m5",
        splitIds: ["m1", "m2", "m3", "m4", "m5"],
        date: "Oct 19",
        dateIso: "2026-10-19",
        addedBy: "m5",
        addedAt: "Oct 19, 10:00 AM",
      },
      {
        id: "exp-4",
        title: "Konglak Para Tea & Snacks",
        amount: 850,
        category: "food",
        paidBy: "m4",
        splitIds: ["m1", "m2", "m3", "m4", "m5"],
        date: "Oct 19",
        dateIso: "2026-10-19",
        addedBy: "m4",
        addedAt: "Oct 19, 4:30 PM",
      },
    ],
  },

  // 2. Upcoming: Cox's Bazar Getaway (Pay-as-you-go, no budget)
  "2": {
    id: "2",
    name: "Cox's Bazar Getaway",
    destination: "Cox's Bazar",
    dates: "Nov 8–12, 2026",
    startDate: "2026-11-08",
    endDate: "2026-11-12",
    status: "upcoming",
    travelerCount: 6,
    durationDays: 5,
    coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    members: [
      { id: "c1", name: "Rafi (You)", initials: "R", color: "#0A86A0", paid: 0, balance: 0, isMe: true, role: "owner" },
      { id: "c2", name: "Farhan",     initials: "F", color: "#7C3AED", paid: 0, balance: 0, role: "member" },
      { id: "c3", name: "Nadia",      initials: "N", color: "#10B981", paid: 0, balance: 0, role: "member" },
      { id: "c4", name: "Rakib",      initials: "R", color: "#059669", paid: 0, balance: 0, role: "member" },
      { id: "c5", name: "Tanha",      initials: "T", color: "#D97706", paid: 0, balance: 0, role: "member" },
      { id: "c6", name: "Imran",      initials: "I", color: "#E11D48", paid: 0, balance: 0, role: "member" },
    ],
    expenses: [],
  },

  // 3. Completed: Sylhet Weekend
  "3": {
    id: "3",
    name: "Sylhet Weekend",
    destination: "Sylhet",
    dates: "Jun 14–16, 2026",
    startDate: "2026-06-14",
    endDate: "2026-06-16",
    status: "completed",
    travelerCount: 5,
    durationDays: 3,
    budget: 30000,
    coverImage: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
    members: [
      { id: "s1", name: "Rafi (You)", initials: "R", color: "#0A86A0", paid: 12000, balance: 0, isMe: true, role: "owner" },
      { id: "s2", name: "Tanvir",     initials: "T", color: "#2563EB", paid: 6800,  balance: 0, role: "member" },
      { id: "s3", name: "Nayeem",     initials: "N", color: "#059669", paid: 6000,  balance: 0, role: "member" },
      { id: "s4", name: "Fahim",      initials: "F", color: "#D97706", paid: 0,     balance: 0, role: "member" },
      { id: "s5", name: "Shakil",     initials: "S", color: "#7C3AED", paid: 0,     balance: 0, role: "member" },
    ],
    expenses: [
      {
        id: "sy-1",
        title: "Grand Sultan Resort",
        amount: 15400,
        category: "lodging",
        paidBy: "s1",
        splitIds: ["s1", "s2", "s3", "s4", "s5"],
        date: "Jun 15",
        dateIso: "2026-06-15",
        addedBy: "s1",
        addedAt: "Jun 15, 12:00 PM",
      },
      {
        id: "sy-2",
        title: "Tea Garden Boating & Tour",
        amount: 4600,
        category: "activity",
        paidBy: "s2",
        splitIds: ["s1", "s2", "s3", "s4", "s5"],
        date: "Jun 15",
        dateIso: "2026-06-15",
        addedBy: "s2",
        addedAt: "Jun 15, 4:00 PM",
      },
      {
        id: "sy-3",
        title: "Panshi Restaurant Dinner",
        amount: 4800,
        category: "food",
        paidBy: "s3",
        splitIds: ["s1", "s2", "s3", "s4", "s5"],
        date: "Jun 14",
        dateIso: "2026-06-14",
        addedBy: "s3",
        addedAt: "Jun 14, 9:00 PM",
      },
    ],
  },

  // 4. Completed: Sundarbans Escape
  "4": {
    id: "4",
    name: "Sundarbans Escape",
    destination: "Khulna",
    dates: "Mar 8–11, 2026",
    startDate: "2026-03-08",
    endDate: "2026-03-11",
    status: "completed",
    travelerCount: 4,
    durationDays: 4,
    budget: 25000,
    coverImage: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
    members: [
      { id: "u1", name: "Rafi (You)", initials: "R", color: "#0A86A0", paid: 10400, balance: 0, isMe: true, role: "owner" },
      { id: "u2", name: "Rashed",     initials: "R", color: "#059669", paid: 8000,  balance: 0, role: "member" },
      { id: "u3", name: "Hasan",      initials: "H", color: "#64748B", paid: 0,     balance: 0, role: "guest" },
      { id: "u4", name: "Ashiq",      initials: "A", color: "#D97706", paid: 0,     balance: 0, role: "member" },
    ],
    expenses: [
      {
        id: "su-1",
        title: "Launch Cruise Package",
        amount: 14000,
        category: "transport",
        paidBy: "u1",
        splitIds: ["u1", "u2", "u3", "u4"],
        date: "Mar 9",
        dateIso: "2026-03-09",
        addedBy: "u1",
        addedAt: "Mar 9, 8:00 AM",
      },
      {
        id: "su-2",
        title: "Forest Guide & Entry Permit",
        amount: 4400,
        category: "activity",
        paidBy: "u2",
        splitIds: ["u1", "u2", "u3", "u4"],
        date: "Mar 8",
        dateIso: "2026-03-08",
        addedBy: "u2",
        addedAt: "Mar 8, 11:30 AM",
      },
    ],
  },
};
