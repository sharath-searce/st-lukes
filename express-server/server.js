const express = require("express");
const axios = require("axios");
// const {Ollama} = require('ollama');

const cors = require('cors');

// const ollama = new Ollama({ host: 'http://127.0.0.1:11434' })

const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.json());

app.post("/api/proxy", async (req, res) => {

  try {
    let data = JSON.stringify({
      input_value: req.body.input_value,
      output_type: "chat",
      input_type: "chat",
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
    //   url:"http://localhost:7868/api/v1/run/5041e3ff-4e34-46ea-9b13-eb4daf67aedb?stream=false",
      url: "https://api.langflow.astra.datastax.com/lf/ffa48064-8e3a-4088-978f-8acec0733c75/api/v1/run/df90bed1-ee1b-4fea-b96c-37ae087e44c1",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Bearer AstraCS:WPIOKCNCMgYqytgSOyPdYXga:66a29d1df1b56da247570101b32ab00daf292f011c548401f7c61c0b00fed212",
      },
      data: data,
    };
    const response = await axios.request(config);
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error("Error proxying POST request:", error.message);
    const status = error.response?.status || 500;
    const data = error.response?.data || { error: "Proxy request failed" };
    res.status(status).send(data);
  }
});


// app.post('/api/ask', async (req, res) => {
//     const { prompt, model } = req.body;

//     if (!prompt || !model) {
//       return res.status(400).json({ error: 'Prompt and model are required.' });
//     }

//     try {
//       const response = await ollama.generate({ // Using the ollama library's generate function
//         model: model,
//         prompt: prompt,
//       });
//       console.log("response", response)
//       res.json({ reply: response.response });
//     } catch (error) {
//       console.error('Error calling Ollama:', error);
//       res.status(500).json({ error: 'Failed to get response from Ollama.' });
//     }
// });

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
