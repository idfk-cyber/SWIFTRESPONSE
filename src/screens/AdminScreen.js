import { Feather, MaterialIcons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { collection, doc, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../../firebaseConfig';

export default function AdminScreen() {
  const [pendingResponders, setPendingResponders] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [activeTab, setActiveTab] = useState('responders');
  const [expandedResponderId, setExpandedResponderId] = useState(null);

  useEffect(() => {
    // Listener 1: Fetch all PENDING responders
    const respondersQuery = query(
      collection(db, "users"),
      where("role", "==", "responder"),
      where("verificationStatus", "==", "PENDING")
    );

    const unsubscribeResponders = onSnapshot(respondersQuery, (snapshot) => {
      const responders = [];
      snapshot.forEach((doc) => {
        responders.push({ id: doc.id, ...doc.data() });
      });
      setPendingResponders(responders);
    });

    // Listener 2: Fetch all incidents ordered by latest first
    const incidentsQuery = query(
      collection(db, "incidents"),
      orderBy("timestamp", "desc")
    );

    const unsubscribeIncidents = onSnapshot(incidentsQuery, (snapshot) => {
      const incidentList = [];
      snapshot.forEach((doc) => {
        incidentList.push({ id: doc.id, ...doc.data() });
      });
      setIncidents(incidentList);
    });

    return () => {
      unsubscribeResponders();
      unsubscribeIncidents();
    };
  }, []);

  const handleVerification = async (responderId, decision) => {
    try {
      const responderRef = doc(db, "users", responderId);
      await updateDoc(responderRef, {
        verificationStatus: decision
      });
      Alert.alert("Done", `Responder ${decision === 'VERIFIED' ? 'approved' : 'rejected'} successfully.`);
      setExpandedResponderId(null);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleLogout = async () => {
    try { await signOut(auth); } catch (error) { console.error(error); }
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Feather name="log-out" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* TAB SWITCHER */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'responders' && styles.tabActive]}
          onPress={() => setActiveTab('responders')}
        >
          <Text style={[styles.tabText, activeTab === 'responders' && styles.tabTextActive]}>
            Pending Responders {pendingResponders.length > 0 ? `(${pendingResponders.length})` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'incidents' && styles.tabActive]}
          onPress={() => setActiveTab('incidents')}
        >
          <Text style={[styles.tabText, activeTab === 'incidents' && styles.tabTextActive]}>
            Incident Logs {incidents.length > 0 ? `(${incidents.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>

        {/* PENDING RESPONDERS TAB */}
        {activeTab === 'responders' && (
          <View>
            {pendingResponders.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="check-circle" size={48} color="#22c55e" />
                <Text style={styles.emptyText}>No pending verifications</Text>
              </View>
            ) : (
              pendingResponders.map((responder) => (
                <View key={responder.id} style={styles.card}>
                  
                  {/* RESPONDER SUMMARY ROW */}
                  <TouchableOpacity
                    style={styles.cardHeader}
                    onPress={() => setExpandedResponderId(
                      expandedResponderId === responder.id ? null : responder.id
                    )}
                  >
                    <View>
                      <Text style={styles.cardName}>{responder.firstName} {responder.surname}</Text>
                      <Text style={styles.cardEmail}>{responder.email}</Text>
                    </View>
                    <Feather
                      name={expandedResponderId === responder.id ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#71717a"
                    />
                  </TouchableOpacity>

                  {/* EXPANDED DOCUMENT VIEW */}
                  {expandedResponderId === responder.id && (
                    <View style={styles.expandedContent}>
                      
                      <Text style={styles.docLabel}>ID Card</Text>
                      {responder.documents?.idCard ? (
                        <Image
                          source={{ uri: responder.documents.idCard }}
                          style={styles.docImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <Text style={styles.missingDoc}>No ID card uploaded</Text>
                      )}

                      <Text style={styles.docLabel}>Certificate</Text>
                      {responder.documents?.certificate ? (
                        <Image
                          source={{ uri: responder.documents.certificate }}
                          style={styles.docImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <Text style={styles.missingDoc}>No certificate uploaded</Text>
                      )}

                      {/* APPROVE / REJECT BUTTONS */}
                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          style={styles.rejectBtn}
                          onPress={() => handleVerification(responder.id, 'REJECTED')}
                        >
                          <Text style={styles.actionBtnText}>Reject</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.approveBtn}
                          onPress={() => handleVerification(responder.id, 'VERIFIED')}
                        >
                          <Text style={styles.actionBtnText}>Approve</Text>
                        </TouchableOpacity>
                      </View>

                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* INCIDENTS LOG TAB */}
        {activeTab === 'incidents' && (
          <View>
            {incidents.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="inbox" size={48} color="#71717a" />
                <Text style={styles.emptyText}>No incidents recorded</Text>
              </View>
            ) : (
              incidents.map((incident) => (
                <View key={incident.id} style={styles.card}>
                  <View style={styles.incidentRow}>
                    <View style={styles.incidentInfo}>
                      <Text style={styles.incidentType}>{incident.type}</Text>
                      <Text style={styles.incidentMeta}>
                        {incident.timestamp?.toDate().toLocaleString() ?? 'No timestamp'}
                      </Text>
                      <Text style={styles.incidentCoords}>
                        {incident.location?.latitude.toFixed(4)}, {incident.location?.longitude.toFixed(4)}
                      </Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      incident.status === 'PENDING' && styles.statusPending,
                      incident.status === 'ACCEPTED' && styles.statusAccepted,
                      incident.status === 'RESOLVED' && styles.statusResolved,
                    ]}>
                      <Text style={styles.statusText}>{incident.status}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#18181b', paddingTop: Platform.OS === 'android' ? 40 : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  logoutBtn: { padding: 8, backgroundColor: '#27272a', borderRadius: 8 },
  tabContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: '#27272a' },
  tabActive: { backgroundColor: '#ef4444' },
  tabText: { color: '#71717a', fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: 'white' },
  content: { flex: 1, padding: 16 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: '#71717a', fontSize: 16 },
  card: { backgroundColor: '#27272a', borderRadius: 16, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#3f3f46' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  cardName: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  cardEmail: { color: '#71717a', fontSize: 13, marginTop: 2 },
  expandedContent: { padding: 16, borderTopWidth: 1, borderTopColor: '#3f3f46' },
  docLabel: { color: '#a1a1aa', fontSize: 13, fontWeight: 'bold', marginBottom: 8, marginTop: 8 },
  docImage: { width: '100%', height: 200, borderRadius: 8, backgroundColor: '#18181b' },
  missingDoc: { color: '#ef4444', fontSize: 13, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  rejectBtn: { flex: 1, backgroundColor: '#3f3f46', padding: 14, borderRadius: 10, alignItems: 'center' },
  approveBtn: { flex: 1, backgroundColor: '#22c55e', padding: 14, borderRadius: 10, alignItems: 'center' },
  actionBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  incidentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  incidentInfo: { flex: 1 },
  incidentType: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  incidentMeta: { color: '#71717a', fontSize: 12, marginTop: 4 },
  incidentCoords: { color: '#52525b', fontSize: 11, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  statusPending: { backgroundColor: 'rgba(245, 158, 11, 0.2)' },
  statusAccepted: { backgroundColor: 'rgba(34, 197, 94, 0.2)' },
  statusResolved: { backgroundColor: 'rgba(59, 130, 246, 0.2)' },
  statusText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
}); 9860