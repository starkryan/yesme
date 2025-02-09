import { useAuth } from '@clerk/clerk-expo';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import {
  Sparkles,
  Loader,
  Pencil,
  Settings,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  X,
  RefreshCw,
  Trash2,
  Video,
  Tag,
  Copy,
  Share2
} from 'lucide-react-native';
import React, { useState } from 'react';
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
  SafeAreaView,
  RefreshControl
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Toast } from '../Toast';





import { useScriptStore } from '@/store/scriptStore';
import { ensurePermissions } from '@/utils/permissions';
import { usePermissions } from '@/hooks/usePermissions';


// Environment configuration (should use actual environment variables in production)
const CONFIG = {
  GEMINI_API_KEY:
    Constants.expoConfig?.extra?.GOOGLE_GEMINI_API_KEY || 'AIzaSyAs4vFUhoajF79bzBdpP1fgVNgPa8whAEU',
  COLORS: {
    primary: '#10a37f',      // Primary green color
    primaryActive: '#0e906f', // Darker green for active states
    background: '#343541',    // Dark background color
    border: '#4b5563',       // Border color (gray-600)
    text: {
      primary: '#ffffff',    // White text
      secondary: '#9ca3af',  // Gray text (gray-400)
      tertiary: '#6b7280',   // Darker gray text (gray-500)
    },
    error: '#ef4444',        // Red for errors
  },
};

interface OptionButtonProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

const OptionButton: React.FC<OptionButtonProps> = ({ label, isSelected, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    className={`rounded-xl px-4 py-2.5 ${isSelected ? 'bg-[#10a37f]' : 'border-2 border-gray-600 bg-transparent'}`}>
    <Text className={`text-base ${isSelected ? 'font-bold text-white' : 'text-gray-300'}`}>
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

// Add new MarkdownContent component
const MarkdownContent = ({ content }: { content: string }) => {
  return (
    <View style={{ flex: 1, backgroundColor: '#343541' }}>
      <Markdown
        style={{
          body: {
            color: '#ffffff',
            lineHeight: 24,
            flex: 1,
            backgroundColor: '#343541',
          },
          heading1: {
            color: '#ffffff',
            fontSize: 24,
            fontWeight: 'bold',
            marginVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: CONFIG.COLORS.border,
            paddingBottom: 8,
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
            borderLeftColor: CONFIG.COLORS.primary,
          },
          blockquote: {
            backgroundColor: '#1F2937',
            padding: 16,
            borderRadius: 8,
            borderLeftWidth: 3,
            borderLeftColor: CONFIG.COLORS.primary,
            marginVertical: 8,
          },
          blockquote_text: {
            color: '#ffffff',
            fontStyle: 'italic',
            fontSize: 16,
          },
          paragraph: {
            color: '#ffffff',
            marginVertical: 8,
            lineHeight: 24,
            fontSize: 16,
          },
          text: {
            color: '#ffffff',
          },
          list_item: {
            marginVertical: 8,
            paddingLeft: 12,
            color: '#ffffff',
          },
          bullet_list_icon: {
            marginRight: 8,
            color: '#ffffff',
          },
          bullet_list_content: {
            flex: 1,
            borderLeftWidth: 2,
            borderLeftColor: CONFIG.COLORS.primary,
            backgroundColor: '#1F2937',
            padding: 12,
            borderRadius: 8,
            color: '#ffffff',
            marginLeft: 8,
          },
          em: {
            color: '#10a37f',
            fontStyle: 'normal',
            fontWeight: 'bold',
          },
          strong: {
            color: '#ffffff',
            backgroundColor: '#10a37f20',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 4,
          },
          bullet_list: {
            marginVertical: 12,
            color: '#ffffff',
          },
          link: {
            color: '#10a37f',
            textDecorationLine: 'underline',
            fontWeight: 'bold',
          },
          code_block: {
            backgroundColor: '#1F2937',
            padding: 12,
            borderRadius: 8,
            color: '#ffffff',
            marginVertical: 8,
          },
          code_inline: {
            backgroundColor: '#1F2937',
            padding: 4,
            borderRadius: 4,
            color: '#ffffff',
          },
          ordered_list: {
            marginVertical: 12,
            color: '#ffffff',
          },
          ordered_list_icon: {
            color: '#ffffff',
            marginRight: 8,
          },
          ordered_list_content: {
            color: '#ffffff',
            flex: 1,
          },
          list_item_text: {
            color: '#ffffff',
          },
          text_list_content: {
            color: '#ffffff',
          },
          list: {
            color: '#ffffff',
          },
          listItem: {
            color: '#ffffff',
          },
          listItemContent: {
            color: '#ffffff',
          },
          listItemNumber: {
            color: '#ffffff',
          },
          listItemBullet: {
            color: '#ffffff',
          },
          fence: {
            backgroundColor: '#1F2937',
            padding: 12,
            borderRadius: 8,
            color: '#ffffff',
          },
          pre: {
            backgroundColor: '#1F2937',
            padding: 12,
            borderRadius: 8,
            color: '#ffffff',
          },
          text_container: {
            backgroundColor: 'transparent',
          }
        }}
      >
        {content}
      </Markdown>
    </View>
  );
};

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

  const { isLoaded, isSignedIn } = useAuth();

  // Move the hook to the component level
  const { checkPermission } = usePermissions();

  // Add state for controlling generation
  const [controller, setController] = React.useState<AbortController | null>(null);

  // Add state for loading message
  const [loadingMessageIndex, setLoadingMessageIndex] = React.useState(0);

  const loadingMessages = [
    'AI is crafting something amazing... 🎥',
    'Brainstorming creative ideas for your video... 💡',
    'Structuring your content for maximum engagement... 📊',
    'Adding engaging hooks and transitions... ✨',
    'Polishing your script to perfection... ⭐',
    'Almost there, finalizing your YouTube script... 🎬',
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

  // Add rotation animation state and useEffect
  const [rotation, setRotation] = React.useState(0);

  // Modify the rotation animation effect
  React.useEffect(() => {
    setRotation(showOptions ? 180 : 0);
  }, [showOptions]);

  // Add function to stop generation
  const stopGeneration = () => {
    if (controller) {
      controller.abort();
      setController(null);
      setLoading(false);
      setError('Generation stopped');
      Toast.info('Generation stopped by user');
    }
  };

  const generateScript = async (isRegenerate: boolean = false) => {
    if (!topic.trim()) {
      Toast.error('Please enter a topic before generating');
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

      const selectedLanguage = scriptOptions.language.options[scriptOptions.language.value];

      const prompt = `
        You are an expert YouTube script writer. Create a highly engaging script for a ${scriptOptions.duration.options[scriptOptions.duration.value]}-minute video.
        
        IMPORTANT: Write the entire script in ${selectedLanguage} language.

        Topic: ${topic.trim()}

        Content Requirements:
        - Target Audience: ${scriptOptions.audience.options[scriptOptions.audience.value]}
        - Style: ${scriptOptions.style.options[scriptOptions.style.value]}
        - Age Group: ${scriptOptions.age.options[scriptOptions.age.value]}
        - Platform: ${scriptOptions.platform.options[scriptOptions.platform.value]}
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
      Toast.success('Script generated successfully!');

    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Remove error state updates here since they're handled in stopGeneration()
      } else {
        console.error('Generation error:', error);
        const errorMessage =
          error.message || 'Failed to generate script. Please check your connection and try again.';
        setError(errorMessage);
        Toast.error(errorMessage);

      }
    } finally {
      setLoading(false);
      setController(null);
    }
  };

  const handleFileShare = async () => {
    try {
      const hasStoragePermission = await checkPermission('STORAGE');

      if (!hasStoragePermission) {
        return;
      }

      const fileName = `script-${Date.now()}.md`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, script);
      await Share.share({
        title: `YouTube Script: ${topic}`,
        url: fileUri,
        message: script,
      });
    } catch (error) {
      console.error('Share error:', error);
      Toast.error('Failed to save or share the script');
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(script);
      Toast.success('Script copied to clipboard');
    } catch (error) {
      Toast.error('Failed to copy script');
    }

  };

  const [isNetworkError, setIsNetworkError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Add network error handling
  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Your network request here
      setIsNetworkError(false);
    } catch (error) {
      Toast.error('Network error. Please check your connection.');
      setIsNetworkError(true);
    } finally {
      setIsRetrying(false);
    }
  };

  // Add refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Reset refresh state without any generation
  const onRefresh = React.useCallback(() => {
    setIsRefreshing(true);
    // Clear any existing errors
    setError('');
    // Just show refresh animation without data changes
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  // Remove the router.replace call and modify the auth check
  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-[#343541]">
        <ActivityIndicator size="large" color={CONFIG.COLORS.primary} />
      </View>
    );
  }

  // Simply return null if not signed in - navigation is handled in root layout
  if (!isSignedIn) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-[#343541]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-[#343541]"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          className="flex-1 bg-[#343541]"
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 40,
            backgroundColor: '#343541',
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#10a37f"
              colors={['#10a37f']}
            />
          }>
          {/* Updated Header */}
          <View className="border-b border-gray-700 bg-transparent px-6 py-4">
            <Text className="text-2xl font-bold text-white">YouTube Script Generator</Text>
            <Text className="mt-1 text-gray-400">Create engaging video scripts in seconds</Text>
          </View>

          <View className="gap-6 p-4">
            {/* Topic Input with improved styling */}
            <View className="mb-4 gap-3">
              <View className="flex-row items-center gap-2">
                <Pencil size={24} color={CONFIG.COLORS.primary} />
                <Text className="text-lg font-bold text-gray-300">Video Topic</Text>
              </View>
              <TextInput
                placeholder="What's your video about? Be specific..."
                value={topic}
                onChangeText={setTopic}
                multiline
                className="min-h-[120px] rounded-xl border-2 border-gray-600 bg-transparent p-4 text-base text-white"
                placeholderTextColor={CONFIG.COLORS.text.secondary}
              />
            </View>

            {/* Options Toggle with updated styling */}
            <TouchableOpacity
              className="mb-4 flex-row items-center justify-between rounded-xl border-2 border-gray-600 bg-transparent p-4"
              onPress={() => setShowOptions(!showOptions)}>
              <View className="flex-row items-center gap-3">
                <Settings
                  size={24}
                  color={CONFIG.COLORS.primary}
                  style={{ transform: [{ rotate: `${rotation}deg` }] }}
                />
                <Text className="ml-2 text-base font-bold text-gray-300">
                  Customize Your Script
                </Text>
              </View>
              {showOptions ? (
                <ChevronUp size={20} color={CONFIG.COLORS.primary} />
              ) : (
                <ChevronDown size={20} color={CONFIG.COLORS.primary} />
              )}
            </TouchableOpacity>

            {/* Script Options with conditional rendering */}
            {showOptions && (
              <View className="mb-4 gap-4">
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
              <View className="mt-4 gap-2">
                {loading ? (
                  <>
                    <View className="items-center justify-center p-4">
                      <ActivityIndicator size="large" color={CONFIG.COLORS.primary} />
                      <View className="mt-4 flex-row items-center gap-2">
                        <Lightbulb size={24} color={CONFIG.COLORS.primary} />
                        <Text className="text-center text-gray-300">
                          {loadingMessages[loadingMessageIndex]}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      className="items-center justify-center rounded-xl bg-red-500 p-4"
                      onPress={stopGeneration}>
                      <View className="flex-row items-center gap-2">
                        <X size={24} color="white" />
                        <Text className="text-lg font-bold text-white">Stop Generation</Text>
                      </View>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      className="items-center justify-center rounded-xl bg-[#10a37f] p-4 active:bg-[#0e906f]"
                      onPress={() => generateScript(false)}
                      disabled={loading}>
                      <View className="flex-row items-center gap-2">
                        <Sparkles color="white" size={24} />
                        <Text className="text-lg font-bold text-white">Generate Script</Text>
                      </View>
                    </TouchableOpacity>

                    {script && (
                      <>
                        <TouchableOpacity
                          className="items-center justify-center rounded-xl border-2 border-[#10a37f] p-4"
                          onPress={() => generateScript(true)}
                          disabled={loading}>
                          <View className="flex-row items-center gap-2">
                            <RefreshCw size={24} color="#10a37f" />
                            <Text className="text-lg font-bold text-[#10a37f]">Regenerate</Text>
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                          className="mb-2 items-center justify-center rounded-xl border-2 border-red-500 p-4"
                          onPress={() => {
                            setScript('');
                            Toast.success('Script cleared');
                          }}
                          disabled={loading}>
                          <View className="flex-row items-center gap-2">
                            <Trash2 size={24} color="#ef4444" />
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
              <Text className="rounded-lg bg-red-500/10 p-2 text-center text-red-500">{error}</Text>
            )}

            {/* Generated Script */}
            {script && (
              <View className="mb-8 gap-4 rounded-xl border-2 border-gray-600 bg-transparent p-4">
                {/* Script Header */}
                <View className="mb-4 border-b border-gray-600 pb-4">
                  <View className="flex-row items-center gap-2">
                    <Video size={24} color={CONFIG.COLORS.primary} />
                    <Text className="text-2xl font-bold text-white">Your YouTube Script</Text>
                  </View>
                  <View className="mt-2 flex-row items-center gap-2">
                    <Tag size={16} color={CONFIG.COLORS.text.secondary} />
                    <Text className="text-gray-400">Topic: {topic}</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="mb-4 flex-row gap-2">
                  <TouchableOpacity
                    onPress={handleCopyToClipboard}
                    className="flex-1 flex-row items-center justify-center rounded-xl border border-[#10a37f]/30 bg-[#10a37f]/20 p-4 active:bg-[#10a37f]/30"
                    accessibilityLabel="Copy">
                    <Copy size={20} color={CONFIG.COLORS.primary} />
                    <Text className="ml-2 font-bold text-[#10a37f]">Copy Script</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleFileShare}
                    className="flex-1 flex-row items-center justify-center rounded-xl border border-[#10a37f]/30 bg-[#10a37f]/20 p-4 active:bg-[#10a37f]/30"
                    accessibilityLabel="Share">
                    <Share2 size={20} color={CONFIG.COLORS.primary} />
                    <Text className="ml-2 font-bold text-[#10a37f]">Share Script</Text>
                  </TouchableOpacity>
                </View>

                <MarkdownContent content={script} />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>

  );
};

export default MainPage;

