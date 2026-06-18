import { StyleSheet, Text, View } from "react-native";
import type { MemberCardColors } from "./memberCardColors";
import { MemberCardStarfield } from "./MemberCardStarfield";
import { radius } from "./tokens";

interface MemberCardProps {
  colors: MemberCardColors;
  name: string;
  since: string | null;
  reducedMotion: boolean;
}

export function MemberCard({
  colors,
  name,
  since,
  reducedMotion,
}: MemberCardProps) {
  const { background, font } = colors;
  return (
    <View style={[styles.card, { backgroundColor: background }]}>
      <MemberCardStarfield color={font} reducedMotion={reducedMotion} />

      <View style={styles.content} pointerEvents="none">
        <Text style={[styles.appName, { color: font }]}>Tiny Planet</Text>
        <Text style={[styles.title, { color: font }]}>Member Card</Text>

        <View style={styles.spacer} />

        <View style={styles.rows}>
          <View style={styles.rowLeft}>
            <Text style={[styles.label, { color: font }]}>MEMBER</Text>
            <Text style={[styles.value, { color: font }]} numberOfLines={1}>
              {name}
            </Text>
          </View>
          {since ? (
            <View>
              <Text style={[styles.label, styles.right, { color: font }]}>
                SINCE
              </Text>
              <Text style={[styles.value, styles.right, { color: font }]}>
                {since}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.divider, { backgroundColor: font }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    height: 360,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    padding: 22,
  },
  appName: {
    fontSize: 22,
    fontWeight: "600",
    opacity: 0.6,
  },
  title: {
    fontSize: 25,
    fontWeight: "700",
    marginTop: 2,
  },
  spacer: { flex: 1 },
  rows: { flexDirection: "row", gap: 16 },
  rowLeft: { flex: 1 },
  label: {
    fontSize: 9,
    letterSpacing: 0.6,
    fontWeight: "600",
    opacity: 0.7,
    marginBottom: 3,
  },
  value: { fontSize: 14 },
  right: { textAlign: "right" },
  divider: {
    height: 1.5,
    opacity: 0.2,
    marginTop: 14,
  },
});
