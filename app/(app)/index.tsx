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
  Share2,
  Plus,
  Youtube,
  Film,
  Camera,
  Mic,
  Menu
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
  RefreshControl,
  Modal
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Toast } from '../Toast';



import { useScriptStore } from '~/store/scriptStore';
import { ensurePermissions } from '~/utils/permissions';
import { usePermissions } from '~/hooks/usePermissions';

// Environment configuration (should use actual environment variables in production)
const CONFIG = {
  GEMINI_API_KEY:
    Constants.expoConfig?.extra?.GOOGLE_GEMINI_API_KEY || 'AIzaSyAs4vFUhoajF79bzBdpP1fgVNgPa8whAEU',
  COLORS: {
    primary: '#10a37f',      // ChatGPT green
    background: '#343541',   // Main background
    surface: '#444654',      // Message bubbles
    inputBg: '#40414f',      // Input background
    border: '#565869',       // Borders
    text: {
      primary: '#ececf1',    // Primary text
      secondary: '#8e8ea0',  // Secondary text
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
    <View style={{ backgroundColor: '#444654' }}>
      <Markdown
        style={{
          body: { color: '#ececf1' },
          heading1: { color: '#ececf1', fontSize: 24, fontWeight: '600' },
          heading2: { color: '#ececf1', fontSize: 20, fontWeight: '600' },
          paragraph: { color: '#ececf1', fontSize: 16, lineHeight: 24 },
          link: { color: '#10a37f' },
          code_inline: { backgroundColor: '#343541', color: '#ececf1' },
          code_block: { backgroundColor: '#343541', color: '#ececf1' },
          blockquote: { backgroundColor: '#343541', borderLeftColor: '#10a37f' },
          text: {
            color: '#ececf1',
          },
          list_item: {
            marginVertical: 8,
            paddingLeft: 12,
            color: '#ececf1',
          },
          bullet_list_icon: {
            marginRight: 8,
            color: '#ececf1',
          },
          bullet_list_content: {
            flex: 1,
            borderLeftWidth: 2,
            borderLeftColor: '#10a37f',
            backgroundColor: '#343541',
            padding: 12,
            borderRadius: 8,
            color: '#ececf1',
            marginLeft: 8,
          },
          em: {
            color: '#10a37f',
            fontStyle: 'normal',
            fontWeight: 'bold',
          },
          strong: {
            color: '#ececf1',
            backgroundColor: '#10a37f20',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 4,
          },
          bullet_list: {
            marginVertical: 12,
            color: '#ececf1',
          },
          ordered_list: {
            marginVertical: 12,
            color: '#ececf1',
          },
          ordered_list_icon: {
            color: '#ececf1',
            marginRight: 8,
          },
          ordered_list_content: {
            color: '#ececf1',
            flex: 1,
          },
          list_item_text: {
            color: '#ececf1',
          },
          text_list_content: {
            color: '#ececf1',
          },
          list: {
            color: '#ececf1',
          },
          listItem: {
            color: '#ececf1',
          },
          listItemContent: {
            color: '#ececf1',
          },
          listItemNumber: {
            color: '#ececf1',
          },
          listItemBullet: {
            color: '#ececf1',
          },
          fence: {
            backgroundColor: '#343541',
            padding: 12,
            borderRadius: 8,
            color: '#ececf1',
          },
          pre: {
            backgroundColor: '#343541',
            padding: 12,
            borderRadius: 8,
            color: '#ececf1',
          },
          text_container: {
            backgroundColor: 'transparent',
          }
        }}>
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
    { text: 'AI is crafting something amazing... 🎥', color: '#10a37f' },
    { text: 'Brainstorming creative ideas... 💡', color: '#8e8ea0' },
    { text: 'Structuring your content... 📊', color: '#10a37f' },
    { text: 'Adding engaging hooks... ✨', color: '#8e8ea0' },
    { text: 'Polishing to perfection... ⭐', color: '#10a37f' },
    { text: 'Finalizing your script... 🎬', color: '#8e8ea0' },
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

  // Update topic suggestions UI
  const topicSuggestions = [
    { 
      icon: <Youtube size={20} color="#10a37f" />, 
      text: 'Tech review video',
      bg: 'bg-[#10a37f10]',
      border: 'border-[#10a37f]'
    },
    { 
      icon: <Film size={20} color="#10a37f" />, 
      text: 'Short film analysis',
      bg: 'bg-[#10a37f10]',
      border: 'border-[#10a37f]'
    },
    { 
      icon: <Camera size={20} color="#10a37f" />, 
      text: 'Photography tutorial',
      bg: 'bg-[#10a37f10]',
      border: 'border-[#10a37f]'
    },
    { 
      icon: <Mic size={20} color="#10a37f" />, 
      text: 'Podcast episode',
      bg: 'bg-[#10a37f10]',
      border: 'border-[#10a37f]'
    },
    { 
      icon: <Sparkles size={20} color="#10a37f" />, 
      text: 'Viral challenge idea',
      bg: 'bg-[#10a37f10]',
      border: 'border-[#10a37f]'
    }
  ];

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
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        
        

        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#10a37f"
              colors={['#10a37f']}
            />
          }>

          {/* Topic Suggestions */}
          {!script && !loading && (
            <View className="mt-6">
              <View className="flex-row items-center gap-2 mb-4">
                <Lightbulb size={20} color="#8e8ea0" />
                <Text className="text-[#8e8ea0]">Try one of these topics:</Text>
              </View>
              <View className="gap-2">
                {topicSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    className={`flex-row items-center gap-3 rounded-xl p-4 border ${suggestion.bg} ${suggestion.border}`}
                    onPress={() => setTopic(suggestion.text)}
                    activeOpacity={0.8}
                  >
                    {suggestion.icon}
                    <Text className="text-[#ececf1] text-base">{suggestion.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Generated Script - Moved options to modal */}
          {script && (
            <View className="mb-4 rounded-xl bg-[#444654] p-4">
              <View className="flex-row items-center justify-between pb-3">
                <Text className="text-[#ececf1] text-lg font-semibold">Generated Script</Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity onPress={handleCopyToClipboard}>
                    <Copy size={20} color="#8e8ea0" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleFileShare}>
                    <Share2 size={20} color="#8e8ea0" />
                  </TouchableOpacity>
                </View>
              </View>
              <MarkdownContent content={script} />
            </View>
          )}

        </ScrollView>

        {/* Enhanced Input Bottom Bar */}
        <View className="absolute bottom-0 w-full border-t border-[#565869] bg-[#343541] px-4 py-3">
          <View className="flex-row items-center gap-2">
            <TouchableOpacity 
              className="p-2"
              onPress={() => setShowOptions(!showOptions)}>
              <Plus size={24} color="#8e8ea0" />
            </TouchableOpacity>
            
            <TextInput
              placeholder="Enter your topic here..."
              placeholderTextColor="#8e8ea0"
              value={topic}
              onChangeText={setTopic}
              className="flex-1 rounded-xl bg-[#40414f] px-4 py-3 text-[#ececf1]"
            />
            
            <TouchableOpacity
              className="rounded-xl bg-[#10a37f] p-3"
              onPress={() => generateScript(false)}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Sparkles color="white" size={24} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Options Modal */}
        <Modal
          visible={showOptions}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowOptions(false)}>
          <View className="flex-1 justify-end bg-black/50">
            <View className="max-h-[70vh] rounded-t-2xl bg-[#40414f] p-4">
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-lg font-bold text-[#ececf1]">Script Options</Text>
                <TouchableOpacity onPress={() => setShowOptions(false)}>
                  <X size={24} color="#8e8ea0" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {Object.entries(scriptOptions).map(([key, option]) => (
                  <OptionSection
                    key={key}
                    title={key.toUpperCase()}
                    options={option.options}
                    selectedValue={option.value}
                    onSelect={(val) => updateScriptOption(key, val)}
                  />
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Loading State */}
        {loading && (
          <View className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center bg-[#343541]/90">
            <View className="items-center p-6 rounded-2xl bg-[#444654] mx-4">
              <ActivityIndicator size="large" color={CONFIG.COLORS.primary} />
              <Text 
                className="mt-4 text-center text-lg px-4" 
                style={{ color: loadingMessages[loadingMessageIndex].color }}
              >
                {loadingMessages[loadingMessageIndex].text}
              </Text>
            </View>
          </View>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default MainPage;
