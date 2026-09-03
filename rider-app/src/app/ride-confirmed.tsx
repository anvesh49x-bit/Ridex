import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function RideConfirmed() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/rides');
          }
        }}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride Confirmed</Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>Ride Confirmed!</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/active-ride')}>
          <Text style={styles.buttonText}>Start Active Ride</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backButton: { marginRight: 14 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  button: { backgroundColor: '#16A34A', padding: 15, borderRadius: 10 },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold' }
});
