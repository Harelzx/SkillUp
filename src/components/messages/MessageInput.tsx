import { useState, useCallback, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Keyboard } from 'react-native';
import { colors, spacing } from '@/theme/tokens';
import { Send, SendHorizontal } from 'lucide-react-native';
import { useRTL } from '@/context/RTLContext';

interface MessageInputProps {
  onSend: (message: string) => Promise<void> | void;
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
  const { isRTL, getFlexDirection, getMarginEnd, getMarginStart, getTextAlign, direction } = useRTL();
  const [message, setMessage] = useState('');
  const [height, setHeight] = useState(40);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSend = useCallback(() => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;

    // Clear message immediately for better UX
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

    // Send message - don't await to avoid blocking UI
    // The parent component handles errors
    const sendResult = onSend(trimmedMessage);
    if (sendResult instanceof Promise) {
      sendResult.catch((error) => {
        // If send fails, restore the message
        setMessage(trimmedMessage);
        console.error('[MessageInput] Failed to send message:', error);
      });
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
        alignItems: 'center',
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
          ...(isRTL ? getMarginStart(spacing[2]) : getMarginEnd(spacing[2])),
          maxHeight: 120,
          direction: direction,
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
            writingDirection: direction,
            textAlign: isRTL ? 'right' : 'left',
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
        activeOpacity={0.8}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: canSend ? colors.primary[500] : colors.gray[200],
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: canSend ? colors.primary[500] : 'transparent',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: canSend ? 0.3 : 0,
          shadowRadius: 4,
          elevation: canSend ? 3 : 0,
        }}
      >
        {isRTL ? (
          <SendHorizontal
            size={22}
            color={canSend ? colors.white : colors.gray[400]}
          />
        ) : (
          <Send
            size={22}
            color={canSend ? colors.white : colors.gray[400]}
          />
        )}
      </TouchableOpacity>
    </View>
  );
}
