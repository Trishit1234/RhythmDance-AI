"use client";

import { useState } from "react";
import { CheckCircle2, Circle, AlertCircle, Award, RefreshCw, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface QuizProps {
  danceName: string;
  onComplete: () => void;
}

export default function Quiz({ danceName, onComplete }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const questions = [
    {
      question: `What is the spiritual and aesthetic core of ${danceName}?`,
      options: [
        "Pure acrobatics and swift gymnastics",
        "Storytelling, sacred devotion, rhythm (Tala) and expression (Abhinaya)",
        "Combat choreography and physical sparring",
        "Vocal chorus accompaniment without movement",
      ],
      correct: 1,
    },
    {
      question: "Which of these is the quintessential building block of classical Indian dance?",
      options: [
        "Mudras (symbolic hand gestures) and Charis (footwork)",
        "Acrobatic props and masks",
        "Spoken dialogues during performance",
        "Random improvised steps",
      ],
      correct: 0,
    },
    {
      question: "Why is Tala (rhythmic cycle) critical in this classical tradition?",
      options: [
        "It is only meant for the background musicians",
        "It has no structural importance",
        "It synchronizes footwork, ankle bells (ghungroo), and tempo variations",
        "To signal audience applause",
      ],
      correct: 2,
    },
  ];

  const handleAnswer = () => {
    if (selectedAnswer === null) return;

    if (selectedAnswer === questions[currentQuestion].correct) {
      setScore((prev) => prev + 1);
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
    } else {
      setShowResult(true);
    }
  };

  if (showResult) {
    const passed = score >= 2;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[32px] p-8 sm:p-12 border border-[#E8DEC8] shadow-xl text-center max-w-xl mx-auto space-y-6"
      >
        <div className="flex justify-center">
          {passed ? (
            <div className="w-20 h-20 bg-[#B42318] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#B42318]/30">
              <Award size={42} />
            </div>
          ) : (
            <div className="w-20 h-20 bg-[#EFE7DA] text-[#777777] rounded-full flex items-center justify-center">
              <AlertCircle size={40} />
            </div>
          )}
        </div>

        <div>
          <span className="text-[11px] font-black uppercase font-mono tracking-widest text-[#B42318] block mb-1">
            {passed ? "ASSESSMENT CLEARED" : "NEEDS PRACTICE"}
          </span>
          <h3 className="text-3xl sm:text-4xl font-black uppercase text-[#111111] font-mono tracking-tight">
            {passed ? "Module Mastered!" : "Review Required"}
          </h3>
          <p className="text-sm sm:text-base text-[#777777] mt-2">
            You scored <strong className="text-[#111111] font-mono">{score}</strong> out of{" "}
            <strong className="text-[#111111] font-mono">{questions.length}</strong> questions.
          </p>
        </div>

        {passed ? (
          <div className="space-y-3 pt-2">
            <button
              onClick={onComplete}
              className="w-full py-4 bg-[#B42318] hover:bg-[#C92A1E] text-white font-black uppercase tracking-wider text-xs sm:text-sm rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-[#B42318]/30 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>CLAIM DIPLOMA CERTIFICATE</span>
              <ArrowRight size={16} />
            </button>
            <p className="text-[11px] text-[#777777]">
              Issued with permanent cryptographic credential ID
            </p>
          </div>
        ) : (
          <button
            onClick={() => {
              setCurrentQuestion(0);
              setSelectedAnswer(null);
              setShowResult(false);
              setScore(0);
            }}
            className="w-full py-4 bg-[#111111] hover:bg-[#252525] text-white font-black uppercase tracking-wider text-xs rounded-full transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-md"
          >
            <RefreshCw size={14} />
            <span>RETAKE KNOWLEDGE QUIZ</span>
          </button>
        )}
      </motion.div>
    );
  }

  const q = questions[currentQuestion];

  return (
    <motion.div
      key={currentQuestion}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[32px] p-6 sm:p-10 border border-[#E8DEC8] shadow-sm space-y-6"
    >
      <div className="flex items-center justify-between border-b border-[#E8DEC8] pb-3">
        <span className="text-[11px] font-black uppercase tracking-widest text-[#B42318] font-mono">
          QUESTION {(currentQuestion + 1).toString().padStart(2, "0")} / {questions.length.toString().padStart(2, "0")}
        </span>
        <span className="text-xs font-mono font-bold text-[#777777]">
          {danceName.toUpperCase()}
        </span>
      </div>

      <h3 className="text-xl sm:text-2xl font-black uppercase text-[#111111] font-mono tracking-tight leading-snug">
        {q.question}
      </h3>

      <div className="space-y-3">
        {q.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => setSelectedAnswer(i)}
            className={`w-full text-left px-5 py-4 rounded-2xl border-2 font-medium text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-between gap-3 ${
              selectedAnswer === i
                ? "border-[#B42318] bg-[#FDF2F2] text-[#111111] font-bold shadow-sm"
                : "border-[#E8DEC8] hover:border-[#111111] text-[#252525] bg-[#F8F1E6]/50"
            }`}
          >
            <span>{opt}</span>
            {selectedAnswer === i ? (
              <CheckCircle2 size={18} className="text-[#B42318] flex-shrink-0" />
            ) : (
              <Circle size={18} className="text-[#E8DEC8] flex-shrink-0" />
            )}
          </button>
        ))}
      </div>

      <div className="pt-2 flex justify-end">
        <button
          onClick={handleAnswer}
          disabled={selectedAnswer === null}
          className={`px-8 py-3.5 rounded-full font-black uppercase tracking-wider text-xs transition-all duration-300 ${
            selectedAnswer !== null
              ? "bg-[#B42318] hover:bg-[#C92A1E] text-white cursor-pointer hover:scale-105 active:scale-95 shadow-lg shadow-[#B42318]/20"
              : "bg-[#EFE7DA] text-[#777777] cursor-not-allowed"
          }`}
        >
          {currentQuestion === questions.length - 1 ? "FINISH ASSESSMENT →" : "NEXT QUESTION →"}
        </button>
      </div>
    </motion.div>
  );
}
