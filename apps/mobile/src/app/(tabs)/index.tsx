import Feather from '@expo/vector-icons/Feather';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CATALOG_PAGE_SIZE, getKhafifRegion, listProductCategories, listProducts, metadataText, type CatalogCategory, type CatalogProduct } from '@/api/catalog';
import { useLocale } from '@/features/settings/useLocale';
import { toAppError } from '@/api/errors';
import { useIsOnline } from '@/lib/network';
import { colors, radius, space } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Banner } from '@/ui/Banner';
import { EmptyState } from '@/ui/EmptyState';
import { ProductCard } from '@/ui/ProductCard';
import { RetryState } from '@/ui/RetryState';
import { Screen } from '@/ui/Screen';

const DEBOUNCE_MS = 400;

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { locale } = useLocale();
  const online = useIsOnline();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const regionQuery = useQuery({
    queryKey: ['catalog', 'region', 'ils'],
    queryFn: getKhafifRegion,
    staleTime: 24 * 60 * 60 * 1000,
    networkMode: 'offlineFirst',
  });
  const categoriesQuery = useQuery({
    queryKey: ['catalog', 'categories', locale],
    queryFn: listProductCategories,
    staleTime: 60 * 60 * 1000,
    networkMode: 'offlineFirst',
  });
  const regionId = regionQuery.data?.id ?? '';
  const productsQuery = useInfiniteQuery({
    queryKey: ['catalog', 'products', regionId, search, selectedCategory, locale],
    initialPageParam: 0,
    enabled: Boolean(regionId),
    queryFn: ({ pageParam }) =>
      listProducts({
        regionId,
        offset: pageParam,
        query: search,
        categoryId: selectedCategory ?? undefined,
        locale,
      }),
    getNextPageParam: (lastPage, pages) => {
      const nextOffset = pages.length * CATALOG_PAGE_SIZE;
      return nextOffset < lastPage.count ? nextOffset : undefined;
    },
    networkMode: 'offlineFirst',
    staleTime: 5 * 60 * 1000,
  });

  const products: CatalogProduct[] = productsQuery.data?.pages.flatMap((page) => page.products) ?? [];
  const categories: CatalogCategory[] = categoriesQuery.data ?? [];
  const isInitialLoading = !regionQuery.data && regionQuery.isPending || productsQuery.isLoading;
  const error = productsQuery.error ?? (regionQuery.isError ? regionQuery.error : null);

  return (
    <Screen>
      <FlatList
        data={products}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.productCell}>
            <ProductCard
              product={item}
              onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
              accessibilityLabel={`${locale === 'ar' ? metadataText(item.metadata, 'title_ar', item.title) : item.title}, ${t('home.openProduct')}`}
            />
          </View>
        )}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        onEndReached={() => {
          if (productsQuery.hasNextPage && !productsQuery.isFetchingNextPage) {
            void productsQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View style={styles.intro}>
              <AppText variant="caption" color="primary">{t('home.sampleNotice')}</AppText>
              <AppText variant="display">{t('home.title')}</AppText>
              <AppText color="muted">{t('app.tagline')}</AppText>
            </View>
            <View style={styles.searchBox}>
              <Feather name="search" size={19} color={colors.muted} />
              <TextInput
                accessibilityLabel={t('home.search')}
                placeholder={t('home.search')}
                placeholderTextColor={colors.muted}
                value={searchInput}
                onChangeText={setSearchInput}
                returnKeyType="search"
                style={styles.searchInput}
              />
              {searchInput ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('common.clearSearch')}
                  onPress={() => setSearchInput('')}
                  style={styles.clearSearch}
                >
                  <Feather name="x" size={18} color={colors.muted} />
                </Pressable>
              ) : null}
            </View>
            <AppText variant="heading" style={styles.categoryHeading}>{t('home.categories')}</AppText>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
              keyExtractor={(item) => item.id}
              data={[{ id: '', name: t('home.allCategories'), metadata: null }, ...categories]}
              renderItem={({ item }) => {
                const id = item.id || null;
                const selected = selectedCategory === id;
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ selected, checked: selected }}
                    accessibilityLabel={item.id && locale === 'ar' ? metadataText(item.metadata, 'name_ar', item.name) : item.name}
                    onPress={() => setSelectedCategory(id)}
                    style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                  >
                    <AppText variant="small" style={selected ? styles.categorySelectedText : undefined}>
                      {item.id && locale === 'ar' ? metadataText(item.metadata, 'name_ar', item.name) : item.name}
                    </AppText>
                  </Pressable>
                );
              }}
            />
            <View style={styles.resultsHeading}>
              <AppText variant="heading">{t('home.results')}</AppText>
              <AppText variant="caption" color="muted">{productsQuery.data?.pages[0]?.count ?? ''}</AppText>
            </View>
            {regionQuery.data === null ? (
              <EmptyState title={t('home.emptyRegion')} />
            ) : null}
            {!online && products.length > 0 ? <Banner kind="info" message={t('offline.bannerShort')} /> : null}
          </View>
        }
        ListEmptyComponent={
          isInitialLoading ? (
            <View style={styles.loading} accessibilityRole="progressbar" accessibilityLabel={t('home.loading')}>
              <ActivityIndicator color={colors.primary} size="large" />
              <AppText color="muted">{t('common.loading')}</AppText>
            </View>
          ) : error ? (
            <RetryState
              kind={toAppError(error).kind}
              retry={() => {
                void regionQuery.refetch();
                void categoriesQuery.refetch();
                void productsQuery.refetch();
              }}
              loading={regionQuery.isRefetching || productsQuery.isRefetching}
            />
          ) : (
            <EmptyState title={t('home.emptyTitle')} message={t('home.emptyMessage')} />
          )
        }
        ListFooterComponent={
          productsQuery.isFetchingNextPage ? (
            <ActivityIndicator color={colors.primary} style={styles.footer} />
          ) : productsQuery.isFetchNextPageError ? (
            <Pressable
              onPress={() => void productsQuery.fetchNextPage()}
              accessibilityRole="button"
              style={styles.loadMoreButton}
            >
              <AppText variant="small" color="primary">{t('home.loadError')}</AppText>
            </Pressable>
          ) : productsQuery.hasNextPage ? (
            <Pressable
              onPress={() => void productsQuery.fetchNextPage()}
              accessibilityRole="button"
              style={styles.loadMoreButton}
            >
              <AppText variant="small" color="primary">{t('home.loadMore')}</AppText>
            </Pressable>
          ) : <View style={styles.endSpacer} />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxxl },
  headerContent: { gap: space.lg, paddingTop: space.lg, paddingBottom: space.lg },
  intro: { gap: space.xs, paddingHorizontal: space.xs },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 52, paddingHorizontal: space.md, backgroundColor: colors.surface, borderColor: colors.surfaceAlt, borderWidth: 1, borderRadius: radius.lg },
  searchInput: { flex: 1, minWidth: 0, fontFamily: 'IBMPlexSansArabic_400Regular', fontSize: 16, color: colors.ink, paddingVertical: space.sm, textAlign: 'auto' },
  clearSearch: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  categoryHeading: { marginTop: space.xs },
  categoryList: { gap: space.sm, paddingEnd: space.lg },
  categoryChip: { minHeight: 44, minWidth: 44, justifyContent: 'center', paddingHorizontal: space.lg, borderWidth: 1, borderColor: colors.surfaceAlt, backgroundColor: colors.surface, borderRadius: radius.pill },
  categoryChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  categorySelectedText: { color: colors.surface },
  resultsHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.xs },
  productRow: { gap: space.md, marginBottom: space.md },
  productCell: { flex: 1, minWidth: 0 },
  loading: { alignItems: 'center', justifyContent: 'center', minHeight: 220, gap: space.md },
  footer: { margin: space.xl },
  loadMoreButton: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: space.lg },
  endSpacer: { height: space.xxl },
});
