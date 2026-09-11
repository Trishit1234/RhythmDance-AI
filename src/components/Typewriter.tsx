"use client";

import { useEffect, useRef, useState } from "react";

interface TypewriterProps {
  text?: string;
  typeSpeed?: number;
  deleteSpeed?: number;
  pauseAfterType?: number;
  pauseAfterDelete?: number;
}

export default function Typewriter({
  text = "Rhythm of India",
  typeSpeed = 130,
  deleteSpeed = 65,
  pauseAfterType = 1200,
  pauseAfterDelete = 800,
}: TypewriterProps) {
  const [displayed, setDisplayed] = useState("");
  const idxRef = useRef(0);
  const dirRef = useRef<1 | -1>(1);
  const timerRef = useRef<NodeJS.Timeout | number | null>(null);

  useEffect(() => {
    function tick() {
      if (dirRef.current === 1) {
        if (idxRef.current < text.length) {
          idxRef.current++;
          setDisplayed(text.substring(0, idxRef.current));
          timerRef.current = setTimeout(tick, typeSpeed);
        } else {
          dirRef.current = -1;
          timerRef.current = setTimeout(tick, pauseAfterType);
        }
      } else {
        if (idxRef.current > 0) {
          idxRef.current--;
          setDisplayed(text.substring(0, idxRef.current));
          timerRef.current = setTimeout(tick, deleteSpeed);
        } else {
          dirRef.current = 1;
          timerRef.current = setTimeout(tick, pauseAfterDelete);
        }
      }
    }

    tick();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text, typeSpeed, deleteSpeed, pauseAfterType, pauseAfterDelete]);

  return (
    <span className="relative inline-block">
      <span className="border-r-2 border-orange-600 animate-pulse pr-0.5">
        {displayed}
      </span>
      {/* Ghost text for layout stability */}
      <span className="invisible">{text}</span>
    </span>
  );
}
