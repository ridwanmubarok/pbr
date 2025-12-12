import { useState } from 'react';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
} from 'react-native-image-picker';
import * as DocumentPicker from '@react-native-documents/picker';
import ReactNativeBlobUtil from 'react-native-blob-util';

export interface Attachment {
  type: 'image' | 'document';
  uri: string;
  name?: string;
  mimeType?: string;
  base64?: string;
}

interface UseAttachmentsReturn {
  attachments: Attachment[];
  showAttachmentMenu: boolean;
  setShowAttachmentMenu: (show: boolean) => void;
  handleTakePhoto: () => Promise<void>;
  handlePickImage: () => Promise<void>;
  handlePickDocument: () => Promise<void>;
  removeAttachment: (index: number) => void;
  clearAttachments: () => void;
}

export const useAttachments = (): UseAttachmentsReturn => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs access to your camera',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleTakePhoto = async () => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert(
          'Izin Ditolak',
          'Izin kamera diperlukan untuk mengambil foto',
        );
        return;
      }

      const result: ImagePickerResponse = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: true,
        saveToPhotos: false,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Alert.alert('Error', result.errorMessage || 'Gagal mengambil foto');
        return;
      }

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const attachment: Attachment = {
          type: 'image',
          uri: asset.uri || '',
          name: asset.fileName || 'photo.jpg',
          mimeType: asset.type || 'image/jpeg',
          base64: asset.base64,
        };
        setAttachments(prev => [...prev, attachment]);
        setShowAttachmentMenu(false);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Gagal mengambil foto. Silakan coba lagi.');
    }
  };

  const handlePickImage = async () => {
    try {
      const result: ImagePickerResponse = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: true,
        selectionLimit: 1,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Alert.alert('Error', result.errorMessage || 'Gagal memilih gambar');
        return;
      }

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const attachment: Attachment = {
          type: 'image',
          uri: asset.uri || '',
          name: asset.fileName || 'image.jpg',
          mimeType: asset.type || 'image/jpeg',
          base64: asset.base64,
        };
        setAttachments(prev => [...prev, attachment]);
        setShowAttachmentMenu(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Gagal memilih gambar. Silakan coba lagi.');
    }
  };

  const handlePickDocument = async () => {
    try {
      // DocumentPicker uses SAF (Storage Access Framework) which handles permissions automatically
      // No need to request READ_MEDIA_DOCUMENTS manually on Android 13+
      const result = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.pdf,
          DocumentPicker.types.doc,
          DocumentPicker.types.docx,
        ],
        copyTo: 'cachesDirectory',
      });

      if (result && result.length > 0) {
        const doc = result[0];

        // Read file and convert to base64
        let base64Data: string | undefined;
        try {
          let filePath = doc.uri;

          if (Platform.OS === 'android' && filePath.startsWith('content://')) {
            // Android content URI - use fetch API which handles permissions better
            const response = await ReactNativeBlobUtil.fetch(
              'GET',
              filePath,
              {},
            );
            base64Data = await response.base64();
          } else {
            // iOS or file:// URI
            const cleanPath = decodeURIComponent(
              filePath.replace('file://', ''),
            );
            base64Data = await ReactNativeBlobUtil.fs.readFile(
              cleanPath,
              'base64',
            );
          }
        } catch (readError) {
          console.error('Error reading file:', readError);
          Alert.alert(
            'Error',
            'Gagal membaca file dokumen. Pastikan file dapat diakses.',
          );
          return;
        }

        const attachment: Attachment = {
          type: 'document',
          uri: doc.uri,
          name: doc.name || 'document',
          mimeType: doc.type || 'application/pdf',
          base64: base64Data,
        };
        setAttachments(prev => [...prev, attachment]);
        setShowAttachmentMenu(false);
      }
    } catch (error: any) {
      // User cancelled the picker
      if (
        error?.message?.includes('cancel') ||
        error?.message?.includes('DOCUMENT_PICKER_CANCELED')
      ) {
        return;
      }
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Gagal memilih dokumen. Silakan coba lagi.');
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const clearAttachments = () => {
    setAttachments([]);
  };

  return {
    attachments,
    showAttachmentMenu,
    setShowAttachmentMenu,
    handleTakePhoto,
    handlePickImage,
    handlePickDocument,
    removeAttachment,
    clearAttachments,
  };
};
