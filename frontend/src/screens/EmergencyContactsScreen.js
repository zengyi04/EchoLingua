import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const USER_STORAGE_KEY = '@echolingua_current_user';
const USERS_DATABASE_KEY = '@echolingua_users_database';

export default function EmergencyContactsScreen({ navigation }) {
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactUsername, setContactUsername] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelation, setContactRelation] = useState('');
  const [editingContactId, setEditingContactId] = useState(null);

  const { theme } = useTheme();

  useEffect(() => {
    loadEmergencyContacts();
  }, []);

  const resetContactForm = () => {
    setEditingContactId(null);
    setContactName('');
    setContactUsername('');
    setContactEmail('');
    setContactPhone('');
    setContactRelation('');
  };

  const loadEmergencyContacts = async () => {
    try {
      const currentUserData = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (currentUserData) {
        const user = JSON.parse(currentUserData);
        setEmergencyContacts(user.emergencyContacts || []);
      }
    } catch (error) {
      console.error('Error loading emergency contacts:', error);
    }
  };

  const handleAddContact = async () => {
    if (!contactName.trim()) {
      Alert.alert('Error', 'Please enter contact name');
      return;
    }

    if (!contactUsername.trim() && !contactEmail.trim() && !contactPhone.trim()) {
      Alert.alert('Error', 'Please enter username, email, or phone number');
      return;
    }

    try {
      const usersData = await AsyncStorage.getItem(USERS_DATABASE_KEY);
      const users = usersData ? JSON.parse(usersData) : [];

      const normalizedUsername = contactUsername.trim().toLowerCase();
      const normalizedEmail = contactEmail.trim().toLowerCase();
      const normalizedPhone = contactPhone.trim();

      const linkedUser = users.find((appUser) => {
        return (
          (normalizedEmail && appUser.email?.toLowerCase() === normalizedEmail) ||
          (normalizedPhone && appUser.phone === normalizedPhone) ||
          (normalizedUsername && (
            appUser.username?.toLowerCase() === normalizedUsername ||
            appUser.fullName?.toLowerCase() === normalizedUsername
          ))
        );
      });

      if (!linkedUser) {
        Alert.alert(
          'App Account Required',
          'Contact must have an existing app account. Please enter matching username, email, or phone.'
        );
        return;
      }

      const newContact = {
        id: editingContactId || Date.now().toString(),
        name: contactName.trim(),
        username: contactUsername.trim() || linkedUser.username || null,
        email: contactEmail.trim() || linkedUser.email || null,
        phone: contactPhone.trim() || linkedUser.phone || null,
        relation: contactRelation.trim() || 'Other',
        linkedUserId: linkedUser.id,
        linkedUserName: linkedUser.fullName,
        hasAppAccount: true,
        addedAt: new Date().toISOString(),
      };

      const updatedContacts = editingContactId
        ? emergencyContacts.map((contact) => (contact.id === editingContactId ? newContact : contact))
        : [...emergencyContacts, newContact];

      // Update current user
      const currentUserData = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (currentUserData) {
        const user = JSON.parse(currentUserData);
        user.emergencyContacts = updatedContacts;
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

        // Update users database
        if (usersData) {
          const userIndex = users.findIndex(u => u.id === user.id);
          if (userIndex !== -1) {
            users[userIndex].emergencyContacts = updatedContacts;
            await AsyncStorage.setItem(USERS_DATABASE_KEY, JSON.stringify(users));
          }
        }
      }

      setEmergencyContacts(updatedContacts);
      setShowAddModal(false);
      resetContactForm();
      Alert.alert(
        'Success',
        editingContactId
          ? 'Emergency contact updated successfully!'
          : 'Emergency contact linked to an app account successfully!'
      );
    } catch (error) {
      console.error('Error adding contact:', error);
      Alert.alert('Error', 'Failed to add contact');
    }
  };

  const handleDeleteContact = async (contactId) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to remove this emergency contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedContacts = emergencyContacts.filter(c => c.id !== contactId);

              // Update current user
              const currentUserData = await AsyncStorage.getItem(USER_STORAGE_KEY);
              if (currentUserData) {
                const user = JSON.parse(currentUserData);
                user.emergencyContacts = updatedContacts;
                await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

                // Update users database
                const usersData = await AsyncStorage.getItem(USERS_DATABASE_KEY);
                if (usersData) {
                  const users = JSON.parse(usersData);
                  const userIndex = users.findIndex(u => u.id === user.id);
                  if (userIndex !== -1) {
                    users[userIndex].emergencyContacts = updatedContacts;
                    await AsyncStorage.setItem(USERS_DATABASE_KEY, JSON.stringify(users));
                  }
                }
              }

              setEmergencyContacts(updatedContacts);
              Alert.alert('Success', 'Contact removed');
            } catch (error) {
              console.error('Error deleting contact:', error);
              Alert.alert('Error', 'Failed to delete contact');
            }
          },
        },
      ]
    );
  };

  const handleEditContact = (contact) => {
    setEditingContactId(contact.id);
    setContactName(contact.name || '');
    setContactUsername(contact.username || '');
    setContactEmail(contact.email || '');
    setContactPhone(contact.phone || '');
    setContactRelation(contact.relation || '');
    setShowAddModal(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Emergency Contacts</Text>
        <TouchableOpacity onPress={() => {
          resetContactForm();
          setShowAddModal(true);
        }}>
          <Ionicons name="add-circle" size={28} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
          <Ionicons name="information-circle" size={24} color={theme.primary} />
          <Text style={[styles.infoBannerText, { color: theme.text }]}>
            Emergency contacts can receive your recordings when you share stories. 
            This helps preserve important cultural knowledge.
          </Text>
        </View>

        {/* Contacts List */}
        {emergencyContacts.length > 0 ? (
          emergencyContacts.map((contact) => (
            <View key={contact.id} style={[styles.contactCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.contactIconContainer}>
                <Ionicons name="person-circle" size={48} color={theme.primary} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={[styles.contactName, { color: theme.text }]}>{contact.name}</Text>
                <Text style={[styles.contactRelation, { color: theme.primary }]}>{contact.relation}</Text>
                {contact.username && (
                  <View style={styles.contactDetailRow}>
                    <Ionicons name="at" size={14} color={theme.textSecondary} />
                    <Text style={[styles.contactDetail, { color: theme.textSecondary }]}>{contact.username}</Text>
                  </View>
                )}
                {contact.email && (
                  <View style={styles.contactDetailRow}>
                    <Ionicons name="mail" size={14} color={theme.textSecondary} />
                    <Text style={[styles.contactDetail, { color: theme.textSecondary }]}>{contact.email}</Text>
                  </View>
                )}
                {contact.phone && (
                  <View style={styles.contactDetailRow}>
                    <Ionicons name="call" size={14} color={theme.textSecondary} />
                    <Text style={[styles.contactDetail, { color: theme.textSecondary }]}>{contact.phone}</Text>
                  </View>
                )}
                {contact.hasAppAccount && (
                  <View style={[styles.linkedBadge, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '55' }]}>
                    <Ionicons name="checkmark-circle" size={12} color={theme.primary} />
                    <Text style={[styles.linkedBadgeText, { color: theme.primary }]}>Linked App User</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleEditContact(contact)}
              >
                <Ionicons name="create-outline" size={22} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteContact(contact.id)}
              >
                <Ionicons name="trash-outline" size={22} color={theme.error} />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyStateText, { color: theme.text }]}>No emergency contacts yet</Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.textSecondary }]}>
              Add contacts who can receive your important recordings
            </Text>
            <TouchableOpacity
              style={[styles.addFirstButton, { backgroundColor: theme.primary }]}
              onPress={() => {
                resetContactForm();
                setShowAddModal(true);
              }}
            >
              <Ionicons name="add" size={20} color={theme.background} />
              <Text style={[styles.addFirstButtonText, { color: theme.background }]}>Add First Contact</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Add Contact Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingContactId ? 'Update Emergency Contact' : 'Add Emergency Contact'}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowAddModal(false);
                resetContactForm();
              }}>
                <Ionicons name="close" size={28} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {/* Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Full Name *</Text>
                <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <Ionicons name="person-outline" size={20} color={theme.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Enter contact name"
                    placeholderTextColor={theme.textSecondary}
                    value={contactName}
                    onChangeText={setContactName}
                  />
                </View>
              </View>

              {/* Relation */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Relationship</Text>
                <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <Ionicons name="heart-outline" size={20} color={theme.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="e.g., Family, Elder, Community Leader"
                    placeholderTextColor={theme.textSecondary}
                    value={contactRelation}
                    onChangeText={setContactRelation}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Username</Text>
                <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <Ionicons name="at-outline" size={20} color={theme.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Enter username/full name in app"
                    placeholderTextColor={theme.textSecondary}
                    value={contactUsername}
                    onChangeText={setContactUsername}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Email</Text>
                <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <Ionicons name="mail-outline" size={20} color={theme.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Enter email address"
                    placeholderTextColor={theme.textSecondary}
                    value={contactEmail}
                    onChangeText={setContactEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Phone */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Phone Number</Text>
                <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <Ionicons name="call-outline" size={20} color={theme.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Enter phone number"
                    placeholderTextColor={theme.textSecondary}
                    value={contactPhone}
                    onChangeText={setContactPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.primary }]} onPress={handleAddContact}>
                <Text style={[styles.addButtonText, { color: theme.background }]}>
                  {editingContactId ? 'Update Contact' : 'Add Contact'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: SPACING.l,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    padding: SPACING.m,
    marginBottom: SPACING.l,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    marginLeft: SPACING.m,
    lineHeight: 20,
  },
  contactCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...SHADOWS.small,
  },
  contactIconContainer: {
    marginRight: SPACING.m,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  contactRelation: {
    fontSize: 13,
    color: COLORS.primary,
    marginBottom: SPACING.s,
  },
  contactDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  contactDetail: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  linkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: SPACING.s,
    paddingVertical: 3,
    marginTop: SPACING.s,
  },
  linkedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deleteButton: {
    padding: SPACING.s,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.m,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.s,
    paddingHorizontal: SPACING.xl,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.m,
    borderRadius: 24,
    marginTop: SPACING.l,
    gap: SPACING.xs,
    ...SHADOWS.small,
  },
  addFirstButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.l,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.l,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalScrollView: {
    marginBottom: SPACING.m,
  },
  inputGroup: {
    marginBottom: SPACING.m,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.s,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: SPACING.m,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.s,
    fontSize: 15,
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: SPACING.m,
    alignItems: 'center',
    marginTop: SPACING.m,
    ...SHADOWS.small,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
});
