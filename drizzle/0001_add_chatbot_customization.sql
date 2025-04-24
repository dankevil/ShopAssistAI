-- Add new columns to the settings table for chatbot customization
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS chatbot_features jsonb DEFAULT '{"productSearch": true, "orderStatus": true, "recommendations": true, "inventory": true}'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_customization jsonb DEFAULT '{"conversationMode": "balanced", "dataCollectionLevel": "comprehensive", "responseLength": "medium", "tone": "professional", "creativity": 50, "knowledgePriority": "balanced", "trainingMethod": "auto"}'::jsonb,
  ADD COLUMN IF NOT EXISTS knowledge_base jsonb DEFAULT '{"includeProductDescriptions": true, "includeReviews": true, "includeCollections": true, "includePolicies": true, "includeMetafields": true, "includeBlogContent": true, "includeStorefrontContent": true}'::jsonb,
  ADD COLUMN IF NOT EXISTS conversation_settings jsonb DEFAULT '{"maxHistoryLength": 10, "userIdentification": "optional", "handoffThreshold": 3, "followUpEnabled": true, "proactiveChat": false, "messageDelay": 0}'::jsonb,
  ADD COLUMN IF NOT EXISTS custom_training jsonb DEFAULT '{"additionalInstructions": "", "prohibitedTopics": "", "favoredProducts": "", "customFAQs": ""}'::jsonb;