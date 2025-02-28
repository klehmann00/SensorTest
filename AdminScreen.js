import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Clipboard,
  Platform
} from 'react-native';
import { getDatabase, ref, get, set } from 'firebase/database';
import { useAdmin } from './AdminContext';
import { exportSessionData } from './DataExport';
import * as FileSystem from 'expo-file-system';
import * as MailComposer from 'expo-mail-composer';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C3E50',
  },
  header: {
    padding: 20,
    backgroundColor: '#34495e',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subTitle: {
    fontSize: 16,
    color: '#95a5a6',
    marginTop: 5,
  },
  text: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  subText: {
    color: '#95a5a6',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  error: {
    color: '#e74c3c',
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  userList: {
    padding: 15,
  },
  userCard: {
    backgroundColor: '#34495e',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  userInfo: {
    marginBottom: 10,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  userEmail: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  copyButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginLeft: 10,
  },
  copyButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userId: {
    color: '#95a5a6',
    fontSize: 14,
    marginBottom: 5,
  },
  lastActive: {
    color: '#95a5a6',
    fontSize: 14,
    marginBottom: 5,
  },
  status: {
    fontSize: 14,
    marginBottom: 5,
  },
  statusActive: {
    color: '#2ecc71',
  },
  statusDisabled: {
    color: '#e74c3c',
  },
  accessButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: '#4ECDC4',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 20,
    marginTop: 10,
  },
  sessionsSection: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#2C3E50',
    borderRadius: 5,
  },
  sessionsTitle: {
    color: '#95a5a6',
    fontSize: 14,
    marginBottom: 8,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  sessionDate: {
    color: '#95a5a6',
    fontSize: 12,
  },
  sessionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  exportButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  exportButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

const AdminScreen = () => {
  const { isAdmin } = useAdmin();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      console.log("Loading users...");
      const db = getDatabase();
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);

      if (snapshot.exists()) {
        const usersData = [];
        snapshot.forEach((child) => {
          usersData.push({
            id: child.key,
            email: child.val().email,
            lastActive: child.val().sensorData?.accelerometer?.timestamp || 0,
            access: child.val().access || false,
            sessions: child.val().sessions || {}
          });
        });
        console.log(`Found ${usersData.length} users`);
        setUsers(usersData.sort((a, b) => b.lastActive - a.lastActive));
      } else {
        console.log("No users found");
        setUsers([]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    loadUsers();
  }, [isAdmin, loadUsers]);

  const handleExportSession = async (userId, sessionId) => {
    try {
      setLoading(true);
      const exportData = await exportSessionData(userId, sessionId);
      
      // Create exports directory
      const dirPath = `${FileSystem.documentDirectory}exports/`;
      const dirInfo = await FileSystem.getInfoAsync(dirPath);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
      }

      // Create and write each file
      const filePaths = await Promise.all(exportData.files.map(async (file) => {
        const timestamp = new Date().getTime();
        const filePath = `${dirPath}${timestamp}_${file.fileName}`;
        await FileSystem.writeAsStringAsync(filePath, file.content);
        console.log('File written to:', filePath);
        return filePath;
      }));

      // Check if mail is available
      const isAvailable = await MailComposer.isAvailableAsync();
      
      if (isAvailable) {
        const result = await MailComposer.composeAsync({
          subject: `Sensor Data Export - ${new Date(parseInt(sessionId)).toLocaleString()}`,
          body: 'Attached are the sensor data files from your session.',
          attachments: filePaths
        });
        console.log('Mail result:', result);
      } else {
        Alert.alert('Error', 'Email is not available on this device');
      }

    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', `Failed to export session data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (userId, sessionId) => {
    try {
      Alert.alert(
        'Delete Session',
        'Are you sure you want to delete this session data? This cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              setLoading(true);
              const db = getDatabase();
              await set(ref(db, `users/${userId}/sessions/${sessionId}`), null);
              console.log('Session deleted successfully');
              loadUsers(); // Refresh the user list to reflect changes
            }
          }
        ]
      );
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', 'Failed to delete session data');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserAccess = async (userId, currentAccess) => {
    try {
      const db = getDatabase();
      const userAccessRef = ref(db, `users/${userId}/access`);
      
      Alert.alert(
        'Confirm Action',
        `Are you sure you want to ${currentAccess ? 'disable' : 'enable'} this user's access?`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Confirm',
            onPress: async () => {
              await set(userAccessRef, !currentAccess);
              loadUsers(); // Reload users after toggling access
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle user access');
      console.error('Error toggling user access:', error);
    }
  };

  const copyEmailToClipboard = (email) => {
    if (email) {
      Clipboard.setString(email);
      Alert.alert('Copied', 'Email address copied to clipboard');
    }
  };

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Access Denied</Text>
        <Text style={styles.subText}>You don't have administrator privileges.</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={loadUsers}
        >
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4ECDC4" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subTitle}>Managing {users.length} Users</Text>
      </View>
      
      <View style={styles.userList}>
        {users.map((user) => (
          <View key={user.id} style={styles.userCard}>
            <View style={styles.userInfo}>
              <View style={styles.emailContainer}>
                <Text style={styles.userEmail}>{user.email || 'No email'}</Text>
                <TouchableOpacity 
                  onPress={() => copyEmailToClipboard(user.email)}
                  style={styles.copyButton}
                >
                  <Text style={styles.copyButtonText}>Copy</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.userId}>ID: {user.id}</Text>
              <Text style={styles.lastActive}>
                Last Active: {user.lastActive ? new Date(user.lastActive).toLocaleString() : 'Never'}
              </Text>
              <Text style={[styles.status, user.access ? styles.statusActive : styles.statusDisabled]}>
                Status: {user.access ? 'Active' : 'Disabled'}
              </Text>
              
              {/* Sessions Section */}
              {Object.keys(user.sessions || {}).length > 0 && (
                <View style={styles.sessionsSection}>
                  <Text style={styles.sessionsTitle}>Recorded Sessions:</Text>
                  {Object.entries(user.sessions).map(([sessionId, session]) => (
                    <View key={sessionId} style={styles.sessionRow}>
                      <Text style={styles.sessionDate}>
                        {new Date(parseInt(sessionId)).toLocaleString()}
                      </Text>
                      <View style={styles.sessionButtons}>
                        <TouchableOpacity
                          style={styles.exportButton}
                          onPress={() => handleExportSession(user.id, sessionId)}
                        >
                          <Text style={styles.exportButtonText}>Export</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteSession(user.id, sessionId)}
                        >
                          <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.accessButton,
                { backgroundColor: user.access ? '#e74c3c' : '#2ecc71' }
              ]}
              onPress={() => toggleUserAccess(user.id, user.access)}
            >
              <Text style={styles.buttonText}>
                {user.access ? 'Disable Access' : 'Enable Access'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default AdminScreen;