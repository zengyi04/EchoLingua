import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { WORLD_LANGUAGES } from '../constants/languages';

const AUDIENCE_FILTERS = ['all', 'adult', 'child'];

const LOCALIZED_CONTENT = {
  mandarin: {
    titleBookAdult: '中文家庭长篇小说',
    titleBookChild: '中文儿童故事书',
    pages: [
      { text: '第一章：清晨的村庄。长者在晨光中呼唤孩子，用母语讲述祖先的故事。', translation: 'Chapter 1: Morning village and elder storytelling.' },
      { text: '第二章：河边小路。家人一边行走，一边用中文说出植物、鸟类和工具的名字。', translation: 'Chapter 2: River path vocabulary learning.' },
      { text: '第三章：故事围圈。祖父母分享古老谚语，孩子们一页一页记录下来。', translation: 'Chapter 3: Proverbs and oral history circle.' },
      { text: '第四章：风雨考验。突如其来的暴雨让大家学会在困难中用语言互相帮助。', translation: 'Chapter 4: Storm challenge and communication.' },
      { text: '第五章：庆典之夜。全村举行朗读会，青年与长者共同表演对白。', translation: 'Chapter 5: Community reading celebration.' },
      { text: '第六章：新的守护者。孩子与成人一起录下声音，让语言继续传承。', translation: 'Chapter 6: Next generation language keepers.' },
    ],
  },
  malay: {
    titleBookAdult: 'Novel Keluarga Bahasa Melayu',
    titleBookChild: 'Buku Cerita Kanak-kanak Bahasa Melayu',
    pages: [
      { text: 'Bab 1: Pagi di kampung. Warga emas memulakan cerita warisan kepada keluarga.', translation: 'Chapter 1: Village morning and heritage storytelling.' },
      { text: 'Bab 2: Laluan sungai. Ahli keluarga menyebut kosa kata alam ketika berjalan bersama.', translation: 'Chapter 2: Nature vocabulary by the river.' },
      { text: 'Bab 3: Bulatan cerita. Peribahasa lama dicatat untuk generasi baharu.', translation: 'Chapter 3: Recording traditional proverbs.' },
      { text: 'Bab 4: Ujian ribut. Komuniti berkomunikasi dan bekerjasama ketika cuaca berubah.', translation: 'Chapter 4: Community communication in challenge.' },
      { text: 'Bab 5: Malam bacaan. Dialog dipersembahkan dengan lagu dan irama tradisi.', translation: 'Chapter 5: Reading night with performance.' },
      { text: 'Bab 6: Penjaga baharu. Suara dirakam supaya bahasa terus hidup setiap hari.', translation: 'Chapter 6: New keepers continue daily language use.' },
    ],
  },
  iban: {
    titleBookAdult: 'Bup Panjai Iban',
    titleBookChild: 'Bup Cerita Anak Iban',
    pages: [
      { text: 'Penyadi 1: Pagi ba kampung. Apai enggau indai berandau pasal adat lama.', translation: 'Chapter 1: Morning village oral tradition.' },
      { text: 'Penyadi 2: Jalai sungai. Sida sebilik nyebut nama kayu enggau burung.', translation: 'Chapter 2: River path vocabulary.' },
      { text: 'Penyadi 3: Raban cerita. Nini ngajar jaku pansut ngena peribasa Iban.', translation: 'Chapter 3: Grandparent proverb lessons.' },
      { text: 'Penyadi 4: Ujan besai datai. Sida bepandai bejaku ngambika semina selamat.', translation: 'Chapter 4: Communication during storm.' },
      { text: 'Penyadi 5: Malam gawai baca. Sida mamerka cerita enggau lagu tradisi.', translation: 'Chapter 5: Reading celebration.' },
      { text: 'Penyadi 6: Penyangga baru. Suara direkod ngambika jaku Iban idup.', translation: 'Chapter 6: New language keepers.' },
    ],
  },
};

const buildPages = (languageId, languageLabel, audience, styleLabel) => {
  const localized = LOCALIZED_CONTENT[languageId];
  if (localized) {
    return localized.pages;
  }

  const audienceLabel = audience === 'adult' ? 'adult readers' : 'young readers';
  return [
    { text: `Chapter 1 - Dawn in the village. This ${styleLabel.toLowerCase()} is prepared for ${audienceLabel} in ${languageLabel}.`, translation: `Opening chapter in ${languageLabel}.` },
    { text: `Chapter 2 - River learning. Families practice daily words and expressions in ${languageLabel}.`, translation: `Community vocabulary chapter.` },
    { text: `Chapter 3 - Memory circle. Elders narrate oral history and learners repeat in ${languageLabel}.`, translation: `Oral history learning chapter.` },
    { text: `Chapter 4 - Challenge. The family solves problems through respectful dialogue in ${languageLabel}.`, translation: `Communication challenge chapter.` },
    { text: `Chapter 5 - Celebration. Community reading night showcases songs and voices in ${languageLabel}.`, translation: `Celebration chapter.` },
    { text: `Chapter 6 - Continuation. New keepers record voices so ${languageLabel} stays alive.`, translation: `Closing chapter.` },
  ];
};

const STORY_FORMATS = [
  { key: 'storybook', label: 'Storybook' },
  { key: 'long-novel', label: 'Long-form Novel' },
];

const SAMPLE_STORIES = WORLD_LANGUAGES.flatMap((language) => {
  return STORY_FORMATS.flatMap((format) => {
    return ['adult', 'child'].map((audience) => {
      const pages = buildPages(language.id, language.label, audience, format.label);
      const localized = LOCALIZED_CONTENT[language.id];
      return {
        id: `fs-${language.id}-${format.key}-${audience}`,
        title:
          localized
            ? audience === 'adult'
              ? localized.titleBookAdult
              : localized.titleBookChild
            : format.key === 'long-novel'
              ? `${language.label} ${audience === 'adult' ? 'Long Novel' : 'Junior Novel'}`
              : `${language.label} ${audience === 'adult' ? 'Family Storybook' : 'Child Storybook'}`,
        language: language.label,
        languageId: language.id,
        audience,
        format: format.label,
        description: `Extended ${format.label.toLowerCase()} with multiple pages for ${audience} learners in ${language.label}.`,
        pages,
        transcript: pages.map((page) => page.text).join('\n\n'),
      };
    });
  });
});

export default function FamilyStoryTimeScreen({ navigation, route }) {
  const { theme } = useTheme();
  const activeAccount = route?.params?.activeAccount || null;
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const languageOptions = useMemo(() => {
    return ['all', ...WORLD_LANGUAGES.map((lang) => lang.id)];
  }, []);

  const visibleStories = useMemo(() => {
    return SAMPLE_STORIES.filter((story) => {
      const audienceMatch = audienceFilter === 'all' || story.audience === audienceFilter;
      const languageMatch = languageFilter === 'all' || story.languageId === languageFilter;
      const searchMatch =
        !searchQuery.trim() ||
        story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.language.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.format.toLowerCase().includes(searchQuery.toLowerCase());
      return audienceMatch && languageMatch && searchMatch;
    });
  }, [audienceFilter, languageFilter, searchQuery]);

  const openStory = (story) => {
    navigation.navigate('Story', {
      storyId: story.id,
      story: {
        ...story,
        sentByLabel: activeAccount
          ? `Selected by ${activeAccount.name} (${activeAccount.role})`
          : 'Selected in Family Story Time',
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}> 
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}> 
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Family Story Time</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Choose audience, language, and story format</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeAccount && (
          <View style={[styles.activeBanner, { backgroundColor: theme.surfaceVariant }]}> 
            <Text style={[styles.activeBannerText, { color: theme.text }]}>
              Current learner: {activeAccount.avatar} {activeAccount.name} ({activeAccount.role})
            </Text>
          </View>
        )}

        <Text style={[styles.filterTitle, { color: theme.text }]}>Audience</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {AUDIENCE_FILTERS.map((item) => {
            const selected = audienceFilter === item;
            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: selected ? theme.primary : theme.surface,
                    borderColor: selected ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setAudienceFilter(item)}
              >
                <Text style={[styles.filterChipText, { color: selected ? theme.surface : theme.text }]}>
                  {item === 'all' ? 'All' : item.charAt(0).toUpperCase() + item.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={[styles.filterTitle, { color: theme.text }]}>Language</Text>
        <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
          <Ionicons name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search stories, language, format"
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {languageOptions.map((item) => {
            const selected = languageFilter === item;
            const languageLabel =
              item === 'all'
                ? 'All Languages'
                : WORLD_LANGUAGES.find((lang) => lang.id === item)?.label || item;
            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: selected ? theme.secondary : theme.surface,
                    borderColor: selected ? theme.secondary : theme.border,
                  },
                ]}
                onPress={() => setLanguageFilter(item)}
              >
                <Text style={[styles.filterChipText, { color: selected ? theme.surface : theme.text }]}>
                  {languageLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={[styles.filterTitle, { color: theme.text }]}>Sample Stories</Text>
        {visibleStories.map((story) => (
          <TouchableOpacity
            key={story.id}
            style={[styles.storyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => openStory(story)}
          >
            <View style={styles.storyHeaderRow}>
              <Text style={[styles.storyTitle, { color: theme.text }]}>{story.title}</Text>
              <Ionicons name="play-circle" size={24} color={theme.primary} />
            </View>
            <Text style={[styles.storyMeta, { color: theme.textSecondary }]}>
              {story.language} • {story.format} • {story.audience.toUpperCase()} • {story.pages.length} pages
            </Text>
            <Text style={[styles.storyDescription, { color: theme.textSecondary }]} numberOfLines={3}>
              {story.description}
            </Text>
          </TouchableOpacity>
        ))}

        {visibleStories.length === 0 && (
          <View style={[styles.emptyState, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
            <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>No sample stories for this filter combination yet.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
  },
  headerTextWrap: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  content: { padding: SPACING.l, paddingBottom: SPACING.xl },
  activeBanner: {
    borderRadius: 12,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    marginBottom: SPACING.m,
  },
  activeBannerText: { fontSize: 12, fontWeight: '600' },
  filterTitle: { fontSize: 15, fontWeight: '700', marginBottom: SPACING.s, marginTop: SPACING.s },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: SPACING.s,
    marginBottom: SPACING.s,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: SPACING.s,
    marginLeft: SPACING.xs,
  },
  filterRow: { gap: SPACING.s, paddingBottom: SPACING.xs },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.xs,
  },
  filterChipText: { fontSize: 12, fontWeight: '700' },
  storyCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: SPACING.m,
    marginBottom: SPACING.s,
    ...SHADOWS.small,
  },
  storyHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: SPACING.s },
  storyTitle: { flex: 1, fontSize: 16, fontWeight: '700' },
  storyMeta: { fontSize: 12, marginTop: 4 },
  storyDescription: { fontSize: 13, marginTop: 8, lineHeight: 18 },
  emptyState: {
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.m,
    marginTop: SPACING.m,
  },
  emptyStateText: { fontSize: 13 },
});
