import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { Card, Header, Screen, SectionTitle } from '@/components/sakhi-ui';
import { MiraColors } from '@/constants/theme';
import { loadNotifications, saveNotifications } from '@/services/notificationStorage';
import { SakhiNotification } from '@/types/notifications';

const filters = ['All', 'Unread'];

export default function NotificationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<SakhiNotification[]>([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    loadNotifications().then(setItems);
  }, []);

  const visible = useMemo(
    () => (filter === 'Unread' ? items.filter((item) => !item.read) : items),
    [filter, items]
  );

  const markRead = (id: string, actionUrl?: string) => {
    setItems((current) => {
      const next = current.map((item) => (item.id === id ? { ...item, read: true } : item));
      void saveNotifications(next);
      return next;
    });

    if (actionUrl) {
      router.push(actionUrl as any);
    }
  };

  const markAllRead = () => {
    setItems((current) => {
      const next = current.map((item) => ({ ...item, read: true }));
      void saveNotifications(next);
      return next;
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'campus':
        return '🏛️';
      case 'circle':
        return '💗';
      case 'event':
        return '🎉';
      case 'placement':
        return '💼';
      case 'wellness':
        return '🌸';
      default:
        return '✨';
    }
  };

  return (
    <Screen>
      <Header
        eyebrow="Updates & Alerts"
        title="Notification Center"
        subtitle="Stay updated on campus announcements, connections, and wellness nudges."
      />

      <View style={styles.topActionRow}>
        <View style={styles.filters}>
          {filters.map((item) => {
            const unreadCount = items.filter((n) => !n.read).length;
            return (
              <Pressable
                key={item}
                onPress={() => setFilter(item)}
                style={[styles.filter, filter === item && styles.filterOn]}
              >
                <Text style={[styles.filterText, filter === item && styles.filterTextOn]}>
                  {item}
                  {item === 'Unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {items.some((i) => !i.read) && (
          <Pressable onPress={markAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </Pressable>
        )}
      </View>

      <SectionTitle title={filter} action={`${visible.length} items`} />

      {visible.length === 0 ? (
        <Card style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Text style={styles.iconText}>✓</Text>
          </View>
          <Text style={styles.emptyTitle}>You are all caught up!</Text>
          <Text style={styles.emptyCopy}>
            New Sakhi, campus, Circle, event, and placement updates will appear here.
          </Text>
        </Card>
      ) : (
        visible.map((item) => (
          <Pressable key={item.id} onPress={() => markRead(item.id, item.actionUrl)}>
            <Card style={[styles.row, !item.read && styles.unread]}>
              <View style={styles.badge}>
                <Text style={styles.badgeEmoji}>{getCategoryIcon(item.category)}</Text>
              </View>
              <View style={styles.copy}>
                <View style={styles.rowTop}>
                  <Text style={styles.title}>{item.title}</Text>
                  {!item.read && <View style={styles.dot} />}
                </View>
                <Text style={styles.body}>{item.body}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.time}>{item.createdAt}</Text>
                  <Text style={styles.categoryBadge}>{item.category.toUpperCase()}</Text>
                </View>
              </View>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
  },
  filter: {
    borderWidth: 1,
    borderColor: MiraColors.line,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 7,
    backgroundColor: MiraColors.white,
  },
  filterOn: {
    backgroundColor: MiraColors.ink,
    borderColor: MiraColors.ink,
  },
  filterText: {
    color: MiraColors.muted,
    fontSize: 11,
    fontWeight: '800',
  },
  filterTextOn: {
    color: MiraColors.white,
  },
  markAllBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markAllText: {
    color: MiraColors.rose,
    fontSize: 11,
    fontWeight: '900',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: MiraColors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#4B8B78',
    fontSize: 20,
    fontWeight: '900',
  },
  emptyTitle: {
    color: MiraColors.ink,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 12,
  },
  emptyCopy: {
    color: MiraColors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 260,
    marginTop: 6,
  },
  row: {
    flexDirection: 'row',
    padding: 13,
    marginBottom: 8,
  },
  unread: {
    borderLeftWidth: 3,
    borderLeftColor: MiraColors.coral,
    backgroundColor: MiraColors.white,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: MiraColors.blush,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeEmoji: {
    fontSize: 16,
  },
  copy: {
    flex: 1,
    marginLeft: 10,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: MiraColors.ink,
    fontSize: 13,
    fontWeight: '900',
    flex: 1,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: MiraColors.coral,
  },
  body: {
    color: MiraColors.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  time: {
    color: MiraColors.muted,
    fontSize: 10,
  },
  categoryBadge: {
    color: MiraColors.rose,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

