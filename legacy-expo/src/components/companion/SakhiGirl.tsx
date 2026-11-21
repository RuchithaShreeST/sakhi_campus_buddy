import { useWindowDimensions, StyleSheet, Text, View } from 'react-native';

import { MiraColors } from '@/constants/theme';
import { CompanionState } from '@/types/wellness';
import { SakhiGirlAnimation } from './SakhiGirlAnimation';
import { girlStateConfig } from './sakhiGirlStates';

export function SakhiGirl({ state, compact = false }: { state: CompanionState; compact?: boolean }) {
  const { width } = useWindowDimensions();
  const scale = Math.max(0.72, Math.min(1.12, width / 390));
  const config = girlStateConfig[state] ?? girlStateConfig.idle;
  const sleeping = state === 'sleeping';
  const gentle = ['calm', 'sleepy', 'tired', 'needsRest', 'concerned'].includes(state);

  return (
    <View style={[styles.wrapper, compact && styles.compactWrapper]} accessibilityLabel={`Sakhi girl is ${config.label}`}>
      <SakhiGirlAnimation state={state}>
        <View style={{ transform: [{ scale: compact ? 0.3 : scale }] }}>
          <View style={styles.character}>
            <View style={styles.hairBack} />
            <View style={styles.head}>
              <View style={styles.hairTop} />
              <View style={styles.face}>
                <View style={styles.eyes}>
                  <Text style={styles.eye}>{sleeping || gentle ? '–' : '•'}</Text>
                  <Text style={styles.eye}>{sleeping || gentle ? '–' : '•'}</Text>
                </View>
                <Text style={styles.mouth}>{sleeping ? '—' : gentle ? '︵' : '◡'}</Text>
              </View>
              <View style={styles.blushLeft} />
              <View style={styles.blushRight} />
            </View>
            <View style={[styles.neck, gentle && styles.gentleNeck]} />
            <View style={[styles.outfit, state === 'celebrating' && styles.celebratingOutfit]}>
              <View style={styles.collar} />
              <View style={styles.outfitMark}>
                <Text style={styles.mark}>S</Text>
              </View>
            </View>
            <View style={styles.armLeft} />
            <View style={styles.armRight} />
            <View style={styles.legs}>
              <View style={styles.legLeft} />
              <View style={styles.legRight} />
            </View>
            {config.accessory === 'book' && (
              <View style={styles.book}>
                <Text style={styles.bookMark}>S</Text>
              </View>
            )}
            {config.accessory === 'laptop' && (
              <View style={styles.laptop}>
                <View style={styles.laptopScreen} />
                <View style={styles.laptopBase} />
              </View>
            )}
            {config.accessory === 'headphones' && (
              <View style={styles.headphones}>
                <View style={styles.headband} />
                <View style={styles.earCupLeft} />
                <View style={styles.earCupRight} />
              </View>
            )}
            {config.accessory === 'movie' && (
              <View style={styles.movie}>
                <View style={styles.movieScreen} />
                <View style={styles.movieStand} />
              </View>
            )}
            {config.accessory === 'tea' && (
              <View style={styles.tea}>
                <View style={styles.cup} />
                <View style={styles.handle} />
              </View>
            )}
          </View>
        </View>
      </SakhiGirlAnimation>
      {!compact && state === 'sleeping' && <Text style={styles.sleepZ}>z z</Text>}
      {!compact && (state === 'celebrating' || state === 'energetic') && <Text style={styles.sparkles}>✦ ･ ✧</Text>}
      {!compact && (
        <View style={styles.statePill}>
          <Text style={styles.stateText}>{config.label}</Text>
        </View>
      )}
    </View>
  );
}

/** @deprecated Legacy alias */
export const MiraGirl = SakhiGirl;

const styles = StyleSheet.create({
  wrapper: { height: 260, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  compactWrapper: { height: 62, width: 62, overflow: 'hidden' },
  character: { width: 150, height: 205, alignItems: 'center', justifyContent: 'flex-end' },
  hairBack: { width: 105, height: 125, borderRadius: 58, backgroundColor: '#4D3545', position: 'absolute', top: 16 },
  head: { width: 91, height: 99, borderRadius: 48, backgroundColor: '#F6C4AC', borderWidth: 3, borderColor: '#D9887D', alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 22, zIndex: 2 },
  hairTop: { width: 94, height: 48, borderRadius: 48, backgroundColor: '#4D3545', position: 'absolute', top: -3 },
  face: { alignItems: 'center', marginTop: 16 },
  eyes: { flexDirection: 'row', gap: 23 },
  eye: { color: MiraColors.ink, fontSize: 19, fontWeight: '900', width: 10, textAlign: 'center' },
  mouth: { color: MiraColors.rose, fontSize: 22, lineHeight: 24, fontWeight: '900' },
  blushLeft: { position: 'absolute', left: 9, top: 58, width: 16, height: 7, borderRadius: 8, backgroundColor: '#E99498', opacity: 0.75 },
  blushRight: { position: 'absolute', right: 9, top: 58, width: 16, height: 7, borderRadius: 8, backgroundColor: '#E99498', opacity: 0.75 },
  neck: { width: 22, height: 20, backgroundColor: '#F6C4AC', position: 'absolute', bottom: 69, zIndex: 1 },
  gentleNeck: { opacity: 0.9 },
  outfit: { width: 91, height: 86, borderRadius: 33, backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  celebratingOutfit: { backgroundColor: '#818CF8' },
  collar: { position: 'absolute', top: 0, width: 25, height: 18, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, backgroundColor: '#E0E7FF' },
  outfitMark: { width: 31, height: 31, borderRadius: 16, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center', marginTop: 11 },
  mark: { color: MiraColors.white, fontWeight: '900', fontSize: 13 },
  armLeft: { width: 22, height: 61, borderRadius: 16, backgroundColor: '#F6C4AC', position: 'absolute', bottom: 68, left: 17, transform: [{ rotate: '20deg' }], zIndex: 1 },
  armRight: { width: 22, height: 61, borderRadius: 16, backgroundColor: '#F6C4AC', position: 'absolute', bottom: 68, right: 17, transform: [{ rotate: '-20deg' }], zIndex: 1 },
  legs: { flexDirection: 'row', gap: 10, position: 'absolute', bottom: 0 },
  legLeft: { width: 27, height: 46, borderRadius: 16, backgroundColor: '#312E81' },
  legRight: { width: 27, height: 46, borderRadius: 16, backgroundColor: '#312E81' },
  book: { width: 58, height: 39, borderRadius: 5, backgroundColor: '#F8E7B5', position: 'absolute', bottom: 72, left: 4, transform: [{ rotate: '-8deg' }], alignItems: 'center', justifyContent: 'center', zIndex: 3 },
  bookMark: { color: '#4F46E5', fontWeight: '900' },
  laptop: { position: 'absolute', bottom: 70, width: 75, height: 41, alignItems: 'center', zIndex: 3 },
  laptopScreen: { width: 55, height: 34, borderWidth: 4, borderColor: '#A8C4B2', borderRadius: 5, backgroundColor: '#E4F1E8' },
  laptopBase: { width: 76, height: 7, borderRadius: 5, backgroundColor: '#779989' },
  headphones: { position: 'absolute', top: 19, width: 112, height: 84, borderWidth: 6, borderBottomWidth: 0, borderColor: '#6366F1', borderRadius: 56, zIndex: 3 },
  headband: { flex: 1 },
  earCupLeft: { position: 'absolute', left: -8, top: 47, width: 16, height: 28, borderRadius: 9, backgroundColor: '#6366F1' },
  earCupRight: { position: 'absolute', right: -8, top: 47, width: 16, height: 28, borderRadius: 9, backgroundColor: '#6366F1' },
  movie: { position: 'absolute', bottom: 77, right: -2, alignItems: 'center', zIndex: 3 },
  movieScreen: { width: 45, height: 30, borderRadius: 4, backgroundColor: '#E7E0F2', borderWidth: 3, borderColor: '#9C83B8' },
  movieStand: { width: 14, height: 9, borderBottomWidth: 3, borderColor: '#9C83B8' },
  tea: { position: 'absolute', bottom: 75, right: 7, flexDirection: 'row', alignItems: 'center', zIndex: 3 },
  cup: { width: 19, height: 22, borderRadius: 4, backgroundColor: '#F8E7B5' },
  handle: { width: 8, height: 10, borderWidth: 3, borderColor: '#D5B468', borderRadius: 6 },
  sleepZ: { position: 'absolute', top: 20, right: 40, color: '#6366F1', fontSize: 22, fontWeight: '900', transform: [{ rotate: '12deg' }] },
  sparkles: { position: 'absolute', top: 18, color: '#6366F1', fontSize: 21, fontWeight: '900' },
  statePill: { backgroundColor: MiraColors.white, paddingHorizontal: 15, paddingVertical: 7, borderRadius: 18, position: 'absolute', bottom: 3, shadowColor: '#312E81', shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 },
  stateText: { color: '#4F46E5', fontSize: 12, fontWeight: '900' },
});

