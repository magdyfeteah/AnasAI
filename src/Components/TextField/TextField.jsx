import React, { useState, useEffect, useRef } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import mic from "../../assets/mic.png";
import styles from "./TextField.module.css";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useQueryClient } from "@tanstack/react-query";

function TextField({ onAiResponse }) {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [quantumOn, setQuantumOn] = useState(false);
  const [sendRequest, setSendRequest] = useState(false);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

const audioRef = useRef(null);

  const queryClient = useQueryClient();
  const hasSent = useRef(false);

  // تحديث النص أثناء التسجيل
  useEffect(() => {
    if (listening) {
      setInputText(transcript);
      hasSent.current = false; // نعيد تهيئة الفلاج
    }
  }, [transcript, listening]);

  // إرسال الرسالة عند انتهاء التسجيل
  useEffect(() => {
    if (!listening && transcript.trim() && !hasSent.current) {
      sendToAI(transcript);
      hasSent.current = true;
      resetTranscript();
    }
  }, [listening]);

  const handleStartListening = () => {
    SpeechRecognition.startListening({ continuous: true, language: "ar" });
  };

  const handleStopListening = () => {
    SpeechRecognition.stopListening();
  };

  const handleInputChange = (e) => setInputText(e.target.value);

  const handleSubmit = async (e) => {
    if (e.key === "Enter" && inputText.trim()) {
      await sendToAI(inputText);
      setInputText("");
    }
  };

  const sendToAI = async (text) => {
    if (!text.trim()) return;
      if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current = null;
  }
    setIsAudioPlaying(false)
    setSendRequest(true)
    setIsLoading(true);
    onAiResponse(""); // تصفير الرد القديم

    const queryKey = ["question", text];
    const cachedData = queryClient.getQueryData(queryKey);
    if (cachedData) {
      console.log("📦 تم جلب الرد من الكاش");
      onAiResponse(
        cachedData.prediction || "لم أفهم سؤالك، هل يمكنك توضيحه أكثر؟"
      );
      if (cachedData.audio) playBase64Audio(cachedData.audio);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        quantumOn
          ? "http://localhost:8000/predict/text/quantum"
          : 'http://localhost:8000/predict/text',
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: text }),
        }
      );

      if (!response.ok) {
        console.error(`❌ خطأ في استجابة النص: ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let fullText = "";

      if (quantumOn) {
        console.log("📡 الرد من نموذج Quantum");

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          onAiResponse((prev) => prev + chunk);
        }
      } else {
        console.log("📡 الرد من نموذج العادي ");
        const text = await response.text();
        fullText = text;
        onAiResponse(text);
      }
      console.log(`fullText ${fullText}`);
      // تحويل النص لصوت
      const audioResponse = await fetch(
        "http://localhost:8000/predict/audio",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer: fullText }),
        }
      );

      if (!audioResponse.ok) {
        throw new Error(`Audio error! status: ${audioResponse.status}`);
      }

      const base64Audio = audioResponse.body.getReader();

      const result = [];
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { done, value } = await base64Audio.read();
        if (done) break;
        result.push(decoder.decode(value, { stream: true }));
      }

      const base64String = result.join("");
      if (!base64String) throw new Error("لم يتم استلام صوت من الخادم");

      playBase64Audio(base64String);

      queryClient.setQueryData(queryKey, {
        prediction: fullText,
        audio: base64String,
      });
    } catch (error) {
      console.error("❌ خطأ أثناء التواصل مع الخادم:", error);
      onAiResponse("عذرًا، حدث خطأ أثناء محاولة الاتصال بالمساعد.");
    } finally {
      setIsLoading(false);
      setSendRequest(false)
      setIsAudioPlaying(true)
    }
  };

  const playBase64Audio = (base64Audio) => {
    const cleanBase64 = base64Audio.replace(/[^A-Za-z0-9+/=]/g, "");
    const audioBlob = base64ToBlob(cleanBase64, "audio/mp3");
    const audioUrl = URL.createObjectURL(audioBlob);
    const audioEl = new Audio(audioUrl);
 audioRef.current = audioEl;
    audioEl
      .play()
      .catch((error) => console.error("خطأ في تشغيل الصوت:", error));

    setIsAudioPlaying(true);
      audioEl.onended = () => {
    setIsAudioPlaying(false);
    audioRef.current = null; // تفريغ المرجع عند الانتهاء
  };
  };

  const base64ToBlob = (base64, mimeType) => {
    const byteCharacters = atob(base64);
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
          src={quantumOn ? "/on-button.png" : "/off-button.png"}
          alt=""
          onClick={() => setQuantumOn((prev) => !prev)}
          className={styles.onOFF}
        />
        <img
          src={mic}
          alt="Microphone"
          onMouseDown={handleStartListening}
          onMouseUp={handleStopListening}
          className={styles.mic}
        />
      </div>

      {isAudioPlaying &&!sendRequest && (
        <div className={styles.waveAnimation}>
          <h3>انس يتحدث</h3>
          <DotLottieReact
            src="/voice-wave.json"
            loop
            autoplay
            style={{ width: "300px", height: "160px" }}
          />
        </div>
      )}
      {isLoading && (
        <div className={styles.loadingWrapper}>
          <DotLottieReact
            src="/loading.json"
            loop
            autoplay
            style={{ width: "200px", height: "160px" }}
          />
          <p className={styles.loading}>يتم ارسال الرسالة و ننتظر الاجابة...</p>
        </div>
      )}
    </div>
  );
}

export default TextField;
