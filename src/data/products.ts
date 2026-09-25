export type ProductSize =
  | "XS"
  | "S"
  | "M"
  | "L"
  | "XL"
  | "XXL";

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
      "Traditional Bharatanatyam costume designed for academy training, rehearsals and stage performances.",
    category: "Bharatanatyam",
    sizes: productSizes,
    image: "/products/PRODUCT-1.JPEG",
    accent: "#B42318",
    badge: "CLASSICAL",
  },

  {
    id: "kathak-costume",
    name: "Kathak Dance Costume",
    price: 2700,
    description:
      "Elegant Kathak performance attire designed for comfortable movement during training and stage performances.",
    category: "Kathak",
    sizes: productSizes,
    image: "/products/PRODUCT-2.JPEG",
    accent: "#8F1D3E",
    badge: "ACADEMY PICK",
  },

  {
    id: "odissi-costume",
    name: "Odissi Dance Costume",
    price: 2600,
    description:
      "Traditional Odissi-inspired costume with graceful styling and performance-ready detailing.",
    category: "Odissi",
    sizes: productSizes,
    image: "/products/PRODUCT-1.JPEG",
    accent: "#B45309",
    badge: "HERITAGE",
  },

  {
    id: "kuchipudi-costume",
    name: "Kuchipudi Dance Costume",
    price: 2800,
    description:
      "Traditional Kuchipudi performance costume designed for comfortable movement, academy training and stage performances.",
    category: "Kuchipudi",
    sizes: productSizes,
    image: "/products/PRODUCT-1.JPEG",
    accent: "#7C3AED",
    badge: "TRADITIONAL",
  },
];

export function getProduct(productId: string) {
  return products.find(
    (product) => product.id === productId
  );
}