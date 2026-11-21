import { useState } from 'react';
import { Pressable, Switch, Text, View, StyleSheet } from 'react-native';

import { Card, Header, Screen, SectionTitle } from '@/components/sakhi-ui';
import { MiraColors } from '@/constants/theme';
import { useCampus } from '@/hooks/use-campus';

export default function SafetyScreen() {
  const { blockedUserIds, unblockUser, safetyReports } = useCampus();

  const [discoveryVisible, setDiscoveryVisible] = useState(true);
  const [mutualOnlyDMs, setMutualOnlyDMs] = useState(true);
  const [hideExactLocation, setHideExactLocation] = useState(true);

  return (
    <Screen>
      <Header
        eyebrow="Trust, Care & Privacy"
        title="Safety Center"
        subtitle="Sakhi is designed to foster genuine connection with complete privacy and safety."
      />

      {/* Discovery & Privacy Controls */}
      <SectionTitle title="Privacy & Discovery Controls" />
      <Card>
        <View style={styles.settingRow}>
          <View style={styles.settingTextCol}>
            <Text style={styles.settingTitle}>Discoverable in Circle</Text>
            <Text style={styles.settingCopy}>
              Allow fellow campus girls to find your profile based on shared study goals & interests.
            </Text>
          </View>
          <Switch
            value={discoveryVisible}
            onValueChange={setDiscoveryVisible}
            trackColor={{ false: '#E8DCDD', true: MiraColors.coral }}
            thumbColor={MiraColors.white}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingTextCol}>
            <Text style={styles.settingTitle}>Mutual Connections Only for DMs</Text>
            <Text style={styles.settingCopy}>
              Only users whose friend request you accept can send you private direct messages.
            </Text>
          </View>
          <Switch
            value={mutualOnlyDMs}
            onValueChange={setMutualOnlyDMs}
            trackColor={{ false: '#E8DCDD', true: MiraColors.coral }}
            thumbColor={MiraColors.white}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingTextCol}>
            <Text style={styles.settingTitle}>Hide Location & Address</Text>
            <Text style={styles.settingCopy}>
              Never expose exact GPS or live location. Only broad campus level is shared.
            </Text>
          </View>
          <Switch
            value={hideExactLocation}
            onValueChange={setHideExactLocation}
            trackColor={{ false: '#E8DCDD', true: MiraColors.coral }}
            thumbColor={MiraColors.white}
          />
        </View>
      </Card>

      {/* Blocked Users List */}
      <SectionTitle title="Blocked Users" action={`${blockedUserIds.length} blocked`} />
      <Card>
        {blockedUserIds.length === 0 ? (
          <Text style={styles.emptyText}>You have not blocked any users.</Text>
        ) : (
          blockedUserIds.map((userId) => (
            <View key={userId} style={styles.blockedRow}>
              <View style={styles.blockedAvatar}>
                <Text style={styles.blockedAvatarText}>U</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.blockedName}>Blocked Account (ID: {userId.slice(0, 8)})</Text>
                <Text style={styles.blockedMeta}>Unable to message or see your posts</Text>
              </View>
              <Pressable onPress={() => unblockUser(userId)} style={styles.unblockBtn}>
                <Text style={styles.unblockText}>Unblock</Text>
              </Pressable>
            </View>
          ))
        )}
      </Card>

      {/* Reports Log */}
      <SectionTitle title="Submitted Moderation Reports" action={`${safetyReports.length} reports`} />
      <Card>
        {safetyReports.length === 0 ? (
          <Text style={styles.emptyText}>No submitted reports. Thank you for keeping campus safe!</Text>
        ) : (
          safetyReports.map((report) => (
            <View key={report.id} style={styles.reportRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.reportReason}>
                  {report.targetType.toUpperCase()} FLAG · {report.reason.toUpperCase()}
                </Text>
                <Text style={styles.reportDetails}>Details: {report.details || 'No additional details provided'}</Text>
                <Text style={styles.reportDate}>{report.createdAt}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{(report.status || 'open').toUpperCase()}</Text>
              </View>
            </View>
          ))
        )}
      </Card>

      {/* Guidelines & Safety Advice */}
      <SectionTitle title="Campus & Meetup Safety Guidelines" />
      <Card tone="rose">
        <View style={styles.guideRow}>
          <Text style={styles.guideIcon}>🛡️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.guideTitle}>Meet in Public Places</Text>
            <Text style={styles.guideCopy}>
              When meeting study partners or club members for the first time, choose campus libraries or cafes.
            </Text>
          </View>
        </View>

        <View style={[styles.guideRow, { marginTop: 10 }]}>
          <Text style={styles.guideIcon}>🔒</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.guideTitle}>Anonymous Posts Protection</Text>
            <Text style={styles.guideCopy}>
              Posting anonymously protects your name from fellow students, but content is monitored to prevent abuse.
            </Text>
          </View>
        </View>

        <View style={[styles.guideRow, { marginTop: 10 }]}>
          <Text style={styles.guideIcon}>🚨</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.guideTitle}>Campus Security Emergency Contact</Text>
            <Text style={styles.guideCopy}>
              In an urgent situation, always contact your university security hotline or campus emergency services directly.
            </Text>
          </View>
        </View>
      </Card>

      <Text style={styles.footer}>
        Sakhi operates zero-tolerance for harassment, spam, or abusive behavior. Production setup routes all flags to the moderator queue.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: MiraColors.line,
  },
  settingTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  settingTitle: {
    color: MiraColors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  settingCopy: {
    color: MiraColors.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  emptyText: {
    color: MiraColors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  blockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: MiraColors.line,
  },
  blockedAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: MiraColors.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockedAvatarText: {
    color: MiraColors.muted,
    fontWeight: '900',
  },
  blockedName: {
    color: MiraColors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  blockedMeta: {
    color: MiraColors.muted,
    fontSize: 10,
  },
  unblockBtn: {
    backgroundColor: MiraColors.coral,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  unblockText: {
    color: MiraColors.white,
    fontSize: 10,
    fontWeight: '900',
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: MiraColors.line,
  },
  reportReason: {
    color: MiraColors.ink,
    fontSize: 11,
    fontWeight: '900',
  },
  reportDetails: {
    color: MiraColors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  reportDate: {
    color: MiraColors.muted,
    fontSize: 9,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: MiraColors.mint,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    color: '#4B8B78',
    fontSize: 9,
    fontWeight: '900',
  },
  guideRow: {
    flexDirection: 'row',
    gap: 10,
  },
  guideIcon: {
    fontSize: 20,
  },
  guideTitle: {
    color: MiraColors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  guideCopy: {
    color: MiraColors.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  footer: {
    color: MiraColors.muted,
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    marginVertical: 14,
  },
});

