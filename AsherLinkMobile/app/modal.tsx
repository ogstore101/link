import { useRouter } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { X } from 'lucide-react-native';

export default function ModalScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#0f172a' }]}>
      <View style={styles.header}>
        <Text style={styles.title}>WiFi Settings</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <X color="#94a3b8" size={24} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.subtitle}>Manage your WiFi preferences and account settings</Text>
        
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.option}
            activeOpacity={0.7}
            onPress={() => router.push('/')}
          >
            <Text style={styles.optionText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 24,
    lineHeight: 20,
  },
  section: {
    gap: 12,
  },
  option: {
    backgroundColor: '#1e293b',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a78bfa',
    textAlign: 'center',
  },
});
