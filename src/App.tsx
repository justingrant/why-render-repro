import React from "react";
import "./App.css";
import TopCalendar from "./TopCalendar";

const App: React.FC = () => {
  return (
    <div className="App">
      <div style={{ height: "120px", width: "600px" }}>
        <TopCalendar selectedDate={new Date(2019, 5, 14)} />
      </div>
      <div
        className="repro-steps"
        style={{ textAlign: "left", padding: 20, fontSize: 13, width: 550 }}
      >
        <h4>Repro steps:</h4>
        <ol>
          <li>
            <code>
              git clone https://github.com/justingrant/why-render-repro.git
            </code>
          </li>
          <li>
            <code>cd why-render-repro</code>
          </li>
          <li>
            <code>npm install</code>
          </li>
          <li>
            <code>npm start</code>
          </li>
          <li>
            Open React Dev Tools, enable the "why render" setting, and start
            profiling
          </li>
          <li>Scroll the calendar up ~10 rows and down ~10 rows</li>
          <li>Stop profiling</li>
          <li>
            Select the <code>List</code> component in the render tree
          </li>
        </ol>
        <ul>
          <li>
            <b>Expected</b>: Reason shown under "Why did this render?"
          </li>
          <li>
            <b>Actual</b>: "Why did this render?" apparently shown with blank
            reason... until you scroll the "Why did this render" label and then
            you'll find the reason was hiding under the "Rendered at:" heading
            but was hidden by the <code>overflow-y: auto</code>. If you change
            it to <code>overflow-y: visible</code> then the reason shows up
            normally.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default App;
