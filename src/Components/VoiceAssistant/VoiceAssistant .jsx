// Import regenerator-runtime at the top of your file
import 'regenerator-runtime/runtime';
import React, { useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const VoiceAssistant = () => {
  const [conversation, setConversation] = useState([]);
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Check if the browser supports speech recognition
  if (!browserSupportsSpeechRecognition) {
    return <span>Your browser does not support speech recognition.</span>;
  }

  // Handle user input
  const handleUserInput = () => {
    if (transcript.toLowerCase().includes('تغيير كلمة المرور')) {
      setConversation([
        ...conversation,
        { speaker: 'user', text: transcript },
        {
          speaker: 'system',
          text: 'لقد طلبت تغيير كلمة المرور. إليك الخطوات:',
        },
        {
          speaker: 'system',
          text: '1. انتقل إلى إعدادات الحساب.',
        },
        {
          speaker: 'system',
          text: '2. اختر "تغيير كلمة المرور".',
        },
        {
          speaker: 'system',
          text: '3. أدخل كلمة المرور الحالية وكلمة المرور الجديدة.',
        },
      ]);
    } else {
      setConversation([
        ...conversation,
        { speaker: 'user', text: transcript },
        { speaker: 'system', text: 'لم أفهم طلبك. هل يمكنك التوضيح؟' },
      ]);
    }
    resetTranscript();
  };

  // Start listening
  const handleStartListening = () => {
    SpeechRecognition.startListening({ continuous: true, language: 'ar' });
  };

  // Stop listening and process the input
  const handleStopListening = () => {
    SpeechRecognition.stopListening();
    handleUserInput();
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <h1>مساعد الصوت الذكي</h1>
      <div>
        <p>الميكروفون: {listening ? 'جاري الاستماع...' : 'مغلق'}</p>
        <button onClick={handleStartListening} disabled={listening}>
          بدء التسجيل
        </button>
        <button onClick={handleStopListening} disabled={!listening}>
          إيقاف التسجيل
        </button>
      </div>
      <div style={{ marginTop: '20px' }}>
        {conversation.map((entry, index) => (
          <div
            key={index}
            style={{
              textAlign: entry.speaker === 'user' ? 'right' : 'left',
              margin: '10px 0',
            }}
          >
            <strong>{entry.speaker === 'user' ? 'أنت' : 'المساعد'}:</strong>
            <p
              style={{
                backgroundColor: entry.speaker === 'user' ? '#e0f7fa' : '#f5f5f5',
                padding: '10px',
                borderRadius: '10px',
                display: 'inline-block',
              }}
            >
              {entry.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoiceAssistant;