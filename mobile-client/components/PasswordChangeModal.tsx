import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Alert, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import Colors from '../constants/Colors';

type FormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

interface PasswordChangeModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PasswordChangeModal({ visible, onClose }: PasswordChangeModalProps) {
  const { updatePassword, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { control, handleSubmit, formState: { errors }, watch, reset } = useForm<FormData>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
  });

  const newPassword = watch('newPassword');

  // Réinitialiser le formulaire quand le modal s'ouvre
  React.useEffect(() => {
    if (visible) {
      reset({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [visible, reset]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await updatePassword(data.currentPassword, data.newPassword);
      Alert.alert(
        'Succès',
        'Votre mot de passe a été mis à jour avec succès',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error: any) {
      let errorMessage = 'Une erreur est survenue lors de la mise à jour du mot de passe';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.centeredView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.modalView}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.formContainer}>
              <Text style={styles.title}>Changer votre mot de passe</Text>
              
              <Controller
                control={control}
                rules={{
                  required: 'Le mot de passe actuel est requis',
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Mot de passe actuel</Text>
                    <TextInput
                      style={[styles.input, errors.currentPassword && styles.inputError]}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      placeholder="Votre mot de passe actuel"
                      secureTextEntry
                      autoComplete="password"
                    />
                    {errors.currentPassword && <Text style={styles.errorText}>{errors.currentPassword.message}</Text>}
                  </View>
                )}
                name="currentPassword"
              />

              <Controller
                control={control}
                rules={{
                  required: 'Le nouveau mot de passe est requis',
                  minLength: {
                    value: 6,
                    message: 'Le mot de passe doit contenir au moins 6 caractères',
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Nouveau mot de passe</Text>
                    <TextInput
                      style={[styles.input, errors.newPassword && styles.inputError]}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      placeholder="Votre nouveau mot de passe"
                      secureTextEntry
                      autoComplete="password-new"
                    />
                    {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword.message}</Text>}
                  </View>
                )}
                name="newPassword"
              />

              <Controller
                control={control}
                rules={{
                  required: 'La confirmation du mot de passe est requise',
                  validate: value => value === newPassword || 'Les mots de passe ne correspondent pas',
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Confirmer le nouveau mot de passe</Text>
                    <TextInput
                      style={[styles.input, errors.confirmPassword && styles.inputError]}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      placeholder="Confirmez votre nouveau mot de passe"
                      secureTextEntry
                      autoComplete="password-new"
                    />
                    {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}
                  </View>
                )}
                name="confirmPassword"
              />

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onClose}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Enregistrer</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: Colors.light.background,
    borderRadius: 20,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    color: '#555',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingVertical: 12,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    paddingVertical: 12,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
