import React from "react";
import { IconUtensils, IconBed, IconCar, IconStar, IconDots } from "../components/shared/icons";
import type { Expense } from "../domain/types";

export const CATEGORY_META: Record<
  Expense["category"],
  { icon: React.ReactNode; label: string; bg: string; fg: string }
> = {
  food:      { icon: <IconUtensils size={14} />, label: "Food",      bg: "#FFF7ED", fg: "#C2410C" },
  lodging:   { icon: <IconBed      size={14} />, label: "Lodging",   bg: "#F0F9FF", fg: "#0369A1" },
  transport: { icon: <IconCar      size={14} />, label: "Transport", bg: "#F5F3FF", fg: "#6D28D9" },
  activity:  { icon: <IconStar     size={14} />, label: "Activity",  bg: "#FFF1F2", fg: "#BE123C" },
  other:     { icon: <IconDots     size={14} />, label: "Other",     bg: "#F8FAFC", fg: "#475569" },
};

export default CATEGORY_META;
