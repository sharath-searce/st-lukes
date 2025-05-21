import MedicalDataRenderer from './tasks_list';

const medicalData = {
  "Medicines": [
    {
      "name": "Amoxicillin",
      "dosage": "500mg",
      "frequency": "twice daily",
      "duration": "7 days",
      "route": "oral"
    }
  ],
  "Lab_tests": [
    {
      "code": "CBC",
      "name": "Complete Blood Count"
    },
    {
      "code": "CMP",
      "name": "Comprehensive Metabolic Panel"
    }
  ],
  "Instructions": [
    "Monitor for any allergic reactions."
  ],
  "Follow_ups": [
    "Follow up in 2 weeks."
  ],
  "Notes": [
    "Patient also mentioned feeling fatigued"
  ],
  "Unparsed": [
    "I am batamn"
  ]
};

function App() {
  return (
    <div>
      <MedicalDataRenderer data={medicalData} />
    </div>
  );
}

export default App;