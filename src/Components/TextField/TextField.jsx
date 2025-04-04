import React, { useState, useEffect } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import mic from "../../assets/5d81be16a7e133c190ac5229026d8645.png";
import styles from "./TextField.module.css";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

function TextField({ onAiResponse }) {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false); // حالة لتتبع إذا كان الصوت قيد التشغيل
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  useEffect(() => {
    if (listening) {
      setInputText(transcript);
    }
  }, [transcript, listening]);

  useEffect(() => {
    if (!listening && transcript.trim()) {
      sendToAI(transcript);
      resetTranscript();
    }
  }, [transcript, listening]);

  const handleStartListening = () => {
    SpeechRecognition.startListening({ continuous: true, language: "ar" });
  };

  const handleStopListening = () => {
    SpeechRecognition.stopListening();
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleSubmit = async (e) => {
    if (e.key === "Enter" && inputText.trim()) {
      await sendToAI(inputText);
      setInputText("");
    }
  };

  // دالة إرسال السؤال إلى الذكاء الاصطناعي
  const sendToAI = async (text) => {
    if (!text.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("User Question:", text);
      console.log("AI Response:", data);

      onAiResponse(data.prediction || "لم أفهم سؤالك، هل يمكنك توضيحه أكثر؟");

      if (data.audio) {
        playBase64Audio(data.audio);
      }

    } catch (error) {
      console.error("Error fetching AI response:", error);
      onAiResponse("عذرًا، حدث خطأ أثناء محاولة الاتصال بالمساعد. يرجى التأكد من تشغيل خدمة الذكاء الاصطناعي.");
    } finally {
      setIsLoading(false);
    }
  };

  // دالة لتحويل وتشغيل الصوت
  const playBase64Audio = (base64Audio) => {
    const audioBlob = base64ToBlob(base64Audio, "audio/mp3"); // تحويل Base64 إلى Blob
    const audioUrl = URL.createObjectURL(audioBlob); // إنشاء رابط للصوت
    const audio = new Audio(audioUrl); // إنشاء عنصر الصوت
    audio.play(); // تشغيل الصوت

    // تغيير الحالة لتفعيل الأنيميشن
    setIsAudioPlaying(true);

    // إيقاف الأنيميشن بعد نهاية الصوت
    audio.onended = () => {
      setIsAudioPlaying(false);
    };
  };

  // دالة لتحويل Base64 إلى Blob
  const base64ToBlob = (base64, mimeType) => {
    const byteCharacters = atob(base64); // فك تشفير Base64
    const byteArrays = [];
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArrays.push(byteCharacters.charCodeAt(i));
    }
    
    return new Blob([new Uint8Array(byteArrays)], { type: mimeType });
  };

  if (!browserSupportsSpeechRecognition) {
    return <span>متصفحك لا يدعم التعرف على الصوت.</span>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.inputContainer}>
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleSubmit}
          placeholder="كيف يمكنني مساعدتك..."
          disabled={isLoading}
        />
        <img
          src={mic}
          alt="Microphone"
          onMouseDown={handleStartListening}
          onMouseUp={handleStopListening}
          style={{ cursor: "pointer", opacity: isLoading ? 0.5 : 1 }}
          disabled={isLoading}
        />
      </div>
      
      {/* تفعيل الأنيميشن عند تشغيل الصوت */}
      {isAudioPlaying && (
        <div className={styles.waveAnimation}>
          <h3>أنس يتحدث</h3>
          <DotLottieReact
            src="/voice-wave.json"
            loop
            autoplay
            style={{ width: "300px", height: "160px", opacity: 1 }}
          />
        </div>
      )}

      {isLoading && 
      <div className={styles.loadingWrapper}> 
         <DotLottieReact
            src="/loading.json"
            loop
            autoplay
            style={{ width: "200px", height: "160px", opacity: 1 }}
          />
      <p className={styles.loading}>يتم ارسال الرسالة و ننتظر الاجابة من أنس...</p>
      
      </div>
      }
      
    </div>
  );
}

export default TextField;
