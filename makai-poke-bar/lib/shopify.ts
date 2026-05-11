const DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!;
const TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN!;

export type CartLine = {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    priceV2: { amount: string; currencyCode: string };
    product: { title: string };
  };
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  lines: CartLine[];
  totalAmount: string;
  currencyCode: string;
};

const CART_FRAGMENT = `
  fragment CartFields on Cart {
    id
    checkoutUrl
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          merchandise {
            ... on ProductVariant {
              id
              title
              priceV2 { amount currencyCode }
              product { title }
            }
          }
        }
      }
    }
    cost {
      totalAmount { amount currencyCode }
    }
  }
`;

type RawCart = {
  id: string;
  checkoutUrl: string;
  lines: { edges: { node: CartLine }[] };
  cost: { totalAmount: { amount: string; currencyCode: string } };
};

async function shopifyFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://${DOMAIN}/api/2024-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data as T;
}

function normalizeCart(raw: RawCart): Cart {
  return {
    id: raw.id,
    checkoutUrl: raw.checkoutUrl,
    lines: raw.lines.edges.map(({ node }) => node),
    totalAmount: raw.cost.totalAmount.amount,
    currencyCode: raw.cost.totalAmount.currencyCode,
  };
}

export async function createCart(): Promise<Cart> {
  const data = await shopifyFetch<{ cartCreate: { cart: RawCart } }>(`
    mutation { cartCreate { cart { ...CartFields } } }
    ${CART_FRAGMENT}
  `);
  return normalizeCart(data.cartCreate.cart);
}

export async function getCart(cartId: string): Promise<Cart> {
  const data = await shopifyFetch<{ cart: RawCart }>(`
    query GetCart($cartId: ID!) { cart(id: $cartId) { ...CartFields } }
    ${CART_FRAGMENT}
  `, { cartId });
  return normalizeCart(data.cart);
}

export async function addCartLines(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const data = await shopifyFetch<{ cartLinesAdd: { cart: RawCart } }>(`
    mutation AddLines($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ...CartFields } }
    }
    ${CART_FRAGMENT}
  `, { cartId, lines });
  return normalizeCart(data.cartLinesAdd.cart);
}

export async function updateCartLines(
  cartId: string,
  lines: { id: string; quantity: number }[]
): Promise<Cart> {
  const data = await shopifyFetch<{ cartLinesUpdate: { cart: RawCart } }>(`
    mutation UpdateLines($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ...CartFields } }
    }
    ${CART_FRAGMENT}
  `, { cartId, lines });
  return normalizeCart(data.cartLinesUpdate.cart);
}

export async function removeCartLines(cartId: string, lineIds: string[]): Promise<Cart> {
  const data = await shopifyFetch<{ cartLinesRemove: { cart: RawCart } }>(`
    mutation RemoveLines($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ...CartFields } }
    }
    ${CART_FRAGMENT}
  `, { cartId, lineIds });
  return normalizeCart(data.cartLinesRemove.cart);
}
