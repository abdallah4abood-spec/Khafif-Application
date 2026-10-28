import { sdk } from '@/api/sdk';

export const CATALOG_PAGE_SIZE = 12;
const PRODUCT_LIST_FIELDS =
  '*variants.calculated_price,+variants.inventory_quantity,id,title,description,handle,thumbnail,metadata';
export const PRODUCT_DETAIL_FIELDS =
  '*variants.calculated_price,+variants.inventory_quantity,id,title,description,handle,thumbnail,metadata,*images,*options.values,*variants.options';

export type CatalogRegion = Awaited<ReturnType<typeof sdk.store.region.list>>['regions'][number];
export type CatalogCategory = Awaited<ReturnType<typeof sdk.store.category.list>>['product_categories'][number];
export type CatalogProduct = Awaited<ReturnType<typeof sdk.store.product.list>>['products'][number];
export type ProductDetail = Awaited<ReturnType<typeof sdk.store.product.retrieve>>['product'];

export async function getKhafifRegion(): Promise<CatalogRegion | null> {
  const { regions } = await sdk.store.region.list({
    currency_code: 'ils',
    limit: 10,
    fields: 'id,name,currency_code,countries.iso_2',
  });

  return regions[0] ?? null;
}

export async function listProductCategories(): Promise<CatalogCategory[]> {
  const { product_categories: categories } = await sdk.store.category.list({
    limit: 50,
    fields: 'id,name,handle,metadata',
  });

  return categories;
}

type ListProductsOptions = {
  regionId: string;
  offset: number;
  query: string;
  categoryId?: string;
  locale: 'ar' | 'en';
};

export async function listProducts({
  regionId,
  offset,
  query,
  categoryId,
  locale,
}: ListProductsOptions) {
  return sdk.store.product.list({
    region_id: regionId,
    limit: CATALOG_PAGE_SIZE,
    offset,
    q: query || undefined,
    category_id: categoryId ? [categoryId] : undefined,
    locale: locale === 'ar' ? 'ar' : 'en',
    fields: PRODUCT_LIST_FIELDS,
    order: '-created_at',
  });
}

export async function getProduct(productId: string, regionId: string, locale: 'ar' | 'en') {
  return sdk.store.product.retrieve(productId, {
    region_id: regionId,
    locale: locale === 'ar' ? 'ar' : 'en',
    fields: PRODUCT_DETAIL_FIELDS,
  });
}

export function metadataText(metadata: unknown, key: string, fallback: string): string {
  if (typeof metadata === 'object' && metadata !== null && key in metadata) {
    const value = (metadata as Record<string, unknown>)[key];
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }

  return fallback;
}
