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
    <div role="list" className="divide-y divide-zinc-100">
      {products.map((product) => (
        <div role="listitem" key={product.id}>
          <ProductCard
            product={product}
            onClickTitle={onClickTitle}
          />
        </div>
      ))}
    </div>
  );
}
