import React, { useState } from "react";
import ExampleMapEditor from "./ExampleMapEditor";

const DEFAULT_DATA = {
  story: { text: "", rules: [] },
  questions: []
};

export default function App() {
  const [data, setData] = useState(DEFAULT_DATA);
  const handleSave = () => window.electronAPI.saveData(JSON.stringify(data));
  return <ExampleMapEditor data={data} onChange={setData} onSave={handleSave} />;
}
