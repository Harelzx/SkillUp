import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, I18nManager, Keyboard } from 'react-native';
import { colors, spacing } from '@/theme/tokens';
import { Send } from 'lucide-react-native';

const isRTL = I18nManager.isRTL;

interface MessageInputProps {
  onSend: (message: string) => void;
  onTyping?: (isTyping: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MessageInput({
  onSend,
  onTyping,
  placeholder = 'הקלד הודעה...',
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [height, setHeight] = useState(40);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSend = useCallback(() => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;

    onSend(trimmedMessage);
    setMessage('');
    setHeight(40);

    // Stop typing indicator
    if (onTyping) {
      onTyping(false);
    }

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [message, onSend, onTyping, disabled]);

  const handleChangeText = useCallback(
    (text: string) => {
      setMessage(text);

      // Handle typing indicator
      if (onTyping) {
        if (text.length > 0) {
          onTyping(true);

          // Clear existing timeout
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }

          // Set new timeout to stop typing after 2 seconds of inactivity
          typingTimeoutRef.current = setTimeout(() => {
            onTyping(false);
          }, 2000);
        } else {
          onTyping(false);
        }
      }
    },
    [onTyping]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (onTyping) {
        onTyping(false);
      }
    };
  }, [onTyping]);

  const canSend = message.trim().length > 0 && !disabled;

  return (
    <View
      style={{
        flexDirection: isRTL ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.gray[200],
      }}
    >
      {/* Text Input */}
      <View
        style={{
          flex: 1,
          backgroundColor: colors.gray[50],
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.gray[200],
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[2],
          marginLeft: isRTL ? 0 : spacing[2],
          marginRight: isRTL ? spacing[2] : 0,
          maxHeight: 120,
        }}
      >
        <TextInput
          value={message}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.gray[400]}
          multiline
          textAlignVertical="center"
          textAlign={isRTL ? 'right' : 'left'}
          editable={!disabled}
          style={{
            fontSize: 16,
            color: colors.gray[900],
            minHeight: 40,
            maxHeight: 120,
            paddingVertical: 8,
            writingDirection: isRTL ? 'rtl' : 'ltr',
          }}
          onContentSizeChange={(event) => {
            setHeight(Math.max(40, Math.min(120, event.nativeEvent.contentSize.height)));
          }}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
      </View>

      {/* Send Button */}
      <TouchableOpacity
        onPress={handleSend}
        disabled={!canSend}
        activeOpacity={0.7}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: canSend ? colors.primary[600] : colors.gray[300],
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Send
          size={20}
          color={colors.white}
          style={{
            transform: [{ scaleX: isRTL ? -1 : 1 }],
          }}
        />
      </TouchableOpacity>
    </View>
  );
}
