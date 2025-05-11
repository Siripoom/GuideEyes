import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import BusRecognitionService from '../services/BusRecognition';
import Tts from 'react-native-tts';

const TestOllama = () => {
  const [status, setStatus] = useState<
    'idle' | 'testing' | 'success' | 'error'
  >('idle');
  const [message, setMessage] = useState('');

  const testConnection = async () => {
    setStatus('testing');
    setMessage('กำลังทดสอบการเชื่อมต่อ...');

    try {
      const isConnected = await BusRecognitionService.testOllamaConnection();

      if (isConnected) {
        setStatus('success');
        setMessage('เชื่อมต่อกับ Ollama สำเร็จ!');
        Tts.speak('เชื่อมต่อกับระบบจดจำรถเมล์สำเร็จ');
      } else {
        setStatus('error');
        setMessage('ไม่สามารถเชื่อมต่อกับ Ollama ได้');
        Tts.speak('ไม่สามารถเชื่อมต่อกับระบบได้');
      }
    } catch (error) {
      setStatus('error');
      setMessage('เกิดข้อผิดพลาด: ' + (error as Error).message);
      Tts.speak('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ทดสอบระบบจดจำรถเมล์</Text>

      <TouchableOpacity
        style={[
          styles.button,
          status === 'testing' && styles.buttonTesting,
          status === 'success' && styles.buttonSuccess,
          status === 'error' && styles.buttonError,
        ]}
        onPress={testConnection}
        disabled={status === 'testing'}>
        {status === 'testing' ? (
          <ActivityIndicator size="large" color="white" />
        ) : (
          <Text style={styles.buttonText}>
            {status === 'idle' ? 'ทดสอบการเชื่อมต่อ' : 'ทดสอบอีกครั้ง'}
          </Text>
        )}
      </TouchableOpacity>

      <Text
        style={[
          styles.message,
          status === 'success' && styles.successText,
          status === 'error' && styles.errorText,
        ]}>
        {message}
      </Text>

      {status === 'success' && (
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ระบบพร้อมใช้งาน!</Text>
          <Text style={styles.infoText}>
            คุณสามารถใช้คำสั่ง "เลขสาย" เพื่อจดจำรถเมล์ได้แล้ว
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 50,
    marginBottom: 20,
    minWidth: 250,
    alignItems: 'center',
  },
  buttonTesting: {
    backgroundColor: '#FFA500',
  },
  buttonSuccess: {
    backgroundColor: '#4CAF50',
  },
  buttonError: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 10,
    color: '#666',
  },
  successText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#E8F5E9',
    padding: 20,
    borderRadius: 10,
    marginTop: 30,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
});

export default TestOllama;
