import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function AlertModal({ visible, incident, onAccept, onReject }) {
  // Animation for the Accept button
  const pan = useRef(new Animated.Value(0)).current;
  const [swiped, setSwiped] = useState(false);

  // Reset slider when modal opens
  useEffect(() => {
    if (visible) {
      pan.setValue(0);
      setSwiped(false);
    }
  }, [visible]);

  // Logic for slide button
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0 && gestureState.dx < SCREEN_WIDTH - 100) {
          pan.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 150) { // If it was slid far enough
          setSwiped(true);
          onAccept();
        } else {
          // Snap back if it did not slide enough
          Animated.spring(pan, { toValue: 0, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  if (!incident) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onReject}
    >
      <View style={styles.overlay}>
        
        {/* TOP ALERT BANNER */}
        <View style={styles.topBanner}>
          <View style={styles.bannerContent}>
            <FontAwesome5 name="bell" size={20} color="white" style={{marginTop: 2}} />
            <View>
              <Text style={styles.bannerLabel}>NEW INCIDENT</Text>
              <Text style={styles.bannerText}>{incident.type} • 500m</Text>
            </View>
          </View>
        </View>

        {/* BOTTOM SHEET */}
        <View style={styles.bottomSheet}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.victimName}>Victim #{incident.id.slice(-4).toUpperCase()}</Text>
            <View style={styles.criticalBadge}>
              <Text style={styles.criticalText}>CRITICAL</Text>
            </View>
          </View>

          {/* Coordinates */}
          <Text style={styles.coords}>
            Coordinates: {incident.location?.latitude.toFixed(4)}, {incident.location?.longitude.toFixed(4)}
          </Text>

          {/* History Badge */}
          <View style={styles.historyBadge}>
            <Feather name="calendar" size={16} color="#60a5fa" />
            <Text style={styles.historyText}>Emergemcy Type: {incident.type}</Text>
          </View>

          {/* SLIDE TO ACCEPT BUTTON */}
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderText}>SLIDE TO ACCEPT</Text>
            
            <Animated.View 
              style={[styles.sliderKnob, { transform: [{ translateX: pan }] }]}
              {...panResponder.panHandlers}
            >
              <Feather name="chevron-right" size={24} color="#22c55e" />
            </Animated.View>
          </View>

          {/* Cancel Button which is Hidden unless needed */}
          <TouchableOpacity onPress={onReject} style={{alignItems: 'center', marginTop: 20}}>
            <Text style={{color: '#71717a'}}>Ignore Alert</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  topBanner: {
    margin: 16,
    marginTop: 60,
    backgroundColor: '#dc2626',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  bannerContent: {
    flexDirection: 'row',
    gap: 12,
  },
  bannerLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  bannerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSheet: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: '#27272a',
  },
  dragHandle: {
    width: 48,
    height: 4,
    backgroundColor: '#3f3f46',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  victimName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  criticalBadge: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
  },
  criticalText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  coords: {
    color: '#a1a1aa',
    fontSize: 14,
    marginBottom: 20,
  },
  historyBadge: {
    backgroundColor: 'rgba(30, 58, 138, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(30, 58, 138, 1)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  historyText: {
    color: '#60a5fa', 
    fontWeight: '600',
  },
  sliderContainer: {
    height: 64,
    backgroundColor: '#22c55e',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden', // Keeps knob inside
  },
  sliderText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
    marginLeft: 30, // Offset for knob
  },
  sliderKnob: {
    position: 'absolute',
    left: 4,
    width: 56,
    height: 56,
    backgroundColor: 'white',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  }
});