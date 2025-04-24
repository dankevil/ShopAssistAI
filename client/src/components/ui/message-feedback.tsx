import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface MessageFeedbackProps {
  messageId: number;
}

export function MessageFeedback({ messageId }: MessageFeedbackProps) {
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const sendFeedback = async (rating: 'positive' | 'negative') => {
    if (feedbackSent || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      await apiRequest('POST', '/api/message-feedback', {
        messageId,
        rating
      });
      
      setFeedbackSent(true);
      toast({
        title: t('feedback.thankyou'),
        description: t('feedback.received'),
      });
    } catch (error) {
      console.error('Error sending feedback:', error);
      toast({
        title: t('feedback.error'),
        description: error instanceof Error ? error.message : t('errors.general'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (feedbackSent) {
    return (
      <div className="flex justify-end mt-2 text-xs text-muted-foreground">
        {t('feedback.thankyou')}
      </div>
    );
  }

  return (
    <div className="flex justify-end mt-2 space-x-2">
      <button
        onClick={() => sendFeedback('positive')}
        disabled={isSubmitting}
        className="p-1 rounded-full hover:bg-green-50 text-muted-foreground hover:text-green-600 transition-colors"
        aria-label={t('feedback.helpful')}
        title={t('feedback.helpful')}
      >
        <ThumbsUp className="h-4 w-4" />
      </button>
      
      <button
        onClick={() => sendFeedback('negative')}
        disabled={isSubmitting}
        className="p-1 rounded-full hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
        aria-label={t('feedback.notHelpful')}
        title={t('feedback.notHelpful')}
      >
        <ThumbsDown className="h-4 w-4" />
      </button>
    </div>
  );
}