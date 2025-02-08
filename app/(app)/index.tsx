import AntDesign from '@expo/vector-icons/AntDesign';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Share,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useScriptStore } from '~/store/scriptStore';
import Markdown from 'react-native-markdown-display';

// Environment configuration (should use actual environment variables in production)
const CONFIG = {
  GEMINI_API_KEY: Constants.expoConfig?.extra?.GOOGLE_GEMINI_API_KEY || '',
  THEME_COLOR: '#10a37f', // Primary green color
  BG_COLOR: '#343541',    // Dark background color
};

interface OptionButtonProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

const OptionButton: React.FC<OptionButtonProps> = ({ label, isSelected, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    className={`rounded-full px-4 py-2 ${
      isSelected ? 'bg-[#10a37f]' : 'bg-[#2a2b32] border border-gray-600'
    }`}>
    <Text className={`text-sm ${isSelected ? 'text-white font-bold' : 'text-gray-300'}`}>
      {label}
    </Text>
  </TouchableOpacity>
);

const OptionSection = ({
  title,
  options,
  selectedValue,
  onSelect,
}: {
  title: string;
  options: string[];
  selectedValue: number;
  onSelect: (index: number) => void;
}) => (
  <View className="mb-4">
    <Text className="mb-2 text-sm font-bold text-gray-300">{title}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row gap-2">
        {options.map((option, index) => (
          <OptionButton
            key={option}
            label={option}
            isSelected={selectedValue === index}
            onPress={() => onSelect(index)}
          />
        ))}
      </View>
    </ScrollView>
  </View>
);

const MainPage = () => {
  const {
    topic,
    script,
    loading,
    error,
    showOptions,
    scriptOptions,
    setTopic,
    setScript,
    setLoading,
    setError,
    setShowOptions,
    updateScriptOption,
  } = useScriptStore();

  // Add state for controlling generation
  const [controller, setController] = React.useState<AbortController | null>(null);

  // Add function to stop generation
  const stopGeneration = () => {
    if (controller) {
      controller.abort();
      setController(null);
      setLoading(false);
    }
  };

  const generateScript = async (isRegenerate: boolean = false) => {
    if (!topic.trim()) {
      Alert.alert('Error', 'Please enter a topic before generating');
      return;
    }

    // If regenerating, clear previous script
    if (isRegenerate) {
      setScript('');
    }

    setLoading(true);
    setError('');
    
    // Create new abort controller
    const newController = new AbortController();
    setController(newController);

    try {
      const genAI = new GoogleGenerativeAI(CONFIG.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
        Create a YouTube script about: ${topic.trim()}
        Target Audience: ${scriptOptions.audience.options[scriptOptions.audience.value].trim()}
        Style: ${scriptOptions.style.options[scriptOptions.style.value]}
        Duration: ${scriptOptions.duration.options[scriptOptions.duration.value]} minutes
        Age Group: ${scriptOptions.age.options[scriptOptions.age.value]}
        Language: ${scriptOptions.language.options[scriptOptions.language.value]}
        Include Memes: ${scriptOptions.memes.options[scriptOptions.memes.value]}
        Platform: ${scriptOptions.platform.options[scriptOptions.platform.value]}

        Structure Requirements:
        - Engaging hook in the first 5 seconds
        - Clear introduction with topic overview
        - Main content divided into 3-5 key points
        - Summary and call-to-action in conclusion
        - Include visual cues for transitions
        - Add suggested background music type
        - Specify camera angles where appropriate

        Important Notes:
        - Use only ${scriptOptions.language.options[scriptOptions.language.value]} language
        - Format in markdown with clear section headings
        - Keep paragraphs concise for readability
      `.trim();

      if (!CONFIG.GEMINI_API_KEY) {
        throw new Error('Missing API key configuration');
      }

      const result = await model.generateContent(prompt);
      const generatedText = await result.response.text();
      setScript(generatedText);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setError('Generation stopped');
      } else {
        console.error('Generation error:', error);
        setError('Failed to generate script. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
      setController(null);
    }
  };

  const handleFileShare = async () => {
    try {
      const fileName = `script-${Date.now()}.md`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, script);
      await Share.share({
        title: `YouTube Script: ${topic}`,
        url: fileUri,
        message: script,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to save or share the script');
    }
  };

  const ActionButton = ({
    icon,
    text,
    onPress,
  }: {
    icon: React.ReactNode;
    text: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 flex-row items-center justify-center rounded-lg bg-green-500 p-2"
      accessibilityLabel={text}>
      {icon}
      <Text className="ml-2 font-bold text-white">{text}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#343541]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView 
          keyboardShouldPersistTaps="handled" 
          className="flex-1 p-4"
        >
          <View className="flex-1 gap-4">
            {/* Topic Input - Updated background */}
            <View className="gap-2">
              <Text className="text-lg font-bold text-gray-300">Video Topic</Text>
              <TextInput
                placeholder="Enter your main topic or keyword..."
                value={topic}
                onChangeText={setTopic}
                multiline
                className="min-h-[100px] rounded-xl border border-gray-600 bg-transparent p-4 text-white"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* More Options Button - Updated background */}
            <TouchableOpacity
              className="flex-row items-center justify-center rounded-xl bg-transparent p-4 border border-gray-600 gap-2"
              onPress={() => setShowOptions(!showOptions)}>
              <Text className="text-lg font-bold text-white">
                {showOptions ? 'Hide Options' : 'More Options'}
              </Text>
              <AntDesign 
                name={showOptions ? "up" : "down"} 
                size={20} 
                color="white" 
              />
            </TouchableOpacity>

            {/* Script Options */}
            {showOptions && (
              <View className="gap-4">
                {Object.entries(scriptOptions).map(([key, option]) => (
                  <OptionSection
                    key={key}
                    title={key.toUpperCase()}
                    options={option.options}
                    selectedValue={option.value}
                    onSelect={(val) => updateScriptOption(key, val)}
                  />
                ))}
              </View>
            )}

            {/* Updated Generate/Stop/Regenerate Buttons Section */}
            {!showOptions && (
              <View className="gap-2">
                {loading ? (
                  <TouchableOpacity
                    className="items-center justify-center rounded-xl bg-red-500 p-4"
                    onPress={stopGeneration}>
                    <View className="flex-row items-center gap-2">
                      <AntDesign name="close" size={24} color="white" />
                      <Text className="text-lg font-bold text-white">Stop Generation</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      className="items-center justify-center rounded-xl bg-[#10a37f] p-4 active:bg-[#0e906f]"
                      onPress={() => generateScript(false)}
                      disabled={loading}>
                      <View className="flex-row items-center gap-2">
                        <AntDesign name="arrowright" size={24} color="white" />
                        <Text className="text-lg font-bold text-white">Generate Script</Text>
                      </View>
                    </TouchableOpacity>

                    {script && (
                      <TouchableOpacity
                        className="items-center justify-center rounded-xl border border-[#10a37f] p-4"
                        onPress={() => generateScript(true)}
                        disabled={loading}>
                        <View className="flex-row items-center gap-2">
                          <AntDesign name="reload1" size={24} color="#10a37f" />
                          <Text className="text-lg font-bold text-[#10a37f]">Regenerate</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            )}

            {/* Error Message */}
            {error && (
              <Text className="text-center text-red-500 p-2 bg-red-500/10 rounded-lg">
                {error}
              </Text>
            )}

            {/* Generated Script - Updated background */}
            {script && (
              <View className="rounded-xl border border-gray-600 bg-transparent p-4 gap-4">
                <Text className="text-lg font-bold text-white">Your Script</Text>

                <View className="flex-row gap-2">
                  <ActionButton
                    icon={<AntDesign name="copy1" size={20} color="white" />}
                    text="Copy"
                    onPress={() => Clipboard.setStringAsync(script)}
                  />
                  <ActionButton
                    icon={<AntDesign name="sharealt" size={20} color="white" />}
                    text="Share"
                    onPress={handleFileShare}
                  />
                </View>

                <Markdown
                  style={{
                    body: { color: '#ffffff', lineHeight: 22 },
                    heading1: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginVertical: 12 },
                    heading2: { color: '#ffffff', fontSize: 18, fontWeight: '600', marginVertical: 10 },
                    paragraph: { color: '#ffffff', marginVertical: 8 },
                    list_item: { color: '#ffffff', marginVertical: 4 },
                    code_inline: { backgroundColor: '#4b5563', padding: 4, borderRadius: 4 },
                    blockquote: {
                      marginVertical: 8,
                      paddingLeft: 16,
                      borderLeftWidth: 4,
                      borderLeftColor: '#4b5563',
                    },
                    blockquote_content: { color: '#ffffff', fontStyle: 'italic' },
                    blockquote_author: { color: '#ffffff', fontWeight: 'bold' },
                    blockquote_source: { color: '#ffffff', fontStyle: 'italic' },
                    blockquote_source_url_text_url_text: { color: '#ffffff', fontWeight: 'bold' },
                    paragraph_link: { color: '#10a37f', textDecorationLine: 'underline' },
                  }}>
                  {script}
                </Markdown>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default MainPage;
