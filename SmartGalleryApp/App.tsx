import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  PermissionsAndroid,
  Platform,
  Modal,
  DeviceEventEmitter, // <--- 1. ADD THIS IMPORT
} from 'react-native';

// Import our Firestore database
import firestore from '@react-native-firebase/firestore';

// Import the Beacon Library
import Beacons from 'react-native-beacons-manager';

// --- CONSTANTS ---
const REGION = {
  identifier: 'SmartGallery',
  uuid: 'FDA50693-A4E2-4FB1-AFCF-C6EB07647825',
};

const ENTRANCE_BEACON_ID = '99_99'; 

// --- DATA TYPES ---
interface Exhibit {
  id: string;
  title: string;
  artist: string;
  description: string;
  beaconId?: string;
}

interface Gallery {
  id: string;
  name: string;
  city: string;
}

// <--- 2. Define interface for Beacon Data to fix "implicit any"
interface BeaconData {
  beacons: Array<{
    major: number;
    minor: number;
    uuid: string;
    rssi: number;
    distance?: number;
  }>;
  uuid?: string;
  identifier?: string;
}

function App(): React.JSX.Element {
  const [loadingData, setLoadingData] = useState(true);
  const [allExhibits, setAllExhibits] = useState<Exhibit[]>([]);
  const [allGalleries, setAllGalleries] = useState<Gallery[]>([]);
  const [selectedExhibit, setSelectedExhibit] = useState<Exhibit | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [beaconStatus, setBeaconStatus] = useState<string>('Initializing...');

  // --- 1. FETCH DATA FROM FIRESTORE ---
  useEffect(() => {
    const unsubExhibits = firestore()
      .collection('exhibits')
      .onSnapshot(querySnapshot => {
        const exhibitsList: Exhibit[] = [];
        querySnapshot.forEach(documentSnapshot => {
          exhibitsList.push({
            id: documentSnapshot.id,
            ...documentSnapshot.data(),
          } as Exhibit);
        });
        setAllExhibits(exhibitsList);
      }, (err) => console.error("Exhibits error:", err));

    const unsubGalleries = firestore()
      .collection('galleries')
      .onSnapshot(querySnapshot => {
        const galleriesList: Gallery[] = [];
        querySnapshot.forEach(documentSnapshot => {
          galleriesList.push({
            id: documentSnapshot.id,
            ...documentSnapshot.data(),
          } as Gallery);
        });
        setAllGalleries(galleriesList);
        setLoadingData(false);
      }, (err) => console.error("Galleries error:", err));

    return () => {
      unsubExhibits();
      unsubGalleries();
    };
  }, []);

  // --- 2. BEACON SCANNING LOGIC ---
  useEffect(() => {
    const startScanning = async () => {
      if (Platform.OS === 'android') {
        try {
          const locationPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          );
          const bluetoothScanPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          );
          
          if (locationPermission === PermissionsAndroid.RESULTS.GRANTED &&
              bluetoothScanPermission === PermissionsAndroid.RESULTS.GRANTED) {
            
            // <--- 3. Fix TS Error: Cast REGION to 'any' or use specific ID depending on library version.
            // Usually passing the object is correct for runtime, but TS types are wrong.
            await Beacons.startMonitoringForRegion(REGION as any);
            await Beacons.startRangingBeaconsInRegion(REGION as any);
            
            setBeaconStatus('Scanning for beacons...');

          } else {
            setBeaconStatus('Permissions denied.');
          }
        } catch (err) {
          setBeaconStatus('Error requesting permissions.');
        }
      }
    };

    startScanning();

    // <--- 4. Fix Listener: Use DeviceEventEmitter instead of Beacons.BeaconsEventEmitter
    // and typed the 'data' parameter
    const subscription = DeviceEventEmitter.addListener(
      'beaconsDidRange',
      (data: BeaconData) => { 
        if (data.beacons && data.beacons.length > 0) {
          const nearestBeacon = data.beacons[0];
          const { major, minor } = nearestBeacon;
          
          const foundBeaconId = `${major}_${minor}`;
          setBeaconStatus(`Found: ${foundBeaconId}`);

          if (foundBeaconId === ENTRANCE_BEACON_ID) {
            if (!showWelcomeModal) {
              setShowWelcomeModal(true);
            }
          } else {
            const exhibit = allExhibits.find(ex => ex.beaconId === foundBeaconId);
            if (exhibit) {
              setSelectedExhibit(exhibit);
            }
          }
        }
      }
    );

    return () => {
      // <--- 5. Fix TS Error on cleanup
      Beacons.stopMonitoringForRegion(REGION as any);
      Beacons.stopRangingBeaconsInRegion(REGION as any);
      subscription.remove();
    };
  }, [allExhibits, showWelcomeModal]);

  // --- HELPER FUNCTIONS ---
  const handleSimulateBeacon = (exhibit: Exhibit) => {
    setSelectedExhibit(exhibit);
  };
  
  const handleSimulateEntrance = () => {
    setShowWelcomeModal(true);
  };

  const handleClearSelection = () => {
    setSelectedExhibit(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={'dark-content'} />
      <ScrollView contentContainerStyle={styles.container}>
        
        <Modal
          animationType="slide"
          transparent={true}
          visible={showWelcomeModal}
          onRequestClose={() => setShowWelcomeModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Welcome!</Text>
              <Text style={styles.modalText}>
                You have arrived at the Smart Art Gallery.
                {'\n'}
                Walk towards any painting to learn more about it.
              </Text>
              <TouchableOpacity
                style={[styles.button, styles.modalButton]}
                onPress={() => setShowWelcomeModal(false)}>
                <Text style={styles.buttonText}>Start Tour</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <View style={[styles.card, {borderLeftWidth: 5, borderLeftColor: '#28a745'}]}>
          <Text style={styles.cardTitle}>📍 Nearby Galleries</Text>
          {allGalleries.length === 0 ? (
            <Text style={{color: '#666'}}>No galleries found. Add some in Admin!</Text>
          ) : (
            allGalleries.map(gallery => (
              <View key={gallery.id} style={{marginBottom: 12}}>
                <Text style={{fontSize: 18, fontWeight: 'bold', color: '#333'}}>{gallery.name}</Text>
                <Text style={{color: '#666'}}>Location: {gallery.city}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎨 Exhibit Details</Text>
          {selectedExhibit ? (
            <View>
              <Text style={styles.exhibitTitle}>{selectedExhibit.title}</Text>
              <Text style={styles.exhibitArtist}>by {selectedExhibit.artist}</Text>
              <Text style={styles.exhibitDescription}>{selectedExhibit.description}</Text>
              <TouchableOpacity
                style={[styles.button, styles.clearButton]}
                onPress={handleClearSelection}>
                <Text style={styles.buttonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.placeholderText}>
              Walk near an art piece to see details...
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🛠 Simulation Menu</Text>
          <Text style={{marginBottom: 10}}>Status: {beaconStatus}</Text>
          
          <TouchableOpacity
            style={[styles.button, {backgroundColor: '#28a745'}]}
            onPress={handleSimulateEntrance}>
            <Text style={styles.buttonText}>Simulate: ENTRANCE (99_99)</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {loadingData ? (
            <ActivityIndicator size="large" color="#007bff" />
          ) : (
            allExhibits.map(exhibit => (
              <TouchableOpacity
                key={exhibit.id}
                style={styles.button}
                onPress={() => handleSimulateBeacon(exhibit)}>
                <Text style={styles.buttonText}>Simulate: {exhibit.title}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
  container: { padding: 20 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
    marginBottom: 15,
  },
  placeholderText: { fontSize: 16, color: '#777', textAlign: 'center', fontStyle: 'italic' },
  exhibitTitle: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  exhibitArtist: { fontSize: 18, color: '#555', fontStyle: 'italic', marginBottom: 15 },
  exhibitDescription: { fontSize: 16, color: '#333', lineHeight: 24, marginBottom: 20 },
  button: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  clearButton: { backgroundColor: '#6c757d' },
  divider: { height: 1, backgroundColor: '#ddd', marginVertical: 10 },
  
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#000',
  },
  modalText: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
    color: '#333',
  },
  modalButton: {
    backgroundColor: '#28a745',
    minWidth: 150,
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
  }
});

export default App;