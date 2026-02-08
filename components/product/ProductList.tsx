"use client";

import { ProductCard, type Product } from "./ProductCard";

interface ProductListProps {
  products: Product[];
  onClickTitle?: (id: string) => void;
}

export function ProductList({
  products,
  onClickTitle,
}: ProductListProps) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-4">
      {[...products].sort((a, b) => {
        const aHasTag = (a.tags?.length ?? 0) > 0 ? 1 : 0;
        const bHasTag = (b.tags?.length ?? 0) > 0 ? 1 : 0;
        return bHasTag - aHasTag;
      }).map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onClickTitle={onClickTitle}
        />
      ))}
    </div>
  );
}
