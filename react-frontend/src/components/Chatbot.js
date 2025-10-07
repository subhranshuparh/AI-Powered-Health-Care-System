// Chatbot.js
import React, { useEffect } from "react";

function Chatbot() {
  useEffect(() => {
    // Check if script already exists
    if (!document.querySelector('script[src="https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1"]')) {
      const script = document.createElement("script");
      script.src =
        "https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div>
      {/* Use "dangerouslySetInnerHTML" to insert df-messenger safely */}
      <div
        dangerouslySetInnerHTML={{
          __html: `<df-messenger
                    intent="WELCOME"
                    chat-title="Subhranshu Health Bot"
                    agent-id="e509181b-772e-4fdc-a2a2-2a96731e6ca9"
                    language-code="en">
                  </df-messenger>`,
        }}
      />
    </div>
  );
}

export default Chatbot;
