"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const categories = [
  "Work",
  "Personal",
  "Meeting",
  "Social",
  "Health",
  "Errands",
  "Study",
  "Exercise",
  "Entertainment",
  "Other",
];

interface CategoryDropdownProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryDropdown({ selectedCategory, onCategoryChange }: CategoryDropdownProps) {
  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="text-sm font-medium text-white bg-slate-800 border-stone-800 w-32 rounded-lg"
          >
            {selectedCategory || 'Select Category'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-40 bg-stone-900 text-white rounded-lg shadow-lg border border-stone-800 mt-2 overflow-hidden">
          <DropdownMenuLabel className="text-md font-bold text-white px-4 py-2">
            Categories
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="border-stone-800" />
          {categories.map((category) => (
            <DropdownMenuItem
              key={category}
              onClick={() => onCategoryChange(category)}
              className="text-sm text-gray-300 hover:text-stone-100 hover:bg-stone-800 focus:text-stone-100 focus:bg-stone-800 focus:outline-none px-4 py-2"
            >
              {category}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

