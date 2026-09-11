export type ProductSize = "S" | "M" | "L" | "XL" | "XXL";

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  sizes: ProductSize[];
  image: string;
  accent: string;
  badge?: string;
}

export const productSizes: ProductSize[] = [
  "S",
  "M",
  "L",
  "XL",
  "XXL",
];

export const products: Product[] = [
  {
    id: "rhythm-classic-tee",
    name: "Rhythm Classic Tee",
    price: 799,
    description:
      "A clean everyday tee inspired by the rhythm, movement and spirit of Indian dance.",
    sizes: productSizes,
    image: "/products/rhythm-classic-tee.png",
    accent: "#B42318",
    badge: "BESTSELLER",
  },

  {
    id: "india-in-rhythm-tee",
    name: "India in Rhythm Tee",
    price: 899,
    description:
      "A bold heritage-inspired design celebrating India's many traditions through one rhythm.",
    sizes: productSizes,
    image: "/products/india-in-rhythm-tee.png",
    accent: "#D65A1F",
    badge: "NEW",
  },

  {
    id: "rhythm-heritage-tee",
    name: "Rhythm Heritage Tee",
    price: 999,
    description:
      "A premium heritage tee created for learners, performers and lovers of Indian culture.",
    sizes: productSizes,
    image: "/products/rhythm-heritage-tee.png",
    accent: "#111111",
    badge: "PREMIUM",
  },
];

export function getProduct(productId: string) {
  return products.find((product) => product.id === productId);
}