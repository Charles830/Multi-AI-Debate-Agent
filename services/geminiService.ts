import { GoogleGenAI, FunctionDeclaration, Type, Tool, Modality, Content, Part } from "@google/genai";
import { AgentConfig, Message, Attachment, GroundingSource } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Tool Definitions ---

const generateImageTool: FunctionDeclaration = {
  name: 'generate_image',
  description: 'Generate an image to visually illustrate an argument or concept.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: { type: Type.STRING, description: 'A detailed description of the image to generate.' }
    },
    required: ['prompt']
  }
};

// We keep video tool available for agents if they really want it, but we enforce image mostly.
const generateVideoTool: FunctionDeclaration = {
  name: 'generate_video',
  description: 'Generate a short video to demonstrate a dynamic concept or event.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: { type: Type.STRING, description: 'A description of the video content.' }
    },
    required: ['prompt']
  }
};

const debateTools: Tool[] = [
  { googleSearch: {} }, // Enable Google Search Grounding
  { functionDeclarations: [generateImageTool, generateVideoTool] }
];

// --- Helper Functions ---

const executeImageGeneration = async (prompt: string): Promise<Attachment | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part && part.inlineData) {
      return {
        type: 'image',
        url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
        title: prompt
      };
    }
    return null;
  } catch (e) {
    console.error("Image generation failed", e);
    return null;
  }
};

const executeVideoGeneration = async (prompt: string): Promise<Attachment | null> => {
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    // Polling for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (videoUri) {
      return {
        type: 'video',
        url: `${videoUri}&key=${process.env.API_KEY}`,
        title: prompt
      };
    }
    return null;
  } catch (e) {
    console.error("Video generation failed", e);
    return null;
  }
};

/**
 * Generates a response for a specific debate agent.
 */
export const generateDebateTurn = async (
  agent: AgentConfig,
  topic: string,
  history: Message[],
  currentRound: number,
  totalRounds: number
): Promise<{ text: string; attachments: Attachment[]; groundingSources: GroundingSource[] }> => {
  const model = 'gemini-2.5-flash';

  const conversationHistory = history.map(msg => {
    let content = `${msg.agentName}: ${msg.content}`;
    if (msg.attachments?.length) {
      content += ` [已生成媒体: ${msg.attachments.map(a => a.type).join(', ')}]`;
    }
    return content;
  }).join('\n\n');

  // Extract the last message to form a specific rebuttal instruction
  const lastMessage = history.length > 0 ? history[history.length - 1] : null;
  
  let rebuttalInstruction = "作为本场辩论的首位发言者，请开门见山，清晰有力地阐述你对辩题的核心立场，并为整场辩论奠定基调。";
  
  if (lastMessage) {
    rebuttalInstruction = `**核心任务**：你必须直接回应上一位发言者【${lastMessage.agentName}】的观点。
    请深度剖析其刚才所说的话（"${lastMessage.content.substring(0, 30)}..."），指出其逻辑漏洞、事实错误或局限性，并用你的事实和逻辑进行强有力的反驳。不要自说自话，要形成激烈的交锋。`;
  }

  const promptText = `
    你正在参加一场辩论。请使用中文回答。
    
    **你的身份**: ${agent.name}
    **你的设定**: ${agent.persona}
    
    **辩论议题**: "${topic}"
    **当前轮次**: 第 ${currentRound} 轮，共 ${totalRounds} 轮
    
    **对话历史**:
    ${conversationHistory.length > 0 ? conversationHistory : "(暂无观点，你是第一个发言。)"}
    
    **强制指令**:
    1. ${rebuttalInstruction}
    2. **必须**使用 Google Search 查找最新的事实、数据或新闻来支持你的论点。
    3. **必须**调用 \`generate_image\` 工具生成一张与你的论点高度相关的配图（例如图表、未来场景、比喻画面）。
    4. 论点简洁有力（150字以内）。
    5. 不要在文本开头包含你的名字。
  `;

  try {
    // 1. First Turn: Send Prompt
    const chatContents: Content[] = [
      { role: 'user', parts: [{ text: promptText }] }
    ];

    let response = await ai.models.generateContent({
      model,
      contents: chatContents,
      config: {
        tools: debateTools,
        temperature: 0.9,
      }
    });

    let text = response.text || "";
    const attachments: Attachment[] = [];
    const groundingSources: GroundingSource[] = [];

    // Collect initial grounding
    const collectGrounding = (res: any) => {
      const chunks = res.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web?.uri && chunk.web?.title) {
            groundingSources.push({
              uri: chunk.web.uri,
              title: chunk.web.title
            });
          }
        });
      }
    };
    collectGrounding(response);

    // 2. Handle Function Calls (Tools)
    // If the model called a tool, we MUST execute it and send the result back to get the text response.
    const functionCalls = response.functionCalls;
    
    if (functionCalls && functionCalls.length > 0) {
      // Append model's tool call turn to history
      chatContents.push({
        role: 'model',
        parts: response.candidates![0].content.parts
      });

      const functionResponseParts: Part[] = [];

      for (const call of functionCalls) {
        if (call.name === 'generate_image') {
          const args = call.args as any;
          const result = await executeImageGeneration(args.prompt);
          if (result) attachments.push(result);
          
          functionResponseParts.push({
            functionResponse: {
              name: call.name,
              response: { result: "Image generated successfully." }
            }
          });
        } else if (call.name === 'generate_video') {
          const args = call.args as any;
          const result = await executeVideoGeneration(args.prompt);
          if (result) attachments.push(result);

          functionResponseParts.push({
            functionResponse: {
              name: call.name,
              response: { result: "Video generated successfully." }
            }
          });
        }
      }

      // 3. Second Turn: Send Function Results back to Model to get the spoken response
      if (functionResponseParts.length > 0) {
        chatContents.push({
          role: 'user',
          parts: functionResponseParts
        });

        const secondResponse = await ai.models.generateContent({
          model,
          contents: chatContents,
          config: {
            tools: debateTools, // Keep tools enabled just in case, though unlikely to call again immediately
          }
        });

        // Combine text (if the first response had any, usually it doesn't) with the new text
        const secondText = secondResponse.text || "";
        text = text ? `${text}\n${secondText}` : secondText;
        collectGrounding(secondResponse);
      }
    }

    // Fallback if still empty
    if (!text && attachments.length > 0) {
      text = "(展示了生成的视觉内容，请参考图片)";
    } else if (!text) {
        // If absolutely no text, force a simple generation without tools
        const retryResponse = await ai.models.generateContent({
            model,
            contents: promptText + "\n\n(Previous attempt failed. Please provide just the text argument now.)",
        });
        text = retryResponse.text || "系统错误：无法生成回复。";
    }

    return { text, attachments, groundingSources };

  } catch (error) {
    console.error(`Error generating content for ${agent.name}:`, error);
    return { text: "系统错误：无法生成回复。", attachments: [], groundingSources: [] };
  }
};

/**
 * Generates the final verdict from the Judge.
 */
export const generateJudgeVerdict = async (
  judge: AgentConfig,
  topic: string,
  history: Message[]
): Promise<{ text: string }> => {
  const model = 'gemini-2.5-flash';
  
  const conversationHistory = history.map(msg => `${msg.agentName}: ${msg.content}`).join('\n\n');

  const prompt = `
    你是${judge.name}。${judge.persona}
    
    **辩论议题**: "${topic}"
    
    **辩论记录**:
    ${conversationHistory}
    
    **指令**:
    1. 分析每位参与者的表现。
    2. 判定胜者。
    3. **严禁**在输出文本中使用 Markdown 的加粗符号（如 ** 或 *）。文本必须纯净。
    4. 在最后一行，只写出获胜者的名字（例如：获胜者：Qwen）。
    5. 请使用中文。
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    
    let text = response.text || "无法达成裁决。";
    
    // Cleanup any accidental asterisks
    text = text.replace(/\*/g, '');

    return { text };
  } catch (error) {
    console.error("Error generating verdict:", error);
    throw error;
  }
};
