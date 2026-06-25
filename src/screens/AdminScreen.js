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
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../../firebaseConfig';

export default function AdminScreen() {
  const [allResponders, setAllResponders] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [activeTab, setActiveTab] = useState('responders');
  const [expandedResponderId, setExpandedResponderId] = useState(null);
  const [responderSearch, setResponderSearch] = useState('');
  const [incidentTypeFilter, setIncidentTypeFilter] = useState('All');
  const [incidentStatusFilter, setIncidentStatusFilter] = useState('All');

  const filteredResponders = allResponders.filter((r) => {
    const term = responderSearch.toLowerCase();
    return (
      r.firstName?.toLowerCase().includes(term) ||
      r.surname?.toLowerCase().includes(term) ||
      r.email?.toLowerCase().includes(term)
    );
  });

  const filteredIncidents = incidents.filter((i) => {
    const typeMatch = incidentTypeFilter === 'All' || i.type === incidentTypeFilter;
    const statusMatch = incidentStatusFilter === 'All' || i.status === incidentStatusFilter;
    return typeMatch && statusMatch;
  });

  useEffect(() => {
    const respondersQuery = query(
      collection(db, "users"),
      where("role", "==", "responder")
    );

    const unsubscribeResponders = onSnapshot(respondersQuery, (snapshot) => {
      const responders = [];
      snapshot.forEach((doc) => {
        responders.push({ id: doc.id, ...doc.data() });
      });
      setAllResponders(responders);
    });

    // Listener: Fetch all incidents ordered by latest first
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
            RESPONDERS {allResponders.length > 0 ? `(${allResponders.length})` : ''}
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

      {/* RESPONDERS TAB */}
      {activeTab === 'responders' && (
        <View>
          {/* SEARCH BAR */}
          <View style={styles.searchBar}>
            <Feather name="search" size={16} color="#8A7A6D" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or email..."
              placeholderTextColor="#8A7A6D"
              value={responderSearch}
              onChangeText={setResponderSearch}
            />
          </View>

          {filteredResponders.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="check-circle" size={48} color="#22c55e" />
              <Text style={styles.emptyText}>No responders found</Text>
            </View>
          ) : (
            filteredResponders.map((responder) => (
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[
                      styles.verifBadge,
                      responder.verificationStatus === 'VERIFIED' && styles.verifBadgeVerified,
                      responder.verificationStatus === 'REJECTED' && styles.verifBadgeRejected,
                    ]}>
                      <Text style={styles.verifBadgeText}>{responder.verificationStatus}</Text>
                    </View>
                    <Feather
                      name={expandedResponderId === responder.id ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#8A7A6D"
                    />
                  </View>
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

                      {/* APPROVE / REJECT BUTTONS — only for PENDING responders */}
                      {responder.verificationStatus === 'PENDING' && (
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
                      )}

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

            {/* TYPE FILTER */}
            <Text style={styles.filterLabel}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
              {['All', 'General', 'Cardiac Arrest', 'Severe Bleeding', 'Burns / Fire'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.filterChip, incidentTypeFilter === type && styles.filterChipActive]}
                  onPress={() => setIncidentTypeFilter(type)}
                >
                  <Text style={[styles.filterChipText, incidentTypeFilter === type && styles.filterChipTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* STATUS FILTER */}
            <Text style={styles.filterLabel}>Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
              {['All', 'PENDING', 'ACCEPTED', 'RESOLVED'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[styles.filterChip, incidentStatusFilter === status && styles.filterChipActive]}
                  onPress={() => setIncidentStatusFilter(status)}
                >
                  <Text style={[styles.filterChipText, incidentStatusFilter === status && styles.filterChipTextActive]}>
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {filteredIncidents.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="inbox" size={48} color="#8A7A6D" />
                <Text style={styles.emptyText}>No incidents match your filters</Text>
              </View>
            ) : (
              filteredIncidents.map((incident) => (
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
  container: { flex: 1, backgroundColor: '#F5EDE4', paddingTop: Platform.OS === 'android' ? 40 : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E0CFBE' },
  headerTitle: { color: '#000000', fontSize: 20, fontWeight: 'bold' },
  logoutBtn: { padding: 8, backgroundColor: '#EFE3D3', borderRadius: 8 },
  tabContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: '#EFE3D3' },
  tabActive: { backgroundColor: '#ef4444' },
  tabText: { color: '#5C4A3A', fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: 'white' },
  content: { flex: 1, padding: 16 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: '#5C4A3A', fontSize: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E0CFBE' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  cardName: { color: '#000000', fontSize: 16, fontWeight: 'bold' },
  cardEmail: { color: '#5C4A3A', fontSize: 13, marginTop: 2 },
  expandedContent: { padding: 16, borderTopWidth: 1, borderTopColor: '#E0CFBE' },
  docLabel: { color: '#5C4A3A', fontSize: 13, fontWeight: 'bold', marginBottom: 8, marginTop: 8 },
  docImage: { width: '100%', height: 200, borderRadius: 8, backgroundColor: '#F5EDE4' },
  missingDoc: { color: '#ef4444', fontSize: 13, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  rejectBtn: { flex: 1, backgroundColor: '#8A7A6D', padding: 14, borderRadius: 10, alignItems: 'center' },
  approveBtn: { flex: 1, backgroundColor: '#22c55e', padding: 14, borderRadius: 10, alignItems: 'center' },
  actionBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  incidentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  incidentInfo: { flex: 1 },
  incidentType: { color: '#000000', fontSize: 15, fontWeight: 'bold' },
  incidentMeta: { color: '#5C4A3A', fontSize: 12, marginTop: 4 },
  incidentCoords: { color: '#8A7A6D', fontSize: 11, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  statusPending: { backgroundColor: 'rgba(245, 158, 11, 0.35)' },
  statusAccepted: { backgroundColor: 'rgba(34, 197, 94, 0.35)' },
  statusResolved: { backgroundColor: 'rgba(59, 130, 246, 0.35)' },
  statusText: { color: '#000000', fontSize: 11, fontWeight: 'bold' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E0CFBE', paddingHorizontal: 12, paddingVertical: 10, gap: 8, marginBottom: 16},
  searchInput: { flex: 1, fontSize: 14, color: '#000000'},
  verifBadge: { backgroundColor: 'rgba(245, 158, 11, 0.25)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100},
  verifBadgeVerified: { backgroundColor: 'rgba(34, 197, 94, 0.25)'},
  verifBadgeRejected: { backgroundColor: 'rgba(239, 68, 68, 0.25)'},
  verifBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#000000'},
  filterLabel: { fontSize: 12, fontWeight: 'bold', color: '#5C4A3A', marginBottom: 8, marginTop: 4},
  filterRow: { flexDirection: 'row', marginBottom: 12},
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, backgroundColor: '#EFE3D3', marginRight: 8, borderWidth: 1, borderColor: '#E0CFBE'},
  filterChipActive: { backgroundColor: '#ef4444', borderColor: '#ef4444'},
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#5C4A3A'},
  filterChipTextActive: { color: 'white'},
}); 9860
