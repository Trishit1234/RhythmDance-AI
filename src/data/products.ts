export type ProductSize = "XS" | "S" | "M" | "L" | "XL" | "XXL";

export type ProductCategory =
  | "Bharatanatyam"
  | "Kathak"
  | "Odissi"
  | "Kuchipudi"
  | "Accessories";

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: ProductCategory;
  sizes: ProductSize[];
  image: string;
  accent: string;
  badge?: string;
}

export const productSizes: ProductSize[] = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
];

export const products: Product[] = [
  {
    id: "bharatanatyam-costume",
    name: "Bharatanatyam Dance Costume",
    price: 2499,
    description:
      "Traditional stitched Bharatanatyam costume with pleated fan, dance belt and performance-ready detailing.",
    category: "Bharatanatyam",
    sizes: productSizes,
    image: "/products/bharatanatyam-costume.jpg",
    accent: "#B42318",
    badge: "CLASSICAL",
  },
  {
    id: "kathak-costume",
    name: "Kathak Dance Costume",
    price: 2299,
    description:
      "Elegant Kathak performance attire designed for comfortable movement during training and stage performances.",
    category: "Kathak",
    sizes: productSizes,
    image: "/products/kathak-costume.jpg",
    accent: "#8F1D3E",
    badge: "ACADEMY PICK",
  },
  {
    id: "odissi-costume",
    name: "Odissi Dance Costume",
    price: 2499,
    description:
      "Traditional Odissi-inspired costume with structured drape, fitted styling and heritage-inspired detailing.",
    category: "Odissi",
    sizes: productSizes,
    image: "/products/odissi-costume.jpg",
    accent: "#B45309",
    badge: "HERITAGE",
  },
];

export function getProduct(productId: string) {
  return products.find((product) => product.id === productId);
}