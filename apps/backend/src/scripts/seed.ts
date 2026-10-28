/**
 * Khafif sample-data seed. Re-runnable: every section checks for existing data first.
 *   npm run seed
 * All data is SAMPLE data (invented products/prices). Never present it as real inventory.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ExecArgs } from '@medusajs/framework/types'
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from '@medusajs/framework/utils'
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
  uploadFilesWorkflow,
} from '@medusajs/medusa/core-flows'

const CURRENCY = 'ils'
const COUNTRIES = ['ps']
const CHANNEL_NAME = 'Khafif Mobile'
const KEY_TITLE = 'Khafif Mobile App'

type Cat = { key: string; en: string; ar: string }
const CATEGORIES: Cat[] = [
  { key: 'pantry', en: 'Pantry & Oils', ar: 'مؤونة وزيوت' },
  { key: 'herbs', en: 'Herbs & Spices', ar: 'أعشاب وبهارات' },
  { key: 'sweets', en: 'Honey & Sweets', ar: 'عسل وحلويات' },
  { key: 'care', en: 'Soap & Care', ar: 'صابون وعناية' },
]

type Product = {
  slug: string
  cat: string
  en: string
  ar: string
  descEn: string
  descAr: string
  option: string
  optionAr: string
  variants: { label: string; price: number }[]
}
const PRODUCTS: Product[] = [
  { slug: 'olive-oil', cat: 'pantry', en: 'Extra Virgin Olive Oil', ar: 'زيت زيتون بكر ممتاز', descEn: 'Sample product: cold-extracted olive oil.', descAr: 'منتج تجريبي: زيت زيتون مستخلص على البارد.', option: 'Size', optionAr: 'الحجم', variants: [{ label: '250 ml', price: 35 }, { label: '500 ml', price: 60 }, { label: '1 L', price: 105 }] },
  { slug: 'tahini', cat: 'pantry', en: 'Sesame Tahini', ar: 'طحينة سمسم', descEn: 'Sample product: stone-ground sesame paste.', descAr: 'منتج تجريبي: معجون سمسم مطحون.', option: 'Size', optionAr: 'الحجم', variants: [{ label: '350 g', price: 22 }, { label: '700 g', price: 40 }] },
  { slug: 'pomegranate-molasses', cat: 'pantry', en: 'Pomegranate Molasses', ar: 'دبس رمان', descEn: 'Sample product: tangy pomegranate syrup.', descAr: 'منتج تجريبي: دبس رمان حامض.', option: 'Size', optionAr: 'الحجم', variants: [{ label: '300 ml', price: 28 }] },
  { slug: 'carob-molasses', cat: 'pantry', en: 'Carob Molasses', ar: 'دبس خروب', descEn: 'Sample product: sweet carob syrup.', descAr: 'منتج تجريبي: دبس خروب حلو.', option: 'Size', optionAr: 'الحجم', variants: [{ label: '300 ml', price: 26 }] },
  { slug: 'zaatar', cat: 'herbs', en: "Za'atar Blend", ar: 'زعتر مخلوط', descEn: 'Sample product: thyme, sesame and sumac blend.', descAr: 'منتج تجريبي: خلطة زعتر وسمسم وسماق.', option: 'Size', optionAr: 'الحجم', variants: [{ label: '100 g', price: 15 }, { label: '250 g', price: 33 }] },
  { slug: 'thyme', cat: 'herbs', en: 'Dried Thyme', ar: 'زعتر أخضر مجفف', descEn: 'Sample product: dried mountain thyme.', descAr: 'منتج تجريبي: زعتر جبلي مجفف.', option: 'Size', optionAr: 'الحجم', variants: [{ label: '50 g', price: 12 }, { label: '100 g', price: 21 }] },
  { slug: 'sumac', cat: 'herbs', en: 'Ground Sumac', ar: 'سماق مطحون', descEn: 'Sample product: tart ground sumac.', descAr: 'منتج تجريبي: سماق مطحون حامض.', option: 'Size', optionAr: 'الحجم', variants: [{ label: '100 g', price: 14 }] },
  { slug: 'sage', cat: 'herbs', en: 'Dried Sage', ar: 'مريمية مجففة', descEn: 'Sample product: dried sage leaves for tea.', descAr: 'منتج تجريبي: أوراق مريمية للشاي.', option: 'Size', optionAr: 'الحجم', variants: [{ label: '30 g', price: 10 }] },
  { slug: 'maqluba-spice', cat: 'herbs', en: 'Maqluba Spice Mix', ar: 'بهارات مقلوبة', descEn: 'Sample product: warm spice mix for rice dishes.', descAr: 'منتج تجريبي: خلطة بهارات لأطباق الأرز.', option: 'Size', optionAr: 'الحجم', variants: [{ label: '80 g', price: 13 }] },
  { slug: 'wildflower-honey', cat: 'sweets', en: 'Wildflower Honey', ar: 'عسل أزهار برية', descEn: 'Sample product: light wildflower honey.', descAr: 'منتج تجريبي: عسل أزهار خفيف.', option: 'Size', optionAr: 'الحجم', variants: [{ label: '250 g', price: 45 }, { label: '500 g', price: 80 }] },
  { slug: 'dates', cat: 'sweets', en: 'Medjool Dates', ar: 'تمر مجهول', descEn: 'Sample product: soft sweet dates.', descAr: 'منتج تجريبي: تمر طري حلو.', option: 'Size', optionAr: 'الحجم', variants: [{ label: '500 g', price: 38 }, { label: '1 kg', price: 70 }] },
  { slug: 'halawa', cat: 'sweets', en: 'Halawa', ar: 'حلاوة طحينية', descEn: 'Sample product: sesame halawa.', descAr: 'منتج تجريبي: حلاوة بالسمسم.', option: 'Size', optionAr: 'الحجم', variants: [{ label: '250 g', price: 18 }] },
  { slug: 'fig-jam', cat: 'sweets', en: 'Fig Jam', ar: 'مربى تين', descEn: 'Sample product: slow-cooked fig jam.', descAr: 'منتج تجريبي: مربى تين مطبوخ ببطء.', option: 'Size', optionAr: 'الحجم', variants: [{ label: '300 g', price: 24 }] },
  { slug: 'olive-soap', cat: 'care', en: 'Olive Oil Soap', ar: 'صابون زيت الزيتون', descEn: 'Sample product: traditional olive oil soap bar.', descAr: 'منتج تجريبي: قالب صابون تقليدي بزيت الزيتون.', option: 'Pack', optionAr: 'العبوة', variants: [{ label: '1 bar', price: 9 }, { label: '3 bars', price: 25 }] },
  { slug: 'lavender-soap', cat: 'care', en: 'Lavender Soap', ar: 'صابون اللافندر', descEn: 'Sample product: soap bar scented with lavender.', descAr: 'منتج تجريبي: صابون معطّر باللافندر.', option: 'Pack', optionAr: 'العبوة', variants: [{ label: '1 bar', price: 11 }] },
  { slug: 'laurel-soap', cat: 'care', en: 'Laurel Soap', ar: 'صابون الغار', descEn: 'Sample product: laurel berry oil soap bar.', descAr: 'منتج تجريبي: صابون بزيت الغار.', option: 'Pack', optionAr: 'العبوة', variants: [{ label: '1 bar', price: 14 }] },
]

export default async function seed({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const fulfillment = container.resolve(Modules.FULFILLMENT)

  // ---- Sales channel + publishable key + store -------------------------------------
  const { data: channels } = await query.graph({ entity: 'sales_channel', fields: ['id', 'name'], filters: { name: CHANNEL_NAME } })
  let channelId: string = channels[0]?.id
  if (!channelId) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: { salesChannelsData: [{ name: CHANNEL_NAME, description: 'Khafif mobile app (sample data)' }] },
    })
    channelId = result[0].id
    logger.info('Created sales channel')
  }
  const channel = { id: channelId }

  const { data: keys } = await query.graph({ entity: 'api_key', fields: ['id', 'token', 'title'], filters: { title: KEY_TITLE } })
  let publishableKey = keys[0]
  if (!publishableKey) {
    const { result } = await createApiKeysWorkflow(container).run({
      input: { api_keys: [{ title: KEY_TITLE, type: 'publishable', created_by: '' }] },
    })
    publishableKey = result[0] as typeof publishableKey
    await linkSalesChannelsToApiKeyWorkflow(container).run({ input: { id: publishableKey.id, add: [channel.id] } })
    logger.info('Created publishable API key')
  }

  const { data: stores } = await query.graph({ entity: 'store', fields: ['id', 'name'] })
  if (!stores.length) {
    await createStoresWorkflow(container).run({
      input: { stores: [{ name: 'Khafif', supported_currencies: [{ currency_code: CURRENCY, is_default: true }], default_sales_channel_id: channel.id }] },
    })
  } else {
    await updateStoresWorkflow(container).run({
      input: { selector: { id: stores[0].id }, update: { name: 'Khafif', supported_currencies: [{ currency_code: CURRENCY, is_default: true }], default_sales_channel_id: channel.id } },
    })
  }

  // ---- Region + tax ------------------------------------------------------------------
  const { data: regions } = await query.graph({ entity: 'region', fields: ['id', 'name'], filters: { currency_code: CURRENCY } })
  let regionId: string = regions[0]?.id
  if (!regionId) {
    const { result } = await createRegionsWorkflow(container).run({
      input: { regions: [{ name: 'Palestine', currency_code: CURRENCY, countries: COUNTRIES, payment_providers: ['pp_system_default'] }] },
    })
    regionId = result[0].id
    await createTaxRegionsWorkflow(container).run({ input: COUNTRIES.map((c) => ({ country_code: c, provider_id: 'tp_system' })) })
    logger.info('Created region + tax region')
  }
  const region = { id: regionId }

  // ---- Stock location + fulfillment + shipping options --------------------------------
  const { data: locations } = await query.graph({ entity: 'stock_location', fields: ['id', 'name'], filters: { name: 'Khafif Warehouse' } })
  let stockLocationId: string = locations[0]?.id
  if (!stockLocationId) {
    const { result } = await createStockLocationsWorkflow(container).run({
      input: { locations: [{ name: 'Khafif Warehouse', address: { city: 'Hebron', country_code: 'PS', address_1: 'Sample address' } }] },
    })
    stockLocationId = result[0].id
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: result[0].id },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: 'manual_manual' },
    })

    const { data: existingProfiles } = await query.graph({ entity: 'shipping_profile', fields: ['id'] })
    let profileId: string = existingProfiles[0]?.id
    if (!profileId) {
      const { result: created } = await createShippingProfilesWorkflow(container).run({
        input: { data: [{ name: 'Default Shipping Profile', type: 'default' }] },
      })
      profileId = created[0].id
    }
    const fulfillmentSet = await fulfillment.createFulfillmentSets({
      name: 'Khafif delivery',
      type: 'shipping',
      service_zones: [{ name: 'Palestine', geo_zones: COUNTRIES.map((c) => ({ country_code: c, type: 'country' as const })) }],
    })
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: result[0].id },
      [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
    })
    const rules = [
      { attribute: 'enabled_in_store', value: 'true', operator: 'eq' as const },
      { attribute: 'is_return', value: 'false', operator: 'eq' as const },
    ]
    await createShippingOptionsWorkflow(container).run({
      input: [
        { name: 'Standard delivery', price_type: 'flat', provider_id: 'manual_manual', service_zone_id: fulfillmentSet.service_zones[0].id, shipping_profile_id: profileId, type: { label: 'Standard', description: '2-3 days (sample).', code: 'standard' }, prices: [{ currency_code: CURRENCY, amount: 20 }, { region_id: region.id, amount: 20 }], rules },
        { name: 'Pickup', price_type: 'flat', provider_id: 'manual_manual', service_zone_id: fulfillmentSet.service_zones[0].id, shipping_profile_id: profileId, type: { label: 'Pickup', description: 'Collect from the sample warehouse.', code: 'pickup' }, prices: [{ currency_code: CURRENCY, amount: 0 }, { region_id: region.id, amount: 0 }], rules },
      ],
    })
    await linkSalesChannelsToStockLocationWorkflow(container).run({ input: { id: result[0].id, add: [channel.id] } })
    logger.info('Created stock location, fulfillment and shipping options')
  }
  const stockLocation = { id: stockLocationId }

  // ---- Categories -----------------------------------------------------------------------
  const { data: existingCats } = await query.graph({ entity: 'product_category', fields: ['id', 'handle'] })
  const catIds = new Map<string, string>(existingCats.map((c) => [c.handle as string, c.id as string]))
  const missingCats = CATEGORIES.filter((c) => !catIds.has(c.key))
  if (missingCats.length) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: { product_categories: missingCats.map((c) => ({ name: c.en, handle: c.key, is_active: true, metadata: { name_ar: c.ar } })) },
    })
    result.forEach((c) => catIds.set(c.handle, c.id))
    logger.info(`Created ${result.length} categories`)
  }

  // ---- Products -------------------------------------------------------------------------
  const { data: existingProducts } = await query.graph({ entity: 'product', fields: ['handle'] })
  const have = new Set(existingProducts.map((p) => p.handle as string))
  const todo = PRODUCTS.filter((p) => !have.has(p.slug))
  if (todo.length) {
    const { data: profiles } = await query.graph({ entity: 'shipping_profile', fields: ['id'] })
    const uploaded = await uploadFilesWorkflow(container).run({
      input: {
        files: todo.map((p) => ({
          filename: `${p.slug}.jpg`,
          mimeType: 'image/jpeg',
          content: readFileSync(join(process.cwd(), 'seed-assets', 'images', `${p.slug}.jpg`)).toString('base64'),
          access: 'public' as const,
        })),
      },
    })
    const urlBySlug = new Map(todo.map((p, i) => [p.slug, uploaded.result[i].url]))

    await createProductsWorkflow(container).run({
      input: {
        products: todo.map((p) => ({
          title: p.en,
          handle: p.slug,
          description: p.descEn,
          status: ProductStatus.PUBLISHED,
          category_ids: [catIds.get(p.cat)!],
          shipping_profile_id: profiles[0].id,
          thumbnail: urlBySlug.get(p.slug),
          images: [{ url: urlBySlug.get(p.slug)! }],
          options: [{ title: p.option, values: p.variants.map((v) => v.label) }],
          variants: p.variants.map((v, i) => ({
            title: v.label,
            sku: `KHF-${p.slug.toUpperCase()}-${i + 1}`,
            manage_inventory: true,
            options: { [p.option]: v.label },
            prices: [{ currency_code: CURRENCY, amount: v.price }],
          })),
          sales_channels: [{ id: channel.id }],
          metadata: { title_ar: p.ar, description_ar: p.descAr, option_ar: p.optionAr, sample_data: true },
        })),
      },
    })
    logger.info(`Created ${todo.length} products`)
  }

  // ---- Inventory levels (only for items that have none) -----------------------------------
  const { data: items } = await query.graph({ entity: 'inventory_item', fields: ['id', 'location_levels.id'] })
  const needLevels = items.filter((i) => !i.location_levels?.length)
  if (needLevels.length) {
    await createInventoryLevelsWorkflow(container).run({
      input: { inventory_levels: needLevels.map((i) => ({ location_id: stockLocation.id, inventory_item_id: i.id as string, stocked_quantity: 100 })) },
    })
    logger.info(`Created inventory levels for ${needLevels.length} items`)
  }

  logger.info('Seed finished.')
  logger.info(`PUBLISHABLE KEY (put in apps/mobile/.env): ${publishableKey.token}`)
}
