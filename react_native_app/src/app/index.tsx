import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar, Alert 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as SQLite from 'expo-sqlite';
import * as SMS from 'expo-sms';
import * as Linking from 'expo-linking';

const NAV_TABS = [
  { id: 'home', icon: '🏠', label: 'मुख्य' },
  { id: 'guruji', icon: '👳', label: 'गुरुजी' },
  { id: 'rashi', icon: '♈', label: 'राशी' },
  { id: 'kundali', icon: '📜', label: 'कुंडली' },
  { id: 'calendar', icon: '📅', label: 'पंचांग' },
  { id: 'puja', icon: '🔱', label: 'पूजा' },
];

const RASHI_DATA = [
  { sign: '♈', name: 'मेष', eng: 'Aries' },
  { sign: '♉', name: 'वृषभ', eng: 'Taurus' },
  { sign: '♊', name: 'मिथुन', eng: 'Gemini' },
  { sign: '♋', name: 'कर्क', eng: 'Cancer' },
  { sign: '♌', name: 'सिंह', eng: 'Leo' },
  { sign: '♍', name: 'कन्या', eng: 'Virgo' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [db, setDb] = useState<any>(null);

  useEffect(() => {
    async function initDB() {
      const database = await SQLite.openDatabaseAsync('app_database.db');
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      setDb(database);
    }
    initDB();
  }, []);

  const handleLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const location = await Location.getCurrentPositionAsync({});
      Alert.alert('Location Native', `Lat: ${location.coords.latitude}, Lng: ${location.coords.longitude}`);
      if (db) await db.runAsync(`INSERT INTO logs (event) VALUES (?)`, 'Location fetched');
    } else {
      Alert.alert('Permission Denied', 'Location access is required.');
    }
  };

  const handleCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (result.granted) setIsCameraOpen(true);
    } else {
      setIsCameraOpen(true);
    }
  };

  const handleCall = async (phone: string) => {
    await Linking.openURL(`tel:${phone}`);
  };

  const handleSMS = async (phone: string) => {
    const isAvailable = await SMS.isAvailableAsync();
    if (isAvailable) {
      await SMS.sendSMSAsync([phone], 'Hello from ShivShakti App');
    }
  };

  if (isCameraOpen) {
    return (
      <View style={{ flex: 1 }}>
        <CameraView style={{ flex: 1 }} facing="back" />
        <TouchableOpacity 
          style={styles.closeCameraBtn} 
          onPress={() => setIsCameraOpen(false)}
        >
          <Text style={styles.closeCameraText}>Close Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderHome = () => (
    <ScrollView style={styles.pageContainer}>
      {/* Live Clock Component */}
      <LinearGradient colors={['#7B1B00', '#FF6B00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.liveClock}>
        <Text style={styles.clockTime}>06:45 PM</Text>
        <Text style={styles.clockDate}>6 June 2026</Text>
        <Text style={styles.clockTithi}>वैशाख शुद्ध प्रतिपदा</Text>
      </LinearGradient>

      {/* Rashi Grid */}
      <Text style={styles.secTitle}>दैनिक राशीभविष्य</Text>
      <Text style={styles.secSub}>तुमची राशी निवडा</Text>
      <View style={styles.rashiGrid}>
        {RASHI_DATA.map((r, i) => (
          <LinearGradient 
            key={i} 
            colors={['#FFF3E0', '#FFFDE7']} 
            style={styles.rashiItem}
          >
            <Text style={styles.rSym}>{r.sign}</Text>
            <Text style={styles.rName}>{r.name}</Text>
            <Text style={styles.rEng}>{r.eng}</Text>
          </LinearGradient>
        ))}
      </View>

      {/* Native Capability Test Buttons */}
      <Text style={[styles.secTitle, {marginTop: 20}]}>Native Features (No HTML)</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLocation}>
          <Text style={styles.actionBtnText}>📍 Get My Location</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#2E7D32'}]} onPress={handleCamera}>
          <Text style={styles.actionBtnText}>📷 Open Native Camera</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderGuruji = () => (
    <ScrollView style={styles.pageContainer}>
      <LinearGradient colors={['#FFF3E0', '#FFFDE7']} style={styles.gurujiCard}>
        <View style={styles.gjHeader}>
          <LinearGradient colors={['#FF6B00', '#FFB300']} style={styles.gjAvatar}>
            <Text style={{fontSize: 28}}>👳</Text>
          </LinearGradient>
          <View style={styles.gjInfo}>
            <Text style={styles.gjName}>श्री. आनंद जोशी</Text>
            <Text style={styles.gjSub}>१५+ वर्षे अनुभव • वैदिक ज्योतिष</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>Verified</Text></View>
          </View>
        </View>
        <TouchableOpacity style={styles.callBtn} onPress={() => handleCall('+919876543210')}>
          <Text style={styles.callBtnText}>📞 Call Now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.waBtn} onPress={() => handleSMS('+919876543210')}>
          <Text style={styles.waBtnText}>💬 Send Native SMS</Text>
        </TouchableOpacity>
      </LinearGradient>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#FF6B00" barStyle="light-content" />
      
      {/* HEADER natively styled */}
      <View style={{ elevation: 5, zIndex: 200 }}>
        <LinearGradient 
          colors={['#FF6B00', '#FFB300', '#FF8C00']} 
          start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
        >
          <View style={styles.headerTop}>
            <View style={styles.headerLogo}><Text style={{fontSize: 22}}>🕉️</Text></View>
            <View style={styles.headerInfo}>
              <Text style={styles.appTitle}>शिवशक्ती ज्योतिष केंद्र</Text>
              <Text style={styles.appSub}>|| श्री दुर्गा कालीमाता प्रसन्न ||</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.liveBtn}>
                <Text style={styles.liveBtnText}>🔴 LIVE</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* NAVIGATION */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.navWrap}>
            {NAV_TABS.map((tab) => (
              <TouchableOpacity 
                key={tab.id} 
                style={[styles.navTab, activeTab === tab.id && styles.navTabActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={[styles.navTabText, activeTab === tab.id && styles.navTabTextActive]}>
                  {tab.icon} {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </LinearGradient>
      </View>

      {/* Router Switch */}
      {activeTab === 'home' && renderHome()}
      {activeTab === 'guruji' && renderGuruji()}
      {activeTab !== 'home' && activeTab !== 'guruji' && (
        <View style={{padding: 20, alignItems: 'center'}}><Text>Screen under Native Construction</Text></View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FF6B00' },
  headerTop: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingTop: Platform.OS === 'android' ? 10 : 44 },
  headerLogo: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: '#FFB300', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,.2)' },
  headerInfo: { flex: 1, marginLeft: 10 },
  appTitle: { fontSize: 14, fontWeight: '800', color: '#fff', textShadowColor: 'rgba(0,0,0,.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  appSub: { fontSize: 10, color: 'rgba(255,255,255,.9)', marginTop: 2 },
  headerRight: { flexDirection: 'row' },
  liveBtn: { backgroundColor: 'rgba(255,50,50,.35)', borderColor: 'rgba(255,100,100,.6)', borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  liveBtnText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  navWrap: { backgroundColor: 'rgba(0,0,0,.18)', flexDirection: 'row', paddingHorizontal: 10 },
  navTab: { paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  navTabActive: { borderBottomColor: '#fff', backgroundColor: 'rgba(255,255,255,.12)' },
  navTabText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,.75)' },
  navTabTextActive: { color: '#fff' },
  pageContainer: { flex: 1, backgroundColor: '#fff', padding: 14 },
  liveClock: { borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 14 },
  clockTime: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  clockDate: { fontSize: 13, color: '#fff', opacity: 0.9, marginTop: 4 },
  clockTithi: { fontSize: 11, color: '#FFD54F', marginTop: 3 },
  secTitle: { fontSize: 16, fontWeight: '800', color: '#FF6B00', borderLeftWidth: 4, borderLeftColor: '#FFB300', paddingLeft: 10, marginBottom: 8 },
  secSub: { fontSize: 12, color: '#5D3A1A', marginBottom: 12 },
  rashiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  rashiItem: { width: '31%', borderWidth: 1.5, borderColor: '#FFB300', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 10 },
  rSym: { fontSize: 24, paddingBottom: 4 },
  rName: { fontSize: 12, fontWeight: '700', color: '#7B1B00' },
  rEng: { fontSize: 10, color: '#5D3A1A' },
  card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#FFE0B2', padding: 14, elevation: 2 },
  actionBtn: { backgroundColor: '#FF6B00', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  gurujiCard: { borderRadius: 16, borderWidth: 2, borderColor: '#FFB300', padding: 14, elevation: 3, marginBottom: 14 },
  gjHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  gjAvatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 3, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  gjInfo: { flex: 1, marginLeft: 12 },
  gjName: { fontSize: 15, fontWeight: 'bold', color: '#7B1B00' },
  gjSub: { fontSize: 12, color: '#5D3A1A', marginTop: 2 },
  badge: { backgroundColor: '#FF6B00', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 4 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  callBtn: { backgroundColor: '#FF6B00', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  callBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  waBtn: { backgroundColor: '#25D366', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  waBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  closeCameraBtn: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: 'red', padding: 14, borderRadius: 10 },
  closeCameraText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
