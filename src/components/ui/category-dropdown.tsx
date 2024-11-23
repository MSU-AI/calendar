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
            className="text-sm font-medium text-white bg-slate-800 border-stone-800 w-40 rounded-md hover:bg-stone-700"
          >
            {selectedCategory || 'Select Category'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-slate-800 text-white rounded-md shadow-lg border border-gray-700 mt-2 p-4 w-64">
         
          {/*<DropdownMenuLabel className="text-sm font-bold text-gray-400 px-3 py-2">
            Categories
          </DropdownMenuLabel>*/}
          <DropdownMenuSeparator className="border-gray-700" />
          {categories.map((category) => (
            <DropdownMenuItem
              key={category}
              onClick={() => onCategoryChange(category)}
              className="px-4 py-2 text-sm text-gray-300 bg-slate-700 border border-gray-600 rounded-full hover:bg-blue-500 hover:text-white focus:bg-blue-500 focus:text-white focus:outline-none transition"
            >
              {category}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

