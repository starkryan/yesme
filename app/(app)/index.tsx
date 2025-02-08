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
import { Toast } from 'toastify-react-native';

// Environment configuration (should use actual environment variables in production)
const CONFIG = {
  GEMINI_API_KEY: Constants.expoConfig?.extra?.GOOGLE_GEMINI_API_KEY || 'AIzaSyAs4vFUhoajF79bzBdpP1fgVNgPa8whAEU',
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
    className={`rounded-xl px-4 py-2 ${
      isSelected ? 'bg-[#10a37f]' : 'bg-transparent border-2 border-gray-600'
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

  // Add state for loading message
  const [loadingMessageIndex, setLoadingMessageIndex] = React.useState(0);
  
  const loadingMessages = [
    "AI is crafting something amazing... 🎥",
    "Brainstorming creative ideas for your video... 💡",
    "Structuring your content for maximum engagement... 📊",
    "Adding engaging hooks and transitions... ✨",
    "Polishing your script to perfection... ⭐",
    "Almost there, finalizing your YouTube script... 🎬"
  ];

  // Add effect to rotate messages during loading
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 3000); // Change message every 3 seconds
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Add function to stop generation
  const stopGeneration = () => {
    if (controller) {
      controller.abort();
      setController(null);
      setLoading(false);
      setError('Generation stopped');
      Toast.info('Generation stopped by user', 'top');
    }
  };

  const generateScript = async (isRegenerate: boolean = false) => {
    if (!topic.trim()) {
      Toast.error('Please enter a topic before generating', 'top');
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
        You are an expert YouTube script writer. Create a highly engaging script for a ${scriptOptions.duration.options[scriptOptions.duration.value]}-minute video.

        Topic: ${topic.trim()}

        Content Requirements:
        - Target Audience: ${scriptOptions.audience.options[scriptOptions.audience.value]}
        - Style: ${scriptOptions.style.options[scriptOptions.style.value]}
        - Age Group: ${scriptOptions.age.options[scriptOptions.age.value]}
        - Platform: ${scriptOptions.platform.options[scriptOptions.platform.value]}
        - Language: ${scriptOptions.language.options[scriptOptions.language.value]}
        - Meme Integration: ${scriptOptions.memes.options[scriptOptions.memes.value]}

        Script Structure:
        1. Hook (0:00-0:15):
           - Create an attention-grabbing opening
           - Use pattern interrupts
           - Tease the value viewers will get

        2. Intro (0:15-0:45):
           - Introduce yourself and establish credibility
           - Clear problem statement
           - Preview main points

        3. Main Content (0:45-${scriptOptions.duration.options[scriptOptions.duration.value]}:00):
           - 3-4 key sections with clear transitions
           - Include B-roll suggestions
           - Add camera angle variations
           - Suggest background music mood changes
           - Include timestamps for each section

        4. Conclusion:
           - Summarize key takeaways
           - Strong call-to-action
           - Engagement prompt (comment section)

        Format the output in markdown with:
        - Clear section headings (##)
        - Timestamps in bold
        - B-roll suggestions in italics
        - Camera angles in blockquotes
        - Music suggestions in code blocks

        Keep the tone ${scriptOptions.style.options[scriptOptions.style.value].toLowerCase()} and optimize for ${scriptOptions.platform.options[scriptOptions.platform.value]} audience retention.
      `.trim();

      if (!CONFIG.GEMINI_API_KEY) {
        throw new Error('Missing API key configuration');
      }

      const result = await model.generateContent(prompt);
      const generatedText = await result.response.text();
      setScript(generatedText);
      Toast.success('Script generated successfully!', 'top');
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Remove these lines since we now handle them in stopGeneration()
        // setError('Generation stopped');
        // Toast.info('Generation stopped by user', 'top');
      } else {
        console.error('Generation error:', error);
        const errorMessage = error.message || 'Failed to generate script. Please check your connection and try again.';
        setError(errorMessage);
        Toast.error(errorMessage, 'top');
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

  const handleCopyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(script);
      Toast.success('Script copied to clipboard', 'top');
    } catch (error) {
      Toast.error('Failed to copy script', 'top');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#343541]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView 
          keyboardShouldPersistTaps="handled" 
          className="flex-1"
        >
          {/* Header Section */}
          <View className="bg-[#2A2B32] p-6 border-b border-gray-600">
            <Text className="text-2xl font-bold text-white mb-2">YouTube Script Generator</Text>
            <Text className="text-gray-400">Create engaging video scripts in seconds</Text>
          </View>

          <View className="p-4 gap-6">
            {/* Topic Input with improved styling */}
            <View className="gap-3 mb-4">
              <View className="flex-row items-center gap-2">
                <AntDesign name="edit" size={24} color="#10a37f" />
                <Text className="text-lg font-bold text-gray-300">Video Topic</Text>
              </View>
              <TextInput
                placeholder="What's your video about? Be specific..."
                value={topic}
                onChangeText={setTopic}
                multiline
                className="min-h-[120px] rounded-xl border-2 border-gray-600 bg-[#2A2B32] p-4 text-white text-base"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Options Toggle with new design */}
            <TouchableOpacity
              className="flex-row items-center justify-between p-4 rounded-xl bg-[#2A2B32] border-2 border-gray-600 mb-4"
              onPress={() => setShowOptions(!showOptions)}>
              <View className="flex-row items-center gap-3 ">
                <AntDesign name="setting" size={24} color="#10a37f" />
                <Text className="text-base font-bold text-gray-300 ml-2">
                  Customize Your Script
                </Text>
              </View>
              <AntDesign 
                name={showOptions ? "up" : "down"} 
                size={20} 
                color="#10a37f" 
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

            {/* Generate/Stop/Regenerate Buttons Section */}
            {!showOptions && (
              <View className="gap-4 mt-4">
                {loading ? (
                  <>
                    <View className="items-center justify-center p-4">
                      <ActivityIndicator size="large" color="#10a37f" />
                      <View className="flex-row items-center gap-2 mt-4">
                        <AntDesign name="bulb1" size={24} color="#10a37f" />
                        <Text className="text-gray-300 text-center">
                          {loadingMessages[loadingMessageIndex]}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      className="items-center justify-center rounded-xl bg-red-500 p-4"
                      onPress={stopGeneration}>
                      <View className="flex-row items-center gap-2">
                        <AntDesign name="close" size={24} color="white" />
                        <Text className="text-lg font-bold text-white">Stop Generation</Text>
                      </View>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      className="items-center justify-center rounded-xl bg-[#10a37f] p-4 active:bg-[#0e906f] mb-4"
                      onPress={() => generateScript(false)}
                      disabled={loading}>
                      <View className="flex-row items-center gap-2">
                        <AntDesign name="arrowright" size={24} color="white" />
                        <Text className="text-lg font-bold text-white">Generate Script</Text>
                      </View>
                    </TouchableOpacity>

                    {script && (
                      <>
                        <TouchableOpacity
                          className="items-center justify-center rounded-xl border-2 border-[#10a37f] p-4 mb-4"
                          onPress={() => generateScript(true)}
                          disabled={loading}>
                          <View className="flex-row items-center gap-2">
                            <AntDesign name="reload1" size={24} color="#10a37f" />
                            <Text className="text-lg font-bold text-[#10a37f]">Regenerate</Text>
                          </View>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          className="items-center justify-center rounded-xl border-2 border-red-500 p-4 mb-4"
                          onPress={() => {
                            setScript('');
                            Toast.success('Script cleared', 'top');
                          }}
                          disabled={loading}>
                          <View className="flex-row items-center gap-2">
                            <AntDesign name="delete" size={24} color="#ef4444" />
                            <Text className="text-lg font-bold text-red-500">Clear Script</Text>
                          </View>
                        </TouchableOpacity>
                      </>
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

            {/* Generated Script */}
            {script && (
              <View className="rounded-xl border-2 border-gray-600 bg-[#2A2B32] p-4 gap-4 mb-8">
                {/* Script Header */}
                <View className="border-b border-gray-600 pb-4 mb-4">
                  <View className="flex-row items-center gap-2">
                    <AntDesign name="videocamera" size={24} color="#10a37f" />
                    <Text className="text-2xl font-bold text-white">Your YouTube Script</Text>
                  </View>
                  <View className="flex-row items-center gap-2 mt-2">
                    <AntDesign name="tag" size={16} color="#9ca3af" />
                    <Text className="text-gray-400">Topic: {topic}</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-2 mb-4">
                  <TouchableOpacity
                    onPress={handleCopyToClipboard}
                    className="flex-1 flex-row items-center justify-center rounded-xl bg-[#10a37f]/20 p-4 active:bg-[#10a37f]/30 border border-[#10a37f]/30"
                    accessibilityLabel="Copy">
                    <AntDesign name="copy1" size={20} color="#10a37f" />
                    <Text className="ml-2 font-bold text-[#10a37f]">Copy Script</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleFileShare}
                    className="flex-1 flex-row items-center justify-center rounded-xl bg-[#10a37f]/20 p-4 active:bg-[#10a37f]/30 border border-[#10a37f]/30"
                    accessibilityLabel="Share">
                    <AntDesign name="sharealt" size={20} color="#10a37f" />
                    <Text className="ml-2 font-bold text-[#10a37f]">Share Script</Text>
                  </TouchableOpacity>
                </View>

                {/* Markdown Content */}
                <Markdown
                  style={{
                    body: { color: '#ffffff', lineHeight: 24 },
                    heading1: { 
                      color: '#10a37f', 
                      fontSize: 24, 
                      fontWeight: 'bold', 
                      marginVertical: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: '#4b5563',
                      paddingBottom: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                    },
                    heading2: { 
                      color: '#ffffff', 
                      fontSize: 20, 
                      fontWeight: '600', 
                      marginVertical: 12,
                      backgroundColor: '#1F2937',
                      padding: 12,
                      borderRadius: 8,
                      borderLeftWidth: 4,
                      borderLeftColor: '#10a37f'
                    },
                    paragraph: { 
                      color: '#ffffff', 
                      marginVertical: 12,
                      lineHeight: 24,
                      fontSize: 16
                    },
                    list_item: { 
                      color: '#ffffff', 
                      marginVertical: 10,
                      paddingLeft: 12,
                      borderLeftWidth: 3,
                      borderLeftColor: '#10a37f',
                      backgroundColor: '#1F2937',
                      padding: 12,
                      borderRadius: 8,
                      marginLeft: 8
                    },
                    code_inline: { 
                      backgroundColor: '#10a37f20', 
                      color: '#10a37f',
                      padding: 4, 
                      borderRadius: 4,
                      fontWeight: 'bold'
                    },
                    blockquote: {
                      marginVertical: 16,
                      paddingLeft: 16,
                      borderLeftWidth: 4,
                      borderLeftColor: '#10a37f',
                      backgroundColor: '#1F2937',
                      padding: 16,
                      borderRadius: 8
                    },
                    blockquote_content: { 
                      color: '#ffffff', 
                      fontStyle: 'italic',
                      fontSize: 16
                    },
                    em: { 
                      color: '#10a37f',
                      fontStyle: 'normal',
                      fontWeight: 'bold'
                    },
                    strong: {
                      color: '#10a37f',
                      backgroundColor: '#10a37f20',
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 4
                    },
                    bullet_list: {
                      marginVertical: 12
                    },
                    paragraph_link: { 
                      color: '#10a37f', 
                      textDecorationLine: 'underline',
                      fontWeight: 'bold'
                    },
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
