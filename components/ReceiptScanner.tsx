import { Ionicons } from '@expo/vector-icons';

import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
// OCR.space API configuration
const OCR_SPACE_API_KEY = 'K87895122588957'; // Replace with your OCR.space API key
const OCR_SPACE_URL = 'https://api.ocr.space/parse/image';

interface ReceiptScannerProps {
    visible: boolean;
    onClose: () => void;
    onReceiptScanned: (data: {
        title: string;
        amount: string;
        category: string;
    }) => void;
}

interface ExtractedData {
    title: string;
    amount: string;
    category: string;
}

export default function ReceiptScanner({ visible, onClose, onReceiptScanned }: ReceiptScannerProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [scannedImage, setScannedImage] = useState<string | null>(null);

    const requestCameraPermission = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Camera permission is required to scan receipts.');
            return false;
        }
        return true;
    };

    const takePhoto = async () => {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [3, 4],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setScannedImage(result.assets[0].uri);
                await processImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Error', 'Failed to take photo. Please try again.');
        }
    };

    const pickFromGallery = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [3, 4],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setScannedImage(result.assets[0].uri);
                await processImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image. Please try again.');
        }
    };

    const processImage = async (imageUri: string) => {
        setIsProcessing(true);

        try {
            // Call OCR.space API directly with image URI
            const ocrText = await performOCR(imageUri);

            if (ocrText) {
                // Extract receipt data from OCR text
                const extractedData = extractReceiptData(ocrText);

                if (extractedData.amount) {
                    onReceiptScanned(extractedData);
                    handleClose();
                } else {
                    // Show options for manual entry or retry
                    Alert.alert(
                        'Receipt Processed',
                        'Could not detect amount automatically. Would you like to enter details manually?',
                        [
                            { text: 'Try Again', onPress: () => setScannedImage(null) },
                            {
                                text: 'Enter Manually',
                                onPress: () => {
                                    onReceiptScanned({
                                        title: extractedData.title || 'Receipt',
                                        amount: '',
                                        category: extractedData.category || 'Others'
                                    });
                                    handleClose();
                                }
                            }
                        ]
                    );
                }
            } else {
                throw new Error('No text detected');
            }
        } catch (error) {
            console.error('OCR Error:', error);
            Alert.alert(
                'Processing Failed',
                'Failed to process receipt. Please enter details manually.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            onReceiptScanned({
                                title: 'Receipt',
                                amount: '',
                                category: 'Others'
                            });
                            handleClose();
                        }
                    }
                ]
            );
        } finally {
            setIsProcessing(false);
        }
    };

    const performOCR = async (imageUri: string): Promise<string> => {
        try {
            // Create FormData for OCR.space API
            const formData = new FormData();
            formData.append('apikey', OCR_SPACE_API_KEY);
            formData.append('language', 'eng');
            formData.append('isOverlayRequired', 'false');
            formData.append('detectOrientation', 'false');
            formData.append('isTable', 'false');
            formData.append('scale', 'true');
            formData.append('OCREngine', '2'); // Use OCR Engine 2 for better accuracy

            // Add the image file
            formData.append('file', {
                uri: imageUri,
                type: 'image/jpeg',
                name: 'receipt.jpg',
            } as any);

            console.log('Making OCR.space API request...');

            const response = await fetch(OCR_SPACE_URL, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('OCR.space response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.log('OCR.space error response:', errorText);
                throw new Error(`OCR.space API error: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log('OCR.space result:', JSON.stringify(result, null, 2));

            if (result.ParsedResults && result.ParsedResults.length > 0) {
                const parsedText = result.ParsedResults[0].ParsedText;
                if (parsedText && parsedText.trim()) {
                    return parsedText;
                } else {
                    throw new Error('No text detected in image');
                }
            } else if (result.ErrorMessage) {
                throw new Error(`OCR.space error: ${result.ErrorMessage.join(', ')}`);
            } else {
                throw new Error('No text detected in image');
            }
        } catch (error) {
            console.error('OCR.space API Error:', error);
            throw error;
        }
    };

    const extractReceiptData = (text: string): ExtractedData => {
        console.log('OCR Text:', text);

        // Extract amount (look for currency patterns)
        const amountPatterns = [
            /(?:रु|Rs\.?|NPR)\s*(\d+(?:[,\.]\d+)*)/gi,
            /(\d+(?:[,\.]\d+)*)\s*(?:रु|Rs\.?|NPR)/gi,
            /total[:\s]*(?:रु|Rs\.?|NPR)?\s*(\d+(?:[,\.]\d+)*)/gi,
            /amount[:\s]*(?:रु|Rs\.?|NPR)?\s*(\d+(?:[,\.]\d+)*)/gi,
        ];

        let amount = '';
        for (const pattern of amountPatterns) {
            const match = text.match(pattern);
            if (match) {
                const numbers = match[0].match(/\d+(?:[,\.]\d+)*/);
                if (numbers) {
                    amount = numbers[0].replace(/,/g, '');
                    break;
                }
            }
        }

        // If no currency pattern found, look for largest number
        if (!amount) {
            const numbers = text.match(/\d+(?:[,\.]\d+)*/g);
            if (numbers) {
                const numericValues = numbers.map((n: string) => parseFloat(n.replace(/,/g, '')));
                const maxAmount = Math.max(...numericValues);
                if (maxAmount > 0) {
                    amount = maxAmount.toString();
                }
            }
        }

        // Extract merchant name (usually first few words or after common prefixes)
        let title = 'Receipt';
        const lines = text.split('\n').filter((line: string) => line.trim().length > 0);
        if (lines.length > 0) {
            // Look for merchant name in first few lines
            for (let i = 0; i < Math.min(3, lines.length); i++) {
                const line = lines[i].trim();
                if (line.length > 2 && line.length < 50 && !line.match(/^\d+/) && !line.match(/receipt|bill|invoice/i)) {
                    title = line;
                    break;
                }
            }
        }

        // Auto-categorize based on merchant name or keywords
        const category = categorizeReceipt(text);

        return {
            title: title.length > 30 ? title.substring(0, 30) + '...' : title,
            amount,
            category,
        };
    };

    const categorizeReceipt = (text: string): string => {
        const lowerText = text.toLowerCase();

        if (lowerText.match(/restaurant|cafe|hotel|food|pizza|burger|kitchen|dining/)) {
            return 'Food';
        }
        if (lowerText.match(/taxi|uber|bus|transport|fuel|petrol|gas/)) {
            return 'Transport';
        }
        if (lowerText.match(/pharmacy|hospital|clinic|medical|doctor|health/)) {
            return 'Health';
        }
        if (lowerText.match(/mall|store|shop|market|clothing|electronics/)) {
            return 'Shopping';
        }
        if (lowerText.match(/movie|cinema|entertainment|game|fun/)) {
            return 'Entertainment';
        }
        if (lowerText.match(/electric|water|internet|phone|bill|utility/)) {
            return 'Bills';
        }

        return 'Others';
    };

    const handleClose = () => {
        setScannedImage(null);
        setIsProcessing(false);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Scan Receipt</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={24} color="#8E8E93" />
                        </TouchableOpacity>
                    </View>

                    {isProcessing ? (
                        <View style={styles.processingContainer}>
                            {scannedImage && (
                                <Image source={{ uri: scannedImage }} style={styles.previewImage} />
                            )}
                            <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
                            <Text style={styles.processingText}>Processing receipt...</Text>
                            <Text style={styles.processingSubtext}>Extracting expense details</Text>
                        </View>
                    ) : (
                        <View style={styles.optionsContainer}>
                            <TouchableOpacity style={styles.option} onPress={takePhoto}>
                                <View style={styles.optionIcon}>
                                    <Ionicons name="camera" size={32} color="#007AFF" />
                                </View>
                                <Text style={styles.optionTitle}>Take Photo</Text>
                                <Text style={styles.optionSubtitle}>Capture receipt with camera</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.option} onPress={pickFromGallery}>
                                <View style={styles.optionIcon}>
                                    <Ionicons name="images" size={32} color="#007AFF" />
                                </View>
                                <Text style={styles.optionTitle}>Choose from Gallery</Text>
                                <Text style={styles.optionSubtitle}>Select existing receipt photo</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.tipsContainer}>
                        <Text style={styles.tipsTitle}>Tips for better scanning:</Text>
                        <Text style={styles.tip}>• Ensure good lighting</Text>
                        <Text style={styles.tip}>• Keep receipt flat and straight</Text>
                        <Text style={styles.tip}>• Include the total amount in the photo</Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        minHeight: 400,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    optionsContainer: {
        gap: 16,
        marginBottom: 32,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    optionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1C1C1E',
        marginBottom: 4,
        flex: 1,
    },
    optionSubtitle: {
        fontSize: 14,
        color: '#8E8E93',
        flex: 1,
    },
    processingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    previewImage: {
        width: 200,
        height: 150,
        borderRadius: 12,
        marginBottom: 24,
    },
    loader: {
        marginBottom: 16,
    },
    processingText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1C1C1E',
        marginBottom: 4,
    },
    processingSubtext: {
        fontSize: 14,
        color: '#8E8E93',
    },
    tipsContainer: {
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 12,
    },
    tipsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1C1C1E',
        marginBottom: 8,
    },
    tip: {
        fontSize: 13,
        color: '#8E8E93',
        marginBottom: 4,
    },
});