import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const STATS = [
  { id: '1', title: 'Total Recordings', value: '1,247', icon: 'mic', color: COLORS.primary, change: '+15%' },
  { id: '2', title: 'Active Learners', value: '3,842', icon: 'people', color: COLORS.success, change: '+8%' },
  { id: '3', title: 'Stories Created', value: '156', icon: 'book', color: COLORS.secondary, change: '+23%' },
  { id: '4', title: 'Words Documented', value: '4,521', icon: 'text', color: COLORS.accent, change: '+12%' },
];

const CHART_DATA = [
  { month: 'Jan', value: 65, label: '65' },
  { month: 'Feb', value: 82, label: '82' },
  { month: 'Mar', value: 45, label: '45' },
  { month: 'Apr', value: 93, label: '93' },
  { month: 'May', value: 78, label: '78' },
  { month: 'Jun', value: 100, label: '100' },
];

const LEADERBOARD = [
  { id: '1', rank: 1, name: 'Sarah Iban', avatar: 'SI', points: 2450, contributions: 87, badge: 'Elder' },
  { id: '2', rank: 2, name: 'Michael Dayak', avatar: 'MD', points: 2180, contributions: 76, badge: 'Elder' },
  { id: '3', rank: 3, name: 'Grace Murut', avatar: 'GM', points: 1950, contributions: 64, badge: 'Learner' },
  { id: '4', rank: 4, name: 'John Lee', avatar: 'JL', points: 1720, contributions: 58, badge: 'Learner' },
  { id: '5', rank: 5, name: 'Maria Kadazan', avatar: 'MK', points: 1580, contributions: 52, badge: 'Elder' },
  { id: '6', rank: 6, name: 'David Wong', avatar: 'DW', points: 1340, contributions: 45, badge: 'Learner' },
  { id: '7', rank: 7, name: 'Lisa Chen', avatar: 'LC', points: 1210, contributions: 41, badge: 'Learner' },
  { id: '8', rank: 8, name: 'Ahmad Bidayuh', avatar: 'AB', points: 1085, contributions: 38, badge: 'Elder' },
];

const SIDEBAR_ITEMS = [
  { id: 'overview', label: 'Overview', icon: 'grid' },
  { id: 'analytics', label: 'Analytics', icon: 'bar-chart' },
  { id: 'contributors', label: 'Contributors', icon: 'people' },
  { id: 'insights', label: 'Insights', icon: 'bulb' },
];

export default function LanguageVitalityDashboard() {
  const [selectedView, setSelectedView] = useState('overview');

  const maxValue = Math.max(...CHART_DATA.map(d => d.value));

  const renderStatCard = ({ item }) => (
    <View style={[styles.statCard, { borderLeftColor: item.color }]}>
      <View style={styles.statHeader}>
        <View style={[styles.statIconContainer, { backgroundColor: item.color + '20' }]}>
          <Ionicons name={item.icon} size={24} color={item.color} />
        </View>
        <View style={[styles.changeBadge, item.change.includes('+') && styles.changeBadgePositive]}>
          <Ionicons
            name={item.change.includes('+') ? 'trending-up' : 'trending-down'}
            size={12}
            color={item.change.includes('+') ? COLORS.success : COLORS.error}
          />
          <Text
            style={[
              styles.changeText,
              item.change.includes('+') ? styles.changeTextPositive : styles.changeTextNegative,
            ]}
          >
            {item.change}
          </Text>
        </View>
      </View>
      <Text style={styles.statValue}>{item.value}</Text>
      <Text style={styles.statTitle}>{item.title}</Text>
    </View>
  );

  const renderLeaderboardItem = ({ item }) => {
    let rankStyle = {};
    if (item.rank === 1) rankStyle = styles.rankGold;
    else if (item.rank === 2) rankStyle = styles.rankSilver;
    else if (item.rank === 3) rankStyle = styles.rankBronze;

    return (
      <View style={styles.leaderboardItem}>
        <View style={styles.leaderboardLeft}>
          <View style={[styles.rankBadge, rankStyle]}>
            <Text style={styles.rankText}>#{item.rank}</Text>
          </View>
          <View style={styles.leaderboardAvatar}>
            <Text style={styles.avatarText}>{item.avatar}</Text>
          </View>
          <View style={styles.leaderboardInfo}>
            <Text style={styles.leaderboardName}>{item.name}</Text>
            <View style={styles.leaderboardMeta}>
              <View style={[styles.badgeTag, item.badge === 'Elder' && styles.badgeTagElder]}>
                <Text style={styles.badgeTagText}>{item.badge}</Text>
              </View>
              <Text style={styles.contributionsText}>{item.contributions} contributions</Text>
            </View>
          </View>
        </View>
        <View style={styles.leaderboardRight}>
          <Text style={styles.pointsText}>{item.points}</Text>
          <Text style={styles.pointsLabel}>pts</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Language Vitality</Text>
        <Text style={styles.headerSubtitle}>Track community impact and growth</Text>
      </View>

      <View style={styles.mainContent}>
        {/* Sidebar Navigation */}
        <View style={styles.sidebar}>
          {SIDEBAR_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.sidebarItem,
                selectedView === item.id && styles.sidebarItemActive,
              ]}
              onPress={() => {
                console.log(`📊 View: ${item.label} - Sound: tap`);
                setSelectedView(item.id);
              }}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={selectedView === item.id ? COLORS.primary : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.sidebarLabel,
                  selectedView === item.id && styles.sidebarLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Main Content Area */}
        <ScrollView style={styles.contentArea} showsVerticalScrollIndicator={false}>
          {/* Statistics Cards */}
          <View style={styles.statsSection}>
            <FlatList
              data={STATS}
              renderItem={renderStatCard}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.statsRow}
            />
          </View>

          {/* Chart Section */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartTitle}>Monthly Activity</Text>
                <Text style={styles.chartSubtitle}>New contributions per month</Text>
              </View>
              <TouchableOpacity style={styles.chartFilterButton}>
                <Text style={styles.chartFilterText}>2026</Text>
                <Ionicons name="chevron-down" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.chart}>
              <View style={styles.chartYAxis}>
                <Text style={styles.yAxisLabel}>100</Text>
                <Text style={styles.yAxisLabel}>75</Text>
                <Text style={styles.yAxisLabel}>50</Text>
                <Text style={styles.yAxisLabel}>25</Text>
                <Text style={styles.yAxisLabel}>0</Text>
              </View>

              <View style={styles.chartContent}>
                {/* Grid Lines */}
                <View style={styles.gridLines}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <View key={i} style={styles.gridLine} />
                  ))}
                </View>

                {/* Bars */}
                <View style={styles.barsContainer}>
                  {CHART_DATA.map((data, index) => (
                    <View key={index} style={styles.barWrapper}>
                      <View style={styles.barColumn}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: `${(data.value / maxValue) * 100}%`,
                              backgroundColor:
                                data.value === maxValue ? COLORS.primary : COLORS.primary + '60',
                            },
                          ]}
                        >
                          <Text style={styles.barValue}>{data.label}</Text>
                        </View>
                      </View>
                      <Text style={styles.barLabel}>{data.month}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Leaderboard Section */}
          <View style={styles.leaderboardCard}>
            <View style={styles.leaderboardHeader}>
              <View style={styles.leaderboardHeaderLeft}>
                <MaterialCommunityIcons name="trophy" size={24} color={COLORS.accent} />
                <Text style={styles.leaderboardTitle}>Top Contributors</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={LEADERBOARD}
              renderItem={renderLeaderboardItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>

          {/* Insights Section */}
          <View style={styles.insightsSection}>
            <View style={styles.insightCard}>
              <View style={styles.insightIcon}>
                <MaterialCommunityIcons name="chart-line" size={32} color={COLORS.success} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Growing Community</Text>
                <Text style={styles.insightText}>
                  +342 new learners joined this month, marking a 23% increase
                </Text>
              </View>
            </View>

            <View style={styles.insightCard}>
              <View style={styles.insightIcon}>
                <MaterialCommunityIcons name="fire" size={32} color={COLORS.error} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Most Active Day</Text>
                <Text style={styles.insightText}>
                  Sundays see the highest engagement with 45% more contributions
                </Text>
              </View>
            </View>

            <View style={styles.insightCard}>
              <View style={styles.insightIcon}>
                <MaterialCommunityIcons name="star" size={32} color={COLORS.accent} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Quality Content</Text>
                <Text style={styles.insightText}>
                  87% approval rate for submissions with rich cultural context
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.l,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.small,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 80,
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.m,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  sidebarItem: {
    alignItems: 'center',
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.s,
    marginBottom: SPACING.s,
  },
  sidebarItemActive: {
    backgroundColor: COLORS.primary + '10',
    borderRightWidth: 3,
    borderRightColor: COLORS.primary,
  },
  sidebarLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  sidebarLabelActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  contentArea: {
    flex: 1,
  },
  statsSection: {
    padding: SPACING.m,
  },
  statsRow: {
    justifyContent: 'space-between',
    marginBottom: SPACING.m,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.m,
    padding: SPACING.m,
    marginHorizontal: 4,
    borderLeftWidth: 4,
    ...SHADOWS.small,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.s,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  changeBadgePositive: {
    backgroundColor: COLORS.success + '20',
  },
  changeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  changeTextPositive: {
    color: COLORS.success,
  },
  changeTextNegative: {
    color: COLORS.error,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  chartCard: {
    backgroundColor: COLORS.surface,
    margin: SPACING.m,
    marginTop: 0,
    borderRadius: SPACING.m,
    padding: SPACING.m,
    ...SHADOWS.small,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.l,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  chartSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  chartFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderRadius: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chartFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  chart: {
    flexDirection: 'row',
    height: 220,
  },
  chartYAxis: {
    width: 30,
    justifyContent: 'space-between',
    paddingRight: 8,
    paddingVertical: 4,
  },
  yAxisLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  chartContent: {
    flex: 1,
    position: 'relative',
  },
  gridLines: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  gridLine: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  barColumn: {
    width: '80%',
    height: 180,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
    minHeight: 20,
  },
  barValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  barLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  leaderboardCard: {
    backgroundColor: COLORS.surface,
    margin: SPACING.m,
    marginTop: 0,
    borderRadius: SPACING.m,
    padding: SPACING.m,
    ...SHADOWS.small,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.m,
    paddingBottom: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  leaderboardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  leaderboardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.m,
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.m,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankGold: {
    backgroundColor: '#FFD700',
  },
  rankSilver: {
    backgroundColor: '#C0C0C0',
  },
  rankBronze: {
    backgroundColor: '#CD7F32',
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  leaderboardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  leaderboardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  badgeTag: {
    backgroundColor: COLORS.accent + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeTagElder: {
    backgroundColor: COLORS.secondary + '20',
  },
  badgeTagText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  contributionsText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  leaderboardRight: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  pointsLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  insightsSection: {
    padding: SPACING.m,
    paddingTop: 0,
    gap: SPACING.m,
    marginBottom: SPACING.l,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.m,
    padding: SPACING.m,
    gap: SPACING.m,
    ...SHADOWS.small,
  },
  insightIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  insightText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
