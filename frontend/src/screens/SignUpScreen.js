import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { UNIFIED_LANGUAGE_OPTIONS } from '../constants/translationLanguages';
import { authService } from '../services/api';

const USER_STORAGE_KEY = '@echolingua_current_user';
const USERS_DATABASE_KEY = '@echolingua_users_database';

const ROLES = [
  { id: 'learner', label: 'Learner', icon: 'school', description: 'Learn indigenous languages' },
  { id: 'elder', label: 'Elder', icon: 'people', description: 'Share knowledge and stories' },
  { id: 'admin', label: 'Admin', icon: 'shield-checkmark', description: 'Manage community content' },
];

export default function SignUpScreen({ navigation }) {
  const { theme } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('learner');
  const [age, setAge] = useState('');
  const [community, setCommunity] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [languageSearch, setLanguageSearch] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const filteredLanguages = useMemo(() => {
    const query = languageSearch.trim().toLowerCase();
    if (!query) {
      return UNIFIED_LANGUAGE_OPTIONS;
    }

    return UNIFIED_LANGUAGE_OPTIONS.filter((language) => {
      return (
        language.label.toLowerCase().includes(query) ||
        language.region.toLowerCase().includes(query)
      );
    });
  }, [languageSearch]);

  const toggleLanguageSelection = (languageLabel) => {
    setSelectedLanguages((current) => {
      if (current.includes(languageLabel)) {
        return current.filter((item) => item !== languageLabel);
      }
      return [...current, languageLabel];
    });
  };

  const handleSignUp = async () => {
    // Validation
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Connect to Backend API for registration
      const data = await authService.register(
        fullName.trim(),
        email.trim(),
        password,
        selectedRole
      );
      
      const user = data.user;

      // Store local user data for compatibility or extra fields not on backend
      if (user) {
         // Create local user structure compatible with existing code
         const userWithLocalData = {
           ...user,
           fullName: user.name || fullName.trim(),
           age: age.trim() || null,
           community: community.trim() || null,
           languages: selectedLanguages,
         };
         await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userWithLocalData));
      }

      Alert.alert('Success', 'Account created successfully!', [
        {
          text: 'OK',
          onPress: () => {
             // Navigation logic, backend login successful, go to MainTabs
             navigation.reset({
              index: 0,
              routes: [{ name: 'MainTabs' }],
            });
          },
        },
      ]);
    } catch (error) {
       console.error('Sign up error:', error);
       Alert.alert('Error', error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: theme.surfaceVariant }]}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/appLogo.png')}
                style={styles.appLogo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join our language preservation community</Text>
          </View>

          {/* Sign Up Form */}
          <View style={[styles.formContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Full Name *</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Ionicons name="person-outline" size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Enter your full name"
                  placeholderTextColor={theme.textSecondary}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Email *</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Ionicons name="mail-outline" size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Password *</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Create a password (min 6 characters)"
                  placeholderTextColor={theme.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Confirm Password *</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Re-enter your password"
                  placeholderTextColor={theme.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons
                    name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Optional Information */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Additional Information (Optional)</Text>

            {/* Age */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Age</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Enter your age"
                  placeholderTextColor={theme.textSecondary}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Community */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Community/Region</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Ionicons name="location-outline" size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="e.g., Kadazandusun, Iban, Bajau"
                  placeholderTextColor={theme.textSecondary}
                  value={community}
                  onChangeText={setCommunity}
                />
              </View>
            </View>

            {/* Languages */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Languages You Know</Text>
              <TouchableOpacity
                style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={() => setShowLanguageModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="language-outline" size={20} color={theme.textSecondary} />
                <Text
                  style={[
                    styles.input,
                    { color: selectedLanguages.length ? theme.text : theme.textSecondary },
                    styles.languageSelectorText,
                  ]}
                  numberOfLines={1}
                >
                  {selectedLanguages.length
                    ? `${selectedLanguages.length} selected`
                    : 'Select from world language list'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
              {selectedLanguages.length > 0 && (
                <View style={styles.selectedLanguagesWrap}>
                  {selectedLanguages.map((language) => (
                    <View
                      key={language}
                      style={[styles.selectedLanguageChip, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}
                    >
                      <Text style={[styles.selectedLanguageText, { color: theme.text }]}>{language}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.signUpButton, { backgroundColor: theme.primary }, isLoading && styles.signUpButtonDisabled]}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              <Text style={[styles.signUpButtonText, { color: theme.background }]}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={theme.background} />
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: theme.textSecondary }]}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.loginLink, { color: theme.primary }]}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showLanguageModal} transparent animationType="slide" onRequestClose={() => setShowLanguageModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.languageModalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
            <View style={[styles.languageModalHeader, { borderBottomColor: theme.border }]}> 
              <Text style={[styles.languageModalTitle, { color: theme.text }]}>Select Languages</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputContainer, styles.languageSearchInput, { backgroundColor: theme.background, borderColor: theme.border }]}> 
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Search languages or region"
                placeholderTextColor={theme.textSecondary}
                value={languageSearch}
                onChangeText={setLanguageSearch}
              />
            </View>

            <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
              {filteredLanguages.map((language) => {
                const isSelected = selectedLanguages.includes(language.label);
                return (
                  <TouchableOpacity
                    key={language.id}
                    style={[styles.languageOption, { borderBottomColor: theme.border }]}
                    onPress={() => toggleLanguageSelection(language.label)}
                  >
                    <Text style={styles.languageFlag}>{language.flag}</Text>
                    <View style={styles.languageOptionTextWrap}>
                      <Text style={[styles.languageOptionTitle, { color: theme.text }]}>{language.label}</Text>
                      <Text style={[styles.languageOptionRegion, { color: theme.textSecondary }]}>{language.region}</Text>
                    </View>
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={isSelected ? theme.primary : theme.textSecondary}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[styles.doneButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={[styles.doneButtonText, { color: theme.background }]}>Done</Text>
            </TouchableOpacity>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.xl,
  },
  header: {
    marginTop: SPACING.l,
    marginBottom: SPACING.l,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.m,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: SPACING.m,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignSelf: 'center',
  },
  appLogo: {
    width: '78%',
    height: '78%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#C7D2FE',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...SHADOWS.medium,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.l,
    marginBottom: SPACING.m,
  },
  rolesContainer: {
    flexDirection: 'row',
    gap: SPACING.m,
    marginBottom: SPACING.m,
  },
  roleCard: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: SPACING.m,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  roleCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.s,
  },
  roleLabelActive: {
    color: COLORS.primary,
  },
  roleDescription: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
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
    height: 50,
  },
  input: {
    flex: 1,
    marginLeft: SPACING.s,
    fontSize: 15,
    color: COLORS.text,
  },
  languageSelectorText: {
    marginRight: SPACING.xs,
  },
  selectedLanguagesWrap: {
    marginTop: SPACING.s,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  selectedLanguageChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: SPACING.s,
    paddingVertical: 4,
  },
  selectedLanguageText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  languageModalContent: {
    maxHeight: '80%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    padding: SPACING.m,
  },
  languageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: SPACING.s,
    marginBottom: SPACING.s,
  },
  languageModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  languageSearchInput: {
    marginBottom: SPACING.s,
  },
  languageList: {
    maxHeight: 360,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    paddingVertical: SPACING.s,
    borderBottomWidth: 1,
  },
  languageFlag: {
    fontSize: 20,
  },
  languageOptionTextWrap: {
    flex: 1,
  },
  languageOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  languageOptionRegion: {
    fontSize: 12,
    marginTop: 2,
  },
  doneButton: {
    marginTop: SPACING.m,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: SPACING.m,
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  signUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: SPACING.m,
    marginTop: SPACING.xl,
    gap: SPACING.s,
    ...SHADOWS.small,
  },
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.l,
  },
  loginText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
